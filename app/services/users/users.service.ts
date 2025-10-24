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

  return useMemo(() => ({
    getUsers,
    getTenants,
    getLandlords,
  }), [getUsers, getTenants, getLandlords]);
}
