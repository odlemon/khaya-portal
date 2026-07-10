// @ts-nocheck
'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/auth/auth.service';
import SettingsModal, { SettingsField } from './SettingsModal';
import PasswordInput from './PasswordInput';

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
  /** When true, current password is not required (forced first-login change). */
  requireCurrentPassword?: boolean;
  onSuccess?: () => void;
}

export default function ChangePasswordModal({
  open,
  onClose,
  requireCurrentPassword = true,
  onSuccess,
}: ChangePasswordModalProps) {
  const { token } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
  };

  const handleClose = () => {
    if (saving) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!token) return;

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      const payload: {
        newPassword: string;
        confirmPassword: string;
        currentPassword?: string;
      } = { newPassword, confirmPassword };

      if (requireCurrentPassword) {
        payload.currentPassword = currentPassword;
      }

      const res = await authService.changePassword(token, payload);
      if (!res.success) {
        setError(res.message || 'Password change failed');
        return;
      }

      toast.success('Password updated successfully');
      resetForm();
      onSuccess?.();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsModal
      open={open}
      onClose={handleClose}
      title="Change password"
      subtitle="Choose a strong password you haven't used elsewhere."
      maxWidth="md"
      closeDisabled={saving}
      footer={
        <>
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="change-password-form"
            disabled={saving}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Updating…' : 'Update password'}
          </button>
        </>
      }
    >
      <form id="change-password-form" onSubmit={handleSubmit} className="space-y-4">
        {requireCurrentPassword && (
          <SettingsField label="Current password">
            <PasswordInput
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              disabled={saving}
              autoComplete="current-password"
            />
          </SettingsField>
        )}
        <SettingsField label="New password">
          <PasswordInput
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            disabled={saving}
            autoComplete="new-password"
          />
        </SettingsField>
        <SettingsField label="Confirm new password">
          <PasswordInput
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={saving}
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
