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
    return this.coreDatabase.getPostComments(id);
  }

  @Post()
  async createPostComment(@Param('id') id: string, @Body() body: CreateCommentDto) {
    return this.coreDatabase.createPostComment(id, body.author, body.message, {
      authorId: body.authorId,
      replyTo: body.replyTo,
      mentions: body.mentions,
    });
  }

  @Get(':commentId/replies')
  async getReplies(@Param('id') id: string, @Param('commentId') commentId: string) {
    return this.coreDatabase.getPostCommentReplies(id, commentId);
  }

  @Post(':commentId/replies')
  async createReply(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @Body() body: CreateCommentDto,
  ) {
    return this.coreDatabase.createPostComment(id, body.author, body.message, {
      authorId: body.authorId,
      replyTo: commentId,
      mentions: body.mentions,
    });
  }

  @Patch(':commentId/react')
  async reactToComment(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @Body() body: ReactToCommentDto,
  ) {
    return this.coreDatabase.reactToComment(id, commentId, body.userId, body.reaction);
  }

  @Delete(':commentId')
  async deleteComment(@Param('id') id: string, @Param('commentId') commentId: string) {
    return this.coreDatabase.deletePostComment(id, commentId);
  }
}
