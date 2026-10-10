import React, { useState, useId } from 'react';
import { clsx } from 'clsx';

export interface TooltipProps {
  content: string;
  children: React.ReactElement;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, className }) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipId = useId();

  const child = React.Children.only(children);

  return (
    <div 
      className={clsx('relative inline-flex', className)}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {React.cloneElement(child, {
        'aria-describedby': isVisible ? tooltipId : undefined,
      } as Record<string, unknown>)}
      {isVisible && (
        <div
          id={tooltipId}
          role="tooltip"
          className={clsx(
            'absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1',
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
