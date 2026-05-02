import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppUtilityDatabaseService } from '../services/app-utility-database.service';
import { successResponse } from '../utils/api-response.util';

@ApiTags('maintenance-mode')
@Controller('maintenance-mode')
export class MaintenanceModeController {
  constructor(private readonly appUtilityDatabase: AppUtilityDatabaseService) {}

  @Get()
  async getMaintenanceMode() {
    return successResponse(
      'Maintenance mode fetched successfully.',
      await this.appUtilityDatabase.getMaintenanceMode(),
    );
  }

  @Post('retry')
  async retryMaintenance() {
    return successResponse(
      'Maintenance retry completed successfully.',
      await this.appUtilityDatabase.retryMaintenance(),
    );
  }
}
