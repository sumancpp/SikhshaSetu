import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  BookOpen,
  FileText,
  Target,
  Trophy,
  MessageSquare,
  Users,
  ShieldAlert,
  BarChart3,
  ScrollText,
  User as UserIcon,
  Sparkles,
  Swords,
  Terminal,
  X,
  QrCode,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/helpers';

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const role = user?.role || 'STUDENT';

  const navItems = [
    {
      title: 'Overview',
      items: [
        { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
        { label: 'Live Attendance 📍', to: '/attendance', icon: QrCode },
        { label: 'Classes', to: '/classes', icon: Layers },
        { label: 'Subjects', to: '/subjects', icon: BookOpen },
      ],
    },
    {
      title: 'Learning & Practice',
      items: [
        { label: 'Assignments', to: '/assignments', icon: FileText },
        { label: 'Challenges', to: '/challenges', icon: Target },
        { label: '1v1 Quiz Arena ⚔️', to: '/arena', icon: Swords },
        { label: 'Code Playground 💻', to: '/playground', icon: Terminal },
        { label: 'Leaderboard', to: '/leaderboard', icon: Trophy },
        { label: 'Community Forum', to: '/forum', icon: MessageSquare },
      ],
    },
    ...(role === 'ADMIN'
      ? [
          {
            title: 'Administration',
            items: [
              { label: 'User Directory', to: '/admin/users', icon: Users },
              { label: 'Moderation Reports', to: '/admin/reports', icon: ShieldAlert },
              { label: 'Audit Logs', to: '/admin/audit-logs', icon: ScrollText },
            ],
          },
        ]
      : []),
    {
      title: 'Account',
      items: [{ label: 'My Profile & Badges', to: '/profile', icon: UserIcon }],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:z-30 flex-shrink-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-slate-800">
          <NavLink to="/dashboard" className="flex items-center gap-2.5 group">
            <img
              src="/logo.png"
              alt="ShikshaSetu"
              className="w-10 h-10 object-contain rounded-xl drop-shadow-sm group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col">
              <span className="text-base font-black tracking-tight text-gray-900 dark:text-gray-100 font-sans leading-tight">
                Shiksha<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600">Setu</span>
              </span>
              <span className="text-[9px] font-bold text-gray-400 dark:text-gray-400 tracking-tight">
                Learn • Collaborate • Grow
              </span>
            </div>
          </NavLink>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          {navItems.map((group, idx) => (
            <div key={idx} className="space-y-1">
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {group.title}
              </p>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => onClose()}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 select-none',
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold shadow-2xs border border-blue-200/60 dark:border-blue-800/60'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800/80 hover:text-gray-900 dark:hover:text-gray-200'
                    )
                  }
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </div>

        {/* User Role Badge Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-slate-800/80 bg-gray-50/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between px-2 text-xs text-gray-500 dark:text-gray-400">
            <span>Role:</span>
            <span className="font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider text-[11px]">
              {role}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
