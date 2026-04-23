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
  @ApiQuery({ name: 'userId', required: false })
  async getPosts(
    @Query('authorId') authorId?: string,
    @Query('userId') userId?: string,
  ) {
    const posts = await Promise.all(
      (await this.coreDatabase.getPosts(authorId ?? userId)).map(async (post) => ({
        ...post,
        author: await this.coreDatabase.getUser(post.authorId),
      })),
    );
    return this.wrapListResponse('Posts fetched successfully.', posts);
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

    const payload = {
      ...post,
      author,
      detail,
      comments,
      reactions,
    };

    return {
      success: true,
      message: 'Post fetched successfully.',
      ...payload,
      post: payload,
      data: payload,
    };
  }

  @Post()
  async createPost(@Body() body: CreatePostDto) {
    const created = await this.coreDatabase.createPost({
      authorId: body.authorId,
      caption: body.caption,
      media: body.media ?? [],
      tags: body.tags ?? [],
    });
    const post = {
      ...created,
      author: await this.coreDatabase.getUser(created.authorId),
    };
    return {
      success: true,
      message: 'Post created successfully.',
      ...post,
      post,
      data: post,
    };
  }

  @Post('create')
  async createPostFromAppContract(@Body() body: CreatePostDto) {
    return this.createPost(body);
  }

  @Patch(':id')
  async updatePost(@Param('id') id: string, @Body() body: UpdatePostDto) {
    const updated = await this.coreDatabase.updatePost(id, body);
    const post = {
      ...updated,
      author: await this.coreDatabase.getUser(updated.authorId),
    };
    return {
      success: true,
      message: 'Post updated successfully.',
      ...post,
      post,
      data: post,
    };
  }

  @Delete(':id')
  async deletePost(@Param('id') id: string) {
    return this.coreDatabase.deletePost(id);
  }

  private wrapListResponse(message: string, items: unknown[]) {
    return {
      success: true,
      message,
      data: items,
      items,
      results: items,
      count: items.length,
    };
  }
}
