import { NextRequest, NextResponse } from 'next/server';

import { JIRA_URLS } from '@/lib/api-urls';
import {
  getJiraInstanceFromQuery,
  internalErrorResponse,
  missingJiraInstanceResponse,
  upstreamErrorResponse,
} from '@/lib/jira-proxy';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const jiraInstance = getJiraInstanceFromQuery(request);

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing required Authorization header' },
        { status: 400 }
      );
    }

    if (!jiraInstance) {
      return missingJiraInstanceResponse();
    }

    const params = new URLSearchParams({ jiraInstance });

    const response = await fetch(
      `${JIRA_URLS.AUTH_CHECK}?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          Authorization: authHeader,
        },
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
