// @ts-nocheck
/**
 * HTTPS mixed-content: browser on HTTPS uses same-origin `/api/backend/api/...` (see next.config rewrites).
 * Local dev on http://localhost uses direct HTTP API. SSR uses BACKEND_URL when set.
 */

/** Direct HTTP API (includes `/api` suffix). Production backend default. */
export const DEFAULT_PRODUCTION_API_URL = 'http://31.220.82.129:4002/api';

/** Origin only — rewrite target in next.config (no trailing slash). */
export const DEFAULT_BACKEND_ORIGIN = 'http://31.220.82.129:4002';

/** Public same-origin proxy prefix (must match next.config rewrites). */
export const API_PROXY_PATH = '/api/backend';

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

export function getApiBaseURL(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (envUrl) {
    return trimTrailingSlash(envUrl);
  }

  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    return `${API_PROXY_PATH}/api`;
  }

  if (typeof window === 'undefined') {
    const backend = process.env.BACKEND_URL?.trim();
    if (backend) {
      return `${trimTrailingSlash(backend)}/api`;
    }
  }

  return DEFAULT_PRODUCTION_API_URL;
}

/** Alias used in some integration guides. */
export const getBaseURL = getApiBaseURL;

export const API_CONFIG = {
  get baseUrl() {
    return getApiBaseURL();
  },
};

/**
 * Rewrite absolute HTTP asset/API URLs to the same-origin proxy on HTTPS pages.
 */
export function resolveAssetUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  if (typeof window === 'undefined' || window.location.protocol !== 'https:') {
    return trimmed;
  }

  const proxyApiBase = `${API_PROXY_PATH}/api`;
  const directApiBase = DEFAULT_PRODUCTION_API_URL;
  const directOrigin = DEFAULT_BACKEND_ORIGIN;

  if (trimmed.startsWith(directApiBase)) {
    return trimmed.replace(directApiBase, proxyApiBase);
  }
  if (trimmed.startsWith(directOrigin)) {
    return trimmed.replace(directOrigin, API_PROXY_PATH);
  }

  return trimmed;
}

/** Socket.io: same-origin on HTTPS (proxied via rewrites when BACKEND_URL is set). */
export function getSocketURL(): string | undefined {
  const envUrl = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();
  if (envUrl) {
    return trimTrailingSlash(envUrl);
  }

  if (typeof window === 'undefined') {
    const backend = process.env.BACKEND_URL?.trim();
    if (backend) {
      return trimTrailingSlash(backend);
    }
  }

  // Local HTTP dev: connect directly to production backend.
  if (typeof window !== 'undefined' && window.location.protocol !== 'https:') {
    return DEFAULT_BACKEND_ORIGIN;
  }

  // HTTPS deployed portal: same-origin via /api/backend/socket.io (see getSocketOptions).
  return undefined;
}

/** Socket.io client options — on HTTPS use /api/backend/socket.io (same proxy as REST). */
export function getSocketOptions(): {
  url: string | undefined;
  path: string;
  transports: ('websocket' | 'polling')[];
  upgrade: boolean;
} {
  const url = getSocketURL();
  const isHttpsPage =
    typeof window !== 'undefined' && window.location.protocol === 'https:';
  const useDirectUrl = Boolean(url);

  if (useDirectUrl) {
    return {
      url,
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      upgrade: true,
    };
  }

  if (isHttpsPage) {
    return {
      url: undefined,
      path: `${API_PROXY_PATH}/socket.io`,
      transports: ['polling'],
      upgrade: false,
    };
  }

  return {
    url,
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    upgrade: true,
  };
}

/** Human-readable target for logs (DevTools). */
export function getSocketTargetLabel(): string {
  const { url, path } = getSocketOptions();
  if (url) return `${url}${path}`;
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${path}`;
  }
  return DEFAULT_BACKEND_ORIGIN + '/socket.io';
}
