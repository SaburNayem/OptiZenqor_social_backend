import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query, ForbiddenException } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreatePostDto, UpdatePostDto } from '../dto/api.dto';
import { CoreDatabaseService } from '../services/core-database.service';

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(
    private readonly coreDatabase: CoreDatabaseService,
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

    const payload = {
      ...post,
      author,
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
  async createPost(
    @Body() body: CreatePostDto,
    @Headers('authorization') authorization?: string,
  ) {
    const actor = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.authorId,
    );
    const created = await this.coreDatabase.createPost({
      authorId: actor.id,
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
  async createPostFromAppContract(
    @Body() body: CreatePostDto,
    @Headers('authorization') authorization?: string,
  ) {
    return this.createPost(body, authorization);
  }

  @Patch(':id')
  async updatePost(
    @Param('id') id: string,
    @Body() body: UpdatePostDto,
    @Headers('authorization') authorization?: string,
  ) {
    const actor = await this.coreDatabase.requireUserFromAuthorization(authorization);
    const existing = await this.coreDatabase.getPost(id);
    if (existing.authorId !== actor.id) {
      throw new ForbiddenException('You can only update your own post.');
    }
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
  async deletePost(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const actor = await this.coreDatabase.requireUserFromAuthorization(authorization);
    const existing = await this.coreDatabase.getPost(id);
    if (existing.authorId !== actor.id) {
      throw new ForbiddenException('You can only delete your own post.');
    }
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
