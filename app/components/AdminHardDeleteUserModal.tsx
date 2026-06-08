// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import type { User } from '../services/users/users.service';

type Props = {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export default function AdminHardDeleteUserModal({ open, user, onClose, onConfirm }: Props) {
  const [emailConfirm, setEmailConfirm] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setEmailConfirm('');
      setConfirmed(false);
      setSubmitting(false);
      setLocalError(null);
    }
  }, [open]);

  if (!open || !user) return null;

  const emailMatches = emailConfirm.trim().toLowerCase() === user.email.trim().toLowerCase();
  const canSubmit = emailMatches && confirmed && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!emailMatches) {
      setLocalError('Type the user email exactly to confirm.');
      return;
    }
    if (!confirmed) {
      setLocalError('Confirm that you understand this action is permanent.');
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Delete failed');
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
        aria-labelledby="hard-delete-title"
        className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
      >
        <h2 id="hard-delete-title" className="text-lg font-semibold text-red-700">
          Permanently delete user
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          {user.firstName} {user.lastName} · {user.email}
        </p>

        <div className="mt-4 rounded-xl border border-red-200 bg-red-50/80 p-3 text-sm text-red-900">
          <p className="font-medium">This cannot be undone.</p>
          <p className="mt-1 text-red-800">
            All related data will be removed: properties, chats, messages, payments, invoices,
            agreements, rentals, notifications, and more.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="hard-delete-email" className="block text-sm font-medium text-gray-700">
              Type <span className="font-semibold">{user.email}</span> to confirm
            </label>
            <input
              id="hard-delete-email"
              type="email"
              value={emailConfirm}
              onChange={(e) => setEmailConfirm(e.target.value)}
              placeholder={user.email}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              disabled={submitting}
              autoComplete="off"
            />
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-red-200 bg-red-50/50 p-3 text-sm text-red-950">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              disabled={submitting}
              className="mt-0.5 h-4 w-4 rounded border-red-400 text-red-600 focus:ring-red-500"
            />
            <span>I understand this will permanently delete this user and all related records.</span>
          </label>

          {localError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {localError}
            </div>
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
              {submitting ? 'Deleting…' : 'Delete permanently'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
