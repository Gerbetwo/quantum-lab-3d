'use client';

import React from 'react';
import { useQuantumStore } from '@/store/useQuantumStore';
import { MissionRegistry } from '@/features/missions/components/MissionRegistry';

const MISSIONS = [
  { id: 'superposition', title: '1. Superposition & Wavefunction' },
  { id: 'entanglement', title: '2. Entanglement & Bell States' },
  { id: 'decoherence', title: '3. Thermal Decoherence' },
  { id: 'applications', title: "4. Shor's Algorithm" },
  { id: 'gates', title: '5. Single-Qubit Gates' },
  { id: 'grover', title: "6. Grover's Search" },
  { id: 'error-correction', title: '7. Error Correction' },
];

export default function HomePage() {
  const { activeMissionId, setActiveMissionId } = useQuantumStore();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col gap-6">
      <header className="border-b border-slate-800 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Quantum Lab 3D
          </h1>
          <p className="text-slate-400 text-sm">Interactive Visual Learning Environment</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <nav className="space-y-2 bg-slate-900 p-4 rounded-xl border border-slate-800">
          <h2 className="text-xs uppercase tracking-wider text-slate-400 mb-3 font-semibold">Missions</h2>
          {MISSIONS.map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveMissionId(m.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeMissionId === m.id
                  ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/50'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              {m.title}
            </button>
          ))}
        </nav>

        <section className="md:col-span-3">
          <MissionRegistry missionId={activeMissionId} />
        </section>
      </div>
    </main>
  );
}
