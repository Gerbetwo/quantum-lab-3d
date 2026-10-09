# Agent.md — Metodología TDD Red-Green-Refactor para QuantumLab 3D

## 1. Propósito

Este documento define cómo implementar y ampliar QuantumLab 3D utilizando TDD.

Regla principal:

> **No se implementa una nueva HU hasta que exista un test que falle por la ausencia del comportamiento.**

El flujo obligatorio es:

```text
HU
 ↓
Criterios de aceptación
 ↓
Test RED
 ↓
Implementación mínima GREEN
 ↓
REFACTOR
 ↓
Test suite completa
 ↓
Definition of Done
```

---

# 2. Principios del agente

1. No inventar comportamiento no descrito por la HU.
2. No modificar varias HUs en una misma iteración salvo que una dependa explícitamente de otra.
3. Preferir funciones puras para reglas cuánticas.
4. Mantener Three.js fuera de la lógica matemática.
5. Inyectar aleatoriedad.
6. Mockear Web Audio en unit/component tests.
7. Usar Playwright para flujos completos, no para cada detalle matemático.
8. Los criterios de aceptación son el contrato.
9. Una prueba que pasa sin haber fallado primero no demuestra TDD.
10. Refactorizar solo después de GREEN.

---

# 3. Stack de testing

## Unit/component
- Vitest
- React Testing Library
- `@testing-library/jest-dom`
- `jsdom`

Next.js documenta Vitest + React Testing Library como combinación para unit testing. citeturn1search0

## E2E
- Playwright

Next.js documenta Playwright para E2E y recomienda ejecutar los flujos en un entorno parecido a producción. citeturn1search3

---

# 4. Estructura

```text
src/
├── domain/
│   └── quantum/
│       ├── bloch.ts
│       ├── measurement.ts
│       ├── entanglement.ts
│       ├── decoherence.ts
│       └── applications.ts
├── components/
└── lib/

tests/
├── unit/
│   ├── bloch.test.ts
│   ├── measurement.test.ts
│   ├── entanglement.test.ts
│   ├── decoherence.test.ts
│   └── applications.test.ts
├── component/
│   ├── Mission1Superposition.test.tsx
│   ├── Mission2Entanglement.test.tsx
│   ├── Mission3Decoherence.test.tsx
│   ├── Mission4Applications.test.tsx
│   └── CelebrationModal.test.tsx
├── integration/
│   └── persistence.test.ts
└── e2e/
    ├── laboratory.spec.ts
    ├── mission1.spec.ts
    ├── mission2.spec.ts
    ├── mission3.spec.ts
    └── mission4.spec.ts
```

Vitest admite tests `.test.*`/`.spec.*` y también permite organización en `__tests__` o junto al código. citeturn0search5

---

# 5. RED — escribir primero el test

## Regla

El test debe expresar un criterio de aceptación concreto.

### Ejemplo: HU-04

**Criterio:**
> Al pulsar “Tocar Interruptor”, 0 debe cambiar a 1.

Primero:

```tsx
test('HU-04: alterna el bit clásico de 0 a 1', async () => {
  const user = userEvent.setup();

  render(<Mission1Superposition onComplete={vi.fn()} />);

  expect(screen.getByText(/VALOR:/)).toHaveTextContent('0');

  await user.click(
    screen.getByRole('button', { name: /Tocar Interruptor/i })
  );

  expect(screen.getByText(/VALOR:/)).toHaveTextContent('1');
});
```

Ejecutar:

```bash
npm run test -- --run
```

Debe fallar si el comportamiento no existe o si el componente aún no es testeable.

---

# 6. GREEN — implementación mínima

Implementar únicamente lo necesario para pasar el test.

No:
- extraer arquitectura prematuramente;
- añadir animaciones nuevas;
- cambiar estilos;
- crear abstracciones innecesarias.

Sí:
- corregir el estado;
- conectar el evento;
- devolver el valor requerido.

Ejemplo de dominio:

```ts
export function calculateBlochProbabilities(theta: number) {
  const alpha = Math.cos(theta / 2);
  const beta = Math.sin(theta / 2);

  return {
    prob0: Math.round(alpha ** 2 * 100),
    prob1: 100 - Math.round(alpha ** 2 * 100),
  };
}
```

---

# 7. REFACTOR

Solo después de GREEN:

1. ejecutar todos los tests;
2. extraer funciones puras;
3. eliminar duplicación;
4. mejorar nombres;
5. separar dominio de UI;
6. conservar exactamente los contratos observables.

Ejemplo:

Antes:
```ts
const prob0 = Math.round(Math.cos(theta / 2) ** 2 * 100);
```

Después:
```ts
const { prob0, prob1 } = calculateBlochProbabilities(theta);
```

Los tests deben seguir verdes.

---

# 8. Regla especial para aleatoriedad

El código actual utiliza `Math.random()`.

No escribir:

```ts
expect(result).toBe(0);
```

porque el resultado real puede ser 1.

Extraer:

```ts
export function measureQubit(
  theta: number,
  random: () => number = Math.random
): 0 | 1 {
  const probabilityZero = Math.cos(theta / 2) ** 2;
  return random() < probabilityZero ? 0 : 1;
}
```

Test:

```ts
test('devuelve 0 cuando RNG cae bajo P(0)', () => {
  expect(measureQubit(Math.PI / 2, () => 0.1)).toBe(0);
});

test('devuelve 1 cuando RNG cae sobre P(0)', () => {
  expect(measureQubit(Math.PI / 2, () => 0.9)).toBe(1);
});
```

Así la prueba es determinista.

---

# 9. Ejemplo TDD — HU-07

## RED

```ts
test('HU-07: medir colapsa el estado a 0 o 1', () => {
  const result = measureQubit(Math.PI / 2, () => 0.2);

  expect([0, 1]).toContain(result);
});
```

Mejor aún, dividir por comportamiento determinista:

```ts
test('HU-07: colapsa a 0 cuando la muestra cae dentro de P0', () => {
  expect(measureQubit(Math.PI / 2, () => 0.2)).toBe(0);
});
```

## GREEN

Implementar `measureQubit`.

## REFACTOR

Mover la matemática a:

```text
src/domain/quantum/measurement.ts
```

El componente solo coordina:

```text
click
→ playLaserScan
→ measureQubit
→ setCollapsedState
→ update metrics
```

---

# 10. Ejemplo TDD — HU-15

Extraer:

```ts
export function calculateCoherenceTime(
  temperatureMilliKelvin: number
): number {
  return Math.max(
    0.1,
    Math.round(
      250 * Math.exp(-temperatureMilliKelvin / 800) * 10
    ) / 10
  );
}
```

RED:

```ts
test('HU-15: a 15 mK existe un tiempo de coherencia positivo', () => {
  expect(calculateCoherenceTime(15)).toBeGreaterThan(0);
});
```

Después añadir el criterio crítico:

```ts
test('HU-15: el tiempo de coherencia disminuye al aumentar temperatura', () => {
  expect(calculateCoherenceTime(1500))
    .toBeLessThan(calculateCoherenceTime(15));
});
```

---

# 11. Ejemplo TDD — HU-12

Extraer:

```ts
export function correlateMeasurement(outcome: 0 | 1) {
  return {
    alice: outcome,
    bob: outcome,
  };
}
```

Test:

```ts
test('HU-12: Bob recibe el mismo resultado que Alice', () => {
  expect(correlateMeasurement(1)).toEqual({
    alice: 1,
    bob: 1,
  });
});
```

Esto evita depender de Three.js o React.

---

# 12. Ejemplo TDD — HU-20

La demora de 1200 ms debe probarse con fake timers.

```ts
vi.useFakeTimers();

test('HU-20: Shor termina después del procesamiento', async () => {
  // render
  // click
  // expect botón disabled
  // advanceTimersByTime(1200)
  // expect botón enabled
  // expect mensaje final
});

vi.useRealTimers();
```

No esperar físicamente 1.2 segundos en cada ejecución.

---

# 13. Tests de persistencia

Mockear cookies.

Casos mínimos:

```text
getOrCreateUserId
├── crea si no existe
└── devuelve existente

getStoredProgress
├── sin cookie → [0]
├── JSON válido → arreglo
└── JSON inválido → [0]

saveCompletedMission
├── añade nueva misión
└── no duplica

getStoredMetrics
├── crea estructura inicial
├── recupera existente
└── recupera tras JSON corrupto
```

---

# 14. Tests de componente

No verificar detalles CSS innecesarios.

Preferir:

```ts
getByRole('button', { name: /Disparar Detector Láser/i })
```

sobre:

```ts
container.querySelector('.bg-cyan')
```

La primera prueba el contrato del usuario; la segunda acopla el test a la implementación visual.

---

# 15. Tests E2E

El E2E debe comprobar que las piezas colaboran.

### Smoke

```text
Given usuario abre /
When página termina de cargar
Then ve QuantumLab
And ve las cuatro tareas
And ve temporizador
```

### Flujo Misión 1

```text
Given estudiante está en Tarea 1
When avanza hasta medición
And dispara detector
Then ve resultado colapsado
When responde B
Then puede pasar a Tarea 2
```

### Flujo completo

```text
Given estudiante comienza laboratorio
When completa las cuatro misiones correctamente
Then aparece modal de finalización
And aparece “Entrenamiento Completado”
```

Playwright puede iniciar automáticamente el servidor mediante `webServer`, lo que encaja con este flujo. citeturn0search2

---

# 16. Contrato Red-Green-Refactor por HU

Para cada HU:

```markdown
## HU-XXX

### Criterio 1
- [ ] Test escrito
- [ ] RED confirmado
- [ ] Implementación mínima
- [ ] GREEN confirmado
- [ ] Refactor
- [ ] Suite completa verde

### Criterio 2
...
```

Una HU no está terminada si un criterio carece de test.

---

# 17. Orden de implementación TDD

## Fase A — infraestructura
1. Vitest
2. React Testing Library
3. Playwright
4. scripts npm
5. CI

## Fase B — dominio
1. Bloch
2. medición
3. correlación
4. decoherencia
5. aplicaciones

## Fase C — persistencia
1. user ID
2. progreso
3. métricas

## Fase D — componentes
1. Mission 1
2. Mission 2
3. Mission 3
4. Mission 4
5. modal

## Fase E — E2E
1. smoke
2. misión 1
3. misión 2
4. misión 3
5. misión 4
6. finalización

---

# 18. Gate de calidad

Antes de merge:

```bash
npm run typecheck
npm run lint
npm run test -- --run
npm run build
npx playwright test
```

Debe cumplirse:

```text
TypeScript     PASS
Lint           PASS
Unit           PASS
Component      PASS
E2E            PASS
Build          PASS
```

No utilizar `ignoreDuringBuilds` como mecanismo permanente para ocultar deuda.

---

# 19. Convenciones

### Nombres

```text
HU-07_measurement_collapses_qubit
HU-15_temperature_affects_coherence
```

### Test

```ts
describe('HU-07 — Medición y colapso', () => {
  test('colapsa a |0⟩ cuando...', ...)
});
```

### Commits

```text
test(HU-07): add collapse acceptance tests
feat(HU-07): implement deterministic measurement
refactor(HU-07): extract measurement domain logic
```

### No hacer

```text
feat: add many quantum improvements
```

si mezcla múltiples HUs.

---

# 20. Política para cambios visuales

Los tests no deben congelar cada pixel.

Usar visual regression solo para:
- modal final;
- layout de misión;
- canvas 3D cuando sea estable;
- responsive crítico.

Para lógica, preferir assertions semánticas.

---

# 21. Política de accesibilidad

Cada nueva HU UI debe considerar:

- `getByRole`;
- labels accesibles;
- focus visible;
- navegación de teclado;
- estado disabled;
- texto alternativo o equivalente para información 3D;
- `prefers-reduced-motion`;
- no depender exclusivamente del color.

---

# 22. Definition of Done del agente

Una HU está DONE cuando:

- [ ] HU no contradice el comportamiento solicitado.
- [ ] Todos sus criterios tienen tests.
- [ ] Los tests fallaron primero.
- [ ] Existe implementación mínima.
- [ ] Se completó refactor.
- [ ] Unit/component/E2E están verdes donde corresponda.
- [ ] TypeScript está verde.
- [ ] Lint está verde.
- [ ] Build está verde.
- [ ] No se añadió deuda técnica innecesaria.
- [ ] La UI sigue siendo utilizable en desktop y móvil.
- [ ] El cambio no rompe las HUs anteriores.

---

# 23. Regla final

El agente debe avanzar una HU a la vez:

```text
Seleccionar HU
  ↓
Leer criterios
  ↓
Escribir primer test
  ↓
RED
  ↓
Código mínimo
  ↓
GREEN
  ↓
Refactor
  ↓
Suite completa
  ↓
Siguiente criterio
  ↓
Siguiente HU
```

**Nunca empezar por “mejorar” el código sin una especificación o test que justifique el cambio.**

---

# 24. Politica de Page Objects para E2E

Toda spec de Playwright debe consumir al menos un Page Object. Los POMs viven en `tests/e2e/pages/` y **no llevan sufijo `.spec.ts` ni `.test.ts`** (Playwright los tomaria como specs ejecutables).

## Jerarquia

```text
BasePage (abstract)
  +-- MissionPage (abstract, agrega goToStep/selectAnswer/advanceToNextTask)
  |     +-- Task1Page
  |     +-- Task2Page
  |     +-- Task3Page
  |     +-- Task4Page
  |
  +-- LandingPage
  +-- CelebrationPage
```

## Reglas

1. `BasePage` solo almacena `page: Page`. Cero locators, cero metodos.
2. Cada subclase declara sus locators como `readonly` properties (evaluados una vez).
3. Los metodos exponen **intencion**, no pasos: `await task1.complete()`, no `await page.click(...)`.
4. `index.ts` re-exporta solo lo que las specs consumen. `BasePage` no se re-exporta.
5. Los POM no contienen asserts ocultos. Los `expect(...)` viven en el spec o en metodos `expectXxx()` claramente nombrados.
6. Ninguna spec debe contener `page.getByRole(...)` inline (excepto en aserciones puntuales de valores).
7. Regla de tamano: `critical-flow.spec.ts` debe permanecer por debajo de **40 lineas no vacias**.

---

# 25. Politica de data-testid

## Regla de oro

> Preferir **roles y nombres accesibles** antes que `data-testid`.

Orden de preferencia (de mejor a peor):

1. `getByRole('button', { name: /Iniciar/i })`
2. `getByLabelText(...)`, `getByPlaceholderText(...)`, `getByAltText(...)`
3. `getByTestId('collapse-result')` <-- ultimo recurso

## Cuando se permite un `data-testid`

- El elemento **no tiene semantica ARIA** disponible (un `div` con un banner de resultado).
- El texto visible es volatil (numeros que cambian por RNG, cuentas, timestamps).
- El elemento necesita ser **mascado** en visual regression (ej. `user-id-value`).

## Cuando NO

- El elemento tiene un `<button>` con label -> usar `getByRole`.
- El elemento es un heading con texto estable -> usar `getByRole('heading', { name })`.
- El elemento es un link con texto -> usar `getByRole('link', { name })`.

## Convencion de nombres

- `kebab-case`.
- Prefijo por dominio: `mission1-*`, `celebration-*`, `header-*`.
- Sufijo por tipo de dato: `-value`, `-counter`, `-banner`, `-skeleton`, `-modal`.
- **Nunca** referenciar CSS classes (`bg-cyan`, `rounded-xl`) en el nombre.

## Prohibiciones

- No usar `getByTitle` para localizar elementos. `title` es para tooltips, no para test hooks.
- No usar `querySelector` con clases CSS.
- No anadir `data-testid` a elementos que ya tienen un `id` estable.


## §26 useOrbitControls
El hook `useOrbitControls` encapsula los controles de cámara 3D utilizando Three.js y React Three Fiber. Garantiza rotación fluida, límites de zoom acotados y amortiguación (damping) para preservar el rendimiento.

## §27 Command Palette Contract
La paleta de comandos (`CommandPalette.tsx`) expone atajos globales (teclas `Cmd+K` / `Ctrl+K`). Contrato obligatorio:
- Nombres de comando declarativos y descriptivos.
- Teclas de acceso directo unificadas sin conflicto con la escena 3D.
- Ejecución directa de callbacks sin mutación directa del DOM.

## §28 Sandbox Routing
El enrutamiento del laboratorio cuántico interactivo abstrae la selección de misiones y modos libres (`/sandbox`). Sincroniza estados mediante cookies para persistir pestañas activas y simulaciones sin provocar re-renders innecesarios.
