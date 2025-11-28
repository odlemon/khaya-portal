// @ts-nocheck
'use client';
import { API_CONFIG } from '../../config/api.config';
import { useFetchWithAuth } from '../../context/fetchWithAuth';
import { useCallback, useMemo } from 'react';

export interface EscrowAccount {
  totalHeld: number;
  totalDistributed: number;
  totalLandlordPayouts: number;
  totalKhayalamiPayouts: number;
  pendingTransactions: number;
  distributedTransactions: number;
  autoDistributionEnabled: boolean;
  distributionDay: number;
  lastDistributionDate: string | null;
  lastDistributionAmount: number;
  lastDistributionMethod: 'scheduled' | 'manual';
}

export interface EscrowSummary {
  account: EscrowAccount;
  totalHeld: number;
  pendingLandlordPayouts: number;
  pendingKhayalamiPayouts: number;
  transactionCounts: {
    pending: number;
    held: number;
    distributed: number;
  };
}

export interface EscrowSummaryResponse {
  success: boolean;
  message: string;
  data: EscrowSummary;
}

export interface EscrowTransaction {
  _id: string;
  paymentId: string;
  rentalId: string;
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
  landlordId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  tenantId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  totalAmount: number;
  landlordAmount: number;
  khayalamiAmount: number;
  paymentMethod: 'in_app' | 'cash';
  status: 'pending' | 'held' | 'distributed' | 'cancelled';
  createdAt: string;
  distributedAt?: string;
}

export interface PendingDistribution {
  transactions: EscrowTransaction[];
  summary: {
    count: number;
    totalAmount: number;
    totalLandlordAmount: number;
    totalKhayalamiAmount: number;
  };
}

export interface PendingDistributionResponse {
  success: boolean;
  data: PendingDistribution;
}

export interface DistributionSummaryResponse {
  success: boolean;
  data: {
    account: EscrowAccount;
    totalHeld: number;
    pendingLandlordPayouts: number;
    pendingKhayalamiPayouts: number;
    transactionCounts: {
      pending: number;
      held: number;
      distributed: number;
    };
  };
}

export interface DistributionStats {
  totalDistributed: number;
  landlordPayouts: number;
  khayalamiPayouts: number;
  transactionCount: number;
  averageTransactionAmount: number;
  distributionBreakdown: {
    byMonth: Array<{
      month: string;
      total: number;
      landlord: number;
      khayalami: number;
    }>;
  };
}

export interface DistributionStatsResponse {
  success: boolean;
  message: string;
  data: DistributionStats;
}

export interface ManualDistributionParams {
  landlordId?: string;
  startDate?: string;
  endDate?: string;
}

export interface ManualDistributionResponse {
  success: boolean;
  message: string;
  data: {
    totalDistributed: number;
    landlordPayouts: number;
    khayalamiPayouts: number;
    payoutIds: string[];
  };
}

export interface EscrowSettings {
  autoDistributionEnabled: boolean;
  distributionDay: number;
}

export function useEscrowService() {
  const fetchWithAuth = useFetchWithAuth();

  const getEscrowSummary = useCallback(async (): Promise<EscrowSummaryResponse | null> => {
    try {
      const res = await fetchWithAuth(`${API_CONFIG.baseUrl}/escrow/summary`, {
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch escrow summary: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      return data;
    } catch (e) {
      if (e instanceof Error && e.message.includes('Authentication is still loading')) {
        return null;
      }
      console.error('Error fetching escrow summary:', e);
      return null;
    }
  }, [fetchWithAuth]);

  const getDistributionStats = useCallback(async (startDate?: string, endDate?: string): Promise<DistributionStatsResponse | null> => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const queryString = params.toString();
      const url = `${API_CONFIG.baseUrl}/escrow/stats${queryString ? `?${queryString}` : ''}`;

      const res = await fetchWithAuth(url, {
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch distribution stats: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      return data;
    } catch (e) {
      if (e instanceof Error && e.message.includes('Authentication is still loading')) {
        return null;
      }
      console.error('Error fetching distribution stats:', e);
      return null;
    }
  }, [fetchWithAuth]);

  const getPendingDistribution = useCallback(async (params?: ManualDistributionParams): Promise<PendingDistributionResponse | null> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.landlordId) queryParams.append('landlordId', params.landlordId);
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);

      const queryString = queryParams.toString();
      const url = `${API_CONFIG.baseUrl}/distribution/pending${queryString ? `?${queryString}` : ''}`;

      const res = await fetchWithAuth(url, {
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch pending distribution: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      return data;
    } catch (e) {
      if (e instanceof Error && e.message.includes('Authentication is still loading')) {
        return null;
      }
      console.error('Error fetching pending distribution:', e);
      return null;
    }
  }, [fetchWithAuth]);

  const getDistributionSummary = useCallback(async (): Promise<DistributionSummaryResponse | null> => {
    try {
      const res = await fetchWithAuth(`${API_CONFIG.baseUrl}/distribution/summary`, {
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch distribution summary: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      return data;
    } catch (e) {
      if (e instanceof Error && e.message.includes('Authentication is still loading')) {
        return null;
      }
      console.error('Error fetching distribution summary:', e);
      return null;
    }
  }, [fetchWithAuth]);

  const triggerManualDistribution = useCallback(async (params?: ManualDistributionParams): Promise<ManualDistributionResponse | null> => {
    try {
      const res = await fetchWithAuth(`${API_CONFIG.baseUrl}/distribution/manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(params || {}),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to trigger distribution: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      return data;
    } catch (e) {
      if (e instanceof Error && e.message.includes('Authentication is still loading')) {
        return null;
      }
      console.error('Error triggering manual distribution:', e);
      throw e;
    }
  }, [fetchWithAuth]);

  const triggerEscrowDistribution = useCallback(async (params?: ManualDistributionParams): Promise<ManualDistributionResponse | null> => {
    try {
      const res = await fetchWithAuth(`${API_CONFIG.baseUrl}/escrow/distribute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(params || {}),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to trigger escrow distribution: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      return data;
    } catch (e) {
      if (e instanceof Error && e.message.includes('Authentication is still loading')) {
        return null;
      }
      console.error('Error triggering escrow distribution:', e);
      throw e;
    }
  }, [fetchWithAuth]);

  const getEscrowTransactions = useCallback(async (filters?: { status?: string; transactionType?: string; startDate?: string; endDate?: string }): Promise<any | null> => {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.transactionType) params.append('transactionType', filters.transactionType);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const queryString = params.toString();
      const url = `${API_CONFIG.baseUrl}/transactions${queryString ? `?${queryString}` : ''}`;

      const res = await fetchWithAuth(url, {
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch transactions: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      return data;
    } catch (e) {
      if (e instanceof Error && e.message.includes('Authentication is still loading')) {
        return null;
      }
      console.error('Error fetching transactions:', e);
      return null;
    }
  }, [fetchWithAuth]);

  const getTransactionsSummary = useCallback(async (): Promise<any | null> => {
    try {
      const res = await fetchWithAuth(`${API_CONFIG.baseUrl}/transactions/summary`, {
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch transactions summary: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      return data;
    } catch (e) {
      if (e instanceof Error && e.message.includes('Authentication is still loading')) {
        return null;
      }
      console.error('Error fetching transactions summary:', e);
      return null;
    }
  }, [fetchWithAuth]);

  return useMemo(() => ({
    getEscrowSummary,
    getDistributionStats,
    getPendingDistribution,
    getDistributionSummary,
    triggerManualDistribution,
    triggerEscrowDistribution,
    getEscrowTransactions,
    getTransactionsSummary,
  }), [getEscrowSummary, getDistributionStats, getPendingDistribution, getDistributionSummary, triggerManualDistribution, triggerEscrowDistribution, getEscrowTransactions, getTransactionsSummary]);
}
