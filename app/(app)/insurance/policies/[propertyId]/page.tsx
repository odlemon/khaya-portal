// @ts-nocheck
'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { useInsuranceAdminService } from '@/app/services/insurance-admin/insurance-admin.service';
import type { InsurancePolicyDetail } from '@/app/services/insurance-admin/insurance-admin.types';
import { formatUsd } from '@/app/lib/formatMoney';
import { ArrowLeft, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function phaseLabel(phase: string): string {
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

/** API may return strings or structured objects (e.g. { startsWhen, policyholder }); never pass raw objects to React children. */
function formatCoverRuleEntry(rule: unknown): string {
  if (rule == null) return '';
  if (typeof rule === 'string') return rule;
  if (typeof rule === 'number' || typeof rule === 'boolean') return String(rule);
  if (Array.isArray(rule)) {
    return rule.map(formatCoverRuleEntry).filter(Boolean).join('; ');
  }
  if (typeof rule === 'object') {
    const o = rule as Record<string, unknown>;
    const parts: string[] = [];
    if (o.startsWhen != null) parts.push(`Starts when: ${formatCoverRuleEntry(o.startsWhen)}`);
    if (o.coverStartsAt != null) parts.push(`Cover starts: ${String(o.coverStartsAt)}`);
    if (o.policyScope != null) parts.push(`Scope: ${String(o.policyScope)}`);
    if (o.policyholder != null) {
      const ph = o.policyholder;
      if (typeof ph === 'string') {
        parts.push(`Policyholder: ${ph}`);
      } else if (ph && typeof ph === 'object' && !Array.isArray(ph)) {
        const p = ph as Record<string, unknown>;
        const name = [p.firstName, p.lastName].filter(Boolean).join(' ').trim();
        const line = name || [p.email, p.description].filter(Boolean).join(' · ') || '';
        parts.push(line ? `Policyholder: ${line}` : `Policyholder: ${JSON.stringify(ph)}`);
      } else {
        parts.push(`Policyholder: ${String(ph)}`);
      }
    }
    if (parts.length) return parts.join(' · ');
    try {
      return JSON.stringify(o);
    } catch {
      return '[Cover rule]';
    }
  }
  return String(rule);
}

export default function InsurancePolicyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = typeof params.propertyId === 'string' ? params.propertyId : params.propertyId?.[0];
  const { loading: authLoading, user: authUser } = useAuth();
  const { getPolicyByPropertyId } = useInsuranceAdminService();

  const [data, setData] = useState<InsurancePolicyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const load = useCallback(async () => {
    if (!propertyId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getPolicyByPropertyId(propertyId);
      if (res.success && res.data) setData(res.data);
      else setError(res.message || 'Could not load policy');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load policy');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [propertyId, getPolicyByPropertyId]);

  useEffect(() => {
    if (authLoading || !authUser || !propertyId) return;
    load();
  }, [authLoading, authUser, propertyId, load]);

  if (authLoading || !authUser || (!propertyId && !error)) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!propertyId) {
    return (
      <div className="px-6 py-8">
        <p className="text-red-600">Invalid property.</p>
        <Link href="/insurance/dashboard" className="text-emerald-700 text-sm mt-2 inline-block">
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="px-6 py-8 max-w-lg">
        <button
          type="button"
          onClick={() => router.push('/insurance/dashboard')}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error || 'Not found'}</div>
      </div>
    );
  }

  const primary = data.primaryAgreement ?? data.agreement;
  const holder = data.policyholder;
  const rules = data.coverRules;
  const rulesList: unknown[] = Array.isArray(rules) ? rules : rules != null ? [rules] : [];

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-h-screen">
      <div className="px-6 py-4 border-b border-gray-200 bg-white/80">
        <button
          type="button"
          onClick={() => router.push('/insurance/dashboard')}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">{data.propertyTitle || 'Property'}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {[data.address?.street, data.address?.city, data.address?.country].filter(Boolean).join(' · ') || '—'}
        </p>
      </div>

      <div className="flex-1 px-6 py-6 space-y-6 max-w-5xl">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Phase & cover</h2>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {phaseLabel(data.phase)}
            </span>
            {data.propertyStatus && (
              <span className="text-sm text-gray-600">Listing: {data.propertyStatus}</span>
            )}
          </div>
          {data.phase === 'in_force' && data.coverStartDate ? (
            <p className="text-sm text-gray-800">
              <span className="font-medium">Cover start: </span>
              {formatDate(data.coverStartDate)}
            </p>
          ) : (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 inline-block">
              Cover start applies once there is a fully signed tenancy agreement.{' '}
              {data.phase === 'awaiting_signature' ? 'This property is still awaiting signature.' : ''}
            </p>
          )}
          {rulesList.length > 0 && (
            <ul className="mt-3 text-sm text-gray-600 list-disc list-inside space-y-1">
              {rulesList.map((r, i) => {
                const text = formatCoverRuleEntry(r);
                return text ? <li key={i}>{text}</li> : null;
              })}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
          <h2 className="text-sm font-semibold text-emerald-900 uppercase tracking-wide mb-2">Policyholder</h2>
          {holder?.type && (
            <p className="text-xs font-medium text-emerald-800 uppercase mb-1">{holder.type.replace(/_/g, ' ')}</p>
          )}
          {typeof holder?.description === 'string' && holder.description.trim() !== '' && (
            <p className="text-sm text-gray-800 mb-3">{holder.description}</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Name</span>
              <p className="font-medium text-gray-900">
                {[holder?.firstName, holder?.lastName].filter(Boolean).join(' ') || '—'}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Email</span>
              <p className="font-medium text-gray-900 break-all">{holder?.email || '—'}</p>
            </div>
            <div>
              <span className="text-gray-500">Phone</span>
              <p className="font-medium text-gray-900">{holder?.phone || '—'}</p>
            </div>
            <div>
              <span className="text-gray-500">KYC</span>
              <p className="font-medium text-gray-900">
                Verified: {holder?.isVerified ? 'Yes' : 'No'}
                {holder?.documentVerificationStatus != null && (
                  <span className="text-gray-600">
                    {' '}
                    · Docs:{' '}
                    {typeof holder.documentVerificationStatus === 'object'
                      ? JSON.stringify(holder.documentVerificationStatus)
                      : String(holder.documentVerificationStatus)}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Insurance configuration</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-gray-500">Coverage type</dt>
              <dd className="font-medium text-gray-900 capitalize">
                {data.insurance?.coverageType?.replace(/_/g, ' ') || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Pricing model</dt>
              <dd className="font-medium text-gray-900 capitalize">
                {data.insurance?.pricingModel?.replace(/_/g, ' ') || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Monthly premium</dt>
              <dd className="font-medium text-gray-900">{formatUsd(data.insurance?.monthlyPremium)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Risk / value</dt>
              <dd className="font-medium text-gray-900">
                {data.insurance?.riskCategory != null ? String(data.insurance.riskCategory) : '—'}
                {data.insurance?.propertyValue != null && ` · Value: ${formatUsd(data.insurance.propertyValue)}`}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Property type</dt>
              <dd className="font-medium text-gray-900 capitalize">
                {data.propertyType?.replace(/_/g, ' ') || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Furnishing</dt>
              <dd className="font-medium text-gray-900 capitalize">
                {data.furnishingLevel?.replace(/_/g, ' ') || '—'}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Primary tenancy agreement</h2>
          {!primary ? (
            <p className="text-sm text-gray-600">No agreement on file yet.</p>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex flex-wrap gap-2">
                {primary.agreementId && (
                  <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{primary.agreementId}</span>
                )}
                {primary.status && (
                  <span className="text-xs uppercase bg-gray-100 px-2 py-1 rounded">{primary.status}</span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-gray-500">Lease</span>
                  <p className="font-medium text-gray-900">
                    {formatDate(primary.startDate)} — {formatDate(primary.endDate)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Rent / deposit</span>
                  <p className="font-medium text-gray-900">
                    {formatUsd(primary.rentAmount)} rent · {formatUsd(primary.depositAmount)} deposit
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Signed at</span>
                  <p className="font-medium text-gray-900">{formatDate(primary.signedAt)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Signature timestamps</span>
                  <p className="font-medium text-gray-900 text-xs">
                    Landlord: {formatDate(primary.landlordSignedAt)} · Tenant:{' '}
                    {formatDate(primary.tenantSignedAt)}
                  </p>
                </div>
              </div>
              {primary.tenant && (
                <div className="border-t border-gray-100 pt-3 mt-3">
                  <span className="text-gray-500 text-xs uppercase">Tenant</span>
                  <p className="font-medium text-gray-900">
                    {[primary.tenant.firstName, primary.tenant.lastName].filter(Boolean).join(' ')}
                  </p>
                  <p className="text-gray-600 text-sm">{primary.tenant.email || '—'}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {data.agreementHistory && data.agreementHistory.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => setHistoryOpen((o) => !o)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50"
            >
              <span className="text-sm font-semibold text-gray-900">
                Agreement history ({data.agreementHistory.length})
              </span>
              {historyOpen ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
            </button>
            {historyOpen && (
              <div className="px-5 pb-4 border-t border-gray-100 divide-y divide-gray-100">
                {data.agreementHistory.map((ag, idx) => (
                  <div key={ag.agreementId || ag._id || idx} className="py-3 text-sm">
                    <div className="flex flex-wrap gap-2 mb-1">
                      {ag.status && (
                        <span className="text-xs uppercase bg-gray-100 px-2 py-0.5 rounded">{ag.status}</span>
                      )}
                      {ag.updatedAt && (
                        <span className="text-xs text-gray-500">Updated {formatDate(ag.updatedAt)}</span>
                      )}
                    </div>
                    <p className="text-gray-700">
                      {formatDate(ag.startDate)} — {formatDate(ag.endDate)}
                      {ag.signedAt && ` · Signed ${formatDate(ag.signedAt)}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
