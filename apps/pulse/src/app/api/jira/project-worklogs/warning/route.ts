import { NextRequest, NextResponse } from 'next/server';

import { JIRA_URLS } from '@/lib/api-urls';
import {
  internalErrorResponse,
  missingJiraInstanceResponse,
  upstreamErrorResponse,
} from '@/lib/jira-proxy';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const body = await request.json();
    const { pid, startDate, endDate, jiraInstance } = body;

    if (!jiraInstance) {
      return missingJiraInstanceResponse();
    }

    if (!authHeader || !pid || !startDate || !endDate) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: Authorization header, pid, startDate, endDate',
        },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({ jiraInstance });

    // Scoped to the caller by the backend. For every user on a project, use
    // /api/jira/project-worklogs/warning/all instead.
    const response = await fetch(
      `${JIRA_URLS.PROJECT_WORKLOGS_WARNING}?${params.toString()}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({ pid, startDate, endDate }),
      }
    );

    if (!response.ok) {
      return upstreamErrorResponse(response);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
