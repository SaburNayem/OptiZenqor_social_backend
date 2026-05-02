import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { QueryResultRow } from 'pg';
import { makeId } from '../common/id.util';
import { CoreDatabaseService } from './core-database.service';
import { DatabaseService } from './database.service';
import { StateSnapshotService } from './state-snapshot.service';

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
  id?: string;
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

type CallSessionRow = QueryResultRow & {
  id: string;
  room_name: string;
  thread_id: string | null;
  initiator_id: string;
  recipient_ids: string[];
  mode: CallMode;
  status: CallStatus;
  started_at: string | Date;
  ended_at: string | Date | null;
  ended_by: string | null;
  reason: string | null;
};

type CallParticipantRow = QueryResultRow & {
  session_id: string;
  user_id: string;
  state: ParticipantState;
  joined_at: string | Date | null;
  left_at: string | Date | null;
};

type CallSignalRow = QueryResultRow & {
  id: string;
  session_id: string;
  from_user_id: string;
  to_user_id: string | null;
  type: string;
  payload: Record<string, unknown>;
  created_at: string | Date;
};

@Injectable()
export class RealtimeStateService implements OnModuleInit {
  constructor(
    private readonly coreDatabase: CoreDatabaseService,
    private readonly database: DatabaseService,
    private readonly stateSnapshots: StateSnapshotService,
  ) {}

  private readonly socketUsers = new Map<string, string>();
  private readonly userSockets = new Map<string, Set<string>>();
  private readonly threadMembers = new Map<string, Set<string>>();
  private readonly threadTyping = new Map<string, Set<string>>();
  private readonly callSessions = new Map<string, CallSessionRecord>();
  private readonly lastSeen = new Map<string, string>();
  private useDatabase = false;

  async onModuleInit() {
    this.useDatabase = this.database.getHealth().enabled;
    if (this.useDatabase) {
      await this.ensureSchema();
      await this.loadCallSessionsFromDatabase();
      return;
    }
    await this.loadCallSessionsFromSnapshots();
  }

  async authenticateClient(accessToken?: string, fallbackUserId?: string) {
    const userFromToken = accessToken
      ? await this.coreDatabase.resolveUserFromAccessToken(accessToken)
      : null;
    if (userFromToken) {
      return userFromToken;
    }
    const allowFallback = (process.env.REALTIME_ALLOW_USERID_FALLBACK ?? 'false') === 'true';
    if (allowFallback && fallbackUserId) {
      return this.coreDatabase.getUser(fallbackUserId);
    }
    throw new NotFoundException('Realtime authentication failed.');
  }

  registerConnection(userId: string, socketId: string) {
    this.socketUsers.set(socketId, userId);
    const userSocketSet = this.userSockets.get(userId) ?? new Set<string>();
    userSocketSet.add(socketId);
    this.userSockets.set(userId, userSocketSet);
    this.lastSeen.set(userId, new Date().toISOString());
    void this.persistPresenceSnapshots();
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

    void this.persistPresenceSnapshots();
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

  async joinThread(threadId: string, userId: string) {
    await this.coreDatabase.getThread(threadId);
    await this.coreDatabase.getUser(userId);
    const members = this.threadMembers.get(threadId) ?? new Set<string>();
    members.add(userId);
    this.threadMembers.set(threadId, members);
    void this.persistPresenceSnapshots();
    return this.getThreadState(threadId);
  }

  async leaveThread(threadId: string, userId: string) {
    const members = this.threadMembers.get(threadId);
    members?.delete(userId);
    const typing = this.threadTyping.get(threadId);
    typing?.delete(userId);
    void this.persistPresenceSnapshots();
    return this.getThreadState(threadId);
  }

  async setTyping(threadId: string, userId: string, isTyping: boolean) {
    await this.coreDatabase.getThread(threadId);
    const typing = this.threadTyping.get(threadId) ?? new Set<string>();
    if (isTyping) {
      typing.add(userId);
    } else {
      typing.delete(userId);
    }
    this.threadTyping.set(threadId, typing);
    void this.persistPresenceSnapshots();
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

  async createCallSession(input: {
    initiatorId: string;
    recipientIds?: string[];
    threadId?: string;
    mode: CallMode;
  }) {
    await this.coreDatabase.getUser(input.initiatorId);
    for (const id of input.recipientIds ?? []) {
      await this.coreDatabase.getUser(id);
    }
    if (input.threadId) {
      await this.coreDatabase.getThread(input.threadId);
    }

    const recipients =
      input.recipientIds && input.recipientIds.length > 0
        ? input.recipientIds
        : input.threadId
          ? (await this.coreDatabase.getThreadParticipantIds(input.threadId)).filter(
              (id) => id !== input.initiatorId,
            )
          : [];

    const session: CallSessionRecord = {
      id: makeId('call_session'),
      roomName: `call:${makeId('session')}`,
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

    const initiator = await this.coreDatabase.getUser(input.initiatorId);
    for (const recipientId of recipients) {
      await this.coreDatabase.pushNotification({
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

    await this.saveCallSession(session);
    await this.saveCallLifecycleSnapshot(session.id, input.initiatorId, 'ringing', {
      mode: input.mode,
      recipientIds: recipients,
      threadId: input.threadId ?? null,
    });
    return session;
  }

  getCallSessions() {
    return [...this.callSessions.values()].sort((left, right) =>
      right.startedAt.localeCompare(left.startedAt),
    );
  }

  getCallSession(id: string) {
    const session = this.callSessions.get(id);
    if (!session) {
      throw new NotFoundException(`Call session ${id} not found`);
    }
    return session;
  }

  async joinCallSession(id: string, userId: string) {
    const session = this.getCallSession(id);
    await this.coreDatabase.getUser(userId);
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
    await this.saveCallSession(session);
    await this.saveCallLifecycleSnapshot(session.id, userId, 'ongoing', {
      participantState: 'joined',
    });
    return session;
  }

  async leaveCallSession(id: string, userId: string) {
    const session = this.getCallSession(id);
    const participant = session.participants.find((item) => item.userId === userId);
    if (participant) {
      participant.state = 'left';
      participant.leftAt = new Date().toISOString();
    }
    await this.saveCallSession(session);
    await this.saveCallLifecycleSnapshot(session.id, userId, session.status, {
      participantState: 'left',
    });
    return session;
  }

  async addCallSignal(input: {
    sessionId: string;
    fromUserId: string;
    toUserId?: string;
    type: string;
    payload: Record<string, unknown>;
  }) {
    const session = this.getCallSession(input.sessionId);
    await this.coreDatabase.getUser(input.fromUserId);
    if (input.toUserId) {
      await this.coreDatabase.getUser(input.toUserId);
    }
    const signal: CallSignalRecord = {
      id: makeId('call_signal'),
      fromUserId: input.fromUserId,
      toUserId: input.toUserId,
      type: input.type,
      payload: input.payload,
      createdAt: new Date().toISOString(),
    };
    session.signals.push(signal);
    await this.saveCallSignal(input.sessionId, signal);
    return signal;
  }

  endCallSession(id: string, endedBy: string, reason?: string) {
    const session = this.getCallSession(id);
    session.status = 'ended';
    session.endedAt = new Date().toISOString();
    session.endedBy = endedBy;
    session.reason = reason ?? 'completed';
    void this.saveCallSession(session);
    void this.saveCallLifecycleSnapshot(session.id, endedBy, 'ended', {}, session.reason);
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
        'presence:update',
        'thread.presence.updated',
        'chat.message.created',
        'message:new',
        'chat.message.read',
        'message:read',
        'notification.created',
        'call.session.created',
        'call.participant.joined',
        'call.participant.left',
        'call.signal',
        'call.ended',
      ],
    };
  }

  private async ensureSchema() {
    await this.database.query(`
      create table if not exists app_call_sessions (
        id text primary key,
        room_name text not null,
        thread_id text null references chat_threads(id) on delete set null,
        initiator_id text not null references app_users(id) on delete cascade,
        recipient_ids jsonb not null default '[]'::jsonb,
        mode text not null,
        status text not null,
        started_at timestamptz not null,
        ended_at timestamptz null,
        ended_by text null references app_users(id) on delete set null,
        reason text null
      );
    `);
    await this.database.query(`
      create table if not exists app_call_session_participants (
        session_id text not null references app_call_sessions(id) on delete cascade,
        user_id text not null references app_users(id) on delete cascade,
        state text not null,
        joined_at timestamptz null,
        left_at timestamptz null,
        primary key (session_id, user_id)
      );
    `);
    await this.database.query(`
      create table if not exists app_call_session_signals (
        id text primary key,
        session_id text not null references app_call_sessions(id) on delete cascade,
        from_user_id text not null references app_users(id) on delete cascade,
        to_user_id text null references app_users(id) on delete set null,
        type text not null,
        payload jsonb not null default '{}'::jsonb,
        created_at timestamptz not null
      );
    `);
    await this.database.query(`
      create table if not exists app_chat_presence_snapshots (
        id text primary key,
        user_id text not null references app_users(id) on delete cascade,
        thread_id text null references chat_threads(id) on delete set null,
        online boolean not null default false,
        socket_count integer not null default 0,
        typing_thread_ids jsonb not null default '[]'::jsonb,
        last_seen_at timestamptz not null,
        captured_at timestamptz not null,
        metadata jsonb not null default '{}'::jsonb
      );
    `);
    await this.database.query(`
      create table if not exists app_call_lifecycle_snapshots (
        id text primary key,
        call_session_id text not null references app_call_sessions(id) on delete cascade,
        actor_user_id text null references app_users(id) on delete set null,
        status text not null,
        reason text null,
        payload jsonb not null default '{}'::jsonb,
        captured_at timestamptz not null
      );
    `);
  }

  private async loadCallSessionsFromSnapshots() {
    const snapshot = await this.stateSnapshots.load<CallSessionRecord[]>(
      'realtime_call_sessions',
    );
    if (!snapshot) {
      return;
    }
    this.callSessions.clear();
    for (const session of snapshot) {
      this.callSessions.set(session.id, session);
    }
  }

  private async loadCallSessionsFromDatabase() {
    const sessions = await this.database.query<CallSessionRow>(
      `select * from app_call_sessions order by started_at desc`,
    );
    const participants = await this.database.query<CallParticipantRow>(
      `select * from app_call_session_participants order by joined_at asc nulls last`,
    );
    const signals = await this.database.query<CallSignalRow>(
      `select * from app_call_session_signals order by created_at asc`,
    );

    const participantsBySession = new Map<string, CallParticipantRecord[]>();
    for (const row of participants.rows) {
      const list = participantsBySession.get(row.session_id) ?? [];
      list.push({
        userId: row.user_id,
        state: row.state,
        joinedAt: row.joined_at ? this.iso(row.joined_at) : null,
        leftAt: row.left_at ? this.iso(row.left_at) : null,
      });
      participantsBySession.set(row.session_id, list);
    }

    const signalsBySession = new Map<string, CallSignalRecord[]>();
    for (const row of signals.rows) {
      const list = signalsBySession.get(row.session_id) ?? [];
      list.push({
        id: row.id,
        fromUserId: row.from_user_id,
        toUserId: row.to_user_id ?? undefined,
        type: row.type,
        payload: row.payload ?? {},
        createdAt: this.iso(row.created_at),
      });
      signalsBySession.set(row.session_id, list);
    }

    this.callSessions.clear();
    for (const row of sessions.rows) {
      this.callSessions.set(row.id, {
        id: row.id,
        roomName: row.room_name,
        threadId: row.thread_id ?? undefined,
        initiatorId: row.initiator_id,
        recipientIds: Array.isArray(row.recipient_ids) ? row.recipient_ids : [],
        mode: row.mode,
        status: row.status,
        startedAt: this.iso(row.started_at),
        endedAt: row.ended_at ? this.iso(row.ended_at) : null,
        endedBy: row.ended_by,
        reason: row.reason,
        participants: participantsBySession.get(row.id) ?? [],
        signals: signalsBySession.get(row.id) ?? [],
      });
    }
  }

  private async saveCallSession(session: CallSessionRecord) {
    if (!this.useDatabase) {
      await this.persistSnapshotState();
      return;
    }

    this.callSessions.set(session.id, session);
    await this.database.query(
      `insert into app_call_sessions (
        id, room_name, thread_id, initiator_id, recipient_ids, mode, status,
        started_at, ended_at, ended_by, reason
      ) values (
        $1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,$10,$11
      )
      on conflict (id) do update
      set room_name = excluded.room_name,
          thread_id = excluded.thread_id,
          initiator_id = excluded.initiator_id,
          recipient_ids = excluded.recipient_ids,
          mode = excluded.mode,
          status = excluded.status,
          started_at = excluded.started_at,
          ended_at = excluded.ended_at,
          ended_by = excluded.ended_by,
          reason = excluded.reason`,
      [
        session.id,
        session.roomName,
        session.threadId ?? null,
        session.initiatorId,
        JSON.stringify(session.recipientIds),
        session.mode,
        session.status,
        session.startedAt,
        session.endedAt,
        session.endedBy,
        session.reason,
      ],
    );
    await this.database.query(
      `delete from app_call_session_participants where session_id = $1`,
      [session.id],
    );
    for (const participant of session.participants) {
      await this.database.query(
        `insert into app_call_session_participants (
          session_id, user_id, state, joined_at, left_at
        ) values ($1,$2,$3,$4,$5)`,
        [
          session.id,
          participant.userId,
          participant.state,
          participant.joinedAt,
          participant.leftAt,
        ],
      );
    }
  }

  private async saveCallSignal(sessionId: string, signal: CallSignalRecord) {
    if (!this.useDatabase) {
      await this.persistSnapshotState();
      return;
    }
    await this.database.query(
      `insert into app_call_session_signals (
        id, session_id, from_user_id, to_user_id, type, payload, created_at
      ) values ($1,$2,$3,$4,$5,$6::jsonb,$7)`,
      [
        signal.id,
        sessionId,
        signal.fromUserId,
        signal.toUserId ?? null,
        signal.type,
        JSON.stringify(signal.payload),
        signal.createdAt,
      ],
    );
  }

  private async persistPresenceSnapshots() {
    if (!this.useDatabase) {
      return;
    }

    const typingThreadIdsByUser = new Map<string, string[]>();
    for (const [threadId, users] of this.threadTyping.entries()) {
      for (const userId of users) {
        const list = typingThreadIdsByUser.get(userId) ?? [];
        if (!list.includes(threadId)) {
          list.push(threadId);
        }
        typingThreadIdsByUser.set(userId, list);
      }
    }

    for (const [userId, lastSeen] of this.lastSeen.entries()) {
      await this.database.query(
        `insert into app_chat_presence_snapshots (
          id, user_id, thread_id, online, socket_count, typing_thread_ids, last_seen_at, captured_at, metadata
        ) values ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9::jsonb)`,
        [
          makeId('presence'),
          userId,
          null,
          this.userSockets.has(userId),
          this.userSockets.get(userId)?.size ?? 0,
          JSON.stringify(typingThreadIdsByUser.get(userId) ?? []),
          this.userSockets.has(userId) ? new Date().toISOString() : lastSeen,
          new Date().toISOString(),
          JSON.stringify({ source: 'realtime.gateway' }),
        ],
      );
    }
  }

  private async saveCallLifecycleSnapshot(
    callSessionId: string,
    actorUserId: string | null,
    status: string,
    payload: Record<string, unknown> = {},
    reason?: string | null,
  ) {
    if (!this.useDatabase) {
      return;
    }

    await this.database.query(
      `insert into app_call_lifecycle_snapshots (
        id, call_session_id, actor_user_id, status, reason, payload, captured_at
      ) values ($1,$2,$3,$4,$5,$6::jsonb,$7)`,
      [
        makeId('call_lifecycle'),
        callSessionId,
        actorUserId,
        status,
        reason ?? null,
        JSON.stringify(payload),
        new Date().toISOString(),
      ],
    );
  }

  private async persistSnapshotState() {
    await this.stateSnapshots.save('realtime_call_sessions', [
      ...this.callSessions.values(),
    ]);
  }

  private iso(value: string | Date) {
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
  }
}
