import { Controller, Get } from '@nestjs/common';
import { Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EcosystemDataService } from '../data/ecosystem-data.service';

@ApiTags('realtime')
@Controller()
export class RealtimeController {
  constructor(private readonly ecosystemData: EcosystemDataService) {}

  @Get('group-chat')
  getGroupChats() {
    return this.ecosystemData.getGroupChats();
  }

  @Get('group-chat/:id')
  getGroupChat(@Param('id') id: string) {
    return this.ecosystemData.getGroupChat(id);
  }

  @Get('calls')
  getCalls() {
    return this.ecosystemData.getCalls();
  }

  @Get('calls/:id')
  getCall(@Param('id') id: string) {
    return this.ecosystemData.getCall(id);
  }

  @Get('live-stream')
  getLiveStreams() {
    return this.ecosystemData.getLiveStreams();
  }

  @Get('live-stream/:id')
  getLiveStream(@Param('id') id: string) {
    return this.ecosystemData.getLiveStream(id);
  }

  @Get('socket/contract')
  getSocketContract() {
    return this.ecosystemData.getSocketContract();
  }
}
