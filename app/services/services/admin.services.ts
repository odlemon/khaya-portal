// @ts-nocheck
'use client';
import { API_CONFIG } from '../../config/api.config';
import { useFetchWithAuth } from '../../context/fetchWithAuth';
import { useCallback, useMemo } from 'react';

export interface ServiceUserRef {
  _id: string;
  firstName: string;
  lastName: string;
}

export interface ServicePropertyRef {
  _id: string;
  title: string;
}

export interface ServiceRequest {
  _id: string;
  title?: string;
  description?: string;
  serviceType: string;
  urgency?: 'low' | 'medium' | 'high' | 'emergency';
  status: 'pending_landlord_approval' | 'approved' | 'scheduled' | 'in_progress' | 'completed' | 'rejected';
  requestedDate?: string;
  scheduledDate?: string;
  rejectionReason?: string;
  approvalNotes?: string;
  completionNotes?: string;
  paidBy?: 'tenant' | 'landlord' | 'split';
  landlordId: ServiceUserRef;
  tenantId: ServiceUserRef;
  propertyId: ServicePropertyRef;
  serviceProvider?: {
    name?: string;
    phoneNumber?: string;
    company?: string;
  } | null;
  assignedAdmin?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServicesResponse {
  success: boolean;
  data: ServiceRequest[];
}

export function useAdminServicesService() {
  const fetchWithAuth = useFetchWithAuth();

  const getNeedingVendor = useCallback(async (): Promise<ServicesResponse | null> => {
    try {
      const res = await fetchWithAuth(`${API_CONFIG.baseUrl}/services/admin/needing-vendor`, {
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) throw new Error('Failed to fetch services');
      const data = await res.json();
      return data;
    } catch (e) {
      if (e instanceof Error && e.message.includes('Authentication is still loading')) return null;
      console.error('Error fetching needing-vendor services:', e);
      return null;
    }
  }, [fetchWithAuth]);

  const approveService = useCallback(async (serviceId: string, scheduledDate?: string) => {
    const res = await fetchWithAuth(`${API_CONFIG.baseUrl}/services/admin/${serviceId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(scheduledDate ? { scheduledDate } : {})
    });
    if (!res.ok) throw new Error('Failed to approve service');
    return res.json();
  }, [fetchWithAuth]);

  const rejectService = useCallback(async (serviceId: string, rejectionReason: string) => {
    const res = await fetchWithAuth(`${API_CONFIG.baseUrl}/services/admin/${serviceId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ rejectionReason })
    });
    if (!res.ok) throw new Error('Failed to reject service');
    return res.json();
  }, [fetchWithAuth]);

  const assignVendor = useCallback(async (serviceId: string, payload: { name: string; phoneNumber?: string; company?: string; scheduledDate?: string }) => {
    const res = await fetchWithAuth(`${API_CONFIG.baseUrl}/services/admin/${serviceId}/assign-vendor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to assign vendor');
    return res.json();
  }, [fetchWithAuth]);

  return useMemo(() => ({
    getNeedingVendor,
    approveService,
    rejectService,
    assignVendor,
  }), [getNeedingVendor, approveService, rejectService, assignVendor]);
}



