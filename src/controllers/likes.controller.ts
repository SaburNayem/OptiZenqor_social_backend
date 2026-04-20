import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PlatformDataService } from '../data/platform-data.service';
import { PostReactionDto } from '../dto/api.dto';

@ApiTags('likes')
@Controller('posts')
export class LikesController {
  constructor(private readonly platformData: PlatformDataService) {}

  @Get(':id/reactions')
  getPostReactions(@Param('id') id: string) {
    return this.platformData.getPostReactions(id);
  }

  @Post(':id/reactions')
  reactToPost(@Param('id') id: string, @Body() body: PostReactionDto) {
    return this.platformData.reactToPost(id, body.userId, body.reaction);
  }

  @Patch(':id/like')
  likePost(@Param('id') id: string) {
    return this.platformData.toggleLike(id);
  }

  @Patch(':id/unlike')
  unlikePost(@Param('id') id: string) {
    return this.platformData.unlikePost(id);
  }
}
