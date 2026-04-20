import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { ExtendedDataService } from '../data/extended-data.service';
import { PlatformDataService } from '../data/platform-data.service';
import {
  CreateStoryDto,
  StoryCommentDto,
  StoryReactionDto,
  UpdateStoryDto,
} from '../dto/api.dto';

@ApiTags('stories')
@Controller('stories')
export class StoriesController {
  constructor(
    private readonly platformData: PlatformDataService,
    private readonly extendedData: ExtendedDataService,
  ) {}

  @Get()
  @ApiQuery({ name: 'userId', required: false })
  getStories(@Query('userId') userId?: string) {
    return this.platformData.getStories(userId);
  }

  @Get(':id')
  getStory(@Param('id') id: string) {
    const story = this.platformData.getStory(id);
    return {
      ...story,
      comments: this.extendedData.getStoryComments(id),
      reactions: this.extendedData.getStoryReactions(id),
    };
  }

  @Post()
  createStory(@Body() body: CreateStoryDto) {
    return this.platformData.createStory({
      userId: body.userId,
      text: body.text,
      media: body.media ?? '',
      music: body.music,
      isLocalFile: body.isLocalFile ?? false,
      backgroundColors: body.backgroundColors ?? [0xff1e40af, 0xff2bb0a1],
      textColorValue: body.textColorValue ?? 0xffffffff,
    });
  }

  @Patch(':id')
  updateStory(@Param('id') id: string, @Body() body: UpdateStoryDto) {
    return this.platformData.updateStory(id, body);
  }

  @Get(':id/comments')
  getStoryComments(@Param('id') id: string) {
    return this.extendedData.getStoryComments(id);
  }

  @Post(':id/comments')
  createStoryComment(@Param('id') id: string, @Body() body: StoryCommentDto) {
    return this.extendedData.createStoryComment(id, body.userId, body.comment);
  }

  @Get(':id/reactions')
  getStoryReactions(@Param('id') id: string) {
    return this.extendedData.getStoryReactions(id);
  }

  @Post(':id/reactions')
  reactToStory(@Param('id') id: string, @Body() body: StoryReactionDto) {
    return this.extendedData.reactToStory(id, body.userId, body.reaction);
  }

  @Delete(':id')
  deleteStory(@Param('id') id: string) {
    return this.platformData.deleteStory(id);
  }
}
