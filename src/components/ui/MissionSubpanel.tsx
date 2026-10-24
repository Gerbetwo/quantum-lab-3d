'use client';

import React from 'react';
import {
  type QubitState,
  type StateMetrics,
  type TwoQubitTensorState,
  computeStateMetrics,
  computeTwoQubitTensorState,
} from '@/core/qubitMath';
import { formatDirac } from '@/components/SingleQubitPanel';
import { useTranslation } from '@/hooks/useTranslation';
import { RotateCcw, Zap, Activity, Thermometer } from 'lucide-react';

export interface MeasurementStats {
  totalShots: number;
  count0: number;
  count1: number;
  frequency0: number;
  frequency1: number;
}

export interface MissionSubpanelProps {
  activeTab?: number;
  missionId?: 'superposition' | 'gates' | 'measurement' | 'entanglement' | 'decoherence' | 'grover' | 'qec' | string;
  state?: QubitState;
  metrics?: StateMetrics;
  lastOutcome?: 0 | 1 | null;
  gateHistory?: Array<'H' | 'X' | 'Y' | 'Z' | 'S' | 'T'>;
  activeGate?: string | null;
  measurementStats?: MeasurementStats;
  temperature?: number;
  t2Time?: number;
  vectorPurity?: number;
  entangledPair?: { alice: 0 | 1; bob: 0 | 1; state: string } | null;
  twoQubitState?: TwoQubitTensorState;
  onStateChange?: (state: QubitState) => void;
  onTemperatureChange?: (temp: number) => void;
  onReset?: () => void;
  onMeasure?: () => void;
  noiseIntensity?: number;
  onNoiseIntensityChange?: (intensity: number) => void;
  className?: string;
}

const GATE_MATRICES: Record<string, { matrix: [[string, string], [string, string]]; det: string; trace: string }> = {
  H: { matrix: [['1/√2', '1/√2'], ['1/√2', '-1/√2']], det: '-1', trace: '0' },
  X: { matrix: [['0', '1'], ['1', '0']], det: '-1', trace: '0' },
  Y: { matrix: [['0', '-i'], ['i', '0']], det: '1', trace: '0' },
  Z: { matrix: [['1', '0'], ['0', '-1']], det: '-1', trace: '0' },
  S: { matrix: [['1', '0'], ['0', 'i']], det: 'i', trace: '1 + i' },
  T: { matrix: [['1', '0'], ['0', 'e^(iπ/4)']], det: 'e^(iπ/4)', trace: '1 + e^(iπ/4)' },
};

export const MissionSubpanel: React.FC<MissionSubpanelProps> = ({
  activeTab = 0,
  missionId,
  state = { theta: 0, phi: 0 },
  metrics: propMetrics,
  lastOutcome = null,
  gateHistory = [],
  activeGate = 'H',
  measurementStats,
  temperature = 15,
  t2Time = 245.4,
  vectorPurity = 1.0,
  entangledPair = null,
  twoQubitState: propTwoQubitState,
  onStateChange,
  onTemperatureChange,
  onReset,
  onMeasure,
  noiseIntensity = 1.0,
  onNoiseIntensityChange,
  className = '',
}) => {
  const { t } = useTranslation();

  const effectiveTab =
    missionId === 'superposition' ? 0
      : missionId === 'gates' ? 1
      : missionId === 'measurement' ? 2
      : missionId === 'entanglement' ? 3
      : missionId === 'decoherence' ? 4
      : activeTab;

  const m = propMetrics ?? computeStateMetrics(state);
  const twoQubit = propTwoQubitState ?? computeTwoQubitTensorState(state, state, { temperature });

  const p0Pct = (m.prob0 * 100).toFixed(1);
  const p1Pct = (m.prob1 * 100).toFixed(1);
  const thetaDeg = Math.round((state.theta * 180) / Math.PI);
  const phiDeg = Math.round((state.phi * 180) / Math.PI);

  const stats: MeasurementStats = measurementStats ?? {
    totalShots: lastOutcome !== null ? 100 : 0,
    count0: lastOutcome !== null ? Math.round(m.prob0 * 100) : 0,
    count1: lastOutcome !== null ? Math.round(m.prob1 * 100) : 0,
    frequency0: m.prob0,
    frequency1: m.prob1,
  };

  const renderKinematicSliders = () => {
    if (!onStateChange) return null;
    return (
      <div className="p-3 rounded-xl bg-background/90 border border-border space-y-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold block">
          {t('panels.singleQubit.kinematic_sliders') || 'Precision Kinematic Sliders'}
        </span>
        <div className="space-y-2 text-xs font-mono">
          <div>
            <div className="flex justify-between items-center text-[10px] mb-0.5">
              <span className="text-muted-foreground">{t('panels.telemetryPanel.polar_theta') || 'Polar angle theta'}</span>
              <span className="text-primary font-bold">{thetaDeg}°</span>
            </div>
            <input
              type="range"
              min="0"
              max={Math.PI}
              step="0.01"
              value={state.theta}
              aria-label={t('panels.singleQubit.polar_theta_aria') || 'Polar angle theta'}
              onChange={(e) => onStateChange({ theta: parseFloat(e.target.value), phi: state.phi })}
              className="w-full accent-primary h-1.5 bg-secondary rounded-lg cursor-pointer"
            />
          </div>
          <div>
            <div className="flex justify-between items-center text-[10px] mb-0.5">
              <span className="text-muted-foreground">{t('panels.telemetryPanel.azimuthal_phi') || 'Azimuthal angle phi'}</span>
              <span className="text-foreground font-bold">{phiDeg}°</span>
            </div>
            <input
              type="range"
              min="0"
              max={2 * Math.PI}
              step="0.01"
              value={state.phi}
              aria-label={t('panels.singleQubit.azimuthal_phi_aria') || 'Azimuthal angle phi'}
              onChange={(e) => onStateChange({ theta: state.theta, phi: parseFloat(e.target.value) })}
              className="w-full accent-primary h-1.5 bg-secondary rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderMultiQubitMetrics = () => (
    <div className="space-y-3">
      <div data-testid="multi-qubit-tensor-state" className="p-3 rounded-xl bg-background/90 border border-border space-y-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold block">
          Multi-Qubit Tensor Product Amplitudes
        </span>
        <div className="text-xs font-mono text-primary font-bold">{twoQubit.dirac}</div>
        <div className="grid grid-cols-4 gap-1.5 font-mono text-center text-xs">
          <div className="p-1.5 rounded bg-card border border-border"><span className="text-[10px] text-muted-foreground block">|00⟩</span><span className="text-primary font-bold">{(twoQubit.prob00 * 100).toFixed(0)}%</span></div>
          <div className="p-1.5 rounded bg-card border border-border"><span className="text-[10px] text-muted-foreground block">|01⟩</span><span className="text-foreground font-bold">{(twoQubit.prob01 * 100).toFixed(0)}%</span></div>
          <div className="p-1.5 rounded bg-card border border-border"><span className="text-[10px] text-muted-foreground block">|10⟩</span><span className="text-foreground font-bold">{(twoQubit.prob10 * 100).toFixed(0)}%</span></div>
          <div className="p-1.5 rounded bg-card border border-border"><span className="text-[10px] text-muted-foreground block">|11⟩</span><span className="text-quantum-purple font-bold">{(twoQubit.prob11 * 100).toFixed(0)}%</span></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 font-mono text-xs">
        <div data-testid="thermal-entropy-metric" className="p-2.5 rounded-xl bg-background/90 border border-border space-y-1">
          <span className="text-[10px] text-muted-foreground uppercase block font-semibold flex items-center gap-1">
            <Activity className="w-3 h-3 text-warning" /> Thermal Entropy
          </span>
          <div className="text-base font-bold text-foreground">S = {twoQubit.entropy.toFixed(3)} bits</div>
        </div>
        <div data-testid="fidelity-metric" className="p-2.5 rounded-xl bg-background/90 border border-border space-y-1">
          <span className="text-[10px] text-muted-foreground uppercase block font-semibold flex items-center gap-1">
            <Thermometer className="w-3 h-3 text-primary" /> State Fidelity
          </span>
          <div className="text-base font-bold text-success">F = {(twoQubit.fidelity * 100).toFixed(1)}%</div>
        </div>
      </div>
    </div>
  );

  return (
    <div data-testid="mission-subpanel" className={`space-y-3.5 text-foreground select-none ${className}`.trim()}>
      {/* MISSION 1: SUPERPOSITION */}
      {effectiveTab === 0 && (
        <div data-testid="mission-1-superposition" className="space-y-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold font-mono text-primary flex items-center justify-between">
              <span>{t('panels.singleQubit.step_0_title') || '1. Superposition'}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary border border-border">HUD M1</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{t('panels.singleQubit.step_0_desc') || 'Explore single-qubit Bloch vector coordinates and amplitudes.'}</p>
          </div>
          <div data-testid="superposition-amplitudes" className="p-3 rounded-xl bg-background/90 border border-border space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold block">{t('panels.singleQubit.state_vector_readout') || 'State Vector Readout'}</span>
            <div className="text-base sm:text-lg font-mono font-bold text-primary">{formatDirac(m)}</div>
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px] text-muted-foreground">
              <div>α: {m.alpha.toFixed(4)}</div>
              <div>β: {m.betaReal.toFixed(4)} {m.betaImag !== 0 && `${m.betaImag >= 0 ? '+' : ''}${m.betaImag.toFixed(4)}i`}</div>
            </div>
          </div>
          <div data-testid="bloch-coordinates" className="p-3 rounded-xl bg-background/90 border border-border space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold block">Bloch Coordinates (θ, φ)</span>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 rounded-lg bg-card border border-border">
                <span className="text-muted-foreground text-[10px] block">{t('panels.telemetryPanel.polar_theta') || 'Polar (θ)'}</span>
                <span className="text-primary font-bold text-sm">{thetaDeg}°</span>
                <span className="text-muted-foreground text-[10px] block">{(state.theta / Math.PI).toFixed(2)}π rad</span>
              </div>
              <div className="p-2 rounded-lg bg-card border border-border">
                <span className="text-muted-foreground text-[10px] block">{t('panels.telemetryPanel.azimuthal_phi') || 'Azimuthal (φ)'}</span>
                <span className="text-foreground font-bold text-sm">{phiDeg}°</span>
                <span className="text-muted-foreground text-[10px] block">{(state.phi / Math.PI).toFixed(2)}π rad</span>
              </div>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-background/90 border border-border space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold block">{t('panels.singleQubit.born_probabilities') || 'Born Probabilities'}</span>
            <div className="flex justify-between text-xs font-mono font-bold">
              <span className="text-primary">P(|0⟩): {p0Pct}%</span>
              <span className="text-foreground">P(|1⟩): {p1Pct}%</span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden flex">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${m.prob0 * 100}%` }} />
              <div className="h-full bg-muted-foreground/30 transition-all duration-300" style={{ width: `${m.prob1 * 100}%` }} />
            </div>
          </div>
          {renderKinematicSliders()}
        </div>
      )}

      {/* MISSION 2: GATES */}
      {effectiveTab === 1 && (
        <div data-testid="mission-2-gates" className="space-y-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold font-mono text-primary flex items-center justify-between">
              <span>{t('panels.singleQubit.step_1_title') || '2. Quantum Gates'}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary border border-border">HUD M2</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{t('panels.singleQubit.step_1_desc') || 'Apply unitary transformation gates (H, X, Z) to rotate the state on the sphere.'}</p>
          </div>
          <div data-testid="unitary-matrix-metrics" className="p-3 rounded-xl bg-background/90 border border-border space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">Unitary Matrix [{activeGate || 'H'}]</span>
              <span className="text-[10px] font-mono text-primary font-bold">det: {GATE_MATRICES[activeGate || 'H']?.det ?? '1'} • tr: {GATE_MATRICES[activeGate || 'H']?.trace ?? '0'}</span>
            </div>
            <div className="p-2 rounded-lg bg-card border border-border font-mono text-center text-xs">
              <div className="grid grid-cols-2 gap-2 border-b border-border/50 pb-1">
                <span className="text-primary font-bold">{GATE_MATRICES[activeGate || 'H']?.matrix[0][0]}</span>
                <span className="text-foreground">{GATE_MATRICES[activeGate || 'H']?.matrix[0][1]}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <span className="text-foreground">{GATE_MATRICES[activeGate || 'H']?.matrix[1][0]}</span>
                <span className="text-primary font-bold">{GATE_MATRICES[activeGate || 'H']?.matrix[1][1]}</span>
              </div>
            </div>
          </div>
          <div data-testid="gate-execution-history" className="p-3 rounded-xl bg-background/90 border border-border space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold block">Gate Sequence Execution History</span>
            {gateHistory.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {gateHistory.map((g, idx) => (
                  <span key={`${g}-${idx}`} className="px-2 py-0.5 rounded-md bg-secondary border border-quantum-purple/40 text-quantum-purple font-mono font-bold text-xs">
                    {idx + 1}. {g}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs font-mono text-muted-foreground italic">No gates executed yet. Click a gate on the ribbon.</p>
            )}
          </div>
          <div className="p-3 rounded-xl bg-background/90 border border-border space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold block">{t('panels.singleQubit.state_vector_readout') || 'State Vector Readout'}</span>
            <div className="text-base font-mono font-bold text-primary">{formatDirac(m)}</div>
            <div className="pt-1 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold block">{t('panels.singleQubit.born_probabilities') || 'Born Probabilities'}</span>
              <div className="flex justify-between text-xs font-mono font-bold">
                <span className="text-primary">{t('panels.singleQubit.p0', { p0: p0Pct }) || `P(|0⟩): ${p0Pct}%`}</span>
                <span className="text-foreground">{t('panels.singleQubit.p1', { p1: p1Pct }) || `P(|1⟩): ${p1Pct}%`}</span>
              </div>
            </div>
          </div>
          {renderKinematicSliders()}
        </div>
      )}

      {/* MISSION 3: MEASUREMENT */}
      {effectiveTab === 2 && (
        <div data-testid="mission-3-measurement" className="space-y-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold font-mono text-primary flex items-center justify-between">
              <span>{t('panels.singleQubit.step_2_title') || '3. Measurement Collapse'}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary border border-border">HUD M3</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{t('panels.singleQubit.step_2_desc') || 'Measure quantum states into classical outcomes via Born rule probabilities.'}</p>
          </div>
          <div data-testid="collapse-probabilities" className="p-3 rounded-xl bg-background/90 border border-border space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold block">{t('panels.singleQubit.born_probabilities') || 'Collapse Probabilities (|α|², |β|²)'}</span>
            <div className="grid grid-cols-2 gap-2 text-center font-mono">
              <div className="p-2 rounded-lg bg-card border border-border">
                <span className="text-muted-foreground text-[10px] block">|0⟩ Probability</span>
                <span className="text-primary font-bold text-base">{p0Pct}%</span>
                <span className="text-muted-foreground text-[10px] block">|α|² = {m.prob0.toFixed(3)}</span>
              </div>
              <div className="p-2 rounded-lg bg-card border border-border">
                <span className="text-muted-foreground text-[10px] block">|1⟩ Probability</span>
                <span className="text-foreground font-bold text-base">{p1Pct}%</span>
                <span className="text-muted-foreground text-[10px] block">|β|² = {m.prob1.toFixed(3)}</span>
              </div>
            </div>
          </div>
          <div data-testid="ensemble-frequency-stats" className="p-3 rounded-xl bg-background/90 border border-border space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold block">Simulated Ensemble Frequency</span>
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-muted-foreground">Total Shots:</span>
              <span className="font-bold text-foreground">{stats.totalShots}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-1.5 rounded bg-card border border-border">
                <span className="text-[10px] text-muted-foreground block">N(|0⟩)</span>
                <span className="text-primary font-bold">{stats.count0} ({((stats.frequency0) * 100).toFixed(0)}%)</span>
              </div>
              <div className="p-1.5 rounded bg-card border border-border">
                <span className="text-[10px] text-muted-foreground block">N(|1⟩)</span>
                <span className="text-foreground font-bold">{stats.count1} ({((stats.frequency1) * 100).toFixed(0)}%)</span>
              </div>
            </div>
            {lastOutcome !== null && (
              <div className="p-2 rounded-lg bg-success/15 border border-success/40 flex items-center justify-between text-xs font-mono">
                <span className="text-muted-foreground">Projected State:</span>
                <span data-testid="subpanel-outcome-badge" className="px-2 py-0.5 rounded bg-success/20 text-success font-bold">|{lastOutcome}⟩</span>
              </div>
            )}
          </div>
          <div className="p-3 rounded-xl bg-background/90 border border-border space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold block">{t('panels.singleQubit.state_vector_readout') || 'State Vector Readout'}</span>
            <div className="text-base font-mono font-bold text-primary">{formatDirac(m)}</div>
          </div>
          {renderKinematicSliders()}
        </div>
      )}

      {/* MISSION 4: ENTANGLEMENT */}
      {effectiveTab === 3 && (
        <div data-testid="mission-4-multi-qubit" className="space-y-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold font-mono text-primary flex items-center justify-between">
              <span>{t('panels.entanglement.title') || '4. Entanglement'}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary border border-border">HUD M4</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{t('panels.entanglement.desc') || 'Multi-qubit tensor states, von Neumann thermal entropy, and fidelity metrics.'}</p>
          </div>
          {renderMultiQubitMetrics()}
          <div className="p-3 rounded-xl bg-background/90 border border-border space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold block">{t('panels.entanglement.telemetry') || 'Correlated Pair Telemetry'}</span>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 rounded-lg bg-card border border-border">
                <span className="text-muted-foreground text-[10px] block">{t('panels.entanglement.alice') || 'Alice (Qubit A)'}</span>
                <span className="text-primary font-bold text-base">{entangledPair ? `|${entangledPair.alice}⟩` : '|ψ⟩'}</span>
              </div>
              <div className="p-2 rounded-lg bg-card border border-border">
                <span className="text-muted-foreground text-[10px] block">{t('panels.entanglement.bob') || 'Bob (Qubit B)'}</span>
                <span className="text-foreground font-bold text-base">{entangledPair ? `|${entangledPair.bob}⟩` : '|ψ⟩'}</span>
              </div>
            </div>
            <div className="text-[11px] font-mono text-muted-foreground">
              {t('panels.entanglement.correlation_label') || 'Correlation Status:'}{' '}
              <span className="text-success font-bold">
                {entangledPair
                  ? (t('panels.entanglement.perfect_correlation', { state: entangledPair.state }) || `Perfect Correlation: ${entangledPair.state}`)
                  : (t('panels.entanglement.unbroken') || 'Unbroken Bell State')}
              </span>
            </div>
          </div>
          {entangledPair && (
            <div className="p-2.5 rounded-xl bg-background/90 border border-success/40 flex items-center justify-between text-xs font-mono">
              <span className="text-muted-foreground">{t('panels.entanglement.result', { state: '' }).replace(': ', '').trim() || 'Observed Result'}</span>
              <div className="px-2.5 py-1 rounded-lg bg-secondary border border-success text-success font-mono text-xs font-bold text-center">
                {t('panels.entanglement.result', { state: entangledPair.state }) || `Result: ${entangledPair.state}`}
              </div>
            </div>
          )}
          <div className="p-2.5 rounded-xl bg-background/90 border border-border font-mono text-xs flex justify-between items-center">
            <span className="text-muted-foreground text-[11px]">T = {temperature} mK • T₂ = {t2Time.toFixed(1)} μs</span>
            <span className="text-success text-[11px] font-bold">Purity: {(vectorPurity * 100).toFixed(0)}%</span>
          </div>
        </div>
      )}

      {/* MISSION 5: DECOHERENCE */}
      {effectiveTab === 4 && (
        <div data-testid="mission-4-multi-qubit" className="space-y-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold font-mono text-primary flex items-center justify-between">
              <span>{t('panels.decoherence.title') || '5. Decoherence'}</span>
              <span className="text-primary text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary border border-border">Cryostat</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{t('panels.decoherence.desc') || 'Multi-qubit tensor states, von Neumann thermal entropy, and fidelity metrics.'}</p>
          </div>
          {renderMultiQubitMetrics()}
          <div className="p-3 rounded-xl bg-background/90 border border-border space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold block">{t('panels.decoherence.telemetry') || 'Decoherence Telemetry'}</span>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 rounded-lg bg-card border border-border">
                <span className="text-muted-foreground text-[10px] block">{t('panels.decoherence.t2_time') || 'T₂ Coherence Time'}</span>
                <span className="text-primary font-bold text-sm">{t2Time.toFixed(1)} μs</span>
              </div>
              <div className="p-2 rounded-lg bg-card border border-border">
                <span className="text-muted-foreground text-[10px] block">{t('panels.decoherence.purity') || 'State Purity'}</span>
                <span className="text-success font-bold text-sm">{(vectorPurity * 100).toFixed(1)}%</span>
              </div>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-linear-to-r from-primary to-success transition-all duration-200" style={{ width: `${vectorPurity * 100}%` }} />
            </div>
          </div>
          {onTemperatureChange && (
            <div className="p-3 rounded-xl bg-background/90 border border-border space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-muted-foreground font-semibold uppercase text-[10px]">{t('panels.decoherence.temperature_slider') || 'Temperature Slider'}</span>
                <span className="text-primary font-bold text-sm">{temperature} mK</span>
              </div>
              <input
                type="range"
                min={15}
                max={300}
                value={temperature}
                role="slider"
                aria-label={t('panels.decoherence.temperature_slider') || 'Cryostat Temperature Slider'}
                onChange={(e) => onTemperatureChange(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer h-1.5 bg-secondary rounded-lg"
              />
            </div>
          )}
          {onNoiseIntensityChange && (
            <div className="p-3 rounded-xl bg-background/90 border border-border space-y-1.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-muted-foreground font-semibold uppercase text-[10px]">{t('panels.decoherence.thermal_noise') || 'Thermal Noise Intensity'}</span>
                <span className="text-primary font-bold text-xs">{(noiseIntensity * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={3}
                step={0.1}
                value={noiseIntensity}
                aria-label={t('panels.decoherence.thermal_noise') || 'Thermal Noise Intensity'}
                onChange={(e) => onNoiseIntensityChange(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer h-1.5 bg-secondary rounded-lg"
              />
            </div>
          )}
        </div>
      )}

      {/* Streamlined Minimal Action Buttons (Reset, Measure) */}
      <div className="flex items-center gap-2 pt-1 border-t border-border/50">
        {onReset && (
          <button
            type="button"
            data-testid="subpanel-reset-button"
            aria-label="Reset State"
            onClick={onReset}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-xs font-mono font-bold cursor-pointer transition-all active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5 text-warning" />
            <span>{t('ribbon.reset') || 'Reset'}</span>
          </button>
        )}
        {onMeasure && (effectiveTab === 2 || effectiveTab >= 3) && (
          <button
            type="button"
            data-testid="subpanel-measure-button"
            aria-label="Measure Qubit"
            onClick={onMeasure}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary bg-secondary hover:bg-card text-primary text-xs font-mono font-bold cursor-pointer transition-all active:scale-95 shadow-sm"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{t('ribbon.collapse') || 'Measure'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default MissionSubpanel;
