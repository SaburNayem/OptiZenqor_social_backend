import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CoreDatabaseService } from './core-database.service';
import { ExperienceDatabaseService } from './experience-database.service';
import { PrismaService } from './prisma.service';

@Injectable()
export class DiscoveryDatabaseService {
  constructor(
    private readonly coreDatabase: CoreDatabaseService,
    private readonly experienceDatabase: ExperienceDatabaseService,
    private readonly prisma: PrismaService,
  ) {}

  async getHashtags(limit = 20) {
    await this.refreshHashtagEntries(limit);
    const rows = await this.prisma.discoveryHashtagEntry.findMany({
      orderBy: [{ score: 'desc' }, { updatedAt: 'desc' }],
      take: limit,
    });
    return rows.map((row) => ({
      tag: row.displayTag,
      count: row.count,
      score: row.score,
      updatedAt: row.updatedAt.toISOString(),
    }));
  }

  async getTrending(limit = 20) {
    await this.refreshTrendingEntries(limit);
    const rows = await this.prisma.discoveryTrendingEntry.findMany({
      orderBy: [{ score: 'desc' }, { updatedAt: 'desc' }],
      take: limit,
    });
    return rows.map((row) => ({
      id: row.entityId,
      title: row.title,
      type: row.entityType,
      score: row.score,
      payload: row.payload,
      updatedAt: row.updatedAt.toISOString(),
    }));
  }

  async refreshHashtagEntries(limit = 20) {
    const feed = await this.coreDatabase.getFeed();
    const counts = new Map<string, number>();

    for (const post of feed) {
      for (const tag of this.readStringArray(post.tags)) {
        const normalized = tag.trim().replace(/^#/, '');
        if (!normalized) {
          continue;
        }
        const key = normalized.toLowerCase();
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }

    const rows = [...counts.entries()]
      .map(([tag, count]) => ({
        tag,
        displayTag: `#${tag}`,
        count,
        score: Number(count),
        payload: { tag: `#${tag}`, count },
      }))
      .sort((left, right) => right.count - left.count || left.tag.localeCompare(right.tag))
      .slice(0, limit);

    await this.prisma.$transaction([
      this.prisma.discoveryHashtagEntry.deleteMany(),
      ...rows.map((row) =>
        this.prisma.discoveryHashtagEntry.create({
          data: {
            tag: row.tag,
            displayTag: row.displayTag,
            count: row.count,
            score: row.score,
            payload: row.payload as Prisma.InputJsonValue,
          },
        }),
      ),
    ]);

    return rows;
  }

  async refreshTrendingEntries(limit = 20) {
    const [feed, jobsPayload, communitiesPayload, pagesPayload, eventsPayload, marketplacePayload] =
      await Promise.all([
        this.coreDatabase.getFeed(),
        this.experienceDatabase.getJobs({ limit }),
        this.experienceDatabase.getCommunities({ limit }),
        this.experienceDatabase.getPages({ limit }),
        this.experienceDatabase.getEvents({ limit }),
        this.experienceDatabase.getMarketplaceOverview({ limit }),
      ]);

    const items = [
      ...feed.map((post) => ({
        id: String(post.id ?? post.caption ?? ''),
        title: post.caption || `Post by ${post.author?.name ?? 'Unknown'}`,
        type: 'post',
        score: Number(post.views ?? 0) + Number(post.likes ?? 0) * 2 + Number(post.comments ?? 0) * 3,
        payload: post,
      })),
      ...jobsPayload.jobs.map((job) => ({
        id: String(job.id ?? job.title ?? ''),
        title: job.title,
        type: 'job',
        score: this.readNumber(job.skills?.length, 0) * 5 + (job.featured ? 25 : 0),
        payload: job,
      })),
      ...communitiesPayload.communities.map((community) => ({
        id: String(community.id ?? community.name ?? ''),
        title: community.name,
        type: 'community',
        score: Number(community.memberCount ?? 0),
        payload: community,
      })),
      ...pagesPayload.pages.map((page) => ({
        id: String(page.id ?? page.name ?? ''),
        title: page.name,
        type: 'page',
        score: Number(page.followerCount ?? 0),
        payload: page,
      })),
      ...eventsPayload.events.map((event) => ({
        id: String(event.id ?? event.title ?? ''),
        title: event.title,
        type: 'event',
        score: Number(event.participants ?? 0) + Number(event.savedCount ?? 0) * 2,
        payload: event,
      })),
      ...marketplacePayload.products.map((product) => ({
        id: String(product.id ?? product.title ?? ''),
        title: product.title,
        type: 'marketplace',
        score: Number(product.watchers ?? 0) * 2 + Number(product.views ?? 0),
        payload: product,
      })),
    ];

    const rows = items
      .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title))
      .slice(0, limit);

    await this.prisma.$transaction([
      this.prisma.discoveryTrendingEntry.deleteMany(),
      ...rows.map((row) =>
        this.prisma.discoveryTrendingEntry.create({
          data: {
            id: `${row.type}:${row.id}`,
            entityType: row.type,
            entityId: row.id,
            title: row.title,
            score: row.score,
            payload: row.payload as Prisma.InputJsonValue,
          },
        }),
      ),
    ]);

    return rows;
  }

  async buildGlobalSearch(query?: string, limitQuery?: string) {
    const q = (query ?? '').trim();
    const normalized = q.toLowerCase();
    const limit = this.readLimit(limitQuery);
    const matchesQuery = (...values: unknown[]) => {
      if (!normalized) {
        return true;
      }
      return values
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .filter((value): value is string | number | boolean => ['string', 'number', 'boolean'].includes(typeof value))
        .some((value) => String(value).toLowerCase().includes(normalized));
    };

    const [
      users,
      posts,
      jobsPayload,
      pagesPayload,
      communitiesPayload,
      marketplacePayload,
      eventsPayload,
      hashtags,
    ] = await Promise.all([
      this.coreDatabase.getUsers(),
      this.coreDatabase.getFeed(),
      this.experienceDatabase.getJobs({ search: q || undefined, limit }),
      this.experienceDatabase.getPages({ search: q || undefined, limit }),
      this.experienceDatabase.getCommunities({ search: q || undefined, limit }),
      this.experienceDatabase.getMarketplaceOverview({ search: q || undefined, limit }),
      this.experienceDatabase.getEvents({ search: q || undefined, limit }),
      this.getHashtags(limit),
    ]);

    const matchedUsers = users
      .filter((user) => matchesQuery(user.name, user.username, user.email, user.bio, user.role))
      .slice(0, limit);
    const matchedPosts = posts
      .filter((post) =>
        matchesQuery(post.caption, post.tags, post.author?.name, post.author?.username, post.status, post.type),
      )
      .slice(0, limit);
    const matchedJobs = jobsPayload.jobs.slice(0, limit);
    const matchedPages = pagesPayload.pages.slice(0, limit);
    const matchedCommunities = communitiesPayload.communities.slice(0, limit);
    const matchedProducts = marketplacePayload.products.slice(0, limit);
    const matchedEvents = eventsPayload.events.slice(0, limit);
    const matchedHashtags = hashtags.filter((item) => matchesQuery(item.tag)).slice(0, limit);

    const postItems = this.toSearchItems('post', matchedPosts, 'caption');
    const peopleItems = this.toSearchItems('people', matchedUsers, 'name');
    const jobItems = this.toSearchItems('job', matchedJobs, 'title');
    const pageItems = this.toSearchItems('page', matchedPages, 'name');
    const communityItems = this.toSearchItems('community', matchedCommunities, 'name');
    const productItems = this.toSearchItems('marketplace', matchedProducts, 'title');
    const eventItems = this.toSearchItems('event', matchedEvents, 'title');
    const hashtagItems = this.toSearchItems('hashtag', matchedHashtags, 'tag');

    const sections = {
      all: [
        ...postItems,
        ...peopleItems,
        ...jobItems,
        ...pageItems,
        ...communityItems,
        ...productItems,
        ...eventItems,
        ...hashtagItems,
      ],
      posts: postItems,
      feed: postItems,
      people: peopleItems,
      users: peopleItems,
      jobs: jobItems,
      pages: pageItems,
      communities: communityItems,
      marketplace: productItems,
      products: productItems,
      events: eventItems,
      hashtags: hashtagItems,
    };

    return {
      success: true,
      query: q,
      count: sections.all.length,
      sections,
      results: sections,
      items: sections.all,
      data: sections,
    };
  }

  async getSearchDiscovery(query?: string, limitQuery?: string) {
    const search = await this.buildGlobalSearch(query, limitQuery);
    return {
      query: query ?? '',
      results: search.results,
      sections: search.sections,
      count: search.count,
      trending: await this.getTrending(this.readLimit(limitQuery)),
      hashtags: await this.getHashtags(this.readLimit(limitQuery)),
    };
  }

  private readLimit(value?: string) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return 20;
    }
    return Math.min(Math.floor(parsed), 100);
  }

  private toSearchItems(type: string, items: object[], titleKey: string) {
    return items.map((item) => this.toSearchItem(type, item, titleKey));
  }

  private toSearchItem(type: string, item: object, titleKey: string) {
    const id =
      this.readStringItemValue(item, 'id') ??
      this.readStringItemValue(item, 'tag') ??
      this.readStringItemValue(item, titleKey);
    const title =
      this.readStringItemValue(item, titleKey) ??
      this.readStringItemValue(item, 'name') ??
      this.readStringItemValue(item, 'title') ??
      this.readStringItemValue(item, 'username') ??
      this.readStringItemValue(item, 'tag') ??
      id ??
      type;
    const name =
      this.readStringItemValue(item, 'name') ??
      this.readStringItemValue(item, 'username') ??
      this.readStringItemValue(item, 'sellerName') ??
      this.readStringItemValue(item, 'organizer');
    const caption = this.readStringItemValue(item, 'caption') ?? (type === 'post' ? title : undefined);
    const description =
      this.readStringItemValue(item, 'description') ??
      this.readStringItemValue(item, 'about') ??
      this.readStringItemValue(item, 'bio') ??
      this.readStringItemValue(item, 'location') ??
      this.readStringItemValue(item, 'company') ??
      this.readStringItemValue(item, 'category');
    const avatar =
      this.readStringItemValue(item, 'avatar') ??
      this.readStringItemValue(item, 'avatarUrl') ??
      this.readStringItemValue(item, 'logoUrl');
    const imageUrl =
      this.firstStringItemValue(item, 'media') ??
      this.firstStringItemValue(item, 'images') ??
      this.firstStringItemValue(item, 'mediaGallery') ??
      this.readStringItemValue(item, 'coverUrl') ??
      this.readStringItemValue(item, 'thumbnail') ??
      this.readStringItemValue(item, 'imageUrl') ??
      avatar;
    const thumbnail = this.readStringItemValue(item, 'thumbnail') ?? this.readStringItemValue(item, 'coverUrl') ?? imageUrl;

    return {
      id,
      title,
      name,
      caption,
      description,
      imageUrl,
      thumbnail,
      avatar,
      type,
      item,
    };
  }

  private readItemValue(item: object, key: string) {
    return (item as Record<string, unknown>)[key];
  }

  private readStringItemValue(item: object, key: string) {
    const value = this.readItemValue(item, key);
    return typeof value === 'string' && value.trim() ? value : undefined;
  }

  private firstStringItemValue(item: object, key: string) {
    const value = this.readItemValue(item, key);
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
    if (!Array.isArray(value)) {
      return undefined;
    }
    return value.find((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0);
  }

  private readStringArray(value: unknown) {
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : [];
  }

  private readNumber(value: unknown, fallback = 0) {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  }
}
