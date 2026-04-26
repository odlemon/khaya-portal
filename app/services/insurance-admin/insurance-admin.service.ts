// @ts-nocheck
'use client';

import { useCallback } from 'react';
import { API_CONFIG } from '../../config/api.config';
import { useFetchWithAuth } from '../../context/fetchWithAuth';
import { throwIfPartnerForbidden } from '../../lib/partnerApi';
import type {
  InsurancePoliciesData,
  InsurancePoliciesStatusParam,
  InsurancePolicyDetail,
  InsuranceSummaryData,
} from './insurance-admin.types';

export function useInsuranceAdminService() {
  const fetchWithAuth = useFetchWithAuth();
  const base = `${API_CONFIG.baseUrl}/insurance-admin`;

  const getSummary = useCallback(async (): Promise<{ success: boolean; data: InsuranceSummaryData; message?: string }> => {
    const res = await fetchWithAuth(`${base}/summary`);
    const json = await res.json().catch(() => ({}));
    throwIfPartnerForbidden(res, json);
    if (!res.ok) {
      throw new Error(json.message || `Summary request failed (${res.status})`);
    }
    return json;
  }, [fetchWithAuth, base]);

  const getPolicies = useCallback(
    async (params: {
      page?: number;
      limit?: number;
      status?: InsurancePoliciesStatusParam;
    }): Promise<{ success: boolean; data: InsurancePoliciesData; message?: string }> => {
      const page = params.page ?? 1;
      const limit = Math.min(params.limit ?? 20, 100);
      const status = params.status ?? 'all';
      const q = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        status,
      });
      const res = await fetchWithAuth(`${base}/policies?${q.toString()}`);
      const json = await res.json().catch(() => ({}));
      throwIfPartnerForbidden(res, json);
      if (!res.ok) {
        throw new Error(json.message || `Policies request failed (${res.status})`);
      }
      return json;
    },
    [fetchWithAuth, base]
  );

  const getPolicyByPropertyId = useCallback(
    async (propertyId: string): Promise<{ success: boolean; data: InsurancePolicyDetail; message?: string }> => {
      const res = await fetchWithAuth(`${base}/policies/property/${encodeURIComponent(propertyId)}`);
      const json = await res.json().catch(() => ({}));
      throwIfPartnerForbidden(res, json);
      if (!res.ok) {
        throw new Error(json.message || `Policy detail failed (${res.status})`);
      }
      return json;
    },
    [fetchWithAuth, base]
  );

  return { getSummary, getPolicies, getPolicyByPropertyId };
}
