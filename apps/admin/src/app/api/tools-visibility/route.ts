import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod';

import { getUserFromSession } from '@/lib/auth';
import { GlobalConfigError } from '@/lib/global-config-client';
import {
  readToolsVisibilitySnapshot,
  writeToolsVisibility,
} from '@/lib/tools-visibility-admin';

/** `null` shows every tool, including ones added later. */
const requestSchema = z.object({
  visible: z.array(z.string().min(1)).nullable(),
});

function handleError(error: unknown) {
  if (error instanceof GlobalConfigError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status }
    );
  }
  console.error('tools-visibility error:', error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

export async function GET() {
  const user = await getUserFromSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    return NextResponse.json(await readToolsVisibilitySnapshot());
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  const user = await getUserFromSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid request body.' },
      { status: 400 }
    );
  }

  try {
    return NextResponse.json(
      await writeToolsVisibility({
        visible: parsed.data.visible,
        by: user.name || user.email || user.sub,
      })
    );
  } catch (error) {
    return handleError(error);
  }
}
