// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { SessionProvider } from '@/features/session/components/SessionProvider';
import { AppShell } from '@/shared/layout/AppShell';

export const metadata: Metadata = {
  title: 'QuantumLab 3D',
  description: 'Interactive quantum learning platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="bg-background text-foreground antialiased min-h-screen">
        <SessionProvider>
          <AppShell>
            {children}
          </AppShell>
        </SessionProvider>
      </body>
    </html>
  );
}