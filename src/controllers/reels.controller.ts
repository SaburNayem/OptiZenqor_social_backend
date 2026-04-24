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
  @ApiQuery({ name: 'userId', required: false })
  getReels(@Query('authorId') authorId?: string, @Query('userId') userId?: string) {
    const reels = this.platformData.getReels(authorId ?? userId);
    return this.wrapListResponse('Reels fetched successfully.', reels);
  }

  @Get(':id')
  getReel(@Param('id') id: string) {
    const reel = this.platformData.getReel(id);
    const payload = {
      ...reel,
      comments: this.extendedData.getReelComments(id),
      reactions: this.extendedData.getReelReactions(id),
    };
    return {
      success: true,
      message: 'Reel fetched successfully.',
      ...payload,
      reel: payload,
      data: payload,
    };
  }

  @Post()
  async createReel(@Body() body: CreateReelDto) {
    const reel = await this.platformData.createReel({
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
    return {
      success: true,
      message: 'Reel created successfully.',
      reel,
      data: reel,
    };
  }

  @Patch(':id')
  async updateReel(@Param('id') id: string, @Body() body: UpdateReelDto) {
    const reel = await this.platformData.updateReel(id, body);
    return {
      success: true,
      message: 'Reel updated successfully.',
      reel,
      data: reel,
    };
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
