import { Body, Controller, Get, Headers, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { FollowUserDto, ProfileTypeSetupDto, UpdateUserDto } from '../dto/api.dto';
import { AccountStateDatabaseService } from '../services/account-state-database.service';
import { CoreDatabaseService } from '../services/core-database.service';
import { ProfilesDatabaseService } from '../services/profiles-database.service';
import { listResponse, successResponse } from '../utils/api-response.util';

@ApiTags('profiles')
@Controller()
export class ProfilesController {
  constructor(
    private readonly coreDatabase: CoreDatabaseService,
    private readonly profilesDatabase: ProfilesDatabaseService,
    private readonly accountStateDatabase: AccountStateDatabaseService,
  ) {}

  private async buildProfilePayload(id: string) {
    return this.profilesDatabase.buildProfilePayload(id);
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

  @Get('profile/:id/tagged-posts')
  async getTaggedPosts(@Param('id') id: string) {
    return this.wrapListResponse(
      'Tagged posts fetched successfully.',
      await this.profilesDatabase.getTaggedPosts(id),
    );
  }

  @Get('profile/:id/mention-history')
  async getMentionHistory(@Param('id') id: string) {
    return this.wrapListResponse(
      'Mention history fetched successfully.',
      await this.profilesDatabase.getMentionHistory(id),
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
    return successResponse('Editable profile state fetched successfully.', {
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
        'profileType',
        'profileSetup',
      ],
      helpText:
        'Update your profile basics, then save to refresh your public profile.',
    });
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
    return successResponse('Profile updated successfully.', {
      user,
      profile: user,
    });
  }

  @Get('profile-type/forms')
  getProfileTypeForms() {
    return successResponse('Profile type forms fetched successfully.', {
      required: true,
      profileTypes: [
        {
          value: 'business',
          label: 'Business',
          capabilities: ['create_jobs', 'create_marketplace_products'],
          requiredFields: ['businessName', 'businessCategory', 'businessPhone'],
          optionalFields: ['businessAddress', 'companyWebsite'],
        },
        {
          value: 'creator',
          label: 'Creator',
          capabilities: ['create_pages'],
          requiredFields: ['pageName', 'pageCategory', 'pageAbout'],
          optionalFields: ['contactLabel', 'location'],
        },
        {
          value: 'user',
          label: 'User',
          capabilities: [],
          requiredFields: [],
          optionalFields: [],
        },
      ],
    });
  }

  @Patch('user-profile/type')
  async updateUserProfileType(
    @Body() body: ProfileTypeSetupDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    const updated = await this.coreDatabase.updateUserProfileTypeSetup(user.id, body);
    return successResponse('Profile type updated successfully.', {
      user: updated,
      profile: updated,
    });
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

  @Get('follow-unfollow/:id/mutuals')
  async getFollowFeatureMutuals(
    @Param('id') id: string,
    @Query('viewerId') viewerId?: string,
    @Query('userId') userId?: string,
    @Query('actorId') actorId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    const followState = await this.coreDatabase.getFollowState(
      id,
      await this.resolveActorIdFromQuery(
        [viewerId, userId, actorId],
        authorization,
      ),
    );
    return this.wrapFollowStateResponse(
      'Mutual connections fetched successfully.',
      followState,
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
  async getCreatorDashboard(@Headers('authorization') authorization?: string) {
    const viewerId = await this.resolveTargetId(undefined, authorization);
    return successResponse('Creator dashboard fetched successfully.', {
      ...(await this.profilesDatabase.getCreatorDashboard(viewerId)),
    });
  }

  @Get('business-profile')
  async getBusinessProfile() {
    return successResponse(
      'Business profile fetched successfully.',
      await this.profilesDatabase.getBusinessProfile(),
    );
  }

  @Get('seller-profile')
  async getSellerProfile() {
    return successResponse(
      'Seller profile fetched successfully.',
      await this.profilesDatabase.getSellerProfile(),
    );
  }

  @Get('recruiter-profile')
  async getRecruiterProfile() {
    return successResponse(
      'Recruiter profile fetched successfully.',
      await this.profilesDatabase.getRecruiterProfile(),
    );
  }

  private async resolveTargetId(id?: string, authorization?: string) {
    const requestedId = id?.trim();
    if (requestedId) {
      return requestedId;
    }

    const viewerId = await this.resolveViewerId(authorization);
    if (viewerId) {
      return viewerId;
    }

    const users = await this.coreDatabase.getUsers();
    return users[0]?.id ?? 'u1';
  }

  private async resolveActorId(body: FollowUserDto, authorization?: string) {
    const actorId = body.followerId ?? body.userId ?? body.actorId;
    return this.resolveTargetId(actorId, authorization);
  }

  private async resolveActorIdFromQuery(
    candidates: Array<string | undefined>,
    authorization?: string,
  ) {
    for (const candidate of candidates) {
      const normalized = candidate?.trim();
      if (normalized) {
        return normalized;
      }
    }

    const viewerId = await this.resolveViewerId(authorization);
    if (viewerId) {
      return viewerId;
    }
    const users = await this.coreDatabase.getUsers();
    return users[0]?.id ?? 'u1';
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
      profileType: body.profileType?.trim(),
    };
  }

  private wrapProfileResponse(
    message: string,
    payload: Awaited<ReturnType<ProfilesController['buildProfilePayload']>>,
  ) {
    return successResponse(message, {
      ...payload,
      user: payload.user,
      profile: payload.user,
    });
  }

  private wrapListResponse(message: string, items: unknown[]) {
    return listResponse(message, items);
  }

  private wrapFollowResponse(
    message: string,
    targetId: string,
    followerId: string,
    isFollowing: boolean,
  ) {
    return successResponse(message, {
      targetId,
      followerId,
      isFollowing,
      following: isFollowing,
      followed: isFollowing,
      hasPendingRequest: false,
      pending: false,
      requested: false,
      requestPending: false,
    });
  }

  private wrapFollowStateResponse(
    message: string,
    followState: Awaited<ReturnType<CoreDatabaseService['getFollowState']>>,
  ) {
    const payload = this.decorateFollowState(followState);
    return successResponse(message, payload, {
      targetId: payload.targetId,
      actorId: payload.actorId,
    });
  }

  private decorateFollowState(
    followState: Awaited<ReturnType<CoreDatabaseService['getFollowState']>>,
  ) {
    return {
      ...followState,
      following: followState.isFollowing,
      followed: followState.isFollowing,
      pending: followState.hasPendingRequest,
      requested: followState.hasPendingRequest,
      requestPending: followState.hasPendingRequest,
    };
  }
}
