import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ExtendedDataService } from '../data/extended-data.service';
import { CreateCommentDto, ReactToCommentDto } from '../dto/api.dto';

@ApiTags('comments')
@Controller('posts/:id/comments')
export class CommentsController {
  constructor(private readonly extendedData: ExtendedDataService) {}

  @Get()
  getPostComments(@Param('id') id: string) {
    return this.extendedData.getPostComments(id);
  }

  @Post()
  createPostComment(@Param('id') id: string, @Body() body: CreateCommentDto) {
    return this.extendedData.createPostComment(id, body.author, body.message);
  }

  @Patch(':commentId/react')
  reactToComment(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @Body() body: ReactToCommentDto,
  ) {
    return this.extendedData.reactToComment(id, commentId, body.reaction);
  }

  @Delete(':commentId')
  deleteComment(@Param('id') id: string, @Param('commentId') commentId: string) {
    return this.extendedData.deletePostComment(id, commentId);
  }
}
