import { Controller, Delete, Get, Headers, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { AppExtensionsDatabaseService } from '../services/app-extensions-database.service';
import { CoreDatabaseService } from '../services/core-database.service';

@ApiTags('activity-sessions')
@Controller('activity-sessions')
export class ActivitySessionsController {
  constructor(
    private readonly appExtensionsDatabase: AppExtensionsDatabaseService,
    private readonly coreDatabase: CoreDatabaseService,
  ) {}

  @UseGuards(SessionAuthGuard)
  @Get()
  async getActivitySessions(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return this.appExtensionsDatabase.getActivitySessions(user.id, authorization);
  }

  @UseGuards(SessionAuthGuard)
  @Get('history')
  async getActivityHistory(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    const history = await this.appExtensionsDatabase.getActivityHistory(user.id);
    return {
      success: true,
      history,
      items: history,
      data: history,
    };
  }

  @UseGuards(SessionAuthGuard)
  @Post('logout-others')
  async logoutOtherDevices(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return this.appExtensionsDatabase.logoutOtherDevices(user.id, authorization);
  }

  @UseGuards(SessionAuthGuard)
  @Delete(':id')
  async revokeSession(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return this.appExtensionsDatabase.revokeSession(user.id, id, authorization);
  }
}
