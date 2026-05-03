import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CoreDatabaseService } from '../services/core-database.service';
import { compatibilityListResponse } from '../utils/api-response.util';

@ApiTags('feed')
@Controller()
export class ContentController {
  constructor(private readonly coreDatabase: CoreDatabaseService) {}

  @Get('feed')
  async getFeed() {
    return this.wrapFeedResponse(
      'Feed fetched successfully.',
      await this.coreDatabase.getFeed(),
    );
  }

  @Get('feed/home')
  async getHomeFeed() {
    return this.wrapFeedResponse(
      'Feed fetched successfully.',
      await this.coreDatabase.getFeed(),
    );
  }

  private wrapFeedResponse(message: string, items: unknown[]) {
    return compatibilityListResponse(message, items, {
      aliases: {
      items,
      results: items,
      count: items.length,
      },
    });
  }
}
