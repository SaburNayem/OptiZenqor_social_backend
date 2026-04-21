import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateMessageDto } from '../dto/api.dto';
import { CoreDatabaseService } from '../services/core-database.service';

@ApiTags('messages')
@Controller('messages')
export class MessagesController {
  constructor(private readonly coreDatabase: CoreDatabaseService) {}

  @Get()
  async getThreads() {
    return this.coreDatabase.getThreads();
  }

  @Get(':id')
  async getThread(@Param('id') id: string) {
    return this.coreDatabase.getThread(id);
  }

  @Post(':id')
  async createMessage(@Param('id') id: string, @Body() body: CreateMessageDto) {
    return this.coreDatabase.createMessage(id, body.senderId, body.text, {
      attachments: body.attachments,
      replyToMessageId: body.replyToMessageId,
      kind: body.kind,
      mediaPath: body.mediaPath,
    });
  }
}
