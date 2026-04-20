import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PlatformDataService } from '../data/platform-data.service';
import { ExtendedDataService } from '../data/extended-data.service';
import { CreateMessageDto } from '../dto/api.dto';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(
    private readonly platformData: PlatformDataService,
    private readonly extendedData: ExtendedDataService,
  ) {}

  @Get('threads')
  getThreads() {
    return this.platformData.getThreads();
  }

  @Get('threads/:id')
  getThread(@Param('id') id: string) {
    return this.platformData.getThread(id);
  }

  @Post('threads/:id/messages')
  createMessage(@Param('id') id: string, @Body() body: CreateMessageDto) {
    return this.platformData.createMessage(id, body.senderId, body.text);
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
