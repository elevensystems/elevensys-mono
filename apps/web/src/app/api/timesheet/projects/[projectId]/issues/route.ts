import { NextRequest, NextResponse } from 'next/server';

import { TIMESHEET_URLS } from '@/lib/api-urls';
import { sanitizeErrorText } from '@/lib/fetch-utils';

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const jiraInstance =
      request.nextUrl.searchParams.get('jiraInstance') || 'jiradc';
    const startIndex = request.nextUrl.searchParams.get('startIndex') || '0';

    const authHeader = request.headers.get('Authorization') || '';
    const queryParams = new URLSearchParams({
      jiraInstance,
      startIndex,
    });

    const response = await fetch(
      `${TIMESHEET_URLS.PROJECTS}/${projectId}/issues?${queryParams.toString()}`,
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
