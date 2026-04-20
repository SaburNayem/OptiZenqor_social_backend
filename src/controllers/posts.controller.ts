import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { ExtendedDataService } from '../data/extended-data.service';
import { PlatformDataService } from '../data/platform-data.service';
import { CreatePostDto, UpdatePostDto } from '../dto/api.dto';

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(
    private readonly platformData: PlatformDataService,
    private readonly extendedData: ExtendedDataService,
  ) {}

  @Get()
  @ApiQuery({ name: 'authorId', required: false })
  getPosts(@Query('authorId') authorId?: string) {
    return this.platformData.getPosts(authorId);
  }

  @Get(':id')
  getPost(@Param('id') id: string) {
    const post = this.platformData.getPost(id);
    const author = this.platformData.getUser(post.authorId);
    const comments = this.extendedData.getPostComments(id);

    let detail: Record<string, unknown> | null = null;
    try {
      detail = this.extendedData.getPostDetail(id);
    } catch {
      detail = null;
    }

    return {
      ...post,
      author,
      detail,
      comments,
    };
  }

  @Post()
  createPost(@Body() body: CreatePostDto) {
    return this.platformData.createPost({
      authorId: body.authorId,
      caption: body.caption,
      media: body.media ?? [],
      tags: body.tags ?? [],
    });
  }

  @Post('create')
  createPostFromAppContract(@Body() body: CreatePostDto) {
    return this.createPost(body);
  }

  @Patch(':id')
  updatePost(@Param('id') id: string, @Body() body: UpdatePostDto) {
    return this.platformData.updatePost(id, body);
  }

  @Delete(':id')
  deletePost(@Param('id') id: string) {
    return this.platformData.deletePost(id);
  }
}
