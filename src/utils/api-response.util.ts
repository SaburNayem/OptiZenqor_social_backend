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
