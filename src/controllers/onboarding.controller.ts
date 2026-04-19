import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ExtendedDataService } from '../data/extended-data.service';

@ApiTags('onboarding')
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly extendedData: ExtendedDataService) {}

  @Get('slides')
  getSlides() {
    return this.extendedData.getOnboardingSlides();
  }

  @Get('state')
  getState() {
    return this.extendedData.getOnboardingState();
  }

  @Get('interests')
  getInterests() {
    return this.extendedData.getInterests();
  }

  @Post('complete')
  complete(@Body() body: { selectedInterests?: string[] }) {
    return this.extendedData.completeOnboarding(body.selectedInterests ?? []);
  }
}
