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
  async getUser(@Param('id') id: string) {
    const user = await this.coreDatabase.getUser(id);
    return this.wrapUserResponse('User fetched successfully.', user);
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

  private wrapUserResponse(message: string, user: Awaited<ReturnType<CoreDatabaseService['getUser']>>) {
    return {
      success: true,
      message,
      ...user,
      user,
      profile: user,
      data: user,
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
