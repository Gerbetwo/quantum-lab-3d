'use client';

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import clsx from 'clsx';

type Side = 'top' | 'bottom' | 'left' | 'right';

type TriggerProps = {
  'aria-describedby'?: string;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
  onFocus?: (e: React.FocusEvent) => void;
  onBlur?: (e: React.FocusEvent) => void;
};

export interface TooltipProps {
  children: React.ReactElement<TriggerProps>;
  content: string;
  delayDuration?: number;
  side?: Side;
  className?: string;
}

export default function Tooltip({
  children,
  content,
  delayDuration = 200,
  side = 'top',
  className,
}: TooltipProps) {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const show = useCallback(() => {
    clearTimer();
    if (delayDuration <= 0) { setOpen(true); return; }
    timerRef.current = setTimeout(() => setOpen(true), delayDuration);
  }, [clearTimer, delayDuration]);

  const hide = useCallback(() => {
    clearTimer();
    setOpen(false);
  }, [clearTimer]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') hide(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, hide]);

  const p = children.props;
  const cloned = React.cloneElement(children, {
    'aria-describedby': open ? id : p['aria-describedby'],
    onMouseEnter: (e: React.MouseEvent) => { p.onMouseEnter?.(e); show(); },
    onMouseLeave: (e: React.MouseEvent) => { p.onMouseLeave?.(e); hide(); },
    onFocus: (e: React.FocusEvent) => { p.onFocus?.(e); show(); },
    onBlur: (e: React.FocusEvent) => { p.onBlur?.(e); hide(); },
  });

  return (
    <span className="relative inline-flex">
      {cloned}
      {open && (
        <span
          role="tooltip"
          id={id}
          className={clsx(
            'absolute z-50 px-2 py-1 rounded-md text-[10px] font-mono whitespace-nowrap',
            'bg-slate-900 border border-slate-700 text-slate-200 shadow-lg pointer-events-none',
            side === 'top' && 'bottom-full mb-1.5 left-1/2 -translate-x-1/2',
            side === 'bottom' && 'top-full mt-1.5 left-1/2 -translate-x-1/2',
            side === 'left' && 'right-full mr-1.5 top-1/2 -translate-y-1/2',
            side === 'right' && 'left-full ml-1.5 top-1/2 -translate-y-1/2',
            className
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}
