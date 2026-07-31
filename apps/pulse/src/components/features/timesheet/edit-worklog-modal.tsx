'use client';

import { useEffect } from 'react';

import { useForm } from '@tanstack/react-form';
import { ActionButton } from '@workspace/ui/components/action-button';
import { DatePicker } from '@workspace/ui/components/date-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import { Field, FieldError, FieldLabel } from '@workspace/ui/components/field';
import { Input } from '@workspace/ui/components/input';
import { NativeSelect } from '@workspace/ui/components/native-select';
import { Textarea } from '@workspace/ui/components/textarea';
import { z } from 'zod';

import {
  MAX_HOURS,
  MIN_HOURS,
  formatDateForApi,
  jiraDateToISO,
} from '@/lib/timesheet';
import { WORK_TYPES } from '@/types/timesheet';
import type { MyWorklogsRow, UpdateWorklogRequest } from '@/types/timesheet';

const editWorklogSchema = z.object({
  startDateEdit: z.string().min(1, 'Date is required'),
  worked: z
    .string()
    .min(1, 'Hours is required')
    .refine(val => !Number.isNaN(Number(val)) && Number(val) >= MIN_HOURS, {
      message: `Minimum is ${MIN_HOURS} hours`,
    })
    .refine(val => !Number.isNaN(Number(val)) && Number(val) <= MAX_HOURS, {
      message: `Maximum is ${MAX_HOURS} hours`,
    }),
  typeOfWork: z.string().min(1, 'Type of work is required'),
  description: z.string().min(1, 'Description is required'),
});

interface EditWorklogModalProps {
  worklog: MyWorklogsRow | null;
  isEditing: boolean;
  onClose: () => void;
  onSave: (
    worklog: MyWorklogsRow,
    changes: Omit<UpdateWorklogRequest, 'id' | 'jiraInstance'>
  ) => void;
}

function getDefaultValues(worklog: MyWorklogsRow) {
  return {
    description: worklog.description ?? '',
    worked: String(parseFloat(String(worklog.worked))),
    typeOfWork: worklog.typeOfWork ?? '',
    startDateEdit: worklog.startDateEdit
      ? jiraDateToISO(worklog.startDateEdit)
      : worklog.startDate
        ? jiraDateToISO(worklog.startDate)
        : '',
  };
}

export function EditWorklogModal({
  worklog,
  isEditing,
  onClose,
  onSave,
}: EditWorklogModalProps) {
  const form = useForm({
    defaultValues: {
      startDateEdit: '',
      worked: '',
      typeOfWork: '',
      description: '',
    },
    validators: { onSubmit: editWorklogSchema },
    onSubmit: ({ value }) => {
      if (!worklog) return;

      const defaults = getDefaultValues(worklog);
      const changes: Omit<UpdateWorklogRequest, 'id' | 'jiraInstance'> = {};

      if (value.description !== defaults.description) {
        changes.description = value.description;
      }

      if (value.worked !== defaults.worked) {
        changes.worked = value.worked;
      }

      if (value.typeOfWork !== defaults.typeOfWork) {
        changes.typeOfWork = value.typeOfWork;
      }

      const originalDate = worklog.startDateEdit || worklog.startDate || '';
      const newJiraDate = value.startDateEdit
        ? formatDateForApi(value.startDateEdit)
        : '';
      if (newJiraDate !== originalDate) {
        changes.startDateEdit = newJiraDate;
      }

      onSave(worklog, changes);
    },
  });

  useEffect(() => {
    if (worklog) {
      form.reset(getDefaultValues(worklog));
    }
  }, [worklog?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Dialog open={!!worklog} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Worklog</DialogTitle>
          <DialogDescription>
            Editing worklog for{' '}
            <span className="font-semibold">{worklog?.issueKey}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <form.Field
            name="startDateEdit"
            children={field => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor="edit-date">Date</FieldLabel>
                  <DatePicker
                    id="edit-date"
                    value={field.state.value}
                    onChange={val => field.handleChange(val)}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />
          <form.Field
            name="worked"
            children={field => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor="edit-hours">Hours</FieldLabel>
                  <Input
                    id="edit-hours"
                    type="number"
                    min={String(MIN_HOURS)}
                    max={String(MAX_HOURS)}
                    step={String(MIN_HOURS)}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={e => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />
          <form.Field
            name="typeOfWork"
            children={field => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor="edit-type">Type of Work</FieldLabel>
                  <NativeSelect
                    id="edit-type"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={e => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                  >
                    {WORK_TYPES.map(type => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </NativeSelect>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />
          <form.Field
            name="description"
            children={field => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor="edit-description">
                    Description
                  </FieldLabel>
                  <Textarea
                    id="edit-description"
                    rows={3}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={e => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />
        </div>
        <DialogFooter>
          <ActionButton
            variant="outline"
            onClick={onClose}
            disabled={isEditing}
          >
            Cancel
          </ActionButton>
          <ActionButton
            onClick={() => form.handleSubmit()}
            isLoading={isEditing}
            loadingText="Saving…"
          >
            Save Changes
          </ActionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
