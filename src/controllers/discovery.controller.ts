import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import {
  CreateSavedCollectionDto,
  RefreshDiscoveryDatasetDto,
  UpdateSavedCollectionDto,
} from '../dto/api.dto';
import { AccountStateDatabaseService } from '../services/account-state-database.service';
import { CoreDatabaseService } from '../services/core-database.service';
import { DiscoveryDatabaseService } from '../services/discovery-database.service';
import { successResponse } from '../utils/api-response.util';

@ApiTags('discovery')
@Controller()
export class DiscoveryController {
  constructor(
    private readonly discoveryDatabase: DiscoveryDatabaseService,
    private readonly coreDatabase: CoreDatabaseService,
    private readonly accountStateDatabase: AccountStateDatabaseService,
  ) {}

  @Get('hashtags')
  async getHashtags() {
    const hashtags = await this.discoveryDatabase.getHashtags();
    return successResponse('Hashtags fetched successfully.', hashtags, {
      total: hashtags.length,
      page: 1,
      limit: hashtags.length,
      hasNextPage: false,
      hasPreviousPage: false,
    });
  }

  @Get('trending')
  async getTrending() {
    const trending = await this.discoveryDatabase.getTrending();
    return successResponse('Trending items fetched successfully.', trending, {
      total: trending.length,
      page: 1,
      limit: trending.length,
      hasNextPage: false,
      hasPreviousPage: false,
    });
  }

  @Get('search')
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async search(@Query('q') q?: string, @Query('limit') limit?: string) {
    const result = await this.discoveryDatabase.buildGlobalSearch(q, limit);
    return {
      ...successResponse('Search results fetched successfully.', result.data, {
        total: result.count,
        page: 1,
        limit: result.items.length,
        hasNextPage: false,
        hasPreviousPage: false,
      }),
      query: result.query,
      count: result.count,
      sections: result.sections,
      results: result.results,
      items: result.items,
    };
  }

  @Get('global-search')
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getGlobalSearch(@Query('q') q?: string, @Query('limit') limit?: string) {
    const result = await this.discoveryDatabase.buildGlobalSearch(q, limit);
    return {
      ...successResponse('Search results fetched successfully.', result.data, {
        total: result.count,
        page: 1,
        limit: result.items.length,
        hasNextPage: false,
        hasPreviousPage: false,
      }),
      query: result.query,
      count: result.count,
      sections: result.sections,
      results: result.results,
      items: result.items,
    };
  }

  @Get('search-discovery')
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getSearchDiscovery(@Query('q') q?: string, @Query('limit') limit?: string) {
    const result = await this.discoveryDatabase.getSearchDiscovery(q, limit);
    return {
      ...successResponse('Search discovery fetched successfully.', result, {
        total: result.count,
        page: 1,
        limit: result.count,
        hasNextPage: false,
        hasPreviousPage: false,
      }),
      query: result.query,
      count: result.count,
      sections: result.sections,
      results: result.results,
      trending: result.trending,
      hashtags: result.hashtags,
    };
  }

  @Post('trending/refresh')
  @UseGuards(SessionAuthGuard)
  async refreshTrending(
    @Body() body: RefreshDiscoveryDatasetDto,
    @Headers('authorization') authorization?: string,
  ) {
    await this.coreDatabase.requireUserFromAuthorization(authorization);
    const entries = await this.discoveryDatabase.refreshTrendingEntries(body.limit ?? 20);
    return successResponse('Trending dataset refreshed successfully.', entries, {
      count: entries.length,
    });
  }

  @Post('hashtags/refresh')
  @UseGuards(SessionAuthGuard)
  async refreshHashtags(
    @Body() body: RefreshDiscoveryDatasetDto,
    @Headers('authorization') authorization?: string,
  ) {
    await this.coreDatabase.requireUserFromAuthorization(authorization);
    const entries = await this.discoveryDatabase.refreshHashtagEntries(body.limit ?? 20);
    return successResponse('Hashtag dataset refreshed successfully.', entries, {
      count: entries.length,
    });
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

}
