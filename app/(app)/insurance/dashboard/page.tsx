// @ts-nocheck
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { useInsuranceAdminService } from '@/app/services/insurance-admin/insurance-admin.service';
import type {
  InsurancePhase,
  InsurancePoliciesStatusParam,
  InsurancePolicyListItem,
  InsuranceSummaryData,
} from '@/app/services/insurance-admin/insurance-admin.types';
import { formatUsd } from '@/app/lib/formatMoney';
import { Building2, ChevronLeft, ChevronRight, FileText, Loader2, RefreshCw, Search, Shield } from 'lucide-react';

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function phaseLabel(phase: InsurancePhase): string {
  switch (phase) {
    case 'in_force':
      return 'In force';
    case 'awaiting_signature':
      return 'Awaiting signature';
    case 'ended':
      return 'Ended';
    default:
      return phase;
  }
}

function phaseBadgeClass(phase: InsurancePhase): string {
  switch (phase) {
    case 'in_force':
      return 'bg-emerald-100 text-emerald-800';
    case 'awaiting_signature':
      return 'bg-amber-100 text-amber-800';
    case 'ended':
      return 'bg-gray-200 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

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

export default function InsurancePartnerDashboardPage() {
  const { loading: authLoading, user: authUser } = useAuth();
  const { getSummary, getPolicies } = useInsuranceAdminService();

  const [summary, setSummary] = useState<InsuranceSummaryData | null>(null);
  const [policies, setPolicies] = useState<InsurancePolicyListItem[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState<InsurancePoliciesStatusParam>('all');
  const [search, setSearch] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [policiesLoading, setPoliciesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);
      setError(null);
      const res = await getSummary();
      if (res.success && res.data) setSummary(res.data);
      else setError(res.message || 'Could not load summary');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load summary');
    } finally {
      setSummaryLoading(false);
    }
  }, [getSummary]);

  const loadPolicies = useCallback(async () => {
    try {
      setPoliciesLoading(true);
      setError(null);
      const res = await getPolicies({
        page,
        limit,
        status: statusFilter,
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
      setPoliciesLoading(false);
    }
  }, [getPolicies, page, limit, statusFilter]);

  useEffect(() => {
    if (authLoading || !authUser) return;
    loadSummary();
  }, [authLoading, authUser, loadSummary]);

  useEffect(() => {
    if (authLoading || !authUser) return;
    loadPolicies();
  }, [authLoading, authUser, loadPolicies]);

  const filteredPolicies = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return policies;
    return policies.filter((p) => {
      const title = (p.propertyTitle || '').toLowerCase();
      const city = (p.address?.city || '').toLowerCase();
      const landlord = `${p.policyholder?.firstName || ''} ${p.policyholder?.lastName || ''}`.toLowerCase();
      const email = (p.policyholder?.email || '').toLowerCase();
      return title.includes(q) || city.includes(q) || landlord.includes(q) || email.includes(q);
    });
  }, [policies, search]);

  const summaryCards = summary
    ? [
        {
          label: 'Properties with insurance',
          value: summary.totalPropertiesWithInsurance,
          sub: 'Enabled on listing',
          className: 'from-slate-50 to-slate-100 border-slate-200',
          accent: 'text-slate-700',
          icon: Building2,
        },
        {
          label: 'In force',
          value: summary.inForce,
          sub: 'Active cover',
          className: 'from-emerald-50 to-emerald-100 border-emerald-200',
          accent: 'text-emerald-700',
          icon: Shield,
        },
        {
          label: 'Awaiting signature',
          value: summary.awaitingSignature,
          sub: 'No executed lease yet',
          className: 'from-amber-50 to-amber-100 border-amber-200',
          accent: 'text-amber-700',
          icon: FileText,
        },
        {
          label: 'Ended',
          value: summary.ended,
          sub: 'Expired / terminated',
          className: 'from-gray-50 to-gray-100 border-gray-200',
          accent: 'text-gray-700',
          icon: FileText,
        },
      ]
    : [];

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
          <h1 className="text-2xl font-semibold text-gray-900">Insurance dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Policies for rental properties with insurance enabled</p>
        </div>
        <button
          type="button"
          onClick={() => {
            loadSummary();
            loadPolicies();
          }}
          disabled={summaryLoading || policiesLoading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${summaryLoading || policiesLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mx-6 mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="flex-1 px-6 pb-6 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {summaryLoading
            ? [1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 rounded-2xl bg-gray-200 animate-pulse" />
              ))
            : summaryCards.map((m) => {
                const Icon = m.icon;
                return (
                  <div
                    key={m.label}
                    className={`bg-gradient-to-br ${m.className} rounded-2xl border p-6 hover:shadow-md transition-shadow`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className={`text-sm font-medium ${m.accent}`}>{m.label}</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{m.value}</p>
                        <p className="text-sm text-gray-600 mt-2">{m.sub}</p>
                      </div>
                      <div className="w-12 h-12 bg-white/80 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                        <Icon className={`w-6 h-6 ${m.accent}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
        </div>

        {summary?.rules && (
          <div className="mb-6 rounded-xl border border-gray-200 bg-white px-4 py-3 text-xs text-gray-600">
            <span className="font-semibold text-gray-800">Program rules: </span>
            Cover starts when {String(summary.rules.coverStartsAt || '').replace(/_/g, ' ')} · Scope:{' '}
            {String(summary.rules.policyScope || '').replace(/_/g, ' ')} · Policyholder:{' '}
            {String(summary.rules.policyholder || '').replace(/_/g, ' ')}.
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Policies</h2>
              <p className="text-sm text-gray-500">Policyholder is the landlord on each row (per program rules).</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search this page (title, city, landlord…)"
                  className="w-full sm:w-64 pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as InsurancePoliciesStatusParam);
                  setPage(1);
                }}
                className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-emerald-500/30"
              >
                <option value="all">All phases</option>
                <option value="in_force">In force</option>
                <option value="awaiting_signature">Awaiting signature</option>
                <option value="ended">Ended</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            {policiesLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              </div>
            ) : (
              <table className="w-full text-sm min-w-[900px]">
                <thead className="bg-gray-50 text-left text-gray-600">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 font-medium">Property</th>
                    <th className="px-4 sm:px-6 py-3 font-medium">City</th>
                    <th className="px-4 sm:px-6 py-3 font-medium">Policyholder (landlord)</th>
                    <th className="px-4 sm:px-6 py-3 font-medium">Coverage</th>
                    <th className="px-4 sm:px-6 py-3 font-medium text-right">Premium / mo</th>
                    <th className="px-4 sm:px-6 py-3 font-medium">Phase</th>
                    <th className="px-4 sm:px-6 py-3 font-medium">Cover start</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPolicies.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        No policies on this page{search ? ' match your search' : ''}.
                      </td>
                    </tr>
                  ) : (
                    filteredPolicies.map((row) => (
                      <tr key={row.propertyId} className="hover:bg-gray-50/80">
                        <td className="px-4 sm:px-6 py-3">
                          <Link
                            href={`/insurance/policies/${row.propertyId}`}
                            className="font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
                          >
                            {row.propertyTitle || 'Untitled'}
                          </Link>
                          {row.policyholder?.type && (
                            <p className="text-xs text-gray-500 mt-0.5 capitalize">{row.policyholder.type}</p>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-gray-700">{row.address?.city || '—'}</td>
                        <td className="px-4 sm:px-6 py-3 text-gray-700 max-w-[240px]">
                          <div>
                            {[row.policyholder?.firstName, row.policyholder?.lastName].filter(Boolean).join(' ') ||
                              '—'}
                          </div>
                          {row.policyholder?.email && (
                            <div className="text-xs text-gray-500 truncate">{row.policyholder.email}</div>
                          )}
                          {row.policyholder?.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2" title={row.policyholder.description}>
                              {row.policyholder.description}
                            </p>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-gray-700 text-xs">{coverageTierLabel(row.insurance)}</td>
                        <td className="px-4 sm:px-6 py-3 text-right font-medium text-gray-900">
                          {formatUsd(row.insurance?.monthlyPremium)}
                        </td>
                        <td className="px-4 sm:px-6 py-3">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${phaseBadgeClass(row.phase)}`}>
                            {phaseLabel(row.phase)}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-gray-700">
                          {row.phase === 'in_force' && row.coverStartDate ? (
                            formatDate(row.coverStartDate)
                          ) : row.phase === 'awaiting_signature' || !row.coverStartDate ? (
                            <span className="text-amber-700 text-xs">Awaiting fully signed agreement</span>
                          ) : (
                            formatDate(row.coverStartDate)
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          {!policiesLoading && totalPages > 0 && (
            <div className="px-4 sm:px-6 py-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-600">
              <span>
                Page {page} of {totalPages} · {total} total
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || policiesLoading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages || policiesLoading}
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
