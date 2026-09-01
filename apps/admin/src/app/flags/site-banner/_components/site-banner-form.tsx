'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { useForm, useStore } from '@tanstack/react-form';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@workspace/ui/components/alert-dialog';
import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Checkbox } from '@workspace/ui/components/checkbox';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@workspace/ui/components/field';
import { Input } from '@workspace/ui/components/input';
import { NativeSelect } from '@workspace/ui/components/native-select';
import { SiteBanner } from '@workspace/ui/components/site-banner';
import { Spinner } from '@workspace/ui/components/spinner';
import { Textarea } from '@workspace/ui/components/textarea';
import { toast } from 'sonner';

import { BannerHistory } from '@/app/flags/site-banner/_components/banner-history';
import type { SiteBannerFormValues } from '@/lib/site-banner-schema';
import {
  SITE_BANNER_PRESETS,
  SITE_BANNER_STATES,
  SITE_BANNER_TARGETS,
  STATE_LABELS,
  TARGET_LABELS,
  siteBannerFormSchema,
  toAnnouncementValue,
  toFormValues,
} from '@/lib/site-banner-schema';
import type { SiteBannerSnapshot, SiteBannerTarget } from '@/types/site-banner';

interface SiteBannerFormProps {
  snapshot: SiteBannerSnapshot;
}

export function SiteBannerForm({ snapshot }: SiteBannerFormProps) {
  const router = useRouter();
  const [current, setCurrent] = useState(snapshot);

  const form = useForm({
    defaultValues: toFormValues('all', snapshot.values.all),
    validators: { onSubmit: siteBannerFormSchema },
    onSubmit: async ({ value }) => {
      await save(value.target, toAnnouncementValue(value));
    },
  });

  const values = useStore(form.store, state => state.values);
  const isSubmitting = useStore(form.store, state => state.isSubmitting);

  // Preview the composed announcement even while it is switched off, so an
  // admin can draft one before making it live.
  const previewValue = toAnnouncementValue({ ...values, enabled: true });
  const liveValue = current.values[values.target] ?? '';

  async function save(target: SiteBannerTarget, value: string) {
    const response = await fetch('/api/flags/site-banner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target, value }),
    });

    // An expired session is redirected to the HTML login page, so the body is
    // not always JSON — read it defensively rather than throwing here.
    let data: (SiteBannerSnapshot & { error?: string }) | null = null;
    try {
      data = (await response.json()) as SiteBannerSnapshot & { error?: string };
    } catch {
      toast.error('Your session has expired. Reload the page and sign in.');
      return;
    }

    if (!response.ok || !data?.values) {
      toast.error(data?.error ?? 'Could not save the banner.');
      return;
    }

    setCurrent(data);
    applyValues(toFormValues(target, data.values[target] ?? ''));
    toast.success(
      value
        ? 'Banner saved. It may take a few seconds to appear on every app.'
        : 'Banner cleared.'
    );
    // Refresh so this app's own banner reflects the change too.
    router.refresh();
  }

  /**
   * Loads a whole set of values into the form.
   *
   * Not `form.reset(values)`: `useForm` re-applies its options on every render,
   * which overwrites the `defaultValues` that `reset` sets, so the passed
   * values are discarded and the form snaps back to its first state. Resetting
   * first clears validation meta; `dontUpdateMeta` then keeps the loaded fields
   * from counting as touched, so no errors appear before anyone types.
   */
  function applyValues(next: SiteBannerFormValues) {
    form.reset();
    const opts = { dontUpdateMeta: true };
    form.setFieldValue('target', next.target, opts);
    form.setFieldValue('enabled', next.enabled, opts);
    form.setFieldValue('state', next.state, opts);
    form.setFieldValue('title', next.title, opts);
    form.setFieldValue('message', next.message, opts);
    form.setFieldValue('actionLabel', next.actionLabel, opts);
    form.setFieldValue('actionHref', next.actionHref, opts);
    form.setFieldValue('startsAt', next.startsAt, opts);
    form.setFieldValue('endsAt', next.endsAt, opts);
  }

  function switchTarget(target: SiteBannerTarget) {
    applyValues(toFormValues(target, current.values[target] ?? ''));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Announcement</CardTitle>
            <CardDescription>
              Shown at the top of every page. An app-specific announcement
              replaces the one set for all apps.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-6"
              onSubmit={event => {
                event.preventDefault();
                event.stopPropagation();
                void form.handleSubmit();
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <form.Field
                  name="target"
                  children={field => (
                    <Field>
                      <FieldLabel htmlFor="banner-target">Show on</FieldLabel>
                      <NativeSelect
                        id="banner-target"
                        value={field.state.value}
                        onChange={event =>
                          switchTarget(event.target.value as SiteBannerTarget)
                        }
                      >
                        {SITE_BANNER_TARGETS.map(target => (
                          <option key={target} value={target}>
                            {TARGET_LABELS[target]}
                            {current.values[target] ? ' — live' : ''}
                          </option>
                        ))}
                      </NativeSelect>
                      <FieldDescription>
                        Switching loads whatever that target has saved.
                      </FieldDescription>
                    </Field>
                  )}
                />

                <form.Field
                  name="state"
                  children={field => (
                    <Field>
                      <FieldLabel htmlFor="banner-state">Style</FieldLabel>
                      <NativeSelect
                        id="banner-state"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={event =>
                          field.handleChange(
                            event.target
                              .value as (typeof SITE_BANNER_STATES)[number]
                          )
                        }
                      >
                        {SITE_BANNER_STATES.map(state => (
                          <option key={state} value={state}>
                            {STATE_LABELS[state]}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                  )}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground text-sm">
                  Start from:
                </span>
                {SITE_BANNER_PRESETS.map(preset => (
                  <Button
                    key={preset.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      applyValues({
                        ...values,
                        ...preset.values,
                        enabled: true,
                      })
                    }
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>

              <form.Field
                name="title"
                children={field => (
                  <Field>
                    <FieldLabel htmlFor="banner-title">
                      Title{' '}
                      <span className="text-muted-foreground">(optional)</span>
                    </FieldLabel>
                    <Input
                      id="banner-title"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={event => field.handleChange(event.target.value)}
                      placeholder="Scheduled maintenance"
                    />
                  </Field>
                )}
              />

              <form.Field
                name="message"
                children={field => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor="banner-message">Message</FieldLabel>
                      <Textarea
                        id="banner-message"
                        rows={4}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={event =>
                          field.handleChange(event.target.value)
                        }
                        aria-invalid={isInvalid}
                        placeholder="Describe what is happening and what people should do instead."
                      />
                      <FieldDescription>
                        Plain text. Quotes and apostrophes are fine — no
                        escaping needed.
                      </FieldDescription>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <form.Field
                  name="actionLabel"
                  children={field => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor="banner-action-label">
                          Button label{' '}
                          <span className="text-muted-foreground">
                            (optional)
                          </span>
                        </FieldLabel>
                        <Input
                          id="banner-action-label"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={event =>
                            field.handleChange(event.target.value)
                          }
                          aria-invalid={isInvalid}
                          placeholder="Status page"
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    );
                  }}
                />

                <form.Field
                  name="actionHref"
                  children={field => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor="banner-action-href">
                          Button link
                        </FieldLabel>
                        <Input
                          id="banner-action-href"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={event =>
                            field.handleChange(event.target.value)
                          }
                          aria-invalid={isInvalid}
                          placeholder="https://status.elevensys.dev"
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    );
                  }}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <form.Field
                  name="startsAt"
                  children={field => (
                    <Field>
                      <FieldLabel htmlFor="banner-starts-at">
                        Starts{' '}
                        <span className="text-muted-foreground">
                          (optional)
                        </span>
                      </FieldLabel>
                      <Input
                        id="banner-starts-at"
                        type="datetime-local"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={event =>
                          field.handleChange(event.target.value)
                        }
                      />
                      <FieldDescription>
                        Hidden until then. Your local time.
                      </FieldDescription>
                    </Field>
                  )}
                />

                <form.Field
                  name="endsAt"
                  children={field => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor="banner-ends-at">
                          Ends{' '}
                          <span className="text-muted-foreground">
                            (optional)
                          </span>
                        </FieldLabel>
                        <Input
                          id="banner-ends-at"
                          type="datetime-local"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={event =>
                            field.handleChange(event.target.value)
                          }
                          aria-invalid={isInvalid}
                        />
                        <FieldDescription>
                          Hides itself afterwards.
                        </FieldDescription>
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    );
                  }}
                />
              </div>

              <form.Field
                name="enabled"
                children={field => (
                  <div className="flex items-start gap-3 rounded-lg border p-4">
                    <Checkbox
                      id="banner-enabled"
                      checked={field.state.value}
                      onCheckedChange={checked =>
                        field.handleChange(checked === true)
                      }
                    />
                    <div className="grid gap-1">
                      <FieldLabel htmlFor="banner-enabled">
                        Show this banner
                      </FieldLabel>
                      <p className="text-muted-foreground text-sm">
                        Unchecked, saving hides the banner for{' '}
                        {TARGET_LABELS[values.target]}.
                      </p>
                    </div>
                  </div>
                )}
              />

              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Spinner />}
                  Save banner
                </Button>

                {liveValue && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isSubmitting}
                      >
                        Clear banner
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Clear the {TARGET_LABELS[values.target]} banner?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          It disappears for everyone within a few seconds. You
                          can post a new one at any time.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => void save(values.target, '')}
                        >
                          Clear it
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <BannerHistory entries={current.history} />
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              {values.enabled
                ? 'Exactly what people will see.'
                : 'Draft — saving now would hide the banner.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {previewValue ? (
              <SiteBanner value={previewValue} flush={false} />
            ) : (
              <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
                Write a message to see it here.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
