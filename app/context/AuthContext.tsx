// @ts-nocheck
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import authService from '../services/auth/auth.service';
import { socketService } from '../lib/socket';
import { bootstrapRealtime, resetRealtimeListeners } from '../lib/realtimeListeners';
import { toSessionUser } from '../lib/authUser';
import { setSessionWithUser, clearSession, getToken, getUserJson, isAccessTokenExpired } from '../lib/authSession';
import { registerAuthLogoutHandler } from '../lib/authenticatedFetch';
import { wasIdleLongEnough, clearIdleMark } from '../lib/idleSession';
import { isBankAdminRole, isInsuranceAdminRole } from '../lib/portals';

function shouldBootstrapRealtime(role: string | undefined): boolean {
  return !isBankAdminRole(role) && !isInsuranceAdminRole(role);
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  firmName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (data: { token: string; user: User }) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const login = useCallback((data: { token: string; user: User }) => {
    const trimmedToken = data.token.trim();
    setSessionWithUser(trimmedToken, data.user);
    setUser(data.user);
    setToken(trimmedToken);
    setLoading(false);
    clearIdleMark();
    if (shouldBootstrapRealtime(data.user.role)) {
      bootstrapRealtime(trimmedToken);
    }
  }, []);

  const logout = useCallback(() => {
    clearSession();
    clearIdleMark();
    setUser(null);
    setToken(null);
    socketService.disconnect();
    resetRealtimeListeners();
    setLoading(false);
  }, []);

  useEffect(() => {
    return registerAuthLogoutHandler(logout);
  }, [logout]);

  useEffect(() => {
    const init = async () => {
      try {
        let storedToken = getToken();
        let storedUser = getUserJson();
        if ((storedToken && !storedUser) || (!storedToken && storedUser)) {
          clearSession();
          storedToken = getToken();
          storedUser = getUserJson();
        }

        if (storedToken && storedUser) {
          if (wasIdleLongEnough()) {
            clearSession();
            clearIdleMark();
            setToken(null);
            setUser(null);
            if (!window.location.pathname.startsWith('/auth')) {
              window.location.assign('/auth/login');
            }
            return;
          }

          if (isAccessTokenExpired(storedToken)) {
            clearSession();
            setToken(null);
            setUser(null);
            return;
          }

          const me = await authService.getMe(storedToken);
          if (!me.success || !me.data) {
            clearSession();
            clearIdleMark();
            setToken(null);
            setUser(null);
            if (!window.location.pathname.startsWith('/auth')) {
              window.location.assign('/auth/login');
            }
            return;
          }

          const userData: User = toSessionUser(me.data as Record<string, unknown>);
          setSessionWithUser(storedToken, userData);
          setToken(storedToken);
          setUser(userData);
          clearIdleMark();
          if (shouldBootstrapRealtime(userData.role)) {
            bootstrapRealtime(storedToken);
          }
        } else {
          const urlParams = new URLSearchParams(window.location.search);
          const tokenFromUrl = urlParams.get('token')?.trim();
          if (tokenFromUrl) {
            try {
              const me = await authService.getMe(tokenFromUrl);
              if (me.success && me.data) {
                const u = me.data;
                const userData: User = toSessionUser(u as Record<string, unknown>);
                login({ token: tokenFromUrl, user: userData });
                return;
              }
            } catch (e) {
              console.error('Token from URL failed:', e);
            }
          }
        }
      } catch (e) {
        console.error('Auth init error:', e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [login]);

  const value = useMemo(
    () => ({ user, token, login, logout, loading }),
    [user, token, login, logout, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
