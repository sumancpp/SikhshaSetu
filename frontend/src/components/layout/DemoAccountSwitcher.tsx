import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, GraduationCap, UserCheck } from 'lucide-react';

export const DemoAccountSwitcher: React.FC = () => {
  const { user, switchDemoAccount } = useAuth();

  return (
    <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 text-white text-[11px] sm:text-xs py-1 px-2.5 sm:px-4 flex items-center justify-between gap-1.5 sm:gap-2 shadow-inner border-b border-indigo-700/50 overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="bg-yellow-400 text-slate-950 font-black px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] uppercase tracking-wider">
          Demo
        </span>
        <span className="hidden md:inline text-indigo-200">
          Logged in: <strong className="text-white">{user?.name || 'Guest'}</strong> ({user?.role})
        </span>
      </div>

      <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
        <span className="text-indigo-300 mr-0.5 hidden lg:inline">Switch:</span>
        <button
          onClick={() => switchDemoAccount('ADMIN')}
          className={`flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md transition-all font-medium text-[11px] sm:text-xs ${
            user?.role === 'ADMIN'
              ? 'bg-blue-500 text-white shadow-xs'
              : 'bg-indigo-950/70 hover:bg-indigo-800 text-indigo-200'
          }`}
          title="Switch to Admin"
        >
          <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span>Admin</span>
        </button>

        <button
          onClick={() => switchDemoAccount('FACULTY')}
          className={`flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md transition-all font-medium text-[11px] sm:text-xs ${
            user?.role === 'FACULTY'
              ? 'bg-blue-500 text-white shadow-xs'
              : 'bg-indigo-950/70 hover:bg-indigo-800 text-indigo-200'
          }`}
          title="Switch to Faculty (Prof. Sharma)"
        >
          <GraduationCap className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span><span className="hidden sm:inline">Faculty (</span>Prof. Sharma<span className="hidden sm:inline">)</span></span>
        </button>

        <button
          onClick={() => switchDemoAccount('STUDENT')}
          className={`flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md transition-all font-medium text-[11px] sm:text-xs ${
            user?.role === 'STUDENT'
              ? 'bg-blue-500 text-white shadow-xs'
              : 'bg-indigo-950/70 hover:bg-indigo-800 text-indigo-200'
          }`}
          title="Switch to Student (Suman)"
        >
          <UserCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span><span className="hidden sm:inline">Student (</span>Suman<span className="hidden sm:inline">)</span></span>
        </button>
      </div>
    </div>
  );
};
