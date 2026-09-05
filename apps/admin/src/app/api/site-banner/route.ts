import { NextRequest, NextResponse } from 'next/server';

import { getUserFromSession } from '@/lib/auth';
import {
  GlobalConfigError,
  readSiteBannerSnapshot,
  writeSiteBannerValue,
} from '@/lib/global-config-admin';
import { siteBannerRequestSchema } from '@/lib/site-banner-schema';

function handleError(error: unknown) {
  if (error instanceof GlobalConfigError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status }
    );
  }
  console.error('site-banner error:', error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

export async function GET() {
  const user = await getUserFromSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    return NextResponse.json(await readSiteBannerSnapshot());
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  const user = await getUserFromSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = siteBannerRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid request body.' },
      { status: 400 }
    );
  }

  try {
    const snapshot = await writeSiteBannerValue({
      target: parsed.data.target,
      id: parsed.data.id,
      announcement: parsed.data.announcement,
      by: user.name || user.email || user.sub,
    });
    return NextResponse.json(snapshot);
  } catch (error) {
    return handleError(error);
  }
}
