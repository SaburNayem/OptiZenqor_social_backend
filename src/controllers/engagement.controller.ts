import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EcosystemDataService } from '../data/ecosystem-data.service';

@ApiTags('engagement')
@Controller()
export class EngagementController {
  constructor(private readonly ecosystemData: EcosystemDataService) {}

  @Get('invite-referral')
  getReferral() {
    return this.ecosystemData.getReferral();
  }

  @Get('premium-membership')
  getPremiumPlans() {
    return this.ecosystemData.getPremiumPlans();
  }

  @Get('wallet-payments')
  getWallet() {
    return this.ecosystemData.getWallet();
  }

  @Get('subscriptions')
  getSubscriptions() {
    return this.ecosystemData.getSubscriptionPlans();
  }
}
