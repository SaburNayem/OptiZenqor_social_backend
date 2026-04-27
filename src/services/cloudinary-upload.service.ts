import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { createHash } from 'crypto';

interface UploadOptions {
  folder?: string;
  publicId?: string;
  resourceType?: string;
  originalFilename?: string;
  mimeType?: string;
}

@Injectable()
export class CloudinaryUploadService {
  isConfigured() {
    return Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET,
    );
  }

  async uploadBuffer(fileBuffer: Buffer, options: UploadOptions = {}) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new InternalServerErrorException(
        'Cloudinary configuration is missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in the environment.',
      );
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = options.folder?.trim() || 'optizenqor/uploads';
    const publicId = options.publicId?.trim();
    const resourceType = options.resourceType?.trim() || 'auto';
    const dataUri = `data:${options.mimeType ?? 'application/octet-stream'};base64,${fileBuffer.toString('base64')}`;

    const signaturePayload = [
      `folder=${folder}`,
      ...(publicId ? [`public_id=${publicId}`] : []),
      `timestamp=${timestamp}`,
    ].join('&');

    const signature = createHash('sha1')
      .update(`${signaturePayload}${apiSecret}`)
      .digest('hex');

    const formData = new FormData();
    formData.append('file', dataUri);
    formData.append('api_key', apiKey);
    formData.append('timestamp', String(timestamp));
    formData.append('folder', folder);
    if (publicId) {
      formData.append('public_id', publicId);
    }
    formData.append('signature', signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      {
        method: 'POST',
        body: formData,
      },
    );

    const payload = (await response.json()) as Record<string, unknown>;
    if (!response.ok) {
      const message =
        typeof payload.error === 'object' &&
        payload.error &&
        'message' in payload.error &&
        typeof payload.error.message === 'string'
          ? payload.error.message
          : 'Cloudinary upload failed.';
      throw new BadGatewayException(message);
    }

    return {
      provider: 'cloudinary',
      originalFilename: options.originalFilename ?? null,
      resourceType,
      folder,
      publicId: typeof payload.public_id === 'string' ? payload.public_id : null,
      url: typeof payload.url === 'string' ? payload.url : null,
      secureUrl: typeof payload.secure_url === 'string' ? payload.secure_url : null,
      bytes: typeof payload.bytes === 'number' ? payload.bytes : fileBuffer.length,
      format: typeof payload.format === 'string' ? payload.format : null,
      width: typeof payload.width === 'number' ? payload.width : null,
      height: typeof payload.height === 'number' ? payload.height : null,
      createdAt:
        typeof payload.created_at === 'string'
          ? payload.created_at
          : new Date().toISOString(),
    };
  }
}
