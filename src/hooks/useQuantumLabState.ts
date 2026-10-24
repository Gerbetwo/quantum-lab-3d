'use client';

import { useState, useCallback } from 'react';
import {
  type QubitState,
  type BitTriple,
  type SyndromeResult,
  applyGate,
  measureState,
  measureEntangledQubit,
} from '@/core/qubitMath';
import {
  simulateGroverStep,
  detectBitFlipSyndrome,
  injectBitFlip,
  bitFlipEncode,
} from '@/core/algorithms';

export interface EntangledPairState {
  alice: 0 | 1;
  bob: 0 | 1;
  state: string;
}

export interface QuantumLabState {
  // Tab Selection
  activeTab: number;

  // Single-Qubit State (Tabs 0-2)
  state: QubitState;
  lastOutcome: 0 | 1 | null;
  gateCount: number;

  // Entanglement State (Tab 3)
  entangledPair: EntangledPairState | null;

  // Decoherence State (Tab 4)
  temperature: number;

  // Grover State (Tab 5)
  groverTarget: number;
  groverProbs: number[];

  // QEC State (Tab 6)
  qecTriple: BitTriple;
  syndromeInfo: SyndromeResult | null;

  // Interactive Animation & Viewport Controls
  isPlayingAnimation: boolean;
  animationSpeed: number;
  replayTrigger: number;
  autoRotateCamera: boolean;
  noiseIntensity: number;
}

export interface QuantumLabActions {
  setTab: (tab: number) => void;
  setSingleQubitState: (state: QubitState) => void;
  applySingleQubitGate: (gate: 'H' | 'X' | 'Y' | 'Z' | 'S' | 'T') => void;
  measureSingleQubit: (seed?: number) => void;
  resetSingleQubit: () => void;
  measureEntangled: (seed?: number) => void;
  resetEntangled: () => void;
  setTemperature: (temperature: number) => void;
  setGroverTarget: (target: number) => void;
  runGroverStep: () => void;
  resetGrover: () => void;
  injectQecBitFlip: (index?: 0 | 1 | 2) => void;
  runQecCorrection: () => void;
  resetQec: (bit?: 0 | 1) => void;
  togglePlayPause: () => void;
  setAnimationSpeed: (speed: number) => void;
  replayAnimation: () => void;
  toggleAutoRotateCamera: () => void;
  setNoiseIntensity: (intensity: number) => void;
}

export type UseQuantumLabStateReturn = QuantumLabState & QuantumLabActions;

export function useQuantumLabState(initialTab = 0): UseQuantumLabStateReturn {
  const [activeTab, setActiveTab] = useState<number>(initialTab);

  // Tabs 0-2: Single Qubit Kinematics
  const [state, setState] = useState<QubitState>({
    theta: Math.PI / 2,
    phi: 0,
  });
  const [lastOutcome, setLastOutcome] = useState<0 | 1 | null>(null);
  const [gateCount, setGateCount] = useState<number>(0);

  // Tab 3: Entanglement State
  const [entangledPair, setEntangledPair] = useState<EntangledPairState | null>(null);

  // Tab 4: Decoherence State (default: 15 mK)
  const [temperature, setTemperature] = useState<number>(15);

  // Tab 5: Grover State
  const [groverTarget, setGroverTargetState] = useState<number>(1);
  const [groverProbs, setGroverProbs] = useState<number[]>([0.25, 0.25, 0.25, 0.25]);

  // Tab 6: QEC State
  const [qecTriple, setQecTriple] = useState<BitTriple>(bitFlipEncode(0));
  const [syndromeInfo, setSyndromeInfo] = useState<SyndromeResult | null>(null);

  // Interactive Animation & Viewport State
  const [isPlayingAnimation, setIsPlayingAnimation] = useState<boolean>(true);
  const [animationSpeed, setAnimationSpeedState] = useState<number>(1);
  const [replayTrigger, setReplayTrigger] = useState<number>(0);
  const [autoRotateCamera, setAutoRotateCamera] = useState<boolean>(false);
  const [noiseIntensity, setNoiseIntensityState] = useState<number>(1.0);

  const setTab = useCallback((tab: number) => {
    setActiveTab(Math.max(0, Math.min(6, tab)));
  }, []);

  const setSingleQubitState = useCallback((newState: QubitState) => {
    setState(newState);
    setLastOutcome(null);
  }, []);

  const applySingleQubitGate = useCallback((gate: 'H' | 'X' | 'Y' | 'Z' | 'S' | 'T') => {
    setState((prev) => applyGate(prev, gate));
    setLastOutcome(null);
    setGateCount((prev) => prev + 1);
  }, []);

  const measureSingleQubit = useCallback((seed?: number) => {
    setState((prev) => {
      const res = measureState(prev, seed);
      setLastOutcome(res.outcome);
      return res.newState;
    });
  }, []);

  const resetSingleQubit = useCallback(() => {
    setState({ theta: 0, phi: 0 });
    setLastOutcome(null);
    setGateCount(0);
  }, []);

  const measureEntangled = useCallback((seed?: number) => {
    const res = measureEntangledQubit(seed);
    setEntangledPair({
      alice: res.aliceOutcome,
      bob: res.bobOutcome,
      state: res.state,
    });
  }, []);

  const resetEntangled = useCallback(() => {
    setEntangledPair(null);
  }, []);

  const handleSetTemperature = useCallback((temp: number) => {
    setTemperature(temp);
  }, []);

  const setGroverTarget = useCallback((target: number) => {
    setGroverTargetState(target);
    setGroverProbs([0.25, 0.25, 0.25, 0.25]);
  }, []);

  const runGroverStep = useCallback(() => {
    const stepState = simulateGroverStep(2, groverTarget, 1);
    setGroverProbs(stepState.probabilities);
  }, [groverTarget]);

  const resetGrover = useCallback(() => {
    setGroverProbs([0.25, 0.25, 0.25, 0.25]);
  }, []);

  const injectQecBitFlip = useCallback((index: 0 | 1 | 2 = 1) => {
    setQecTriple((prev) => injectBitFlip(prev, index));
    setSyndromeInfo(null);
  }, []);

  const runQecCorrection = useCallback(() => {
    setQecTriple((prev) => {
      const res = detectBitFlipSyndrome(prev);
      setSyndromeInfo(res);
      return res.corrected;
    });
  }, []);

  const resetQec = useCallback((bit: 0 | 1 = 0) => {
    setQecTriple(bitFlipEncode(bit));
    setSyndromeInfo(null);
  }, []);

  const togglePlayPause = useCallback(() => {
    setIsPlayingAnimation((prev) => !prev);
  }, []);

  const setAnimationSpeed = useCallback((speed: number) => {
    setAnimationSpeedState(speed);
  }, []);

  const replayAnimation = useCallback(() => {
    setReplayTrigger((prev) => prev + 1);
  }, []);

  const toggleAutoRotateCamera = useCallback(() => {
    setAutoRotateCamera((prev) => !prev);
  }, []);

  const setNoiseIntensity = useCallback((intensity: number) => {
    setNoiseIntensityState(intensity);
  }, []);

  return {
    activeTab,
    state,
    lastOutcome,
    gateCount,
    entangledPair,
    temperature,
    groverTarget,
    groverProbs,
    qecTriple,
    syndromeInfo,
    isPlayingAnimation,
    animationSpeed,
    replayTrigger,
    autoRotateCamera,
    noiseIntensity,
    setTab,
    setSingleQubitState,
    applySingleQubitGate,
    measureSingleQubit,
    resetSingleQubit,
    measureEntangled,
    resetEntangled,
    setTemperature: handleSetTemperature,
    setGroverTarget,
    runGroverStep,
    resetGrover,
    injectQecBitFlip,
    runQecCorrection,
    resetQec,
    togglePlayPause,
    setAnimationSpeed,
    replayAnimation,
    toggleAutoRotateCamera,
    setNoiseIntensity,
  };
}

export default useQuantumLabState;
