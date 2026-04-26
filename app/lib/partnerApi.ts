// @ts-nocheck

/** Shown when bank-admin or insurance-admin returns 403. */
export const PARTNER_FORBIDDEN_MESSAGE =
  'Wrong portal or insufficient permissions. Use a bank or insurance partner account for this area, or contact Khayalami if you believe this is an error.';

/**
 * After parsing JSON from a partner API response, throw a clear message for 403.
 * Call before generic `!res.ok` handling.
 */
export function throwIfPartnerForbidden(res: Response, json: { message?: string }): void {
  if (res.status === 403) {
    throw new Error(json?.message || PARTNER_FORBIDDEN_MESSAGE);
  }
}
