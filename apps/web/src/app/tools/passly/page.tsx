'use client';

import { useCallback, useState } from 'react';

import { useForm, useStore } from '@tanstack/react-form';
import { Check, Copy, Key, Settings as SettingsIcon } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { ActionButton } from '@workspace/ui/components/action-button';
import MainLayout from '@/components/layouts/main-layout';
import { ToolPageHeader } from '@/components/layouts/tool-page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Slider } from '@workspace/ui/components/slider';
import { useActionFeedback } from '@/hooks/use-action-feedback';
import {
  PASSWORD_DEFAULT_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from '@/lib/constants';
import type { CharacterOptions, PasswordEntry } from '@/types/passly';

/**
 * Calculate password strength based on length and character variety
 */
const calculatePasswordStrength = (
  password: string,
  options: CharacterOptions
): { label: string; color: string } => {
  if (!password) return { label: '', color: '' };

  let score = 0;
  const length = password.length;

  // Length scoring
  if (length >= 8) score += 1;
  if (length >= 12) score += 1;
  if (length >= 16) score += 1;

  // Character variety scoring
  const varietyCount = Object.values(options).filter(Boolean).length;
  score += varietyCount;

  // Determine strength
  if (score <= 2) return { label: 'Weak', color: 'text-red-500' };
  if (score <= 4) return { label: 'Medium', color: 'text-yellow-500' };
  return { label: 'Strong', color: 'text-green-500' };
};

const passlySchema = z.object({
  length: z.number().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
  options: z
    .object({
      uppercase: z.boolean(),
      lowercase: z.boolean(),
      numbers: z.boolean(),
      symbols: z.boolean(),
    })
    .refine(opts => Object.values(opts).some(Boolean), {
      message: 'At least one character type must be selected',
    }),
});

export default function PasslyPage() {
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const { isActive, trigger } = useActionFeedback();
  const [error, setError] = useState('');

  const form = useForm({
    defaultValues: {
      length: PASSWORD_DEFAULT_LENGTH,
      options: {
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: true,
      } as CharacterOptions,
    },
    validators: { onSubmit: passlySchema },
    onSubmit: async ({ value }) => {
      setError('');
      try {
        const response = await fetch('/api/passly', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            length: value.length,
            options: value.options,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate passwords');
        }

        const result = await response.json();

        if (result.success && result.passwords) {
          setPasswords(
            result.passwords.map((pw: string) => ({
              id:
                typeof crypto !== 'undefined' && 'randomUUID' in crypto
                  ? crypto.randomUUID()
                  : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
              value: pw,
            }))
          );
          toast.success('Passwords generated successfully', {
            description: `Passwords (${result.passwords.length}) have been generated.`,
            icon: <Check className="h-4 w-4" />,
          });
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (err) {
        console.error('Error generating passwords:', err);
        const errorMessage = 'Failed to generate passwords. Please try again.';
        setError(errorMessage);
        toast.error(errorMessage, { duration: 5000 });
      }
    },
  });

  const options = useStore(form.store, s => s.values.options);
  const hasAtLeastOneOption = Object.values(options).some(Boolean);

  const handleCopy = useCallback(
    async (password: string, id: string) => {
      try {
        await navigator.clipboard.writeText(password);
        trigger(id);
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
        trigger(id, { error: true });
      }
    },
    [trigger]
  );

  return (
    <MainLayout>
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-full mx-auto">
          <ToolPageHeader
            title="Passly"
            description="Generate secure, random passwords with customizable options. Free tool for creating strong passwords."
            infoMessage="Password generation is processed securely on the server. Passwords are not stored and are generated fresh each time."
            error={error}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" />
                  Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Password Length */}
                <form.Field
                  name="length"
                  children={field => (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="length-input">
                          Password Length: {field.state.value}
                        </Label>
                        <Input
                          id="length-input"
                          type="number"
                          min={PASSWORD_MIN_LENGTH}
                          max={PASSWORD_MAX_LENGTH}
                          value={field.state.value}
                          onChange={e =>
                            field.handleChange(
                              Math.min(
                                PASSWORD_MAX_LENGTH,
                                Math.max(
                                  PASSWORD_MIN_LENGTH,
                                  Number(e.target.value)
                                )
                              )
                            )
                          }
                          className="w-20 h-9"
                        />
                      </div>
                      <Slider
                        id="length"
                        min={PASSWORD_MIN_LENGTH}
                        max={PASSWORD_MAX_LENGTH}
                        step={1}
                        value={[field.state.value]}
                        onValueChange={values => field.handleChange(values[0])}
                        className="w-full"
                      />
                    </div>
                  )}
                />

                {/* Character Types */}
                <div className="space-y-3">
                  <Label>Character Types</Label>
                  <div className="space-y-2">
                    {(
                      [
                        ['uppercase', 'Uppercase Letters (A-Z)'],
                        ['lowercase', 'Lowercase Letters (a-z)'],
                        ['numbers', 'Numbers (0-9)'],
                        ['symbols', 'Special Symbols (!@#$%^&*)'],
                      ] as const
                    ).map(([key, label]) => (
                      <form.Field
                        key={key}
                        name={`options.${key}` as `options.${typeof key}`}
                        children={field => (
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={field.state.value}
                              onCheckedChange={checked =>
                                field.handleChange(checked === true)
                              }
                            />
                            <span className="text-sm">{label}</span>
                          </label>
                        )}
                      />
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                <ActionButton
                  onClick={() => form.handleSubmit()}
                  disabled={!hasAtLeastOneOption || form.state.isSubmitting}
                  className="w-full"
                  size="lg"
                  leftIcon={<Key />}
                  isLoading={form.state.isSubmitting}
                  loadingText="Generating..."
                >
                  Generate Passwords
                </ActionButton>
              </CardContent>
            </Card>

            {/* Result Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Result
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {passwords.length === 0 ? (
                  <div className="flex items-center justify-center h-40 text-muted-foreground">
                    <p>
                      Click &quot;Generate Passwords&quot; to create 5 passwords
                    </p>
                  </div>
                ) : (
                  passwords.map((password, index) => {
                    const strength = calculatePasswordStrength(
                      password.value,
                      options
                    );
                    return (
                      <div key={password.id} className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          Password {index + 1}
                        </Label>
                        {index === 0 && (
                          <div className="flex items-center justify-between mb-1">
                            <Label className="text-sm font-medium">
                              Password Strength
                            </Label>
                            <span
                              className={`text-sm font-semibold ${strength.color}`}
                            >
                              {strength.label}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                          <code className="flex-1 text-sm font-mono break-all select-all">
                            {password.value}
                          </code>
                          <ActionButton
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              handleCopy(password.value, password.id)
                            }
                            aria-label="Copy to clipboard"
                            leftIcon={<Copy aria-hidden="true" />}
                            feedbackActive={isActive(password.id)}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
