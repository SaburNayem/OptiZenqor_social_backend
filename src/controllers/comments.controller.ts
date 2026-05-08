import { Body, Controller, Delete, Get, Headers, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateCommentDto, ReactToCommentDto } from '../dto/api.dto';
import { CoreDatabaseService } from '../services/core-database.service';
import { successResponse } from '../utils/api-response.util';

@ApiTags('comments')
@Controller('posts/:id/comments')
export class CommentsController {
  constructor(private readonly coreDatabase: CoreDatabaseService) {}

  @Get()
  async getPostComments(@Param('id') id: string) {
    const comments = await this.coreDatabase.getPostComments(id);
    return successResponse('Comments fetched successfully.', { items: comments, comments });
  }

  @Post()
  async createPostComment(
    @Param('id') id: string,
    @Body() body: CreateCommentDto,
    @Headers('authorization') authorization?: string,
  ) {
    const actor = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.authorId,
    );
    const comment = await this.coreDatabase.createPostComment(id, actor.name, body.message, {
      authorId: actor.id,
      replyTo: body.replyTo,
      mentions: body.mentions,
    });
    return successResponse('Comment created successfully.', comment);
  }

  @Get(':commentId/replies')
  async getReplies(@Param('id') id: string, @Param('commentId') commentId: string) {
    const replies = await this.coreDatabase.getPostCommentReplies(id, commentId);
    return successResponse('Replies fetched successfully.', { items: replies, replies });
  }

  @Post(':commentId/replies')
  async createReply(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @Body() body: CreateCommentDto,
    @Headers('authorization') authorization?: string,
  ) {
    const actor = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.authorId,
    );
    const comment = await this.coreDatabase.createPostComment(id, actor.name, body.message, {
      authorId: actor.id,
      replyTo: commentId,
      mentions: body.mentions,
    });
    return successResponse('Reply created successfully.', comment);
  }

  @Patch(':commentId/react')
  async reactToComment(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @Body() body: ReactToCommentDto,
    @Headers('authorization') authorization?: string,
  ) {
    const actor = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.userId,
    );
    const comment = await this.coreDatabase.reactToComment(
      id,
      commentId,
      actor.id,
      body.reaction,
    );
    return successResponse('Comment reaction updated successfully.', comment);
  }

  @Delete(':commentId')
  async deleteComment(@Param('id') id: string, @Param('commentId') commentId: string) {
    const result = await this.coreDatabase.deletePostComment(id, commentId);
    return successResponse('Comment deleted successfully.', result);
  }
}
