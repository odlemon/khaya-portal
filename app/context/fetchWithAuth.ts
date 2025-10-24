// @ts-nocheck
"use client";

import { useAuth } from "./AuthContext";
import { useCallback } from "react";

export function useFetchWithAuth() {
  const { token, loading } = useAuth();

  return useCallback(
    async function fetchWithAuth(input: RequestInfo, init: RequestInit = {}) {
      // Wait for auth to finish loading before making requests
      if (loading) {
        throw new Error('Authentication is still loading. Please wait.');
      }

      const headers = new Headers(init.headers || {});
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return fetch(input, {
        ...init,
        headers
      });
    },
    [token, loading]
  );
} 