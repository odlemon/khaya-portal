// @ts-nocheck
'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { useBankAdminService } from '@/app/services/bank-admin/bank-admin.service';
import type { BankInsuranceEscrowLine, BankInsurancePayoutDetail } from '@/app/services/bank-admin/bank-admin.types';
import { formatUsd } from '@/app/lib/formatMoney';
import { ArrowLeft, Loader2 } from 'lucide-react';

function linePropertyTitle(line: BankInsuranceEscrowLine): string {
  return (
    line.propertyDisplayTitle ||
    line.propertyTitle ||
    (typeof line._id === 'string' ? line._id : '') ||
    '—'
  );
}

function lineEscrowStatus(line: BankInsuranceEscrowLine): string {
  const s = line.status ?? line.escrowStatus;
  return typeof s === 'string' && s.trim() ? s : '—';
}

function landlordLabel(line: BankInsuranceEscrowLine): string {
  const l = line.landlord;
  if (!l) return '—';
  return [l.firstName, l.lastName].filter(Boolean).join(' ') || l.email || '—';
}

export default function BankInsurancePayoutDetailPage() {
  const params = useParams();
  const router = useRouter();
  const payoutId =
    typeof params.payoutId === 'string' ? params.payoutId : params.payoutId?.[0];

  const { loading: authLoading, user: authUser } = useAuth();
  const { getInsurancePayoutById, markInsurancePayoutPaid } = useBankAdminService();

  const [data, setData] = useState<BankInsurancePayoutDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [externalReference, setExternalReference] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [markSuccessMessage, setMarkSuccessMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!payoutId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getInsurancePayoutById(payoutId);
      if (res.success && res.data) setData(res.data);
      else setError(res.message || 'Could not load insurance payout');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load insurance payout');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [payoutId, getInsurancePayoutById]);

  useEffect(() => {
    if (authLoading || !authUser || !payoutId) return;
    load();
  }, [authLoading, authUser, payoutId, load]);

  const handleMarkPaid = async (e: FormEvent) => {
    e.preventDefault();
    if (!payoutId || !data) return;
    const st = (data.status || '').toLowerCase();
    if (st !== 'pending' && st !== 'processing') return;

    const ok = window.confirm(
      'Mark this insurance partner batch as paid? Linked escrow rows will be updated to insurance remittance paid.'
    );
    if (!ok) return;

    setSubmitting(true);
    setSubmitError(null);
    setMarkSuccessMessage(null);
    try {
      const result = await markInsurancePayoutPaid(payoutId, {
        externalReference: externalReference.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setMarkSuccessMessage(
        result.message ||
          `Marked paid. ${result.data?.escrowTransactionsUpdated ?? ''} escrow line(s) updated.`.trim()
      );
      setExternalReference('');
      setNotes('');
      await load();
    } catch (err) {
      const e = err as Error & { status?: number };
      const msg = e.message || 'Request failed';
      if (e.status === 409) {
        setSubmitError('This payout was already completed or cancelled (409). Refresh the page.');
      } else {
        setSubmitError(msg);
      }
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
        <Link href="/bank/insurance-settlement-queue" className="text-slate-700 text-sm mt-2 inline-block">
          Back to insurance queue
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
          onClick={() => router.push('/bank/insurance-settlement-queue')}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error || 'Not found'}</div>
      </div>
    );
  }

  const lines = data.escrowTransactions || [];
  const status = (data.status || '').toLowerCase();
  const canMarkPaid = status === 'pending' || status === 'processing';
  const isCompleted = status === 'completed';

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-h-screen">
      <div className="px-6 py-4 border-b border-gray-200 bg-white/80">
        <button
          type="button"
          onClick={() => router.push('/bank/insurance-settlement-queue')}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Insurance settlements
        </button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Insurance partner payout</h1>
            <p className="text-xs font-mono text-gray-500 mt-1">{payoutId}</p>
            {data.isLegacyKhayalamiInsuranceBatch && (
              <span className="inline-flex mt-2 px-2 py-1 rounded-lg text-xs font-semibold bg-amber-100 text-amber-900">
                Legacy Khayalami-labelled batch
              </span>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Batch amount</p>
            <p className="text-2xl font-bold text-gray-900">{formatUsd(data.amount)}</p>
            <span className="inline-flex mt-2 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 capitalize">
              {(data.status || '—').replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 py-6 space-y-6 max-w-6xl">
        <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-4 text-sm text-violet-950">
          <p className="font-medium">Partner remittance</p>
          <p className="text-xs mt-1 text-violet-900/90">
            There is no insurer recipient id on this payout — use your bank records for where funds were sent. External
            reference and notes are stored for audit when you mark paid.
          </p>
        </div>

        {data.notes && (
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Notes</h3>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">{data.notes}</pre>
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Contributing escrow lines</h3>
            <p className="text-xs text-gray-500">Premium slice per property / landlord</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1024px]">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-4 py-2 font-medium">Property</th>
                  <th className="px-4 py-2 font-medium">Landlord</th>
                  <th className="px-4 py-2 font-medium text-right">Insurance premium</th>
                  <th className="px-4 py-2 font-medium text-right">Line total</th>
                  <th className="px-4 py-2 font-medium">Escrow status</th>
                  <th className="px-4 py-2 font-medium">Insurance payout status</th>
                  <th className="px-4 py-2 font-medium">Paid date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lines.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500 text-sm">
                      No linked escrow transactions returned.
                    </td>
                  </tr>
                ) : (
                  lines.map((line, i) => (
                    <tr key={line.escrowTransactionId || line._id || i}>
                      <td className="px-4 py-2 text-gray-800">
                        <span className="font-medium">{linePropertyTitle(line)}</span>
                        {line.propertyDisplaySubtitle && (
                          <div className="text-xs text-gray-500 mt-0.5">{line.propertyDisplaySubtitle}</div>
                        )}
                        {line.rentalId && (
                          <div className="text-[10px] text-gray-400 font-mono mt-0.5">Rental: {String(line.rentalId)}</div>
                        )}
                      </td>
                      <td className="px-4 py-2 text-gray-700 text-xs">
                        <div>{landlordLabel(line)}</div>
                        {line.landlord?.email && <div className="text-gray-500 truncate max-w-[180px]">{line.landlord.email}</div>}
                      </td>
                      <td className="px-4 py-2 text-right font-medium tabular-nums">{formatUsd(line.insurancePremium)}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-gray-600">{formatUsd(line.totalAmount)}</td>
                      <td className="px-4 py-2 text-gray-600 capitalize text-xs">{lineEscrowStatus(line).replace(/_/g, ' ')}</td>
                      <td className="px-4 py-2 text-gray-600 capitalize text-xs">
                        {(line.insurancePartnerPayoutStatus || '—').replace(/_/g, ' ')}
                      </td>
                      <td className="px-4 py-2 text-gray-500 text-xs whitespace-nowrap">
                        {line.insurancePartnerPayoutDate
                          ? new Date(line.insurancePartnerPayoutDate).toLocaleString('en-US')
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
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
            <p className="font-medium">{markSuccessMessage}</p>
          </div>
        )}

        {isCompleted && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            <p className="font-medium text-gray-900">Completed (read only)</p>
            <p className="text-xs mt-1">Escrow insurance partner fields should show paid for linked lines.</p>
          </div>
        )}

        {canMarkPaid && (
          <form onSubmit={handleMarkPaid} className="rounded-2xl border border-violet-200 bg-violet-50/40 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-violet-900">Record external remittance</h3>
            <p className="text-xs text-gray-600">
              After funds have been sent to the insurance partner outside Khayalami, submit to mark this batch completed
              and update all linked escrow rows.
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
                placeholder="e.g. BANK-WIRE-REF-998877"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none"
                placeholder="Remitted to insurer partner account…"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-700 text-white text-sm font-medium hover:bg-violet-800 disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Mark insurance payout paid
            </button>
          </form>
        )}

        {!canMarkPaid && !isCompleted && (status === 'cancelled' || status === 'failed') && (
          <p className="text-sm text-gray-600 capitalize">This batch is {status.replace(/_/g, ' ')}; mark paid is not available.</p>
        )}
      </div>
    </div>
  );
}
