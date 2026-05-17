import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateMessageDto } from '../dto/api.dto';
import { CoreDatabaseService } from '../services/core-database.service';

@ApiTags('messages')
@Controller('messages')
export class MessagesController {
  constructor(private readonly coreDatabase: CoreDatabaseService) {}

  @Get()
  async getThreads(@Headers('authorization') authorization?: string) {
    const actor = authorization
      ? await this.coreDatabase.requireUserFromAuthorization(authorization).catch(() => null)
      : null;
    return this.coreDatabase.getThreads(actor?.id);
  }

  @Get(':id')
  async getThread(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const actor = authorization
      ? await this.coreDatabase.requireUserFromAuthorization(authorization).catch(() => null)
      : null;
    return this.coreDatabase.getThread(id, actor?.id);
  }

  @Post(':id')
  async createMessage(
    @Param('id') id: string,
    @Body() body: CreateMessageDto,
    @Headers('authorization') authorization?: string,
  ) {
    const actor = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.senderId,
    );
    this.coreDatabase.assertUserNotRestrictedFor(actor, 'chat');
    return this.coreDatabase.createMessage(id, actor.id, body.text ?? body.message ?? body.body ?? '', {
      attachments: body.attachments,
      replyToMessageId: body.replyToMessageId,
      kind: body.kind ?? body.type,
      mediaPath: body.mediaPath ?? body.attachmentUrl,
      mediaUrl: body.mediaUrl ?? body.attachmentUrl,
      imageUrl: body.imageUrl,
      audioUrl: body.audioUrl,
      videoUrl: body.videoUrl,
      fileUrl: body.fileUrl,
      fileName: body.fileName,
      mimeType: body.mimeType,
      uploadId: body.uploadId,
      attachmentItems: body.attachmentItems,
      latitude: body.latitude ?? body.lat,
      longitude: body.longitude ?? body.lng ?? body.lon,
      locationUrl:
        body.locationUrl ?? body.mapUrl ?? body.mapsUrl ?? body.googleMapsUrl,
      locationName: body.locationName ?? body.locationLabel ?? body.address,
      location: body.location,
    });
  }
}
