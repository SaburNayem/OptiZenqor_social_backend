import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import {
  CreateGroupChatDto,
  CreateCallSessionDto,
  EndCallSessionDto,
  GroupChatMemberDto,
  LiveCommentDto,
  LiveReactionDto,
  PaginationQueryDto,
  UpdateGroupChatDto,
} from '../dto/api.dto';
import { CoreDatabaseService } from '../services/core-database.service';
import { RealtimeStateService } from '../services/realtime-state.service';
import { SocialStateDatabaseService } from '../services/social-state-database.service';

@ApiTags('realtime')
@Controller()
export class RealtimeController {
  constructor(
    private readonly coreDatabase: CoreDatabaseService,
    private readonly realtimeState: RealtimeStateService,
    private readonly socialStateDatabase: SocialStateDatabaseService,
  ) {}

  private mapGroupChat(thread: Awaited<ReturnType<CoreDatabaseService['getThread']>>) {
    return {
      id: thread.id,
      name: thread.title,
      members:
        Array.isArray(thread.participants) && thread.participants.length > 0
          ? thread.participants.map((participant) => participant.username)
          : (thread.participantIds ?? []),
      roles:
        typeof thread.roles === 'object' && thread.roles
          ? thread.roles
          : Array.isArray(thread.participants) && thread.participants.length > 0
            ? Object.fromEntries(
                thread.participants.map((participant) => [
                  participant.username,
                  participant.threadRole ?? 'member',
                ]),
              )
            : {},
      media: [],
      summary: thread.summary,
      unreadCount: thread.unreadCount ?? 0,
      messages: thread.messages ?? [],
    };
  }

  @UseGuards(SessionAuthGuard)
  @Get('group-chat')
  async getGroupChats(@CurrentUser() user: { id: string }) {
    const threads = await this.coreDatabase.getThreads();
    const groups = threads
      .filter((thread) => (thread.participantIds?.length ?? 0) > 2)
      .map((thread) => ({
        ...this.mapGroupChat(thread),
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
    const group = this.mapGroupChat(thread);
    return {
      success: true,
      message: 'Group chat fetched successfully.',
      data: group,
      group,
    };
  }

  @UseGuards(SessionAuthGuard)
  @Post('group-chat')
  async createGroupChat(@CurrentUser() user: { id: string }, @Body() body: CreateGroupChatDto) {
    const thread = await this.coreDatabase.createGroupThread(
      user.id,
      body.name,
      body.participantIds ?? [],
    );
    const group = this.mapGroupChat(thread);
    return {
      success: true,
      message: 'Group chat created successfully.',
      data: group,
      group,
    };
  }

  @UseGuards(SessionAuthGuard)
  @Patch('group-chat/:id')
  async updateGroupChat(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() body: UpdateGroupChatDto,
  ) {
    const thread = await this.coreDatabase.updateGroupThread(id, user.id, body.name);
    const group = this.mapGroupChat(thread);
    return {
      success: true,
      message: 'Group chat updated successfully.',
      data: group,
      group,
    };
  }

  @UseGuards(SessionAuthGuard)
  @Delete('group-chat/:id')
  async deleteGroupChat(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return {
      success: true,
      message: 'Group chat deleted successfully.',
      data: await this.coreDatabase.deleteGroupThread(id, user.id),
    };
  }

  @UseGuards(SessionAuthGuard)
  @Post('group-chat/:id/members')
  async addGroupChatMember(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() body: GroupChatMemberDto,
  ) {
    const identifier = body.userId?.trim() || body.username?.trim() || '';
    const thread = await this.coreDatabase.addThreadParticipant(
      id,
      user.id,
      identifier,
      body.role ?? 'member',
    );
    const group = this.mapGroupChat(thread);
    return {
      success: true,
      message: 'Group member added successfully.',
      data: group,
      group,
    };
  }

  @UseGuards(SessionAuthGuard)
  @Delete('group-chat/:id/members/:userId')
  async removeGroupChatMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() user: { id: string },
  ) {
    const thread = await this.coreDatabase.removeThreadParticipant(id, user.id, userId);
    const group = this.mapGroupChat(thread);
    return {
      success: true,
      message: 'Group member removed successfully.',
      data: group,
      group,
    };
  }

  @UseGuards(SessionAuthGuard)
  @Patch('group-chat/:id/members/:userId/role')
  async updateGroupChatMemberRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() user: { id: string },
    @Body() body: GroupChatMemberDto,
  ) {
    const thread = await this.coreDatabase.updateThreadParticipantRole(
      id,
      user.id,
      userId,
      body.role ?? 'member',
    );
    const group = this.mapGroupChat(thread);
    return {
      success: true,
      message: 'Group member role updated successfully.',
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
  async getLiveStreams(
    @Query() query: PaginationQueryDto,
    @Query('status') status?: string,
    @Query('userId') userId?: string,
  ) {
    const payload = await this.socialStateDatabase.listLiveStreams({
      ...query,
      status,
      userId,
    });
    return {
      success: true,
      message: 'Live streams fetched successfully.',
      ...payload,
      streams: payload.items,
    };
  }

  @UseGuards(SessionAuthGuard)
  @Get('live-stream/setup')
  async getLiveStreamSetup(@CurrentUser() user: { id: string }) {
    const setup = await this.socialStateDatabase.getLiveStreamSetup(user.id);
    return {
      success: true,
      message: 'Live stream setup fetched successfully.',
      data: setup,
      setup,
    };
  }

  @UseGuards(SessionAuthGuard)
  @Get('live-stream/studio')
  async getLiveStreamStudio(@CurrentUser() user: { id: string }) {
    const studio = await this.socialStateDatabase.getLiveStreamStudio(user.id);
    return {
      success: true,
      message: 'Live stream studio fetched successfully.',
      data: studio,
      studio,
    };
  }

  @Get('live-stream/:id/comments')
  async getLiveStreamComments(
    @Param('id') id: string,
    @Query() query: PaginationQueryDto,
  ) {
    const payload = await this.socialStateDatabase.listLiveStreamComments(id, query);
    return {
      success: true,
      message: 'Live stream comments fetched successfully.',
      ...payload,
      comments: payload.items,
    };
  }

  @UseGuards(SessionAuthGuard)
  @Post('live-stream/:id/comments')
  async createLiveStreamComment(
    @Param('id') id: string,
    @Body() body: LiveCommentDto,
    @Headers('authorization') authorization?: string,
  ) {
    const actor = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.userId,
    );
    const comment = await this.socialStateDatabase.createLiveStreamComment(
      id,
      actor.id,
      body.message,
    );
    return {
      success: true,
      message: 'Live stream comment created successfully.',
      data: comment,
      comment,
    };
  }

  @Get('live-stream/:id/reactions')
  async getLiveStreamReactions(
    @Param('id') id: string,
    @Query() query: PaginationQueryDto,
  ) {
    const payload = await this.socialStateDatabase.listLiveStreamReactions(id, query);
    return {
      success: true,
      message: 'Live stream reactions fetched successfully.',
      ...payload,
      reactions: payload.items,
    };
  }

  @UseGuards(SessionAuthGuard)
  @Post('live-stream/:id/reactions')
  async createLiveStreamReaction(
    @Param('id') id: string,
    @Body() body: LiveReactionDto,
    @Headers('authorization') authorization?: string,
  ) {
    const actor = await this.coreDatabase.requireUserFromAuthorization(authorization);
    const payload = await this.socialStateDatabase.createLiveStreamReaction(
      id,
      actor.id,
      body.type,
    );
    return {
      success: true,
      message: 'Live stream reaction created successfully.',
      data: payload,
      reaction: payload.reaction,
      summary: payload.summary,
    };
  }

  @Get('live-stream/:id')
  async getLiveStream(@Param('id') id: string) {
    const stream = await this.socialStateDatabase.getLiveStream(id);
    return {
      success: true,
      message: 'Live stream fetched successfully.',
      data: stream,
      stream,
    };
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
