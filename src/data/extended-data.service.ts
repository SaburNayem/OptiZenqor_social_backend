import { Injectable, NotFoundException } from '@nestjs/common';
import { EcosystemDataService } from './ecosystem-data.service';
import { PlatformDataService } from './platform-data.service';

@Injectable()
export class ExtendedDataService {
  constructor(
    private readonly platformData: PlatformDataService,
    private readonly ecosystemData: EcosystemDataService,
  ) {}

  private readonly onboardingSlides = [
    {
      id: 'onb1',
      title: 'Discover creators and communities',
      subtitle: 'Follow people, pages, and groups that match your interests.',
      iconKey: 'explore',
    },
    {
      id: 'onb2',
      title: 'Share posts, stories, and reels',
      subtitle: 'Publish content, save drafts, and schedule future posts.',
      iconKey: 'media',
    },
    {
      id: 'onb3',
      title: 'Chat, collaborate, and grow',
      subtitle: 'Use messaging, live sessions, wallets, and creator tools.',
      iconKey: 'chat',
    },
  ];

  private serializePostComment(comment: (typeof this.postComments)[number]): {
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
    replies: Array<ReturnType<ExtendedDataService['serializePostComment']>>;
  } {
    const replies = this.postComments
      .filter((item) => item.postId === comment.postId && item.replyTo === comment.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((item) => this.serializePostComment(item));

    return {
      id: comment.id,
      postId: comment.postId,
      authorId: comment.authorId,
      author: comment.author,
      message: comment.message,
      replyTo: comment.replyTo,
      createdAt: comment.createdAt,
      likeCount: comment.likeCount,
      isLikedByMe: comment.isLikedByMe,
      isReported: comment.isReported,
      isEdited: comment.isEdited,
      reactions: comment.reactions,
      mentions: comment.mentions,
      replyCount: replies.length,
      replies,
    };
  }

  private readonly onboardingState = {
    completed: false,
    firstLaunch: true,
    selectedInterests: ['Creator Economy', 'Marketplace'],
    suggestedPeople: ['mayaquinn', 'luna.crafts'],
    suggestedPages: ['OptiZenqor Creators', 'Nexa Studio'],
  };

  private readonly interests = [
    { name: 'Creator Economy', selected: true },
    { name: 'Design', selected: false },
    { name: 'Marketplace', selected: true },
    { name: 'Jobs', selected: false },
    { name: 'Communities', selected: false },
  ];

  private readonly appBootstrap = {
    splashRoute: '/docs',
    maintenanceMode: false,
    forceUpdate: false,
    minSupportedVersion: '1.0.0',
    latestVersion: '1.0.0',
    locale: {
      language: 'en',
      region: 'BD',
      currency: 'BDT',
      timezone: 'Asia/Dhaka',
    },
    tokenRefreshRequired: false,
    remoteConfigVersion: '2026.04.19',
  };

  private otpStore = {
    destination: 'maya@optizenqor.app',
    otp: '123456',
    cooldownSeconds: 45,
    verified: false,
    status: 'pending',
  };

  private drafts: Array<{
    id: string;
    title: string;
    type: string;
    scheduledAt: string | null;
    audience: string;
    location: string | null;
    taggedPeople: string[];
    coAuthors: string[];
    altText: string | null;
    versionHistory: string[];
    editHistory: string[];
  }> = [
    {
      id: 'draft1',
      title: 'Creator meetup teaser',
      type: 'story',
      scheduledAt: null,
      audience: 'Everyone',
      location: 'Dhaka',
      taggedPeople: ['mayaquinn'],
      coAuthors: [],
      altText: 'Creator meetup teaser card',
      versionHistory: ['v1'],
      editHistory: ['Created today'],
    },
    {
      id: 'draft2',
      title: 'Weekly launch note',
      type: 'post',
      scheduledAt: '2026-04-20T08:00:00.000Z',
      audience: 'Followers',
      location: null,
      taggedPeople: ['nexa.studio'],
      coAuthors: [],
      altText: null,
      versionHistory: ['v1', 'v2'],
      editHistory: ['Edited caption', 'Added hashtag'],
    },
  ];

  private uploads: Array<{
    id: string;
    fileName: string;
    progress: number;
    status: string;
    mimeType?: string;
    size?: number;
    url?: string | null;
    secureUrl?: string | null;
    publicId?: string | null;
    provider?: string | null;
  }> = [
    {
      id: 'up1',
      fileName: 'reel-launch-cut.mp4',
      progress: 0.42,
      status: 'uploading',
      mimeType: 'video/mp4',
      size: 14820034,
    },
    {
      id: 'up2',
      fileName: 'creator-teaser.png',
      progress: 1,
      status: 'completed',
      mimeType: 'image/png',
      size: 842344,
      url: 'https://placehold.co/1280x720',
      secureUrl: 'https://placehold.co/1280x720',
      publicId: 'optizenqor/uploads/creator-teaser',
      provider: 'cloudinary',
    },
  ];

  private postDetails = [
    {
      id: 'p1',
      authorId: 'u1',
      caption: 'Building social products that feel fast, calm, and human.',
      media: ['https://placehold.co/800x600'],
      likes: 2300,
      comments: 2,
      createdAt: '2026-04-19T14:40:00.000Z',
      audience: 'Everyone',
      engagementSummary: {
        likes: 2300,
        comments: 2,
        shares: 54,
        bookmarks: 84,
      },
    },
  ];

  private postComments: Array<{
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
    reactedBy: Record<string, string>;
    mentions: string[];
  }> = [
    {
      id: 'pc1',
      postId: 'p1',
      authorId: 'u4',
      author: 'Luna Crafts',
      message: 'This rollout feels very polished.',
      replyTo: null,
      createdAt: '2026-04-19T15:00:00.000Z',
      likeCount: 12,
      isLikedByMe: true,
      isReported: false,
      isEdited: false,
      reactions: { like: 8, fire: 4 },
      reactedBy: { u1: 'like', u2: 'fire' },
      mentions: [],
    },
    {
      id: 'pc2',
      postId: 'p1',
      authorId: 'u3',
      author: 'Rafi Ahmed',
      message: 'Would love to see the admin side too.',
      replyTo: 'pc1',
      createdAt: '2026-04-19T15:03:00.000Z',
      likeCount: 3,
      isLikedByMe: false,
      isReported: false,
      isEdited: false,
      reactions: { like: 3 },
      reactedBy: { u1: 'like' },
      mentions: ['mayaquinn'],
    },
  ];

  private storyComments: Array<{
    id: string;
    storyId: string;
    userId: string;
    comment: string;
    createdAt: string;
  }> = [
    {
      id: 'sc1',
      storyId: 's1',
      userId: 'u4',
      comment: 'Love this gradient story.',
      createdAt: '2026-04-19T14:05:00.000Z',
    },
  ];

  private storyReactions: Array<{
    storyId: string;
    userId: string;
    reaction: string;
    createdAt: string;
  }> = [
    {
      storyId: 's1',
      userId: 'u2',
      reaction: 'fire',
      createdAt: '2026-04-19T14:06:00.000Z',
    },
  ];

  private reelComments: Array<{
    id: string;
    reelId: string;
    userId: string;
    comment: string;
    createdAt: string;
  }> = [
    {
      id: 'rc1',
      reelId: 'r1',
      userId: 'u3',
      comment: 'The pacing here is excellent.',
      createdAt: '2026-04-19T15:20:00.000Z',
    },
  ];

  private reelReactions: Array<{
    reelId: string;
    userId: string;
    reaction: string;
    createdAt: string;
  }> = [
    {
      reelId: 'r1',
      userId: 'u4',
      reaction: 'like',
      createdAt: '2026-04-19T15:21:00.000Z',
    },
  ];

  private recommendationState = {
    suggestedUsers: [
      { id: 'u2', username: 'nexa.studio', reason: 'Popular in your interests' },
      { id: 'u4', username: 'luna.crafts', reason: 'High engagement seller profile' },
    ],
    suggestedPages: [
      { id: 'page1', name: 'OptiZenqor Creators', reason: 'You follow creator content' },
    ],
    trendingTags: ['#creator', '#dhaka', '#hiring'],
    discoverRecommendations: [
      { type: 'community', id: 'com1', title: 'Dhaka Creator Hub' },
      { type: 'job', id: 'job1', title: 'Product Designer' },
    ],
    feedSignals: {
      follows: 42,
      bookmarks: 18,
      dwellTimeScore: 0.81,
      freshnessWeight: 0.72,
    },
  };

  private presenceState = {
    users: [
      { userId: 'u1', online: true, lastSeen: 'now', typingInThreadId: 't1' },
      { userId: 'u4', online: false, lastSeen: '12m ago', typingInThreadId: null },
    ],
    receipts: [
      { threadId: 't1', messageId: 'm2', delivered: true, read: false },
      { threadId: 't2', messageId: 'm3', delivered: true, read: true },
    ],
  };

  private conversationPreferences = [
    {
      threadId: 't1',
      archived: false,
      muted: false,
      pinned: true,
      unread: true,
      clearedAt: null,
    },
    {
      threadId: 't2',
      archived: false,
      muted: true,
      pinned: false,
      unread: false,
      clearedAt: null,
    },
  ];

  private notificationPreferences = {
    pushCategories: [
      { title: 'Likes and comments', enabled: true },
      { title: 'Messages', enabled: true },
      { title: 'Wallet and payouts', enabled: true },
      { title: 'Marketing', enabled: false },
    ],
    emailEnabled: true,
    pushEnabled: true,
    quietHours: {
      enabled: true,
      from: '23:00',
      to: '07:00',
    },
    featureControls: {
      social: true,
      commerce: true,
      security: true,
      system: true,
    },
  };

  private safetyConfig = {
    reportCategories: [
      { reason: 'Harassment', status: 'active' },
      { reason: 'Spam', status: 'active' },
      { reason: 'Impersonation', status: 'active' },
      { reason: 'Unsafe content', status: 'active' },
    ],
    moderationReasons: ['hide_post', 'mute_user', 'restrict_chat', 'suspend_account'],
    blockedUsers: [
      { id: 'rb1', name: 'Muted Profile', handle: '@muted.profile', status: 'blocked', avatarUrl: 'https://placehold.co/64x64' },
    ],
    hiddenPosts: ['p-hidden-1', 'p-hidden-2'],
    mutedEntities: {
      users: ['@nova.support'],
      pages: ['Low Quality Deals'],
      chats: ['t2'],
    },
  };

  private supportChat = {
    threadId: 'support-1',
    messages: [
      { id: 'sm1', sender: 'support', text: 'How can we help you today?', createdAt: '2026-04-19T10:00:00.000Z' },
      { id: 'sm2', sender: 'user', text: 'My payout is still pending.', createdAt: '2026-04-19T10:01:00.000Z' },
    ],
  };

  private walletLedger = {
    available: 2410,
    pending: 1280,
    ledgerEntries: [
      { id: 'led1', type: 'sale_credit', amount: 320, status: 'settled', createdAt: '2026-04-19T12:10:00.000Z' },
      { id: 'led2', type: 'withdrawal_hold', amount: -480, status: 'pending', createdAt: '2026-04-19T14:30:00.000Z' },
    ],
    withdrawalRequests: [
      { id: 'wd1', amount: 480, channel: 'Bank Transfer', status: 'pending' },
    ],
    deposits: [
      { id: 'dep1', amount: 210, source: 'Top up', status: 'success' },
    ],
    refunds: [
      { id: 'ref1', amount: 45, reason: 'Marketplace refund', status: 'review' },
    ],
  };

  private masterData = {
    feelings: ['Excited', 'Grateful', 'Motivated', 'Focused'],
    music: ['Creator Motion Pack', 'Store Drop', 'Ambient Rise'],
    subscriptionPlans: [
      { id: 'sub1', name: 'Creator Pro', price: 14.99 },
      { id: 'sub2', name: 'Business Plus', price: 29.99 },
    ],
    premiumPlans: [
      { name: 'Creator Pro', price: '$14.99' },
      { name: 'Business Plus', price: '$29.99' },
    ],
    jobCategories: ['Design', 'Engineering', 'Operations', 'Marketing'],
    marketplaceCategories: ['Home', 'Electronics', 'Fashion', 'Services'],
    eventCategories: ['Meetup', 'Workshop', 'Launch', 'Networking'],
    countries: ['Bangladesh', 'India', 'United States'],
    cities: ['Dhaka', 'Chattogram', 'Remote'],
    faqCategories: ['Account', 'Safety', 'Wallet', 'Marketplace'],
  };

  private legalState = {
    termsAccepted: true,
    privacyAccepted: true,
    guidelinesAccepted: true,
    acceptedAt: '2026-04-01T09:00:00.000Z',
    consentLogs: [
      { type: 'terms', accepted: true, acceptedAt: '2026-04-01T09:00:00.000Z' },
      { type: 'privacy', accepted: true, acceptedAt: '2026-04-01T09:00:00.000Z' },
      { type: 'guidelines', accepted: true, acceptedAt: '2026-04-01T09:00:00.000Z' },
    ],
  };

  private securityState = {
    sessions: [
      { id: 's1', device: 'Windows PC', location: 'Dhaka', platform: 'Web', lastActive: '2m ago', active: true, isCurrent: true },
      { id: 's2', device: 'iPhone 15', location: 'Dhaka', platform: 'iOS', lastActive: '1d ago', active: true, isCurrent: false },
    ],
    loginHistory: [
      { id: 'lh1', device: 'Windows PC', location: 'Dhaka', timestamp: '2026-04-19T14:00:00.000Z', suspicious: false },
      { id: 'lh2', device: 'Unknown Browser', location: 'Singapore', timestamp: '2026-04-18T22:00:00.000Z', suspicious: true },
    ],
    trustedDevices: [
      { id: 'td1', name: 'Windows PC', addedAt: '2026-04-01T08:00:00.000Z' },
      { id: 'td2', name: 'iPhone 15', addedAt: '2026-04-02T10:30:00.000Z' },
    ],
  };

  getBootstrap() {
    return this.appBootstrap;
  }

  getOnboardingSlides() {
    return this.onboardingSlides;
  }

  getOnboardingState() {
    return this.onboardingState;
  }

  completeOnboarding(selectedInterests: string[]) {
    this.onboardingState.completed = true;
    this.onboardingState.firstLaunch = false;
    this.onboardingState.selectedInterests = selectedInterests;
    return this.onboardingState;
  }

  getInterests() {
    return this.interests;
  }

  sendOtp(destination: string, channel: 'email' | 'phone') {
    this.otpStore = {
      destination,
      otp: '123456',
      cooldownSeconds: 45,
      verified: false,
      status: `sent_${channel}`,
    };
    return {
      success: true,
      destination,
      channel,
      cooldownSeconds: this.otpStore.cooldownSeconds,
      verificationStatus: 'sent',
    };
  }

  resendOtp(destination: string) {
    this.otpStore.destination = destination;
    this.otpStore.cooldownSeconds = 45;
    this.otpStore.verified = false;
    this.otpStore.status = 'resent';
    return {
      success: true,
      destination,
      cooldownSeconds: this.otpStore.cooldownSeconds,
      verificationStatus: 'resent',
    };
  }

  verifyOtp(code: string) {
    const ok = code === this.otpStore.otp;
    this.otpStore.verified = ok;
    this.otpStore.status = ok ? 'verified' : 'invalid';
    return {
      success: ok,
      destination: this.otpStore.destination,
      verificationStatus: this.otpStore.status,
    };
  }

  getDrafts() {
    return this.drafts;
  }

  getDraft(id: string) {
    const draft = this.drafts.find((item) => item.id === id);
    if (!draft) throw new NotFoundException(`Draft ${id} not found`);
    return draft;
  }

  createDraft(title: string, type: string) {
    const draft = {
      id: `draft${this.drafts.length + 1}`,
      title,
      type,
      scheduledAt: null,
      audience: 'Everyone',
      location: null,
      taggedPeople: [],
      coAuthors: [],
      altText: null,
      versionHistory: ['v1'],
      editHistory: ['Created now'],
    };
    this.drafts.unshift(draft);
    return draft;
  }

  updateDraft(id: string, patch: Record<string, unknown>) {
    const draft = this.drafts.find((item) => item.id === id);
    if (!draft) throw new NotFoundException(`Draft ${id} not found`);
    Object.assign(draft, patch);
    return draft;
  }

  deleteDraft(id: string) {
    const index = this.drafts.findIndex((item) => item.id === id);
    if (index === -1) throw new NotFoundException(`Draft ${id} not found`);
    const [removed] = this.drafts.splice(index, 1);
    return { success: true, removed };
  }

  getScheduledPosts() {
    return this.drafts.filter((item) => item.scheduledAt);
  }

  getUploads() {
    return this.uploads;
  }

  registerUpload(input: {
    fileName: string;
    progress: number;
    status: string;
    mimeType?: string;
    size?: number;
    url?: string | null;
    secureUrl?: string | null;
    publicId?: string | null;
    provider?: string | null;
  }) {
    const upload = {
      id: `up${this.uploads.length + 1}`,
      fileName: input.fileName,
      progress: input.progress,
      status: input.status,
      mimeType: input.mimeType,
      size: input.size,
      url: input.url ?? null,
      secureUrl: input.secureUrl ?? null,
      publicId: input.publicId ?? null,
      provider: input.provider ?? null,
    };
    this.uploads.unshift(upload);
    return upload;
  }

  getUpload(id: string) {
    const upload = this.uploads.find((item) => item.id === id);
    if (!upload) throw new NotFoundException(`Upload ${id} not found`);
    return upload;
  }

  updateUpload(id: string, action: 'retry' | 'cancel' | 'pause') {
    const upload = this.uploads.find((item) => item.id === id);
    if (!upload) throw new NotFoundException(`Upload ${id} not found`);
    if (action === 'retry') upload.status = 'uploading';
    if (action === 'cancel') upload.status = 'failed';
    if (action === 'pause') upload.status = 'paused';
    return upload;
  }

  getPostDetail(id: string) {
    const detail = this.postDetails.find((item) => item.id === id);
    if (!detail) throw new NotFoundException(`Post detail ${id} not found`);
    return detail;
  }

  getPostComments(postId: string) {
    return this.postComments
      .filter((item) => item.postId === postId && item.replyTo === null)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((item) => this.serializePostComment(item));
  }

  createPostComment(
    postId: string,
    author: string,
    message: string,
    options?: {
      authorId?: string;
      replyTo?: string;
      mentions?: string[];
    },
  ) {
    const post = this.platformData.getPost(postId);
    const authorId = options?.authorId ?? null;
    const authorUser = authorId ? this.platformData.getUser(authorId) : null;
    const parentComment = options?.replyTo
      ? this.postComments.find((item) => item.postId === postId && item.id === options.replyTo)
      : null;
    if (options?.replyTo && !parentComment) {
      throw new NotFoundException(`Parent comment ${options.replyTo} not found`);
    }

    const comment = {
      id: `pc${this.postComments.length + 1}`,
      postId,
      authorId,
      author: authorUser?.name ?? author,
      message,
      replyTo: options?.replyTo ?? null,
      createdAt: new Date().toISOString(),
      likeCount: 0,
      isLikedByMe: false,
      isReported: false,
      isEdited: false,
      reactions: {},
      reactedBy: {},
      mentions: options?.mentions ?? [],
    };
    this.postComments.push(comment);

    const recipientId =
      parentComment?.authorId && parentComment.authorId !== authorId
        ? parentComment.authorId
        : post.authorId !== authorId
          ? post.authorId
          : null;

    if (recipientId) {
      this.ecosystemData.pushNotification({
        recipientId,
        title: parentComment
          ? `${comment.author} replied to your comment`
          : `${comment.author} commented on your post`,
        body: comment.message,
        routeName: `/posts/${postId}`,
        entityId: comment.id,
        type: 'social',
        metadata: {
          postId,
          commentId: comment.id,
          replyTo: options?.replyTo ?? null,
          authorId,
        },
      });
    }

    return this.serializePostComment(comment);
  }

  getPostCommentReplies(postId: string, commentId: string) {
    const parent = this.postComments.find((item) => item.postId === postId && item.id === commentId);
    if (!parent) {
      throw new NotFoundException(`Comment ${commentId} not found`);
    }
    return this.postComments
      .filter((item) => item.postId === postId && item.replyTo === commentId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((item) => this.serializePostComment(item));
  }

  reactToComment(postId: string, commentId: string, userId: string, reaction: string) {
    const comment = this.postComments.find(
      (item) => item.postId === postId && item.id === commentId,
    );
    if (!comment) {
      throw new NotFoundException(`Comment ${commentId} not found`);
    }

    const previousReaction = comment.reactedBy[userId];
    if (previousReaction) {
      comment.reactions[previousReaction] = Math.max(
        0,
        (comment.reactions[previousReaction] ?? 0) - 1,
      );
      if (comment.reactions[previousReaction] === 0) {
        delete comment.reactions[previousReaction];
      }
    }

    comment.reactedBy[userId] = reaction;
    comment.reactions[reaction] = (comment.reactions[reaction] ?? 0) + 1;
    comment.likeCount = comment.reactions.like ?? 0;
    comment.isLikedByMe = reaction === 'like';

    if (comment.authorId && comment.authorId !== userId) {
      const actor = this.platformData.getUser(userId);
      this.ecosystemData.pushNotification({
        recipientId: comment.authorId,
        title: `${actor.name} reacted to your comment`,
        body: `${actor.username} left a ${reaction} reaction.`,
        routeName: `/posts/${postId}`,
        entityId: commentId,
        type: 'social',
        metadata: { postId, commentId, reaction, actorId: userId },
      });
    }

    return this.serializePostComment(comment);
  }

  deletePostComment(postId: string, commentId: string) {
    const target = this.postComments.find((item) => item.postId === postId && item.id === commentId);
    if (!target) {
      throw new NotFoundException(`Comment ${commentId} not found`);
    }
    const removalIds = new Set<string>([commentId]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const comment of this.postComments) {
        if (comment.postId === postId && comment.replyTo && removalIds.has(comment.replyTo)) {
          if (!removalIds.has(comment.id)) {
            removalIds.add(comment.id);
            changed = true;
          }
        }
      }
    }

    const removed = this.postComments.filter(
      (item) => item.postId === postId && removalIds.has(item.id),
    );
    this.postComments = this.postComments.filter(
      (item) => !(item.postId === postId && removalIds.has(item.id)),
    );
    return {
      success: true,
      removed,
      message: 'Comment deleted successfully.',
    };
  }

  getStoryComments(storyId: string) {
    return this.storyComments.filter((item) => item.storyId === storyId);
  }

  createStoryComment(storyId: string, userId: string, comment: string) {
    const next = {
      id: `sc${this.storyComments.length + 1}`,
      storyId,
      userId,
      comment,
      createdAt: new Date().toISOString(),
    };
    this.storyComments.push(next);
    return next;
  }

  getStoryReactions(storyId: string) {
    return this.storyReactions.filter((item) => item.storyId === storyId);
  }

  reactToStory(storyId: string, userId: string, reaction: string) {
    const existing = this.storyReactions.find(
      (item) => item.storyId === storyId && item.userId === userId,
    );
    if (existing) {
      existing.reaction = reaction;
      existing.createdAt = new Date().toISOString();
      return existing;
    }
    const next = {
      storyId,
      userId,
      reaction,
      createdAt: new Date().toISOString(),
    };
    this.storyReactions.push(next);
    return next;
  }

  getReelComments(reelId: string) {
    return this.reelComments.filter((item) => item.reelId === reelId);
  }

  createReelComment(reelId: string, userId: string, comment: string) {
    const next = {
      id: `rc${this.reelComments.length + 1}`,
      reelId,
      userId,
      comment,
      createdAt: new Date().toISOString(),
    };
    this.reelComments.push(next);
    return next;
  }

  getReelReactions(reelId: string) {
    return this.reelReactions.filter((item) => item.reelId === reelId);
  }

  reactToReel(reelId: string, userId: string, reaction: string) {
    const existing = this.reelReactions.find(
      (item) => item.reelId === reelId && item.userId === userId,
    );
    if (existing) {
      existing.reaction = reaction;
      existing.createdAt = new Date().toISOString();
      return existing;
    }
    const next = {
      reelId,
      userId,
      reaction,
      createdAt: new Date().toISOString(),
    };
    this.reelReactions.push(next);
    return next;
  }

  updatePostDetail(id: string, patch: Record<string, unknown>) {
    const detail = this.postDetails.find((item) => item.id === id);
    if (!detail) throw new NotFoundException(`Post detail ${id} not found`);
    Object.assign(detail, patch);
    return detail;
  }

  removePostDetail(id: string) {
    return {
      success: true,
      postId: id,
      message: 'Post marked deleted in seeded backend.',
    };
  }

  getRecommendations() {
    return this.recommendationState;
  }

  getPresence() {
    return this.presenceState;
  }

  getConversationPreferences() {
    return this.conversationPreferences;
  }

  updateConversationPreference(threadId: string, key: string, value: boolean | string | null) {
    const pref = this.conversationPreferences.find((item) => item.threadId === threadId);
    if (!pref) throw new NotFoundException(`Conversation ${threadId} not found`);
    (pref as Record<string, unknown>)[key] = value;
    return pref;
  }

  getNotificationPreferences() {
    return this.notificationPreferences;
  }

  updateNotificationPreferences(patch: Record<string, unknown>) {
    Object.assign(this.notificationPreferences, patch);
    return this.notificationPreferences;
  }

  getSafetyConfig() {
    return this.safetyConfig;
  }

  getSupportChat() {
    return this.supportChat;
  }

  getWalletLedger() {
    return this.walletLedger;
  }

  getMasterData() {
    return this.masterData;
  }

  getLegalState() {
    return this.legalState;
  }

  updateLegalConsents(patch: Record<string, boolean>) {
    Object.assign(this.legalState, patch);
    this.legalState.acceptedAt = new Date().toISOString();
    return this.legalState;
  }

  requestAccountDeletion(reason?: string) {
    return {
      success: true,
      requestedAt: new Date().toISOString(),
      status: 'queued',
      reason: reason ?? 'not_provided',
    };
  }

  requestDataExport(format?: string) {
    return {
      success: true,
      requestedAt: new Date().toISOString(),
      status: 'processing',
      format: format ?? 'json',
    };
  }

  getSecurityState() {
    return this.securityState;
  }

  logoutAllSessions() {
    this.securityState.sessions = this.securityState.sessions.map((session) => ({
      ...session,
      active: session.isCurrent,
    }));
    return {
      success: true,
      revokedSessions: this.securityState.sessions.filter((item) => !item.isCurrent).length,
    };
  }
}
