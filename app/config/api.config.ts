// @ts-nocheck
/** Set NEXT_PUBLIC_API_URL in .env.local to use a different API (e.g. http://localhost:3002/api). */
export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://khaya-server.vercel.app/api',
} as const;