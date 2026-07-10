/**
 * Single source of truth for auth in the browser: sessionStorage only.
 */
import type { RbacState } from '../types/staffSession';

export const SESSION_TOKEN_KEY = 'khaya_auth_token';
export const SESSION_USER_KEY = 'khaya_auth_user';
export const SESSION_RBAC_KEY = 'khaya_auth_rbac';

function normalizeToken(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const trimmed = raw.trim();
  return trimmed || null;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return normalizeToken(sessionStorage.getItem(SESSION_TOKEN_KEY));
  } catch {
    return null;
  }
}

export function getUserJson(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(SESSION_USER_KEY);
  } catch {
    return null;
  }
}

export function getRbacJson(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(SESSION_RBAC_KEY);
  } catch {
    return null;
  }
}

export function getStoredRbac(): RbacState | null {
  const json = getRbacJson();
  if (!json) return null;
  try {
    return JSON.parse(json) as RbacState;
  } catch {
    return null;
  }
}

export function setSession(params: {
  token: string;
  userJson: string;
  rbacJson?: string;
}): void {
  if (typeof window === 'undefined') return;
  try {
    const token = normalizeToken(params.token);
    if (!token) return;
    sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    sessionStorage.setItem(SESSION_USER_KEY, params.userJson);
    if (params.rbacJson) {
      sessionStorage.setItem(SESSION_RBAC_KEY, params.rbacJson);
    }
  } catch (e) {
    console.error('authSession.setSession failed:', e);
  }
}

export function setSessionWithUser(
  token: string,
  user: object,
  rbac?: RbacState
): void {
  setSession({
    token,
    userJson: JSON.stringify(user),
    rbacJson: rbac ? JSON.stringify(rbac) : undefined,
  });
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    sessionStorage.removeItem(SESSION_USER_KEY);
    sessionStorage.removeItem(SESSION_RBAC_KEY);
  } catch {
    // ignore
  }
}

export function isAccessTokenExpired(token: string): boolean {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return false;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    const decoded = JSON.parse(jsonPayload);
    if (!decoded.exp) return false;
    return decoded.exp < Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}
