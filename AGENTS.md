# AGENTS.md — Solo-Developer Architecture & Operational Guidelines

## 1. Core Architectural Philosophy (Solo-Dev & Brilliant-Style UX)

QuantumLab 3D uses a **4-Layer Flat Feature Architecture** optimized for a single developer. Every change prioritizes low cognitive load, deterministic physics, WebGL performance, and a polished educational user experience comparable to platforms like Brilliant.org.

### File Size & Complexity Guardrails

* **Hard Line Limit**: No file may exceed **250 LOC** (ideal target: **80–180 LOC**).
* **Folder Density**: Maximum **4–5 files per directory**. Avoid deeply nested sub-folders or barrel (`index.ts`) re-exports unless strictly necessary.
* **Strict Layer Separation**:
1. `src/core/` — **Pure Quantum Physics & Math**: Framework-agnostic TypeScript. Zero React, Three.js, or DOM dependencies.
2. `src/store/` — **Reactive State (`useQuantumStore.ts`)**: Single Zustand store managing state vector angles ($\theta, \phi$), thermal decoherence ($T_2$), mission progression, unlock flags, and audio settings.
3. `src/features/quantum-core/` — **WebGL 3D Engine & Math HUD**: Single-canvas WebGL renderer (`BlochViewport.tsx`, `blochSceneObjects.ts`) providing smooth camera transitions and real-time Dirac math HUD (`MathDock.tsx`).
4. `src/features/missions/` & `src/app/` — **Pedagogical Flow & Navigation**: Game-like mission roadmap, focused interactive workspaces, sandbox lab unlock, celebration overlays, and top-level App Shell.



---

## 2. Non-Negotiable Engineering & WebGL Principles

1. **Unified State Routing**: All state updates ($\theta, \phi, T_2$, current mission, roadmap progress, prediction locks) MUST route through `useQuantumStore.ts`.
2. **Single WebGL Context Safeguard**: Exactly **one** Three.js `WebGLRenderer` instance exists throughout the app session (`BlochViewport.tsx`). Switching missions or entering the Sandbox Lab updates uniforms and vector geometries without unmounting or recreating the WebGL context.
3. **Synchronized Dirac HUD**: Any 3D movement on the Bloch sphere must immediately update the Dirac notation ($\vert{}\psi\rangle = \alpha\vert{}0\rangle + \beta\vert{}1\rangle$) and Born rule probability indicators concurrently.
4. **Focused Workspace UX**: Mission screens show only the controls required to interact with the 3D visualization and discover the specific quantum concept. Secondary telemetry remains collapsed in the HUD to prevent UI fatigue.
5. **Zero-Spoiler Gamification**: In measurement exercises, student predictions and real physical observations remain strictly separated until the user clicks the explicit measurement trigger.

---

## 3. Design System & Design Tokens (`globals.css`)

* **Theme**: Cyber-Academic Dark Minimal (deep void background `#090d16`, neon cyan `#00f3ff`, quantum purple `#a855f7`, success emerald `#10b981`).
* **Typography**: Crisp mono-spaced numeric data with readable sans-serif headings and body text.
* **Glassmorphism Tokens**: Backdrop blur utilities (`backdrop-blur-md`), dark border accents (`border-white/10`), subtle glow shadows (`shadow-[0_0_20px_rgba(0,243,255,0.15)]`).
* **Web Audio Integration**: Procedural audio feedback for vector snaps, gate execution, and mission completion using the Web Audio API (`NEXT_PUBLIC_ENABLE_AUDIO=true`).

---

## 4. Scientific & Mathematical Invariants (`src/core/`)

* **Bloch Sphere & Born Rule (`qubitMath.ts`)**:
* $\theta \in [0, \pi]$, $\phi \in [0, 2\pi]$.
* $\alpha = \cos(\theta / 2)$, $\beta = \sin(\theta / 2)$.
* $P(\vert{}0\rangle) = \vert{}\alpha\vert{}^2$, $P(\vert{}1\rangle) = \vert{}\beta\vert{}^2$, enforcing $P(\vert{}0\rangle) + P(\vert{}1\rangle) = 1.0$ ($100\%$).


* **Bell State Entanglement (`qubitMath.ts`)**:
* $\vert{}\Phi^+\rangle = \frac{1}{\sqrt{2}}(\vert{}00\rangle + \vert{}11\rangle)$ ($50\%$ $\vert{}00\rangle$, $50\%$ $\vert{}11\rangle$).
* Measuring the primary qubit deterministically collapses the distant qubit to the identical state ($0 \leftrightarrow 0$ or $1 \leftrightarrow 1$, zero $\vert{}01\rangle/\vert{}10\rangle$ leakage).


* **Cryogenic Decoherence (`decoherenceMath.ts`)**:
* Physical range: $15\text{ mK}$ ($0.015\text{ K}$) to $300\text{ K}$ ($300,000\text{ mK}$) with explicit unit conversion.
* Coherence time: $T_2(T) = 250 \cdot e^{-T / 800}\text{ }\mu\text{s}$.


* **Didactic Algorithms (`algorithms.ts`)**:
* **Grover (Mission 4)**: Oracle phase inversion + diffusion amplification.
* **Shor (Mission 5)**: Didactic $N = 15$ period-finding for $a \in \{2, 7, 8, 11, 13\}$ via $a^x \pmod{15}$, period $r$, and $\gcd(a^{r/2} \pm 1, 15)$.
* **3-Qubit QEC (Mission 6)**: Logical encoding $\vert{}\psi\rangle \to \alpha\vert{}000\rangle + \beta\vert{}111\rangle$, single-wire bit flip, parity syndrome measurement, and recovery.



---

## 5. Pareto MVP User Stories Traceability (`HU-MVP-01` to `HU-MVP-14`)

| ID | User Story Scope | Primary Owner Files |
| --- | --- | --- |
| **HU-MVP-01** | Interactive 3D Bloch Sphere & Vector Animation | `features/quantum-core/BlochViewport.tsx`, `blochSceneObjects.ts` |
| **HU-MVP-02** | Real-Time Synchronized Dirac Math HUD ($\alpha, \beta, P_0, P_1$) | `features/quantum-core/MathDock.tsx`, `core/qubitMath.ts` |
| **HU-MVP-03** | Superposition, Measurement Collapse & Zero-Spoiler Prediction | `features/missions/MissionWorkspace.tsx`, `FoundationsControls.tsx` |
| **HU-MVP-04** | Bell State $\vert{}\Phi^+\rangle$ Entanglement Visual Correlation | `features/quantum-core/EntanglementOverlay.tsx`, `core/qubitMath.ts` |
| **HU-MVP-05** | Thermal Decoherence ($T_2$) Simulation ($15\text{ mK} - 300\text{ K}$) | `core/decoherenceMath.ts`, `features/quantum-core/MathDock.tsx` |
| **HU-MVP-06** | Grover's Search Amplitude Amplification (<90s step flow) | `core/algorithms.ts`, `features/missions/AlgorithmControls.tsx` |
| **HU-MVP-07** | Shor's Algorithm Didactic Factorization ($N = 15$) | `core/algorithms.ts`, `features/missions/AlgorithmControls.tsx` |
| **HU-MVP-08** | 3-Qubit Quantum Error Correction (Bit-Flip Recovery) | `core/algorithms.ts`, `features/missions/AlgorithmControls.tsx` |
| **HU-MVP-09** | Unlocked "Free-Jump" Navigation (Missions 0–6) | `components/layout/AppShell.tsx`, `store/useQuantumStore.ts` |
| **HU-MVP-10** | Single WebGL Context Safety & Fast Parameter Reset | `store/useQuantumStore.ts`, `features/quantum-core/BlochViewport.tsx` |
| **HU-MVP-11** | Interactive Game-Like Roadmap & Level Progression | `app/page.tsx`, `features/missions/MissionRoadmap.tsx` |
| **HU-MVP-12** | Brilliant-Style Focused Workspace & Smooth WebGL Camera Animations | `features/missions/MissionWorkspace.tsx`, `BlochViewport.tsx` |
| **HU-MVP-13** | Course Completion Celebration & Sandbox Lab Unlock | `components/ui/CelebrationModal.tsx`, `app/sandbox/page.tsx` |
| **HU-MVP-14** | Design Tokens Refactor & Web Audio Synthesizer Cues | `app/globals.css`, `lib/soundEngine.ts` |

---

## 6. Script-per-Phase Execution Protocol

1. **Pre-flight Check**: Ensure clean working directory (`git status`).
2. **Atomic Target Backup**: Create `.backup_<phase>/` before performing modifications.
3. **Sequential Execution**: Run migration scripts step-by-step with clean output logging.
4. **Validation Suite**: Execute `npx vitest run`, `npm run lint`, and `npm run build`.
5. **Controlled Git Staging**: Stage explicitly specified files only. Never use `git add -A`.