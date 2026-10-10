import React, { useState } from 'react';

interface MythsApplicationsStepProps {
  onComplete?: (completed: boolean) => void;
  onStateChange?: (state: { selectedId: string; verified: boolean }) => void;
}

interface ApplicationCard {
  id: string;
  title: string;
  category: 'Myth / Unsuitable' | 'Plausible Scientific Application';
  description: string;
  detail: string;
}

const CARDS: ApplicationCard[] = [
  {
    id: 'web-browsing',
    title: 'Speeding Up Everyday Web Browsing',
    category: 'Myth / Unsuitable',
    description: 'Claiming quantum computers will make everyday browsing or word processing faster.',
    detail: 'False: Quantum computers are specialized processors designed for specific mathematical structures (like factorization or quantum simulation), not general serial tasks.'
  },
  {
    id: 'laundry-sorting',
    title: 'Instant Household Task Automation',
    category: 'Myth / Unsuitable',
    description: 'Using quantum algorithms to sort laundry or manage daily household schedules.',
    detail: 'False: Classical computers handle routine deterministic logic efficiently with far less overhead and zero cryogenic requirements.'
  },
  {
    id: 'drug-discovery',
    title: 'Molecular Drug & Material Simulation',
    category: 'Plausible Scientific Application',
    description: 'Simulating complex quantum molecular interactions to discover novel pharmaceutical compounds.',
    detail: 'Valid: Simulating molecular bonds naturally requires quantum mechanics, offering exponential efficiency gains over classical approximation.'
  },
  {
    id: 'combinatorial-optimization',
    title: 'Complex Supply Chain Route Optimization',
    category: 'Plausible Scientific Application',
    description: 'Solving multi-variable logistics and network routing problems using quantum-inspired or quantum annealing approaches.',
    detail: 'Valid: Evaluates large combinatorial state spaces efficiently under specific problem constraints.'
  }
];

export const MythsApplicationsStep: React.FC<MythsApplicationsStepProps> = ({ onComplete, onStateChange }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [completed, setCompleted] = useState<boolean>(false);

  const handleSelect = (card: ApplicationCard) => {
    setSelectedId(card.id);
    if (!completed) {
      setCompleted(true);
      if (onComplete) onComplete(true);
    }
    if (onStateChange) {
      onStateChange({ selectedId: card.id, verified: true });
    }
  };

  return (
    <div className="p-6 bg-slate-900 rounded-xl text-slate-100 shadow-lg border border-slate-800" role="region" aria-label="Myths and Applications Step">
      <h3 className="text-xl font-bold mb-3">Quantum Myths vs. Real-World Applications</h3>
      <p className="text-sm text-slate-300 mb-4">
        Explore and select application cards below. Note that quantum computers are not universal speedup devices for every task, but provide profound advantages for targeted scientific simulations and combinatorial challenges.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {CARDS.map((card) => {
          const isSelected = selectedId === card.id;
          const isPlausible = card.category === 'Plausible Scientific Application';
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => handleSelect(card)}
              aria-pressed={isSelected}
              className={`text-left p-4 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400 ${isSelected ? 'bg-slate-800 border-cyan-500 shadow-md ring-2 ring-cyan-500/50' : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${isPlausible ? 'bg-cyan-950 text-cyan-300 border border-cyan-700' : 'bg-amber-950 text-amber-300 border border-amber-700'}`}>
                  {card.category}
                </span>
                {isSelected && <span className="text-xs text-cyan-400 font-bold">✓ Selected</span>}
              </div>
              <h4 className="font-bold text-base mb-1 text-slate-100">{card.title}</h4>
              <p className="text-xs text-slate-300 mb-2">{card.description}</p>
              <p className="text-[11px] text-slate-400 italic border-t border-slate-700/60 pt-2">{card.detail}</p>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between bg-slate-800 p-3 rounded-lg border border-slate-700">
        <span className="text-xs text-slate-300">
          {completed ? '✓ Card evaluated and persisted.' : 'Select any card to complete step.'}
        </span>
        <span className="text-xs text-cyan-400 font-mono">
          {selectedId ? `Active Focus: ${selectedId}` : 'No selection'}
        </span>
      </div>
    </div>
  );
};

export default MythsApplicationsStep;
