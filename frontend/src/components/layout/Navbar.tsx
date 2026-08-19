import React from 'react';
import { Search, Flame, Award, Menu, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { ThemeToggle } from '../common/ThemeToggle';
import { Avatar } from '../common/Avatar';
import { NotificationDropdown } from './NotificationDropdown';
import { Link, useNavigate } from 'react-router-dom';

export interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { onlineCount } = useSocket();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 transition-colors">
      <div className="flex h-14 sm:h-16 items-center justify-between px-2.5 sm:px-4 md:px-6">
        {/* Left Side: Mobile Menu Button & Brand / Search Trigger */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 -ml-1 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 lg:hidden"
            aria-label="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Quick Search Shortcut Trigger */}
          <button
            onClick={() => {
              const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true });
              window.dispatchEvent(event);
            }}
            className="flex items-center gap-1.5 sm:gap-2.5 px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700/80 bg-gray-50/80 dark:bg-slate-800/60 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-slate-600 text-xs transition-all w-28 sm:w-44 md:w-64"
          >
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="flex-1 text-left truncate text-[11px] sm:text-xs">Search...</span>
            <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-semibold bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded shadow-2xs">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Right Side: Points, Streak, Live Presence, Theme, Notification & User Avatar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Online Users Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{onlineCount} Online</span>
          </div>

          {/* Student / Faculty Points Badge */}
          {user && (
            <Link
              to="/leaderboard"
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-bold hover:scale-105 transition-transform"
              title="Your Academic Points & Rank"
            >
              <Award className="w-4 h-4 text-amber-500" />
              <span>{user.points || 0} pts</span>
            </Link>
          )}

          {/* Learning Streak */}
          {user?.role === 'STUDENT' && (
            <div
              className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 text-xs font-bold"
              title="Consecutive Learning Streak"
            >
              <Flame className="w-4 h-4 text-orange-500" />
              <span>{user.streakDays || 1}d</span>
            </div>
          )}

          <ThemeToggle />

          <NotificationDropdown />

          {/* User Profile Pill & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-slate-800">
            <Link to="/profile" className="flex items-center gap-2 group">
              <Avatar
                src={user?.avatar}
                name={user?.name}
                size="sm"
                className="group-hover:ring-2 ring-blue-500 transition-all"
              />
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate max-w-[110px]">
                  {user?.name}
                </p>
                <p className="text-[10px] text-gray-400 capitalize">{user?.role?.toLowerCase()}</p>
              </div>
            </Link>

            <button
              onClick={() => logout()}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors ml-1"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
