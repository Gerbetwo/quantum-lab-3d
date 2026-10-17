'use client';

import React from 'react';

export interface GlassCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  children?: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  badge?: React.ReactNode;
  headerRight?: React.ReactNode;
  cornerNotch?: boolean;
  telemetryId?: string;
  variant?: 'default' | 'hud' | 'telemetry';
}

/**
 * Ultra-sharp flight-deck HUD GlassCard primitive.
 * Uses 1px tactical borders (border-slate-300 light, border-slate-800 dark),
 * zero drop-shadow fluff, and sub-pixel corner notch styling.
 */
export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  title,
  badge,
  headerRight,
  cornerNotch = true,
  telemetryId,
  variant = 'default',
  ...props
}) => {
  const isHudVariant = variant === 'hud' || variant === 'telemetry';

  return (
    <div
      data-testid="hud-glass-card"
      className={`relative p-3.5 border border-slate-300 dark:border-slate-800 bg-white/95 dark:bg-[#0B0E14]/95 text-foreground transition-colors select-none ${className}`}
      style={{
        // Zero drop-shadow fluff; clean flat telemetry border
        boxShadow: 'none',
      }}
      {...props}
    >
      {/* Sub-pixel corner notch styling */}
      {cornerNotch && (
        <>
          <span
            aria-hidden="true"
            className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-sky-600 dark:border-cyan-400 pointer-events-none"
          />
          <span
            aria-hidden="true"
            className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-sky-600 dark:border-cyan-400 pointer-events-none"
          />
          <span
            aria-hidden="true"
            className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-sky-600 dark:border-cyan-400 pointer-events-none"
          />
          <span
            aria-hidden="true"
            className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-sky-600 dark:border-cyan-400 pointer-events-none"
          />
        </>
      )}

      {/* Header bar with monospaced telemetry border */}
      {(title || badge || headerRight || telemetryId) && (
        <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-slate-300 dark:border-slate-800">
          <div className="flex items-center gap-2">
            {telemetryId && (
              <span className="text-[10px] font-mono tracking-widest text-slate-500 dark:text-slate-400 uppercase">
                [{telemetryId}]
              </span>
            )}
            {title && (
              <h3 className="text-xs font-mono font-semibold tracking-wider text-slate-900 dark:text-cyan-400 uppercase">
                {title}
              </h3>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {badge && (
              <span className="text-[10px] font-mono tabular-nums px-1.5 py-0.5 border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-cyan-300">
                {badge}
              </span>
            )}
            {headerRight}
          </div>
        </div>
      )}

      {/* Card Content with monospaced numeric styling */}
      <div className={`space-y-2 text-xs font-mono ${isHudVariant ? 'tracking-tight' : ''}`}>
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

/**
 * High-contrast numeric telemetry display with JetBrains Mono / Inter monospaced numeric tabular layout.
 */
export const TelemetryValue: React.FC<TelemetryValueProps> = ({
  label,
  value,
  unit,
  highlight = 'default',
  className = '',
}) => {
  const highlightStyles = {
    default: 'text-foreground',
    cyan: 'text-sky-600 dark:text-cyan-400',
    amber: 'text-amber-600 dark:text-amber-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    purple: 'text-purple-600 dark:text-purple-400',
    rose: 'text-rose-600 dark:text-rose-400',
  };

  return (
    <div className={`flex items-center justify-between py-0.5 border-b border-slate-200/60 dark:border-slate-800/60 text-xs font-mono ${className}`}>
      <span className="font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">{label}</span>
      <span className={`font-mono font-bold tabular-nums tracking-tight ${highlightStyles[highlight]}`}>
        {value}
        {unit && <span className="ml-1 text-[10px] font-normal text-slate-500 dark:text-slate-400">{unit}</span>}
      </span>
    </div>
  );
};

export default GlassCard;
