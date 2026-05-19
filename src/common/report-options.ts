export type ReportSeverity = 'low' | 'medium' | 'high' | 'critical';

export type ReportTargetOption = {
  key: string;
  label: string;
  description: string;
  adminSection: string;
  routeName: string;
  actionLabel: string;
  aliases: string[];
};

export type ReportReasonOption = {
  key: string;
  label: string;
  description: string;
  severity: ReportSeverity;
  appliesTo: string[];
  aliases?: string[];
};

export type ReportStatusOption = {
  key: string;
  label: string;
  description: string;
};

export const REPORT_TARGET_OPTIONS: ReportTargetOption[] = [
  {
    key: 'user',
    label: 'Person or profile',
    description: 'Report an account, profile, or person.',
    adminSection: 'users',
    routeName: '/admin/users',
    actionLabel: 'Open person',
    aliases: ['person', 'profile', 'account', 'member'],
  },
  {
    key: 'post',
    label: 'Post',
    description: 'Report a feed post or shared post.',
    adminSection: 'posts',
    routeName: '/admin/posts',
    actionLabel: 'Open post',
    aliases: ['app-post', 'app_post', 'feed-post', 'feed_post'],
  },
  {
    key: 'reel',
    label: 'Reel',
    description: 'Report a short-form video reel.',
    adminSection: 'reels',
    routeName: '/admin/reels',
    actionLabel: 'Open reel',
    aliases: ['app-reel', 'app_reel', 'video'],
  },
  {
    key: 'story',
    label: 'Story',
    description: 'Report an active story.',
    adminSection: 'stories',
    routeName: '/admin/stories',
    actionLabel: 'Open story',
    aliases: ['app-story', 'app_story'],
  },
  {
    key: 'comment',
    label: 'Comment',
    description: 'Report a post, reel, story, or live comment.',
    adminSection: 'comments',
    routeName: '/admin/comments',
    actionLabel: 'Open comment',
    aliases: [
      'post-comment',
      'post_comment',
      'app-post-comment',
      'app_post_comment',
      'reel-comment',
      'reel_comment',
      'story-comment',
      'story_comment',
      'live-comment',
      'live_comment',
    ],
  },
  {
    key: 'marketplace',
    label: 'Marketplace listing',
    description: 'Report a product, service, or marketplace listing.',
    adminSection: 'marketplace',
    routeName: '/admin/marketplace',
    actionLabel: 'Open listing',
    aliases: ['product', 'listing', 'marketplace-product', 'marketplace_product'],
  },
  {
    key: 'job',
    label: 'Job',
    description: 'Report a job post or recruiter listing.',
    adminSection: 'jobs',
    routeName: '/admin/jobs',
    actionLabel: 'Open job',
    aliases: ['jobs', 'job-post', 'job_post'],
  },
  {
    key: 'event',
    label: 'Event',
    description: 'Report an event listing.',
    adminSection: 'events',
    routeName: '/admin/events',
    actionLabel: 'Open event',
    aliases: ['events'],
  },
  {
    key: 'community',
    label: 'Community',
    description: 'Report a community, group, or space.',
    adminSection: 'communities',
    routeName: '/admin/communities',
    actionLabel: 'Open community',
    aliases: ['communities', 'group', 'space'],
  },
  {
    key: 'page',
    label: 'Page',
    description: 'Report a public page.',
    adminSection: 'pages',
    routeName: '/admin/pages',
    actionLabel: 'Open page',
    aliases: ['pages'],
  },
  {
    key: 'chat',
    label: 'Chat',
    description: 'Report a chat thread or message.',
    adminSection: 'support-operations',
    routeName: '/admin/support-operations',
    actionLabel: 'Open chat case',
    aliases: ['thread', 'chat-thread', 'chat_thread', 'message', 'conversation'],
  },
  {
    key: 'live',
    label: 'Live stream',
    description: 'Report a live stream or live content.',
    adminSection: 'support-operations',
    routeName: '/admin/support-operations',
    actionLabel: 'Open live case',
    aliases: ['live-stream', 'live_stream', 'stream'],
  },
];

export const REPORT_REASON_OPTIONS: ReportReasonOption[] = [
  {
    key: 'spam',
    label: 'Spam or unwanted promotion',
    description: 'Repeated, misleading, or low-quality promotional content.',
    severity: 'low',
    appliesTo: ['all'],
    aliases: ['spam_or_fake', 'advertising'],
  },
  {
    key: 'scam_fraud',
    label: 'Scam, fraud, or phishing',
    description: 'Attempts to steal money, credentials, or personal information.',
    severity: 'high',
    appliesTo: ['user', 'post', 'reel', 'story', 'comment', 'marketplace', 'job', 'event', 'chat'],
    aliases: ['scam', 'fraud', 'phishing'],
  },
  {
    key: 'harassment',
    label: 'Harassment or bullying',
    description: 'Targeted abuse, intimidation, unwanted contact, or bullying.',
    severity: 'high',
    appliesTo: ['all'],
    aliases: ['bullying', 'abuse'],
  },
  {
    key: 'hate_speech',
    label: 'Hate speech',
    description: 'Attacks against protected people or groups.',
    severity: 'critical',
    appliesTo: ['all'],
    aliases: ['hate', 'hateful'],
  },
  {
    key: 'violence',
    label: 'Violence or dangerous acts',
    description: 'Threats, graphic violence, weapons misuse, or calls for harm.',
    severity: 'critical',
    appliesTo: ['all'],
    aliases: ['threat', 'threats', 'dangerous_acts'],
  },
  {
    key: 'nudity',
    label: 'Nudity or sexual content',
    description: 'Sexual content, unwanted explicit material, or nudity.',
    severity: 'high',
    appliesTo: ['post', 'reel', 'story', 'comment', 'chat', 'live'],
    aliases: ['sexual_content', 'adult_content'],
  },
  {
    key: 'minor_safety',
    label: 'Child safety concern',
    description: 'Content or behavior that may endanger a minor.',
    severity: 'critical',
    appliesTo: ['all'],
    aliases: ['child_safety', 'minor'],
  },
  {
    key: 'self_harm',
    label: 'Self-harm or suicide concern',
    description: 'Content suggesting immediate risk of self-harm or suicide.',
    severity: 'critical',
    appliesTo: ['user', 'post', 'reel', 'story', 'comment', 'chat', 'live'],
    aliases: ['suicide', 'self-harm'],
  },
  {
    key: 'false_information',
    label: 'False or misleading information',
    description: 'Potentially harmful claims, impersonated news, or manipulated context.',
    severity: 'medium',
    appliesTo: ['post', 'reel', 'story', 'comment', 'event', 'page', 'community'],
    aliases: ['misinformation', 'fake_news'],
  },
  {
    key: 'impersonation',
    label: 'Impersonation',
    description: 'Pretending to be another person, business, or organization.',
    severity: 'high',
    appliesTo: ['user', 'page', 'community', 'marketplace', 'job'],
    aliases: ['fake_account', 'fake-profile', 'fake_profile'],
  },
  {
    key: 'privacy',
    label: 'Privacy violation',
    description: 'Sharing private information, images, or personal data without consent.',
    severity: 'high',
    appliesTo: ['all'],
    aliases: ['personal_information', 'doxxing'],
  },
  {
    key: 'illegal_goods',
    label: 'Illegal goods or services',
    description: 'Sales, requests, or promotion of prohibited goods or services.',
    severity: 'critical',
    appliesTo: ['marketplace', 'post', 'reel', 'story', 'comment', 'chat'],
    aliases: ['prohibited_goods', 'drugs', 'weapons'],
  },
  {
    key: 'intellectual_property',
    label: 'Intellectual property',
    description: 'Copyright, trademark, or brand misuse concerns.',
    severity: 'medium',
    appliesTo: ['post', 'reel', 'story', 'marketplace', 'page'],
    aliases: ['copyright', 'trademark', 'ip'],
  },
  {
    key: 'other',
    label: 'Something else',
    description: 'Use this when none of the available reasons match.',
    severity: 'medium',
    appliesTo: ['all'],
    aliases: ['other_reason'],
  },
];

export const REPORT_STATUS_OPTIONS: ReportStatusOption[] = [
  {
    key: 'submitted',
    label: 'Submitted',
    description: 'The report is waiting for moderator review.',
  },
  {
    key: 'reviewing',
    label: 'Reviewing',
    description: 'A moderator is checking the reported target.',
  },
  {
    key: 'resolved',
    label: 'Resolved',
    description: 'A moderation decision has been applied.',
  },
  {
    key: 'rejected',
    label: 'Rejected',
    description: 'The report was closed without action.',
  },
];

export function normalizeReportTargetType(value?: string | null) {
  const normalized = normalizeReportKey(value);
  if (!normalized) {
    return '';
  }
  const match = REPORT_TARGET_OPTIONS.find(
    (option) => option.key === normalized || option.aliases.some((alias) => normalizeReportKey(alias) === normalized),
  );
  return match?.key ?? normalized;
}

export function inferReportTargetTypeFromId(value?: string | null) {
  const normalized = value?.trim().toLowerCase() ?? '';
  if (!normalized) {
    return '';
  }
  if (normalized.startsWith('user_')) return 'user';
  if (normalized.startsWith('post_')) return 'post';
  if (normalized.startsWith('reel_')) return 'reel';
  if (normalized.startsWith('story_')) return 'story';
  if (normalized.startsWith('comment_') || normalized.startsWith('live_comment_')) return 'comment';
  if (normalized.startsWith('product_')) return 'marketplace';
  if (normalized.startsWith('job_')) return 'job';
  if (normalized.startsWith('event_')) return 'event';
  if (normalized.startsWith('community_')) return 'community';
  if (normalized.startsWith('page_')) return 'page';
  if (normalized.startsWith('thread_') || normalized.startsWith('message_') || normalized.startsWith('conversation_')) return 'chat';
  if (normalized.startsWith('live_stream_')) return 'live';
  return '';
}

export function normalizeReportReason(value?: string | null) {
  const normalized = normalizeReportKey(value);
  if (!normalized) {
    return '';
  }
  const match = REPORT_REASON_OPTIONS.find(
    (option) =>
      option.key === normalized ||
      option.aliases?.some((alias) => normalizeReportKey(alias) === normalized),
  );
  return match?.key ?? normalized;
}

export function getReportTargetOption(value?: string | null) {
  const targetType = normalizeReportTargetType(value);
  return REPORT_TARGET_OPTIONS.find((option) => option.key === targetType) ?? null;
}

export function getReportReasonOption(value?: string | null): ReportReasonOption {
  const reason = normalizeReportReason(value);
  const match = REPORT_REASON_OPTIONS.find((option) => option.key === reason);
  if (match) {
    return match;
  }
  const label = labelizeReportKey(value?.trim() || reason || 'other');
  return {
    key: reason || 'other',
    label,
    description: label,
    severity: 'medium',
    appliesTo: ['all'],
  };
}

export function getReportStatusOption(value?: string | null): ReportStatusOption {
  const normalized = normalizeReportKey(value) || 'submitted';
  return (
    REPORT_STATUS_OPTIONS.find((option) => option.key === normalized) ?? {
      key: normalized,
      label: labelizeReportKey(normalized),
      description: labelizeReportKey(normalized),
    }
  );
}

export function getReportTargetTypeAliases(value: string) {
  const option = getReportTargetOption(value);
  const values = option ? [option.key, ...option.aliases] : [value];
  return [...new Set(values.flatMap((item) => {
    const raw = item.trim().toLowerCase();
    const normalized = normalizeReportKey(item);
    return [raw, normalized, normalized.replaceAll('_', '-')];
  }))]
    .filter(Boolean);
}

export function buildReportOptionsPayload() {
  return {
    targetTypes: REPORT_TARGET_OPTIONS.map((option) => ({
      key: option.key,
      label: option.label,
      description: option.description,
      adminSection: option.adminSection,
      routeName: option.routeName,
      actionLabel: option.actionLabel,
      aliases: option.aliases,
    })),
    reasons: REPORT_REASON_OPTIONS.map((option) => ({
      key: option.key,
      label: option.label,
      description: option.description,
      severity: option.severity,
      appliesTo: option.appliesTo,
    })),
    statuses: REPORT_STATUS_OPTIONS,
    examples: [
      {
        targetType: 'post',
        targetId: 'post_xxxxxxxxxxxxxxxx',
        reason: 'harassment',
        details: 'Explain what happened and why it should be reviewed.',
      },
      {
        targetType: 'user',
        targetUserId: 'user_xxxxxxxxxxxxxxxx',
        reason: 'impersonation',
        details: 'Tell moderators who this account is impersonating.',
      },
    ],
  };
}

function normalizeReportKey(value?: string | null) {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .replaceAll('-', '_');
}

function labelizeReportKey(value: string) {
  return value
    .replace(/[-_]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
