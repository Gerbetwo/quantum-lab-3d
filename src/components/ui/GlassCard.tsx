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
- Ultra-sharp flight-deck HUD GlassCard primitive.
- Leverages theme tokens, 1px tactical borders, and sub-pixel corner notch styling.
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
      className={`relative p-3.5 hud-panel text-foreground transition-colors select-none ${className}`}
      {...props}
    >
      {/* Sub-pixel corner notch styling */}
      {cornerNotch && (
        <>
          <span
            aria-hidden="true"
            className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-quantum-cyan pointer-events-none"
          />
          <span
            aria-hidden="true"
            className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-quantum-cyan pointer-events-none"
          />
          <span
            aria-hidden="true"
            className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-quantum-cyan pointer-events-none"
          />
          <span
            aria-hidden="true"
            className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-quantum-cyan pointer-events-none"
          />
        </>
      )}

      {/* Header bar with monospaced telemetry border */}
      {(title || badge || headerRight || telemetryId) && (
        <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-border">
          <div className="flex items-center gap-2">
            {telemetryId && (
              <span className="text-[10px] telemetry-mono tracking-widest text-muted-foreground uppercase">
                [{telemetryId}]
              </span>
            )}
            {title && (
              <h3 className="text-xs telemetry-mono font-semibold tracking-wider text-quantum-cyan uppercase">
                {title}
              </h3>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {badge && (
              <span className="text-[10px] telemetry-mono tabular-nums px-1.5 py-0.5 hud-badge-cyan">
                {badge}
              </span>
            )}
            {headerRight}
          </div>
        </div>
      )}

      {/* Card Content with monospaced numeric styling */}
      <div className={`space-y-2 text-xs telemetry-mono ${isHudVariant ? 'tracking-tight' : ''}`}>
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
- High-contrast numeric telemetry display with monospaced tabular layout.
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
    cyan: 'text-quantum-cyan',
    amber: 'text-warning',
    emerald: 'text-success',
    purple: 'text-quantum-purple',
    rose: 'text-destructive',
  };

  return (
    <div className={`flex items-center justify-between py-0.5 border-b border-border text-xs telemetry-mono ${className}`}>
      <span className="telemetry-mono text-muted-foreground uppercase tracking-wider text-[11px]">{label}</span>
      <span className={`telemetry-mono font-bold tabular-nums tracking-tight ${highlightStyles[highlight]}`}>
        {value}
        {unit && <span className="ml-1 text-[10px] font-normal text-muted-foreground">{unit}</span>}
      </span>
    </div>
  );
};

export default GlassCard;