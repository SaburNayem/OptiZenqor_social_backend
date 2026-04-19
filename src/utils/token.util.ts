export function extractMockEntityIdFromAuthHeader(
  authorization?: string,
  prefix: 'mock-token-' | 'admin-token-' = 'mock-token-',
) {
  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token?.startsWith(prefix)) {
    return null;
  }

  return token.slice(prefix.length);
}
