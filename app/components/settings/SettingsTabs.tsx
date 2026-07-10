// @ts-nocheck
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface SettingsTabItem {
  name: string;
  path: string;
  permission?: string;
}

interface SettingsTabsProps {
  tabs: SettingsTabItem[];
}

export default function SettingsTabs({ tabs }: SettingsTabsProps) {
  const pathname = usePathname();

  return (
    <nav
      className="mt-5 inline-flex max-w-full overflow-x-auto rounded-2xl bg-gray-100/90 p-1 shadow-inner"
      aria-label="Settings sections"
    >
      {tabs.map((tab) => {
        const active =
          pathname === tab.path ||
          pathname?.startsWith(tab.path + '/') ||
          (tab.path === '/settings/account' && pathname === '/settings');

        return (
          <Link
            key={tab.path}
            href={tab.path}
            className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
              active
                ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.name}
          </Link>
        );
      })}
    </nav>
  );
}
