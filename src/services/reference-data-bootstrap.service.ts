import { Injectable, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';

type SettingsSectionSeed = {
  key: string;
  title: string;
  description: string;
  sortOrder: number;
  items: Array<{
    key: string;
    title: string;
    subtitle?: string;
    routeName: string;
    sortOrder: number;
    defaultData?: Record<string, unknown>;
  }>;
};

const SETTINGS_SECTIONS: SettingsSectionSeed[] = [
  {
    key: 'account',
    title: 'Account',
    description: 'Identity, sessions, verification, and account access.',
    sortOrder: 10,
    items: [
      { key: 'account-settings', title: 'Account settings', subtitle: 'Profile, username, account type, and archive access', routeName: '/settings/account', sortOrder: 10 },
      { key: 'password-security', title: 'Password and security', subtitle: 'Password, login protection, and trusted devices', routeName: '/settings/password-security', sortOrder: 20 },
      { key: 'devices-sessions', title: 'Devices and sessions', subtitle: 'Review active devices and recent sign-ins', routeName: '/settings/devices-sessions', sortOrder: 30 },
      { key: 'verification-request', title: 'Verification request', subtitle: 'Submit or review profile verification status', routeName: '/verification-request', sortOrder: 40 },
      { key: 'account-switching', title: 'Account switching', subtitle: 'Move between linked identities', routeName: '/account-switching', sortOrder: 50 },
      { key: 'archive-center', title: 'Archive center', subtitle: 'Archived posts, stories, and saved history', routeName: '/settings/archive-center', sortOrder: 60 },
    ],
  },
  {
    key: 'privacy-safety',
    title: 'Privacy & Safety',
    description: 'Visibility, moderation, reports, and account safety.',
    sortOrder: 20,
    items: [
      { key: 'privacy', title: 'Privacy', subtitle: 'Visibility, tagging, and sensitive content', routeName: '/settings/privacy', sortOrder: 10 },
      { key: 'advanced-privacy-controls', title: 'Advanced privacy controls', subtitle: 'Mentions, tagging, discoverability, and visibility', routeName: '/advanced-privacy-controls', sortOrder: 20 },
      { key: 'blocked-muted-accounts', title: 'Blocked and muted accounts', subtitle: 'Manage blocked, muted, and restricted users', routeName: '/blocked-muted-accounts', sortOrder: 30 },
      { key: 'blocked-users', title: 'Blocked users quick list', subtitle: 'Jump straight into block management', routeName: '/settings/blocked-users', sortOrder: 40 },
      { key: 'safety-privacy', title: 'Safety and privacy', subtitle: 'Sensitive content, account health, and protections', routeName: '/safety-privacy', sortOrder: 50 },
      { key: 'report-center', title: 'Report center', subtitle: 'Track reports, strikes, and moderation outcomes', routeName: '/report-center', sortOrder: 60 },
      { key: 'help-safety', title: 'Help & safety', subtitle: 'Appeals, help flows, and platform support', routeName: '/settings/help-safety', sortOrder: 70 },
    ],
  },
  {
    key: 'messages-calls-notifications',
    title: 'Messages, Calls & Notifications',
    description: 'Tune alerts, messaging privacy, and call controls.',
    sortOrder: 30,
    items: [
      { key: 'notifications', title: 'Notifications', subtitle: 'Push, email, and in-app alerts', routeName: '/settings/notifications', sortOrder: 10 },
      { key: 'notification-categories', title: 'Notification categories', subtitle: 'Fine-tune post, comment, and mention alerts', routeName: '/push-notification-preferences', sortOrder: 20 },
      { key: 'messages-calls', title: 'Messages & calls', subtitle: 'Requests, read receipts, downloads, and calling', routeName: '/settings/messages-calls', sortOrder: 30 },
      { key: 'activity-sessions', title: 'Activity sessions', subtitle: 'Review session history and security events', routeName: '/activity-sessions', sortOrder: 40 },
    ],
  },
  {
    key: 'content-feed',
    title: 'Content & Feed',
    description: 'Recommendations, autoplay, drafts, and discovery controls.',
    sortOrder: 40,
    items: [
      { key: 'feed-content-preferences', title: 'Feed & content preferences', subtitle: 'Autoplay, topics, and recommendation reset', routeName: '/settings/feed-content-preferences', sortOrder: 10 },
      { key: 'explore-recommendations', title: 'Explore recommendations', subtitle: 'Reset recommendation signals and content preferences', routeName: '/explore-recommendation', sortOrder: 20 },
      { key: 'saved-collections', title: 'Saved collections', subtitle: 'Collections and bookmarks', routeName: '/saved-collections', sortOrder: 30 },
      { key: 'drafts-scheduling', title: 'Drafts & scheduling', subtitle: 'Manage unpublished and scheduled content', routeName: '/drafts-scheduling', sortOrder: 40 },
    ],
  },
  {
    key: 'professional',
    title: 'Professional',
    description: 'Monetization, audience tools, and role-aware controls.',
    sortOrder: 50,
    items: [
      { key: 'creator-professional-tools', title: 'Creator / professional tools', subtitle: 'Professional dashboards and branded content settings', routeName: '/settings/creator-tools', sortOrder: 10 },
      { key: 'creator-dashboard', title: 'Creator dashboard', subtitle: 'Insights, growth, and creator controls', routeName: '/creator-dashboard', sortOrder: 20 },
      { key: 'business-profile', title: 'Business profile', subtitle: 'Page controls, brand identity, and campaigns', routeName: '/business-profile', sortOrder: 30 },
      { key: 'monetization-payments', title: 'Monetization & payments', subtitle: 'Payout settings and subscriber badges', routeName: '/settings/monetization-payments', sortOrder: 40 },
      { key: 'wallet-payments', title: 'Wallet and payments', subtitle: 'Balance, payouts, and saved payment preferences', routeName: '/wallet-payments', sortOrder: 50 },
      { key: 'subscriptions', title: 'Subscriptions', subtitle: 'Manage plans, perks, and recurring benefits', routeName: '/subscriptions', sortOrder: 60 },
      { key: 'premium-membership', title: 'Premium membership', subtitle: 'Upgrade and premium features', routeName: '/premium', sortOrder: 70 },
    ],
  },
  {
    key: 'communities-discoverability',
    title: 'Communities & Discoverability',
    description: 'Groups, pages, communities, and public presence.',
    sortOrder: 60,
    items: [
      { key: 'communities-groups', title: 'Communities & groups', subtitle: 'Invites, mentions, and events', routeName: '/settings/communities-groups', sortOrder: 10 },
      { key: 'connected-apps', title: 'Connected apps', subtitle: 'Linked services and integrations', routeName: '/settings/connected-apps', sortOrder: 20 },
      { key: 'deep-link-handler', title: 'Deep link handler', subtitle: 'Inspect route entry behavior for links', routeName: '/deep-link-handler', sortOrder: 30 },
      { key: 'invite-referral', title: 'Invite and referral', subtitle: 'Referral rewards and shareable invite flows', routeName: '/invite-referral', sortOrder: 40 },
    ],
  },
  {
    key: 'language-accessibility-data',
    title: 'Language, Accessibility & Data',
    description: 'Locale, accessibility, privacy center, and device behavior.',
    sortOrder: 70,
    items: [
      { key: 'language-accessibility', title: 'Language and accessibility', subtitle: 'Language, captions, and assistive options', routeName: '/settings/language-accessibility', sortOrder: 10 },
      { key: 'language-region', title: 'Language & region', subtitle: 'Region-aware formatting and translation controls', routeName: '/settings/language-region', sortOrder: 20 },
      { key: 'accessibility', title: 'Accessibility', subtitle: 'Readable UI, motion, and assistive interaction settings', routeName: '/settings/accessibility', sortOrder: 30 },
      { key: 'localization-support', title: 'Localization support', subtitle: 'Locale-aware content and translation settings', routeName: '/localization-support', sortOrder: 40 },
      { key: 'accessibility-support', title: 'Accessibility support', subtitle: 'Additional accessibility preview and support tools', routeName: '/accessibility-support', sortOrder: 50 },
      { key: 'data-privacy-center', title: 'Data & privacy center', subtitle: 'Data export, cache, permissions, and privacy history', routeName: '/settings/data-privacy-center', sortOrder: 60 },
      { key: 'offline-sync', title: 'Offline sync', subtitle: 'Queued actions, retry state, and local sync health', routeName: '/offline-sync', sortOrder: 70 },
    ],
  },
  {
    key: 'about-app',
    title: 'About & App',
    description: 'Legal, updates, app support, and diagnostics.',
    sortOrder: 80,
    items: [
      { key: 'support-help', title: 'Support and help', subtitle: 'FAQ, help center, and safety support', routeName: '/support-help', sortOrder: 10 },
      { key: 'about', title: 'About', subtitle: 'Version, licenses, and release notes', routeName: '/settings/about', sortOrder: 20, defaultData: { appName: 'OptiZenqor Socity', apiVersion: '1.0.0' } },
      { key: 'app-update-flow', title: 'App update flow', subtitle: 'Preview upgrade prompts and update UX', routeName: '/app-update-flow', sortOrder: 30, defaultData: { latestVersion: '1.0.0', minVersion: '1.0.0' } },
      { key: 'legal-compliance', title: 'Legal and compliance', subtitle: 'Policies, consent, and platform compliance surfaces', routeName: '/legal-compliance', sortOrder: 40 },
      { key: 'maintenance-mode-preview', title: 'Maintenance mode preview', subtitle: 'Internal preview of maintenance UX', routeName: '/maintenance-mode', sortOrder: 50 },
    ],
  },
];

const ONBOARDING_SLIDES = [
  { code: 'welcome', title: 'Connect with your people', subtitle: 'Follow creators, friends, and communities that matter to you.', icon: 'groups_rounded', sortOrder: 10 },
  { code: 'create', title: 'Share moments fast', subtitle: 'Post stories, reels, updates, and messages from one place.', icon: 'auto_awesome_rounded', sortOrder: 20 },
  { code: 'grow', title: 'Build your profile', subtitle: 'Choose interests and shape the experience around your goals.', icon: 'trending_up_rounded', sortOrder: 30 },
];

const INTERESTS = [
  'Technology',
  'Travel',
  'Photography',
  'Business',
  'Design',
  'Fitness',
  'Food',
  'Music',
  'Education',
  'Gaming',
  'Fashion',
  'Sports',
];

const PERSONALIZATION_ITEMS = INTERESTS.map((title, index) => ({
  code: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  title,
  sortOrder: (index + 1) * 10,
}));

const LOCALES = [
  { localeCode: 'en', label: 'English', nativeLabel: 'English', regionCode: 'US', fallbackLocaleCode: null, isDefault: true, sortOrder: 10 },
  { localeCode: 'bn', label: 'Bengali', nativeLabel: 'বাংলা', regionCode: 'BD', fallbackLocaleCode: 'en', isDefault: false, sortOrder: 20 },
];

const ACCESSIBILITY_OPTIONS = [
  { id: 'acc_captions', optionKey: 'captions', title: 'Captions', description: 'Show captions where supported.', settingKey: 'accessibility.captions', defaultValue: true, sortOrder: 10 },
  { id: 'acc_high_contrast', optionKey: 'high_contrast', title: 'High contrast', description: 'Increase contrast for readability.', settingKey: 'accessibility.high_contrast', defaultValue: false, sortOrder: 20 },
  { id: 'acc_reduce_motion', optionKey: 'reduce_motion', title: 'Reduce motion', description: 'Limit animation and motion effects.', settingKey: 'accessibility.reduce_motion', defaultValue: false, sortOrder: 30 },
  { id: 'acc_screen_reader_hints', optionKey: 'screen_reader_hints', title: 'Screen reader hints', description: 'Provide extra accessibility labels and hints.', settingKey: 'accessibility.screen_reader_hints', defaultValue: true, sortOrder: 40 },
];

const LEGAL_DOCUMENTS = [
  { id: 'legal_terms_v1', documentKey: 'terms', title: 'Terms of Service', version: '2026.05.04', localeCode: 'en', summary: 'Platform terms and conditions.', body: { sections: [] }, isRequired: true },
  { id: 'legal_privacy_v1', documentKey: 'privacy', title: 'Privacy Policy', version: '2026.05.04', localeCode: 'en', summary: 'How user data is handled and protected.', body: { sections: [] }, isRequired: true },
  { id: 'legal_guidelines_v1', documentKey: 'guidelines', title: 'Community Guidelines', version: '2026.05.04', localeCode: 'en', summary: 'Behavior and content expectations on the platform.', body: { sections: [] }, isRequired: true },
];

@Injectable()
export class ReferenceDataBootstrapService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.ensureSettingsCatalog();
    await this.ensureOnboardingCatalog();
    await this.ensurePersonalizationCatalog();
    await this.ensureLocalizationCatalog();
    await this.ensureAccessibilityCatalog();
    await this.ensureLegalDocuments();
    await this.ensureSupportConfig();
    await this.ensureOperationalSettings();
  }

  private async ensureSettingsCatalog() {
    for (const section of SETTINGS_SECTIONS) {
      await this.prisma.settingsSectionCatalog.upsert({
        where: { key: section.key },
        create: {
          key: section.key,
          title: section.title,
          description: section.description,
          sortOrder: section.sortOrder,
          isActive: true,
          metadata: {} as Prisma.InputJsonValue,
        },
        update: {
          title: section.title,
          description: section.description,
          sortOrder: section.sortOrder,
          isActive: true,
          updatedAt: new Date(),
        },
      });

      for (const item of section.items) {
        await this.prisma.settingsItemCatalog.upsert({
          where: { key: item.key },
          create: {
            key: item.key,
            sectionKey: section.key,
            title: item.title,
            subtitle: item.subtitle ?? null,
            routeName: item.routeName,
            sortOrder: item.sortOrder,
            defaultData: (item.defaultData ?? {}) as Prisma.InputJsonValue,
            metadata: {} as Prisma.InputJsonValue,
            isActive: true,
          },
          update: {
            sectionKey: section.key,
            title: item.title,
            subtitle: item.subtitle ?? null,
            routeName: item.routeName,
            sortOrder: item.sortOrder,
            defaultData: (item.defaultData ?? {}) as Prisma.InputJsonValue,
            isActive: true,
            updatedAt: new Date(),
          },
        });
      }
    }
  }

  private async ensureOnboardingCatalog() {
    for (const slide of ONBOARDING_SLIDES) {
      await this.prisma.onboardingCatalogItem.upsert({
        where: { catalogType_code: { catalogType: 'slide', code: slide.code } },
        create: {
          id: `onboarding_${slide.code}`,
          catalogType: 'slide',
          code: slide.code,
          title: slide.title,
          subtitle: slide.subtitle,
          icon: slide.icon,
          sortOrder: slide.sortOrder,
          isActive: true,
          metadata: {} as Prisma.InputJsonValue,
        },
        update: {
          title: slide.title,
          subtitle: slide.subtitle,
          icon: slide.icon,
          sortOrder: slide.sortOrder,
          isActive: true,
          updatedAt: new Date(),
        },
      });
    }

    for (const [index, interest] of INTERESTS.entries()) {
      const code = interest.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      await this.prisma.onboardingCatalogItem.upsert({
        where: { catalogType_code: { catalogType: 'interest', code } },
        create: {
          id: `interest_${code}`,
          catalogType: 'interest',
          code,
          title: interest,
          subtitle: `Personalize your feed with ${interest.toLowerCase()} content.`,
          sortOrder: (index + 1) * 10,
          isActive: true,
          metadata: {} as Prisma.InputJsonValue,
        },
        update: {
          title: interest,
          subtitle: `Personalize your feed with ${interest.toLowerCase()} content.`,
          sortOrder: (index + 1) * 10,
          isActive: true,
          updatedAt: new Date(),
        },
      });
    }
  }

  private async ensurePersonalizationCatalog() {
    for (const item of PERSONALIZATION_ITEMS) {
      await this.prisma.personalizationCatalogItem.upsert({
        where: { code: item.code },
        create: {
          id: `personalization_${item.code}`,
          code: item.code,
          title: item.title,
          description: `Recommended content related to ${item.title.toLowerCase()}.`,
          groupKey: 'interests',
          sortOrder: item.sortOrder,
          isActive: true,
          metadata: {} as Prisma.InputJsonValue,
        },
        update: {
          title: item.title,
          description: `Recommended content related to ${item.title.toLowerCase()}.`,
          groupKey: 'interests',
          sortOrder: item.sortOrder,
          isActive: true,
          updatedAt: new Date(),
        },
      });
    }
  }

  private async ensureLocalizationCatalog() {
    for (const locale of LOCALES) {
      await this.prisma.localizationLocaleCatalog.upsert({
        where: { localeCode: locale.localeCode },
        create: {
          localeCode: locale.localeCode,
          label: locale.label,
          nativeLabel: locale.nativeLabel,
          regionCode: locale.regionCode,
          fallbackLocaleCode: locale.fallbackLocaleCode,
          isDefault: locale.isDefault,
          isActive: true,
          sortOrder: locale.sortOrder,
          metadata: {} as Prisma.InputJsonValue,
        },
        update: {
          label: locale.label,
          nativeLabel: locale.nativeLabel,
          regionCode: locale.regionCode,
          fallbackLocaleCode: locale.fallbackLocaleCode,
          isDefault: locale.isDefault,
          isActive: true,
          sortOrder: locale.sortOrder,
          updatedAt: new Date(),
        },
      });
    }
  }

  private async ensureAccessibilityCatalog() {
    for (const option of ACCESSIBILITY_OPTIONS) {
      await this.prisma.accessibilityOptionCatalog.upsert({
        where: { id: option.id },
        create: {
          id: option.id,
          optionKey: option.optionKey,
          title: option.title,
          description: option.description,
          settingKey: option.settingKey,
          valueType: 'boolean',
          defaultValue: option.defaultValue as Prisma.InputJsonValue,
          options: [] as Prisma.InputJsonValue,
          isActive: true,
          sortOrder: option.sortOrder,
          metadata: {} as Prisma.InputJsonValue,
        },
        update: {
          optionKey: option.optionKey,
          title: option.title,
          description: option.description,
          settingKey: option.settingKey,
          defaultValue: option.defaultValue as Prisma.InputJsonValue,
          isActive: true,
          sortOrder: option.sortOrder,
          updatedAt: new Date(),
        },
      });
    }
  }

  private async ensureLegalDocuments() {
    for (const document of LEGAL_DOCUMENTS) {
      await this.prisma.legalDocumentVersion.upsert({
        where: {
          documentKey_version_localeCode: {
            documentKey: document.documentKey,
            version: document.version,
            localeCode: document.localeCode,
          },
        },
        create: {
          id: document.id,
          documentKey: document.documentKey,
          title: document.title,
          version: document.version,
          localeCode: document.localeCode,
          summary: document.summary,
          body: document.body as Prisma.InputJsonValue,
          isActive: true,
          isRequired: document.isRequired,
          publishedAt: new Date('2026-05-04T00:00:00.000Z'),
          metadata: {} as Prisma.InputJsonValue,
        },
        update: {
          title: document.title,
          summary: document.summary,
          body: document.body as Prisma.InputJsonValue,
          isActive: true,
          isRequired: document.isRequired,
          publishedAt: new Date('2026-05-04T00:00:00.000Z'),
          updatedAt: new Date(),
        },
      });
    }
  }

  private async ensureSupportConfig() {
    const supportEntries: Array<{ key: string; title: string; value: Prisma.InputJsonValue; description: string }> = [
      {
        key: 'support.contact_email',
        title: 'Support contact email',
        value: process.env.SUPPORT_CONTACT_EMAIL?.trim() || 'support@optizenqor.app',
        description: 'Primary support contact address.',
      },
      {
        key: 'support.escalation_email',
        title: 'Support escalation email',
        value: process.env.SUPPORT_ESCALATION_EMAIL?.trim() || 'trust@optizenqor.app',
        description: 'Escalation mailbox for urgent trust and safety issues.',
      },
      {
        key: 'support.response_time',
        title: 'Support response time',
        value: process.env.SUPPORT_RESPONSE_TIME?.trim() || 'Usually within 24 hours',
        description: 'Expected response time shown in the app.',
      },
    ];

    for (const entry of supportEntries) {
      await this.prisma.supportConfigEntry.upsert({
        where: { key: entry.key },
        create: {
          key: entry.key,
          title: entry.title,
          value: entry.value,
          description: entry.description,
          isPublic: true,
        },
        update: {
          title: entry.title,
          value: entry.value,
          description: entry.description,
          isPublic: true,
          updatedAt: new Date(),
        },
      });
    }
  }

  private async ensureOperationalSettings() {
    const settings: Array<{ key: string; value: Prisma.InputJsonValue }> = [
      {
        key: 'notifications.push_categories',
        value: [
          { title: 'Likes', enabledByDefault: true },
          { title: 'Comments', enabledByDefault: true },
          { title: 'Mentions', enabledByDefault: true },
          { title: 'Messages', enabledByDefault: true },
          { title: 'Live alerts', enabledByDefault: false },
        ] as Prisma.InputJsonValue,
      },
      {
        key: 'growth.referral.milestones',
        value: [
          { count: 1, reward: 'Referral badge' },
          { count: 5, reward: 'Profile boost credit' },
          { count: 10, reward: 'Priority support review' },
        ] as Prisma.InputJsonValue,
      },
      { key: 'growth.referral.benefit', value: 'Invite friends and unlock platform rewards.' },
      { key: 'growth.referral.share_base_url', value: 'https://optizenqor.app/invite' },
      {
        key: 'app.deep_link_handler',
        value: {
          supportedPrefixes: ['optizenqor://', 'https://optizenqor.app'],
          recentLinks: [],
          allowUniversalLinks: true,
          openExternalLinksInApp: false,
        } as Prisma.InputJsonValue,
      },
      {
        key: 'app.share_repost',
        value: {
          options: [
            { title: 'Copy link' },
            { title: 'Share to story' },
            { title: 'Send in message' },
          ],
          recentActivity: [],
        } as Prisma.InputJsonValue,
      },
      {
        key: 'app.offline_sync_preview',
        value: {
          isOffline: false,
          queue: [],
          pendingCount: 0,
          lastSyncAt: null,
        } as Prisma.InputJsonValue,
      },
      {
        key: 'app.update_flow',
        value: {
          type: 'optional',
          message: null,
          isUpdating: false,
          latestVersion: '1.0.0',
          minVersion: '1.0.0',
        } as Prisma.InputJsonValue,
      },
      {
        key: 'app.maintenance_mode',
        value: {
          title: null,
          message: null,
          isActive: false,
          isRetrying: false,
        } as Prisma.InputJsonValue,
      },
      { key: 'locale.fallback_locale', value: 'en' },
      { key: 'locale.default', value: 'en' },
      {
        key: 'app.localization.locales',
        value: LOCALES.map((item) => ({ localeCode: item.localeCode, label: item.nativeLabel || item.label })) as Prisma.InputJsonValue,
      },
      {
        key: 'legal.documents',
        value: LEGAL_DOCUMENTS.map((item) => ({ key: item.documentKey, title: item.title, version: item.version })) as Prisma.InputJsonValue,
      },
      {
        key: 'app.accessibility.options',
        value: ACCESSIBILITY_OPTIONS.map((item) => ({
          title: item.title,
          key: item.settingKey,
          enabledByDefault: item.defaultValue,
        })) as Prisma.InputJsonValue,
      },
    ];

    for (const setting of settings) {
      await this.prisma.adminOperationalSetting.upsert({
        where: { key: setting.key },
        create: {
          key: setting.key,
          value: setting.value,
        },
        update: {
          value: setting.value,
          updatedAt: new Date(),
        },
      });
    }
  }
}
