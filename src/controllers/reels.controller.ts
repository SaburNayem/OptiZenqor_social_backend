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
  async getReels(@Query('authorId') authorId?: string, @Query('userId') userId?: string) {
    const reels = await this.reelsDatabase.getReels(authorId ?? userId);
    return this.wrapListResponse('Reels fetched successfully.', reels);
  }

  @Get(':id')
  async getReel(@Param('id') id: string) {
    const reel = await this.reelsDatabase.getReel(id);
    const payload = {
      ...reel,
      comments: await this.reelsDatabase.getReelComments(id),
      reactions: await this.reelsDatabase.getReelReactions(id),
    };
    return {
      success: true,
      message: 'Reel fetched successfully.',
      ...payload,
      reel: payload,
      data: payload,
    };
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
    const reel = await this.reelsDatabase.createReel(user.id, body);
    return {
      success: true,
      message: 'Reel created successfully.',
      reel,
      data: reel,
    };
  }

  @Patch(':id')
  async updateReel(@Param('id') id: string, @Body() body: UpdateReelDto) {
    const reel = await this.reelsDatabase.updateReel(id, body);
    return {
      success: true,
      message: 'Reel updated successfully.',
      reel,
      data: reel,
    };
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
    return {
      success: true,
      message,
      data: items,
      items,
      results: items,
      count: items.length,
    };
  }
}
