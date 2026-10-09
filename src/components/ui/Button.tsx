import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-[0.625rem] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#86e8f2] disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

  const variants = {
    primary: 'bg-[#53d8e8] text-[#0b1020] hover:bg-[#80e6f0]',
    secondary: 'bg-[#172238] text-[#f3f6fc] border border-[#29364d] hover:bg-[#111a2c]',
    ghost: 'bg-transparent text-[#a6b2c6] hover:text-[#f3f6fc] hover:bg-[#111a2c]',
    danger: 'bg-rose-600 text-white hover:bg-rose-500'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
