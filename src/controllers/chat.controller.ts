import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  CreateChatThreadDto,
  CreateMessageDto,
  ForwardMessageDto,
  ToggleThreadPreferenceDto,
  ToggleMessagePinDto,
  UpdateMessageDto,
  UpdateChatPreferencesDto,
  UpdateChatPresenceDto,
} from '../dto/api.dto';
import { CoreDatabaseService } from '../services/core-database.service';
import { RealtimeStateService } from '../services/realtime-state.service';
import { SocialStateDatabaseService } from '../services/social-state-database.service';
import { listResponse, successResponse } from '../utils/api-response.util';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(
    private readonly coreDatabase: CoreDatabaseService,
    private readonly realtimeState: RealtimeStateService,
    private readonly socialStateDatabase: SocialStateDatabaseService,
  ) {}

  @Get('message-contract')
  getMessageContract() {
    return successResponse('Chat message contract fetched successfully.', {
      endpoint: 'POST /chat/threads/:id/messages',
      supportedKinds: ['text', 'image', 'video', 'audio', 'file', 'location', 'contact'],
      request: {
        senderId: 'string',
        text: 'string (required for text messages, optional for attachment-only messages)',
        kind: 'text | image | video | audio | file | location | contact',
        replyToMessageId: 'string?',
        attachmentItems: [
          {
            type: 'image | video | audio | file',
            url: 'string',
            name: 'string?',
            mimeType: 'string?',
            uploadId: 'string?',
            sizeBytes: 'number?',
            durationMs: 'number?',
            thumbnailUrl: 'string?',
          },
        ],
        aliases: {
          attachments: ['string'],
          mediaPath: 'string',
          mediaUrl: 'string',
          imageUrl: 'string',
          audioUrl: 'string',
          videoUrl: 'string',
          fileUrl: 'string',
          fileName: 'string',
          mimeType: 'string',
          uploadId: 'string',
        },
      },
      behavior: {
        text: 'Requires non-empty text.',
        image: 'Requires at least one attachment URL.',
        video: 'Requires at least one attachment URL.',
        audio: 'Requires at least one attachment URL.',
        file: 'Requires at least one attachment URL.',
        location: 'Stores the shared location as a text-backed message.',
        contact: 'Stores the shared contact card as a text-backed message.',
      },
    });
  }

  @Get('presence-contract')
  getPresenceContract() {
    return successResponse('Chat presence contract fetched successfully.', {
      endpoint: 'GET /chat/presence',
      userFields: ['userId', 'isOnline', 'socketCount', 'lastSeen', 'typingThreadIds', 'activeThreadIds'],
      threadFields: ['threadId', 'activeUserIds', 'typingUserIds'],
      updateRoutes: {
        snapshot: 'GET /chat/presence',
        typing: 'POST /chat/presence',
      },
      realtimeEvents: ['presence.updated', 'presence:update', 'thread.presence.updated'],
    });
  }

  @Get()
  async getChatOverview(
    @Headers('authorization') authorization?: string,
    @Query('userId') userId?: string,
  ) {
    const actor = await this.coreDatabase
      .requireUserFromAuthorization(authorization, userId)
      .catch(() => null);
    const threads = await this.coreDatabase.getThreads(actor?.id);
    const visibleThreads = actor
      ? threads.filter((thread) => (thread.participantIds ?? []).includes(actor.id))
      : threads;
    return successResponse('Chat overview fetched successfully.', {
      threads: visibleThreads,
      unreadCount: visibleThreads.reduce(
        (count, thread) => count + thread.unreadCount,
        0,
      ),
      presence: this.realtimeState.getPresenceSnapshot(),
      inboxFilters: ['all', 'unread', 'groups', 'marketplace', 'support'],
    });
  }

  @Get('detail')
  async getChatDetail(
    @Query('id') id: string,
    @Headers('authorization') authorization?: string,
    @Query('userId') userId?: string,
  ) {
    const actor = await this.coreDatabase
      .requireUserFromAuthorization(authorization, userId)
      .catch(() => null);
    const thread = await this.coreDatabase.getThread(id, actor?.id);
    const preferences = actor
      ? await this.socialStateDatabase.getChatPreferences(actor.id)
      : {
          conversationPreferences: [],
          notificationPreferences: {},
          safetyConfig: {},
          preferences: {},
        };
    return successResponse('Chat detail fetched successfully.', {
      thread,
      presence: this.realtimeState.getPresenceSnapshot(),
      preferences:
        preferences.conversationPreferences.find((item) => item.threadId === id) ??
        null,
    });
  }

  @Get('detail/:id')
  async getChatDetailById(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
    @Query('userId') userId?: string,
  ) {
    return this.getChatDetail(id, authorization, userId);
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
    return successResponse('Chat settings fetched successfully.', preferences);
  }

  @Get('threads')
  async getThreads(
    @Headers('authorization') authorization?: string,
    @Query('userId') userId?: string,
  ) {
    const actor = await this.coreDatabase
      .requireUserFromAuthorization(authorization, userId)
      .catch(() => null);
    const threads = await this.coreDatabase.getThreads(actor?.id);
    const visibleThreads = actor
      ? threads.filter((thread) => (thread.participantIds ?? []).includes(actor.id))
      : threads;
    return listResponse('Threads fetched successfully.', visibleThreads);
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
    return successResponse('Thread created successfully.', thread);
  }

  @Get('threads/:id')
  async getThread(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const actor = await this.coreDatabase
      .requireUserFromAuthorization(authorization)
      .catch(() => null);
    const thread = await this.coreDatabase.getThread(id, actor?.id);
    return successResponse('Thread fetched successfully.', thread);
  }

  @Get('threads/:id/messages')
  async getThreadMessages(@Param('id') id: string) {
    const messages = await this.coreDatabase.getThreadMessages(id);
    return listResponse('Thread messages fetched successfully.', messages);
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
    const message = await this.coreDatabase.createMessage(
      id,
      actor.id,
      body.text ?? body.message ?? body.body ?? '',
      {
      attachments: body.attachments,
      replyToMessageId: body.replyToMessageId,
      kind: body.kind ?? body.type,
      mediaPath: body.mediaPath ?? body.attachmentUrl,
      mediaUrl: body.mediaUrl ?? body.attachmentUrl,
      imageUrl: body.imageUrl,
      audioUrl: body.audioUrl,
      videoUrl: body.videoUrl,
      fileUrl: body.fileUrl,
      fileName: body.fileName,
      mimeType: body.mimeType,
      uploadId: body.uploadId,
      attachmentItems: body.attachmentItems,
      },
    );
    return successResponse('Message sent successfully.', message);
  }

  @Patch('threads/:id/messages/:messageId')
  async updateMessage(
    @Param('id') id: string,
    @Param('messageId') messageId: string,
    @Body() body: UpdateMessageDto,
    @Headers('authorization') authorization?: string,
  ) {
    const actor = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.userId,
    );
    const message = await this.coreDatabase.updateChatMessage(
      id,
      messageId,
      actor.id,
      body.text,
    );
    return successResponse('Message updated successfully.', message);
  }

  @Delete('threads/:id/messages/:messageId')
  async deleteMessage(
    @Param('id') id: string,
    @Param('messageId') messageId: string,
    @Body() body: { userId?: string },
    @Headers('authorization') authorization?: string,
  ) {
    const actor = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.userId,
    );
    const result = await this.coreDatabase.deleteChatMessage(id, messageId, actor.id);
    return successResponse('Message deleted successfully.', result);
  }

  @Patch('threads/:id/messages/:messageId/pin')
  @Post('threads/:id/messages/:messageId/pin')
  async pinMessage(
    @Param('id') id: string,
    @Param('messageId') messageId: string,
    @Body() body: ToggleMessagePinDto,
    @Headers('authorization') authorization?: string,
  ) {
    const actor = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.userId,
    );
    const message = await this.coreDatabase.toggleChatMessagePin(
      id,
      messageId,
      actor.id,
      body.value,
    );
    return successResponse('Message pin state updated successfully.', message);
  }

  @Post('threads/:id/messages/:messageId/forward')
  async forwardMessage(
    @Param('id') id: string,
    @Param('messageId') messageId: string,
    @Body() body: ForwardMessageDto,
    @Headers('authorization') authorization?: string,
  ) {
    const actor = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.userId,
    );
    const message = await this.coreDatabase.forwardChatMessage(
      id,
      messageId,
      body.targetThreadId,
      actor.id,
      body.text,
    );
    return successResponse('Message forwarded successfully.', message);
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
    return successResponse('Thread marked as read successfully.', result);
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
    return successResponse('Thread archive preference updated successfully.', preference);
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
    return successResponse('Thread mute preference updated successfully.', preference);
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
    return successResponse('Thread pin preference updated successfully.', preference);
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
    return successResponse('Thread unread preference updated successfully.', preference);
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
    return successResponse('Thread cleared successfully.', preference);
  }

  @Get('presence')
  getPresence() {
    const snapshot = this.realtimeState.getPresenceSnapshot();
    return successResponse('Chat presence fetched successfully.', snapshot);
  }

  @Post('presence')
  async updatePresence(
    @Body() body: UpdateChatPresenceDto,
    @Headers('authorization') authorization?: string,
  ) {
    const actor = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.userId,
    );
    const presence = body.typingInThreadId
      ? await this.realtimeState.setTyping(
          body.typingInThreadId,
          actor.id,
          body.online ?? true,
        )
      : this.realtimeState.getPresenceSnapshot();
    return successResponse('Chat presence updated successfully.', presence);
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
    return successResponse('Chat preferences fetched successfully.', preferences);
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
    return successResponse('Chat preferences updated successfully.', preferences);
  }
}
