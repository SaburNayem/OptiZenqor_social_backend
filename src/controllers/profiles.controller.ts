import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EcosystemDataService } from '../data/ecosystem-data.service';
import { PlatformDataService } from '../data/platform-data.service';

@ApiTags('profiles')
@Controller()
export class ProfilesController {
  constructor(
    private readonly platformData: PlatformDataService,
    private readonly ecosystemData: EcosystemDataService,
  ) {}

  @Get('profile/:id')
  getProfile(@Param('id') id: string) {
    return this.platformData.getUser(id);
  }

  @Get('user-profile/:id')
  getUserProfile(@Param('id') id: string) {
    return this.platformData.getUser(id);
  }

  @Get('follow-unfollow/:id/followers')
  getFollowFeatureFollowers(@Param('id') id: string) {
    return this.platformData.getFollowers(id);
  }

  @Get('follow-unfollow/:id/following')
  getFollowFeatureFollowing(@Param('id') id: string) {
    return this.platformData.getFollowing(id);
  }

  @Get('creator-dashboard')
  getCreatorDashboard() {
    return this.ecosystemData.getProfessionalProfiles().creatorTools;
  }

  @Get('business-profile')
  getBusinessProfile() {
    return this.ecosystemData.getProfessionalProfiles().businessProfile;
  }

  @Get('seller-profile')
  getSellerProfile() {
    return this.ecosystemData.getProfessionalProfiles().sellerProfile;
  }

  @Get('recruiter-profile')
  getRecruiterProfile() {
    return this.ecosystemData.getProfessionalProfiles().recruiterProfile;
  }
}
