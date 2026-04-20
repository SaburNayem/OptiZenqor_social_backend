import { Controller, Param, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PlatformDataService } from '../data/platform-data.service';

@ApiTags('likes')
@Controller('posts')
export class LikesController {
  constructor(private readonly platformData: PlatformDataService) {}

  @Patch(':id/like')
  likePost(@Param('id') id: string) {
    return this.platformData.toggleLike(id);
  }

  @Patch(':id/unlike')
  unlikePost(@Param('id') id: string) {
    return this.platformData.unlikePost(id);
  }
}
