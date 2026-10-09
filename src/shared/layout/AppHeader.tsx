'use client';

import Link from 'next/link';
import { useSession } from '@/features/session/components/SessionProvider';

export function AppHeader() {
  const { session, isHydrated } = useSession();
  return (
    <header className="border-b border-cyan-500/20 bg-slate-950/80 backdrop-blur sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
      <Link href="/" className="flex items-center space-x-3 group focus:outline-none focus:ring-2 focus:ring-cyan-400 rounded-lg p-1">
        <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/30 group-hover:scale-105 transition-transform">
          QL
        </div>
        <span className="font-extrabold text-lg text-white tracking-wider">QuantumLab <span className="text-cyan-400 text-xs px-2 py-0.5 rounded border border-cyan-500/30">3D</span></span>
      </Link>
      <nav className="flex items-center space-x-6 text-sm font-medium text-slate-300">
        <Link href="/learn" className="hover:text-cyan-400 transition-colors">Aprender</Link>
        <Link href="/sandbox" className="hover:text-cyan-400 transition-colors">Laboratorio</Link>
        {isHydrated && (
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{session.userId}</span>
          </div>
        )}
      </nav>
    </header>
  );
}