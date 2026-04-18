/**
 * Shared constants used across the application
 */

// UI Constants
export const ACTION_FEEDBACK_DURATION = 2000;

// Password Generator Constants
export const PASSWORD_MIN_LENGTH = 4;
export const PASSWORD_MAX_LENGTH = 128;
export const PASSWORD_DEFAULT_LENGTH = 15;
export const PASSWORD_COUNT = 5;

// AI Model Constants
export const DEFAULT_AI_MODEL = 'gpt-5-nano';
export const AI_MODEL_ALLOWLIST = [
  'gpt-5',
  'gpt-5-mini',
  'gpt-5-nano',
] as const;
export type AIModel = (typeof AI_MODEL_ALLOWLIST)[number];
export const AI_MODEL_ALLOWLIST_SET = new Set<string>(AI_MODEL_ALLOWLIST);

/**
 * Validates a model string against the allowlist.
 * Returns the model if valid, otherwise the default model.
 */
export function validateModel(model: string | undefined): string {
  return AI_MODEL_ALLOWLIST_SET.has(model ?? '')
    ? (model as string)
    : DEFAULT_AI_MODEL;
}

// API Constants
export const REQUEST_TIMEOUT_MS = 30000; // 30 seconds
export const MAX_TRANSLATE_INPUT_LENGTH = 10000;

// Character Sets for Password Generation
export const CHARSET = {
  UPPERCASE: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  LOWERCASE: 'abcdefghijklmnopqrstuvwxyz',
  NUMBERS: '0123456789',
  SYMBOLS: '!@#$%^&*()_+-=[]{}|;:,.<>?',
} as const;

// Translation Directions
export const TRANSLATION_DIRECTION = {
  VI_EN: 'vi-en',
  EN_VI: 'en-vi',
} as const;

export type TranslationDirection =
  (typeof TRANSLATION_DIRECTION)[keyof typeof TRANSLATION_DIRECTION];

// Tone Options for Translation
export const TRANSLATION_TONES = [
  { value: 'neutral', label: 'Neutral' },
  { value: 'friendly', label: 'Friendly 😊' },
  { value: 'formal', label: 'Formal' },
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
] as const;

// Available AI Models for UI
export const AI_MODELS = [
  { value: 'gpt-5', label: 'gpt-5' },
  { value: 'gpt-5-mini', label: 'gpt-5-mini' },
  { value: 'gpt-5-nano', label: 'gpt-5-nano' },
] as const;

// Timesheet Constants
export const DEFAULT_JIRA_INSTANCE = 'jiradc';
export const MAX_AUTOLOG_CONFIGS = 3;

// LocalStorage Keys
export const STORAGE_KEYS = {
  TRANSLATE_PREFERENCES: 'translate-tool-preferences',
} as const;
