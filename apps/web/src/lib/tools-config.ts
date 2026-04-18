/**
 * Centralized tool configuration
 * This file defines all tools and their properties for consistent usage across the application.
 */
import type { LucideIcon } from 'lucide-react';

export interface ToolConfig {
  name: string;
  url: string;
  icon: LucideIcon;
  description?: string;
  isPro?: boolean;
}

/**
 * Tool categories for organization
 */
export const TOOL_CATEGORIES = {
  CONVERTERS: 'converters',
  GENERATORS: 'generators',
  AI: 'ai',
  UTILITIES: 'utilities',
} as const;

export type ToolCategory =
  (typeof TOOL_CATEGORIES)[keyof typeof TOOL_CATEGORIES];
