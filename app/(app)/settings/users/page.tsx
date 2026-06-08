// @ts-nocheck
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { isKhayalamiAdminRole } from '../../../lib/portals';
import { useUsersService, type User } from '../../../services/users/users.service';
import AdminHardDeleteUserModal from '../../../components/AdminHardDeleteUserModal';

const ITEMS_PER_PAGE = 20;

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function roleBadgeClass(role: string) {
  switch (role) {
    case 'admin':
      return 'bg-purple-100 text-purple-700';
    case 'landlord':
      return 'bg-amber-100 text-amber-800';
    case 'tenant':
      return 'bg-blue-100 text-blue-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export default function SettingsUsersPage() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const { listAdminUsers, hardDeleteUser } = useUsersService();

  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: ITEMS_PER_PAGE, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isAdmin = isKhayalamiAdminRole(authUser?.role);
  const currentUserId = authUser?.id ? String(authUser.id) : '';

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.replace('/dashboard');
    }
  }, [authLoading, isAdmin, router]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const loadUsers = useCallback(
    async (page = 1) => {
      if (authLoading || !isAdmin) return;

      setLoading(true);
      setError(null);
      try {
        const isActive =
          activeFilter === 'true' ? true : activeFilter === 'false' ? false : undefined;

        const response = await listAdminUsers({
          page,
          limit: ITEMS_PER_PAGE,
          role: roleFilter || undefined,
          search: debouncedSearch || undefined,
          isActive,
        });

        if (response?.success) {
          setUsers(response.data.users);
          setPagination(response.data.pagination);
        } else {
          setError('Failed to load users');
        }
      } catch {
        setError('Error loading users');
      } finally {
        setLoading(false);
      }
    },
    [authLoading, isAdmin, listAdminUsers, debouncedSearch, roleFilter, activeFilter]
  );

  useEffect(() => {
    loadUsers(1);
  }, [loadUsers]);

  const canDeleteUser = (user: User) => {
    if (deletingId) return false;
    if (String(user._id) === currentUserId) return false;
    if (user.role === 'admin') return false;
    return true;
  };

  const handleHardDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget._id);
    try {
      const result = await hardDeleteUser(deleteTarget._id);
      if (result.ok) {
        toast.success(result.message || `${deleteTarget.email} deleted permanently`);
        setDeleteTarget(null);
        await loadUsers(pagination.page);
        return;
      }
      if (result.status === 503) {
        toast.error(result.message || 'Database temporarily unavailable. Please retry.');
        throw new Error(result.message || 'Database unavailable');
      }
      if (result.status === 404) {
        toast.error(result.message || 'User not found');
        setUsers((prev) => prev.filter((u) => u._id !== deleteTarget._id));
        setDeleteTarget(null);
        return;
      }
      throw new Error(result.message || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading || !isAdmin) {
    return (
      <div className="p-6">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <AdminHardDeleteUserModal
        open={!!deleteTarget}
        user={deleteTarget}
        onClose={() => !deletingId && setDeleteTarget(null)}
        onConfirm={handleHardDeleteConfirm}
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">User management</h2>
          <p className="text-sm text-gray-500 mt-1">
            {pagination.total} users · permanently delete removes all related data
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700"
          >
            <option value="">All roles</option>
            <option value="tenant">Tenant</option>
            <option value="landlord">Landlord</option>
            <option value="admin">Admin</option>
          </select>
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700"
          >
            <option value="">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">No users found</h3>
          <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {users.map((user) => {
                    const deleteDisabled = !canDeleteUser(user);
                    const isSelf = String(user._id) === currentUserId;
                    const isAdminRow = user.role === 'admin';

                    return (
                      <tr key={user._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full capitalize ${roleBadgeClass(user.role)}`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                                user.isActive
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                            {user.isVerified && (
                              <span className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                                Verified
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            type="button"
                            disabled={deleteDisabled}
                            onClick={() => setDeleteTarget(user)}
                            title={
                              isSelf
                                ? 'You cannot delete your own account'
                                : isAdminRow
                                ? 'Admin accounts cannot be hard-deleted'
                                : 'Permanently delete user and all related data'
                            }
                            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {deletingId === user._id ? 'Deleting…' : 'Delete permanently'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.pages} · {pagination.total} total
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => loadUsers(pagination.page - 1)}
                  disabled={pagination.page <= 1 || loading}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => loadUsers(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages || loading}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <p className="mt-6 text-xs text-gray-500">
        To soft-disable an account while keeping audit history, use Terminate on the Tenants or
        Landlords pages, or view terminated accounts in the sidebar.
      </p>
    </div>
  );
}
