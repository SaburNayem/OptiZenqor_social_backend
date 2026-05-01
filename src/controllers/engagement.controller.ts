import { Body, Controller, Get, Headers, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { ChangeSubscriptionPlanDto, ManageSubscriptionDto } from '../dto/api.dto';
import { AppUtilityDatabaseService } from '../services/app-utility-database.service';
import { CoreDatabaseService } from '../services/core-database.service';
import { MonetizationDatabaseService } from '../services/monetization-database.service';
import { successResponse } from '../utils/api-response.util';

@ApiTags('engagement')
@Controller()
export class EngagementController {
  constructor(
    private readonly appUtilityDatabase: AppUtilityDatabaseService,
    private readonly coreDatabase: CoreDatabaseService,
    private readonly monetizationDatabase: MonetizationDatabaseService,
  ) {}

  @Get('invite-referral')
  @UseGuards(SessionAuthGuard)
  async getReferral(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Invite referral fetched successfully.',
      await this.appUtilityDatabase.getReferralOverview(user.id),
    );
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

  @UseGuards(SessionAuthGuard)
  @Post('subscriptions/change-plan')
  async changeSubscriptionPlan(
    @Body() body: ChangeSubscriptionPlanDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return {
      success: true,
      message: 'Subscription plan changed successfully.',
      data: await this.monetizationDatabase.changeSubscriptionPlan(user.id, body.planId),
    };
  }

  @UseGuards(SessionAuthGuard)
  @Post('subscriptions/cancel')
  async cancelSubscription(
    @Body() body: ManageSubscriptionDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return {
      success: true,
      message: 'Subscription cancelled successfully.',
      data: await this.monetizationDatabase.cancelSubscription(user.id, body.subscriptionId),
    };
  }

  @UseGuards(SessionAuthGuard)
  @Post('subscriptions/renew')
  async renewSubscription(
    @Body() body: ManageSubscriptionDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return {
      success: true,
      message: 'Subscription renewed successfully.',
      data: await this.monetizationDatabase.renewSubscription(user.id, body.subscriptionId),
    };
  }
}
