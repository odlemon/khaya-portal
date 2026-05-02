// @ts-nocheck
"use client";

import { useAuth } from "./AuthContext";
import { useCallback, useEffect, useRef } from "react";
import type { MutableRefObject } from "react";
import { getToken, clearSession } from "../lib/authSession";
import { ACCOUNT_ADMIN_TERMINATED } from "../lib/authErrors";

/** Stops parallel 401/forced-logout handling from thrashing (redirect loops). */
let handlingUnauthorized = false;

function runForcedLogout(logoutRef: MutableRefObject<() => void>) {
  if (typeof window === "undefined") return;
  if (handlingUnauthorized) return;
  handlingUnauthorized = true;
  try {
    try {
      logoutRef.current();
    } catch {
      clearSession();
    }
    const path = window.location.pathname || "";
    if (!path.startsWith("/auth")) {
      window.location.assign("/auth/login");
    }
  } finally {
    window.setTimeout(() => {
      handlingUnauthorized = false;
    }, 2000);
  }
}

export function useFetchWithAuth() {
  const { token, loading, logout } = useAuth();
  const logoutRef = useRef(logout);
  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);

  return useCallback(
    async function fetchWithAuth(input: RequestInfo, init: RequestInit = {}) {
      const headerToken = getToken() ?? token;
      if (loading && !headerToken) {
        throw new Error('Authentication is still loading. Please wait.');
      }

      const headers = new Headers(init.headers || {});
      if (headerToken) {
        headers.set("Authorization", `Bearer ${headerToken}`);
      }
      const res = await fetch(input, {
        ...init,
        headers
      });

      if (res.status === 401 && typeof window !== "undefined") {
        if (!handlingUnauthorized) {
          runForcedLogout(logoutRef);
        }
        return res;
      }

      if (res.status === 403 && typeof window !== "undefined") {
        const body = await res.clone().json().catch(() => ({}));
        if (body?.code === ACCOUNT_ADMIN_TERMINATED) {
          runForcedLogout(logoutRef);
        }
      }

      return res;
    },
    [token, loading]
  );
}
