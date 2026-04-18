export interface JsonParseResult {
  value: unknown;
  error: string;
  isValid: boolean;
}

export const parseJsonSafely = (value: string): JsonParseResult => {
  try {
    return {
      value: JSON.parse(value) as unknown,
      error: '',
      isValid: true,
    };
  } catch (error) {
    return {
      value: null as unknown,
      error: error instanceof Error ? error.message : 'Invalid JSON',
      isValid: false,
    };
  }
};
