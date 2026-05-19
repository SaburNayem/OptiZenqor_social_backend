import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query, ForbiddenException } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreatePostDto, UpdatePostDto } from '../dto/api.dto';
import { CoreDatabaseService } from '../services/core-database.service';
import { listResponse, successResponse } from '../utils/api-response.util';

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(
    private readonly coreDatabase: CoreDatabaseService,
  ) {}

  @Get()
  @ApiQuery({ name: 'authorId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'viewerId', required: false })
  async getPosts(
    @Query('authorId') authorId?: string,
    @Query('userId') userId?: string,
    @Query('viewerId') viewerId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    const resolvedViewerId = await this.resolveViewerId(viewerId, authorization);
    const posts = await Promise.all(
      (await this.coreDatabase.getPosts(authorId ?? userId, resolvedViewerId)).map(async (post) => ({
        ...post,
        author: await this.coreDatabase.getUser(post.authorId),
      })),
    );
    return listResponse('Posts fetched successfully.', posts);
  }

  @Get(':id')
  @ApiQuery({ name: 'viewerId', required: false })
  async getPost(
    @Param('id') id: string,
    @Query('viewerId') viewerId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    const post = await this.coreDatabase.getPost(
      id,
      await this.resolveViewerId(viewerId, authorization),
    );
    const author = await this.coreDatabase.getUser(post.authorId);
    const comments = await this.coreDatabase.getPostComments(id);
    const reactions = await this.coreDatabase.getPostReactions(id);

    const payload = {
      ...post,
      author,
      comments,
      reactions,
    };

    return successResponse('Post fetched successfully.', payload);
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
    this.coreDatabase.assertUserNotRestrictedFor(actor, 'posts');
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
    return successResponse('Post created successfully.', post);
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
    this.coreDatabase.assertUserNotRestrictedFor(actor, 'posts');
    const existing = await this.coreDatabase.getPost(id);
    if (existing.authorId !== actor.id) {
      throw new ForbiddenException('You can only update your own post.');
    }
    const updated = await this.coreDatabase.updatePost(id, body);
    const post = {
      ...updated,
      author: await this.coreDatabase.getUser(updated.authorId),
    };
    return successResponse('Post updated successfully.', post);
  }

  @Delete(':id')
  async deletePost(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const actor = await this.coreDatabase.requireUserFromAuthorization(authorization);
    this.coreDatabase.assertUserNotRestrictedFor(actor, 'posts');
    const existing = await this.coreDatabase.getPost(id);
    if (existing.authorId !== actor.id) {
      throw new ForbiddenException('You can only delete your own post.');
    }
    return successResponse('Post deleted successfully.', await this.coreDatabase.deletePost(id));
  }

  private async resolveViewerId(viewerId?: string, authorization?: string) {
    if (viewerId?.trim()) {
      return viewerId.trim();
    }
    const user = await this.coreDatabase
      .requireUserFromAuthorization(authorization)
      .catch(() => null);
    return user?.id ?? null;
  }
}
