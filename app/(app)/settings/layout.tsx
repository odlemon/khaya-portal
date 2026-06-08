// @ts-nocheck
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { isKhayalamiAdminRole } from '../../lib/portals';

const adminTabs = [
  { name: 'User management', path: '/settings/users' },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdmin = isKhayalamiAdminRole(user?.role);

  const isAccount = pathname === '/settings/account' || pathname === '/settings';

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <div className="px-6 py-4 border-b border-gray-100 bg-white">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Portal configuration and administration</p>

        <nav className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/settings/account"
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              isAccount
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Account
          </Link>
          {isAdmin &&
            adminTabs.map((tab) => (
              <Link
                key={tab.path}
                href={tab.path}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                  pathname === tab.path || pathname?.startsWith(tab.path + '/')
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab.name}
              </Link>
            ))}
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
