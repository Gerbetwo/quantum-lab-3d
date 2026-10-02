# Backlog_Priorizado.md

## Criterio de priorización

- **P0 — Bloqueante:** impide confiar en el laboratorio o probar el comportamiento principal.
- **P1 — Alto:** afecta directamente la clase, comprensión o regresión de funcionalidades.
- **P2 — Medio:** mejora mantenibilidad, UX o capacidad docente.
- **P3 — Futuro:** enriquecimiento pedagógico o colaboración que no es necesario para la primera clase.

> Las HU `HU-01`…`HU-26` son las funcionalidades extraídas del código actual. Las `MEJ-*` son propuestas nuevas y deliberadamente no se presentan como comportamiento existente.

## Backlog del estado actual

| Orden | ID | Prioridad | Área | Estado | Deuda/Test requerido |
|---:|---|---|---|---|---|
| 1 | HU-07 | P0 | Medición/colapso | Implementada | Unit + component + E2E; aleatoriedad no determinista |
| 2 | HU-12 | P0 | Entrelazamiento | Implementada | Unit + E2E; resultado aleatorio |
| 3 | HU-15 | P0 | Decoherencia | Implementada | Unit tests de fórmula + UI |
| 4 | HU-20 | P0 | Shor demo | Implementada | Fake timers + E2E |
| 5 | HU-22 | P0 | Cierre | Implementada | E2E completo |
| 6 | HU-02 | P0 | Timer | Implementada | Fake timers + integración |
| 7 | HU-03 | P1 | Navegación | Implementada | E2E |
| 8 | HU-23 | P1 | Progreso | Implementada | Unit tests de cookies |
| 9 | HU-24 | P1 | Métricas | Implementada | Unit tests de persistencia |
| 10 | HU-04 | P1 | Bit clásico | Implementada | Component test |
| 11 | HU-06 | P1 | Bloch | Implementada | Unit de matemática + E2E mínimo |
| 12 | HU-08 | P1 | Quiz 1 | Implementada | Component/E2E |
| 13 | HU-10 | P1 | Bell | Implementada | Component/E2E |
| 14 | HU-13 | P1 | Quiz 2 | Implementada | Component/E2E |
| 15 | HU-14 | P1 | Ruido térmico | Implementada | Component test |
| 16 | HU-16 | P1 | Criogenia | Implementada | Component test |
| 17 | HU-17 | P1 | Quiz 3 | Implementada | Component/E2E |
| 18 | HU-18 | P1 | Aplicaciones | Implementada | Component test |
| 19 | HU-19 | P1 | Moléculas | Implementada | Smoke/E2E |
| 20 | HU-21 | P1 | Quiz 4 | Implementada | Component/E2E |
| 21 | HU-01 | P1 | Identidad | Implementada | Unit |
| 22 | HU-25 | P2 | Audio | Implementada | Mock Web Audio |
| 23 | HU-26 | P2 | WebGL | Implementada | Smoke + visual regression selectiva |
| 24 | HU-05 | P2 | Contenido conceptual | Implementada | Component test |
| 25 | HU-09 | P2 | Independencia | Implementada | Component test |
| 26 | HU-11 | P2 | Distancia | Implementada | Component test |

---

# Deuda técnica priorizada

## DT-01 — No existe infraestructura de testing
**Severidad: P0**

El snapshot no contiene tests ni scripts de test. Esto rompe la trazabilidad entre HU → criterio → implementación → regresión.

**Acción:** instalar Vitest + React Testing Library y Playwright; añadir `test`, `test:watch`, `test:e2e`, `coverage`.

## DT-02 — Dominio cuántico acoplado a UI/Three.js
**Severidad: P0**

Probabilidad de medición, fórmula de Bloch, umbral de decoherencia, resultados de Shor y actualización de métricas están mezclados con JSX y efectos.

**Acción:** extraer funciones puras a `src/domain/quantum/` y hacer TDD sobre ellas.

## DT-03 — Aleatoriedad no inyectable
**Severidad: P0**

`Math.random()` se utiliza directamente en mediciones. Un test que espere un resultado concreto sería frágil.

**Acción:** introducir una función `measureQubit(random = Math.random)` o un proveedor de RNG inyectable.

## DT-04 — Modelo de métricas parcialmente muerto
**Severidad: P1**

`missionTimes.*` existe pero no se actualiza.

**Acción:** decidir si se implementa el cronometraje por misión o se elimina del contrato de datos.

## DT-05 — Analítica solo local
**Severidad: P1**

Las cookies no constituyen un repositorio central para análisis docente.

**Acción para la clase:** añadir un modo opcional de exportar JSON/CSV al final.  
**Acción futura:** endpoint serverless + base de datos ligera si se requiere agregación.

## DT-06 — Drift de versiones/documentación
**Severidad: P1**

README: Next.js 15.1; `package.json`: Next.js `^16.3.8`.

**Acción:** elegir una versión objetivo, regenerar lockfile y actualizar documentación.

## DT-07 — Lint no es gate de build
**Severidad: P1**

`ignoreDuringBuilds: true` reduce la capacidad de detectar errores de calidad durante CI/build.

**Acción:** retirar la excepción después de limpiar los errores.

## DT-08 — Navegación no refleja semántica de “progreso”
**Severidad: P2**

El usuario puede abrir cualquier misión independientemente de completitud.

**Acción:** decidir explícitamente si el laboratorio es lineal o exploratorio. No cambiarlo sin convertir esa decisión en HU.

## DT-09 — Accesibilidad no especificada
**Severidad: P1**

Hay navegación por flechas, pero no existe una especificación formal de focus, lectores de pantalla, contraste, reducción de movimiento o alternativa para 3D.

## DT-10 — Rendimiento declarado sin prueba
**Severidad: P1**

El README declara 60 FPS y bundle <250 KB, pero no hay benchmark automatizado.

---

# Roadmap TDD recomendado

## Iteración 0 — Baseline
1. Congelar versión de Node/Next/React.
2. Añadir Vitest.
3. Añadir React Testing Library.
4. Añadir Playwright.
5. Añadir cobertura.
6. Crear `tests/unit`, `tests/component`, `tests/e2e`.
7. Ejecutar build limpio.
8. Crear un smoke test de home.

## Iteración 1 — Dominio determinista
Extraer y probar:
- `calculateBlochProbabilities(theta)`
- `measureQubit(theta, random)`
- `createEntangledPair()`
- `correlateMeasurement(outcome)`
- `calculateCoherenceTime(temperatureMkelvin)`
- `isCriticalDecoherence(temperatureMkelvin)`
- `recordApplication()`

## Iteración 2 — Misión 1
Implementar Red-Green-Refactor para HU-04…HU-08.

## Iteración 3 — Misión 2
Implementar HU-09…HU-13.

## Iteración 4 — Misión 3
Implementar HU-14…HU-17.

## Iteración 5 — Misión 4 + cierre
Implementar HU-18…HU-22.

## Iteración 6 — Persistencia
Cubrir HU-01, HU-23, HU-24 y decidir qué hacer con `missionTimes`.

## Iteración 7 — Hardening
Accesibilidad, responsive, performance y E2E cross-browser.

---

# Mejoras pedagógicas propuestas

## MEJ-01 — Visualización matemática sincronizada
**Prioridad P1**

**HU propuesta:** Como estudiante, quiero ver simultáneamente `θ`, `α`, `β`, `P(0)` y `P(1)` mientras muevo el estado, para conectar la manipulación visual con la representación matemática.

**Justificación:** convierte la esfera de Bloch en una herramienta de razonamiento y no solo en una animación.

## MEJ-02 — Medición repetida y distribución empírica
**Prioridad P1**

**HU propuesta:** Como estudiante, quiero ejecutar N mediciones sobre el mismo estado, para comparar la frecuencia observada con `P(0)` y `P(1)`.

**Justificación:** hace visible la naturaleza probabilística de la medición y permite introducir estadística experimental.

## MEJ-03 — Modo “predice antes de medir”
**Prioridad P1**

**HU propuesta:** Como estudiante, quiero predecir el resultado antes de pulsar medir, para comprobar mi razonamiento frente a la probabilidad calculada.

**Justificación:** introduce recuperación activa y reduce interacción puramente mecánica.

## MEJ-04 — Visualización de fase
**Prioridad P2**

**HU propuesta:** Como estudiante, quiero manipular también una fase `φ`, para explorar por qué la esfera de Bloch necesita más que un único ángulo.

**Justificación:** amplía de forma natural desde superposición hacia representación completa de un qubit.

## MEJ-05 — Experimento de Bell
**Prioridad P1**

**HU propuesta:** Como estudiante, quiero ejecutar múltiples mediciones de Alice y Bob y observar una tabla de pares de resultados, para distinguir correlación de causalidad clásica.

**Justificación:** transforma el ejemplo visual de Alice/Bob en un experimento cuantificable.

## MEJ-06 — Comparador de ruido
**Prioridad P1**

**HU propuesta:** Como estudiante, quiero seleccionar distintos niveles de temperatura/ruido y observar el tiempo de coherencia, para experimentar la relación entre ambiente y decoherencia.

**Justificación:** permite formular hipótesis antes de mover el slider.

## MEJ-07 — Laboratorio de aplicaciones por escenarios
**Prioridad P2**

**HU propuesta:** Como estudiante, quiero elegir entre química, optimización y criptografía y recibir un problema concreto, para identificar qué estructura del problema hace relevante a la computación cuántica.

**Justificación:** evita que “aplicaciones” se reduzca a una lista de casos.

## MEJ-08 — Modo profesor/presentador
**Prioridad P1 para clase**

**HU propuesta:** Como docente, quiero reiniciar el laboratorio y mostrar una secuencia controlada de misiones, para dirigir una masterclass sin manipulación accidental del estado.

**Justificación:** el uso en vivo requiere control del ritmo.

## MEJ-09 — Exportación de resultados
**Prioridad P1**

**HU propuesta:** Como docente, quiero exportar las métricas de la sesión, para conservar evidencia de interacción sin desplegar infraestructura compleja.

**Justificación:** resuelve la limitación actual de cookies locales con coste prácticamente cero.

## MEJ-10 — Accesibilidad alternativa a 3D
**Prioridad P1**

**HU propuesta:** Como estudiante que no puede utilizar interacción 3D, quiero controlar el experimento mediante controles equivalentes de teclado y formularios, para acceder al mismo contenido conceptual.

**Justificación:** preserva el objetivo pedagógico aunque el canal visual/3D no esté disponible.

## MEJ-11 — Feedback adaptativo
**Prioridad P2**

**HU propuesta:** Como estudiante que falla una pregunta, quiero recibir una pista basada en el concepto que fallé, para corregir mi modelo mental antes de continuar.

**Justificación:** mejora el valor formativo del quiz.

## MEJ-12 — Modo desafío
**Prioridad P3**

**HU propuesta:** Como estudiante avanzado, quiero un modo con menos explicaciones y más predicciones, para poner a prueba mi comprensión.

**Justificación:** permite atender heterogeneidad sin cambiar el laboratorio base.

---

# Definition of Done recomendada

Una HU se considera terminada solo cuando:

- Existe al menos un test automatizado por cada criterio crítico.
- Los tests de dominio son deterministas.
- Los tests de componente verifican interacción y feedback.
- El flujo crítico tiene cobertura E2E.
- `npm run build` pasa.
- TypeScript pasa sin errores.
- Lint pasa sin `ignoreDuringBuilds`.
- No se introducen cambios visuales no intencionados.
- Se documenta cualquier comportamiento deliberadamente no implementado.
- La HU queda enlazada con sus tests y, si aplica, con su criterio pedagógico.