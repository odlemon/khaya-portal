// @ts-nocheck
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { canAccess } from '../lib/rbac';
import {
  getRoutePermission,
  khayalamiNavItems,
  bankNavItems,
  insuranceNavItems,
  getFirstAllowedPath,
} from '../config/nav.config';
import {
  isBankAdminRole,
  isInsuranceAdminRole,
  isKhayalamiAdminRole,
} from '../lib/portals';

function AccessDenied({ homePath }: { homePath: string }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Access denied</h3>
        <p className="mt-2 text-sm text-gray-600">
          You don&apos;t have permission to view this page. If you need access, contact your
          administrator.
        </p>
        <Link
          href={homePath}
          className="mt-6 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Go back
        </Link>
      </div>
    </div>
  );
}

export default function RoutePermissionGuard({ children }: { children: React.ReactNode }) {
  const { user, permissions, isSuperAdmin, loading, mustChangePassword } = useAuth();
  const pathname = usePathname();

  const homePath = (() => {
    if (!user) return '/dashboard';
    if (isBankAdminRole(user.role)) {
      return getFirstAllowedPath([...bankNavItems], permissions, isSuperAdmin) || '/bank/dashboard';
    }
    if (isInsuranceAdminRole(user.role)) {
      return (
        getFirstAllowedPath([...insuranceNavItems], permissions, isSuperAdmin) ||
        '/insurance/dashboard'
      );
    }
    if (isKhayalamiAdminRole(user.role)) {
      return (
        getFirstAllowedPath(
          khayalamiNavItems.filter((i) => i.path !== '/settings'),
          permissions,
          isSuperAdmin
        ) || '/settings/account'
      );
    }
    return '/dashboard';
  })();

  if (loading || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
      </div>
    );
  }

  // While password change is required, do not gate routes — modal blocks interaction.
  if (mustChangePassword) {
    return <>{children}</>;
  }

  const required = getRoutePermission(pathname);

  // No mapped permission → allow (account/settings shell, etc.)
  if (required === undefined) {
    return <>{children}</>;
  }

  if (!canAccess(permissions, required, isSuperAdmin)) {
    return <AccessDenied homePath={homePath} />;
  }

  return <>{children}</>;
}
