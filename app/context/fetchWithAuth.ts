// @ts-nocheck
"use client";

import { useAuth } from "./AuthContext";
import { useCallback } from "react";
import { getToken } from "../lib/authSession";
import { authenticatedFetch } from "../lib/authenticatedFetch";

export function useFetchWithAuth() {
  const { token, loading } = useAuth();

  return useCallback(
    async function fetchWithAuth(input: RequestInfo, init: RequestInit = {}) {
      const headerToken = getToken() ?? token;
      if (loading && !headerToken) {
        throw new Error("Authentication is still loading. Please wait.");
      }
      return authenticatedFetch(input, init);
    },
    [token, loading]
  );
}
