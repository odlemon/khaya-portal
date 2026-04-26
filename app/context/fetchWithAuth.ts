// @ts-nocheck
"use client";

import { useAuth } from "./AuthContext";
import { useCallback, useEffect, useRef } from "react";
import { getToken, clearSession } from "../lib/authSession";

/** Stops parallel API calls all returning 401 from each doing a full-page redirect (login loop / tab thrash). */
let handlingUnauthorized = false;

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
        if (handlingUnauthorized) {
          return res;
        }
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

      return res;
    },
    [token, loading]
  );
} 