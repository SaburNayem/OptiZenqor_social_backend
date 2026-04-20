import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { ExtendedDataService } from '../data/extended-data.service';
import { PlatformDataService } from '../data/platform-data.service';
import {
  CreateReelDto,
  ReelCommentDto,
  ReelReactionDto,
  UpdateReelDto,
} from '../dto/api.dto';

@ApiTags('reels')
@Controller('reels')
export class ReelsController {
  constructor(
    private readonly platformData: PlatformDataService,
    private readonly extendedData: ExtendedDataService,
  ) {}

  @Get()
  @ApiQuery({ name: 'authorId', required: false })
  getReels(@Query('authorId') authorId?: string) {
    return this.platformData.getReels(authorId);
  }

  @Get(':id')
  getReel(@Param('id') id: string) {
    const reel = this.platformData.getReel(id);
    return {
      ...reel,
      comments: this.extendedData.getReelComments(id),
      reactions: this.extendedData.getReelReactions(id),
    };
  }

  @Post()
  createReel(@Body() body: CreateReelDto) {
    return this.platformData.createReel({
      authorId: body.authorId,
      caption: body.caption,
      audioName: body.audioName,
      thumbnail: body.thumbnail,
      videoUrl: body.videoUrl,
      textOverlays: body.textOverlays ?? [],
      subtitleEnabled: body.subtitleEnabled ?? false,
      trimInfo: body.trimInfo,
      remixEnabled: body.remixEnabled ?? false,
      isDraft: body.isDraft ?? false,
    });
  }

  @Patch(':id')
  updateReel(@Param('id') id: string, @Body() body: UpdateReelDto) {
    return this.platformData.updateReel(id, body);
  }

  @Get(':id/comments')
  getReelComments(@Param('id') id: string) {
    return this.extendedData.getReelComments(id);
  }

  @Post(':id/comments')
  createReelComment(@Param('id') id: string, @Body() body: ReelCommentDto) {
    return this.extendedData.createReelComment(id, body.userId, body.comment);
  }

  @Get(':id/reactions')
  getReelReactions(@Param('id') id: string) {
    return this.extendedData.getReelReactions(id);
  }

  @Post(':id/reactions')
  reactToReel(@Param('id') id: string, @Body() body: ReelReactionDto) {
    return this.extendedData.reactToReel(id, body.userId, body.reaction);
  }

  @Delete(':id')
  deleteReel(@Param('id') id: string) {
    return this.platformData.deleteReel(id);
  }
}
