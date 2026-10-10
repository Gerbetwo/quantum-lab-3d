import React, { useId } from 'react';
import { clsx } from 'clsx';

export interface RangeControlProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  valueDisplay?: string | number;
}

export const RangeControl: React.FC<RangeControlProps> = ({
  label,
  valueDisplay,
  className,
  min = 0,
  max = 100,
  value,
  ...props
}) => {
  const id = useId();

  return (
    <div className={clsx('flex flex-col gap-1.5 w-full', className)}>
      <div className="flex justify-between items-center text-sm font-medium text-foreground">
        <label htmlFor={id} className="cursor-pointer">
          {label}
        </label>
        {valueDisplay !== undefined && (
          <span aria-hidden="true" className="font-mono text-accent text-xs px-2 py-0.5 bg-card/80 rounded border border-border">
            {valueDisplay}
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
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
          'min-h-[44px] py-3' // Generous touch target area on mobile for range containers
        )}
        {...props}
      />
    </div>
  );
};
