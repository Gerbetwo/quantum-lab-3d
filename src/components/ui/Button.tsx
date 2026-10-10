import React from 'react';
import { clsx } from 'clsx';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
          'disabled:opacity-50 disabled:cursor-not-allowed motion-safe:transition-all',
          // Minimum mobile touch target compliance (44px min height/width)
          'min-h-[44px] px-4 py-2 text-sm',
          {
            'bg-cyan-600 text-white hover:bg-cyan-500 active:bg-cyan-700': variant === 'primary',
            'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700': variant === 'secondary',
            'bg-rose-600 text-white hover:bg-rose-500': variant === 'danger',
            'bg-transparent text-slate-300 hover:bg-slate-800/50': variant === 'ghost',
            'text-xs px-3 py-1.5 min-h-[36px]': size === 'sm',
            'text-base px-6 py-3': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
