import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MonetizationDatabaseService } from '../services/monetization-database.service';

@ApiTags('premium-plans')
@Controller('premium-plans')
export class PremiumPlansController {
  constructor(private readonly monetizationDatabase: MonetizationDatabaseService) {}

  @Get()
  async getPremiumPlans() {
    return {
      success: true,
      message: 'Premium plans fetched successfully.',
      data: await this.monetizationDatabase.getPremiumPlans(),
    };
  }
}
