import { Injectable, NotFoundException } from '@nestjs/common';

export interface SettingsItemRecord {
  key: string;
  title: string;
  subtitle: string;
  routeName: string;
  data: Record<string, unknown>;
}

export interface SettingsSectionRecord {
  key: string;
  title: string;
  description: string;
  items: SettingsItemRecord[];
  updatedAt: string;
}

@Injectable()
export class SettingsDataService {
  private readonly sections = new Map<string, SettingsSectionRecord>([
    [
      'account',
      {
        key: 'account',
        title: 'Account',
        description: 'Identity, sessions, verification, and account access.',
        items: [
          {
            key: 'account-settings',
            title: 'Account settings',
            subtitle: 'Profile, username, account type, and archive access',
            routeName: '/settings/account',
            data: { name: 'Maya Quinn', username: 'mayaquinn', accountType: 'creator' },
          },
          {
            key: 'password-security',
            title: 'Password and security',
            subtitle: 'Password, login protection, and trusted devices',
            routeName: '/settings/password-security',
            data: { twoFactorEnabled: true, loginAlerts: true, trustedDevices: 2 },
          },
          {
            key: 'devices-sessions',
            title: 'Devices and sessions',
            subtitle: 'Review active devices and recent sign-ins',
            routeName: '/settings/devices-sessions',
            data: { activeSessions: 2, suspiciousSignins: 1, revokeOthersEnabled: true },
          },
          {
            key: 'verification-request',
            title: 'Verification request',
            subtitle: 'Submit or review profile verification status',
            routeName: '/verification-request',
            data: { status: 'pending', submittedAt: '2026-04-19T09:10:00.000Z', requiredDocs: 2 },
          },
          {
            key: 'account-switching',
            title: 'Account switching',
            subtitle: 'Move between linked identities',
            routeName: '/account-switching',
            data: { linkedAccounts: 3, defaultAccount: 'mayaquinn', fastSwitchEnabled: true },
          },
          {
            key: 'archive-center',
            title: 'Archive center',
            subtitle: 'Archived posts, stories, and saved history',
            routeName: '/settings/archive-center',
            data: { archivedPosts: 12, archivedStories: 41, autoArchiveStories: true },
          },
        ],
        updatedAt: '2026-04-20T00:00:00.000Z',
      },
    ],
    [
      'privacy-safety',
      {
        key: 'privacy-safety',
        title: 'Privacy & Safety',
        description: 'Visibility, moderation, reports, and account safety.',
        items: [
          {
            key: 'privacy',
            title: 'Privacy',
            subtitle: 'Visibility, tagging, and sensitive content',
            routeName: '/settings/privacy',
            data: {
              profilePrivate: false,
              activityStatus: true,
              allowTagging: true,
              allowMentions: true,
              hideSensitive: true,
              hideLikes: false,
            },
          },
          {
            key: 'advanced-privacy-controls',
            title: 'Advanced privacy controls',
            subtitle: 'Mentions, tagging, discoverability, and visibility',
            routeName: '/advanced-privacy-controls',
            data: { adPersonalization: false, searchableByEmail: false, searchableByPhone: false },
          },
          {
            key: 'blocked-muted-accounts',
            title: 'Blocked and muted accounts',
            subtitle: 'Manage blocked, muted, and restricted users',
            routeName: '/blocked-muted-accounts',
            data: { blockedCount: 1, mutedCount: 2, restrictedCount: 1 },
          },
          {
            key: 'blocked-users',
            title: 'Blocked users quick list',
            subtitle: 'Jump straight into block management',
            routeName: '/settings/blocked-users',
            data: { users: ['@muted.profile'] },
          },
          {
            key: 'safety-privacy',
            title: 'Safety and privacy',
            subtitle: 'Sensitive content, account health, and protections',
            routeName: '/safety-privacy',
            data: { autoHideOffensiveComments: true, restrictUnknownDMs: true, accountHealth: 'good' },
          },
          {
            key: 'report-center',
            title: 'Report center',
            subtitle: 'Track reports, strikes, and moderation outcomes',
            routeName: '/report-center',
            data: { openReports: 2, resolvedReports: 12, moderationStrikes: 0 },
          },
          {
            key: 'help-safety',
            title: 'Help & safety',
            subtitle: 'Appeals, help flows, and platform support',
            routeName: '/settings/help-safety',
            data: { faqEnabled: true, appealsEnabled: true, supportChatEnabled: true },
          },
        ],
        updatedAt: '2026-04-20T00:00:00.000Z',
      },
    ],
    [
      'messages-calls-notifications',
      {
        key: 'messages-calls-notifications',
        title: 'Messages, Calls & Notifications',
        description: 'Tune alerts, messaging privacy, and call controls.',
        items: [
          {
            key: 'notifications',
            title: 'Notifications',
            subtitle: 'Push, email, and in-app alerts',
            routeName: '/settings/notifications',
            data: { pushEnabled: true, emailEnabled: true, inAppSounds: true, marketing: false },
          },
          {
            key: 'notification-categories',
            title: 'Notification categories',
            subtitle: 'Fine-tune post, comment, and mention alerts',
            routeName: '/push-notification-preferences',
            data: { postAlerts: true, commentAlerts: true, mentionAlerts: true, liveAlerts: false },
          },
          {
            key: 'messages-calls',
            title: 'Messages & calls',
            subtitle: 'Requests, read receipts, downloads, and calling',
            routeName: '/settings/messages-calls',
            data: { messageRequests: true, readReceipts: true, allowCalls: true, autoDownloadMedia: false },
          },
          {
            key: 'activity-sessions',
            title: 'Activity sessions',
            subtitle: 'Review session history and security events',
            routeName: '/activity-sessions',
            data: { lastActive: '2m ago', suspiciousEvents: 1, retainedDays: 30 },
          },
        ],
        updatedAt: '2026-04-20T00:00:00.000Z',
      },
    ],
    [
      'content-feed',
      {
        key: 'content-feed',
        title: 'Content & Feed',
        description: 'Recommendations, autoplay, drafts, and discovery controls.',
        items: [
          {
            key: 'feed-content-preferences',
            title: 'Feed & content preferences',
            subtitle: 'Autoplay, topics, and recommendation reset',
            routeName: '/settings/feed-content-preferences',
            data: { autoplay: true, dataSaver: false, hideTopics: [], resetRecommendations: false },
          },
          {
            key: 'explore-recommendations',
            title: 'Explore recommendations',
            subtitle: 'Reset recommendation signals and content preferences',
            routeName: '/explore-recommendation',
            data: { recommendationScore: 0.81, resetAvailable: true },
          },
          {
            key: 'saved-collections',
            title: 'Saved collections',
            subtitle: 'Collections and bookmarks',
            routeName: '/saved-collections',
            data: { collectionCount: 2, bookmarkCount: 3 },
          },
          {
            key: 'drafts-scheduling',
            title: 'Drafts & scheduling',
            subtitle: 'Manage unpublished and scheduled content',
            routeName: '/drafts-scheduling',
            data: { drafts: 2, scheduled: 1, uploadQueue: 1 },
          },
        ],
        updatedAt: '2026-04-20T00:00:00.000Z',
      },
    ],
    [
      'professional',
      {
        key: 'professional',
        title: 'Professional',
        description: 'Monetization, audience tools, and role-aware controls.',
        items: [
          {
            key: 'creator-professional-tools',
            title: 'Creator / professional tools',
            subtitle: 'Professional dashboards and branded content settings',
            routeName: '/settings/creator-tools',
            data: { professionalDashboard: true, brandedContent: true, tips: true },
          },
          {
            key: 'creator-dashboard',
            title: 'Creator dashboard',
            subtitle: 'Insights, growth, and creator controls',
            routeName: '/creator-dashboard',
            data: { period: '7d', reach: '230K', storyReplies: '12.4K' },
          },
          {
            key: 'business-profile',
            title: 'Business profile',
            subtitle: 'Page controls, brand identity, and campaigns',
            routeName: '/business-profile',
            data: { pageName: 'Nexa Studio', campaignsEnabled: true, adCredit: 940 },
          },
          {
            key: 'monetization-payments',
            title: 'Monetization & payments',
            subtitle: 'Payout settings and subscriber badges',
            routeName: '/settings/monetization-payments',
            data: { payoutsEnabled: true, payoutOnHold: false, showSubscriberBadges: true },
          },
          {
            key: 'wallet-payments',
            title: 'Wallet and payments',
            subtitle: 'Balance, payouts, and saved payment preferences',
            routeName: '/wallet-payments',
            data: { available: 2410, pending: 1280, defaultPayoutMethod: 'bank' },
          },
          {
            key: 'subscriptions',
            title: 'Subscriptions',
            subtitle: 'Manage plans, perks, and recurring benefits',
            routeName: '/subscriptions',
            data: { plan: 'Creator Pro', autoRenew: true, renewalDate: '2026-05-01' },
          },
          {
            key: 'premium-membership',
            title: 'Premium membership',
            subtitle: 'Upgrade and premium features',
            routeName: '/premium',
            data: { currentTier: 'Creator Pro', upgradeAvailable: true },
          },
        ],
        updatedAt: '2026-04-20T00:00:00.000Z',
      },
    ],
    [
      'communities-discoverability',
      {
        key: 'communities-discoverability',
        title: 'Communities & Discoverability',
        description: 'Groups, pages, communities, and public presence.',
        items: [
          {
            key: 'communities-groups',
            title: 'Communities & groups',
            subtitle: 'Invites, mentions, and events',
            routeName: '/settings/communities-groups',
            data: { invitesEnabled: true, groupMentionsEnabled: true, eventsRemindersEnabled: true },
          },
          {
            key: 'connected-apps',
            title: 'Connected apps',
            subtitle: 'Linked services and integrations',
            routeName: '/settings/connected-apps',
            data: { connectedCount: 2, apps: ['Google', 'Figma'] },
          },
          {
            key: 'deep-link-handler',
            title: 'Deep link handler',
            subtitle: 'Inspect route entry behavior for links',
            routeName: '/deep-link-handler',
            data: { allowUniversalLinks: true, openExternalLinksInApp: false },
          },
          {
            key: 'invite-referral',
            title: 'Invite and referral',
            subtitle: 'Referral rewards and shareable invite flows',
            routeName: '/invite-referral',
            data: { inviteCode: 'OPTI-MAYA-42', currentInvites: 3, totalMilestone: 10 },
          },
        ],
        updatedAt: '2026-04-20T00:00:00.000Z',
      },
    ],
    [
      'language-accessibility-data',
      {
        key: 'language-accessibility-data',
        title: 'Language, Accessibility & Data',
        description: 'Locale, accessibility, privacy center, and device behavior.',
        items: [
          {
            key: 'language-accessibility',
            title: 'Language and accessibility',
            subtitle: 'Language, captions, and assistive options',
            routeName: '/settings/language-accessibility',
            data: { language: 'en', captions: true, textSize: 1.1 },
          },
          {
            key: 'language-region',
            title: 'Language & region',
            subtitle: 'Region-aware formatting and translation controls',
            routeName: '/settings/language-region',
            data: { language: 'en', region: 'BD', timezone: 'Asia/Dhaka' },
          },
          {
            key: 'accessibility',
            title: 'Accessibility',
            subtitle: 'Readable UI, motion, and assistive interaction settings',
            routeName: '/settings/accessibility',
            data: { highContrast: false, reduceMotion: false, captions: true, textSize: 1.1 },
          },
          {
            key: 'localization-support',
            title: 'Localization support',
            subtitle: 'Locale-aware content and translation settings',
            routeName: '/localization-support',
            data: { supportedLocales: ['en', 'bn'], fallbackLocale: 'en' },
          },
          {
            key: 'accessibility-support',
            title: 'Accessibility support',
            subtitle: 'Additional accessibility preview and support tools',
            routeName: '/accessibility-support',
            data: { screenReaderHints: true, motionPreviewAvailable: true },
          },
          {
            key: 'data-privacy-center',
            title: 'Data & privacy center',
            subtitle: 'Data export, cache, permissions, and privacy history',
            routeName: '/settings/data-privacy-center',
            data: { dataExportRequested: false, adPersonalization: false, dataCollection: true },
          },
          {
            key: 'offline-sync',
            title: 'Offline sync',
            subtitle: 'Queued actions, retry state, and local sync health',
            routeName: '/offline-sync',
            data: { queuedActions: 0, lastSync: '2026-04-20T11:30:00.000Z', syncHealth: 'healthy' },
          },
        ],
        updatedAt: '2026-04-20T00:00:00.000Z',
      },
    ],
    [
      'about-app',
      {
        key: 'about-app',
        title: 'About & App',
        description: 'Legal, updates, app support, and diagnostics.',
        items: [
          {
            key: 'support-help',
            title: 'Support and help',
            subtitle: 'FAQ, help center, and safety support',
            routeName: '/support-help',
            data: { faqCount: 2, supportTicketCount: 2 },
          },
          {
            key: 'about',
            title: 'About',
            subtitle: 'Version, licenses, and release notes',
            routeName: '/settings/about',
            data: { appName: 'OptiZenqor Socity', version: '2.4.1', apiVersion: '1.0.0' },
          },
          {
            key: 'app-update-flow',
            title: 'App update flow',
            subtitle: 'Preview upgrade prompts and update UX',
            routeName: '/app-update-flow',
            data: { forceUpdate: false, minVersion: '1.0.0', latestVersion: '1.0.0' },
          },
          {
            key: 'legal-compliance',
            title: 'Legal and compliance',
            subtitle: 'Policies, consent, and platform compliance surfaces',
            routeName: '/legal-compliance',
            data: { termsAccepted: true, privacyAccepted: true, guidelinesAccepted: true },
          },
          {
            key: 'maintenance-mode-preview',
            title: 'Maintenance mode preview',
            subtitle: 'Internal preview of maintenance UX',
            routeName: '/maintenance-mode',
            data: { maintenanceMode: false, previewEnabled: true },
          },
        ],
        updatedAt: '2026-04-20T00:00:00.000Z',
      },
    ],
  ]);

  private settingsState: Record<string, unknown> = {
    'privacy.profile_private': false,
    'privacy.activity_status': true,
    'privacy.allow_tagging': true,
    'privacy.allow_mentions': true,
    'privacy.allow_reposts': true,
    'privacy.allow_comments': true,
    'privacy.hide_sensitive': true,
    'privacy.hide_likes': false,
    'notifications.push_enabled': true,
    'notifications.email_enabled': true,
    'notifications.in_app_sounds': true,
    'notifications.marketing': false,
    'messages.message_requests': true,
    'messages.read_receipts': true,
    'messages.allow_calls': true,
    'messages.auto_download': true,
    'security.two_factor': true,
    'feed.autoplay': true,
    'feed.data_saver': false,
    'feed.hide_topics': false,
    'feed.reset_recommendations': false,
    'creator.professional_dashboard': true,
    'creator.branded_content': true,
    'creator.tips': true,
    'creator.subscriptions': true,
    'monetization.payouts_enabled': true,
    'monetization.payout_on_hold': false,
    'monetization.subscriber_badges': true,
    'communities.invites': true,
    'communities.group_mentions': true,
    'communities.events_reminders': true,
    'data.export_requested': false,
    'data.ad_personalization': false,
    'data.data_collection': true,
    'accessibility.captions': true,
    'accessibility.high_contrast': false,
    'accessibility.reduce_motion': false,
    'accessibility.text_size': 'Default',
    'locale.language': 'English',
    'locale.region': 'Bangladesh',
    'connected.apps': {
      'Figma Social Kit': true,
      'Creator Studio': false,
      'OptiZenqor Shop': true,
      'Link Hub': false,
    },
    'security.biometric_lock': true,
    'security.login_alerts': true,
    'messages.chat_preview': true,
    'feed.theme_mode': 'system',
    'data.offline_sync_queue': 0,
    'data.last_sync_at': '2026-04-20T11:30:00.000Z',
  };

  getSections() {
    return [...this.sections.values()].map((section) => this.decorateSection(section));
  }

  getSection(sectionKey: string) {
    const section = this.sections.get(sectionKey);
    if (!section) {
      throw new NotFoundException(`Settings section ${sectionKey} not found`);
    }
    return this.decorateSection(section);
  }

  updateSection(sectionKey: string, patch: Record<string, unknown>) {
    const section = this.getSection(sectionKey);
    for (const item of section.items) {
      item.data = {
        ...item.data,
        ...patch,
      };
    }
    section.updatedAt = new Date().toISOString();
    this.sections.set(section.key, section);
    return this.decorateSection(section);
  }

  getItems() {
    return [...this.sections.values()].flatMap((section) =>
      section.items.map((item) => ({
        ...this.decorateItem(item),
        sectionKey: section.key,
        sectionTitle: section.title,
      })),
    );
  }

  getItem(itemKey: string) {
    for (const section of this.sections.values()) {
      const item = section.items.find((value) => value.key === itemKey);
      if (item) {
        return {
          ...this.decorateItem(item),
          sectionKey: section.key,
          sectionTitle: section.title,
        };
      }
    }
    throw new NotFoundException(`Settings item ${itemKey} not found`);
  }

  updateItem(itemKey: string, patch: Record<string, unknown>) {
    for (const section of this.sections.values()) {
      const item = section.items.find((value) => value.key === itemKey);
      if (!item) {
        continue;
      }
      item.data = {
        ...item.data,
        ...patch,
      };
      section.updatedAt = new Date().toISOString();
      this.sections.set(section.key, section);
      return {
        ...this.decorateItem(item),
        sectionKey: section.key,
        sectionTitle: section.title,
      };
    }
    throw new NotFoundException(`Settings item ${itemKey} not found`);
  }

  getState() {
    return this.settingsState;
  }

  updateState(patch: Record<string, unknown>) {
    this.settingsState = {
      ...this.settingsState,
      ...patch,
    };
    return this.settingsState;
  }

  private decorateSection(section: SettingsSectionRecord) {
    return {
      ...section,
      items: section.items.map((item) => this.decorateItem(item)),
    };
  }

  private decorateItem(item: SettingsItemRecord) {
    return {
      ...item,
      data: {
        ...item.data,
        state: this.resolveItemState(item.key),
        actions: this.resolveItemActions(item.key),
        linkedApis: this.resolveItemApis(item.key),
      },
    };
  }

  private resolveItemState(itemKey: string) {
    switch (itemKey) {
      case 'account-settings':
        return {
          profile: {
            name: 'Alex Rivera',
            username: 'arivera',
            bio: 'Creator-first product builder.',
            pronouns: 'he/him',
            website: 'https://optizenqor.app',
            email: 'alex.rivera@example.com',
            phone: '+1 (555) 123-4567',
            birthday: '1995-08-15',
            profileType: 'creator',
            profileImage: 'https://i.pravatar.cc/150?u=alexrivera',
          },
        };
      case 'password-security':
        return {
          twoFactor: this.settingsState['security.two_factor'],
          biometricLock: this.settingsState['security.biometric_lock'],
          loginAlerts: this.settingsState['security.login_alerts'],
          trustedDevices: ['Pixel Emulator', 'MacBook Pro', 'iPhone 15 Pro'],
        };
      case 'devices-sessions':
        return {
          currentDevice: 'Pixel Emulator',
          recentSessions: ['Pixel Emulator', 'MacBook Pro', 'iPhone 15 Pro'],
          revokeSessionEnabled: true,
          storageUsage: '2.4 GB',
          cacheCleanupAvailable: true,
          downloadQuality: 'High',
          uploadQuality: 'High',
        };
      case 'privacy':
        return {
          profileVisibility: this.settingsState['privacy.profile_private'],
          lastSeen: this.settingsState['privacy.activity_status'],
          readReceipts: this.settingsState['messages.read_receipts'],
          tagPermissions: this.settingsState['privacy.allow_tagging'],
          mentionPermissions: this.settingsState['privacy.allow_mentions'],
          commentPermissions: this.settingsState['privacy.allow_comments'],
          repostPermissions: this.settingsState['privacy.allow_reposts'],
          sensitiveContent: this.settingsState['privacy.hide_sensitive'],
          discoverability: {
            byEmail: false,
            byPhone: false,
          },
        };
      case 'advanced-privacy-controls':
        return {
          controls: [
            { title: 'Private account', value: false },
            { title: 'Allow mentions', value: true },
            { title: 'Allow comments from everyone', value: true },
            { title: 'Close friends stories only', value: false },
            { title: 'Hidden words filter', value: true },
            { title: 'Restrict interaction settings', value: false },
            { title: 'Sensitive content filter', value: true },
            { title: 'Anti-spam placeholder', value: true },
            { title: 'Child/teen safety placeholder', value: true },
            { title: 'Parental control placeholder', value: false },
            { title: 'Data saver media mode', value: false },
            { title: 'Auto-play control settings', value: true },
            { title: 'Reduced motion toggle', value: false },
            { title: 'High contrast mode placeholder', value: false },
          ],
        };
      case 'notifications':
        return {
          pushEnabled: this.settingsState['notifications.push_enabled'],
          emailEnabled: this.settingsState['notifications.email_enabled'],
          inAppSounds: this.settingsState['notifications.in_app_sounds'],
          marketing: this.settingsState['notifications.marketing'],
        };
      case 'notification-categories':
        return {
          categories: [
            { title: 'Likes', enabled: true },
            { title: 'Comments', enabled: true },
            { title: 'Messages', enabled: true },
            { title: 'Live alerts', enabled: false },
          ],
        };
      case 'messages-calls':
        return {
          messageRequests: this.settingsState['messages.message_requests'],
          readReceipts: this.settingsState['messages.read_receipts'],
          allowCalls: this.settingsState['messages.allow_calls'],
          autoDownloadMedia: this.settingsState['messages.auto_download'],
          chatPreview: this.settingsState['messages.chat_preview'],
        };
      case 'feed-content-preferences':
        return {
          autoplay: this.settingsState['feed.autoplay'],
          dataSaver: this.settingsState['feed.data_saver'],
          hideTopics: this.settingsState['feed.hide_topics'],
          resetRecommendations: this.settingsState['feed.reset_recommendations'],
          themeMode: this.settingsState['feed.theme_mode'],
        };
      case 'creator-professional-tools':
        return {
          professionalDashboard: this.settingsState['creator.professional_dashboard'],
          brandedContent: this.settingsState['creator.branded_content'],
          tips: this.settingsState['creator.tips'],
          subscriptions: this.settingsState['creator.subscriptions'],
        };
      case 'monetization-payments':
        return {
          payoutsEnabled: this.settingsState['monetization.payouts_enabled'],
          payoutOnHold: this.settingsState['monetization.payout_on_hold'],
          subscriberBadges: this.settingsState['monetization.subscriber_badges'],
        };
      case 'communities-groups':
        return {
          communityInvites: this.settingsState['communities.invites'],
          groupMentions: this.settingsState['communities.group_mentions'],
          eventsReminders: this.settingsState['communities.events_reminders'],
        };
      case 'language-region':
        return {
          language: this.settingsState['locale.language'],
          region: this.settingsState['locale.region'],
        };
      case 'accessibility':
        return {
          captions: this.settingsState['accessibility.captions'],
          highContrast: this.settingsState['accessibility.high_contrast'],
          reduceMotion: this.settingsState['accessibility.reduce_motion'],
          textSize: this.settingsState['accessibility.text_size'],
        };
      case 'connected-apps':
        return {
          apps: this.settingsState['connected.apps'],
        };
      case 'data-privacy-center':
        return {
          exportRequested: this.settingsState['data.export_requested'],
          adPersonalization: this.settingsState['data.ad_personalization'],
          dataCollection: this.settingsState['data.data_collection'],
          offlineSyncQueue: this.settingsState['data.offline_sync_queue'],
          lastSyncAt: this.settingsState['data.last_sync_at'],
        };
      default:
        return null;
    }
  }

  private resolveItemActions(itemKey: string) {
    switch (itemKey) {
      case 'account-settings':
        return ['edit', 'save', 'change_username', 'switch_account_type', 'deactivate_account', 'delete_account'];
      case 'password-security':
        return ['change_password', 'enable_2fa', 'enable_biometrics', 'run_security_checkup'];
      case 'devices-sessions':
        return ['logout_this_device', 'logout_other_devices', 'view_device'];
      case 'privacy':
        return ['manage_hidden_words', 'reset_privacy_defaults'];
      case 'notifications':
        return ['preview_notification'];
      case 'notification-categories':
        return ['reset_categories'];
      case 'data-privacy-center':
        return ['export_data', 'clear_cache', 'retry_sync'];
      default:
        return [];
    }
  }

  private resolveItemApis(itemKey: string) {
    switch (itemKey) {
      case 'blocked-users':
      case 'blocked-muted-accounts':
        return ['/block', '/block/:targetId'];
      case 'saved-collections':
        return ['/saved-collections', '/bookmarks'];
      case 'drafts-scheduling':
        return ['/drafts', '/scheduling', '/upload-manager'];
      case 'wallet-payments':
        return ['/wallet', '/monetization/wallet'];
      case 'subscriptions':
      case 'premium-membership':
        return ['/subscriptions', '/premium-plans'];
      case 'communities-groups':
        return ['/communities', '/groups', '/events'];
      case 'support-help':
      case 'help-safety':
        return ['/support/faqs', '/support/tickets'];
      default:
        return [];
    }
  }
}
