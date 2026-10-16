# AGENTS.md — Solo-Developer Architecture & Operational Guidelines

## 1. Core Architectural Philosophy (Solo-Dev Optimized)
QuantumLab 3D uses a **4-Layer Flat Feature Architecture** optimized for a single developer. Every change must prioritize low cognitive load, deterministic physics, and WebGL stability.

### File Size & Complexity Guardrails
- **Hard Line Limit**: No file may exceed **250 LOC** (ideal target: **80–180 LOC**).
- **Folder Density**: Maximum **4–5 files per directory**. Do not create deeply nested sub-folders or barrel (`index.ts`) files unless strictly required.
- **Strict Layer Separation**:
  1. `src/core/` — **Pure Physics & Math**: 100% framework-agnostic TypeScript. Zero React, zero Three.js, zero DOM/cookie APIs.
  2. `src/store/` — **Reactive State (`useQuantumStore.ts`)**: Single Zustand store orchestrating quantum parameters, mission presets, and zero-spoiler prediction locks.
  3. `src/features/quantum-core/` — **3D WebGL & Math HUD**: Single-canvas Three.js Bloch sphere renderer (`BlochViewport.tsx`, `blochSceneObjects.ts`) and real-time Dirac telemetry (`MathDock.tsx`).
  4. `src/features/missions/` & `src/components/` — **Pedagogical Walkthrough & Shell**: Unlocked 7-mission navigation (`AppShell.tsx`) and mission-specific controls.

---

## 2. Non-Negotiable Engineering Principles
1. **Unified State Routing**: All quantum state mutations ($\theta, \phi, T, \text{missionId}, \text{prediction}$) MUST route through `useQuantumStore.ts`.
2. **WebGL Single-Context Safety**: Only **one** Three.js `WebGLRenderer` instance may exist across the entire session (`BlochViewport.tsx`). Switching missions (`0–6`) updates store uniforms/vectors—it must NEVER unmount and recreate the WebGL context.
3. **Synchronized Dirac HUD**: Every 3D state change MUST concurrently update its mathematical representation ($\vert{}\psi\rangle = \alpha\vert{}0\rangle + \beta\vert{}1\rangle$) and probability bars in `MathDock.tsx`.
4. **Zero-Spoiler Gamification UX**: In measurement flows, student predictions and physical observations remain strictly separated until the user explicitly triggers measurement collapse.
5. **Strict TypeScript**: Zero implicit `any`. All store actions and physics helpers must enforce explicit parameter and return types.

---

## 3. Scientific & Mathematical Invariants (`src/core/`)
All math implementations must deterministically satisfy these exact pedagogical models:

- **Bloch Sphere & Born Rule (`qubitMath.ts`)**:
  - $\theta \in [0, \pi]$, $\phi \in [0, 2\pi]$.
  - $\alpha = \cos(\theta / 2)$, $\beta = \sin(\theta / 2)$.
  - $P(\vert{}0\rangle) = \vert{}\alpha\vert{}^2$, $P(\vert{}1\rangle) = \vert{}\beta\vert{}^2$, enforcing $P(\vert{}0\rangle) + P(\vert{}1\rangle) = 1.0$ ($100\%$).
- **Bell State Entanglement (`qubitMath.ts`)**:
  - $\vert{}\Phi^+\rangle = \frac{1}{\sqrt{2}}(\vert{}00\rangle + \vert{}11\rangle)$ ($50\%$ $\vert{}00\rangle$, $50\%$ $\vert{}11\rangle$).
  - Measuring the local qubit deterministically collapses the distant qubit to the identical bit ($0 \leftrightarrow 0$ or $1 \leftrightarrow 1$, zero $\vert{}01\rangle/\vert{}10\rangle$ outcomes).
- **Cryogenic Decoherence (`decoherenceMath.ts`)**:
  - Physical range: $15\text{ mK}$ ($0.015\text{ K}$) to $300\text{ K}$ ($300,000\text{ mK}$) with explicit unit conversion.
  - Coherence time: $T_2(T) = 250 \cdot e^{-T / 800}\text{ }\mu\text{s}$.
- **Didactic Algorithms (`algorithms.ts`)**:
  - **Grover (Mission 4)**: Iterative oracle phase flip + diffusion inversion about the mean.
  - **Shor (Mission 5)**: Transparent $N = 15$ factoring for coprime bases $a \in \{2, 7, 8, 11, 13\}$ via $a^x \pmod{15}$, period $r$, and $\gcd(a^{r/2} \pm 1, 15)$. Never claim real RSA-2048 execution.
  - **3-Qubit QEC (Mission 6)**: Logical encoding $\vert{}\psi\rangle \to \alpha\vert{}000\rangle + \beta\vert{}111\rangle$, single-wire bit-flip injection, syndrome measurement, and $100\%$ fidelity recovery.

---

## 4. Pareto MVP User Stories Traceability (`HU-MVP-01` to `HU-MVP-10`)
| ID | User Story Scope | Primary Owner Files |
| :--- | :--- | :--- |
| **HU-MVP-01** | Interactive 3D Bloch Sphere & $\theta, \phi$ Vector Animation | `features/quantum-core/BlochViewport.tsx`, `blochSceneObjects.ts`, `store/useQuantumStore.ts` |
| **HU-MVP-02** | Real-Time Synchronized Dirac Math HUD ($\alpha, \beta, P_0, P_1$) | `features/quantum-core/MathDock.tsx`, `core/qubitMath.ts` |
| **HU-MVP-03** | Superposition, Measurement Collapse & Zero-Spoiler Prediction | `features/missions/MissionWorkspace.tsx`, `FoundationsControls.tsx`, `store/useQuantumStore.ts` |
| **HU-MVP-04** | Bell State $\Vert{}\Phi^+\rangle$ Entanglement Visual Correlation | `features/quantum-core/EntanglementOverlay.tsx`, `core/qubitMath.ts` |
| **HU-MVP-05** | Cryogenic Thermal Decoherence ($T_2$) Simulation ($15\text{ mK} - 300\text{ K}$) | `core/decoherenceMath.ts`, `features/quantum-core/MathDock.tsx`, `blochSceneObjects.ts` |
| **HU-MVP-06** | Grover's Search Amplitude Amplification (<90s step flow) | `core/algorithms.ts`, `features/missions/AlgorithmControls.tsx` |
| **HU-MVP-07** | Shor's Algorithm Didactic Factorization ($N = 15$) | `core/algorithms.ts`, `features/missions/AlgorithmControls.tsx` |
| **HU-MVP-08** | 3-Qubit Quantum Error Correction (Bit-Flip Recovery) | `core/algorithms.ts`, `features/missions/AlgorithmControls.tsx` |
| **HU-MVP-09** | Unlocked "Free-Jump" Mission Selector (Missions 0–6) | `components/layout/AppShell.tsx`, `features/missions/missionRegistry.ts`, `store/useQuantumStore.ts` |
| **HU-MVP-10** | One-Click State Reset & Single WebGL Context Safety | `store/useQuantumStore.ts`, `features/quantum-core/BlochViewport.tsx` |

---

## 5. Script-per-Phase Execution Protocol
- **Pre-flight & Backups**: Verify `git status` and copy modified targets to `.backup_<phase>/` before running automated migrations.
- **TDD & Validation**: Run `npx vitest run` for `src/core/` and `src/store/` unit tests, plus `npm run build` and `npm run lint` before completing any phase.
- **Explicit Git Staging**: Stage modified files explicitly by path. Never run `git add -A`.