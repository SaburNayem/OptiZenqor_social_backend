import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PlatformDataService } from '../data/platform-data.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly platformData: PlatformDataService) {}

  @Get()
  getUsers(@Query('role') role?: string) {
    return this.platformData.getUsers(role);
  }

  @Get(':id')
  getUser(@Param('id') id: string) {
    return this.platformData.getUser(id);
  }

  @Patch(':id')
  updateUser(
    @Param('id') id: string,
    @Body() body: { name?: string; username?: string; bio?: string; avatar?: string },
  ) {
    return this.platformData.updateUserProfile(id, body);
  }

  @Patch(':id/follow')
  followUser(@Param('id') id: string, @Body() body: { followerId: string }) {
    return this.platformData.followUser(id, body.followerId);
  }

  @Patch(':id/unfollow')
  unfollowUser(@Param('id') id: string, @Body() body: { followerId: string }) {
    return this.platformData.unfollowUser(id, body.followerId);
  }

  @Patch(':id/block')
  blockUser(@Param('id') id: string, @Body() body: { actorId: string; reason?: string }) {
    return this.platformData.blockUser(id, body.actorId, body.reason);
  }

  @Patch(':id/unblock')
  unblockUser(@Param('id') id: string, @Body() body: { actorId: string }) {
    return this.platformData.unblockUser(id, body.actorId);
  }

  @Post('change-password')
  changePassword(
    @Body() body: { email: string; oldPassword: string; newPassword: string },
  ) {
    return this.platformData.changePassword(body);
  }

  @Delete(':id')
  deleteAccount(@Param('id') id: string) {
    return this.platformData.deleteUserAccount(id);
  }
}
