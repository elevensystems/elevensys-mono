'use client';

import { useCallback, useState } from 'react';

import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Label } from '@workspace/ui/components/label';
import { Textarea } from '@workspace/ui/components/textarea';
import { Check, Copy, Package } from 'lucide-react';

import MainLayout from '@/components/layouts/main-layout';
import { ToolPageHeader } from '@/components/layouts/tool-page-header';
import { useActionFeedback } from '@/hooks/use-action-feedback';

/**
 * Converts Lerna publish output to npm install command
 * Supports both formats:
 * 1. - package-name => version
 * 2. - package-name@version (with or without scope)
 * @param {string} text - Raw Lerna output text
 * @returns {Object} - { command, packages, count }
 */
function convertLernaToNpm(text: string): {
  command: string;
  packages: string[];
  count: number;
} {
  const lines = text.split('\n');
  const pkgs: string[] = [];

  for (const line of lines) {
    // Match both formats:
    // 1. - package-name => version
    // 2. - package-name@version (with or without scope)
    const match = line.match(
      /^\s*-\s*(@?[^\s@]+(?:\/[^\s@]+)?)(?:\s*=>\s*|@)([\w\.-]+(?:\+[^\s]+)?)$/
    );
    if (match) {
      // Remove any trailing +... from the version
      const version = match[2].split('+')[0];
      // Format as package@version and add to the list
      pkgs.push(`${match[1]}@${version}`);
    }
  }

  const command = pkgs.length ? `npm install ${pkgs.join(' ')}` : '';
  return { command, packages: pkgs, count: pkgs.length };
}

/**
 * Check if text looks like Lerna output
 * @param {string} text - Input text to validate
 * @returns {boolean}
 */
function isLernaOutput(text: string): boolean {
  // Check for at least one line matching either Lerna package pattern
  return /-\s+@?[^\s@]+(?:\/[^\s@]+)?(?:\s*=>\s*|@)[\w\.-]+/.test(text);
}

export default function NpmConverterPage() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<{
    command: string;
    count: number;
  } | null>(null);
  const [error, setError] = useState('');
  const { isActive, trigger } = useActionFeedback();

  const handleConvert = useCallback(() => {
    const trimmedInput = input.trim();

    // Clear previous results
    setResult(null);
    setError('');
    if (!trimmedInput) {
      setError('Please paste Lerna output to convert');
      return;
    }

    // Check if it looks like valid Lerna output
    if (!isLernaOutput(trimmedInput)) {
      setError('Input does not appear to be valid Lerna output');
      return;
    }

    const { command, count } = convertLernaToNpm(trimmedInput);

    if (!command) {
      setError('No valid packages found in the Lerna output');
      return;
    }

    setResult({ command, count });
  }, [input]);

  const handleCopy = useCallback(async () => {
    if (!result?.command) return;

    try {
      await navigator.clipboard.writeText(result.command);
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
            title="NPM Converter"
            description="Convert Lerna publish output to npm install commands. Paste your Lerna output and get the npm install command instantly."
            infoMessage="This tool converts Lerna monorepo package publish output into a format ready for npm install. All processing is done locally in your browser."
            error={error}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Lerna Output
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="lerna-input">
                    Paste Lerna publish output
                  </Label>
                  <Textarea
                    id="lerna-input"
                    rows={12}
                    value={input}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setInput(e.target.value)
                    }
                    placeholder="Paste Lerna output here...&#10;Example:&#10; - @scope/package-name => 1.2.3&#10; - another-package@4.5.6"
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste the output from your Lerna publish command
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleConvert}
                    disabled={!input.trim()}
                    className="flex-1"
                    size="lg"
                  >
                    <Package />
                    Convert to NPM Install
                  </Button>
                  {(input || result) && (
                    <Button onClick={handleClear} variant="outline" size="lg">
                      Clear
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Result Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 justify-between">
                  <span className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    NPM Install Command
                  </span>
                  {result && (
                    <span className="text-sm font-normal text-muted-foreground">
                      {result.count} package{result.count !== 1 ? 's' : ''}{' '}
                      converted ⚙
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!result ? (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    <p className="text-center">
                      Paste Lerna output and click &quot;Convert to NPM
                      Install&quot; to generate the npm install command
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="npm-result">Command</Label>
                      <div className="relative">
                        <Textarea
                          id="npm-result"
                          rows={12}
                          value={result.command}
                          readOnly
                          className="font-mono text-sm bg-muted pr-20"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCopy}
                          className="absolute top-2 right-2"
                          aria-label="Copy to clipboard"
                        >
                          {isActive('copy') ? (
                            <Check className="animate-bounce-in" />
                          ) : (
                            <Copy aria-hidden="true" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Use this command to install all the published packages
                      </p>
                    </div>

                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        💡 Tip: You can paste this command directly into your
                        terminal to install all packages at their specific
                        versions.
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
