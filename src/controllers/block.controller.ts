import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PlatformDataService } from '../data/platform-data.service';

@ApiTags('block')
@Controller('block')
export class BlockController {
  constructor(private readonly platformData: PlatformDataService) {}

  @Get()
  getBlockedUsers() {
    return this.platformData.getBlockedUsers();
  }

  @Post()
  blockUser(
    @Body()
    body: {
      actorId: string;
      targetId: string;
      reason?: string;
    },
  ) {
    return this.platformData.blockUser(body.targetId, body.actorId, body.reason);
  }

  @Delete(':targetId')
  unblockUser(
    @Param('targetId') targetId: string,
    @Body() body: { actorId: string },
  ) {
    return this.platformData.unblockUser(targetId, body.actorId);
  }
}
