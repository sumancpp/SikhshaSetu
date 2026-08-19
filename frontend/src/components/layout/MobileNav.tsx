import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Layers, BookOpen, Target, Trophy, MessageSquare } from 'lucide-react';
import { cn } from '../../utils/helpers';

export const MobileNav: React.FC = () => {
  const items = [
    { label: 'Home', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Classes', to: '/classes', icon: Layers },
    { label: 'Subjects', to: '/subjects', icon: BookOpen },
    { label: 'Challenges', to: '/challenges', icon: Target },
    { label: 'Leaderboard', to: '/leaderboard', icon: Trophy },
    { label: 'Forum', to: '/forum', icon: MessageSquare },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-gray-200 dark:border-slate-800 lg:hidden px-2 py-1.5 flex items-center justify-around shadow-lg">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-1 p-1.5 rounded-xl text-[10px] font-semibold transition-colors',
              isActive
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            )
          }
        >
          <item.icon className="w-5 h-5" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </div>
  );
};
