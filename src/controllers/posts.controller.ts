import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { ExtendedDataService } from '../data/extended-data.service';
import { CreatePostDto, UpdatePostDto } from '../dto/api.dto';
import { CoreDatabaseService } from '../services/core-database.service';

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(
    private readonly coreDatabase: CoreDatabaseService,
    private readonly extendedData: ExtendedDataService,
  ) {}

  @Get()
  @ApiQuery({ name: 'authorId', required: false })
  async getPosts(@Query('authorId') authorId?: string) {
    return this.coreDatabase.getPosts(authorId);
  }

  @Get(':id')
  async getPost(@Param('id') id: string) {
    const post = await this.coreDatabase.getPost(id);
    const author = await this.coreDatabase.getUser(post.authorId);
    const comments = await this.coreDatabase.getPostComments(id);
    const reactions = await this.coreDatabase.getPostReactions(id);

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
      reactions,
    };
  }

  @Post()
  async createPost(@Body() body: CreatePostDto) {
    return this.coreDatabase.createPost({
      authorId: body.authorId,
      caption: body.caption,
      media: body.media ?? [],
      tags: body.tags ?? [],
    });
  }

  @Post('create')
  async createPostFromAppContract(@Body() body: CreatePostDto) {
    return this.createPost(body);
  }

  @Patch(':id')
  async updatePost(@Param('id') id: string, @Body() body: UpdatePostDto) {
    return this.coreDatabase.updatePost(id, body);
  }

  @Delete(':id')
  async deletePost(@Param('id') id: string) {
    return this.coreDatabase.deletePost(id);
  }
}
