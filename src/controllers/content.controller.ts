import { Controller, Get, Headers, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { CoreDatabaseService } from '../services/core-database.service';
import { successResponse } from '../utils/api-response.util';

@ApiTags('feed')
@Controller()
export class ContentController {
  constructor(private readonly coreDatabase: CoreDatabaseService) {}

  @Get('feed')
  @ApiQuery({ name: 'viewerId', required: false })
  async getFeed(
    @Query('viewerId') viewerId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return successResponse(
      'Feed fetched successfully.',
      await this.coreDatabase.getFeed(await this.resolveViewerId(viewerId, authorization)),
    );
  }

  @Get('feed/home')
  @ApiQuery({ name: 'viewerId', required: false })
  async getHomeFeed(
    @Query('viewerId') viewerId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return successResponse(
      'Feed fetched successfully.',
      await this.coreDatabase.getFeed(await this.resolveViewerId(viewerId, authorization)),
    );
  }

  private async resolveViewerId(viewerId?: string, authorization?: string) {
    if (viewerId?.trim()) {
      return viewerId.trim();
    }
    const user = await this.coreDatabase
      .requireUserFromAuthorization(authorization)
      .catch(() => null);
    return user?.id ?? null;
  }
}
