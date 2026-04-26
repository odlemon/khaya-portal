// @ts-nocheck
'use client';

import { useCallback } from 'react';
import { API_CONFIG } from '../../config/api.config';
import { useFetchWithAuth } from '../../context/fetchWithAuth';
import { throwIfPartnerForbidden } from '../../lib/partnerApi';
import type {
  BankAdminSummaryData,
  BankHeldEscrowData,
  BankPayoutDetail,
  BankPayoutStatusFilter,
  BankPayoutsListData,
  MarkPayoutPaidResponse,
} from './bank-admin.types';

export function useBankAdminService() {
  const fetchWithAuth = useFetchWithAuth();
  const base = `${API_CONFIG.baseUrl}/bank-admin`;

  const getSummary = useCallback(async (): Promise<{ success: boolean; data?: BankAdminSummaryData; message?: string }> => {
    const res = await fetchWithAuth(`${base}/summary`);
    const json = await res.json().catch(() => ({}));
    throwIfPartnerForbidden(res, json);
    if (!res.ok) throw new Error(json.message || `Summary failed (${res.status})`);
    return json;
  }, [fetchWithAuth, base]);

  const getHeldByLandlord = useCallback(async (): Promise<{ success: boolean; data?: BankHeldEscrowData; message?: string }> => {
    const res = await fetchWithAuth(`${base}/escrow/held-by-landlord`);
    const json = await res.json().catch(() => ({}));
    throwIfPartnerForbidden(res, json);
    if (!res.ok) throw new Error(json.message || `Held escrow failed (${res.status})`);
    return json;
  }, [fetchWithAuth, base]);

  const getPayouts = useCallback(
    async (params: {
      page?: number;
      limit?: number;
      status?: BankPayoutStatusFilter;
    }): Promise<{ success: boolean; data?: BankPayoutsListData; message?: string }> => {
      const page = params.page ?? 1;
      const limit = Math.min(params.limit ?? 20, 100);
      const status = params.status ?? 'all';
      const q = new URLSearchParams({ page: String(page), limit: String(limit), status });
      const res = await fetchWithAuth(`${base}/payouts?${q.toString()}`);
      const json = await res.json().catch(() => ({}));
      throwIfPartnerForbidden(res, json);
      if (!res.ok) throw new Error(json.message || `Payouts failed (${res.status})`);
      return json;
    },
    [fetchWithAuth, base]
  );

  const getPayoutById = useCallback(
    async (payoutId: string): Promise<{ success: boolean; data?: BankPayoutDetail; message?: string }> => {
      const res = await fetchWithAuth(`${base}/payouts/${encodeURIComponent(payoutId)}`);
      const json = await res.json().catch(() => ({}));
      throwIfPartnerForbidden(res, json);
      if (!res.ok) throw new Error(json.message || `Payout detail failed (${res.status})`);
      return json;
    },
    [fetchWithAuth, base]
  );

  const markPayoutPaid = useCallback(
    async (
      payoutId: string,
      body: { externalReference?: string; notes?: string }
    ): Promise<MarkPayoutPaidResponse> => {
      const res = await fetchWithAuth(`${base}/payouts/${encodeURIComponent(payoutId)}/mark-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => ({}))) as MarkPayoutPaidResponse;
      throwIfPartnerForbidden(res, json);
      if (!res.ok) {
        const msg = json.message || `Mark paid failed (${res.status})`;
        const err = new Error(msg) as Error & { status?: number };
        err.status = res.status;
        throw err;
      }
      return json;
    },
    [fetchWithAuth, base]
  );

  return { getSummary, getHeldByLandlord, getPayouts, getPayoutById, markPayoutPaid };
}
