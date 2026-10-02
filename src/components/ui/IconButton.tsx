'use client';

import React from 'react';
import clsx from 'clsx';
import Tooltip from './Tooltip';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  tooltip?: string;
  tooltipDelay?: number;
  variant?: 'default' | 'ghost' | 'danger';
}

export default function IconButton({
  icon,
  label,
  tooltip,
  tooltipDelay = 200,
  variant = 'default',
  className,
  ...rest
}: IconButtonProps) {
  const cls = clsx(
    'inline-flex items-center justify-center p-1.5 rounded-lg border transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-cyan/40',
    variant === 'default' && 'bg-surface-2 border-edge text-slate-300 hover:bg-surface-3 hover:text-white',
    variant === 'ghost' && 'border-transparent text-slate-400 hover:bg-surface-2 hover:text-white',
    variant === 'danger' && 'bg-rose-950/40 border-rose-500/40 text-rose-300 hover:bg-rose-900/60',
    className
  );

  const btn = (
    <button type="button" aria-label={label} className={cls} {...rest}>
      {icon}
    </button>
  );

  if (!tooltip) return btn;

  return (
    <Tooltip content={tooltip} delayDuration={tooltipDelay}>
      {btn}
    </Tooltip>
  );
}
