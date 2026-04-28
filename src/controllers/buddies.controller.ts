import { Body, Controller, Delete, Get, Headers, Param, Post, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { BuddyActionDto, BuddyRequestCreateDto } from '../dto/api.dto';
import { CoreDatabaseService } from '../services/core-database.service';

@ApiTags('buddies')
@Controller('buddies')
export class BuddiesController {
  constructor(private readonly coreDatabase: CoreDatabaseService) {}

  @Get()
  async getBuddies(
    @Query('userId') userId?: string,
    @Query('actorId') actorId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    const resolvedUserId = await this.resolveActorId(
      [userId, actorId],
      authorization,
    );
    const buddies = await this.coreDatabase.getBuddies(resolvedUserId);
    return this.wrapListResponse('Buddies fetched successfully.', buddies);
  }

  @Get('requests/sent')
  async getSentRequests(
    @Query('userId') userId?: string,
    @Query('actorId') actorId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    const resolvedUserId = await this.resolveActorId(
      [userId, actorId],
      authorization,
    );
    const requests = await this.coreDatabase.getSentBuddyRequests(resolvedUserId);
    return this.wrapListResponse('Sent buddy requests fetched successfully.', requests);
  }

  @Get('requests/received')
  async getReceivedRequests(
    @Query('userId') userId?: string,
    @Query('actorId') actorId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    const resolvedUserId = await this.resolveActorId(
      [userId, actorId],
      authorization,
    );
    const requests = await this.coreDatabase.getReceivedBuddyRequests(resolvedUserId);
    return this.wrapListResponse('Received buddy requests fetched successfully.', requests);
  }

  @Post('requests')
  async createRequest(
    @Body() body: BuddyRequestCreateDto,
    @Headers('authorization') authorization?: string,
  ) {
    const actorId = await this.resolveActorId(
      [body.userId, body.actorId],
      authorization,
    );
    const request = await this.coreDatabase.createBuddyRequest(
      actorId,
      body.targetUserId.trim(),
    );
    return this.wrapEntityResponse('Buddy request created successfully.', request, 'request');
  }

  @Post('requests/:requestId/accept')
  async acceptRequest(
    @Param('requestId') requestId: string,
    @Body() body: BuddyActionDto,
    @Headers('authorization') authorization?: string,
  ) {
    const actorId = await this.resolveActorId(
      [body.userId, body.actorId],
      authorization,
    );
    const buddy = await this.coreDatabase.acceptBuddyRequest(requestId, actorId);
    return this.wrapEntityResponse('Buddy request accepted successfully.', buddy, 'buddy');
  }

  @Post('requests/:requestId/reject')
  async rejectRequest(
    @Param('requestId') requestId: string,
    @Body() body: BuddyActionDto,
    @Headers('authorization') authorization?: string,
  ) {
    const actorId = await this.resolveActorId(
      [body.userId, body.actorId],
      authorization,
    );
    const request = await this.coreDatabase.rejectBuddyRequest(requestId, actorId);
    return this.wrapEntityResponse('Buddy request rejected successfully.', request, 'request');
  }

  @Delete('requests/:requestId')
  async deleteRequest(
    @Param('requestId') requestId: string,
    @Query('userId') userId?: string,
    @Query('actorId') actorId?: string,
    @Body() body?: BuddyActionDto,
    @Headers('authorization') authorization?: string,
  ) {
    const resolvedUserId = await this.resolveActorId(
      [userId, actorId, body?.userId, body?.actorId],
      authorization,
    );
    return this.coreDatabase.deleteBuddyRequest(requestId, resolvedUserId);
  }

  @Delete(':buddyUserId')
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'actorId', required: false })
  async removeBuddy(
    @Param('buddyUserId') buddyUserId: string,
    @Query('userId') userId?: string,
    @Query('actorId') actorId?: string,
    @Body() body?: BuddyActionDto,
    @Headers('authorization') authorization?: string,
  ) {
    const resolvedUserId = await this.resolveActorId(
      [userId, actorId, body?.userId, body?.actorId],
      authorization,
    );
    return this.coreDatabase.removeBuddy(resolvedUserId, buddyUserId);
  }

  private async resolveActorId(
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

  private wrapEntityResponse(
    message: string,
    payload: Record<string, unknown>,
    key: 'buddy' | 'request',
  ) {
    return {
      success: true,
      message,
      ...payload,
      [key]: payload,
      data: payload,
    };
  }
}
