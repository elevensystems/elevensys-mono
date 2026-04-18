export interface ShortenedUrl {
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  createdAt: string;
  expiresAt?: string;
}

export type UrlStatus = 'active' | 'expired';

export function getUrlStatus(url: ShortenedUrl): UrlStatus {
  if (!url.expiresAt) return 'active';
  return new Date(url.expiresAt) > new Date() ? 'active' : 'expired';
}
