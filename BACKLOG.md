# Backlog Priorizado - Quantum Core Lab 3D

## Estado General del Proyecto: COMPLETADO (100%)

---

## Módulos y Cobertura de Historias de Usuario (HUs)

### Módulo 1: Fundamentos de Mecánica Cuántica (Superposición)
- **HU-01 a HU-03 (Esfera de Bloch y Lógica Cuántica):** Módulo de dominio `src/domain/quantum/bloch.ts` implementado con operaciones de rotación de qubit, cálculo de probabilidades ($|0\rangle$ / $|1\rangle$) y pruebas unitarias passing.
- **HU-04 a HU-08 (Simulador de Superposición):** Componente Misión 1 con alternancia de bit clásico (0V/5V), disparo de detector láser con colapso de función de onda, cuestionarios de verificación y trazabilidad de eventos.

### Módulo 2: Entrelazamiento Cuántico y Par de Bell
- **HU-09 a HU-13 (Generación y Medición de Pares):** Módulo de dominio `src/domain/quantum/entanglement.ts` y Misión 2. Soporta alternancia de qubits independientes ($|00\rangle, |01\rangle, |10\rangle, |11\rangle$), medición instantánea correlacionada en el laboratorio de Alice/Bob y retroalimentación interactiva.

### Módulo 3: Decoherencia y Entorno Criogénico
- **HU-14 a HU-17 (Perturbaciones y Cero Absoluto):** Módulo `src/domain/quantum/decoherence.ts` y Misión 3. Simulación de perturbación por fotón térmico parásito, control de temperatura hasta estado crítico (>1200 mK) y activación del refrigerador de dilución criogénico (15 mK).

### Módulo 4: Aplicaciones Reales y Algoritmo de Shor
- **HU-18 a HU-21 (Criptografía y Mitología Cuántica):** Módulo `src/domain/quantum/applications.ts` y Misión 4. Inspección de tarjetas conceptuales, simulación del Algoritmo de Shor para factorización RSA en tiempo acelerado y modal de celebración final.

---

## Matriz de Trazabilidad y Fases Completadas

| Fase | Objetivo Principal | Archivos Clave | Estado |
| :--- | :--- | :--- | :---: |
| **Fase 1** | Extracción de Dominio Cuántico Puro | `src/domain/quantum/*` | ✅ Completado |
| **Fase 2** | Tests Unitarios de Lógica Cuántica | `tests/unit/*.test.ts` | ✅ Completado |
| **Fase 3** | Persistencia de Métricas e Integración | `src/lib/cookies.ts`, `tests/unit/persistence.test.ts` | ✅ Completado |
| **Fase 4** | Tests de Componentes UI (RTL + Mocks) | `tests/component/*.test.tsx` | ✅ Completado |
| **Fase 5** | Tests E2E de Flujo Crítico y Hardening | `tests/e2e/*.spec.ts`, `next.config.ts` | ✅ Completado |

---

## Puerta de Calidad (Quality Gate)
- **Ejecución Unificada:** `npm run validate` (`typecheck` + `lint` + `test:unit` + `test:e2e` + `test:console` + `build`).
