import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { QueryResultRow } from 'pg';
import { makeId } from '../common/id.util';
import { DatabaseService } from './database.service';

type UploadRow = QueryResultRow & {
  id: string;
  user_id: string | null;
  file_name: string;
  original_filename: string | null;
  mime_type: string | null;
  size_bytes: string | number | null;
  url: string | null;
  secure_url: string | null;
  public_id: string | null;
  provider: string;
  resource_type: string | null;
  folder: string | null;
  status: string;
  metadata: Record<string, unknown> | null;
  created_at: string | Date;
};

@Injectable()
export class UploadsDatabaseService implements OnModuleInit {
  private schemaEnsured = false;

  constructor(private readonly database: DatabaseService) {}

  async onModuleInit() {
    await this.ensureSchema();
  }

  async getUploads(userId?: string) {
    await this.ensureSchema();
    const result = userId?.trim()
      ? await this.database.query<UploadRow>(
          `select * from app_uploads where user_id = $1 order by created_at desc`,
          [userId.trim()],
        )
      : await this.database.query<UploadRow>(
          `select * from app_uploads order by created_at desc`,
        );
    return result.rows.map((row) => this.mapUpload(row));
  }

  async getUpload(id: string) {
    await this.ensureSchema();
    const result = await this.database.query<UploadRow>(
      `select * from app_uploads where id = $1 limit 1`,
      [id],
    );
    const row = result.rows[0];
    if (!row) {
      throw new NotFoundException(`Upload ${id} not found`);
    }
    return this.mapUpload(row);
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
    await this.ensureSchema();
    const result = await this.database.query<UploadRow>(
      `
      insert into app_uploads (
        id, user_id, file_name, original_filename, mime_type, size_bytes, url,
        secure_url, public_id, provider, resource_type, folder, status, metadata
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb
      )
      returning *
      `,
      [
        makeId('upload'),
        input.userId?.trim() || null,
        input.fileName,
        input.originalFilename ?? null,
        input.mimeType ?? null,
        input.sizeBytes ?? null,
        input.url ?? null,
        input.secureUrl ?? null,
        input.publicId ?? null,
        input.provider ?? 'cloudinary',
        input.resourceType ?? null,
        input.folder ?? null,
        input.status ?? 'completed',
        JSON.stringify(input.metadata ?? {}),
      ],
    );
    return this.mapUpload(result.rows[0]);
  }

  async updateUploadStatus(id: string, action: 'retry' | 'cancel' | 'pause') {
    await this.ensureSchema();
    const status =
      action === 'retry' ? 'uploading' : action === 'cancel' ? 'failed' : 'paused';
    const result = await this.database.query<UploadRow>(
      `update app_uploads set status = $2 where id = $1 returning *`,
      [id, status],
    );
    const row = result.rows[0];
    if (!row) {
      throw new NotFoundException(`Upload ${id} not found`);
    }
    return this.mapUpload(row);
  }

  private async ensureSchema() {
    if (this.schemaEnsured || !this.database.getHealth().enabled) {
      return;
    }
    await this.database.query(`
      create table if not exists app_uploads (
        id text primary key,
        user_id text null references app_users(id) on delete set null,
        file_name text not null,
        original_filename text null,
        mime_type text null,
        size_bytes bigint null,
        url text null,
        secure_url text null,
        public_id text null,
        provider text not null default 'cloudinary',
        resource_type text null,
        folder text null,
        status text not null default 'completed',
        metadata jsonb not null default '{}'::jsonb,
        created_at timestamptz not null default now(),
        constraint app_uploads_id_format check (id ~ '^upload_[a-zA-Z0-9]+$')
      );
    `);
    this.schemaEnsured = true;
  }

  private mapUpload(row: UploadRow) {
    return {
      id: row.id,
      userId: row.user_id,
      fileName: row.file_name,
      originalFilename: row.original_filename,
      mimeType: row.mime_type,
      size: row.size_bytes == null ? null : Number(row.size_bytes),
      sizeBytes: row.size_bytes == null ? null : Number(row.size_bytes),
      url: row.url,
      secureUrl: row.secure_url,
      publicId: row.public_id,
      provider: row.provider,
      resourceType: row.resource_type,
      folder: row.folder,
      status: row.status,
      metadata: row.metadata ?? {},
      createdAt:
        row.created_at instanceof Date
          ? row.created_at.toISOString()
          : new Date(row.created_at).toISOString(),
    };
  }
}
