// @ts-nocheck
'use client';
import { API_CONFIG } from '../../config/api.config';
import { useFetchWithAuth } from '../../context/fetchWithAuth';
import { useCallback, useMemo } from 'react';

export interface PaymentRequest {
  _id: string;
  tenantId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  landlordId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  propertyId: {
    _id: string;
    title: string;
    address: {
      street: string;
      city: string;
      state: string;
      country: string;
    };
  };
  rentalId: {
    _id: string;
  };
  amount: number;
  paymentMethod: 'bank_transfer' | 'cash' | 'mobile_money' | 'other';
  proofOfPayment: string;
  status: 'pending_admin_approval' | 'approved' | 'rejected' | 'processed';
  submittedAt: string;
  notes?: string;
  rejectionReason?: string;
  reviewedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  reviewedAt?: string;
  paymentId?: string;
  escrowTransactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRequestsResponse {
  success: boolean;
  data: PaymentRequest[];
  message?: string;
}

export interface PaymentRequestResponse {
  success: boolean;
  data: PaymentRequest;
  message?: string;
}

export interface ApproveRejectResponse {
  success: boolean;
  message: string;
  data: {
    paymentRequest: PaymentRequest;
    payment?: any;
  };
}

export interface PaymentRequestFilters {
  startDate?: string;
  endDate?: string;
  tenantId?: string;
  landlordId?: string;
  status?: string;
  paymentMethod?: string;
}

export function usePaymentRequestsService() {
  const fetchWithAuth = useFetchWithAuth();

  const getPendingRequests = useCallback(async (filters?: PaymentRequestFilters): Promise<PaymentRequestsResponse | null> => {
    try {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.tenantId) params.append('tenantId', filters.tenantId);
      if (filters?.landlordId) params.append('landlordId', filters.landlordId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.paymentMethod) params.append('paymentMethod', filters.paymentMethod);

      const queryString = params.toString();
      const url = `${API_CONFIG.baseUrl}/payment-requests/pending${queryString ? `?${queryString}` : ''}`;

      const res = await fetchWithAuth(url, {
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch payment requests: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      return data;
    } catch (e) {
      if (e instanceof Error && e.message.includes('Authentication is still loading')) {
        return null;
      }
      console.error('Error fetching payment requests:', e);
      return null;
    }
  }, [fetchWithAuth]);

  const getRequestById = useCallback(async (id: string): Promise<PaymentRequestResponse | null> => {
    try {
      const res = await fetchWithAuth(`${API_CONFIG.baseUrl}/payment-requests/${id}`, {
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch payment request: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      return data;
    } catch (e) {
      if (e instanceof Error && e.message.includes('Authentication is still loading')) {
        return null;
      }
      console.error('Error fetching payment request:', e);
      return null;
    }
  }, [fetchWithAuth]);

  const approveRequest = useCallback(async (id: string): Promise<ApproveRejectResponse | null> => {
    try {
      const res = await fetchWithAuth(`${API_CONFIG.baseUrl}/payment-requests/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to approve payment request: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      return data;
    } catch (e) {
      if (e instanceof Error && e.message.includes('Authentication is still loading')) {
        return null;
      }
      console.error('Error approving payment request:', e);
      throw e;
    }
  }, [fetchWithAuth]);

  const rejectRequest = useCallback(async (id: string, rejectionReason: string): Promise<ApproveRejectResponse | null> => {
    try {
      if (!rejectionReason || !rejectionReason.trim()) {
        throw new Error('Rejection reason is required');
      }

      const res = await fetchWithAuth(`${API_CONFIG.baseUrl}/payment-requests/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ rejectionReason }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to reject payment request: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      return data;
    } catch (e) {
      if (e instanceof Error && e.message.includes('Authentication is still loading')) {
        return null;
      }
      console.error('Error rejecting payment request:', e);
      throw e;
    }
  }, [fetchWithAuth]);

  return useMemo(() => ({
    getPendingRequests,
    getRequestById,
    approveRequest,
    rejectRequest,
  }), [getPendingRequests, getRequestById, approveRequest, rejectRequest]);
}





