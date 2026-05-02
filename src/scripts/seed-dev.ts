import * as argon2 from 'argon2';
import { Prisma, PrismaClient } from '@prisma/client';
import {
  DEFAULT_SETTINGS_STATE,
  DEFAULT_USER_PRIVACY,
} from '../common/settings-defaults';
import {
  coreSeedCommentReactions,
  coreSeedFollows,
  coreSeedMessages,
  coreSeedNotifications,
  coreSeedPostComments,
  coreSeedPostReactions,
  coreSeedPosts,
  coreSeedThreads,
  coreSeedUsers,
} from '../database/core-seed';

const prisma = new PrismaClient();

const userIdMap = new Map<string, string>();
const postIdMap = new Map<string, string>();
const commentIdMap = new Map<string, string>();
const threadIdMap = new Map<string, string>();
const messageIdMap = new Map<string, string>();
const notificationIdMap = new Map<string, string>();

function seededId(prefix: string, legacyId: string) {
  const normalized = legacyId.trim().replace(/[^a-zA-Z0-9]+/g, '').toLowerCase();
  return `${prefix}${normalized}`.startsWith(`${prefix}_`)
    ? `${prefix}_${normalized.slice(prefix.length)}`
    : `${prefix}_${normalized}`;
}

async function hashPassword(password: string) {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  });
}

async function main() {
  await prisma.adminOperationalSetting.upsert({
    where: { key: 'support.contact' },
    create: {
      key: 'support.contact',
      value: {
        contactEmail: 'support@optizenqor.app',
        escalationEmail: 'trust@optizenqor.app',
        responseTime: 'Usually within 24 hours',
      },
    },
    update: {
      value: {
        contactEmail: 'support@optizenqor.app',
        escalationEmail: 'trust@optizenqor.app',
        responseTime: 'Usually within 24 hours',
      },
    },
  });

  const operationalSettings = [
    {
      key: 'app.onboarding.slides',
      value: [
        {
          id: 'identity',
          title: 'Create your social identity',
          subtitle: 'One profile, multiple roles, premium social tools.',
          icon: 'person_pin_circle_rounded',
        },
        {
          id: 'discovery',
          title: 'Discover what matters faster',
          subtitle: 'Reels, communities, market, jobs, and curated feed.',
          icon: 'travel_explore_rounded',
        },
        {
          id: 'growth',
          title: 'Scale with creator and business tools',
          subtitle: 'Insights, campaigns, subscriptions, and growth modules.',
          icon: 'insights_rounded',
        },
      ],
    },
    {
      key: 'app.onboarding.interests',
      value: ['Technology', 'Business', 'Music', 'Sports', 'Travel', 'Education'],
    },
    {
      key: 'growth.referral.milestones',
      value: [
        { count: 5, reward: 'Premium profile badge' },
        { count: 10, reward: '1 month premium access' },
        { count: 25, reward: 'Priority creator review' },
      ],
    },
    {
      key: 'growth.referral.benefit',
      value: 'Invite friends to join OptiZenqor Social and unlock program rewards together.',
    },
    {
      key: 'growth.referral.share_base_url',
      value: 'https://optizenqor.app/invite',
    },
    {
      key: 'app.deep_link_handler',
      value: {
        supportedPrefixes: [
          'optizenqor://',
          'https://optizenqor.app/',
          'https://www.optizenqor.app/',
        ],
        recentLinks: [],
        allowUniversalLinks: true,
        openExternalLinksInApp: false,
      },
    },
    {
      key: 'app.share_repost',
      value: {
        options: [
          { title: 'Share to chat' },
          { title: 'Share externally' },
          { title: 'Copy post link' },
          { title: 'Repost' },
          { title: 'Quote-share' },
        ],
        recentActivity: [],
      },
    },
    {
      key: 'app.localization.locales',
      value: [
        { localeCode: 'en', label: 'English' },
        { localeCode: 'bn', label: 'Bangla' },
        { localeCode: 'ar', label: 'Arabic (RTL ready)' },
      ],
    },
    {
      key: 'locale.fallback_locale',
      value: 'en',
    },
    {
      key: 'notifications.push_categories',
      value: [
        { title: 'Likes', enabledByDefault: true },
        { title: 'Comments', enabledByDefault: true },
        { title: 'Mentions', enabledByDefault: true },
        { title: 'Messages', enabledByDefault: true },
        { title: 'Calls', enabledByDefault: false },
        { title: 'Live alerts', enabledByDefault: false },
      ],
    },
    {
      key: 'app.accessibility.options',
      value: [
        { key: 'accessibility.captions', title: 'Captions by default', enabledByDefault: true },
        { key: 'accessibility.high_contrast', title: 'High contrast mode', enabledByDefault: false },
        { key: 'accessibility.reduce_motion', title: 'Reduce motion', enabledByDefault: false },
        { key: 'accessibility.screen_reader_hints', title: 'Screen reader hints', enabledByDefault: true },
      ],
    },
    {
      key: 'legal.documents',
      value: [
        { key: 'terms', title: 'Terms of Service', version: '2026.04' },
        { key: 'privacy', title: 'Privacy Policy', version: '2026.04' },
        { key: 'guidelines', title: 'Community Guidelines', version: '2026.04' },
      ],
    },
    {
      key: 'app.update_flow',
      value: {
        type: 'optional',
        message: 'A new app version is available with stability and moderation improvements.',
        isUpdating: false,
        latestVersion: '1.0.0',
        minVersion: '1.0.0',
      },
    },
    {
      key: 'app.maintenance_mode',
      value: {
        title: 'Scheduled Maintenance',
        message: 'We are improving your experience. Please retry shortly.',
        isActive: false,
        isRetrying: false,
      },
    },
  ] as const;

  for (const setting of operationalSettings) {
    await prisma.adminOperationalSetting.upsert({
      where: { key: setting.key },
      create: {
        key: setting.key,
        value: setting.value,
      },
      update: {
        value: setting.value,
      },
    });
  }

  await prisma.supportConfigEntry.upsert({
    where: { key: 'marketplace.create_options' },
    create: {
      key: 'marketplace.create_options',
      title: 'Marketplace create options',
      description: 'Canonical marketplace listing options for production clients.',
      value: {
        requiredProfileType: 'business',
        deliveryMethods: ['Pickup', 'Shipping', 'Local delivery'],
        paymentMethods: ['Cash on delivery', 'Wallet', 'Card'],
        moderationNotes: [
          'Avoid prohibited items and misleading titles.',
          'Use clear photos and accurate condition details.',
        ],
      },
    },
    update: {
      title: 'Marketplace create options',
      description: 'Canonical marketplace listing options for production clients.',
      value: {
        requiredProfileType: 'business',
        deliveryMethods: ['Pickup', 'Shipping', 'Local delivery'],
        paymentMethods: ['Cash on delivery', 'Wallet', 'Card'],
        moderationNotes: [
          'Avoid prohibited items and misleading titles.',
          'Use clear photos and accurate condition details.',
        ],
      },
    },
  });

  for (const locale of [
    {
      localeCode: 'en',
      label: 'English',
      nativeLabel: 'English',
      sortOrder: 1,
      isDefault: true,
    },
    {
      localeCode: 'bn',
      label: 'Bangla',
      nativeLabel: 'Bangla',
      sortOrder: 2,
      isDefault: false,
    },
    {
      localeCode: 'ar',
      label: 'Arabic',
      nativeLabel: 'Arabic',
      sortOrder: 3,
      isDefault: false,
    },
  ]) {
    await prisma.localizationLocaleCatalog.upsert({
      where: { localeCode: locale.localeCode },
      create: locale,
      update: locale,
    });
  }

  for (const option of [
    {
      id: 'accessibility_captions',
      optionKey: 'accessibility.captions',
      title: 'Captions by default',
      description: 'Enable captions by default for compatible content.',
      settingKey: 'accessibility.captions',
      valueType: 'boolean',
      defaultValue: true,
      options: [],
      sortOrder: 1,
      metadata: {},
    },
    {
      id: 'accessibility_high_contrast',
      optionKey: 'accessibility.high_contrast',
      title: 'High contrast mode',
      description: 'Increase contrast for improved readability.',
      settingKey: 'accessibility.high_contrast',
      valueType: 'boolean',
      defaultValue: false,
      options: [],
      sortOrder: 2,
      metadata: {},
    },
    {
      id: 'accessibility_reduce_motion',
      optionKey: 'accessibility.reduce_motion',
      title: 'Reduce motion',
      description: 'Limit non-essential movement and animation.',
      settingKey: 'accessibility.reduce_motion',
      valueType: 'boolean',
      defaultValue: false,
      options: [],
      sortOrder: 3,
      metadata: {},
    },
    {
      id: 'accessibility_screen_reader_hints',
      optionKey: 'accessibility.screen_reader_hints',
      title: 'Screen reader hints',
      description: 'Provide extra spoken guidance for assistive readers.',
      settingKey: 'accessibility.screen_reader_hints',
      valueType: 'boolean',
      defaultValue: true,
      options: [],
      sortOrder: 4,
      metadata: {},
    },
  ]) {
    await prisma.accessibilityOptionCatalog.upsert({
      where: { optionKey: option.optionKey },
      create: option,
      update: option,
    });
  }

  for (const document of [
    {
      id: 'legal_terms_2026_04',
      documentKey: 'terms',
      title: 'Terms of Service',
      version: '2026.04',
      localeCode: 'en',
      body: 'Platform terms of service version 2026.04.',
      summary: 'Terms governing use of the OptiZenqor platform.',
      isActive: true,
      publishedAt: new Date('2026-04-01T00:00:00.000Z'),
    },
    {
      id: 'legal_privacy_2026_04',
      documentKey: 'privacy',
      title: 'Privacy Policy',
      version: '2026.04',
      localeCode: 'en',
      body: 'Platform privacy policy version 2026.04.',
      summary: 'How OptiZenqor collects and uses personal data.',
      isActive: true,
      publishedAt: new Date('2026-04-01T00:00:00.000Z'),
    },
    {
      id: 'legal_guidelines_2026_04',
      documentKey: 'guidelines',
      title: 'Community Guidelines',
      version: '2026.04',
      localeCode: 'en',
      body: 'Platform community guidelines version 2026.04.',
      summary: 'Community rules and moderation expectations.',
      isActive: true,
      publishedAt: new Date('2026-04-01T00:00:00.000Z'),
    },
  ]) {
    await prisma.legalDocumentVersion.upsert({
      where: { id: document.id },
      create: document,
      update: document,
    });
  }

  for (const item of [
    {
      id: 'onboarding_slide_identity',
      catalogType: 'slide',
      code: 'identity',
      title: 'Create your social identity',
      subtitle: 'One profile, multiple roles, premium social tools.',
      description: 'Set up a profile that works across social, business, and creator journeys.',
      icon: 'person_pin_circle_rounded',
      sortOrder: 1,
      metadata: {},
    },
    {
      id: 'onboarding_slide_discovery',
      catalogType: 'slide',
      code: 'discovery',
      title: 'Discover what matters faster',
      subtitle: 'Reels, communities, market, jobs, and curated feed.',
      description: 'Find people, content, commerce, and opportunities in one place.',
      icon: 'travel_explore_rounded',
      sortOrder: 2,
      metadata: {},
    },
    {
      id: 'onboarding_slide_growth',
      catalogType: 'slide',
      code: 'growth',
      title: 'Scale with creator and business tools',
      subtitle: 'Insights, campaigns, subscriptions, and growth modules.',
      description: 'Use advanced tools to grow audience, revenue, and reach.',
      icon: 'insights_rounded',
      sortOrder: 3,
      metadata: {},
    },
  ]) {
    await prisma.onboardingCatalogItem.upsert({
      where: { id: item.id },
      create: item,
      update: item,
    });
  }

  for (const item of [
    { id: 'personalization_technology', code: 'technology', title: 'Technology', groupKey: 'interest', sortOrder: 1 },
    { id: 'personalization_business', code: 'business', title: 'Business', groupKey: 'interest', sortOrder: 2 },
    { id: 'personalization_music', code: 'music', title: 'Music', groupKey: 'interest', sortOrder: 3 },
    { id: 'personalization_sports', code: 'sports', title: 'Sports', groupKey: 'interest', sortOrder: 4 },
    { id: 'personalization_travel', code: 'travel', title: 'Travel', groupKey: 'interest', sortOrder: 5 },
    { id: 'personalization_education', code: 'education', title: 'Education', groupKey: 'interest', sortOrder: 6 },
  ]) {
    await prisma.personalizationCatalogItem.upsert({
      where: { id: item.id },
      create: {
        ...item,
        description: null,
        metadata: {},
      },
      update: {
        ...item,
        description: null,
        metadata: {},
      },
    });
  }

  await prisma.premiumPlan.createMany({
    data: [
      {
        id: 'plan_monthly',
        code: 'monthly',
        name: 'Monthly Premium',
        description: 'Monthly access to premium features.',
        price: 299,
        currency: 'BDT',
        billingInterval: 'monthly',
        features: ['ad-light feed', 'creator tools', 'priority support'],
        isActive: true,
      },
      {
        id: 'plan_yearly',
        code: 'yearly',
        name: 'Yearly Premium',
        description: 'Yearly access to premium features.',
        price: 2999,
        currency: 'BDT',
        billingInterval: 'yearly',
        features: ['ad-light feed', 'creator tools', 'priority support'],
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });

  for (const user of coreSeedUsers) {
    const userId = userIdMap.get(user.id) ?? seededId('user', user.id);
    userIdMap.set(user.id, userId);
    await prisma.appUser.upsert({
      where: { id: userId },
      create: {
        id: userId,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        interests: [],
        role: user.role,
        verification: user.verification,
        status: user.status,
        followers: user.followers,
        following: user.following,
        walletSummary: user.walletSummary,
        health: user.health,
        reports: user.reports,
        lastActive: user.lastActive,
        emailVerified: user.emailVerified,
        blocked: user.blocked,
        passwordHash: await hashPassword(user.password),
      },
      update: {
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        role: user.role,
        verification: user.verification,
        status: user.status,
        followers: user.followers,
        following: user.following,
        walletSummary: user.walletSummary,
        health: user.health,
        reports: user.reports,
        lastActive: user.lastActive,
        emailVerified: user.emailVerified,
        blocked: user.blocked,
      },
    });
    await prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        settings: DEFAULT_SETTINGS_STATE as Prisma.InputJsonValue,
      },
      update: {
        settings: DEFAULT_SETTINGS_STATE as Prisma.InputJsonValue,
      },
    });
    await prisma.userPrivacy.upsert({
      where: { userId },
      create: {
        userId,
        ...DEFAULT_USER_PRIVACY,
      },
      update: {
        ...DEFAULT_USER_PRIVACY,
      },
    });
  }

  for (const relation of coreSeedFollows) {
    await prisma.appFollowRelation.upsert({
      where: {
        followerId_targetId: {
          followerId: userIdMap.get(relation.followerId) ?? seededId('user', relation.followerId),
          targetId: userIdMap.get(relation.targetId) ?? seededId('user', relation.targetId),
        },
      },
      create: {
        followerId: userIdMap.get(relation.followerId) ?? seededId('user', relation.followerId),
        targetId: userIdMap.get(relation.targetId) ?? seededId('user', relation.targetId),
        createdAt: new Date(),
      },
      update: {},
    });
  }

  for (const post of coreSeedPosts) {
    const postId = postIdMap.get(post.id) ?? seededId('post', post.id);
    postIdMap.set(post.id, postId);
    await prisma.appPost.upsert({
      where: { id: postId },
      create: {
        id: postId,
        authorId: userIdMap.get(post.authorId) ?? seededId('user', post.authorId),
        caption: post.caption,
        media: post.media,
        tags: post.tags,
        likes: post.likes,
        comments: post.comments,
        shares: post.shares,
        views: post.views,
        status: post.status,
        type: post.type,
        createdAt: new Date(post.createdAt),
      },
      update: {
        caption: post.caption,
        media: post.media,
        tags: post.tags,
        likes: post.likes,
        comments: post.comments,
        shares: post.shares,
        views: post.views,
        status: post.status,
        type: post.type,
      },
    });
  }

  for (const reaction of coreSeedPostReactions) {
    await prisma.appPostReaction.upsert({
      where: {
        postId_userId: {
          postId: postIdMap.get(reaction.postId) ?? seededId('post', reaction.postId),
          userId: userIdMap.get(reaction.userId) ?? seededId('user', reaction.userId),
        },
      },
      create: {
        postId: postIdMap.get(reaction.postId) ?? seededId('post', reaction.postId),
        userId: userIdMap.get(reaction.userId) ?? seededId('user', reaction.userId),
        reaction: reaction.reaction,
        createdAt: new Date(reaction.createdAt),
      },
      update: {
        reaction: reaction.reaction,
        createdAt: new Date(reaction.createdAt),
      },
    });
  }

  for (const comment of coreSeedPostComments) {
    const commentId = commentIdMap.get(comment.id) ?? seededId('comment', comment.id);
    commentIdMap.set(comment.id, commentId);
    await prisma.appPostComment.upsert({
      where: { id: commentId },
      create: {
        id: commentId,
        postId: postIdMap.get(comment.postId) ?? seededId('post', comment.postId),
        authorId: userIdMap.get(comment.authorId) ?? seededId('user', comment.authorId),
        authorName: comment.author,
        message: comment.message,
        replyTo: comment.replyTo
          ? commentIdMap.get(comment.replyTo) ?? seededId('comment', comment.replyTo)
          : null,
        createdAt: new Date(comment.createdAt),
        likeCount: comment.likeCount,
        isLikedByMe: comment.isLikedByMe,
        isReported: comment.isReported,
        isEdited: comment.isEdited,
        mentions: comment.mentions,
      },
      update: {
        authorId: userIdMap.get(comment.authorId) ?? seededId('user', comment.authorId),
        authorName: comment.author,
        message: comment.message,
        replyTo: comment.replyTo
          ? commentIdMap.get(comment.replyTo) ?? seededId('comment', comment.replyTo)
          : null,
        likeCount: comment.likeCount,
        isLikedByMe: comment.isLikedByMe,
        isReported: comment.isReported,
        isEdited: comment.isEdited,
        mentions: comment.mentions,
      },
    });
  }

  for (const reaction of coreSeedCommentReactions) {
    await prisma.appPostCommentReaction.upsert({
      where: {
        commentId_userId: {
          commentId: commentIdMap.get(reaction.commentId) ?? seededId('comment', reaction.commentId),
          userId: userIdMap.get(reaction.userId) ?? seededId('user', reaction.userId),
        },
      },
      create: {
        commentId: commentIdMap.get(reaction.commentId) ?? seededId('comment', reaction.commentId),
        userId: userIdMap.get(reaction.userId) ?? seededId('user', reaction.userId),
        reaction: reaction.reaction,
        createdAt: new Date(reaction.createdAt),
      },
      update: {
        reaction: reaction.reaction,
        createdAt: new Date(reaction.createdAt),
      },
    });
  }

  for (const thread of coreSeedThreads) {
    const threadId = threadIdMap.get(thread.id) ?? seededId('conversation', thread.id);
    threadIdMap.set(thread.id, threadId);
    await prisma.chatThread.upsert({
      where: { id: threadId },
      create: {
        id: threadId,
        title: thread.title,
        participantsLabel: thread.participantsLabel,
        flag: thread.flag,
        summary: thread.summary,
      },
      update: {
        title: thread.title,
        participantsLabel: thread.participantsLabel,
        flag: thread.flag,
        summary: thread.summary,
      },
    });

    for (const participantId of thread.participantIds) {
      await prisma.chatThreadParticipant.upsert({
        where: {
          threadId_userId: {
            threadId,
            userId: userIdMap.get(participantId) ?? seededId('user', participantId),
          },
        },
        create: {
          threadId,
          userId: userIdMap.get(participantId) ?? seededId('user', participantId),
          createdAt: new Date(),
        },
        update: {},
      });
    }
  }

  for (const message of coreSeedMessages) {
    const messageId = messageIdMap.get(message.id) ?? seededId('message', message.id);
    messageIdMap.set(message.id, messageId);
    await prisma.chatMessage.upsert({
      where: { id: messageId },
      create: {
        id: messageId,
        threadId: threadIdMap.get(message.threadId) ?? seededId('thread', message.threadId),
        senderId: userIdMap.get(message.senderId) ?? seededId('user', message.senderId),
        text: message.text,
        read: message.read,
        timestamp: new Date(message.timestamp),
        attachments: message.attachments,
        replyToMessageId: message.replyToMessageId
          ? messageIdMap.get(message.replyToMessageId) ?? seededId('message', message.replyToMessageId)
          : null,
        deliveryState: message.deliveryState,
        kind: message.kind,
        mediaPath: message.mediaPath,
      },
      update: {
        text: message.text,
        read: message.read,
        timestamp: new Date(message.timestamp),
        attachments: message.attachments,
        replyToMessageId: message.replyToMessageId
          ? messageIdMap.get(message.replyToMessageId) ?? seededId('message', message.replyToMessageId)
          : null,
        deliveryState: message.deliveryState,
        kind: message.kind,
        mediaPath: message.mediaPath,
      },
    });
  }

  for (const notification of coreSeedNotifications) {
    const notificationId =
      notificationIdMap.get(notification.id) ?? seededId('notification', notification.id);
    notificationIdMap.set(notification.id, notificationId);
    await prisma.appNotification.upsert({
      where: { id: notificationId },
      create: {
        id: notificationId,
        recipientId:
          userIdMap.get(notification.recipientId) ?? seededId('user', notification.recipientId),
        title: notification.title,
        body: notification.body,
        createdAt: new Date(notification.createdAt),
        read: notification.read,
        type: notification.type,
        routeName: notification.routeName,
        entityId: notification.entityId,
        metadata: notification.metadata,
      },
      update: {
        title: notification.title,
        body: notification.body,
        createdAt: new Date(notification.createdAt),
        read: notification.read,
        type: notification.type,
        routeName: notification.routeName,
        entityId: notification.entityId,
        metadata: notification.metadata,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
