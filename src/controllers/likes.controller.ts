import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PostReactionDto, UserActorDto } from '../dto/api.dto';
import { CoreDatabaseService } from '../services/core-database.service';

@ApiTags('likes')
@Controller('posts')
export class LikesController {
  constructor(private readonly coreDatabase: CoreDatabaseService) {}

  @Get(':id/reactions')
  async getPostReactions(@Param('id') id: string) {
    return this.coreDatabase.getPostReactions(id);
  }

  @Post(':id/reactions')
  async reactToPost(@Param('id') id: string, @Body() body: PostReactionDto) {
    return this.coreDatabase.reactToPost(id, body.userId, body.reaction);
  }

  @Patch(':id/like')
  async likePost(@Param('id') id: string, @Body() body: UserActorDto) {
    return this.coreDatabase.reactToPost(id, body.userId, 'like');
  }

  @Patch(':id/unlike')
  async unlikePost(@Param('id') id: string, @Body() body: UserActorDto) {
    return this.coreDatabase.unlikePost(id, body.userId);
  }
}
