'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

import Editor from '@monaco-editor/react';
import { Copy, Eraser, Minimize2, TextInitial } from 'lucide-react';
import type * as Monaco from 'monaco-editor';
import { useTheme } from 'next-themes';

import { ActionButton } from '@workspace/ui/components/action-button';
import { JsonToolToolbar } from '@/components/layouts/json-tool-toolbar';
import MainLayout from '@/components/layouts/main-layout';
import { Separator } from '@workspace/ui/components/separator';
import { Tabs, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { useActionFeedback } from '@/hooks/use-action-feedback';
import { parseJsonSafely } from '@/lib/json-utils';
import {
  BASE_EDITOR_OPTIONS,
  getEditorTheme,
  registerFormatOnPaste,
} from '@/lib/monaco-config';

const DEFAULT_JSON = `{
  "name": "John Doe",
  "age": 30,
  "isActive": true,
  "roles": ["admin", "user"],
  "metadata": {
    "createdAt": "2024-01-15T10:30:00Z",
    "lastLogin": null
  }
}`;

type IndentSize = '2' | '4' | 'tab';

const getJsonDepth = (obj: unknown, depth = 0): number => {
  if (typeof obj !== 'object' || obj === null) return depth;
  const children = Array.isArray(obj)
    ? obj
    : Object.values(obj as Record<string, unknown>);
  if (children.length === 0) return depth;
  return Math.max(...children.map(child => getJsonDepth(child, depth + 1)));
};

const getRootKeyCount = (obj: unknown): number => {
  if (typeof obj !== 'object' || obj === null) return 0;
  if (Array.isArray(obj)) return obj.length;
  return Object.keys(obj as Record<string, unknown>).length;
};

const getSizeString = (text: string): string => {
  const bytes = new TextEncoder().encode(text).length;
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
};

const getIndentValue = (indentSize: IndentSize): string | number => {
  if (indentSize === 'tab') return '\t';
  return parseInt(indentSize, 10);
};

export default function JsonLensPage() {
  const { resolvedTheme } = useTheme();
  const editorTheme = getEditorTheme(resolvedTheme);
  const { isActive, trigger } = useActionFeedback();

  const [jsonText, setJsonText] = useState(DEFAULT_JSON);
  const [indentSize, setIndentSize] = useState<IndentSize>('2');

  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);

  const jsonValidation = useMemo(() => parseJsonSafely(jsonText), [jsonText]);

  const jsonStats = useMemo(() => {
    if (!jsonValidation.isValid || jsonText.trim() === '') return null;

    const indent = getIndentValue(indentSize);
    const formatted = JSON.stringify(jsonValidation.value, null, indent);
    const minified = JSON.stringify(jsonValidation.value);

    return {
      size: getSizeString(jsonText),
      lines: jsonText.split('\n').length,
      chars: jsonText.length,
      rootKeys: getRootKeyCount(jsonValidation.value),
      depth: getJsonDepth(jsonValidation.value),
      formattedSize: getSizeString(formatted),
      minifiedSize: getSizeString(minified),
      isArray: Array.isArray(jsonValidation.value),
    };
  }, [jsonValidation.isValid, jsonValidation.value, jsonText, indentSize]);

  const handleEditorMount = useCallback(
    (editor: Monaco.editor.IStandaloneCodeEditor) => {
      editorRef.current = editor;
      registerFormatOnPaste(editor);
    },
    []
  );

  const applyTextToEditor = useCallback((newText: string) => {
    const editor = editorRef.current;
    if (!editor) {
      setJsonText(newText);
      return;
    }

    const model = editor.getModel();
    if (!model) {
      setJsonText(newText);
      return;
    }

    editor.pushUndoStop();
    editor.executeEdits('json-lens', [
      {
        range: model.getFullModelRange(),
        text: newText,
      },
    ]);
    editor.pushUndoStop();
    setJsonText(newText);
  }, []);

  const handleFormat = useCallback(() => {
    if (!jsonValidation.isValid) return;

    try {
      const indent = getIndentValue(indentSize);
      const formatted = `${JSON.stringify(jsonValidation.value, null, indent)}\n`;
      applyTextToEditor(formatted);
      trigger('format');
    } catch {
      trigger('format', { error: true });
    }
  }, [
    jsonValidation.isValid,
    jsonValidation.value,
    indentSize,
    applyTextToEditor,
    trigger,
  ]);

  const handleMinify = useCallback(() => {
    if (!jsonValidation.isValid) return;

    try {
      const minified = JSON.stringify(jsonValidation.value);
      applyTextToEditor(minified);
      trigger('minify');
    } catch {
      trigger('minify', { error: true });
    }
  }, [
    jsonValidation.isValid,
    jsonValidation.value,
    applyTextToEditor,
    trigger,
  ]);

  const handleClear = useCallback(() => {
    applyTextToEditor('');
    trigger('clear');
  }, [applyTextToEditor, trigger]);

  const handleCopy = useCallback(async () => {
    if (!jsonText) return;

    try {
      await navigator.clipboard.writeText(jsonText);
      trigger('copy');
    } catch {
      trigger('copy', { error: true });
    }
  }, [jsonText, trigger]);

  const optionsContent = (
    <div className="flex items-center justify-between lg:justify-start gap-2">
      <span className="text-xs text-muted-foreground lg:hidden">Indent</span>
      <Tabs
        value={indentSize}
        onValueChange={value => setIndentSize(value as IndentSize)}
      >
        <TabsList className="h-8">
          <TabsTrigger value="2" className="text-xs px-2.5">
            2 spaces
          </TabsTrigger>
          <TabsTrigger value="4" className="text-xs px-2.5">
            4 spaces
          </TabsTrigger>
          <TabsTrigger value="tab" className="text-xs px-2.5">
            Tab
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );

  return (
    <MainLayout>
      <div className="flex flex-col h-[calc(100vh-57px)]">
        <JsonToolToolbar
          title="JSON Lens"
          options={optionsContent}
          actions={
            <>
              <ActionButton
                variant="ghost"
                size="sm"
                onClick={handleFormat}
                disabled={!jsonValidation.isValid}
                leftIcon={<TextInitial />}
                feedbackActive={isActive('format')}
              >
                <span className="hidden md:inline">Format</span>
              </ActionButton>
              <ActionButton
                variant="ghost"
                size="sm"
                onClick={handleMinify}
                disabled={!jsonValidation.isValid}
                leftIcon={<Minimize2 />}
                feedbackActive={isActive('minify')}
              >
                <span className="hidden md:inline">Minify</span>
              </ActionButton>
              <ActionButton
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                disabled={!jsonText}
                leftIcon={<Copy />}
                feedbackActive={isActive('copy')}
              >
                <span className="hidden md:inline">Copy</span>
              </ActionButton>
              <ActionButton
                variant="ghost"
                size="sm"
                onClick={handleClear}
                leftIcon={<Eraser />}
                feedbackActive={isActive('clear')}
              >
                <span className="hidden md:inline">Clear</span>
              </ActionButton>
            </>
          }
        />

        {/* Editor + Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-[8fr_2fr] flex-1 min-h-0 gap-1">
          {/* Editor */}
          <div className="flex flex-col min-h-0 rounded-sm overflow-hidden">
            <Editor
              height="100%"
              language="json"
              value={jsonText}
              theme={editorTheme}
              onChange={value => setJsonText(value ?? '')}
              onMount={handleEditorMount}
              options={BASE_EDITOR_OPTIONS}
            />
          </div>

          {/* Inspector */}
          <div className="flex flex-col min-h-0 rounded-sm overflow-hidden lg:overflow-y-auto p-4">
            <div className="space-y-2">
              {/* Structure */}
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-mono font-semibold">
                    {jsonStats ? (jsonStats.isArray ? 'Array' : 'Object') : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {jsonStats?.isArray ? 'Items' : 'Root Keys'}
                  </span>
                  <span className="font-mono font-semibold">
                    {jsonStats ? jsonStats.rootKeys : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Depth</span>
                  <span className="font-mono font-semibold">
                    {jsonStats ? jsonStats.depth : '—'}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Content */}
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lines</span>
                  <span className="font-mono font-semibold">
                    {jsonStats ? jsonStats.lines : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Characters</span>
                  <span className="font-mono font-semibold">
                    {jsonStats ? jsonStats.chars.toLocaleString() : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Size</span>
                  <span className="font-mono font-semibold">
                    {jsonStats ? jsonStats.size : '—'}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Compression */}
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Formatted</span>
                  <span className="font-mono font-semibold text-blue-500">
                    {jsonStats ? jsonStats.formattedSize : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Minified</span>
                  <span className="font-mono font-semibold text-green-500">
                    {jsonStats ? jsonStats.minifiedSize : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
