import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PlatformDataService } from '../data/platform-data.service';

@ApiTags('monetization')
@Controller('monetization')
export class MonetizationController {
  constructor(private readonly platformData: PlatformDataService) {}

  @Get('overview')
  getOverview() {
    return {
      walletTransactions: this.platformData.getWalletTransactions(),
      subscriptions: this.platformData.getSubscriptions(),
      plans: this.platformData.getPlans(),
    };
  }

  @Get('wallet')
  getWalletTransactions() {
    return this.platformData.getWalletTransactions();
  }

  @Get('subscriptions')
  getSubscriptions() {
    return this.platformData.getSubscriptions();
  }

  @Get('plans')
  getPlans() {
    return this.platformData.getPlans();
  }
}
