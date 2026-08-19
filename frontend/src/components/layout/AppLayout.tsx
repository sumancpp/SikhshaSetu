import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { MobileNav } from './MobileNav';
import { CommandPalette } from '../search/CommandPalette';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-[#0b0f19] text-gray-900 dark:text-gray-100 transition-colors">
      {/* Global Command Palette */}
      <CommandPalette />

      {/* Sidebar (sticky on desktop, off-canvas drawer on mobile) */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area with natural document scrolling and safe bottom clearance */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

        <main className="flex-1 p-3 sm:p-5 lg:p-8 max-w-7xl w-full mx-auto pb-8">
          <Outlet />
          {/* Guaranteed bottom clearance for mobile navigation bar across all pages */}
          <div className="h-24 lg:hidden w-full flex-shrink-0 pointer-events-none" aria-hidden="true" />
        </main>

        {/* Bottom Navigation for Mobile Devices */}
        <MobileNav />
      </div>
    </div>
  );
};
