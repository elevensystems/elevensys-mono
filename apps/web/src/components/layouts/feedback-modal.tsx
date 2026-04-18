'use client';

import { useForm } from '@tanstack/react-form';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { ActionButton } from '@/components/action-button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import { Field, FieldError, FieldLabel } from '@workspace/ui/components/field';
import { Input } from '@workspace/ui/components/input';
import { Textarea } from '@workspace/ui/components/textarea';

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const feedbackSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email'),
  message: z.string().min(1, 'Message is required'),
});

export function FeedbackModal({ open, onOpenChange }: FeedbackModalProps) {
  const form = useForm({
    defaultValues: { name: '', email: '', message: '' },
    validators: { onSubmit: feedbackSchema },
    onSubmit: async ({ value }) => {
      try {
        const response = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: value.name.trim(),
            email: value.email.trim(),
            message: value.message.trim(),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to submit feedback');
        }

        const result = await response.json();

        if (result.success) {
          toast.success('Feedback submitted successfully', {
            description: 'Thank you for your feedback!',
            icon: <Check className="h-4 w-4" />,
            duration: 5000,
          });

          form.reset();
          onOpenChange(false);
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (err) {
        console.error('Error submitting feedback:', err);
        toast.error('Failed to submit feedback. Please try again.', {
          duration: 5000,
        });
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>
            We&apos;d love to hear your thoughts, suggestions, or issues
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={e => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-4 py-4"
        >
          <form.Field
            name="name"
            children={field => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                  <Input
                    id={field.name}
                    placeholder="Your name"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={e => field.handleChange(e.target.value)}
                    disabled={form.state.isSubmitting}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />

          <form.Field
            name="email"
            children={field => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                  <Input
                    id={field.name}
                    type="email"
                    placeholder="your.email@example.com"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={e => field.handleChange(e.target.value)}
                    disabled={form.state.isSubmitting}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />

          <form.Field
            name="message"
            children={field => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Message</FieldLabel>
                  <Textarea
                    id={field.name}
                    placeholder="Tell us what you think..."
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={e => field.handleChange(e.target.value)}
                    disabled={form.state.isSubmitting}
                    aria-invalid={isInvalid}
                    className="min-h-[120px]"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />

          <div className="flex justify-end gap-3">
            <ActionButton
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={form.state.isSubmitting}
            >
              Cancel
            </ActionButton>
            <ActionButton
              type="submit"
              isLoading={form.state.isSubmitting}
              loadingText="Submitting..."
            >
              Submit Feedback
            </ActionButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
