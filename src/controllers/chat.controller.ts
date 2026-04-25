import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ExtendedDataService } from '../data/extended-data.service';
import { CreateMessageDto } from '../dto/api.dto';
import { CoreDatabaseService } from '../services/core-database.service';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(
    private readonly coreDatabase: CoreDatabaseService,
    private readonly extendedData: ExtendedDataService,
  ) {}

  @Get()
  async getChatOverview() {
    const threads = await this.coreDatabase.getThreads();
    return {
      success: true,
      message: 'Chat overview fetched successfully.',
      threads,
      data: threads,
      unreadCount: threads.reduce((count, thread) => count + thread.unreadCount, 0),
      presence: this.extendedData.getPresence(),
      inboxFilters: ['all', 'unread', 'groups', 'marketplace', 'support'],
    };
  }

  @Get('detail')
  async getChatDetail(@Query('id') id: string) {
    const thread = await this.coreDatabase.getThread(id);
    return {
      thread,
      presence: this.extendedData.getPresence(),
      preferences: this.extendedData
        .getConversationPreferences()
        .find((item) => item.threadId === id) ?? null,
    };
  }

  @Get('detail/:id')
  async getChatDetailById(@Param('id') id: string) {
    return this.getChatDetail(id);
  }

  @Get('settings')
  getChatSettings() {
    return {
      conversationPreferences: this.extendedData.getConversationPreferences(),
      notificationPreferences: this.extendedData.getNotificationPreferences(),
      safetyConfig: this.extendedData.getSafetyConfig(),
    };
  }

  @Get('threads')
  async getThreads() {
    const threads = await this.coreDatabase.getThreads();
    return {
      success: true,
      message: 'Threads fetched successfully.',
      data: threads,
      items: threads,
      results: threads,
      threads,
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
  async createMessage(@Param('id') id: string, @Body() body: CreateMessageDto) {
    const message = await this.coreDatabase.createMessage(id, body.senderId, body.text, {
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
  async markRead(@Param('id') id: string, @Body() body: { userId: string }) {
    const result = await this.coreDatabase.markThreadMessagesRead(id, body.userId);
    return {
      success: true,
      message: 'Thread marked as read successfully.',
      ...result,
      data: result,
    };
  }

  @Patch('threads/:id/archive')
  archiveThread(@Param('id') id: string) {
    return this.extendedData.updateConversationPreference(id, 'archived', true);
  }

  @Patch('threads/:id/mute')
  muteThread(@Param('id') id: string) {
    return this.extendedData.updateConversationPreference(id, 'muted', true);
  }

  @Patch('threads/:id/pin')
  pinThread(@Param('id') id: string) {
    return this.extendedData.updateConversationPreference(id, 'pinned', true);
  }

  @Patch('threads/:id/unread')
  markUnread(@Param('id') id: string) {
    return this.extendedData.updateConversationPreference(id, 'unread', true);
  }

  @Delete('threads/:id/clear')
  clearThread(@Param('id') id: string) {
    return this.extendedData.updateConversationPreference(
      id,
      'clearedAt',
      new Date().toISOString(),
    );
  }
}
