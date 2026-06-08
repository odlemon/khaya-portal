// @ts-nocheck
'use client';
import { API_CONFIG } from '../../config/api.config';
import { useFetchWithAuth } from '../../context/fetchWithAuth';
import { useCallback, useMemo } from 'react';

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phone: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface UsersResponse {
  success: boolean;
  message: string;
  data: {
    users: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface TerminatedUser extends User {
  adminTerminatedAt?: string;
  adminTerminationReason?: string;
  adminTerminatedBy?: Record<string, unknown> | string | null;
}

export interface TerminatedUsersResponse {
  success: boolean;
  message?: string;
  data: {
    users: TerminatedUser[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

/** Result of terminate / reinstate admin actions. */
export type TerminateAccountResult =
  | { ok: true; status: 200 }
  | { ok: false; status: number; code?: string; message?: string };

export interface AdminUsersListParams {
  page?: number;
  limit?: number;
  role?: 'tenant' | 'landlord' | 'admin' | '';
  search?: string;
  isActive?: boolean;
}

export interface HardDeleteUserSummary {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
}

export interface HardDeleteResult {
  user: HardDeleteUserSummary;
  deletedCounts?: Record<string, number>;
}

/** Result of hard-delete admin action. */
export type HardDeleteAccountResult =
  | { ok: true; status: 200; message: string; data: HardDeleteResult }
  | { ok: false; status: number; message?: string };

export function useUsersService() {
  const fetchWithAuth = useFetchWithAuth();

  const getUsers = useCallback(async (role: 'tenant' | 'landlord', page: number = 1, limit: number = 10): Promise<UsersResponse | null> => {
    try {
      const res = await fetchWithAuth(`${API_CONFIG.baseUrl}/admin/users?role=${role}&page=${page}&limit=${limit}`, {
        headers: {
          'Accept': 'application/json',
        }
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      return data;
    } catch (e) {
      // If it's a loading error, return null and let the component handle it
      if (e instanceof Error && e.message.includes('Authentication is still loading')) {
        return null;
      }
      console.error('Error fetching users:', e);
      return null;
    }
  }, [fetchWithAuth]);

  const getTenants = useCallback(async (page: number = 1, limit: number = 10) => {
    return await getUsers('tenant', page, limit);
  }, [getUsers]);

  const getLandlords = useCallback(async (page: number = 1, limit: number = 10) => {
    return await getUsers('landlord', page, limit);
  }, [getUsers]);

  const getTerminatedUsers = useCallback(
    async (
      page: number = 1,
      limit: number = 20,
      role?: 'tenant' | 'landlord'
    ): Promise<TerminatedUsersResponse | null> => {
      try {
        const roleQ = role ? `&role=${encodeURIComponent(role)}` : '';
        const res = await fetchWithAuth(
          `${API_CONFIG.baseUrl}/admin/users/terminated?page=${page}&limit=${limit}${roleQ}`,
          { headers: { Accept: 'application/json' } }
        );
        if (!res.ok) throw new Error('Failed to fetch terminated users');
        return await res.json();
      } catch (e) {
        if (e instanceof Error && e.message.includes('Authentication is still loading')) {
          return null;
        }
        console.error('Error fetching terminated users:', e);
        return null;
      }
    },
    [fetchWithAuth]
  );

  const terminateUser = useCallback(
    async (userId: string, reason: string): Promise<TerminateAccountResult> => {
      const res = await fetchWithAuth(`${API_CONFIG.baseUrl}/admin/users/${userId}/terminate`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });
      if (res.status === 200) return { ok: true, status: 200 };
      let message = '';
      let code: string | undefined;
      try {
        const j = await res.json();
        message = j.message || j.error || '';
        code = j.code;
      } catch {
        // ignore
      }
      return { ok: false, status: res.status, code, message };
    },
    [fetchWithAuth]
  );

  const listAdminUsers = useCallback(
    async (params: AdminUsersListParams = {}): Promise<UsersResponse | null> => {
      const { page = 1, limit = 20, role, search, isActive } = params;
      try {
        const qs = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });
        if (role) qs.set('role', role);
        if (search?.trim()) qs.set('search', search.trim());
        if (isActive !== undefined) qs.set('isActive', String(isActive));

        const res = await fetchWithAuth(`${API_CONFIG.baseUrl}/admin/users?${qs}`, {
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) throw new Error('Failed to fetch users');
        return await res.json();
      } catch (e) {
        if (e instanceof Error && e.message.includes('Authentication is still loading')) {
          return null;
        }
        console.error('Error fetching admin users:', e);
        return null;
      }
    },
    [fetchWithAuth]
  );

  const hardDeleteUser = useCallback(
    async (userId: string): Promise<HardDeleteAccountResult> => {
      const res = await fetchWithAuth(`${API_CONFIG.baseUrl}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      });

      let message = '';
      let data: HardDeleteResult | undefined;
      try {
        const j = await res.json();
        message = j.message || j.error || '';
        data = j.data;
      } catch {
        // ignore
      }

      if (res.ok) {
        return { ok: true, status: 200, message, data: data as HardDeleteResult };
      }
      return { ok: false, status: res.status, message };
    },
    [fetchWithAuth]
  );

  const reinstateUser = useCallback(
    async (userId: string, reason: string): Promise<TerminateAccountResult> => {
      const res = await fetchWithAuth(`${API_CONFIG.baseUrl}/admin/users/${userId}/reinstate`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });
      if (res.status === 200) return { ok: true, status: 200 };
      let message = '';
      let code: string | undefined;
      try {
        const j = await res.json();
        message = j.message || j.error || '';
        code = j.code;
      } catch {
        // ignore
      }
      return { ok: false, status: res.status, code, message };
    },
    [fetchWithAuth]
  );

  return useMemo(
    () => ({
      getUsers,
      getTenants,
      getLandlords,
      getTerminatedUsers,
      listAdminUsers,
      hardDeleteUser,
      terminateUser,
      reinstateUser,
    }),
    [
      getUsers,
      getTenants,
      getLandlords,
      getTerminatedUsers,
      listAdminUsers,
      hardDeleteUser,
      terminateUser,
      reinstateUser,
    ]
  );
}
