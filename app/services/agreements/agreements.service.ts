// @ts-nocheck
'use client';
import { API_CONFIG } from '../../config/api.config';
import { useFetchWithAuth } from '../../context/fetchWithAuth';
import { useCallback, useMemo } from 'react';

export interface Agreement {
  _id: string;
  title: string;
  description: string;
  status: string;
  type: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  depositAmount: number;
  zeroDeposit: boolean;
  terms: string[];
  specialConditions: string[];
  utilitiesIncluded: boolean;
  utilitiesList: string[];
  maintenanceIncluded: boolean;
  attachments: string[];
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
      coordinates: {
        latitude: number;
        longitude: number;
      };
      street: string;
      city: string;
      state: string;
      country: string;
    };
  };
  landlordSignature?: {
    signedAt: string;
    signatureUrl: string;
    ipAddress: string;
  };
  tenantSignature?: {
    signedAt: string;
    signatureUrl: string;
    ipAddress: string;
  };
  paymentSchedule?: {
    frequency: string;
    dueDay: number;
    lateFee: number;
    gracePeriod: number;
  };
  notifications?: {
    rentReminder: boolean;
    maintenanceUpdates: boolean;
    agreementAlerts: boolean;
  };
  khayalamiProtection?: {
    enabled: boolean;
    planType: string;
    monthlyFee: number;
    coverage: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface AgreementsResponse {
  success: boolean;
  data: Agreement[];
}

export function useAgreementsService() {
  const fetchWithAuth = useFetchWithAuth();

  const getAgreements = useCallback(async (): Promise<AgreementsResponse | null> => {
    try {
      const res = await fetchWithAuth(`${API_CONFIG.baseUrl}/agreements/admin/all`, {
        headers: {
          'Accept': 'application/json',
        }
      });
      if (!res.ok) throw new Error('Failed to fetch agreements');
      const data = await res.json();
      return data;
    } catch (e) {
      // If it's a loading error, return null and let the component handle it
      if (e instanceof Error && e.message.includes('Authentication is still loading')) {
        return null;
      }
      console.error('Error fetching agreements:', e);
      return null;
    }
  }, [fetchWithAuth]);

  return useMemo(() => ({
    getAgreements,
  }), [getAgreements]);
}
