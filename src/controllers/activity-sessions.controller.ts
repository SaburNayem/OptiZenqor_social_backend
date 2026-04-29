import { Controller, Delete, Get, Headers, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { AppExtensionsDatabaseService } from '../services/app-extensions-database.service';

@ApiTags('activity-sessions')
@Controller('activity-sessions')
export class ActivitySessionsController {
  constructor(private readonly appExtensionsDatabase: AppExtensionsDatabaseService) {}

  @UseGuards(SessionAuthGuard)
  @Get()
  async getActivitySessions(
    @Headers('authorization') authorization: string | undefined,
    @CurrentUser() user: { id: string },
  ) {
    return this.appExtensionsDatabase.getActivitySessions(user.id, authorization);
  }

  @UseGuards(SessionAuthGuard)
  @Get('history')
  async getActivityHistory(@CurrentUser() user: { id: string }) {
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
  async logoutOtherDevices(
    @Headers('authorization') authorization: string | undefined,
    @CurrentUser() user: { id: string },
  ) {
    return this.appExtensionsDatabase.logoutOtherDevices(user.id, authorization);
  }

  @UseGuards(SessionAuthGuard)
  @Delete(':id')
  async revokeSession(
    @Param('id') id: string,
    @Headers('authorization') authorization: string | undefined,
    @CurrentUser() user: { id: string },
  ) {
    return this.appExtensionsDatabase.revokeSession(user.id, id, authorization);
  }
}
