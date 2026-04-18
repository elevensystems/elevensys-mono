import { REQUEST_TIMEOUT_MS } from '@/lib/constants';

const HTTP_STATUS_MESSAGES: Record<number, string> = {
  400: 'Bad request',
  401: 'Unauthorized - please log in again',
  403: 'Forbidden - you do not have permission',
  404: 'Resource not found',
  408: 'Request timed out',
  429: 'Too many requests - please try again later',
  500: 'Internal server error',
  502: 'Bad gateway',
  503: 'Service unavailable - please try again later',
  504: 'Gateway timed out',
};

/**
 * Converts raw error response text (which may be HTML or very long)
 * into a short, user-friendly message.
 */
export function sanitizeErrorText(text: string, status: number): string {
  if (!text) {
    return HTTP_STATUS_MESSAGES[status] ?? `Request failed (${status})`;
  }

  // If the response is HTML (e.g. Jira error pages), return a clean message
  if (text.includes('<!DOCTYPE') || text.includes('<html')) {
    return HTTP_STATUS_MESSAGES[status] ?? `Request failed (${status})`;
  }

  // Try parsing as JSON error
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed.error === 'string') return parsed.error;
    if (typeof parsed.message === 'string') return parsed.message;
  } catch {
    // Not JSON, use the text as-is if it's short enough
  }

  // If the text is very long, it's probably not a user-friendly message
  if (text.length > 200) {
    return HTTP_STATUS_MESSAGES[status] ?? `Request failed (${status})`;
  }

  return text;
}

/**
 * Wraps fetch with an AbortController timeout.
 * Automatically aborts if the request exceeds the given timeout.
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = REQUEST_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}
