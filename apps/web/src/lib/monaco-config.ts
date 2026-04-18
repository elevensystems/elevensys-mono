import type { editor } from 'monaco-editor';

/** Base options shared by all JSON-tool editors. */
export const BASE_EDITOR_OPTIONS: editor.IStandaloneEditorConstructionOptions =
  {
    minimap: { enabled: false },
    lineNumbers: 'on',
    automaticLayout: true,
    formatOnPaste: true,
    formatOnType: true,
    scrollBeyondLastLine: false,
    padding: { top: 12, bottom: 12 },
  };

/** Options for read-only output editors (e.g., JSON Objectify output). */
export const READONLY_EDITOR_OPTIONS: editor.IStandaloneEditorConstructionOptions =
  {
    ...BASE_EDITOR_OPTIONS,
    readOnly: true,
    formatOnPaste: false,
    formatOnType: false,
  };

/** Resolves the Monaco theme name from the app's resolved theme. */
export const getEditorTheme = (resolvedTheme: string | undefined): string => {
  return resolvedTheme === 'dark' ? 'vs-dark' : 'light';
};

/**
 * Registers a paste handler that auto-formats the document.
 * Call this inside your editor onMount callback.
 */
export const registerFormatOnPaste = (
  editor: editor.IStandaloneCodeEditor
): void => {
  editor.onDidPaste(() => {
    editor.getAction('editor.action.formatDocument')?.run();
  });
};
