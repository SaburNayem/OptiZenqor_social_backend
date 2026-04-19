import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ExtendedDataService } from '../data/extended-data.service';

@ApiTags('post-detail')
@Controller('posts')
export class PostDetailController {
  constructor(private readonly extendedData: ExtendedDataService) {}

  @Get(':id/detail')
  getPostDetail(@Param('id') id: string) {
    return this.extendedData.getPostDetail(id);
  }

  @Get(':id/comments')
  getPostComments(@Param('id') id: string) {
    return this.extendedData.getPostComments(id);
  }

  @Post(':id/comments')
  createPostComment(@Param('id') id: string, @Body() body: { author: string; message: string }) {
    return this.extendedData.createPostComment(id, body.author, body.message);
  }

  @Patch(':id/detail')
  updatePostDetail(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.extendedData.updatePostDetail(id, body);
  }

  @Delete(':id/detail')
  removePostDetail(@Param('id') id: string) {
    return this.extendedData.removePostDetail(id);
  }
}
