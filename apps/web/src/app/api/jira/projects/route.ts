import { NextRequest, NextResponse } from 'next/server';

import { JIRA_URLS } from '@/lib/api-urls';
import { sanitizeErrorText } from '@/lib/fetch-utils';
import {
  getJiraInstanceFromQuery,
  missingJiraInstanceResponse,
} from '@/lib/jira-proxy';

export async function GET(request: NextRequest) {
  try {
    const jiraInstance = getJiraInstanceFromQuery(request);
    if (!jiraInstance) {
      return missingJiraInstanceResponse();
    }

    const authHeader = request.headers.get('Authorization') || '';
    const params = new URLSearchParams({ jiraInstance });

    const response = await fetch(
      `${JIRA_URLS.PROJECTS}?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
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

    const result = await response.json();

    if (result.success && Array.isArray(result.data)) {
      const projects = result.data.map(
        (p: { id: string; key: string; name: string }) => ({
          id: p.id,
          key: p.key,
          name: p.name,
        })
      );
      return NextResponse.json({ success: true, data: projects });
    }

    return NextResponse.json({ success: true, data: [] });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
