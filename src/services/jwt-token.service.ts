import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';

type SupportedTokenType = 'access' | 'refresh';

export type JwtLikePayload = {
  sub: string;
  sid: string;
  type: SupportedTokenType;
  role?: string;
  email?: string;
  iat: number;
  exp: number;
};

@Injectable()
export class JwtTokenService {
  signToken(
    payload: Omit<JwtLikePayload, 'iat' | 'exp'>,
    expiresInSeconds: number,
    secret: string,
  ) {
    const issuedAtSeconds = Math.floor(Date.now() / 1000);
    const body: JwtLikePayload = {
      ...payload,
      iat: issuedAtSeconds,
      exp: issuedAtSeconds + expiresInSeconds,
    };

    const encodedHeader = this.base64UrlEncode(
      JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
    );
    const encodedPayload = this.base64UrlEncode(JSON.stringify(body));
    const signature = this.sign(`${encodedHeader}.${encodedPayload}`, secret);
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  verifyToken(token: string, secret: string, expectedType?: SupportedTokenType) {
    const [encodedHeader, encodedPayload, signature] = token.split('.');
    if (!encodedHeader || !encodedPayload || !signature) {
      throw new UnauthorizedException('Malformed token.');
    }

    const expectedSignature = this.sign(`${encodedHeader}.${encodedPayload}`, secret);
    const providedBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);
    if (
      providedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(providedBuffer, expectedBuffer)
    ) {
      throw new UnauthorizedException('Invalid token signature.');
    }

    const payload = JSON.parse(this.base64UrlDecode(encodedPayload)) as JwtLikePayload;
    if (!payload?.sub || !payload?.sid || !payload?.type || !payload?.exp) {
      throw new UnauthorizedException('Token payload is invalid.');
    }
    if (expectedType && payload.type !== expectedType) {
      throw new UnauthorizedException('Token type is invalid.');
    }
    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('Token has expired.');
    }
    return payload;
  }

  private sign(value: string, secret: string) {
    return this.base64UrlEncode(
      createHmac('sha256', secret).update(value).digest(),
      true,
    );
  }

  private base64UrlEncode(value: string | Buffer, rawBuffer = false) {
    const buffer = rawBuffer ? (value as Buffer) : Buffer.from(String(value), 'utf8');
    return buffer
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }

  private base64UrlDecode(value: string) {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
    return Buffer.from(`${normalized}${padding}`, 'base64').toString('utf8');
  }
}
