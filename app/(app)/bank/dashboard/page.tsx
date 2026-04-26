// @ts-nocheck
'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { useBankAdminService } from '@/app/services/bank-admin/bank-admin.service';
import type { BankAdminSummaryData, HeldEscrowLandlord } from '@/app/services/bank-admin/bank-admin.types';
import { formatUsd } from '@/app/lib/formatMoney';
import { Landmark, Loader2, RefreshCw, Wallet, ArrowRightLeft, ListChecks, Info } from 'lucide-react';

function normalizeHeldList(data: unknown): HeldEscrowLandlord[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as HeldEscrowLandlord[];
  const o = data as { items?: HeldEscrowLandlord[]; landlords?: HeldEscrowLandlord[] };
  return o.items || o.landlords || [];
}

function landlordRowName(row: HeldEscrowLandlord): string {
  const u = row.landlord || row.user;
  if (!u) return '—';
  return [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || '—';
}

function landlordBankHints(row: HeldEscrowLandlord): string {
  const u = row.landlord || row.user;
  if (!u) return '—';
  const parts = [u.bankName, u.bankAccount].filter(Boolean);
  return parts.length ? parts.join(' · ') : '—';
}

/** API may use { count, sum } or { escrowTransactionCount, totalLandlordAmount }. */
function parsePayoutPipelineStats(raw: unknown): { count: number; sum: number | undefined } {
  if (raw == null || typeof raw !== 'object') return { count: 0, sum: undefined };
  const o = raw as Record<string, unknown>;
  const count =
    typeof o.count === 'number'
      ? o.count
      : typeof o.escrowTransactionCount === 'number'
        ? o.escrowTransactionCount
        : 0;
  const sum =
    typeof o.sum === 'number'
      ? o.sum
      : typeof o.totalLandlordAmount === 'number'
        ? o.totalLandlordAmount
        : undefined;
  return { count, sum };
}

/** Some responses use a number; others use { escrowTransactionCount, … }. */
function parseDistributedRowsAwaiting(raw: unknown): number | null {
  if (raw == null) return null;
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'object') {
    const o = raw as { escrowTransactionCount?: number };
    if (typeof o.escrowTransactionCount === 'number') return o.escrowTransactionCount;
  }
  return null;
}

function asNumber(val: unknown): number | undefined {
  if (typeof val === 'number' && !Number.isNaN(val)) return val;
  return undefined;
}

function formatNoteValue(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return '[object]';
  }
}

export default function BankPartnerDashboardPage() {
  const { loading: authLoading, user: authUser } = useAuth();
  const { getSummary, getHeldByLandlord } = useBankAdminService();

  const [summary, setSummary] = useState<BankAdminSummaryData | null>(null);
  const [held, setHeld] = useState<HeldEscrowLandlord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sumRes = await getSummary();
      if (sumRes.success && sumRes.data) setSummary(sumRes.data);
      else throw new Error(sumRes.message || 'Could not load summary');
    } catch (e) {
      setSummary(null);
      setError(e instanceof Error ? e.message : 'Could not load summary');
    }
    try {
      const heldRes = await getHeldByLandlord();
      if (heldRes.success) setHeld(normalizeHeldList(heldRes.data as unknown));
    } catch {
      setHeld([]);
    } finally {
      setLoading(false);
    }
  }, [getSummary, getHeldByLandlord]);

  useEffect(() => {
    if (authLoading || !authUser) return;
    load();
  }, [authLoading, authUser, load]);

  const esc = summary?.escrow || {};
  const lp = summary?.landlordPayouts || {};
  const awaitingStats = parsePayoutPipelineStats(lp.recordsAwaitingSettlement);
  const settledStats = parsePayoutPipelineStats(lp.settledOutsideSystemLifetime);
  const awaitingRows = parseDistributedRowsAwaiting(lp.distributedEscrowRowsAwaitingBankConfirmation);

  const notes = summary?.notes;
  const notesEntries =
    notes && typeof notes === 'object' && !Array.isArray(notes)
      ? Object.entries(notes as Record<string, string>)
      : null;

  if (authLoading || !authUser) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-h-screen">
      <div className="px-6 py-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Bank dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Escrow visibility and landlord payout settlement. Khayalami admin runs distribution; you mark payouts paid
            after external transfer.
          </p>
        </div>
        <button
          type="button"
          onClick={() => load()}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mx-6 mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      <div className="flex-1 px-6 pb-6 space-y-6 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total held in escrow</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatUsd(asNumber(esc.totalHeld))}
                    </p>
                  </div>
                  <Wallet className="w-10 h-10 text-slate-500 opacity-80" />
                </div>
              </div>
              <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-800">Landlord share in escrow</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatUsd(asNumber(esc.pendingLandlordShareInEscrow))}
                    </p>
                  </div>
                  <Landmark className="w-10 h-10 text-blue-600 opacity-80" />
                </div>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-900">Awaiting your settlement</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{awaitingStats.count}</p>
                    <p className="text-xs text-amber-900 mt-1">Sum {formatUsd(awaitingStats.sum)}</p>
                  </div>
                  <ListChecks className="w-10 h-10 text-amber-600 opacity-80" />
                </div>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-800">Settled (lifetime)</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{settledStats.count}</p>
                    <p className="text-xs text-emerald-900 mt-1">Sum {formatUsd(settledStats.sum)}</p>
                  </div>
                  <ArrowRightLeft className="w-10 h-10 text-emerald-600 opacity-80" />
                </div>
              </div>
            </div>

            {awaitingRows != null && (
              <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 flex items-start gap-2">
                <Info className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                <span>
                  <span className="font-medium text-gray-900">{awaitingRows}</span> distributed escrow row
                  {awaitingRows !== 1 ? 's' : ''} still waiting for bank confirmation (
                  <code className="text-xs bg-gray-100 px-1 rounded">landlordPayoutStatus: pending</code>).
                </span>
              </div>
            )}

            {notesEntries && notesEntries.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Field guide</h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {notesEntries.map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-gray-500 capitalize">{k.replace(/_/g, ' ')}</dt>
                      <dd className="text-gray-900 break-words">{formatNoteValue(v)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {typeof notes === 'string' && notes.trim() && (
              <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700 whitespace-pre-wrap">
                {notes}
              </div>
            )}

            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Held escrow by landlord</h2>
                  <p className="text-sm text-gray-500">Before platform distribution — funds still held per landlord.</p>
                </div>
                <Link
                  href="/bank/settlement-queue"
                  className="text-sm font-medium text-slate-700 hover:text-slate-900"
                >
                  Settlement queue →
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[720px]">
                  <thead className="bg-gray-50 text-left text-gray-600">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 font-medium">Landlord</th>
                      <th className="px-4 sm:px-6 py-3 font-medium">Email</th>
                      <th className="px-4 sm:px-6 py-3 font-medium">Bank hints</th>
                      <th className="px-4 sm:px-6 py-3 font-medium text-right"># Held txns</th>
                      <th className="px-4 sm:px-6 py-3 font-medium text-right">Landlord amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {held.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                          No held escrow groups returned.
                        </td>
                      </tr>
                    ) : (
                      held.map((row, idx) => {
                        const u = row.landlord || row.user;
                        return (
                          <tr key={row.landlordId || idx} className="hover:bg-gray-50/80">
                            <td className="px-4 sm:px-6 py-3 font-medium text-gray-900">{landlordRowName(row)}</td>
                            <td className="px-4 sm:px-6 py-3 text-gray-700">{u?.email || '—'}</td>
                            <td className="px-4 sm:px-6 py-3 text-gray-600 text-xs">{landlordBankHints(row)}</td>
                            <td className="px-4 sm:px-6 py-3 text-right tabular-nums">
                              {typeof row.heldTransactionCount === 'number' ? row.heldTransactionCount : '—'}
                            </td>
                            <td className="px-4 sm:px-6 py-3 text-right font-medium text-gray-900">
                              {formatUsd(asNumber(row.totalLandlordAmount))}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
