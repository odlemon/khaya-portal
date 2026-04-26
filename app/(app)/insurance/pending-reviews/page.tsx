// @ts-nocheck
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { useInsuranceAdminService } from '@/app/services/insurance-admin/insurance-admin.service';
import type { InsurancePolicyListItem } from '@/app/services/insurance-admin/insurance-admin.types';
import { formatUsd } from '@/app/lib/formatMoney';
import { ChevronLeft, ChevronRight, Loader2, RefreshCw, Search } from 'lucide-react';

function titleCaseToken(raw: string): string {
  const spaced = raw.replace(/_/g, ' ');
  return spaced.replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function coverageTierLabel(insurance?: InsurancePolicyListItem['insurance']): string {
  if (!insurance) return '—';
  const parts = [insurance.coverageType, insurance.riskCategory].filter(Boolean);
  if (parts.length === 0) return '—';
  return parts.map((p) => titleCaseToken(String(p))).join(' · ');
}

/** Short id for display (backend uses full ObjectId). */
function refLabel(propertyId: string): string {
  if (!propertyId || propertyId.length < 8) return propertyId || '—';
  return `…${propertyId.slice(-8)}`;
}

export default function InsurancePendingReviewsPage() {
  const { loading: authLoading, user: authUser } = useAuth();
  const { getPolicies } = useInsuranceAdminService();

  const [policies, setPolicies] = useState<InsurancePolicyListItem[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getPolicies({
        page,
        limit,
        status: 'awaiting_signature',
      });
      if (res.success && res.data) {
        setPolicies(res.data.policies || []);
        const p = res.data.pagination;
        if (p) {
          setTotal(p.total ?? 0);
          setTotalPages(p.totalPages ?? 0);
        }
      } else {
        setError(res.message || 'Could not load policies');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load policies');
    } finally {
      setLoading(false);
    }
  }, [getPolicies, page, limit]);

  useEffect(() => {
    if (authLoading || !authUser) return;
    load();
  }, [authLoading, authUser, load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return policies;
    return policies.filter((row) => {
      const title = (row.propertyTitle || '').toLowerCase();
      const city = (row.address?.city || '').toLowerCase();
      const landlord = `${row.policyholder?.firstName || ''} ${row.policyholder?.lastName || ''}`.toLowerCase();
      const tenant = `${row.agreement?.tenant?.firstName || ''} ${row.agreement?.tenant?.lastName || ''}`.toLowerCase();
      const id = (row.propertyId || '').toLowerCase();
      return title.includes(q) || city.includes(q) || landlord.includes(q) || tenant.includes(q) || id.includes(q);
    });
  }, [policies, search]);

  if (authLoading || !authUser) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-h-screen">
      <div className="px-6 py-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Pending reviews</h1>
          <p className="text-sm text-gray-500 mt-1">
            Properties with insurance enabled that are still waiting on a fully signed tenancy agreement (same data as
            dashboard &quot;Awaiting signature&quot;).
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
        <div className="mx-6 mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="flex-1 px-6 pb-6">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search this page…"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              </div>
            ) : (
              <table className="w-full text-sm min-w-[880px]">
                <thead className="bg-gray-50 text-left text-gray-600">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 font-medium">Reference</th>
                    <th className="px-4 sm:px-6 py-3 font-medium">Property</th>
                    <th className="px-4 sm:px-6 py-3 font-medium">Tenant</th>
                    <th className="px-4 sm:px-6 py-3 font-medium">Landlord</th>
                    <th className="px-4 sm:px-6 py-3 font-medium">Cover type</th>
                    <th className="px-4 sm:px-6 py-3 font-medium text-right">Premium / mo</th>
                    <th className="px-4 sm:px-6 py-3 font-medium">Agreement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500 text-sm">
                        {policies.length === 0
                          ? 'No policies awaiting signature.'
                          : 'No rows match your search on this page.'}{' '}
                        <Link href="/insurance/dashboard" className="text-emerald-700 font-medium hover:underline">
                          All phases on dashboard
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((row) => (
                      <tr key={row.propertyId} className="hover:bg-gray-50/80">
                        <td className="px-4 sm:px-6 py-3 font-mono text-xs text-gray-600">{refLabel(row.propertyId)}</td>
                        <td className="px-4 sm:px-6 py-3">
                          <Link
                            href={`/insurance/policies/${row.propertyId}`}
                            className="font-medium text-emerald-700 hover:underline"
                          >
                            {row.propertyTitle || 'Untitled'}
                          </Link>
                          <div className="text-xs text-gray-500">{row.address?.city || '—'}</div>
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-gray-700">
                          {[row.agreement?.tenant?.firstName, row.agreement?.tenant?.lastName].filter(Boolean).join(' ') ||
                            '—'}
                          {row.agreement?.tenant?.email && (
                            <div className="text-xs text-gray-500 truncate max-w-[160px]">{row.agreement.tenant.email}</div>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-gray-700">
                          {[row.policyholder?.firstName, row.policyholder?.lastName].filter(Boolean).join(' ') || '—'}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-xs text-gray-700">{coverageTierLabel(row.insurance)}</td>
                        <td className="px-4 sm:px-6 py-3 text-right font-medium text-gray-900">
                          {formatUsd(row.insurance?.monthlyPremium)}
                        </td>
                        <td className="px-4 sm:px-6 py-3">
                          <span className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1 inline-block">
                            {row.agreement?.status
                              ? titleCaseToken(String(row.agreement.status).replace(/_/g, ' '))
                              : 'No agreement'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          {!loading && totalPages > 0 && (
            <div className="px-4 sm:px-6 py-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-600">
              <span>
                Page {page} of {totalPages} · {total} awaiting signature
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
