import { Injectable, NotFoundException } from '@nestjs/common';
import { BlogRepository } from './blog.repository';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { CreateBlogDto } from './dto/create-blog.dto';

@Injectable()
export class BlogService {
  constructor(private readonly blogRepository: BlogRepository) {}

  createBlog(dto: CreateBlogDto) {
    return this.blogRepository.createBlog(dto);
  }

  async getBlog({ id }: { id: string }) {
    const blog = await this.blogRepository.getBlog(id);
    if (!blog) {
      throw new NotFoundException('Blog not found, id: ' + id);
    }

    return blog;
  }

  async updateBlog({ id, update }: { id: string; update: UpdateBlogDto }) {
    const updatedBlog = await this.blogRepository.updateBlog(id, update);
    if (!updatedBlog) {
      throw new NotFoundException('Blog not found, id: ' + id);
    }

    return updatedBlog;
  }

  async deleteBlog({ id }: { id: string }) {
    await this.blogRepository.deleteBlog(id);
  }
}
