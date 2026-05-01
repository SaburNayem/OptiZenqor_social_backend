import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Headers, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { AppUtilityDatabaseService } from '../services/app-utility-database.service';
import { CoreDatabaseService } from '../services/core-database.service';
import { successResponse } from '../utils/api-response.util';

@ApiTags('invite-friends')
@Controller('invite-friends')
export class InviteFriendsController {
  constructor(
    private readonly appUtilityDatabase: AppUtilityDatabaseService,
    private readonly coreDatabase: CoreDatabaseService,
  ) {}

  @Get()
  @UseGuards(SessionAuthGuard)
  async getInviteFriends(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Invite friends fetched successfully.',
      await this.appUtilityDatabase.getReferralOverview(user.id),
    );
  }
}
