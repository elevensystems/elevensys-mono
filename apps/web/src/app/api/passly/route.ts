import { NextRequest, NextResponse } from 'next/server';

import {
  CHARSET,
  PASSWORD_COUNT,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from '@/lib/constants';
import type { CharacterOptions, GeneratePasswordRequest } from '@/types/passly';

/**
 * Generate a random password based on the selected options
 */
const generatePassword = (
  length: number,
  options: CharacterOptions
): string => {
  let charset = '';
  if (options.uppercase) charset += CHARSET.UPPERCASE;
  if (options.lowercase) charset += CHARSET.LOWERCASE;
  if (options.numbers) charset += CHARSET.NUMBERS;
  if (options.symbols) charset += CHARSET.SYMBOLS;

  if (charset === '') return '';

  let password = '';
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);

  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }

  return password;
};

export async function POST(request: NextRequest) {
  try {
    const body: GeneratePasswordRequest = await request.json();
    const { length, options } = body;

    // Validate input
    if (
      !length ||
      typeof length !== 'number' ||
      length < PASSWORD_MIN_LENGTH ||
      length > PASSWORD_MAX_LENGTH
    ) {
      return NextResponse.json(
        {
          error: `Invalid length. Must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH}.`,
        },
        { status: 400 }
      );
    }

    if (!options || typeof options !== 'object') {
      return NextResponse.json(
        { error: 'Invalid options provided' },
        { status: 400 }
      );
    }

    // Check if at least one character type is selected
    const hasAtLeastOneOption = Object.values(options).some(Boolean);
    if (!hasAtLeastOneOption) {
      return NextResponse.json(
        { error: 'At least one character type must be selected' },
        { status: 400 }
      );
    }

    // Generate passwords
    const passwords: string[] = [];
    for (let i = 0; i < PASSWORD_COUNT; i++) {
      passwords.push(generatePassword(length, options));
    }

    return NextResponse.json({
      success: true,
      passwords,
    });
  } catch (error) {
    console.error('Error in password generator API:', error);
    return NextResponse.json(
      { error: 'Failed to generate passwords' },
      { status: 500 }
    );
  }
}
