'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

import Editor from '@monaco-editor/react';
import { findNodeAtLocation, parseTree } from 'jsonc-parser';
import { Eraser, GitCompare, X } from 'lucide-react';
import type * as Monaco from 'monaco-editor';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

import { ActionButton } from '@/components/action-button';
import { JsonToolToolbar } from '@/components/layouts/json-tool-toolbar';
import MainLayout from '@/components/layouts/main-layout';
import { Badge } from '@workspace/ui/components/badge';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { Separator } from '@workspace/ui/components/separator';
import {
  type DiffPaths,
  type JsonPath,
  computeJsonDiff,
  formatDiffHtml,
} from '@/lib/diff';
import { parseJsonSafely } from '@/lib/json-utils';
import {
  BASE_EDITOR_OPTIONS,
  getEditorTheme,
  registerFormatOnPaste,
} from '@/lib/monaco-config';
import { cn } from '@workspace/ui/lib/utils';

const DEFAULT_ORIGINAL = `{
  "service": "payments",
  "version": 1,
  "features": {
    "fraudProtection": true,
    "currencies": [
      "USD",
      "EUR",
      "JPY"
    ]
  },
  "limits": {
    "daily": 5000,
    "monthly": 50000
  },
  "owners": [
    "alex",
    "morgan"
  ]
}`;

const DEFAULT_MODIFIED = `{
  "service": "payments",
  "version": 2,
  "features": {
    "fraudProtection": false,
    "currencies": [
      "USD",
      "EUR",
      "JPY",
      "GBP"
    ],
    "retries": 3
  },
  "limits": {
    "daily": 4500,
    "weekly": 12000,
    "monthly": 50000
  }
}`;

const buildDecorationsForPaths = (
  monaco: typeof Monaco,
  model: Monaco.editor.ITextModel,
  paths: JsonPath[],
  className: string
): Monaco.editor.IModelDeltaDecoration[] => {
  const tree = parseTree(model.getValue());

  if (!tree) {
    return [];
  }

  return paths.flatMap(path => {
    const node = findNodeAtLocation(tree, path);

    if (!node) {
      return [];
    }

    const startPosition = model.getPositionAt(node.offset);
    const endPosition = model.getPositionAt(node.offset + node.length);
    const startLine = startPosition.lineNumber;
    const endLine = Math.max(startLine, endPosition.lineNumber);

    return [
      {
        range: new monaco.Range(startLine, 1, endLine, 1),
        options: {
          isWholeLine: true,
          className,
        },
      },
    ];
  });
};

export default function JsonDiffinityPage() {
  const { resolvedTheme } = useTheme();
  const editorTheme = getEditorTheme(resolvedTheme);

  const [originalText, setOriginalText] = useState(DEFAULT_ORIGINAL);
  const [modifiedText, setModifiedText] = useState(DEFAULT_MODIFIED);
  const [diffHtml, setDiffHtml] = useState('');
  const [diffOpen, setDiffOpen] = useState(false);
  const [diffPaths, setDiffPaths] = useState<DiffPaths | null>(null);
  const [isStale, setIsStale] = useState(false);

  const monacoRef = useRef<typeof Monaco | null>(null);
  const isMonacoConfiguredRef = useRef(false);

  const originalEditorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(
    null
  );
  const modifiedEditorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(
    null
  );

  const originalDecorationsRef = useRef<string[]>([]);
  const modifiedDecorationsRef = useRef<string[]>([]);

  const originalValidation = useMemo(
    () => parseJsonSafely(originalText),
    [originalText]
  );
  const modifiedValidation = useMemo(
    () => parseJsonSafely(modifiedText),
    [modifiedText]
  );

  const isCompareDisabled =
    !originalValidation.isValid || !modifiedValidation.isValid;

  const configureMonaco = useCallback((monaco: typeof Monaco) => {
    if (isMonacoConfiguredRef.current) {
      return;
    }

    const jsonDefaults = (
      monaco.languages as unknown as {
        json?: {
          jsonDefaults?: { setDiagnosticsOptions: (o: object) => void };
        };
      }
    ).json?.jsonDefaults;

    jsonDefaults?.setDiagnosticsOptions({
      validate: true,
      allowComments: false,
      schemas: [],
    });

    isMonacoConfiguredRef.current = true;
  }, []);

  const handleEditorMount = useCallback(
    (
      editor: Monaco.editor.IStandaloneCodeEditor,
      monaco: typeof Monaco,
      side: 'original' | 'modified'
    ) => {
      configureMonaco(monaco);
      monacoRef.current = monaco;
      registerFormatOnPaste(editor);

      if (side === 'original') {
        originalEditorRef.current = editor;
      } else {
        modifiedEditorRef.current = editor;
      }
    },
    [configureMonaco]
  );

  const applyDecorations = useCallback(
    (paths: { left: JsonPath[]; right: JsonPath[]; modified: JsonPath[] }) => {
      const monaco = monacoRef.current;

      if (!monaco) {
        return;
      }

      const originalEditor = originalEditorRef.current;
      const modifiedEditor = modifiedEditorRef.current;

      if (originalEditor) {
        const model = originalEditor.getModel();

        if (model) {
          const newDecorations = [
            ...buildDecorationsForPaths(
              monaco,
              model,
              paths.left,
              'json-diff-removed'
            ),
            ...buildDecorationsForPaths(
              monaco,
              model,
              paths.modified,
              'json-diff-modified'
            ),
          ];

          originalDecorationsRef.current = originalEditor.deltaDecorations(
            originalDecorationsRef.current,
            newDecorations
          );
        }
      }

      if (modifiedEditor) {
        const model = modifiedEditor.getModel();

        if (model) {
          const newDecorations = [
            ...buildDecorationsForPaths(
              monaco,
              model,
              paths.right,
              'json-diff-added'
            ),
            ...buildDecorationsForPaths(
              monaco,
              model,
              paths.modified,
              'json-diff-modified'
            ),
          ];

          modifiedDecorationsRef.current = modifiedEditor.deltaDecorations(
            modifiedDecorationsRef.current,
            newDecorations
          );
        }
      }
    },
    []
  );

  const clearHighlights = useCallback(() => {
    const originalEditor = originalEditorRef.current;
    const modifiedEditor = modifiedEditorRef.current;

    if (originalEditor) {
      originalDecorationsRef.current = originalEditor.deltaDecorations(
        originalDecorationsRef.current,
        []
      );
    }

    if (modifiedEditor) {
      modifiedDecorationsRef.current = modifiedEditor.deltaDecorations(
        modifiedDecorationsRef.current,
        []
      );
    }
  }, []);

  const handleOriginalChange = useCallback(
    (value: string | undefined) => {
      setOriginalText(value ?? '');
      if (diffPaths) setIsStale(true);
    },
    [diffPaths]
  );

  const handleModifiedChange = useCallback(
    (value: string | undefined) => {
      setModifiedText(value ?? '');
      if (diffPaths) setIsStale(true);
    },
    [diffPaths]
  );

  const handleCompare = useCallback(() => {
    if (isCompareDisabled) {
      toast.error('Fix JSON errors before comparing.');
      return;
    }

    const { delta, paths } = computeJsonDiff(
      originalValidation.value,
      modifiedValidation.value
    );

    if (!delta) {
      setDiffHtml('');
      setDiffPaths(null);
      setDiffOpen(false);
      setIsStale(false);
      applyDecorations({ left: [], right: [], modified: [] });
      toast.success('No differences found.');
      return;
    }

    setDiffHtml(formatDiffHtml(delta, originalValidation.value));
    setDiffPaths(paths);
    setDiffOpen(true);
    setIsStale(false);
    applyDecorations({
      left: paths.removed,
      right: paths.added,
      modified: paths.modified,
    });
  }, [
    applyDecorations,
    isCompareDisabled,
    modifiedValidation.value,
    originalValidation.value,
  ]);

  const handleClearAll = useCallback(() => {
    setOriginalText('');
    setModifiedText('');
    setDiffHtml('');
    setDiffPaths(null);
    setDiffOpen(false);
    setIsStale(false);
    clearHighlights();
  }, [clearHighlights]);

  return (
    <MainLayout>
      <div className="flex flex-col h-[calc(100vh-57px)]">
        <JsonToolToolbar
          title="JSON Diffinity"
          actions={
            <div className="flex items-center gap-1.5">
              <ActionButton
                size="sm"
                onClick={handleCompare}
                disabled={isCompareDisabled}
                leftIcon={<GitCompare />}
              >
                Compare
              </ActionButton>

              {diffPaths && (
                <>
                  <Separator
                    orientation="vertical"
                    className="data-[orientation=vertical]:h-4"
                  />
                  <div className="flex items-center gap-1">
                    {diffPaths.added.length > 0 && (
                      <Badge
                        className={cn(
                          'bg-green-600 font-mono text-[10px] px-1.5 py-0',
                          isStale && 'line-through opacity-50'
                        )}
                      >
                        +{diffPaths.added.length}
                      </Badge>
                    )}
                    {diffPaths.removed.length > 0 && (
                      <Badge
                        variant="destructive"
                        className={cn(
                          'font-mono text-[10px] px-1.5 py-0',
                          isStale && 'line-through opacity-50'
                        )}
                      >
                        -{diffPaths.removed.length}
                      </Badge>
                    )}
                    {diffPaths.modified.length > 0 && (
                      <Badge
                        className={cn(
                          'bg-yellow-500 text-white font-mono text-[10px] px-1.5 py-0',
                          isStale && 'line-through opacity-50'
                        )}
                      >
                        ~{diffPaths.modified.length}
                      </Badge>
                    )}
                  </div>
                </>
              )}

              <Separator
                orientation="vertical"
                className="data-[orientation=vertical]:h-4"
              />
              <ActionButton
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                leftIcon={<Eraser />}
              >
                <span className="hidden md:inline">Clear</span>
              </ActionButton>
            </div>
          }
        />

        {/* Editors + Diff drawer */}
        <div
          className={cn(
            'flex flex-col flex-1 min-h-0',
            isStale && 'diff-stale'
          )}
        >
          {/* Editors grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 flex-1 min-h-0 gap-1">
            {/* Original */}
            <div className="flex flex-col min-h-0 rounded-sm overflow-hidden">
              <Editor
                height="100%"
                language="json"
                value={originalText}
                theme={editorTheme}
                onChange={handleOriginalChange}
                onMount={(editor, monaco) =>
                  handleEditorMount(editor, monaco, 'original')
                }
                options={BASE_EDITOR_OPTIONS}
              />
            </div>

            {/* Modified */}
            <div className="flex flex-col min-h-0 rounded-sm overflow-hidden">
              <Editor
                height="100%"
                language="json"
                value={modifiedText}
                theme={editorTheme}
                onChange={handleModifiedChange}
                onMount={(editor, monaco) =>
                  handleEditorMount(editor, monaco, 'modified')
                }
                options={BASE_EDITOR_OPTIONS}
              />
            </div>
          </div>

          {/* Diff drawer */}
          {diffOpen && (
            <div className="h-[250px] shrink-0 border-t">
              <div className="flex items-center justify-between px-3 py-1.5 border-b bg-muted/30">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <GitCompare className="size-3.5" />
                  Diff Viewer
                </span>
                <ActionButton
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setDiffOpen(false)}
                  leftIcon={<X />}
                  aria-label="Close diff viewer"
                />
              </div>
              <ScrollArea className="h-[calc(250px-37px)]">
                <div className="p-4">
                  <div
                    className="json-diff-viewer"
                    dangerouslySetInnerHTML={{ __html: diffHtml }}
                  />
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
