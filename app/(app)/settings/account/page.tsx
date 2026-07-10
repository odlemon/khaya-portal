// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { KeyRound, Shield } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import authService from '../../../services/auth/auth.service';
import SettingsSection from '../../../components/settings/SettingsSection';
import SettingsCard from '../../../components/settings/SettingsCard';
import ChangePasswordModal from '../../../components/settings/ChangePasswordModal';

function getInitials(firstName?: string, lastName?: string, email?: string) {
  const first = firstName?.trim();
  const last = lastName?.trim();
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  if (first) return first[0].toUpperCase();
  if (email) return email[0].toUpperCase();
  return '?';
}

function formatDate(dateString?: string) {
  if (!dateString) return null;
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return null;
  }
}

export default function SettingsAccountPage() {
  const { user, loading, token, staffRole, isSuperAdmin, portal } = useAuth();
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMeta, setProfileMeta] = useState<{
    firmName?: string;
    createdAt?: string;
    phone?: string;
  }>({});

  useEffect(() => {
    if (!token || loading) return;

    let cancelled = false;
    (async () => {
      setProfileLoading(true);
      try {
        const me = await authService.getMe(token);
        if (cancelled || !me.success || !me.data) return;
        const data = me.data as Record<string, unknown>;
        const firm = data.firm as { name?: string } | undefined;
        setProfileMeta({
          firmName: String(data.firmName ?? firm?.name ?? user?.firmName ?? ''),
          createdAt: String(data.createdAt ?? ''),
          phone: String(data.phone ?? ''),
        });
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, loading, user?.firmName]);

  if (loading) {
    return (
      <SettingsSection>
        <div className="mx-auto max-w-2xl">
          <div className="h-64 animate-pulse rounded-2xl bg-gray-200" />
        </div>
      </SettingsSection>
    );
  }

  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.email || '—';

  const memberSince = formatDate(profileMeta.createdAt);

  return (
    <SettingsSection>
      <div className="mx-auto max-w-2xl">
        <SettingsCard className="overflow-hidden p-0">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 px-6 py-8">
            <div className="flex items-center gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white/20 text-2xl font-bold text-white ring-4 ring-white/30">
                {getInitials(user?.firstName, user?.lastName, user?.email)}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-xl font-semibold text-white">{displayName}</h2>
                <p className="mt-0.5 truncate text-sm text-blue-100">{user?.email || '—'}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {portal && (
                    <span className="inline-flex rounded-full bg-white/20 px-2.5 py-1 text-xs font-medium capitalize text-white">
                      {portal}
                    </span>
                  )}
                  {isSuperAdmin && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-medium text-white">
                      <Shield className="h-3 w-3" />
                      Super admin
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-6">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500">Role</dt>
                <dd className="mt-1 text-sm font-medium text-gray-900 capitalize">
                  {staffRole?.name || user?.role || '—'}
                </dd>
              </div>
              {profileMeta.firmName && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500">Firm</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900">{profileMeta.firmName}</dd>
                </div>
              )}
              {profileMeta.phone && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500">Phone</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900">{profileMeta.phone}</dd>
                </div>
              )}
              {memberSince && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Member since
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900">
                    {profileLoading ? '…' : memberSince}
                  </dd>
                </div>
              )}
            </dl>

            <div className="border-t border-gray-100 pt-5">
              <button
                type="button"
                onClick={() => setPasswordModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-sm transition-colors hover:bg-gray-50"
              >
                <KeyRound className="h-4 w-4 text-gray-600" />
                Change password
              </button>
            </div>
          </div>
        </SettingsCard>
      </div>

      <ChangePasswordModal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        requireCurrentPassword
      />
    </SettingsSection>
  );
}
