import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { ExtendedDataService } from '../data/extended-data.service';
import { PlatformDataService } from '../data/platform-data.service';
import {
  CreateStoryDto,
  StoryCommentDto,
  StoryReplyDto,
  StoryReactionDto,
  StoryViewDto,
  UpdateStoryDto,
} from '../dto/api.dto';
import { CoreDatabaseService } from '../services/core-database.service';

@ApiTags('stories')
@Controller('stories')
export class StoriesController {
  constructor(
    private readonly platformData: PlatformDataService,
    private readonly extendedData: ExtendedDataService,
    private readonly coreDatabase: CoreDatabaseService,
  ) {}

  @Get()
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'scope', required: false })
  async getStories(
    @Query('userId') userId?: string,
    @Query('scope') scope?: string,
    @Headers('authorization') authorization?: string,
  ) {
    const viewerId = await this.resolveViewerId(userId, authorization);
    const stories = await this.selectStories(userId, scope, viewerId);
    return this.wrapListResponse('Stories fetched successfully.', stories);
  }

  @Get('archive')
  getArchivedStories() {
    const stories = this.extendedData
      .getArchivedStoryIds()
      .map((storyId) => this.platformData.getStory(storyId));
    return this.wrapListResponse('Archived stories fetched successfully.', stories);
  }

  @Get(':id/viewers')
  getStoryViewers(@Param('id') id: string) {
    return this.wrapListResponse(
      'Story viewers fetched successfully.',
      this.extendedData.getStoryViewers(id),
    );
  }

  @Get(':id')
  getStory(@Param('id') id: string) {
    const story = this.platformData.getStory(id);
    const payload = {
      ...story,
      comments: this.extendedData.getStoryComments(id),
      reactions: this.extendedData.getStoryReactions(id),
      viewers: this.extendedData.getStoryViewers(id),
    };
    return {
      success: true,
      message: 'Story fetched successfully.',
      ...payload,
      story: payload,
      data: payload,
    };
  }

  @Post()
  createStory(@Body() body: CreateStoryDto) {
    return this.platformData.createStory({
      userId: body.userId,
      text: body.text,
      media: body.media ?? '',
      mediaItems: body.mediaItems ?? [],
      music: body.music,
      isLocalFile: body.isLocalFile ?? false,
      backgroundColors: body.backgroundColors ?? [0xff1e40af, 0xff2bb0a1],
      textColorValue: body.textColorValue ?? 0xffffffff,
      sticker: body.sticker,
      effectName: body.effectName,
      mentionUsername: body.mentionUsername,
      mentionUsernames: body.mentionUsernames,
      linkLabel: body.linkLabel,
      linkUrl: body.linkUrl,
      privacy: body.privacy ?? 'public',
      location: body.location,
      collageLayout: body.collageLayout,
      textOffsetDx: body.textOffsetDx ?? 0,
      textOffsetDy: body.textOffsetDy ?? 0,
      textScale: body.textScale ?? 1,
      mediaTransforms: body.mediaTransforms,
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

  @Post(':id/view')
  recordStoryView(@Param('id') id: string, @Body() body: StoryViewDto) {
    return this.extendedData.recordStoryView(id, body.userId);
  }

  @Post(':id/reply')
  async replyToStory(@Param('id') id: string, @Body() body: StoryReplyDto) {
    const story = this.platformData.getStory(id);
    const recipientUserId = body.recipientUserId?.trim() || story.userId;
    const thread = await this.coreDatabase.ensureDirectThread(body.userId, recipientUserId);
    const text = body.message?.trim() || body.text?.trim() || '';
    const message = await this.coreDatabase.createMessage(thread.id, body.userId, text, {
      attachments: body.attachments,
      kind: body.kind,
      mediaPath: body.mediaPath,
    });

    return {
      success: true,
      message: 'Story reply sent successfully.',
      data: {
        storyId: id,
        threadId: thread.id,
        message,
      },
      storyId: id,
      threadId: thread.id,
      reply: message,
    };
  }

  @Delete(':id')
  deleteStory(@Param('id') id: string) {
    return this.platformData.deleteStory(id);
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

  private async resolveViewerId(userId?: string, authorization?: string) {
    if (userId?.trim()) {
      return userId.trim();
    }
    const token = authorization?.replace(/^Bearer\s+/i, '');
    const user = await this.coreDatabase.resolveUserFromAccessToken(token);
    return user?.id ?? 'u1';
  }

  private async selectStories(
    userId: string | undefined,
    scope: string | undefined,
    viewerId: string,
  ) {
    if (userId?.trim()) {
      return this.platformData.getStories(userId.trim());
    }

    if (scope?.trim().toLowerCase() !== 'buddies') {
      return this.platformData.getStories();
    }

    const buddyIds = await this.coreDatabase
      .getBuddyIds(viewerId)
      .catch((): string[] => []);
    return this.platformData
      .getStories()
      .filter((story) => story.userId === viewerId || buddyIds.includes(story.userId));
  }
}
