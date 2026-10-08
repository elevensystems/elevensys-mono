import { NextRequest, NextResponse } from 'next/server';

import { JIRA_URLS } from '@/lib/api-urls';
import {
  internalErrorResponse,
  missingJiraInstanceResponse,
  upstreamErrorResponse,
} from '@/lib/jira-proxy';
import type { LogWorkRequest } from '@/types/timesheet';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const body: LogWorkRequest = await request.json();
    const { worklog, jiraInstance } = body;

    if (!jiraInstance) {
      return missingJiraInstanceResponse();
    }

    if (!authHeader || !worklog) {
      return NextResponse.json(
        {
          error: 'Missing required fields: Authorization header, worklog',
        },
        { status: 400 }
      );
    }

    if (!worklog.issueKey || !worklog.username || !worklog.startDate) {
      return NextResponse.json(
        { error: 'Missing required worklog fields' },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({ jiraInstance });

    const response = await fetch(`${JIRA_URLS.LOGWORK}?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(worklog),
    });

    if (!response.ok) {
      return upstreamErrorResponse(response);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
