import { NextRequest, NextResponse } from 'next/server';

import { JIRA_URLS } from '@/lib/api-urls';
import { sanitizeErrorText } from '@/lib/fetch-utils';
import {
  getJiraInstanceFromQuery,
  missingJiraInstanceResponse,
} from '@/lib/jira-proxy';

/** Jira's user picker row — `html` carries the match highlighting, unused here. */
interface JiraPickerUser {
  name?: string;
  key?: string;
  displayName?: string;
}

export async function GET(request: NextRequest) {
  try {
    const jiraInstance = getJiraInstanceFromQuery(request);
    if (!jiraInstance) {
      return missingJiraInstanceResponse();
    }

    const authHeader = request.headers.get('Authorization') || '';
    const { searchParams } = request.nextUrl;
    const query = searchParams.get('query')?.trim();

    if (!authHeader || !query) {
      return NextResponse.json(
        { error: 'Missing required fields: Authorization header, query' },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({ query, jiraInstance });

    const maxResults = searchParams.get('maxResults');
    if (maxResults) {
      params.set('maxResults', maxResults);
    }

    const response = await fetch(
      `${JIRA_URLS.USERS_PICKER}?${params.toString()}`,
      { headers: { Authorization: authHeader } }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: sanitizeErrorText(errorText, response.status) },
        { status: response.status }
      );
    }

    const result = await response.json();

    // Jira replies with `{ users, total, header }`; the backend wraps it in `data`.
    const raw = result.data ?? result;
    const users: JiraPickerUser[] = Array.isArray(raw?.users) ? raw.users : [];

    return NextResponse.json({
      success: true,
      data: users
        .filter(
          (user): user is JiraPickerUser & { name: string } => !!user.name
        )
        .map(user => ({
          name: user.name,
          key: user.key ?? user.name,
          displayName: user.displayName || user.name,
        })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
