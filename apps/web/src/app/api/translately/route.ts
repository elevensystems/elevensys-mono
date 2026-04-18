import { NextRequest, NextResponse } from 'next/server';

import { OPENAI_URL } from '@/lib/api-urls';
import { getUserFromSession } from '@/lib/auth';
import { MAX_TRANSLATE_INPUT_LENGTH, validateModel } from '@/lib/constants';
import { fetchWithTimeout } from '@/lib/fetch-utils';
import type { TranslateRequestBody } from '@/types/translate';

const buildPrompt = (
  input: string,
  directionLabel: string,
  tonesLabel: string
) =>
  `Translate the user input from ${directionLabel}. Apply these tones in order: ${tonesLabel}. Return only the translated text without quotes or extra commentary.\n\nUser input:\n${input}`;

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession();
    if (!user || user.role !== 'pro') {
      return NextResponse.json(
        { error: 'Pro access required.' },
        { status: 403 }
      );
    }
    const body = (await request.json()) as TranslateRequestBody;
    const input = body.input?.trim();
    const direction = body.direction ?? 'vi-en';
    const tones =
      Array.isArray(body.tones) && body.tones.length > 0
        ? body.tones
        : ['neutral'];
    const model = validateModel(body.model);

    if (!input) {
      return NextResponse.json(
        { error: 'Input text is required.' },
        { status: 400 }
      );
    }

    if (input.length > MAX_TRANSLATE_INPUT_LENGTH) {
      return NextResponse.json(
        {
          error: `Input text exceeds maximum length of ${MAX_TRANSLATE_INPUT_LENGTH} characters.`,
        },
        { status: 400 }
      );
    }

    const directionLabel =
      direction === 'vi-en' ? 'Vietnamese to English' : 'English to Vietnamese';
    const tonesLabel = tones.join(', ');

    const systemMessage =
      'You are an expert bilingual translator specializing in high-quality Vietnamese-English and English-Vietnamese translations.';
    const userMessage = buildPrompt(input, directionLabel, tonesLabel);

    const lambdaBase = OPENAI_URL;

    try {
      const response = await fetchWithTimeout(lambdaBase, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          input: [
            {
              role: 'system',
              content: systemMessage,
            },
            {
              role: 'user',
              content: userMessage,
            },
          ],
          temperature: 1, // Using temperature 1 for natural, varied translations
          store: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Translation service error:', {
          status: response.status,
          error: data?.error,
        });
        return NextResponse.json(
          {
            error: data?.error || 'Translation service error.',
          },
          { status: response.status }
        );
      }

      const outputText = data?.output_text || data?.data?.output_text || '';

      if (!outputText) {
        throw new Error('Empty translation response');
      }

      return NextResponse.json({ outputText });
    } catch (fetchError) {
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('Translation request timeout');
        return NextResponse.json(
          { error: 'Translation request timed out. Please try again.' },
          { status: 504 }
        );
      }
      throw fetchError;
    }
  } catch (error) {
    console.error(
      'Translation error:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json(
      { error: 'Failed to translate. Please try again later.' },
      { status: 500 }
    );
  }
}
