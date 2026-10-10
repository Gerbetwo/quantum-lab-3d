import React, { useState, useMemo } from 'react';

interface SearchCostStepProps {
  onComplete?: (completed: boolean) => void;
  onStateChange?: (state: { databaseSize: number; classicalQueries: number; quantumQueries: number }) => void;
}

export const SearchCostStep: React.FC<SearchCostStepProps> = ({ onComplete, onStateChange }) => {
  const [databaseSize, setDatabaseSize] = useState<number>(64); // N items (e.g., power of 2)
  const [inspected, setInspected] = useState<boolean>(false);

  // Domain helpers / calculations: Classical average case convention vs Quantum estimate (proportional to square root of N)
  const classicalQueries = useMemo(() => Math.round(databaseSize / 2), [databaseSize]);
  const quantumQueries = useMemo(() => Math.round((Math.PI / 4) * Math.sqrt(databaseSize)), [databaseSize]);

  const handleSliderChange = (newSize: number) => {
    setDatabaseSize(newSize);
    if (!inspected) {
      setInspected(true);
      if (onComplete) onComplete(true);
    }
    if (onStateChange) {
      onStateChange({ databaseSize: newSize, classicalQueries: Math.round(newSize / 2), quantumQueries: Math.round((Math.PI / 4) * Math.sqrt(newSize)) });
    }
  };

  return (
    <div className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border" role="region" aria-label="Search Cost Comparison Step">
      <h3 className="text-xl font-bold mb-3">Classical vs. Quantum Search Query Costs</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Compare search query complexity between classical average-case evaluation and quantum amplitude amplification across varying database sizes.
      </p>

      {/* Assumptions Label */}
      <div className="bg-card p-3 rounded-lg mb-6 border border-border text-xs text-muted-foreground">
        <strong>Assumptions:</strong> Classical average case evaluates half of the database entries ($N/2$). Quantum estimation follows optimal Grover iterations proportional to the square root of $N$. Formulas are evaluated in domain logic; raw equations are omitted from UI rendering.
      </div>

      {/* Database Size Slider Control */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="database-slider" className="text-sm font-medium text-muted-foreground">
            Database Size (N): <span className="font-mono text-accent">{databaseSize} items</span>
          </label>
          <span className="text-xs text-muted-foreground" aria-live="polite">
            {inspected ? '✓ Inspected' : 'Adjust slider to inspect'}
          </span>
        </div>
        <input
          id="database-slider"
          type="range"
          min={16}
          max={1024}
          step={16}
          value={databaseSize}
          onChange={(e) => handleSliderChange(Number(e.target.value))}
          className="w-full accent-cyan-500 cursor-pointer bg-muted rounded-lg h-2"
          aria-label="Database size items slider"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>16 items</span>
          <span>512 items</span>
          <span>1,024 items</span>
        </div>
      </div>

      {/* Comparison Output Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-card p-4 rounded-lg border border-border">
          <span className="text-[10px] uppercase tracking-wider text-amber-400 block mb-1">Classical Average-Case Query Cost</span>
          <span className="text-3xl font-mono font-bold text-foreground" aria-live="polite">
            {classicalQueries} Queries
          </span>
          <p className="text-[11px] text-muted-foreground mt-2">Requires linear search proportion on unstructured data.</p>
        </div>

        <div className="bg-card p-4 rounded-lg border border-border">
          <span className="text-[10px] uppercase tracking-wider text-accent block mb-1">Quantum Grover Estimate</span>
          <span className="text-3xl font-mono font-bold text-accent" aria-live="polite">
            {quantumQueries} Iterations
          </span>
          <p className="text-[11px] text-muted-foreground mt-2">Quadratic speedup reducing required query operations.</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{inspected ? '✓ Step complete (inspected query costs).' : 'Adjust database size slider to complete step.'}</span>
        <span aria-live="polite">{inspected ? 'Completed' : 'Pending Inspection'}</span>
      </div>
    </div>
  );
};

export default SearchCostStep;
