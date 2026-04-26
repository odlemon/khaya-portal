/**
 * Single source of truth for auth in the browser: sessionStorage only.
 * All API layers should use getToken() / setSession() / clearSession() from here.
 */

export const SESSION_TOKEN_KEY = 'khaya_auth_token';
export const SESSION_USER_KEY = 'khaya_auth_user';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(SESSION_TOKEN_KEY);
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

export function setSession(params: { token: string; userJson: string }): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(SESSION_TOKEN_KEY, params.token);
    sessionStorage.setItem(SESSION_USER_KEY, params.userJson);
  } catch (e) {
    console.error('authSession.setSession failed:', e);
  }
}

/** Persists token + user object; call this first on login, then sync React state. */
export function setSessionWithUser(token: string, user: object): void {
  setSession({ token, userJson: JSON.stringify(user) });
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    sessionStorage.removeItem(SESSION_USER_KEY);
  } catch {
    // ignore
  }
}

/** True if JWT has exp and it is in the past. */
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
