// src/shared/layout/AppShell.tsx
import React from 'react';

export interface AppShellProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function AppShell({ children, header, footer, className = '' }: AppShellProps) {
  return (
    <div className={`min-h-screen bg-background text-foreground flex flex-col ${className}`}>
      {header}
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      {footer}
    </div>
  );
}

export default AppShell;