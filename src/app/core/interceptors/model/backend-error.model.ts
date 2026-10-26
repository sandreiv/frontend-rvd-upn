export interface BackendErrorPayload {
  message?: string;
  error?: string;
  title?: string;
  detail?: string;
}

export function extractBackendErrorMessage(
  payload: BackendErrorPayload | string | null | undefined,
  fallback = '',
): string {
  if (typeof payload === 'string' && payload.trim()) {
    return payload.trim();
  }

  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  return (
    payload.message?.trim() ||
    payload.error?.trim() ||
    payload.detail?.trim() ||
    payload.title?.trim() ||
    fallback
  );
}
