import React from 'react';
import { clsx } from 'clsx';

export interface SceneFallbackProps {
  title?: string;
  description?: string;
  stateSummary?: string;
  className?: string;
}

export const SceneFallback: React.FC<SceneFallbackProps> = ({
  title = 'WebGL Simulation Unavailable',
  description = 'WebGL is not available or supported on this device. Showing a simplified textual representation of the quantum simulation.',
  stateSummary,
  className,
}) => {
  return (
    <div 
      role="region" 
      aria-label={title}
      className={clsx(
        'flex flex-col items-center justify-center h-full p-6 bg-background text-muted-foreground rounded-xl border border-border',
        className
      )}
    >
      <svg className="w-12 h-12 mb-3 text-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <h3 className="text-base font-semibold text-foreground mb-1 text-center">{title}</h3>
      <p className="text-sm text-muted-foreground text-center max-w-md">{description}</p>
      {stateSummary && (
        <div className="mt-4 p-3 bg-card/80 border border-border rounded-lg w-full max-w-md">
          <span className="text-xs font-mono uppercase tracking-wider text-accent block mb-1">Current Simulation State:</span>
          <p className="text-xs font-mono text-foreground">{stateSummary}</p>
        </div>
      )}
    </div>
  );
};
