/**
 * Lightweight i18n Localization Registry & Translation Helper
 * Zero heavy dependencies. High performance and deterministic lookups.
 */

import { useQuantumStore } from '@/store/useQuantumStore';

export type Language = 'en' | 'es';

export interface Translations {
  hud: {
    title: string; subtitle: string; enter_lab: string; pause: string; resume: string;
    reset_state: string; reset_feedback: string; mission_select: string; options: string;
    exit_title: string; theme: string; sound: string; language: string; sandbox: string;
    mastered: string; telemetry_status: string; active: string; fullscreen: string; progress: string;
  };
  workspace: {
    mission: string; done: string; mark_completed: string; active_objective: string;
    trigger_collapse: string; collapsed: string; hypothesis_title: string; guess_label: string;
    lock_guess: string; unlock: string; locked: string; unlocked: string; measure_collapse: string;
    outcome: string; match: string; diverged: string;
    sandbox_controls: string; gate_controls: string; qubit_angles: string;
    theta_polar: string; phi_azimuthal: string; unitary_gates: string;
    thermal_chamber: string; measurement_outcome: string; measure_collapse_wave: string;
    bell_pair_active: string; bell_enable: string; theta_aria: string; phi_aria: string; reset_ground_tooltip: string;
  };
  math_dock: {
    dirac_title: string; probabilities_title: string; zero_spoiler_badge: string;
    locked_prediction: string; select_prediction: string; measure_action: string;
    cryo_title: string; decoherence_badge: string; temperature: string;
    coherence_t2: string; thermal_controller: string;
    dirac_telemetry_title: string; state_vector_label: string; born_probabilities: string;
    born_check: string; born_p0: string; born_p1: string; measure_button: string;
    remeasure_button: string; decoherence_telemetry: string; online: string;
    cryo_temp: string; expand_tooltip: string; collapse_tooltip: string; aria_label: string; temperature_label: string;
  };
  gates: {
    palette_title: string;
    [gate: string]: { name: string; description: string } | string;
  };
  missions: Record<string, { title: string; subtitle: string; description: string; learningObjective: string }>;
  algorithms: {
    grover_title: string; target: string; step: string; apply_oracle_diffusion: string;
    amplified: string; uniform: string; shor_title: string; base_a: string; period: string;
    factors: string; didactic_notice: string; qec_title: string; logical_state: string;
    inject_error: string; flip_qubit: string; clean: string; syndrome: string; recovered: string;
  };
  title: {
    engine_label: string; flight_deck_online: string; sys_temp: string; version: string;
    viewport_badge: string; headline: string; headline_accent: string; tagline: string;
    press_any_key: string; footer_physics: string; footer_init: string;
  };
  campaign: {
    roster_title: string; roster_subtitle: string; progression_label: string;
    mastered: string; sandbox_mode: string; launch_simulation: string; mission_code: string;
    difficulties: {
      foundational: string; intermediate: string; advanced: string;
      expert: string; unconstrained: string;
    };
    sandbox_card: { code: string; title: string; subtitle: string };
    concepts: {
      superposition: string; entanglement: string; decoherence: string;
      gates: string; grover: string; shor: string; qec: string;
    };
  };
  mission_header: {
    objective_label: string; quick_jump: string; mark_complete: string; done: string;
    reset_to_zero: string; pause: string; pause_tooltip: string; back_to_missions: string;
    toggle_theme: string; toggle_language: string; language_current: string;
    sandbox_title: string; sandbox_badge: string; jump_tooltip: string; quick_jump_tooltip: string; reset_tooltip: string;
  };
  pause: {
    flight_deck_control: string; pause_simulation: string; active_label: string;
    resume: string; mission_selector: string; reset_quantum_state: string;
    reset_feedback: string; exit_to_title: string; system_options: string;
    theme: string; audio: string; theme_dark: string; theme_light: string;
    audio_on: string; audio_muted: string; footer_hint: string; close_button: string;
  };
  foundations: {
    superposition_presets: string; ground_state: string; excited_state: string;
    plus_state: string; minus_state: string; bell_controls: string;
    create_bell: string; separate: string; cryo_temp_title: string;
    preset_15mk: string; preset_4k: string; preset_77k: string; preset_300k: string;
    gate_palette: string;
  };
  algorithm_controls: {
    step_counter: string; target_label: string; target_prob: string;
    amplified: string; uniform: string; apply_grover: string; reset: string;
    sequence_label: string; factors_label: string; didactic_notice: string;
    inject_error: string; flip_qubit: string; clean: string; syndrome_error: string;
  };
  algorithm_viz: {
    grover_title: string; shor_title: string; qec_title: string; active_badge: string;
    target_state: string; apply_oracle: string; coprime_base: string;
    sequence: string; factors: string; inject_error: string; clean: string; syndrome: string;
  };
  decoherence: {
    title: string; t2_badge: string; temp_label: string; coherence_label: string;
    distortion_label: string; jitter_label: string;
  };
  entanglement_3d: {
    viewport_title: string; alice_label: string; bob_label: string;
    strand_status: string; spin_flip_wave: string; laser_line: string;
    collapse_wave: string; bell_coherent: string; decoupled: string;
    superposed: string; collapsed: string;
  };
  entanglement: {
    title: string; entangled_badge: string; separable_badge: string;
    local_alice: string; distant_bob: string; epr_channel: string;
    prepare_bell: string; measure_alice: string; correlation_ok: string;
    collapsed_label: string; instant_label: string; superposition_label: string;
  };
  celebration: {
    curriculum_complete: string; mastery_title: string; mastery_body: string;
    sandbox_unlocked: string; sandbox_body: string; review_roadmap: string;
    enter_sandbox: string; close_aria: string;
  };
  common: {
    reset: string; on: string; off: string; close: string; done: string;
  };
}

export const DICTIONARY: Record<Language, Translations> = {
  en: {
    hud: {
      title: 'QuantumLab 3D', subtitle: 'Tactical 3D Quantum Engine',
      enter_lab: 'Enter Quantum Lab', pause: 'System Pause', resume: 'Resume Simulation',
      reset_state: 'Reset State (|0⟩)', reset_feedback: 'State reset to |0⟩',
      mission_select: 'Mission Selector', options: 'System Options',
      exit_title: 'Exit to Title', theme: 'Theme', sound: 'Audio Effects',
      language: 'Language', sandbox: 'Quantum Sandbox',
      mastered: '{count} / {total} Mastered', telemetry_status: 'Telemetry Status',
      active: 'ONLINE', fullscreen: 'Toggle Fullscreen', progress: 'Campaign Progress',
    },
    workspace: {
      mission: 'Mission {index}', done: 'Done', mark_completed: 'Mark Completed',
      active_objective: 'Active Objective:', trigger_collapse: 'Trigger Wavefunction Collapse',
      collapsed: 'Collapsed: |{outcome}⟩', hypothesis_title: 'Hypothesis Prediction (Zero-Spoiler)',
      guess_label: 'Guess P(|0⟩):', lock_guess: 'Lock Guess', unlock: 'Unlock',
      locked: 'LOCKED', unlocked: 'EDITABLE', measure_collapse: 'Measure |ψ⟩ Collapse',
      outcome: 'Outcome', match: 'MATCH CONFIRMED', diverged: 'Diverged',
      sandbox_controls: 'Sandbox Controls', gate_controls: 'Gate Controls',
      qubit_angles: 'Qubit Spherical Angles', theta_polar: 'θ (Polar):',
      phi_azimuthal: 'φ (Azimuthal):', unitary_gates: 'Unitary Gates',
      thermal_chamber: 'Thermal Chamber (15 mK – 300 K)',
      measurement_outcome: 'Measurement Outcome',
      measure_collapse_wave: 'Measure & Collapse Wavefunction',
      bell_pair_active: 'Bell Pair |Φ⁺⟩ Active',
      bell_enable: 'Enable Bell Entanglement',
      theta_aria: 'Theta angle slider',
      phi_aria: 'Phi angle slider',
      reset_ground_tooltip: 'Reset to ground state |0⟩',
    },
    math_dock: {
      dirac_title: 'Dirac State Vector', probabilities_title: 'Measurement Probabilities',
      zero_spoiler_badge: 'Zero-Spoiler',
      locked_prediction: '[LOCKED: Submit prediction to reveal Born probabilities]',
      select_prediction: 'Select Prediction:', measure_action: 'Measure State (Collapse)',
      cryo_title: 'Cryogenic Environment', decoherence_badge: 'Decoherence',
      temperature: 'Temperature:', coherence_t2: 'Coherence T₂(T):',
      thermal_controller: 'Thermal Fluctuation Controller',
      dirac_telemetry_title: 'Dirac Telemetry', state_vector_label: 'State Vector',
      born_probabilities: 'Born Probabilities', born_check: 'P₀+P₁=1.000',
      born_p0: 'P(|0⟩) [Born P₀]', born_p1: 'P(|1⟩) [Born P₁]',
      measure_button: 'Measure State (Collapse)',
      remeasure_button: 'Outcome |{outcome}⟩ — Re-measure',
      decoherence_telemetry: 'Decoherence Telemetry', online: 'ONLINE',
      cryo_temp: 'Cryo Temp', expand_tooltip: 'Expand Telemetry',
      collapse_tooltip: 'Collapse Telemetry', aria_label: 'Quantum Dirac Telemetry Dock',
      temperature_label: 'Temperature',
    },
    gates: {
      palette_title: 'Quantum Gate Palette',
      X: { name: 'Pauli-X (NOT)', description: 'Bit-flip gate. Inverts state vector by π around X axis, mapping |0⟩ ↔ |1⟩.' },
      Y: { name: 'Pauli-Y', description: 'Bit & phase-flip gate. Rotates state vector by π around Y axis.' },
      Z: { name: 'Pauli-Z (Phase Flip)', description: 'Phase-flip gate. Leaves |0⟩ unchanged and maps |1⟩ → -|1⟩.' },
      H: { name: 'Hadamard (H)', description: 'Superposition gate. Maps basis states to equal superposition.' },
      S: { name: 'Phase Gate (S)', description: 'Phase gate (√Z). Rotates state vector by π/2 around Z axis.' },
      T: { name: 'π/8 Gate (T)', description: 'Fourth root of Z. Rotates state vector by π/4 around Z axis.' },
    },
    missions: {
      superposition: { title: '1. Quantum Superposition', subtitle: 'The fundamental qubit state', description: 'Explore how a qubit can simultaneously exist in |0⟩ and |1⟩.', learningObjective: 'Distinguish the classical bit from the qubit and observe superposition on the Bloch sphere.' },
      entanglement: { title: '2. Quantum Entanglement', subtitle: 'Bell states and non-locality', description: 'Understand instantaneous correlation between entangled qubits in the |Φ⁺⟩ state.', learningObjective: 'Prepare a Bell pair and verify identical correlated collapse between Alice and Bob.' },
      decoherence: { title: '3. Decoherence & Noise', subtitle: 'Interaction with the thermal bath', description: 'Experience how temperature accelerates the loss of quantum coherence (T₂).', learningObjective: 'Understand the necessity of cryogenic cooling (15 mK) in physical quantum processors.' },
      gates: { title: '4. Quantum Gates', subtitle: 'Unitary operations on qubits', description: 'Apply elementary unitary rotations (X, Y, Z, H, S, T) on the Bloch sphere.', learningObjective: 'Master single-qubit gate geometry and their unitary transformation matrices.' },
      grover: { title: '5. Grover Search Algorithm', subtitle: 'Amplitude amplification in search', description: 'Achieve quadratic speedup in unstructured search via oracle phase inversion and diffusion.', learningObjective: 'Observe how inversion about the mean amplifies the probability of the target state.' },
      applications: { title: "6. Shor's Algorithm", subtitle: 'Didactic factoring of N = 15', description: 'Didactic quantum factorization of N = 15 with coprime bases a ∈ {2, 7, 8, 11, 13}.', learningObjective: 'Find the period r of aˣ mod 15 and derive prime factors.' },
      'error-correction': { title: '7. Quantum Error Correction', subtitle: '3-qubit bit-flip repetition code', description: 'Protect logical qubits against bit-flips via encoding |ψ⟩ → α|000⟩ + β|111⟩.', learningObjective: 'Measure parity syndromes without state collapse and restore with 100% fidelity.' },
    },
    algorithms: {
      grover_title: 'Grover Search (N=4)', target: 'Target:', step: 'Step {current}/{total}',
      apply_oracle_diffusion: 'Apply Oracle + Diffusion', amplified: '✓ AMPLIFIED',
      uniform: 'Uniform', shor_title: 'Shor Factoring (N = 15)', base_a: 'Base a:',
      period: 'Period', factors: 'Factors:',
      didactic_notice: 'Didactic N=15 model. (Pedagogical demonstration, not RSA-2048).',
      qec_title: '3-Qubit Bit-Flip QEC', logical_state: 'Logical: |ψ⟩ → α|000⟩ + β|111⟩',
      inject_error: 'Inject Error:', flip_qubit: 'Flip q{index}', clean: 'Clean',
      syndrome: 'Syndrome:', recovered: 'Recovered State:',
    },
    title: {
      engine_label: 'QUANTUM SIMULATION ENGINE',
      flight_deck_online: 'FLIGHT-DECK ONLINE',
      sys_temp: 'SYS.TEMP: 15 mK',
      version: 'v0.3.0-QUANTUM-CORE',
      viewport_badge: 'BLOCH SPHERE VIEWPORT',
      headline: 'QUANTUM',
      headline_accent: 'LAB 3D',
      tagline: 'TACTICAL STATE MANIPULATION & DECOHERENCE HARNESS',
      press_any_key: 'PRESS ANY KEY / ENTER QUANTUM LAB',
      footer_physics: 'SINGLE WEBGL CONTEXT // DETERMINISTIC PHYSICS',
      footer_init: 'CLICK ANYWHERE OR PRESS ANY KEY TO INITIALIZE',
    },
    campaign: {
      roster_title: 'Flight-Deck Campaign Roster',
      roster_subtitle: 'Select a tactical mission node or launch the sandbox simulation harness.',
      progression_label: 'Progression:', mastered: '{count} / 7 Mastered',
      sandbox_mode: 'SANDBOX MODE', launch_simulation: 'LAUNCH SIMULATION',
      mission_code: '{code} · Mission {index}',
      difficulties: {
        foundational: 'FOUNDATIONAL', intermediate: 'INTERMEDIATE',
        advanced: 'ADVANCED', expert: 'EXPERT', unconstrained: 'UNCONSTRAINED',
      },
      sandbox_card: {
        code: 'LAB-00 · Sandbox', title: 'Quantum Sandbox Lab',
        subtitle: 'Full 3D Bloch sphere, thermal noise sweeps & custom gates',
      },
      concepts: {
        superposition: 'Superposition', entanglement: 'Entanglement',
        decoherence: 'Decoherence', gates: 'Unitary Gates',
        grover: 'Grover Search', shor: 'Shor Factorization', qec: '3-Qubit QEC',
      },
    },
    mission_header: {
      objective_label: 'OBJECTIVE:', quick_jump: 'Quick Mission Jump:',
      mark_complete: 'MARK COMPLETE', done: 'DONE',
      reset_to_zero: 'Reset |0⟩', pause: 'PAUSE', pause_tooltip: 'Pause Menu [ESC]',
      back_to_missions: 'Return to Mission Select',
      toggle_theme: 'Toggle color theme', toggle_language: 'Toggle language between English and Spanish',
      language_current: 'Switch language (Current: {lang})',
      sandbox_title: 'Quantum Sandbox Lab', sandbox_badge: 'UNCONSTRAINED',
      jump_tooltip: 'Jump to Mission {index}',
      quick_jump_tooltip: 'Arbitrary state exploration & unitary experiments',
      reset_tooltip: 'Reset Quantum State to |0⟩',
    },
    pause: {
      flight_deck_control: 'Flight-Deck Control', pause_simulation: 'PAUSE SIMULATION',
      active_label: 'Active:', resume: 'RESUME', mission_selector: 'MISSION SELECTOR',
      reset_quantum_state: 'RESET QUANTUM STATE', reset_feedback: '|0⟩ RESET',
      exit_to_title: 'EXIT TO TITLE', system_options: 'System Options',
      theme: 'Theme', audio: 'Audio', theme_dark: 'Dark', theme_light: 'Light',
      audio_on: 'ON', audio_muted: 'MUTED',
      footer_hint: 'PRESS [ESC] OR CLICK RESUME TO RETURN TO SIMULATION',
      close_button: 'Resume Simulation',
    },
    foundations: {
      superposition_presets: 'Superposition Presets',
      ground_state: '|0⟩ Ground (θ=0)', excited_state: '|1⟩ Excited (θ=π)',
      plus_state: '|+⟩ Superposition', minus_state: '|−⟩ Phase Opposite',
      bell_controls: 'Bell State |Φ⁺⟩ Controls',
      create_bell: 'Create |Φ⁺⟩ = 1/√2(|00⟩+|11⟩)', separate: 'Separate',
      cryo_temp_title: 'Cryogenic Temperature',
      preset_15mk: '15 mK (Base)', preset_4k: '4 K (L-He)',
      preset_77k: '77 K (L-N2)', preset_300k: '300 K (Room)',
      gate_palette: 'Quantum Gate Palette',
    },
    algorithm_controls: {
      step_counter: 'Step {current}/2', target_label: 'Target:',
      target_prob: 'Target P(|{i}⟩): {p}%', amplified: '✓ AMPLIFIED', uniform: 'Uniform',
      apply_grover: 'Apply Oracle + Diffusion', reset: 'Reset',
      sequence_label: 'Seq: [{seq}...] (Period r = {r})',
      factors_label: 'Factors: gcd(a^(r/2) ± 1, 15) → {f1} × {f2} = 15',
      didactic_notice: 'Didactic N=15 model. (Pedagogical demonstration, not RSA-2048).',
      inject_error: 'Inject Error:', flip_qubit: 'Flip q{index}', clean: 'Clean',
      syndrome_error: 'Syndrome: [{s0}, {s1}] (Error on {q})',
    },
    algorithm_viz: {
      grover_title: 'Grover 3D Amplitude Amplification (N=4)',
      shor_title: 'Shor Periodicity Wheel (N=15, a={a})',
      qec_title: '3-Qubit Syndrome Lattice & Bit-Flip Clearing',
      active_badge: '{algo} Active', target_state: 'Target State:',
      apply_oracle: 'Apply Oracle + Diffusion (Step {step}/2)',
      coprime_base: 'Coprime Base a:', sequence: 'Sequence: [{seq}...] (Period r = {r})',
      factors: 'Factors: {f1} × {f2} = 15', inject_error: 'Inject Error:',
      clean: 'Clean', syndrome: 'Syndrome: [{s0}, {s1}]',
    },
    decoherence: {
      title: 'Thermal Decoherence: GPU Jitter & Mesh Distortion',
      t2_badge: 'T₂ = {t2} μs', temp_label: 'Temp (T)',
      coherence_label: 'Coherence T₂', distortion_label: 'Distortion Δ',
      jitter_label: 'Jitter v',
    },
    entanglement_3d: {
      viewport_title: 'Dual Bloch Viewport: EPR Laser Strand',
      alice_label: 'Qubit A (Alice)', bob_label: 'Qubit B (Bob)',
      strand_status: 'Laser Strand Pulse', spin_flip_wave: 'Spin-Flip Wave',
      laser_line: '∿ 120-pt Laser Line',
      collapse_wave: 'SPIN-FLIP COLLAPSE WAVE', bell_coherent: '100% BELL COHERENT',
      decoupled: 'DECOUPLED', superposed: '1/√2(|0⟩+|1⟩)', collapsed: '|{outcome}⟩',
    },
    entanglement: {
      title: 'Bell State |Φ⁺⟩ Correlation', entangled_badge: '100% Entangled',
      separable_badge: 'Separable', local_alice: 'Local (Alice)', distant_bob: 'Distant (Bob)',
      epr_channel: 'EPR Channel', prepare_bell: 'Prepare |Φ⁺⟩ Pair',
      measure_alice: 'Measure Alice',
      correlation_ok: '✓ Non-local correlation confirmed: Alice={a} ↔ Bob={b} (Zero |01⟩/|10⟩)',
      collapsed_label: 'Collapsed: {outcome}', instant_label: 'Instant: {outcome}',
      superposition_label: 'Superposition',
    },
    celebration: {
      curriculum_complete: 'Curriculum Complete', mastery_title: 'Quantum Mastery Achieved!',
      mastery_body: "Congratulations! You have completed all 7 core missions of QuantumLab 3D—from single-qubit Bloch sphere superposition to Shor's factorization and 3-qubit error correction.",
      sandbox_unlocked: 'Sandbox Lab Unlocked',
      sandbox_body: 'Access the freeform workspace with continuous angle rotations, real-time cryogenic thermal sweeps (15 mK – 300 K), and zero mission constraints.',
      review_roadmap: 'Review Roadmap', enter_sandbox: 'Enter Sandbox Lab',
      close_aria: 'Close celebration modal',
    },
    common: {
      reset: 'Reset', on: 'ON', off: 'OFF', close: 'Close', done: 'Done',
    },
  },
  es: {
    hud: {
      title: 'QuantumLab 3D', subtitle: 'Motor Táctico de Simulación Cuántica 3D',
      enter_lab: 'Entrar al Laboratorio Cuántico', pause: 'Pausa del Sistema',
      resume: 'Reanudar Simulación', reset_state: 'Reiniciar Estado (|0⟩)',
      reset_feedback: 'Estado restablecido a |0⟩', mission_select: 'Selector de Misiones',
      options: 'Opciones del Sistema', exit_title: 'Salir al Título', theme: 'Tema',
      sound: 'Efectos de Audio', language: 'Idioma', sandbox: 'Modo Sandbox',
      mastered: '{count} / {total} Dominadas', telemetry_status: 'Estado de Telemetría',
      active: 'EN LÍNEA', fullscreen: 'Pantalla Completa', progress: 'Progreso de Campaña',
    },
    workspace: {
      mission: 'Misión {index}', done: 'Completada', mark_completed: 'Marcar Completada',
      active_objective: 'Objetivo Activo:',
      trigger_collapse: 'Desencadenar Colapso de Función de Onda',
      collapsed: 'Colapsado: |{outcome}⟩',
      hypothesis_title: 'Predicción de Hipótesis (Cero-Spoiler)',
      guess_label: 'Estimación P(|0⟩):', lock_guess: 'Fijar Predicción',
      unlock: 'Modificar', locked: 'BLOQUEADO', unlocked: 'EDITABLE',
      measure_collapse: 'Medir Colapso |ψ⟩', outcome: 'Resultado',
      match: 'COINCIDENCIA CONFIRMADA', diverged: 'Discrepancia',
      sandbox_controls: 'Controles Sandbox', gate_controls: 'Controles de Puertas',
      qubit_angles: 'Ángulos Esféricos del Qubit', theta_polar: 'θ (Polar):',
      phi_azimuthal: 'φ (Azimutal):', unitary_gates: 'Puertas Unitarias',
      thermal_chamber: 'Cámara Térmica (15 mK – 300 K)',
      measurement_outcome: 'Resultado de Medición',
      measure_collapse_wave: 'Medir y Colapsar la Función de Onda',
      bell_pair_active: 'Par Bell |Φ⁺⟩ Activo',
      bell_enable: 'Habilitar Entrelazamiento Bell',
      theta_aria: 'Control deslizante del ángulo Theta',
      phi_aria: 'Control deslizante del ángulo Phi',
      reset_ground_tooltip: 'Reiniciar al estado base |0⟩',
    },
    math_dock: {
      dirac_title: 'Vector de Estado Dirac',
      probabilities_title: 'Probabilidades de Medición',
      zero_spoiler_badge: 'Cero-Spoiler',
      locked_prediction: '[BLOQUEADO: Envía tu predicción para revelar las probabilidades de Born]',
      select_prediction: 'Seleccionar Predicción:',
      measure_action: 'Medir Estado (Colapsar)',
      cryo_title: 'Entorno Criogénico', decoherence_badge: 'Decoherencia',
      temperature: 'Temperatura:', coherence_t2: 'Tiempo de Coherencia T₂(T):',
      thermal_controller: 'Controlador de Fluctuación Térmica',
      dirac_telemetry_title: 'Telemetría Dirac', state_vector_label: 'Vector de Estado',
      born_probabilities: 'Probabilidades de Born', born_check: 'P₀+P₁=1.000',
      born_p0: 'P(|0⟩) [Born P₀]', born_p1: 'P(|1⟩) [Born P₁]',
      measure_button: 'Medir Estado (Colapsar)',
      remeasure_button: 'Resultado |{outcome}⟩ — Re-medir',
      decoherence_telemetry: 'Telemetría de Decoherencia', online: 'EN LÍNEA',
      cryo_temp: 'Temp. Crío', expand_tooltip: 'Expandir Telemetría',
      collapse_tooltip: 'Colapsar Telemetría', aria_label: 'Dock de Telemetría Cuántica Dirac',
      temperature_label: 'Temperatura',
    },
    gates: {
      palette_title: 'Paleta de Puertas Cuánticas',
      X: { name: 'Pauli-X (NOT)', description: 'Puerta de inversión de bit (NOT). Rota el vector de estado π alrededor del eje X, transformando |0⟩ ↔ |1⟩.' },
      Y: { name: 'Pauli-Y', description: 'Puerta de inversión de bit y fase. Rota el vector de estado π alrededor del eje Y.' },
      Z: { name: 'Pauli-Z (Cambio de Fase)', description: 'Puerta de cambio de fase. Mantiene |0⟩ invariante y aplica desfase relativo de π a |1⟩.' },
      H: { name: 'Hadamard (H)', description: 'Puerta de superposición. Transforma la base computacional en superposición equilibrada.' },
      S: { name: 'Puerta de Fase (S)', description: 'Puerta de fase (√Z). Rota el vector de estado π/2 alrededor del eje Z.' },
      T: { name: 'Puerta π/8 (T)', description: 'Cuarta raíz de Z. Aplica rotación de fase de π/4 alrededor del eje Z.' },
    },
    missions: {
      superposition: { title: '1. Superposición Cuántica', subtitle: 'El estado base del qubit', description: 'Explora cómo un qubit puede existir simultáneamente en |0⟩ y |1⟩.', learningObjective: 'Distinguir el bit clásico del qubit y observar la superposición en la esfera de Bloch.' },
      entanglement: { title: '2. Entrelazamiento Cuántico', subtitle: 'Estados Bell y no-localidad', description: 'Comprende la correlación instantánea entre qubits entrelazados en el estado |Φ⁺⟩.', learningObjective: 'Preparar un par Bell y verificar el colapso correlacionado idéntico entre Alice y Bob.' },
      decoherence: { title: '3. Decoherencia y Ruido', subtitle: 'Interacción con el entorno térmico', description: 'Experimenta cómo la temperatura acelera la pérdida de coherencia cuántica (T₂).', learningObjective: 'Comprender la necesidad del enfriamiento criogénico (15 mK) en computadores cuánticos.' },
      gates: { title: '4. Puertas Cuánticas', subtitle: 'Operaciones unitarias sobre qubits', description: 'Aplica rotaciones unitarias elementales (X, Y, Z, H, S, T) sobre la esfera de Bloch.', learningObjective: 'Dominar la geometría de las puertas de 1 qubit y sus matrices unitarias.' },
      grover: { title: '5. Algoritmo de Grover', subtitle: 'Amplificación de amplitud en búsqueda', description: 'Acelera cuadráticamente la búsqueda en bases no estructuradas mediante oráculo y difusión.', learningObjective: 'Observar cómo la inversión sobre la media amplifica la probabilidad del estado objetivo.' },
      applications: { title: '6. Factorización de Shor', subtitle: 'Algoritmo de Shor (N = 15)', description: 'Factorización didáctica de N = 15 con bases coprimas a ∈ {2, 7, 8, 11, 13}.', learningObjective: 'Encontrar el período r de aˣ mod 15 y deducir los factores primos.' },
      'error-correction': { title: '7. Corrección de Errores', subtitle: 'Código de repetición de 3 qubits', description: 'Protección contra bit-flips mediante codificación lógica |ψ⟩ → α|000⟩ + β|111⟩.', learningObjective: 'Medir el síndrome de paridad y recuperar el estado original con 100% de fidelidad.' },
    },
    algorithms: {
      grover_title: 'Búsqueda de Grover (N=4)', target: 'Objetivo:',
      step: 'Paso {current}/{total}',
      apply_oracle_diffusion: 'Aplicar Oráculo + Difusión',
      amplified: '✓ AMPLIFICADO', uniform: 'Uniforme',
      shor_title: 'Factorización de Shor (N = 15)', base_a: 'Base a:',
      period: 'Período', factors: 'Factores:',
      didactic_notice: 'Modelo didáctico N=15. (Demostración pedagógica, no RSA-2048).',
      qec_title: 'QEC de 3 Qubits (Bit-Flip)',
      logical_state: 'Lógico: |ψ⟩ → α|000⟩ + β|111⟩',
      inject_error: 'Inyectar Error:', flip_qubit: 'Invertir q{index}', clean: 'Limpio',
      syndrome: 'Síndrome:', recovered: 'Estado Recuperado:',
    },
    title: {
      engine_label: 'MOTOR DE SIMULACIÓN CUÁNTICA',
      flight_deck_online: 'CUBIERTA DE VUELO EN LÍNEA',
      sys_temp: 'TEMP.SIS: 15 mK',
      version: 'v0.3.0-NÚCLEO-CUÁNTICO',
      viewport_badge: 'VISOR DE ESFERA DE BLOCH',
      headline: 'QUANTUM',
      headline_accent: 'LAB 3D',
      tagline: 'MANIPULACIÓN TÁCTICA DE ESTADO Y ARNÉS DE DECOHERENCIA',
      press_any_key: 'PRESIONE CUALQUIER TECLA / ENTRAR AL LABORATORIO',
      footer_physics: 'CONTEXTO WEBGL ÚNICO // FÍSICA DETERMINISTA',
      footer_init: 'CLIC EN CUALQUIER LUGAR O PRESIONE CUALQUIER TECLA PARA INICIALIZAR',
    },
    campaign: {
      roster_title: 'Lista de Campaña de la Cubierta de Vuelo',
      roster_subtitle: 'Selecciona un nodo de misión táctica o lanza el arnés de simulación sandbox.',
      progression_label: 'Progreso:', mastered: '{count} / 7 Dominadas',
      sandbox_mode: 'MODO SANDBOX', launch_simulation: 'LANZAR SIMULACIÓN',
      mission_code: '{code} · Misión {index}',
      difficulties: {
        foundational: 'FUNDACIONAL', intermediate: 'INTERMEDIO',
        advanced: 'AVANZADO', expert: 'EXPERTO', unconstrained: 'LIBRE',
      },
      sandbox_card: {
        code: 'LAB-00 · Sandbox', title: 'Laboratorio Sandbox Cuántico',
        subtitle: 'Esfera de Bloch 3D completa, barridos térmicos y puertas personalizadas',
      },
      concepts: {
        superposition: 'Superposición', entanglement: 'Entrelazamiento',
        decoherence: 'Decoherencia', gates: 'Puertas Unitarias',
        grover: 'Búsqueda Grover', shor: 'Factorización Shor', qec: 'QEC 3-Qubit',
      },
    },
    mission_header: {
      objective_label: 'OBJETIVO:', quick_jump: 'Salto Rápido de Misión:',
      mark_complete: 'MARCAR COMPLETA', done: 'HECHA',
      reset_to_zero: 'Reiniciar |0⟩', pause: 'PAUSA', pause_tooltip: 'Menú de Pausa [ESC]',
      back_to_missions: 'Volver al Selector de Misiones',
      toggle_theme: 'Alternar tema de color',
      toggle_language: 'Alternar idioma entre Inglés y Español',
      language_current: 'Cambiar idioma (Actual: {lang})',
      sandbox_title: 'Laboratorio Sandbox Cuántico', sandbox_badge: 'LIBRE',
      jump_tooltip: 'Saltar a Misión {index}',
      quick_jump_tooltip: 'Exploración arbitraria de estado y experimentos unitarios',
      reset_tooltip: 'Reiniciar Estado Cuántico a |0⟩',
    },
    pause: {
      flight_deck_control: 'Control de Cubierta', pause_simulation: 'PAUSAR SIMULACIÓN',
      active_label: 'Activa:', resume: 'REANUDAR', mission_selector: 'SELECTOR DE MISIONES',
      reset_quantum_state: 'REINICIAR ESTADO CUÁNTICO',
      reset_feedback: '|0⟩ REINICIADO', exit_to_title: 'SALIR AL TÍTULO',
      system_options: 'Opciones del Sistema',
      theme: 'Tema', audio: 'Audio', theme_dark: 'Oscuro', theme_light: 'Claro',
      audio_on: 'ACTIVO', audio_muted: 'SILENCIADO',
      footer_hint: 'PRESIONE [ESC] O CLIC EN REANUDAR PARA VOLVER A LA SIMULACIÓN',
      close_button: 'Reanudar Simulación',
    },
    foundations: {
      superposition_presets: 'Presets de Superposición',
      ground_state: '|0⟩ Base (θ=0)', excited_state: '|1⟩ Excitado (θ=π)',
      plus_state: '|+⟩ Superposición', minus_state: '|−⟩ Fase Opuesta',
      bell_controls: 'Controles Estado Bell |Φ⁺⟩',
      create_bell: 'Crear |Φ⁺⟩ = 1/√2(|00⟩+|11⟩)', separate: 'Separar',
      cryo_temp_title: 'Temperatura Criogénica',
      preset_15mk: '15 mK (Base)', preset_4k: '4 K (L-He)',
      preset_77k: '77 K (L-N2)', preset_300k: '300 K (Ambiente)',
      gate_palette: 'Paleta de Puertas Cuánticas',
    },
    algorithm_controls: {
      step_counter: 'Paso {current}/2', target_label: 'Objetivo:',
      target_prob: 'P(|{i}⟩) objetivo: {p}%',
      amplified: '✓ AMPLIFICADO', uniform: 'Uniforme',
      apply_grover: 'Aplicar Oráculo + Difusión', reset: 'Reiniciar',
      sequence_label: 'Sec: [{seq}...] (Período r = {r})',
      factors_label: 'Factores: gcd(a^(r/2) ± 1, 15) → {f1} × {f2} = 15',
      didactic_notice: 'Modelo didáctico N=15. (Demostración pedagógica, no RSA-2048).',
      inject_error: 'Inyectar Error:', flip_qubit: 'Invertir q{index}', clean: 'Limpio',
      syndrome_error: 'Síndrome: [{s0}, {s1}] (Error en {q})',
    },
    algorithm_viz: {
      grover_title: 'Amplificación Grover 3D (N=4)',
      shor_title: 'Rueda de Periodicidad Shor (N=15, a={a})',
      qec_title: 'Retícula de Síndrome 3-Qubit y Limpieza Bit-Flip',
      active_badge: '{algo} Activo', target_state: 'Estado Objetivo:',
      apply_oracle: 'Aplicar Oráculo + Difusión (Paso {step}/2)',
      coprime_base: 'Base Coprima a:', sequence: 'Secuencia: [{seq}...] (Período r = {r})',
      factors: 'Factores: {f1} × {f2} = 15', inject_error: 'Inyectar Error:',
      clean: 'Limpio', syndrome: 'Síndrome: [{s0}, {s1}]',
    },
    decoherence: {
      title: 'Decoherencia Térmica: Jitter GPU y Distorsión de Malla',
      t2_badge: 'T₂ = {t2} μs', temp_label: 'Temp (T)',
      coherence_label: 'Coherencia T₂', distortion_label: 'Distorsión Δ',
      jitter_label: 'Jitter v',
    },
    entanglement_3d: {
      viewport_title: 'Visor Dual Bloch: Hebra Láser EPR',
      alice_label: 'Qubit A (Alice)', bob_label: 'Qubit B (Bob)',
      strand_status: 'Pulso de Hebra Láser', spin_flip_wave: 'Onda Spin-Flip',
      laser_line: '∿ Línea Láser 120-pt',
      collapse_wave: 'ONDA DE COLAPSO SPIN-FLIP', bell_coherent: '100% BELL COHERENTE',
      decoupled: 'DESACOPLADO', superposed: '1/√2(|0⟩+|1⟩)', collapsed: '|{outcome}⟩',
    },
    entanglement: {
      title: 'Correlación Estado Bell |Φ⁺⟩', entangled_badge: '100% Entrelazado',
      separable_badge: 'Separable', local_alice: 'Local (Alice)', distant_bob: 'Distante (Bob)',
      epr_channel: 'Canal EPR', prepare_bell: 'Preparar Par |Φ⁺⟩',
      measure_alice: 'Medir Alice',
      correlation_ok: '✓ Correlación no-local confirmada: Alice={a} ↔ Bob={b} (Cero |01⟩/|10⟩)',
      collapsed_label: 'Colapsado: {outcome}', instant_label: 'Instantáneo: {outcome}',
      superposition_label: 'Superposición',
    },
    celebration: {
      curriculum_complete: 'Currículo Completo', mastery_title: '¡Dominio Cuántico Alcanzado!',
      mastery_body: '¡Felicidades! Has completado las 7 misiones del QuantumLab 3D—desde la superposición de un solo qubit hasta la factorización de Shor y la corrección de errores de 3 qubits.',
      sandbox_unlocked: 'Laboratorio Sandbox Desbloqueado',
      sandbox_body: 'Accede al espacio libre con rotaciones continuas de ángulo, barridos térmicos criogénicos en tiempo real (15 mK – 300 K) y sin restricciones de misión.',
      review_roadmap: 'Revisar Mapa', enter_sandbox: 'Entrar al Sandbox',
      close_aria: 'Cerrar modal de celebración',
    },
    common: {
      reset: 'Reiniciar', on: 'ACTIVO', off: 'INACTIVO', close: 'Cerrar', done: 'Hecho',
    },
  },
};

function resolvePath(obj: unknown, path: string): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === 'object') {
      const rec = current as Record<string, unknown>;
      if (part in rec) { current = rec[part]; continue; }
      const altPart = part.includes('-') ? part.replace(/-/g, '_') : part.replace(/_/g, '-');
      if (altPart in rec) { current = rec[altPart]; continue; }
      return undefined;
    }
    return undefined;
  }
  return typeof current === 'string' ? current : undefined;
}

export function t(
  key: string,
  lang?: Language,
  params?: Record<string, string | number>
): string {
  const activeLang: Language = lang ?? (typeof window !== 'undefined' ? useQuantumStore.getState().language : 'es');
  let text = resolvePath(DICTIONARY[activeLang], key);
  if (!text && activeLang !== 'en') text = resolvePath(DICTIONARY.en, key);
  if (!text) text = key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp('\\{' + k + '\\}', 'g'), String(v));
    }
  }
  return text;
}

export function useTranslation() {
  const language = useQuantumStore((s) => s.language);
  const setLanguage = useQuantumStore((s) => s.setLanguage);
  return {
    language,
    setLanguage,
    t: (key: string, params?: Record<string, string | number>) => t(key, language, params),
  };
}
