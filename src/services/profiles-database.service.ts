import { Injectable } from '@nestjs/common';
import { AccountStateDatabaseService } from './account-state-database.service';
import { CoreDatabaseService } from './core-database.service';
import { ExperienceDatabaseService } from './experience-database.service';

@Injectable()
export class ProfilesDatabaseService {
  constructor(
    private readonly coreDatabase: CoreDatabaseService,
    private readonly accountStateDatabase: AccountStateDatabaseService,
    private readonly experienceDatabase: ExperienceDatabaseService,
  ) {}

  async buildProfilePayload(id: string) {
    const [user, posts] = await Promise.all([
      this.coreDatabase.getUser(id),
      this.coreDatabase.getPosts(id),
    ]);

    return {
      user,
      stats: {
        followers: user.followers,
        following: user.following,
        posts: posts.length,
      },
      tabs: ['posts', 'reels', 'about', 'tagged'],
      links: [
        {
          label: 'Public profile',
          url: `https://optizenqor.app/${user.username}`,
        },
      ],
      recentPosts: posts.slice(0, 6),
      profilePreview: {
        badge: user.verification,
        role: user.role,
        health: user.health,
      },
    };
  }

  async getTaggedPosts(userId: string) {
    const user = await this.coreDatabase.getUser(userId);
    const username = user.username.toLowerCase();
    const posts = await this.coreDatabase.getFeed();

    return posts
      .filter((post) => {
        const caption = String(post.caption ?? '').toLowerCase();
        const tags = this.readStringArray(post.tags).map((tag) => tag.toLowerCase());
        return caption.includes(`@${username}`) || tags.includes(username) || tags.includes(`#${username}`);
      })
      .map((post) => ({
        id: post.id,
        title: post.caption || `Post by ${post.author?.name ?? 'Unknown'}`,
        subtitle: post.author?.name ?? post.author?.username ?? '',
        imageUrl: this.firstString(post.media) ?? post.author?.avatar ?? null,
        createdAt: post.createdAt,
        engagement: {
          likes: post.likes,
          comments: post.comments,
          shares: post.shares,
          views: post.views,
        },
      }));
  }

  async getMentionHistory(userId: string) {
    const user = await this.coreDatabase.getUser(userId);
    const username = user.username.toLowerCase();
    const posts = await this.coreDatabase.getFeed();

    const postMentions = posts
      .filter((post) => String(post.caption ?? '').toLowerCase().includes(`@${username}`))
      .map((post) => ({
        id: post.id,
        type: 'post',
        title: post.caption || `Mention by ${post.author?.name ?? 'Unknown'}`,
        actorName: post.author?.name ?? post.author?.username ?? 'Unknown',
        actorId: post.author?.id ?? null,
        createdAt: post.createdAt,
        routeName: `/posts/${post.id}`,
      }));

    const commentMentions = (
      await Promise.all(
        posts.map(async (post) => ({
          postId: post.id,
          comments: await this.coreDatabase.getPostComments(post.id).catch(() => []),
        })),
      )
    )
      .flatMap(({ postId, comments }) => this.flattenComments(comments, postId))
      .filter((comment) =>
        this.readStringArray(comment.mentions).some(
          (mention) => mention.toLowerCase() === username,
        ),
      )
      .map((comment) => ({
        id: comment.id,
        type: 'comment',
        title: comment.message,
        actorName: comment.author,
        actorId: comment.authorId ?? null,
        createdAt: comment.createdAt,
        routeName: `/posts/${comment.postId}`,
      }));

    return [...postMentions, ...commentMentions].sort((left, right) =>
      `${right.createdAt}`.localeCompare(`${left.createdAt}`),
    );
  }

  async getCreatorDashboard(userId: string) {
    const [analytics, user] = await Promise.all([
      this.accountStateDatabase.getCreatorAnalytics(userId),
      this.coreDatabase.getUser(userId),
    ]);

    return {
      metrics: [
        { label: 'Posts', value: String(analytics.totals.posts) },
        { label: 'Reels', value: String(analytics.totals.reels) },
        { label: 'Story views', value: String(analytics.totals.stories) },
      ],
      analytics,
      creator: {
        id: user.id,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        role: user.role,
      },
    };
  }

  async getBusinessProfile(userId: string) {
    const user = await this.coreDatabase.getUser(userId);
    return {
      companyName: user.name,
      category: user.role,
      about: user.bio,
      highlights: [
        `${user.followers} followers`,
        user.emailVerified ? 'Verified account' : 'Verification pending',
        user.walletSummary,
      ],
    };
  }

  async getSellerProfile(userId: string) {
    const user = await this.coreDatabase.getUser(userId);
    const products = await this.experienceDatabase.getMarketplaceOverview({
      sellerId: user.id,
      limit: 50,
    });
    return {
      storeName: user.name,
      rating: 4.8,
      totalListings: products.products.length,
      conversionSummary: `${products.orders.length} recent orders`,
    };
  }

  async getRecruiterProfile(userId: string) {
    const user = await this.coreDatabase.getUser(userId);
    return this.experienceDatabase.getEmployerProfile(user.id);
  }

  private flattenComments(
    comments: Array<{
      id: string;
      postId: string;
      authorId?: string | null;
      author: string;
      message: string;
      createdAt: string;
      mentions?: string[];
      replies: any[];
    }>,
    postId: string,
  ) {
    const results: Array<{
      id: string;
      postId: string;
      authorId?: string | null;
      author: string;
      message: string;
      createdAt: string;
      mentions?: string[];
    }> = [];
    const stack = comments.map((comment) => ({ ...comment, postId }));
    while (stack.length > 0) {
      const next = stack.shift();
      if (!next) {
        continue;
      }
      results.push(next);
      stack.push(...(next.replies ?? []).map((reply) => ({ ...reply, postId })));
    }
    return results;
  }

  private readStringArray(value: unknown) {
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : [];
  }

  private firstString(value: unknown) {
    return Array.isArray(value)
      ? value.find((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : undefined;
  }
}
