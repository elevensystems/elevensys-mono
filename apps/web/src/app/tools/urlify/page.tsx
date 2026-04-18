'use client';

import { useCallback, useState } from 'react';

import { useForm, useStore } from '@tanstack/react-form';
import {
  CalendarClock,
  Check,
  Copy,
  Link2,
  Settings as SettingsIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { ActionButton } from '@workspace/ui/components/action-button';
import MainLayout from '@/components/layouts/main-layout';
import { ToolPageHeader } from '@/components/layouts/tool-page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { Field, FieldError, FieldLabel } from '@workspace/ui/components/field';
import { Input } from '@workspace/ui/components/input';
import { useActionFeedback } from '@/hooks/use-action-feedback';
import { urlifySchema } from '@/lib/schemas/urlify';

interface ShortenedUrlResult {
  shortUrl: string;
  shortCode?: string;
  originalUrl?: string;
  createdAt?: string;
  expiresAt?: string;
}

export default function UrlifyPage() {
  const [result, setResult] = useState<ShortenedUrlResult | null>(null);
  const { isActive, trigger } = useActionFeedback();
  const [error, setError] = useState('');

  const form = useForm({
    defaultValues: { url: '', autoDelete: false, ttlDays: '' },
    validators: { onSubmit: urlifySchema },
    onSubmit: async ({ value }) => {
      setError('');
      setResult(null);

      try {
        const response = await fetch('/api/urlify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            originalUrl: value.url.trim(),
            autoDelete: value.autoDelete,
            ttlDays:
              value.autoDelete && value.ttlDays.trim()
                ? Number(value.ttlDays)
                : undefined,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to shorten URL');
        }

        const data = await response.json();

        if (data.shortUrl) {
          setResult(data);
          toast.success('URL shortened successfully', {
            description: 'Your short URL is ready to use.',
            icon: <Check className="h-4 w-4" />,
            duration: 5000,
          });
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (err) {
        console.error('Error shortening URL:', err);
        const errorMessage = 'Failed to shorten URL. Please try again.';
        setError(errorMessage);
        toast.error(errorMessage, { duration: 5000 });
      }
    },
  });

  const autoDelete = useStore(form.store, s => s.values.autoDelete);

  const handleCopy = useCallback(async () => {
    if (!result?.shortUrl) return;

    try {
      await navigator.clipboard.writeText(result.shortUrl);
      trigger('copy');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      trigger('copy', { error: true });
    }
  }, [result, trigger]);

  return (
    <MainLayout>
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-full mx-auto">
          <ToolPageHeader
            title="Urlify"
            description="Make your URLs shorter and easier to share. Free tool for creating short links."
            infoMessage="URL shortening is processed securely through our server. Your links are never stored permanently."
            error={error}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Settings Card */}
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-1">
                  <CardTitle className="flex items-center gap-2">
                    <SettingsIcon className="h-5 w-5" />
                    Settings
                  </CardTitle>
                  <CardDescription>
                    Configure your URL shortening options below.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* URL Input */}
                <form.Field
                  name="url"
                  children={field => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                          Enter Long URL
                        </FieldLabel>
                        <Input
                          id={field.name}
                          type="url"
                          placeholder="https://example.com/very/long/url/path"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={e => {
                            field.handleChange(e.target.value);
                            setResult(null);
                            setError('');
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              form.handleSubmit();
                            }
                          }}
                          className="h-12"
                          aria-invalid={isInvalid}
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    );
                  }}
                />

                {/* Auto-delete */}
                <form.Field
                  name="autoDelete"
                  children={field => (
                    <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
                      <Checkbox
                        id="auto-delete"
                        checked={field.state.value}
                        onCheckedChange={checked => {
                          field.handleChange(checked === true);
                        }}
                      />
                      <div className="space-y-1">
                        <FieldLabel htmlFor="auto-delete">
                          Auto-delete link
                        </FieldLabel>
                        <p className="text-xs text-muted-foreground">
                          Enable to expire the link after a set number of days.
                        </p>
                      </div>
                    </div>
                  )}
                />

                <form.Field
                  name="ttlDays"
                  children={field => {
                    const isInvalid =
                      autoDelete &&
                      field.state.meta.isTouched &&
                      !field.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                          Expires After (days)
                        </FieldLabel>
                        <Input
                          id={field.name}
                          type="number"
                          min={1}
                          step={1}
                          placeholder="30"
                          value={field.state.value}
                          disabled={!autoDelete}
                          onBlur={field.handleBlur}
                          onChange={e => field.handleChange(e.target.value)}
                          className="h-12"
                          aria-invalid={isInvalid}
                        />
                        <p className="text-xs text-muted-foreground">
                          Leave blank to use the default 30-day expiration.
                        </p>
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    );
                  }}
                />

                {/* Shorten Button */}
                <ActionButton
                  onClick={() => form.handleSubmit()}
                  disabled={form.state.isSubmitting}
                  className="w-full"
                  size="lg"
                  leftIcon={<Link2 />}
                  isLoading={form.state.isSubmitting}
                  loadingText="Shortening..."
                >
                  Shorten URL
                </ActionButton>
              </CardContent>
            </Card>

            {/* Result Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  Result
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!result?.shortUrl ? (
                  <div className="flex items-center justify-center h-40 text-muted-foreground">
                    <p>
                      Enter a URL and click &quot;Shorten URL&quot; to get
                      started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <FieldLabel className="text-sm font-medium">
                        Shortened URL
                      </FieldLabel>
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        <code className="flex-1 text-sm font-mono break-all select-all">
                          {result.shortUrl}
                        </code>
                        <ActionButton
                          size="sm"
                          variant="ghost"
                          onClick={handleCopy}
                          aria-label="Copy to clipboard"
                          leftIcon={<Copy aria-hidden="true" />}
                          feedbackActive={isActive('copy')}
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 rounded-lg border bg-muted/30 p-4 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">
                          Short code
                        </span>
                        <span className="font-medium">
                          {result.shortCode ?? '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">
                          Original URL
                        </span>
                        <span className="font-medium break-all text-right">
                          {result.originalUrl ??
                            form.getFieldValue('url').trim()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <CalendarClock className="h-4 w-4" />
                          Created
                        </span>
                        <span className="font-medium">
                          {result.createdAt
                            ? new Date(result.createdAt).toLocaleString()
                            : '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <CalendarClock className="h-4 w-4" />
                          Expires
                        </span>
                        <span className="font-medium">
                          {result.expiresAt
                            ? new Date(result.expiresAt).toLocaleString()
                            : 'Never'}
                        </span>
                      </div>
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
