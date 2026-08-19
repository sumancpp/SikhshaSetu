import React from 'react';
import { cn } from '../../utils/helpers';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ className, hover = false, children, ...props }) => {
  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-xs transition-all duration-200',
        hover && 'card-hover cursor-pointer hover:border-blue-300 dark:hover:border-blue-800',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
