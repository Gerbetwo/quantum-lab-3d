import React from 'react';
import { clsx } from 'clsx';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export type StatusType = 'success' | 'error' | 'warning' | 'info';

export interface StatusMessageProps {
  type: StatusType;
  message: string;
  className?: string;
}

const statusConfig = {
  success: {
    icon: CheckCircle2,
    colorClass: 'bg-emerald-950/60 border-emerald-800 text-emerald-300',
    iconColor: 'text-emerald-400',
    label: 'Success:',
  },
  error: {
    icon: AlertCircle,
    colorClass: 'bg-rose-950/60 border-rose-800 text-rose-300',
    iconColor: 'text-rose-400',
    label: 'Error:',
  },
  warning: {
    icon: AlertTriangle,
    colorClass: 'bg-amber-950/60 border-amber-800 text-amber-300',
    iconColor: 'text-amber-400',
    label: 'Warning:',
  },
  info: {
    icon: Info,
    colorClass: 'bg-cyan-950/60 border-cyan-800 text-cyan-300',
    iconColor: 'text-cyan-400',
    label: 'Information:',
  },
};

export const StatusMessage: React.FC<StatusMessageProps> = ({ type, message, className }) => {
  const config = statusConfig[type];
  const IconComponent = config.icon;

  return (
    <div
      role="status"
      aria-live="polite"
      className={clsx(
        'flex items-center gap-3 p-3 rounded-lg border text-sm',
        config.colorClass,
        className
      )}
    >
      <IconComponent className={clsx('w-5 h-5 shrink-0', config.iconColor)} aria-hidden="true" />
      <div className="flex-1">
        <span className="sr-only">{config.label}</span>
        <span>{message}</span>
      </div>
    </div>
  );
};
