import { Body, Controller, Delete, Get, Param, Patch, Post, UseInterceptors } from '@nestjs/common';
import { BlogService } from './blog.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { TransformInterceptor } from './transform.interceptor';

@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get('/:id')
  @UseInterceptors(TransformInterceptor)
  getBlog(@Param('id') id: string) {
    return this.blogService.getBlog({ id });
  }

  @Post()
  @UseInterceptors(TransformInterceptor)
  postBlog(@Body() dto: CreateBlogDto) {
    return this.blogService.createBlog(dto);
  }

  @Patch('/:id')
  @UseInterceptors(TransformInterceptor)
  updateBlog(@Param('id') id, @Body() dto: UpdateBlogDto) {
    return this.blogService.updateBlog({ id, update: dto });
  }

  @Delete('/:id')
  deleteBlog(@Param('id') id) {
    return this.blogService.deleteBlog({ id });
  }
}
