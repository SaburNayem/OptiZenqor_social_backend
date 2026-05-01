import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  CreateStoryDto,
  StoryCommentDto,
  StoryReplyDto,
  StoryReactionDto,
  StoryViewDto,
  UpdateStoryDto,
} from '../dto/api.dto';
import { CoreDatabaseService } from '../services/core-database.service';
import { SocialStateDatabaseService } from '../services/social-state-database.service';
import { StoriesDatabaseService } from '../services/stories-database.service';

@ApiTags('stories')
@Controller('stories')
export class StoriesController {
  constructor(
    private readonly coreDatabase: CoreDatabaseService,
    private readonly storiesDatabase: StoriesDatabaseService,
    private readonly socialStateDatabase: SocialStateDatabaseService,
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
  async getArchivedStories(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    const payload = await this.socialStateDatabase.listArchivedEntities(
      user.id,
      'story',
      {},
    );
    return {
      success: true,
      message: 'Archived stories fetched successfully.',
      ...payload,
    };
  }

  @Get(':id/viewers')
  getStoryViewers(@Param('id') id: string) {
    return this.wrapListResponse(
      'Story viewers fetched successfully.',
      this.storiesDatabase.getStoryViewers(id) as unknown as unknown[],
    );
  }

  @Get(':id')
  async getStory(@Param('id') id: string) {
    const story = await this.storiesDatabase.getStory(id);
    const payload = {
      ...story,
      comments: await this.storiesDatabase.getStoryComments(id),
      reactions: await this.storiesDatabase.getStoryReactions(id),
      viewers: await this.storiesDatabase.getStoryViewers(id),
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
    const actor = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.userId,
    );
    return this.storiesDatabase.createStory(actor.id, body);
  }

  @Patch(':id')
  updateStory(@Param('id') id: string, @Body() body: UpdateStoryDto) {
    return this.storiesDatabase.updateStory(id, body);
  }

  @Get(':id/comments')
  getStoryComments(@Param('id') id: string) {
    return this.storiesDatabase.getStoryComments(id);
  }

  @Post(':id/comments')
  async createStoryComment(
    @Param('id') id: string,
    @Body() body: StoryCommentDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.userId,
    );
    return this.storiesDatabase.createStoryComment(id, user.id, body.comment);
  }

  @Get(':id/reactions')
  getStoryReactions(@Param('id') id: string) {
    return this.storiesDatabase.getStoryReactions(id);
  }

  @Post(':id/reactions')
  async reactToStory(
    @Param('id') id: string,
    @Body() body: StoryReactionDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.userId,
    );
    return this.storiesDatabase.reactToStory(id, user.id, body.reaction);
  }

  @Post(':id/view')
  async recordStoryView(
    @Param('id') id: string,
    @Body() body: StoryViewDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.userId,
    );
    return this.storiesDatabase.recordStoryView(id, user.id);
  }

  @Post(':id/reply')
  async replyToStory(
    @Param('id') id: string,
    @Body() body: StoryReplyDto,
    @Headers('authorization') authorization?: string,
  ) {
    const story = await this.storiesDatabase.getStory(id);
    const actor = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.userId,
    );
    const recipientUserId = body.recipientUserId?.trim() || story.userId;
    const thread = await this.coreDatabase.ensureDirectThread(actor.id, recipientUserId);
    const text = body.message?.trim() || body.text?.trim() || '';
    const message = await this.coreDatabase.createMessage(thread.id, actor.id, text, {
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
    const user = await this.coreDatabase
      .requireUserFromAuthorization(authorization)
      .catch(() => null);
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
      (story: { userId: string }) =>
        story.userId === viewerId || buddyIds.includes(story.userId),
    );
  }
}
