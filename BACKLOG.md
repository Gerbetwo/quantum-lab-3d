# Backlog Priorizado - QuantumLab 3D

## Estado General: COMPLETADO (v0.3.0-maintenance)

Todas las HUs originales estan implementadas y el ciclo de mantenimiento v0.2.0 (Fases 0-8) ha cerrado con los gates de calidad en verde.

---

## Modulos y Cobertura de Historias de Usuario (HUs)

### Modulo 1: Fundamentos de Mecanica Cuantica (Superposicion)
- **HU-01 a HU-03 (Esfera de Bloch y Logica Cuantica):** `src/domain/quantum/bloch.ts`. 100% cobertura.
- **HU-04 a HU-08 (Simulador de Superposicion):** `Mission1Superposition.tsx`.

### Modulo 2: Entrelazamiento Cuantico y Par de Bell
- **HU-09 a HU-13:** `src/domain/quantum/entanglement.ts`, `Mission2Entanglement.tsx`.

### Modulo 3: Decoherencia y Entorno Criogenico
- **HU-14 a HU-17:** `src/domain/quantum/decoherence.ts`, `Mission3Decoherence.tsx`.

### Modulo 4: Aplicaciones Reales y Algoritmo de Shor
- **HU-18 a HU-21:** `src/domain/quantum/applications.ts`, `Mission4Applications.tsx`.

---

## Ciclo de Mantenimiento v0.2.0 (Fases 0-8)

Cada fase se ejecuto con el protocolo `script-per-phase` (backup, pasos numerados, rollback automatico, validate).

| HU | Descripcion | Fase | Estado |
| :--- | :--- | :---: | :---: |
| HU-M-01 | Congelar baseline (tag + coverage snapshot) | 0 | OK |
| HU-M-02 | Saneamiento de `.gitignore` / `tsconfig.json` / `vitest.setup.ts` / `next.config.ts` | 1 | OK |
| HU-M-03 | Endurecer red de tests (queries semanticas, `role="tab"`, RNG injection) | 2 | OK |
| HU-M-04 | Extraer ciclo de vida Three.js a `useThreeScene` | 3 | OK |
| HU-M-05 | Endurecer `cookies.ts` (inmutabilidad, size guard, `deleteAllUserData`) | 4 | OK |
| HU-M-06 | Gate de audio por gesto + `isAudioEnabled()` | 4 | OK |
| HU-M-07 | Header memoizado + skeleton accesible | 4 | OK |
| HU-M-08 | Timer sin doble-incremento + persistencia de `activeTab` | 4 | OK |
| HU-M-09 | Celebration modal con cleanup de confetti | 4 | OK |
| HU-M-10 | Ampliar cobertura: cookies-edge, mission-flow, sound, persistence | 5 | OK |
| HU-M-11 | Thresholds declarativos en `vite.config.ts` | 5 | OK |
| HU-M-12 | E2E Page Object Model + console audit endurecido + visual regression | 6 | OK |
| HU-M-13 | `setAnimationLoop` + culling en background + geometrias cacheadas | 7 | OK |
| HU-M-14 | A11y: canvas `role="img"`, focus trap, `aria-live` | 7 | OK |
| HU-M-15 | `React.lazy` + `Suspense` para las 4 misiones | 7 | OK |
| HU-M-16 | Guard clauses en helpers que aceptan `unknown` | 7 | OK |
| HU-M-17 | Documentacion consolidada (AGENTS, BACKLOG, README, maintenance log) | 8 | OK |
| HU-M-18 | Tag `v0.3.0-maintenance` | 8 | OK |

---

## Deuda tecnica remanente conocida

Items identificados durante el ciclo pero **diferidos conscientemente** por riesgo/beneficio.

### DT-01 - CSP laxa
- **Estado:** `Content-Security-Policy` permite `'unsafe-inline'` y `'unsafe-eval'` por requerimiento de Next.js + Google Fonts.
- **Riesgo:** medio.
- **Resolucion futura:** nonces via `middleware.ts` + `next/font` auto-hospedado. ~1 dia.

### DT-02 - Persistencia de escena entre steps 2<->3
- **Estado:** cada transicion de step recrea la escena WebGL (~30 ms).
- **Riesgo:** bajo (visual: parpadeo apenas perceptible).
- **Resolucion futura:** unificar contenedores JSX de steps 2 y 3 con visibility toggling. ~2-3 h por mision.

### DT-03 - `createTextSprite` cache
- **Estado:** cada instancia de Mission1 step 2/3 crea 3 sprites nuevos (canvas + texture).
- **Riesgo:** bajo.
- **Resolucion futura:** cache `Map<text|color, SpriteMaterial>`. Cuidado: los sprites deben ser instancias distintas para permitir posicionamiento. ~1 h.

### DT-04 - Bundle size sin gate automatico
- **Estado:** Turbopack no imprime `First Load JS` de forma parseable.
- **Resolucion futura:** `@next/bundle-analyzer` + `.next/bundle-sizes.json` + threshold en CI. ~3 h.

### DT-05 - Visual regression sin baselines en CI
- **Estado:** `visual-regression.spec.ts` env-gated (`RUN_VISUAL=1`) sin baselines versionadas.
- **Resolucion futura:** baselines generadas en Docker reproducible. ~4 h.

### DT-06 - jsdom recreado por archivo de test
- **Estado:** Vitest advierte "jsdom was created 16 times". ~9 s de overhead.
- **Resolucion futura:** evaluar `pool: 'vmThreads'` en `vite.config.ts`. ~2 h.

### DT-07 - Oscillator pool
- **Estado:** cada `play*` crea oscillators/gains nuevos.
- **Resolucion futura:** pool de 4 osciladores con stop + restart diferido. ~2 h.

### DT-08 - Archivo `code.txt` trackeado en git
- **Estado:** RESUELTO (v0.3.1-remediation).
- **Riesgo:** bajo (removido del tracking).
- **Resolucion:** Ejecutado `git rm --cached code.txt` y verificado .gitignore.

### DT-09 - Tests no cubren `src/lib/three/createScene.ts`
- **Estado:** excluido de coverage por ser wrapper WebGL. Solo validado por E2E.
- **Riesgo:** medio (bug de `disposeResource` en Fase 7 escapo a unit).
- **Resolucion futura:** tests con `three` mockeado para `cached()`, `prefersReducedMotion()`, y early-return de `disposeResource`. ~3 h.

---

## Puerta de Calidad (Quality Gate)

```bash
npm run validate
```

Ejecuta secuencialmente: `typecheck`, `lint`, `test:unit`, `test:e2e`, `test:console`, `build`.

Thresholds de coverage (declarados en `vite.config.ts`):
- `src/domain/**`: 95% statements, 90% branches.
- `src/lib/**`: 85% statements, 80% branches.
- Excluido: `src/lib/three/**` (infra WebGL).

Scripts adicionales:
- `npm run test:visual` - visual regression (requiere baselines).
- `npm run test:visual:update` - regenera baselines.


## Sincronización v0.3.0
- [x] Alineación documental con README.md (Misiones 0 a 3 integradas).
- [x] Pruebas de cobertura y accesibilidad WCAG 2.1 AA alineadas con auditorías en CI/CD.
