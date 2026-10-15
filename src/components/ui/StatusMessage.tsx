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
    colorClass: 'bg-success-subtle border-success-border text-success',
    iconColor: 'text-success',
    label: 'Success:',
  },
  error: {
    icon: AlertCircle,
    colorClass: 'bg-destructive-subtle border-destructive-border text-destructive',
    iconColor: 'text-destructive',
    label: 'Error:',
  },
  warning: {
    icon: AlertTriangle,
    colorClass: 'bg-warning-subtle border-warning-border text-warning',
    iconColor: 'text-warning',
    label: 'Warning:',
  },
  info: {
    icon: Info,
    colorClass: 'bg-accent-subtle border-accent-border text-accent',
    iconColor: 'text-accent',
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
