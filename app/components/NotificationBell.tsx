'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNotificationStore } from '@/app/store/notificationStore';
import {
  isBankAdminRole,
  isInsuranceAdminRole,
} from '@/app/lib/portals';
import { useAuth } from '@/app/context/AuthContext';

type Props = {
  pathname: string | null;
};

export default function NotificationBell({ pathname }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markRead,
    markAllRead,
  } = useNotificationStore();

  const hidden =
    pathname?.startsWith('/bank') ||
    pathname?.startsWith('/insurance') ||
    isBankAdminRole(user?.role) ||
    isInsuranceAdminRole(user?.role);

  useEffect(() => {
    if (hidden) return;
    fetchUnreadCount();
  }, [hidden, fetchUnreadCount]);

  useEffect(() => {
    if (!open || hidden) return;
    fetchNotifications(1);
  }, [open, hidden, fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  if (hidden) return null;

  const handleNotificationClick = async (id: string, chatId?: string) => {
    try {
      await markRead(id);
    } catch {
      // still navigate if mark-read fails
    }
    setOpen(false);
    if (chatId) {
      router.push(`/messages?chat=${chatId}`);
    }
  };

  return (
    <div className="relative mr-4" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 bg-white rounded-xl shadow-xl border border-gray-100 z-50 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead()}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : notifications.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8 px-4">No notifications yet</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {notifications.map((n) => {
                  const isRead = n.read ?? n.isRead;
                  return (
                    <li key={n._id}>
                      <button
                        type="button"
                        onClick={() => handleNotificationClick(n._id, n.data?.chatId)}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                          !isRead ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">{n.title}</p>
                        <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">{n.body}</p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
