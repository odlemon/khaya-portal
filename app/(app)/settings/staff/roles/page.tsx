// @ts-nocheck
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, Search } from 'lucide-react';
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
  type PermissionCatalog,
} from '../../../../services/staff/staff.service';

const PORTALS: StaffPortal[] = ['khayalami', 'bank', 'insurance'];

function normalizeCatalog(raw: unknown, portal: StaffPortal): PermissionCatalog {
  if (raw && typeof raw === 'object' && Array.isArray((raw as PermissionCatalog).modules)) {
    return raw as PermissionCatalog;
  }
  if (Array.isArray(raw)) {
    const flat = raw as { key: string; label?: string; module?: string }[];
    const byModule: Record<string, { key: string; label: string }[]> = {};
    for (const p of flat) {
      const mod = p.module || p.key.split('.').slice(0, 2).join('.') || 'general';
      if (!byModule[mod]) byModule[mod] = [];
      byModule[mod].push({ key: p.key, label: p.label || p.key });
    }
    return {
      portal,
      modules: Object.entries(byModule).map(([module, permissions]) => ({ module, permissions })),
    };
  }
  return { portal, modules: [] };
}

export default function StaffRolesPage() {
  const {
    getPermissionCatalog,
    listRoles,
    createRole,
    updateRole,
    deleteRole,
  } = useStaffService();

  const [portal, setPortal] = useState<StaffPortal>('khayalami');
  const [roles, setRoles] = useState<StaffRole[]>([]);
  const [catalog, setCatalog] = useState<PermissionCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<StaffRole | null>(null);
  const [editing, setEditing] = useState<StaffRole | null>(null);
  const [name, setName] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [permSearch, setPermSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [roleList, catRaw] = await Promise.all([
        listRoles(portal),
        getPermissionCatalog(),
      ]);
      setRoles(roleList);
      let cat: PermissionCatalog | null = null;
      if (Array.isArray(catRaw)) {
        const found = catRaw.find(
          (c: PermissionCatalog) => c.portal === portal
        ) as PermissionCatalog | undefined;
        cat = found ? normalizeCatalog(found, portal) : normalizeCatalog(catRaw, portal);
      } else if (catRaw) {
        cat = normalizeCatalog(catRaw, portal);
      }
      setCatalog(cat);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  }, [portal, listRoles, getPermissionCatalog]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setSelectedPerms([]);
    setPermSearch('');
    setModalOpen(true);
  };

  const openEdit = (role: StaffRole) => {
    setEditing(role);
    setName(role.name);
    setSelectedPerms([...role.permissions]);
    setPermSearch('');
    setModalOpen(true);
  };

  const togglePerm = (key: string) => {
    setSelectedPerms((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Role name is required');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateRole(editing._id || editing.id!, {
          name: name.trim(),
          permissions: selectedPerms,
        });
        toast.success('Role updated');
      } else {
        await createRole({ name: name.trim(), portal, permissions: selectedPerms });
        toast.success('Role created');
      }
      setModalOpen(false);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const openDeactivateConfirm = (role: StaffRole) => {
    setDeactivateTarget(role);
    setConfirmOpen(true);
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    setDeleting(true);
    try {
      await deleteRole(deactivateTarget._id || deactivateTarget.id!);
      toast.success('Role deactivated');
      setConfirmOpen(false);
      setDeactivateTarget(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const modules = catalog?.modules ?? [];

  const filteredModules = useMemo(() => {
    const q = permSearch.trim().toLowerCase();
    if (!q) return modules;
    return modules
      .map((mod) => ({
        ...mod,
        permissions: mod.permissions.filter(
          (p) =>
            p.label.toLowerCase().includes(q) ||
            p.key.toLowerCase().includes(q) ||
            mod.module.toLowerCase().includes(q)
        ),
      }))
      .filter((mod) => mod.permissions.length > 0);
  }, [modules, permSearch]);

  return (
    <PagePermissionWrapper permission="khayalami.staff.roles.manage" skeletonType="table">
      <SettingsSection title="Staff roles" subtitle="Define permissions per portal">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <select
              value={portal}
              onChange={(e) => setPortal(e.target.value as StaffPortal)}
              className={settingsSelectClass}
            >
              {PORTALS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            New role
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
                    Permissions
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {roles.map((role) => (
                  <tr key={role._id || role.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{role.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {role.permissions?.length ?? 0}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-1">
                        <IconActionButton
                          onClick={() => openEdit(role)}
                          title="Edit role"
                        >
                          <Pencil className="h-4 w-4" />
                        </IconActionButton>
                        <IconActionButton
                          onClick={() => openDeactivateConfirm(role)}
                          title="Deactivate role"
                          variant="danger"
                        >
                          <Trash2 className="h-4 w-4" />
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
          title={editing ? 'Edit role' : 'Create role'}
          subtitle={`Portal: ${portal}`}
          maxWidth="2xl"
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
                {saving ? 'Saving…' : 'Save'}
              </button>
            </>
          }
        >
          <SettingsField label="Role name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={settingsInputClass}
              placeholder="e.g. Payments Officer"
            />
          </SettingsField>

          <div className="mt-5">
            <p className="mb-2 text-sm font-medium text-gray-900">Permissions</p>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={permSearch}
                onChange={(e) => setPermSearch(e.target.value)}
                placeholder="Search permissions…"
                className={`${settingsInputClass} pl-9`}
              />
            </div>
            <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
              {filteredModules.map((mod) => (
                <div key={mod.module} className="rounded-xl border border-gray-100 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase text-gray-500">{mod.module}</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {mod.permissions.map((p) => (
                      <label
                        key={p.key}
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-0.5 text-sm text-gray-900 hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPerms.includes(p.key)}
                          onChange={() => togglePerm(p.key)}
                          className="rounded border-gray-300 text-blue-600"
                        />
                        <span className="truncate" title={p.key}>
                          {p.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              {filteredModules.length === 0 && (
                <p className="py-4 text-center text-sm text-gray-500">No permissions match your search.</p>
              )}
            </div>
          </div>
        </SettingsModal>

        <SettingsModal
          open={confirmOpen}
          onClose={() => !deleting && setConfirmOpen(false)}
          title="Deactivate role"
          subtitle={
            deactivateTarget
              ? `Deactivate "${deactivateTarget.name}"? Users assigned to this role may lose access.`
              : undefined
          }
          maxWidth="sm"
          closeDisabled={deleting}
          footer={
            <>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={deleting}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeactivate}
                disabled={deleting}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deactivating…' : 'Deactivate'}
              </button>
            </>
          }
        >
          <p className="text-sm text-gray-600">
            This action deactivates the role. You can recreate it later if needed.
          </p>
        </SettingsModal>
      </SettingsSection>
    </PagePermissionWrapper>
  );
}
