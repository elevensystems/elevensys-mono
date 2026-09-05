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
import type { SiteAnnouncement } from '@workspace/ui/lib/site-announcement';
import { cn } from '@workspace/ui/lib/utils';
import { toast } from 'sonner';

import { ChangeLog } from '@/components/features/change-log';
import type { SiteBannerFormValues } from '@/lib/site-banner-schema';
import {
  SITE_BANNER_PRESETS,
  SITE_BANNER_STATES,
  SITE_BANNER_TARGETS,
  STATE_LABELS,
  TARGET_LABELS,
  newAnnouncementId,
  siteBannerFormSchema,
  toAnnouncement,
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
    defaultValues: toFormValues('all', snapshot.values.all?.[0]),
    validators: { onSubmit: siteBannerFormSchema },
    onSubmit: async ({ value }) => {
      // A draft carries no id until now; saving is what assigns one.
      await save(
        value.target,
        value.id || newAnnouncementId(),
        toAnnouncement(value)
      );
    },
  });

  const values = useStore(form.store, state => state.values);
  const isSubmitting = useStore(form.store, state => state.isSubmitting);

  // Preview the composed announcement even while it is switched off, so an
  // admin can draft one before making it live.
  const preview = toAnnouncement({ ...values, enabled: true });
  const saved = current.values[values.target] ?? [];
  // Whether the announcement being edited already exists, as opposed to a
  // draft that has never been saved. Only a saved one can be deleted.
  const isSaved = saved.some(entry => entry.id === values.id);

  async function save(
    target: SiteBannerTarget,
    id: string,
    announcement: SiteAnnouncement | null
  ) {
    const response = await fetch('/api/site-banner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target, id, announcement }),
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
    applyValues(
      toFormValues(
        target,
        announcement
          ? data.values[target]?.find(entry => entry.id === id)
          : undefined
      )
    );
    toast.success(
      announcement
        ? 'Banner saved. It may take a few seconds to appear on every app.'
        : 'Banner deleted.'
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
    form.setFieldValue('id', next.id, opts);
    form.setFieldValue('enabled', next.enabled, opts);
    form.setFieldValue('state', next.state, opts);
    form.setFieldValue('title', next.title, opts);
    form.setFieldValue('message', next.message, opts);
    form.setFieldValue('actionLabel', next.actionLabel, opts);
    form.setFieldValue('actionHref', next.actionHref, opts);
    form.setFieldValue('startsAt', next.startsAt, opts);
    form.setFieldValue('endsAt', next.endsAt, opts);
  }

  /** Switching target opens that target's first banner, or a blank draft. */
  function switchTarget(target: SiteBannerTarget) {
    applyValues(toFormValues(target, current.values[target]?.[0]));
  }

  function editAnnouncement(announcement: SiteAnnouncement) {
    applyValues(toFormValues(values.target, announcement));
  }

  /** Starts a blank draft, which saving appends to the target's list. */
  function addAnnouncement() {
    applyValues(toFormValues(values.target, undefined));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Announcement</CardTitle>
            <CardDescription>
              Shown at the top of every page. An app sees the banners set for
              all apps plus its own, stacked most urgent first.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">
                  {TARGET_LABELS[values.target]} banners ({saved.length})
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAnnouncement}
                  disabled={isSubmitting}
                >
                  Add banner
                </Button>
              </div>

              {saved.length === 0 ? (
                <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-center text-sm">
                  Nothing posted for this target yet.
                </p>
              ) : (
                <ul className="divide-y rounded-lg border">
                  {saved.map(entry => (
                    <li key={entry.id}>
                      <button
                        type="button"
                        aria-current={entry.id === values.id}
                        onClick={() => editAnnouncement(entry)}
                        className={cn(
                          'hover:bg-muted/50 flex w-full items-center gap-3 px-3 py-2 text-left text-sm',
                          entry.id === values.id && 'bg-muted'
                        )}
                      >
                        <span className="text-muted-foreground w-16 shrink-0 text-xs uppercase">
                          {STATE_LABELS[entry.state]}
                        </span>
                        <span className="truncate">
                          {entry.title || entry.message}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

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
                        {SITE_BANNER_TARGETS.map(target => {
                          const count = current.values[target]?.length ?? 0;
                          return (
                            <option key={target} value={target}>
                              {TARGET_LABELS[target]}
                              {count > 0 ? ` — ${count} live` : ''}
                            </option>
                          );
                        })}
                      </NativeSelect>
                      <FieldDescription>
                        Switching opens that target&rsquo;s first banner.
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
                        Unchecked, saving removes this banner from{' '}
                        {TARGET_LABELS[values.target]}.
                      </p>
                    </div>
                  </div>
                )}
              />

              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Spinner />}
                  {isSaved ? 'Save banner' : 'Post banner'}
                </Button>

                {isSaved && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isSubmitting}
                      >
                        Delete banner
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Delete this {TARGET_LABELS[values.target]} banner?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          It disappears for everyone within a few seconds. Any
                          other banners on this target stay up.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() =>
                            void save(values.target, values.id, null)
                          }
                        >
                          Delete it
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <ChangeLog entries={current.history} targetLabels={TARGET_LABELS} />
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
            {preview ? (
              <SiteBanner announcements={[preview]} flush={false} />
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
