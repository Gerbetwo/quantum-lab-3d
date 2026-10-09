'use client';

import Link from 'next/link';
import { useSession } from '@/components/session/SessionProvider';

export function HomeDashboard() {
  const { session, isHydrated } = useSession();
  const hasProgress = isHydrated && session.completed.length > 0;

  return (
    <div className="space-y-12 py-6">
      <section className="text-center space-y-6 max-w-3xl mx-auto">
        <h1 className="text-4xl sm:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 tracking-tight">
          Computación cuántica, a través de la experimentación
        </h1>
        <p className="text-lg text-slate-300">
          Explora los estados cuánticos mediante simulaciones interactivas en 3D, superposición, entrelazamiento y decoherencia térmica.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <Link
            href={hasProgress ? `/learn/${session.activeMission}` : '/learn/mission-1'}
            className="px-8 py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-lg shadow-cyan-500/20 transition-all transform hover:-translate-y-0.5"
          >
            {hasProgress ? 'Continuar recorrido' : 'Comenzar recorrido'}
          </Link>
          <Link
            href="/sandbox"
            className="px-8 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 font-bold transition-all"
          >
            Abrir laboratorio libre
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-slate-900">
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
          <div className="text-cyan-400 font-bold text-xl">01</div>
          <h3 className="text-lg font-semibold text-white">Superposición</h3>
          <p className="text-sm text-slate-400">Manipula la Esfera de Bloch y observa el colapso de la función de onda en tiempo real.</p>
        </div>
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
          <div className="text-blue-400 font-bold text-xl">02</div>
          <h3 className="text-lg font-semibold text-white">Entrelazamiento</h3>
          <p className="text-sm text-slate-400">Estudia pares de Bell y correlaciones no locales entre estaciones espaciales.</p>
        </div>
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
          <div className="text-indigo-400 font-bold text-xl">03</div>
          <h3 className="text-lg font-semibold text-white">Decoherencia</h3>
          <p className="text-sm text-slate-400">Analiza el impacto criogénico y térmico sobre la fragilidad de los cúbits.</p>
        </div>
      </section>
    </div>
  );
}