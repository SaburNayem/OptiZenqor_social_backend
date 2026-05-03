export function successResponse<T>(
  message: string,
  data: T,
  meta?: Record<string, unknown>,
) {
  const pagination = isPaginationShape(meta) ? meta : undefined;
  return {
    success: true,
    message,
    data,
    ...(pagination ? { pagination } : {}),
  };
}

export function listResponse<T>(
  message: string,
  items: T[],
  meta?: Record<string, unknown>,
) {
  return successResponse(message, items, meta);
}

export function compatibilityResponse<T>(
  message: string,
  data: T,
  options?: {
    aliases?: Record<string, unknown>;
    pagination?: Record<string, unknown>;
  },
) {
  return {
    ...successResponse(message, data, options?.pagination),
    ...(options?.aliases ?? {}),
  };
}

export function compatibilityListResponse<T>(
  message: string,
  items: T[],
  options?: {
    aliases?: Record<string, unknown>;
    pagination?: Record<string, unknown>;
  },
) {
  return compatibilityResponse(message, items, {
    aliases: options?.aliases,
    pagination: options?.pagination,
  });
}

function isPaginationShape(
  value?: Record<string, unknown>,
): value is Record<string, unknown> {
  if (!value) {
    return false;
  }

  return (
    typeof value.page === 'number' &&
    typeof value.limit === 'number' &&
    typeof value.total === 'number'
  );
}
