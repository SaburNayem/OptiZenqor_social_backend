import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  CreateReelDto,
  ReelCommentDto,
  ReelReactionDto,
  UpdateReelDto,
} from '../dto/api.dto';
import { CoreDatabaseService } from '../services/core-database.service';
import { ReelsDatabaseService } from '../services/reels-database.service';
import { listResponse, successResponse } from '../utils/api-response.util';

@ApiTags('reels')
@Controller('reels')
export class ReelsController {
  constructor(
    private readonly reelsDatabase: ReelsDatabaseService,
    private readonly coreDatabase: CoreDatabaseService,
  ) {}

  @Get()
  @ApiQuery({ name: 'authorId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'viewerId', required: false })
  async getReels(
    @Query('authorId') authorId?: string,
    @Query('userId') userId?: string,
    @Query('viewerId') viewerId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    const reels = await this.reelsDatabase.getReels(
      authorId ?? userId,
      await this.resolveViewerId(viewerId, authorization),
    );
    return this.wrapListResponse('Reels fetched successfully.', reels);
  }

  @Get(':id')
  @ApiQuery({ name: 'viewerId', required: false })
  async getReel(
    @Param('id') id: string,
    @Query('viewerId') viewerId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    const reel = await this.reelsDatabase.getReel(
      id,
      await this.resolveViewerId(viewerId, authorization),
    );
    const payload = {
      ...reel,
      comments: await this.reelsDatabase.getReelComments(id),
      reactions: await this.reelsDatabase.getReelReactions(id),
    };
    return successResponse('Reel fetched successfully.', payload);
  }

  @Post()
  async createReel(
    @Body() body: CreateReelDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.authorId,
    );
    this.coreDatabase.assertUserNotRestrictedFor(user, 'posts');
    const reel = await this.reelsDatabase.createReel(user.id, body);
    return successResponse('Reel created successfully.', reel);
  }

  @Patch(':id')
  async updateReel(@Param('id') id: string, @Body() body: UpdateReelDto) {
    const reel = await this.reelsDatabase.updateReel(id, body);
    return successResponse('Reel updated successfully.', reel);
  }

  @Get(':id/comments')
  getReelComments(@Param('id') id: string) {
    return this.reelsDatabase.getReelComments(id);
  }

  @Post(':id/comments')
  async createReelComment(
    @Param('id') id: string,
    @Body() body: ReelCommentDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.userId,
    );
    this.coreDatabase.assertUserNotRestrictedFor(user, 'comments');
    return this.reelsDatabase.createReelComment(id, user.id, body.comment);
  }

  @Get(':id/reactions')
  getReelReactions(@Param('id') id: string) {
    return this.reelsDatabase.getReelReactions(id);
  }

  @Post(':id/reactions')
  async reactToReel(
    @Param('id') id: string,
    @Body() body: ReelReactionDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.userId,
    );
    return this.reelsDatabase.reactToReel(id, user.id, body.reaction);
  }

  @Delete(':id')
  deleteReel(@Param('id') id: string) {
    return this.reelsDatabase.deleteReel(id);
  }

  private wrapListResponse(message: string, items: unknown[]) {
    return listResponse(message, items);
  }

  private async resolveViewerId(viewerId?: string, authorization?: string) {
    if (viewerId?.trim()) {
      return viewerId.trim();
    }
    const user = await this.coreDatabase
      .requireUserFromAuthorization(authorization)
      .catch(() => null);
    return user?.id ?? null;
  }
}
