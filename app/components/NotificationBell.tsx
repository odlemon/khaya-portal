'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Loader2, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNotificationStore } from '@/app/store/notificationStore';
import { getNotificationHref } from '@/app/lib/notificationDeepLink';
import {
  isBankAdminRole,
  isInsuranceAdminRole,
} from '@/app/lib/portals';
import { useAuth } from '@/app/context/AuthContext';
import type {
  AppNotification,
  NotificationGroup,
} from '@/app/services/notifications/notifications.types';

type Props = {
  pathname: string | null;
};

type OpenPanel = NotificationGroup | null;

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
      {count > 99 ? '99+' : count}
    </span>
  );
}

function NotificationPanel({
  group,
  title,
  items,
  unread,
  loading,
  onMarkAllRead,
  onItemClick,
}: {
  group: NotificationGroup;
  title: string;
  items: AppNotification[];
  unread: number;
  loading: boolean;
  onMarkAllRead: () => void;
  onItemClick: (n: AppNotification) => void;
}) {
  return (
    <div className="absolute right-0 mt-2 w-80 max-h-96 bg-white rounded-xl shadow-xl border border-gray-100 z-50 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {unread > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
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
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8 px-4">
            {group === 'messages' ? 'No message notifications yet' : 'No action notifications yet'}
          </p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {items.map((n) => {
              const isRead = n.read ?? n.isRead;
              return (
                <li key={n._id}>
                  <button
                    type="button"
                    onClick={() => onItemClick(n)}
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
  );
}

export default function NotificationBell({ pathname }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState<OpenPanel>(null);
  const ref = useRef<HTMLDivElement>(null);

  const {
    messages,
    actions,
    unreadByGroup,
    loading,
    fetchGroup,
    fetchUnreadCount,
    markRead,
    markGroupRead,
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
    fetchGroup(open, 1);
  }, [open, hidden, fetchGroup]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(null);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  if (hidden) return null;

  const toggle = (group: NotificationGroup) => {
    setOpen((current) => (current === group ? null : group));
  };

  const handleNotificationClick = async (n: AppNotification) => {
    try {
      await markRead(n._id);
    } catch {
      // still navigate if mark-read fails
    }
    setOpen(null);
    const href = getNotificationHref(n);
    if (href) {
      router.push(href);
    }
  };

  return (
    <div className="relative mr-4 flex items-center gap-1" ref={ref}>
      <div className="relative">
        <button
          type="button"
          onClick={() => toggle('messages')}
          className={`relative p-2 rounded-lg hover:bg-gray-100 transition-colors ${
            open === 'messages' ? 'bg-gray-100' : ''
          }`}
          aria-label="Message notifications"
          aria-expanded={open === 'messages'}
        >
          <MessageCircle className="w-5 h-5 text-gray-600" />
          <UnreadBadge count={unreadByGroup.messages} />
        </button>
        {open === 'messages' && (
          <NotificationPanel
            group="messages"
            title="Messages"
            items={messages}
            unread={unreadByGroup.messages}
            loading={loading}
            onMarkAllRead={() => markGroupRead('messages')}
            onItemClick={handleNotificationClick}
          />
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => toggle('actions')}
          className={`relative p-2 rounded-lg hover:bg-gray-100 transition-colors ${
            open === 'actions' ? 'bg-gray-100' : ''
          }`}
          aria-label="Action notifications"
          aria-expanded={open === 'actions'}
        >
          <Bell className="w-5 h-5 text-gray-600" />
          <UnreadBadge count={unreadByGroup.actions} />
        </button>
        {open === 'actions' && (
          <NotificationPanel
            group="actions"
            title="Actions"
            items={actions}
            unread={unreadByGroup.actions}
            loading={loading}
            onMarkAllRead={() => markGroupRead('actions')}
            onItemClick={handleNotificationClick}
          />
        )}
      </div>
    </div>
  );
}
