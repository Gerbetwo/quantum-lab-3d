# Prompt for the Next AI / Developer

Copy this as the system prompt or first message when continuing work on this repository.

## Project context

You are working on **QUANTUM CORE LAB**, an educational quantum-computing web app for a masterclass.

Before changing code, read:

1. `Agent.md` — TDD, architecture, coding and workflow rules.
2. `Backlog_Priorizado.md` — current HUs, technical debt and planned work.
3. `Requisitos_Segmentados.md` — functional, non-functional, data and UI/UX requirements.

Also inspect the current code before implementing anything. Never assume that the documentation is newer than the code.

## Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Three.js
- Lucide React
- Vitest + React Testing Library
- Playwright for E2E
- Browser cookies for local progress/metrics
- Vercel-compatible deployment

Use **TypeScript (`.ts` / `.tsx`)**, not Python scripts.

## Implementation workflow

When the user requests an HU, phase or group of changes:

1. Inspect the current state:
   - `git status`
   - recent commits
   - relevant source files
   - existing tests
2. Identify the exact scope and affected modules.
3. Implement using **Red -> Green -> Refactor**.
4. Keep changes small and focused.
5. Run the relevant tests after each logical step.
6. Run the full validation before finishing:
   - unit/component tests
   - E2E tests when relevant
   - `npm run lint`
   - `npm run build`
7. Report what changed, tests executed and any remaining issues.
8. Stop and wait for the user's output/approval before starting the next phase.

Do not create a monolithic `script.py` or migration script.

## Core rules

- TDD: write the failing test first, then minimum implementation, then refactor.
- TypeScript strictness must be preserved.
- Prefer deterministic, testable domain logic over logic embedded in UI components.
- Inject randomness/time when needed for deterministic tests.
- Keep browser-only APIs inside client-safe boundaries.
- Keep persistence logic isolated from presentation.
- Reuse existing utilities before adding dependencies.
- Do not add a dependency unless it has a clear benefit.
- Avoid unrelated refactors.
- Preserve existing behavior unless the requested change explicitly modifies it.
- Keep user-facing UI text in Spanish unless the existing requirement says otherwise.
- Use English for code identifiers, types, functions, files and tests.
- Keep quantum/math behavior explicit and testable.
- Do not fake scientific behavior merely to make a test pass.

## Architecture guidance

Prefer this separation:

- `src/app/` — routes, layouts and page composition.
- `src/components/` — reusable UI and mission components.
- `src/lib/` — domain logic, persistence, audio and utilities.
- `src/lib/**/*.test.ts` — unit tests.
- `src/components/**/*.test.tsx` — component tests.
- `tests/e2e/` — Playwright tests.

When a component contains complex state or scientific logic, extract pure functions/types into `src/lib/` when doing so improves testability.

Do not introduce a backend/database unless the requirement actually needs shared server-side data.

## Current product model

The app contains four missions:

1. **Superposition**
   - classical bit
   - qubit / Dirac notation
   - Bloch sphere
   - measurement and collapse
   - quiz

2. **Entanglement**
   - independent qubits
   - Bell pair
   - distance
   - correlated measurement
   - quiz

3. **Decoherence**
   - thermal noise
   - temperature
   - dilution refrigerator / cryogenic shield
   - decoherence
   - quiz

4. **Applications**
   - quantum myths
   - molecular simulation
   - Shor / cryptography
   - final quiz

The app also has:

- a 10-minute timer
- mission navigation/progress
- local cookie-based progress
- local metrics
- procedural audio
- responsive Three.js visualizations
- final completion modal

Treat the existing code as the source of truth for exact current behavior.

## Testing rules

Every new behavior should have tests.

Prefer:

- pure unit tests for calculations/state transitions
- React Testing Library for component behavior
- Playwright for critical user flows

Tests must verify behavior, not implementation details.

For randomness, timers and browser APIs, use deterministic mocks/injection rather than relying on real randomness or real time.

Examples:

```ts
describe("calculateMeasurementProbability", () => {
  it("returns cos(theta / 2)^2 for state |0>", () => {
    expect(calculateMeasurementProbability(Math.PI / 2)).toBeCloseTo(0.5)
  })
})
```

```tsx
it("completes the mission when the correct answer is selected", async () => {
  // arrange
  // act
  // assert
})
```

## Validation

Before declaring a phase complete, run the appropriate checks:

```bash
npm test
npm run lint
npm run build
```

For E2E work:

```bash
npx playwright test
```

If a command does not exist yet, do not silently invent a result. State that the project needs the corresponding test script/tool setup.

## Git rules

- One focused commit per logical phase when the user asks for commits.
- Commit messages should reference the HU/phase.
- Never suggest `git add -A`.
- List changed files explicitly when giving commit commands.
- Never reset, discard or overwrite unrelated user work.
- Do not commit unless explicitly requested.

## Idempotency and safety

Before editing, understand the current working tree.

Never overwrite unrelated changes.

If an implementation partially fails, leave the repository in a recoverable state and clearly report what changed.

Do not create backups of every file by default. Git is the primary version-control mechanism; create manual backups only when the operation genuinely requires them.

## When receiving a request

If the request is clear:

1. inspect the relevant code/docs;
2. identify the smallest implementation scope;
3. write/update tests first;
4. implement;
5. refactor;
6. validate;
7. summarize changed files and results.

If an essential requirement is ambiguous, ask one focused question before modifying code.

Do not invent new architecture when the existing project can support the requirement cleanly.

## Important current technical notes

The project currently has no complete test infrastructure in the original snapshot, so verify the actual repository state before assuming Vitest/Playwright scripts already exist.

Known areas that deserve attention during implementation:

- timer expiration behavior
- persistence correctness
- mission metrics and `missionTimes`
- deterministic measurement tests
- Three.js cleanup/resizing
- browser-only APIs
- `next.config.ts` build/lint settings
- consistency between documentation and the actual Next.js version

The goal is a **small, testable, production-ready educational app**, not an unnecessary rewrite.
