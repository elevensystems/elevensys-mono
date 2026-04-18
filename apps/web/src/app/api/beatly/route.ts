import { NextRequest, NextResponse } from 'next/server';

import { OPENAI_URL } from '@/lib/api-urls';
import { validateModel } from '@/lib/constants';
import { fetchWithTimeout } from '@/lib/fetch-utils';
import type { ChatMessage, MoodRequest } from '@/types/beatly';

export async function POST(request: NextRequest) {
  try {
    const body: MoodRequest = await request.json();
    const { mood, language, genres, excludedSongs } = body;

    const lambdaBase = OPENAI_URL;
    const model = validateModel(body.model);

    if (!mood) {
      return NextResponse.json(
        { error: 'Mood is required for song recommendations' },
        { status: 400 }
      );
    }

    const genresStr =
      genres && genres.length > 0 ? genres.join(', ') : 'any genre';
    const excludeStr =
      excludedSongs && excludedSongs.length > 0
        ? `\n\nExclude these songs that were already recommended:\n${excludedSongs.join(', ')}`
        : '';

    const languageLine = language
      ? `Write the "reason" field in ${language}.`
      : 'Write the "reason" field in English.';

    const systemPrompt = `You are a music expert. Recommend exactly 5 songs that match the user's mood. ${
      genres && genres.length > 0
        ? `Only recommend songs from these genres: ${genresStr}.`
        : 'Recommend songs from any genre.'
    }
Avoid duplicates, keep the list diverse (different artists when possible), and keep each reason to one short sentence. ${languageLine}

Return in this JSON format:
{
  "songs": [
    {"title": "Song Title", "artist": "Artist Name", "reason": "Brief reason"}
  ]
}

Return only pure JSON, no markdown or explanations.${excludeStr}`;

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: mood,
      },
    ];

    try {
      const response = await fetchWithTimeout(lambdaBase, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          input: messages,
          temperature: 1,
          store: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          'OpenAI API error (recommend-songs):',
          response.status,
          errorText
        );
        return NextResponse.json(
          { error: `AI service error: ${response.status}` },
          { status: 502 }
        );
      }

      const data = await response.json();
      const content =
        data?.output_text?.trim() || data?.data?.output_text?.trim() || '';

      if (!content) {
        console.error('Empty response from OpenAI');
        return NextResponse.json(
          { error: 'Received empty response from AI service' },
          { status: 502 }
        );
      }
      console.log('Raw AI response content:', content);

      try {
        const parsedData = JSON.parse(content);

        if (!parsedData.songs || !Array.isArray(parsedData.songs)) {
          console.error('Invalid response structure:', parsedData);
          return NextResponse.json(
            { error: 'Invalid response format from AI service' },
            { status: 502 }
          );
        }

        return NextResponse.json(parsedData);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Raw content:', content);
        return NextResponse.json(
          { error: 'Failed to parse AI response' },
          { status: 502 }
        );
      }
    } catch (fetchError) {
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('Recommend songs request timeout');
        return NextResponse.json(
          { error: 'AI request timed out. Please try again.' },
          { status: 504 }
        );
      }
      console.error('Fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to connect to AI service' },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Beatly API error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to process request', details: errorMessage },
      { status: 500 }
    );
  }
}
