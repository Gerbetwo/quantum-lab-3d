import React from 'react';

interface StatusMessageProps {
  variant?: 'success' | 'error' | 'info';
  children: React.ReactNode;
}

export const StatusMessage: React.FC<StatusMessageProps> = ({ variant = 'info', children }) => {
  const variants = {
    success: 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300',
    error: 'bg-rose-950/40 border-rose-800/60 text-rose-300',
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
