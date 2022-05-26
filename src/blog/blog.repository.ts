import Redis from 'ioredis';
import Redlock from 'redlock';
import { nanoid } from 'nanoid';
import { InjectModel } from '@nestjs/sequelize';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Job, Queue } from 'bull';
import { UniqueConstraintError } from 'sequelize';
import { BlogModel } from './blog.model';
import { CreateBlogDto } from './dto/create-blog.dto';
import { InjectQueue, Process, Processor } from '@nestjs/bull';

const counterKey = (id: string) => 'counter:' + id;
const blogCacheKey = (id: string) => 'blog:' + id;
const blogLockKey = (id: string) => 'lock:blog:' + id;
const blogExpire = 1000 * 60 * 60 * 4; // 4 hours
// const jobCron = '* * * * *'; // every minute
// Use cron for production, interval for testing & development
const jobInterval = 1000 * 5; // 1 minute

@Processor('counter')
export class BlogRepository {
  private readonly redlock: Redlock;

  constructor(
    @InjectModel(BlogModel) private readonly blogModel: typeof BlogModel,
    @InjectRedis() private readonly redis: Redis,
    @InjectQueue('counter') private readonly counterQueue: Queue
  ) {
    this.redlock = new Redlock([redis]);
    // This is for development only, I dont flush redis normally :)
    this.redis.flushall().then(() => {
      this.counterQueue
        .add(
          'timer',
          {},
          {
            repeat: {
              every: jobInterval,
              limit: 1000
            },
            removeOnComplete: true
          }
        )
        .catch(console.error);
    });
  }

  async saveCache(blog: BlogModel) {
    const lock = await this.redlock.acquire([blogLockKey(blog.id)], 300);
    const exists = await this.redis.exists(blogCacheKey(blog.id));
    // Some other process already created cache on a rare occasion
    if (!exists) {
      await this.redis.hmset(blogCacheKey(blog.id), blog);
      await this.redis.expire(blogCacheKey(blog.id), blogExpire);
    }
    await lock.release();
  }

  async getBlog(id: string) {
    const cacheBlog = await this.redis.hgetall(blogCacheKey(id));

    if (cacheBlog) {
      console.log(`[CACHE-HIT] [${id}]`);
      const viewCount = await this.incReadCount(id);
      // @ts-ignore
      cacheBlog.viewCount = +cacheBlog.viewCount + viewCount;
      return cacheBlog;
    }

    const dbBlog = await this.blogModel.findOne({ where: { id }, plain: true, raw: true });
    if (!dbBlog) {
      return null;
    }

    console.log(`[CACHE-MISS] [${id}]`);

    await this.saveCache(dbBlog);
    const viewCount = await this.incReadCount(id);
    await this.redis.sadd('countedBlogs', id);
    dbBlog.viewCount += viewCount;

    return dbBlog;
  }

  async updateBlog(id: string, update) {
    const [, [blog]] = await this.blogModel.update(update, {
      where: { id },
      returning: true,
      // @ts-ignore
      raw: true
    });
    if (!blog) {
      return null;
    }
    await this.redis.del(blogCacheKey(id));

    return blog;
  }

  deleteBlog(id: string) {
    return Promise.all([
      this.blogModel.destroy({ where: { id } }),
      this.redis.del(blogCacheKey(id)),
      this.redis.del(counterKey(id))
      // this.removeCounterJob(id) cannot remove, because jobId is unknown
      // However it will remove itself in a few retries
    ]);
  }

  async createBlog(blog: CreateBlogDto) {
    const id = nanoid(12); // url-friendly
    const newBlog = { id, ...blog };

    try {
      await this.blogModel.create(newBlog, { raw: true });
    } catch (err) {
      if (!(err instanceof UniqueConstraintError)) {
        throw err;
      }
      return this.createBlog(blog);
    }

    return newBlog;
  }

  async incReadCount(id: string): Promise<number> {
    // Hours since epoch
    const dateKey = Math.floor(Date.now() / jobInterval).toString();
    await this.redis.hincrby(counterKey(id), dateKey, 1);
    const allCounts = await this.redis.hgetall(counterKey(id));

    return Object.values(allCounts).reduce((acc, curr) => +curr + +acc, 0);
  }

  @Process({ name: 'timer', concurrency: 5 })
  async processQueue() {
    console.log(`[JOB] Scheduling count jobs...`);
    const countedBlogs = await this.redis.smembers('countedBlogs');
    await this.counterQueue.addBulk(
      countedBlogs.map(blogId => {
        return {
          data: { blogId },
          opts: {
            removeOnComplete: true,
            jobId: blogId,
            delay: 0
          }
        };
      })
    );
    console.log(`[JOB] Scheduling complete, ${countedBlogs.length} jobs scheduled`);
  }

  @Process()
  async saveReadCount(job: Job) {
    console.log(`[JOB] [${job.id}] Running with data: ${JSON.stringify(job.data)}`);

    const { blogId } = job.data;
    const lock = await this.redlock.acquire([job.id.toString()], 300);
    const savedCounts = await this.redis.hgetall(counterKey(blogId));
    if (!savedCounts) {
      console.log(`[JOB] [${job.id}] No saved count found, invalidating cache and cancelling job`);
      await Promise.all([this.redis.del(blogCacheKey(blogId)), this.redis.srem('countedBlogs', blogId)]);
      await lock.release();
      return;
    }

    const dates = Object.keys(savedCounts);
    dates.sort((a, b) => +a - +b);

    const lastDate = dates[dates.length - 1];
    const currDate = Math.floor(Date.now() / jobInterval).toString();
    // Do not edit lastDate because it is still getting updated
    if (lastDate === currDate) {
      dates.pop();
    }

    const viewCount = dates.reduce((acc, curr) => +savedCounts[curr] || 0, 0);
    await this.blogModel.increment('viewCount', { where: { id: blogId }, by: viewCount });
    await Promise.all([this.redis.hdel('counter:' + blogId, ...dates), this.redis.del(blogCacheKey(blogId))]);

    // If more than two intervals has passed and no viewCount was added delete job
    if ((+currDate - +lastDate) / jobInterval > 2) {
      await Promise.all([this.redis.del(blogCacheKey(blogId)), this.redis.srem('countedBlogs', blogId)]);
    }

    await lock.release();
    console.log(`[JOB] [${job.id}] Job complete, viewCount increased by : ${viewCount}`);
  }
}
