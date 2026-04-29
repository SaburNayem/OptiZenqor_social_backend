import { Controller, Get, Headers, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EcosystemDataService } from '../data/ecosystem-data.service';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { CoreDatabaseService } from '../services/core-database.service';
import { MonetizationDatabaseService } from '../services/monetization-database.service';

@ApiTags('engagement')
@Controller()
export class EngagementController {
  constructor(
    private readonly ecosystemData: EcosystemDataService,
    private readonly coreDatabase: CoreDatabaseService,
    private readonly monetizationDatabase: MonetizationDatabaseService,
  ) {}

  @Get('invite-referral')
  getReferral() {
    return this.ecosystemData.getReferral();
  }

  @Get('premium-membership')
  async getPremiumPlans() {
    return {
      success: true,
      message: 'Premium membership fetched successfully.',
      data: await this.monetizationDatabase.getPremiumPlans(),
    };
  }

  @Get('premium')
  async getPremiumAlias() {
    return {
      success: true,
      message: 'Premium membership fetched successfully.',
      data: await this.monetizationDatabase.getPremiumPlans(),
    };
  }

  @UseGuards(SessionAuthGuard)
  @Get('wallet-payments')
  async getWallet(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return {
      success: true,
      message: 'Wallet payments fetched successfully.',
      data: await this.monetizationDatabase.getWallet(user.id),
    };
  }

  @UseGuards(SessionAuthGuard)
  @Get('subscriptions')
  async getSubscriptions(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return {
      success: true,
      message: 'Subscriptions fetched successfully.',
      data: await this.monetizationDatabase.getSubscriptions(user.id),
    };
  }
}
