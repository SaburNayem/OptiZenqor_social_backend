import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import {
  UpdateLiveStreamModerationDto,
  UpdateLiveStreamStudioDto,
} from '../dto/admin.dto';
import {
  CallSignalDto,
  CreateGroupChatDto,
  CreateCallSessionDto,
  CreateLiveStreamDto,
  EndCallSessionDto,
  GroupChatMemberDto,
  JoinCallSessionDto,
  LeaveCallSessionDto,
  LiveCommentDto,
  LiveReactionDto,
  PaginationQueryDto,
  UpdateGroupChatDto,
} from '../dto/api.dto';
import { CoreDatabaseService } from '../services/core-database.service';
import { RealtimeStateService } from '../services/realtime-state.service';
import { SocialStateDatabaseService } from '../services/social-state-database.service';
import { successResponse } from '../utils/api-response.util';

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

    return successResponse('Group chats fetched successfully.', groups);
  }

  @UseGuards(SessionAuthGuard)
  @Get('group-chat/:id')
  async getGroupChat(@Param('id') id: string) {
    const thread = await this.coreDatabase.getThread(id);
    const group = this.mapGroupChat(thread);
    return successResponse('Group chat fetched successfully.', group);
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
    return successResponse('Group chat created successfully.', group);
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
    return successResponse('Group chat updated successfully.', group);
  }

  @UseGuards(SessionAuthGuard)
  @Delete('group-chat/:id')
  async deleteGroupChat(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return successResponse(
      'Group chat deleted successfully.',
      await this.coreDatabase.deleteGroupThread(id, user.id),
    );
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
    return successResponse('Group member added successfully.', group);
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
    return successResponse('Group member removed successfully.', group);
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
    return successResponse('Group member role updated successfully.', group);
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

    return successResponse('Calls fetched successfully.', calls);
  }

  @UseGuards(SessionAuthGuard)
  @Get('calls/:id')
  async getCall(@Param('id') id: string) {
    const session = this.realtimeState.getCallSession(id);
    return successResponse('Call fetched successfully.', session);
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
    return successResponse('Live streams fetched successfully.', payload, payload.pagination);
  }

  @Get('live-streams')
  async getLiveStreamsAlias(
    @Query() query: PaginationQueryDto,
    @Query('status') status?: string,
    @Query('userId') userId?: string,
  ) {
    return this.getLiveStreams(query, status, userId);
  }

  @UseGuards(SessionAuthGuard)
  @Get('live-stream/setup')
  async getLiveStreamSetup(@CurrentUser() user: { id: string }) {
    const setup = await this.socialStateDatabase.getLiveStreamSetup(user.id);
    return successResponse('Live stream setup fetched successfully.', setup);
  }

  @UseGuards(SessionAuthGuard)
  @Get('live-stream/studio')
  async getLiveStreamStudio(@CurrentUser() user: { id: string }) {
    const studio = await this.socialStateDatabase.getLiveStreamStudio(user.id);
    return successResponse('Live stream studio fetched successfully.', studio);
  }

  @UseGuards(SessionAuthGuard)
  @Patch('live-stream/studio')
  async updateLiveStreamStudio(
    @CurrentUser() user: { id: string },
    @Body() body: UpdateLiveStreamStudioDto,
  ) {
    const studio = await this.socialStateDatabase.updateLiveStreamStudio(user.id, body);
    return successResponse('Live stream studio updated successfully.', studio);
  }

  @UseGuards(SessionAuthGuard)
  @Post('live-stream')
  async createLiveStream(
    @CurrentUser() user: { id: string },
    @Body() body: CreateLiveStreamDto,
  ) {
    const stream = await this.socialStateDatabase.createLiveStream(user.id, {
      title: body.title ?? '',
      description: body.description,
      category: body.category,
      location: body.location,
      audience: body.audience,
      quickOptions: body.quickOptions,
      previewImageUrl: body.previewImageUrl,
    });
    return successResponse('Live stream created successfully.', stream);
  }

  @UseGuards(SessionAuthGuard)
  @Patch('live-stream/:id/start')
  async startLiveStream(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    const stream = await this.socialStateDatabase.startLiveStream(id, user.id);
    return successResponse('Live stream started successfully.', stream);
  }

  @UseGuards(SessionAuthGuard)
  @Patch('live-stream/:id/end')
  async endLiveStream(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    const stream = await this.socialStateDatabase.endLiveStream(id, user.id);
    return successResponse('Live stream ended successfully.', stream);
  }

  @UseGuards(SessionAuthGuard)
  @Patch('live-stream/:id/moderation')
  async updateLiveStreamModeration(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() body: UpdateLiveStreamModerationDto,
  ) {
    const stream = await this.socialStateDatabase.updateLiveStreamModeration(
      id,
      user.id,
      body,
    );
    return successResponse('Live stream moderation updated successfully.', stream);
  }

  @Get('live-stream/:id/comments')
  async getLiveStreamComments(
    @Param('id') id: string,
    @Query() query: PaginationQueryDto,
  ) {
    const payload = await this.socialStateDatabase.listLiveStreamComments(id, query);
    return successResponse(
      'Live stream comments fetched successfully.',
      payload,
      payload.pagination,
    );
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
    return successResponse('Live stream comment created successfully.', comment);
  }

  @Get('live-stream/:id/reactions')
  async getLiveStreamReactions(
    @Param('id') id: string,
    @Query() query: PaginationQueryDto,
  ) {
    const payload = await this.socialStateDatabase.listLiveStreamReactions(id, query);
    return successResponse(
      'Live stream reactions fetched successfully.',
      payload,
      payload.pagination,
    );
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
    return successResponse('Live stream reaction created successfully.', payload);
  }

  @Get('live-stream/:id')
  async getLiveStream(@Param('id') id: string) {
    const stream = await this.socialStateDatabase.getLiveStream(id);
    return successResponse('Live stream fetched successfully.', stream);
  }

  @Get('live-streams/:id')
  async getLiveStreamAlias(@Param('id') id: string) {
    return this.getLiveStream(id);
  }

  @Get('socket/contract')
  getSocketContract() {
    return successResponse(
      'Socket contract fetched successfully.',
      this.realtimeState.getSocketContract(),
    );
  }

  @Get('calls/rtc-config')
  getRtcConfig() {
    return successResponse('RTC config fetched successfully.', this.realtimeState.getRtcConfig());
  }

  @Get('calls/contract')
  getCallContract() {
    return successResponse(
      'Call contract fetched successfully.',
      this.realtimeState.getCallContract(),
    );
  }

  @Get('calls/sessions')
  getCallSessions() {
    const sessions = this.realtimeState.getCallSessions();
    return successResponse('Call sessions fetched successfully.', sessions);
  }

  @Get('calls/sessions/:id')
  getCallSession(@Param('id') id: string) {
    const session = this.realtimeState.getCallSession(id);
    return successResponse('Call session fetched successfully.', session);
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
    return successResponse('Call session created successfully.', {
      ...session,
      rtcConfig: this.realtimeState.getRtcConfig(),
    });
  }

  @UseGuards(SessionAuthGuard)
  @Post('calls/sessions/:id/join')
  async joinCallSession(
    @Param('id') id: string,
    @Body() body: JoinCallSessionDto,
    @Headers('authorization') authorization?: string,
  ) {
    const actor = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.userId,
    );
    const session = await this.realtimeState.joinCallSession(id, actor.id);
    return successResponse('Call session joined successfully.', {
      ...session,
      rtcConfig: this.realtimeState.getRtcConfig(),
    });
  }

  @UseGuards(SessionAuthGuard)
  @Post('calls/sessions/:id/leave')
  async leaveCallSession(
    @Param('id') id: string,
    @Body() body: LeaveCallSessionDto,
    @Headers('authorization') authorization?: string,
  ) {
    const actor = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.userId,
    );
    const session = await this.realtimeState.leaveCallSession(id, actor.id);
    return successResponse('Call session left successfully.', session);
  }

  @UseGuards(SessionAuthGuard)
  @Post('calls/sessions/:id/signal')
  async createCallSignal(
    @Param('id') id: string,
    @Body() body: CallSignalDto,
    @Headers('authorization') authorization?: string,
  ) {
    const actor = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.fromUserId,
    );
    const signal = await this.realtimeState.addCallSignal({
      sessionId: id,
      fromUserId: actor.id,
      toUserId: body.toUserId,
      type: body.type,
      payload: body.payload,
    });
    return successResponse('Call signal created successfully.', signal);
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
    return successResponse('Call session ended successfully.', session);
  }
}
