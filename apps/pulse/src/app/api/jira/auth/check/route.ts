import { NextRequest, NextResponse } from 'next/server';

import { JIRA_URLS } from '@/lib/api-urls';
import { sanitizeErrorText } from '@/lib/fetch-utils';
import {
  getJiraInstanceFromQuery,
  missingJiraInstanceResponse,
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
