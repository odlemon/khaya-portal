// @ts-nocheck
/** Set NEXT_PUBLIC_API_URL to override (e.g. https://khaya-server.vercel.app/api for production). */
export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api',
} as const;