import React from 'react';
import Header from '@/shared/layout/Header';

export interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  title = 'Quantum Lab 3D',
  subtitle,
  className = '',
}) => {
  return (
    <div className={`min-h-screen bg-background text-foreground flex flex-col font-sans antialiased ${className}`}>
      <div data-testid="app-shell-header">
        <Header title={title} />
        {subtitle && (
          <div className="bg-background/80 px-6 pb-2 text-xs text-muted-foreground border-b border-border">
            {subtitle}
          </div>
        )}
      </div>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
};

export default AppShell;
