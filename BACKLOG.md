# Unified Project Backlog

## Epic 1: Architectural Consolidation & Core Refactoring
- [x] **CORE-01**: Consolidate core quantum types into `src/core/types/index.ts`.
- [x] **CORE-02**: Unify physics math modules into `src/core/math/` and verify zero-side-effect execution.
- [ ] **CORE-03**: Wrap circuit simulation and gate applications into a unified `QuantumEngine` pipeline.

## Epic 2: State Management & Engine Integration
- [ ] **STATE-01**: Create `useQuantumStore` to unify sandbox state and mission execution context.
- [ ] **STATE-02**: Deprecate duplicated state hooks in favor of unified store subscriptions.
- [ ] **STATE-03**: Streamline session persistence and user progress saving in `sessionService.ts`.

## Epic 3: 3D Visualization & WebGL Optimization
- [ ] **3D-01**: Refactor `QuantumViewport` to rely solely on declarative React R3F scenes.
- [ ] **3D-02**: Consolidate particle pools and measurement burst handlers for WebGL context safety.
- [ ] **3D-03**: Deprecate redundant imperative scene builders (`createBlochSphereScene.ts`).

## Epic 4: UI Design System & Layout Simplification
- [x] **UI-01**: Unify layout wrappers (`LeanLabLayout`, `PageContainer`) into a consolidated `<AppShell />`.
- [ ] **UI-02**: Audit and standardize UI primitives in `src/components/ui/` with uniform design tokens.
- [ ] **UI-03**: Verify responsive navigation and command palette behavior across screen breakpoints.

## Epic 5: Quality Assurance & Performance Baselines
- [x] **QA-01**: Update Vitest unit and component tests to match consolidated module paths.
- [ ] **QA-02**: Run Playwright E2E and visual regression test suites to verify zero user-facing regressions.
- [ ] **QA-03**: Execute `audit-performance.ts` script to establish post-consolidation execution baselines.
