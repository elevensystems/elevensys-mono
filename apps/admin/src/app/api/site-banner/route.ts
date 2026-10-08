import { NextRequest, NextResponse } from 'next/server';

import { errorResponse } from '@/lib/api-fetch';
import { getUserFromSession } from '@/lib/auth';
import {
  readSiteBannerSnapshot,
  writeSiteBannerValue,
} from '@/lib/global-config-admin';
import { siteBannerRequestSchema } from '@/lib/site-banner-schema';

export async function GET() {
  const user = await getUserFromSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    return NextResponse.json(await readSiteBannerSnapshot());
  } catch (error) {
    return errorResponse(error, 'site-banner error');
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
    return errorResponse(error, 'site-banner error');
  }
}
