'use client';

import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'hud';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        'bg-primary/15 hover:bg-primary/25 text-quantum-cyan border-quantum-cyan/40 hover:border-quantum-cyan',
      secondary:
        'bg-surface-2 hover:bg-surface-3 text-foreground border-border hover:border-edge',
      outline:
        'bg-transparent hover:bg-surface-2 text-foreground border-border hover:border-quantum-cyan/50 hover:text-quantum-cyan',
      ghost:
        'bg-transparent hover:bg-surface-2 text-muted-foreground hover:text-foreground border-transparent',
      danger:
        'bg-destructive/10 hover:bg-destructive/20 text-destructive border-destructive/40 hover:border-destructive/60',
      hud:
        'bg-surface-1 hover:bg-surface-2 text-foreground border-border hover:border-quantum-cyan/50',
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
        style={{ boxShadow: 'none' }}
        {...props}
      >
        {isLoading && <span className="inline-block animate-spin mr-1">⟳</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
