/**
 * The message a failed `fetch` response carries: its JSON `error` (or
 * `message`) when the body has one, otherwise `fallback`. Never throws — a
 * body that is not JSON just yields the fallback.
 */
export async function readErrorMessage(
  response: Response,
  fallback = `HTTP ${response.status}`
): Promise<string> {
  const body: { error?: string; message?: string } | null = await response
    .json()
    .catch(() => null);
  return body?.error || body?.message || fallback;
}
