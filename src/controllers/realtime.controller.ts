import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EcosystemDataService } from '../data/ecosystem-data.service';
import { CreateCallSessionDto, EndCallSessionDto } from '../dto/api.dto';
import { RealtimeStateService } from '../services/realtime-state.service';

@ApiTags('realtime')
@Controller()
export class RealtimeController {
  constructor(
    private readonly ecosystemData: EcosystemDataService,
    private readonly realtimeState: RealtimeStateService,
  ) {}

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
    return this.realtimeState.getSocketContract();
  }

  @Get('calls/rtc-config')
  getRtcConfig() {
    return this.realtimeState.getRtcConfig();
  }

  @Get('calls/sessions')
  getCallSessions() {
    return this.realtimeState.getCallSessions();
  }

  @Get('calls/sessions/:id')
  getCallSession(@Param('id') id: string) {
    return this.realtimeState.getCallSession(id);
  }

  @Post('calls/sessions')
  createCallSession(@Body() body: CreateCallSessionDto) {
    return this.realtimeState.createCallSession(body);
  }

  @Patch('calls/sessions/:id/end')
  endCallSession(@Param('id') id: string, @Body() body: EndCallSessionDto) {
    return this.realtimeState.endCallSession(id, body.endedBy, body.reason);
  }
}
