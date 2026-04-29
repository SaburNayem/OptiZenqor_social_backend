import * as argon2 from 'argon2';
import { PrismaClient } from '@prisma/client';
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

async function hashPassword(password: string) {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  });
}

async function main() {
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
    await prisma.appUser.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
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
  }

  for (const relation of coreSeedFollows) {
    await prisma.appFollowRelation.upsert({
      where: {
        followerId_targetId: {
          followerId: relation.followerId,
          targetId: relation.targetId,
        },
      },
      create: {
        followerId: relation.followerId,
        targetId: relation.targetId,
        createdAt: new Date(),
      },
      update: {},
    });
  }

  for (const post of coreSeedPosts) {
    await prisma.appPost.upsert({
      where: { id: post.id },
      create: {
        id: post.id,
        authorId: post.authorId,
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
          postId: reaction.postId,
          userId: reaction.userId,
        },
      },
      create: {
        postId: reaction.postId,
        userId: reaction.userId,
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
    await prisma.appPostComment.upsert({
      where: { id: comment.id },
      create: {
        id: comment.id,
        postId: comment.postId,
        authorId: comment.authorId,
        authorName: comment.author,
        message: comment.message,
        replyTo: comment.replyTo,
        createdAt: new Date(comment.createdAt),
        likeCount: comment.likeCount,
        isLikedByMe: comment.isLikedByMe,
        isReported: comment.isReported,
        isEdited: comment.isEdited,
        mentions: comment.mentions,
      },
      update: {
        authorId: comment.authorId,
        authorName: comment.author,
        message: comment.message,
        replyTo: comment.replyTo,
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
          commentId: reaction.commentId,
          userId: reaction.userId,
        },
      },
      create: {
        commentId: reaction.commentId,
        userId: reaction.userId,
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
    await prisma.chatThread.upsert({
      where: { id: thread.id },
      create: {
        id: thread.id,
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
            threadId: thread.id,
            userId: participantId,
          },
        },
        create: {
          threadId: thread.id,
          userId: participantId,
          createdAt: new Date(),
        },
        update: {},
      });
    }
  }

  for (const message of coreSeedMessages) {
    await prisma.chatMessage.upsert({
      where: { id: message.id },
      create: {
        id: message.id,
        threadId: message.threadId,
        senderId: message.senderId,
        text: message.text,
        read: message.read,
        timestamp: new Date(message.timestamp),
        attachments: message.attachments,
        replyToMessageId: message.replyToMessageId,
        deliveryState: message.deliveryState,
        kind: message.kind,
        mediaPath: message.mediaPath,
      },
      update: {
        text: message.text,
        read: message.read,
        timestamp: new Date(message.timestamp),
        attachments: message.attachments,
        replyToMessageId: message.replyToMessageId,
        deliveryState: message.deliveryState,
        kind: message.kind,
        mediaPath: message.mediaPath,
      },
    });
  }

  for (const notification of coreSeedNotifications) {
    await prisma.appNotification.upsert({
      where: { id: notification.id },
      create: {
        id: notification.id,
        recipientId: notification.recipientId,
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
