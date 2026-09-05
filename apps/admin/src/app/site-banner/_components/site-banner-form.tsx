'use client';

import { useState, useSyncExternalStore } from 'react';

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
import { Field, FieldLabel } from '@workspace/ui/components/field';
import { FieldMessage } from '@workspace/ui/components/field-message';
import { Input } from '@workspace/ui/components/input';
import {
  Panel,
  PanelActions,
  PanelBody,
  PanelHeader,
  PanelTitle,
} from '@workspace/ui/components/panel';
import { SiteBanner } from '@workspace/ui/components/site-banner';
import { Spinner } from '@workspace/ui/components/spinner';
import { Switch } from '@workspace/ui/components/switch';
import { Textarea } from '@workspace/ui/components/textarea';
import type { SiteAnnouncement } from '@workspace/ui/lib/site-announcement';
import { cn } from '@workspace/ui/lib/utils';
import { ArrowRight, Megaphone } from 'lucide-react';
import { toast } from 'sonner';

import { BannerPickerPanel } from '@/app/site-banner/_components/banner-picker-panel';
import { BannerTargetPanel } from '@/app/site-banner/_components/banner-target-panel';
import { ChangeLog } from '@/components/features/change-log';
import { PageHeader } from '@/components/layouts/page-header';
import type {
  SiteBannerFormValues,
  SiteBannerPreset,
} from '@/lib/site-banner-schema';
import {
  SITE_BANNER_PRESETS,
  SITE_BANNER_STATES,
  STATE_LABELS,
  STATE_SWATCHES,
  TARGET_LABELS,
  describeSchedule,
  newAnnouncementId,
  siteBannerFormSchema,
  toAnnouncement,
  toFormValues,
} from '@/lib/site-banner-schema';
import type { SiteBannerSnapshot, SiteBannerTarget } from '@/types/site-banner';

interface SiteBannerFormProps {
  snapshot: SiteBannerSnapshot;
}

/** Lets the header's Publish button submit the composer it sits above. */
const FORM_ID = 'site-banner-composer';

/** First validation message on a field, whatever shape the validator returned. */
function firstErrorMessage(errors: unknown[]): string | undefined {
  const first = errors.find(Boolean);
  if (first === undefined || first === null) return undefined;
  if (typeof first === 'string') return first;
  if (typeof first === 'object' && 'message' in first) {
    return String((first as { message: unknown }).message);
  }
  return String(first);
}

/** Cached so `getClock` returns a stable value between ticks. */
let clock = Date.now();

/**
 * Re-reads the clock every half minute, so a banner reaching its start time
 * flips to "live" without a reload.
 */
function subscribeToClock(onChange: () => void) {
  clock = Date.now();
  const timer = setInterval(() => {
    clock = Date.now();
    onChange();
  }, 30_000);
  return () => clearInterval(timer);
}

const getClock = () => clock;
const getServerClock = () => null;

/**
 * The browser's clock, or `null` on the server and during hydration.
 *
 * Liveness is the one thing on this page that cannot be decided while
 * rendering on the server — "now" is a different instant there — so nothing
 * claims a banner is live or scheduled until the editor is running in the
 * browser.
 */
function useNow(): number | null {
  return useSyncExternalStore(subscribeToClock, getClock, getServerClock);
}

export function SiteBannerForm({ snapshot }: SiteBannerFormProps) {
  const router = useRouter();
  const [current, setCurrent] = useState(snapshot);
  const now = useNow();

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
    form.setFieldValue('dismissible', next.dismissible, opts);
    form.setFieldValue('scheduled', next.scheduled, opts);
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

  function applyPreset(preset: SiteBannerPreset) {
    applyValues({ ...values, ...preset.values, enabled: true });
  }

  const previewNote = values.enabled
    ? describeSchedule(
        {
          startsAt: preview?.startsAt,
          endsAt: preview?.endsAt,
        },
        now
      ).label
    : 'Switched off — saving now removes it.';

  return (
    <>
      <PageHeader
        title="Site Banner"
        actions={
          <Button type="submit" form={FORM_ID} disabled={isSubmitting}>
            {isSubmitting ? <Spinner /> : <Megaphone />}
            Publish
          </Button>
        }
      />

      {/*
        Two columns: what is posted stays on the left while the composer works
        on one banner at the right. Nothing here collapses, so switching target
        or banner never moves the fields under the cursor.
      */}
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(15rem,19rem)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <BannerTargetPanel
            target={values.target}
            values={current.values}
            now={now}
            onSelect={switchTarget}
          />

          <BannerPickerPanel
            target={values.target}
            saved={saved}
            currentId={values.id}
            now={now}
            onEdit={editAnnouncement}
            onAdd={addAnnouncement}
          />
        </div>

        <Panel>
          <PanelHeader>
            <PanelTitle>Compose</PanelTitle>
            <PanelActions>
              <span className="text-muted-foreground text-[13px]">
                Start from:
              </span>
              {SITE_BANNER_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="text-[13px] underline underline-offset-[3px] hover:no-underline"
                >
                  {preset.label}
                </button>
              ))}
            </PanelActions>
          </PanelHeader>

          <PanelBody>
            <div className="flex flex-col gap-2.5 rounded-t-xl border-b p-4">
              {preview ? (
                <SiteBanner announcements={[preview]} flush={false} preview />
              ) : (
                <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm italic">
                  Write a message to see it here.
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-muted-foreground text-xs">
                  {preview
                    ? `Live preview. ${previewNote}`
                    : 'Nothing to preview yet.'}
                </span>

                <form.Field
                  name="state"
                  children={field => (
                    <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                      <span id="banner-style-label">Style</span>
                      <div
                        role="radiogroup"
                        aria-labelledby="banner-style-label"
                        className="border-input bg-background flex gap-1 rounded-[9px] border p-[3px]"
                      >
                        {SITE_BANNER_STATES.map(state => (
                          <label key={state} className="cursor-pointer">
                            <input
                              type="radio"
                              name="banner-state"
                              aria-label={STATE_LABELS[state]}
                              value={state}
                              checked={field.state.value === state}
                              onChange={() => field.handleChange(state)}
                              className="peer sr-only"
                            />
                            <span
                              aria-hidden
                              className={cn(
                                'peer-checked:ring-primary peer-focus-visible:ring-ring block h-5 w-[26px] rounded-[6px] peer-checked:ring-2 peer-focus-visible:ring-2',
                                STATE_SWATCHES[state]
                              )}
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                />
              </div>
            </div>

            <form
              id={FORM_ID}
              onSubmit={event => {
                event.preventDefault();
                event.stopPropagation();
                void form.handleSubmit();
              }}
            >
              <div className="grid gap-4 p-4 sm:grid-cols-2">
                <form.Field
                  name="title"
                  children={field => (
                    <Field>
                      <FieldLabel htmlFor="banner-title">
                        Title{' '}
                        <span className="text-muted-foreground">
                          (optional)
                        </span>
                      </FieldLabel>
                      <Input
                        id="banner-title"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={event =>
                          field.handleChange(event.target.value)
                        }
                        placeholder="Scheduled maintenance"
                      />
                    </Field>
                  )}
                />

                <form.Field
                  name="message"
                  children={field => {
                    const error =
                      field.state.meta.isTouched && !field.state.meta.isValid
                        ? firstErrorMessage(field.state.meta.errors)
                        : undefined;
                    return (
                      <Field data-invalid={Boolean(error)}>
                        <FieldLabel htmlFor="banner-message">
                          Message
                        </FieldLabel>
                        <FieldMessage
                          message={error}
                          className="rounded-md"
                          controlClassName="rounded-md"
                        >
                          <Textarea
                            id="banner-message"
                            rows={2}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={event =>
                              field.handleChange(event.target.value)
                            }
                            aria-invalid={Boolean(error)}
                            placeholder="Describe what is happening and what people should do instead."
                            className="rounded-md border-0 bg-transparent shadow-none dark:bg-transparent"
                          />
                        </FieldMessage>
                      </Field>
                    );
                  }}
                />

                <form.Field
                  name="actionLabel"
                  children={field => {
                    const error =
                      field.state.meta.isTouched && !field.state.meta.isValid
                        ? firstErrorMessage(field.state.meta.errors)
                        : undefined;
                    return (
                      <Field data-invalid={Boolean(error)}>
                        <FieldLabel htmlFor="banner-action-label">
                          Button label{' '}
                          <span className="text-muted-foreground">
                            (optional)
                          </span>
                        </FieldLabel>
                        <FieldMessage
                          message={error}
                          className="rounded-md"
                          controlClassName="rounded-md"
                        >
                          <Input
                            id="banner-action-label"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={event =>
                              field.handleChange(event.target.value)
                            }
                            aria-invalid={Boolean(error)}
                            placeholder="Status page"
                            className="rounded-md border-0 bg-transparent shadow-none dark:bg-transparent"
                          />
                        </FieldMessage>
                      </Field>
                    );
                  }}
                />

                <form.Field
                  name="actionHref"
                  children={field => {
                    const error =
                      field.state.meta.isTouched && !field.state.meta.isValid
                        ? firstErrorMessage(field.state.meta.errors)
                        : undefined;
                    return (
                      <Field data-invalid={Boolean(error)}>
                        <FieldLabel htmlFor="banner-action-href">
                          Button link
                        </FieldLabel>
                        <FieldMessage
                          message={error}
                          className="rounded-md"
                          controlClassName="rounded-md"
                        >
                          <Input
                            id="banner-action-href"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={event =>
                              field.handleChange(event.target.value)
                            }
                            aria-invalid={Boolean(error)}
                            placeholder="https://status.elevensys.dev"
                            className="rounded-md border-0 bg-transparent shadow-none dark:bg-transparent"
                          />
                        </FieldMessage>
                      </Field>
                    );
                  }}
                />
              </div>

              <div className="flex flex-col gap-3 px-4 pb-4">
                <form.Field
                  name="scheduled"
                  children={field => (
                    <div className="flex flex-wrap items-center gap-3 rounded-xl border p-3">
                      <span
                        id="banner-timing-label"
                        className="text-[13px] font-medium"
                      >
                        Timing
                      </span>
                      <div
                        role="radiogroup"
                        aria-labelledby="banner-timing-label"
                        className="border-input bg-surface flex shrink-0 rounded-[9px] border p-0.5 text-[13px]"
                      >
                        {[
                          { value: false, label: 'Live now' },
                          { value: true, label: 'Scheduled window' },
                        ].map(option => (
                          <label
                            key={option.label}
                            className="cursor-pointer whitespace-nowrap"
                          >
                            <input
                              type="radio"
                              name="banner-timing"
                              checked={field.state.value === option.value}
                              onChange={() => field.handleChange(option.value)}
                              className="peer sr-only"
                            />
                            <span className="text-muted-foreground peer-checked:bg-background peer-checked:border-border peer-checked:text-foreground peer-focus-visible:ring-ring/50 block rounded-[7px] border border-transparent px-2.5 py-1 peer-checked:font-medium peer-focus-visible:ring-[3px]">
                              {option.label}
                            </span>
                          </label>
                        ))}
                      </div>

                      {field.state.value ? (
                        <>
                          <form.Field
                            name="startsAt"
                            children={startsAt => (
                              <Input
                                type="datetime-local"
                                aria-label="Starts"
                                value={startsAt.state.value}
                                onBlur={startsAt.handleBlur}
                                onChange={event =>
                                  startsAt.handleChange(event.target.value)
                                }
                                className="h-8 w-auto rounded-[9px] px-2.5 text-[13px] shadow-none"
                              />
                            )}
                          />
                          <ArrowRight className="text-muted-foreground size-3.5" />
                          <form.Field
                            name="endsAt"
                            children={endsAt => {
                              const error =
                                endsAt.state.meta.isTouched &&
                                !endsAt.state.meta.isValid
                                  ? firstErrorMessage(endsAt.state.meta.errors)
                                  : undefined;
                              return (
                                <>
                                  <Input
                                    type="datetime-local"
                                    aria-label="Ends"
                                    value={endsAt.state.value}
                                    onBlur={endsAt.handleBlur}
                                    onChange={event =>
                                      endsAt.handleChange(event.target.value)
                                    }
                                    aria-invalid={Boolean(error)}
                                    className="h-8 w-auto rounded-[9px] px-2.5 text-[13px] shadow-none"
                                  />
                                  <span className="text-muted-foreground text-xs">
                                    Your local time · hides itself afterwards
                                  </span>
                                  {error && (
                                    <FieldMessage
                                      variant="detached"
                                      message={error}
                                      className="w-full"
                                    />
                                  )}
                                </>
                              );
                            }}
                          />
                        </>
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          Goes live as soon as you save.
                        </span>
                      )}
                    </div>
                  )}
                />

                <form.Field
                  name="dismissible"
                  children={field => (
                    <div className="flex flex-wrap items-center gap-3 rounded-xl border p-3">
                      <FieldLabel
                        htmlFor="banner-dismissible"
                        className="text-[13px] font-medium"
                      >
                        Dismissible
                      </FieldLabel>
                      <Switch
                        id="banner-dismissible"
                        checked={field.state.value}
                        onCheckedChange={checked =>
                          field.handleChange(checked === true)
                        }
                      />
                      <span className="text-muted-foreground text-xs">
                        {field.state.value
                          ? 'Readers can close it. It stays closed in their browser until you edit the banner.'
                          : 'Stays on screen until you take it down — right for outages.'}
                      </span>
                    </div>
                  )}
                />

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <form.Field
                    name="enabled"
                    children={field => (
                      <div className="flex flex-wrap items-center gap-2.5">
                        <Switch
                          id="banner-enabled"
                          checked={field.state.value}
                          onCheckedChange={checked =>
                            field.handleChange(checked === true)
                          }
                        />
                        <FieldLabel
                          htmlFor="banner-enabled"
                          className="text-sm"
                        >
                          Showing on {TARGET_LABELS[values.target]}
                        </FieldLabel>
                        <span className="text-muted-foreground text-sm">
                          Switch off and save to remove it
                        </span>
                      </div>
                    )}
                  />

                  {isSaved && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="text-destructive"
                          disabled={isSubmitting}
                        >
                          Delete
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
              </div>
            </form>
          </PanelBody>
        </Panel>
      </div>

      <div className="mt-4">
        <ChangeLog entries={current.history} targetLabels={TARGET_LABELS} />
      </div>
    </>
  );
}
