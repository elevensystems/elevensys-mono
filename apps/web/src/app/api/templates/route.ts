import { NextResponse } from 'next/server';

import fs from 'fs';
import path from 'path';

import { getUserFromSession } from '@/lib/auth';
import { hasRole } from '@workspace/ui/lib/utils';

export interface TemplateDefinition {
  id: string;
  title: string;
  file: string;
}

export interface Template {
  id: string;
  title: string;
  content: string;
}

const TEMPLATE_DEFINITIONS: TemplateDefinition[] = [
  {
    id: 'ai-agent-pr-review',
    title: 'AI Agent PR Review with MCP',
    file: 'ai_agent_pr_review_with_mcp.md',
  },
  {
    id: 'ai-agent-pr-review-local',
    title: 'AI Agent PR Review with MCP (Local Mode)',
    file: 'ai_agent_pr_review_local.md',
  },
  {
    id: 'ai-agent-pr-approach-summary',
    title: 'PR Approach Summary Generation',
    file: 'ai_agent_pr_approach_summary.md',
  },
  {
    id: 'rally-sub-task-creation',
    title: 'Rally Sub Task Creation',
    file: 'rally_sub_task_creation.md',
  },
  {
    id: 'unit-test-generation',
    title: 'Unit Test Generation for Branch Diff',
    file: 'unit_test_generation.md',
  },
  {
    id: 'fyc-unit-test-generation',
    title: 'FYC Unit Test Generation',
    file: 'fyc_unit_test_generation.md',
  },
  {
    id: 'rally-sprint-readiness',
    title: 'Rally Sprint Readiness Assessment',
    file: 'rally_sprint_readiness_assessment.md',
  },
  {
    id: 'sprint-demo-rally-info',
    title: 'Sprint Demo Rally Info Extraction',
    file: 'sprint_demo_rally_info_extraction.md',
  },
];

export async function GET() {
  try {
    const user = await getUserFromSession();
    if (!hasRole(user, ['pro'])) {
      return NextResponse.json(
        { success: false, error: 'Pro access required.' },
        { status: 403 }
      );
    }
    const templatesDir = path.join(process.cwd(), 'public', 'templates');

    const templates: Template[] = await Promise.all(
      TEMPLATE_DEFINITIONS.map(async def => {
        try {
          const filePath = path.join(templatesDir, def.file);
          const content = fs.readFileSync(filePath, 'utf-8');

          return {
            id: def.id,
            title: def.title,
            content: content.trim(),
          };
        } catch (error) {
          console.error(`Error loading template ${def.id}:`, error);
          return {
            id: def.id,
            title: def.title,
            content: `Error loading template: ${error instanceof Error ? error.message : 'Unknown error'}`,
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      templates,
    });
  } catch (error) {
    console.error('Error loading templates:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load templates',
      },
      { status: 500 }
    );
  }
}
