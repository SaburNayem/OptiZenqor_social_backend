import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
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
    return this.coreDatabase.getUsers(role);
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.coreDatabase.getUser(id);
  }

  @Get(':id/followers')
  async getFollowers(@Param('id') id: string) {
    return this.coreDatabase.getFollowers(id);
  }

  @Get(':id/following')
  async getFollowing(@Param('id') id: string) {
    return this.coreDatabase.getFollowing(id);
  }

  @Patch(':id')
  async updateUser(@Param('id') id: string, @Body() body: UpdateUserDto) {
    return this.coreDatabase.updateUserProfile(id, body);
  }

  @Patch(':id/follow')
  async followUser(@Param('id') id: string, @Body() body: FollowUserDto) {
    return this.coreDatabase.followUser(id, body.followerId);
  }

  @Patch(':id/unfollow')
  async unfollowUser(@Param('id') id: string, @Body() body: FollowUserDto) {
    return this.coreDatabase.unfollowUser(id, body.followerId);
  }

  @Post('change-password')
  async changePassword(@Body() body: ChangePasswordRequestDto) {
    return this.coreDatabase.changePassword(body);
  }

  @Delete(':id')
  async deleteAccount(@Param('id') id: string) {
    return this.coreDatabase.deleteUserAccount(id);
  }
}
