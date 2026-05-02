// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import type { User } from '../services/users/users.service';

const MAX_REASON = 2000;

type Props = {
  open: boolean;
  user: User | null;
  roleLabel: string;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
};

export default function AdminTerminateAccountModal({
  open,
  user,
  roleLabel,
  onClose,
  onConfirm,
}: Props) {
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setReason('');
      setConfirmed(false);
      setSubmitting(false);
      setLocalError(null);
    }
  }, [open]);

  if (!open || !user) return null;

  const trimmed = reason.trim();
  const canSubmit = trimmed.length > 0 && confirmed && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!trimmed) {
      setLocalError('A reason is required.');
      return;
    }
    if (!confirmed) {
      setLocalError('Confirm that you understand this will block login immediately.');
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm(trimmed.slice(0, MAX_REASON));
      onClose();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Termination failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close"
        onClick={() => !submitting && onClose()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="terminate-title"
        className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
      >
        <h2 id="terminate-title" className="text-lg font-semibold text-gray-900">
          Terminate {roleLabel} account
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          {user.firstName} {user.lastName} · {user.email}
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="terminate-reason" className="block text-sm font-medium text-gray-700">
              Reason <span className="text-red-600">*</span>
            </label>
            <textarea
              id="terminate-reason"
              rows={5}
              maxLength={MAX_REASON}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Document why this account is being terminated (required for audit)."
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              disabled={submitting}
            />
            <p className="mt-1 text-xs text-gray-500">
              {reason.length} / {MAX_REASON} characters
            </p>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-sm text-amber-950">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              disabled={submitting}
              className="mt-0.5 h-4 w-4 rounded border-amber-400 text-red-600 focus:ring-red-500"
            />
            <span>This will immediately block login for this user.</span>
          </label>

          {localError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{localError}</div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => !submitting && onClose()}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Terminating…' : 'Terminate account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
