import { Controller, Get } from '@nestjs/common';
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

  @Get('calls')
  getCalls() {
    return this.ecosystemData.getCalls();
  }

  @Get('live-stream')
  getLiveStreams() {
    return this.ecosystemData.getLiveStreams();
  }

  @Get('socket/contract')
  getSocketContract() {
    return this.ecosystemData.getSocketContract();
  }
}
