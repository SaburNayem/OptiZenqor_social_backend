import { Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppExtensionsDataService } from '../data/app-extensions-data.service';

@ApiTags('activity-sessions')
@Controller('activity-sessions')
export class ActivitySessionsController {
  constructor(private readonly appExtensionsData: AppExtensionsDataService) {}

  @Get()
  getActivitySessions() {
    return this.appExtensionsData.getActivitySessions();
  }

  @Get('history')
  getActivityHistory() {
    return this.appExtensionsData.getActivitySessions().activities;
  }

  @Post('logout-others')
  logoutOtherDevices() {
    return this.appExtensionsData.logoutOtherDevices();
  }

  @Delete(':id')
  revokeSession(@Param('id') id: string) {
    return this.appExtensionsData.revokeSession(id);
  }
}
