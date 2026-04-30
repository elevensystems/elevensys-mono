import { NextRequest, NextResponse } from 'next/server';

import { JIRA_URLS } from '@/lib/api-urls';
import { sanitizeErrorText } from '@/lib/fetch-utils';
import {
  getJiraInstanceFromQuery,
  missingJiraInstanceResponse,
} from '@/lib/jira-proxy';
import type { UpdateWorklogRequest } from '@/types/timesheet';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ worklogId: string }> }
) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const body: UpdateWorklogRequest = await request.json();
    const { id, jiraInstance, ...updateFields } = body;
    const { worklogId } = await params;

    if (!jiraInstance) {
      return missingJiraInstanceResponse();
    }

    if (!authHeader || !worklogId) {
      return NextResponse.json(
        {
          error: 'Missing required fields: Authorization header, worklogId',
        },
        { status: 400 }
      );
    }

    const queryParams = new URLSearchParams({ jiraInstance });

    const response = await fetch(
      `${JIRA_URLS.PROJECT_WORKLOGS}/${worklogId}?${queryParams.toString()}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({ id: worklogId, ...updateFields }),
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
  { params }: { params: Promise<{ worklogId: string }> }
) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const { worklogId } = await params;
    const jiraInstance = getJiraInstanceFromQuery(request);
    const searchParams = new URL(request.url).searchParams;
    const issueId = searchParams.get('issueId');

    if (!jiraInstance) {
      return missingJiraInstanceResponse();
    }

    if (!authHeader || !issueId || !worklogId) {
      return NextResponse.json(
        {
          error:
            'Missing required parameters: Authorization header, issueId, worklogId',
        },
        { status: 400 }
      );
    }

    const queryParams = new URLSearchParams({ jiraInstance });

    // The backend core expects /:issueId/:timesheetId (where timesheetId is the worklogId)
    const response = await fetch(
      `${JIRA_URLS.PROJECT_WORKLOGS}/${issueId}/${worklogId}?${queryParams.toString()}`,
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
