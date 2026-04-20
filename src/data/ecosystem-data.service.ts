import { Injectable, NotFoundException } from '@nestjs/common';

export interface HashtagRecord {
  tag: string;
  count: number;
}

export interface TrendingItemRecord {
  title: string;
  type: string;
  score: number;
}

export interface BookmarkRecord {
  id: string;
  title: string;
  type: 'post' | 'reel' | 'product';
  createdAt?: string;
}

export interface SavedCollectionRecord {
  id: string;
  name: string;
  itemIds: string[];
  privacy?: string;
}

export interface PageRecord {
  id: string;
  name: string;
  about: string;
  posts: string[];
  following: boolean;
  category: string;
  actionButtonLabel: string;
  reviewSummary: string;
  visitorPostsSummary: string;
  followersInsight: string;
}

export interface CommunityMemberRecord {
  id: string;
  name: string;
  role: 'admin' | 'moderator' | 'member';
  accentColor: number;
  topContributor: boolean;
  following: boolean;
}

export interface CommunityPostRecord {
  id: string;
  authorName: string;
  authorRole: 'admin' | 'moderator' | 'member';
  authorAccent: number;
  timeLabel: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'poll' | 'event';
  likes: number;
  comments: number;
  shares: number;
  highlight: boolean;
  saved: boolean;
  pinned: boolean;
  mediaLabel?: string;
  pollOptions: string[];
}

export interface CommunityEventRecord {
  id: string;
  title: string;
  dateLabel: string;
  locationLabel: string;
  coverColor: number;
  status: string;
  going: boolean;
}

export interface CommunityRecord {
  id: string;
  name: string;
  description: string;
  privacy: 'public' | 'private' | 'hidden';
  memberCount: number;
  coverColors: number[];
  avatarColor: number;
  tags: string[];
  rules: string[];
  createdLabel: string;
  category: string;
  location: string;
  links: string[];
  contactInfo: string;
  posts: CommunityPostRecord[];
  events: CommunityEventRecord[];
  members: CommunityMemberRecord[];
  recentActivity: string[];
  pinnedPosts: CommunityPostRecord[];
  announcements: CommunityPostRecord[];
  trendingPosts: CommunityPostRecord[];
  joined: boolean;
  approvalRequired: boolean;
  allowEvents: boolean;
  allowLive: boolean;
  allowPolls: boolean;
  allowMarketplace: boolean;
  allowChatRoom: boolean;
  notificationLevel: 'all' | 'highlights' | 'off';
}

export interface JobRecord {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: 'remote' | 'fullTime' | 'partTime' | 'freelance' | 'internship' | 'contract' | 'hybrid' | 'onsite';
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead';
  postedTime: string;
  logoInitial: string;
  logoColorValue: number;
  description: string;
  responsibilities: string[];
  requirements: string[];
  skills: string[];
  benefits: string[];
  aboutCompany: string;
  quickApplyEnabled: boolean;
  verifiedEmployer: boolean;
  saved: boolean;
  applied: boolean;
  featured: boolean;
  remoteFriendly: boolean;
  draft: boolean;
  closed: boolean;
  externalApplyEnabled: boolean;
  contactLink?: string;
  deadlineLabel?: string;
}

export interface ReferralRecord {
  inviteCode: string;
  benefit: string;
  currentInvites: number;
  totalMilestone: number;
  milestones: Array<{ count: number; reward: string; isAchieved: boolean }>;
  invitedFriends: Array<{ name: string; avatarUrl: string; status: string }>;
}

export interface PremiumPlanRecord {
  name: string;
  price: string;
  billingLabel: string;
  description: string;
  features: string[];
  badge?: string;
  savingsLabel?: string;
}

export interface NotificationInboxRecord {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  payload: {
    type: 'social' | 'commerce' | 'security' | 'system';
    routeName: string;
    entityId?: string;
    metadata: Record<string, unknown>;
  };
}

export interface SettingsSectionRecord {
  key: string;
  title: string;
  items: Array<{
    title: string;
    subtitle?: string;
    routeName?: string;
    isDestructive?: boolean;
  }>;
}

export interface SupportFaqRecord {
  question: string;
  answer: string;
}

export interface SupportTicketRecord {
  id: string;
  subject: string;
  category: string;
  status: 'open' | 'pending' | 'resolved';
  createdAt: string;
}

export interface GroupChatRecord {
  id: string;
  name: string;
  members: string[];
  roles: Record<string, string>;
  media: string[];
}

export interface CallRecord {
  id: string;
  user: string;
  type: 'voice' | 'video';
  state: 'incoming' | 'outgoing' | 'missed' | 'completed';
  time: string;
}

export interface LiveStreamRecord {
  id: string;
  title: string;
  host: string;
  audienceCount: number;
  status: 'scheduled' | 'live' | 'ended';
  scheduledAt?: string;
}

@Injectable()
export class EcosystemDataService {
  private readonly hashtags: HashtagRecord[] = [
    { tag: '#creator', count: 12040 },
    { tag: '#dhaka', count: 9420 },
    { tag: '#marketplace', count: 6840 },
    { tag: '#hiring', count: 5520 },
  ];

  private readonly trending: TrendingItemRecord[] = [
    { title: 'Creator Meetup Dhaka', type: 'event', score: 92 },
    { title: 'Studio lamp drop', type: 'marketplace', score: 89 },
    { title: '#creator', type: 'hashtag', score: 86 },
    { title: 'Product Designer Remote', type: 'job', score: 80 },
  ];

  private readonly bookmarks: BookmarkRecord[] = [
    { id: 'p1', title: 'Creator launch note', type: 'post' },
    { id: 'r1', title: '3 onboarding transitions', type: 'reel' },
    { id: 'prd1', title: 'Studio Lamp Drop', type: 'product' },
  ];

  private readonly hiddenItems: Array<{
    id: string;
    targetId: string;
    targetType: 'post' | 'reel' | 'story' | 'comment';
    hiddenAt: string;
  }> = [
    {
      id: 'hid1',
      targetId: 'p-hidden-1',
      targetType: 'post',
      hiddenAt: '2026-04-19T10:15:00.000Z',
    },
    {
      id: 'hid2',
      targetId: 'p-hidden-2',
      targetType: 'post',
      hiddenAt: '2026-04-19T11:45:00.000Z',
    },
  ];

  private readonly collections: SavedCollectionRecord[] = [
    { id: 'col1', name: 'Creator Ideas', itemIds: ['p1', 'r1'], privacy: 'private' },
    { id: 'col2', name: 'Shop Wishlist', itemIds: ['prd1'], privacy: 'private' },
  ];

  private readonly pages: PageRecord[] = [
    {
      id: 'page1',
      name: 'OptiZenqor Creators',
      about: 'Official page for creator programs, events, and launches.',
      posts: ['p1', 'p2'],
      following: true,
      category: 'Creator Economy',
      actionButtonLabel: 'Following',
      reviewSummary: '4.8 average rating from creators.',
      visitorPostsSummary: 'Weekly creator wins and launch notes.',
      followersInsight: 'Fastest growing page this month.',
    },
    {
      id: 'page2',
      name: 'Nexa Studio',
      about: 'Brand page for studio launches and marketplace drops.',
      posts: ['p2'],
      following: false,
      category: 'Business',
      actionButtonLabel: 'Follow',
      reviewSummary: 'High satisfaction on product launches.',
      visitorPostsSummary: 'Audience asks about launch timing and bundles.',
      followersInsight: 'Strong engagement from business accounts.',
    },
  ];

  private readonly communities: CommunityRecord[] = [
    {
      id: 'com1',
      name: 'Dhaka Creator Hub',
      description: 'Community for creators sharing growth tactics, feedback, and collaborations.',
      privacy: 'public',
      memberCount: 18240,
      coverColors: [0xff1e40af, 0xff2bb0a1],
      avatarColor: 0xff2563eb,
      tags: ['creators', 'growth', 'collabs'],
      rules: ['Be respectful', 'No spam', 'Credit original work'],
      createdLabel: 'Created 2 years ago',
      category: 'Creator Economy',
      location: 'Dhaka',
      links: ['https://optizenqor.app/communities/dhaka-creators'],
      contactInfo: 'mods@optizenqor.app',
      posts: [
        {
          id: 'cp1',
          authorName: 'Maya Quinn',
          authorRole: 'admin',
          authorAccent: 0xff8b5cf6,
          timeLabel: '2h ago',
          content: 'We are opening a meetup feedback thread for next Friday.',
          type: 'text',
          likes: 120,
          comments: 18,
          shares: 9,
          highlight: true,
          saved: false,
          pinned: true,
          pollOptions: [],
        },
      ],
      events: [
        {
          id: 'ce1',
          title: 'Creator Meetup Dhaka',
          dateLabel: 'Apr 25, 2026',
          locationLabel: 'Dhaka',
          coverColor: 0xff2563eb,
          status: 'Featured',
          going: true,
        },
      ],
      members: [
        {
          id: 'cm1',
          name: 'Maya Quinn',
          role: 'admin',
          accentColor: 0xff8b5cf6,
          topContributor: true,
          following: false,
        },
        {
          id: 'cm2',
          name: 'Luna Crafts',
          role: 'member',
          accentColor: 0xfff59e0b,
          topContributor: true,
          following: true,
        },
      ],
      recentActivity: ['12 new posts today', '3 meetup RSVPs in the last hour'],
      pinnedPosts: [
        {
          id: 'cp1',
          authorName: 'Maya Quinn',
          authorRole: 'admin',
          authorAccent: 0xff8b5cf6,
          timeLabel: '2h ago',
          content: 'We are opening a meetup feedback thread for next Friday.',
          type: 'text',
          likes: 120,
          comments: 18,
          shares: 9,
          highlight: true,
          saved: false,
          pinned: true,
          pollOptions: [],
        },
      ],
      announcements: [
        {
          id: 'cp2',
          authorName: 'Community Mod',
          authorRole: 'moderator',
          authorAccent: 0xff14b8a6,
          timeLabel: '1d ago',
          content: 'Please keep job posts in the dedicated weekly thread.',
          type: 'text',
          likes: 88,
          comments: 6,
          shares: 1,
          highlight: false,
          saved: false,
          pinned: false,
          pollOptions: [],
        },
      ],
      trendingPosts: [
        {
          id: 'cp3',
          authorName: 'Luna Crafts',
          authorRole: 'member',
          authorAccent: 0xfff59e0b,
          timeLabel: '4h ago',
          content: 'Our storefront conversion improved after changing hero copy.',
          type: 'image',
          likes: 210,
          comments: 32,
          shares: 18,
          highlight: false,
          saved: true,
          pinned: false,
          mediaLabel: 'Conversion dashboard screenshot',
          pollOptions: [],
        },
      ],
      joined: true,
      approvalRequired: false,
      allowEvents: true,
      allowLive: true,
      allowPolls: true,
      allowMarketplace: true,
      allowChatRoom: true,
      notificationLevel: 'all',
    },
  ];

  private readonly jobs: JobRecord[] = [
    {
      id: 'job1',
      title: 'Product Designer',
      company: 'OptiZenqor Labs',
      location: 'Remote',
      salary: '$2.5K - $4K',
      type: 'remote',
      experienceLevel: 'mid',
      postedTime: '2h ago',
      logoInitial: 'O',
      logoColorValue: 0xff2563eb,
      description: 'Design social experiences across mobile and admin surfaces.',
      responsibilities: ['Create UI flows', 'Ship prototypes', 'Work with product and engineering'],
      requirements: ['2+ years product design', 'Figma proficiency', 'Portfolio required'],
      skills: ['UI Design', 'UX Research', 'Design Systems'],
      benefits: ['Remote stipend', 'Flexible schedule', 'Health coverage'],
      aboutCompany: 'OptiZenqor Labs builds creator-first social tooling.',
      quickApplyEnabled: true,
      verifiedEmployer: true,
      saved: false,
      applied: false,
      featured: true,
      remoteFriendly: true,
      draft: false,
      closed: false,
      externalApplyEnabled: false,
      deadlineLabel: 'Apply by Apr 30',
    },
    {
      id: 'job2',
      title: 'Community Operations Manager',
      company: 'Nexa Studio',
      location: 'Dhaka',
      salary: '$1.8K - $2.7K',
      type: 'hybrid',
      experienceLevel: 'senior',
      postedTime: '6h ago',
      logoInitial: 'N',
      logoColorValue: 0xffec4899,
      description: 'Lead creator community operations and event execution.',
      responsibilities: ['Run community calendar', 'Coordinate ambassadors', 'Review moderation escalations'],
      requirements: ['Ops experience', 'Community management', 'Strong written communication'],
      skills: ['Operations', 'Moderation', 'Community'],
      benefits: ['Bonus', 'Hybrid office', 'Team retreats'],
      aboutCompany: 'Nexa Studio operates campaigns, launches, and creator programs.',
      quickApplyEnabled: true,
      verifiedEmployer: true,
      saved: true,
      applied: true,
      featured: false,
      remoteFriendly: false,
      draft: false,
      closed: false,
      externalApplyEnabled: true,
      contactLink: 'https://nexa.app/jobs/community-ops',
      deadlineLabel: 'Apply by May 05',
    },
  ];

  private readonly referral: ReferralRecord = {
    inviteCode: 'OPTI-MAYA-42',
    benefit: 'Invite friends and unlock premium credits.',
    currentInvites: 3,
    totalMilestone: 10,
    milestones: [
      { count: 1, reward: 'Creator badge accent', isAchieved: true },
      { count: 3, reward: '7 days premium', isAchieved: true },
      { count: 5, reward: '$10 wallet credit', isAchieved: false },
      { count: 10, reward: '1 month Creator Pro', isAchieved: false },
    ],
    invitedFriends: [
      { name: 'Rafi Ahmed', avatarUrl: 'https://placehold.co/64x64', status: 'Joined' },
      { name: 'Tania Noor', avatarUrl: 'https://placehold.co/64x64', status: 'Pending' },
    ],
  };

  private readonly premiumPlans: PremiumPlanRecord[] = [
    {
      name: 'Creator Pro',
      price: '$14.99',
      billingLabel: 'Monthly',
      description: 'Tools for creators, payouts, and profile boosts.',
      features: ['Advanced insights', 'Creator badge', 'Priority payouts'],
      badge: 'Popular',
      savingsLabel: 'Save 18% yearly',
    },
    {
      name: 'Business Plus',
      price: '$29.99',
      billingLabel: 'Monthly',
      description: 'Tools for business pages, ads, and analytics.',
      features: ['Ads manager', 'Business analytics', 'Priority support'],
    },
  ];

  private readonly wallet = {
    balance: {
      available: 2410,
      pending: 1280,
    },
    transactions: [
      { title: 'Creator payout', amount: 480, date: '2026-04-19T14:30:00.000Z' },
      { title: 'Marketplace sale', amount: 320, date: '2026-04-19T12:10:00.000Z' },
    ],
  };

  private readonly subscriptionPlans = [
    { id: 'sub1', name: 'Creator Pro', price: 14.99 },
    { id: 'sub2', name: 'Business Plus', price: 29.99 },
  ];

  private readonly notificationInbox: NotificationInboxRecord[] = [
    {
      id: 'n1',
      title: 'Your reel is trending',
      body: 'Engagement is up 18% in the last hour.',
      createdAt: '2026-04-19T15:30:00.000Z',
      read: false,
      payload: {
        type: 'social',
        routeName: '/reels',
        entityId: 'r1',
        metadata: { source: 'trending_engine' },
      },
    },
    {
      id: 'n2',
      title: 'Payout pending review',
      body: 'Your latest withdrawal is awaiting approval.',
      createdAt: '2026-04-19T14:35:00.000Z',
      read: true,
      payload: {
        type: 'commerce',
        routeName: '/wallet-payments',
        entityId: 'txn-1002',
        metadata: { status: 'pending' },
      },
    },
  ];

  private readonly settingsSections: SettingsSectionRecord[] = [
    {
      key: 'account',
      title: 'Account',
      items: [
        { title: 'Account Settings', subtitle: 'Profile, email, and account controls', routeName: '/settings/account' },
        { title: 'Password & Security', subtitle: 'Password, OTP, and login checks', routeName: '/settings/password-security' },
        { title: 'Devices & Sessions', subtitle: 'Manage active devices and sessions', routeName: '/settings/devices-sessions' },
      ],
    },
    {
      key: 'privacy',
      title: 'Privacy',
      items: [
        { title: 'Privacy Settings', subtitle: 'Audience and visibility preferences', routeName: '/settings/privacy' },
        { title: 'Blocked Users', subtitle: 'Manage blocked and muted users', routeName: '/settings/blocked-users' },
        { title: 'Data Privacy Center', subtitle: 'Export and control personal data', routeName: '/settings/data-privacy-center' },
      ],
    },
    {
      key: 'support',
      title: 'Support',
      items: [
        { title: 'Help & Safety', subtitle: 'Support resources and safety help', routeName: '/settings/help-safety' },
        { title: 'About', subtitle: 'Version and policy information', routeName: '/settings/about' },
        { title: 'Log Out', subtitle: 'End your current session', isDestructive: true },
      ],
    },
  ];

  private readonly faqs: SupportFaqRecord[] = [
    {
      question: 'How do I reset my password?',
      answer: 'Open forgot password, request an OTP, verify it, then save a new password.',
    },
    {
      question: 'How can I report abusive content?',
      answer: 'Use the report action on posts, reels, comments, chats, or profiles.',
    },
  ];

  private readonly tickets: SupportTicketRecord[] = [
    {
      id: 'tkt1',
      subject: 'Delayed marketplace payout',
      category: 'wallet',
      status: 'pending',
      createdAt: '2026-04-18T10:00:00.000Z',
    },
    {
      id: 'tkt2',
      subject: 'Account verification review',
      category: 'account',
      status: 'open',
      createdAt: '2026-04-19T08:30:00.000Z',
    },
  ];

  private readonly groupChats: GroupChatRecord[] = [
    {
      id: 'gc1',
      name: 'Creator Collab Group',
      members: ['Maya Quinn', 'Nexa Studio', 'Rafi Ahmed'],
      roles: {
        'Maya Quinn': 'admin',
        'Nexa Studio': 'moderator',
        'Rafi Ahmed': 'member',
      },
      media: ['https://placehold.co/200x200', 'https://placehold.co/200x200'],
    },
  ];

  private readonly calls: CallRecord[] = [
    {
      id: 'call1',
      user: 'Maya Quinn',
      type: 'video',
      state: 'completed',
      time: '2026-04-19T09:15:00.000Z',
    },
    {
      id: 'call2',
      user: 'Luna Crafts',
      type: 'voice',
      state: 'missed',
      time: '2026-04-19T11:40:00.000Z',
    },
  ];

  private readonly liveStreams: LiveStreamRecord[] = [
    {
      id: 'live1',
      title: 'Creator launch AMA',
      host: 'Maya Quinn',
      audienceCount: 420,
      status: 'live',
    },
    {
      id: 'live2',
      title: 'Seller storefront preview',
      host: 'Luna Crafts',
      audienceCount: 0,
      status: 'scheduled',
      scheduledAt: '2026-04-21T13:00:00.000Z',
    },
  ];

  getHashtags() {
    return this.hashtags;
  }

  getTrending() {
    return this.trending;
  }

  search(query?: string) {
    const q = (query ?? '').toLowerCase().trim();
    const matchesQuery = (value: string) => !q || value.toLowerCase().includes(q);

    return {
      query: query ?? '',
      users: [
        { id: 'u1', username: 'mayaquinn', name: 'Maya Quinn', type: 'user' },
        { id: 'u4', username: 'luna.crafts', name: 'Luna Crafts', type: 'user' },
      ].filter((item) => matchesQuery(`${item.username} ${item.name}`)),
      hashtags: this.hashtags.filter((item) => matchesQuery(item.tag)),
      jobs: this.jobs.filter((item) => matchesQuery(`${item.title} ${item.company}`)),
      pages: this.pages.filter((item) => matchesQuery(item.name)),
      communities: this.communities.filter((item) => matchesQuery(item.name)),
    };
  }

  getBookmarks() {
    return this.bookmarks;
  }

  getBookmark(id: string) {
    const bookmark = this.bookmarks.find((item) => item.id === id);
    if (!bookmark) {
      throw new NotFoundException(`Bookmark ${id} not found`);
    }
    return bookmark;
  }

  addBookmark(input: {
    id: string;
    title?: string;
    type?: 'post' | 'reel' | 'product';
  }) {
    const existing = this.bookmarks.find((item) => item.id === input.id);
    if (existing) {
      return {
        success: true,
        action: 'already_bookmarked',
        bookmark: existing,
      };
    }

    const bookmark: BookmarkRecord = {
      id: input.id,
      title: input.title ?? `Saved item ${input.id}`,
      type: input.type ?? 'post',
      createdAt: new Date().toISOString(),
    };
    this.bookmarks.unshift(bookmark);
    return {
      success: true,
      action: 'bookmarked',
      bookmark,
    };
  }

  removeBookmark(id: string) {
    const index = this.bookmarks.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new NotFoundException(`Bookmark ${id} not found`);
    }
    const [removed] = this.bookmarks.splice(index, 1);
    return {
      success: true,
      action: 'removed',
      bookmark: removed,
    };
  }

  getHiddenItems() {
    return this.hiddenItems;
  }

  getHiddenItem(targetId: string) {
    const item = this.hiddenItems.find((value) => value.targetId === targetId);
    if (!item) {
      throw new NotFoundException(`Hidden item ${targetId} not found`);
    }
    return item;
  }

  hideItem(input: {
    targetId: string;
    targetType: 'post' | 'reel' | 'story' | 'comment';
  }) {
    const existing = this.hiddenItems.find((item) => item.targetId === input.targetId);
    if (existing) {
      return {
        success: true,
        action: 'already_hidden',
        item: existing,
      };
    }

    const hidden = {
      id: `hid${this.hiddenItems.length + 1}`,
      targetId: input.targetId,
      targetType: input.targetType,
      hiddenAt: new Date().toISOString(),
    };
    this.hiddenItems.unshift(hidden);
    return {
      success: true,
      action: 'hidden',
      item: hidden,
    };
  }

  unhideItem(targetId: string) {
    const index = this.hiddenItems.findIndex((item) => item.targetId === targetId);
    if (index === -1) {
      throw new NotFoundException(`Hidden item ${targetId} not found`);
    }
    const [removed] = this.hiddenItems.splice(index, 1);
    return {
      success: true,
      action: 'unhidden',
      item: removed,
    };
  }

  getCollections() {
    return this.collections;
  }

  getCollection(id: string) {
    const collection = this.collections.find((item) => item.id === id);
    if (!collection) {
      throw new NotFoundException(`Collection ${id} not found`);
    }
    return collection;
  }

  createCollection(name: string) {
    const collection: SavedCollectionRecord = {
      id: `col${this.collections.length + 1}`,
      name,
      itemIds: [],
      privacy: 'private',
    };
    this.collections.unshift(collection);
    return collection;
  }

  addItemToCollection(collectionId: string, itemId: string) {
    const collection = this.collections.find((item) => item.id === collectionId);
    if (!collection) {
      throw new NotFoundException(`Collection ${collectionId} not found`);
    }
    if (!collection.itemIds.includes(itemId)) {
      collection.itemIds.push(itemId);
    }
    return collection;
  }

  updateCollection(id: string, patch: { name?: string; privacy?: string; itemId?: string }) {
    const collection = this.collections.find((item) => item.id === id);
    if (!collection) {
      throw new NotFoundException(`Collection ${id} not found`);
    }
    if (patch.name) {
      collection.name = patch.name;
    }
    if (patch.privacy) {
      collection.privacy = patch.privacy;
    }
    if (patch.itemId && !collection.itemIds.includes(patch.itemId)) {
      collection.itemIds.push(patch.itemId);
    }
    return collection;
  }

  deleteCollection(id: string) {
    const index = this.collections.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new NotFoundException(`Collection ${id} not found`);
    }
    const [removed] = this.collections.splice(index, 1);
    return {
      success: true,
      removed,
    };
  }

  getPages() {
    return this.pages;
  }

  getPage(id: string) {
    const page = this.pages.find((item) => item.id === id);
    if (!page) {
      throw new NotFoundException(`Page ${id} not found`);
    }
    return page;
  }

  getCommunities() {
    return this.communities;
  }

  getCommunity(id: string) {
    const community = this.communities.find((item) => item.id === id);
    if (!community) {
      throw new NotFoundException(`Community ${id} not found`);
    }
    return community;
  }

  getJobs() {
    return this.jobs;
  }

  getJob(id: string) {
    const job = this.jobs.find((item) => item.id === id);
    if (!job) {
      throw new NotFoundException(`Job ${id} not found`);
    }
    return job;
  }

  applyForJob(jobId: string, applicantName: string) {
    const job = this.getJob(jobId);
    return {
      success: true,
      applicantName,
      jobId,
      jobTitle: job.title,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };
  }

  getReferral() {
    return this.referral;
  }

  getPremiumPlans() {
    return this.premiumPlans;
  }

  getWallet() {
    return this.wallet;
  }

  getSubscriptionPlans() {
    return this.subscriptionPlans;
  }

  getNotificationInbox() {
    return this.notificationInbox;
  }

  getSettingsSections() {
    return this.settingsSections;
  }

  getFaqs() {
    return this.faqs;
  }

  getTickets() {
    return this.tickets;
  }

  createTicket(subject: string, category: string) {
    const ticket: SupportTicketRecord = {
      id: `tkt${this.tickets.length + 1}`,
      subject,
      category,
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    this.tickets.unshift(ticket);
    return ticket;
  }

  getGroupChats() {
    return this.groupChats;
  }

  getCalls() {
    return this.calls;
  }

  getLiveStreams() {
    return this.liveStreams;
  }

  getSocketContract() {
    return {
      namespace: '/realtime',
      events: [
        'chat.message.created',
        'chat.thread.read',
        'notification.created',
        'feed.post.created',
        'story.created',
        'reel.created',
        'call.signal',
        'live.audience.updated',
      ],
    };
  }

  getProfessionalProfiles() {
    return {
      businessProfile: {
        companyName: 'Nexa Studio',
        category: 'Business',
        about: 'Studio launches, creator campaigns, and premium storefront drops.',
        highlights: ['Verified business', '15.4K followers', '$940 ad credit'],
      },
      sellerProfile: {
        storeName: 'Luna Crafts',
        rating: 4.8,
        totalListings: 24,
        conversionSummary: 'Best shop conversion 8.4%',
      },
      recruiterProfile: {
        companyName: 'Arif Talent Hub',
        hiringFocus: ['Product', 'Design', 'Operations'],
        openRoles: 6,
        verificationStatus: 'Eligible',
      },
      creatorTools: {
        metrics: [
          { label: 'Reel reach', value: '230K' },
          { label: 'Story replies', value: '12.4K' },
          { label: 'Subscription conversion', value: '4.9%' },
        ],
      },
    };
  }
}
