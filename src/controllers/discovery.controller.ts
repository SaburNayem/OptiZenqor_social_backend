import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { EcosystemDataService } from '../data/ecosystem-data.service';
import { PlatformDataService } from '../data/platform-data.service';
import { CreateSavedCollectionDto, UpdateSavedCollectionDto } from '../dto/api.dto';
import { AccountStateDatabaseService } from '../services/account-state-database.service';
import { CoreDatabaseService } from '../services/core-database.service';
import { successResponse } from '../utils/api-response.util';

@ApiTags('discovery')
@Controller()
export class DiscoveryController {
  constructor(
    private readonly ecosystemData: EcosystemDataService,
    private readonly platformData: PlatformDataService,
    private readonly coreDatabase: CoreDatabaseService,
    private readonly accountStateDatabase: AccountStateDatabaseService,
  ) {}

  @Get('hashtags')
  getHashtags() {
    return this.ecosystemData.getHashtags();
  }

  @Get('trending')
  getTrending() {
    return this.ecosystemData.getTrending();
  }

  @Get('search')
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async search(@Query('q') q?: string, @Query('limit') limit?: string) {
    return this.buildGlobalSearch(q, limit);
  }

  @Get('global-search')
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getGlobalSearch(@Query('q') q?: string, @Query('limit') limit?: string) {
    return this.buildGlobalSearch(q, limit);
  }

  @Get('search-discovery')
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getSearchDiscovery(@Query('q') q?: string, @Query('limit') limit?: string) {
    const search = await this.buildGlobalSearch(q, limit);
    return {
      query: q ?? '',
      results: search.results,
      sections: search.sections,
      count: search.count,
      trending: this.ecosystemData.getTrending(),
      hashtags: this.ecosystemData.getHashtags(),
    };
  }

  @Get('saved-collections')
  @UseGuards(SessionAuthGuard)
  async getCollections(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    const collections = await this.accountStateDatabase.getCollections(user.id);
    return successResponse('Saved collections fetched successfully.', {
      collections,
      items: collections,
      results: collections,
    });
  }

  @Get('saved-collections/:id')
  @UseGuards(SessionAuthGuard)
  async getCollection(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    const collection = await this.accountStateDatabase.getCollection(user.id, id);
    return successResponse('Saved collection fetched successfully.', {
      collection,
      item: collection,
      data: collection,
    });
  }

  @Post('saved-collections')
  @UseGuards(SessionAuthGuard)
  async createCollection(
    @Body()
    body: CreateSavedCollectionDto & {
      items?: Array<{ id?: string; name: string; itemIds?: string[]; privacy?: string }>;
    },
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    if (Array.isArray(body.items) && body.items.length > 0) {
      const collections = await this.accountStateDatabase.syncCollections(user.id, body.items);
      return successResponse('Saved collections synced successfully.', {
        collections,
        items: collections,
        results: collections,
      });
    }

    const collection = await this.accountStateDatabase.createCollection(user.id, {
      name: body.name,
      privacy: body.privacy,
      itemIds: body.itemIds,
    });
    return successResponse('Saved collection created successfully.', {
      collection,
      item: collection,
      data: collection,
    });
  }

  @Patch('saved-collections')
  @UseGuards(SessionAuthGuard)
  async addItemToCollection(
    @Body() body: { collectionId: string; itemId: string; itemIds?: string[] },
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    const collection = await this.accountStateDatabase.addItemsToCollection(user.id, body.collectionId, [
      ...(body.itemIds ?? []),
      body.itemId,
    ]);
    return successResponse('Saved collection updated successfully.', {
      collection,
      item: collection,
      data: collection,
    });
  }

  @Patch('saved-collections/:id')
  @UseGuards(SessionAuthGuard)
  async updateCollection(
    @Param('id') id: string,
    @Body() body: UpdateSavedCollectionDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    const collection = await this.accountStateDatabase.updateCollection(user.id, id, body);
    return successResponse('Saved collection updated successfully.', {
      collection,
      item: collection,
      data: collection,
    });
  }

  @Delete('saved-collections/:id')
  @UseGuards(SessionAuthGuard)
  async deleteCollection(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Saved collection deleted successfully.',
      await this.accountStateDatabase.deleteCollection(user.id, id),
    );
  }

  private async buildGlobalSearch(query?: string, limitQuery?: string) {
    const q = (query ?? '').trim();
    const normalized = q.toLowerCase();
    const limit = this.readLimit(limitQuery);
    const matchesQuery = (...values: unknown[]) => {
      if (!normalized) {
        return true;
      }
      return values
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .filter((value): value is string | number | boolean => {
          return ['string', 'number', 'boolean'].includes(typeof value);
        })
        .some((value) => String(value).toLowerCase().includes(normalized));
    };

    const users = (await this.coreDatabase.getUsers())
      .filter((user) =>
        matchesQuery(user.name, user.username, user.email, user.bio, user.role),
      )
      .slice(0, limit);

    const posts = (await this.coreDatabase.getFeed())
      .filter((post) =>
        matchesQuery(
          post.caption,
          post.tags,
          post.author?.name,
          post.author?.username,
          post.status,
          post.type,
        ),
      )
      .slice(0, limit);

    const jobs = this.ecosystemData
      .getJobs()
      .filter((job) =>
        matchesQuery(
          job.title,
          job.company,
          job.location,
          job.type,
          job.experienceLevel,
          job.skills,
          job.description,
        ),
      )
      .slice(0, limit);

    const pages = this.ecosystemData
      .getPages()
      .filter((page) =>
        matchesQuery(
          page.name,
          page.about,
          page.category,
          page.location,
          page.highlights,
        ),
      )
      .slice(0, limit);

    const communities = this.ecosystemData
      .getCommunities()
      .filter((community) =>
        matchesQuery(
          community.name,
          community.description,
          community.category,
          community.location,
          community.tags,
          community.recentActivity,
        ),
      )
      .slice(0, limit);

    const products = this.platformData
      .getProducts()
      .filter((product) =>
        matchesQuery(
          product.title,
          product.description,
          product.category,
          product.subcategory,
          product.sellerName,
          product.location,
          product.condition,
          product.listingStatus,
        ),
      )
      .slice(0, limit);

    const events = this.platformData
      .getEvents()
      .filter((event) =>
        matchesQuery(
          event.title,
          event.organizer,
          event.date,
          event.time,
          event.location,
          event.status,
          event.hostToolsSummary,
        ),
      )
      .slice(0, limit);

    const hashtags = this.ecosystemData
      .getHashtags()
      .filter((hashtag) => matchesQuery(hashtag.tag))
      .slice(0, limit);

    const postItems = this.toSearchItems('post', posts, 'caption');
    const peopleItems = this.toSearchItems('people', users, 'name');
    const jobItems = this.toSearchItems('job', jobs, 'title');
    const pageItems = this.toSearchItems('page', pages, 'name');
    const communityItems = this.toSearchItems('community', communities, 'name');
    const productItems = this.toSearchItems('marketplace', products, 'title');
    const eventItems = this.toSearchItems('event', events, 'title');
    const hashtagItems = this.toSearchItems('hashtag', hashtags, 'tag');

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
    const caption =
      this.readStringItemValue(item, 'caption') ??
      (type === 'post' ? title : undefined);
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
    const thumbnail =
      this.readStringItemValue(item, 'thumbnail') ??
      this.readStringItemValue(item, 'coverUrl') ??
      imageUrl;

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
    return value.find(
      (entry): entry is string => typeof entry === 'string' && entry.trim().length > 0,
    );
  }
}
