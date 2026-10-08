import { NextResponse } from 'next/server';

import { env } from '@/env';
import { ApiError } from '@/lib/api-error';

/**
 * The JSON reply for an error a route handler caught. An `ApiError` (which
 * includes `GlobalConfigError`) keeps its status and message; anything else is
 * logged under `context` and answered with a 500 carrying `fallback`.
 */
export function errorResponse(
  error: unknown,
  context: string,
  fallback = 'Internal server error'
): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status }
    );
  }
  console.error(`${context}:`, error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}

type ApiFetchOptions = Omit<RequestInit, 'body'> & {
  accessToken: string;
  body?: unknown;
};

export async function apiFetch<T = unknown>(
  path: string,
  { accessToken, body, headers, ...init }: ApiFetchOptions
): Promise<T> {
  const url = `${env.API_BASE_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;

  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  const text = await response.text();
  const data = text ? safeJson(text) : null;

  if (!response.ok) {
    const message =
      (data && typeof data === 'object' && 'message' in data
        ? String((data as { message: unknown }).message)
        : null) ||
      text ||
      `Request failed with status ${response.status}`;
    throw new ApiError(response.status, message);
  }

  return data as T;
}

const safeJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};
