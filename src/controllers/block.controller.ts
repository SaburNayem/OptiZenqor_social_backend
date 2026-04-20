import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { PlatformDataService } from '../data/platform-data.service';
import { BlockUserDto } from '../dto/api.dto';

@ApiTags('block')
@Controller('block')
export class BlockController {
  constructor(private readonly platformData: PlatformDataService) {}

  @Get()
  @ApiQuery({ name: 'actorId', required: false })
  getBlockedUsers(@Query('actorId') actorId?: string) {
    return this.platformData.getBlockedUsers(actorId);
  }

  @Get(':targetId')
  @ApiQuery({ name: 'actorId', required: false })
  getBlockedUser(
    @Param('targetId') targetId: string,
    @Query('actorId') actorId?: string,
  ) {
    return this.platformData.getBlockedUser(targetId, actorId);
  }

  @Post()
  blockUser(@Body() body: BlockUserDto) {
    return this.platformData.blockUser(body.targetId, body.actorId, body.reason);
  }

  @Delete(':targetId')
  @ApiQuery({ name: 'actorId', required: false })
  unblockUser(
    @Param('targetId') targetId: string,
    @Query('actorId') actorIdFromQuery?: string,
    @Body() body?: { actorId?: string },
  ) {
    const actorId = actorIdFromQuery ?? body?.actorId;
    if (!actorId) {
      return {
        success: false,
        message: 'actorId is required in query or body for unblock.',
      };
    }
    return this.platformData.unblockUser(targetId, actorId);
  }
}
