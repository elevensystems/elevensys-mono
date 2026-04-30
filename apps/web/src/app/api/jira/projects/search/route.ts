import { NextRequest, NextResponse } from 'next/server';

import { JIRA_URLS } from '@/lib/api-urls';
import { sanitizeErrorText } from '@/lib/fetch-utils';
import { missingJiraInstanceResponse } from '@/lib/jira-proxy';

interface ProjectIssuesRequest {
  jiraInstance: string;
  jql: string;
  columnConfig: string;
  layoutKey: string;
  startIndex: string;
}

interface JiraIssueRaw {
  id: number;
  key: string;
  status: string;
  summary: string;
  type: {
    description: string;
    name: string;
    iconUrl: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as Partial<ProjectIssuesRequest>;

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
      `${JIRA_URLS.PROJECTS_SEARCH}?${params.toString()}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          jql: payload.jql,
          columnConfig: payload.columnConfig || 'explicit',
          layoutKey: payload.layoutKey || 'split-view',
          startIndex: payload.startIndex || '0',
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

    if (result.success && result.data?.issueTable) {
      const { table, total } = result.data.issueTable;
      const issues = (table as JiraIssueRaw[]).map(issue => ({
        id: issue.id,
        key: issue.key,
        status: issue.status,
        summary: issue.summary,
        type: issue.type,
      }));

      return NextResponse.json({
        success: true,
        data: { total, issues },
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
