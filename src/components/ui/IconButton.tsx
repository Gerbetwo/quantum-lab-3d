import React from 'react';
import { clsx } from 'clsx';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
  icon: React.ReactNode;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, 'aria-label': ariaLabel, icon, ...props }, ref) => {
    return (
      <button
        ref={ref}
        aria-label={ariaLabel}
        className={clsx(
          'inline-flex items-center justify-center rounded-lg p-2 text-slate-300 hover:text-white',
          'bg-slate-800/60 hover:bg-slate-700 border border-slate-700/60 transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
          'min-w-[44px] min-h-[44px]', // Mobile touch target size requirement
          className
        )}
        {...props}
      >
        <span aria-hidden="true" className="flex items-center justify-center">
          {icon}
        </span>
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
