'use client';

import React, { useState, useId, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, _ref) => {
    return (
      <button
        ref={_ref}
        className={clsx(
          'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
          'disabled:opacity-50 disabled:cursor-not-allowed motion-safe:transition-all',
          // Minimum mobile touch target compliance (44px min height/width)
          'min-h-11 px-4 py-2 text-sm',
          {
            'bg-primary text-primary-foreground hover:opacity-90': variant === 'primary',
            'bg-card text-foreground border border-border hover:bg-muted': variant === 'secondary',
            'bg-destructive text-white hover:bg-destructive-hover': variant === 'danger',
            'bg-transparent text-muted-foreground hover:bg-card-50': variant === 'ghost',
            'text-xs px-3 py-1.5 min-h-9': size === 'sm',
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


interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  badge?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', title, badge }) => {
  return (
    <div className={`hud-glass-card p-4 transition-all duration-300 hover:border-accent-glow ${className}`}>
      {(title || badge) && (
        <div className="flex items-center justify-between mb-3 border-b border-accent-border pb-2">
          {title && <h3 className="text-sm font-semibold tracking-wider text-accent uppercase hud-font-mono">{title}</h3>}
          {badge && <span className="text-xs px-2 py-0.5 rounded bg-accent-subtle text-accent border border-accent-border hud-font-mono">{badge}</span>}
        </div>
      )}
      {children}
    </div>
  );
};


interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
  icon: React.ReactNode;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, 'aria-label': ariaLabel, icon, ...props }, _ref) => {
    return (
      <button
        ref={_ref}
        aria-label={ariaLabel}
        className={clsx(
          'inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:text-white',
          'bg-card-60 hover:bg-muted border border-border-60 transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
          'min-w-11 min-h-11', // Mobile touch target size requirement
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


interface RangeControlProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  valueDisplay?: string | number;
  unit?: string;
}

export const RangeControl: React.FC<RangeControlProps> = ({
  label,
  valueDisplay,
  unit,
  className,
  min = 0,
  max = 100,
  value,
  ...props
}) => {
  const id = useId();
  const display =
    valueDisplay !== undefined
      ? valueDisplay
      : unit && value !== undefined
        ? `${value} ${unit}`
        : value;

  return (
    <div className={clsx('flex flex-col gap-1.5 w-full', className)}>
      <div className="flex justify-between items-center text-sm font-medium text-foreground">
        <label htmlFor={id} className="cursor-pointer">
          {label}
        </label>
        {display !== undefined && (
          <span aria-hidden="true" className="font-mono text-accent text-xs px-2 py-0.5 bg-card-80 rounded border border-border">
            {display}
          </span>
        )}
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        aria-valuemin={Number(min)}
        aria-valuemax={Number(max)}
        aria-valuenow={Number(value)}
        className={clsx(
          'w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-cyan-500',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
          'min-h-11 py-3' // Generous touch target area on mobile for range containers
        )}
        {...props}
      />
    </div>
  );
};


type StatusType = 'success' | 'error' | 'warning' | 'info';

interface StatusMessageProps {
  type?: StatusType;
  variant?: StatusType;
  message?: string;
  children?: React.ReactNode;
  className?: string;
}

const statusConfig = {
  success: {
    icon: CheckCircle2,
    colorClass: 'bg-success-subtle border-success-border text-success',
    iconColor: 'text-success',
    label: 'Success:',
  },
  error: {
    icon: AlertCircle,
    colorClass: 'bg-destructive-subtle border-destructive-border text-destructive',
    iconColor: 'text-destructive',
    label: 'Error:',
  },
  warning: {
    icon: AlertTriangle,
    colorClass: 'bg-warning-subtle border-warning-border text-warning',
    iconColor: 'text-warning',
    label: 'Warning:',
  },
  info: {
    icon: Info,
    colorClass: 'bg-accent-subtle border-accent-border text-accent',
    iconColor: 'text-accent',
    label: 'Information:',
  },
};

export const StatusMessage: React.FC<StatusMessageProps> = ({
  type,
  variant,
  message,
  children,
  className,
}) => {
  const currentType = variant || type || 'info';
  const config = statusConfig[currentType] || statusConfig.info;
  const IconComponent = config.icon;
  const content = children || message;

  return (
    <div
      role="region"
      aria-live="polite"
      className={clsx(
        'flex items-center gap-3 p-3 rounded-lg border text-sm',
        config.colorClass,
        className
      )}
    >
      <IconComponent className={clsx('w-5 h-5 shrink-0', config.iconColor)} aria-hidden="true" />
      <div className="flex-1">
        <span className="sr-only">{config.label}</span>
        <span>{content}</span>
      </div>
    </div>
  );
};


interface TooltipProps {
  content: string;
  children: React.ReactElement;
  delayDuration?: number;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  delayDuration = 200,
  side = 'top',
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipId = useId();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleOpen = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (delayDuration === 0) {
      setIsVisible(true);
    } else {
      timerRef.current = setTimeout(() => {
        setIsVisible(true);
      }, delayDuration);
    }
  };

  const handleClose = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsVisible(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    if (isVisible) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isVisible]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const child = React.Children.only(children);

  return (
    <div
      className={clsx('relative inline-flex', className)}
      aria-describedby={isVisible ? tooltipId : undefined}
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
      onFocus={handleOpen}
      onBlur={handleClose}
    >
      {React.cloneElement(child, {
        'aria-describedby': isVisible ? tooltipId : undefined,
      } as Record<string, unknown>)}
      {isVisible && (
        <div
          id={tooltipId}
          role="tooltip"
          className={clsx(
            'absolute left-1/2 -translate-x-1/2 px-2.5 py-1',
            side === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2',
            'bg-background text-foreground text-xs rounded shadow-lg border border-border',
            'whitespace-nowrap z-50 pointer-events-none',
            'motion-safe:transition-opacity motion-safe:duration-150'
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
};