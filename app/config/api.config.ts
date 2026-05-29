// @ts-nocheck
/** Set NEXT_PUBLIC_API_URL to override (e.g. http://localhost:3002/api for local backend). */
export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://31.220.82.129:4002/api',
} as const;