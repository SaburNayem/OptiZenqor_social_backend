import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { QueryResultRow } from 'pg';
import { DatabaseService } from './database.service';

type SnapshotRow = QueryResultRow & {
  snapshot_key: string;
  payload: unknown;
};

@Injectable()
export class StateSnapshotService implements OnModuleInit {
  private readonly logger = new Logger(StateSnapshotService.name);
  private tableEnsured = false;

  constructor(private readonly database: DatabaseService) {}

  async onModuleInit() {
    await this.ensureTable();
  }

  async load<T>(snapshotKey: string): Promise<T | null> {
    if (!this.database.getHealth().enabled) {
      return null;
    }

    await this.ensureTable();
    const { rows } = await this.database.query<SnapshotRow>(
      `select snapshot_key, payload
       from app_state_snapshots
       where snapshot_key = $1
       limit 1`,
      [snapshotKey],
    );
    return (rows[0]?.payload as T | undefined) ?? null;
  }

  async save(snapshotKey: string, payload: unknown) {
    if (!this.database.getHealth().enabled) {
      return;
    }

    await this.ensureTable();
    await this.database.query(
      `insert into app_state_snapshots (snapshot_key, payload, updated_at)
       values ($1, $2::jsonb, now())
       on conflict (snapshot_key)
       do update set payload = excluded.payload, updated_at = now()`,
      [snapshotKey, JSON.stringify(payload)],
    );
  }

  private async ensureTable() {
    if (this.tableEnsured || !this.database.getHealth().enabled) {
      return;
    }

    try {
      await this.database.query(`
        create table if not exists app_state_snapshots (
          snapshot_key text primary key,
          payload jsonb not null,
          updated_at timestamptz not null default now()
        );
      `);
      this.tableEnsured = true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown snapshot table error.';
      this.logger.warn(`Snapshot storage unavailable: ${message}`);
    }
  }
}
