import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'crypto';
import { QueryResultRow } from 'pg';
import { makeId } from '../common/id.util';
import { coreSeedCommentReactions, coreSeedFollows, coreSeedMessages, coreSeedNotifications, coreSeedPostComments, coreSeedPostReactions, coreSeedPosts, coreSeedThreads, coreSeedUsers } from '../database/core-seed';
import { DatabaseService } from './database.service';
import { JwtLikePayload, JwtTokenService } from './jwt-token.service';

type UserRow = QueryResultRow & {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  interests: string[];
  role: string;
  verification: string;
  status: string;
  followers: number;
  following: number;
  wallet_summary: string;
  health: string;
  reports: string;
  last_active: string;
  email_verified: boolean;
  blocked: boolean;
  password_hash: string;
  website?: string | null;
  location?: string | null;
  cover_image_url?: string | null;
  is_private?: boolean | null;
  note?: string | null;
  note_privacy?: string | null;
  supporter_badge?: boolean | null;
};

type PostRow = QueryResultRow & {
  id: string;
  author_id: string;
  caption: string;
  media: string[];
  tags: string[];
  likes: number;
  comments: number;
  shares: number;
  views: number;
  status: string;
  type: string;
  created_at: Date | string;
};

type ThreadRow = QueryResultRow & {
  id: string;
  title: string;
  participants_label: string;
  flag: string | null;
  summary: string;
};

type MessageRow = QueryResultRow & {
  id: string;
  thread_id: string;
  sender_id: string;
  text: string;
  read: boolean;
  timestamp: Date | string;
  attachments: string[];
  reply_to_message_id: string | null;
  delivery_state: 'sent' | 'delivered' | 'read';
  kind: 'text' | 'image' | 'video' | 'audio' | 'file';
  media_path: string | null;
};

type BuddyRequestRow = QueryResultRow & {
  id: string;
  requester_id: string;
  target_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: Date | string;
  responded_at: Date | string | null;
  responded_by: string | null;
};

type BuddyRelationRow = QueryResultRow & {
  id: string;
  user_a_id: string;
  user_b_id: string;
  created_at: Date | string;
};

type NotificationRow = QueryResultRow & {
  id: string;
  recipient_id: string;
  title: string;
  body: string;
  created_at: Date | string;
  read: boolean;
  type: 'social' | 'commerce' | 'security' | 'system';
  route_name: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
};

type CommentRow = QueryResultRow & {
  id: string;
  post_id: string;
  author_id: string | null;
  author: string;
  message: string;
  reply_to: string | null;
  created_at: Date | string;
  like_count: number;
  is_liked_by_me: boolean;
  is_reported: boolean;
  is_edited: boolean;
  mentions: string[];
};

type SerializedComment = {
  id: string;
  postId: string;
  authorId: string | null;
  author: string;
  message: string;
  replyTo: string | null;
  createdAt: string;
  likeCount: number;
  isLikedByMe: boolean;
  isReported: boolean;
  isEdited: boolean;
  reactions: Record<string, number>;
  mentions: string[];
  replyCount: number;
  replies: SerializedComment[];
};

@Injectable()
export class CoreDatabaseService implements OnModuleInit {
  constructor(
    private readonly database: DatabaseService,
    private readonly jwtTokens: JwtTokenService,
  ) {}

  private getTokenTtlSeconds(value: string | undefined, fallbackSeconds: number) {
    const normalized = value?.trim().toLowerCase();
    if (!normalized) {
      return fallbackSeconds;
    }

    const exactNumber = Number(normalized);
    if (Number.isFinite(exactNumber) && exactNumber > 0) {
      return Math.floor(exactNumber);
    }

    const match = normalized.match(/^(\d+)([smhd])$/);
    if (!match) {
      return fallbackSeconds;
    }

    const amount = Number(match[1]);
    switch (match[2]) {
      case 's':
        return amount;
      case 'm':
        return amount * 60;
      case 'h':
        return amount * 60 * 60;
      case 'd':
        return amount * 60 * 60 * 24;
      default:
        return fallbackSeconds;
    }
  }

  async onModuleInit() {
    if (!this.database.getHealth().enabled) {
      return;
    }
    await this.ensureSchema();
    await this.seedCoreData();
  }

  async getDemoAuthAccounts() {
    const { rows } = await this.database.query<UserRow>(
      `select * from app_users order by created_at asc`,
    );
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      username: row.username,
      email: row.email,
      role: row.role,
      password: '123456',
      emailVerified: row.email_verified,
    }));
  }

  async getUsers(role?: string) {
    const { rows } = role
      ? await this.database.query<UserRow>(
          `select * from app_users where role = $1 order by created_at desc`,
          [role],
        )
      : await this.database.query<UserRow>(
          `select * from app_users order by created_at desc`,
        );
    return rows.map((row) => this.mapUser(row));
  }

  async getUser(id: string) {
    const { rows } = await this.database.query<UserRow>(
      `select * from app_users where id = $1 limit 1`,
      [id],
    );
    const row = rows[0];
    if (!row) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return this.mapUser(row);
  }

  async getUserByEmail(email: string) {
    const { rows } = await this.database.query<UserRow>(
      `select * from app_users where lower(email) = lower($1) limit 1`,
      [email],
    );
    const row = rows[0];
    if (!row) {
      throw new UnauthorizedException(
        'Invalid credentials. Use one of the seeded demo emails shown in /auth/demo-accounts.',
      );
    }
    return row;
  }

  async findUserByEmailOptional(email: string) {
    const { rows } = await this.database.query<UserRow>(
      `select * from app_users where lower(email) = lower($1) limit 1`,
      [email],
    );
    const row = rows[0];
    return row ? this.mapUser(row) : null;
  }

  async createUser(input: {
    name: string;
    username: string;
    email: string;
    password: string;
    role: string;
    bio?: string;
    avatar?: string;
    interests?: string[];
  }) {
    await this.assertEmailAndUsernameAvailable(input.email, input.username);
    const id = makeId('user');
    const passwordHash = this.hashPassword(input.password);
    const interests = [...new Set((input.interests ?? []).map((interest) => interest.trim()).filter(Boolean))];
    await this.database.query(
      `insert into app_users (
        id, name, username, email, avatar, bio, interests, role, verification, status,
        followers, following, wallet_summary, health, reports, last_active,
        email_verified, blocked, password_hash
      ) values (
        $1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,
        $17,$18,$19
      )`,
      [
        id,
        input.name,
        input.username,
        input.email,
        input.avatar?.trim() || 'https://placehold.co/120x120',
        input.bio?.trim() ?? '',
        JSON.stringify(interests),
        input.role,
        'Not Requested',
        'Active',
        0,
        0,
        '$0 balance',
        'New account',
        '0 open reports',
        'just now',
        false,
        false,
        passwordHash,
      ],
    );
    return this.getUser(id);
  }

  async markEmailVerified(email: string) {
    const row = await this.getUserByEmail(email);
    await this.database.query(
      `update app_users set email_verified = true, updated_at = now() where id = $1`,
      [row.id],
    );
    return this.getUser(row.id);
  }

  async authenticateUser(input: { email: string; password: string }) {
    const userRow = await this.getUserByEmail(input.email);
    if (!this.verifyPassword(input.password, userRow.password_hash)) {
      throw new UnauthorizedException('Invalid password. Demo password is 123456.');
    }
    if (!userRow.email_verified) {
      throw new UnauthorizedException(
        'Email is not verified yet. Complete email verification before login.',
      );
    }
    if (userRow.blocked) {
      throw new UnauthorizedException('This account is currently blocked.');
    }
    const tokens = await this.issueTokens(userRow.id);
    return this.buildSessionPayload(this.mapUser(userRow), tokens);
  }

  async loginWithGoogle(input: { email: string; name: string; googleIdToken?: string }) {
    let userRow: UserRow | null = null;
    try {
      userRow = await this.getUserByEmail(input.email);
    } catch {
      userRow = null;
    }

    if (!userRow) {
      const baseUsername = input.email
        .split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9._]/g, '');
      let username = baseUsername || `user${Date.now()}`;
      let attempt = 0;
      while (await this.usernameExists(username)) {
        attempt += 1;
        username = `${baseUsername}${attempt}`;
      }

      const id = makeId('user');
      await this.database.query(
        `insert into app_users (
          id, name, username, email, avatar, bio, role, verification, status,
          followers, following, wallet_summary, health, reports, last_active,
          email_verified, blocked, password_hash
        ) values (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,
          $10,$11,$12,$13,$14,$15,
          $16,$17,$18
        )`,
        [
          id,
          input.name,
          username,
          input.email,
          'https://placehold.co/120x120',
          'Google sign-in user.',
          'User',
          'Verified',
          'Active',
          0,
          0,
          '$0 balance',
          'Google sign-in',
          '0 open reports',
          'just now',
          true,
          false,
          this.hashPassword(randomUUID()),
        ],
      );
      const { rows } = await this.database.query<UserRow>(
        `select * from app_users where id = $1`,
        [id],
      );
      userRow = rows[0] ?? null;
    }

    if (!userRow) {
      throw new UnauthorizedException('Unable to create Google user.');
    }

    const tokens = await this.issueTokens(userRow.id);
    return this.buildSessionPayload(this.mapUser(userRow), tokens, {
      provider: 'google',
    });
  }

  async refreshUserToken(refreshToken: string) {
    const claims = this.verifyRefreshToken(refreshToken);
    const { rows } = await this.database.query<QueryResultRow & { user_id: string }>(
      `
      select user_id
      from auth_sessions
      where refresh_token = $1
        and refresh_expires_at > now()
      limit 1
      `,
      [refreshToken],
    );
    const session = rows[0];
    if (!session || session.user_id !== claims.sub) {
      throw new UnauthorizedException('Invalid refresh token.');
    }
    await this.database.query(`delete from auth_sessions where refresh_token = $1`, [refreshToken]);
    const tokens = await this.issueTokens(session.user_id);
    return this.buildSessionPayload(await this.getUser(session.user_id), tokens);
  }

  async createUserSession(userId: string) {
    const tokens = await this.issueTokens(userId);
    return this.buildSessionPayload(await this.getUser(userId), tokens);
  }

  async revokeUserSession(accessToken?: string) {
    if (!accessToken) {
      return { success: true, revoked: false };
    }
    const result = await this.database.query(
      `delete from auth_sessions where access_token = $1`,
      [accessToken],
    );
    return { success: true, revoked: (result.rowCount ?? 0) > 0 };
  }

  async resolveUserFromAccessToken(accessToken?: string) {
    if (!accessToken) {
      return null;
    }
    let claims: JwtLikePayload;
    try {
      claims = this.verifyAccessToken(accessToken);
    } catch {
      return null;
    }
    const { rows } = await this.database.query<QueryResultRow & { user_id: string }>(
      `
      select user_id
      from auth_sessions
      where access_token = $1
        and access_expires_at > now()
      limit 1
      `,
      [accessToken],
    );
    const session = rows[0];
    if (!session || session.user_id !== claims.sub) {
      return null;
    }
    return this.getUser(session.user_id);
  }

  async requireUserFromAuthorization(
    authorization?: string,
    fallbackUserId?: string,
  ) {
    const token = authorization?.replace(/^Bearer\s+/i, '');
    const user = await this.resolveUserFromAccessToken(token);
    if (user) {
      return user;
    }
    if (fallbackUserId?.trim()) {
      return this.getUser(fallbackUserId.trim());
    }
    throw new UnauthorizedException('Authentication required.');
  }

  async updateUserProfile(
    id: string,
    patch: Partial<{
      name: string;
      username: string;
      bio: string;
      avatar: string;
      website: string;
      location: string;
      coverImageUrl: string;
    }>,
  ) {
    await this.getUser(id);
    if (patch.username) {
      const { rows } = await this.database.query<QueryResultRow & { id: string }>(
        `select id from app_users where username = $1 and id <> $2 limit 1`,
        [patch.username, id],
      );
      if (rows[0]) {
        throw new ConflictException(
          'Username already exists. Please choose another username.',
        );
      }
    }
    await this.database.query(
      `update app_users
       set name = coalesce($2, name),
           username = coalesce($3, username),
           bio = coalesce($4, bio),
           avatar = coalesce($5, avatar),
           website = coalesce($6, website),
           location = coalesce($7, location),
           cover_image_url = coalesce($8, cover_image_url),
           updated_at = now()
       where id = $1`,
      [
        id,
        patch.name ?? null,
        patch.username ?? null,
        patch.bio ?? null,
        patch.avatar ?? null,
        patch.website ?? null,
        patch.location ?? null,
        patch.coverImageUrl ?? null,
      ],
    );
    return this.getUser(id);
  }

  async changePassword(input: { email: string; oldPassword: string; newPassword: string }) {
    const userRow = await this.getUserByEmail(input.email);
    if (!this.verifyPassword(input.oldPassword, userRow.password_hash)) {
      throw new UnauthorizedException('Old password is incorrect.');
    }
    await this.database.query(
      `update app_users set password_hash = $2, updated_at = now() where id = $1`,
      [userRow.id, this.hashPassword(input.newPassword)],
    );
    return {
      success: true,
      userId: userRow.id,
      email: userRow.email,
      message: 'Password changed successfully.',
    };
  }

  async forceSetPassword(email: string, newPassword: string) {
    const userRow = await this.getUserByEmail(email);
    await this.database.query(
      `update app_users set password_hash = $2, updated_at = now() where id = $1`,
      [userRow.id, this.hashPassword(newPassword)],
    );
    return {
      success: true,
      userId: userRow.id,
      email: userRow.email,
      message: 'Password reset successfully.',
    };
  }

  async deleteUserAccount(id: string) {
    const user = await this.getUser(id);
    await this.database.query(`delete from app_users where id = $1`, [id]);
    return {
      success: true,
      removedUserId: user.id,
      email: user.email,
      message: 'User account deleted successfully.',
    };
  }

  async followUser(targetId: string, followerId: string) {
    await this.getUser(targetId);
    await this.getUser(followerId);
    const existing = await this.database.query(
      `select 1 from app_follow_relations where follower_id = $1 and target_id = $2 limit 1`,
      [followerId, targetId],
    );
    if (existing.rows[0]) {
      return {
        success: true,
        followerId,
        targetId,
        action: 'followed',
        isFollowing: true,
        hasPendingRequest: false,
      };
    }
    await this.database.query(
      `insert into app_follow_relations (follower_id, target_id, created_at)
       values ($1, $2, now())`,
      [followerId, targetId],
    );
    await this.database.query(
      `update app_users
       set followers = case when id = $1 then followers + 1 else followers end,
           following = case when id = $2 then following + 1 else following end,
           updated_at = now()
       where id in ($1, $2)`,
      [targetId, followerId],
    );
    return {
      success: true,
      followerId,
      targetId,
      action: 'followed',
      isFollowing: true,
      hasPendingRequest: false,
    };
  }

  async unfollowUser(targetId: string, followerId: string) {
    await this.getUser(targetId);
    await this.getUser(followerId);
    const deleted = await this.database.query(
      `delete from app_follow_relations where follower_id = $1 and target_id = $2`,
      [followerId, targetId],
    );
    if ((deleted.rowCount ?? 0) > 0) {
      await this.database.query(
        `update app_users
         set followers = case when id = $1 then greatest(0, followers - 1) else followers end,
             following = case when id = $2 then greatest(0, following - 1) else following end,
             updated_at = now()
         where id in ($1, $2)`,
        [targetId, followerId],
      );
    }
    return {
      success: true,
      followerId,
      targetId,
      action: 'unfollowed',
      isFollowing: false,
      hasPendingRequest: false,
    };
  }

  async getFollowers(targetId: string) {
    await this.getUser(targetId);
    const { rows } = await this.database.query<UserRow>(
      `select u.* from app_follow_relations f
       join app_users u on u.id = f.follower_id
       where f.target_id = $1
       order by f.created_at desc`,
      [targetId],
    );
    return rows.map((row) => this.toUserPreview(this.mapUser(row)));
  }

  async getFollowing(userId: string) {
    await this.getUser(userId);
    const { rows } = await this.database.query<UserRow>(
      `select u.* from app_follow_relations f
       join app_users u on u.id = f.target_id
       where f.follower_id = $1
       order by f.created_at desc`,
      [userId],
    );
    return rows.map((row) => this.toUserPreview(this.mapUser(row)));
  }

  async getFollowState(targetId: string, actorId?: string | null) {
    await this.getUser(targetId);
    const normalizedActorId = actorId?.trim();

    if (!normalizedActorId || normalizedActorId === targetId) {
      return {
        targetId,
        actorId: normalizedActorId ?? null,
        isFollowing: false,
        hasPendingRequest: false,
        isFollowedBy: false,
        mutuals: [],
        mutualCount: 0,
      };
    }

    await this.getUser(normalizedActorId);

    const [followingResult, followedByResult, mutualsResult] = await Promise.all([
      this.database.query(
        `select 1
         from app_follow_relations
         where follower_id = $1 and target_id = $2
         limit 1`,
        [normalizedActorId, targetId],
      ),
      this.database.query(
        `select 1
         from app_follow_relations
         where follower_id = $1 and target_id = $2
         limit 1`,
        [targetId, normalizedActorId],
      ),
      this.database.query<UserRow>(
        `select distinct u.*
         from app_follow_relations actor_rel
         join app_follow_relations target_rel
           on target_rel.target_id = actor_rel.target_id
         join app_users u on u.id = actor_rel.target_id
         where actor_rel.follower_id = $1
           and target_rel.follower_id = $2
           and u.id not in ($1, $2)
         order by u.followers desc, u.name asc
         limit 12`,
        [normalizedActorId, targetId],
      ),
    ]);

    const mutuals = mutualsResult.rows.map((row) =>
      this.toUserPreview(this.mapUser(row)),
    );

    return {
      targetId,
      actorId: normalizedActorId,
      isFollowing: Boolean(followingResult.rows[0]),
      hasPendingRequest: false,
      isFollowedBy: Boolean(followedByResult.rows[0]),
      mutuals,
      mutualCount: mutuals.length,
    };
  }

  async getBuddyIds(userId: string) {
    await this.getUser(userId);
    const { rows } = await this.database.query<
      QueryResultRow & { buddy_user_id: string }
    >(
      `select case
         when user_a_id = $1 then user_b_id
         else user_a_id
       end as buddy_user_id
       from app_buddy_relations
       where user_a_id = $1 or user_b_id = $1
       order by created_at desc`,
      [userId],
    );
    return rows.map((row) => row.buddy_user_id);
  }

  async getBuddies(userId: string) {
    await this.getUser(userId);
    const { rows } = await this.database.query<BuddyRelationRow>(
      `select *
       from app_buddy_relations
       where user_a_id = $1 or user_b_id = $1
       order by created_at desc`,
      [userId],
    );
    return Promise.all(
      rows.map((row) => this.mapBuddyRelationRow(row, userId)),
    );
  }

  async getSentBuddyRequests(userId: string) {
    await this.getUser(userId);
    const { rows } = await this.database.query<BuddyRequestRow>(
      `select *
       from app_buddy_requests
       where requester_id = $1 and status <> 'accepted'
       order by created_at desc`,
      [userId],
    );
    return Promise.all(
      rows.map((row) => this.mapBuddyRequestRow(row, userId, 'sent')),
    );
  }

  async getReceivedBuddyRequests(userId: string) {
    await this.getUser(userId);
    const { rows } = await this.database.query<BuddyRequestRow>(
      `select *
       from app_buddy_requests
       where target_id = $1 and status = 'pending'
       order by created_at desc`,
      [userId],
    );
    return Promise.all(
      rows.map((row) => this.mapBuddyRequestRow(row, userId, 'received')),
    );
  }

  async createBuddyRequest(requesterId: string, targetUserId: string) {
    if (requesterId === targetUserId) {
      throw new ConflictException('You cannot send a buddy request to yourself.');
    }

    await Promise.all([this.getUser(requesterId), this.getUser(targetUserId)]);
    const pair = this.normalizeBuddyPair(requesterId, targetUserId);

    const existingRelation = await this.database.query(
      `select 1
       from app_buddy_relations
       where user_a_id = $1 and user_b_id = $2
       limit 1`,
      [pair.userAId, pair.userBId],
    );
    if (existingRelation.rows[0]) {
      throw new ConflictException('You are already buddies with this user.');
    }

    const existingPending = await this.database.query<BuddyRequestRow>(
      `select *
       from app_buddy_requests
       where requester_id = $1 and target_id = $2 and status = 'pending'
       limit 1`,
      [requesterId, targetUserId],
    );
    if (existingPending.rows[0]) {
      return this.mapBuddyRequestRow(existingPending.rows[0], requesterId, 'sent');
    }

    const inversePending = await this.database.query<BuddyRequestRow>(
      `select *
       from app_buddy_requests
       where requester_id = $1 and target_id = $2 and status = 'pending'
       limit 1`,
      [targetUserId, requesterId],
    );
    if (inversePending.rows[0]) {
      return this.acceptBuddyRequest(inversePending.rows[0].id, requesterId);
    }

    const id = makeId('buddy_request');
    const createdAt = new Date().toISOString();
    await this.database.query(
      `insert into app_buddy_requests (
        id, requester_id, target_id, status, created_at, responded_at, responded_by
      ) values (
        $1,$2,$3,$4,$5,$6,$7
      )`,
      [id, requesterId, targetUserId, 'pending', createdAt, null, null],
    );

    const request = await this.getBuddyRequestRow(id);
    return this.mapBuddyRequestRow(request, requesterId, 'sent');
  }

  async acceptBuddyRequest(requestId: string, actorId: string) {
    const request = await this.getBuddyRequestRow(requestId);
    if (request.target_id !== actorId) {
      throw new UnauthorizedException('Only the receiving user can accept this buddy request.');
    }
    if (request.status === 'accepted') {
      const relation = await this.getBuddyRelationByUsers(
        request.requester_id,
        request.target_id,
      );
      return this.mapBuddyRelationRow(relation, actorId);
    }
    if (request.status === 'rejected') {
      throw new ConflictException('This buddy request has already been rejected.');
    }

    const pair = this.normalizeBuddyPair(request.requester_id, request.target_id);
    const relationId = makeId('buddy_relation');
    const respondedAt = new Date().toISOString();
    await this.database.query(
      `update app_buddy_requests
       set status = 'accepted', responded_at = $2, responded_by = $3
       where id = $1`,
      [requestId, respondedAt, actorId],
    );
    await this.database.query(
      `insert into app_buddy_relations (id, user_a_id, user_b_id, created_at)
       values ($1,$2,$3,$4)
       on conflict (user_a_id, user_b_id) do nothing`,
      [relationId, pair.userAId, pair.userBId, respondedAt],
    );
    const relation = await this.getBuddyRelationByUsers(pair.userAId, pair.userBId);
    return this.mapBuddyRelationRow(relation, actorId);
  }

  async rejectBuddyRequest(requestId: string, actorId: string) {
    const request = await this.getBuddyRequestRow(requestId);
    if (request.target_id !== actorId) {
      throw new UnauthorizedException('Only the receiving user can reject this buddy request.');
    }
    const respondedAt = new Date().toISOString();
    await this.database.query(
      `update app_buddy_requests
       set status = 'rejected', responded_at = $2, responded_by = $3
       where id = $1`,
      [requestId, respondedAt, actorId],
    );
    const updated = await this.getBuddyRequestRow(requestId);
    return this.mapBuddyRequestRow(updated, actorId, 'received');
  }

  async deleteBuddyRequest(requestId: string, actorId: string) {
    const request = await this.getBuddyRequestRow(requestId);
    if (![request.requester_id, request.target_id].includes(actorId)) {
      throw new UnauthorizedException('You cannot delete this buddy request.');
    }
    await this.database.query(`delete from app_buddy_requests where id = $1`, [requestId]);
    return {
      success: true,
      requestId,
      userId: actorId,
      deleted: true,
      message: 'Buddy request deleted successfully.',
    };
  }

  async removeBuddy(actorId: string, buddyUserId: string) {
    await Promise.all([this.getUser(actorId), this.getUser(buddyUserId)]);
    const pair = this.normalizeBuddyPair(actorId, buddyUserId);
    const deleted = await this.database.query(
      `delete from app_buddy_relations
       where user_a_id = $1 and user_b_id = $2`,
      [pair.userAId, pair.userBId],
    );
    return {
      success: true,
      userId: actorId,
      buddyUserId,
      removed: (deleted.rowCount ?? 0) > 0,
      message: 'Buddy removed successfully.',
    };
  }

  async getFeed() {
    const posts = await this.getPosts();
    return Promise.all(
      posts.map(async (post) => ({
        ...post,
        author: await this.getUser(post.authorId),
      })),
    );
  }

  async getPosts(authorId?: string) {
    const { rows } = authorId
      ? await this.database.query<PostRow>(
          `select * from app_posts where author_id = $1 order by created_at desc`,
          [authorId],
        )
      : await this.database.query<PostRow>(
          `select * from app_posts order by created_at desc`,
        );
    return rows.map((row) => this.mapPost(row));
  }

  async getPost(id: string) {
    const { rows } = await this.database.query<PostRow>(
      `select * from app_posts where id = $1 limit 1`,
      [id],
    );
    const row = rows[0];
    if (!row) {
      throw new NotFoundException(`Post ${id} not found`);
    }
    return this.mapPost(row);
  }

  async createPost(input: {
    authorId: string;
    caption: string;
    media: string[];
    tags: string[];
  }) {
    await this.getUser(input.authorId);
    const id = makeId('post');
    await this.database.query(
      `insert into app_posts (
        id, author_id, caption, media, tags, likes, comments, shares, views, status, type, created_at
      ) values (
        $1,$2,$3,$4::jsonb,$5::jsonb,$6,$7,$8,$9,$10,$11,$12
      )`,
      [
        id,
        input.authorId,
        input.caption,
        JSON.stringify(input.media),
        JSON.stringify(input.tags),
        0,
        0,
        0,
        0,
        'Visible',
        'post',
        new Date().toISOString(),
      ],
    );
    return this.getPost(id);
  }

  async updatePost(
    id: string,
    patch: Partial<{ caption: string; media: string[]; tags: string[]; status: string }>,
  ) {
    await this.getPost(id);
    await this.database.query(
      `update app_posts
       set caption = coalesce($2, caption),
           media = coalesce($3::jsonb, media),
           tags = coalesce($4::jsonb, tags),
           status = coalesce($5, status)
       where id = $1`,
      [
        id,
        patch.caption ?? null,
        patch.media ? JSON.stringify(patch.media) : null,
        patch.tags ? JSON.stringify(patch.tags) : null,
        patch.status ?? null,
      ],
    );
    return this.getPost(id);
  }

  async deletePost(id: string) {
    const post = await this.getPost(id);
    await this.database.query(`delete from app_posts where id = $1`, [id]);
    return {
      success: true,
      removed: post,
      message: 'Post deleted successfully.',
    };
  }

  async getPostReactions(postId: string) {
    await this.getPost(postId);
    const { rows } = await this.database.query<
      QueryResultRow & { post_id: string; user_id: string; reaction: string; created_at: Date | string }
    >(
      `select * from app_post_reactions where post_id = $1 order by created_at desc`,
      [postId],
    );
    return rows.map((row) => ({
      postId: row.post_id,
      userId: row.user_id,
      reaction: row.reaction,
      createdAt: this.iso(row.created_at),
    }));
  }

  async reactToPost(postId: string, userId: string, reaction: string) {
    const post = await this.getPost(postId);
    await this.getUser(userId);
    const existing = await this.database.query<QueryResultRow & { reaction: string }>(
      `select reaction from app_post_reactions where post_id = $1 and user_id = $2 limit 1`,
      [postId, userId],
    );
    const hadReaction = Boolean(existing.rows[0]);
    const sameReaction = existing.rows[0]?.reaction === reaction;

    if (sameReaction) {
      return {
        postId,
        userId,
        reaction,
        action: 'unchanged',
        reactions: await this.getPostReactions(postId),
      };
    }

    await this.database.query(
      `insert into app_post_reactions (post_id, user_id, reaction, created_at)
       values ($1, $2, $3, now())
       on conflict (post_id, user_id)
       do update set reaction = excluded.reaction, created_at = excluded.created_at`,
      [postId, userId, reaction],
    );

    if (!hadReaction) {
      await this.database.query(
        `update app_posts set likes = likes + 1 where id = $1`,
        [postId],
      );
    }

    if (userId !== post.authorId) {
      const actor = await this.getUser(userId);
      await this.pushNotification({
        recipientId: post.authorId,
        title: `${actor.name} reacted to your post`,
        body: `${actor.username} left a ${reaction} reaction on ${post.id}.`,
        routeName: `/posts/${postId}`,
        entityId: postId,
        type: 'social',
        actorName: actor.name,
        entityType: 'post',
        metadata: { postId, reaction, actorId: userId, actorName: actor.name },
      });
    }

    return {
      postId,
      userId,
      reaction,
      action: hadReaction ? 'updated' : 'created',
      reactions: await this.getPostReactions(postId),
    };
  }

  async toggleLike(postId: string, userId = 'u1') {
    return this.reactToPost(postId, userId, 'like');
  }

  async unlikePost(postId: string, userId = 'u1') {
    await this.getPost(postId);
    const deleted = await this.database.query(
      `delete from app_post_reactions where post_id = $1 and user_id = $2`,
      [postId, userId],
    );
    if ((deleted.rowCount ?? 0) > 0) {
      await this.database.query(
        `update app_posts set likes = greatest(0, likes - 1) where id = $1`,
        [postId],
      );
    }
    return {
      postId,
      userId,
      action: 'removed',
      reactions: await this.getPostReactions(postId),
    };
  }

  async getPostComments(postId: string) {
    await this.getPost(postId);
    return this.getPostCommentTree(postId);
  }

  async getPostCommentReplies(postId: string, commentId: string) {
    const comments = await this.getPostCommentTree(postId);
    const stack = [...comments];
    while (stack.length > 0) {
      const next = stack.shift();
      if (!next) {
        continue;
      }
      if (next.id === commentId) {
        return next.replies;
      }
      stack.push(...next.replies);
    }
    throw new NotFoundException(`Comment ${commentId} not found`);
  }

  async createPostComment(
    postId: string,
    author: string,
    message: string,
    options?: { authorId?: string; replyTo?: string; mentions?: string[] },
  ) {
    const post = await this.getPost(postId);
    let resolvedAuthor = author;
    if (options?.authorId) {
      resolvedAuthor = (await this.getUser(options.authorId)).name;
    }
    if (options?.replyTo) {
      await this.getCommentRow(options.replyTo, postId);
    }

    const id = makeId('comment');
    await this.database.query(
      `insert into app_post_comments (
        id, post_id, author_id, author, message, reply_to, created_at, like_count,
        is_liked_by_me, is_reported, is_edited, mentions
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb
      )`,
      [
        id,
        postId,
        options?.authorId ?? null,
        resolvedAuthor,
        message,
        options?.replyTo ?? null,
        new Date().toISOString(),
        0,
        false,
        false,
        false,
        JSON.stringify(options?.mentions ?? []),
      ],
    );
    await this.database.query(
      `update app_posts set comments = comments + 1 where id = $1`,
      [postId],
    );

    const recipientId =
      options?.replyTo
        ? (await this.getCommentRow(options.replyTo, postId)).author_id
        : post.authorId;

    if (recipientId && recipientId !== options?.authorId) {
      await this.pushNotification({
        recipientId,
        title: options?.replyTo
          ? `${resolvedAuthor} replied to your comment`
          : `${resolvedAuthor} commented on your post`,
        body: message,
        routeName: `/posts/${postId}`,
        entityId: id,
        type: 'social',
        actorName: resolvedAuthor,
        entityType: 'comment',
        metadata: {
          postId,
          commentId: id,
          replyTo: options?.replyTo ?? null,
          actorName: resolvedAuthor,
        },
      });
    }

    return this.getSerializedComment(id, postId);
  }

  async reactToComment(postId: string, commentId: string, userId: string, reaction: string) {
    await this.getPost(postId);
    const comment = await this.getCommentRow(commentId, postId);
    await this.getUser(userId);

    await this.database.query(
      `insert into app_post_comment_reactions (comment_id, user_id, reaction, created_at)
       values ($1, $2, $3, now())
       on conflict (comment_id, user_id)
       do update set reaction = excluded.reaction, created_at = excluded.created_at`,
      [commentId, userId, reaction],
    );

    const reactionCounts = await this.getCommentReactionCounts([commentId]);
    await this.database.query(
      `update app_post_comments
       set like_count = $2, is_liked_by_me = $3
       where id = $1`,
      [commentId, reactionCounts[commentId]?.like ?? 0, reaction === 'like'],
    );

    if (comment.author_id && comment.author_id !== userId) {
      const actor = await this.getUser(userId);
      await this.pushNotification({
        recipientId: comment.author_id,
        title: `${actor.name} reacted to your comment`,
        body: `${actor.username} left a ${reaction} reaction.`,
        routeName: `/posts/${postId}`,
        entityId: commentId,
        type: 'social',
        actorName: actor.name,
        entityType: 'comment',
        metadata: {
          postId,
          commentId,
          reaction,
          actorId: userId,
          actorName: actor.name,
        },
      });
    }

    return this.getSerializedComment(commentId, postId);
  }

  async deletePostComment(postId: string, commentId: string) {
    await this.getCommentRow(commentId, postId);
    const removalIds = await this.collectCommentSubtreeIds(postId, commentId);
    const removed = await Promise.all(
      removalIds.map((id) => this.getSerializedComment(id, postId)),
    );
    await this.database.query(
      `delete from app_post_comments where post_id = $1 and id = any($2::text[])`,
      [postId, removalIds],
    );
    await this.database.query(
      `update app_posts
       set comments = greatest(0, comments - $2)
       where id = $1`,
      [postId, removalIds.length],
    );
    return {
      success: true,
      removed,
      message: 'Comment deleted successfully.',
    };
  }

  async getThreads() {
    const { rows } = await this.database.query<ThreadRow>(
      `select * from chat_threads order by created_at desc`,
    );
    return Promise.all(
      rows.map((thread) =>
        this.buildThreadPayload(thread, {
          includeParticipants: true,
          includeParticipantIds: true,
        }),
      ),
    );
  }

  async getThread(id: string) {
    const { rows } = await this.database.query<ThreadRow>(
      `select * from chat_threads where id = $1 limit 1`,
      [id],
    );
    const row = rows[0];
    if (!row) {
      throw new NotFoundException(`Thread ${id} not found`);
    }
    return this.buildThreadPayload(row, {
      includeParticipantIds: true,
      includeParticipants: true,
      includeMessages: true,
    });
  }

  async getThreadParticipantIds(threadId: string) {
    const { rows } = await this.database.query<QueryResultRow & { user_id: string }>(
      `select user_id from chat_thread_participants where thread_id = $1 order by created_at asc`,
      [threadId],
    );
    return rows.map((row) => row.user_id);
  }

  async getThreadMessages(threadId: string) {
    await this.getThread(threadId);
    return this.listThreadMessages(threadId);
  }

  async ensureDirectThread(userAId: string, userBId: string) {
    const participantIds = [...new Set([userAId, userBId].map((value) => value.trim()))].sort();
    if (participantIds.length !== 2) {
      throw new ConflictException('Direct threads require two distinct participants.');
    }

    const [userA, userB] = await Promise.all([
      this.getUser(participantIds[0]),
      this.getUser(participantIds[1]),
    ]);

    const { rows } = await this.database.query<ThreadRow>(
      `select t.*
       from chat_threads t
       join (
         select thread_id
         from chat_thread_participants
         where user_id = any($1::text[])
         group by thread_id
         having count(distinct user_id) = 2
       ) matched on matched.thread_id = t.id
       where (
         select count(*)
         from chat_thread_participants tp
         where tp.thread_id = t.id
       ) = 2
       order by t.created_at desc
       limit 1`,
      [participantIds],
    );

    const existing = rows[0];
    if (existing) {
      return this.buildThreadPayload(existing, {
        includeParticipantIds: true,
        includeParticipants: true,
        includeMessages: true,
      });
    }

    const threadId = makeId('conversation');
    const createdAt = new Date().toISOString();
    await this.database.query(
      `insert into chat_threads (id, title, participants_label, flag, summary, created_at)
       values ($1,$2,$3,$4,$5,$6)`,
      [
        threadId,
        `${userA.name} & ${userB.name}`,
        '2 members',
        null,
        'Direct story reply conversation.',
        createdAt,
      ],
    );

    for (const participantId of participantIds) {
      await this.database.query(
        `insert into chat_thread_participants (thread_id, user_id, created_at)
         values ($1,$2,$3)`,
        [threadId, participantId, createdAt],
      );
    }

    return this.getThread(threadId);
  }

  async createOrOpenThread(actorId: string, participantIds: string[]) {
    const normalized = [...new Set([actorId, ...participantIds].map((value) => value.trim()))];
    if (normalized.length === 2) {
      const otherUserId = normalized.find((id) => id !== actorId);
      if (!otherUserId) {
        throw new ConflictException('Direct thread target user could not be resolved.');
      }
      return this.ensureDirectThread(actorId, otherUserId);
    }

    throw new ConflictException(
      'This backend currently supports creating direct threads with one target user.',
    );
  }

  async createMessage(
    threadId: string,
    senderId: string,
    text: string,
    options?: {
      attachments?: string[];
      replyToMessageId?: string;
      kind?: 'text' | 'image' | 'video' | 'audio' | 'file';
      mediaPath?: string;
    },
  ) {
    const thread = await this.getThread(threadId);
    const participantIds = thread.participantIds ?? (await this.getThreadParticipantIds(threadId));
    await this.getUser(senderId);
    const id = makeId('message');
    await this.database.query(
      `insert into chat_messages (
        id, thread_id, sender_id, text, read, timestamp, attachments,
        reply_to_message_id, delivery_state, kind, media_path
      ) values (
        $1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11
      )`,
      [
        id,
        threadId,
        senderId,
        text,
        false,
        new Date().toISOString(),
        JSON.stringify(options?.attachments ?? []),
        options?.replyToMessageId ?? null,
        'sent',
        options?.kind ?? 'text',
        options?.mediaPath ?? null,
      ],
    );

    const sender = await this.getUser(senderId);
    for (const participantId of participantIds.filter((id) => id !== senderId)) {
      await this.pushNotification({
        recipientId: participantId,
        title: `New message from ${sender.name}`,
        body: text || `${sender.username} sent an attachment.`,
        routeName: `/chat/threads/${threadId}`,
        entityId: id,
        type: 'social',
        actorName: sender.name,
        entityType: 'message',
        metadata: { threadId, messageId: id, senderId, actorName: sender.name },
      });
    }

    return this.getMessage(id);
  }

  async getMessage(messageId: string) {
    const { rows } = await this.database.query<MessageRow>(
      `select * from chat_messages where id = $1 limit 1`,
      [messageId],
    );
    const row = rows[0];
    if (!row) {
      throw new NotFoundException(`Message ${messageId} not found`);
    }
    return this.mapMessage(row);
  }

  async updateMessageDeliveryState(
    threadId: string,
    messageId: string,
    deliveryState: 'sent' | 'delivered' | 'read',
  ) {
    const message = await this.getMessage(messageId);
    if (message.threadId !== threadId) {
      throw new NotFoundException(`Message ${messageId} does not belong to thread ${threadId}`);
    }
    await this.database.query(
      `update chat_messages set delivery_state = $3, read = $4 where id = $1 and thread_id = $2`,
      [messageId, threadId, deliveryState, deliveryState === 'read'],
    );
    return this.getMessage(messageId);
  }

  async markThreadMessagesRead(threadId: string, userId: string) {
    await this.getThread(threadId);
    await this.getUser(userId);
    const updatedRows = await this.database.query<MessageRow>(
      `update chat_messages
       set read = true, delivery_state = 'read'
       where thread_id = $1 and sender_id <> $2
       returning *`,
      [threadId, userId],
    );
    return {
      threadId,
      userId,
      updatedCount: updatedRows.rowCount ?? 0,
      messages: updatedRows.rows.map((row) => this.mapMessage(row)),
    };
  }

  async getNotificationInbox(recipientId?: string) {
    const { rows } = recipientId
      ? await this.database.query<NotificationRow>(
          `select * from app_notifications where recipient_id = $1 order by created_at desc`,
          [recipientId],
        )
      : await this.database.query<NotificationRow>(
          `select * from app_notifications order by created_at desc`,
        );
    return rows.map((row) => this.mapNotification(row));
  }

  async pushNotification(input: {
    recipientId: string;
    title: string;
    body: string;
    routeName: string;
    entityId?: string;
    type?: 'social' | 'commerce' | 'security' | 'system';
    actorName?: string;
    entityType?: string;
    metadata?: Record<string, unknown>;
  }) {
    const id = makeId('notification');
    const metadata = {
      ...(input.metadata ?? {}),
      ...(input.actorName ? { actorName: input.actorName } : {}),
      ...(input.entityType ? { entityType: input.entityType } : {}),
    };
    await this.database.query(
      `insert into app_notifications (
        id, recipient_id, title, body, created_at, read, type, route_name, entity_id, metadata
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb
      )`,
      [
        id,
        input.recipientId,
        input.title,
        input.body,
        new Date().toISOString(),
        false,
        input.type ?? 'social',
        input.routeName,
        input.entityId ?? null,
        JSON.stringify(metadata),
      ],
    );
    const { rows } = await this.database.query<NotificationRow>(
      `select * from app_notifications where id = $1`,
      [id],
    );
    return this.mapNotification(rows[0]);
  }

  async markNotificationRead(id: string, recipientId?: string) {
    const { rows } = await this.database.query<NotificationRow>(
      recipientId
        ? `update app_notifications set read = true where id = $1 and recipient_id = $2 returning *`
        : `update app_notifications set read = true where id = $1 returning *`,
      recipientId ? [id, recipientId] : [id],
    );
    const row = rows[0];
    if (!row) {
      throw new NotFoundException(`Notification ${id} not found`);
    }
    return this.mapNotification(row);
  }

  async storeAuthCode(email: string, purpose: 'verify_email' | 'reset_password', code: string, expiresAt: Date) {
    await this.database.query(
      `insert into auth_codes (email, purpose, code, expires_at, created_at)
       values ($1,$2,$3,$4,$5)
       on conflict (email, purpose)
       do update set code = excluded.code, expires_at = excluded.expires_at, created_at = excluded.created_at`,
      [email, purpose, code, expiresAt.toISOString(), new Date().toISOString()],
    );
  }

  async getAuthCode(email: string, purpose: 'verify_email' | 'reset_password') {
    const { rows } = await this.database.query<
      QueryResultRow & { email: string; purpose: string; code: string; expires_at: Date | string }
    >(
      `select * from auth_codes where email = $1 and purpose = $2 limit 1`,
      [email, purpose],
    );
    const row = rows[0];
    if (!row) {
      return null;
    }
    return {
      email: row.email,
      purpose: row.purpose,
      code: row.code,
      expiresAt: this.iso(row.expires_at),
    };
  }

  async deleteAuthCode(email: string, purpose: 'verify_email' | 'reset_password') {
    await this.database.query(`delete from auth_codes where email = $1 and purpose = $2`, [
      email,
      purpose,
    ]);
  }

  private async ensureSchema() {
    await this.database.query(`
      create table if not exists app_users (
        id text primary key,
        name text not null,
        username text not null unique,
        email text not null unique,
        avatar text not null,
        bio text not null,
        interests jsonb not null default '[]'::jsonb,
        role text not null,
        verification text not null,
        status text not null,
        followers integer not null default 0,
        following integer not null default 0,
        wallet_summary text not null,
        health text not null,
        reports text not null,
        last_active text not null,
        email_verified boolean not null default false,
        blocked boolean not null default false,
        password_hash text not null,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
    `);
    await this.database.query(`
      do $$
      begin
        if not exists (
          select 1 from pg_constraint where conname = 'app_users_id_format'
        ) then
          alter table app_users
          add constraint app_users_id_format
          check (id ~ '^user_[a-zA-Z0-9]+$');
        end if;
      end $$;
    `);
    await this.database.query(`
      alter table app_users
      add column if not exists interests jsonb not null default '[]'::jsonb;
    `);
    await this.database.query(`
      alter table app_users
      add column if not exists website text not null default '';
    `);
    await this.database.query(`
      alter table app_users
      add column if not exists location text not null default '';
    `);
    await this.database.query(`
      alter table app_users
      add column if not exists cover_image_url text not null default '';
    `);
    await this.database.query(`
      alter table app_users
      add column if not exists is_private boolean not null default false;
    `);
    await this.database.query(`
      alter table app_users
      add column if not exists note text null;
    `);
    await this.database.query(`
      alter table app_users
      add column if not exists note_privacy text not null default 'followers';
    `);
    await this.database.query(`
      alter table app_users
      add column if not exists supporter_badge boolean not null default false;
    `);
    await this.database.query(`
      create table if not exists auth_sessions (
        session_id text primary key,
        user_id text not null references app_users(id) on delete cascade,
        access_token text not null unique,
        refresh_token text not null unique,
        created_at timestamptz not null,
        access_expires_at timestamptz not null,
        refresh_expires_at timestamptz not null
      );
    `);
    await this.database.query(`
      create table if not exists auth_codes (
        email text not null,
        purpose text not null,
        code text not null,
        expires_at timestamptz not null,
        created_at timestamptz not null,
        primary key (email, purpose)
      );
    `);
    await this.database.query(`
      create table if not exists app_follow_relations (
        follower_id text not null references app_users(id) on delete cascade,
        target_id text not null references app_users(id) on delete cascade,
        created_at timestamptz not null,
        primary key (follower_id, target_id)
      );
    `);
    await this.database.query(`
      create table if not exists app_buddy_requests (
        id text primary key,
        requester_id text not null references app_users(id) on delete cascade,
        target_id text not null references app_users(id) on delete cascade,
        status text not null default 'pending',
        created_at timestamptz not null,
        responded_at timestamptz null,
        responded_by text null references app_users(id) on delete set null,
        unique (requester_id, target_id)
      );
    `);
    await this.database.query(`
      do $$
      begin
        if not exists (
          select 1 from pg_constraint where conname = 'app_buddy_requests_id_format'
        ) then
          alter table app_buddy_requests
          add constraint app_buddy_requests_id_format
          check (id ~ '^buddy_request_[a-zA-Z0-9]+$');
        end if;
      end $$;
    `);
    await this.database.query(`
      create table if not exists app_buddy_relations (
        id text primary key,
        user_a_id text not null references app_users(id) on delete cascade,
        user_b_id text not null references app_users(id) on delete cascade,
        created_at timestamptz not null,
        unique (user_a_id, user_b_id)
      );
    `);
    await this.database.query(`
      do $$
      begin
        if not exists (
          select 1 from pg_constraint where conname = 'app_buddy_relations_id_format'
        ) then
          alter table app_buddy_relations
          add constraint app_buddy_relations_id_format
          check (id ~ '^buddy_relation_[a-zA-Z0-9]+$');
        end if;
      end $$;
    `);
    await this.database.query(`
      create table if not exists app_posts (
        id text primary key,
        author_id text not null references app_users(id) on delete cascade,
        caption text not null,
        media jsonb not null default '[]'::jsonb,
        tags jsonb not null default '[]'::jsonb,
        likes integer not null default 0,
        comments integer not null default 0,
        shares integer not null default 0,
        views integer not null default 0,
        status text not null,
        type text not null,
        created_at timestamptz not null
      );
    `);
    await this.database.query(`
      do $$
      begin
        if not exists (
          select 1 from pg_constraint where conname = 'app_posts_id_format'
        ) then
          alter table app_posts
          add constraint app_posts_id_format
          check (id ~ '^post_[a-zA-Z0-9]+$');
        end if;
      end $$;
    `);
    await this.database.query(`
      create table if not exists app_post_reactions (
        post_id text not null references app_posts(id) on delete cascade,
        user_id text not null references app_users(id) on delete cascade,
        reaction text not null,
        created_at timestamptz not null,
        primary key (post_id, user_id)
      );
    `);
    await this.database.query(`
      create table if not exists app_post_comments (
        id text primary key,
        post_id text not null references app_posts(id) on delete cascade,
        author_id text null references app_users(id) on delete set null,
        author text not null,
        message text not null,
        reply_to text null references app_post_comments(id) on delete cascade,
        created_at timestamptz not null,
        like_count integer not null default 0,
        is_liked_by_me boolean not null default false,
        is_reported boolean not null default false,
        is_edited boolean not null default false,
        mentions jsonb not null default '[]'::jsonb
      );
    `);
    await this.database.query(`
      do $$
      begin
        if not exists (
          select 1 from pg_constraint where conname = 'app_post_comments_id_format'
        ) then
          alter table app_post_comments
          add constraint app_post_comments_id_format
          check (id ~ '^comment_[a-zA-Z0-9]+$');
        end if;
      end $$;
    `);
    await this.database.query(`
      create table if not exists app_post_comment_reactions (
        comment_id text not null references app_post_comments(id) on delete cascade,
        user_id text not null references app_users(id) on delete cascade,
        reaction text not null,
        created_at timestamptz not null,
        primary key (comment_id, user_id)
      );
    `);
    await this.database.query(`
      create table if not exists chat_threads (
        id text primary key,
        title text not null,
        participants_label text not null,
        flag text null,
        summary text not null,
        created_at timestamptz not null default now()
      );
    `);
    await this.database.query(`
      do $$
      begin
        if not exists (
          select 1 from pg_constraint where conname = 'chat_threads_id_format'
        ) then
          alter table chat_threads
          add constraint chat_threads_id_format
          check (id ~ '^conversation_[a-zA-Z0-9]+$');
        end if;
      end $$;
    `);
    await this.database.query(`
      create table if not exists chat_thread_participants (
        thread_id text not null references chat_threads(id) on delete cascade,
        user_id text not null references app_users(id) on delete cascade,
        created_at timestamptz not null,
        primary key (thread_id, user_id)
      );
    `);
    await this.database.query(`
      create table if not exists chat_messages (
        id text primary key,
        thread_id text not null references chat_threads(id) on delete cascade,
        sender_id text not null references app_users(id) on delete cascade,
        text text not null,
        read boolean not null default false,
        timestamp timestamptz not null,
        attachments jsonb not null default '[]'::jsonb,
        reply_to_message_id text null references chat_messages(id) on delete set null,
        delivery_state text not null default 'sent',
        kind text not null default 'text',
        media_path text null
      );
    `);
    await this.database.query(`
      do $$
      begin
        if not exists (
          select 1 from pg_constraint where conname = 'chat_messages_id_format'
        ) then
          alter table chat_messages
          add constraint chat_messages_id_format
          check (id ~ '^message_[a-zA-Z0-9]+$');
        end if;
      end $$;
    `);
    await this.database.query(`
      create table if not exists app_notifications (
        id text primary key,
        recipient_id text not null references app_users(id) on delete cascade,
        title text not null,
        body text not null,
        created_at timestamptz not null,
        read boolean not null default false,
        type text not null,
        route_name text not null,
        entity_id text null,
        metadata jsonb not null default '{}'::jsonb
      );
    `);
    await this.database.query(`
      do $$
      begin
        if not exists (
          select 1 from pg_constraint where conname = 'app_notifications_id_format'
        ) then
          alter table app_notifications
          add constraint app_notifications_id_format
          check (id ~ '^notification_[a-zA-Z0-9]+$');
        end if;
      end $$;
    `);
  }

  private async seedCoreData() {
    const shouldSeedDemoData = (process.env.CORE_DB_SEED ?? 'false') === 'true';
    if (!shouldSeedDemoData) {
      return;
    }

    const existingUsers = await this.database.query<QueryResultRow & { count: string }>(
      `select count(*)::text as count from app_users`,
    );
    if (Number(existingUsers.rows[0]?.count ?? '0') > 0) {
      return;
    }

    for (const user of coreSeedUsers) {
      await this.database.query(
        `insert into app_users (
          id, name, username, email, avatar, bio, role, verification, status,
          followers, following, wallet_summary, health, reports, last_active,
          email_verified, blocked, password_hash, created_at, updated_at
        ) values (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,
          $10,$11,$12,$13,$14,$15,
          $16,$17,$18,$19,$20
        )`,
        [
          user.id,
          user.name,
          user.username,
          user.email,
          user.avatar,
          user.bio,
          user.role,
          user.verification,
          user.status,
          user.followers,
          user.following,
          user.walletSummary,
          user.health,
          user.reports,
          user.lastActive,
          user.emailVerified,
          user.blocked,
          this.hashPassword(user.password),
          new Date().toISOString(),
          new Date().toISOString(),
        ],
      );
    }

    for (const relation of coreSeedFollows) {
      await this.database.query(
        `insert into app_follow_relations (follower_id, target_id, created_at) values ($1, $2, $3)`,
        [relation.followerId, relation.targetId, new Date().toISOString()],
      );
    }

    for (const post of coreSeedPosts) {
      await this.database.query(
        `insert into app_posts (
          id, author_id, caption, media, tags, likes, comments, shares, views, status, type, created_at
        ) values (
          $1,$2,$3,$4::jsonb,$5::jsonb,$6,$7,$8,$9,$10,$11,$12
        )`,
        [
          post.id,
          post.authorId,
          post.caption,
          JSON.stringify(post.media),
          JSON.stringify(post.tags),
          post.likes,
          post.comments,
          post.shares,
          post.views,
          post.status,
          post.type,
          post.createdAt,
        ],
      );
    }

    for (const reaction of coreSeedPostReactions) {
      await this.database.query(
        `insert into app_post_reactions (post_id, user_id, reaction, created_at) values ($1, $2, $3, $4)`,
        [reaction.postId, reaction.userId, reaction.reaction, reaction.createdAt],
      );
    }

    for (const comment of coreSeedPostComments) {
      await this.database.query(
        `insert into app_post_comments (
          id, post_id, author_id, author, message, reply_to, created_at, like_count,
          is_liked_by_me, is_reported, is_edited, mentions
        ) values (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb
        )`,
        [
          comment.id,
          comment.postId,
          comment.authorId,
          comment.author,
          comment.message,
          comment.replyTo,
          comment.createdAt,
          comment.likeCount,
          comment.isLikedByMe,
          comment.isReported,
          comment.isEdited,
          JSON.stringify(comment.mentions),
        ],
      );
    }

    for (const reaction of coreSeedCommentReactions) {
      await this.database.query(
        `insert into app_post_comment_reactions (comment_id, user_id, reaction, created_at) values ($1, $2, $3, $4)`,
        [reaction.commentId, reaction.userId, reaction.reaction, reaction.createdAt],
      );
    }

    for (const thread of coreSeedThreads) {
      await this.database.query(
        `insert into chat_threads (id, title, participants_label, flag, summary, created_at)
         values ($1,$2,$3,$4,$5,$6)`,
        [thread.id, thread.title, thread.participantsLabel, thread.flag, thread.summary, new Date().toISOString()],
      );
      for (const participantId of thread.participantIds) {
        await this.database.query(
          `insert into chat_thread_participants (thread_id, user_id, created_at) values ($1,$2,$3)`,
          [thread.id, participantId, new Date().toISOString()],
        );
      }
    }

    for (const message of coreSeedMessages) {
      await this.database.query(
        `insert into chat_messages (
          id, thread_id, sender_id, text, read, timestamp, attachments,
          reply_to_message_id, delivery_state, kind, media_path
        ) values (
          $1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11
        )`,
        [
          message.id,
          message.threadId,
          message.senderId,
          message.text,
          message.read,
          message.timestamp,
          JSON.stringify(message.attachments),
          message.replyToMessageId,
          message.deliveryState,
          message.kind,
          message.mediaPath,
        ],
      );
    }

    for (const notification of coreSeedNotifications) {
      await this.database.query(
        `insert into app_notifications (
          id, recipient_id, title, body, created_at, read, type, route_name, entity_id, metadata
        ) values (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb
        )`,
        [
          notification.id,
          notification.recipientId,
          notification.title,
          notification.body,
          notification.createdAt,
          notification.read,
          notification.type,
          notification.routeName,
          notification.entityId,
          JSON.stringify(notification.metadata),
        ],
      );
    }
  }

  private async getThreadParticipants(threadId: string) {
    const { rows } = await this.database.query<UserRow>(
      `select u.* from chat_thread_participants tp
       join app_users u on u.id = tp.user_id
       where tp.thread_id = $1
       order by tp.created_at asc`,
      [threadId],
    );
    return rows.map((row) => this.mapUser(row));
  }

  private async listThreadMessages(threadId: string) {
    const { rows } = await this.database.query<MessageRow>(
      `select * from chat_messages where thread_id = $1 order by timestamp asc`,
      [threadId],
    );
    return rows.map((row) => this.mapMessage(row));
  }

  private async buildThreadPayload(
    row: ThreadRow,
    options: {
      includeParticipantIds?: boolean;
      includeParticipants?: boolean;
      includeMessages?: boolean;
    } = {},
  ) {
    const messages = await this.listThreadMessages(row.id);
    const participants = options.includeParticipants
      ? await this.getThreadParticipants(row.id)
      : undefined;
    const participantIds = options.includeParticipantIds
      ? await this.getThreadParticipantIds(row.id)
      : undefined;
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

    return {
      ...this.mapThread(row),
      unreadCount: messages.filter((message) => !message.read).length,
      lastMessage,
      ...(options.includeParticipants ? { participants } : {}),
      ...(options.includeParticipantIds ? { participantIds } : {}),
      ...(options.includeMessages ? { messages } : {}),
    };
  }

  private async getCommentRow(commentId: string, postId: string) {
    const { rows } = await this.database.query<CommentRow>(
      `select * from app_post_comments where id = $1 and post_id = $2 limit 1`,
      [commentId, postId],
    );
    const row = rows[0];
    if (!row) {
      throw new NotFoundException(`Comment ${commentId} not found`);
    }
    return row;
  }

  private async collectCommentSubtreeIds(postId: string, rootId: string) {
    const { rows } = await this.database.query<QueryResultRow & { id: string }>(
      `with recursive comment_tree as (
         select id, reply_to from app_post_comments where post_id = $1 and id = $2
         union all
         select c.id, c.reply_to
         from app_post_comments c
         join comment_tree ct on c.reply_to = ct.id
         where c.post_id = $1
       )
       select id from comment_tree`,
      [postId, rootId],
    );
    return rows.map((row) => row.id);
  }

  private async getSerializedComment(commentId: string, postId: string) {
    const comments = await this.getPostCommentTree(postId);
    const stack = [...comments];
    while (stack.length > 0) {
      const next = stack.shift();
      if (!next) continue;
      if (next.id === commentId) return next;
      stack.push(...next.replies);
    }
    throw new NotFoundException(`Comment ${commentId} not found`);
  }

  private async getPostCommentTree(postId: string) {
    const { rows } = await this.database.query<CommentRow>(
      `select * from app_post_comments where post_id = $1 order by created_at asc`,
      [postId],
    );
    const reactionCounts = await this.getCommentReactionCounts(rows.map((row) => row.id));
    const childrenByParent = new Map<string | null, CommentRow[]>();
    for (const row of rows) {
      const key = row.reply_to ?? null;
      const bucket = childrenByParent.get(key) ?? [];
      bucket.push(row);
      childrenByParent.set(key, bucket);
    }

    const serialize = (row: CommentRow): SerializedComment => {
      const replies = (childrenByParent.get(row.id) ?? []).map((child) => serialize(child));
      return {
        id: row.id,
        postId: row.post_id,
        authorId: row.author_id,
        author: row.author,
        message: row.message,
        replyTo: row.reply_to,
        createdAt: this.iso(row.created_at),
        likeCount: reactionCounts[row.id]?.like ?? row.like_count ?? 0,
        isLikedByMe: row.is_liked_by_me,
        isReported: row.is_reported,
        isEdited: row.is_edited,
        reactions: reactionCounts[row.id] ?? {},
        mentions: row.mentions ?? [],
        replyCount: replies.length,
        replies,
      };
    };

    return (childrenByParent.get(null) ?? []).map((row) => serialize(row));
  }

  private async getCommentReactionCounts(commentIds: string[]) {
    if (commentIds.length === 0) {
      return {} as Record<string, Record<string, number>>;
    }
    const { rows } = await this.database.query<
      QueryResultRow & { comment_id: string; reaction: string; count: string }
    >(
      `select comment_id, reaction, count(*)::text as count
       from app_post_comment_reactions
       where comment_id = any($1::text[])
       group by comment_id, reaction`,
      [commentIds],
    );
    return rows.reduce<Record<string, Record<string, number>>>((acc, row) => {
      acc[row.comment_id] ??= {};
      acc[row.comment_id][row.reaction] = Number(row.count);
      return acc;
    }, {});
  }

  private async assertEmailAndUsernameAvailable(email: string, username: string) {
    const duplicateEmail = await this.database.query(
      `select 1 from app_users where lower(email) = lower($1) limit 1`,
      [email],
    );
    if (duplicateEmail.rows[0]) {
      throw new ConflictException('Email already exists. Please use another email.');
    }
    const duplicateUsername = await this.database.query(
      `select 1 from app_users where username = $1 limit 1`,
      [username],
    );
    if (duplicateUsername.rows[0]) {
      throw new ConflictException(
        'Username already exists. Please choose another username.',
      );
    }
  }

  private async usernameExists(username: string) {
    const result = await this.database.query(
      `select 1 from app_users where username = $1 limit 1`,
      [username],
    );
    return Boolean(result.rows[0]);
  }

  async assertUsernameAvailable(username: string, excludeUserId?: string) {
    const { rows } = await this.database.query<QueryResultRow & { id: string }>(
      excludeUserId
        ? `select id from app_users where username = $1 and id <> $2 limit 1`
        : `select id from app_users where username = $1 limit 1`,
      excludeUserId ? [username, excludeUserId] : [username],
    );
    if (rows[0]) {
      throw new ConflictException(
        'Username already exists. Please choose another username.',
      );
    }
  }

  private async issueTokens(userId: string) {
    const sessionId = `ses_${randomUUID().replace(/-/g, '')}`;
    const createdAt = new Date().toISOString();
    const user = await this.getUser(userId);
    const accessTtlSeconds = this.getTokenTtlSeconds(
      process.env.SESSION_ACCESS_EXPIRES_IN,
      60 * 60,
    );
    const refreshTtlSeconds = this.getTokenTtlSeconds(
      process.env.SESSION_REFRESH_EXPIRES_IN,
      60 * 60 * 24 * 30,
    );
    const accessExpiresAt = new Date(Date.now() + accessTtlSeconds * 1000).toISOString();
    const refreshExpiresAt = new Date(Date.now() + refreshTtlSeconds * 1000).toISOString();
    const accessToken = this.jwtTokens.signToken(
      {
        sub: userId,
        sid: sessionId,
        type: 'access',
        role: String(user.role ?? ''),
        email: String(user.email ?? ''),
      },
      accessTtlSeconds,
      this.readJwtSecret('JWT_SECRET'),
    );
    const refreshToken = this.jwtTokens.signToken(
      {
        sub: userId,
        sid: sessionId,
        type: 'refresh',
        role: String(user.role ?? ''),
        email: String(user.email ?? ''),
      },
      refreshTtlSeconds,
      this.readJwtSecret('JWT_REFRESH_SECRET', 'JWT_SECRET'),
    );

    await this.database.query(
      `insert into auth_sessions (
        session_id, user_id, access_token, refresh_token, created_at, access_expires_at, refresh_expires_at
      ) values (
        $1,$2,$3,$4,$5,$6,$7
      )`,
      [
        sessionId,
        userId,
        accessToken,
        refreshToken,
        createdAt,
        accessExpiresAt,
        refreshExpiresAt,
      ],
    );

    return {
      sessionId,
      accessToken,
      refreshToken,
      createdAt,
      expiresInSeconds: accessTtlSeconds,
      refreshExpiresInSeconds: refreshTtlSeconds,
      tokenType: 'Bearer',
    };
  }

  private verifyAccessToken(token: string) {
    return this.jwtTokens.verifyToken(
      token,
      this.readJwtSecret('JWT_SECRET'),
      'access',
    );
  }

  private verifyRefreshToken(token: string) {
    return this.jwtTokens.verifyToken(
      token,
      this.readJwtSecret('JWT_REFRESH_SECRET', 'JWT_SECRET'),
      'refresh',
    );
  }

  private readJwtSecret(primaryKey: string, fallbackKey?: string) {
    const primary = process.env[primaryKey]?.trim();
    const fallback = fallbackKey ? process.env[fallbackKey]?.trim() : undefined;
    const resolved = primary || fallback;
    if (resolved) {
      return resolved;
    }
    if ((process.env.NODE_ENV ?? '').trim().toLowerCase() === 'production') {
      throw new UnauthorizedException(`${primaryKey} is required in production.`);
    }
    return 'dev-only-jwt-secret-change-me';
  }

  private buildSessionPayload(
    user: Record<string, unknown>,
    tokens: Awaited<ReturnType<CoreDatabaseService['issueTokens']>>,
    extras: Record<string, unknown> = {},
  ) {
    return {
      token: tokens.accessToken,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      sessionId: tokens.sessionId,
      tokenType: tokens.tokenType,
      expiresInSeconds: tokens.expiresInSeconds,
      refreshExpiresInSeconds: tokens.refreshExpiresInSeconds,
      sessionCreatedAt: tokens.createdAt,
      isLoggedIn: true,
      user,
      ...extras,
    };
  }

  private hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  private verifyPassword(password: string, storedHash: string) {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) {
      return false;
    }
    const derived = scryptSync(password, salt, 64);
    const target = Buffer.from(key, 'hex');
    return target.length === derived.length && timingSafeEqual(derived, target);
  }

  private mapUser(row: UserRow) {
    const normalizedRole = row.role.trim().toLowerCase();
    const verificationStatus = this.normalizeVerificationStatus(
      row.verification,
      row.email_verified,
    );
    const verified = row.email_verified || verificationStatus.includes('verified');
    const badgeStyle = this.normalizeBadgeStyle(normalizedRole);

    return {
      id: row.id,
      name: row.name,
      username: row.username,
      email: row.email,
      avatar: row.avatar,
      avatarUrl: row.avatar,
      bio: row.bio,
      interests: Array.isArray(row.interests) ? row.interests : [],
      role: normalizedRole,
      verification: verificationStatus,
      verified,
      verificationStatus,
      verificationReason: verified
        ? 'identity confirmed'
        : 'Email verification is still pending.',
      badgeStyle,
      status: row.status,
      followers: row.followers,
      following: row.following,
      website: row.website ?? '',
      location: row.location ?? '',
      coverImageUrl: row.cover_image_url ?? '',
      coverUrl: row.cover_image_url ?? '',
      coverPhotoUrl: row.cover_image_url ?? '',
      isPrivate: row.is_private ?? false,
      publicProfileUrl: `https://optizenqor.app/@${row.username}`,
      profilePreview: `${row.name} on OptiZenqor`,
      note: row.note ?? null,
      notePrivacy: row.note_privacy ?? 'followers',
      supporterBadge: row.supporter_badge ?? false,
      walletSummary: row.wallet_summary,
      health: row.health,
      reports: row.reports,
      lastActive: row.last_active,
      emailVerified: row.email_verified,
      blocked: row.blocked,
    };
  }

  private toUserPreview(user: ReturnType<CoreDatabaseService['mapUser']>) {
    return {
      id: user.id,
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      avatarUrl: user.avatar,
      bio: user.bio,
      role: user.role,
      verification: user.verification,
      verificationStatus: user.verificationStatus,
      verified: user.verified,
      followers: user.followers,
      following: user.following,
      website: user.website,
      location: user.location,
      coverImageUrl: user.coverImageUrl,
      coverUrl: user.coverUrl,
      coverPhotoUrl: user.coverPhotoUrl,
      publicProfileUrl: user.publicProfileUrl,
      badgeStyle: user.badgeStyle,
      isPrivate: user.isPrivate,
      verificationReason: user.verificationReason,
      note: user.note,
      notePrivacy: user.notePrivacy,
      supporterBadge: user.supporterBadge,
    };
  }

  private normalizeVerificationStatus(value: string, emailVerified: boolean) {
    if (emailVerified) {
      return 'verified';
    }

    const normalized = value.trim().toLowerCase().replace(/\s+/g, '_');
    if (!normalized) {
      return 'not_requested';
    }
    return normalized;
  }

  private normalizeBadgeStyle(role: string) {
    switch (role) {
      case 'creator':
      case 'business':
      case 'seller':
      case 'recruiter':
        return role;
      default:
        return 'standard';
    }
  }

  private mapPost(row: PostRow) {
    return {
      id: row.id,
      authorId: row.author_id,
      caption: row.caption,
      media: row.media ?? [],
      tags: row.tags ?? [],
      likes: row.likes,
      comments: row.comments,
      shares: row.shares,
      views: row.views,
      taggedUserIds: [],
      mentionUsernames: [],
      location: null,
      status: row.status,
      type: row.type,
      createdAt: this.iso(row.created_at),
    };
  }

  private async getBuddyRequestRow(requestId: string) {
    const { rows } = await this.database.query<BuddyRequestRow>(
      `select * from app_buddy_requests where id = $1 limit 1`,
      [requestId],
    );
    const row = rows[0];
    if (!row) {
      throw new NotFoundException(`Buddy request ${requestId} not found`);
    }
    return row;
  }

  private async getBuddyRelationByUsers(userAId: string, userBId: string) {
    const pair = this.normalizeBuddyPair(userAId, userBId);
    const { rows } = await this.database.query<BuddyRelationRow>(
      `select *
       from app_buddy_relations
       where user_a_id = $1 and user_b_id = $2
       limit 1`,
      [pair.userAId, pair.userBId],
    );
    const row = rows[0];
    if (!row) {
      throw new NotFoundException(
        `Buddy relation between ${pair.userAId} and ${pair.userBId} not found`,
      );
    }
    return row;
  }

  private normalizeBuddyPair(userAId: string, userBId: string) {
    const [left, right] = [userAId.trim(), userBId.trim()].sort();
    return {
      userAId: left,
      userBId: right,
    };
  }

  private async mapBuddyRelationRow(row: BuddyRelationRow, viewerId: string) {
    const buddyUserId = row.user_a_id === viewerId ? row.user_b_id : row.user_a_id;
    const user = this.toUserPreview(await this.getUser(buddyUserId));
    return {
      id: row.id,
      status: 'accepted',
      mutualCount: await this.getMutualCount(viewerId, buddyUserId),
      createdAt: this.iso(row.created_at),
      user,
    };
  }

  private async mapBuddyRequestRow(
    row: BuddyRequestRow,
    viewerId: string,
    perspective: 'sent' | 'received',
  ) {
    const otherUserId = perspective === 'sent' ? row.target_id : row.requester_id;
    const user = this.toUserPreview(await this.getUser(otherUserId));
    const status =
      row.status === 'pending'
        ? perspective === 'sent'
          ? 'pending_sent'
          : 'pending_received'
        : row.status;
    return {
      id: row.id,
      status,
      mutualCount: await this.getMutualCount(viewerId, otherUserId),
      createdAt: this.iso(row.created_at),
      user,
    };
  }

  private async getMutualCount(actorId: string, targetId: string) {
    const { rows } = await this.database.query<QueryResultRow & { count: string }>(
      `select count(*)::text as count
       from (
         select actor_rel.target_id
         from app_follow_relations actor_rel
         join app_follow_relations target_rel
           on target_rel.target_id = actor_rel.target_id
         where actor_rel.follower_id = $1
           and target_rel.follower_id = $2
           and actor_rel.target_id not in ($1, $2)
       ) mutuals`,
      [actorId, targetId],
    );
    return Number(rows[0]?.count ?? '0');
  }

  private mapThread(row: ThreadRow) {
    return {
      id: row.id,
      threadId: row.id,
      chatId: row.id,
      title: row.title,
      participantsLabel: row.participants_label,
      flag: row.flag ?? undefined,
      summary: row.summary,
    };
  }

  private mapMessage(row: MessageRow) {
    return {
      id: row.id,
      chatId: row.thread_id,
      threadId: row.thread_id,
      senderId: row.sender_id,
      text: row.text,
      read: row.read,
      starred: false,
      timestamp: this.iso(row.timestamp),
      attachments: row.attachments ?? [],
      replyToMessageId: row.reply_to_message_id,
      deliveryState: row.delivery_state,
      kind: row.kind,
      mediaPath: row.media_path,
    };
  }

  private mapNotification(row: NotificationRow) {
    const metadata =
      row.metadata && typeof row.metadata === 'object' ? row.metadata : {};
    return {
      id: row.id,
      recipientId: row.recipient_id,
      title: row.title,
      body: row.body,
      createdAt: this.iso(row.created_at),
      unread: !row.read,
      read: row.read,
      actorName: this.resolveNotificationActorName(row.title, metadata),
      entityType: this.resolveNotificationEntityType(
        row.route_name,
        row.entity_id,
        metadata,
      ),
      payload: {
        type: row.type,
        routeName: row.route_name,
        entityId: row.entity_id ?? undefined,
        metadata,
      },
    };
  }

  private resolveNotificationActorName(
    title: string,
    metadata: Record<string, unknown>,
  ) {
    const fromMetadata = [metadata.actorName, metadata.senderName].find(
      (value) => typeof value === 'string' && value.trim().length > 0,
    );
    if (typeof fromMetadata === 'string') {
      return fromMetadata.trim();
    }

    const patterns = [
      /^New message from (.+)$/i,
      /^(.+?) reacted to /i,
      /^(.+?) replied to /i,
      /^(.+?) commented on /i,
      /^(.+?) followed /i,
    ];

    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match?.[1]?.trim()) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  private resolveNotificationEntityType(
    routeName: string,
    entityId: string | null,
    metadata: Record<string, unknown>,
  ) {
    if (typeof metadata.entityType === 'string' && metadata.entityType.trim()) {
      return metadata.entityType.trim();
    }
    if (typeof metadata.messageId === 'string' || routeName.includes('/chat/')) {
      return 'message';
    }
    if (typeof metadata.commentId === 'string') {
      return 'comment';
    }
    if (typeof metadata.postId === 'string' || routeName.includes('/posts')) {
      return 'post';
    }
    if (routeName.includes('/reels')) {
      return 'reel';
    }
    if (routeName.includes('/wallet') || String(entityId ?? '').startsWith('txn-')) {
      return 'order';
    }
    if (routeName.includes('/profile') || String(entityId ?? '').startsWith('u')) {
      return 'user';
    }
    return 'generic';
  }

  private iso(value: string | Date) {
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
  }
}
