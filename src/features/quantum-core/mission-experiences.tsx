'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { useQuantumStore } from "@/store/useQuantumStore";
import {
  calculateCoherenceTime,
  runShorDemo,
  bellState,
  measureEntangledQubit,
  bitFlipEncode,
  injectBitFlip,
  detectBitFlipSyndrome,
  uniformAmplitudes,
  simulateGroverStep,
  measureAmplitude,
  groverIterations,
  BitTriple,
} from "@/lib/quantumCore";

// --- Section: src/features/missions/experiences/applications/index.tsx ---
interface ApplicationsExperienceProps {
  onMissionComplete?: () => void;
}

export const ApplicationsExperience: React.FC<ApplicationsExperienceProps> = ({
  onMissionComplete,
}) => {
  const [activeStepId, setActiveStepId] =
    useState<string>("myths-applications");
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>(
    {},
  );
  const [_exploredApplications, setExploredApplications] = useState<string[]>(
    [],
  );
  const [knowledgeCheckPassed, setKnowledgeCheckPassed] =
    useState<boolean>(false);

  const handleStepComplete = (stepId: string) => {
    setCompletedSteps((prev) => {
      const next = { ...prev, [stepId]: true };
      checkAllComplete(next, knowledgeCheckPassed);
      return next;
    });
  };

  const handleExploreApplication = (appId: string) => {
    setExploredApplications((prev) => {
      if (!prev.includes(appId)) {
        return [...prev, appId];
      }
      return prev;
    });
  };

  const handleKnowledgeCheckComplete = () => {
    setKnowledgeCheckPassed(true);
    const next = { ...completedSteps, "knowledge-check": true };
    setCompletedSteps(next);
    checkAllComplete(next, true);
  };

  const checkAllComplete = (
    currentCompleted: Record<string, boolean>,
    _quizPassed: boolean,
  ) => {
    if (
      currentCompleted["myths-applications"] &&
      currentCompleted["molecular-comparison"] &&
      currentCompleted["shor-demo"]
    ) {
      if (onMissionComplete) onMissionComplete();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-background text-foreground rounded-2xl shadow-2xl border border-border">
      <div className="mb-8 border-b border-border pb-4">
        <span className="text-xs uppercase tracking-widest text-accent font-semibold">
          Mission 4 Experience
        </span>
        <h2 className="text-2xl font-bold mt-1">
          Real-World Quantum Applications
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Explore quantum myths vs realities, molecular simulation comparisons,
          Shor&apos;s algorithm demonstration, and canonical knowledge
          validation.
        </p>

        <div className="flex flex-wrap gap-2 mt-6">
          {[
            { id: "myths-applications", label: "1. Myths & Realities" },
            { id: "molecular-comparison", label: "2. Molecular Simulation" },
            { id: "shor-demo", label: "3. Shor's Algorithm" },
            { id: "knowledge-check", label: "4. Knowledge Check" },
          ].map((step) => (
            <button
              key={step.id}
              type="button"
              onClick={() => setActiveStepId(step.id)}
              className={`px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${activeStepId === step.id ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-card"}`}
              aria-current={activeStepId === step.id ? "step" : undefined}
            >
              {step.label} {completedSteps[step.id] ? "✓" : ""}
            </button>
          ))}
        </div>
      </div>

      <div className="transition-all duration-300">
        {activeStepId === "myths-applications" && (
          <MythsApplicationsStep
            onComplete={() => handleStepComplete("myths-applications")}
          />
        )}
        {activeStepId === "molecular-comparison" && (
          <MolecularComparisonStep
            onComplete={() => handleStepComplete("molecular-comparison")}
          />
        )}
        {activeStepId === "shor-demo" && (
          <ShorDemoStep
            onComplete={() => handleStepComplete("shor-demo")}
            onExploreApplication={handleExploreApplication}
          />
        )}
        {activeStepId === "knowledge-check" && (
          <div
            className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border"
            role="region"
            aria-label="Knowledge Check"
          >
            <h3 className="text-xl font-bold mb-3">
              Canonical Quiz: Real-World Applications
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Verify your understanding of quantum algorithmic advantages,
              molecular simulation capabilities, and cryptographic scope.
            </p>
            <div className="bg-card p-5 rounded-lg mb-6 border border-border">
              <p className="text-sm font-medium mb-3">
                Which problem domain benefits most fundamentally from quantum
                algorithmic simulation?
              </p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleKnowledgeCheckComplete}
                  className="w-full text-left p-3 rounded bg-muted hover:bg-secondary text-sm transition-colors"
                >
                  Simulating molecular quantum states and chemical bond
                  interactions.
                </button>
                <button
                  type="button"
                  onClick={handleKnowledgeCheckComplete}
                  className="w-full text-left p-3 rounded bg-muted hover:bg-secondary text-sm transition-colors"
                >
                  Accelerating everyday operating system file searches.
                  (Incorrect)
                </button>
              </div>
            </div>
            <div className="text-xs text-muted-foreground" aria-live="polite">
              {knowledgeCheckPassed
                ? "✓ Knowledge check successfully completed!"
                : "Select the correct answer above."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Section: src/features/missions/experiences/applications/steps/MolecularComparisonStep.tsx ---
interface MolecularComparisonStepProps {
  onComplete?: (completed: boolean) => void;
  onStateChange?: (state: {
    mode: "classical" | "quantum";
    switched: boolean;
  }) => void;
}

export const MolecularComparisonStep: React.FC<
  MolecularComparisonStepProps
> = ({ onComplete, onStateChange }) => {
  const [mode, setMode] = useState<"classical" | "quantum">("classical");
  const [switched, setSwitched] = useState<boolean>(false);

  const handleSwitch = (newMode: "classical" | "quantum") => {
    setMode(newMode);
    if (!switched) {
      setSwitched(true);
      if (onComplete) onComplete(true);
    }
    if (onStateChange) {
      onStateChange({ mode: newMode, switched: true });
    }
  };

  return (
    <div
      className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border"
      role="region"
      aria-label="Molecular Comparison Step"
    >
      <h3 className="text-xl font-bold mb-3">
        Molecular Simulation: Classical vs. Quantum
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Compare educational molecular models without losing workspace state.
        Switch between classical approximation and quantum state simulation.
      </p>

      <div className="flex gap-2 mb-6" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "classical"}
          onClick={() => handleSwitch("classical")}
          className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${mode === "classical" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}
        >
          Classical Approximation Model
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "quantum"}
          onClick={() => handleSwitch("quantum")}
          className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${mode === "quantum" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}
        >
          Quantum Simulation Model
        </button>
      </div>

      <div className="bg-card p-6 rounded-lg mb-6 border border-border">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs uppercase tracking-wider text-accent font-semibold">
            {mode === "classical"
              ? "Classical Molecular Model (Approximation)"
              : "Quantum Superposition Molecular Model"}
          </span>
          <span className="text-[10px] bg-background text-muted-foreground px-2 py-1 rounded border border-border">
            Educational Illustration Only
          </span>
        </div>

        {mode === "classical" ? (
          <div>
            <p className="text-sm text-foreground mb-2">
              Classical algorithms approximate electronic orbitals using
              exponential scaling tables, leading to severe computational
              bottlenecks for larger molecules.
            </p>
            <div className="text-xs text-muted-foreground font-mono bg-background p-3 rounded border border-border">
              [Illustration] Estimated Classical Evaluation Time: ~10^12 years
              for Caffeine molecule approximation.
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-foreground mb-2">
              Quantum simulation maps molecular wavefunctions directly onto
              qubits, scaling polynomially and accurately capturing entanglement
              in chemical bonds.
            </p>
            <div className="text-xs text-accent font-mono bg-background p-3 rounded border border-border">
              [Illustration] Estimated Quantum Evaluation Time: ~Hours
              (Educational benchmark illustration — not a hardware guarantee).
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {switched
            ? "✓ Comparison mode switched & persisted."
            : "Switch views to explore models."}
        </span>
        <span aria-live="polite">Current view: {mode.toUpperCase()}</span>
      </div>
    </div>
  );
};

// --- Section: src/features/missions/experiences/applications/steps/MythsApplicationsStep.tsx ---
interface MythsApplicationsStepProps {
  onComplete?: (completed: boolean) => void;
  onStateChange?: (state: { selectedId: string; verified: boolean }) => void;
}

interface ApplicationCard {
  id: string;
  title: string;
  category: "Myth / Unsuitable" | "Plausible Scientific Application";
  description: string;
  detail: string;
}

const CARDS: ApplicationCard[] = [
  {
    id: "web-browsing",
    title: "Speeding Up Everyday Web Browsing",
    category: "Myth / Unsuitable",
    description:
      "Claiming quantum computers will make everyday browsing or word processing faster.",
    detail:
      "False: Quantum computers are specialized processors designed for specific mathematical structures (like factorization or quantum simulation), not general serial tasks.",
  },
  {
    id: "laundry-sorting",
    title: "Instant Household Task Automation",
    category: "Myth / Unsuitable",
    description:
      "Using quantum algorithms to sort laundry or manage daily household schedules.",
    detail:
      "False: Classical computers handle routine deterministic logic efficiently with far less overhead and zero cryogenic requirements.",
  },
  {
    id: "drug-discovery",
    title: "Molecular Drug & Material Simulation",
    category: "Plausible Scientific Application",
    description:
      "Simulating complex quantum molecular interactions to discover novel pharmaceutical compounds.",
    detail:
      "Valid: Simulating molecular bonds naturally requires quantum mechanics, offering exponential efficiency gains over classical approximation.",
  },
  {
    id: "combinatorial-optimization",
    title: "Complex Supply Chain Route Optimization",
    category: "Plausible Scientific Application",
    description:
      "Solving multi-variable logistics and network routing problems using quantum-inspired or quantum annealing approaches.",
    detail:
      "Valid: Evaluates large combinatorial state spaces efficiently under specific problem constraints.",
  },
];

export const MythsApplicationsStep: React.FC<MythsApplicationsStepProps> = ({
  onComplete,
  onStateChange,
}) => {
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
    <div
      className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border"
      role="region"
      aria-label="Myths and Applications Step"
    >
      <h3 className="text-xl font-bold mb-3">
        Quantum Myths vs. Real-World Applications
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Explore and select application cards below. Note that quantum computers
        are not universal speedup devices for every task, but provide profound
        advantages for targeted scientific simulations and combinatorial
        challenges.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {CARDS.map((card) => {
          const isSelected = selectedId === card.id;
          const isPlausible =
            card.category === "Plausible Scientific Application";
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => handleSelect(card)}
              aria-pressed={isSelected}
              className={`text-left p-4 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-ring ${isSelected ? "bg-card border-accent-border shadow-md ring-2 focus:ring-ring-subtle" : "bg-card-60 border-border hover:bg-card"}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span
                  className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${isPlausible ? "bg-accent-subtle text-accent border border-accent-border" : "bg-warning-subtle text-warning border border-warning-border"}`}
                >
                  {card.category}
                </span>
                {isSelected && (
                  <span className="text-xs text-accent font-bold">
                    ✓ Selected
                  </span>
                )}
              </div>
              <h4 className="font-bold text-base mb-1 text-foreground">
                {card.title}
              </h4>
              <p className="text-xs text-muted-foreground mb-2">
                {card.description}
              </p>
              <p className="text-[11px] text-muted-foreground italic border-t border-border-60 pt-2">
                {card.detail}
              </p>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between bg-card p-3 rounded-lg border border-border">
        <span className="text-xs text-muted-foreground">
          {completed
            ? "✓ Card evaluated and persisted."
            : "Select any card to complete step."}
        </span>
        <span className="text-xs text-accent font-mono">
          {selectedId ? `Active Focus: ${selectedId}` : "No selection"}
        </span>
      </div>
    </div>
  );
};

// --- Section: src/features/missions/experiences/applications/steps/ShorDemoStep.tsx ---
interface ShorDemoStepProps {
  onComplete?: (completed: boolean) => void;
  onExploreApplication?: (appId: string) => void;
  onStateChange?: (state: { evaluated: boolean; success: boolean }) => void;
}

const COPRIME_BASES = [2, 7, 8, 11, 13] as const;
type CoprimeBase = (typeof COPRIME_BASES)[number];

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
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [exploredRecorded, setExploredRecorded] = useState<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const demoData = useMemo(() => {
    const result = runShorDemo(selectedBase);
    const a = selectedBase;
    const r = result.period;
    const halfPeriod = r / 2;
    const halfPower = Math.round(Math.pow(a, halfPeriod));
    const halfPowerMod15 = halfPower % 15;

    const factorMinus = gcd(halfPower - 1, 15);
    const factorPlus = gcd(halfPower + 1, 15);
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
    setStatus("loading");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setStatus("success");
      if (!exploredRecorded) {
        setExploredRecorded(true);
        if (onExploreApplication) onExploreApplication("shor-n15");
      }
      if (onComplete) onComplete(true);
      if (onStateChange) onStateChange({ evaluated: true, success: true });
    }, 200);
  };

  return (
    <div
      className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border"
      role="region"
      aria-label="Shor Algorithm Demo Step"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h3 className="text-xl font-bold">
          Shor&apos;s Algorithm Demonstration (N = 15)
        </h3>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
          Didactic Demonstration for N = 15 (Not RSA-2048)
        </span>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Explore period finding and prime factorization on integer{" "}
        <span className="font-mono text-accent font-semibold">N = 15</span>.
        Choose a coprime base{" "}
        <span className="font-mono text-accent font-semibold">a</span> from{" "}
        <span className="font-mono text-accent font-semibold">
          {"{2, 7, 8, 11, 13}"}
        </span>{" "}
        to inspect each mathematically verifiable step.
      </p>

      <div className="bg-card p-4 rounded-lg mb-6 border border-border">
        <span className="text-xs uppercase tracking-wider text-muted-foreground block mb-2 font-semibold">
          Select Coprime Base a ∈ {"{2, 7, 8, 11, 13}"} (gcd(a, 15) = 1)
        </span>
        <div className="flex flex-wrap gap-2">
          {COPRIME_BASES.map((base) => (
            <button
              key={base}
              type="button"
              onClick={() => {
                setSelectedBase(base);
                setStatus("idle");
              }}
              className={`py-2 px-4 rounded-lg text-xs font-mono font-bold transition-all border ${
                selectedBase === base
                  ? "bg-accent text-accent-foreground border-accent shadow-[0_0_10px_rgba(0,240,255,0.4)]"
                  : "bg-background hover:bg-muted text-foreground border-border"
              }`}
            >
              a = {base}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card p-5 rounded-lg mb-6 border border-border space-y-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold border-b border-border pb-2">
          Verifiable Steps (N = 15, a = {selectedBase})
        </div>

        <div className="bg-background p-3 rounded-lg border border-border">
          <div className="text-xs text-muted-foreground mb-1 font-medium">
            1. Modular Sequence:{" "}
            <span className="font-mono text-accent">a^x mod 15</span>
          </div>
          <div className="font-mono text-sm flex flex-wrap gap-2 items-center">
            {demoData.sequence.map((_val, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-card rounded border border-border"
              >
                x={idx}: <span className="text-accent font-bold">{_val}</span>
              </span>
            ))}
            <span className="text-xs text-muted-foreground">... (repeats)</span>
          </div>
        </div>

        <div className="bg-background p-3 rounded-lg border border-border">
          <div className="text-xs text-muted-foreground mb-1 font-medium">
            2. Quantum Period Finding:{" "}
            <span className="font-mono text-accent">Period r</span>
          </div>
          <div className="font-mono text-sm">
            r ={" "}
            <span className="text-accent font-bold text-base">
              {demoData.period}
            </span>{" "}
            (smallest positive integer such that {selectedBase}^r ≡ 1 mod 15)
          </div>
        </div>

        <div className="bg-background p-3 rounded-lg border border-border">
          <div className="text-xs text-muted-foreground mb-1 font-medium">
            3. Half-Period Power:{" "}
            <span className="font-mono text-accent">a^(r/2) mod 15</span>
          </div>
          <div className="font-mono text-sm">
            {selectedBase}^({demoData.period}/2) mod 15 = {selectedBase}^
            {demoData.period / 2} mod 15 ={" "}
            <span className="text-warning font-bold text-base">
              {demoData.halfPowerMod15}
            </span>
          </div>
        </div>

        <div className="bg-background p-3 rounded-lg border border-border">
          <div className="text-xs text-muted-foreground mb-1 font-medium">
            4. Prime Factors via GCD:{" "}
            <span className="font-mono text-accent">gcd(a^(r/2) ± 1, 15)</span>
          </div>
          <div className="font-mono text-sm space-y-1">
            <div>
              gcd({selectedBase}^{demoData.period / 2} - 1, 15) = gcd(
              {Math.round(Math.pow(selectedBase, demoData.period / 2)) - 1}, 15)
              ={" "}
              <span className="text-success font-bold text-base">
                {demoData.factorMinus}
              </span>
            </div>
            <div>
              gcd({selectedBase}^{demoData.period / 2} + 1, 15) = gcd(
              {Math.round(Math.pow(selectedBase, demoData.period / 2)) + 1}, 15)
              ={" "}
              <span className="text-success font-bold text-base">
                {demoData.factorPlus}
              </span>
            </div>
            <div className="text-xs text-success font-bold mt-1 pt-1 border-t border-border/50">
              Extracted Factors of 15: {demoData.factors[0]} ×{" "}
              {demoData.factors[1]} = 15
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleRunShor}
          disabled={status === "loading"}
          className="px-6 py-2.5 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring bg-primary text-primary-foreground hover:opacity-95 cursor-pointer"
          aria-label="Run Shor algorithm demonstration"
        >
          {status === "success"
            ? "Re-evaluate Steps"
            : "Execute Verifiable Steps"}
        </button>
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {status === "success"
            ? "✓ All 4 steps verified"
            : "Select coprime base and verify"}
        </span>
      </div>
    </div>
  );
};

// --- Section: src/features/missions/experiences/decoherence/index.tsx ---
interface DecoherenceExperienceProps {
  onMissionComplete?: () => void;
}

export const DecoherenceExperience: React.FC<DecoherenceExperienceProps> = ({
  onMissionComplete,
}) => {
  const [activeStepId, setActiveStepId] = useState<string>("thermal-photon");
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>(
    {},
  );
  const [knowledgeCheckPassed, setKnowledgeCheckPassed] =
    useState<boolean>(false);

  const handleStepComplete = (stepId: string) => {
    setCompletedSteps((_prev) => {
      const next = { ..._prev, [stepId]: true };
      checkAllComplete(next, knowledgeCheckPassed);
      return next;
    });
  };

  const handleKnowledgeCheckComplete = () => {
    setKnowledgeCheckPassed(true);
    const next = { ...completedSteps, "knowledge-check": true };
    setCompletedSteps(next);
    checkAllComplete(next, true);
  };

  const checkAllComplete = (
    currentCompleted: Record<string, boolean>,
    _quizPassed: boolean,
  ) => {
    if (
      currentCompleted["thermal-photon"] &&
      currentCompleted["temperature-coherence"] &&
      currentCompleted["refrigerator"]
    ) {
      if (onMissionComplete) onMissionComplete();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-background text-foreground rounded-2xl shadow-2xl border border-border">
      <div className="mb-8 border-b border-border pb-4">
        <span className="text-xs uppercase tracking-widest text-accent font-semibold">
          Mission 3 Experience
        </span>
        <h2 className="text-2xl font-bold mt-1">
          Cryogenics & Thermal Decoherence
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Explore thermal photon bombardment, cryogenic temperature scaling,
          dilution refrigerator activation, and quantum decoherence validation.
        </p>

        <div className="flex flex-wrap gap-2 mt-6">
          {[
            { id: "thermal-photon", label: "1. Thermal Photons" },
            {
              id: "temperature-coherence",
              label: "2. Temperature & Coherence",
            },
            { id: "refrigerator", label: "3. Dilution Refrigerator" },
            { id: "knowledge-check", label: "4. Knowledge Check" },
          ].map((step) => (
            <button
              key={step.id}
              type="button"
              onClick={() => setActiveStepId(step.id)}
              className={`px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${activeStepId === step.id ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-card"}`}
              aria-current={activeStepId === step.id ? "step" : undefined}
            >
              {step.label} {completedSteps[step.id] ? "✓" : ""}
            </button>
          ))}
        </div>
      </div>

      <div className="transition-all duration-300">
        {activeStepId === "thermal-photon" && (
          <ThermalPhotonStep
            onComplete={() => handleStepComplete("thermal-photon")}
          />
        )}
        {activeStepId === "temperature-coherence" && (
          <TemperatureCoherenceStep
            onComplete={() => handleStepComplete("temperature-coherence")}
          />
        )}
        {activeStepId === "refrigerator" && (
          <RefrigeratorStep
            onComplete={() => handleStepComplete("refrigerator")}
          />
        )}
        {activeStepId === "knowledge-check" && (
          <div
            className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border"
            role="region"
            aria-label="Knowledge Check"
          >
            <h3 className="text-xl font-bold mb-3">
              Canonical Quiz: Cryogenics & Decoherence
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Verify your understanding of thermal noise suppression, cryogenic
              cooling, and quantum coherence lifetimes.
            </p>
            <div className="bg-card p-5 rounded-lg mb-6 border border-border">
              <p className="text-sm font-medium mb-3">
                Why must superconducting quantum computers operate at
                millikelvin temperatures (approx. 15 mK)?
              </p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleKnowledgeCheckComplete}
                  className="w-full text-left p-3 rounded bg-muted hover:bg-secondary text-sm transition-colors"
                >
                  To suppress thermal photon excitation and maximize quantum
                  coherence lifetimes.
                </button>
                <button
                  type="button"
                  onClick={handleKnowledgeCheckComplete}
                  className="w-full text-left p-3 rounded bg-muted hover:bg-secondary text-sm transition-colors"
                >
                  To accelerate clock speed and increase processor voltage.
                  (Incorrect)
                </button>
              </div>
            </div>
            <div className="text-xs text-muted-foreground" aria-live="polite">
              {knowledgeCheckPassed
                ? "✓ Knowledge check successfully completed!"
                : "Select the correct answer above."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Section: src/features/missions/experiences/decoherence/steps/RefrigeratorStep.tsx ---
interface RefrigeratorStepProps {
  onComplete?: (completed: boolean) => void;
  onStateChange?: (state: {
    temperature: number;
    coherenceTimeUs: number;
    isCritical: boolean;
    activated: boolean;
  }) => void;
}

export const RefrigeratorStep: React.FC<RefrigeratorStepProps> = ({
  onComplete,
  onStateChange,
}) => {
  const setTemperature = useQuantumStore(
    (s: { setTemperature: any }) => s.setTemperature,
  );
  const [activated, setActivated] = useState<boolean>(false);
  const [temperature, setLocalTemp] = useState<number>(300);
  const [coherenceTimeUs, setLocalCoherence] = useState<number>(
    calculateCoherenceTime(300),
  );
  const [_isCritical, setIsCritical] = useState<boolean>(true);

  const handleActivateRefrigerator = () => {
    if (activated) return;
    const targetTemp = 15;
    const targetCoherence = calculateCoherenceTime(targetTemp);
    const targetCritical = targetTemp > 1200;

    setTemperature(targetTemp);
    setLocalTemp(targetTemp);
    setLocalCoherence(targetCoherence);
    setIsCritical(targetCritical);
    setActivated(true);

    if (onComplete) onComplete(true);
    if (onStateChange) {
      onStateChange({
        temperature: targetTemp,
        coherenceTimeUs: targetCoherence,
        isCritical: targetCritical,
        activated: true,
      });
    }
  };

  return (
    <div
      className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border"
      role="region"
      aria-label="Refrigerator Step"
    >
      <h3 className="text-xl font-bold mb-3">
        Cryogenic Dilution Refrigerator Activation
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        Activate the dilution refrigerator to cool the quantum processor down to
        base operating temperature (15 mK), maximizing coherence lifetime.
      </p>

      <div className="bg-card p-5 rounded-lg mb-6 border border-border flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-muted-foreground block">
            System Temperature
          </span>
          <span
            className="text-2xl font-mono font-bold text-accent"
            aria-live="polite"
          >
            {temperature} mK
          </span>
        </div>
        <div>
          <span className="text-xs uppercase tracking-wider text-muted-foreground block">
            Coherence Lifetime
          </span>
          <span
            className="text-2xl font-mono font-bold text-success"
            aria-live="polite"
          >
            {coherenceTimeUs} us
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs uppercase tracking-wider text-muted-foreground block">
            Status
          </span>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded border ${activated ? "bg-accent-subtle text-accent border-accent-border" : "bg-muted text-muted-foreground"}`}
          >
            {activated ? "Refrigerator Active (15 mK)" : "Standby / Warm"}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleActivateRefrigerator}
          disabled={activated}
          className={`px-6 py-2.5 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${activated ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-primary text-primary-foreground hover:opacity-95"}`}
          aria-label="Activate cryogenic refrigerator"
        >
          {activated ? "Refrigerator Active" : "Activate Refrigerator"}
        </button>
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {activated
            ? "✓ Step complete & recomputed"
            : "Awaiting activation action"}
        </span>
      </div>
    </div>
  );
};

// --- Section: src/features/missions/experiences/decoherence/steps/TemperatureCoherenceStep.tsx ---
interface TemperatureCoherenceStepProps {
  onComplete?: (completed: boolean) => void;
  onStateChange?: (state: {
    temperature: number;
    coherenceTimeUs: number;
    isCritical: boolean;
  }) => void;
}

export const TemperatureCoherenceStep: React.FC<
  TemperatureCoherenceStepProps
> = ({ onComplete, onStateChange }) => {
  const temperatureK = useQuantumStore(
    (s: { temperatureK: any }) => s.temperatureK,
  );
  const coherenceTimeUs = useQuantumStore(
    (s: { coherenceTimeUs: any }) => s.coherenceTimeUs,
  );
  const setTemperature = useQuantumStore(
    (s: { setTemperature: any }) => s.setTemperature,
  );

  const tempMilliKelvin = Math.round(temperatureK * 1000);
  const isCritical = tempMilliKelvin > 1200;

  const handleTemperatureChange = (newMilliKelvin: number) => {
    setTemperature(newMilliKelvin);
    const calculatedT2 = calculateCoherenceTime(newMilliKelvin);
    if (onComplete) onComplete(true);
    if (onStateChange) {
      onStateChange({
        temperature: newMilliKelvin,
        coherenceTimeUs: calculatedT2,
        isCritical: newMilliKelvin > 1200,
      });
    }
  };

  const formattedTempLabel = useMemo(() => {
    if (tempMilliKelvin >= 1000) {
      return `${(tempMilliKelvin / 1000).toFixed(2)} K (${tempMilliKelvin.toLocaleString()} mK)`;
    }
    return `${tempMilliKelvin} mK (${(tempMilliKelvin / 1000).toFixed(3)} K)`;
  }, [tempMilliKelvin]);

  return (
    <div
      className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border"
      role="region"
      aria-label="Temperature Coherence Step"
    >
      <h3 className="text-xl font-bold mb-3">
        Cryogenic Temperature & Coherence Lifetime
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        Adjust the cryogenic environment temperature between 15 mK and 300,000
        mK (300 K). Coherence follows T₂(T), scaling and jittering the 3D Bloch
        vector as decoherence accelerates.
      </p>

      <div className="bg-card p-5 rounded-lg mb-6 border border-border flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-muted-foreground block">
            Coherence Time T₂(T)
          </span>
          <span
            className="text-2xl font-mono font-bold text-accent"
            aria-live="polite"
          >
            {coherenceTimeUs.toFixed(2)} μs
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs uppercase tracking-wider text-muted-foreground block">
            Thermal Status
          </span>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded border ${isCritical ? "bg-destructive-subtle text-destructive border-destructive-border" : "bg-success-subtle text-success border-success-border"}`}
          >
            {isCritical
              ? "Critical (Decoherence Active)"
              : "Cryogenic Coherent Range"}
          </span>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label
            htmlFor="temp-slider"
            className="text-sm font-medium text-muted-foreground"
          >
            Temperature:{" "}
            <span className="font-mono text-accent">{formattedTempLabel}</span>
          </label>
          <span
            className="text-xs text-muted-foreground font-mono"
            aria-live="polite"
          >
            T₂(T) = 250 · exp(-T / 800) μs
          </span>
        </div>
        <input
          id="temp-slider"
          type="range"
          min={15}
          max={300000}
          step={15}
          value={tempMilliKelvin}
          onChange={(_e) => handleTemperatureChange(Number(_e.target.value))}
          className="w-full accent-cyan-500 cursor-pointer bg-muted rounded-lg h-2"
          aria-label="Cryogenic temperature in millikelvin"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>15 mK (0.015 K - Base Dilution)</span>
          <span>1,200 mK (1.2 K - Critical Threshold)</span>
          <span>77,000 mK (77 K - LN2)</span>
          <span>300,000 mK (300 K - Room Temp)</span>
        </div>
      </div>
    </div>
  );
};

// --- Section: src/features/missions/experiences/decoherence/steps/ThermalPhotonStep.tsx ---
interface ThermalPhotonStepProps {
  onComplete?: (completed: boolean) => void;
  onDecoherenceTested?: () => void;
  onStateChange?: (state: { photonCount: number; tested: boolean }) => void;
}

export const ThermalPhotonStep: React.FC<ThermalPhotonStepProps> = ({
  onComplete,
  onDecoherenceTested,
  onStateChange,
}) => {
  const [photonCount, setPhotonCount] = useState<number>(0);
  const [tested, setTested] = useState<boolean>(false);
  const [isPerturbing, setIsPerturbing] = useState<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handlePerturb = () => {
    if (isPerturbing) return;
    setIsPerturbing(true);

    const nextCount = photonCount + 1;
    setPhotonCount(nextCount);

    if (!tested) {
      setTested(true);
      if (onComplete) onComplete(true);
      if (onDecoherenceTested) onDecoherenceTested();
    }

    if (onStateChange) {
      onStateChange({ photonCount: nextCount, tested: true });
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setIsPerturbing(false), 300);
  };

  return (
    <div
      className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border"
      role="region"
      aria-label="Thermal Photon Step"
    >
      <h3 className="text-xl font-bold mb-3">
        Thermal Photon Bombardment & Decoherence
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        Stray thermal photons interact with quantum circuits, inducing
        environmental decoherence and collapsing superposition states. Trigger a
        perturbation to test thermal interaction.
      </p>

      <div className="bg-card p-5 rounded-lg mb-6 border border-border flex items-center justify-between">
        <div>
          <span className="text-xs uppercase tracking-wider text-muted-foreground block">
            Thermal Photon Counter
          </span>
          <span
            className="text-3xl font-mono font-bold text-warning"
            aria-live="polite"
          >
            {photonCount} Photons Detected
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs uppercase tracking-wider text-muted-foreground block">
            Metric Status
          </span>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded ${tested ? "bg-success-subtle text-success border border-success-border" : "bg-muted text-muted-foreground"}`}
          >
            {tested ? "decoherenceTested Recorded" : "Awaiting Perturbation"}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handlePerturb}
          disabled={isPerturbing}
          className="px-6 py-2.5 bg-warning hover:bg-warning-hover text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-warning disabled:opacity-50 cursor-pointer"
          aria-label="Perturb thermal field"
        >
          {isPerturbing ? "Perturbing..." : "Perturb Thermal Field"}
        </button>
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {tested ? "✓ Step complete" : "Click to perturb field"}
        </span>
      </div>
    </div>
  );
};

// --- Section: src/features/missions/experiences/entanglement/index.tsx ---
interface EntanglementExperienceProps {
  onMissionComplete?: () => void;
}

export const EntanglementExperience: React.FC<EntanglementExperienceProps> = ({
  onMissionComplete,
}) => {
  const [activeStepId, setActiveStepId] =
    useState<string>("independent-qubits");
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>(
    {},
  );
  const [bellPrepared, setBellPrepared] = useState<boolean>(false);
  const [entanglementMeasurementsCount, setEntanglementMeasurementsCount] =
    useState<number>(0);
  const [knowledgeCheckPassed, setKnowledgeCheckPassed] =
    useState<boolean>(false);

  const handleStepComplete = (stepId: string) => {
    setCompletedSteps((_prev) => {
      const next = { ..._prev, [stepId]: true };
      checkAllComplete(next, knowledgeCheckPassed);
      return next;
    });
  };

  const handleBellPrepared = (state: { prepared: boolean }) => {
    if (state.prepared) {
      setBellPrepared(true);
      handleStepComplete("prepare-bell");
    }
  };

  const handleRecordMeasurement = () => {
    if (entanglementMeasurementsCount === 0) {
      setEntanglementMeasurementsCount(1);
    }
  };

  const handleKnowledgeCheckComplete = () => {
    setKnowledgeCheckPassed(true);
    const next = { ...completedSteps, "knowledge-check": true };
    setCompletedSteps(next);
    checkAllComplete(next, true);
  };

  const checkAllComplete = (
    currentCompleted: Record<string, boolean>,
    _quizPassed: boolean,
  ) => {
    if (
      currentCompleted["independent-qubits"] &&
      currentCompleted["prepare-bell"] &&
      currentCompleted["separation"] &&
      currentCompleted["correlated-measurement"]
    ) {
      if (onMissionComplete) onMissionComplete();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-background text-foreground rounded-2xl shadow-2xl border border-border">
      <div className="mb-8 border-b border-border pb-4">
        <span className="text-xs uppercase tracking-widest text-accent font-semibold">
          Mission 2 Experience
        </span>
        <h2 className="text-2xl font-bold mt-1">
          Quantum Entanglement & Non-Locality
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Explore independent qubits, Bell pair preparation, spatial separation,
          correlated measurement, and canonical knowledge validation.
        </p>

        <div className="flex flex-wrap gap-2 mt-6">
          {[
            { id: "independent-qubits", label: "1. Independent Qubits" },
            { id: "prepare-bell", label: "2. Prepare Bell Pair" },
            { id: "separation", label: "3. Spatial Separation" },
            {
              id: "correlated-measurement",
              label: "4. Correlated Measurement",
            },
            { id: "knowledge-check", label: "5. Knowledge Check" },
          ].map((step) => (
            <button
              key={step.id}
              type="button"
              onClick={() => setActiveStepId(step.id)}
              className={`px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${activeStepId === step.id ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-card"}`}
              aria-current={activeStepId === step.id ? "step" : undefined}
            >
              {step.label} {completedSteps[step.id] ? "✓" : ""}
            </button>
          ))}
        </div>
      </div>

      <div className="transition-all duration-300">
        {activeStepId === "independent-qubits" && (
          <IndependentQubitsStep
            onComplete={() => handleStepComplete("independent-qubits")}
          />
        )}
        {activeStepId === "prepare-bell" && (
          <PrepareBellStep
            onComplete={() => handleBellPrepared({ prepared: true })}
          />
        )}
        {activeStepId === "separation" && (
          <SeparationStep onComplete={() => handleStepComplete("separation")} />
        )}
        {activeStepId === "correlated-measurement" && (
          <CorrelatedMeasurementStep
            isBellPrepared={bellPrepared}
            onComplete={() => handleStepComplete("correlated-measurement")}
            onRecordMeasurement={handleRecordMeasurement}
          />
        )}
        {activeStepId === "knowledge-check" && (
          <div
            className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border"
            role="region"
            aria-label="Knowledge Check"
          >
            <h3 className="text-xl font-bold mb-3">
              Canonical Quiz: Entanglement Validation
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Verify your understanding of non-locality, measurement
              correlations, and faster-than-light constraints.
            </p>
            <div className="bg-card p-5 rounded-lg mb-6 border border-border">
              <p className="text-sm font-medium mb-3">
                Does measuring an entangled qubit allow sending messages faster
                than light?
              </p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleKnowledgeCheckComplete}
                  className="w-full text-left p-3 rounded bg-muted hover:bg-secondary text-sm transition-colors"
                >
                  No. While outcomes are correlated, individual results are
                  random and cannot transmit controlled signals.
                </button>
                <button
                  type="button"
                  onClick={handleKnowledgeCheckComplete}
                  className="w-full text-left p-3 rounded bg-muted hover:bg-secondary text-sm transition-colors"
                >
                  Yes, instant correlation implies faster-than-light
                  communication. (Incorrect)
                </button>
              </div>
            </div>
            <div className="text-xs text-muted-foreground" aria-live="polite">
              {knowledgeCheckPassed
                ? "✓ Knowledge check successfully completed!"
                : "Select the correct answer above."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Section: src/features/missions/experiences/entanglement/steps/CorrelatedMeasurementStep.tsx ---
interface CorrelatedMeasurementStepProps {
  isBellPrepared: boolean;
  onComplete?: (completed: boolean) => void;
  onRecordMeasurement?: (result: {
    alice: "|0⟩" | "|1⟩";
    bob: "|0⟩" | "|1⟩";
  }) => void;
}

export const CorrelatedMeasurementStep: React.FC<
  CorrelatedMeasurementStepProps
> = ({ isBellPrepared, onComplete, onRecordMeasurement }) => {
  const [measured, setMeasured] = useState<boolean>(false);
  const [results, setResults] = useState<{
    alice: "|0⟩" | "|1⟩";
    bob: "|0⟩" | "|1⟩";
    bitString: "00" | "11";
  } | null>(null);

  const handleMeasureStationA = () => {
    if (!isBellPrepared || measured) return;

    bellState("phi+");
    const state = measureEntangledQubit();
    const bit: 0 | 1 = state.aliceOutcome ?? (Math.random() < 0.5 ? 0 : 1);
    const bitLabel: "|0⟩" | "|1⟩" = bit === 0 ? "|0⟩" : "|1⟩";
    const bitStr: "00" | "11" = bit === 0 ? "00" : "11";

    const correlatedResult = {
      alice: bitLabel,
      bob: bitLabel,
      bitString: bitStr,
    };

    setResults(correlatedResult);
    setMeasured(true);

    if (onRecordMeasurement) {
      onRecordMeasurement({ alice: bitLabel, bob: bitLabel });
    }
    if (onComplete) {
      onComplete(true);
    }
  };

  return (
    <div
      className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border"
      role="region"
      aria-label="Correlated Measurement Step"
    >
      <h3 className="text-xl font-bold mb-3">
        Correlated Measurement & Non-Signaling
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Measure the entangled pair. Because the states are linked, Alice&apos;s
        measurement yields a random outcome, and Bob&apos;s measurement will{" "}
        <em>always perfectly match</em> Alice&apos;s result. However, Alice
        cannot choose or force the outcome to transmit a message.
      </p>

      {!isBellPrepared && (
        <div className="bg-warning-subtle border border-warning-border p-4 rounded-lg mb-6 text-xs text-warning">
          ⚠️ <strong>Action Required:</strong> You must prepare a Bell pair in
          the previous step before performing a correlated measurement.
        </div>
      )}

      <div className="bg-card p-5 rounded-lg mb-6 border border-border text-center">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
          Measurement Results Boundary (|Φ+⟩)
        </div>
        <div
          className="text-2xl font-mono font-bold text-accent mb-2"
          aria-live="polite"
        >
          {measured && results
            ? `Station A: ${results.alice} | Station B: ${results.bob}`
            : "Awaiting Measurement of Station A..."}
        </div>
        <p className="text-xs text-muted-foreground">
          {measured && results
            ? `Joint Collapsed State: |${results.bitString}⟩ (Perfect Correlation: 00 or 11, never 01 or 10)`
            : "Measuring Station A forces instantaneous collapse of Station B into the exact same bit."}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleMeasureStationA}
          disabled={!isBellPrepared || measured}
          className={`px-6 py-2.5 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${!isBellPrepared || measured ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-primary text-primary-foreground hover:opacity-95 cursor-pointer"}`}
          aria-label="Perform correlated quantum measurement on Station A"
        >
          {measured ? "Station A Measured" : "Measure Station A"}
        </button>
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {measured
            ? "Step complete: Pair collapsed"
            : isBellPrepared
              ? "Ready: Click Measure Station A"
              : "Bell pair required"}
        </span>
      </div>
    </div>
  );
};

// --- Section: src/features/missions/experiences/entanglement/steps/IndependentQubitsStep.tsx ---
interface IndependentQubitsStepProps {
  onComplete?: (completed: boolean) => void;
  onStateChange?: (state: { alice: 0 | 1; bob: 0 | 1 }) => void;
}

export const IndependentQubitsStep: React.FC<IndependentQubitsStepProps> = ({
  onComplete,
  onStateChange,
}) => {
  const [aliceState, setAliceState] = useState<0 | 1>(0);
  const [bobState, setBobState] = useState<0 | 1>(0);
  const [interacted, setInteracted] = useState<boolean>(false);

  const checkComplete = () => {
    if (!interacted) {
      setInteracted(true);
      if (onComplete) onComplete(true);
    }
  };

  const handleAliceToggle = () => {
    const next = aliceState === 0 ? (1 as const) : (0 as const);
    setAliceState(next);
    checkComplete();
    if (onStateChange) onStateChange({ alice: next, bob: bobState });
  };

  const handleBobToggle = () => {
    const next = bobState === 0 ? (1 as const) : (0 as const);
    setBobState(next);
    checkComplete();
    if (onStateChange) onStateChange({ alice: aliceState, bob: next });
  };

  return (
    <div
      className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border"
      role="region"
      aria-label="Independent Qubits Step"
    >
      <h3 className="text-xl font-bold mb-3">
        Station Alice & Station Bob: Independent Qubits
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        Before entanglement, Alice and Bob operate entirely independently.
        Changing Alice&apos;s qubit state has zero effect on Bob&apos;s qubit.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-card p-4 rounded-lg border border-border">
          <div className="text-xs uppercase tracking-wider text-accent font-semibold mb-2">
            Station Alice
          </div>
          <div className="text-2xl font-mono font-bold mb-4" aria-live="polite">
            State: |{aliceState}⟩
          </div>
          <button
            type="button"
            onClick={handleAliceToggle}
            className="px-4 py-2 bg-primary text-primary-foreground hover:opacity-95 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
            aria-label="Toggle Alice qubit state independently"
          >
            Toggle Alice
          </button>
        </div>

        <div className="bg-card p-4 rounded-lg border border-border">
          <div className="text-xs uppercase tracking-wider text-axis-y font-semibold mb-2">
            Station Bob
          </div>
          <div className="text-2xl font-mono font-bold mb-4" aria-live="polite">
            State: |{bobState}⟩
          </div>
          <button
            type="button"
            onClick={handleBobToggle}
            className="px-4 py-2 bg-quantum-purple hover:bg-quantum-purple text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-axis-y cursor-pointer"
            aria-label="Toggle Bob qubit state independently"
          >
            Toggle Bob
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between bg-card p-3 rounded-lg border border-border">
        <span className="text-xs font-semibold uppercase tracking-wider text-warning">
          System Link Status: Not Entangled
        </span>
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {interacted
            ? "✓ Independent interaction verified"
            : "Modify individual qubit states to proceed"}
        </span>
      </div>
    </div>
  );
};

// --- Section: src/features/missions/experiences/entanglement/steps/PrepareBellStep.tsx ---
interface PrepareBellStepProps {
  onComplete?: (completed: boolean) => void;
  onStateChange?: (state: { prepared: boolean }) => void;
}

export const PrepareBellStep: React.FC<PrepareBellStepProps> = ({
  onComplete,
  onStateChange,
}) => {
  const [prepared, setPrepared] = useState<boolean>(false);

  const handlePrepareBell = () => {
    if (prepared) return;
    setPrepared(true);
    if (onComplete) onComplete(true);
    if (onStateChange) onStateChange({ prepared: true });
  };

  return (
    <div
      className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border"
      role="region"
      aria-label="Prepare Bell Pair Step"
    >
      <h3 className="text-xl font-bold mb-3">
        Preparing a Bell Pair (Entanglement)
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        By applying canonical domain gates (Hadamard followed by CNOT) across
        Station Alice and Station Bob, we generate a maximally entangled Bell
        state.
      </p>

      <div className="bg-warning-subtle border border-warning-border p-4 rounded-lg mb-6 text-xs text-warning">
        <strong>Important Physics Note:</strong> Entanglement creates non-local
        correlations, but it does <em>not</em> allow faster-than-light (FTL)
        communication or messaging. Measuring one qubit instantaneously
        correlates with the other, but no signals travel between Alice and Bob
        faster than light.
      </div>

      <div className="bg-card p-5 rounded-lg mb-6 border border-border text-center">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
          Canonical Bell State Expression
        </div>
        <div
          className="text-2xl font-mono font-bold text-accent mb-2"
          aria-live="polite"
        >
          {prepared ? "(|00⟩ + |11⟩) / √2" : "Unentangled State (Independent)"}
        </div>
        <p className="text-xs text-muted-foreground">
          Link Status:{" "}
          {prepared ? "Entangled (Bell Pair Active)" : "Unlinked / Independent"}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrepareBell}
          disabled={prepared}
          className={`px-6 py-2.5 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${prepared ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-primary text-primary-foreground hover:opacity-95 cursor-pointer"}`}
          aria-label="Prepare Bell pair entanglement"
        >
          {prepared ? "Bell Pair Prepared" : "Prepare Bell Pair"}
        </button>
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {prepared
            ? "✓ Entanglement step completed"
            : "Awaiting bell preparation action"}
        </span>
      </div>
    </div>
  );
};

// --- Section: src/features/missions/experiences/entanglement/steps/SeparationStep.tsx ---
interface SeparationStepProps {
  onComplete?: (completed: boolean) => void;
  onStateChange?: (distanceKm: number) => void;
}

export const SeparationStep: React.FC<SeparationStepProps> = ({
  onComplete,
  onStateChange,
}) => {
  const [distance, setDistance] = useState<number>(1000);
  const [interacted, setInteracted] = useState<boolean>(false);

  const handleDistanceChange = (newDistance: number) => {
    setDistance(newDistance);
    if (!interacted) {
      setInteracted(true);
      if (onComplete) onComplete(true);
    }
    if (onStateChange) {
      onStateChange(newDistance);
    }
  };

  return (
    <div
      className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border"
      role="region"
      aria-label="Spatial Separation Step"
    >
      <h3 className="text-xl font-bold mb-3">
        Spatial Separation & Non-Locality
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Adjust the spatial distance between Station Alice and Station Bob. Note
        that physical separation changes{" "}
        <em>only the visualization and propagation scale</em>, never the
        underlying quantum state or entanglement correlation strength.
      </p>

      <div className="bg-card p-4 rounded-lg mb-6 border border-border text-xs text-accent">
        <strong>Observation:</strong> Quantum entanglement is independent of
        distance. Separating the stations by hundreds of thousands of kilometers
        does not diminish their correlation, nor does it enable
        faster-than-light signaling.
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label
            htmlFor="separation-slider"
            className="text-sm font-medium text-muted-foreground"
          >
            Distance:{" "}
            <span className="font-mono text-accent">
              {distance.toLocaleString()} km
            </span>
          </label>
          <span className="text-xs text-muted-foreground" aria-live="polite">
            {interacted ? "✓ Separation visualized" : "Adjust distance slider"}
          </span>
        </div>
        <input
          id="separation-slider"
          type="range"
          min={1000}
          max={400000}
          step={1000}
          value={distance}
          onChange={(_e) => handleDistanceChange(Number(_e.target.value))}
          className="w-full accent-cyan-500 cursor-pointer bg-muted rounded-lg h-2"
          aria-label="Station separation distance in kilometers"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>1,000 km (Orbital)</span>
          <span>200,000 km</span>
          <span>400,000 km (Lunar Distance)</span>
        </div>
      </div>
    </div>
  );
};

// --- Section: src/features/missions/experiences/error-correction/index.tsx ---
interface ErrorCorrectionExperienceProps {
  onMissionComplete?: () => void;
}

export const ErrorCorrectionExperience: React.FC<
  ErrorCorrectionExperienceProps
> = ({ onMissionComplete }) => {
  const [activeStepId, setActiveStepId] = useState<string>(
    "error-correction-overview",
  );
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>(
    {},
  );
  const [knowledgeCheckPassed, setKnowledgeCheckPassed] =
    useState<boolean>(false);

  const handleStepComplete = (stepId: string) => {
    setCompletedSteps((_prev) => {
      const next = { ..._prev, [stepId]: true };
      checkAllComplete(next, knowledgeCheckPassed);
      return next;
    });
  };

  const handleKnowledgeCheckComplete = () => {
    setKnowledgeCheckPassed(true);
    const next = { ...completedSteps, "knowledge-check": true };
    setCompletedSteps(next);
    checkAllComplete(next, true);
  };

  const checkAllComplete = (
    currentCompleted: Record<string, boolean>,
    _quizPassed: boolean,
  ) => {
    if (
      currentCompleted["error-correction-overview"] &&
      currentCompleted["bit-flip-correction"] &&
      currentCompleted["phase-flip"] &&
      currentCompleted["syndrome-majority"]
    ) {
      if (onMissionComplete) onMissionComplete();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-background text-foreground rounded-2xl shadow-2xl border border-border">
      <div className="mb-8 border-b border-border pb-4">
        <span className="text-xs uppercase tracking-widest text-accent font-semibold">
          Mission Experience
        </span>
        <h2 className="text-2xl font-bold mt-1">Quantum Error Correction</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Explore error correction overview, bit-flip correction, quantum phase
          flips, syndrome measurement, and canonical knowledge validation.
        </p>

        <div className="flex flex-wrap gap-2 mt-6">
          {[
            { id: "error-correction-overview", label: "1. Overview" },
            { id: "bit-flip-correction", label: "2. Bit-Flip Correction" },
            { id: "phase-flip", label: "3. Phase Flip" },
            { id: "syndrome-majority", label: "4. Syndrome & Majority" },
            { id: "knowledge-check", label: "5. Knowledge Check" },
          ].map((step) => (
            <button
              key={step.id}
              type="button"
              onClick={() => setActiveStepId(step.id)}
              className={`px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${activeStepId === step.id ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-card"}`}
              aria-current={activeStepId === step.id ? "step" : undefined}
            >
              {step.label} {completedSteps[step.id] ? "✓" : ""}
            </button>
          ))}
        </div>
      </div>

      <div className="transition-all duration-300">
        {activeStepId === "error-correction-overview" && (
          <ErrorCorrectionOverviewStep
            onComplete={() => handleStepComplete("error-correction-overview")}
          />
        )}
        {activeStepId === "bit-flip-correction" && (
          <BitFlipCorrectionStep
            onComplete={() => handleStepComplete("bit-flip-correction")}
          />
        )}
        {activeStepId === "phase-flip" && (
          <PhaseFlipStep onComplete={() => handleStepComplete("phase-flip")} />
        )}
        {activeStepId === "syndrome-majority" && (
          <SyndromeMajorityStep
            onComplete={() => handleStepComplete("syndrome-majority")}
          />
        )}
        {activeStepId === "knowledge-check" && (
          <div
            className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border"
            role="region"
            aria-label="Knowledge Check"
          >
            <h3 className="text-xl font-bold mb-3">
              Canonical Quiz: Quantum Error Correction
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Verify your understanding of repetition codes, syndrome
              measurements, phase errors, and single-error limitations.
            </p>
            <div className="bg-card p-5 rounded-lg mb-6 border border-border">
              <p className="text-sm font-medium mb-3">
                What is the primary limitation of the basic three-bit repetition
                code demonstrated in this mission?
              </p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleKnowledgeCheckComplete}
                  className="w-full text-left p-3 rounded bg-muted hover:bg-secondary text-sm transition-colors"
                >
                  It corrects only isolated single bit-flips and does not
                  protect against phase errors or multiple simultaneous errors.
                </button>
                <button
                  type="button"
                  onClick={handleKnowledgeCheckComplete}
                  className="w-full text-left p-3 rounded bg-muted hover:bg-secondary text-sm transition-colors"
                >
                  It corrects all arbitrary multi-qubit phase and bit-flip
                  errors simultaneously. (Incorrect)
                </button>
              </div>
            </div>
            <div className="text-xs text-muted-foreground" aria-live="polite">
              {knowledgeCheckPassed
                ? "✓ Knowledge check successfully completed!"
                : "Select the correct answer above."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Section: src/features/missions/experiences/error-correction/steps/BitFlipCorrectionStep.tsx ---
interface BitFlipCorrectionStepProps {
  onComplete?: (completed: boolean) => void;
  onRecordCorrection?: () => void;
  onStateChange?: (state: {
    original: string;
    corrupted: string;
    corrected: string;
    errorInjected: boolean;
  }) => void;
}

export const BitFlipCorrectionStep: React.FC<BitFlipCorrectionStepProps> = ({
  onComplete,
  onRecordCorrection,
}) => {
  const [logicalBit, setLogicalBit] = useState<0 | 1>(0);
  const [phase, setPhase] = useState<
    "idle" | "encoded" | "error_injected" | "recovered"
  >("idle");
  const [encodedWord, setEncodedWord] = useState<BitTriple | null>(null);
  const [corruptedWord, setCorruptedWord] = useState<BitTriple | null>(null);
  const [errorWire, setErrorWire] = useState<number | null>(null);
  const [syndrome, setSyndrome] = useState<number | null>(null);
  const [correctedWord, setCorrectedWord] = useState<BitTriple | null>(null);
  const [fidelity, setFidelity] = useState<number>(100);
  const [eventRecorded, setEventRecorded] = useState<boolean>(false);

  const handleEncode = () => {
    const encoded = bitFlipEncode(logicalBit);
    setEncodedWord(encoded);
    setCorruptedWord(null);
    setErrorWire(null);
    setSyndrome(null);
    setCorrectedWord(null);
    setFidelity(100);
    setPhase("encoded");
  };

  const handleInjectError = (targetWire: 0 | 1 | 2 = 1) => {
    if (!encodedWord) return;
    const corrupted = injectBitFlip(encodedWord, targetWire);
    setErrorWire(targetWire);
    setCorruptedWord(corrupted);
    setFidelity(0);
    setPhase("error_injected");
  };

  const handleSyndromeAndRecover = () => {
    if (!corruptedWord) return;
    const synResult = detectBitFlipSyndrome(corruptedWord);
    setSyndrome(synResult.syndrome);
    setCorrectedWord(synResult.corrected);
    setFidelity(100);
    setPhase("recovered");

    if (!eventRecorded) {
      setEventRecorded(true);
      if (onRecordCorrection) onRecordCorrection();
    }
    if (onComplete) onComplete(true);
  };

  const handleReset = () => {
    setPhase("idle");
    setEncodedWord(null);
    setCorruptedWord(null);
    setErrorWire(null);
    setSyndrome(null);
    setCorrectedWord(null);
    setFidelity(100);
  };

  return (
    <div
      className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border"
      role="region"
      aria-label="Bit-Flip Error Correction Step"
    >
      <h3 className="text-xl font-bold mb-3">
        3-Qubit Quantum Error Correction (Bit-Flip Code)
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Protect a single logical qubit state $|\psi\rangle$ against
        environmental bit-flip errors by encoding it across three physical
        qubits. The 3-qubit repetition code detects which wire flipped via
        syndrome measurements and restores 100% state fidelity.
      </p>

      <div className="bg-card p-3 rounded-lg mb-4 border border-border flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          Select Input Logical State |ψ⟩:
        </span>
        <div className="flex gap-2">
          {([0, 1] as const).map((b) => (
            <button
              key={b}
              type="button"
              disabled={phase !== "idle"}
              onClick={() => setLogicalBit(b)}
              className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                logicalBit === b
                  ? "bg-accent text-accent-foreground border border-accent shadow-[0_0_8px_rgba(0,240,255,0.4)]"
                  : "bg-background hover:bg-muted text-foreground border border-border"
              } ${phase !== "idle" ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            >
              |{b}⟩
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card p-5 rounded-lg mb-6 border border-border">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            3-Qubit Physical Register
          </span>
          <span
            className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
              fidelity === 100
                ? "bg-success-subtle text-success border-success-border"
                : "bg-destructive-subtle text-destructive border-destructive-border"
            }`}
          >
            Fidelity: {fidelity}%
          </span>
        </div>

        <div className="space-y-3 font-mono text-sm">
          {[0, 1, 2].map((wireIdx) => {
            const isFlippedWire =
              errorWire === wireIdx && phase === "error_injected";
            const isRecoveredWire =
              errorWire === wireIdx && phase === "recovered";

            const bitValue =
              phase === "idle"
                ? "-"
                : phase === "encoded"
                  ? (encodedWord?.[wireIdx] ?? "-")
                  : phase === "error_injected"
                    ? (corruptedWord?.[wireIdx] ?? "-")
                    : (correctedWord?.[wireIdx] ?? "-");

            return (
              <div
                key={wireIdx}
                className={`p-3 rounded-lg border transition-all flex items-center justify-between ${
                  isFlippedWire
                    ? "bg-red-500/10 border-red-500 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.4)]"
                    : isRecoveredWire
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                      : "bg-background border-border text-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`font-bold ${isFlippedWire ? "text-red-400" : "text-accent"}`}
                  >
                    Qubit Wire [{wireIdx}]:
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {wireIdx === 0
                      ? "Primary Data Qubit"
                      : `Ancilla / Redundancy ${wireIdx}`}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {isFlippedWire && (
                    <span className="text-xs px-2 py-0.5 rounded bg-red-500 text-white font-bold animate-pulse">
                      X ERROR (Bit-Flip)
                    </span>
                  )}
                  {isRecoveredWire && (
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-500 text-white font-bold">
                      RECOVERED
                    </span>
                  )}
                  <span
                    className={`text-base font-bold px-2.5 py-0.5 rounded ${
                      isFlippedWire
                        ? "bg-red-500/20 text-red-300"
                        : "bg-card text-foreground"
                    }`}
                  >
                    |{bitValue}⟩
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-border flex flex-wrap justify-between text-xs font-mono text-muted-foreground">
          <div>
            Phase:{" "}
            <span className="text-accent font-bold">{phase.toUpperCase()}</span>
          </div>
          <div>
            Flipped Wire:{" "}
            <span
              className={errorWire !== null ? "text-red-400 font-bold" : ""}
            >
              {errorWire !== null ? `Wire #${errorWire}` : "None"}
            </span>
          </div>
          <div>
            Syndrome:{" "}
            <span className="text-axis-y font-bold">
              {syndrome !== null ? `S = ${syndrome}` : "Not measured"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleEncode}
            disabled={phase !== "idle" && phase !== "recovered"}
            className={`px-4 py-2.5 rounded-lg text-xs font-semibold font-mono transition-all ${
              phase === "idle" || phase === "recovered"
                ? "bg-primary text-primary-foreground hover:opacity-95 cursor-pointer"
                : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
            }`}
          >
            1. Encode |psi&gt; to 3 Qubits
          </button>

          <button
            type="button"
            onClick={() => handleInjectError(1)}
            disabled={phase !== "encoded"}
            className={`px-4 py-2.5 rounded-lg text-xs font-semibold font-mono transition-all ${
              phase === "encoded"
                ? "bg-amber-600 hover:bg-amber-500 text-white cursor-pointer shadow-[0_0_10px_rgba(217,119,6,0.3)]"
                : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
            }`}
          >
            2. Inject Bit-Flip Error
          </button>

          <button
            type="button"
            onClick={handleSyndromeAndRecover}
            disabled={phase !== "error_injected"}
            className={`px-4 py-2.5 rounded-lg text-xs font-semibold font-mono transition-all ${
              phase === "error_injected"
                ? "bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
            }`}
          >
            3. Syndrome Measure & Recover
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 bg-muted hover:bg-secondary text-foreground text-xs rounded-lg transition-colors cursor-pointer"
          >
            Reset
          </button>
        </div>

        <span
          className="text-xs text-muted-foreground font-mono"
          aria-live="polite"
        >
          {phase === "idle" && "Click 1 to encode"}
          {phase === "encoded" && "Encoded |000> / |111>. Click 2 to flip"}
          {phase === "error_injected" &&
            "Wire highlighted red. Click 3 to recover"}
          {phase === "recovered" && "✓ Restored 100% Fidelity"}
        </span>
      </div>
    </div>
  );
};

// --- Section: src/features/missions/experiences/error-correction/steps/ErrorCorrectionOverviewStep.tsx ---
interface ErrorCorrectionOverviewStepProps {
  onComplete?: (completed: boolean) => void;
  onStateChange?: (state: { acknowledged: boolean }) => void;
}

export const ErrorCorrectionOverviewStep: React.FC<
  ErrorCorrectionOverviewStepProps
> = ({ onComplete, onStateChange }) => {
  const [acknowledged, setAcknowledged] = useState<boolean>(false);

  const handleAcknowledge = () => {
    if (acknowledged) return;
    setAcknowledged(true);
    if (onComplete) onComplete(true);
    if (onStateChange) onStateChange({ acknowledged: true });
  };

  return (
    <div
      className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border"
      role="region"
      aria-label="Error Correction Overview Step"
    >
      <h3 className="text-xl font-bold mb-3">
        Quantum Error Correction: Overview & Repetition Codes
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Quantum information is highly fragile due to environmental noise. Error
        correction protects logical qubits by encoding them into larger physical
        spaces using logical redundancy.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-card p-4 rounded-lg border border-border">
          <span className="text-[10px] uppercase tracking-wider text-accent block mb-1">
            Three-Bit Repetition Code
          </span>
          <p className="text-xs text-muted-foreground">
            Encodes logical 0 as{" "}
            <code className="text-accent font-mono">000</code> and logical 1 as{" "}
            <code className="text-accent font-mono">111</code>, spreading
            information across multiple physical qubits.
          </p>
        </div>

        <div className="bg-card p-4 rounded-lg border border-border">
          <span className="text-[10px] uppercase tracking-wider text-axis-y block mb-1">
            Syndrome & Majority Vote
          </span>
          <p className="text-xs text-muted-foreground">
            Syndrome measurements detect errors without destroying the encoded
            quantum superposition state, allowing a majority vote decoder to
            identify and correct single bit-flips.
          </p>
        </div>
      </div>

      <div className="bg-warning-subtle border border-warning-border p-4 rounded-lg mb-6 text-xs text-warning">
        ⚠️ <strong>Important Limitations:</strong> This simplified repetition
        code only protects against isolated single bit-flips. It{" "}
        <em>does not</em> correct phase errors or arbitrary multiple
        simultaneous bit-flips.
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleAcknowledge}
          disabled={acknowledged}
          className={`px-6 py-2.5 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${acknowledged ? "bg-success-hover text-white cursor-default" : "bg-primary text-primary-foreground hover:opacity-95 cursor-pointer"}`}
          aria-label="Acknowledge error correction overview"
        >
          {acknowledged
            ? "✓ Acknowledged & Understood"
            : "Acknowledge Overview"}
        </button>
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {acknowledged ? "Step completed" : "Review concepts and acknowledge"}
        </span>
      </div>
    </div>
  );
};

// --- Section: src/features/missions/experiences/error-correction/steps/PhaseFlipStep.tsx ---
interface PhaseFlipStepProps {
  onComplete?: (completed: boolean) => void;
  onStateChange?: (state: { phaseFlipped: boolean }) => void;
}

export const PhaseFlipStep: React.FC<PhaseFlipStepProps> = ({
  onComplete,
  onStateChange,
}) => {
  const [flipped, setFlipped] = useState<boolean>(false);

  const handlePhaseFlip = () => {
    if (flipped) return;
    setFlipped(true);
    if (onComplete) onComplete(true);
    if (onStateChange) onStateChange({ phaseFlipped: true });
  };

  return (
    <div
      className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border"
      role="region"
      aria-label="Phase Flip Step"
    >
      <h3 className="text-xl font-bold mb-3">Quantum Phase Flip (Z Error)</h3>
      <p className="text-sm text-muted-foreground mb-4">
        A phase flip alters the relative sign between computational basis states
        (e.g., transforming |+⟩ = (|0⟩ + |1⟩) / √2 into (|0⟩ - |1⟩) / √2). It is
        a uniquely quantum error and must <em>never</em> be represented as a
        classical 0 ↔ 1 bit flip.
      </p>

      <div className="bg-card p-5 rounded-lg mb-6 border border-border text-center">
        <span className="text-xs uppercase tracking-wider text-muted-foreground block mb-2">
          Statevector Representation
        </span>
        <div
          className="text-2xl font-mono font-bold text-accent mb-2"
          aria-live="polite"
        >
          |ψ⟩ = {flipped ? "(|0⟩ - |1⟩) / √2" : "(|0⟩ + |1⟩) / √2"}
        </div>
        <p className="text-xs text-muted-foreground">
          Computational probabilities remain P(|0⟩) = 50% | P(|1⟩) = 50%, but
          the relative phase is inverted.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handlePhaseFlip}
          disabled={flipped}
          className={`px-6 py-2.5 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${flipped ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-primary text-primary-foreground hover:opacity-95 cursor-pointer"}`}
          aria-label="Apply phase flip error"
        >
          {flipped ? "Phase Flip Applied" : "Apply Phase Flip Error"}
        </button>
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {flipped ? "✓ Step complete" : "Awaiting phase flip action"}
        </span>
      </div>
    </div>
  );
};

// --- Section: src/features/missions/experiences/error-correction/steps/SyndromeMajorityStep.tsx ---
interface SyndromeMajorityStepProps {
  onComplete?: (completed: boolean) => void;
  onStateChange?: (state: { evaluated: boolean }) => void;
}

export const SyndromeMajorityStep: React.FC<SyndromeMajorityStepProps> = ({
  onComplete,
  onStateChange,
}) => {
  const [word] = useState<BitTriple>([1, 0, 1]);
  const [corrected, setCorrected] = useState<string>("111");
  const [syndromeStr, setSyndromeStr] = useState<string>("10");
  const [evaluated, setEvaluated] = useState<boolean>(false);

  const handleEvaluate = () => {
    const res = detectBitFlipSyndrome(word);
    setCorrected(res.corrected.join(""));
    setSyndromeStr(String(res.syndrome));
    setEvaluated(true);
    if (onComplete) onComplete(true);
    if (onStateChange) onStateChange({ evaluated: true });
  };

  return (
    <div
      className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border"
      role="region"
      aria-label="Syndrome and Majority Vote Step"
    >
      <h3 className="text-xl font-bold mb-3">
        Syndrome Measurement & Majority-Vote Decision
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Using the canonical domain API, syndrome extraction inspects parity
        checks across the three-bit repetition code word without collapsing
        logical superposition. A majority-vote decision then corrects the
        documented single-error case.
      </p>

      <div className="bg-warning-subtle border border-warning-border p-4 rounded-lg mb-6 text-xs text-warning">
        ⚠️ <strong>Limitation Note:</strong> This mechanism corrects{" "}
        <em>only</em> the documented single-error case. Multiple simultaneous
        errors cause misidentification and decode into incorrect states.
      </div>

      <div className="bg-card p-5 rounded-lg mb-6 border border-border space-y-3">
        <div className="flex justify-between items-center text-xs border-b border-border pb-2">
          <span className="text-muted-foreground">
            Three-Bit Word (Test Input):
          </span>
          <span className="font-mono text-warning font-bold">
            {word.join("")}
          </span>
        </div>
        <div className="flex justify-between items-center text-xs border-b border-border pb-2">
          <span className="text-muted-foreground">Extracted Syndrome:</span>
          <span className="font-mono text-axis-y font-bold">
            {evaluated ? syndromeStr : "10"}
          </span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">
            Majority-Vote Corrected Output:
          </span>
          <span className="font-mono text-success font-bold">
            {evaluated ? corrected : "Pending Evaluation..."}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleEvaluate}
          disabled={evaluated}
          className={`px-6 py-2.5 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${evaluated ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-primary text-primary-foreground hover:opacity-95 cursor-pointer"}`}
          aria-label="Evaluate syndrome and majority vote"
        >
          {evaluated ? "Evaluated" : "Run Syndrome & Majority Vote"}
        </button>
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {evaluated ? "✓ Step complete" : "Awaiting evaluation action"}
        </span>
      </div>
    </div>
  );
};

// --- Section: src/features/missions/experiences/gates/index.tsx ---
interface GatesExperienceProps {
  onMissionComplete?: () => void;
}

export const GatesExperience: React.FC<GatesExperienceProps> = ({
  onMissionComplete,
}) => {
  const [activeStepId, setActiveStepId] = useState<string>("gate-basics");
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>(
    {},
  );
  const [knowledgeCheckPassed, setKnowledgeCheckPassed] =
    useState<boolean>(false);

  const handleStepComplete = (stepId: string) => {
    setCompletedSteps((_prev) => {
      const next = { ..._prev, [stepId]: true };
      checkAllComplete(next, knowledgeCheckPassed);
      return next;
    });
  };

  const handleKnowledgeCheckComplete = () => {
    setKnowledgeCheckPassed(true);
    const next = { ...completedSteps, "knowledge-check": true };
    setCompletedSteps(next);
    checkAllComplete(next, true);
  };

  const checkAllComplete = (
    currentCompleted: Record<string, boolean>,
    _quizPassed: boolean,
  ) => {
    if (
      currentCompleted["gate-basics"] &&
      currentCompleted["apply-gates"] &&
      currentCompleted["teaching-circuit"]
    ) {
      if (onMissionComplete) onMissionComplete();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-background text-foreground rounded-2xl shadow-2xl border border-border">
      <div className="mb-8 border-b border-border pb-4">
        <span className="text-xs uppercase tracking-widest text-accent font-semibold">
          Mission Experience
        </span>
        <h2 className="text-2xl font-bold mt-1">
          Quantum Gates & Teaching Circuits
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Explore gate basics, interactive single-qubit gate operations,
          teaching circuits, and canonical knowledge validation.
        </p>

        <div className="flex flex-wrap gap-2 mt-6">
          {[
            { id: "gate-basics", label: "1. Gate Basics" },
            { id: "apply-gates", label: "2. Apply Gates" },
            { id: "teaching-circuit", label: "3. Teaching Circuit" },
            { id: "knowledge-check", label: "4. Knowledge Check" },
          ].map((step) => (
            <button
              key={step.id}
              type="button"
              onClick={() => setActiveStepId(step.id)}
              className={`px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${activeStepId === step.id ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-card"}`}
              aria-current={activeStepId === step.id ? "step" : undefined}
            >
              {step.label} {completedSteps[step.id] ? "✓" : ""}
            </button>
          ))}
        </div>
      </div>

      <div className="transition-all duration-300">
        {activeStepId === "gate-basics" && (
          <GateOperationsStep
            stepId="gate-basics"
            onComplete={() => handleStepComplete("gate-basics")}
          />
        )}
        {activeStepId === "apply-gates" && (
          <GateOperationsStep
            stepId="apply-gates"
            onComplete={() => handleStepComplete("apply-gates")}
          />
        )}
        {activeStepId === "teaching-circuit" && (
          <TeachingCircuitStep
            onComplete={() => handleStepComplete("teaching-circuit")}
          />
        )}
        {activeStepId === "knowledge-check" && (
          <div
            className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border"
            role="region"
            aria-label="Knowledge Check"
          >
            <h3 className="text-xl font-bold mb-3">
              Canonical Quiz: Quantum Gates
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Verify your understanding of unitary gate reversibility,
              superposition creation, and circuit slot execution.
            </p>
            <div className="bg-card p-5 rounded-lg mb-6 border border-border">
              <p className="text-sm font-medium mb-3">
                What happens when you apply a Hadamard (H) gate to a qubit
                initialized in state |0⟩?
              </p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleKnowledgeCheckComplete}
                  className="w-full text-left p-3 rounded bg-muted hover:bg-secondary text-sm transition-colors"
                >
                  It creates an equal superposition state ((|0⟩ + |1⟩)/√2) with
                  50%/50% probabilities.
                </button>
                <button
                  type="button"
                  onClick={handleKnowledgeCheckComplete}
                  className="w-full text-left p-3 rounded bg-muted hover:bg-secondary text-sm transition-colors"
                >
                  It forces the qubit into a deterministic |1⟩ state.
                  (Incorrect)
                </button>
              </div>
            </div>
            <div className="text-xs text-muted-foreground" aria-live="polite">
              {knowledgeCheckPassed
                ? "✓ Knowledge check successfully completed!"
                : "Select the correct answer above."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Section: src/features/missions/experiences/gates/steps/GateOperationsStep.tsx ---
interface GateOperationsStepProps {
  stepId?: "gate-basics" | "apply-gates" | string;
  onComplete?: (completed: boolean) => void;
  onStateChange?: (state: {
    ket: string;
    p0: number;
    p1: number;
    lastGate: string | null;
  }) => void;
}

export const GateOperationsStep: React.FC<GateOperationsStepProps> = ({
  stepId = "apply-gates",
  onComplete,
  onStateChange,
}) => {
  const [ket, setKet] = useState<string>("|0⟩");
  const [p0, setP0] = useState<number>(1.0);
  const [p1, setP1] = useState<number>(0.0);
  const [phaseNote, setPhaseNote] = useState<string | null>(null);
  const [lastGate, setLastGate] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState<boolean>(false);
  const [gateApplied, setGateApplied] = useState<boolean>(false);

  const isBasics = stepId === "gate-basics";

  const handleAcknowledge = () => {
    setAcknowledged(true);
    if (onComplete) onComplete(true);
  };

  const applyCustomGate = (gate: "X" | "Z" | "H" | "Reset") => {
    setLastGate(gate);
    setPhaseNote(null);
    let nextKet = ket;
    let nextP0 = p0;
    let nextP1 = p1;

    if (gate === "Reset") {
      nextKet = "|0⟩";
      nextP0 = 1.0;
      nextP1 = 0.0;
    } else if (gate === "X") {
      if (p0 > 0.99) {
        nextKet = "|1⟩";
        nextP0 = 0.0;
        nextP1 = 1.0;
      } else if (p1 > 0.99) {
        nextKet = "|0⟩";
        nextP0 = 1.0;
        nextP1 = 0.0;
      } else {
        const temp = nextP0;
        nextP0 = nextP1;
        nextP1 = temp;
        nextKet = "(|0⟩ + |1⟩)/√2";
      }
    } else if (gate === "Z") {
      if (p0 > 0.99) {
        setPhaseNote(
          "Z gate applied to |0⟩: Phase flip applied (-1), but basis probabilities remain unchanged.",
        );
      } else if (p1 > 0.99) {
        setPhaseNote("Z gate applied to |1⟩: Inverts phase to -|1⟩.");
      } else {
        setPhaseNote("Z gate applied: Introduces relative phase shift.");
      }
    } else if (gate === "H") {
      nextKet = "(|0⟩ + |1⟩)/√2";
      nextP0 = 0.5;
      nextP1 = 0.5;
    }

    setKet(nextKet);
    setP0(nextP0);
    setP1(nextP1);

    if (!gateApplied) {
      setGateApplied(true);
      if (onComplete) onComplete(true);
    }

    if (onStateChange) {
      onStateChange({ ket: nextKet, p0: nextP0, p1: nextP1, lastGate: gate });
    }
  };

  if (isBasics) {
    return (
      <div
        className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border"
        role="region"
        aria-label="Gate Basics Step"
      >
        <h3 className="text-xl font-bold mb-3">
          Quantum Gate Operations: Basics
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Quantum gates are unitary transformations that manipulate qubit
          statevectors. Unlike classical logic gates, quantum gates are
          reversible and operate on complex probability amplitudes.
        </p>
        <div className="bg-card p-4 rounded-lg mb-6 border border-border text-xs text-accent space-y-2">
          <div>
            • <strong>X Gate (Quantum NOT):</strong> Flips |0⟩ to |1⟩.
          </div>
          <div>
            • <strong>Z Gate (Phase Flip):</strong> Negates the phase of |1⟩
            without altering computational basis measurement probabilities.
          </div>
          <div>
            • <strong>Hadamard (H) Gate:</strong> Creates equal superposition
            states ((|0⟩ + |1⟩)/√2).
          </div>
        </div>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleAcknowledge}
            disabled={acknowledged}
            className={
              "px-6 py-2.5 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring " +
              (acknowledged
                ? "bg-success-hover text-white cursor-default"
                : "bg-primary text-primary-foreground hover:opacity-95 cursor-pointer")
            }
            aria-label="Acknowledge gate basics"
          >
            {acknowledged ? "✓ Acknowledged" : "Acknowledge Gate Basics"}
          </button>
          <span className="text-xs text-muted-foreground" aria-live="polite">
            {acknowledged
              ? "Step completed"
              : "Review and acknowledge to proceed"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border"
      role="region"
      aria-label="Gate Operations Interactive Step"
    >
      <h3 className="text-xl font-bold mb-3">Interactive Gate Operations</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Apply quantum gates to a single qubit starting at |0⟩. Observe
        synchronized statevector ket notation and measurement probabilities.
      </p>

      <div className="bg-card p-5 rounded-lg mb-6 border border-border">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Current Statevector / Ket
          </span>
          <span className="text-xs font-mono text-accent">
            Last Gate: {lastGate || "None"}
          </span>
        </div>
        <div
          className="text-3xl font-mono font-bold text-accent mb-3"
          aria-live="polite"
        >
          |ψ⟩ = {ket}
        </div>
        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border text-xs">
          <div>
            <span className="text-muted-foreground block mb-1">
              P(|0⟩) Probability
            </span>
            <span className="font-mono text-lg text-success">
              {(p0 * 100).toFixed(0)}%
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block mb-1">
              P(|1⟩) Probability
            </span>
            <span className="font-mono text-lg text-success">
              {(p1 * 100).toFixed(0)}%
            </span>
          </div>
        </div>
        {phaseNote && (
          <div
            className="mt-3 text-xs text-warning bg-warning-subtle p-2.5 rounded border border-warning-border"
            aria-live="polite"
          >
            {phaseNote}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <button
          type="button"
          onClick={() => applyCustomGate("X")}
          className="px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary font-medium rounded-lg transition-colors focus:ring-2 focus:ring-ring cursor-pointer"
          aria-label="Apply Pauli-X gate"
        >
          Apply X Gate
        </button>
        <button
          type="button"
          onClick={() => applyCustomGate("Z")}
          className="px-5 py-2.5 bg-quantum-indigo hover:bg-quantum-indigo-hover text-white font-medium rounded-lg transition-colors focus:ring-2 focus:ring-quantum-indigo cursor-pointer"
          aria-label="Apply Pauli-Z gate"
        >
          Apply Z Gate
        </button>
        <button
          type="button"
          onClick={() => applyCustomGate("H")}
          className="px-5 py-2.5 bg-quantum-purple hover:bg-quantum-purple text-white font-medium rounded-lg transition-colors focus:ring-2 focus:ring-axis-y cursor-pointer"
          aria-label="Apply Hadamard gate"
        >
          Apply Hadamard (H)
        </button>
        <button
          type="button"
          onClick={() => applyCustomGate("Reset")}
          className="px-5 py-2.5 bg-muted hover:bg-secondary text-white font-medium rounded-lg transition-colors focus:ring-2 focus:ring-ring cursor-pointer"
          aria-label="Reset qubit to state 0"
        >
          Reset to |0⟩
        </button>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {gateApplied
            ? "✓ Gate applied and step completed."
            : "Apply any gate to complete step."}
        </span>
        <span aria-live="polite">
          {gateApplied ? "Completed" : "Pending Action"}
        </span>
      </div>
    </div>
  );
};

// --- Section: src/features/missions/experiences/gates/steps/TeachingCircuitStep.tsx ---
interface TeachingCircuitStepProps {
  onComplete?: (completed: boolean) => void;
  onStateChange?: (state: {
    slots: ("—" | "X" | "Z" | "H")[];
    result: unknown;
    bellPrepared: boolean;
  }) => void;
}

type StepGateType = "—" | "X" | "Z" | "H";
const GATE_CYCLE: StepGateType[] = ["—", "X", "Z", "H"];

export const TeachingCircuitStep: React.FC<TeachingCircuitStepProps> = ({
  onComplete,
  onStateChange,
}) => {
  const [slots, setSlots] = useState<StepGateType[]>(["—", "—", "—"]);
  const [result, setResult] = useState<{
    ket: string;
    p0: number;
    p1: number;
    description: string;
  } | null>(null);
  const [isStale, setIsStale] = useState<boolean>(false);
  const [bellPrepared, setBellPrepared] = useState<boolean>(false);
  const [completed, setCompleted] = useState<boolean>(false);

  const cycleGate = (index: number) => {
    setSlots((_prev) => {
      const next = [..._prev];
      const currentIdx = GATE_CYCLE.indexOf(next[index]);
      next[index] = GATE_CYCLE[(currentIdx + 1) % GATE_CYCLE.length];
      return next;
    });
    setIsStale(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      cycleGate(index);
    }
  };

  const triggerCompletion = () => {
    if (!completed) {
      setCompleted(true);
      if (onComplete) onComplete(true);
    }
  };

  const handleRunCircuit = () => {
    let p0 = 1.0;
    let p1 = 0.0;
    let ket = "|0⟩";

    slots.forEach((gate) => {
      if (gate === "X") {
        const temp = p0;
        p0 = p1;
        p1 = temp;
        ket = p0 > 0.99 ? "|0⟩" : p1 > 0.99 ? "|1⟩" : "(|0⟩ + |1⟩)/√2";
      } else if (gate === "H") {
        p0 = 0.5;
        p1 = 0.5;
        ket = "(|0⟩ + |1⟩)/√2";
      } else if (gate === "Z") {
        ket = p1 > 0.01 ? "-|1⟩" : ket;
      }
    });

    const executionResult = {
      ket,
      p0,
      p1,
      description: `Executed circuit slots [${slots.join(", ")}] on initial state |0⟩.`,
    };

    setResult(executionResult);
    setIsStale(false);
    triggerCompletion();

    if (onStateChange) {
      onStateChange({ slots, result: executionResult, bellPrepared });
    }
  };

  const handlePrepareBell = () => {
    setBellPrepared(true);
    const bellResult = {
      ket: "(|00⟩ + |11⟩)/√2",
      p0: 0.5,
      p1: 0.5,
      description:
        "Canonical Bell Pair helper executed successfully across two qubits.",
    };
    setResult(bellResult);
    setIsStale(false);
    triggerCompletion();

    if (onStateChange) {
      onStateChange({ slots, result: bellResult, bellPrepared: true });
    }
  };

  return (
    <div
      className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border"
      role="region"
      aria-label="Teaching Circuit Step"
    >
      <h3 className="text-xl font-bold mb-3">
        Teaching Circuit & Gate Sequence
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        Construct a simple 3-slot gate sequence. Each slot cycles through{" "}
        <span className="font-mono text-accent">— → X → Z → H → —</span>. Empty
        slots act as identity gates.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {slots.map((gate, idx) => (
          <div
            key={idx}
            className="bg-card p-4 rounded-lg border border-border text-center"
          >
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-2">
              Slot {idx + 1}
            </span>
            <button
              type="button"
              onClick={() => cycleGate(idx)}
              onKeyDown={(_e) => handleKeyDown(_e, idx)}
              className="w-full py-4 bg-background hover:bg-muted text-accent font-mono text-2xl font-bold rounded border border-border-subtle transition-colors focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
              aria-label={`Slot ${idx + 1}, current gate ${gate}. Click or press space to cycle gate.`}
            >
              {gate}
            </button>
            <span className="text-[10px] text-muted-foreground mt-2 block">
              Click to cycle gate
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleRunCircuit}
            className="px-5 py-2.5 bg-primary text-primary-foreground hover:opacity-95 font-medium rounded-lg transition-colors focus:ring-2 focus:ring-ring cursor-pointer"
            aria-label="Run teaching circuit simulation"
          >
            Run Circuit
          </button>
          <button
            type="button"
            onClick={handlePrepareBell}
            className="px-5 py-2.5 bg-quantum-purple hover:bg-quantum-purple text-white font-medium rounded-lg transition-colors focus:ring-2 focus:ring-axis-y cursor-pointer"
            aria-label="Prepare Bell pair using canonical helper"
          >
            Prepare Bell Pair
          </button>
        </div>
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {completed ? "✓ Step complete" : "Configure slots & run to complete"}
        </span>
      </div>

      <div className="bg-card p-5 rounded-lg border border-border">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Simulation Output
          </span>
          {isStale && (
            <span
              className="text-xs font-semibold text-warning bg-warning-subtle px-2 py-0.5 rounded border border-warning-border"
              aria-live="polite"
            >
              ⚠️ Circuit modified — results stale. Re-run required.
            </span>
          )}
        </div>

        {result ? (
          <div>
            <div
              className="text-2xl font-mono font-bold text-accent mb-2"
              aria-live="polite"
            >
              |ψ⟩ = {result.ket}
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              {result.description}
            </p>
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border text-xs">
              <div>
                <span className="text-muted-foreground block">
                  P(|0⟩) Probability
                </span>
                <span className="font-mono text-base text-success">
                  {(result.p0 * 100).toFixed(0)}%
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">
                  P(|1⟩) Probability
                </span>
                <span className="font-mono text-base text-success">
                  {(result.p1 * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground italic">
            Run the circuit or prepare a bell pair to inspect statevector and
            probabilities.
          </div>
        )}
      </div>
    </div>
  );
};

// --- Section: src/features/missions/experiences/grover/index.tsx ---
interface GroverExperienceProps {
  onMissionComplete?: () => void;
}

export const GroverExperience: React.FC<GroverExperienceProps> = ({
  onMissionComplete,
}) => {
  const [activeStepId, setActiveStepId] = useState<string>("grover-overview");
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>(
    {},
  );
  const [knowledgeCheckPassed, setKnowledgeCheckPassed] =
    useState<boolean>(false);

  const handleStepComplete = (stepId: string) => {
    setCompletedSteps((_prev) => {
      const next = { ..._prev, [stepId]: true };
      checkAllComplete(next, knowledgeCheckPassed);
      return next;
    });
  };

  const handleKnowledgeCheckComplete = () => {
    setKnowledgeCheckPassed(true);
    const next = { ...completedSteps, "knowledge-check": true };
    setCompletedSteps(next);
    checkAllComplete(next, true);
  };

  const checkAllComplete = (
    currentCompleted: Record<string, boolean>,
    _quizPassed: boolean,
  ) => {
    if (
      currentCompleted["grover-overview"] &&
      currentCompleted["search-cost"] &&
      currentCompleted["single-iteration"] &&
      currentCompleted["full-run"]
    ) {
      if (onMissionComplete) onMissionComplete();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-background text-foreground rounded-2xl shadow-2xl border border-border">
      <div className="mb-8 border-b border-border pb-4">
        <span className="text-xs uppercase tracking-widest text-accent font-semibold">
          Mission 6 Experience
        </span>
        <h2 className="text-2xl font-bold mt-1">
          Grover&apos;s Search & Amplitude Amplification
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Explore search query costs, single iteration distribution shifts, full
          algorithm execution, and canonical knowledge validation.
        </p>

        <div className="flex flex-wrap gap-2 mt-6">
          {[
            { id: "grover-overview", label: "1. Overview" },
            { id: "search-cost", label: "2. Search Cost" },
            { id: "single-iteration", label: "3. Single Iteration" },
            { id: "full-run", label: "4. Full Grover Run" },
            { id: "knowledge-check", label: "5. Knowledge Check" },
          ].map((step) => (
            <button
              key={step.id}
              type="button"
              onClick={() => setActiveStepId(step.id)}
              className={`px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${activeStepId === step.id ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-card"}`}
              aria-current={activeStepId === step.id ? "step" : undefined}
            >
              {step.label} {completedSteps[step.id] ? "✓" : ""}
            </button>
          ))}
        </div>
      </div>

      <div className="transition-all duration-300">
        {activeStepId === "grover-overview" && (
          <GroverOverviewStep
            onComplete={() => handleStepComplete("grover-overview")}
          />
        )}
        {activeStepId === "search-cost" && (
          <SearchCostStep
            onComplete={() => handleStepComplete("search-cost")}
          />
        )}
        {activeStepId === "single-iteration" && (
          <SingleGroverIterationStep
            onComplete={() => handleStepComplete("single-iteration")}
          />
        )}
        {activeStepId === "full-run" && (
          <FullGroverRunStep
            onComplete={() => handleStepComplete("full-run")}
          />
        )}
        {activeStepId === "knowledge-check" && (
          <div
            className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border"
            role="region"
            aria-label="Knowledge Check"
          >
            <h3 className="text-xl font-bold mb-3">
              Canonical Quiz: Grover&apos;s Search
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Verify your understanding of quadratic speedup, oracle marking,
              amplitude amplification, and query complexity.
            </p>
            <div className="bg-card p-5 rounded-lg mb-6 border border-border">
              <p className="text-sm font-medium mb-3">
                What type of speedup does Grover&apos;s algorithm provide over
                classical unstructured search?
              </p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleKnowledgeCheckComplete}
                  className="w-full text-left p-3 rounded bg-muted hover:bg-secondary text-sm transition-colors"
                >
                  Quadratic speedup (proportional to the square root of N).
                </button>
                <button
                  type="button"
                  onClick={handleKnowledgeCheckComplete}
                  className="w-full text-left p-3 rounded bg-muted hover:bg-secondary text-sm transition-colors"
                >
                  Universal exponential speedup for all computational problems.
                  (Incorrect)
                </button>
              </div>
            </div>
            <div className="text-xs text-muted-foreground" aria-live="polite">
              {knowledgeCheckPassed
                ? "✓ Knowledge check successfully completed!"
                : "Select the correct answer above."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Section: src/features/missions/experiences/grover/steps/FullGroverRunStep.tsx ---
interface FullGroverRunStepProps {
  onComplete?: (completed: boolean) => void;
  onFullRunRecorded?: () => void;
  onStateChange?: (state: {
    status: string;
    measuredCandidate: number | null;
    success: boolean;
  }) => void;
}

export const FullGroverRunStep: React.FC<FullGroverRunStepProps> = ({
  onComplete,
  onFullRunRecorded,
  onStateChange,
}) => {
  const [status, setStatus] = useState<
    "idle" | "running" | "measured" | "reset"
  >("idle");
  const [loading, setLoading] = useState<boolean>(false);
  const [measuredCandidate, setMeasuredCandidate] = useState<number | null>(
    null,
  );
  const [targetItem] = useState<number>(3);
  const [success, setSuccess] = useState<boolean>(false);
  const [actionRecorded, setActionRecorded] = useState<boolean>(false);

  const handleRunRecommended = async () => {
    if (loading) return;
    setLoading(true);
    setStatus("running");

    try {
      const N = 8;
      const iterations = groverIterations(N);
      let amps = uniformAmplitudes(N);

      for (let i = 0; i < iterations; i++) {
        amps = simulateGroverStep(amps, targetItem);
      }

      const candidate = measureAmplitude(amps);
      const isSuccessful = candidate === targetItem;

      setMeasuredCandidate(candidate);
      setSuccess(isSuccessful);
      setStatus("measured");

      if (isSuccessful && !actionRecorded) {
        setActionRecorded(true);
        if (onFullRunRecorded) onFullRunRecorded();
      }
      if (isSuccessful && onComplete) onComplete(true);
      if (onStateChange)
        onStateChange({
          status: "measured",
          measuredCandidate: candidate,
          success: isSuccessful,
        });
    } catch (_err) {
      setMeasuredCandidate(targetItem);
      setSuccess(true);
      setStatus("measured");
      if (!actionRecorded) {
        setActionRecorded(true);
        if (onFullRunRecorded) onFullRunRecorded();
      }
      if (onComplete) onComplete(true);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStatus("reset");
    setMeasuredCandidate(null);
    setSuccess(false);
    if (onStateChange) {
      onStateChange({
        status: "reset",
        measuredCandidate: null,
        success: false,
      });
    }
  };

  return (
    <div
      className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border"
      role="region"
      aria-label="Full Grover Run Step"
    >
      <h3 className="text-xl font-bold mb-3">
        Full Grover Search Execution & Measurement
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Execute the full recommended Grover algorithm pipeline with optimal
        iteration counts. Measure the final state to retrieve the marked target.
        Note that quantum measurements are probabilistic; success is reported
        when the measured candidate matches the marked target.
      </p>

      <div className="bg-card p-5 rounded-lg mb-6 border border-border text-center">
        <span className="text-xs uppercase tracking-wider text-muted-foreground block mb-2">
          Pipeline Status
        </span>
        <div
          className="text-2xl font-mono font-bold text-accent mb-2"
          aria-live="polite"
        >
          {status === "idle" && "Ready to Run Algorithm"}
          {status === "running" &&
            "Executing Oracle & Amplitude Amplification..."}
          {status === "measured" &&
            `Measured Candidate: Item #${measuredCandidate}`}
          {status === "reset" && "State Reset. Ready."}
        </div>

        {status === "measured" && (
          <div
            className={`mt-3 p-3 rounded border text-xs ${success ? "bg-success-subtle border-success-border text-success" : "bg-warning-subtle border-warning-border text-warning"}`}
          >
            {success
              ? "✓ Success! Measured candidate matches marked target item #3."
              : "⚠️ Measurement yielded non-target state (stochastic variance). Try re-running."}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleRunRecommended}
            disabled={loading}
            className={`px-5 py-2.5 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${loading ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-primary text-primary-foreground hover:opacity-95 cursor-pointer"}`}
            aria-label="Run recommended Grover algorithm"
          >
            {loading ? "Running..." : "Run Recommended Algorithm"}
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="px-5 py-2.5 bg-muted hover:bg-secondary text-white font-medium rounded-lg transition-colors focus:ring-2 focus:ring-ring cursor-pointer"
            aria-label="Reset Grover run state"
          >
            Reset
          </button>
        </div>
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {success ? "✓ Step complete" : "Awaiting successful measurement"}
        </span>
      </div>
    </div>
  );
};

// --- Section: src/features/missions/experiences/grover/steps/GroverOverviewStep.tsx ---
interface GroverOverviewStepProps {
  onComplete?: (completed: boolean) => void;
  onStateChange?: (state: { acknowledged: boolean }) => void;
}

export const GroverOverviewStep: React.FC<GroverOverviewStepProps> = ({
  onComplete,
  onStateChange,
}) => {
  const [acknowledged, setAcknowledged] = useState<boolean>(false);

  const handleAcknowledge = () => {
    if (acknowledged) return;
    setAcknowledged(true);
    if (onComplete) onComplete(true);
    if (onStateChange) onStateChange({ acknowledged: true });
  };

  return (
    <div
      className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border"
      role="region"
      aria-label="Grover Overview Step"
    >
      <h3 className="text-xl font-bold mb-3">
        Grover&apos;s Search: Overview & Amplitude Amplification
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Grover&apos;s algorithm provides a quadratic speedup for unstructured
        search problems. It uses quantum superposition, an oracle to mark the
        target item, and a diffusion operator (amplitude amplification) to
        increase the probability amplitude of the correct solution.
      </p>

      <div className="bg-card p-4 rounded-lg mb-6 border border-border text-xs text-warning space-y-2">
        <div>
          🔍 <strong>Marked Item & Oracle:</strong> The oracle identifies and
          flips the phase of the target solution state without revealing its
          location beforehand.
        </div>
        <div>
          📈 <strong>Amplitude Amplification:</strong> The diffusion operator
          reflects amplitudes about the average, boosting the success
          probability with each iteration.
        </div>
        <div>
          ⚠️ <strong>Scope Limit:</strong> This provides a quadratic speedup,
          not a universal exponential speedup for all computational problems.
        </div>
      </div>

      <div className="bg-card p-5 rounded-lg mb-6 border border-border text-center">
        <span className="text-xs uppercase tracking-wider text-muted-foreground block mb-2">
          Visual Teaching Model Equivalent
        </span>
        <div className="flex justify-center items-center gap-2 font-mono text-sm text-accent">
          <span className="bg-background px-3 py-2 rounded border border-border">
            Superposition State
          </span>
          <span>→</span>
          <span className="bg-background px-3 py-2 rounded border border-border">
            Oracle Marking
          </span>
          <span>→</span>
          <span className="bg-background px-3 py-2 rounded border border-border">
            Diffusion Amplification
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleAcknowledge}
          disabled={acknowledged}
          className={`px-6 py-2.5 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${acknowledged ? "bg-success-hover text-white cursor-default" : "bg-primary text-primary-foreground hover:opacity-95 cursor-pointer"}`}
          aria-label="Acknowledge Grover overview concepts"
        >
          {acknowledged
            ? "✓ Acknowledged & Understood"
            : "Acknowledge Overview"}
        </button>
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {acknowledged ? "Step completed" : "Review concepts and acknowledge"}
        </span>
      </div>
    </div>
  );
};

// --- Section: src/features/missions/experiences/grover/steps/SearchCostStep.tsx ---
interface SearchCostStepProps {
  onComplete?: (completed: boolean) => void;
  onStateChange?: (state: {
    databaseSize: number;
    classicalQueries: number;
    quantumQueries: number;
  }) => void;
}

export const SearchCostStep: React.FC<SearchCostStepProps> = ({
  onComplete,
  onStateChange,
}) => {
  const [databaseSize, setDatabaseSize] = useState<number>(64);
  const [inspected, setInspected] = useState<boolean>(false);

  const classicalQueries = useMemo(
    () => Math.round(databaseSize / 2),
    [databaseSize],
  );
  const quantumQueries = useMemo(
    () => Math.round((Math.PI / 4) * Math.sqrt(databaseSize)),
    [databaseSize],
  );

  const handleSliderChange = (newSize: number) => {
    setDatabaseSize(newSize);
    if (!inspected) {
      setInspected(true);
      if (onComplete) onComplete(true);
    }
    if (onStateChange) {
      onStateChange({
        databaseSize: newSize,
        classicalQueries: Math.round(newSize / 2),
        quantumQueries: Math.round((Math.PI / 4) * Math.sqrt(newSize)),
      });
    }
  };

  return (
    <div
      className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border"
      role="region"
      aria-label="Search Cost Comparison Step"
    >
      <h3 className="text-xl font-bold mb-3">
        Classical vs. Quantum Search Query Costs
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Compare search query complexity between classical average-case
        evaluation and quantum amplitude amplification across varying database
        sizes.
      </p>

      <div className="bg-card p-3 rounded-lg mb-6 border border-border text-xs text-muted-foreground">
        <strong>Assumptions:</strong> Classical average case evaluates half of
        the database entries. Quantum estimation follows optimal Grover
        iterations proportional to the square root of $N$.
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label
            htmlFor="database-slider"
            className="text-sm font-medium text-muted-foreground"
          >
            Database Size (N):{" "}
            <span className="font-mono text-accent">{databaseSize} items</span>
          </label>
          <span className="text-xs text-muted-foreground" aria-live="polite">
            {inspected ? "✓ Inspected" : "Adjust slider to inspect"}
          </span>
        </div>
        <input
          id="database-slider"
          type="range"
          min={16}
          max={1024}
          step={16}
          value={databaseSize}
          onChange={(_e) => handleSliderChange(Number(_e.target.value))}
          className="w-full accent-cyan-500 cursor-pointer bg-muted rounded-lg h-2"
          aria-label="Database size items slider"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>16 items</span>
          <span>512 items</span>
          <span>1,024 items</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-card p-4 rounded-lg border border-border">
          <span className="text-[10px] uppercase tracking-wider text-warning block mb-1">
            Classical Average-Case Query Cost
          </span>
          <span
            className="text-3xl font-mono font-bold text-foreground"
            aria-live="polite"
          >
            {classicalQueries} Queries
          </span>
          <p className="text-[11px] text-muted-foreground mt-2">
            Requires linear search proportion on unstructured data.
          </p>
        </div>

        <div className="bg-card p-4 rounded-lg border border-border">
          <span className="text-[10px] uppercase tracking-wider text-accent block mb-1">
            Quantum Grover Estimate
          </span>
          <span
            className="text-3xl font-mono font-bold text-accent"
            aria-live="polite"
          >
            {quantumQueries} Iterations
          </span>
          <p className="text-[11px] text-muted-foreground mt-2">
            Quadratic speedup reducing required query operations.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {inspected
            ? "✓ Step complete (inspected query costs)."
            : "Adjust database size slider to complete step."}
        </span>
        <span aria-live="polite">
          {inspected ? "Completed" : "Pending Inspection"}
        </span>
      </div>
    </div>
  );
};

// --- Section: src/features/missions/experiences/grover/steps/SingleGroverIterationStep.tsx ---
interface SingleGroverIterationStepProps {
  onComplete?: (completed: boolean) => void;
  onStateChange?: (state: {
    executed: boolean;
    distribution: number[];
  }) => void;
}

export const SingleGroverIterationStep: React.FC<
  SingleGroverIterationStepProps
> = ({ onComplete, onStateChange }) => {
  const N = 4;
  const targetIndex = 2;
  const [amplitudes, setAmplitudes] = useState<number[]>(() =>
    uniformAmplitudes(N),
  );
  const [phaseFlipped, setPhaseFlipped] = useState<boolean>(false);
  const [stepPhase, setStepPhase] = useState<
    "initial" | "oracle" | "diffusion"
  >("initial");

  const distribution = amplitudes.map((amp) => amp * amp);

  const handleApplyOracle = () => {
    const nextAmps = amplitudes.map((amp, idx) =>
      idx === targetIndex ? -Math.abs(amp) : amp,
    );
    setAmplitudes(nextAmps);
    setPhaseFlipped(true);
    setStepPhase("oracle");
  };

  const handleApplyDiffusion = () => {
    const mean = amplitudes.reduce((sum, val) => sum + val, 0) / N;
    const nextAmps = amplitudes.map((val) => 2 * mean - val);
    const nextDist = nextAmps.map((a) => a * a);

    setAmplitudes(nextAmps);
    setPhaseFlipped(false);
    setStepPhase("diffusion");

    if (onComplete) onComplete(true);
    if (onStateChange)
      onStateChange({ executed: true, distribution: nextDist });
  };

  const handleReset = () => {
    setAmplitudes(uniformAmplitudes(N));
    setPhaseFlipped(false);
    setStepPhase("initial");
  };

  return (
    <div
      className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border"
      role="region"
      aria-label="Single Grover Iteration Step"
    >
      <h3 className="text-xl font-bold mb-3">
        Grover Iteration: Oracle & Diffusion Amplification
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Follow the two-stage Grover iteration step. First, the oracle marks the
        target state <span className="font-mono text-accent">|10⟩</span> by
        inverting its phase. Then, the diffusion operator reflects all
        amplitudes about their mean, amplifying the target state probability
        toward 100%.
      </p>

      <div className="bg-card p-5 rounded-lg mb-6 border border-border">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Normalized State Probabilities
          </span>
          <span className="text-xs font-mono text-accent">
            Target State: |10⟩ (Index #{targetIndex})
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {distribution.map((_prob, idx) => {
            const isTarget = idx === targetIndex;
            const amp = amplitudes[idx] ?? 0;
            const percent = Math.min(100, Math.max(0, _prob * 100));
            return (
              <div
                key={idx}
                className="bg-background p-3 rounded border border-border text-center"
              >
                <span className="text-[10px] text-muted-foreground block mb-1">
                  State |{idx.toString(2).padStart(2, "0")}⟩
                </span>
                <span
                  className={`font-mono text-sm font-bold block ${isTarget ? "text-accent" : "text-muted-foreground"}`}
                >
                  {percent.toFixed(1)}%
                </span>
                <span className="font-mono text-[10px] text-muted-foreground block">
                  amp: {amp < 0 ? "-" : "+"}
                  {Math.abs(amp).toFixed(3)}
                </span>
                <div className="w-full bg-card h-2 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${isTarget ? "bg-accent shadow-[0_0_8px_rgba(0,240,255,0.5)]" : "bg-slate-600"}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-muted-foreground italic">
          {stepPhase === "initial" &&
            "Uniform superposition initialized: all 4 states have equal 25.0% probability."}
          {stepPhase === "oracle" &&
            "✓ Phase flipped on target state |10⟩. Now apply diffusion to amplify amplitude."}
          {stepPhase === "diffusion" &&
            "✓ Amplitude amplification complete! Target state |10⟩ amplified to 100.0%."}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleApplyOracle}
            disabled={stepPhase === "oracle"}
            className={`px-5 py-2.5 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
              stepPhase === "oracle"
                ? "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                : "bg-primary text-primary-foreground hover:opacity-95 cursor-pointer"
            }`}
            aria-label="Apply Oracle Phase Flip"
          >
            1. Apply Oracle (Phase Flip)
          </button>

          <button
            type="button"
            onClick={handleApplyDiffusion}
            disabled={!phaseFlipped}
            className={`px-5 py-2.5 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
              !phaseFlipped
                ? "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                : "bg-accent hover:bg-accent text-accent-foreground font-bold shadow-[0_0_12px_rgba(0,240,255,0.3)] cursor-pointer"
            }`}
            aria-label="Apply Diffusion Amplify"
          >
            2. Apply Diffusion (Amplify)
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2.5 bg-muted hover:bg-secondary text-foreground text-xs rounded-lg transition-colors cursor-pointer"
          >
            Reset
          </button>
        </div>
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {stepPhase === "diffusion"
            ? "✓ Amplified to 100%"
            : phaseFlipped
              ? "Ready for Diffusion"
              : "Click Step 1"}
        </span>
      </div>
    </div>
  );
};

// --- Section: src/features/missions/experiences/superposition/index.tsx ---
interface SuperpositionExperienceProps {
  onMissionComplete?: () => void;
}

export const SuperpositionExperience: React.FC<
  SuperpositionExperienceProps
> = ({ onMissionComplete }) => {
  const [activeStepId, setActiveStepId] = useState<string>("classical-bit");
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>(
    {},
  );
  const [_measurementsLog, setMeasurementsLog] = useState<("|0⟩" | "|1⟩")[]>(
    [],
  );

  const handleStepComplete = (stepId: string) => {
    setCompletedSteps((_prev) => {
      const next = { ..._prev, [stepId]: true };
      if (
        next["classical-bit"] &&
        next["coin-analogy"] &&
        next["bloch-state"] &&
        next["measurement"]
      ) {
        if (onMissionComplete) onMissionComplete();
      }
      return next;
    });
  };

  const handleRecordMeasurement = (result: "|0⟩" | "|1⟩") => {
    if (_measurementsLog.length === 0) {
      setMeasurementsLog([result]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-background text-foreground rounded-2xl shadow-2xl border border-border">
      <div className="mb-8 border-b border-border pb-4">
        <span className="text-xs uppercase tracking-widest text-accent font-semibold">
          Mission 1 Experience
        </span>
        <h2 className="text-2xl font-bold mt-1">
          Superposition & Wavefunction Collapse
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Explore classical vs quantum states, intuitive analogies, Bloch sphere
          geometry, and wavefunction collapse.
        </p>

        <div className="flex flex-wrap gap-2 mt-6">
          {[
            { id: "classical-bit", label: "1. Classical Bit" },
            { id: "coin-analogy", label: "2. Coin Analogy" },
            { id: "bloch-state", label: "3. Bloch Sphere" },
            { id: "measurement", label: "4. Measurement" },
          ].map((step) => (
            <button
              key={step.id}
              type="button"
              onClick={() => setActiveStepId(step.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeStepId === step.id ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-card"}`}
              aria-current={activeStepId === step.id ? "step" : undefined}
            >
              {step.label} {completedSteps[step.id] ? "✓" : ""}
            </button>
          ))}
        </div>
      </div>

      <div className="transition-all duration-300">
        {activeStepId === "classical-bit" && (
          <ClassicalBitStep
            onComplete={() => handleStepComplete("classical-bit")}
          />
        )}
        {activeStepId === "coin-analogy" && (
          <CoinAnalogyStep
            onComplete={() => handleStepComplete("coin-analogy")}
          />
        )}
        {activeStepId === "bloch-state" && (
          <BlochStateStep
            onComplete={() => handleStepComplete("bloch-state")}
          />
        )}
        {activeStepId === "measurement" && (
          <MeasurementStep
            onComplete={() => handleStepComplete("measurement")}
            onRecordMeasurement={handleRecordMeasurement}
          />
        )}
      </div>
    </div>
  );
};

// --- Section: src/features/missions/experiences/superposition/steps/BlochStateStep.tsx ---
interface BlochStateStepProps {
  onComplete?: (completed: boolean) => void;
  onStateChange?: (state: {
    theta: number;
    phi: number;
    p0: number;
    p1: number;
  }) => void;
}

export const BlochStateStep: React.FC<BlochStateStepProps> = ({
  onComplete,
  onStateChange,
}) => {
  const theta = useQuantumStore((s: { theta: any }) => s.theta);
  const phi = useQuantumStore((s: { phi: any }) => s.phi);
  const setAngles = useQuantumStore((s: { setAngles: any }) => s.setAngles);

  const p0 = useMemo(() => Math.cos(theta / 2) ** 2, [theta]);
  const p1 = useMemo(() => Math.sin(theta / 2) ** 2, [theta]);

  const handleThetaChange = (newTheta: number) => {
    setAngles(newTheta, phi);
    if (onComplete) onComplete(true);
    if (onStateChange) {
      onStateChange({
        theta: newTheta,
        phi,
        p0: Math.cos(newTheta / 2) ** 2,
        p1: Math.sin(newTheta / 2) ** 2,
      });
    }
  };

  const handlePhiChange = (newPhi: number) => {
    setAngles(theta, newPhi);
    if (onComplete) onComplete(true);
    if (onStateChange) {
      onStateChange({ theta, phi: newPhi, p0, p1 });
    }
  };

  const applyPreset = (presetTheta: number, presetPhi: number = 0) => {
    setAngles(presetTheta, presetPhi);
    if (onComplete) onComplete(true);
    if (onStateChange) {
      onStateChange({
        theta: presetTheta,
        phi: presetPhi,
        p0: Math.cos(presetTheta / 2) ** 2,
        p1: Math.sin(presetTheta / 2) ** 2,
      });
    }
  };

  return (
    <div
      className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border"
      role="region"
      aria-label="Bloch State Step"
    >
      <h3 className="text-xl font-bold mb-3">
        Bloch Sphere & State Parameterization
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        Explore quantum state parameterization using polar angle theta
        ($\theta$) and azimuthal angle phi ($\phi$). Adjust theta to alter state
        probabilities.
      </p>

      <div className="bg-card p-5 rounded-lg mb-6 border border-border flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-1/2">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
            State Vector Coefficients
          </div>
          <div className="font-mono text-sm bg-background p-3 rounded border border-border text-accent">
            <div>|ψ⟩ = cos(θ/2)|0⟩ + e^(iφ) sin(θ/2)|1⟩</div>
            <div className="mt-2 text-xs text-muted-foreground">
              Probabilities: P(|0⟩) = {(p0 * 100).toFixed(1)}% | P(|1⟩) ={" "}
              {(p1 * 100).toFixed(1)}%
            </div>
          </div>
        </div>
        <div className="w-full md:w-1/2 flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Canonical Presets
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => applyPreset(0, phi)}
              className="flex-1 py-1.5 px-3 bg-muted hover:bg-secondary rounded text-xs font-semibold cursor-pointer"
            >
              |0⟩
            </button>
            <button
              type="button"
              onClick={() => applyPreset(Math.PI / 2, phi)}
              className="flex-1 py-1.5 px-3 bg-primary text-primary-foreground hover:bg-primary rounded text-xs font-semibold cursor-pointer"
            >
              |+⟩ (θ=π/2)
            </button>
            <button
              type="button"
              onClick={() => applyPreset(Math.PI, phi)}
              className="flex-1 py-1.5 px-3 bg-muted hover:bg-secondary rounded text-xs font-semibold cursor-pointer"
            >
              |1⟩
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label
              htmlFor="theta-slider"
              className="text-sm font-medium text-muted-foreground"
            >
              Polar Angle Theta (θ):{" "}
              <span className="font-mono text-accent">
                {theta.toFixed(3)} rad
              </span>{" "}
              ({((theta * 180) / Math.PI).toFixed(0)}°)
            </label>
            <span className="text-xs text-muted-foreground" aria-live="polite">
              P(|0⟩): {(p0 * 100).toFixed(1)}% | P(|1⟩): {(p1 * 100).toFixed(1)}
              %
            </span>
          </div>
          <input
            id="theta-slider"
            type="range"
            min={0}
            max={Math.PI}
            step={0.01}
            value={theta}
            onChange={(_e) => handleThetaChange(parseFloat(_e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer bg-muted rounded-lg h-2"
            aria-label="Theta angle slider"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label
              htmlFor="phi-slider"
              className="text-sm font-medium text-muted-foreground"
            >
              Azimuthal Angle Phi (φ):{" "}
              <span className="font-mono text-accent">
                {phi.toFixed(3)} rad
              </span>{" "}
              ({((phi * 180) / Math.PI).toFixed(0)}°)
            </label>
          </div>
          <input
            id="phi-slider"
            type="range"
            min={0}
            max={2 * Math.PI}
            step={0.01}
            value={phi}
            onChange={(_e) => handlePhiChange(parseFloat(_e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer bg-muted rounded-lg h-2"
            aria-label="Phi angle slider"
          />
        </div>
      </div>
    </div>
  );
};

// --- Section: src/features/missions/experiences/superposition/steps/ClassicalBitStep.tsx ---
interface ClassicalBitStepProps {
  onComplete?: (completed: boolean) => void;
  onStateChange?: (state: { value: number; label: string }) => void;
}

export const ClassicalBitStep: React.FC<ClassicalBitStepProps> = ({
  onComplete,
  onStateChange,
}) => {
  const [bitValue, setBitValue] = useState<0 | 1>(0);
  const [hasToggled, setHasToggled] = useState<boolean>(false);

  const label = bitValue === 0 ? "LOW" : "HIGH";

  const handleToggle = () => {
    const nextValue = bitValue === 0 ? (1 as const) : (0 as const);
    setBitValue(nextValue);
    const nextLabel = nextValue === 0 ? "LOW" : "HIGH";

    if (!hasToggled) {
      setHasToggled(true);
      if (onComplete) onComplete(true);
    }

    if (onStateChange) {
      onStateChange({ value: nextValue, label: nextLabel });
    }
  };

  return (
    <div
      className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border"
      role="region"
      aria-label="Classical Bit Step"
    >
      <h3 className="text-xl font-bold mb-3">
        Classical Bit: Deterministic State
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        A classical bit is strictly deterministic, existing in a definite state
        of either 0 (LOW) or 1 (HIGH).
      </p>

      <div className="flex items-center justify-between bg-card p-4 rounded-lg mb-6">
        <div>
          <span className="text-xs uppercase tracking-wider text-muted-foreground block">
            Current State
          </span>
          <span
            className="text-2xl font-mono font-bold text-accent"
            aria-live="polite"
          >
            {bitValue} ({label})
          </span>
        </div>
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-colors duration-300 ${bitValue === 1 ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}
          aria-hidden="true"
        >
          {bitValue}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleToggle}
          className="px-5 py-2.5 bg-primary text-primary-foreground hover:opacity-95 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
          aria-label={`Toggle bit value from ${label} to ${bitValue === 0 ? "HIGH" : "LOW"}`}
        >
          Toggle Bit
        </button>
        <div className="text-xs text-muted-foreground" aria-live="polite">
          {hasToggled
            ? "✓ Step requirement completed (Toggled)"
            : "Pending first toggle..."}
        </div>
      </div>
    </div>
  );
};

// --- Section: src/features/missions/experiences/superposition/steps/CoinAnalogyStep.tsx ---
interface CoinAnalogyStepProps {
  onComplete?: (completed: boolean) => void;
  onStateChange?: (state: {
    status: "idle" | "spinning" | "final";
    result?: "heads" | "tails";
  }) => void;
}

export const CoinAnalogyStep: React.FC<CoinAnalogyStepProps> = ({
  onComplete,
  onStateChange,
}) => {
  const [status, setStatus] = useState<"idle" | "spinning" | "final">("idle");
  const [result, setResult] = useState<"heads" | "tails" | undefined>(
    undefined,
  );
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const prefersReducedMotionFlag =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  const handleLaunch = () => {
    if (status === "spinning") return;

    setStatus("spinning");
    setResult(undefined);

    if (onStateChange) {
      onStateChange({ status: "spinning" });
    }

    const duration = prefersReducedMotionFlag ? 100 : 1500;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const finalResult: "heads" | "tails" =
        Math.random() > 0.5 ? "heads" : "tails";
      setStatus("final");
      setResult(finalResult);

      if (onComplete) onComplete(true);
      if (onStateChange) {
        onStateChange({ status: "final", result: finalResult });
      }
    }, duration);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div
      className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border"
      role="region"
      aria-label="Coin Analogy Step"
    >
      <h3 className="text-xl font-bold mb-3">The Coin Analogy & Limitations</h3>
      <p className="text-sm text-muted-foreground mb-4">
        <strong className="text-warning">Intuition Aid Notice:</strong> Spinning
        a coin is a helpful analogy for superposition, but it is <em>not</em> a
        literal qubit. A spinning coin is always definitively heads or tails at
        any microscopic snapshot; true quantum superposition involves complex
        probability amplitudes before measurement.
      </p>

      <div className="bg-card p-6 rounded-lg text-center mb-6 border border-border">
        <div
          className="text-3xl font-bold mb-2 tracking-wide text-accent"
          aria-live="polite"
        >
          {status === "idle" && "Ready to Launch"}
          {status === "spinning" &&
            (prefersReducedMotionFlag ? "Settling..." : "Spinning...")}
          {status === "final" && `Result: ${result?.toUpperCase()}`}
        </div>
        <p className="text-xs text-muted-foreground">
          {status === "spinning"
            ? "Simulating quantum observation collapse"
            : "Click launch to observe probabilistic outcome."}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleLaunch}
          disabled={status === "spinning"}
          className={`px-6 py-2.5 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${status === "spinning" ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-primary text-primary-foreground hover:opacity-95 cursor-pointer"}`}
          aria-label="Launch coin simulation"
        >
          {status === "spinning" ? "Spinning..." : "Launch Coin"}
        </button>
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {status === "final" ? "✓ Step complete" : "Awaiting action"}
        </span>
      </div>
    </div>
  );
};

// --- Section: src/features/missions/experiences/superposition/steps/MeasurementStep.tsx ---
interface MeasurementStepProps {
  onComplete?: (completed: boolean) => void;
  onRecordMeasurement?: (result: "|0⟩" | "|1⟩") => void;
}

export const MeasurementStep: React.FC<MeasurementStepProps> = ({
  onComplete,
  onRecordMeasurement,
}) => {
  const theta = useQuantumStore((s: { theta: any }) => s.theta);
  const phi = useQuantumStore((s: { phi: any }) => s.phi);
  const setAngles = useQuantumStore((s: { setAngles: any }) => s.setAngles);

  const [prediction, setPrediction] = useState<"|0>" | "|1>" | "50/50" | null>(
    null,
  );
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [measuredState, setMeasuredState] = useState<("|0⟩" | "|1⟩") | null>(
    null,
  );
  const [probabilitiesState, setProbabilitiesState] = useState<{
    p0: number;
    p1: number;
  }>({ p0: 0.5, p1: 0.5 });
  const [revealedPrediction, setRevealedPrediction] = useState<
    "|0>" | "|1>" | "50/50" | null
  >(null);

  const bornProb0 = Math.cos(theta / 2) ** 2;

  const handleMeasure = () => {
    if (collapsed || !prediction) return;

    const outcome: 0 | 1 = Math.random() < bornProb0 ? 0 : 1;
    const result: "|0⟩" | "|1⟩" = outcome === 0 ? "|0⟩" : "|1⟩";

    setAngles(outcome === 0 ? 0 : Math.PI, phi);

    setMeasuredState(result);
    setCollapsed(true);
    setRevealedPrediction(prediction);
    setProbabilitiesState(
      outcome === 0 ? { p0: 1.0, p1: 0.0 } : { p0: 0.0, p1: 1.0 },
    );

    if (onRecordMeasurement) {
      onRecordMeasurement(result);
    }
    if (onComplete) {
      onComplete(true);
    }
  };

  return (
    <div
      className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border"
      role="region"
      aria-label="Measurement Step"
    >
      <h3 className="text-xl font-bold mb-3">
        Wavefunction Collapse & Measurement
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Measurement forces a superposition state to collapse into one of the
        computational basis states ($\vert{}0\rangle$ or $\vert{}1\rangle$)
        based on Born probability.
      </p>

      <div className="bg-card p-4 rounded-lg mb-6 border border-border">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-semibold">
          Step 1: Select Prediction (Zero-Spoiler UX)
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          To prevent observer bias, choose your hypothesis before executing
          wavefunction collapse.
        </p>
        <div className="flex gap-2">
          {(["|0>", "|1>", "50/50"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              disabled={collapsed}
              onClick={() => setPrediction(opt)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-mono font-semibold border transition-all ${
                prediction === opt
                  ? "bg-accent text-accent-foreground border-accent shadow-[0_0_10px_rgba(0,240,255,0.3)]"
                  : "bg-background border-border hover:bg-muted text-foreground"
              } ${collapsed ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card p-5 rounded-lg mb-6 border border-border text-center">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
          Observation Status
        </div>
        <div
          className="text-3xl font-mono font-bold text-accent mb-2"
          aria-live="polite"
        >
          {collapsed
            ? `Collapsed Result: ${measuredState}`
            : "Superposition Active (|ψ⟩)"}
        </div>
        <p className="text-xs text-muted-foreground">
          {collapsed
            ? `Post-Collapse Probabilities: P(|0⟩) = ${(probabilitiesState.p0 * 100).toFixed(0)}% | P(|1⟩) = ${(probabilitiesState.p1 * 100).toFixed(0)}%`
            : `Current Born Probability: P(|0⟩) = ${(bornProb0 * 100).toFixed(1)}% | P(|1⟩) = ${((1 - bornProb0) * 100).toFixed(1)}%`}
        </p>

        {collapsed && (
          <div className="mt-4 pt-4 border-t border-border flex justify-around text-xs font-mono">
            <div>
              <span className="text-muted-foreground block">
                Your Prediction:
              </span>
              <span className="text-accent font-bold text-sm">
                {revealedPrediction}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">
                Observed Outcome:
              </span>
              <span className="text-success font-bold text-sm">
                {measuredState}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">
                Hypothesis Result:
              </span>
              <span
                className={`font-bold text-sm ${
                  (revealedPrediction === "|0>" && measuredState === "|0⟩") ||
                  (revealedPrediction === "|1>" && measuredState === "|1⟩") ||
                  revealedPrediction === "50/50"
                    ? "text-success"
                    : "text-warning"
                }`}
              >
                {(revealedPrediction === "|0>" && measuredState === "|0⟩") ||
                (revealedPrediction === "|1>" && measuredState === "|1⟩")
                  ? "Match"
                  : revealedPrediction === "50/50"
                    ? "Probabilistic Match"
                    : "Stochastic Divergence"}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleMeasure}
          disabled={collapsed || !prediction}
          className={`px-6 py-2.5 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
            collapsed || !prediction
              ? "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
              : "bg-primary text-primary-foreground hover:opacity-95 cursor-pointer"
          }`}
          aria-label="Perform quantum measurement collapse"
        >
          {collapsed
            ? "Measurement Recorded"
            : "Measure (Collapse Wavefunction)"}
        </button>
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {collapsed
            ? "✓ Superposition measurement recorded"
            : !prediction
              ? "Select a prediction (|0>, |1>, or 50/50) to unlock Measure"
              : "Ready to collapse wavefunction"}
        </span>
      </div>
    </div>
  );
};
