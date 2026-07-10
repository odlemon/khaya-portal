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
import { toSessionUser, extractRbacFromAuthResponse, mergeUserWithRbac } from '../lib/authUser';
import {
  setSessionWithUser,
  clearSession,
  getToken,
  getUserJson,
  getStoredRbac,
  isAccessTokenExpired,
} from '../lib/authSession';
import { registerAuthLogoutHandler } from '../lib/authenticatedFetch';
import { wasIdleLongEnough, clearIdleMark } from '../lib/idleSession';
import { isBankAdminRole, isInsuranceAdminRole } from '../lib/portals';
import type { LoginPayload, PortalType, RbacState, SessionUser, StaffRoleRef } from '../types/staffSession';

function shouldBootstrapRealtime(role: string | undefined): boolean {
  return !isBankAdminRole(role) && !isInsuranceAdminRole(role);
}

const defaultRbac: RbacState = {
  permissions: [],
  portal: null,
  isSuperAdmin: false,
  mustChangePassword: false,
  staffRole: null,
};

interface AuthContextType {
  user: SessionUser | null;
  token: string | null;
  permissions: string[];
  portal: PortalType;
  isSuperAdmin: boolean;
  mustChangePassword: boolean;
  staffRole: StaffRoleRef | null;
  login: (data: LoginPayload) => void;
  logout: () => void;
  clearMustChangePassword: () => void;
  updateRbac: (rbac: Partial<RbacState>) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function applyLoginPayload(
  token: string,
  user: SessionUser,
  rbac: RbacState
): { user: SessionUser; rbac: RbacState } {
  const mergedUser = mergeUserWithRbac(user, rbac);
  setSessionWithUser(token, mergedUser, rbac);
  return { user: mergedUser, rbac };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [rbac, setRbac] = useState<RbacState>(defaultRbac);
  const [loading, setLoading] = useState(true);

  const login = useCallback((data: LoginPayload) => {
    const trimmedToken = data.token.trim();
    const rbacState: RbacState = {
      permissions: data.permissions ?? [],
      portal: data.portal ?? null,
      isSuperAdmin: data.isSuperAdmin ?? false,
      mustChangePassword: data.mustChangePassword ?? false,
      staffRole: data.staffRole ?? null,
    };
    const { user: mergedUser } = applyLoginPayload(trimmedToken, data.user, rbacState);
    setUser(mergedUser);
    setToken(trimmedToken);
    setRbac(rbacState);
    setLoading(false);
    clearIdleMark();
    if (shouldBootstrapRealtime(mergedUser.role)) {
      bootstrapRealtime(trimmedToken);
    }
  }, []);

  const logout = useCallback(() => {
    clearSession();
    clearIdleMark();
    setUser(null);
    setToken(null);
    setRbac(defaultRbac);
    socketService.disconnect();
    resetRealtimeListeners();
    setLoading(false);
  }, []);

  const clearMustChangePassword = useCallback(() => {
    setRbac((prev) => {
      const next = { ...prev, mustChangePassword: false };
      if (user && token) {
        const mergedUser = { ...user, mustChangePassword: false };
        setUser(mergedUser);
        setSessionWithUser(token, mergedUser, next);
      }
      return next;
    });
  }, [user, token]);

  const updateRbac = useCallback(
    (partial: Partial<RbacState>) => {
      setRbac((prev) => {
        const next = { ...prev, ...partial };
        if (user && token) {
          const mergedUser = mergeUserWithRbac(user, next);
          setUser(mergedUser);
          setSessionWithUser(token, mergedUser, next);
        }
        return next;
      });
    },
    [user, token]
  );

  useEffect(() => {
    return registerAuthLogoutHandler(logout);
  }, [logout]);

  useEffect(() => {
    const init = async () => {
      try {
        let storedToken = getToken();
        let storedUserJson = getUserJson();
        if ((storedToken && !storedUserJson) || (!storedToken && storedUserJson)) {
          clearSession();
          storedToken = getToken();
          storedUserJson = getUserJson();
        }

        if (storedToken && storedUserJson) {
          if (wasIdleLongEnough()) {
            clearSession();
            clearIdleMark();
            setToken(null);
            setUser(null);
            setRbac(defaultRbac);
            if (!window.location.pathname.startsWith('/auth')) {
              window.location.assign('/auth/login');
            }
            return;
          }

          if (isAccessTokenExpired(storedToken)) {
            clearSession();
            setToken(null);
            setUser(null);
            setRbac(defaultRbac);
            return;
          }

          const me = await authService.getMe(storedToken);
          if (!me.success || !me.data) {
            clearSession();
            clearIdleMark();
            setToken(null);
            setUser(null);
            setRbac(defaultRbac);
            if (!window.location.pathname.startsWith('/auth')) {
              window.location.assign('/auth/login');
            }
            return;
          }

          const userData = toSessionUser(me.data as Record<string, unknown>);
          const rbacState = extractRbacFromAuthResponse(me as Record<string, unknown>, userData);
          const { user: mergedUser, rbac: mergedRbac } = applyLoginPayload(
            storedToken,
            userData,
            rbacState
          );
          setToken(storedToken);
          setUser(mergedUser);
          setRbac(mergedRbac);
          clearIdleMark();
          if (shouldBootstrapRealtime(mergedUser.role)) {
            bootstrapRealtime(storedToken);
          }
        } else {
          const urlParams = new URLSearchParams(window.location.search);
          const tokenFromUrl = urlParams.get('token')?.trim();
          if (tokenFromUrl) {
            try {
              const me = await authService.getMe(tokenFromUrl);
              if (me.success && me.data) {
                const userData = toSessionUser(me.data as Record<string, unknown>);
                const rbacState = extractRbacFromAuthResponse(me as Record<string, unknown>, userData);
                login({
                  token: tokenFromUrl,
                  user: userData,
                  ...rbacState,
                });
                return;
              }
            } catch (e) {
              console.error('Token from URL failed:', e);
            }
          } else {
            const storedRbac = getStoredRbac();
            if (storedRbac && storedUserJson) {
              try {
                const parsedUser = JSON.parse(storedUserJson) as SessionUser;
                setUser(parsedUser);
                setToken(storedToken);
                setRbac(storedRbac);
              } catch {
                // ignore
              }
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
    () => ({
      user,
      token,
      permissions: rbac.permissions,
      portal: rbac.portal,
      isSuperAdmin: rbac.isSuperAdmin,
      mustChangePassword: rbac.mustChangePassword,
      staffRole: rbac.staffRole,
      login,
      logout,
      clearMustChangePassword,
      updateRbac,
      loading,
    }),
    [user, token, rbac, login, logout, clearMustChangePassword, updateRbac, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
