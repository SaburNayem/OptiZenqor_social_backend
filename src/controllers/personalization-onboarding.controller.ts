import { Body, Controller, Get, Headers, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ToggleInterestDto } from '../dto/api.dto';
import { AppUtilityDatabaseService } from '../services/app-utility-database.service';
import { successResponse } from '../utils/api-response.util';

@ApiTags('personalization-onboarding')
@Controller('personalization-onboarding')
export class PersonalizationOnboardingController {
  constructor(private readonly appUtilityDatabase: AppUtilityDatabaseService) {}

  @Get()
  async getPersonalizationOnboarding(@Headers('authorization') authorization?: string) {
    return successResponse(
      'Personalization onboarding fetched successfully.',
      await this.appUtilityDatabase.getPersonalizationOnboarding(authorization),
    );
  }

  @Patch('interests')
  async toggleInterest(
    @Body() body: ToggleInterestDto,
    @Headers('authorization') authorization?: string,
  ) {
    return successResponse(
      'Personalization interest updated successfully.',
      await this.appUtilityDatabase.togglePersonalizationInterest(
        body.name,
        authorization,
      ),
    );
  }
}
