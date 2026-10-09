import Link from 'next/link';

export default function LearnIndexPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto py-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-white">Recorrido de Aprendizaje Cuántico</h1>
        <p className="text-slate-400">Selecciona una misión para comenzar o continuar tu formación práctica.</p>
      </div>
      <div className="grid gap-4">
        {[
          { id: 'mission-1', title: 'Misión 1: Superposición y Esfera de Bloch', desc: 'Aprende los estados fundamentales y el colapso cuántico.' },
          { id: 'mission-2', title: 'Misión 2: Entrelazamiento Cuántico', desc: 'Explora pares de Bell y correlaciones no locales.' },
          { id: 'mission-3', title: 'Misión 3: Decoherencia Térmica', desc: 'Estudia el ruido térmico en sistemas criogénicos.' },
          { id: 'mission-4', title: 'Misión 4: Aplicaciones y Algoritmo de Shor', desc: 'Aplica algoritmos cuánticos avanzados.' },
        ].map((m, idx) => (
          <Link key={m.id} href={`/learn/${m.id}`} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 transition-all flex items-center justify-between group">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Módulo {idx + 1}</span>
              <h2 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">{m.title}</h2>
              <p className="text-sm text-slate-400">{m.desc}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all">
              &rarr;
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}