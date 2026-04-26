// @ts-nocheck
'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { useBankAdminService } from '@/app/services/bank-admin/bank-admin.service';
import type { BankEscrowLineInPayout, BankPayoutDetail } from '@/app/services/bank-admin/bank-admin.types';
import { formatUsd } from '@/app/lib/formatMoney';
import { ArrowLeft, Loader2 } from 'lucide-react';

function hasRenderableSnapshot(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return false;
  return Object.entries(obj as Record<string, unknown>).some(([, v]) => v != null && v !== '');
}

function linePropertyTitle(line: BankEscrowLineInPayout): string {
  return (
    line.propertyDisplayTitle ||
    line.propertyTitle ||
    (typeof line._id === 'string' ? line._id : '') ||
    '—'
  );
}

function lineEscrowStatus(line: BankEscrowLineInPayout): string {
  const s = line.status ?? line.escrowStatus;
  return typeof s === 'string' && s.trim() ? s : '—';
}

function labelize(raw: string): string {
  if (raw === '—') return raw;
  return raw.replace(/_/g, ' ');
}

function renderDetailRecord(obj: Record<string, unknown> | null | undefined, title: string) {
  if (!obj || typeof obj !== 'object') return null;
  const entries = Object.entries(obj).filter(([, v]) => v != null && v !== '');
  if (entries.length === 0) return null;
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
        {entries.map(([k, v]) => (
          <div key={k}>
            <dt className="text-gray-500 capitalize">{k.replace(/_/g, ' ')}</dt>
            <dd className="text-gray-900 break-all">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function BankPayoutDetailPage() {
  const params = useParams();
  const router = useRouter();
  const payoutId =
    typeof params.payoutId === 'string' ? params.payoutId : params.payoutId?.[0];

  const { loading: authLoading, user: authUser } = useAuth();
  const { getPayoutById, markPayoutPaid } = useBankAdminService();

  const [data, setData] = useState<BankPayoutDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [externalReference, setExternalReference] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [markSuccessMessage, setMarkSuccessMessage] = useState<string | null>(null);
  const [emailSentHint, setEmailSentHint] = useState<'sent' | 'maybe_not' | null>(null);

  const load = useCallback(async () => {
    if (!payoutId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getPayoutById(payoutId);
      if (res.success && res.data) setData(res.data);
      else setError(res.message || 'Could not load payout');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load payout');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [payoutId, getPayoutById]);

  useEffect(() => {
    if (authLoading || !authUser || !payoutId) return;
    load();
  }, [authLoading, authUser, payoutId, load]);

  const handleMarkPaid = async (e: FormEvent) => {
    e.preventDefault();
    if (!payoutId || !data) return;
    const st = (data.status || '').toLowerCase();
    if (st !== 'pending' && st !== 'processing') return;
    setSubmitting(true);
    setSubmitError(null);
    setMarkSuccessMessage(null);
    setEmailSentHint(null);
    try {
      const result = await markPayoutPaid(payoutId, {
        externalReference: externalReference.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setMarkSuccessMessage(result.message || 'Payout recorded successfully.');
      if (result.data?.emailSent === true) setEmailSentHint('sent');
      else if (result.data?.emailSent === false) setEmailSentHint('maybe_not');
      setExternalReference('');
      setNotes('');
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Request failed';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !authUser) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
      </div>
    );
  }

  if (!payoutId) {
    return (
      <div className="px-6 py-8">
        <p className="text-red-600">Invalid payout.</p>
        <Link href="/bank/settlement-queue" className="text-slate-700 text-sm mt-2 inline-block">
          Back to queue
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="px-6 py-8 max-w-lg">
        <button
          type="button"
          onClick={() => router.push('/bank/settlement-queue')}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error || 'Not found'}</div>
      </div>
    );
  }

  const lines = data.escrowTransactions || data.transactions || [];
  const status = (data.status || '').toLowerCase();
  const canMarkPaid = status === 'pending' || status === 'processing';
  const isCompleted = status === 'completed';

  const bankBlock = renderDetailRecord(
    (data.bankDetails ?? undefined) as Record<string, unknown> | undefined,
    'Bank details (snapshot)'
  );
  const mobileBlock = renderDetailRecord(
    (data.mobileMoneyDetails ?? undefined) as Record<string, unknown> | undefined,
    'Mobile money details (snapshot)'
  );
  const hasAnyPayoutMethod =
    hasRenderableSnapshot(data.bankDetails) || hasRenderableSnapshot(data.mobileMoneyDetails);

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-h-screen">
      <div className="px-6 py-4 border-b border-gray-200 bg-white/80">
        <button
          type="button"
          onClick={() => router.push('/bank/settlement-queue')}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Settlement queue
        </button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Payout</h1>
            <p className="text-xs font-mono text-gray-500 mt-1">{payoutId}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Amount</p>
            <p className="text-2xl font-bold text-gray-900">{formatUsd(data.amount)}</p>
            <span className="inline-flex mt-2 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 capitalize">
              {(data.status || '—').replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 py-6 space-y-6 max-w-5xl">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Landlord</h3>
          <p className="font-medium text-gray-900">
            {[data.landlord?.firstName, data.landlord?.lastName].filter(Boolean).join(' ') || '—'}
          </p>
          <p className="text-sm text-gray-600">{data.landlord?.email || '—'}</p>
          <p className="text-sm text-gray-500 mt-1">
            Method: <span className="capitalize">{(data.payoutMethod || '—').replace(/_/g, ' ')}</span>
          </p>
          {data.externalReference && (
            <p className="text-xs text-gray-500 mt-2">External ref: {data.externalReference}</p>
          )}
          {data.processedAt && (
            <p className="text-xs text-gray-500">Processed: {new Date(data.processedAt).toLocaleString('en-US')}</p>
          )}
        </div>

        {!hasAnyPayoutMethod && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 text-sm text-amber-950">
            <p className="font-medium">No payout method on file</p>
            <p className="text-amber-900/90 mt-1 text-xs">
              The API did not return bank or mobile money snapshots. If the backend filled details from LandlordBalance,
              they will appear here when present. Otherwise check internal ops / landlord profile.
            </p>
          </div>
        )}
        {bankBlock}
        {mobileBlock}

        {data.notes && (
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Notes</h3>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">{data.notes}</pre>
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Linked escrow lines</h3>
            <p className="text-xs text-gray-500">Rent / property context per transaction</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[960px]">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-4 py-2 font-medium">Property / reference</th>
                  <th className="px-4 py-2 font-medium text-right">Landlord amount</th>
                  <th className="px-4 py-2 font-medium">Payment type</th>
                  <th className="px-4 py-2 font-medium">Escrow status</th>
                  <th className="px-4 py-2 font-medium">Payout to landlord</th>
                  <th className="px-4 py-2 font-medium">Paid date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lines.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500 text-sm">
                      No linked escrow transactions returned (<code className="text-xs">data.escrowTransactions</code>).
                    </td>
                  </tr>
                ) : (
                  lines.map((line, i) => (
                    <tr key={line._id || i}>
                      <td className="px-4 py-2 text-gray-800">
                        <span className="font-medium">{linePropertyTitle(line)}</span>
                        {line.propertyDisplaySubtitle && (
                          <div className="text-xs text-gray-500 mt-0.5">{line.propertyDisplaySubtitle}</div>
                        )}
                        {!line.propertyDisplaySubtitle && line.address?.city && (
                          <div className="text-xs text-gray-500">{line.address.city}</div>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right font-medium tabular-nums">
                        {formatUsd(line.landlordAmount ?? line.amount)}
                      </td>
                      <td className="px-4 py-2 text-gray-600 capitalize text-xs">
                        {line.paymentType ? labelize(String(line.paymentType)) : '—'}
                      </td>
                      <td className="px-4 py-2 text-gray-600 capitalize">{labelize(lineEscrowStatus(line))}</td>
                      <td className="px-4 py-2 text-gray-600 capitalize">
                        {(line.landlordPayoutStatus || '—').replace(/_/g, ' ')}
                      </td>
                      <td className="px-4 py-2 text-gray-500 text-xs whitespace-nowrap">
                        {line.landlordPayoutDate
                          ? new Date(line.landlordPayoutDate).toLocaleString('en-US')
                          : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {markSuccessMessage && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 space-y-1">
            <p className="font-medium">{markSuccessMessage}</p>
            {emailSentHint === 'sent' && (
              <p className="text-xs text-emerald-900">Landlord notified by email.</p>
            )}
            {emailSentHint === 'maybe_not' && (
              <p className="text-xs text-emerald-900">
                Payout recorded; email may not have been sent (check landlord address or server logs).
              </p>
            )}
          </div>
        )}

        {isCompleted && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            <p className="font-medium text-gray-900">Completed (read only)</p>
            <p className="text-xs mt-1">Mark paid is disabled. Details and linked lines below reflect the settled payout.</p>
          </div>
        )}

        {canMarkPaid && (
          <form onSubmit={handleMarkPaid} className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-emerald-900">Record external payment</h3>
            <p className="text-xs text-gray-600">
              Use after the transfer has left your core banking system. This sets the payout to completed and updates
              escrow landlord payout flags.
            </p>
            {submitError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{submitError}</div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">External reference</label>
              <input
                value={externalReference}
                onChange={(e) => setExternalReference(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                placeholder="e.g. STR-REF-12345"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none"
                placeholder="Paid via bulk file…"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Mark paid
            </button>
          </form>
        )}

        {!canMarkPaid && !isCompleted && (status === 'cancelled' || status === 'failed') && (
          <p className="text-sm text-gray-600 capitalize">This payout is {status.replace(/_/g, ' ')}; mark paid is not available.</p>
        )}
      </div>
    </div>
  );
}
