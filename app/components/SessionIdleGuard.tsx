'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { getToken } from '@/app/lib/authSession';
import {
  clearIdleMark,
  markTabHidden,
  wasIdleLongEnough,
} from '@/app/lib/idleSession';

function redirectToLogin() {
  const path = window.location.pathname || '';
  if (!path.startsWith('/auth')) {
    window.location.assign('/auth/login');
  }
}

export default function SessionIdleGuard() {
  const { logout, token, loading } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (pathname?.startsWith('/auth')) return;

    const endSession = () => {
      clearIdleMark();
      logout();
      redirectToLogin();
    };

    if (getToken() && wasIdleLongEnough()) {
      endSession();
      return;
    }

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        markTabHidden();
        return;
      }
      if (document.visibilityState === 'visible' && getToken() && wasIdleLongEnough()) {
        endSession();
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [loading, logout, pathname]);

  return null;
}
