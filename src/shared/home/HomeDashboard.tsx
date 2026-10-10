'use client';

import Link from 'next/link';
import { useSession } from '@/features/session/components/SessionProvider';

export function HomeDashboard() {
  const { session, isHydrated } = useSession();
  const hasProgress = isHydrated && session.completed.length > 0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <section className="text-center mx-auto">
        {/* Título más grande, con tracking más cerrado y un brillo sutil */}
        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-linear-to-r from-cyan-400 via-blue-500 to-indigo-500 tracking-tighter leading-tight drop-shadow-[0_0_40px_rgba(6,182,212,0.25)]">
          Computación cuántica, a través de la experimentación
        </h1>
        
        {/* Subtítulo ampliado para mejorar la legibilidad y presencia */}
        <p className="text-xl sm:text-2xl text-slate-300 font-normal max-w-2xl mx-auto leading-relaxed">
          Explora los estados cuánticos mediante simulaciones interactivas en 3D, superposición, entrelazamiento y decoherencia térmica.
        </p>

        <div className="flex flex-wrap justify-center gap-4 pt-6">
          <Link
            href={hasProgress ? '/learn' : `missions/${session.activeMission}`}
            className="px-8 py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-xl shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5"
          >
            {hasProgress ? 'Continuar recorrido' : 'Comenzar recorrido'}
          </Link>
        </div>
      </section>
    </div>
  );
}