import { createHmac, timingSafeEqual } from 'crypto';

export interface JwtClaims {
  sub: string;
  sessionId: string;
  role: string;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}

function base64UrlEncode(value: string | Buffer) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, 'base64').toString('utf8');
}

function toSeconds(value: string | undefined, fallbackSeconds: number) {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return fallbackSeconds;
  }

  const exactNumber = Number(normalized);
  if (Number.isFinite(exactNumber) && exactNumber > 0) {
    return Math.floor(exactNumber);
  }

  const match = normalized.match(/^(\d+)([smhd])$/);
  if (!match) {
    return fallbackSeconds;
  }

  const amount = Number(match[1]);
  const unit = match[2];
  switch (unit) {
    case 's':
      return amount;
    case 'm':
      return amount * 60;
    case 'h':
      return amount * 60 * 60;
    case 'd':
      return amount * 60 * 60 * 24;
    default:
      return fallbackSeconds;
  }
}

export function resolveAccessTokenSecret() {
  return process.env.JWT_ACCESS_SECRET?.trim() || process.env.JWT_SECRET?.trim() || '';
}

export function resolveRefreshTokenSecret() {
  return process.env.JWT_REFRESH_SECRET?.trim() || process.env.JWT_SECRET?.trim() || '';
}

export function getAccessTokenTtlSeconds() {
  return toSeconds(process.env.JWT_ACCESS_EXPIRES_IN ?? process.env.JWT_EXPIRES_IN, 60 * 60);
}

export function getRefreshTokenTtlSeconds() {
  return toSeconds(process.env.JWT_REFRESH_EXPIRES_IN, 60 * 60 * 24 * 30);
}

export function signJwt(
  payload: Omit<JwtClaims, 'iat' | 'exp'>,
  secret: string,
  expiresInSeconds: number,
) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const claims: JwtClaims = {
    ...payload,
    iat: issuedAt,
    exp: issuedAt + expiresInSeconds,
  };
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(claims));
  const signature = createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest();
  return `${encodedHeader}.${encodedPayload}.${base64UrlEncode(signature)}`;
}

export function verifyJwt(token: string, secret: string) {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    throw new Error('Malformed JWT.');
  }

  const expectedSignature = createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest();
  const actualSignature = Buffer.from(
    encodedSignature.replace(/-/g, '+').replace(/_/g, '/'),
    'base64',
  );

  if (
    expectedSignature.length !== actualSignature.length ||
    !timingSafeEqual(expectedSignature, actualSignature)
  ) {
    throw new Error('JWT signature is invalid.');
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload)) as JwtClaims;
  if (!payload?.sub || !payload?.type || !payload?.sessionId) {
    throw new Error('JWT payload is invalid.');
  }
  if (payload.exp * 1000 <= Date.now()) {
    throw new Error('JWT has expired.');
  }
  return payload;
}
