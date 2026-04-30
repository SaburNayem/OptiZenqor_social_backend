import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ExtendedDataService } from '../data/extended-data.service';
import {
  CreateChatThreadDto,
  CreateMessageDto,
  ToggleThreadPreferenceDto,
  UpdateChatPreferencesDto,
  UpdateChatPresenceDto,
} from '../dto/api.dto';
import { CoreDatabaseService } from '../services/core-database.service';
import { RealtimeStateService } from '../services/realtime-state.service';
import { SocialStateDatabaseService } from '../services/social-state-database.service';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(
    private readonly coreDatabase: CoreDatabaseService,
    private readonly extendedData: ExtendedDataService,
    private readonly realtimeState: RealtimeStateService,
    private readonly socialStateDatabase: SocialStateDatabaseService,
  ) {}

  @Get()
  async getChatOverview(
    @Headers('authorization') authorization?: string,
    @Query('userId') userId?: string,
  ) {
    const actor = await this.coreDatabase
      .requireUserFromAuthorization(authorization, userId)
      .catch(() => null);
    const threads = await this.coreDatabase.getThreads();
    const visibleThreads = actor
      ? threads.filter((thread) => (thread.participantIds ?? []).includes(actor.id))
      : threads;
    return {
      success: true,
      message: 'Chat overview fetched successfully.',
      threads: visibleThreads,
      data: visibleThreads,
      unreadCount: visibleThreads.reduce(
        (count, thread) => count + thread.unreadCount,
        0,
      ),
      presence: this.extendedData.getPresence(),
      inboxFilters: ['all', 'unread', 'groups', 'marketplace', 'support'],
    };
  }

  @Get('detail')
  async getChatDetail(
    @Query('id') id: string,
    @Headers('authorization') authorization?: string,
    @Query('userId') userId?: string,
  ) {
    const thread = await this.coreDatabase.getThread(id);
    const actor = await this.coreDatabase
      .requireUserFromAuthorization(authorization, userId)
      .catch(() => null);
    const preferences = actor
      ? await this.socialStateDatabase.getChatPreferences(actor.id)
      : {
          conversationPreferences: [],
          notificationPreferences: {},
          safetyConfig: {},
          preferences: {},
        };
    return {
      success: true,
      message: 'Chat detail fetched successfully.',
      thread,
      presence: this.extendedData.getPresence(),
      preferences:
        preferences.conversationPreferences.find((item) => item.threadId === id) ??
        null,
      data: {
        thread,
        presence: this.extendedData.getPresence(),
        preferences:
          preferences.conversationPreferences.find((item) => item.threadId === id) ??
          null,
      },
    };
  }

  @Get('detail/:id')
  async getChatDetailById(@Param('id') id: string) {
    return this.getChatDetail(id);
  }

  @Get('settings')
  async getChatSettings(
    @Headers('authorization') authorization?: string,
    @Query('userId') userId?: string,
  ) {
    const actor = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      userId,
    );
    const preferences = await this.socialStateDatabase.getChatPreferences(actor.id);
    return {
      success: true,
      message: 'Chat settings fetched successfully.',
      ...preferences,
      data: preferences,
    };
  }

  @Get('threads')
  async getThreads(
    @Headers('authorization') authorization?: string,
    @Query('userId') userId?: string,
  ) {
    const actor = await this.coreDatabase
      .requireUserFromAuthorization(authorization, userId)
      .catch(() => null);
    const threads = await this.coreDatabase.getThreads();
    const visibleThreads = actor
      ? threads.filter((thread) => (thread.participantIds ?? []).includes(actor.id))
      : threads;
    return {
      success: true,
      message: 'Threads fetched successfully.',
      data: visibleThreads,
      items: visibleThreads,
      results: visibleThreads,
      threads: visibleThreads,
    };
  }

  @Post('threads')
  async createThread(
    @Body() body: CreateChatThreadDto,
    @Headers('authorization') authorization?: string,
  ) {
    const actor = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.userId?.trim() || body.actorId?.trim(),
    );
    const participantIds = body.participantIds?.length
      ? body.participantIds
      : body.targetUserId
        ? [body.targetUserId]
        : [];
    const thread = await this.coreDatabase.createOrOpenThread(actor.id, participantIds);
    return {
      success: true,
      message: 'Thread created successfully.',
      ...thread,
      thread,
      data: thread,
    };
  }

  @Get('threads/:id')
  async getThread(@Param('id') id: string) {
    const thread = await this.coreDatabase.getThread(id);
    return {
      success: true,
      message: 'Thread fetched successfully.',
      ...thread,
      thread,
      data: thread,
    };
  }

  @Get('threads/:id/messages')
  async getThreadMessages(@Param('id') id: string) {
    const messages = await this.coreDatabase.getThreadMessages(id);
    return {
      success: true,
      message: 'Thread messages fetched successfully.',
      data: messages,
      items: messages,
      results: messages,
      messages,
    };
  }

  @Post('threads/:id/messages')
  async createMessage(
    @Param('id') id: string,
    @Body() body: CreateMessageDto,
    @Headers('authorization') authorization?: string,
  ) {
    const actor = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.senderId,
    );
    const message = await this.coreDatabase.createMessage(id, actor.id, body.text, {
      attachments: body.attachments,
      replyToMessageId: body.replyToMessageId,
      kind: body.kind,
      mediaPath: body.mediaPath,
    });
    return {
      success: true,
      message: 'Message sent successfully.',
      ...message,
      data: message,
    };
  }

  @Patch('threads/:id/read')
  @Post('threads/:id/read')
  async markRead(
    @Param('id') id: string,
    @Body() body: { userId?: string },
    @Headers('authorization') authorization?: string,
  ) {
    const actor = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.userId,
    );
    const result = await this.coreDatabase.markThreadMessagesRead(id, actor.id);
    return {
      success: true,
      message: 'Thread marked as read successfully.',
      ...result,
      data: result,
    };
  }

  @Patch('threads/:id/archive')
  @Post('threads/:id/archive')
  async archiveThread(
    @Param('id') id: string,
    @Body() body: ToggleThreadPreferenceDto,
    @Headers('authorization') authorization?: string,
  ) {
    const actor = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.userId?.trim() || body.actorId?.trim(),
    );
    const preference = await this.socialStateDatabase.updateThreadPreference(
      actor.id,
      id,
      { archived: body.value ?? true },
    );
    return {
      success: true,
      message: 'Thread archive preference updated successfully.',
      data: preference,
      preference,
    };
  }

  @Patch('threads/:id/mute')
  @Post('threads/:id/mute')
  async muteThread(
    @Param('id') id: string,
    @Body() body: ToggleThreadPreferenceDto,
    @Headers('authorization') authorization?: string,
  ) {
    const actor = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.userId?.trim() || body.actorId?.trim(),
    );
    const preference = await this.socialStateDatabase.updateThreadPreference(
      actor.id,
      id,
      { muted: body.value ?? true },
    );
    return {
      success: true,
      message: 'Thread mute preference updated successfully.',
      data: preference,
      preference,
    };
  }

  @Patch('threads/:id/pin')
  @Post('threads/:id/pin')
  async pinThread(
    @Param('id') id: string,
    @Body() body: ToggleThreadPreferenceDto,
    @Headers('authorization') authorization?: string,
  ) {
    const actor = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.userId?.trim() || body.actorId?.trim(),
    );
    const preference = await this.socialStateDatabase.updateThreadPreference(
      actor.id,
      id,
      { pinned: body.value ?? true },
    );
    return {
      success: true,
      message: 'Thread pin preference updated successfully.',
      data: preference,
      preference,
    };
  }

  @Patch('threads/:id/unread')
  async markUnread(
    @Param('id') id: string,
    @Body() body: ToggleThreadPreferenceDto,
    @Headers('authorization') authorization?: string,
  ) {
    const actor = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.userId?.trim() || body.actorId?.trim(),
    );
    const preference = await this.socialStateDatabase.updateThreadPreference(
      actor.id,
      id,
      { unread: body.value ?? true },
    );
    return {
      success: true,
      message: 'Thread unread preference updated successfully.',
      data: preference,
      preference,
    };
  }

  @Delete('threads/:id/clear')
  async clearThread(
    @Param('id') id: string,
    @Body() body: ToggleThreadPreferenceDto,
    @Headers('authorization') authorization?: string,
  ) {
    const actor = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.userId?.trim() || body.actorId?.trim(),
    );
    const preference = await this.socialStateDatabase.updateThreadPreference(
      actor.id,
      id,
      { clearedAt: new Date() },
    );
    return {
      success: true,
      message: 'Thread cleared successfully.',
      data: preference,
      preference,
    };
  }

  @Get('presence')
  getPresence() {
    const snapshot = this.realtimeState.getPresenceSnapshot();
    return {
      success: true,
      message: 'Chat presence fetched successfully.',
      data: snapshot,
      presence: snapshot,
    };
  }

  @Post('presence')
  async updatePresence(@Body() body: UpdateChatPresenceDto) {
    const presence = await this.extendedData.updatePresence(body);
    return {
      success: true,
      message: 'Chat presence updated successfully.',
      data: presence,
      presence,
    };
  }

  @Get('preferences')
  async getPreferences(
    @Headers('authorization') authorization?: string,
    @Query('userId') userId?: string,
  ) {
    const actor = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      userId,
    );
    const preferences = await this.socialStateDatabase.getChatPreferences(actor.id);
    return {
      success: true,
      message: 'Chat preferences fetched successfully.',
      data: preferences,
      preferences,
    };
  }

  @Put('preferences')
  async updatePreferences(
    @Body() body: UpdateChatPreferencesDto,
    @Headers('authorization') authorization?: string,
    @Query('userId') userId?: string,
  ) {
    const actor = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      userId,
    );
    const preferences = await this.socialStateDatabase.updateChatPreferences(
      actor.id,
      body.patch,
    );
    return {
      success: true,
      message: 'Chat preferences updated successfully.',
      data: preferences,
      preferences,
    };
  }
}
