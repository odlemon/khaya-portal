// @ts-nocheck
'use client';

import { useAuth } from '../../../context/AuthContext';

export default function SettingsAccountPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-xl bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
        <p className="text-sm text-gray-500 mt-1">Your signed-in admin account</p>

        <dl className="mt-6 space-y-4">
          <div>
            <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {user?.firstName && user?.lastName
                ? `${user.firstName} ${user.lastName}`
                : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</dt>
            <dd className="mt-1 text-sm text-gray-900">{user?.email || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</dt>
            <dd className="mt-1 text-sm text-gray-900 capitalize">{user?.role || '—'}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
