import { NextRequest, NextResponse } from 'next/server';

import { TIMESHEET_URLS } from '@/lib/api-urls';
import { sanitizeErrorText } from '@/lib/fetch-utils';

export async function GET(request: NextRequest) {
  try {
    const jiraInstance =
      request.nextUrl.searchParams.get('jiraInstance') || 'jiradc';

    const authHeader = request.headers.get('Authorization') || '';
    const params = new URLSearchParams({ jiraInstance });

    const response = await fetch(
      `${TIMESHEET_URLS.PROJECTS}?${params.toString()}`,
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

    if (!payload.jql) {
      return NextResponse.json(
        { error: 'Missing required field: jql' },
        { status: 400 }
      );
    }

    const jiraInstance = payload.jiraInstance || 'jiradc';
    const authHeader = request.headers.get('Authorization') || '';
    const params = new URLSearchParams({ jiraInstance });

    const response = await fetch(
      `${TIMESHEET_URLS.PROJECTS}?${params.toString()}`,
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
      const issues = (table as JiraIssueRaw[])
        .filter(issue => issue.type?.name === 'Sub-task')
        .map(issue => ({
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
