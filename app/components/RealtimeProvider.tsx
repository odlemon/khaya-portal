'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { socketService } from '@/app/lib/socket';
import { bootstrapRealtime } from '@/app/lib/realtimeListeners';
import { useChatStore } from '@/app/store/chatStore';
import { useNotificationStore } from '@/app/store/notificationStore';
import {
  isBankAdminRole,
  isInsuranceAdminRole,
} from '@/app/lib/portals';

function shouldEnableRealtime(
  pathname: string | null,
  role: string | undefined,
  token: string | null
): boolean {
  if (!token) return false;
  if (pathname?.startsWith('/bank') || pathname?.startsWith('/insurance')) return false;
  if (isBankAdminRole(role) || isInsuranceAdminRole(role)) return false;
  return true;
}

export default function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (!shouldEnableRealtime(pathname, user?.role, token)) return;

    bootstrapRealtime(token!);
    useNotificationStore.getState().fetchUnreadCount();
    useChatStore.getState().loadAllChats().catch(() => {});

    const onReconnect = () => {
      const chatId = useChatStore.getState().activeChatId;
      if (chatId) socketService.joinChat(chatId);
    };

    socketService.onConnect(onReconnect);

    const pollInterval = setInterval(() => {
      if (!socketService.isConnected()) {
        useNotificationStore.getState().fetchUnreadCount();
        useChatStore.getState().loadAllChats().catch(() => {});
      }
    }, 30000);

    return () => {
      socketService.offConnect(onReconnect);
      clearInterval(pollInterval);
    };
  }, [token, user?.role, pathname]);

  return <>{children}</>;
}
