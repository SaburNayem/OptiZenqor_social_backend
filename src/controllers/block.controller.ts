import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BlockUserDto } from '../dto/api.dto';
import { AccountStateDatabaseService } from '../services/account-state-database.service';
import { CoreDatabaseService } from '../services/core-database.service';

@ApiTags('block')
@Controller('block')
@UseGuards(JwtAuthGuard)
export class BlockController {
  constructor(
    private readonly accountStateDatabase: AccountStateDatabaseService,
    private readonly coreDatabase: CoreDatabaseService,
  ) {}

  @Get()
  @ApiQuery({ name: 'actorId', required: false })
  async getBlockedUsers(
    @Query('actorId') actorId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      actorId,
    );
    return this.accountStateDatabase.getBlockedUsers(user.id);
  }

  @Get(':targetId')
  @ApiQuery({ name: 'actorId', required: false })
  async getBlockedUser(
    @Param('targetId') targetId: string,
    @Query('actorId') actorId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      actorId,
    );
    return this.accountStateDatabase.getBlockedUser(user.id, targetId);
  }

  @Post()
  async blockUser(
    @Body() body: BlockUserDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.actorId,
    );
    return this.accountStateDatabase.blockUser(user.id, body.targetId, body.reason);
  }

  @Delete(':targetId')
  @ApiQuery({ name: 'actorId', required: false })
  async unblockUser(
    @Param('targetId') targetId: string,
    @Query('actorId') actorIdFromQuery?: string,
    @Body() body?: { actorId?: string },
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      actorIdFromQuery ?? body?.actorId,
    );
    return this.accountStateDatabase.unblockUser(user.id, targetId);
  }
}
