import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQuantumLabState } from '../useQuantumLabState';

describe('useQuantumLabState - Centralized State Engine', () => {
  it('initializes with default states across all 7 tabs', () => {
    const { result } = renderHook(() => useQuantumLabState());

    // Tab Selection
    expect(result.current.activeTab).toBe(0);

    // Single-qubit state (Tabs 0-2)
    expect(result.current.state.theta).toBeCloseTo(Math.PI / 2);
    expect(result.current.state.phi).toBe(0);
    expect(result.current.lastOutcome).toBeNull();
    expect(result.current.gateCount).toBe(0);

    // Entanglement state (Tab 3)
    expect(result.current.entangledPair).toBeNull();

    // Decoherence state (Tab 4)
    expect(result.current.temperature).toBe(15);

    // Grover state (Tab 5)
    expect(result.current.groverTarget).toBe(1);
    expect(result.current.groverProbs).toEqual([0.25, 0.25, 0.25, 0.25]);

    // QEC state (Tab 6)
    expect(result.current.qecTriple).toEqual([0, 0, 0]);
    expect(result.current.syndromeInfo).toBeNull();
  });

  it('preserves workshop state without reset bugs when switching tabs', () => {
    const { result } = renderHook(() => useQuantumLabState());

    // 1. Modify single-qubit state on Tab 0 (apply H -> |0⟩)
    act(() => {
      result.current.applySingleQubitGate('H');
    });
    expect(result.current.state.theta).toBe(0);
    expect(result.current.gateCount).toBe(1);

    // 2. Modify decoherence temperature on Tab 4
    act(() => {
      result.current.setTemperature(100);
    });
    expect(result.current.temperature).toBe(100);

    // 3. Switch to Tab 3, Tab 5, Tab 6, Tab 0
    act(() => {
      result.current.setTab(3);
    });
    expect(result.current.activeTab).toBe(3);

    act(() => {
      result.current.setTab(5);
    });
    expect(result.current.activeTab).toBe(5);

    act(() => {
      result.current.setTab(0);
    });
    expect(result.current.activeTab).toBe(0);

    // State must be completely preserved!
    expect(result.current.state.theta).toBe(0);
    expect(result.current.gateCount).toBe(1);
    expect(result.current.temperature).toBe(100);
  });

  it('updates single qubit state directly via setSingleQubitState (for vector drag)', () => {
    const { result } = renderHook(() => useQuantumLabState());

    act(() => {
      result.current.setSingleQubitState({ theta: Math.PI / 4, phi: Math.PI / 3 });
    });
    expect(result.current.state.theta).toBeCloseTo(Math.PI / 4);
    expect(result.current.state.phi).toBeCloseTo(Math.PI / 3);
    expect(result.current.lastOutcome).toBeNull();
  });

  it('clamps tab selection to [0, 6]', () => {
    const { result } = renderHook(() => useQuantumLabState());

    act(() => {
      result.current.setTab(-5);
    });
    expect(result.current.activeTab).toBe(0);

    act(() => {
      result.current.setTab(10);
    });
    expect(result.current.activeTab).toBe(6);
  });

  it('applies gates and increments gateCount deterministically', () => {
    const { result } = renderHook(() => useQuantumLabState());

    // Initial state is |+⟩ (theta = PI/2, phi = 0)
    // Apply H -> |0⟩ (theta = 0)
    act(() => {
      result.current.applySingleQubitGate('H');
    });
    expect(result.current.state.theta).toBe(0);
    expect(result.current.gateCount).toBe(1);

    // Apply X -> |1⟩ (theta = PI)
    act(() => {
      result.current.applySingleQubitGate('X');
    });
    expect(result.current.state.theta).toBe(Math.PI);
    expect(result.current.gateCount).toBe(2);

    // Apply Y -> |0⟩
    act(() => {
      result.current.applySingleQubitGate('Y');
    });
    expect(result.current.state.theta).toBe(0);
    expect(result.current.gateCount).toBe(3);

    // Reset single qubit
    act(() => {
      result.current.resetSingleQubit();
    });
    expect(result.current.state.theta).toBe(0);
    expect(result.current.gateCount).toBe(0);
    expect(result.current.lastOutcome).toBeNull();
  });

  it('performs single qubit measurement collapse with seed', () => {
    const { result } = renderHook(() => useQuantumLabState());

    // State is |+⟩ (prob0 = 0.5)
    // seed = 0.1 -> outcome 0
    act(() => {
      result.current.measureSingleQubit(0.1);
    });
    expect(result.current.lastOutcome).toBe(0);
    expect(result.current.state.theta).toBe(0);

    // Reset and measure with seed = 0.9 -> outcome 1
    act(() => {
      result.current.applySingleQubitGate('H'); // back to |+⟩ from |0⟩? wait, |0⟩ + H = |+⟩
    });
    act(() => {
      result.current.measureSingleQubit(0.9);
    });
    expect(result.current.lastOutcome).toBe(1);
    expect(result.current.state.theta).toBe(Math.PI);
  });

  it('measures entangled Bell pair with correlated outcomes', () => {
    const { result } = renderHook(() => useQuantumLabState());

    act(() => {
      result.current.measureEntangled(0.2);
    });
    expect(result.current.entangledPair).toEqual({
      alice: 0,
      bob: 0,
      state: '|00⟩',
    });

    act(() => {
      result.current.measureEntangled(0.8);
    });
    expect(result.current.entangledPair).toEqual({
      alice: 1,
      bob: 1,
      state: '|11⟩',
    });

    act(() => {
      result.current.resetEntangled();
    });
    expect(result.current.entangledPair).toBeNull();
  });

  it('runs Grover search step amplifying target state', () => {
    const { result } = renderHook(() => useQuantumLabState());

    act(() => {
      result.current.setGroverTarget(2); // |10⟩
    });
    expect(result.current.groverTarget).toBe(2);

    act(() => {
      result.current.runGroverStep();
    });
    // For 2 qubits (N=4), 1 Grover step amplifies target to 100%
    expect(result.current.groverProbs[2]).toBeCloseTo(1.0);
    expect(result.current.groverProbs[0]).toBeCloseTo(0.0);

    act(() => {
      result.current.resetGrover();
    });
    expect(result.current.groverProbs).toEqual([0.25, 0.25, 0.25, 0.25]);
  });

  it('injects bit flip and runs QEC syndrome correction', () => {
    const { result } = renderHook(() => useQuantumLabState());

    // Initially [0, 0, 0]
    expect(result.current.qecTriple).toEqual([0, 0, 0]);

    // Inject flip at qubit 1 -> [0, 1, 0]
    act(() => {
      result.current.injectQecBitFlip(1);
    });
    expect(result.current.qecTriple).toEqual([0, 1, 0]);
    expect(result.current.syndromeInfo).toBeNull();

    // Run syndrome correction
    act(() => {
      result.current.runQecCorrection();
    });
    expect(result.current.syndromeInfo).not.toBeNull();
    expect(result.current.syndromeInfo?.errorIndex).toBe(1);
    expect(result.current.qecTriple).toEqual([0, 0, 0]);

    // Reset QEC to |111⟩
    act(() => {
      result.current.resetQec(1);
    });
    expect(result.current.qecTriple).toEqual([1, 1, 1]);
    expect(result.current.syndromeInfo).toBeNull();
  });

  it('yields arbitrary superpositions rather than hardcoded |11⟩ when state is manipulated in Mission 4', () => {
    const { result } = renderHook(() => useQuantumLabState(3));

    // Manipulate state to custom angle
    act(() => {
      result.current.setSingleQubitState({ theta: Math.PI / 4, phi: Math.PI / 3 });
    });

    expect(result.current.twoQubitState.prob00).toBeGreaterThan(0);
    expect(result.current.twoQubitState.prob01).toBeGreaterThan(0);
    expect(result.current.twoQubitState.prob10).toBeGreaterThan(0);
    expect(result.current.twoQubitState.prob11).toBeGreaterThan(0);

    // Collapsing with different seeds yields varied states (not stuck on |11⟩)
    act(() => {
      result.current.measureEntangled(0.05);
    });
    expect(result.current.entangledPair?.state).toBe('|00⟩');

    // Also tracks gate sequence history
    act(() => {
      result.current.applySingleQubitGate('X');
      result.current.applySingleQubitGate('H');
    });
    expect(result.current.gateHistory).toEqual(['X', 'H']);
  });
});
