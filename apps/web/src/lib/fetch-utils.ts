import { REQUEST_TIMEOUT_MS } from '@/lib/constants';

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
