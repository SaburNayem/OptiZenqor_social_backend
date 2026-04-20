import { Injectable, NotFoundException } from '@nestjs/common';

export interface SettingsSectionRecord {
  key: string;
  title: string;
  description: string;
  data: Record<string, unknown>;
  updatedAt: string;
}

@Injectable()
export class SettingsDataService {
  private readonly sections = new Map<string, SettingsSectionRecord>([
    [
      'account-settings',
      {
        key: 'account-settings',
        title: 'Account Settings',
        description: 'Profile, username, email, and account basics.',
        data: { profileVisibility: 'public', usernameEditable: true, emailVerified: true },
        updatedAt: '2026-04-20T00:00:00.000Z',
      },
    ],
    [
      'password-security',
      {
        key: 'password-security',
        title: 'Password and Security',
        description: 'Password, 2FA, login alerts, and security methods.',
        data: { twoFactorEnabled: true, loginAlerts: true, passkeyEnabled: false },
        updatedAt: '2026-04-20T00:00:00.000Z',
      },
    ],
    [
      'privacy',
      {
        key: 'privacy',
        title: 'Privacy',
        description: 'Audience and profile privacy controls.',
        data: { profileVisibility: 'followers', searchableByEmail: false, searchableByPhone: false },
        updatedAt: '2026-04-20T00:00:00.000Z',
      },
    ],
    [
      'advanced-privacy-control',
      {
        key: 'advanced-privacy-control',
        title: 'Advanced Privacy Control',
        description: 'Fine-grained privacy control options.',
        data: { faceRecognition: false, adPersonalization: false, crossAppTracking: false },
        updatedAt: '2026-04-20T00:00:00.000Z',
      },
    ],
    [
      'safety-privacy',
      {
        key: 'safety-privacy',
        title: 'Safety and Privacy',
        description: 'Moderation and protection defaults.',
        data: { restrictUnknownDMs: true, autoHideOffensiveComments: true, filteredRequests: true },
        updatedAt: '2026-04-20T00:00:00.000Z',
      },
    ],
    [
      'report-center',
      {
        key: 'report-center',
        title: 'Report Center',
        description: 'User reports and case status.',
        data: { openReports: 2, resolvedReports: 12, lastReview: '2026-04-19T20:15:00.000Z' },
        updatedAt: '2026-04-20T00:00:00.000Z',
      },
    ],
    [
      'help-safety',
      {
        key: 'help-safety',
        title: 'Help and Safety',
        description: 'Support entry points and safety help docs.',
        data: { faqEnabled: true, contactSupportEnabled: true, emergencyResourcesEnabled: true },
        updatedAt: '2026-04-20T00:00:00.000Z',
      },
    ],
    [
      'community-group',
      {
        key: 'community-group',
        title: 'Community Group',
        description: 'Group-specific controls and discovery.',
        data: { groupInvitesAllowed: true, joinApprovalRequired: false, postApprovalRequired: false },
        updatedAt: '2026-04-20T00:00:00.000Z',
      },
    ],
    [
      'connected-apps',
      {
        key: 'connected-apps',
        title: 'Connected Apps',
        description: 'Third-party app connections and permissions.',
        data: { connectedCount: 2, apps: ['Google', 'Figma'], revokeAllEnabled: true },
        updatedAt: '2026-04-20T00:00:00.000Z',
      },
    ],
    [
      'deep-link-handler',
      {
        key: 'deep-link-handler',
        title: 'Deep Link Handler',
        description: 'Routing and deep link behavior preferences.',
        data: { allowUniversalLinks: true, openExternalLinksInApp: false },
        updatedAt: '2026-04-20T00:00:00.000Z',
      },
    ],
    [
      'notification',
      {
        key: 'notification',
        title: 'Notification',
        description: 'Push, email, and in-app notification settings.',
        data: { pushEnabled: true, emailEnabled: true, quietHours: { from: '23:00', to: '07:00' } },
        updatedAt: '2026-04-20T00:00:00.000Z',
      },
    ],
    [
      'message-call',
      {
        key: 'message-call',
        title: 'Message and Call',
        description: 'Messaging and call preferences.',
        data: { allowMessageRequests: true, allowCallsFrom: 'followers', readReceipts: true },
        updatedAt: '2026-04-20T00:00:00.000Z',
      },
    ],
    [
      'notification-categories',
      {
        key: 'notification-categories',
        title: 'Notification Categories',
        description: 'Category-level notification toggles.',
        data: { social: true, commerce: true, security: true, product: false },
        updatedAt: '2026-04-20T00:00:00.000Z',
      },
    ],
    [
      'accessibility',
      {
        key: 'accessibility',
        title: 'Accessibility',
        description: 'Accessibility options and assistive controls.',
        data: { textScaling: 1.1, highContrastMode: false, reduceMotion: false, captionsEnabled: true },
        updatedAt: '2026-04-20T00:00:00.000Z',
      },
    ],
    [
      'feed-content-preference',
      {
        key: 'feed-content-preference',
        title: 'Feed Content Preference',
        description: 'Feed relevance and personalization controls.',
        data: { showSuggestedPosts: true, showSensitiveContent: false, prioritizeFollowing: true },
        updatedAt: '2026-04-20T00:00:00.000Z',
      },
    ],
    [
      'professional-creator',
      {
        key: 'professional-creator',
        title: 'Professional Creator',
        description: 'Creator profile and monetization-level options.',
        data: { creatorMode: true, brandedContentTools: true, creatorInsights: true },
        updatedAt: '2026-04-20T00:00:00.000Z',
      },
    ],
    [
      'creator-dashboard',
      {
        key: 'creator-dashboard',
        title: 'Creator Dashboard',
        description: 'Creator dashboard display preferences.',
        data: { defaultRange: '7d', showRevenueCards: true, showAudienceCards: true },
        updatedAt: '2026-04-20T00:00:00.000Z',
      },
    ],
    [
      'wallet-payment',
      {
        key: 'wallet-payment',
        title: 'Wallet and Payment',
        description: 'Wallet channels and payment methods.',
        data: { defaultPayoutMethod: 'bank', autoWithdraw: false, savedMethods: 2 },
        updatedAt: '2026-04-20T00:00:00.000Z',
      },
    ],
    [
      'subscription',
      {
        key: 'subscription',
        title: 'Subscription',
        description: 'Current plan and renewal controls.',
        data: { plan: 'Creator Pro', autoRenew: true, renewalDate: '2026-05-01' },
        updatedAt: '2026-04-20T00:00:00.000Z',
      },
    ],
    [
      'device-session',
      {
        key: 'device-session',
        title: 'Device and Session',
        description: 'Device trust and active sessions.',
        data: { activeSessions: 2, trustedDevices: 2, revokeOtherSessionsEnabled: true },
        updatedAt: '2026-04-20T00:00:00.000Z',
      },
    ],
    [
      'verification-request',
      {
        key: 'verification-request',
        title: 'Verification Request',
        description: 'Identity and profile verification workflow.',
        data: { status: 'pending', submittedAt: '2026-04-19T09:10:00.000Z', requiredDocs: 2 },
        updatedAt: '2026-04-20T00:00:00.000Z',
      },
    ],
    [
      'account-switching',
      {
        key: 'account-switching',
        title: 'Account Switching',
        description: 'Linked accounts and switch behavior.',
        data: { linkedAccounts: 3, defaultAccount: 'mayaquinn', fastSwitchEnabled: true },
        updatedAt: '2026-04-20T00:00:00.000Z',
      },
    ],
    [
      'archive-center',
      {
        key: 'archive-center',
        title: 'Archive Center',
        description: 'Archived stories/posts and controls.',
        data: { archivedStories: 41, archivedPosts: 12, autoArchiveStories: true },
        updatedAt: '2026-04-20T00:00:00.000Z',
      },
    ],
    [
      'activity-session',
      {
        key: 'activity-session',
        title: 'Activity Session',
        description: 'Recent account activity and sign-ins.',
        data: { lastActive: '2m ago', suspiciousLogins: 1, loginHistoryDays: 30 },
        updatedAt: '2026-04-20T00:00:00.000Z',
      },
    ],
    [
      'data-privacy-center',
      {
        key: 'data-privacy-center',
        title: 'Data and Privacy Center',
        description: 'Data export, retention, and consent controls.',
        data: { exportEnabled: true, deleteAccountEnabled: true, retentionDays: 90 },
        updatedAt: '2026-04-20T00:00:00.000Z',
      },
    ],
    [
      'about',
      {
        key: 'about',
        title: 'About',
        description: 'App metadata and version details.',
        data: { appName: 'OptiZenqor Social', version: '1.0.0', build: '2026.04.20' },
        updatedAt: '2026-04-20T00:00:00.000Z',
      },
    ],
    [
      'legal',
      {
        key: 'legal',
        title: 'Legal',
        description: 'Terms, privacy policy, and legal consents.',
        data: { termsAccepted: true, privacyAccepted: true, communityGuidelinesAccepted: true },
        updatedAt: '2026-04-20T00:00:00.000Z',
      },
    ],
    [
      'maintenance-preview',
      {
        key: 'maintenance-preview',
        title: 'Maintenance Preview',
        description: 'Maintenance mode and rollout visibility.',
        data: { maintenanceMode: false, bannerEnabled: false, plannedWindow: null },
        updatedAt: '2026-04-20T00:00:00.000Z',
      },
    ],
  ]);

  getSections() {
    return [...this.sections.values()].map((section) => ({
      key: section.key,
      title: section.title,
      description: section.description,
      updatedAt: section.updatedAt,
    }));
  }

  getSection(sectionKey: string) {
    const section = this.sections.get(sectionKey);
    if (!section) {
      throw new NotFoundException(`Settings section ${sectionKey} not found`);
    }
    return section;
  }

  updateSection(sectionKey: string, patch: Record<string, unknown>) {
    const section = this.getSection(sectionKey);
    section.data = {
      ...section.data,
      ...patch,
    };
    section.updatedAt = new Date().toISOString();
    this.sections.set(sectionKey, section);
    return section;
  }
}
