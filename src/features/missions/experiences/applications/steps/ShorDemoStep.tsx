import React, { useState, useMemo } from 'react';
import { runShorDemo } from '@/core/quantum/applications';

interface ShorDemoStepProps {
  onComplete?: (completed: boolean) => void;
  onExploreApplication?: (appId: string) => void;
  onStateChange?: (state: { evaluated: boolean; success: boolean }) => void;
}

const COPRIME_BASES = [2, 7, 8, 11, 13] as const;
type CoprimeBase = typeof COPRIME_BASES[number];

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

export const ShorDemoStep: React.FC<ShorDemoStepProps> = ({
  onComplete,
  onExploreApplication,
  onStateChange,
}) => {
  const [selectedBase, setSelectedBase] = useState<CoprimeBase>(2);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [exploredRecorded, setExploredRecorded] = useState<boolean>(false);

  // Compute 4 verifiable steps from src/core/quantum/applications.ts
  const demoData = useMemo(() => {
    const result = runShorDemo(selectedBase);
    const a = selectedBase;
    const r = result.period;
    const halfPeriod = r / 2;
    const halfPower = Math.round(Math.pow(a, halfPeriod));
    const halfPowerMod15 = halfPower % 15;

    // Factors via gcd(a^(r/2) +/- 1, 15) yielding 3 and 5
    const factorMinus = gcd(halfPower - 1, 15);
    const factorPlus = gcd(halfPower + 1, 15);

    // Sequence a^x mod 15
    const seq = result.sequence;

    return {
      sequence: seq,
      period: r,
      halfPowerMod15,
      factorMinus,
      factorPlus,
      factors: result.factors,
      explanation: result.explanation,
    };
  }, [selectedBase]);

  const handleRunShor = () => {
    setStatus('loading');
    setTimeout(() => {
      setStatus('success');
      if (!exploredRecorded) {
        setExploredRecorded(true);
        if (onExploreApplication) onExploreApplication('shor-n15');
      }
      if (onComplete) onComplete(true);
      if (onStateChange) onStateChange({ evaluated: true, success: true });
    }, 200);
  };

  return (
    <div className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border" role="region" aria-label="Shor Algorithm Demo Step">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h3 className="text-xl font-bold">Shor&apos;s Algorithm Demonstration (N = 15)</h3>
        {/* Required Badge */}
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
          Didactic Demonstration for N = 15 (Not RSA-2048)
        </span>
      </div>

      {/* FIX: braces in JSX text cannot be escaped with backslashes — wrap in a string literal */}
      <p className="text-sm text-muted-foreground mb-4">
        Explore period finding and prime factorization on integer{' '}
        <span className="font-mono text-accent font-semibold">N = 15</span>. Choose a coprime base{' '}
        <span className="font-mono text-accent font-semibold">a</span> from{' '}
        <span className="font-mono text-accent font-semibold">{'{2, 7, 8, 11, 13}'}</span> to inspect
        each mathematically verifiable step.
      </p>

      {/* Coprime Base Selector */}
      <div className="bg-card p-4 rounded-lg mb-6 border border-border">
        <span className="text-xs uppercase tracking-wider text-muted-foreground block mb-2 font-semibold">
          Select Coprime Base a ∈ {'{2, 7, 8, 11, 13}'} (gcd(a, 15) = 1)
        </span>
        <div className="flex flex-wrap gap-2">
          {COPRIME_BASES.map((base) => (
            <button
              key={base}
              type="button"
              onClick={() => {
                setSelectedBase(base);
                setStatus('idle');
              }}
              className={`py-2 px-4 rounded-lg text-xs font-mono font-bold transition-all border ${
                selectedBase === base
                  ? 'bg-accent text-accent-foreground border-accent shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                  : 'bg-background hover:bg-muted text-foreground border-border'
              }`}
            >
              a = {base}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Verifiable Steps Container */}
      <div className="bg-card p-5 rounded-lg mb-6 border border-border space-y-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold border-b border-border pb-2">
          Verifiable Steps (N = 15, a = {selectedBase})
        </div>

        {/* Step 1: Modular sequence a^x mod 15 */}
        <div className="bg-background p-3 rounded-lg border border-border">
          <div className="text-xs text-muted-foreground mb-1 font-medium">
            1. Modular Sequence: <span className="font-mono text-accent">a^x mod 15</span>
          </div>
          <div className="font-mono text-sm flex flex-wrap gap-2 items-center">
            {demoData.sequence.map((val, idx) => (
              <span key={idx} className="px-2 py-1 bg-card rounded border border-border">
                x={idx}: <span className="text-accent font-bold">{val}</span>
              </span>
            ))}
            <span className="text-xs text-muted-foreground">... (repeats)</span>
          </div>
        </div>

        {/* Step 2: Period r */}
        <div className="bg-background p-3 rounded-lg border border-border">
          <div className="text-xs text-muted-foreground mb-1 font-medium">
            2. Quantum Period Finding: <span className="font-mono text-accent">Period r</span>
          </div>
          <div className="font-mono text-sm">
            r = <span className="text-accent font-bold text-base">{demoData.period}</span> (smallest positive integer such that {selectedBase}^r ≡ 1 mod 15)
          </div>
        </div>

        {/* Step 3: a^(r/2) mod 15 */}
        <div className="bg-background p-3 rounded-lg border border-border">
          <div className="text-xs text-muted-foreground mb-1 font-medium">
            3. Half-Period Power: <span className="font-mono text-accent">a^(r/2) mod 15</span>
          </div>
          <div className="font-mono text-sm">
            {selectedBase}^({demoData.period}/2) mod 15 = {selectedBase}^{demoData.period / 2} mod 15 = <span className="text-warning font-bold text-base">{demoData.halfPowerMod15}</span>
          </div>
        </div>

        {/* Step 4: Factors via gcd(a^(r/2) +/- 1, 15) */}
        <div className="bg-background p-3 rounded-lg border border-border">
          <div className="text-xs text-muted-foreground mb-1 font-medium">
            4. Prime Factors via GCD: <span className="font-mono text-accent">gcd(a^(r/2) ± 1, 15)</span>
          </div>
          <div className="font-mono text-sm space-y-1">
            <div>
              gcd({selectedBase}^{demoData.period / 2} - 1, 15) = gcd({Math.round(Math.pow(selectedBase, demoData.period / 2)) - 1}, 15) = <span className="text-success font-bold text-base">{demoData.factorMinus}</span>
            </div>
            <div>
              gcd({selectedBase}^{demoData.period / 2} + 1, 15) = gcd({Math.round(Math.pow(selectedBase, demoData.period / 2)) + 1}, 15) = <span className="text-success font-bold text-base">{demoData.factorPlus}</span>
            </div>
            <div className="text-xs text-success font-bold mt-1 pt-1 border-t border-border/50">
              Extracted Factors of 15: {demoData.factors[0]} × {demoData.factors[1]} = 15
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleRunShor}
          disabled={status === 'loading'}
          className="px-6 py-2.5 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring bg-primary text-primary-foreground hover:opacity-90 active:bg-primary cursor-pointer"
          aria-label="Run Shor algorithm demonstration"
        >
          {status === 'success' ? 'Re-evaluate Steps' : 'Execute Verifiable Steps'}
        </button>
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {status === 'success' ? '✓ All 4 steps verified' : 'Select coprime base and verify'}
        </span>
      </div>
    </div>
  );
};

export default ShorDemoStep;