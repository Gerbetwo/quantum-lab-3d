const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');
'use client';

import React, { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground text-white hover:opacity-90 shadow-md shadow-cyan-950/20',
        secondary: 'bg-card text-foreground hover:bg-muted border border-border',
        ghost: 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-card-50',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, _ref) => (
    <button
      ref={_ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
);
Button.displayName = 'Button';


interface DialogProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ isOpen, title, onClose, children }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="p-0 backdrop:bg-overlay-70 max-w-lg w-full rounded-2xl outline-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div className="bg-[#111a2c] border border-[#29364d] rounded-2xl p-6 text-[#f3f6fc] shadow-2xl flex flex-col gap-4">
        <div className="flex justify-between items-center border-b border-[#29364d] pb-3">
          <h3 id="dialog-title" className="text-lg font-semibold">{title}</h3>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Cerrar diálogo">
            ✕
          </Button>
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </dialog>
  );
};


interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string | null;
  onAction?: (() => void) | null;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-[#111a2c] border border-[#29364d] rounded-2xl">
      <h3 className="text-lg font-semibold text-[#f3f6fc] mb-1">{title}</h3>
      <p className="text-sm text-[#a6b2c6] max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
};


interface FormFieldProps {
  label: string;
  error?: string | null;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({ label, error, children }) => {
  return (
    <div className="flex flex-col gap-1.5 mb-4">
      <label className="text-sm font-medium text-[#f3f6fc]">{label}</label>
      {children}
      {error && <span className="text-xs text-destructive" role="alert">{error}</span>}
    </div>
  );
};


export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon?: React.ReactNode | null;
  tooltip?: string | null;
  children?: React.ReactNode | null;
}

export function IconButton({
  label,
  icon,
  tooltip,
  children,
  className = '',
  ...props
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      title={tooltip || label}
      className={`p-2 rounded-[0.625rem] bg-[#111a2c] text-[#f3f6fc] border border-[#29364d] hover:bg-[#172238] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#86e8f2] ${className}`}
      {...props}
    >
      {icon || children}
    </button>
  );
}


interface ProgressIndicatorProps {
  value: number; // 0 to 100
  label?: string | null;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ value, label }) => {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <div className="flex justify-between text-xs text-[#a6b2c6]">
          <span>{label}</span>
          <span>{Math.round(clamped)}%</span>
        </div>
      )}
      <div
        className="w-full bg-[#172238] rounded-full h-2 overflow-hidden border border-[#29364d]"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="bg-[#53d8e8] h-full transition-all duration-200"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};


interface RangeControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number | null;
  unit?: string | null;
  onChange: (val: number) => void;
}

export const RangeControl: React.FC<RangeControlProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
}) => {
  return (
    <div className="flex flex-col gap-2 p-4 rounded-2xl bg-[#111a2c] border border-[#29364d]">
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium text-[#f3f6fc]">{label}</span>
        <span className="font-mono text-[#53d8e8]">{value} {unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step ?? 1}
        value={value}
        onChange={(_e) => onChange(parseFloat(_e.target.value))}
        aria-label={label}
        className="w-full accent-[#53d8e8] cursor-pointer bg-[#29364d] rounded-lg h-2"
      />
    </div>
  );
};


interface SkeletonProps {
  className?: string | null;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = 'h-4 w-full' }) => {
  return (
    <div
      className={`bg-[#172238] animate-pulse rounded-md ${className ?? 'h-4 w-full'}`}
      role="status"
      aria-label="Cargando..."
    />
  );
};


interface StatusMessageProps {
  variant?: 'success' | 'error' | 'info';
  children: React.ReactNode;
}

export const StatusMessage: React.FC<StatusMessageProps> = ({ variant = 'info', children }) => {
  const variants = {
    success: 'bg-success-subtle border-success-border text-success',
    error: 'bg-destructive-subtle border-destructive-border text-destructive',
    info: 'bg-[#172238] border-[#29364d] text-[#53d8e8]'
  };

  return (
    <div
      className={`p-4 rounded-[0.625rem] border text-sm ${variants[variant]}`}
      role="region"
      aria-live="polite"
    >
      {children}
    </div>
  );
};


interface TooltipProps {
  content: string;
  delayDuration?: number | null;
  side?: 'top' | 'right' | 'bottom' | 'left' | null;
  children: ReactNode;
}

export function Tooltip({
  content,
  delayDuration = 200,
  side: _side = 'top',
  children,
}: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [id] = useState(() => `tooltip-${Math.random().toString(36).substr(2, 9)}`);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (delayDuration === 0) {
      setIsOpen(true);
    } else {
      timerRef.current = setTimeout(() => {
        setIsOpen(true);
      }, delayDuration ?? 200);
    }
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (_e: KeyboardEvent) => {
      if (_e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
      {...(isOpen ? { 'aria-describedby': id } : {})}
    >
      {children}
      {isOpen && (
        <div
          role="tooltip"
          id={id}
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-xs bg-[#111a2c] text-[#f3f6fc] border border-[#29364d] rounded-md shadow-lg whitespace-nowrap pointer-events-none"
        >
          {content}
        </div>
      )}
    </div>
  );
}


export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const QUERIES: Record<Breakpoint, string> = {
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1280px)',
  xl: '(min-width: 1920px)',
  '2xl': '(min-width: 2560px)',
};

/**
- Returns the current breakpoint (largest matching). SSR-safe: returns 'sm' on server.
- Listens to all queries so a single resize updates once.
 */
export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>('sm');

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mqls = (Object.keys(QUERIES) as Breakpoint[]).map((k) => ({
      k,
      mql: window.matchMedia(QUERIES[k]),
    }));
    const compute = () => {
      const matched = mqls.filter((_m) => _m.mql.matches).map((_m) => _m.k);
      setBp((matched[matched.length - 1] as Breakpoint) ?? 'sm');
    };
    compute();
    mqls.forEach((_m) => _m.mql.addEventListener('change', compute));
    return () => mqls.forEach((_m) => _m.mql.removeEventListener('change', compute));
  }, []);

  return bp;
}

export function useIsDesktop(): boolean {
  const bp = useBreakpoint();
  return bp === 'lg' || bp === 'xl' || bp === '2xl';
}


interface FullscreenDocument extends Document {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
  msFullscreenElement?: Element | null;
  msExitFullscreen?: () => Promise<void>;
}

interface FullscreenElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
}

function getFullscreenElement(): Element | null {
  if (typeof document === 'undefined') return null;
  const d = document as FullscreenDocument;
  return d.fullscreenElement ?? d.webkitFullscreenElement ?? d.msFullscreenElement ?? null;
}

export interface UseFullscreenResult {
  isFullscreen: boolean;
  enter: () => Promise<void>;
  exit: () => Promise<void>;
  toggle: () => Promise<void>;
}

/**
- SSR-safe Fullscreen API wrapper. Falls back gracefully when the API
- is unavailable (jsdom, Safari old, permissions denied).
 */
export function useFullscreen(): UseFullscreenResult {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onChange = () => setIsFullscreen(Boolean(getFullscreenElement()));
    onChange();
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange as EventListener);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange as EventListener);
    };
  }, []);

  const enter = useCallback(async () => {
    if (typeof document === 'undefined') return;
    const el = document.documentElement as FullscreenElement;
    const fn = el.requestFullscreen ?? el.webkitRequestFullscreen ?? el.msRequestFullscreen;
    if (!fn) return;
    try { await fn.call(el); } catch { /* denied by user or browser */ }
  }, []);

  const exit = useCallback(async () => {
    if (typeof document === 'undefined') return;
    const d = document as FullscreenDocument;
    const fn = d.exitFullscreen ?? d.webkitExitFullscreen ?? d.msExitFullscreen;
    if (!fn) return;
    try { await fn.call(d); } catch { /* no-op */ }
  }, []);

  const toggle = useCallback(async () => {
    if (getFullscreenElement()) await exit();
    else await enter();
  }, [enter, exit]);

  return { isFullscreen, enter, exit, toggle };
}


export type Theme = 'light' | 'dark';
const THEME_STORAGE_KEY = 'ql-theme';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark';
    try {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        document.documentElement.classList.toggle('dark', stored === 'dark');
        return stored;
      }
    } catch { /* ignore */ }
    document.documentElement.classList.toggle('dark', true);
    return 'dark';
  });

  const toggle = () => {
    setTheme((_prev) => {
      const next: Theme = _prev === 'dark' ? 'light' : 'dark';
      if (typeof document !== 'undefined') document.documentElement.classList.toggle('dark', next === 'dark');
      try { window.localStorage.setItem(THEME_STORAGE_KEY, next); } catch { /* ignore */ }
      return next;
    });
  };

  return { theme, toggle };
}