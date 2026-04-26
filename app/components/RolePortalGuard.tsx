// @ts-nocheck
'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import {
  getDefaultPathForRole,
  isBankAdminRole,
  isInsuranceAdminRole,
  isKhayalamiAdminRole,
} from '../lib/portals';

export default function RolePortalGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return;

    const role = user.role || '';

    if (isInsuranceAdminRole(role)) {
      if (!pathname?.startsWith('/insurance')) {
        router.replace(getDefaultPathForRole(role));
      }
      return;
    }

    if (isBankAdminRole(role)) {
      if (!pathname?.startsWith('/bank')) {
        router.replace(getDefaultPathForRole(role));
      }
      return;
    }

    if (isKhayalamiAdminRole(role) || role === '') {
      if (pathname?.startsWith('/insurance') || pathname?.startsWith('/bank')) {
        router.replace('/dashboard');
      }
    }
  }, [loading, user, pathname, router]);

  return <>{children}</>;
}
