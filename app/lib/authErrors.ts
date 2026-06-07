// @ts-nocheck
/** Backend code when an admin-terminated user hits protected APIs or logs in. */
export const ACCOUNT_ADMIN_TERMINATED = 'ACCOUNT_ADMIN_TERMINATED';

/** JWT expired — portal should logout. */
export const TOKEN_EXPIRED = 'TOKEN_EXPIRED';

/** Bad signature / corrupt token — portal should logout. */
export const TOKEN_INVALID = 'TOKEN_INVALID';

/** No Bearer header — portal should logout. */
export const AUTH_MISSING = 'AUTH_MISSING';

/** User deleted — portal should logout. */
export const USER_NOT_FOUND = 'USER_NOT_FOUND';

/** MongoDB blip — token still valid; retry request, do NOT logout. */
export const DB_UNAVAILABLE = 'DB_UNAVAILABLE';

export const FORCE_LOGOUT_AUTH_CODES = [
  TOKEN_EXPIRED,
  TOKEN_INVALID,
  AUTH_MISSING,
  USER_NOT_FOUND,
] as const;
