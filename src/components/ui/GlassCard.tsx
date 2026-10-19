'use client';

import React from 'react';

export interface GlassCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  children?: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  badge?: React.ReactNode;
  headerRight?: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  title,
  badge,
  headerRight,
  ...props
}) => {
  return (
    <div
      data-testid="hud-glass-card"
      className={`p-3.5 hud-panel text-foreground select-none ${className}`}
      {...props}
    >
      {(title || badge || headerRight) && (
        <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-border">
          <div className="flex items-center gap-2">
            {title && (
              <h3 className="text-xs font-mono font-semibold tracking-wider text-quantum-cyan uppercase">
                {title}
              </h3>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {badge && (
              <span className="text-[10px] font-mono tabular-nums px-1.5 py-0.5 hud-badge-cyan">
                {badge}
              </span>
            )}
            {headerRight}
          </div>
        </div>
      )}

      <div className="space-y-2 text-xs font-mono">
        {children}
      </div>
    </div>
  );
};

export interface TelemetryValueProps {
  label: string;
  value: string | number;
  unit?: string;
  highlight?: 'default' | 'cyan' | 'amber' | 'emerald' | 'purple' | 'rose';
  className?: string;
}

export const TelemetryValue: React.FC<TelemetryValueProps> = ({
  label,
  value,
  unit,
  highlight = 'default',
  className = '',
}) => {
  const highlightStyles = {
    default: 'text-foreground',
    cyan: 'text-quantum-cyan',
    amber: 'text-warning',
    emerald: 'text-success',
    purple: 'text-quantum-purple',
    rose: 'text-destructive',
  };

  return (
    <div className={`flex items-center justify-between py-0.5 border-b border-border text-xs font-mono ${className}`}>
      <span className="font-mono text-muted-foreground uppercase tracking-wider text-[11px]">{label}</span>
      <span className={`font-mono font-bold tabular-nums tracking-tight ${highlightStyles[highlight]}`}>
        {value}
        {unit && <span className="ml-1 text-[10px] font-normal text-muted-foreground">{unit}</span>}
      </span>
    </div>
  );
};

export default GlassCard;
