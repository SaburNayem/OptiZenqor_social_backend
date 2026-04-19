import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PlatformDataService } from '../data/platform-data.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly platformData: PlatformDataService) {}

  @Get('threads')
  getThreads() {
    return this.platformData.getThreads();
  }

  @Get('threads/:id')
  getThread(@Param('id') id: string) {
    return this.platformData.getThread(id);
  }

  @Post('threads/:id/messages')
  createMessage(
    @Param('id') id: string,
    @Body() body: { senderId: string; text: string },
  ) {
    return this.platformData.createMessage(id, body.senderId, body.text);
  }
}
