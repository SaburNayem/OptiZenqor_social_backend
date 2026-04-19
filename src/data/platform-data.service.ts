import { Injectable, NotFoundException } from '@nestjs/common';

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
  media?: string;
  seen: boolean;
  music?: string;
  createdAt: string;
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
  createdAt: string;
}

export interface MessageRecord {
  id: string;
  threadId: string;
  senderId: string;
  text: string;
  read: boolean;
  timestamp: string;
}

export interface ThreadRecord {
  id: string;
  title: string;
  participantIds: string[];
  participantsLabel: string;
  flag?: string;
  summary: string;
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

@Injectable()
export class PlatformDataService {
  private readonly users: UserRecord[] = [
    {
      id: 'u1',
      name: 'Maya Quinn',
      username: 'mayaquinn',
      email: 'maya@optizenqor.app',
      avatar: 'https://placehold.co/120x120',
      bio: 'Creator building social products that feel fast, calm, and human.',
      role: 'Creator',
      verification: 'Verified',
      status: 'Active',
      followers: 82300,
      following: 421,
      walletSummary: '$1,280 pending payout',
      health: 'No active flags. Reel engagement rising 18%.',
      reports: '2 resolved, 0 open',
      lastActive: '2m ago',
    },
    {
      id: 'u2',
      name: 'Nexa Studio',
      username: 'nexa.studio',
      email: 'studio@nexa.app',
      avatar: 'https://placehold.co/120x120',
      bio: 'Business account for campaigns, brand drops, and marketplace launches.',
      role: 'Business',
      verification: 'Verified',
      status: 'Active',
      followers: 15400,
      following: 184,
      walletSummary: '$940 ad credit',
      health: 'Campaign delivery normal. No sanctions.',
      reports: '1 open report on ad caption',
      lastActive: '10m ago',
    },
    {
      id: 'u3',
      name: 'Rafi Ahmed',
      username: 'rafiahmed',
      email: 'rafi@optizenqor.app',
      avatar: 'https://placehold.co/120x120',
      bio: 'General user exploring stories, events, and chats.',
      role: 'User',
      verification: 'Pending',
      status: 'Review',
      followers: 9700,
      following: 283,
      walletSummary: 'No monetization enabled',
      health: 'Login from new device. Security note added.',
      reports: '0 open reports',
      lastActive: '36m ago',
    },
    {
      id: 'u4',
      name: 'Luna Crafts',
      username: 'luna.crafts',
      email: 'luna@crafts.shop',
      avatar: 'https://placehold.co/120x120',
      bio: 'Seller storefront for handmade drops and seasonal collections.',
      role: 'Seller',
      verification: 'Verified',
      status: 'Active',
      followers: 21400,
      following: 129,
      walletSummary: '$2,410 available',
      health: 'Storefront healthy. One refund loop under review.',
      reports: '1 commerce-related ticket',
      lastActive: '5m ago',
    },
    {
      id: 'u5',
      name: 'Arif Talent Hub',
      username: 'arif.talent',
      email: 'ops@talenthub.io',
      avatar: 'https://placehold.co/120x120',
      bio: 'Recruiting and hiring account with community job posts.',
      role: 'Recruiter',
      verification: 'Eligible',
      status: 'Suspended',
      followers: 6400,
      following: 92,
      walletSummary: '$120 boost credit',
      health: 'Temporarily restricted pending verification document check.',
      reports: '3 impersonation-related reports',
      lastActive: '1h ago',
    },
  ];

  private readonly posts: PostRecord[] = [
    {
      id: 'p1',
      authorId: 'u1',
      caption: 'Building social products that feel fast, calm, and human.',
      media: ['https://placehold.co/800x600'],
      tags: ['product', 'design', 'social'],
      likes: 2300,
      comments: 148,
      shares: 54,
      views: 9200,
      status: 'Visible',
      type: 'post',
      createdAt: '2026-04-19T14:40:00.000Z',
    },
    {
      id: 'p2',
      authorId: 'u2',
      caption: 'Which launch card style performs best?',
      media: ['https://placehold.co/800x600'],
      tags: ['launch', 'brand'],
      likes: 1800,
      comments: 82,
      shares: 41,
      views: 7600,
      status: 'Featured',
      type: 'post',
      createdAt: '2026-04-19T12:20:00.000Z',
    },
  ];

  private readonly stories: StoryRecord[] = [
    {
      id: 's1',
      userId: 'u1',
      text: 'Behind the scenes from Dhaka creator hub.',
      seen: false,
      music: 'Ambient Rise',
      createdAt: '2026-04-19T13:50:00.000Z',
    },
    {
      id: 's2',
      userId: 'u4',
      text: 'Only 3 hours until storefront unlock.',
      seen: true,
      createdAt: '2026-04-19T11:00:00.000Z',
    },
  ];

  private readonly reels: ReelRecord[] = [
    {
      id: 'r1',
      authorId: 'u1',
      caption: 'Hook in 2 seconds, transition in 5.',
      audioName: 'Creator Motion Pack',
      thumbnail: 'https://placehold.co/600x900',
      videoUrl: 'https://example.com/reels/r1.mp4',
      likes: 8200,
      comments: 415,
      shares: 182,
      viewCount: 230000,
      createdAt: '2026-04-19T15:10:00.000Z',
    },
    {
      id: 'r2',
      authorId: 'u4',
      caption: 'Weekend collection now live.',
      audioName: 'Store Drop',
      thumbnail: 'https://placehold.co/600x900',
      videoUrl: 'https://example.com/reels/r2.mp4',
      likes: 3100,
      comments: 94,
      shares: 39,
      viewCount: 84000,
      createdAt: '2026-04-19T10:30:00.000Z',
    },
  ];

  private readonly threads: ThreadRecord[] = [
    {
      id: 't1',
      title: 'Creator Collab Group',
      participantIds: ['u1', 'u2', 'u3'],
      participantsLabel: '6 members',
      flag: 'Abuse report',
      summary: 'Two users escalated a creator collaboration dispute.',
    },
    {
      id: 't2',
      title: 'Buyer and Seller Support',
      participantIds: ['u3', 'u4'],
      participantsLabel: '2 members',
      flag: 'Refund conflict',
      summary: 'Buyer accuses seller of false shipment update.',
    },
  ];

  private readonly messages: MessageRecord[] = [
    {
      id: 'm1',
      threadId: 't1',
      senderId: 'u1',
      text: 'Please remove the clip before reposting it.',
      read: true,
      timestamp: '2026-04-19T15:00:00.000Z',
    },
    {
      id: 'm2',
      threadId: 't1',
      senderId: 'u3',
      text: 'I can use whatever I want.',
      read: false,
      timestamp: '2026-04-19T15:01:00.000Z',
    },
    {
      id: 'm3',
      threadId: 't2',
      senderId: 'u3',
      text: 'Tracking says delivered but I received nothing.',
      read: true,
      timestamp: '2026-04-19T14:00:00.000Z',
    },
  ];

  private readonly events: EventRecord[] = [
    {
      id: 'e1',
      title: 'Creator Meetup Dhaka',
      organizer: 'OptiZenqor Creators',
      date: '2026-04-25',
      time: '18:00',
      location: 'Dhaka',
      status: 'Featured',
      participants: 120,
      price: 0,
    },
    {
      id: 'e2',
      title: 'Seller Spring Drop Live',
      organizer: 'Luna Crafts',
      date: '2026-04-27',
      time: '20:00',
      location: 'Remote',
      status: 'Approved',
      participants: 340,
      price: 10,
    },
    {
      id: 'e3',
      title: 'Product Hiring Mixer',
      organizer: 'Arif Talent Hub',
      date: '2026-05-01',
      time: '19:30',
      location: 'Virtual',
      status: 'Review',
      participants: 94,
      price: 0,
    },
  ];

  private readonly products: ProductRecord[] = [
    {
      id: 'prd1',
      title: 'Studio Lamp Drop',
      description: 'Weekend collection now live with warm neutral finish.',
      price: 149.99,
      category: 'Home',
      subcategory: 'Lighting',
      sellerId: 'u4',
      sellerName: 'Luna Crafts',
      location: 'Dhaka',
      images: ['https://placehold.co/600x400'],
      condition: 'New',
      listingStatus: 'Active',
      reviewStatus: 'Approved',
      views: 1482,
      watchers: 82,
      chats: 17,
    },
    {
      id: 'prd2',
      title: 'Creator Desk Setup Pack',
      description: 'Creator gear bundle for streaming and editing.',
      price: 299.99,
      category: 'Electronics',
      subcategory: 'Accessories',
      sellerId: 'u2',
      sellerName: 'Nexa Studio',
      location: 'Remote',
      images: ['https://placehold.co/600x400'],
      condition: 'Like New',
      listingStatus: 'Pending review',
      reviewStatus: 'Under moderation',
      views: 944,
      watchers: 49,
      chats: 8,
    },
  ];

  private readonly walletTransactions: WalletTransactionRecord[] = [
    {
      id: 'txn-1002',
      userId: 'u1',
      title: 'Payout',
      amount: 480,
      channel: 'Bank',
      status: 'Pending',
      createdAt: '2026-04-19T14:30:00.000Z',
    },
    {
      id: 'txn-1003',
      userId: 'u4',
      title: 'Sale income',
      amount: 320,
      channel: 'Wallet',
      status: 'Success',
      createdAt: '2026-04-19T12:10:00.000Z',
    },
  ];

  private readonly subscriptions: SubscriptionRecord[] = [
    {
      userId: 'u1',
      userName: 'Maya Quinn',
      planName: 'Creator Pro',
      startDate: '2026-04-01',
      renewalDate: '2026-05-01',
      billingType: 'Auto renew',
      status: 'Active',
    },
    {
      userId: 'u2',
      userName: 'Nexa Studio',
      planName: 'Business Plus',
      startDate: '2026-04-10',
      renewalDate: '2026-05-10',
      billingType: 'Manual',
      status: 'Active',
    },
  ];

  private readonly plans: PlanRecord[] = [
    {
      id: 'plan-1',
      name: 'Creator Pro',
      price: 14.99,
      interval: 'Monthly',
      features: ['Insights', 'Payouts', 'Badge'],
      status: 'Active',
    },
    {
      id: 'plan-2',
      name: 'Business Plus',
      price: 29.99,
      interval: 'Monthly',
      features: ['Ads', 'Pages', 'Analytics'],
      status: 'Active',
    },
  ];

  private readonly campaigns: NotificationCampaignRecord[] = [
    {
      id: 'cmp-1',
      name: 'Weekend creator challenge',
      audience: 'Creators',
      schedule: '2026-04-20T03:00:00.000Z',
      status: 'Draft',
    },
    {
      id: 'cmp-2',
      name: 'Security alert update',
      audience: 'All users',
      schedule: '2026-04-19T08:00:00.000Z',
      status: 'Sent',
      delivered: '12.1K',
      openRate: '64%',
    },
  ];

  getUsers(role?: string) {
    return role ? this.users.filter((user) => user.role === role) : this.users;
  }

  getUser(id: string) {
    const user = this.users.find((item) => item.id === id);
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  getFeed() {
    return this.posts.map((post) => ({
      ...post,
      author: this.getUser(post.authorId),
    }));
  }

  getPosts() {
    return this.posts;
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
      id: `p${this.posts.length + 1}`,
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

  toggleLike(postId: string) {
    const post = this.getPost(postId);
    post.likes += 1;
    return post;
  }

  getStories() {
    return this.stories.map((story) => ({
      ...story,
      author: this.getUser(story.userId),
    }));
  }

  createStory(input: Pick<StoryRecord, 'userId' | 'text' | 'media'>) {
    const story: StoryRecord = {
      id: `s${this.stories.length + 1}`,
      userId: input.userId,
      text: input.text,
      media: input.media,
      seen: false,
      createdAt: new Date().toISOString(),
    };
    this.stories.unshift(story);
    return story;
  }

  getReels() {
    return this.reels.map((reel) => ({
      ...reel,
      author: this.getUser(reel.authorId),
    }));
  }

  createReel(input: Pick<ReelRecord, 'authorId' | 'caption' | 'audioName' | 'thumbnail' | 'videoUrl'>) {
    const reel: ReelRecord = {
      id: `r${this.reels.length + 1}`,
      authorId: input.authorId,
      caption: input.caption,
      audioName: input.audioName,
      thumbnail: input.thumbnail,
      videoUrl: input.videoUrl,
      likes: 0,
      comments: 0,
      shares: 0,
      viewCount: 0,
      createdAt: new Date().toISOString(),
    };
    this.reels.unshift(reel);
    return reel;
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

  createMessage(threadId: string, senderId: string, text: string) {
    this.getThread(threadId);
    this.getUser(senderId);
    const message: MessageRecord = {
      id: `m${this.messages.length + 1}`,
      threadId,
      senderId,
      text,
      read: false,
      timestamp: new Date().toISOString(),
    };
    this.messages.push(message);
    return message;
  }

  getEvents() {
    return this.events;
  }

  createEvent(input: Omit<EventRecord, 'id' | 'status'> & { status?: EventRecord['status'] }) {
    const event: EventRecord = {
      id: `e${this.events.length + 1}`,
      ...input,
      status: input.status ?? 'Review',
    };
    this.events.unshift(event);
    return event;
  }

  getProducts() {
    return this.products;
  }

  createProduct(input: Omit<ProductRecord, 'id' | 'listingStatus' | 'reviewStatus' | 'views' | 'watchers' | 'chats'>) {
    const product: ProductRecord = {
      id: `prd${this.products.length + 1}`,
      ...input,
      listingStatus: 'Pending review',
      reviewStatus: 'Queued',
      views: 0,
      watchers: 0,
      chats: 0,
    };
    this.products.unshift(product);
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

  createCampaign(input: Pick<NotificationCampaignRecord, 'name' | 'audience' | 'schedule'>) {
    const campaign: NotificationCampaignRecord = {
      id: `cmp-${this.campaigns.length + 1}`,
      name: input.name,
      audience: input.audience,
      schedule: input.schedule,
      status: 'Scheduled',
    };
    this.campaigns.unshift(campaign);
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
}
