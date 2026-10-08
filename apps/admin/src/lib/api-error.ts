// Kept apart from `api-fetch.ts` so modules that only throw it (e.g.
// `global-config-client.ts`) do not pull in `next/server`.
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}
