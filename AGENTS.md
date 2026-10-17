# AGENTS.md — QuantumLab 3D Engineering Guidelines

## 1. Philosophy

QuantumLab 3D is a **tactical 3D quantum simulation engine**, not a web page. Priorities: high developer velocity, deterministic physics, single-context WebGL performance, and a flight-deck gaming UX.

### Complexity Guardrails

* **File size**: soft ideal **150–350 LOC**, hard cap **500 LOC**. Do not split files artificially.
* **Flat hierarchy**: shallow folders, group by feature, avoid barrel files and deep nesting.
* **Co-locate** related UI controls, store actions, and view logic to minimize file hopping.

---

## 2. Architecture Layers

1. **`src/core/`** — Pure physics/math. Framework-agnostic TypeScript. Zero React / Three.js / DOM.
2. **`src/store/useQuantumStore.ts`** — Single Zustand store. Owns view state (`TITLE` | `CAMPAIGN_SELECT` | `IN_MISSION` | `SANDBOX`), qubit state ($\theta, \phi$), cryo params ($T_2$), locale (`en`/`es`), HUD modals, mission progression.
3. **`src/features/quantum-core/` + `src/features/missions/`** — WebGL renderer (`BlochViewport.tsx`), raycasting gizmos, shader overlays, mission step panels.
4. **`src/components/` + `src/app/`** — Overlays (Title, Mission Selector, Pause/Options), HUD panels, design tokens, App Shell.

---

## 3. Non-Negotiable Engine Principles

1. **Unified state routing** — every mutation goes through `useQuantumStore.ts`.
2. **Single WebGL context** — exactly one `WebGLRenderer` for the session. Mode switches update camera + meshes; never unmount the canvas.
3. **Clear tactical viewport** — HUD floats on the perimeter; center 90%+ stays free for 3D interaction.
4. **Real-time Dirac + Born sync** — vector rotation updates $\lvert\psi\rangle$ and $P_0, P_1$ instantly.
5. **Dual themes** — Obsidian Dark Cryostat (`#0B0E14`) and Cleanroom Light Lab (`#F4F6F9`); WCAG AA typography, sharp 1px borders.
6. **Built-in i18n** — EN / ES via store selectors, no external translation bundles.
7. **Zero-spoiler gamification** — prediction and observation stay separated until the explicit measure action.

---

## 4. Scientific Invariants (`src/core/`)

* **Bloch & Born (`qubitMath.ts`)**: $\theta \in [0,\pi]$, $\phi \in [0,2\pi]$; $\alpha=\cos(\theta/2)$, $\beta=\sin(\theta/2)e^{i\phi}$; $P_0=|\alpha|^2$, $P_1=|\beta|^2$, $P_0+P_1=1$.
* **Bell state**: $\lvert\Phi^+\rangle = \tfrac{1}{\sqrt 2}(\lvert 00\rangle + \lvert 11\rangle)$; measuring A collapses B with perfect correlation.
* **Decoherence (`decoherenceMath.ts`)**: $T \in [15\text{ mK}, 300\text{ K}]$; $T_2(T) = 250\,e^{-T/800}\ \mu\text{s}$.
* **Algorithms (`algorithms.ts`)**:
  * Grover — oracle phase inversion + diffusion amplification.
  * Shor — $N=15$ period finding, $\gcd(a^{r/2}\pm 1, 15)$.
  * 3-Qubit QEC — encode $\alpha\lvert 000\rangle + \beta\lvert 111\rangle$, syndrome detect, bit-flip recovery.

---

## 5. Design Tokens (`globals.css`)

* Cyber-academic dark default: void `#0B0E14`, neon cyan `#00F3FF`, quantum purple `#A855F7`, success emerald `#10B981`.
* Mono-spaced numerics, sans-serif headings/body.
* Glassmorphism: `backdrop-blur-md`, `border-white/10`, glow via `shadow-[0_0_20px_rgba(0,243,255,0.15)]`.
* Web Audio cues for snaps, gates, and mission completion (`NEXT_PUBLIC_ENABLE_AUDIO=true`).

---

## 6. Execution Protocol

1. **Pre-flight**: clean `git status`.
2. **Backup**: create `.backup_<phase>/` before edits.
3. **Atomic edits**: one logical change at a time.
4. **Validate**: `npm run test` (vitest), `npm run lint`, `npm run build`.
5. **Stage explicitly**: never `git add -A`.

---

## 7. MVP Traceability

| ID | Scope | Primary Files |
| --- | --- | --- |
| HU-MVP-01 | Interactive Bloch sphere & vector animation | `quantum-core/BlochViewport.tsx`, `blochSceneObjects.ts` |
| HU-MVP-02 | Synchronized Dirac + Born HUD | `quantum-core/MathDock.tsx`, `core/qubitMath.ts` |
| HU-MVP-03 | Superposition, collapse, zero-spoiler prediction | `missions/MissionWorkspace.tsx`, `FoundationsControls.tsx` |
| HU-MVP-04 | Bell-state entanglement correlation | `quantum-core/EntanglementOverlay.tsx`, `core/qubitMath.ts` |
| HU-MVP-05 | Thermal decoherence ($15\text{ mK}$–$300\text{ K}$) | `core/decoherenceMath.ts`, `MathDock.tsx` |
| HU-MVP-06 | Grover amplitude amplification | `core/algorithms.ts`, `missions/AlgorithmControls.tsx` |
| HU-MVP-07 | Shor didactic $N=15$ factorization | `core/algorithms.ts`, `AlgorithmControls.tsx` |
| HU-MVP-08 | 3-qubit QEC bit-flip recovery | `core/algorithms.ts`, `AlgorithmControls.tsx` |
| HU-MVP-09 | Free-jump navigation (Missions 0–6) | `components/layout/AppShell.tsx`, `store/useQuantumStore.ts` |
| HU-MVP-10 | Single WebGL context safety + fast reset | `store/useQuantumStore.ts`, `BlochViewport.tsx` |
| HU-MVP-11 | Game-like roadmap & progression | `app/page.tsx`, `missions/MissionRoadmap.tsx` |
| HU-MVP-12 | Focused workspace + smooth camera transitions | `missions/MissionWorkspace.tsx`, `BlochViewport.tsx` |
| HU-MVP-13 | Completion celebration & Sandbox unlock | `components/ui/CelebrationModal.tsx`, `app/sandbox/page.tsx` |
| HU-MVP-14 | Design tokens + Web Audio cues | `app/globals.css`, `lib/soundEngine.ts` |