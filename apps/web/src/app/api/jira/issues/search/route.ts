import { NextRequest, NextResponse } from 'next/server';

import { JIRA_URLS } from '@/lib/api-urls';
import { sanitizeErrorText } from '@/lib/fetch-utils';
import { missingJiraInstanceResponse } from '@/lib/jira-proxy';

interface IssuesSearchRequest {
  jiraInstance: string;
  jql: string;
}

interface JiraIssueRaw {
  id: string;
  key: string;
  fields: {
    summary: string;
    customfield_10400: string | null;
  };
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as Partial<IssuesSearchRequest>;

    if (!payload.jiraInstance) {
      return missingJiraInstanceResponse();
    }

    if (!payload.jql) {
      return NextResponse.json(
        { error: 'Missing required field: jql' },
        { status: 400 }
      );
    }

    const jiraInstance = payload.jiraInstance;
    const authHeader = request.headers.get('Authorization') || '';
    const params = new URLSearchParams({ jiraInstance });

    const response = await fetch(
      `${JIRA_URLS.ISSUES_SEARCH}?${params.toString()}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          jql: payload.jql,
          startAt: 0,
          maxResults: 100,
          fields: ['summary', 'customfield_10400'],
        }),
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

    if (result.success && Array.isArray(result.data?.issues)) {
      const issues = (result.data.issues as JiraIssueRaw[]).map(issue => ({
        id: issue.id,
        key: issue.key,
        summary: issue.fields?.summary,
        typeOfWork: issue.fields?.customfield_10400 ?? undefined,
      }));

      return NextResponse.json({
        success: true,
        data: { total: result.data.total ?? issues.length, issues },
      });
    }

    return NextResponse.json({
      success: true,
      data: { total: 0, issues: [] },
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
