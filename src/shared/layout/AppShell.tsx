import { AppHeader } from './AppHeader';
import { SessionProvider } from '@/features/session/components/SessionProvider';

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function AppShell({ children, title, subtitle }: AppShellProps) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
        <AppHeader />
        {(title || subtitle) && (
          <div data-testid="app-shell-header" className="bg-slate-900 border-b border-slate-800 px-6 py-4">
            {title && <h1 className="text-xl font-bold text-white">{title}</h1>}
            {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
          </div>
        )}
        <main className="flex-1 flex flex-col w-full mx-auto px-2 sm:px-2 lg:px-2 py-2">
          {children}
        </main>
        <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
          QuantumLab 3D &copy; 2026 — Plataforma de Aprendizaje Cuántico Interactivo
        </footer>
      </div>
    </SessionProvider>
  );
}