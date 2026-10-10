import React, { useState, useEffect, useRef } from 'react';

interface CoinAnalogyStepProps {
  onComplete?: (completed: boolean) => void;
  onStateChange?: (state: { status: 'idle' | 'spinning' | 'final'; result?: 'heads' | 'tails' }) => void;
}

export const CoinAnalogyStep: React.FC<CoinAnalogyStepProps> = ({ onComplete, onStateChange }) => {
  const [status, setStatus] = useState<'idle' | 'spinning' | 'final'>('idle');
  const [result, setResult] = useState<'heads' | 'tails' | undefined>(undefined);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  const handleLaunch = () => {
    if (status === 'spinning') return;

    setStatus('spinning');
    setResult(undefined);

    if (onStateChange) {
      onStateChange({ status: 'spinning' });
    }

    const duration = prefersReducedMotion ? 100 : 1500;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const finalResult: 'heads' | 'tails' = Math.random() > 0.5 ? 'heads' : 'tails';
      setStatus('final');
      setResult(finalResult);

      if (onComplete) onComplete(true);
      if (onStateChange) {
        onStateChange({ status: 'final', result: finalResult });
      }
    }, duration);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border" role="region" aria-label="Coin Analogy Step">
      <h3 className="text-xl font-bold mb-3">The Coin Analogy & Limitations</h3>
      <p className="text-sm text-muted-foreground mb-4">
        <strong className="text-amber-300">Intuition Aid Notice:</strong> Spinning a coin is a helpful analogy for superposition, but it is <em>not</em> a literal qubit. A spinning coin is always definitively heads or tails at any microscopic snapshot; true quantum superposition involves complex probability amplitudes before measurement.
      </p>

      <div className="bg-card p-6 rounded-lg text-center mb-6 border border-border">
        <div className="text-3xl font-bold mb-2 tracking-wide text-accent" aria-live="polite">
          {status === 'idle' && 'Ready to Launch'}
          {status === 'spinning' && (prefersReducedMotion ? 'Settling...' : 'Spinning...')}
          {status === 'final' && `Result: ${result?.toUpperCase()}`}
        </div>
        <p className="text-xs text-muted-foreground">
          {status === 'spinning' ? 'Simulating quantum observation collapse' : 'Click launch to observe probabilistic outcome.'}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleLaunch}
          disabled={status === 'spinning'}
          className={`px-6 py-2.5 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 ${status === 'spinning' ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary text-primary-foreground hover:opacity-90 active:bg-cyan-700 text-white'}`}
          aria-label="Launch coin simulation"
        >
          {status === 'spinning' ? 'Spinning...' : 'Launch Coin'}
        </button>
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {status === 'final' ? '✓ Step complete' : 'Awaiting action'}
        </span>
      </div>
    </div>
  );
};

export default CoinAnalogyStep;
