import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { PlatformDataService } from '../data/platform-data.service';

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

  @Patch(':id/follow')
  followUser(@Param('id') id: string, @Body() body: { followerId: string }) {
    return {
      success: true,
      target: this.platformData.getUser(id),
      follower: this.platformData.getUser(body.followerId),
      message: 'Follow state toggled.',
    };
  }

  @Patch(':id/block')
  blockUser(@Param('id') id: string, @Body() body: { actorId: string; reason?: string }) {
    return {
      success: true,
      target: this.platformData.getUser(id),
      actor: this.platformData.getUser(body.actorId),
      reason: body.reason ?? 'No reason provided',
      message: 'User block request recorded.',
    };
  }
}
