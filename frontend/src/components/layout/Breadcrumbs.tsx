import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

export interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  const location = useLocation();

  const generatedItems =
    items ||
    location.pathname
      .split('/')
      .filter(Boolean)
      .map((segment, index, arr) => {
        const to = `/${arr.slice(0, index + 1).join('/')}`;
        const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
        return { label, to: index === arr.length - 1 ? undefined : to };
      });

  if (generatedItems.length === 0) return null;

  return (
    <nav className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 py-2">
      <Link
        to="/dashboard"
        className="flex items-center hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>
      {generatedItems.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400 dark:text-gray-600" />
          {item.to ? (
            <Link
              to={item.to}
              className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors font-medium truncate max-w-[150px]"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 dark:text-gray-100 font-bold truncate max-w-[200px]">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
