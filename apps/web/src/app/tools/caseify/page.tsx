'use client';

import { useDeferredValue, useMemo, useState } from 'react';

import { CaseSensitive, Check, ChevronDown, Copy, Eraser } from 'lucide-react';

import { ActionButton } from '@workspace/ui/components/action-button';
import MainLayout from '@/components/layouts/main-layout';
import { ToolPageHeader } from '@/components/layouts/tool-page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@workspace/ui/components/collapsible';
import { Textarea } from '@workspace/ui/components/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip';
import { useActionFeedback } from '@/hooks/use-action-feedback';
import {
  COMMON_CASES,
  type CaseDefinition,
  PROGRAMMING_CASES,
  tokenize,
} from '@/lib/caseify';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface CaseResultRowProps {
  def: CaseDefinition;
  result: string;
  isActive: (id: string) => boolean;
  onCopy: (text: string, id: string) => void;
}

function CaseResultRow({ def, result, isActive, onCopy }: CaseResultRowProps) {
  const isCopied = isActive(def.id);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted/50 cursor-pointer"
          onClick={() => onCopy(result, def.id)}
          aria-label={isCopied ? 'Copied to clipboard' : 'Copy to clipboard'}
        >
          <div className="w-48 shrink-0">
            <span className="text-sm font-medium">{def.name}</span>
            {def.aliases && (
              <span className="block text-xs text-muted-foreground">
                also: {def.aliases.join(', ')}
              </span>
            )}
          </div>
          <code className="flex-1 truncate font-mono text-sm">{result}</code>
          {isCopied ? (
            <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <Copy
              className="h-4 w-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent>{isCopied ? 'Copied!' : 'Click to copy'}</TooltipContent>
    </Tooltip>
  );
}

interface CaseSectionProps {
  title: string;
  cases: readonly CaseDefinition[];
  results: Map<string, string>;
  isActive: (id: string) => boolean;
  onCopy: (text: string, id: string) => void;
}

function CaseSection({
  title,
  cases,
  results,
  isActive,
  onCopy,
}: CaseSectionProps) {
  const [open, setOpen] = useState(true);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 p-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase rounded-md data-[state=open]:bg-muted">
        <ChevronDown
          className={`size-4 transition-transform ${open ? '' : '-rotate-90'}`}
        />
        {title}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-1">
          {cases.map(def => (
            <CaseResultRow
              key={def.id}
              def={def}
              result={results.get(def.id) ?? ''}
              isActive={isActive}
              onCopy={onCopy}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CaseifyPage() {
  const [input, setInput] = useState('');
  const deferredInput = useDeferredValue(input);
  const { isActive, trigger } = useActionFeedback();

  // Memoise tokenisation (shared across all converters)
  const lineTokens = useMemo(() => {
    const trimmed = deferredInput.trim();
    if (!trimmed) return null;

    const lines = trimmed.split('\n');
    if (lines.length === 1) {
      return [tokenize(trimmed)];
    }
    return lines.map(line => {
      const t = line.trim();
      return t ? tokenize(t) : [];
    });
  }, [deferredInput]);

  // Compute all results from shared tokens
  const results = useMemo(() => {
    const map = new Map<string, string>();
    if (!lineTokens) return map;

    const isSingleLine = deferredInput.indexOf('\n') === -1;

    for (const def of [...COMMON_CASES, ...PROGRAMMING_CASES]) {
      if (isSingleLine) {
        const tokens = lineTokens[0];
        map.set(def.id, tokens.length > 0 ? def.convert(tokens) : '');
      } else {
        const converted = lineTokens
          .map(tokens => (tokens.length > 0 ? def.convert(tokens) : ''))
          .join('\n');
        map.set(def.id, converted);
      }
    }
    return map;
  }, [lineTokens, deferredInput]);

  const hasInput = deferredInput.trim().length > 0;

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      trigger(id);
    } catch {
      trigger(id, { error: true });
    }
  };

  return (
    <MainLayout>
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-full mx-auto space-y-8">
          <ToolPageHeader
            title="Caseify"
            description="Transform your text between common casing styles and delimiters in one click."
          />

          {/* Input */}
          <Card className="flex flex-col mb-6">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <CaseSensitive className="size-5" />
                Source Text
              </CardTitle>
              <div className="flex items-center gap-2">
                <ActionButton
                  variant="ghost"
                  size="sm"
                  disabled={!input}
                  onClick={() => setInput('')}
                  leftIcon={<Eraser />}
                >
                  Clear
                </ActionButton>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Type or paste your text here..."
                value={input}
                onChange={e => setInput(e.target.value)}
                rows={3}
                className="font-mono text-sm"
              />
            </CardContent>
          </Card>

          {/* Results */}
          {!hasInput ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              <p>Start typing to see conversions</p>
            </div>
          ) : (
            <div className="space-y-4">
              <CaseSection
                title="Common Text Cases"
                cases={COMMON_CASES}
                results={results}
                isActive={isActive}
                onCopy={handleCopy}
              />
              <CaseSection
                title="Programming / Code Cases"
                cases={PROGRAMMING_CASES}
                results={results}
                isActive={isActive}
                onCopy={handleCopy}
              />
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
}
