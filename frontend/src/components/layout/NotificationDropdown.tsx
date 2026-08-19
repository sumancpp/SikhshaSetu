import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, Award, FileText, CheckCircle2, MessageSquare, AlertCircle } from 'lucide-react';
import { notificationApi } from '../../api/notification.api';
import { NotificationItem } from '../../types';
import { useSocket } from '../../context/SocketContext';
import { formatRelativeTime } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { socket } = useSocket();
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await notificationApi.getNotifications();
      if (res.success) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      // Ignore
    }
  };

  useEffect(() => {
    fetchNotifications();

    if (socket) {
      socket.on('notification:new', (newNotif: NotificationItem) => {
        setNotifications((prev) => [newNotif, ...prev]);
        setUnreadCount((prev) => prev + 1);
      });
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [socket]);

  const handleMarkAsRead = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      try {
        await notificationApi.markAsRead(notif._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        // Ignore
      }
    }

    if (notif.referenceUrl) {
      setIsOpen(false);
      navigate(notif.referenceUrl);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      // Ignore
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'POINTS_EARNED':
      case 'ACHIEVEMENT_UNLOCKED':
        return <Award className="w-4 h-4 text-amber-500" />;
      case 'ASSIGNMENT_CREATED':
      case 'ASSIGNMENT_GRADED':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'ANSWER_ACCEPTED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'FORUM_ANSWER':
        return <MessageSquare className="w-4 h-4 text-indigo-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-800">
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">Notifications</h4>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500 dark:text-gray-400">
                No notifications right now.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleMarkAsRead(notif)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors ${
                    !notif.isRead ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                  }`}
                >
                  <div className="p-2 rounded-xl bg-gray-100 dark:bg-slate-800 flex-shrink-0 mt-0.5">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                      {notif.title}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                      {formatRelativeTime(notif.createdAt)}
                    </p>
                  </div>
                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
