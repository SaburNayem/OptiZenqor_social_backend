import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppExtensionsDataService } from '../data/app-extensions-data.service';
import { ToggleInterestDto } from '../dto/api.dto';

@ApiTags('personalization-onboarding')
@Controller('personalization-onboarding')
export class PersonalizationOnboardingController {
  constructor(private readonly appExtensionsData: AppExtensionsDataService) {}

  @Get()
  getPersonalizationOnboarding() {
    return this.appExtensionsData.getPersonalizationOnboarding();
  }

  @Patch('interests')
  toggleInterest(@Body() body: ToggleInterestDto) {
    return this.appExtensionsData.toggleInterest(body.name);
  }
}
