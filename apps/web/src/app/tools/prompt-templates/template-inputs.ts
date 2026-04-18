// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type InputType = 'text' | 'url' | 'email' | 'image' | 'file' | 'list';

export interface TemplateInput {
  id: string;
  label: string;
  placeholder: string;
  type: InputType;
  required: boolean;
  /** The pattern in the template to replace (e.g., {{PR_URL}}, [LIST_YOUR_IDS_HERE]) */
  pattern: string;
  /** Help text shown below the input */
  helpText?: string;
  /** Default value if any */
  defaultValue?: string;
}

export interface TemplateInputConfig {
  templateId: string;
  inputs: TemplateInput[];
  /** Warning message if template requires manual inputs like images */
  manualInputWarning?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if any input requires manual entry (images, files, etc.)
 */
export const hasManualInputs = (config: TemplateInputConfig): boolean => {
  return config.inputs.some(
    input => input.type === 'image' || input.type === 'file'
  );
};

/**
 * Get the warning message for manual inputs
 */
export const getManualInputWarning = (
  config: TemplateInputConfig
): string | null => {
  if (config.manualInputWarning) {
    return config.manualInputWarning;
  }

  const manualInputs = config.inputs.filter(
    input => input.type === 'image' || input.type === 'file'
  );

  if (manualInputs.length === 0) return null;

  const types = manualInputs.map(i => i.type).join(', ');
  return `This template requires ${types} input(s) that must be manually added to your AI agent/chatbot.`;
};

/**
 * Generate prompt by replacing patterns with user inputs
 */
export const generatePrompt = (
  templateContent: string,
  config: TemplateInputConfig,
  inputValues: Record<string, string>
): string => {
  let result = templateContent;

  for (const input of config.inputs) {
    const value = inputValues[input.id] || input.defaultValue || '';
    // Escape special regex characters in the pattern
    const escapedPattern = input.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedPattern, 'g');
    result = result.replace(regex, value);
  }

  return result;
};

/**
 * Check if all required text/link inputs are filled
 */
export const areRequiredInputsFilled = (
  config: TemplateInputConfig,
  inputValues: Record<string, string>
): boolean => {
  return config.inputs
    .filter(
      input => input.required && input.type !== 'image' && input.type !== 'file'
    )
    .every(input => {
      const value = inputValues[input.id]?.trim();
      return value && value.length > 0;
    });
};

// ─────────────────────────────────────────────────────────────────────────────
// Template Input Configurations
// ─────────────────────────────────────────────────────────────────────────────

export const TEMPLATE_INPUT_CONFIGS: TemplateInputConfig[] = [
  {
    templateId: 'ai-agent-pr-review',
    inputs: [
      {
        id: 'pr_url',
        label: 'Pull Request URL',
        placeholder: 'https://ghe.coxautoinc.com/org/repo/pull/12345',
        type: 'url',
        required: true,
        pattern: 'https://ghe.coxautoinc.com/Autotrader/find-car/pull/15050',
        helpText: 'The full URL of the Pull Request to review',
      },
    ],
  },
  {
    templateId: 'ai-agent-pr-review-local',
    inputs: [
      {
        id: 'pr_url',
        label: 'Pull Request URL',
        placeholder: 'https://ghe.coxautoinc.com/org/repo/pull/12345',
        type: 'url',
        required: true,
        pattern: 'https://ghe.coxautoinc.com/Autotrader/find-car/pull/15050',
        helpText: 'The full URL of the Pull Request to review locally',
      },
    ],
  },
  {
    templateId: 'ai-agent-pr-approach-summary',
    inputs: [
      {
        id: 'pr_url',
        label: 'Pull Request URL',
        placeholder: 'https://ghe.coxautoinc.com/org/repo/pull/12345',
        type: 'url',
        required: true,
        pattern: '<paste your PR URL here>',
        helpText: 'The full URL of the Pull Request to generate summary for',
      },
    ],
  },
  {
    templateId: 'rally-sub-task-creation',
    inputs: [
      {
        id: 'user_stories',
        label: 'User Stories',
        placeholder: 'US1758853: Story title\nUS1758854: Another story',
        type: 'list',
        required: true,
        pattern: '- US[ID]: [Title]',
        helpText:
          'List user story IDs and titles, one per line (e.g., US1758853: Implement feature)',
      },
      {
        id: 'owner_email',
        label: 'Owner Email',
        placeholder: 'your.email@coxautoinc.com',
        type: 'email',
        required: true,
        pattern: '[your.email@coxautoinc.com]',
        helpText: 'Your Cox Automotive email address',
      },
    ],
  },
  {
    templateId: 'unit-test-generation',
    inputs: [
      {
        id: 'feature_branch',
        label: 'Feature Branch Name',
        placeholder: 'feature/US123456-my-feature',
        type: 'text',
        required: true,
        pattern: '{{FEATURE_BRANCH}}',
        helpText: 'The name of your local feature/develop branch',
      },
      {
        id: 'target_branch',
        label: 'Target Branch',
        placeholder: 'origin/master',
        type: 'text',
        required: true,
        pattern: '{{TARGET_BRANCH}}',
        defaultValue: 'origin/master',
        helpText:
          'The remote branch to compare against (default: origin/master)',
      },
      {
        id: 'test_file_path',
        label: 'Test File Path',
        placeholder: 'src/components/MyComponent.test.js',
        type: 'text',
        required: false,
        pattern: '{{TEST_FILE_PATH}}',
        helpText: 'Path to the test file (optional)',
      },
    ],
  },
  {
    templateId: 'fyc-unit-test-generation',
    inputs: [
      {
        id: 'branch',
        label: 'Branch Name',
        placeholder: 'feature/US123456-my-feature',
        type: 'text',
        required: true,
        pattern: '{{BRANCH}}',
        helpText: 'Your current feature/develop branch name',
      },
    ],
  },
  {
    templateId: 'rally-sprint-readiness',
    inputs: [
      {
        id: 'rally_image',
        label: 'Rally Screenshot',
        placeholder: 'Attach image of Rally user stories/defects',
        type: 'image',
        required: true,
        pattern: '[ATTACHED_IMAGE]',
        helpText:
          'Screenshot showing the list of user story IDs and defect IDs from Rally',
      },
    ],
    manualInputWarning:
      'This template requires a Rally screenshot that must be manually attached in your AI agent/chatbot after copying the prompt.',
  },
  {
    templateId: 'sprint-demo-rally-info',
    inputs: [
      {
        id: 'rally_ids',
        label: 'Rally IDs',
        placeholder: 'US1234567, US1234568, DE1234569',
        type: 'list',
        required: true,
        pattern: '[LIST_YOUR_IDS_HERE]',
        helpText: 'Comma-separated list of Rally User Story or Defect IDs',
      },
    ],
  },
];

/**
 * Get input configuration for a specific template
 */
export const getTemplateInputConfig = (
  templateId: string
): TemplateInputConfig | null => {
  return (
    TEMPLATE_INPUT_CONFIGS.find(config => config.templateId === templateId) ||
    null
  );
};

/**
 * Check if a template has configurable inputs
 */
export const templateHasInputs = (templateId: string): boolean => {
  const config = getTemplateInputConfig(templateId);
  return config !== null && config.inputs.length > 0;
};
