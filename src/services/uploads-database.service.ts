import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { makeId } from '../common/id.util';
import { PrismaService } from './prisma.service';

@Injectable()
export class UploadsDatabaseService {
  constructor(private readonly prisma: PrismaService) {}

  async getUploads(userId?: string) {
    const uploads = await this.prisma.mediaUpload.findMany({
      where: userId?.trim() ? { userId: userId.trim() } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    return uploads.map((row) => this.mapUpload(row));
  }

  async getUpload(id: string) {
    const upload = await this.prisma.mediaUpload.findUnique({
      where: { id },
    });
    if (!upload) {
      throw new NotFoundException(`Upload ${id} not found`);
    }
    return this.mapUpload(upload);
  }

  async createUpload(input: {
    userId?: string | null;
    fileName: string;
    originalFilename?: string | null;
    mimeType?: string | null;
    sizeBytes?: number | null;
    url?: string | null;
    secureUrl?: string | null;
    publicId?: string | null;
    provider?: string | null;
    resourceType?: string | null;
    folder?: string | null;
    status?: string;
    metadata?: Record<string, unknown>;
  }) {
    const upload = await this.prisma.mediaUpload.create({
      data: {
        id: makeId('upload'),
        userId: input.userId?.trim() || null,
        fileName: input.fileName,
        originalFilename: input.originalFilename ?? null,
        mimeType: input.mimeType ?? null,
        sizeBytes:
          input.sizeBytes == null ? null : BigInt(Math.max(0, Math.trunc(input.sizeBytes))),
        url: input.url ?? null,
        secureUrl: input.secureUrl ?? null,
        publicId: input.publicId ?? null,
        provider: input.provider ?? 'cloudinary',
        resourceType: input.resourceType ?? null,
        folder: input.folder ?? null,
        status: input.status ?? 'completed',
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
    return this.mapUpload(upload);
  }

  async updateUploadStatus(id: string, action: 'retry' | 'cancel' | 'pause') {
    const existing = await this.prisma.mediaUpload.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Upload ${id} not found`);
    }

    const status =
      action === 'retry' ? 'uploading' : action === 'cancel' ? 'failed' : 'paused';

    const upload = await this.prisma.mediaUpload.update({
      where: { id },
      data: { status },
    });
    return this.mapUpload(upload);
  }

  private mapUpload(row: {
    id: string;
    userId: string | null;
    fileName: string;
    originalFilename: string | null;
    mimeType: string | null;
    sizeBytes: bigint | null;
    url: string | null;
    secureUrl: string | null;
    publicId: string | null;
    provider: string;
    resourceType: string | null;
    folder: string | null;
    status: string;
    metadata: Prisma.JsonValue;
    createdAt: Date;
  }) {
    return {
      id: row.id,
      userId: row.userId,
      fileName: row.fileName,
      originalFilename: row.originalFilename,
      mimeType: row.mimeType,
      size: row.sizeBytes == null ? null : Number(row.sizeBytes),
      sizeBytes: row.sizeBytes == null ? null : Number(row.sizeBytes),
      url: row.url,
      secureUrl: row.secureUrl,
      publicId: row.publicId,
      provider: row.provider,
      resourceType: row.resourceType,
      folder: row.folder,
      status: row.status,
      metadata: this.toObject(row.metadata),
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toObject(value: Prisma.JsonValue) {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }
}
