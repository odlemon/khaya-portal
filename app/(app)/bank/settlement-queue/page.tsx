// @ts-nocheck
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { useBankAdminService } from '@/app/services/bank-admin/bank-admin.service';
import type { BankPayoutListItem, BankPayoutStatusFilter } from '@/app/services/bank-admin/bank-admin.types';
import { formatUsd } from '@/app/lib/formatMoney';
import { ChevronLeft, ChevronRight, Loader2, RefreshCw, Search } from 'lucide-react';

function payoutId(p: BankPayoutListItem): string {
  return p.payoutId || p._id || '';
}

function statusBadge(status: string | undefined) {
  const s = (status || '').toLowerCase();
  if (s === 'completed') return 'bg-emerald-100 text-emerald-800';
  if (s === 'pending' || s === 'processing') return 'bg-amber-100 text-amber-800';
  if (s === 'failed') return 'bg-red-100 text-red-800';
  if (s === 'cancelled') return 'bg-gray-200 text-gray-800';
  return 'bg-gray-100 text-gray-800';
}

export default function BankSettlementQueuePage() {
  const { loading: authLoading, user: authUser } = useAuth();
  const { getPayouts } = useBankAdminService();

  const [payouts, setPayouts] = useState<BankPayoutListItem[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState<BankPayoutStatusFilter>('pending');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getPayouts({ page, limit, status: statusFilter });
      if (res.success && res.data) {
        setPayouts(res.data.payouts || []);
        const p = res.data.pagination;
        if (p) {
          setTotal(p.total ?? 0);
          setTotalPages(p.totalPages ?? 0);
        }
      } else {
        setError(res.message || 'Could not load payouts');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load payouts');
    } finally {
      setLoading(false);
    }
  }, [getPayouts, page, limit, statusFilter]);

  useEffect(() => {
    if (authLoading || !authUser) return;
    load();
  }, [authLoading, authUser, load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return payouts;
    return payouts.filter((row) => {
      const id = payoutId(row).toLowerCase();
      const landlord = `${row.landlord?.firstName || ''} ${row.landlord?.lastName || ''}`.toLowerCase();
      const email = (row.landlord?.email || '').toLowerCase();
      return id.includes(q) || landlord.includes(q) || email.includes(q);
    });
  }, [payouts, search]);

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
          <h1 className="text-2xl font-semibold text-gray-900">Settlement queue</h1>
          <p className="text-sm text-gray-500 mt-1">
            Landlord payouts after Khayalami distribution. Filter pending/processing, then open a payout to mark paid
            after external transfer.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/bank/dashboard"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2"
          >
            Dashboard
          </Link>
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
      </div>

      {error && (
        <div className="mx-6 mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      <div className="flex-1 px-6 pb-6">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as BankPayoutStatusFilter);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-slate-400/30 w-full sm:w-auto"
            >
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="all">All</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search id, landlord…"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-slate-400/30"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
              </div>
            ) : (
              <table className="w-full text-sm min-w-[960px]">
                <thead className="bg-gray-50 text-left text-gray-600">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 font-medium">Payout</th>
                    <th className="px-4 sm:px-6 py-3 font-medium">Landlord</th>
                    <th className="px-4 sm:px-6 py-3 font-medium">Method</th>
                    <th className="px-4 sm:px-6 py-3 font-medium text-right">Amount</th>
                    <th className="px-4 sm:px-6 py-3 font-medium text-center">Escrow lines</th>
                    <th className="px-4 sm:px-6 py-3 font-medium">Status</th>
                    <th className="px-4 sm:px-6 py-3 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500 text-sm">
                        {payouts.length === 0 ? 'No payouts for this filter.' : 'No rows match your search.'}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((row) => {
                      const id = payoutId(row);
                      return (
                        <tr key={id} className="hover:bg-gray-50/80">
                          <td className="px-4 sm:px-6 py-3">
                            {id ? (
                              <Link
                                href={`/bank/payouts/${id}`}
                                className="font-mono text-xs text-slate-700 hover:text-slate-900 hover:underline"
                              >
                                {id.length > 14 ? `${id.slice(0, 6)}…${id.slice(-6)}` : id}
                              </Link>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-4 sm:px-6 py-3 text-gray-800">
                            {[row.landlord?.firstName, row.landlord?.lastName].filter(Boolean).join(' ') || '—'}
                            {row.landlord?.email && (
                              <div className="text-xs text-gray-500 truncate max-w-[200px]">{row.landlord.email}</div>
                            )}
                          </td>
                          <td className="px-4 sm:px-6 py-3 text-gray-600 capitalize">
                            {(row.payoutMethod || '—').replace(/_/g, ' ')}
                          </td>
                          <td className="px-4 sm:px-6 py-3 text-right font-medium text-gray-900">
                            {formatUsd(row.amount)}
                          </td>
                          <td className="px-4 sm:px-6 py-3 text-center tabular-nums">{row.escrowTransactionCount ?? '—'}</td>
                          <td className="px-4 sm:px-6 py-3">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusBadge(row.status)}`}>
                              {(row.status || '—').replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-3 text-gray-500 text-xs whitespace-nowrap">
                            {row.createdAt ? new Date(row.createdAt).toLocaleString('en-US') : '—'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>

          {!loading && totalPages > 0 && (
            <div className="px-4 sm:px-6 py-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-600">
              <span>
                Page {page} of {totalPages} · {total} total
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
