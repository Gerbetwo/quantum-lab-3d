import React from 'react';

export interface NavItem {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
}

interface AppNavigationProps {
  items: NavItem[];
}

export const AppNavigation: React.FC<AppNavigationProps> = ({ items }) => {
  return (
    <nav className="flex items-center gap-2 px-6 py-2 border-b border-[#29364d] bg-[#0b1020]" role="navigation" aria-label="Navegación principal">
      {items.map(item => (
        <button
          key={item.id}
          onClick={item.onClick}
          aria-current={item.active ? 'page' : undefined}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            item.active
              ? 'bg-[#172238] text-[#53d8e8] border border-[#53d8e8]/30'
              : 'text-[#a6b2c6] hover:text-[#f3f6fc] hover:bg-[#111a2c]'
          }`}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
};
