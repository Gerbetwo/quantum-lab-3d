import React from 'react';
import { AppHeader } from './AppHeader';
import { AppNavigation, NavItem } from './AppNavigation';

interface AppShellProps {
  title?: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  navItems?: NavItem[];
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  title,
  subtitle,
  headerActions,
  navItems,
  children
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#0b1020] text-[#f3f6fc]">
      <AppHeader title={title} subtitle={subtitle} actions={headerActions} />
      {navItems && navItems.length > 0 && <AppNavigation items={navItems} />}
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
};
