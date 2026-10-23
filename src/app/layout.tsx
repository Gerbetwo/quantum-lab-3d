import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="en" className="dark theme-dark" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}