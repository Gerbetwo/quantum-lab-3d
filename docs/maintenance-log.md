# Maintenance Log - v0.2.0

**Periodo:** ciclo de mantenimiento ejecutado con protocolo `script-per-phase`.
**Tag inicial:** `baseline-pre-maintenance`
**Tag final:** `v0.2.0-maintenance`
**Fases:** 0-8 (9 fases secuenciales)

---

## Resumen ejecutivo

Ciclo de mantenimiento completo sobre QuantumLab 3D siguiendo el protocolo descrito en `PROMPT_FOR_NEXT_AI_REFACTORED.md`: cada fase se implemento como un script standalone idempotente con pre-flight, backup, pasos numerados, rollback automatico y validate final.

**Metricas antes/despues:**

| Metrica | Pre (v0.1.0) | Post (v0.2.0) | Delta |
| :--- | ---: | ---: | ---: |
| Tests unit + component | 38 | 92 | +142% |
| Coverage domain | 100% | 100% | 0 |
| Coverage lib | ~45% | ~99% | +54 pp |
| E2E specs | 3 monoliticos | 4 (con POM + audit + visual) | +1 |
| Lineas en `critical-flow.spec.ts` | ~85 | 25 | -70% |
| a11y violations (axe) | desconocido | 0 en tests | - |

---

## Fases ejecutadas

### Fase 0 - Baseline freeze
- Tag `baseline-pre-maintenance` creado.
- Coverage snapshot en `docs/baseline-coverage.json`.
- **Descubrimiento:** `tsconfig.json` contenia `"ignoreDeprecations": "6.0"` invalido para TypeScript 5.9 -> rompia `tsc --noEmit`.

### Fase 1 - Config root sanitization
- `.gitignore`: removidas reglas sospechosas (`code*.txt`), anadidos `.env`, `.swc/`, `.turbo/`, `docs/` (un-ignored).
- `tsconfig.json`: removidos `tests`, `script.ts`, `vitest.setup.ts` de `exclude`. **Bug latente:** los tests nunca se typecheckeaban.
- **Descubrimiento:** al typechequear `tests/` aparecio `TS2339: Property 'toBeInTheDocument' does not exist`. Causa: `@testing-library/jest-dom` sin la variante `/vitest` no augmenta los matchers de Vitest.
- **Fix:** creado `tests/vitest.d.ts` con `import '@testing-library/jest-dom/vitest'`.
- `vitest.setup.ts` refactorizado; stubs WebGL movidos a `tests/helpers/webgl-stub.ts`.
- `next.config.ts`: `output: 'standalone'`, `optimizePackageImports`, `poweredByHeader: false`, security headers (CSP laxa).

### Fase 2 - Harden test network
- Helpers `queries.ts`, `rng.ts`, `renderWithProviders.tsx` creados.
- Step bar migrada a `role="tablist"` + `role="tab"` + `aria-selected`.
- 4 misiones con `data-testid` selectivos.
- Mission2: RNG inyectable via prop `__testRandom`.
- **Descubrimiento:** los specs E2E seguian usando `getByTitle('Ir al paso N')`, que la migracion a `role="tab"` elimino. El gate inicial solo escaneaba `tests/component/`.
- **Fix:** rewrite de los E2E + gate recursivo sobre `tests/**`.

### Fase 3 - Three.js refactor
- `createScene.ts` + `useThreeScene.ts` creados.
- 4 misiones migradas del useEffect monolitico al hook.
- **Descubrimiento (M3):** el `useEffect` original dependia de `[step, isCritical, temperatureMilliKelvin]` -> recreaba la escena WebGL en cada tick del slider. Migrado a `temperatureRef`.
- **Descubrimiento (patron):** regex de `useEffect` no matchea si la firma cambia. Anadido dry-run en pre-flight.

### Fase 4 - Bug fixes & anti-patterns
- `cookies.ts`: `DEFAULT_METRICS` congelado + `createDefaultMetrics()`. `MAX_COOKIE_SIZE_BYTES`. `getStoredActiveTab`/`saveActiveTab`. `deleteAllUserData`.
- `sound.ts`: `isAudioEnabled()` gate por `NEXT_PUBLIC_ENABLE_AUDIO`.
- `Header.tsx`: `memo` por seccion + skeleton con `aria-busy`.
- `page.tsx`: timer fix (`timeLeftRef` + separate effect), persistencia de `activeTab`, `showCelebration` derivado.
- `CelebrationModal.tsx`: `confetti.reset()` en cleanup.
- **Descubrimiento:** `vi.mock` factories se hoistean. Las variables referenciadas deben usar `vi.hoisted()`.
- **Fix:** `const { x, y } = vi.hoisted(() => ({ x: vi.fn(), y: vi.fn() }))`.

### Fase 5 - Expand test coverage
- `cookies-edge.test.ts` (17 tests), `missionFlow.test.tsx` (4 tests), persistence extendida.
- `sound.test.ts` ampliado a 12 tests.
- `vite.config.ts`: `coverage.exclude` (`src/lib/three/**`) + `thresholds`.
- **Descubrimiento:** `webgl-stub.ts` definia `AudioContext` sin `configurable: true` -> `delete` y `vi.stubGlobal` fallaban.
- **Fix:** `configurable: true` en ambas propiedades.

### Fase 6 - E2E Page Object Model
- 9 page objects.
- `critical-flow.spec.ts` reducido a 25 lineas no vacias.
- `console-audit.spec.ts`: errores + React warnings + 404s same-origin.
- `visual-regression.spec.ts`: env-gated (`RUN_VISUAL=1`).

### Fase 7 - Optimization & accessibility
- `createScene.ts`: `setAnimationLoop` + culling `document.hidden` + helper `cached()` con marker `userData.__shared`.
- `sound.ts`: gate por gesto + `__markUserInteracted()` para tests.
- `page.tsx`: `React.lazy` + `Suspense` para las 4 misiones.
- `Header.tsx`: cache `Map` en `formatTime`.
- 4 misiones: canvas `role="img"` + `aria-label`. Mission3: `aria-live="polite"` en `photon-counter`.
- `CelebrationModal.tsx`: focus trap + `role="dialog"` + `aria-modal` + Escape + restore focus.
- **Descubrimiento:** `disposeResource(undefined)` -> `Cannot read properties of undefined`. Los `Group` no tienen `geometry`.
- **Fix:** `if (!obj) return;` como primera linea.

### Fase 8 - Documentation & closure
- `AGENTS.md`: secciones 24 (Page Objects), 25 (data-testid rules).
- `BACKLOG.md`: 18 HUs de mantenimiento + 9 items de deuda tecnica.
- `README.md`: Testing Strategy + Architecture.
- `docs/maintenance-log.md`: este documento.
- `docs/coverage-baseline.json`: snapshot final.
- Tag `v0.2.0-maintenance`.

---

## Lecciones aprendidas

### L-01 - Vitest matcher augmentation
`import '@testing-library/jest-dom'` augmenta Jest. Para Vitest, la ruta correcta es `@testing-library/jest-dom/vitest`, declarada una vez en un `.d.ts` global.

### L-02 - vi.hoisted() en factories
Toda variable de test referenciada dentro de `vi.mock(() => ...)` debe declararse con `vi.hoisted()`. Las variables `const` normales se inicializan despues del hoisting de `vi.mock`.

### L-03 - configurable: true en globals stubbeados
`Object.defineProperty(window, 'X', { writable: true, value: ... })` **no** permite `delete` ni `vi.stubGlobal`. Anadir `configurable: true`.

### L-04 - Guard clauses en helpers que aceptan unknown
Toda helper que reciba `unknown` o tipos laxos de Three.js debe empezar con `if (!x) return;`. El `?.` no protege contra `undefined` como valor raiz.

### L-05 - Refs para valores leidos en hot loops
Un `useEffect(..., [step])` que captura `temperatureMilliKelvin` congela el valor. Si `onFrame` necesita leer fresco sin recrear, usar `temperatureRef.current`.

### L-06 - Anclar regex de useEffect a la firma exacta de deps
Si un `useEffect` depende de mas de `[step]`, un regex `\}, \[step\]\); ` no matchea. Dry-run de todos los regex en pre-flight antes de aplicar cambios.

### L-07 - Preservar exports congelados
Al refactorizar constantes compartidas (`DEFAULT_METRICS`), mantener el export original con `Object.freeze` para no romper imports, y anadir un factory (`createDefaultMetrics()`). Los tests existentes que usan `toEqual` siguen pasando.

### L-08 - POM sin sufijo .spec
Los Page Objects viven en `tests/e2e/pages/*.ts`. Si se nombran `*.spec.ts`, Playwright los trata como specs y falla.

### L-09 - Visual regression env-gated
`test.skip(!process.env.RUN_VISUAL, ...)`. Sin baselines versionadas, `toHaveScreenshot` falla la primera vez. Gate explicito evita romper CI en cada push.

### L-10 - data-testid como ultimo recurso
Siempre preferir `getByRole`. Anadir testids solo para: elementos sin semantica, texto volatil, o masking en visual regression.

---

## Deuda tecnica remanente

Ver `BACKLOG.md` -> "Deuda tecnica remanente conocida" (DT-01 a DT-09). Resumen por prioridad:

**Alta:**
- DT-08: `code.txt` (13 K lineas) trackeado en git.

**Media:**
- DT-01: CSP laxa (`'unsafe-inline'` + `'unsafe-eval'`).
- DT-09: `createScene.ts` sin unit tests dedicados.

**Baja:**
- DT-02: persistencia de escena entre steps 2<->3.
- DT-03: cache de `createTextSprite`.
- DT-04: bundle size sin gate automatico.
- DT-05: visual regression sin baselines en CI.
- DT-06: jsdom recreado por archivo de test.
- DT-07: sound oscillator pool.

---

## Puerta de calidad final

```bash
npm run validate
```

Resultado del ultimo run en `v0.2.0-maintenance`:
- `tsc --noEmit` -> PASS
- `eslint .` -> PASS
- `vitest run` -> 92/92 PASS
- `playwright test` -> 3 passed + 3 skipped (visual)
- `playwright test tests/e2e/console-audit.spec.ts` -> 1/1 PASS
- `next build` -> PASS

---

## Comandos utiles

```bash
# Suite completa
npm run validate

# Rapido (sin e2e)
npm run typecheck && npm run lint && npm run test:unit

# Coverage
npm run test:coverage

# Visual regression (opt-in)
npm run test:visual:update   # primera vez: generar baselines
npm run test:visual          # comparar contra baselines
```
