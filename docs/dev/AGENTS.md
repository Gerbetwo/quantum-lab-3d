# Agent Execution Guidelines & Architecture Standards

## Architectural Vision
This project is built on a **4-Layer Unified Architecture** designed for high performance, deterministic quantum state simulations, and clean maintainability.

### Architecture Overview
1. **Core Domain (`src/core/`)**: Framework-agnostic pure quantum physics engine and algorithm calculations.
2. **Application State (`src/store/`)**: Centralized reactive state orchestration managing quantum circuits, step execution, session persistence, and mission state transitions.
3. **Feature Modules (`src/features/`)**: High-level domain capabilities (`circuit`, `quantum-3d`, `missions`).
4. **UI & Layout System (`src/components/`)**: Atomic UI component primitives and structural layout shells (`AppShell`).

---

## Code Base Map
```
src/
├── app/                    # Next.js App Router endpoints
├── components/             # Reusable UI components & layouts
│   ├── layout/             # AppShell, Header, CommandPalette
│   └── ui/                 # Design system UI primitives
├── core/                   # Physics engine & algorithm math
│   ├── algorithms/         # Grover, Shor, Quantum Error Correction
│   ├── math/               # Statevector, Gates, Bloch vectors, Decoherence
│   ├── types/              # Unified core quantum type system
│   └── index.ts            # Core API entry point
├── features/               # High-level domain features
│   ├── circuit/            # Circuit grid, palette, & 2D viewports
│   ├── missions/           # Mission state machine & registry
│   └── quantum-3d/         # Unified 3D WebGL Bloch sphere renderer
└── store/                  # Application state stores & persistence
```
