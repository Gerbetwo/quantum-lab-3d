import React from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon?: React.ReactNode;
  tooltip?: string;
  children?: React.ReactNode;
}

export default function IconButton({
  label,
  icon,
  tooltip,
  children,
  className = '',
  ...props
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      title={tooltip || label}
      className={`p-2 rounded-[0.625rem] bg-[#111a2c] text-[#f3f6fc] border border-[#29364d] hover:bg-[#172238] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#86e8f2] ${className}`}
      {...props}
    >
      {icon || children}
    </button>
  );
}

export { IconButton };
