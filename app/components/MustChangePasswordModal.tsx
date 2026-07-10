// @ts-nocheck
'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import authService from '../services/auth/auth.service';
import SettingsModal, { SettingsField } from './settings/SettingsModal';
import PasswordInput from './settings/PasswordInput';

export default function MustChangePasswordModal() {
  const { token, mustChangePassword, clearMustChangePassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!mustChangePassword || !token) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await authService.changePassword(token, {
        newPassword,
        confirmPassword,
      });
      if (!res.success) {
        setError(res.message || 'Password change failed');
        return;
      }
      clearMustChangePassword();
      toast.success('Password updated. You can continue using the portal.');
      setNewPassword('');
      setConfirmPassword('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SettingsModal
      open
      onClose={() => {}}
      title="Set a new password"
      subtitle="Your account requires a password change before you can use the portal."
      maxWidth="md"
      closeDisabled
      footer={
        <button
          type="submit"
          form="must-change-password-form"
          disabled={submitting}
          className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 sm:w-auto sm:px-6"
        >
          {submitting ? 'Updating…' : 'Update password'}
        </button>
      }
    >
      <form id="must-change-password-form" onSubmit={handleSubmit} className="space-y-4">
        <SettingsField label="New password">
          <PasswordInput
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            disabled={submitting}
            autoComplete="new-password"
          />
        </SettingsField>
        <SettingsField label="Confirm password">
          <PasswordInput
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={submitting}
            autoComplete="new-password"
          />
        </SettingsField>
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
            {error}
          </div>
        )}
      </form>
    </SettingsModal>
  );
}
