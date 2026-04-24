import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ExtendedDataService } from '../data/extended-data.service';
import { CloudinaryUploadService } from '../services/cloudinary-upload.service';

@ApiTags('uploads')
@Controller()
export class UploadsController {
  constructor(
    private readonly cloudinaryUploadService: CloudinaryUploadService,
    private readonly extendedData: ExtendedDataService,
  ) {}

  @Get('uploads')
  getUploads() {
    const uploads = this.extendedData.getUploads();
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
  getUpload(@Param('id') id: string) {
    const upload = this.extendedData.getUpload(id);
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

    const uploadTask = await this.extendedData.registerUpload({
      fileName: file.originalname,
      progress: 1,
      status: 'completed',
      mimeType: file.mimetype,
      size: file.size,
      url: uploaded.url,
      secureUrl: uploaded.secureUrl,
      publicId: uploaded.publicId,
      provider: uploaded.provider,
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
