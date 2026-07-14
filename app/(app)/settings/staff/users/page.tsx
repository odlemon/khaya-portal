// @ts-nocheck
'use client';

import { useCallback, useEffect, useState } from 'react';
import { KeyRound, Pencil, Plus, UserCheck, UserX } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PagePermissionWrapper from '../../../../components/PagePermissionWrapper';
import SettingsSection from '../../../../components/settings/SettingsSection';
import SettingsModal, {
  SettingsField,
  settingsInputClass,
  settingsSelectClass,
} from '../../../../components/settings/SettingsModal';
import IconActionButton from '../../../../components/settings/IconActionButton';
import {
  useStaffService,
  type StaffPortal,
  type StaffRole,
  type StaffUser,
} from '../../../../services/staff/staff.service';

const PORTALS: (StaffPortal | '')[] = ['', 'khayalami', 'bank', 'insurance'];

function portalBadgeClass(portal?: string) {
  switch (portal) {
    case 'bank':
      return 'bg-indigo-100 text-indigo-700';
    case 'insurance':
      return 'bg-emerald-100 text-emerald-700';
    default:
      return 'bg-blue-100 text-blue-700';
  }
}

export default function StaffUsersPage() {
  const {
    listStaffUsers,
    listRoles,
    createStaffUser,
    updateStaffUser,
    resetStaffPassword,
  } = useStaffService();

  const [portalFilter, setPortalFilter] = useState<StaffPortal | ''>('');
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [roles, setRoles] = useState<StaffRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formPortal, setFormPortal] = useState<StaffPortal>('khayalami');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [staffRoleId, setStaffRoleId] = useState('');
  const [saving, setSaving] = useState(false);
  const [editUser, setEditUser] = useState<StaffUser | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<StaffUser | null>(null);
  const [confirmReset, setConfirmReset] = useState<StaffUser | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const userList = await listStaffUsers(portalFilter || undefined);
      setUsers(userList);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load staff users');
    } finally {
      setLoading(false);
    }
  }, [portalFilter, listStaffUsers]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    listRoles(formPortal)
      .then(setRoles)
      .catch(() => setRoles([]));
  }, [formPortal, listRoles]);

  const openCreate = () => {
    setEditUser(null);
    setFirstName('');
    setLastName('');
    setEmail('');
    setStaffRoleId('');
    setFormPortal('khayalami');
    setModalOpen(true);
  };

  const openEdit = (u: StaffUser) => {
    setEditUser(u);
    setFirstName(u.firstName);
    setLastName(u.lastName);
    setEmail(u.email);
    setFormPortal(u.staffRole?.portal || 'khayalami');
    setStaffRoleId(u.staffRole?.id || '');
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim() || !staffRoleId) {
      toast.error('Name and role are required');
      return;
    }
    if (!editUser && !email.trim()) {
      toast.error('Email is required');
      return;
    }

    setSaving(true);
    try {
      if (editUser) {
        await updateStaffUser(editUser._id || editUser.id!, { staffRoleId });
        toast.success('Staff user updated');
      } else {
        await createStaffUser({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          staffRoleId,
        });
        toast.success('Staff user created.');
      }
      setModalOpen(false);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (u: StaffUser) => {
    if (u.isActive) {
      setConfirmDeactivate(u);
      return;
    }
    await performToggle(u);
  };

  const performToggle = async (u: StaffUser) => {
    const id = u._id || u.id!;
    setTogglingId(id);
    try {
      await updateStaffUser(id, { isActive: !u.isActive });
      toast.success(u.isActive ? 'User deactivated' : 'User activated');
      setConfirmDeactivate(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setTogglingId(null);
    }
  };

  const handleResetPassword = async () => {
    if (!confirmReset) return;
    const id = confirmReset._id || confirmReset.id!;
    setResettingId(id);
    try {
      await resetStaffPassword(id);
      toast.success('Password reset.');
      setConfirmReset(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Reset failed');
    } finally {
      setResettingId(null);
    }
  };

  return (
    <PagePermissionWrapper permission="khayalami.staff.users.manage" skeletonType="table">
      <SettingsSection title="Staff users" subtitle="Manage portal staff accounts">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <select
            value={portalFilter}
            onChange={(e) => setPortalFilter(e.target.value as StaffPortal | '')}
            className={`${settingsSelectClass} w-full sm:w-auto sm:min-w-[10rem]`}
          >
            {PORTALS.map((p) => (
              <option key={p || 'all'} value={p}>
                {p || 'All portals'}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 shrink-0" />
            Add staff user
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-200" />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u._id || u.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {u.firstName} {u.lastName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{u.email}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {u.staffRole?.portal && (
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${portalBadgeClass(u.staffRole.portal)}`}
                          >
                            {u.staffRole.portal}
                          </span>
                        )}
                        <span className="text-sm text-gray-900">
                          {u.staffRole?.name || u.role}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-1">
                        <IconActionButton onClick={() => openEdit(u)} title="Edit staff user">
                          <Pencil className="h-4 w-4" />
                        </IconActionButton>
                        <IconActionButton
                          onClick={() => setConfirmReset(u)}
                          disabled={!!resettingId}
                          title="Reset password"
                          variant="warning"
                        >
                          <KeyRound className="h-4 w-4" />
                        </IconActionButton>
                        <IconActionButton
                          onClick={() => toggleActive(u)}
                          disabled={togglingId === (u._id || u.id)}
                          title={u.isActive ? 'Deactivate user' : 'Activate user'}
                          variant={u.isActive ? 'warning' : 'success'}
                        >
                          {u.isActive ? (
                            <UserX className="h-4 w-4" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
                        </IconActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <SettingsModal
          open={modalOpen}
          onClose={() => !saving && setModalOpen(false)}
          title={editUser ? 'Edit staff user' : 'Add staff user'}
          subtitle={
            editUser
              ? 'Update the assigned role for this staff member.'
              : 'A temporary password will be generated for this staff member.'
          }
          maxWidth="md"
          closeDisabled={saving}
          footer={
            <>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={saving}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving…' : editUser ? 'Save changes' : 'Create'}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <SettingsField label="Portal">
              <select
                value={formPortal}
                onChange={(e) => {
                  setFormPortal(e.target.value as StaffPortal);
                  setStaffRoleId('');
                }}
                disabled={!!editUser}
                className={settingsSelectClass}
              >
                <option value="khayalami">Khayalami</option>
                <option value="bank">Bank</option>
                <option value="insurance">Insurance</option>
              </select>
            </SettingsField>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SettingsField label="First name">
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={settingsInputClass}
                  disabled={!!editUser}
                />
              </SettingsField>
              <SettingsField label="Last name">
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={settingsInputClass}
                  disabled={!!editUser}
                />
              </SettingsField>
            </div>
            <SettingsField label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={settingsInputClass}
                disabled={!!editUser}
              />
            </SettingsField>
            <SettingsField label="Staff role">
              <select
                value={staffRoleId}
                onChange={(e) => setStaffRoleId(e.target.value)}
                className={settingsSelectClass}
              >
                <option value="">Select role</option>
                {roles.map((r) => (
                  <option key={r._id || r.id} value={r._id || r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </SettingsField>
          </div>
        </SettingsModal>

        <SettingsModal
          open={!!confirmDeactivate}
          onClose={() => !togglingId && setConfirmDeactivate(null)}
          title="Deactivate staff user"
          subtitle={
            confirmDeactivate
              ? `Deactivate ${confirmDeactivate.email}? They will lose portal access.`
              : undefined
          }
          maxWidth="sm"
          closeDisabled={!!togglingId}
          footer={
            <>
              <button
                type="button"
                onClick={() => setConfirmDeactivate(null)}
                disabled={!!togglingId}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => confirmDeactivate && performToggle(confirmDeactivate)}
                disabled={!!togglingId}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {togglingId ? 'Deactivating…' : 'Deactivate'}
              </button>
            </>
          }
        >
          <p className="text-sm text-gray-600">
            The user can be reactivated later from this page.
          </p>
        </SettingsModal>

        <SettingsModal
          open={!!confirmReset}
          onClose={() => !resettingId && setConfirmReset(null)}
          title="Reset password"
          subtitle={
            confirmReset
              ? `Generate a new temporary password for ${confirmReset.email}?`
              : undefined
          }
          maxWidth="sm"
          closeDisabled={!!resettingId}
          footer={
            <>
              <button
                type="button"
                onClick={() => setConfirmReset(null)}
                disabled={!!resettingId}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={!!resettingId}
                className="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {resettingId ? 'Resetting…' : 'Reset password'}
              </button>
            </>
          }
        >
          <p className="text-sm text-gray-600">
            A new temporary password will be generated. The staff member must change it on first
            login.
          </p>
        </SettingsModal>
      </SettingsSection>
    </PagePermissionWrapper>
  );
}
