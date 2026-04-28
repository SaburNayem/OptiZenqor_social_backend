import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Pool, PoolConfig, QueryResult, QueryResultRow } from 'pg';

type DatabaseConnectionStatus = 'disabled' | 'connecting' | 'connected' | 'error';

interface DatabaseHealthState {
  enabled: boolean;
  status: DatabaseConnectionStatus;
  driver: 'pg';
  host: string | null;
  database: string | null;
  checkedAt: string | null;
  error: string | null;
}

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool | null = null;
  private healthState: DatabaseHealthState = {
    enabled: false,
    status: 'disabled',
    driver: 'pg',
    host: null,
    database: null,
    checkedAt: null,
    error: null,
  };

  async onModuleInit() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      if ((process.env.NODE_ENV ?? '').trim().toLowerCase() === 'production') {
        throw new InternalServerErrorException(
          'DATABASE_URL is required in production. Refusing to start without a database connection.',
        );
      }
      this.logger.warn('DATABASE_URL is not set. Database connection is disabled.');
      this.healthState = {
        ...this.healthState,
        enabled: false,
        status: 'disabled',
        checkedAt: new Date().toISOString(),
      };
      return;
    }

    this.healthState = {
      ...this.healthState,
      enabled: true,
      status: 'connecting',
      error: null,
      checkedAt: new Date().toISOString(),
    };

    const parsedUrl = new URL(connectionString);
    const normalizedConnectionString = this.normalizeConnectionString(parsedUrl);
    const poolConfig: PoolConfig = {
      connectionString: normalizedConnectionString,
      max: Number(process.env.DB_POOL_MAX ?? 10),
      idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS ?? 30000),
      connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT_MS ?? 10000),
      ssl: this.shouldUseSsl(parsedUrl)
        ? {
            rejectUnauthorized:
              (process.env.DB_SSL_REJECT_UNAUTHORIZED ?? 'false') === 'true',
          }
        : undefined,
    };

    this.pool = new Pool(poolConfig);
    this.pool.on('error', (error) => {
      this.logger.error(`PostgreSQL pool error: ${error.message}`);
      this.healthState = {
        ...this.healthState,
        status: 'error',
        error: error.message,
        checkedAt: new Date().toISOString(),
      };
    });

    try {
      const probe = await this.pool.query<{
        current_database: string;
        current_timestamp: Date;
      }>('select current_database(), current_timestamp');

      this.healthState = {
        enabled: true,
        status: 'connected',
        driver: 'pg',
        host: parsedUrl.hostname,
        database: probe.rows[0]?.current_database ?? this.readDatabaseName(parsedUrl),
        checkedAt: new Date().toISOString(),
        error: null,
      };

      this.logger.log(
        `PostgreSQL connected to ${this.healthState.host}/${this.healthState.database}`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown PostgreSQL connection failure.';
      this.healthState = {
        enabled: true,
        status: 'error',
        driver: 'pg',
        host: parsedUrl.hostname,
        database: this.readDatabaseName(parsedUrl),
        checkedAt: new Date().toISOString(),
        error: message,
      };
      this.logger.error(`PostgreSQL connection failed: ${message}`);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<QueryResult<T>> {
    if (!this.pool) {
      throw new InternalServerErrorException(
        'Database pool is not initialized. Check DATABASE_URL configuration.',
      );
    }
    return this.pool.query<T>(text, params);
  }

  getHealth() {
    return this.healthState;
  }

  private shouldUseSsl(parsedUrl: URL) {
    const sslEnv = process.env.DB_SSL;
    if (sslEnv === 'true') {
      return true;
    }
    if (sslEnv === 'false') {
      return false;
    }
    const sslMode = parsedUrl.searchParams.get('sslmode');
    return sslMode === 'require' || parsedUrl.hostname.includes('neon.tech');
  }

  private readDatabaseName(parsedUrl: URL) {
    return parsedUrl.pathname.replace(/^\//, '') || null;
  }

  private normalizeConnectionString(parsedUrl: URL) {
    const normalized = new URL(parsedUrl.toString());
    normalized.searchParams.delete('sslmode');
    return normalized.toString();
  }
}
