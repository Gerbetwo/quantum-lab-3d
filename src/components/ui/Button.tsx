'use client';

import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'hud';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  cornerNotch?: boolean;
  telemetryCode?: string;
  isLoading?: boolean;
}

/**
 * Ultra-sharp flight-deck HUD Button primitive.
 * Enforces 1px sharp borders (border-slate-300 in light, border-slate-800 in dark),
 * zero drop-shadow fluff, and JetBrains Mono / Inter monospaced numeric styling.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = '',
      variant = 'primary',
      size = 'md',
      cornerNotch = false,
      telemetryCode,
      isLoading = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        'bg-sky-600 hover:bg-sky-500 text-white border-sky-700 dark:bg-cyan-500/15 dark:hover:bg-cyan-500/25 dark:text-cyan-400 dark:border-cyan-500/50 dark:hover:border-cyan-400',
      secondary:
        'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-900/90 dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-800 dark:hover:border-slate-700',
      outline:
        'bg-transparent hover:bg-slate-100 text-slate-800 border-slate-300 dark:bg-transparent dark:hover:bg-slate-900 dark:text-slate-300 dark:border-slate-800 dark:hover:border-cyan-500/40 dark:hover:text-cyan-400',
      ghost:
        'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 border-transparent dark:bg-transparent dark:hover:bg-slate-900 dark:text-slate-400 dark:hover:text-slate-100 dark:border-transparent',
      danger:
        'bg-red-50 hover:bg-red-100 text-red-700 border-red-300 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 dark:border-red-500/40 dark:hover:border-red-500/60',
      hud:
        'bg-slate-100/90 hover:bg-slate-200/90 text-slate-900 border-slate-300 dark:bg-[#0B0E14]/90 dark:hover:bg-slate-900 dark:text-slate-100 dark:border-slate-800 dark:hover:border-cyan-400/50',
    };

    const sizeStyles: Record<ButtonSize, string> = {
      sm: 'h-7 px-2.5 text-xs gap-1.5',
      md: 'h-9 px-3.5 text-xs gap-2',
      lg: 'h-11 px-5 text-sm gap-2.5',
      icon: 'h-8 w-8 p-0 justify-center',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        data-testid="hud-button"
        className={`relative inline-flex items-center justify-center font-mono font-semibold uppercase tracking-wider tabular-nums border transition-colors select-none cursor-pointer disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        style={{
          boxShadow: 'none',
        }}
        {...props}
      >
        {/* Sub-pixel corner notch styling for tactical flight-deck HUD buttons */}
        {cornerNotch && (
          <>
            <span
              aria-hidden="true"
              className="absolute top-0 left-0 w-1 h-1 border-t border-l border-current opacity-70 pointer-events-none"
            />
            <span
              aria-hidden="true"
              className="absolute top-0 right-0 w-1 h-1 border-t border-r border-current opacity-70 pointer-events-none"
            />
            <span
              aria-hidden="true"
              className="absolute bottom-0 left-0 w-1 h-1 border-b border-l border-current opacity-70 pointer-events-none"
            />
            <span
              aria-hidden="true"
              className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-current opacity-70 pointer-events-none"
            />
          </>
        )}

        {telemetryCode && (
          <span className="text-[10px] tracking-widest opacity-60 font-normal">
            [{telemetryCode}]
          </span>
        )}

        {isLoading ? (
          <span className="inline-block animate-spin mr-1">⟳</span>
        ) : null}

        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
