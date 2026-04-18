import { NextRequest, NextResponse } from 'next/server';

import { TIMESHEET_URLS } from '@/lib/api-urls';
import { sanitizeErrorText } from '@/lib/fetch-utils';

interface ProjectWorklogsRequestBody {
  pid: number;
  pkey: string;
  startDate: string;
  endDate: string;
  username: string;
  typeOfWork: string;
  filStatus: string;
  filConflict: string;
  components: string;
  products: string;
  jiraInstance: string;
  page: number;
  desc: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const body: Partial<ProjectWorklogsRequestBody> = await request.json();

    const {
      pid,
      pkey = '',
      startDate,
      endDate,
      username = '',
      typeOfWork = '',
      filStatus = '',
      filConflict = '',
      components = '',
      products = '',
      jiraInstance = 'jiradc',
      page = 1,
      desc = false,
    } = body;

    if (!authHeader || !pid || !startDate || !endDate) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: Authorization header, pid, startDate, endDate',
        },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({
      orderby: '',
      desc: String(desc),
      page: String(page),
      jiraInstance,
    });

    const response = await fetch(
      `${TIMESHEET_URLS.PROJECT_WORKLOGS_REPORT}?${params.toString()}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          pid,
          pkey,
          startDate,
          endDate,
          username,
          typeOfWork,
          filStatus,
          filConflict,
          components,
          products,
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
