/**
 * Lightweight i18n Localization Registry & Translation Helper
 * Zero heavy dependencies. High performance and deterministic lookups.
 */

import { useQuantumStore } from '@/store/useQuantumStore';

export type Language = 'en' | 'es';

export interface Translations {
  hud: {
    title: string;
    subtitle: string;
    enter_lab: string;
    pause: string;
    resume: string;
    reset_state: string;
    reset_feedback: string;
    mission_select: string;
    options: string;
    exit_title: string;
    theme: string;
    sound: string;
    language: string;
    sandbox: string;
    mastered: string;
    telemetry_status: string;
    active: string;
    fullscreen: string;
    progress: string;
  };
  workspace: {
    mission: string;
    done: string;
    mark_completed: string;
    active_objective: string;
    trigger_collapse: string;
    collapsed: string;
    hypothesis_title: string;
    guess_label: string;
    lock_guess: string;
    unlock: string;
    locked: string;
    unlocked: string;
    measure_collapse: string;
    outcome: string;
    match: string;
    diverged: string;
  };
  math_dock: {
    dirac_title: string;
    probabilities_title: string;
    zero_spoiler_badge: string;
    locked_prediction: string;
    select_prediction: string;
    measure_action: string;
    cryo_title: string;
    decoherence_badge: string;
    temperature: string;
    coherence_t2: string;
    thermal_controller: string;
  };
  gates: {
    palette_title: string;
    [gate: string]: {
      name: string;
      description: string;
    } | string;
  };
  missions: Record<
    string,
    {
      title: string;
      subtitle: string;
      description: string;
      learningObjective: string;
    }
  >;
  algorithms: {
    grover_title: string;
    target: string;
    step: string;
    apply_oracle_diffusion: string;
    amplified: string;
    uniform: string;
    shor_title: string;
    base_a: string;
    period: string;
    factors: string;
    didactic_notice: string;
    qec_title: string;
    logical_state: string;
    inject_error: string;
    flip_qubit: string;
    clean: string;
    syndrome: string;
    recovered: string;
  };
}

export const DICTIONARY: Record<Language, Translations> = {
  en: {
    hud: {
      title: 'QuantumLab 3D',
      subtitle: 'Tactical 3D Quantum Engine',
      enter_lab: 'Enter Quantum Lab',
      pause: 'System Pause',
      resume: 'Resume Simulation',
      reset_state: 'Reset State (|0⟩)',
      reset_feedback: 'State reset to |0⟩',
      mission_select: 'Mission Selector',
      options: 'System Options',
      exit_title: 'Exit to Title',
      theme: 'Theme',
      sound: 'Audio Effects',
      language: 'Language',
      sandbox: 'Quantum Sandbox',
      mastered: '{count} / {total} Mastered',
      telemetry_status: 'Telemetry Status',
      active: 'ONLINE',
      fullscreen: 'Toggle Fullscreen',
      progress: 'Campaign Progress',
    },
    workspace: {
      mission: 'Mission {index}',
      done: 'Done',
      mark_completed: 'Mark Completed',
      active_objective: 'Active Objective:',
      trigger_collapse: 'Trigger Wavefunction Collapse',
      collapsed: 'Collapsed: |{outcome}⟩',
      hypothesis_title: 'Hypothesis Prediction (Zero-Spoiler)',
      guess_label: 'Guess P(|0⟩):',
      lock_guess: 'Lock Guess',
      unlock: 'Unlock',
      locked: '🔒 Locked',
      unlocked: '✏️ Unlocked',
      measure_collapse: 'Measure |ψ⟩ Collapse',
      outcome: 'Outcome',
      match: '✨ Match!',
      diverged: 'Diverged',
    },
    math_dock: {
      dirac_title: 'Dirac State Vector',
      probabilities_title: 'Measurement Probabilities',
      zero_spoiler_badge: 'Zero-Spoiler',
      locked_prediction: '[LOCKED: Submit prediction to reveal Born probabilities]',
      select_prediction: 'Select Prediction:',
      measure_action: 'Measure State (Collapse)',
      cryo_title: 'Cryogenic Environment',
      decoherence_badge: 'Decoherence',
      temperature: 'Temperature:',
      coherence_t2: 'Coherence T₂(T):',
      thermal_controller: 'Thermal Fluctuation Controller',
    },
    gates: {
      palette_title: 'Quantum Gate Palette',
      X: {
        name: 'Pauli-X (NOT)',
        description: 'Bit-flip gate. Inverts state vector by π around X axis, mapping |0⟩ ↔ |1⟩.',
      },
      Y: {
        name: 'Pauli-Y',
        description: 'Bit & phase-flip gate. Rotates state vector by π around Y axis: |0⟩ → i|1⟩, |1⟩ → -i|0⟩.',
      },
      Z: {
        name: 'Pauli-Z (Phase Flip)',
        description: 'Phase-flip gate. Leaves |0⟩ unchanged and maps |1⟩ → -|1⟩ (relative phase shift of π).',
      },
      H: {
        name: 'Hadamard (H)',
        description: 'Superposition gate. Maps basis states to equal superposition: |0⟩ → |+⟩, |1⟩ → |−⟩.',
      },
      S: {
        name: 'Phase Gate (S)',
        description: 'Phase gate (√Z). Rotates state vector by π/2 around Z axis: |1⟩ → i|1⟩.',
      },
      T: {
        name: 'π/8 Gate (T)',
        description: 'Fourth root of Z. Rotates state vector by π/4 around Z axis: |1⟩ → e^(iπ/4)|1⟩.',
      },
    },
    missions: {
      superposition: {
        title: '1. Quantum Superposition',
        subtitle: 'The fundamental qubit state',
        description: 'Explore how a qubit can simultaneously exist in |0⟩ and |1⟩.',
        learningObjective: 'Distinguish the classical bit from the qubit and observe superposition on the Bloch sphere.',
      },
      entanglement: {
        title: '2. Quantum Entanglement',
        subtitle: 'Bell states and non-locality',
        description: 'Understand instantaneous correlation between entangled qubits in the |Φ⁺⟩ state.',
        learningObjective: 'Prepare a Bell pair and verify identical correlated collapse between Alice and Bob.',
      },
      decoherence: {
        title: '3. Decoherence & Noise',
        subtitle: 'Interaction with the thermal bath',
        description: 'Experience how temperature accelerates the loss of quantum coherence (T₂).',
        learningObjective: 'Understand the necessity of cryogenic cooling (15 mK) in physical quantum processors.',
      },
      gates: {
        title: '4. Quantum Gates',
        subtitle: 'Unitary operations on qubits',
        description: 'Apply elementary unitary rotations (X, Y, Z, H, S, T) on the Bloch sphere.',
        learningObjective: 'Master single-qubit gate geometry and their unitary transformation matrices.',
      },
      grover: {
        title: '5. Grover Search Algorithm',
        subtitle: 'Amplitude amplification in search',
        description: 'Achieve quadratic speedup in unstructured search via oracle phase inversion and diffusion.',
        learningObjective: 'Observe how inversion about the mean amplifies the probability of the target state.',
      },
      applications: {
        title: "6. Shor's Algorithm",
        subtitle: 'Didactic factoring of N = 15',
        description: 'Didactic quantum factorization of N = 15 with coprime bases a ∈ {2, 7, 8, 11, 13}.',
        learningObjective: 'Find the period r of aˣ mod 15 and derive prime factors gcd(a^(r/2) ± 1, 15).',
      },
      'error-correction': {
        title: '7. Quantum Error Correction',
        subtitle: '3-qubit bit-flip repetition code',
        description: 'Protect logical qubits against bit-flips via encoding |ψ⟩ → α|000⟩ + β|111⟩.',
        learningObjective: 'Measure parity syndromes without state collapse and restore with 100% fidelity.',
      },
    },
    algorithms: {
      grover_title: 'Grover Search (N=4)',
      target: 'Target:',
      step: 'Step {current}/{total}',
      apply_oracle_diffusion: 'Apply Oracle + Diffusion',
      amplified: '✓ AMPLIFIED',
      uniform: 'Uniform',
      shor_title: 'Shor Factoring (N = 15)',
      base_a: 'Base a:',
      period: 'Period',
      factors: 'Factors:',
      didactic_notice: 'Didactic N=15 model. (Pedagogical demonstration, not RSA-2048).',
      qec_title: '3-Qubit Bit-Flip QEC',
      logical_state: 'Logical: |ψ⟩ → α|000⟩ + β|111⟩',
      inject_error: 'Inject Error:',
      flip_qubit: 'Flip q{index}',
      clean: 'Clean',
      syndrome: 'Syndrome:',
      recovered: 'Recovered State:',
    },
  },
  es: {
    hud: {
      title: 'QuantumLab 3D',
      subtitle: 'Motor Táctico de Simulación Cuántica 3D',
      enter_lab: 'Entrar al Laboratorio Cuántico',
      pause: 'Pausa del Sistema',
      resume: 'Reanudar Simulación',
      reset_state: 'Reiniciar Estado (|0⟩)',
      reset_feedback: 'Estado restablecido a |0⟩',
      mission_select: 'Selector de Misiones',
      options: 'Opciones del Sistema',
      exit_title: 'Salir al Título',
      theme: 'Tema',
      sound: 'Efectos de Audio',
      language: 'Idioma',
      sandbox: 'Modo Sandbox',
      mastered: '{count} / {total} Dominadas',
      telemetry_status: 'Estado de Telemetría',
      active: 'EN LÍNEA',
      fullscreen: 'Pantalla Completa',
      progress: 'Progreso de Campaña',
    },
    workspace: {
      mission: 'Misión {index}',
      done: 'Completada',
      mark_completed: 'Marcar Completada',
      active_objective: 'Objetivo Activo:',
      trigger_collapse: 'Desencadenar Colapso de Función de Onda',
      collapsed: 'Colapsado: |{outcome}⟩',
      hypothesis_title: 'Predicción de Hipótesis (Cero-Spoiler)',
      guess_label: 'Estimación P(|0⟩):',
      lock_guess: 'Fijar Predicción',
      unlock: 'Modificar',
      locked: '🔒 Bloqueado',
      unlocked: '✏️ Desbloqueado',
      measure_collapse: 'Medir Colapso |ψ⟩',
      outcome: 'Resultado',
      match: '✨ ¡Coincide!',
      diverged: 'Discrepancia',
    },
    math_dock: {
      dirac_title: 'Vector de Estado Dirac',
      probabilities_title: 'Probabilidades de Medición',
      zero_spoiler_badge: 'Cero-Spoiler',
      locked_prediction: '[BLOQUEADO: Envía tu predicción para revelar las probabilidades de Born]',
      select_prediction: 'Seleccionar Predicción:',
      measure_action: 'Medir Estado (Colapsar)',
      cryo_title: 'Entorno Criogénico',
      decoherence_badge: 'Decoherencia',
      temperature: 'Temperatura:',
      coherence_t2: 'Tiempo de Coherencia T₂(T):',
      thermal_controller: 'Controlador de Fluctuación Térmica',
    },
    gates: {
      palette_title: 'Paleta de Puertas Cuánticas',
      X: {
        name: 'Pauli-X (NOT)',
        description: 'Puerta de inversión de bit (NOT). Rota el vector de estado π alrededor del eje X, transformando |0⟩ ↔ |1⟩.',
      },
      Y: {
        name: 'Pauli-Y',
        description: 'Puerta de inversión de bit y fase. Rota el vector de estado π alrededor del eje Y: |0⟩ → i|1⟩, |1⟩ → -i|0⟩.',
      },
      Z: {
        name: 'Pauli-Z (Cambio de Fase)',
        description: 'Puerta de cambio de fase. Mantiene |0⟩ invariante y aplica desfase relativo de π a |1⟩: |1⟩ → -|1⟩.',
      },
      H: {
        name: 'Hadamard (H)',
        description: 'Puerta de superposición. Transforma la base computacional en superposición equilibrada: |0⟩ → |+⟩, |1⟩ → |−⟩.',
      },
      S: {
        name: 'Puerta de Fase (S)',
        description: 'Puerta de fase (√Z). Rota el vector de estado π/2 alrededor del eje Z: |1⟩ → i|1⟩.',
      },
      T: {
        name: 'Puerta π/8 (T)',
        description: 'Cuarta raíz de Z. Aplica rotación de fase de π/4 alrededor del eje Z: |1⟩ → e^(iπ/4)|1⟩.',
      },
    },
    missions: {
      superposition: {
        title: '1. Superposición Cuántica',
        subtitle: 'El estado base del qubit',
        description: 'Explora cómo un qubit puede existir simultáneamente en |0⟩ y |1⟩.',
        learningObjective: 'Distinguir el bit clásico del qubit y observar la superposición en la esfera de Bloch.',
      },
      entanglement: {
        title: '2. Entrelazamiento Cuántico',
        subtitle: 'Estados Bell y no-localidad',
        description: 'Comprende la correlación instantánea entre qubits entrelazados en el estado |Φ⁺⟩.',
        learningObjective: 'Preparar un par Bell y verificar el colapso correlacionado idéntico entre Alice y Bob.',
      },
      decoherence: {
        title: '3. Decoherencia y Ruido',
        subtitle: 'Interacción con el entorno térmico',
        description: 'Experimenta cómo la temperatura acelera la pérdida de coherencia cuántica (T₂).',
        learningObjective: 'Comprender la necesidad del enfriamiento criogénico (15 mK) en computadores cuánticos.',
      },
      gates: {
        title: '4. Puertas Cuánticas',
        subtitle: 'Operaciones unitarias sobre qubits',
        description: 'Aplica rotaciones unitarias elementales (X, Y, Z, H, S, T) sobre la esfera de Bloch.',
        learningObjective: 'Dominar la geometría de las puertas de 1 qubit y sus matrices unitarias.',
      },
      grover: {
        title: '5. Algoritmo de Grover',
        subtitle: 'Amplificación de amplitud en búsqueda',
        description: 'Acelera cuadráticamente la búsqueda en bases no estructuradas mediante oráculo y difusión.',
        learningObjective: 'Observar cómo la inversión sobre la media amplifica la probabilidad del estado objetivo.',
      },
      applications: {
        title: '6. Factorización de Shor',
        subtitle: 'Algoritmo de Shor (N = 15)',
        description: 'Factorización didáctica de N = 15 con bases coprimas a ∈ {2, 7, 8, 11, 13}.',
        learningObjective: 'Encontrar el período r de aˣ mod 15 y deducir los factores primos gcd(a^(r/2) ± 1, 15).',
      },
      'error-correction': {
        title: '7. Corrección de Errores',
        subtitle: 'Código de repetición de 3 qubits',
        description: 'Protección contra bit-flips mediante codificación lógica |ψ⟩ → α|000⟩ + β|111⟩.',
        learningObjective: 'Medir el síndrome de paridad y recuperar el estado original con 100% de fidelidad.',
      },
    },
    algorithms: {
      grover_title: 'Búsqueda de Grover (N=4)',
      target: 'Objetivo:',
      step: 'Paso {current}/{total}',
      apply_oracle_diffusion: 'Aplicar Oráculo + Difusión',
      amplified: '✓ AMPLIFICADO',
      uniform: 'Uniforme',
      shor_title: 'Factorización de Shor (N = 15)',
      base_a: 'Base a:',
      period: 'Período',
      factors: 'Factores:',
      didactic_notice: 'Modelo didáctico N=15. (Demostración pedagógica, no RSA-2048).',
      qec_title: 'QEC de 3 Qubits (Bit-Flip)',
      logical_state: 'Lógico: |ψ⟩ → α|000⟩ + β|111⟩',
      inject_error: 'Inyectar Error:',
      flip_qubit: 'Invertir q{index}',
      clean: 'Limpio',
      syndrome: 'Síndrome:',
      recovered: 'Estado Recuperado:',
    },
  },
};

/**
 * Traverses a nested object by dot-delimited path.
 */
function resolvePath(obj: unknown, path: string): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current && typeof current === 'object') {
      const rec = current as Record<string, unknown>;
      if (part in rec) {
        current = rec[part];
      } else {
        const altPart = part.includes('-') ? part.replace(/-/g, '_') : part.replace(/_/g, '-');
        if (altPart in rec) {
          current = rec[altPart];
        } else {
          return undefined;
        }
      }
    } else {
      return undefined;
    }
  }

  return typeof current === 'string' ? current : undefined;
}

/**
 * Core translation helper: looks up localized string by key and language.
 * Falls back to English, then to the key itself if not found.
 */
export function t(
  key: string,
  lang?: Language,
  params?: Record<string, string | number>
): string {
  const activeLang: Language = lang ?? (typeof window !== 'undefined' ? useQuantumStore.getState().language : 'es');

  // Direct dot lookup in current language
  let text = resolvePath(DICTIONARY[activeLang], key);

  // Fallback to English if not found
  if (!text && activeLang !== 'en') {
    text = resolvePath(DICTIONARY.en, key);
  }

  // Fallback to key itself if missing from dictionary
  if (!text) {
    text = key;
  }

  // Substitute template params: {key}
  if (params) {
    for (const [paramKey, val] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(val));
    }
  }

  return text;
}

/**
 * React hook subscribing to store language mutations.
 */
export function useTranslation() {
  const language = useQuantumStore((s) => s.language);
  const setLanguage = useQuantumStore((s) => s.setLanguage);

  return {
    language,
    setLanguage,
    t: (key: string, params?: Record<string, string | number>) => t(key, language, params),
  };
}
