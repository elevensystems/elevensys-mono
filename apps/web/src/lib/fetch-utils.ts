import { OPENAI_URL } from '@/lib/api-urls';
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

/**
 * Sends one prompt to the backend's OpenAI relay, under the request timeout.
 * A timeout rejects with an `AbortError`.
 */
export function postToOpenAI(
  model: string,
  input: { role: 'system' | 'user'; content: string }[]
): Promise<Response> {
  return fetchWithTimeout(OPENAI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, input, temperature: 1, store: true }),
  });
}

/** The generated text in a relay reply, which nests it under `data` or not. */
export function getOutputText(data: unknown): string {
  const reply = data as {
    output_text?: string;
    data?: { output_text?: string };
  } | null;
  return reply?.output_text || reply?.data?.output_text || '';
}
