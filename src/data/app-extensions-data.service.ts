import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class AppExtensionsDataService {
  private linkedAccounts = [
    {
      id: 'u1',
      name: 'Maya Quinn',
      handle: '@mayaquinn',
      roleLabel: 'Creator',
      isVerified: true,
    },
    {
      id: 'u2',
      name: 'Nexa Studio',
      handle: '@nexa.studio',
      roleLabel: 'Business',
      isVerified: true,
    },
    {
      id: 'u3',
      name: 'Rafi Ahmed',
      handle: '@rafiahmed',
      roleLabel: 'Personal',
      isVerified: false,
    },
  ];

  private activeAccountId = 'u1';

  private activitySessions = [
    {
      id: 's1',
      device: 'Pixel Emulator',
      location: 'Dhaka, BD',
      platform: 'Android',
      lastActive: 'Active now',
      active: true,
      isCurrent: true,
    },
    {
      id: 's2',
      device: 'MacBook Pro',
      location: 'Dhaka, BD',
      platform: 'Web',
      lastActive: '2 hours ago',
      active: true,
      isCurrent: false,
    },
    {
      id: 's3',
      device: 'iPhone 15 Pro',
      location: 'Singapore',
      platform: 'iOS',
      lastActive: 'Yesterday',
      active: false,
      isCurrent: false,
    },
  ];

  private loginHistory = [
    'Login success from Pixel Emulator',
    'Password changed from MacBook Pro',
    'New device approved: iPhone 15 Pro',
  ];

  private verificationRequest = {
    status: 'notRequested',
    reason: 'Not submitted',
    selectedDocuments: [] as string[],
    submittedAt: null as string | null,
    requiredDocuments: ['Government ID', 'Business proof', 'Profile photo'],
  };

  private reportCenter = {
    reasons: ['Spam', 'Harassment', 'Violence', 'False information'],
    history: [{ reason: 'Spam', status: 'Submitted' }],
  };

  private deepLinkState = {
    supportedPrefixes: ['optizenqor://', 'https://optizenqor.app/'],
    recentLinks: ['optizenqor://posts/p1', 'https://optizenqor.app/reels/r1'],
  };

  private appUpdate = {
    type: 'optional',
    message: 'Version 2.1 has performance improvements and chat upgrades.',
    isUpdating: false,
  };

  private offlineSync = {
    isOffline: true,
    queue: [
      { title: 'Like on post #923', pending: true },
      { title: 'Draft save', pending: true },
    ],
  };

  private localizationSupport = {
    locales: [
      { localeCode: 'en', label: 'English' },
      { localeCode: 'es', label: 'Spanish' },
      { localeCode: 'ar', label: 'Arabic (RTL ready)' },
    ],
    selected: 'en',
  };

  private maintenanceMode = {
    title: 'Scheduled Maintenance',
    message: 'We are improving your experience. Please retry shortly.',
    isActive: false,
    isRetrying: false,
  };

  private activePolls = [
    {
      id: 'poll_1',
      title: 'Weekly content direction',
      question: 'What would you like to see next on my profile?',
      options: ['Behind-the-scenes reels', 'Career growth tips', 'Design breakdowns'],
      votes: [42, 28, 36],
      type: 'poll',
      statusLabel: 'Live now',
      audienceLabel: 'Followers only',
      endsInLabel: 'Ends in 18 hours',
      responseCount: 106,
      accentHex: 0xff0ea5e9,
    },
    {
      id: 'survey_1',
      title: 'Community feedback survey',
      question: 'Which area of the app still needs the most improvement?',
      options: [
        'Profile customization',
        'Messaging reliability',
        'Content discovery',
        'Creator monetization',
      ],
      votes: [18, 11, 22, 15],
      type: 'survey',
      statusLabel: 'Collecting answers',
      audienceLabel: 'Public',
      endsInLabel: 'Ends in 3 days',
      responseCount: 66,
      accentHex: 0xff14b8a6,
    },
  ];

  private draftPolls = [
    {
      id: 'draft_1',
      title: 'Brand collab interest check',
      question: 'Would you want early access to brand collab calls?',
      options: ['Yes, send invites', 'Maybe later', 'Not interested'],
      votes: [0, 0, 0],
      type: 'poll',
      statusLabel: 'Draft',
      audienceLabel: 'Close friends',
      endsInLabel: 'Not scheduled',
      responseCount: 0,
      accentHex: 0xfff59e0b,
    },
  ];

  private readonly pollTemplates = [
    'Feature feedback',
    'Event attendance check',
    'Content preference vote',
    'Product research survey',
  ];

  private readonly learningCourses = [
    {
      id: 'c1',
      title: 'Flutter Social App Architecture',
      lessons: ['Intro', 'State', 'Routing'],
      progress: 0.4,
      instructor: 'Instructor profile',
      saved: false,
      certificateSummary: 'Certificate placeholder',
      quizSummary: 'Quiz placeholder',
    },
  ];

  private personalizationInterests = [
    { name: 'Tech', selected: false },
    { name: 'Design', selected: false },
    { name: 'Travel', selected: false },
    { name: 'Business', selected: false },
    { name: 'Fitness', selected: false },
    { name: 'Learning', selected: false },
  ];

  private readonly shareRepostOptions = [
    { title: 'Share to chat' },
    { title: 'Share externally' },
    { title: 'Copy post link' },
    { title: 'Repost' },
    { title: 'Quote-share' },
  ];

  private readonly accessibilitySupportOptions = [
    { title: 'Captions by default', enabled: true },
    { title: 'High contrast mode', enabled: false },
    { title: 'Reduce motion', enabled: false },
    { title: 'Screen reader hints', enabled: true },
  ];

  private readonly exploreRecommendations = [
    {
      title: 'Creator education',
      subtitle: 'Because you watch design breakdowns and creator workflow posts.',
      type: 'topic',
    },
    {
      title: 'Dhaka product jobs',
      subtitle: 'Recommended from your saved jobs, follows, and community activity.',
      type: 'job',
    },
    {
      title: 'Marketplace studio gear',
      subtitle: 'Suggested from your recent storefront and reel engagement.',
      type: 'product',
    },
  ];

  private legalCompliance = {
    termsAccepted: true,
    privacyAccepted: true,
    guidelinesAccepted: true,
    documents: [
      { key: 'terms', title: 'Terms of Service', version: '2026.04' },
      { key: 'privacy', title: 'Privacy Policy', version: '2026.04' },
      { key: 'guidelines', title: 'Community Guidelines', version: '2026.04' },
    ],
  };

  private readonly mutedAccounts = [
    {
      id: 'u2',
      name: 'Nexa Studio',
      handle: '@nexa.studio',
      status: 'muted',
      avatarUrl: 'https://placehold.co/64x64',
    },
  ];

  private readonly restrictedAccounts = [
    {
      id: 'u5',
      name: 'Arif Talent Hub',
      handle: '@arif.talent',
      status: 'restricted',
      avatarUrl: 'https://placehold.co/64x64',
    },
  ];

  private pushNotificationPreferences = [
    { title: 'Likes', enabled: true },
    { title: 'Comments', enabled: true },
    { title: 'Mentions', enabled: true },
    { title: 'Messages', enabled: true },
    { title: 'Calls', enabled: false },
    { title: 'Live alerts', enabled: false },
  ];

  private readonly mediaViewerItems = [
    {
      id: 'media_p1_1',
      url: 'https://placehold.co/800x600',
      type: 'image',
      sourceType: 'post',
      sourceId: 'p1',
    },
    {
      id: 'media_r1_1',
      url: 'https://example.com/reels/r1.mp4',
      type: 'video',
      sourceType: 'reel',
      sourceId: 'r1',
    },
    {
      id: 'media_s1_1',
      url: 'https://placehold.co/720x1280?text=story',
      type: 'image',
      sourceType: 'story',
      sourceId: 's1',
    },
  ];

  private marketplaceWorkspace = {
    savedItemIds: ['prd1', 'prd2'],
    followedSellerIds: ['u4', 'u2'],
    savedSearches: ['sony camera', 'creator desk'],
    recentSearches: ['lighting setup', 'remote design audit'],
    trendingSearches: ['creator bundle', 'studio lamp', 'office chair'],
    notifications: [
      'Price dropped 8% on Studio Lamp Drop',
      'Seller replied to your delivery question',
      'Your saved search matched a new product listing',
    ],
    blockedKeywords: ['counterfeit', 'stolen', 'weapons'],
    chatMessages: [
      {
        id: 'mkt-chat-1',
        senderName: 'Luna Crafts',
        text: 'Yes, this lamp ships tomorrow morning.',
        timestamp: '2026-04-21T08:35:00.000Z',
        productTitle: 'Studio Lamp Drop',
      },
      {
        id: 'mkt-chat-2',
        senderName: 'You',
        text: 'Can you hold it until evening?',
        timestamp: '2026-04-21T09:10:00.000Z',
      },
    ],
    offerHistory: [
      {
        actor: 'You',
        action: 'Offered',
        amount: 135,
        timestamp: '2026-04-21T09:14:00.000Z',
      },
      {
        actor: 'Luna Crafts',
        action: 'Countered',
        amount: 142,
        timestamp: '2026-04-21T09:16:00.000Z',
      },
    ],
    orders: [
      {
        id: 'ord-1',
        productId: 'prd1',
        productTitle: 'Studio Lamp Drop',
        amount: 149.99,
        status: 'Pending',
        address: 'House 14, Road 7, Dhanmondi, Dhaka',
        deliveryMethod: 'Home delivery',
        paymentMethod: 'Cash on delivery',
        createdAt: '2026-04-20T11:10:00.000Z',
      },
    ],
  };

  private supportMail = {
    contactEmail: 'support@optizenqor.app',
    escalationEmail: 'trust@optizenqor.app',
    responseTime: 'Usually within 24 hours',
  };

  getAccountSwitching() {
    return {
      accounts: this.linkedAccounts,
      activeAccountId: this.activeAccountId,
    };
  }

  setActiveAccount(accountId: string) {
    const account = this.linkedAccounts.find((item) => item.id === accountId);
    if (!account) {
      throw new NotFoundException(`Account ${accountId} not found`);
    }
    this.activeAccountId = accountId;
    return {
      success: true,
      activeAccountId: this.activeAccountId,
      account,
    };
  }

  getActivitySessions() {
    return {
      isLoading: false,
      loggingOutOthers: false,
      sessions: this.activitySessions,
      activities: this.loginHistory,
      activeSessions: this.activitySessions.filter((item) => item.active),
    };
  }

  logoutOtherDevices() {
    this.activitySessions = this.activitySessions.map((item) =>
      item.isCurrent
        ? item
        : { ...item, active: false, lastActive: 'Signed out remotely' },
    );
    return this.getActivitySessions();
  }

  revokeSession(sessionId: string) {
    const session = this.activitySessions.find((item) => item.id === sessionId);
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }
    session.active = false;
    session.lastActive = 'Signed out remotely';
    return session;
  }

  getVerificationRequest() {
    return this.verificationRequest;
  }

  toggleVerificationDocument(documentName: string) {
    if (this.verificationRequest.selectedDocuments.includes(documentName)) {
      this.verificationRequest.selectedDocuments =
        this.verificationRequest.selectedDocuments.filter((item) => item !== documentName);
    } else {
      this.verificationRequest.selectedDocuments = [
        ...this.verificationRequest.selectedDocuments,
        documentName,
      ];
    }
    return this.verificationRequest;
  }

  submitVerificationRequest() {
    this.verificationRequest = {
      ...this.verificationRequest,
      status: 'pending',
      reason: 'Documents uploaded. Under review.',
      submittedAt: new Date().toISOString(),
    };
    return this.verificationRequest;
  }

  updateVerificationStatus(status: 'notRequested' | 'pending' | 'approved' | 'rejected') {
    const reason =
      status === 'notRequested'
        ? 'Submit creator or business documents to start review.'
        : status === 'pending'
          ? 'Documents uploaded. Under review.'
          : status === 'approved'
            ? 'Approved. Verification badge is ready to appear on your profile.'
            : 'Rejected. Update your documents and try again.';
    this.verificationRequest = {
      ...this.verificationRequest,
      status,
      reason,
      submittedAt:
        status === 'notRequested'
          ? null
          : (this.verificationRequest.submittedAt ?? new Date().toISOString()),
    };
    return this.verificationRequest;
  }

  getReportCenter() {
    return this.reportCenter;
  }

  submitReport(reason: string) {
    this.reportCenter = {
      ...this.reportCenter,
      history: [{ reason, status: 'Submitted' }, ...this.reportCenter.history],
    };
    return this.reportCenter;
  }

  getDeepLinkHandler() {
    return this.deepLinkState;
  }

  resolveDeepLink(url: string) {
    const path = url
      .replace('optizenqor://', '/')
      .replace('https://optizenqor.app', '')
      .trim();
    const resolvedPath = path.startsWith('/') ? path : `/${path}`;
    this.deepLinkState = {
      ...this.deepLinkState,
      recentLinks: [url, ...this.deepLinkState.recentLinks].slice(0, 5),
    };
    return {
      url,
      path: resolvedPath,
      explanation: `Incoming link routed to: ${resolvedPath}`,
    };
  }

  getAppUpdateFlow() {
    return this.appUpdate;
  }

  startAppUpdate() {
    this.appUpdate = {
      ...this.appUpdate,
      isUpdating: false,
    };
    return {
      ...this.appUpdate,
      status: 'completed',
      message: 'App is up to date.',
    };
  }

  getOfflineSync() {
    return this.offlineSync;
  }

  retryOfflineSync() {
    this.offlineSync = {
      isOffline: false,
      queue: this.offlineSync.queue.map((action) => ({ ...action, pending: false })),
    };
    return this.offlineSync;
  }

  getLocalizationSupport() {
    return this.localizationSupport;
  }

  setLocale(localeCode: string) {
    const locale = this.localizationSupport.locales.find(
      (item) => item.localeCode === localeCode,
    );
    if (!locale) {
      throw new NotFoundException(`Locale ${localeCode} not found`);
    }
    this.localizationSupport = {
      ...this.localizationSupport,
      selected: localeCode,
    };
    return this.localizationSupport;
  }

  getMaintenanceMode() {
    return this.maintenanceMode;
  }

  retryMaintenance() {
    this.maintenanceMode = {
      ...this.maintenanceMode,
      isRetrying: false,
    };
    return {
      ...this.maintenanceMode,
      status: 'retried',
    };
  }

  getPollsAndSurveys() {
    return {
      activeEntries: this.activePolls,
      draftEntries: this.draftPolls,
      quickTemplates: this.pollTemplates,
    };
  }

  votePoll(id: string, optionIndex: number) {
    this.activePolls = this.activePolls.map((entry) => {
      if (entry.id !== id || optionIndex < 0 || optionIndex >= entry.votes.length) {
        return entry;
      }
      const votes = [...entry.votes];
      votes[optionIndex] += 1;
      return {
        ...entry,
        votes,
        responseCount: entry.responseCount + 1,
      };
    });
    const updated = this.activePolls.find((entry) => entry.id === id);
    if (!updated) {
      throw new NotFoundException(`Poll ${id} not found`);
    }
    return updated;
  }

  getLearningCourses() {
    return this.learningCourses;
  }

  getPersonalizationOnboarding() {
    return {
      interests: this.personalizationInterests,
      selectedCount: this.personalizationInterests.filter((item) => item.selected).length,
      canContinue: this.personalizationInterests.some((item) => item.selected),
    };
  }

  toggleInterest(name: string) {
    this.personalizationInterests = this.personalizationInterests.map((item) =>
      item.name === name ? { ...item, selected: !item.selected } : item,
    );
    return this.getPersonalizationOnboarding();
  }

  getShareRepostOptions() {
    return this.shareRepostOptions;
  }

  trackShareRepost(targetId: string, option: string) {
    return {
      success: true,
      targetId,
      option,
      trackedAt: new Date().toISOString(),
    };
  }

  getAccessibilitySupport() {
    return {
      options: this.accessibilitySupportOptions,
      previewState: {
        screenReaderHints: true,
        motionPreviewAvailable: true,
      },
    };
  }

  getExploreRecommendations() {
    return this.exploreRecommendations;
  }

  getLegalCompliance() {
    return this.legalCompliance;
  }

  updateLegalCompliance(
    patch: Partial<{
      termsAccepted: boolean;
      privacyAccepted: boolean;
      guidelinesAccepted: boolean;
    }>,
  ) {
    this.legalCompliance = {
      ...this.legalCompliance,
      ...patch,
    };
    return this.legalCompliance;
  }

  getBlockedMutedAccounts() {
    return {
      mutedAccounts: this.mutedAccounts,
      restrictedAccounts: this.restrictedAccounts,
    };
  }

  getPushNotificationPreferences() {
    return this.pushNotificationPreferences;
  }

  updatePushNotificationPreference(title: string, enabled: boolean) {
    const preference = this.pushNotificationPreferences.find((item) => item.title === title);
    if (!preference) {
      throw new NotFoundException(`Notification preference ${title} not found`);
    }
    preference.enabled = enabled;
    return preference;
  }

  getMediaViewerItems() {
    return this.mediaViewerItems;
  }

  getMediaViewerItem(id: string) {
    const item = this.mediaViewerItems.find((entry) => entry.id === id);
    if (!item) {
      throw new NotFoundException(`Media item ${id} not found`);
    }
    return item;
  }

  getMarketplaceWorkspace() {
    return this.marketplaceWorkspace;
  }

  createMarketplaceOrder(input: {
    productId: string;
    productTitle: string;
    amount: number;
    address: string;
    deliveryMethod: string;
    paymentMethod: string;
  }) {
    const order = {
      id: `ord-${this.marketplaceWorkspace.orders.length + 1}`,
      productId: input.productId,
      productTitle: input.productTitle,
      amount: input.amount,
      status: 'Pending',
      address: input.address,
      deliveryMethod: input.deliveryMethod,
      paymentMethod: input.paymentMethod,
      createdAt: new Date().toISOString(),
    };
    this.marketplaceWorkspace = {
      ...this.marketplaceWorkspace,
      orders: [order, ...this.marketplaceWorkspace.orders],
    };
    return order;
  }

  getSupportMail() {
    return this.supportMail;
  }
}
