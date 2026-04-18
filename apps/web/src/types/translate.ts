export interface TranslateRequestBody {
  input?: string;
  direction?: 'vi-en' | 'en-vi';
  tones?: string[];
  model?: string;
}
