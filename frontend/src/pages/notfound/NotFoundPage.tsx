import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50 dark:bg-[#0b0f19]">
      <h1 className="text-6xl font-black text-blue-600 dark:text-blue-400 mb-2">404</h1>
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Page Not Found</h2>
      <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mb-6 leading-relaxed">
        The workspace page or academic resource you are looking for does not exist or has been relocated.
      </p>
      <Link to="/dashboard">
        <Button leftIcon={<Home className="w-4 h-4" />}>Back to Home Dashboard</Button>
      </Link>
    </div>
  );
};
