import { z } from 'zod';

export const urlifySchema = z
  .object({
    url: z
      .string()
      .min(1, 'Please enter a URL')
      .refine(val => {
        try {
          const parsed = new URL(val.trim());
          return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
          return false;
        }
      }, 'Please enter a valid URL (must start with http:// or https://)'),
    autoDelete: z.boolean(),
    ttlDays: z.string(),
  })
  .refine(
    data => {
      if (data.autoDelete && data.ttlDays.trim()) {
        const parsed = Number(data.ttlDays);
        return !Number.isNaN(parsed) && parsed > 0;
      }
      return true;
    },
    { message: 'TTL must be a positive number of days', path: ['ttlDays'] }
  );
