'use client';

import { useCallback, useState } from 'react';

import { Copy, Link2 } from 'lucide-react';

import { ActionButton } from '@/components/action-button';
import MainLayout from '@/components/layouts/main-layout';
import { ToolPageHeader } from '@/components/layouts/tool-page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Label } from '@workspace/ui/components/label';
import { Textarea } from '@workspace/ui/components/textarea';
import { useActionFeedback } from '@/hooks/use-action-feedback';
import { type PRItem, parsePrUrls } from '@/lib/pr-utils';

export default function PRLinkShrinkerPage() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<{
    plainText: string;
    items: PRItem[];
  } | null>(null);
  const [error, setError] = useState('');
  const { isActive, trigger } = useActionFeedback();

  const handleShrink = useCallback(() => {
    const trimmedInput = input.trim();

    // Clear previous results
    setResult(null);
    setError('');
    if (!trimmedInput) {
      setError('Please paste PR links to shorten');
      return;
    }

    const { plainText, items } = parsePrUrls(trimmedInput);

    if (items.length === 0) {
      setError(
        'No valid PR links detected. Please paste valid GitHub PR URLs.'
      );
      return;
    }

    setResult({ plainText, items });
  }, [input]);

  const handleCopy = useCallback(async () => {
    if (!result?.plainText) return;

    try {
      await navigator.clipboard.writeText(result.plainText);
      trigger('copy');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      setError('Failed to copy to clipboard');
      trigger('copy', { error: true });
    }
  }, [result, trigger]);

  const handleClear = useCallback(() => {
    setInput('');
    setResult(null);
    setError('');
  }, []);

  return (
    <MainLayout>
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-full mx-auto">
          <ToolPageHeader
            title="PR Link Shrinker"
            description="Shorten long GitHub PR URLs to a compact, readable format. Perfect for status updates and documentation."
            infoMessage='Convert GitHub pull request URLs to a shortened format like "repo-name#123". All processing is done locally in your browser.'
            error={error}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  GitHub PR Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pr-input">
                    Paste GitHub PR URLs (comma or line-separated)
                  </Label>
                  <Textarea
                    id="pr-input"
                    rows={12}
                    value={input}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setInput(e.target.value)
                    }
                    placeholder="https://github.com/Organization/some-repo/pull/10061&#10;https://github.com/AnotherOrg/some-other-repo/pull/6789&#10;or separate with commas..."
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste GitHub PR URLs separated by commas, line breaks, or
                    both
                  </p>
                </div>

                <div className="flex gap-2">
                  <ActionButton
                    onClick={handleShrink}
                    disabled={!input.trim()}
                    className="flex-1"
                    size="lg"
                    leftIcon={<Link2 />}
                  >
                    Shorten Links
                  </ActionButton>
                  {(input || result) && (
                    <ActionButton
                      onClick={handleClear}
                      variant="outline"
                      size="lg"
                    >
                      Clear
                    </ActionButton>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Result Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 justify-between">
                  <span className="flex items-center gap-2">
                    <Link2 className="h-5 w-5" />
                    Shortened Links
                  </span>
                  {result && result.items.length > 0 && (
                    <span className="text-sm font-normal text-muted-foreground">
                      {result.items.length} PR
                      {result.items.length !== 1 ? 's' : ''} found
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!result ? (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    <p className="text-center">
                      Paste GitHub PR URLs and click &quot;Shorten Links&quot;
                      to generate the shortened format
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="shortened-result">Shortened Format</Label>
                      <div className="relative">
                        <div className="p-3 bg-muted rounded-lg font-mono text-sm min-h-[12rem] max-h-[18rem] overflow-y-auto">
                          {result.items.map((item, index) => (
                            <span key={index}>
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                {item.repo}#{item.number}
                              </a>
                              {index < result.items.length - 1 && ', '}
                            </span>
                          ))}
                        </div>
                        <ActionButton
                          size="sm"
                          variant="ghost"
                          onClick={handleCopy}
                          className="absolute top-2 right-2"
                          aria-label="Copy to clipboard"
                          leftIcon={<Copy aria-hidden="true" />}
                          feedbackActive={isActive('copy')}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Plain text format (without links) has been copied
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Plain Text Preview</Label>
                      <div className="p-3 bg-muted rounded-lg">
                        <code className="text-sm break-all">
                          {result.plainText}
                        </code>
                      </div>
                    </div>

                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        💡 Tip: The shortened format is perfect for status
                        updates, commit messages, and documentation. Click the
                        links to open the original PRs.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
