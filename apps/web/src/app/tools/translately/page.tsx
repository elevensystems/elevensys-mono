'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@workspace/ui/components/alert';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@workspace/ui/components/dialog';
import { Label } from '@workspace/ui/components/label';
import { NativeSelect } from '@workspace/ui/components/native-select';
import { RainbowButton } from '@workspace/ui/components/rainbow-button';
import { Spinner } from '@workspace/ui/components/spinner';
import { Textarea } from '@workspace/ui/components/textarea';
import {
  ArrowRightLeft,
  Check,
  ChevronDown,
  Copy,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';

import GuestLoginAlert from '@/components/layouts/guest-login-alert';
import MainLayout from '@/components/layouts/main-layout';
import { ToolPageHeader } from '@/components/layouts/tool-page-header';
import { useAuth } from '@/contexts/auth-context';
import { useActionFeedback } from '@/hooks/use-action-feedback';
import {
  AI_MODELS,
  MAX_TRANSLATE_INPUT_LENGTH,
  STORAGE_KEYS,
  TRANSLATION_DIRECTION,
  TRANSLATION_TONES,
  type TranslationDirection,
} from '@/lib/constants';

const PAGE_METADATA = {
  title: 'Translately',
  description:
    'Translate between Vietnamese and English with tone control for natural, context-aware results.',
};

interface Preferences {
  direction: TranslationDirection;
  tones: string[];
  model: string;
}

export default function TranslatelyPage() {
  const { user } = useAuth();
  const isGuest = !user;
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [direction, setDirection] = useState<TranslationDirection>(
    TRANSLATION_DIRECTION.VI_EN
  );
  const [tones, setTones] = useState<string[]>(['neutral']);
  const [model, setModel] = useState('gpt-5-nano');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { isActive, trigger } = useActionFeedback();
  const [isToneModalOpen, setIsToneModalOpen] = useState(false);

  const isViToEn = direction === TRANSLATION_DIRECTION.VI_EN;
  const directionLabel = isViToEn
    ? '🇻🇳 Vietnamese → 🇺🇸 English'
    : '🇺🇸 English → 🇻🇳 Vietnamese';
  const inputPlaceholder = isViToEn
    ? 'Enter Vietnamese text...'
    : 'Enter English text...';
  const outputLabel = isViToEn
    ? 'English Translation'
    : 'Vietnamese Translation';

  const persistPreferences = useCallback((next: Preferences) => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.TRANSLATE_PREFERENCES,
        JSON.stringify(next)
      );
    } catch (storageError) {
      console.warn('Failed to persist preferences', storageError);
    }
  }, []);

  useEffect(() => {
    function loadStoredPreferences() {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.TRANSLATE_PREFERENCES);
        if (!raw) return;
        const parsed = JSON.parse(raw) as Partial<Preferences>;

        if (
          parsed.direction === TRANSLATION_DIRECTION.VI_EN ||
          parsed.direction === TRANSLATION_DIRECTION.EN_VI
        ) {
          setDirection(parsed.direction);
        }

        if (Array.isArray(parsed.tones) && parsed.tones.length > 0) {
          setTones(parsed.tones);
        }

        if (typeof parsed.model === 'string') {
          const nextModel = AI_MODELS.find(item => item.value === parsed.model);
          if (nextModel) {
            setModel(nextModel.value);
          }
        }
      } catch (storageError) {
        console.warn('Failed to read preferences', storageError);
      }
    }
    loadStoredPreferences();
  }, []);

  useEffect(() => {
    persistPreferences({ direction, tones, model });
  }, [direction, tones, model, persistPreferences]);

  const handleSwap = useCallback(() => {
    setDirection(prev =>
      prev === TRANSLATION_DIRECTION.VI_EN
        ? TRANSLATION_DIRECTION.EN_VI
        : TRANSLATION_DIRECTION.VI_EN
    );
    setInputText(outputText);
    setOutputText(inputText);

    setTimeout(() => {
      const inputElement = document.getElementById('input-text');
      if (inputElement instanceof HTMLTextAreaElement) {
        inputElement.focus();
      }
    }, 0);
  }, [inputText, outputText]);

  const handleToneToggle = useCallback((tone: string, checked: boolean) => {
    setTones(prev => {
      if (checked) {
        const next = [...prev, tone];
        return next;
      }

      const next = prev.filter(item => item !== tone);
      return next.length === 0 ? prev : next;
    });
  }, []);

  const handleTranslate = useCallback(async () => {
    if (!inputText.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/translately', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: inputText,
          direction,
          tones,
          model,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || 'Translation failed');
      }

      setOutputText(result?.outputText || '');
    } catch (err) {
      console.error('Translation error:', err);
      setError('Unable to translate right now. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [direction, inputText, tones, model]);

  const handleCopy = useCallback(async () => {
    if (!outputText) return;

    try {
      await navigator.clipboard.writeText(outputText);
      trigger('copy');
    } catch (err) {
      console.error('Failed to copy translation:', err);
      setError('Failed to copy to clipboard. Please try again.');
      trigger('copy', { error: true });
    }
  }, [outputText, trigger]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        handleTranslate();
      }
    },
    [handleTranslate]
  );

  const inputCount = inputText.length;

  return (
    <MainLayout>
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-full mx-auto">
          <ToolPageHeader
            title={PAGE_METADATA.title}
            description={PAGE_METADATA.description}
          />

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>Translation failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isGuest && (
            <GuestLoginAlert className="mb-6" title="Sign in to translate" />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 items-start">
            <Card className="lg:sticky lg:top-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between py-2">
                  <span>Input Text</span>
                  <p className="text-sm text-muted-foreground">
                    {directionLabel}
                  </p>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Textarea
                    id="input-text"
                    value={inputText}
                    onChange={event => {
                      const newValue = event.target.value;
                      if (newValue.length <= MAX_TRANSLATE_INPUT_LENGTH) {
                        setInputText(newValue);
                      }
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={inputPlaceholder}
                    className="min-h-[180px]"
                    disabled={loading}
                    maxLength={MAX_TRANSLATE_INPUT_LENGTH}
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Ctrl + Enter to translate</span>
                    <span
                      className={
                        inputCount > MAX_TRANSLATE_INPUT_LENGTH * 0.9
                          ? 'text-warning'
                          : ''
                      }
                    >
                      {inputCount} / {MAX_TRANSLATE_INPUT_LENGTH}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label className="text-base">Model</Label>
                    <NativeSelect
                      value={model}
                      onChange={event => setModel(event.target.value)}
                      containerClassName="w-full"
                    >
                      {AI_MODELS.map(item => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </NativeSelect>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base">Tone & Style</Label>
                    <Dialog
                      open={isToneModalOpen}
                      onOpenChange={setIsToneModalOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between hover:bg-accent"
                        >
                          <span className="flex items-center gap-2 text-sm">
                            <SlidersHorizontal className="h-4 w-4" />
                            {tones.length > 0
                              ? `${tones.length} selected`
                              : 'Select tones'}
                          </span>
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[90vw] md:max-w-2xl lg:max-w-3xl max-h-[85vh]">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <SlidersHorizontal className="h-5 w-5" />
                            Select Tone & Style
                          </DialogTitle>
                        </DialogHeader>
                        <div className="overflow-y-auto max-h-[60vh] pr-2">
                          <div className="flex flex-wrap gap-2">
                            {TRANSLATION_TONES.map(tone => {
                              const checked = tones.includes(tone.value);
                              return (
                                <Badge
                                  key={tone.value}
                                  variant={checked ? 'default' : 'outline'}
                                  className="cursor-pointer transition-all hover:scale-105 text-xs py-1.5 px-3"
                                  onClick={() =>
                                    handleToneToggle(tone.value, !checked)
                                  }
                                >
                                  {tone.label}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="text-sm text-muted-foreground">
                            {tones.length > 0 ? (
                              <span>
                                {tones.length} tone
                                {tones.length !== 1 ? 's' : ''} selected
                              </span>
                            ) : (
                              <span>No tones selected (default)</span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {tones.length > 1 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setTones(['neutral'])}
                              >
                                Clear All
                              </Button>
                            )}
                            <Button
                              size="sm"
                              onClick={() => setIsToneModalOpen(false)}
                            >
                              Apply
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                {tones.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-3 bg-accent/50 rounded-lg">
                    {tones.map(tone => {
                      const toneLabel =
                        TRANSLATION_TONES.find(item => item.value === tone)
                          ?.label || tone;
                      return (
                        <Badge
                          key={tone}
                          variant="default"
                          className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                          onClick={() => handleToneToggle(tone, false)}
                        >
                          {toneLabel}
                          <X className="ml-1 h-3 w-3" />
                        </Badge>
                      );
                    })}
                  </div>
                )}
                <RainbowButton
                  className="w-full"
                  size="lg"
                  variant="outline"
                  onClick={handleTranslate}
                  disabled={isGuest || loading || !inputText.trim()}
                >
                  {loading ? <Spinner /> : <Sparkles />}
                  {loading ? 'Translating...' : 'Translate'}
                </RainbowButton>
              </CardContent>
            </Card>

            <div className="flex flex-col items-center justify-center gap-3 lg:pt-10">
              <Button
                variant="outline"
                size="icon"
                onClick={handleSwap}
                disabled={loading}
                aria-label="Swap translation direction"
                className="h-11 w-11 rounded-full shadow-sm"
              >
                <ArrowRightLeft />
              </Button>
              <span className="text-xs text-muted-foreground text-center max-w-[120px]">
                Swap direction
              </span>
            </div>

            <Card className="lg:sticky lg:top-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{outputLabel}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    disabled={!outputText}
                  >
                    {isActive('copy') ? (
                      <Check className="animate-bounce-in" />
                    ) : (
                      <Copy />
                    )}
                    Copy
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={outputText}
                  readOnly
                  placeholder="Translation will appear here..."
                  className="min-h-[180px]"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Auto-filled after translation</span>
                  <span>{outputText.length} characters</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
