import { Body, Controller, Get, Headers, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { EcosystemDataService } from '../data/ecosystem-data.service';
import {
  CreateCallSessionDto,
  EndCallSessionDto,
  LiveCommentDto,
  LiveReactionDto,
} from '../dto/api.dto';
import { CoreDatabaseService } from '../services/core-database.service';
import { RealtimeStateService } from '../services/realtime-state.service';

@ApiTags('realtime')
@Controller()
export class RealtimeController {
  constructor(
    private readonly ecosystemData: EcosystemDataService,
    private readonly coreDatabase: CoreDatabaseService,
    private readonly realtimeState: RealtimeStateService,
  ) {}

  @UseGuards(SessionAuthGuard)
  @Get('group-chat')
  async getGroupChats(@CurrentUser() user: { id: string }) {
    const threads = await this.coreDatabase.getThreads();
    const groups = threads
      .filter((thread) => (thread.participantIds?.length ?? 0) > 2)
      .map((thread) => ({
        id: thread.id,
        name: thread.title,
        members:
          Array.isArray(thread.participants) && thread.participants.length > 0
            ? thread.participants.map((participant) => participant.username)
            : (thread.participantIds ?? []),
        roles:
          Array.isArray(thread.participants) && thread.participants.length > 0
            ? Object.fromEntries(
                thread.participants.map((participant, index) => [
                  participant.username,
                  index === 0 ? 'admin' : 'member',
                ]),
              )
            : {},
        media: [],
        summary: thread.summary,
        unreadCount: thread.unreadCount ?? 0,
        activeForUser: (thread.participantIds ?? []).includes(user.id),
      }));

    return {
      success: true,
      message: 'Group chats fetched successfully.',
      data: groups,
      items: groups,
      results: groups,
      groups,
    };
  }

  @UseGuards(SessionAuthGuard)
  @Get('group-chat/:id')
  async getGroupChat(@Param('id') id: string) {
    const thread = await this.coreDatabase.getThread(id);
    const group = {
      id: thread.id,
      name: thread.title,
      members:
        Array.isArray(thread.participants) && thread.participants.length > 0
          ? thread.participants.map((participant) => participant.username)
          : (thread.participantIds ?? []),
      roles:
        Array.isArray(thread.participants) && thread.participants.length > 0
          ? Object.fromEntries(
              thread.participants.map((participant, index) => [
                participant.username,
                index === 0 ? 'admin' : 'member',
              ]),
            )
          : {},
      media: [],
      messages: thread.messages ?? [],
    };
    return {
      success: true,
      message: 'Group chat fetched successfully.',
      data: group,
      group,
    };
  }

  @UseGuards(SessionAuthGuard)
  @Get('calls')
  async getCalls(@CurrentUser() user: { id: string }) {
    const sessions = this.realtimeState
      .getCallSessions()
      .filter(
        (session) =>
          session.initiatorId === user.id ||
          session.recipientIds.includes(user.id) ||
          session.participants.some((participant) => participant.userId === user.id),
      );

    const calls = await Promise.all(
      sessions.map(async (session) => {
        const otherUserId =
          session.initiatorId === user.id
            ? session.recipientIds[0] ?? session.participants.find((item) => item.userId !== user.id)?.userId
            : session.initiatorId;
        const otherUser = otherUserId
          ? await this.coreDatabase.getUser(otherUserId).catch(() => null)
          : null;
        return {
          id: session.id,
          sessionId: session.id,
          user: otherUser?.username ?? otherUserId ?? 'call',
          userId: otherUser?.id ?? otherUserId ?? '',
          name: otherUser?.name ?? otherUser?.username ?? 'Call',
          avatarUrl: otherUser?.avatar ?? '',
          type: session.mode,
          state:
            session.status === 'ended'
              ? 'completed'
              : session.initiatorId === user.id
                ? 'outgoing'
                : 'incoming',
          time: session.startedAt,
          startedAt: session.startedAt,
          endedAt: session.endedAt,
          reason: session.reason,
          threadId: session.threadId ?? null,
        };
      }),
    );

    return {
      success: true,
      message: 'Calls fetched successfully.',
      data: calls,
      items: calls,
      results: calls,
      calls,
    };
  }

  @UseGuards(SessionAuthGuard)
  @Get('calls/:id')
  async getCall(@Param('id') id: string) {
    const session = this.realtimeState.getCallSession(id);
    return {
      success: true,
      message: 'Call fetched successfully.',
      data: session,
      call: session,
    };
  }

  @Get('live-stream')
  getLiveStreams() {
    return this.ecosystemData.getLiveStreams();
  }

  @Get('live-stream/setup')
  getLiveStreamSetup() {
    return this.ecosystemData.getLiveStreamStudio();
  }

  @Get('live-stream/studio')
  getLiveStreamStudio() {
    return this.ecosystemData.getLiveStreamStudio();
  }

  @Get('live-stream/:id/comments')
  getLiveStreamComments(@Param('id') id: string) {
    return this.ecosystemData.getLiveStream(id).comments ?? [];
  }

  @Post('live-stream/:id/comments')
  createLiveStreamComment(@Param('id') id: string, @Body() body: LiveCommentDto) {
    return this.ecosystemData.addLiveStreamComment(id, body);
  }

  @Get('live-stream/:id/reactions')
  getLiveStreamReactions(@Param('id') id: string) {
    return this.ecosystemData.getLiveStream(id).reactions ?? [];
  }

  @Post('live-stream/:id/reactions')
  createLiveStreamReaction(@Param('id') id: string, @Body() body: LiveReactionDto) {
    return this.ecosystemData.addLiveStreamReaction(id, body.type);
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
    const sessions = this.realtimeState.getCallSessions();
    return {
      success: true,
      message: 'Call sessions fetched successfully.',
      data: sessions,
      items: sessions,
      results: sessions,
      sessions,
    };
  }

  @Get('calls/sessions/:id')
  getCallSession(@Param('id') id: string) {
    const session = this.realtimeState.getCallSession(id);
    return {
      success: true,
      message: 'Call session fetched successfully.',
      data: session,
      session,
    };
  }

  @UseGuards(SessionAuthGuard)
  @Post('calls/sessions')
  async createCallSession(
    @Body() body: CreateCallSessionDto,
    @Headers('authorization') authorization?: string,
  ) {
    const actor = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.initiatorId,
    );
    const session = await this.realtimeState.createCallSession({
      ...body,
      initiatorId: actor.id,
    });
    return {
      success: true,
      message: 'Call session created successfully.',
      data: session,
      session,
    };
  }

  @UseGuards(SessionAuthGuard)
  @Patch('calls/sessions/:id/end')
  async endCallSession(
    @Param('id') id: string,
    @Body() body: EndCallSessionDto,
    @Headers('authorization') authorization?: string,
  ) {
    const actor = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.endedBy,
    );
    const session = this.realtimeState.endCallSession(id, actor.id, body.reason);
    return {
      success: true,
      message: 'Call session ended successfully.',
      data: session,
      session,
    };
  }
}
