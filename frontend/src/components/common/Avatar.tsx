import React, { useState } from 'react';
import { getInitials } from '../../utils/formatters';
import { cn } from '../../utils/helpers';

export interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showOnline?: boolean;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name = 'User',
  size = 'md',
  showOnline = false,
  className,
}) => {
  const [imageError, setImageError] = useState(false);

  const sizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const badgeSizes = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
  };

  return (
    <div className={cn('relative inline-flex flex-shrink-0', className)}>
      {src && !imageError ? (
        <img
          src={src}
          alt={name}
          onError={() => setImageError(true)}
          className={cn('rounded-full object-cover border border-gray-200 dark:border-slate-700', sizes[size])}
        />
      ) : (
        <div
          className={cn(
            'rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center border border-white/20 shadow-xs',
            sizes[size]
          )}
        >
          {getInitials(name)}
        </div>
      )}

      {showOnline && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900',
            badgeSizes[size]
          )}
        />
      )}
    </div>
  );
};
