// @ts-nocheck
'use client';
import { API_CONFIG } from '../../config/api.config';
import { useFetchWithAuth } from '../../context/fetchWithAuth';
import { useCallback, useMemo } from 'react';

export interface Payment {
  _id: string;
  rentalId: string;
  agreementId: string;
  propertyId: {
    _id: string;
    title: string;
    address: {
      street: string;
      city: string;
      state: string;
      country: string;
      coordinates: {
        latitude: number;
        longitude: number;
      };
    };
  };
  receiptNumber: string;
  paymentType: string;
  amount: number;
  lateFee: number;
  daysLate: number;
  totalAmount: number;
  dueDate: string;
  paymentDate: string;
  verifiedAt: string;
  paymentMethod: 'in_app' | 'cash';
  proofOfPayment: string | null;
  gatewayResponse: {
    provider: string;
    transactionId: string;
    transactionRef: string;
    paidAt: string;
  } | null;
  utilityReceipts: string[];
  status: 'pending' | 'paid' | 'verified' | 'overdue' | 'rejected' | 'disputed' | 'cancelled';
  verifiedBy: string;
  verificationNotes: string | null;
  rejectionReason: string | null;
  landlordId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
  };
  tenantId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
  };
  rentalId: {
    _id: string;
    status: string;
  };
  propertyId: {
    _id: string;
    title: string;
    address: {
      street: string;
      city: string;
      state: string;
      country: string;
      coordinates: {
        latitude: number;
        longitude: number;
      };
    };
  };
  agreementId: {
    _id: string;
    title: string;
  };
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentsResponse {
  success: boolean;
  data: Payment[];
}

export interface Commission {
  _id: string;
  transactionId: string;
  commissionRate: number;
  commissionAmount: number;
  commissionStatus: 'collected' | 'pending' | 'overdue';
  isDebt: boolean;
  debtAmount: number;
  debtPaid: boolean;
  debtPaidAt: string | null;
  collectedAt: string;
  collectedFromPaymentId: string;
}

export interface EarningsPayment extends Payment {
  commission: Commission;
  landlordAmount: number;
  khayalamiCommission: number;
  commissionPercentage: number;
}

export interface EarningsSummary {
  totalPayments: number;
  totalAmount: number;
  totalCommission: number;
  totalLandlordAmount: number;
  averageCommission: number;
  commissionRate: number;
}

export interface EarningsResponse {
  success: boolean;
  data: {
    summary: EarningsSummary;
    payments: EarningsPayment[];
  };
}

export function usePaymentsService() {
  const fetchWithAuth = useFetchWithAuth();

  const getPayments = useCallback(async (): Promise<PaymentsResponse | null> => {
    try {
      const res = await fetchWithAuth(`${API_CONFIG.baseUrl}/payments/admin/all`, {
        headers: {
          'Accept': 'application/json',
        }
      });
      if (!res.ok) throw new Error('Failed to fetch payments');
      const data = await res.json();
      return data;
    } catch (e) {
      // If it's a loading error, return null and let the component handle it
      if (e instanceof Error && e.message.includes('Authentication is still loading')) {
        return null;
      }
      console.error('Error fetching payments:', e);
      return null;
    }
  }, [fetchWithAuth]);

  const getEarnings = useCallback(async (): Promise<EarningsResponse | null> => {
    try {
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const res = await fetchWithAuth(`${API_CONFIG.baseUrl}/payments/admin/earnings?t=${timestamp}`, {
        headers: {
          'Accept': 'application/json',
        }
      });
      
      // Handle 304 Not Modified response
      if (res.status === 304) {
        console.log('Data not modified (304), server indicates cached data is still valid');
        // For 304, we should return the cached data or indicate no change
        // Since we can't access cached data here, we'll return null and let the component handle it
        return null;
      }
      
      if (!res.ok) {
        throw new Error(`Failed to fetch earnings: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      return data;
    } catch (e) {
      // If it's a loading error, return null and let the component handle it
      if (e instanceof Error && e.message.includes('Authentication is still loading')) {
        return null;
      }
      console.error('Error fetching earnings:', e);
      return null;
    }
  }, [fetchWithAuth]);

  return useMemo(() => ({
    getPayments,
    getEarnings,
  }), [getPayments, getEarnings]);
}