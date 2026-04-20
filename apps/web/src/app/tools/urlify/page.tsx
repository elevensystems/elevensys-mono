'use client';

import { useCallback, useState } from 'react';

import { formatDistanceToNow } from 'date-fns';
import { Copy, Link2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { ActionButton } from '@workspace/ui/components/action-button';
import { Button } from '@workspace/ui/components/button';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { Input } from '@workspace/ui/components/input';
import { ShineBorder } from '@workspace/ui/components/shine-border';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip';

import MainLayout from '@/components/layouts/main-layout';
import { ToolPageHeader } from '@/components/layouts/tool-page-header';
import { useActionFeedback } from '@/hooks/use-action-feedback';
import { useUrlHistory } from '@/hooks/use-url-history';
import type { UrlHistoryItem } from '@/hooks/use-url-history';

interface ShortenedUrlResult {
  shortUrl: string;
  shortCode: string;
  originalUrl: string;
  createdAt: string;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function truncateUrl(url: string, max = 60): string {
  return url.length > max ? url.slice(0, max) + '...' : url;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function UrlifyPage() {
  const [url, setUrl] = useState('');
  const [autoDelete, setAutoDelete] = useState(false);
  const [result, setResult] = useState<ShortenedUrlResult | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isActive, trigger } = useActionFeedback();
  const { items: history, add, remove, clearAll } = useUrlHistory();

  const handleShorten = useCallback(async () => {
    const trimmed = url.trim();

    if (!trimmed) {
      setError('Please enter a URL.');
      return;
    }

    if (!isValidHttpUrl(trimmed)) {
      setError('Please enter a valid URL (must start with http:// or https://).');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/urlify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalUrl: trimmed,
          autoDelete,
          ttlDays: autoDelete ? 30 : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to shorten URL');
      }

      const data = await response.json();

      if (!data.shortUrl) {
        throw new Error('Invalid response from server');
      }

      const shortened: ShortenedUrlResult = {
        shortUrl: data.shortUrl,
        shortCode: data.shortCode || data.shortUrl.split('/').pop(),
        originalUrl: data.originalUrl || trimmed,
        createdAt: data.createdAt || new Date().toISOString(),
      };

      // Move previous result to history
      if (result) {
        add(result);
      }

      setResult(shortened);
      setUrl('');
      toast.success('URL shortened successfully');
    } catch {
      setError('Failed to shorten URL. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [url, autoDelete, result, add]);

  const handleCopy = useCallback(
    async (shortUrl: string, feedbackId: string) => {
      try {
        await navigator.clipboard.writeText(shortUrl);
        trigger(feedbackId);
      } catch {
        trigger(feedbackId, { error: true });
      }
    },
    [trigger]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleShorten();
      }
    },
    [handleShorten]
  );

  return (
    <MainLayout>
      <section className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <ToolPageHeader
            title="Urlify"
            description="Shorten any URL into a compact, shareable link."
            error=""
          />

          {/* Input */}
          <div className="relative">
            <Input
              type="url"
              placeholder="Paste a long URL here..."
              value={url}
              onChange={e => {
                setUrl(e.target.value);
                setError('');
              }}
              onKeyDown={handleKeyDown}
              className="h-14 pr-32 text-base"
              aria-invalid={!!error}
              aria-describedby={error ? 'url-error' : undefined}
            />
            <div className="absolute top-1/2 right-2 -translate-y-1/2">
              <ActionButton
                onClick={handleShorten}
                disabled={isSubmitting}
                isLoading={isSubmitting}
                loadingText="..."
                size="default"
                leftIcon={<Link2 className="h-4 w-4" />}
              >
                <span className="hidden sm:inline">Shorten</span>
              </ActionButton>
            </div>
          </div>

          {error && (
            <p id="url-error" className="mt-2 text-sm text-destructive">
              {error}
            </p>
          )}

          {/* Auto-delete checkbox */}
          <div className="mt-4 flex items-start gap-2">
            <Checkbox
              id="auto-delete"
              checked={autoDelete}
              onCheckedChange={checked => setAutoDelete(checked === true)}
            />
            <div className="grid gap-0.5 leading-none">
              <Tooltip>
                <TooltipTrigger asChild>
                  <label
                    htmlFor="auto-delete"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Auto-delete link
                  </label>
                </TooltipTrigger>
                <TooltipContent side="right">
                  Link expires after 30 days
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Result card */}
          {result && (
            <div className="relative mt-8 rounded-lg bg-muted/30 p-5">
              <ShineBorder
                shineColor={['#A07CFE', '#FE8FB5', '#FFBE7B']}
                borderWidth={1.5}
                duration={10}
              />
              <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Shortened URL
              </p>
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <button
                    type="button"
                    onClick={() => handleCopy(result.shortUrl, 'result')}
                    className="cursor-pointer font-mono text-lg font-semibold hover:underline"
                  >
                    {result.shortUrl}
                  </button>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="truncate text-sm text-muted-foreground">
                        &hookleftarrow; {truncateUrl(result.originalUrl)}
                      </p>
                    </TooltipTrigger>
                    {result.originalUrl.length > 60 && (
                      <TooltipContent
                        side="bottom"
                        className="max-w-sm break-all"
                      >
                        {result.originalUrl}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </div>
                <ActionButton
                  variant="secondary"
                  onClick={() => handleCopy(result.shortUrl, 'result')}
                  leftIcon={<Copy className="h-4 w-4" />}
                  feedbackActive={isActive('result')}
                  aria-label="Copy shortened URL"
                >
                  Copy
                </ActionButton>
              </div>
            </div>
          )}

          {/* Recent list */}
          {history.length > 0 && (
            <div className="mt-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Recent</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="text-muted-foreground"
                >
                  Clear all
                </Button>
              </div>
              <div className="divide-y rounded-lg border">
                {history.map((item: UrlHistoryItem) => (
                  <div
                    key={item.shortCode + item.createdAt}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(item.shortUrl, `history-${item.shortCode}`)
                        }
                        className="cursor-pointer truncate font-mono text-sm font-medium hover:underline"
                      >
                        {item.shortUrl}
                      </button>
                      <p className="text-xs text-muted-foreground">
                        {getDomain(item.originalUrl)} &middot;{' '}
                        {formatDistanceToNow(new Date(item.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <ActionButton
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleCopy(item.shortUrl, `history-${item.shortCode}`)
                        }
                        aria-label="Copy URL"
                        leftIcon={<Copy className="h-4 w-4" />}
                        feedbackActive={isActive(
                          `history-${item.shortCode}`
                        )}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(item.shortCode)}
                        aria-label="Delete from history"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
}
