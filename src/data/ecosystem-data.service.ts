import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { StateSnapshotService } from '../services/state-snapshot.service';

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
  avatarUrl?: string;
  coverUrl?: string;
  followersCount?: number;
  likesCount?: number;
  verified?: boolean;
  ownerId?: string;
  location?: string;
  contactLabel?: string;
  highlights?: string[];
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

type CommunityMutationInput = {
  name: string;
  description: string;
  privacy?: CommunityRecord['privacy'];
  category?: string;
  location?: string;
  tags?: string[];
  rules?: string[];
  links?: string[];
  contactInfo?: string;
  coverColors?: number[];
  avatarColor?: number;
  approvalRequired?: boolean;
  allowEvents?: boolean;
  allowLive?: boolean;
  allowPolls?: boolean;
  allowMarketplace?: boolean;
  allowChatRoom?: boolean;
  notificationLevel?: CommunityRecord['notificationLevel'];
  ownerId?: string;
  ownerName?: string;
};

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
  recipientId: string;
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
  description?: string;
  category?: string;
  location?: string;
  quickOptions?: Array<{ id: string; label: string; selected?: boolean }>;
  comments?: Array<{
    id: string;
    username: string;
    avatarUrl: string;
    message: string;
    verified?: boolean;
  }>;
  reactions?: Array<{
    id: string;
    type: 'like' | 'love' | 'wow';
  }>;
}

@Injectable()
export class EcosystemDataService implements OnModuleInit {
  constructor(private readonly stateSnapshots: StateSnapshotService) {}

  private readonly hashtags: HashtagRecord[] = [];

  private readonly trending: TrendingItemRecord[] = [];

  private readonly bookmarks: BookmarkRecord[] = [];

  private readonly hiddenItems: Array<{
    id: string;
    targetId: string;
    targetType: 'post' | 'reel' | 'story' | 'comment';
    hiddenAt: string;
  }> = [];

  private readonly collections: SavedCollectionRecord[] = [];

  private readonly pages: PageRecord[] = [];

  private readonly communities: CommunityRecord[] = [];

  private readonly taggedPostSummariesByUser: Record<
    string,
    Array<{
      id: string;
      title: string;
      location: string;
      mediaCount: number;
    }>
  > = {};

  private readonly mentionHistoryByUser: Record<
    string,
    Array<{ message: string }>
  > = {};

  private readonly jobs: JobRecord[] = [];

  private readonly referral: ReferralRecord = {
    inviteCode: '',
    benefit: 'Invite friends and unlock premium credits.',
    currentInvites: 0,
    totalMilestone: 0,
    milestones: [],
    invitedFriends: [],
  };

  private readonly premiumPlans: PremiumPlanRecord[] = [];

  private readonly wallet = {
    balance: {
      available: 0,
      pending: 0,
    },
    transactions: [] as Array<{ title: string; amount: number; date: string }>,
  };

  private readonly subscriptionPlans: Array<{ id: string; name: string; price: number }> = [];

  private notificationInbox: NotificationInboxRecord[] = [];

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

  private readonly tickets: SupportTicketRecord[] = [];

  private readonly groupChats: GroupChatRecord[] = [];

  private readonly calls: CallRecord[] = [];

  private readonly liveStreams: LiveStreamRecord[] = [];

  private readonly jobApplications: Array<{
    id: string;
    jobId: string;
    applicantName: string;
    status: string;
    appliedDate: string;
    timeline: string[];
  }> = [];

  private readonly jobAlerts: Array<{
    id: string;
    keyword: string;
    location: string;
    frequency: string;
  }> = [];

  private readonly companies: Array<{
    id: string;
    name: string;
    tagline: string;
    logoInitial: string;
    colorValue: number;
    followers: number;
    verified: boolean;
  }> = [];

  private readonly careerProfile = {
    name: '',
    title: '',
    skills: [] as string[],
    experience: [] as string[],
    education: [] as string[],
    resumeLabel: '',
    portfolioLinks: [] as string[],
    availability: '',
  };

  private readonly employerStats = {
    totalJobs: 0,
    totalApplicants: 0,
    shortlistedCandidates: 0,
    messages: 0,
  };

  private readonly employerProfile = {
    companyName: '',
    hiringTitle: '',
    about: '',
    location: '',
    hiringFocus: [] as string[],
    openRoles: [] as string[],
    teamHighlights: [] as string[],
  };

  private readonly applicants: Array<{
    id: string;
    name: string;
    title: string;
    skills: string[];
    status: string;
    resumeLabel: string;
  }> = [];

  async onModuleInit() {
    const snapshot = await this.stateSnapshots.load<any>('ecosystem_data_state');

    if (!snapshot) {
      return;
    }

    this.replaceArray(this.bookmarks, snapshot.bookmarks);
    this.replaceArray(this.hiddenItems, snapshot.hiddenItems);
    this.replaceArray(this.collections, snapshot.collections);
    this.replaceArray(this.pages, snapshot.pages);
    this.replaceArray(this.communities, snapshot.communities);
    this.replaceArray(this.jobs, snapshot.jobs);
    this.replaceArray(this.jobApplications, snapshot.jobApplications);
    this.notificationInbox = snapshot.notificationInbox ?? this.notificationInbox;
    this.replaceArray(this.tickets, snapshot.tickets);
    this.replaceArray(this.liveStreams, snapshot.liveStreams);
  }

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
      users: [] as Array<{ id: string; username: string; name: string; type: string }>,
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

  async addBookmark(input: {
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
    await this.persistState();
    return {
      success: true,
      action: 'bookmarked',
      bookmark,
    };
  }

  async removeBookmark(id: string) {
    const index = this.bookmarks.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new NotFoundException(`Bookmark ${id} not found`);
    }
    const [removed] = this.bookmarks.splice(index, 1);
    await this.persistState();
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

  async hideItem(input: {
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
    await this.persistState();
    return {
      success: true,
      action: 'hidden',
      item: hidden,
    };
  }

  async unhideItem(targetId: string) {
    const index = this.hiddenItems.findIndex((item) => item.targetId === targetId);
    if (index === -1) {
      throw new NotFoundException(`Hidden item ${targetId} not found`);
    }
    const [removed] = this.hiddenItems.splice(index, 1);
    await this.persistState();
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

  async createCollection(name: string) {
    const collection: SavedCollectionRecord = {
      id: `col${this.collections.length + 1}`,
      name,
      itemIds: [],
      privacy: 'private',
    };
    this.collections.unshift(collection);
    await this.persistState();
    return collection;
  }

  async addItemToCollection(collectionId: string, itemId: string) {
    const collection = this.collections.find((item) => item.id === collectionId);
    if (!collection) {
      throw new NotFoundException(`Collection ${collectionId} not found`);
    }
    if (!collection.itemIds.includes(itemId)) {
      collection.itemIds.push(itemId);
    }
    await this.persistState();
    return collection;
  }

  async updateCollection(
    id: string,
    patch: { name?: string; privacy?: string; itemId?: string },
  ) {
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
    await this.persistState();
    return collection;
  }

  async deleteCollection(id: string) {
    const index = this.collections.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new NotFoundException(`Collection ${id} not found`);
    }
    const [removed] = this.collections.splice(index, 1);
    await this.persistState();
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

  async createPage(input: {
    name: string;
    about: string;
    category: string;
    ownerId: string;
    location?: string;
    contactLabel?: string;
  }) {
    const page: PageRecord = {
      id: `page${this.pages.length + 1}`,
      name: input.name,
      about: input.about,
      posts: ['Welcome post created. Add your first update to introduce this page.'],
      following: true,
      category: input.category,
      actionButtonLabel: 'Following',
      reviewSummary: 'Audience reviews will appear once your page grows.',
      visitorPostsSummary: 'Visitor posts are curated before publishing.',
      followersInsight: 'New page created. Publish regularly to build reach.',
      avatarUrl: 'https://placehold.co/300x300',
      coverUrl: 'https://placehold.co/1200x400',
      followersCount: 0,
      likesCount: 0,
      verified: false,
      ownerId: input.ownerId,
      location: input.location ?? 'Global',
      contactLabel: input.contactLabel ?? 'Message',
      highlights: ['Welcome'],
    };
    this.pages.unshift(page);
    await this.persistState();
    return page;
  }

  async togglePageFollow(id: string) {
    const page = this.getPage(id);
    page.following = !page.following;
    page.followersCount = Math.max(
      0,
      (page.followersCount ?? 0) + (page.following ? 1 : -1),
    );
    page.actionButtonLabel = page.following ? 'Following' : 'Follow';
    await this.persistState();
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

  getTaggedPostSummaries(userId: string) {
    return this.taggedPostSummariesByUser[userId] ?? [];
  }

  getMentionHistory(userId: string) {
    return this.mentionHistoryByUser[userId] ?? [];
  }

  async joinCommunity(id: string, userId = 'u1', userName = 'Maya Quinn') {
    const community = this.getCommunity(id);
    if (!community.joined) {
      community.joined = true;
      community.memberCount += 1;
    }

    const existingMember = community.members.find((member) => member.id === userId);
    if (!existingMember) {
      community.members.unshift({
        id: userId,
        name: userName,
        role: 'member',
        accentColor: community.avatarColor,
        topContributor: false,
        following: false,
      });
    }

    await this.persistState();
    return {
      community,
      joined: true,
      memberCount: community.memberCount,
    };
  }

  async leaveCommunity(id: string, userId = 'u1') {
    const community = this.getCommunity(id);
    if (community.joined) {
      community.joined = false;
      community.memberCount = Math.max(0, community.memberCount - 1);
    }

    const memberIndex = community.members.findIndex((member) => member.id === userId);
    if (memberIndex >= 0) {
      community.members.splice(memberIndex, 1);
    }

    await this.persistState();
    return {
      community,
      joined: false,
      memberCount: community.memberCount,
    };
  }

  async createCommunity(input: CommunityMutationInput) {
    const community: CommunityRecord = {
      id: `com${this.communities.length + 1}`,
      name: input.name,
      description: input.description,
      privacy: input.privacy ?? 'public',
      memberCount: 1,
      coverColors: input.coverColors?.length ? input.coverColors : [0xff1e40af, 0xff2bb0a1],
      avatarColor: input.avatarColor ?? 0xff2563eb,
      tags: input.tags ?? [],
      rules: input.rules ?? ['Be respectful', 'No spam'],
      createdLabel: 'Created just now',
      category: input.category ?? 'General',
      location: input.location ?? 'Global',
      links: input.links ?? [],
      contactInfo: input.contactInfo ?? 'community@optizenqor.app',
      posts: [],
      events: [],
      members: [
        {
          id: input.ownerId ?? 'u1',
          name: input.ownerName ?? 'Maya Quinn',
          role: 'admin',
          accentColor: input.avatarColor ?? 0xff2563eb,
          topContributor: true,
          following: false,
        },
      ],
      recentActivity: ['Community created just now'],
      pinnedPosts: [],
      announcements: [],
      trendingPosts: [],
      joined: true,
      approvalRequired: input.approvalRequired ?? false,
      allowEvents: input.allowEvents ?? true,
      allowLive: input.allowLive ?? true,
      allowPolls: input.allowPolls ?? true,
      allowMarketplace: input.allowMarketplace ?? false,
      allowChatRoom: input.allowChatRoom ?? true,
      notificationLevel: input.notificationLevel ?? 'all',
    };
    this.communities.unshift(community);
    await this.persistState();
    return community;
  }

  async updateCommunity(id: string, patch: Partial<CommunityMutationInput>) {
    const community = this.getCommunity(id);
    if (patch.name !== undefined) community.name = patch.name;
    if (patch.description !== undefined) community.description = patch.description;
    if (patch.privacy !== undefined) community.privacy = patch.privacy;
    if (patch.category !== undefined) community.category = patch.category;
    if (patch.location !== undefined) community.location = patch.location;
    if (patch.tags !== undefined) community.tags = patch.tags;
    if (patch.rules !== undefined) community.rules = patch.rules;
    if (patch.links !== undefined) community.links = patch.links;
    if (patch.contactInfo !== undefined) community.contactInfo = patch.contactInfo;
    if (patch.coverColors !== undefined && patch.coverColors.length > 0) {
      community.coverColors = patch.coverColors;
    }
    if (patch.avatarColor !== undefined) community.avatarColor = patch.avatarColor;
    if (patch.approvalRequired !== undefined) {
      community.approvalRequired = patch.approvalRequired;
    }
    if (patch.allowEvents !== undefined) community.allowEvents = patch.allowEvents;
    if (patch.allowLive !== undefined) community.allowLive = patch.allowLive;
    if (patch.allowPolls !== undefined) community.allowPolls = patch.allowPolls;
    if (patch.allowMarketplace !== undefined) {
      community.allowMarketplace = patch.allowMarketplace;
    }
    if (patch.allowChatRoom !== undefined) {
      community.allowChatRoom = patch.allowChatRoom;
    }
    if (patch.notificationLevel !== undefined) {
      community.notificationLevel = patch.notificationLevel;
    }
    await this.persistState();
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

  getJobsNetworkingOverview() {
    return {
      jobs: this.getJobs(),
      myJobs: this.jobs.map((job, index) => ({
        ...job,
        draft: index === 1,
        closed: index === 0 ? false : job.closed,
      })),
      applications: this.jobApplications,
      alerts: this.jobAlerts,
      companies: this.companies,
      profile: this.careerProfile,
      employerStats: this.employerStats,
      employerProfile: this.employerProfile,
      applicants: this.applicants,
    };
  }

  async createJob(input: {
    title: string;
    company: string;
    location: string;
    salary: string;
    type?: JobRecord['type'];
    experienceLevel?: JobRecord['experienceLevel'];
  }) {
    const job: JobRecord = {
      id: `job${this.jobs.length + 1}`,
      title: input.title,
      company: input.company,
      location: input.location,
      salary: input.salary,
      type: input.type ?? 'remote',
      experienceLevel: input.experienceLevel ?? 'mid',
      postedTime: 'just now',
      logoInitial: input.company.charAt(0).toUpperCase() || 'J',
      logoColorValue: 0xff2563eb,
      description: 'New job draft created from the updated jobs networking flow.',
      responsibilities: ['Define role scope', 'Review applications', 'Run interviews'],
      requirements: ['Role requirements pending update'],
      skills: ['Communication'],
      benefits: ['Flexible workflow'],
      aboutCompany: `${input.company} hiring workspace`,
      quickApplyEnabled: true,
      verifiedEmployer: true,
      saved: false,
      applied: false,
      featured: false,
      remoteFriendly: input.type === 'remote' || input.type === 'hybrid',
      draft: true,
      closed: false,
      externalApplyEnabled: false,
      deadlineLabel: 'Add deadline',
    };
    this.jobs.unshift(job);
    await this.persistState();
    return job;
  }

  async applyForJob(jobId: string, applicantName: string) {
    const job = this.getJob(jobId);
    const application = {
      id: `a${this.jobApplications.length + 1}`,
      jobId,
      applicantName,
      status: 'pending',
      appliedDate: new Date().toISOString().slice(0, 10),
      timeline: ['Application submitted'],
    };
    this.jobApplications.unshift(application);
    job.applied = true;
    await this.persistState();
    return {
      success: true,
      applicantName,
      jobId,
      jobTitle: job.title,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      application,
    };
  }

  getJobApplications() {
    return this.jobApplications;
  }

  getJobAlerts() {
    return this.jobAlerts;
  }

  getCompanies() {
    return this.companies;
  }

  getCareerProfile() {
    return this.careerProfile;
  }

  getEmployerStats() {
    return this.employerStats;
  }

  getEmployerProfile() {
    return this.employerProfile;
  }

  getApplicants() {
    return this.applicants;
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

  getNotificationInbox(recipientId?: string) {
    return recipientId
      ? this.notificationInbox.filter((item) => item.recipientId === recipientId)
      : this.notificationInbox;
  }

  pushNotification(input: {
    recipientId: string;
    title: string;
    body: string;
    routeName: string;
    entityId?: string;
    type?: 'social' | 'commerce' | 'security' | 'system';
    metadata?: Record<string, unknown>;
  }) {
    const notification: NotificationInboxRecord = {
      id: `n${this.notificationInbox.length + 1}`,
      recipientId: input.recipientId,
      title: input.title,
      body: input.body,
      createdAt: new Date().toISOString(),
      read: false,
      payload: {
        type: input.type ?? 'social',
        routeName: input.routeName,
        entityId: input.entityId,
        metadata: input.metadata ?? {},
      },
    };
    this.notificationInbox.unshift(notification);
    void this.persistState();
    return notification;
  }

  markNotificationRead(id: string, recipientId?: string) {
    const notification = this.notificationInbox.find(
      (item) => item.id === id && (!recipientId || item.recipientId === recipientId),
    );
    if (!notification) {
      throw new NotFoundException(`Notification ${id} not found`);
    }
    notification.read = true;
    return notification;
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

  async createTicket(subject: string, category: string) {
    const ticket: SupportTicketRecord = {
      id: `tkt${this.tickets.length + 1}`,
      subject,
      category,
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    this.tickets.unshift(ticket);
    await this.persistState();
    return ticket;
  }

  getGroupChats() {
    return this.groupChats;
  }

  getGroupChat(id: string) {
    const groupChat = this.groupChats.find((item) => item.id === id);
    if (!groupChat) {
      throw new NotFoundException(`Group chat ${id} not found`);
    }
    return groupChat;
  }

  getCalls() {
    return this.calls;
  }

  getCall(id: string) {
    const call = this.calls.find((item) => item.id === id);
    if (!call) {
      throw new NotFoundException(`Call ${id} not found`);
    }
    return call;
  }

  getLiveStreams() {
    return this.liveStreams;
  }

  getLiveStream(id: string) {
    const liveStream = this.liveStreams.find((item) => item.id === id);
    if (!liveStream) {
      throw new NotFoundException(`Live stream ${id} not found`);
    }
    return liveStream;
  }

  getLiveStreamStudio() {
    return this.getLiveStream('live1');
  }

  async addLiveStreamComment(
    id: string,
    input: { username: string; message: string; avatarUrl?: string },
  ) {
    const liveStream = this.getLiveStream(id);
    liveStream.comments ??= [];
    const comment = {
      id: `lc${liveStream.comments.length + 1}`,
      username: input.username,
      avatarUrl: input.avatarUrl ?? 'https://placehold.co/80x80',
      message: input.message,
      verified: false,
    };
    liveStream.comments.push(comment);
    await this.persistState();
    return comment;
  }

  async addLiveStreamReaction(id: string, type: 'like' | 'love' | 'wow') {
    const liveStream = this.getLiveStream(id);
    liveStream.reactions ??= [];
    const reaction = {
      id: `lr${liveStream.reactions.length + 1}`,
      type,
    };
    liveStream.reactions.push(reaction);
    await this.persistState();
    return reaction;
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

  private replaceArray<T>(target: T[], next?: T[]) {
    if (!next) {
      return;
    }
    target.splice(0, target.length, ...next);
  }

  private async persistState() {
    await this.stateSnapshots.save('ecosystem_data_state', {
      bookmarks: this.bookmarks,
      hiddenItems: this.hiddenItems,
      collections: this.collections,
      pages: this.pages,
      communities: this.communities,
      jobs: this.jobs,
      jobApplications: this.jobApplications,
      notificationInbox: this.notificationInbox,
      tickets: this.tickets,
      liveStreams: this.liveStreams,
    });
  }
}
