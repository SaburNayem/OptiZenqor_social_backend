import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes, randomUUID } from 'crypto';
import { makeId } from '../common/id.util';
import { EcosystemDataService } from './ecosystem-data.service';
import { StateSnapshotService } from '../services/state-snapshot.service';

export type RoleType =
  | 'User'
  | 'Creator'
  | 'Business'
  | 'Seller'
  | 'Recruiter'
  | 'Super Admin'
  | 'Operations Admin'
  | 'Content Moderator'
  | 'Finance Admin'
  | 'Support Admin'
  | 'Analytics Viewer';

export interface UserRecord {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  role: RoleType;
  verification: 'Verified' | 'Pending' | 'Eligible' | 'Not Requested';
  status: 'Active' | 'Review' | 'Suspended';
  followers: number;
  following: number;
  walletSummary: string;
  health: string;
  reports: string;
  lastActive: string;
  emailVerified: boolean;
  blocked?: boolean;
}

export interface PostRecord {
  id: string;
  authorId: string;
  caption: string;
  media: string[];
  tags: string[];
  likes: number;
  comments: number;
  shares: number;
  views: number;
  status: 'Visible' | 'Featured' | 'Under review' | 'Muted reach';
  type: 'post' | 'story' | 'reel';
  createdAt: string;
}

export interface StoryRecord {
  id: string;
  userId: string;
  text?: string;
  media: string;
  mediaItems?: string[];
  seen: boolean;
  isLocalFile: boolean;
  music?: string;
  backgroundColors: number[];
  textColorValue: number;
  sticker?: string | null;
  effectName?: string | null;
  mentionUsername?: string | null;
  mentionUsernames?: string[];
  linkLabel?: string | null;
  linkUrl?: string | null;
  privacy?: string;
  location?: string | null;
  collageLayout?: string | null;
  textOffsetDx?: number;
  textOffsetDy?: number;
  textScale?: number;
  mediaTransforms?: Array<{
    offsetDx?: number;
    offsetDy?: number;
    scale?: number;
    zIndex?: number;
    widthFactor?: number;
    heightFactor?: number;
    borderRadius?: number;
  }>;
  createdAt: string;
  expiresAt?: string;
}

export interface ReelRecord {
  id: string;
  authorId: string;
  caption: string;
  audioName: string;
  thumbnail: string;
  videoUrl: string;
  likes: number;
  comments: number;
  shares: number;
  viewCount: number;
  coverUrl?: string;
  textOverlays: string[];
  subtitleEnabled: boolean;
  trimInfo?: string;
  remixEnabled: boolean;
  isDraft: boolean;
  createdAt: string;
}

export interface MessageRecord {
  id: string;
  threadId: string;
  senderId: string;
  text: string;
  read: boolean;
  timestamp: string;
  attachments?: string[];
  replyToMessageId?: string | null;
  deliveryState?: 'sent' | 'delivered' | 'read';
  kind?: 'text' | 'image' | 'video' | 'audio' | 'file';
  mediaPath?: string | null;
}

export interface ThreadRecord {
  id: string;
  title: string;
  participantIds: string[];
  participantsLabel: string;
  flag?: string;
  summary: string;
}

interface PostReactionRecord {
  postId: string;
  userId: string;
  reaction: string;
  createdAt: string;
}

export interface EventRecord {
  id: string;
  title: string;
  organizer: string;
  date: string;
  time: string;
  location: string;
  status: 'Featured' | 'Approved' | 'Review';
  participants: number;
  price: number;
  rsvped: boolean;
  saved: boolean;
  mediaGallery: string[];
  hostToolsSummary: string;
}

export interface ProductRecord {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  subcategory: string;
  sellerId: string;
  sellerName: string;
  location: string;
  images: string[];
  condition: string;
  listingStatus: string;
  reviewStatus: string;
  views: number;
  watchers: number;
  chats: number;
}

export interface WalletTransactionRecord {
  id: string;
  userId: string;
  title: string;
  amount: number;
  channel: string;
  status: 'Pending' | 'Success' | 'Review';
  createdAt: string;
}

export interface SubscriptionRecord {
  userId: string;
  userName: string;
  planName: string;
  startDate: string;
  renewalDate: string;
  billingType: string;
  status: 'Active' | 'Canceled';
}

export interface PlanRecord {
  id: string;
  name: string;
  price: number;
  interval: string;
  features: string[];
  status: 'Active' | 'Draft';
}

export interface NotificationCampaignRecord {
  id: string;
  name: string;
  audience: string;
  schedule: string;
  status: 'Draft' | 'Scheduled' | 'Sent';
  delivered?: string;
  openRate?: string;
}

interface BlockRelationRecord {
  actorId: string;
  targetId: string;
  reason: string | null;
  blockedAt: string;
}

@Injectable()
export class PlatformDataService implements OnModuleInit {
  constructor(
    private readonly ecosystemData: EcosystemDataService,
    private readonly stateSnapshots: StateSnapshotService,
  ) {}

  private readonly users: UserRecord[] = [];

  private readonly userPasswords = new Map<string, string>();

  private readonly userSessions = new Map<
    string,
    { userId: string; refreshToken: string; createdAt: string }
  >();

  private readonly refreshSessions = new Map<
    string,
    { userId: string; accessToken: string; createdAt: string }
  >();

  private readonly followRelations = new Set<string>();
  private readonly blockRelations: BlockRelationRecord[] = [];
  private readonly postReactions: PostReactionRecord[] = [];

  private readonly posts: PostRecord[] = [];

  private readonly stories: StoryRecord[] = [];

  private readonly reels: ReelRecord[] = [];

  private readonly threads: ThreadRecord[] = [];

  private readonly messages: MessageRecord[] = [];

  private readonly events: EventRecord[] = [];

  private readonly products: ProductRecord[] = [];

  private readonly walletTransactions: WalletTransactionRecord[] = [];

  private readonly subscriptions: SubscriptionRecord[] = [];

  private readonly plans: PlanRecord[] = [];

  private readonly campaigns: NotificationCampaignRecord[] = [];

  async onModuleInit() {
    const snapshot = await this.stateSnapshots.load<{
      blockRelations: BlockRelationRecord[];
      stories: StoryRecord[];
      reels: ReelRecord[];
      events: EventRecord[];
      products: ProductRecord[];
      campaigns: NotificationCampaignRecord[];
    }>('platform_data_state');

    if (!snapshot) {
      return;
    }

    this.replaceArray(this.blockRelations, snapshot.blockRelations);
    this.replaceArray(this.stories, snapshot.stories);
    this.replaceArray(this.reels, snapshot.reels);
    this.replaceArray(this.events, snapshot.events);
    this.replaceArray(this.products, snapshot.products);
    this.replaceArray(this.campaigns, snapshot.campaigns);
  }

  getUsers(role?: string) {
    return role ? this.users.filter((user) => user.role === role) : this.users;
  }

  getDemoAuthAccounts() {
    return this.users.map((user) => ({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      password: this.userPasswords.get(user.email) ?? '123456',
      emailVerified: user.emailVerified,
    }));
  }

  getUser(id: string) {
    const user = this.users.find((item) => item.id === id);
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  private toUserPreview(user: UserRecord) {
    return {
      id: user.id,
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      role: user.role,
      verification: user.verification,
    };
  }

  resolveUserFromAccessToken(accessToken?: string) {
    if (!accessToken) {
      return null;
    }
    const session = this.userSessions.get(accessToken);
    return session ? this.getUser(session.userId) : null;
  }

  private issueTokens(userId: string) {
    const accessToken = `atk_${randomUUID().replace(/-/g, '')}${randomBytes(8).toString('hex')}`;
    const refreshToken = `rtk_${randomUUID().replace(/-/g, '')}${randomBytes(8).toString('hex')}`;
    const sessionId = `ses_${randomUUID().replace(/-/g, '')}`;
    const createdAt = new Date().toISOString();

    this.userSessions.set(accessToken, { userId, refreshToken, createdAt });
    this.refreshSessions.set(refreshToken, { userId, accessToken, createdAt });

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

  getUserByEmail(email: string) {
    const user = this.users.find((item) => item.email === email);
    if (!user) {
      throw new UnauthorizedException(
        'Invalid credentials. Use one of the demo emails shown in /auth/demo-accounts.',
      );
    }
    return user;
  }

  authenticateUser(input: { email: string; password: string }) {
    const user = this.getUserByEmail(input.email);
    const expectedPassword = this.userPasswords.get(user.email) ?? '123456';
    if (input.password !== expectedPassword) {
      throw new UnauthorizedException('Invalid password. Demo password is 123456.');
    }
    if (!user.emailVerified) {
      throw new UnauthorizedException(
        'Email is not verified yet. Complete email verification before login.',
      );
    }
    if (user.blocked) {
      throw new UnauthorizedException('This account is currently blocked.');
    }
    const tokens = this.issueTokens(user.id);
    return {
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      sessionId: tokens.sessionId,
      tokenType: tokens.tokenType,
      expiresInSeconds: tokens.expiresInSeconds,
      refreshExpiresInSeconds: tokens.refreshExpiresInSeconds,
      user,
      sessionCreatedAt: tokens.createdAt,
    };
  }

  loginWithGoogle(input: { email: string; name: string; googleIdToken?: string }) {
    let user = this.users.find((item) => item.email === input.email);
    if (!user) {
      const baseUsername = input.email
        .split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9._]/g, '');
      let username = baseUsername || `user${this.users.length + 1}`;
      while (this.users.some((item) => item.username === username)) {
        username = `${baseUsername}${Math.floor(Math.random() * 1000)}`;
      }
      user = {
        id: makeId('user'),
        name: input.name,
        username,
        email: input.email,
        avatar: 'https://placehold.co/120x120',
        bio: 'Google sign-in user.',
        role: 'User',
        verification: 'Verified',
        status: 'Active',
        followers: 0,
        following: 0,
        walletSummary: '$0 balance',
        health: 'Google sign-in',
        reports: '0 open reports',
        lastActive: 'just now',
        emailVerified: true,
        blocked: false,
      };
      this.users.unshift(user);
      this.userPasswords.set(user.email, '');
    }

    const tokens = this.issueTokens(user.id);
    return {
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      sessionId: tokens.sessionId,
      tokenType: tokens.tokenType,
      expiresInSeconds: tokens.expiresInSeconds,
      refreshExpiresInSeconds: tokens.refreshExpiresInSeconds,
      user,
      provider: 'google',
      sessionCreatedAt: tokens.createdAt,
    };
  }

  refreshUserToken(refreshToken: string) {
    const existing = this.refreshSessions.get(refreshToken);
    if (!existing) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    this.userSessions.delete(existing.accessToken);
    this.refreshSessions.delete(refreshToken);
    const tokens = this.issueTokens(existing.userId);
    return {
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      sessionId: tokens.sessionId,
      tokenType: tokens.tokenType,
      expiresInSeconds: tokens.expiresInSeconds,
      refreshExpiresInSeconds: tokens.refreshExpiresInSeconds,
      user: this.getUser(existing.userId),
      sessionCreatedAt: tokens.createdAt,
    };
  }

  revokeUserSession(accessToken?: string) {
    if (!accessToken) {
      return { success: true, revoked: false };
    }
    const session = this.userSessions.get(accessToken);
    if (!session) {
      return { success: true, revoked: false };
    }
    this.userSessions.delete(accessToken);
    this.refreshSessions.delete(session.refreshToken);
    return { success: true, revoked: true };
  }

  createUser(input: {
    name: string;
    username: string;
    email: string;
    password: string;
    role: string;
  }) {
    const duplicateEmail = this.users.find((item) => item.email === input.email);
    if (duplicateEmail) {
      throw new ConflictException('Email already exists. Please use another email.');
    }

    const duplicateUsername = this.users.find(
      (item) => item.username === input.username,
    );
    if (duplicateUsername) {
      throw new ConflictException(
        'Username already exists. Please choose another username.',
      );
    }

    const user: UserRecord = {
      id: makeId('user'),
      name: input.name,
      username: input.username,
      email: input.email,
      avatar: 'https://placehold.co/120x120',
      bio: 'Newly created account from signup flow.',
      role: input.role as RoleType,
      verification: 'Not Requested',
      status: 'Active',
      followers: 0,
      following: 0,
      walletSummary: '$0 balance',
      health: 'New account',
      reports: '0 open reports',
      lastActive: 'just now',
      emailVerified: false,
      blocked: false,
    };

    this.users.unshift(user);
    this.userPasswords.set(user.email, input.password);
    return user;
  }

  updateUserProfile(
    id: string,
    patch: Partial<Pick<UserRecord, 'name' | 'username' | 'bio' | 'avatar'>>,
  ) {
    const user = this.getUser(id);
    if (
      patch.username &&
      this.users.some((item) => item.id !== id && item.username === patch.username)
    ) {
      throw new ConflictException('Username already exists. Please choose another username.');
    }
    Object.assign(user, patch);
    return user;
  }

  changePassword(input: { email: string; oldPassword: string; newPassword: string }) {
    const user = this.getUserByEmail(input.email);
    const currentPassword = this.userPasswords.get(user.email) ?? '';
    if (currentPassword !== input.oldPassword) {
      throw new UnauthorizedException('Old password is incorrect.');
    }
    this.userPasswords.set(user.email, input.newPassword);
    return {
      success: true,
      userId: user.id,
      email: user.email,
      message: 'Password changed successfully.',
    };
  }

  forceSetPassword(email: string, newPassword: string) {
    const user = this.getUserByEmail(email);
    this.userPasswords.set(user.email, newPassword);
    return {
      success: true,
      userId: user.id,
      email: user.email,
      message: 'Password reset successfully.',
    };
  }

  deleteUserAccount(id: string) {
    const index = this.users.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new NotFoundException(`User ${id} not found`);
    }
    const [removed] = this.users.splice(index, 1);
    this.userPasswords.delete(removed.email);
    for (const [accessToken, session] of [...this.userSessions.entries()]) {
      if (session.userId === removed.id) {
        this.userSessions.delete(accessToken);
        this.refreshSessions.delete(session.refreshToken);
      }
    }
    return {
      success: true,
      removedUserId: removed.id,
      email: removed.email,
      message: 'User account deleted successfully.',
    };
  }

  followUser(targetId: string, followerId: string) {
    this.getUser(targetId);
    this.getUser(followerId);
    const key = `${followerId}:${targetId}`;
    if (this.followRelations.has(key)) {
      throw new ConflictException('Already following this user.');
    }
    this.followRelations.add(key);
    return { success: true, followerId, targetId, action: 'followed' };
  }

  unfollowUser(targetId: string, followerId: string) {
    this.getUser(targetId);
    this.getUser(followerId);
    const key = `${followerId}:${targetId}`;
    this.followRelations.delete(key);
    return { success: true, followerId, targetId, action: 'unfollowed' };
  }

  getFollowers(targetId: string) {
    this.getUser(targetId);
    return [...this.followRelations]
      .filter((relation) => relation.endsWith(`:${targetId}`))
      .map((relation) => relation.split(':')[0])
      .map((followerId) => this.toUserPreview(this.getUser(followerId)));
  }

  getFollowing(userId: string) {
    this.getUser(userId);
    return [...this.followRelations]
      .filter((relation) => relation.startsWith(`${userId}:`))
      .map((relation) => relation.split(':')[1])
      .map((targetId) => this.toUserPreview(this.getUser(targetId)));
  }

  async blockUser(targetId: string, actorId: string, reason?: string) {
    this.getUser(targetId);
    this.getUser(actorId);
    const existing = this.blockRelations.find(
      (relation) => relation.actorId === actorId && relation.targetId === targetId,
    );
    if (existing) {
      return {
        success: true,
        actorId,
        targetId,
        action: 'already_blocked',
        reason: existing.reason,
        blockedAt: existing.blockedAt,
      };
    }

    const blockRecord: BlockRelationRecord = {
      actorId,
      targetId,
      reason: reason ?? null,
      blockedAt: new Date().toISOString(),
    };
    this.blockRelations.unshift(blockRecord);
    await this.persistState();
    return {
      success: true,
      actorId,
      targetId,
      action: 'blocked',
      reason: blockRecord.reason,
      blockedAt: blockRecord.blockedAt,
    };
  }

  async unblockUser(targetId: string, actorId: string) {
    this.getUser(targetId);
    this.getUser(actorId);
    const before = this.blockRelations.length;
    const filtered = this.blockRelations.filter(
      (relation) => !(relation.actorId === actorId && relation.targetId === targetId),
    );
    this.blockRelations.splice(0, this.blockRelations.length, ...filtered);
    await this.persistState();
    return {
      success: true,
      actorId,
      targetId,
      action: 'unblocked',
      removed: before !== this.blockRelations.length,
    };
  }

  getBlockedUsers(actorId?: string) {
    const list = actorId
      ? this.blockRelations.filter((relation) => relation.actorId === actorId)
      : this.blockRelations;
    return list.map((relation) => {
      const user = this.getUser(relation.targetId);
      return {
        actorId: relation.actorId,
        targetId: relation.targetId,
        reason: relation.reason,
        blockedAt: relation.blockedAt,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          avatar: user.avatar,
        },
      };
    });
  }

  getBlockedUser(targetId: string, actorId?: string) {
    const blockedUsers = this.getBlockedUsers(actorId);
    const blockedUser = blockedUsers.find((item) => item.targetId === targetId);
    if (!blockedUser) {
      throw new NotFoundException(`Blocked user ${targetId} not found`);
    }
    return blockedUser;
  }

  markEmailVerified(email: string) {
    const user = this.users.find((item) => item.email === email);
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    user.emailVerified = true;
    return user;
  }

  getFeed() {
    return this.posts.map((post) => ({
      ...post,
      author: this.getUser(post.authorId),
    }));
  }

  getPosts(authorId?: string) {
    return authorId
      ? this.posts.filter((item) => item.authorId === authorId)
      : this.posts;
  }

  getPost(id: string) {
    const post = this.posts.find((item) => item.id === id);
    if (!post) {
      throw new NotFoundException(`Post ${id} not found`);
    }
    return post;
  }

  createPost(input: Pick<PostRecord, 'authorId' | 'caption' | 'media' | 'tags'>) {
    const post: PostRecord = {
      id: makeId('post'),
      authorId: input.authorId,
      caption: input.caption,
      media: input.media,
      tags: input.tags,
      likes: 0,
      comments: 0,
      shares: 0,
      views: 0,
      status: 'Visible',
      type: 'post',
      createdAt: new Date().toISOString(),
    };
    this.posts.unshift(post);
    return post;
  }

  getPostReactions(postId: string) {
    this.getPost(postId);
    return this.postReactions.filter((item) => item.postId === postId);
  }

  reactToPost(postId: string, userId: string, reaction: string) {
    const post = this.getPost(postId);
    this.getUser(userId);

    const existing = this.postReactions.find(
      (item) => item.postId === postId && item.userId === userId,
    );

    if (existing) {
      if (existing.reaction === reaction) {
        return {
          postId,
          userId,
          reaction,
          action: 'unchanged',
          reactions: this.getPostReactions(postId),
        };
      }
      existing.reaction = reaction;
      existing.createdAt = new Date().toISOString();
    } else {
      this.postReactions.push({
        postId,
        userId,
        reaction,
        createdAt: new Date().toISOString(),
      });
      post.likes += 1;
    }

    if (userId !== post.authorId) {
      const actor = this.getUser(userId);
      this.ecosystemData.pushNotification({
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
      action: existing ? 'updated' : 'created',
      reactions: this.getPostReactions(postId),
    };
  }

  toggleLike(postId: string) {
    return this.reactToPost(postId, 'u1', 'like');
  }

  unlikePost(postId: string) {
    const post = this.getPost(postId);
    const index = this.postReactions.findIndex(
      (item) => item.postId === postId && item.userId === 'u1',
    );
    if (index !== -1) {
      this.postReactions.splice(index, 1);
      post.likes = Math.max(0, post.likes - 1);
    }
    return {
      postId,
      userId: 'u1',
      action: 'removed',
      reactions: this.getPostReactions(postId),
    };
  }

  updatePost(
    id: string,
    patch: Partial<Pick<PostRecord, 'caption' | 'media' | 'tags' | 'status'>>,
  ) {
    const post = this.getPost(id);
    Object.assign(post, patch);
    return post;
  }

  deletePost(id: string) {
    const index = this.posts.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new NotFoundException(`Post ${id} not found`);
    }
    const [removed] = this.posts.splice(index, 1);
    return {
      success: true,
      removed,
      message: 'Post deleted successfully.',
    };
  }

  async getStories(userId?: string) {
    await this.syncStoriesFromSnapshot();
    this.pruneExpiredStories();
    const stories = userId
      ? this.stories.filter((story) => story.userId === userId)
      : this.stories;
    return stories.map((story) => this.mapStory(story));
  }

  getStory(id: string) {
    this.pruneExpiredStories();
    const story = this.stories.find((item) => item.id === id);
    if (!story) {
      throw new NotFoundException(`Story ${id} not found`);
    }
    return this.mapStory(story);
  }

  async createStory(
    input: Pick<
      StoryRecord,
      | 'userId'
      | 'text'
      | 'media'
      | 'mediaItems'
      | 'music'
      | 'isLocalFile'
      | 'backgroundColors'
      | 'textColorValue'
      | 'sticker'
      | 'effectName'
      | 'mentionUsername'
      | 'mentionUsernames'
      | 'linkLabel'
      | 'linkUrl'
      | 'privacy'
      | 'location'
      | 'collageLayout'
      | 'textOffsetDx'
      | 'textOffsetDy'
      | 'textScale'
      | 'mediaTransforms'
    >,
  ) {
    await this.syncStoriesFromSnapshot();
    const mediaItems = this.normalizeMediaItems(input.media, input.mediaItems);
    const mentionUsernames = this.normalizeStoryMentions(
      input.mentionUsernames,
      input.mentionUsername,
    );
    const createdAt = new Date();
    const story: StoryRecord = {
      id: makeId('story'),
      userId: input.userId,
      text: input.text,
      media: input.media || mediaItems[0] || '',
      mediaItems,
      seen: false,
      isLocalFile: input.isLocalFile,
      music: input.music,
      backgroundColors: input.backgroundColors,
      textColorValue: input.textColorValue,
      sticker: input.sticker ?? null,
      effectName: input.effectName ?? null,
      mentionUsername: mentionUsernames[0] ?? input.mentionUsername ?? null,
      mentionUsernames,
      linkLabel: input.linkLabel ?? null,
      linkUrl: input.linkUrl ?? null,
      privacy: input.privacy ?? 'Everyone',
      location: input.location?.trim() || null,
      collageLayout: input.collageLayout ?? null,
      textOffsetDx: input.textOffsetDx ?? 0,
      textOffsetDy: input.textOffsetDy ?? 0,
      textScale: input.textScale ?? 1,
      mediaTransforms: this.normalizeMediaTransforms(
        input.mediaTransforms,
        mediaItems.length,
      ),
      createdAt: createdAt.toISOString(),
      expiresAt: new Date(createdAt.getTime() + this.storyLifetimeMs).toISOString(),
    };
    this.stories.unshift(story);
    await this.persistState();
    return this.mapStory(story);
  }

  async updateStory(
    id: string,
    patch: Partial<
      Pick<
        StoryRecord,
        | 'text'
        | 'media'
        | 'mediaItems'
        | 'seen'
        | 'music'
        | 'isLocalFile'
        | 'backgroundColors'
        | 'textColorValue'
        | 'sticker'
        | 'effectName'
        | 'mentionUsername'
        | 'mentionUsernames'
        | 'linkLabel'
        | 'linkUrl'
        | 'privacy'
        | 'location'
        | 'collageLayout'
        | 'textOffsetDx'
        | 'textOffsetDy'
        | 'textScale'
        | 'mediaTransforms'
      >
    >,
  ) {
    await this.syncStoriesFromSnapshot();
    const story = this.stories.find((item) => item.id === id);
    if (!story) {
      throw new NotFoundException(`Story ${id} not found`);
    }
    Object.assign(story, patch);
    if (patch.mentionUsernames !== undefined || patch.mentionUsername !== undefined) {
      const mentionUsernames = this.normalizeStoryMentions(
        patch.mentionUsernames,
        patch.mentionUsername,
      );
      story.mentionUsernames = mentionUsernames;
      story.mentionUsername = mentionUsernames[0] ?? null;
    }
    if (patch.location !== undefined) {
      story.location = patch.location?.trim() || null;
    }
    story.mediaItems = this.normalizeMediaItems(story.media, story.mediaItems);
    story.media = story.media || story.mediaItems[0] || '';
    story.backgroundColors = story.backgroundColors ?? [0xff1e40af, 0xff2bb0a1];
    story.textColorValue = story.textColorValue ?? 0xffffffff;
    story.privacy = story.privacy ?? 'Everyone';
    story.textOffsetDx = story.textOffsetDx ?? 0;
    story.textOffsetDy = story.textOffsetDy ?? 0;
    story.textScale = story.textScale ?? 1;
    story.mediaTransforms = this.normalizeMediaTransforms(
      story.mediaTransforms,
      story.mediaItems.length,
    );
    await this.persistState();
    return this.mapStory(story);
  }

  async deleteStory(id: string) {
    await this.syncStoriesFromSnapshot();
    const index = this.stories.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new NotFoundException(`Story ${id} not found`);
    }
    const [removed] = this.stories.splice(index, 1);
    await this.persistState();
    return {
      success: true,
      removed,
      message: 'Story deleted successfully.',
    };
  }

  getReels(authorId?: string) {
    const reels = authorId
      ? this.reels.filter((reel) => reel.authorId === authorId)
      : this.reels;
    return reels.map((reel) => ({
      ...reel,
      author: this.getUser(reel.authorId),
    }));
  }

  getReel(id: string) {
    const reel = this.reels.find((item) => item.id === id);
    if (!reel) {
      throw new NotFoundException(`Reel ${id} not found`);
    }
    return {
      ...reel,
      author: this.getUser(reel.authorId),
    };
  }

  async createReel(
    input: Pick<
      ReelRecord,
      | 'authorId'
      | 'caption'
      | 'audioName'
      | 'thumbnail'
      | 'videoUrl'
      | 'textOverlays'
      | 'subtitleEnabled'
      | 'trimInfo'
      | 'remixEnabled'
      | 'isDraft'
    >,
  ) {
    const reel: ReelRecord = {
      id: makeId('reel'),
      authorId: input.authorId,
      caption: input.caption,
      audioName: input.audioName,
      thumbnail: input.thumbnail,
      videoUrl: input.videoUrl,
      likes: 0,
      comments: 0,
      shares: 0,
      viewCount: 0,
      coverUrl: input.thumbnail,
      textOverlays: input.textOverlays,
      subtitleEnabled: input.subtitleEnabled,
      trimInfo: input.trimInfo,
      remixEnabled: input.remixEnabled,
      isDraft: input.isDraft,
      createdAt: new Date().toISOString(),
    };
    this.reels.unshift(reel);
    await this.persistState();
    return reel;
  }

  async updateReel(
    id: string,
    patch: Partial<
      Pick<
        ReelRecord,
        | 'caption'
        | 'audioName'
        | 'thumbnail'
        | 'videoUrl'
        | 'textOverlays'
        | 'subtitleEnabled'
        | 'trimInfo'
        | 'remixEnabled'
        | 'isDraft'
      >
    >,
  ) {
    const reel = this.reels.find((item) => item.id === id);
    if (!reel) {
      throw new NotFoundException(`Reel ${id} not found`);
    }
    Object.assign(reel, patch);
    await this.persistState();
    return {
      ...reel,
      author: this.getUser(reel.authorId),
    };
  }

  async deleteReel(id: string) {
    const index = this.reels.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new NotFoundException(`Reel ${id} not found`);
    }
    const [removed] = this.reels.splice(index, 1);
    await this.persistState();
    return {
      success: true,
      removed,
      message: 'Reel deleted successfully.',
    };
  }

  getThreads() {
    return this.threads.map((thread) => ({
      ...thread,
      participants: thread.participantIds.map((id) => this.getUser(id)),
      messages: this.messages.filter((message) => message.threadId === thread.id),
    }));
  }

  getThread(id: string) {
    const thread = this.threads.find((item) => item.id === id);
    if (!thread) {
      throw new NotFoundException(`Thread ${id} not found`);
    }
    return {
      ...thread,
      participants: thread.participantIds.map((userId) => this.getUser(userId)),
      messages: this.messages.filter((message) => message.threadId === thread.id),
    };
  }

  getThreadParticipantIds(threadId: string) {
    return this.getThread(threadId).participantIds;
  }

  getMessage(messageId: string) {
    const message = this.messages.find((item) => item.id === messageId);
    if (!message) {
      throw new NotFoundException(`Message ${messageId} not found`);
    }
    return message;
  }

  createMessage(
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
    const thread = this.getThread(threadId);
    this.getUser(senderId);
    const message: MessageRecord = {
      id: makeId('message'),
      threadId,
      senderId,
      text,
      read: false,
      timestamp: new Date().toISOString(),
      attachments: options?.attachments ?? [],
      replyToMessageId: options?.replyToMessageId ?? null,
      deliveryState: 'sent',
      kind: options?.kind ?? 'text',
      mediaPath: options?.mediaPath ?? null,
    };
    this.messages.push(message);

    const sender = this.getUser(senderId);
    for (const participantId of thread.participantIds.filter((id) => id !== senderId)) {
      this.ecosystemData.pushNotification({
        recipientId: participantId,
        title: `New message from ${sender.name}`,
        body: text || `${sender.username} sent an attachment.`,
        routeName: `/chat/threads/${threadId}`,
        entityId: message.id,
        type: 'social',
        metadata: { threadId, messageId: message.id, senderId },
      });
    }
    return message;
  }

  updateMessageDeliveryState(
    threadId: string,
    messageId: string,
    deliveryState: 'sent' | 'delivered' | 'read',
  ) {
    const message = this.getMessage(messageId);
    if (message.threadId !== threadId) {
      throw new NotFoundException(`Message ${messageId} does not belong to thread ${threadId}`);
    }
    message.deliveryState = deliveryState;
    message.read = deliveryState === 'read';
    return message;
  }

  markThreadMessagesRead(threadId: string, userId: string) {
    this.getThread(threadId);
    this.getUser(userId);
    const updated = this.messages
      .filter((message) => message.threadId === threadId && message.senderId !== userId)
      .map((message) => {
        message.read = true;
        message.deliveryState = 'read';
        return message;
      });
    return {
      threadId,
      userId,
      updatedCount: updated.length,
      messages: updated,
    };
  }

  getEvents(status?: EventRecord['status']) {
    return status
      ? this.events.filter((event) => event.status === status)
      : this.events;
  }

  getEvent(id: string) {
    const event = this.events.find((item) => item.id === id);
    if (!event) {
      throw new NotFoundException(`Event ${id} not found`);
    }
    return event;
  }

  async createEvent(
    input: Omit<EventRecord, 'id' | 'status' | 'rsvped' | 'saved' | 'mediaGallery' | 'hostToolsSummary'> & {
      status?: EventRecord['status'];
      rsvped?: boolean;
      saved?: boolean;
      mediaGallery?: string[];
      hostToolsSummary?: string;
    },
  ) {
    const event: EventRecord = {
      id: `e${this.events.length + 1}`,
      ...input,
      status: input.status ?? 'Review',
      rsvped: input.rsvped ?? false,
      saved: input.saved ?? false,
      mediaGallery: input.mediaGallery ?? [],
      hostToolsSummary: input.hostToolsSummary ?? 'Host tools placeholder',
    };
    this.events.unshift(event);
    await this.persistState();
    return event;
  }

  async toggleEventRsvp(id: string, userId: string) {
    const event = this.getEvent(id);
    this.getUser(userId);
    event.rsvped = !event.rsvped;
    await this.persistState();
    return {
      ...event,
      action: event.rsvped ? 'rsvped' : 'rsvp_removed',
      userId,
    };
  }

  async toggleEventSave(id: string, userId: string) {
    const event = this.getEvent(id);
    this.getUser(userId);
    event.saved = !event.saved;
    await this.persistState();
    return {
      ...event,
      action: event.saved ? 'saved' : 'unsaved',
      userId,
    };
  }

  getProducts() {
    return this.products;
  }

  getProduct(id: string) {
    const product = this.products.find((item) => item.id === id);
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return product;
  }

  async createProduct(
    input: Omit<
      ProductRecord,
      'id' | 'listingStatus' | 'reviewStatus' | 'views' | 'watchers' | 'chats'
    >,
  ) {
    const product: ProductRecord = {
      id: makeId('product'),
      ...input,
      listingStatus: 'Pending review',
      reviewStatus: 'Queued',
      views: 0,
      watchers: 0,
      chats: 0,
    };
    this.products.unshift(product);
    await this.persistState();
    return product;
  }

  getWalletTransactions() {
    return this.walletTransactions.map((transaction) => ({
      ...transaction,
      user: this.getUser(transaction.userId),
    }));
  }

  getSubscriptions() {
    return this.subscriptions;
  }

  getPlans() {
    return this.plans;
  }

  getCampaigns() {
    return this.campaigns;
  }

  async createCampaign(
    input: Pick<NotificationCampaignRecord, 'name' | 'audience' | 'schedule'>,
  ) {
    const campaign: NotificationCampaignRecord = {
      id: `cmp-${this.campaigns.length + 1}`,
      name: input.name,
      audience: input.audience,
      schedule: input.schedule,
      status: 'Scheduled',
    };
    this.campaigns.unshift(campaign);
    await this.persistState();
    return campaign;
  }

  getDashboardSummary() {
    return {
      stats: [
        { label: 'Total users', value: '128.4K', change: '+12.8%' },
        { label: 'Active today', value: '47.2K', change: '+6.4%' },
        { label: 'Pending reports', value: '241', change: '-18.2%' },
        { label: 'Active subscriptions', value: '4,820', change: '+9.7%' },
        { label: 'Wallet volume', value: '$84.6K', change: '+11.1%' },
        { label: 'Events created', value: '42', change: '+14%' },
      ],
      growth: [
        { label: 'Mon', value: 34 },
        { label: 'Tue', value: 41 },
        { label: 'Wed', value: 44 },
        { label: 'Thu', value: 58 },
        { label: 'Fri', value: 53 },
        { label: 'Sat', value: 63 },
        { label: 'Sun', value: 72 },
      ],
      uploads: [
        { label: 'Posts', value: 64 },
        { label: 'Stories', value: 88 },
        { label: 'Reels', value: 51 },
        { label: 'Comments', value: 96 },
      ],
      revenue: [
        { label: 'Subscriptions', value: '$38.4K' },
        { label: 'Wallet top-up', value: '$21.1K' },
        { label: 'Marketplace', value: '$25.1K' },
      ],
    };
  }

  getReports() {
    return [
      {
        id: 'R-1021',
        title: 'Harassment in reel comments',
        type: 'Content',
        severity: 'Critical',
        target: '@mayaquinn reel',
        reason: 'Repeated abusive replies and targeted insults in public thread.',
        evidence: '5 reports, 1 moderator auto-flag, 58 reply thread attached.',
        history: 'Warned one participant last week.',
      },
      {
        id: 'R-1022',
        title: 'Recruiter impersonation profile',
        type: 'Profile',
        severity: 'High',
        target: '@arif.talent',
        reason: 'Profile appears to imitate a recruiting company without documents.',
        evidence: '3 user reports, name mismatch, missing company proof.',
        history: 'Verification pending for 2 days.',
      },
    ];
  }

  getRolesMatrix() {
    return {
      roles: [
        'Super Admin',
        'Operations Admin',
        'Content Moderator',
        'Finance Admin',
        'Support Admin',
        'Analytics Viewer',
      ],
      matrix: [
        ['Dashboard', 'Yes', 'No', 'No', 'No', 'No', 'Yes'],
        ['Users', 'Yes', 'Yes', 'Yes', 'No', 'No', 'Yes'],
        ['Content', 'Yes', 'No', 'Yes', 'Yes', 'Yes', 'No'],
        ['Reports', 'Yes', 'No', 'Yes', 'No', 'Yes', 'No'],
        ['Monetization', 'Yes', 'No', 'Yes', 'No', 'Yes', 'Yes'],
        ['Settings', 'Yes', 'No', 'Yes', 'No', 'No', 'No'],
      ],
    };
  }

  getSettings() {
    return [
      {
        title: 'Safety defaults',
        description: 'Auto-flag abusive comments and restrict repeat offenders.',
        state: 'Enabled',
      },
      {
        title: 'Storage retention',
        description: 'Keep deleted evidence files for 90 days for compliance review.',
        state: '90 days',
      },
      {
        title: 'Notification rate limit',
        description: 'Throttle promotional push campaigns during peak hours.',
        state: 'Medium',
      },
      {
        title: 'Maintenance banner',
        description: 'Display a banner during backend deployment windows.',
        state: 'Disabled',
      },
    ];
  }

  getAuditLogs() {
    return [
      ['9:18 PM', 'Super Admin', 'Approved payout', 'Maya Quinn', 'Success'],
      ['8:54 PM', 'Moderator 02', 'Muted comment thread', 'R-1021', 'Success'],
      ['8:37 PM', 'Finance Admin', 'Updated premium plan', 'Creator Pro', 'Success'],
      ['8:10 PM', 'Support Admin', 'Restored account', '@nexa.studio', 'Success'],
    ];
  }

  private replaceArray<T>(target: T[], next?: T[]) {
    if (!next) {
      return;
    }
    target.splice(0, target.length, ...next);
  }

  private async persistState() {
    await this.stateSnapshots.save('platform_data_state', {
      blockRelations: this.blockRelations,
      stories: this.stories,
      reels: this.reels,
      events: this.events,
      products: this.products,
      campaigns: this.campaigns,
    });
  }

  private async syncStoriesFromSnapshot() {
    const snapshot = await this.stateSnapshots.load<{
      stories?: StoryRecord[];
    }>('platform_data_state');
    this.replaceArray(this.stories, snapshot?.stories);
  }

  private readonly storyLifetimeMs = 24 * 60 * 60 * 1000;

  private pruneExpiredStories() {
    const now = Date.now();
    const activeStories = this.stories.filter((story) => {
      const expiresAt =
        story.expiresAt ??
        new Date(new Date(story.createdAt).getTime() + this.storyLifetimeMs).toISOString();
      return new Date(expiresAt).getTime() > now;
    });
    if (activeStories.length === this.stories.length) {
      return;
    }
    this.stories.splice(0, this.stories.length, ...activeStories);
    void this.persistState();
  }

  private mapStory(story: StoryRecord) {
    const mediaItems = this.normalizeMediaItems(story.media, story.mediaItems);
    const mentionUsernames = this.normalizeStoryMentions(
      story.mentionUsernames,
      story.mentionUsername,
    );
    const expiresAt =
      story.expiresAt ??
      new Date(new Date(story.createdAt).getTime() + this.storyLifetimeMs).toISOString();
    return {
      id: story.id,
      userId: story.userId,
      author: this.getUserPreview(story.userId),
      media: story.media || mediaItems[0] || '',
      mediaItems,
      isLocalFile: story.isLocalFile,
      text: story.text ?? '',
      music: story.music ?? null,
      backgroundColors: story.backgroundColors ?? [],
      textColorValue: story.textColorValue ?? 0xffffffff,
      sticker: story.sticker ?? null,
      effectName: story.effectName ?? null,
      mentionUsername: mentionUsernames[0] ?? null,
      mentionUsernames,
      linkLabel: story.linkLabel ?? null,
      linkUrl: story.linkUrl ?? null,
      privacy: story.privacy ?? 'Everyone',
      location: story.location ?? null,
      collageLayout: story.collageLayout ?? null,
      textOffsetDx: story.textOffsetDx ?? 0,
      textOffsetDy: story.textOffsetDy ?? 0,
      textScale: story.textScale ?? 1,
      mediaTransforms: this.normalizeMediaTransforms(
        story.mediaTransforms,
        mediaItems.length,
      ),
      seen: story.seen,
      createdAt: story.createdAt,
      expiresAt,
    };
  }

  private normalizeMediaItems(media?: string, mediaItems?: string[]) {
    const values = [...(mediaItems ?? []), ...(media ? [media] : [])]
      .map((item) => item.trim())
      .filter(Boolean);
    return [...new Set(values)];
  }

  private normalizeStoryMentions(mentionUsernames?: string[], mentionUsername?: string | null) {
    const values = [...(mentionUsernames ?? []), ...(mentionUsername ? [mentionUsername] : [])]
      .map((item) => item.trim())
      .filter(Boolean);
    return [...new Set(values)];
  }

  private normalizeMediaTransforms(
    transforms: StoryRecord['mediaTransforms'],
    mediaCount: number,
  ) {
    const size = Math.max(mediaCount, transforms?.length ?? 0);
    return Array.from({ length: size }, (_, index) => ({
      offsetDx: transforms?.[index]?.offsetDx ?? 0,
      offsetDy: transforms?.[index]?.offsetDy ?? 0,
      scale: transforms?.[index]?.scale ?? 1,
      zIndex: transforms?.[index]?.zIndex ?? index,
      widthFactor: transforms?.[index]?.widthFactor ?? 1,
      heightFactor: transforms?.[index]?.heightFactor ?? 1,
      borderRadius: transforms?.[index]?.borderRadius ?? 0,
    }));
  }

  private getUserPreview(userId: string) {
    const user = this.users.find((item) => item.id === userId);
    if (user) {
      return this.toUserPreview(user);
    }
    return {
      id: userId,
      name: 'Story author',
      username: userId,
      avatar: 'https://placehold.co/120x120',
      role: 'User',
      verification: 'Not Requested',
    };
  }
}
