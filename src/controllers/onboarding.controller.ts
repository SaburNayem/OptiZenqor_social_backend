import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CompleteOnboardingDto } from '../dto/api.dto';
import { AppUtilityDatabaseService } from '../services/app-utility-database.service';
import { successResponse } from '../utils/api-response.util';

@ApiTags('onboarding')
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly appUtilityDatabase: AppUtilityDatabaseService) {}

  @Get('slides')
  async getSlides() {
    return successResponse(
      'Onboarding slides fetched successfully.',
      await this.appUtilityDatabase.getOnboardingSlides(),
    );
  }

  @Get('state')
  async getState(@Headers('authorization') authorization?: string) {
    return successResponse(
      'Onboarding state fetched successfully.',
      await this.appUtilityDatabase.getOnboardingState(authorization),
    );
  }

  @Get('interests')
  async getInterests() {
    const interests = await this.appUtilityDatabase.getOnboardingInterests();
    return successResponse('Onboarding interests fetched successfully.', interests);
  }

  @Post('complete')
  async complete(
    @Body() body: CompleteOnboardingDto,
    @Headers('authorization') authorization?: string,
  ) {
    return successResponse(
      'Onboarding completed successfully.',
      await this.appUtilityDatabase.completeOnboarding(
        body.selectedInterests ?? [],
        authorization,
      ),
    );
  }
}
