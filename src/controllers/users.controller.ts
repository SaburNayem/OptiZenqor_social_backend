import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { PlatformDataService } from '../data/platform-data.service';
import {
  ChangePasswordRequestDto,
  FollowUserDto,
  UpdateUserDto,
} from '../dto/api.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly platformData: PlatformDataService) {}

  @Get()
  @ApiQuery({ name: 'role', required: false })
  getUsers(@Query('role') role?: string) {
    return this.platformData.getUsers(role);
  }

  @Get(':id')
  getUser(@Param('id') id: string) {
    return this.platformData.getUser(id);
  }

  @Get(':id/followers')
  getFollowers(@Param('id') id: string) {
    return this.platformData.getFollowers(id);
  }

  @Get(':id/following')
  getFollowing(@Param('id') id: string) {
    return this.platformData.getFollowing(id);
  }

  @Patch(':id')
  updateUser(@Param('id') id: string, @Body() body: UpdateUserDto) {
    return this.platformData.updateUserProfile(id, body);
  }

  @Patch(':id/follow')
  followUser(@Param('id') id: string, @Body() body: FollowUserDto) {
    return this.platformData.followUser(id, body.followerId);
  }

  @Patch(':id/unfollow')
  unfollowUser(@Param('id') id: string, @Body() body: FollowUserDto) {
    return this.platformData.unfollowUser(id, body.followerId);
  }

  @Post('change-password')
  changePassword(@Body() body: ChangePasswordRequestDto) {
    return this.platformData.changePassword(body);
  }

  @Delete(':id')
  deleteAccount(@Param('id') id: string) {
    return this.platformData.deleteUserAccount(id);
  }
}
