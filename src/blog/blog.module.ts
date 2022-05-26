import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { BlogModel } from './blog.model';
import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';
import { BlogRepository } from './blog.repository';
import { BullModule } from '@nestjs/bull';
import { FileModule } from '../file/file.module';

@Module({
  imports: [SequelizeModule.forFeature([BlogModel]), BullModule.registerQueue({ name: 'counter' }), FileModule],
  providers: [BlogService, BlogRepository],
  controllers: [BlogController]
})
export class BlogModule {}
