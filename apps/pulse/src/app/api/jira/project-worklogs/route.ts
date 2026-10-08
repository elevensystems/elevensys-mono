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
    const { searchParams } = request.nextUrl;

    const projectKey = searchParams.get('projectKey');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const jiraInstance = getJiraInstanceFromQuery(request);

    if (!jiraInstance) {
      return missingJiraInstanceResponse();
    }

    if (!authHeader || !projectKey || !fromDate || !toDate) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: Authorization header, projectKey, fromDate, toDate',
        },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({
      projectKey,
      fromDate,
      toDate,
      jiraInstance,
    });

    for (const [key, value] of searchParams.entries()) {
      if (!['projectKey', 'fromDate', 'toDate', 'jiraInstance'].includes(key)) {
        params.set(key, value);
      }
    }

    const queryString = params.toString();
    const headers = { Authorization: authHeader };

    const [worklogsResponse, paginationResponse] = await Promise.all([
      fetch(`${JIRA_URLS.PROJECT_WORKLOGS}?${queryString}`, { headers }),
      fetch(`${JIRA_URLS.PROJECT_WORKLOGS_PAGINATION}?${queryString}`, {
        headers,
      }),
    ]);

    if (!worklogsResponse.ok) {
      return upstreamErrorResponse(worklogsResponse);
    }

    if (!paginationResponse.ok) {
      return upstreamErrorResponse(paginationResponse);
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
  } catch (error) {
    return internalErrorResponse(error);
  }
}
