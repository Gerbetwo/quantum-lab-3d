import React from 'react';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ title = 'QuantumLab 3D', subtitle, actions }) => {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-[#29364d] bg-[#111a2c]" role="banner">
      <div className="flex flex-col">
        <h1 className="text-xl font-bold tracking-tight text-[#f3f6fc]">{title}</h1>
        {subtitle && <p className="text-sm text-[#a6b2c6]">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  );
};
