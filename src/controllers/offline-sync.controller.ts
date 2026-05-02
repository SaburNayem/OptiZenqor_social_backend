import { Controller, Get, Headers, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppUtilityDatabaseService } from '../services/app-utility-database.service';
import { successResponse } from '../utils/api-response.util';

@ApiTags('offline-sync')
@Controller('offline-sync')
export class OfflineSyncController {
  constructor(private readonly appUtilityDatabase: AppUtilityDatabaseService) {}

  @Get()
  async getOfflineSync(@Headers('authorization') authorization?: string) {
    return successResponse(
      'Offline sync state fetched successfully.',
      await this.appUtilityDatabase.getOfflineSync(authorization),
    );
  }

  @Post('retry')
  async retryOfflineSync(@Headers('authorization') authorization?: string) {
    return successResponse(
      'Offline sync retried successfully.',
      await this.appUtilityDatabase.retryOfflineSync(authorization),
    );
  }
}
