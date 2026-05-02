import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppUtilityDatabaseService } from '../services/app-utility-database.service';
import { successResponse } from '../utils/api-response.util';

@ApiTags('app-update-flow')
@Controller('app-update-flow')
export class AppUpdateFlowController {
  constructor(private readonly appUtilityDatabase: AppUtilityDatabaseService) {}

  @Get()
  async getAppUpdateFlow() {
    return successResponse(
      'App update flow fetched successfully.',
      await this.appUtilityDatabase.getAppUpdateFlow(),
    );
  }

  @Post('start')
  async startUpdate() {
    return successResponse(
      'App update flow started successfully.',
      await this.appUtilityDatabase.startAppUpdate(),
    );
  }
}
