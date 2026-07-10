import { getToken, clearSession } from '@/app/lib/authSession';
import {
  ACCOUNT_ADMIN_TERMINATED,
} from '@/app/lib/authErrors';
import { isPermissionDeniedBody, PermissionDeniedError } from '@/app/lib/permissionErrors';

type LogoutHandler = () => void;

let logoutHandler: LogoutHandler | null = null;
let handlingUnauthorized = false;

export function registerAuthLogoutHandler(handler: LogoutHandler): () => void {
  logoutHandler = handler;
  return () => {
    if (logoutHandler === handler) logoutHandler = null;
  };
}

async function parseJsonBody(res: Response): Promise<Record<string, unknown>> {
  try {
    const data = await res.clone().json();
    return data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function runForcedLogout() {
  if (typeof window === 'undefined') return;
  if (handlingUnauthorized) return;
  handlingUnauthorized = true;

  try {
    try {
      logoutHandler?.();
    } catch {
      clearSession();
    }
    const path = window.location.pathname || '';
    if (!path.startsWith('/auth')) {
      window.location.assign('/auth/login');
    }
  } finally {
    window.setTimeout(() => {
      handlingUnauthorized = false;
    }, 2000);
  }
}

export type AuthenticatedFetchOptions = {
  /** Skip forced logout handling (e.g. login endpoint). */
  skipAuthRedirect?: boolean;
};

/**
 * Single authenticated fetch entry point for the portal.
 * - Reads trimmed token from sessionStorage at request time
 * - Logs out on 401/503 so users re-login cleanly after idle or DB blips
 */
export async function authenticatedFetch(
  input: RequestInfo,
  init: RequestInit = {},
  options: AuthenticatedFetchOptions = {}
): Promise<Response> {
  const token = getToken();

  const headers = new Headers(init.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(input, { ...init, headers });

  if (!options.skipAuthRedirect && typeof window !== 'undefined') {
    if (res.status === 401 || res.status === 503) {
      runForcedLogout();
    }

    if (res.status === 403) {
      const body = await parseJsonBody(res);
      if (body.code === ACCOUNT_ADMIN_TERMINATED) {
        runForcedLogout();
      }
      // PERMISSION_DENIED — do not logout; caller handles UI
    }
  }

  return res;
}

export async function authenticatedFetchJson<T>(
  input: RequestInfo,
  init: RequestInit = {},
  options?: AuthenticatedFetchOptions
): Promise<T> {
  const response = await authenticatedFetch(input, init, options);

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    const message =
      (errorData.message as string) || `HTTP error! status: ${response.status}`;
    if (response.status === 403 && isPermissionDeniedBody(errorData)) {
      throw new PermissionDeniedError(
        message,
        Array.isArray(errorData.required) ? (errorData.required as string[]) : []
      );
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}
