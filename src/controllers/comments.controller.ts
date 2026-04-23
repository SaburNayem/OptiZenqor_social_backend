import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateCommentDto, ReactToCommentDto } from '../dto/api.dto';
import { CoreDatabaseService } from '../services/core-database.service';

@ApiTags('comments')
@Controller('posts/:id/comments')
export class CommentsController {
  constructor(private readonly coreDatabase: CoreDatabaseService) {}

  @Get()
  async getPostComments(@Param('id') id: string) {
    const comments = await this.coreDatabase.getPostComments(id);
    return this.wrapListResponse('Comments fetched successfully.', comments);
  }

  @Post()
  async createPostComment(@Param('id') id: string, @Body() body: CreateCommentDto) {
    const comment = await this.coreDatabase.createPostComment(id, body.author, body.message, {
      authorId: body.authorId,
      replyTo: body.replyTo,
      mentions: body.mentions,
    });
    return {
      success: true,
      ...comment,
      data: comment,
    };
  }

  @Get(':commentId/replies')
  async getReplies(@Param('id') id: string, @Param('commentId') commentId: string) {
    const replies = await this.coreDatabase.getPostCommentReplies(id, commentId);
    return this.wrapListResponse('Replies fetched successfully.', replies);
  }

  @Post(':commentId/replies')
  async createReply(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @Body() body: CreateCommentDto,
  ) {
    const comment = await this.coreDatabase.createPostComment(id, body.author, body.message, {
      authorId: body.authorId,
      replyTo: commentId,
      mentions: body.mentions,
    });
    return {
      success: true,
      ...comment,
      data: comment,
    };
  }

  @Patch(':commentId/react')
  async reactToComment(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @Body() body: ReactToCommentDto,
  ) {
    const comment = await this.coreDatabase.reactToComment(
      id,
      commentId,
      body.userId,
      body.reaction,
    );
    return {
      success: true,
      ...comment,
      data: comment,
    };
  }

  @Delete(':commentId')
  async deleteComment(@Param('id') id: string, @Param('commentId') commentId: string) {
    const result = await this.coreDatabase.deletePostComment(id, commentId);
    return {
      ...result,
      data: result.removed,
    };
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
