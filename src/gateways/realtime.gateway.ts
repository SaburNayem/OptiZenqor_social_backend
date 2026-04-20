import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { PlatformDataService } from '../data/platform-data.service';
import { RealtimeStateService } from '../services/realtime-state.service';

@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: process.env.CLIENT_URL ?? true,
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly platformData: PlatformDataService,
    private readonly realtimeState: RealtimeStateService,
  ) {}

  handleConnection(client: Socket) {
    try {
      const token = this.readAuthToken(client);
      const fallbackUserId = this.readFallbackUserId(client);
      const user = this.realtimeState.authenticateClient(token, fallbackUserId);
      client.data.userId = user.id;
      client.join(`user:${user.id}`);

      const presence = this.realtimeState.registerConnection(user.id, client.id);
      client.emit('session.ready', {
        userId: user.id,
        socketId: client.id,
        presence,
        contract: this.realtimeState.getSocketContract(),
      });
      this.server.emit('presence.updated', presence);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Realtime authentication failed.';
      client.emit('session.error', { message });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const presence = this.realtimeState.unregisterConnection(client.id);
    this.server.emit('presence.updated', presence);
  }

  @SubscribeMessage('presence.subscribe')
  handlePresenceSubscribe(@ConnectedSocket() client: Socket) {
    const snapshot = this.realtimeState.getPresenceSnapshot();
    client.emit('presence.updated', snapshot);
    return snapshot;
  }

  @SubscribeMessage('thread.join')
  handleThreadJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { threadId: string },
  ) {
    const userId = this.requireUserId(client);
    client.join(`thread:${body.threadId}`);
    const state = this.realtimeState.joinThread(body.threadId, userId);
    this.server.to(`thread:${body.threadId}`).emit('thread.presence.updated', state);
    return state;
  }

  @SubscribeMessage('thread.leave')
  handleThreadLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { threadId: string },
  ) {
    const userId = this.requireUserId(client);
    client.leave(`thread:${body.threadId}`);
    const state = this.realtimeState.leaveThread(body.threadId, userId);
    this.server.to(`thread:${body.threadId}`).emit('thread.presence.updated', state);
    return state;
  }

  @SubscribeMessage('thread.typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { threadId: string; isTyping: boolean },
  ) {
    const userId = this.requireUserId(client);
    const state = this.realtimeState.setTyping(body.threadId, userId, body.isTyping);
    this.server.to(`thread:${body.threadId}`).emit('thread.presence.updated', state);
    return state;
  }

  @SubscribeMessage('thread.message.send')
  handleMessageSend(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    body: {
      threadId: string;
      text: string;
      attachments?: string[];
      replyToMessageId?: string;
      kind?: 'text' | 'image' | 'video' | 'audio' | 'file';
      mediaPath?: string;
    },
  ) {
    const userId = this.requireUserId(client);
    const message = this.platformData.createMessage(body.threadId, userId, body.text, {
      attachments: body.attachments,
      replyToMessageId: body.replyToMessageId,
      kind: body.kind,
      mediaPath: body.mediaPath,
    });
    this.platformData.updateMessageDeliveryState(body.threadId, message.id, 'delivered');

    const eventPayload = {
      ...message,
      sender: this.platformData.getUser(userId),
    };

    this.server.to(`thread:${body.threadId}`).emit('chat.message.created', eventPayload);

    for (const participantId of this.platformData
      .getThreadParticipantIds(body.threadId)
      .filter((id) => id !== userId)) {
      this.server.to(`user:${participantId}`).emit('notification.created', {
        type: 'chat.message.created',
        threadId: body.threadId,
        messageId: message.id,
        senderId: userId,
      });
    }

    return eventPayload;
  }

  @SubscribeMessage('thread.message.read')
  handleMessageRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { threadId: string },
  ) {
    const userId = this.requireUserId(client);
    const receipt = this.platformData.markThreadMessagesRead(body.threadId, userId);
    this.server.to(`thread:${body.threadId}`).emit('chat.message.read', receipt);
    return receipt;
  }

  @SubscribeMessage('call.create')
  handleCallCreate(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { recipientIds?: string[]; threadId?: string; mode: 'voice' | 'video' },
  ) {
    const userId = this.requireUserId(client);
    const session = this.realtimeState.createCallSession({
      initiatorId: userId,
      recipientIds: body.recipientIds,
      threadId: body.threadId,
      mode: body.mode,
    });
    client.join(session.roomName);
    this.server.to(`user:${userId}`).emit('call.session.created', session);
    for (const recipientId of session.recipientIds) {
      this.server.to(`user:${recipientId}`).emit('call.session.created', session);
    }
    return session;
  }

  @SubscribeMessage('call.join')
  handleCallJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { sessionId: string },
  ) {
    const userId = this.requireUserId(client);
    const session = this.realtimeState.joinCallSession(body.sessionId, userId);
    client.join(session.roomName);
    this.server.to(session.roomName).emit('call.participant.joined', {
      sessionId: session.id,
      userId,
      participants: session.participants,
    });
    return session;
  }

  @SubscribeMessage('call.leave')
  handleCallLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { sessionId: string },
  ) {
    const userId = this.requireUserId(client);
    const session = this.realtimeState.leaveCallSession(body.sessionId, userId);
    client.leave(session.roomName);
    this.server.to(session.roomName).emit('call.participant.left', {
      sessionId: session.id,
      userId,
      participants: session.participants,
    });
    return session;
  }

  @SubscribeMessage('call.signal')
  handleCallSignal(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    body: {
      sessionId: string;
      toUserId?: string;
      type: 'offer' | 'answer' | 'ice-candidate' | 'renegotiate';
      payload: Record<string, unknown>;
    },
  ) {
    const userId = this.requireUserId(client);
    const signal = this.realtimeState.addCallSignal({
      sessionId: body.sessionId,
      fromUserId: userId,
      toUserId: body.toUserId,
      type: body.type,
      payload: body.payload,
    });
    const session = this.realtimeState.getCallSession(body.sessionId);

    if (body.toUserId) {
      this.server.to(`user:${body.toUserId}`).emit('call.signal', {
        sessionId: body.sessionId,
        roomName: session.roomName,
        ...signal,
      });
    } else {
      this.server.to(session.roomName).emit('call.signal', {
        sessionId: body.sessionId,
        roomName: session.roomName,
        ...signal,
      });
    }

    return signal;
  }

  @SubscribeMessage('call.end')
  handleCallEnd(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { sessionId: string; reason?: string },
  ) {
    const userId = this.requireUserId(client);
    const session = this.realtimeState.endCallSession(body.sessionId, userId, body.reason);
    this.server.to(session.roomName).emit('call.ended', session);
    return session;
  }

  private readAuthToken(client: Socket) {
    const authToken =
      typeof client.handshake.auth?.token === 'string'
        ? client.handshake.auth.token
        : undefined;
    const headerToken =
      typeof client.handshake.headers.authorization === 'string'
        ? client.handshake.headers.authorization.replace(/^Bearer\s+/i, '')
        : undefined;
    return authToken ?? headerToken;
  }

  private readFallbackUserId(client: Socket) {
    const authUserId =
      typeof client.handshake.auth?.userId === 'string'
        ? client.handshake.auth.userId
        : undefined;
    const queryUserId =
      typeof client.handshake.query.userId === 'string'
        ? client.handshake.query.userId
        : undefined;
    return authUserId ?? queryUserId;
  }

  private requireUserId(client: Socket) {
    const userId = client.data.userId as string | undefined;
    if (!userId) {
      this.logger.warn(`Socket ${client.id} attempted to use realtime without auth context.`);
      throw new Error('Realtime user context missing.');
    }
    return userId;
  }
}
