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
import { StoriesDatabaseService } from '../services/stories-database.service';

@ApiTags('stories')
@Controller('stories')
export class StoriesController {
  constructor(
    private readonly platformData: PlatformDataService,
    private readonly extendedData: ExtendedDataService,
    private readonly coreDatabase: CoreDatabaseService,
    private readonly storiesDatabase: StoriesDatabaseService,
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
  async getStory(@Param('id') id: string) {
    const story = await this.storiesDatabase.getStory(id);
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
  async createStory(
    @Body() body: CreateStoryDto,
    @Headers('authorization') authorization?: string,
  ) {
    const token = authorization?.replace(/^Bearer\s+/i, '');
    const authUser = await this.coreDatabase.resolveUserFromAccessToken(token);
    const userId = authUser?.id ?? body.userId;
    return this.storiesDatabase.createStory(userId, body);
  }

  @Patch(':id')
  updateStory(@Param('id') id: string, @Body() body: UpdateStoryDto) {
    return this.storiesDatabase.updateStory(id, body);
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
    const story = await this.storiesDatabase.getStory(id);
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
    return this.storiesDatabase.deleteStory(id);
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
      return this.storiesDatabase.getActiveStories(userId.trim());
    }

    if (scope?.trim().toLowerCase() !== 'buddies') {
      return this.storiesDatabase.getActiveStories();
    }

    const buddyIds = await this.coreDatabase
      .getBuddyIds(viewerId)
      .catch((): string[] => []);
    return (await this.storiesDatabase.getActiveStories()).filter(
      (story) => story.userId === viewerId || buddyIds.includes(story.userId),
    );
  }
}
