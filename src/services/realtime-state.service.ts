import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { EcosystemDataService } from '../data/ecosystem-data.service';
import { PlatformDataService } from '../data/platform-data.service';

type CallMode = 'voice' | 'video';
type CallStatus = 'ringing' | 'ongoing' | 'ended' | 'missed';
type ParticipantState = 'invited' | 'joined' | 'left';

interface CallParticipantRecord {
  userId: string;
  state: ParticipantState;
  joinedAt: string | null;
  leftAt: string | null;
}

interface CallSignalRecord {
  fromUserId: string;
  toUserId?: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

interface CallSessionRecord {
  id: string;
  roomName: string;
  threadId?: string;
  initiatorId: string;
  recipientIds: string[];
  mode: CallMode;
  status: CallStatus;
  startedAt: string;
  endedAt: string | null;
  endedBy: string | null;
  reason: string | null;
  participants: CallParticipantRecord[];
  signals: CallSignalRecord[];
}

@Injectable()
export class RealtimeStateService {
  constructor(
    private readonly platformData: PlatformDataService,
    private readonly ecosystemData: EcosystemDataService,
  ) {}

  private readonly socketUsers = new Map<string, string>();
  private readonly userSockets = new Map<string, Set<string>>();
  private readonly threadMembers = new Map<string, Set<string>>();
  private readonly threadTyping = new Map<string, Set<string>>();
  private readonly callSessions = new Map<string, CallSessionRecord>();
  private readonly lastSeen = new Map<string, string>();

  authenticateClient(accessToken?: string, fallbackUserId?: string) {
    const userFromToken = accessToken
      ? this.platformData.resolveUserFromAccessToken(accessToken)
      : null;
    if (userFromToken) {
      return userFromToken;
    }
    const allowFallback = (process.env.REALTIME_ALLOW_USERID_FALLBACK ?? 'false') === 'true';
    if (allowFallback && fallbackUserId) {
      return this.platformData.getUser(fallbackUserId);
    }
    throw new NotFoundException('Realtime authentication failed.');
  }

  registerConnection(userId: string, socketId: string) {
    this.socketUsers.set(socketId, userId);
    const userSocketSet = this.userSockets.get(userId) ?? new Set<string>();
    userSocketSet.add(socketId);
    this.userSockets.set(userId, userSocketSet);
    this.lastSeen.set(userId, new Date().toISOString());
    return this.getPresenceSnapshot();
  }

  unregisterConnection(socketId: string) {
    const userId = this.socketUsers.get(socketId);
    if (!userId) {
      return this.getPresenceSnapshot();
    }

    this.socketUsers.delete(socketId);
    const userSocketSet = this.userSockets.get(userId);
    if (userSocketSet) {
      userSocketSet.delete(socketId);
      if (userSocketSet.size === 0) {
        this.userSockets.delete(userId);
        this.lastSeen.set(userId, new Date().toISOString());
      }
    }

    for (const members of this.threadMembers.values()) {
      members.delete(userId);
    }
    for (const typing of this.threadTyping.values()) {
      typing.delete(userId);
    }

    return this.getPresenceSnapshot();
  }

  getPresenceSnapshot() {
    return {
      onlineUserIds: [...this.userSockets.keys()],
      users: [...this.lastSeen.entries()].map(([userId, seenAt]) => ({
        userId,
        online: this.userSockets.has(userId),
        socketCount: this.userSockets.get(userId)?.size ?? 0,
        lastSeen: this.userSockets.has(userId) ? 'now' : seenAt,
      })),
      threadTyping: [...this.threadTyping.entries()].map(([threadId, users]) => ({
        threadId,
        userIds: [...users],
      })),
    };
  }

  joinThread(threadId: string, userId: string) {
    this.platformData.getThread(threadId);
    this.platformData.getUser(userId);
    const members = this.threadMembers.get(threadId) ?? new Set<string>();
    members.add(userId);
    this.threadMembers.set(threadId, members);
    return this.getThreadState(threadId);
  }

  leaveThread(threadId: string, userId: string) {
    const members = this.threadMembers.get(threadId);
    members?.delete(userId);
    const typing = this.threadTyping.get(threadId);
    typing?.delete(userId);
    return this.getThreadState(threadId);
  }

  setTyping(threadId: string, userId: string, isTyping: boolean) {
    this.platformData.getThread(threadId);
    const typing = this.threadTyping.get(threadId) ?? new Set<string>();
    if (isTyping) {
      typing.add(userId);
    } else {
      typing.delete(userId);
    }
    this.threadTyping.set(threadId, typing);
    return this.getThreadState(threadId);
  }

  getThreadState(threadId: string) {
    return {
      threadId,
      activeUserIds: [...(this.threadMembers.get(threadId) ?? new Set<string>())],
      typingUserIds: [...(this.threadTyping.get(threadId) ?? new Set<string>())],
    };
  }

  getRtcConfig() {
    const stunUrls = (process.env.RTC_STUN_URLS ??
      'stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const turnUrls = (process.env.RTC_TURN_URLS ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    const iceServers: Array<
      { urls: string[] } | { urls: string[]; username: string; credential: string }
    > = [{ urls: stunUrls }];
    if (turnUrls.length > 0) {
      iceServers.push({
        urls: turnUrls,
        username: process.env.RTC_TURN_USERNAME ?? '',
        credential: process.env.RTC_TURN_CREDENTIAL ?? '',
      });
    }

    return {
      iceServers,
      bundlePolicy: 'balanced',
      rtcpMuxPolicy: 'require',
      iceCandidatePoolSize: 4,
    };
  }

  createCallSession(input: {
    initiatorId: string;
    recipientIds?: string[];
    threadId?: string;
    mode: CallMode;
  }) {
    this.platformData.getUser(input.initiatorId);
    input.recipientIds?.forEach((id) => this.platformData.getUser(id));
    if (input.threadId) {
      this.platformData.getThread(input.threadId);
    }

    const recipients =
      input.recipientIds && input.recipientIds.length > 0
        ? input.recipientIds
        : input.threadId
          ? this.platformData
              .getThreadParticipantIds(input.threadId)
              .filter((id) => id !== input.initiatorId)
          : [];

    const session: CallSessionRecord = {
      id: `call_session_${randomUUID().replace(/-/g, '')}`,
      roomName: `call:${Date.now()}`,
      threadId: input.threadId,
      initiatorId: input.initiatorId,
      recipientIds: recipients,
      mode: input.mode,
      status: 'ringing',
      startedAt: new Date().toISOString(),
      endedAt: null,
      endedBy: null,
      reason: null,
      participants: [
        {
          userId: input.initiatorId,
          state: 'joined',
          joinedAt: new Date().toISOString(),
          leftAt: null,
        },
        ...recipients.map((userId) => ({
          userId,
          state: 'invited' as ParticipantState,
          joinedAt: null,
          leftAt: null,
        })),
      ],
      signals: [],
    };
    this.callSessions.set(session.id, session);

    const initiator = this.platformData.getUser(input.initiatorId);
    for (const recipientId of recipients) {
      this.ecosystemData.pushNotification({
        recipientId,
        title: `${initiator.name} is calling you`,
        body: `${input.mode === 'video' ? 'Video' : 'Voice'} call started.`,
        routeName: `/calls/sessions/${session.id}`,
        entityId: session.id,
        type: 'social',
        metadata: {
          mode: input.mode,
          initiatorId: input.initiatorId,
          threadId: input.threadId ?? null,
        },
      });
    }

    return session;
  }

  getCallSessions() {
    return [...this.callSessions.values()];
  }

  getCallSession(id: string) {
    const session = this.callSessions.get(id);
    if (!session) {
      throw new NotFoundException(`Call session ${id} not found`);
    }
    return session;
  }

  joinCallSession(id: string, userId: string) {
    const session = this.getCallSession(id);
    this.platformData.getUser(userId);
    const participant = session.participants.find((item) => item.userId === userId);
    if (participant) {
      participant.state = 'joined';
      participant.joinedAt = participant.joinedAt ?? new Date().toISOString();
      participant.leftAt = null;
    } else {
      session.participants.push({
        userId,
        state: 'joined',
        joinedAt: new Date().toISOString(),
        leftAt: null,
      });
    }
    session.status = 'ongoing';
    return session;
  }

  leaveCallSession(id: string, userId: string) {
    const session = this.getCallSession(id);
    const participant = session.participants.find((item) => item.userId === userId);
    if (participant) {
      participant.state = 'left';
      participant.leftAt = new Date().toISOString();
    }
    return session;
  }

  addCallSignal(input: {
    sessionId: string;
    fromUserId: string;
    toUserId?: string;
    type: string;
    payload: Record<string, unknown>;
  }) {
    const session = this.getCallSession(input.sessionId);
    this.platformData.getUser(input.fromUserId);
    if (input.toUserId) {
      this.platformData.getUser(input.toUserId);
    }
    const signal: CallSignalRecord = {
      fromUserId: input.fromUserId,
      toUserId: input.toUserId,
      type: input.type,
      payload: input.payload,
      createdAt: new Date().toISOString(),
    };
    session.signals.push(signal);
    return signal;
  }

  endCallSession(id: string, endedBy: string, reason?: string) {
    const session = this.getCallSession(id);
    session.status = 'ended';
    session.endedAt = new Date().toISOString();
    session.endedBy = endedBy;
    session.reason = reason ?? 'completed';
    return session;
  }

  getSocketContract() {
    return {
      namespace: '/realtime',
      auth: {
        tokenField: 'auth.token',
        fallbackUserIdField: 'auth.userId',
      },
      clientEvents: [
        'presence.subscribe',
        'thread.join',
        'thread.leave',
        'thread.typing',
        'thread.message.send',
        'thread.message.read',
        'call.create',
        'call.join',
        'call.leave',
        'call.signal',
        'call.end',
      ],
      serverEvents: [
        'session.ready',
        'presence.updated',
        'thread.presence.updated',
        'chat.message.created',
        'chat.message.read',
        'notification.created',
        'call.session.created',
        'call.participant.joined',
        'call.participant.left',
        'call.signal',
        'call.ended',
      ],
    };
  }
}
