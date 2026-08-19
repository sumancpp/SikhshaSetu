import React from 'react';
import { cn } from '../../utils/helpers';

export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-gray-200 dark:bg-slate-800/80',
        className
      )}
      {...props}
    />
  );
};
