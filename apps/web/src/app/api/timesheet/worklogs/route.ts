import { NextRequest, NextResponse } from 'next/server';

import { TIMESHEET_URLS } from '@/lib/api-urls';
import { sanitizeErrorText } from '@/lib/fetch-utils';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const { searchParams } = request.nextUrl;

    const projectKey = searchParams.get('projectKey');
    const username = searchParams.get('username');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const jiraInstance = searchParams.get('jiraInstance');

    if (!authHeader || !fromDate || !toDate || !jiraInstance) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: Authorization header, fromDate, toDate, jiraInstance',
        },
        { status: 400 }
      );
    }

    // Project worklogs path
    if (projectKey) {
      const params = new URLSearchParams({
        projectKey,
        fromDate,
        toDate,
        jiraInstance,
      });

      // Forward any additional query params (e.g. username, statusWorklog, etc.)
      for (const [key, value] of searchParams.entries()) {
        if (
          !['projectKey', 'fromDate', 'toDate', 'jiraInstance'].includes(key)
        ) {
          params.set(key, value);
        }
      }

      const queryString = params.toString();
      const headers = { Authorization: authHeader };

      const [worklogsResponse, paginationResponse] = await Promise.all([
        fetch(`${TIMESHEET_URLS.PROJECT_WORKLOGS}?${queryString}`, { headers }),
        fetch(`${TIMESHEET_URLS.PROJECT_WORKLOGS_PAGINATION}?${queryString}`, {
          headers,
        }),
      ]);

      if (!worklogsResponse.ok) {
        const errorText = await worklogsResponse.text();
        return NextResponse.json(
          { error: sanitizeErrorText(errorText, worklogsResponse.status) },
          { status: worklogsResponse.status }
        );
      }

      if (!paginationResponse.ok) {
        const errorText = await paginationResponse.text();
        return NextResponse.json(
          { error: sanitizeErrorText(errorText, paginationResponse.status) },
          { status: paginationResponse.status }
        );
      }

      const [worklogsData, paginationData] = await Promise.all([
        worklogsResponse.json(),
        paginationResponse.json(),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          rows: worklogsData.data ?? worklogsData,
          ...(paginationData.data ?? paginationData),
        },
      });
    }

    // Personal worklogs path
    if (!username) {
      return NextResponse.json(
        { error: 'Missing required field: projectKey or username' },
        { status: 400 }
      );
    }

    const statusWorklog = searchParams.get('statusWorklog') ?? 'All';
    const params = new URLSearchParams({
      fromDate,
      toDate,
      user: username,
      statusWorklog,
      jiraInstance,
    });

    const response = await fetch(
      `${TIMESHEET_URLS.WORKLOGS}?${params.toString()}`,
      {
        headers: { Authorization: authHeader },
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
