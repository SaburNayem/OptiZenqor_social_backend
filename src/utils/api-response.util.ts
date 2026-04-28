export function successResponse<T>(
  message: string,
  data: T,
  meta?: Record<string, unknown>,
) {
  return {
    success: true,
    message,
    data,
    ...(meta ? { meta } : {}),
  };
}

export function listResponse<T>(
  message: string,
  items: T[],
  meta: Record<string, unknown> = {},
) {
  return successResponse(message, items, {
    count: items.length,
    ...meta,
  });
}
