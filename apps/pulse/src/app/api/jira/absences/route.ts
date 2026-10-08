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
      return upstreamErrorResponse(absencesResponse);
    }

    if (!pageInfoResponse.ok) {
      return upstreamErrorResponse(pageInfoResponse);
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
    return internalErrorResponse(error);
  }
}
