import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CloudinaryUploadService } from '../services/cloudinary-upload.service';
import { CoreDatabaseService } from '../services/core-database.service';
import { UploadsDatabaseService } from '../services/uploads-database.service';

@ApiTags('uploads')
@Controller()
export class UploadsController {
  constructor(
    private readonly cloudinaryUploadService: CloudinaryUploadService,
    private readonly uploadsDatabase: UploadsDatabaseService,
    private readonly coreDatabase: CoreDatabaseService,
  ) {}

  @Get('uploads')
  async getUploads() {
    const uploads = await this.uploadsDatabase.getUploads();
    return {
      success: true,
      message: 'Uploads fetched successfully.',
      data: uploads,
      items: uploads,
      results: uploads,
      count: uploads.length,
    };
  }

  @Get('uploads/:id')
  async getUpload(@Param('id') id: string) {
    const upload = await this.uploadsDatabase.getUpload(id);
    const remotePath = upload.secureUrl ?? upload.url ?? null;
    return {
      success: true,
      message: 'Upload fetched successfully.',
      upload,
      url: remotePath,
      secureUrl: upload.secureUrl,
      remotePath,
      path: remotePath,
      fileUrl: remotePath,
      data: upload,
    };
  }

  @Post(['uploads', 'upload-manager'])
  @ApiOperation({ summary: 'Upload a file to Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
        folder: { type: 'string', example: 'optizenqor/posts' },
        publicId: { type: 'string', example: 'post-cover-1' },
        resourceType: {
          type: 'string',
          enum: ['auto', 'image', 'video', 'raw'],
          example: 'auto',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 25 * 1024 * 1024 } }))
  async uploadFile(
    @UploadedFile()
    file?: {
      originalname?: string;
      mimetype?: string;
      buffer?: Buffer;
      size?: number;
    },
    @Body('folder') folder?: string,
    @Body('publicId') publicId?: string,
    @Body('resourceType') resourceType?: string,
    @Body('userId') userId?: string,
    @Body('authorId') authorId?: string,
    @Body('ownerId') ownerId?: string,
    @Body('creatorId') creatorId?: string,
    @Body('actorId') actorId?: string,
    @Body('recipientId') recipientId?: string,
    @Body() body?: Record<string, unknown>,
    @Headers('authorization') authorization?: string,
  ) {
    if (!file?.buffer || !file.originalname) {
      throw new BadRequestException('Multipart field "file" is required.');
    }

    const uploaded = await this.cloudinaryUploadService.uploadBuffer(file.buffer, {
      folder,
      publicId,
      resourceType,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
    });

    const user = await this.coreDatabase
      .requireUserFromAuthorization(
        authorization,
        [userId, authorId, ownerId, creatorId, actorId, recipientId]
          .find((value) => value?.trim())
          ?.trim(),
      )
      .catch(() => null);

    const uploadTask = await this.uploadsDatabase.createUpload({
      userId: user?.id ?? null,
      fileName: file.originalname,
      status: 'completed',
      mimeType: file.mimetype ?? null,
      sizeBytes: file.size ?? uploaded.bytes,
      url: uploaded.url,
      secureUrl: uploaded.secureUrl,
      publicId: uploaded.publicId,
      provider: uploaded.provider,
      resourceType: uploaded.resourceType,
      folder: uploaded.folder,
      originalFilename: uploaded.originalFilename,
      metadata: {
        body: body ?? {},
        cloudinary: uploaded,
      },
    });

    const remotePath = uploaded.secureUrl ?? uploaded.url ?? uploadTask.secureUrl ?? uploadTask.url;
    const payload = {
      upload: uploadTask,
      asset: uploaded,
      url: remotePath ?? uploaded.url ?? uploadTask.url ?? null,
      secureUrl: uploaded.secureUrl ?? uploadTask.secureUrl ?? null,
      remotePath: remotePath ?? null,
      path: remotePath ?? null,
      fileUrl: remotePath ?? null,
    };

    return {
      success: true,
      message: 'File uploaded successfully.',
      ...payload,
      data: payload,
    };
  }
}
