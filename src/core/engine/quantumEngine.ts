/**
 * Fase 4 - Unified quantum engine adapter.
 *
 * Composes the existing pure-domain functions behind the
 * `QuantumEngineContract` interface. Zero new math lives here.
 */

import {
  evaluateFullCircuit,
  evaluateUpToStep,
  
} from '@/domain/quantum/circuit';
import {
  norm as rawNorm,
  probabilities as rawProbs,
  
} from '@/domain/quantum/statevector';
import { measureQubitN } from '@/domain/quantum/measureN';
import type { QuantumEngineContract } from '@/core/contracts';

export const quantumEngine: QuantumEngineContract = {
  evaluate: evaluateFullCircuit,
  evaluateUpTo: evaluateUpToStep,
  measure: (state, target, nQubits, rng) =>
    rng ? measureQubitN(state, target, nQubits, rng) : measureQubitN(state, target, nQubits),
  norm: rawNorm,
  probabilities: rawProbs,
};
