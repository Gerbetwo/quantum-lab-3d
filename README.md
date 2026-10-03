# QuantumLab 3D — Experimental Interactive Platform

> A high-performance, interactive 3D WebGL platform for educational experimentation in Quantum Computing basics (Qubits, Superposition, Entanglement, and Decoherence). Built with **Next.js 15**, **Three.js**, **Tailwind CSS**, and **TypeScript**.

[![Next.js](https://img.shields.io/badge/Next.js-15.1-black?logo=next.js)](https://nextjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-0.171-orange?logo=three.js)](https://threejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 🔬 Experimental Research Overview

This application serves as the **Experimental Intervention Condition** for an empirical study comparing traditional lecture instruction (Master Class) against **Active 3D Interactive Discovery Learning**.

### Pedagogical Strategy: Active Discovery (Zero Spoilers)
Rather than displaying passive walls of text that spoon-feed exam answers, students directly manipulate quantum variables in real-time 3D:
1. **Mission 1: Superposition & Wavefunction Collapse** — Interactive 3D Bloch sphere and quantum coin. Students adjust angle $\theta$ and trigger the measurement scanner to observe physical state collapse to $|0\rangle$ or $|1\rangle$.
2. **Mission 2: Quantum Entanglement (Bell States)** — Interplanetary space orbit featuring Station Alice (Earth) and Station Bob (Andromeda). Students measure Alice's qubit and observe instantaneous non-local correlation across light-years without signal travel.
3. **Mission 3: Cryogenics & Thermal Decoherence** — 3D Dilution Refrigerator cryostat chandelier. A temperature slider ($0.015\text{ K} \to 300\text{ K}$) allows students to witness thermal particle bombardment destroying quantum coherence.
4. **Mission 4: Real-World Applications Matrix** — Holographic 3D models of molecular drug simulation, combinatorial route optimization, and quantum cryptography.

---

## 🚀 Technical Highlights

- **Session & Metrics Tracking (Cookies):** Each student is assigned a persistent unique identifier (`QL-XXXXX`). Time spent, interaction counts, and stage progression are recorded automatically for post-hoc empirical analysis.
- **Web Audio API Sound Engine:** 100% synthesized procedural sound effects (laser scan, quantum collapse, chime alerts) with zero external audio assets.
- **10-Minute Timed Session:** Integrated countdown timer to ensure controlled 10-minute intervention windows.
- **Ultra-Lightweight & Responsive:** Static build bundle size $< 250\text{ KB}$ running at a smooth 60 FPS on both mobile and desktop.

---

## 🛠️ Getting Started Locally

```bash
# Clone the repository
git clone https://github.com/<your-username>/quantum-lab-3d.git

# Enter project directory
cd quantum-lab-3d

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Deployment on Vercel

The application is optimized for zero-configuration deployment on **Vercel**:

```bash
npx vercel
```

---

## Testing Strategy

La plataforma se apoya en **cinco capas** de tests.

### 1. Unit (`tests/unit/`)
- **Que:** reglas de dominio cuantico puras (`bloch`, `measurement`, `entanglement`, `decoherence`, `applications`) y utilidades de persistencia.
- **Runner:** Vitest + jsdom.
- **Convencion:** RNG inyectable, sin tocar `Math.random()` real.
- **Cobertura:** 100% en `src/domain/quantum/**`.

### 2. Component (`tests/component/`)
- **Que:** render y comportamiento de las 4 misiones, `Header`, `CelebrationModal`.
- **Queries:** roles y nombres accesibles por defecto; `data-testid` solo cuando no hay alternativa semantica (ver `AGENTS.md` seccion 25).
- **Mocks:** Web Audio y WebGL stubbeados en `tests/helpers/webgl-stub.ts`.

### 3. Integration (`tests/integration/`)
- **Que:** `page.tsx` orquestando las 4 misiones mockeadas con `React.lazy` resuelto.
- **Verifica:** orden de `saveCompletedMission(0..3)`, transicion de tabs, aparicion del modal final.

### 4. E2E (`tests/e2e/`)
- **Runner:** Playwright (Chromium).
- **Page Object Model** (`tests/e2e/pages/`): specs sin locators inline.
- **Specs:**
  - `smoke.spec.ts` - landing + arranque.
  - `critical-flow.spec.ts` - jornada completa (< 40 lineas).
  - `console-audit.spec.ts` - errores + warnings + 404s.
  - `visual-regression.spec.ts` - env-gated (`RUN_VISUAL=1`).

### 5. Visual Regression (`npm run test:visual`)
- Opt-in: sin baselines versionadas aun (ver DT-05 en `BACKLOG.md`).
- Al activarse: usa `mask` para elementos volatiles (userId, timer) y `animations: 'disabled'`.

### Coverage Thresholds
Declarados en `vite.config.ts`. `npm run test:coverage` falla si bajan:
- `src/domain/**`: **95%** statements / **90%** branches.
- `src/lib/**`: **85%** statements / **80%** branches.
- `src/lib/three/**`: excluido (infra WebGL, validado por E2E).

### Reglas de test
1. Red-Green-Refactor para HUs nuevas (ver `AGENTS.md` secciones 5-7).
2. Nunca `Math.random()` directo - inyectar `random: () => number`.
3. Nunca `getByTitle` - usar `getByRole` o `data-testid` (ver `AGENTS.md` seccion 25).
4. Un `data-testid` por concepto, no por clase CSS.

---

## Architecture

```text
src/
|-- app/                       # Next.js App Router
|   |-- layout.tsx
|   |-- page.tsx               # Orquestador: timer, tabs, misiones lazy, celebration
|   \-- globals.css
|
|-- components/
|   |-- Header.tsx             # Memoizado por seccion (Brand/UserBadge/TimerDisplay)
|   |-- CelebrationModal.tsx   # Focus trap + role=dialog + prefers-reduced-motion
|   \-- missions/              # 4 misiones, cada una consume useThreeScene
|
|-- domain/quantum/            # <- PURO, sin React, sin Three.js
|   |-- bloch.ts               # |0> / |1> amplitudes y probabilidades
|   |-- measurement.ts         # measureQubit(theta, random) inyectable
|   |-- entanglement.ts        # correlateEntangledMeasurement(outcome)
|   |-- decoherence.ts         # calculateCoherenceTime(T), isCriticalDecoherence
|   \-- applications.ts        # formatShorResult, updateExploredApplications
|
|-- hooks/
|   \-- useThreeScene.ts       # React wrapper del ciclo de vida WebGL
|
\-- lib/
    |-- cookies.ts             # Persistencia: userID, progreso, metricas, activeTab
    |-- sound.ts               # Web Audio sintetizado + gate por gesto + env
    \-- three/
        \-- createScene.ts     # Infra Three.js: setAnimationLoop, culling, cached()
```

### Fronteras

| Capa | Puede importar de | NO puede importar de |
| :--- | :--- | :--- |
| `domain/quantum/**` | (nada) | React, Three.js, `lib/` |
| `hooks/**` | `lib/three/**` | `components/**`, `domain/**` |
| `components/**` | `domain/**`, `hooks/**`, `lib/**` | (nada prohibido) |
| `lib/**` | `lib/**` | `components/**`, `hooks/**` |

### Convenciones clave

- **Domain purity:** ninguna funcion en `domain/quantum/**` toca `window`, `Math.random()`, ni `Date.now()`. Todo es determinista con inputs explicitos.
- **RNG inyectable:** `measureQubit(theta, random = Math.random)` - los tests pasan `() => 0.2`.
- **Scene lifecycle:** toda escena WebGL pasa por `useThreeScene`. Nunca se instancia `WebGLRenderer` fuera de `createScene`.
- **Shared geometries:** `cached('key', () => new Geometry())` para geometrias reutilizables. `dispose()` las respeta via `userData.__shared`.
- **Cookie writes:** siempre via `updateStoredMetrics` o `saveCompletedMission` - nunca `Cookies.set` directo en componentes.


## v0.3.0 features
- **Nuevas Misiones Cuánticas**: Modo de aprendizaje guiado ampliado (misiones 0 a 3).
- **Persistencia Per-Misión y Exportación JSON**: Guardado local y exportación portátil del estado de la sesión (`.json`).
- **Auditoría Responsive y Accesibilidad**: Cobertura E2E con Playwright y `@axe-core/playwright` (WCAG 2.1 AA) en viewports 1920, 1280, 768 y 375px.
- **Control Presupuestario de Bundle**: Medición con `@next/bundle-analyzer` y gate automatizado (<300 KB gzip).
