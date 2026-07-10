// @ts-nocheck
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { usePermissions } from '../../../services/permissions/usePermissions';
import { useUsersService, type User } from '../../../services/users/users.service';
import AdminHardDeleteUserModal from '../../../components/AdminHardDeleteUserModal';
import PagePermissionWrapper from '../../../components/PagePermissionWrapper';
import SettingsSection from '../../../components/settings/SettingsSection';
import IconActionButton from '../../../components/settings/IconActionButton';
import { settingsInputClass, settingsSelectClass } from '../../../components/settings/SettingsModal';

const ITEMS_PER_PAGE = 20;
const CUSTOMER_ROLES = new Set(['tenant', 'landlord']);

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function roleBadgeClass(role: string) {
  switch (role) {
    case 'landlord':
      return 'bg-amber-100 text-amber-800';
    case 'tenant':
      return 'bg-blue-100 text-blue-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export default function SettingsUsersPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const { hasPermission } = usePermissions();
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

  const canDelete = hasPermission('khayalami.users.delete');
  const currentUserId = authUser?.id ? String(authUser.id) : '';

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const loadUsers = useCallback(
    async (page = 1) => {
      if (authLoading) return;

      setLoading(true);
      setError(null);
      try {
        const isActive =
          activeFilter === 'true' ? true : activeFilter === 'false' ? false : undefined;

        const response = await listAdminUsers({
          page,
          limit: ITEMS_PER_PAGE,
          role: (roleFilter as 'tenant' | 'landlord') || undefined,
          search: debouncedSearch || undefined,
          isActive,
        });

        if (response?.success) {
          const customerUsers = response.data.users.filter((u) => CUSTOMER_ROLES.has(u.role));
          setUsers(customerUsers);
          setPagination({
            ...response.data.pagination,
            total: customerUsers.length,
          });
        } else {
          setError('Failed to load customers');
        }
      } catch {
        setError('Error loading customers');
      } finally {
        setLoading(false);
      }
    },
    [authLoading, listAdminUsers, debouncedSearch, roleFilter, activeFilter]
  );

  useEffect(() => {
    loadUsers(1);
  }, [loadUsers]);

  const canDeleteUser = (user: User) => {
    if (!canDelete) return false;
    if (deletingId) return false;
    if (String(user._id) === currentUserId) return false;
    if (!CUSTOMER_ROLES.has(user.role)) return false;
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

  if (authLoading) {
    return (
      <SettingsSection>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      </SettingsSection>
    );
  }

  return (
    <PagePermissionWrapper permission="khayalami.users.view" skeletonType="table">
      <SettingsSection
        title="Customers"
        subtitle="Landlords and tenants on the platform"
      >
        <AdminHardDeleteUserModal
          open={!!deleteTarget}
          user={deleteTarget}
          onClose={() => !deletingId && setDeleteTarget(null)}
          onConfirm={handleHardDeleteConfirm}
        />

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <p className="text-sm text-gray-500">
            {pagination.total} customers · permanently delete removes all related data
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              placeholder="Search name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full sm:w-64 ${settingsInputClass}`}
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className={settingsSelectClass}
            >
              <option value="">All customers</option>
              <option value="tenant">Tenant</option>
              <option value="landlord">Landlord</option>
            </select>
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className={settingsSelectClass}
            >
              <option value="">All statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-200" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16">
            <h3 className="text-lg font-semibold text-gray-900">No customers found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                        Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                        Role
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                        Joined
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {users.map((user) => {
                      const deleteDisabled = !canDeleteUser(user);
                      const isSelf = String(user._id) === currentUserId;

                      return (
                        <tr key={user._id} className="transition-colors hover:bg-gray-50/50">
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="text-sm font-semibold text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="text-sm text-gray-900">{user.email}</div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${roleBadgeClass(user.role)}`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                                  user.isActive
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {user.isActive ? 'Active' : 'Inactive'}
                              </span>
                              {user.isVerified && (
                                <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                                  Verified
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-right">
                            <IconActionButton
                              onClick={() => setDeleteTarget(user)}
                              disabled={deleteDisabled}
                              variant="danger"
                              title={
                                isSelf
                                  ? 'You cannot delete your own account'
                                  : 'Permanently delete customer and all related data'
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </IconActionButton>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {pagination.pages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Page {pagination.page} of {pagination.pages} · {pagination.total} total
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => loadUsers(pagination.page - 1)}
                    disabled={pagination.page <= 1 || loading}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => loadUsers(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages || loading}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-50"
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
      </SettingsSection>
    </PagePermissionWrapper>
  );
}
