import { NextRequest, NextResponse } from 'next/server';

import { URLIFY_URLS } from '@/lib/api-urls';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { originalUrl, createdBy, autoDelete, ttlDays } = body;
    const apiUrl = URLIFY_URLS.SHORTEN;

    // Validate input
    if (!originalUrl || typeof originalUrl !== 'string') {
      return NextResponse.json(
        { error: 'Invalid URL provided' },
        { status: 400 }
      );
    }

    // Reject non-HTTP(S) protocols to prevent SSRF
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(originalUrl.trim());
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return NextResponse.json(
        { error: 'Only HTTP and HTTPS URLs are allowed' },
        { status: 400 }
      );
    }

    // Call external API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        originalUrl: originalUrl.trim(),
        createdBy,
        autoDelete,
        ttlDays,
      }),
    });

    if (!response.ok) {
      throw new Error('External API request failed');
    }

    const result = await response.json();

    return NextResponse.json({
      shortUrl: result.shortUrl,
      shortCode: result.shortCode || result.shortUrl?.split('/').pop(),
      originalUrl: result.originalUrl,
      createdAt: result.createdAt,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    console.error('Error in URL shortener API:', error);
    return NextResponse.json(
      { error: 'Failed to shorten URL' },
      { status: 500 }
    );
  }
}
