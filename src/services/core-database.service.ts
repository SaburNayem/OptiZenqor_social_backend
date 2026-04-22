import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'crypto';
import { QueryResultRow } from 'pg';
import { coreSeedCommentReactions, coreSeedFollows, coreSeedMessages, coreSeedNotifications, coreSeedPostComments, coreSeedPostReactions, coreSeedPosts, coreSeedThreads, coreSeedUsers } from '../database/core-seed';
import { DatabaseService } from './database.service';

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
  constructor(private readonly database: DatabaseService) {}

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
    const id = `u${Date.now()}`;
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
    return {
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      sessionId: tokens.sessionId,
      tokenType: tokens.tokenType,
      expiresInSeconds: tokens.expiresInSeconds,
      refreshExpiresInSeconds: tokens.refreshExpiresInSeconds,
      user: this.mapUser(userRow),
      sessionCreatedAt: tokens.createdAt,
    };
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

      const id = `u${Date.now()}`;
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
    return {
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      sessionId: tokens.sessionId,
      tokenType: tokens.tokenType,
      expiresInSeconds: tokens.expiresInSeconds,
      refreshExpiresInSeconds: tokens.refreshExpiresInSeconds,
      user: this.mapUser(userRow),
      provider: 'google',
      sessionCreatedAt: tokens.createdAt,
    };
  }

  async refreshUserToken(refreshToken: string) {
    const { rows } = await this.database.query<QueryResultRow & { user_id: string }>(
      `select user_id from auth_sessions where refresh_token = $1 limit 1`,
      [refreshToken],
    );
    const session = rows[0];
    if (!session) {
      throw new UnauthorizedException('Invalid refresh token.');
    }
    await this.database.query(`delete from auth_sessions where refresh_token = $1`, [refreshToken]);
    const tokens = await this.issueTokens(session.user_id);
    return {
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      sessionId: tokens.sessionId,
      tokenType: tokens.tokenType,
      expiresInSeconds: tokens.expiresInSeconds,
      refreshExpiresInSeconds: tokens.refreshExpiresInSeconds,
      user: await this.getUser(session.user_id),
      sessionCreatedAt: tokens.createdAt,
    };
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
    const { rows } = await this.database.query<QueryResultRow & { user_id: string }>(
      `select user_id from auth_sessions where access_token = $1 limit 1`,
      [accessToken],
    );
    const session = rows[0];
    if (!session) {
      return null;
    }
    return this.getUser(session.user_id);
  }

  async updateUserProfile(
    id: string,
    patch: Partial<{ name: string; username: string; bio: string; avatar: string }>,
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
           updated_at = now()
       where id = $1`,
      [id, patch.name ?? null, patch.username ?? null, patch.bio ?? null, patch.avatar ?? null],
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
      throw new ConflictException('Already following this user.');
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
    return { success: true, followerId, targetId, action: 'followed' };
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
    return { success: true, followerId, targetId, action: 'unfollowed' };
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
    const id = `p${Date.now()}`;
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
        metadata: { postId, reaction, actorId: userId },
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

    const id = `pc${Date.now()}`;
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
        metadata: { postId, commentId: id, replyTo: options?.replyTo ?? null },
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
        metadata: { postId, commentId, reaction, actorId: userId },
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
      rows.map(async (thread) => ({
        ...this.mapThread(thread),
        participants: await this.getThreadParticipants(thread.id),
        messages: await this.getThreadMessages(thread.id),
      })),
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
    return {
      ...this.mapThread(row),
      participantIds: await this.getThreadParticipantIds(id),
      participants: await this.getThreadParticipants(id),
      messages: await this.getThreadMessages(id),
    };
  }

  async getThreadParticipantIds(threadId: string) {
    const { rows } = await this.database.query<QueryResultRow & { user_id: string }>(
      `select user_id from chat_thread_participants where thread_id = $1 order by created_at asc`,
      [threadId],
    );
    return rows.map((row) => row.user_id);
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
    await this.getUser(senderId);
    const id = `m${Date.now()}`;
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
    for (const participantId of thread.participantIds.filter((id) => id !== senderId)) {
      await this.pushNotification({
        recipientId: participantId,
        title: `New message from ${sender.name}`,
        body: text || `${sender.username} sent an attachment.`,
        routeName: `/chat/threads/${threadId}`,
        entityId: id,
        type: 'social',
        metadata: { threadId, messageId: id, senderId },
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
    metadata?: Record<string, unknown>;
  }) {
    const id = `n${Date.now()}${Math.floor(Math.random() * 1000)}`;
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
        JSON.stringify(input.metadata ?? {}),
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
      alter table app_users
      add column if not exists interests jsonb not null default '[]'::jsonb;
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
  }

  private async seedCoreData() {
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

  private async getThreadMessages(threadId: string) {
    const { rows } = await this.database.query<MessageRow>(
      `select * from chat_messages where thread_id = $1 order by timestamp asc`,
      [threadId],
    );
    return rows.map((row) => this.mapMessage(row));
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

  private async issueTokens(userId: string) {
    const accessToken = `atk_${randomUUID().replace(/-/g, '')}${randomBytes(8).toString('hex')}`;
    const refreshToken = `rtk_${randomUUID().replace(/-/g, '')}${randomBytes(8).toString('hex')}`;
    const sessionId = `ses_${randomUUID().replace(/-/g, '')}`;
    const createdAt = new Date().toISOString();
    const accessExpiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
    const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();

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
      expiresInSeconds: 3600,
      refreshExpiresInSeconds: 60 * 60 * 24 * 30,
      tokenType: 'Bearer',
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
    return {
      id: row.id,
      name: row.name,
      username: row.username,
      email: row.email,
      avatar: row.avatar,
      bio: row.bio,
      interests: Array.isArray(row.interests) ? row.interests : [],
      role: row.role,
      verification: row.verification,
      status: row.status,
      followers: row.followers,
      following: row.following,
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
      role: user.role,
      verification: user.verification,
    };
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
      status: row.status,
      type: row.type,
      createdAt: this.iso(row.created_at),
    };
  }

  private mapThread(row: ThreadRow) {
    return {
      id: row.id,
      title: row.title,
      participantsLabel: row.participants_label,
      flag: row.flag ?? undefined,
      summary: row.summary,
    };
  }

  private mapMessage(row: MessageRow) {
    return {
      id: row.id,
      threadId: row.thread_id,
      senderId: row.sender_id,
      text: row.text,
      read: row.read,
      timestamp: this.iso(row.timestamp),
      attachments: row.attachments ?? [],
      replyToMessageId: row.reply_to_message_id,
      deliveryState: row.delivery_state,
      kind: row.kind,
      mediaPath: row.media_path,
    };
  }

  private mapNotification(row: NotificationRow) {
    return {
      id: row.id,
      recipientId: row.recipient_id,
      title: row.title,
      body: row.body,
      createdAt: this.iso(row.created_at),
      read: row.read,
      payload: {
        type: row.type,
        routeName: row.route_name,
        entityId: row.entity_id ?? undefined,
        metadata: row.metadata ?? {},
      },
    };
  }

  private iso(value: string | Date) {
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
  }
}
