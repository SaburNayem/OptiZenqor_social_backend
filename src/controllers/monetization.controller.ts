import { Controller, Get, Headers, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { CoreDatabaseService } from '../services/core-database.service';
import { MonetizationDatabaseService } from '../services/monetization-database.service';

@ApiTags('monetization')
@Controller('monetization')
@UseGuards(SessionAuthGuard)
export class MonetizationController {
  constructor(
    private readonly coreDatabase: CoreDatabaseService,
    private readonly monetizationDatabase: MonetizationDatabaseService,
  ) {}

  @Get('overview')
  async getOverview(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return {
      success: true,
      message: 'Monetization overview fetched successfully.',
      data: {
        wallet: await this.monetizationDatabase.getWallet(user.id),
        subscriptions: await this.monetizationDatabase.getSubscriptions(user.id),
        plans: await this.monetizationDatabase.getPremiumPlans(),
      },
    };
  }

  @Get('wallet')
  async getWalletTransactions(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return {
      success: true,
      message: 'Wallet transactions fetched successfully.',
      data: await this.monetizationDatabase.getWalletTransactions(user.id),
    };
  }

  @Get('subscriptions')
  async getSubscriptions(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return {
      success: true,
      message: 'Subscriptions fetched successfully.',
      data: await this.monetizationDatabase.getSubscriptions(user.id),
    };
  }

  @Get('plans')
  async getPlans() {
    return {
      success: true,
      message: 'Premium plans fetched successfully.',
      data: await this.monetizationDatabase.getPremiumPlans(),
    };
  }
}
