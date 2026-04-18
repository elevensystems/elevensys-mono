import { NextRequest, NextResponse } from 'next/server';

import { TIMESHEET_URLS } from '@/lib/api-urls';
import { sanitizeErrorText } from '@/lib/fetch-utils';
import type { UpdateWorklogRequest } from '@/types/timesheet';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ issueId: string; timesheetId: string }> }
) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const body: UpdateWorklogRequest = await request.json();
    const { id, jiraInstance, ...updateFields } = body;
    const { timesheetId } = await params;

    if (!authHeader || !id || !jiraInstance) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: Authorization header, id, jiraInstance',
        },
        { status: 400 }
      );
    }

    const queryParams = new URLSearchParams({ jiraInstance });

    const response = await fetch(
      `${TIMESHEET_URLS.PROJECT_WORKLOGS}/${timesheetId}?${queryParams.toString()}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({ id, ...updateFields }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: sanitizeErrorText(errorText, response.status) },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ issueId: string; timesheetId: string }> }
) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const { issueId, timesheetId } = await params;
    const { searchParams } = new URL(request.url);
    const jiraInstance = searchParams.get('jiraInstance');

    if (!authHeader || !issueId || !timesheetId || !jiraInstance) {
      return NextResponse.json(
        {
          error:
            'Missing required parameters: Authorization header, issueId, timesheetId, jiraInstance',
        },
        { status: 400 }
      );
    }

    const queryParams = new URLSearchParams({ jiraInstance });

    const response = await fetch(
      `${TIMESHEET_URLS.PROJECT_WORKLOGS}/${issueId}/${timesheetId}?${queryParams.toString()}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: authHeader,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: sanitizeErrorText(errorText, response.status) },
        { status: response.status }
      );
    }

    // Some DELETE endpoints return 204 No Content
    if (response.status === 204) {
      return NextResponse.json({ success: true });
    }

    const data = await response.json().catch(() => ({ success: true }));
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
