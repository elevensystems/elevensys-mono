'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { Button } from '@workspace/ui/components/button';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { FieldLabel } from '@workspace/ui/components/field';
import {
  Panel,
  PanelActions,
  PanelBody,
  PanelHeader,
  PanelTitle,
} from '@workspace/ui/components/panel';
import { Spinner } from '@workspace/ui/components/spinner';
import { TOOLS } from '@workspace/ui/lib/tools';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

import { ChangeLog } from '@/components/features/change-log';
import { PageHeader } from '@/components/layouts/page-header';
import type { ToolsVisibilitySnapshot } from '@/types/tools-visibility';

interface ToolsVisibilityFormProps {
  snapshot: ToolsVisibilitySnapshot;
}

/** Lets the header's Save button submit the form it sits above. */
const FORM_ID = 'tools-visibility-form';

export function ToolsVisibilityForm({ snapshot }: ToolsVisibilityFormProps) {
  const router = useRouter();
  const [current, setCurrent] = useState(snapshot);
  const [showAll, setShowAll] = useState(snapshot.visible === null);
  const [checked, setChecked] = useState<string[]>(
    snapshot.visible ?? TOOLS.map(tool => tool.url)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDirty =
    showAll !== (current.visible === null) ||
    (!showAll &&
      (current.visible === null ||
        checked.length !== current.visible.length ||
        checked.some(url => !current.visible?.includes(url))));

  function toggle(url: string, next: boolean) {
    setChecked(previous =>
      next ? [...previous, url] : previous.filter(item => item !== url)
    );
  }

  async function save() {
    setIsSubmitting(true);
    try {
      const visible = showAll ? null : checked;
      const response = await fetch('/api/tools-visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visible }),
      });

      // An expired session is redirected to the HTML login page, so the body is
      // not always JSON — read it defensively rather than throwing here.
      let data: (ToolsVisibilitySnapshot & { error?: string }) | null = null;
      try {
        data = (await response.json()) as ToolsVisibilitySnapshot & {
          error?: string;
        };
      } catch {
        toast.error('Your session has expired. Reload the page and sign in.');
        return;
      }

      if (!response.ok || !data || data.visible === undefined) {
        toast.error(data?.error ?? 'Could not save the tool list.');
        return;
      }

      setCurrent(data);
      setShowAll(data.visible === null);
      setChecked(data.visible ?? TOOLS.map(tool => tool.url));
      toast.success('Saved. It may take a few seconds to take effect.');
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Tools Visibility"
        actions={
          <Button
            type="submit"
            form={FORM_ID}
            disabled={isSubmitting || !isDirty}
          >
            {isSubmitting ? <Spinner /> : <Save />}
            Save
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <form
          id={FORM_ID}
          onSubmit={event => {
            event.preventDefault();
            void save();
          }}
        >
          <Panel>
            <PanelHeader>
              <PanelTitle>Tools</PanelTitle>
              <PanelActions>
                <span className="text-muted-foreground text-[13px]">
                  {showAll
                    ? `All ${TOOLS.length} visible`
                    : `${checked.length} of ${TOOLS.length} visible`}
                </span>
              </PanelActions>
            </PanelHeader>

            <PanelBody className="space-y-5 p-4">
              <p className="text-muted-foreground text-sm">
                Unchecked tools disappear from the sidebar and their pages
                return 404.
              </p>

              <div className="flex items-start gap-3 rounded-lg border p-4">
                <Checkbox
                  id="show-all"
                  checked={showAll}
                  onCheckedChange={value => setShowAll(value === true)}
                />
                <div className="grid gap-1">
                  <FieldLabel htmlFor="show-all">
                    Show every tool, including ones added later
                  </FieldLabel>
                  <p className="text-muted-foreground text-sm">
                    Leave this on unless you need to hide something. Turning it
                    off pins the list below, so a newly shipped tool stays
                    hidden until you check it here.
                  </p>
                </div>
              </div>

              <div
                className="grid gap-3 sm:grid-cols-2"
                aria-disabled={showAll}
                data-disabled={showAll || undefined}
              >
                {TOOLS.map(tool => (
                  <div key={tool.url} className="flex items-center gap-3">
                    <Checkbox
                      id={`tool-${tool.url}`}
                      checked={showAll || checked.includes(tool.url)}
                      disabled={showAll || isSubmitting}
                      onCheckedChange={value =>
                        toggle(tool.url, value === true)
                      }
                    />
                    <FieldLabel htmlFor={`tool-${tool.url}`}>
                      {tool.name}
                    </FieldLabel>
                  </div>
                ))}
              </div>
            </PanelBody>
          </Panel>
        </form>

        <ChangeLog entries={current.history} />
      </div>
    </>
  );
}
