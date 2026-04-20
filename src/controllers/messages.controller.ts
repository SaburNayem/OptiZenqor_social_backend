import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PlatformDataService } from '../data/platform-data.service';
import { CreateMessageDto } from '../dto/api.dto';

@ApiTags('messages')
@Controller('messages')
export class MessagesController {
  constructor(private readonly platformData: PlatformDataService) {}

  @Get()
  getThreads() {
    return this.platformData.getThreads();
  }

  @Get(':id')
  getThread(@Param('id') id: string) {
    return this.platformData.getThread(id);
  }

  @Post(':id')
  createMessage(@Param('id') id: string, @Body() body: CreateMessageDto) {
    return this.platformData.createMessage(id, body.senderId, body.text);
  }
}
