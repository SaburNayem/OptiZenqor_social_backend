import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EcosystemDataService } from '../data/ecosystem-data.service';

@ApiTags('premium-plans')
@Controller('premium-plans')
export class PremiumPlansController {
  constructor(private readonly ecosystemData: EcosystemDataService) {}

  @Get()
  getPremiumPlans() {
    return this.ecosystemData.getPremiumPlans();
  }
}
