// @ts-nocheck
'use client';

import { API_CONFIG } from '../../config/api.config';
import { useFetchWithAuth } from '../../context/fetchWithAuth';
import { useCallback, useMemo } from 'react';

export type StaffPortal = 'khayalami' | 'bank' | 'insurance';

export interface PermissionCatalogModule {
  module: string;
  permissions: { key: string; label: string }[];
}

export interface PermissionCatalog {
  portal: StaffPortal;
  modules: PermissionCatalogModule[];
}

export interface StaffRole {
  _id: string;
  id?: string;
  name: string;
  portal: StaffPortal;
  permissions: string[];
  isActive?: boolean;
  userCount?: number;
}

export interface StaffUser {
  _id: string;
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  staffRole?: { id: string; name: string; portal: StaffPortal };
  createdAt?: string;
}

/** Temporary plaintext credentials returned when email delivery fails / is unreliable. */
export interface StaffCredentials {
  email: string;
  password: string;
  portal: string;
  roleName: string;
  mustChangePassword?: boolean;
}

export interface StaffCredentialsResult {
  user?: StaffUser;
  emailSent?: boolean;
  credentials?: StaffCredentials | null;
}

async function parseError(res: Response): Promise<string> {
  try {
    const j = await res.json();
    return j.message || j.error || 'Request failed';
  } catch {
    return 'Request failed';
  }
}

export function useStaffService() {
  const fetchWithAuth = useFetchWithAuth();
  const base = `${API_CONFIG.baseUrl}/admin/staff`;

  const getPermissionCatalog = useCallback(async (): Promise<PermissionCatalog[] | null> => {
    try {
      const res = await fetchWithAuth(`${base}/permissions`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data?.catalog ?? json.data ?? json.catalog ?? [];
    } catch {
      return null;
    }
  }, [fetchWithAuth, base]);

  const listRoles = useCallback(
    async (portal: StaffPortal): Promise<StaffRole[]> => {
      const res = await fetchWithAuth(`${base}/roles?portal=${portal}`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(await parseError(res));
      const json = await res.json();
      return json.data?.roles ?? json.data ?? [];
    },
    [fetchWithAuth, base]
  );

  const createRole = useCallback(
    async (body: { name: string; portal: StaffPortal; permissions: string[] }) => {
      const res = await fetchWithAuth(`${base}/roles`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await parseError(res));
      return (await res.json()).data;
    },
    [fetchWithAuth, base]
  );

  const updateRole = useCallback(
    async (
      id: string,
      body: { name?: string; permissions?: string[]; isActive?: boolean }
    ) => {
      const res = await fetchWithAuth(`${base}/roles/${id}`, {
        method: 'PUT',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await parseError(res));
      return (await res.json()).data;
    },
    [fetchWithAuth, base]
  );

  const deleteRole = useCallback(
    async (id: string) => {
      const res = await fetchWithAuth(`${base}/roles/${id}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(await parseError(res));
      return (await res.json()).data;
    },
    [fetchWithAuth, base]
  );

  const listStaffUsers = useCallback(
    async (portal?: StaffPortal): Promise<StaffUser[]> => {
      const q = portal ? `?portal=${portal}` : '';
      const res = await fetchWithAuth(`${base}/users${q}`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(await parseError(res));
      const json = await res.json();
      return json.data?.users ?? json.data ?? [];
    },
    [fetchWithAuth, base]
  );

  const createStaffUser = useCallback(
    async (body: {
      firstName: string;
      lastName: string;
      email: string;
      staffRoleId: string;
    }): Promise<StaffCredentialsResult> => {
      const res = await fetchWithAuth(`${base}/users`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await parseError(res));
      const json = await res.json();
      return (json.data ?? json) as StaffCredentialsResult;
    },
    [fetchWithAuth, base]
  );

  const updateStaffUser = useCallback(
    async (id: string, body: { staffRoleId?: string; isActive?: boolean }) => {
      const res = await fetchWithAuth(`${base}/users/${id}`, {
        method: 'PUT',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await parseError(res));
      return (await res.json()).data;
    },
    [fetchWithAuth, base]
  );

  const resetStaffPassword = useCallback(
    async (id: string): Promise<StaffCredentialsResult> => {
      const res = await fetchWithAuth(`${base}/users/${id}/reset-password`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(await parseError(res));
      const json = await res.json();
      return (json.data ?? json) as StaffCredentialsResult;
    },
    [fetchWithAuth, base]
  );

  return useMemo(
    () => ({
      getPermissionCatalog,
      listRoles,
      createRole,
      updateRole,
      deleteRole,
      listStaffUsers,
      createStaffUser,
      updateStaffUser,
      resetStaffPassword,
    }),
    [
      getPermissionCatalog,
      listRoles,
      createRole,
      updateRole,
      deleteRole,
      listStaffUsers,
      createStaffUser,
      updateStaffUser,
      resetStaffPassword,
    ]
  );
}
