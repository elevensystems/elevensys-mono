import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod';

import { errorResponse } from '@/lib/api-fetch';
import { getUserFromSession } from '@/lib/auth';
import {
  readToolsVisibilitySnapshot,
  writeToolsVisibility,
} from '@/lib/tools-visibility-admin';

/** `null` shows every tool, including ones added later. */
const requestSchema = z.object({
  visible: z.array(z.string().min(1)).nullable(),
});

export async function GET() {
  const user = await getUserFromSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    return NextResponse.json(await readToolsVisibilitySnapshot());
  } catch (error) {
    return errorResponse(error, 'tools-visibility error');
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
    return errorResponse(error, 'tools-visibility error');
  }
}
