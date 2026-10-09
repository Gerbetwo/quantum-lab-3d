import React, { useState, useEffect, useRef, cloneElement, ReactElement } from 'react';

interface TooltipProps {
  content: string;
  delayDuration?: number;
  side?: 'top' | 'right' | 'bottom' | 'left';
  children: ReactElement;
}

export default function Tooltip({
  content,
  delayDuration = 200,
  side: _side = 'top',
  children
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
      }, delayDuration);
    }
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
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

  const childProps: Record<string, unknown> = {
    onMouseEnter: (e: React.MouseEvent) => {
      const props = children.props as { onMouseEnter?: (event: React.MouseEvent) => void };
      props.onMouseEnter?.(e);
      handleMouseEnter();
    },
    onMouseLeave: (e: React.MouseEvent) => {
      const props = children.props as { onMouseLeave?: (event: React.MouseEvent) => void };
      props.onMouseLeave?.(e);
      handleMouseLeave();
    },
    onFocus: (e: React.FocusEvent) => {
      const props = children.props as { onFocus?: (event: React.FocusEvent) => void };
      props.onFocus?.(e);
      handleMouseEnter();
    },
    onBlur: (e: React.FocusEvent) => {
      const props = children.props as { onBlur?: (event: React.FocusEvent) => void };
      props.onBlur?.(e);
      handleMouseLeave();
    },
  };

  if (isOpen) {
    childProps['aria-describedby'] = id;
  }

  const trigger = cloneElement(children, childProps);

  return (
    <div className="relative inline-block">
      {trigger}
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

export { Tooltip };
