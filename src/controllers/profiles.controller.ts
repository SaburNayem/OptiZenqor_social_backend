import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { EcosystemDataService } from '../data/ecosystem-data.service';
import { FollowUserDto, UpdateUserDto } from '../dto/api.dto';
import { CoreDatabaseService } from '../services/core-database.service';

@ApiTags('profiles')
@Controller()
export class ProfilesController {
  constructor(
    private readonly coreDatabase: CoreDatabaseService,
    private readonly ecosystemData: EcosystemDataService,
  ) {}

  private async buildProfilePayload(id: string) {
    const user = await this.coreDatabase.getUser(id);
    const posts = await this.coreDatabase.getPosts(id);

    return {
      user,
      stats: {
        followers: user.followers,
        following: user.following,
        posts: posts.length,
      },
      tabs: ['posts', 'reels', 'about', 'tagged'],
      links: [
        {
          label: 'Public profile',
          url: `https://optizenqor.app/${user.username}`,
        },
      ],
      recentPosts: posts.slice(0, 6),
      profilePreview: {
        badge: user.verification,
        role: user.role,
        health: user.health,
      },
    };
  }

  @Get('profile')
  @ApiQuery({ name: 'id', required: false })
  async getProfileOverview(@Query('id') id = 'u1') {
    return this.buildProfilePayload(id);
  }

  @Get('profile/:id')
  async getProfile(@Param('id') id: string) {
    return this.buildProfilePayload(id);
  }

  @Get('user-profile/edit')
  @ApiQuery({ name: 'id', required: false })
  async getUserProfileEditState(@Query('id') id = 'u1') {
    const user = await this.coreDatabase.getUser(id);
    return {
      user,
      editableFields: ['name', 'username', 'bio', 'avatar'],
      helpText: 'Update your profile basics, then save to refresh your public profile.',
    };
  }

  @Patch('user-profile/edit')
  async updateUserProfileAlias(@Body() body: UpdateUserDto & { id?: string }) {
    const { id = 'u1', ...patch } = body;
    return this.coreDatabase.updateUserProfile(id, patch);
  }

  @Get('user-profile')
  @ApiQuery({ name: 'id', required: false })
  async getUserProfile(@Query('id') id = 'u1') {
    return this.buildProfilePayload(id);
  }

  @Get('user-profile/followers')
  @ApiQuery({ name: 'id', required: false })
  async getUserProfileFollowers(@Query('id') id = 'u1') {
    return this.coreDatabase.getFollowers(id);
  }

  @Get('user-profile/following')
  @ApiQuery({ name: 'id', required: false })
  async getUserProfileFollowing(@Query('id') id = 'u1') {
    return this.coreDatabase.getFollowing(id);
  }

  @Get('user-profile/:id')
  async getUserProfileById(@Param('id') id: string) {
    return this.buildProfilePayload(id);
  }

  @Get('follow-unfollow/:id/followers')
  async getFollowFeatureFollowers(@Param('id') id: string) {
    return this.coreDatabase.getFollowers(id);
  }

  @Get('follow-unfollow/:id/following')
  async getFollowFeatureFollowing(@Param('id') id: string) {
    return this.coreDatabase.getFollowing(id);
  }

  @Patch('follow-unfollow/:id/follow')
  async followUserAlias(@Param('id') id: string, @Body() body: FollowUserDto) {
    return this.coreDatabase.followUser(id, body.followerId);
  }

  @Patch('follow-unfollow/:id/unfollow')
  async unfollowUserAlias(@Param('id') id: string, @Body() body: FollowUserDto) {
    return this.coreDatabase.unfollowUser(id, body.followerId);
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
