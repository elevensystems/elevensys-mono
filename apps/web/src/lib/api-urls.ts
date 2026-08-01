import { env } from '@/env';

const BASE_URL = env.API_BASE_URL;

export const URLIFY_URLS = {
  SHORTEN: `${BASE_URL}/urlify/shorten`,
  URLS: `${BASE_URL}/urlify/urls`,
  URL: `${BASE_URL}/urlify/url`,
};

export const OPENAI_URL = `${BASE_URL}/openai`;
