import React from 'react';

interface StatusMessageProps {
  variant?: 'success' | 'error' | 'info';
  children: React.ReactNode;
}

export const StatusMessage: React.FC<StatusMessageProps> = ({ variant = 'info', children }) => {
  const variants = {
    success: 'bg-success-subtle border-success-border text-success',
    error: 'bg-destructive-subtle border-destructive-border text-destructive',
    info: 'bg-[#172238] border-[#29364d] text-[#53d8e8]'
  };

  return (
    <div
      className={`p-4 rounded-[0.625rem] border text-sm ${variants[variant]}`}
      role="region"
      aria-live="polite"
    >
      {children}
    </div>
  );
};
