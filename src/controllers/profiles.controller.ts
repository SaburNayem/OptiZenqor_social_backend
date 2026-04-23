import { Body, Controller, Get, Headers, Param, Patch, Post, Query } from '@nestjs/common';
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
  async getProfileOverview(
    @Query('id') id?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.wrapProfileResponse(
      'Profile fetched successfully.',
      await this.buildProfilePayload(await this.resolveTargetId(id, authorization)),
    );
  }

  @Get('profile/:id')
  async getProfile(@Param('id') id: string) {
    return this.wrapProfileResponse(
      'Profile fetched successfully.',
      await this.buildProfilePayload(id),
    );
  }

  @Get('user-profile/edit')
  @ApiQuery({ name: 'id', required: false })
  async getUserProfileEditState(
    @Query('id') id?: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.getUser(
      await this.resolveTargetId(id, authorization),
    );
    return {
      success: true,
      message: 'Editable profile state fetched successfully.',
      user,
      profile: user,
      data: {
        user,
        profile: user,
        editableFields: [
          'name',
          'username',
          'bio',
          'avatar',
          'avatarUrl',
          'coverImageUrl',
          'website',
          'location',
        ],
        helpText:
          'Update your profile basics, then save to refresh your public profile.',
      },
    };
  }

  @Patch('user-profile/edit')
  async updateUserProfileAlias(
    @Body() body: UpdateUserDto,
    @Headers('authorization') authorization?: string,
  ) {
    const id = await this.resolveTargetId(body.id, authorization);
    const user = await this.coreDatabase.updateUserProfile(
      id,
      this.normalizeProfilePatch(body),
    );
    return {
      success: true,
      message: 'Profile updated successfully.',
      user,
      profile: user,
      data: {
        user,
        profile: user,
      },
    };
  }

  @Get('user-profile')
  @ApiQuery({ name: 'id', required: false })
  async getUserProfile(
    @Query('id') id?: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.wrapProfileResponse(
      'Profile fetched successfully.',
      await this.buildProfilePayload(await this.resolveTargetId(id, authorization)),
    );
  }

  @Get('user-profile/followers')
  @ApiQuery({ name: 'id', required: false })
  async getUserProfileFollowers(
    @Query('id') id?: string,
    @Headers('authorization') authorization?: string,
  ) {
    const resolvedId = await this.resolveTargetId(id, authorization);
    return this.wrapListResponse(
      'Followers fetched successfully.',
      await this.coreDatabase.getFollowers(resolvedId),
    );
  }

  @Get('user-profile/following')
  @ApiQuery({ name: 'id', required: false })
  async getUserProfileFollowing(
    @Query('id') id?: string,
    @Headers('authorization') authorization?: string,
  ) {
    const resolvedId = await this.resolveTargetId(id, authorization);
    return this.wrapListResponse(
      'Following fetched successfully.',
      await this.coreDatabase.getFollowing(resolvedId),
    );
  }

  @Get('user-profile/:id')
  async getUserProfileById(@Param('id') id: string) {
    return this.wrapProfileResponse(
      'Profile fetched successfully.',
      await this.buildProfilePayload(id),
    );
  }

  @Get('follow-unfollow/:id/followers')
  async getFollowFeatureFollowers(@Param('id') id: string) {
    return this.wrapListResponse(
      'Followers fetched successfully.',
      await this.coreDatabase.getFollowers(id),
    );
  }

  @Get('follow-unfollow/:id/following')
  async getFollowFeatureFollowing(@Param('id') id: string) {
    return this.wrapListResponse(
      'Following fetched successfully.',
      await this.coreDatabase.getFollowing(id),
    );
  }

  @Patch('follow-unfollow/:id/follow')
  @Post('follow-unfollow/:id/follow')
  async followUserAlias(
    @Param('id') id: string,
    @Body() body: FollowUserDto,
    @Headers('authorization') authorization?: string,
  ) {
    const followerId = await this.resolveActorId(body, authorization);
    await this.coreDatabase.followUser(id, followerId);
    return this.wrapFollowResponse('Followed user successfully.', id, followerId, true);
  }

  @Patch('follow-unfollow/:id/unfollow')
  @Post('follow-unfollow/:id/unfollow')
  async unfollowUserAlias(
    @Param('id') id: string,
    @Body() body: FollowUserDto,
    @Headers('authorization') authorization?: string,
  ) {
    const followerId = await this.resolveActorId(body, authorization);
    await this.coreDatabase.unfollowUser(id, followerId);
    return this.wrapFollowResponse(
      'Unfollowed user successfully.',
      id,
      followerId,
      false,
    );
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

  private async resolveTargetId(id?: string, authorization?: string) {
    const requestedId = id?.trim();
    if (requestedId) {
      return requestedId;
    }

    const viewerId = await this.resolveViewerId(authorization);
    return viewerId ?? 'u1';
  }

  private async resolveActorId(body: FollowUserDto, authorization?: string) {
    const actorId = body.followerId ?? body.userId ?? body.actorId;
    return this.resolveTargetId(actorId, authorization);
  }

  private async resolveViewerId(authorization?: string) {
    const token = authorization?.replace(/^Bearer\s+/i, '');
    const user = await this.coreDatabase.resolveUserFromAccessToken(token);
    return user?.id;
  }

  private normalizeProfilePatch(body: UpdateUserDto) {
    return {
      name: body.name?.trim(),
      username: body.username?.trim(),
      bio: body.bio?.trim(),
      avatar: body.avatarUrl?.trim() || body.avatar?.trim(),
      website: body.website?.trim(),
      location: body.location?.trim(),
      coverImageUrl: body.coverImageUrl?.trim(),
    };
  }

  private wrapProfileResponse(
    message: string,
    payload: Awaited<ReturnType<ProfilesController['buildProfilePayload']>>,
  ) {
    return {
      success: true,
      message,
      ...payload.user,
      user: payload.user,
      profile: payload.user,
      data: {
        ...payload,
        user: payload.user,
        profile: payload.user,
      },
    };
  }

  private wrapListResponse(message: string, items: unknown[]) {
    return {
      success: true,
      message,
      data: items,
      items,
      results: items,
      count: items.length,
    };
  }

  private wrapFollowResponse(
    message: string,
    targetId: string,
    followerId: string,
    isFollowing: boolean,
  ) {
    return {
      success: true,
      message,
      targetId,
      followerId,
      isFollowing,
      hasPendingRequest: false,
      data: {
        targetId,
        followerId,
        isFollowing,
        hasPendingRequest: false,
      },
    };
  }
}
