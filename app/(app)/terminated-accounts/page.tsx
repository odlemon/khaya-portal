// @ts-nocheck
'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { isKhayalamiAdminRole } from '../../lib/portals';
import { useUsersService, type TerminatedUser } from '../../services/users/users.service';
import AdminReinstateAccountModal from '../../components/AdminReinstateAccountModal';

export const dynamic = 'force-dynamic';

function formatTerminatedBy(by: Record<string, unknown> | string | null | undefined): string {
  if (by == null) return '—';
  if (typeof by === 'string') return by || '—';
  const fn = by.firstName;
  const ln = by.lastName;
  const em = by.email;
  const name = [fn, ln].filter(Boolean).join(' ').trim();
  if (name) return name;
  if (em) return String(em);
  if (by._id) return String(by._id);
  return '—';
}

function formatDate(iso: string | undefined) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

export default function TerminatedAccountsPage() {
  const { user, loading: authLoading } = useAuth();
  const { getTerminatedUsers, reinstateUser } = useUsersService();
  const [rows, setRows] = useState<TerminatedUser[]>([]);
  const [reinstateTarget, setReinstateTarget] = useState<TerminatedUser | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [roleFilter, setRoleFilter] = useState<'all' | 'tenant' | 'landlord'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = isKhayalamiAdminRole(user?.role);

  const handleReinstateConfirm = async (reason: string) => {
    if (!reinstateTarget) return;
    const r = await reinstateUser(reinstateTarget._id, reason);
    if (r.ok) {
      toast.success('Account reinstated.');
      setRows((prev) => prev.filter((u) => u._id !== reinstateTarget._id));
      return;
    }
    if (r.status === 409) {
      toast.error('Already reinstated or not in a terminated state.');
      setRows((prev) => prev.filter((u) => u._id !== reinstateTarget._id));
      return;
    }
    if (r.status === 403) {
      toast.error(r.message || 'You cannot reinstate this account.');
      throw new Error(r.message || 'Forbidden');
    }
    throw new Error(r.message || 'Reinstate failed');
  };

  const load = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    const role = roleFilter === 'all' ? undefined : roleFilter;
    const res = await getTerminatedUsers(page, limit, role);
    if (res?.success && res.data) {
      setRows(res.data.users || []);
      setTotalPages(res.data.pagination?.pages || 1);
      setTotal(res.data.pagination?.total ?? 0);
    } else {
      setError(res?.message || 'Could not load terminated accounts');
      setRows([]);
    }
    setLoading(false);
  }, [getTerminatedUsers, isAdmin, page, limit, roleFilter]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    load();
  }, [authLoading, isAdmin, load]);

  if (authLoading) {
    return (
      <div className="h-screen bg-gray-50 px-6 py-8">
        <div className="h-8 max-w-md animate-pulse rounded-lg bg-gray-200" />
        <div className="mt-6 h-64 animate-pulse rounded-xl bg-gray-200" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center bg-gray-50 px-6">
        <p className="text-center text-gray-700">You do not have access to this page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminReinstateAccountModal
        open={!!reinstateTarget}
        user={reinstateTarget}
        onClose={() => setReinstateTarget(null)}
        onConfirm={handleReinstateConfirm}
      />
      <div className="border-b border-gray-200 bg-white px-6 py-5">
        <h1 className="text-2xl font-semibold text-gray-900">Terminated accounts</h1>
        <p className="mt-1 text-sm text-gray-500">
          Audit trail of tenant and landlord accounts terminated by Khayalami admins ({total} total).
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="text-sm text-gray-600">
            Role
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as 'all' | 'tenant' | 'landlord');
                setPage(1);
              }}
              className="ml-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm"
            >
              <option value="all">All</option>
              <option value="tenant">Tenant</option>
              <option value="landlord">Landlord</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => load()}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="px-6 py-6">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
        )}

        <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 text-sm text-gray-600">
              Loading…
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Terminated at
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    By
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Reason
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {!loading && rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-500">
                      No terminated accounts match this filter.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row._id} className="align-top hover:bg-gray-50/60">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {row.firstName} {row.lastName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">{row.email}</td>
                      <td className="px-4 py-3 text-sm capitalize text-gray-700">{row.role}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        {formatDate(row.adminTerminatedAt)}
                      </td>
                      <td className="max-w-[180px] px-4 py-3 text-sm text-gray-700">
                        {formatTerminatedBy(row.adminTerminatedBy)}
                      </td>
                      <td className="max-w-md px-4 py-3 text-sm text-gray-700">
                        <span className="line-clamp-4 whitespace-pre-wrap">{row.adminTerminationReason || '—'}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setReinstateTarget(row)}
                          className="rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50"
                        >
                          Reinstate
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-medium disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-medium disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
