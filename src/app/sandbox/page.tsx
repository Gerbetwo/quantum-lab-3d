import React from 'react';
import Link from 'next/link';

export default function SandboxPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <header className="mb-8 flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-cyan-400">QuantumLab — Sandbox</h1>
          <p className="text-slate-400 text-sm">Entorno interactivo de circuitos y experimentos cuánticos</p>
        </div>
        <Link href="/" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded text-cyan-300 text-sm font-medium transition">
          ← Volver a Learn
        </Link>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-slate-900/60 p-6 rounded-xl border border-slate-800">
          <h2 className="text-xl font-semibold mb-4 text-purple-400">Circuitos Cuánticos</h2>
          <p className="text-sm text-slate-300 mb-4">Diseña y simula circuitos de N-qubits con medición de histogramas y representación en esfera de Bloch.</p>
        </section>

        <section className="bg-slate-900/60 p-6 rounded-xl border border-slate-800">
          <h2 className="text-xl font-semibold mb-4 text-cyan-400">Experimentos Avanzados</h2>
          <div className="space-y-3">
            <div className="p-3 bg-slate-950 rounded border border-slate-800">
              <h3 className="font-medium text-slate-200">Bell / GHZ States</h3>
            </div>
            <div className="p-3 bg-slate-950 rounded border border-slate-800">
              <h3 className="font-medium text-slate-200">Algoritmo de Grover</h3>
            </div>
            <div className="p-3 bg-slate-950 rounded border border-slate-800">
              <h3 className="font-medium text-slate-200">Corrección de Errores</h3>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
