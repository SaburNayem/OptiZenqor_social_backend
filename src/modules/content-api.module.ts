import { Module } from '@nestjs/common';
import { ChatController } from '../controllers/chat.controller';
import { BuddiesController } from '../controllers/buddies.controller';
import { CommentsController } from '../controllers/comments.controller';
import { ContentController } from '../controllers/content.controller';
import { CreatorFlowController } from '../controllers/creator-flow.controller';
import { LikesController } from '../controllers/likes.controller';
import { MediaViewerController } from '../controllers/media-viewer.controller';
import { MessagesController } from '../controllers/messages.controller';
import { PostsController } from '../controllers/posts.controller';
import { RealtimeController } from '../controllers/realtime.controller';
import { ReelsController } from '../controllers/reels.controller';
import { StoriesController } from '../controllers/stories.controller';
import { UsersController } from '../controllers/users.controller';
import { UploadsController } from '../controllers/uploads.controller';
import { RealtimeGateway } from '../gateways/realtime.gateway';

@Module({
  controllers: [
    UsersController,
    ContentController,
    PostsController,
    LikesController,
    MediaViewerController,
    MessagesController,
    StoriesController,
    ReelsController,
    UploadsController,
    CommentsController,
    CreatorFlowController,
    ChatController,
    BuddiesController,
    RealtimeController,
  ],
  providers: [RealtimeGateway],
})
export class ContentApiModule {}
