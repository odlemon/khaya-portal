// @ts-nocheck
'use client';

import { usePermissions } from '../../services/permissions/usePermissions';
import SettingsTabs from '../../components/settings/SettingsTabs';

const settingsTabs = [
  { name: 'Account', path: '/settings/account' },
  { name: 'Customers', path: '/settings/users', permission: 'khayalami.users.view' },
  { name: 'Staff roles', path: '/settings/staff/roles', permission: 'khayalami.staff.roles.manage' },
  { name: 'Staff users', path: '/settings/staff/users', permission: 'khayalami.staff.users.manage' },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { hasPermission } = usePermissions();

  const visibleTabs = settingsTabs.filter((tab) => {
    if (!tab.permission) return true;
    return hasPermission(tab.permission);
  });

  return (
    <div className="-m-6 flex h-[calc(100vh-4rem)] flex-col bg-gray-50">
      <div className="border-b border-gray-200/80 bg-white px-6 py-5">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account and portal administration
        </p>
        <SettingsTabs tabs={visibleTabs} />
      </div>

      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
