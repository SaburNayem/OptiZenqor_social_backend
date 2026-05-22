import { Injectable, Logger } from '@nestjs/common';
import type { App } from 'firebase-admin/app';
import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

type FirebaseServiceAccount = {
  projectId?: string;
  clientEmail?: string;
  privateKey?: string;
  project_id?: string;
  client_email?: string;
  private_key?: string;
};

export type FirebasePushResult = {
  configured: boolean;
  attempted: number;
  successCount: number;
  failureCount: number;
  invalidTokens: string[];
  errors: Array<{ token: string; code: string; message: string }>;
};

@Injectable()
export class FirebasePushService {
  private readonly logger = new Logger(FirebasePushService.name);
  private app: App | null | undefined;
  private configurationError: string | null = null;

  async sendToTokens(
    tokens: string[],
    notification: { title: string; body: string },
    data: Record<string, unknown> = {},
  ): Promise<FirebasePushResult> {
    const uniqueTokens = [...new Set(tokens.map((token) => token.trim()).filter(Boolean))];
    const baseResult: FirebasePushResult = {
      configured: this.isConfigured(),
      attempted: uniqueTokens.length,
      successCount: 0,
      failureCount: 0,
      invalidTokens: [],
      errors: [],
    };

    if (uniqueTokens.length === 0) {
      return baseResult;
    }

    const messaging = this.getMessagingClient();
    if (!messaging) {
      return {
        ...baseResult,
        configured: false,
        failureCount: uniqueTokens.length,
        errors: this.configurationError
          ? [{ token: '', code: 'firebase_not_configured', message: this.configurationError }]
          : [],
      };
    }

    const payloadData = this.stringifyData(data);
    const chunks = this.chunk(uniqueTokens, 500);
    const result: FirebasePushResult = {
      configured: true,
      attempted: uniqueTokens.length,
      successCount: 0,
      failureCount: 0,
      invalidTokens: [],
      errors: [],
    };

    for (const chunk of chunks) {
      try {
        const response = await messaging.sendEachForMulticast({
          tokens: chunk,
          notification,
          data: payloadData,
          android: {
            priority: 'high',
            notification: {
              channelId: 'default_channel',
              sound: 'default',
            },
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
              },
            },
          },
        });

        result.successCount += response.successCount;
        result.failureCount += response.failureCount;
        response.responses.forEach((item, index) => {
          if (item.success || !item.error) {
            return;
          }

          const token = chunk[index];
          const code = item.error.code;
          if (this.isInvalidTokenError(code)) {
            result.invalidTokens.push(token);
          }
          if (result.errors.length < 20) {
            result.errors.push({
              token,
              code,
              message: item.error.message,
            });
          }
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to send Firebase notification.';
        this.logger.warn(message);
        result.failureCount += chunk.length;
        if (result.errors.length < 20) {
          result.errors.push({
            token: '',
            code: 'firebase_send_failed',
            message,
          });
        }
      }
    }

    result.invalidTokens = [...new Set(result.invalidTokens)];
    return result;
  }

  isConfigured() {
    return Boolean(
      process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim() ||
        process.env.FIREBASE_SERVICE_ACCOUNT_BASE64?.trim() ||
        process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim() ||
        (process.env.FIREBASE_PROJECT_ID?.trim() &&
          process.env.FIREBASE_CLIENT_EMAIL?.trim() &&
          process.env.FIREBASE_PRIVATE_KEY?.trim()),
    );
  }

  private getMessagingClient() {
    const app = this.getApp();
    return app ? getMessaging(app) : null;
  }

  private getApp() {
    if (this.app !== undefined) {
      return this.app;
    }

    this.configurationError = null;
    if (!this.isConfigured()) {
      this.configurationError =
        'Firebase Admin credentials are missing. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY.';
      this.app = null;
      return this.app;
    }

    const existing = getApps().find((item) => item.name === 'socity-backend-fcm');
    if (existing) {
      this.app = existing;
      return this.app;
    }

    try {
      const serviceAccount = this.readServiceAccount();
      this.app = initializeApp(
        serviceAccount
          ? {
              credential: cert({
                projectId: serviceAccount.projectId,
                clientEmail: serviceAccount.clientEmail,
                privateKey: serviceAccount.privateKey,
              }),
              projectId: serviceAccount.projectId,
            }
          : {
              credential: applicationDefault(),
              projectId: process.env.FIREBASE_PROJECT_ID?.trim() || undefined,
            },
        'socity-backend-fcm',
      );
      return this.app;
    } catch (error) {
      this.configurationError =
        error instanceof Error ? error.message : 'Firebase Admin initialization failed.';
      this.logger.warn(this.configurationError);
      this.app = null;
      return this.app;
    }
  }

  private readServiceAccount() {
    const raw =
      process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim() ||
      this.decodeBase64(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64?.trim());
    const parsed = raw ? (JSON.parse(raw) as FirebaseServiceAccount) : null;

    const projectId =
      parsed?.project_id ?? parsed?.projectId ?? process.env.FIREBASE_PROJECT_ID?.trim();
    const clientEmail =
      parsed?.client_email ?? parsed?.clientEmail ?? process.env.FIREBASE_CLIENT_EMAIL?.trim();
    const privateKey =
      parsed?.private_key ?? parsed?.privateKey ?? process.env.FIREBASE_PRIVATE_KEY?.trim();

    if (!projectId || !clientEmail || !privateKey) {
      return null;
    }

    return {
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    };
  }

  private decodeBase64(value?: string) {
    if (!value) {
      return '';
    }
    return Buffer.from(value, 'base64').toString('utf8');
  }

  private stringifyData(data: Record<string, unknown>) {
    return Object.fromEntries(
      Object.entries(data)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => [key, typeof value === 'string' ? value : JSON.stringify(value)]),
    );
  }

  private isInvalidTokenError(code: string) {
    return [
      'messaging/invalid-argument',
      'messaging/invalid-registration-token',
      'messaging/registration-token-not-registered',
    ].includes(code);
  }

  private chunk<T>(items: T[], size: number) {
    const chunks: T[][] = [];
    for (let index = 0; index < items.length; index += size) {
      chunks.push(items.slice(index, index + size));
    }
    return chunks;
  }
}
