import React, { useState, useEffect, useRef, ReactNode } from 'react';

interface TooltipProps {
  content: string;
  delayDuration?: number;
  side?: 'top' | 'right' | 'bottom' | 'left';
  children: ReactNode;
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

export { Tooltip };