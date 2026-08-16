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
    const { searchParams } = request.nextUrl;

    const projectId = searchParams.get('projectId');
    const jiraInstance = getJiraInstanceFromQuery(request);

    if (!jiraInstance) {
      return missingJiraInstanceResponse();
    }

    if (!authHeader || !projectId) {
      return NextResponse.json(
        {
          error: 'Missing required fields: Authorization header, projectId',
        },
        { status: 400 }
      );
    }

    // The date filters are intentionally optional and forwarded even when
    // empty — the upstream absence resource expects both keys to be present.
    const params = new URLSearchParams({
      projectId,
      filterUsername: searchParams.get('filterUsername') || 'All',
      filterFromDate: searchParams.get('filterFromDate') ?? '',
      filterToDate: searchParams.get('filterToDate') ?? '',
      pageNo: searchParams.get('pageNo') || '1',
      jiraInstance,
    });

    const queryString = params.toString();
    const headers = { Authorization: authHeader };

    const [absencesResponse, pageInfoResponse] = await Promise.all([
      fetch(`${JIRA_URLS.ABSENCES}?${queryString}`, { headers }),
      fetch(`${JIRA_URLS.ABSENCES_PAGE_INFO}?${queryString}`, { headers }),
    ]);

    if (!absencesResponse.ok) {
      const errorText = await absencesResponse.text();
      return NextResponse.json(
        { error: sanitizeErrorText(errorText, absencesResponse.status) },
        { status: absencesResponse.status }
      );
    }

    if (!pageInfoResponse.ok) {
      const errorText = await pageInfoResponse.text();
      return NextResponse.json(
        { error: sanitizeErrorText(errorText, pageInfoResponse.status) },
        { status: pageInfoResponse.status }
      );
    }

    const [absencesData, pageInfoData] = await Promise.all([
      absencesResponse.json(),
      pageInfoResponse.json(),
    ]);

    // The list payload may be a bare array or an object wrapping the rows.
    const raw = absencesData.data ?? absencesData;
    const rows = Array.isArray(raw) ? raw : (raw?.rows ?? raw?.absences ?? []);

    return NextResponse.json({
      success: true,
      data: {
        rows,
        ...(pageInfoData.data ?? pageInfoData),
      },
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
