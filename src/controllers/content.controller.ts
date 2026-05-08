import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CoreDatabaseService } from '../services/core-database.service';
import { successResponse } from '../utils/api-response.util';

@ApiTags('feed')
@Controller()
export class ContentController {
  constructor(private readonly coreDatabase: CoreDatabaseService) {}

  @Get('feed')
  async getFeed() {
    return successResponse(
      'Feed fetched successfully.',
      await this.coreDatabase.getFeed(),
    );
  }

  @Get('feed/home')
  async getHomeFeed() {
    return successResponse(
      'Feed fetched successfully.',
      await this.coreDatabase.getFeed(),
    );
  }
}
