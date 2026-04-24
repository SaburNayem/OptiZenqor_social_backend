import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  ChangePasswordRequestDto,
  FollowUserDto,
  UpdateUserDto,
} from '../dto/api.dto';
import { CoreDatabaseService } from '../services/core-database.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly coreDatabase: CoreDatabaseService) {}

  @Get()
  @ApiQuery({ name: 'role', required: false })
  async getUsers(@Query('role') role?: string) {
    const users = await this.coreDatabase.getUsers(role);
    return this.wrapListResponse('Users fetched successfully.', users);
  }

  @Get(':id')
  async getUser(
    @Param('id') id: string,
    @Query('viewerId') viewerId?: string,
    @Query('userId') userId?: string,
    @Query('actorId') actorId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.getUser(id);
    const resolvedActorId = await this.resolveOptionalActorId(
      [viewerId, userId, actorId],
      authorization,
    );
    const followState = resolvedActorId
      ? await this.coreDatabase.getFollowState(id, resolvedActorId)
      : undefined;
    return this.wrapUserResponse('User fetched successfully.', user, followState);
  }

  @Get(':id/follow-state')
  async getFollowState(
    @Param('id') id: string,
    @Query('viewerId') viewerId?: string,
    @Query('userId') userId?: string,
    @Query('actorId') actorId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    const followState = await this.coreDatabase.getFollowState(
      id,
      await this.resolveRequiredActorId([viewerId, userId, actorId], authorization),
    );
    return this.wrapFollowStateResponse(
      'Follow state fetched successfully.',
      followState,
    );
  }

  @Get(':id/followers')
  async getFollowers(@Param('id') id: string) {
    return this.wrapListResponse(
      'Followers fetched successfully.',
      await this.coreDatabase.getFollowers(id),
    );
  }

  @Get(':id/following')
  async getFollowing(@Param('id') id: string) {
    return this.wrapListResponse(
      'Following fetched successfully.',
      await this.coreDatabase.getFollowing(id),
    );
  }

  @Patch(':id')
  async updateUser(@Param('id') id: string, @Body() body: UpdateUserDto) {
    const user = await this.coreDatabase.updateUserProfile(
      id,
      this.normalizeProfilePatch(body),
    );
    return this.wrapUserResponse('User updated successfully.', user);
  }

  @Patch(':id/follow')
  @Post(':id/follow')
  async followUser(
    @Param('id') id: string,
    @Body() body: FollowUserDto,
    @Headers('authorization') authorization?: string,
  ) {
    const followerId = await this.resolveActorId(body, authorization);
    await this.coreDatabase.followUser(id, followerId);
    return this.wrapFollowResponse('Followed user successfully.', id, followerId, true);
  }

  @Patch(':id/unfollow')
  @Post(':id/unfollow')
  async unfollowUser(
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

  @Post('change-password')
  async changePassword(@Body() body: ChangePasswordRequestDto) {
    return this.coreDatabase.changePassword(body);
  }

  @Delete(':id')
  async deleteAccount(@Param('id') id: string) {
    return this.coreDatabase.deleteUserAccount(id);
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

  private async resolveActorId(body: FollowUserDto, authorization?: string) {
    const actorId =
      body.followerId?.trim() || body.userId?.trim() || body.actorId?.trim();
    if (actorId) {
      return actorId;
    }

    const token = authorization?.replace(/^Bearer\s+/i, '');
    const user = await this.coreDatabase.resolveUserFromAccessToken(token);
    return user?.id ?? 'u1';
  }

  private async resolveOptionalActorId(
    candidates: Array<string | undefined>,
    authorization?: string,
  ) {
    for (const candidate of candidates) {
      const normalized = candidate?.trim();
      if (normalized) {
        return normalized;
      }
    }

    const token = authorization?.replace(/^Bearer\s+/i, '');
    const user = await this.coreDatabase.resolveUserFromAccessToken(token);
    return user?.id ?? null;
  }

  private async resolveRequiredActorId(
    candidates: Array<string | undefined>,
    authorization?: string,
  ) {
    return (await this.resolveOptionalActorId(candidates, authorization)) ?? 'u1';
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

  private wrapUserResponse(
    message: string,
    user: Awaited<ReturnType<CoreDatabaseService['getUser']>>,
    followState?: Awaited<ReturnType<CoreDatabaseService['getFollowState']>>,
  ) {
    const followPayload = followState ? this.decorateFollowState(followState) : {};
    const userPayload = { ...user, ...followPayload };
    return {
      success: true,
      message,
      ...userPayload,
      user: userPayload,
      profile: userPayload,
      data: userPayload,
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
      following: isFollowing,
      followed: isFollowing,
      hasPendingRequest: false,
      pending: false,
      requested: false,
      requestPending: false,
      data: {
        targetId,
        followerId,
        isFollowing,
        following: isFollowing,
        followed: isFollowing,
        hasPendingRequest: false,
        pending: false,
        requested: false,
        requestPending: false,
      },
    };
  }

  private wrapFollowStateResponse(
    message: string,
    followState: Awaited<ReturnType<CoreDatabaseService['getFollowState']>>,
  ) {
    const payload = this.decorateFollowState(followState);
    return {
      success: true,
      message,
      ...payload,
      data: payload,
      result: payload,
    };
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
