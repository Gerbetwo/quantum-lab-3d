# Stack_Recomendado.md

## Objetivo

Mantener la aplicación como una experiencia web de una sola clase: rápida de desarrollar, profesional visualmente, barata de desplegar y suficientemente testeable para evolucionar con TDD.

## Recomendación principal

| Capa | Tecnología | Decisión |
|---|---|---|
| Framework | Next.js 16 + App Router | Mantener |
| UI | React 19 | Mantener |
| Lenguaje | TypeScript | Mantener |
| Estilos | Tailwind CSS | Mantener inicialmente |
| 3D | Three.js | Mantener |
| Iconos | lucide-react | Mantener |
| Persistencia demo | Cookies/localStorage | Mantener solo para sesión local |
| Unit/component | Vitest + React Testing Library | Añadir |
| E2E | Playwright | Añadir |
| Calidad | ESLint + TypeScript + build | Endurecer |
| CI | GitHub Actions | Añadir |
| Deploy | Vercel Hobby | Recomendado |
| Analítica docente opcional | Export JSON/CSV; después serverless | Por fases |

## Por qué este stack

### Next.js + React + TypeScript

El proyecto ya está construido alrededor de Next.js/React/TypeScript y sus componentes son predominantemente client-side. Cambiar de framework no aporta valor para una clase y aumenta el riesgo.

El snapshot actual contiene `next`, `react`, `react-dom`, TypeScript, Tailwind y Three.js como dependencias principales. La recomendación es consolidar esas decisiones y eliminar el drift documental antes de añadir infraestructura.

### Three.js

Es una elección natural para las cuatro experiencias 3D ya existentes:
- esfera de Bloch;
- Alice/Bob;
- refrigerador de dilución;
- molécula.

No recomiendo introducir una capa 3D adicional. Primero conviene desacoplar el dominio de Three.js.

### Tailwind CSS

Ya forma parte del diseño actual y permite iterar rápidamente sobre una interfaz visual de estilo laboratorio/futurista. Para una aplicación de una sola clase, sustituirlo tendría poco retorno.

### Vitest + React Testing Library

Es la combinación propuesta para TDD de dominio y componentes. La documentación actual de Next.js recomienda Vitest + React Testing Library para unit testing; la guía oficial muestra configuración con `vitest`, `@vitejs/plugin-react`, `jsdom` y Testing Library. citeturn1search0turn0search5

**Uso recomendado:**
- reglas matemáticas;
- reducers/estado;
- persistencia;
- componentes;
- feedback de quizzes;
- fórmulas de decoherencia;
- utilidades de audio mediante mocks.

### Playwright

Debe cubrir los flujos que realmente importan en una clase:
1. abrir laboratorio;
2. avanzar Misión 1;
3. medir;
4. completar quiz;
5. pasar a Misión 2;
6. generar entrelazamiento;
7. medir Alice;
8. completar Misión 3;
9. activar criogenia;
10. completar Misión 4;
11. finalizar y verificar modal.

Next.js documenta Playwright como opción E2E y Playwright permite lanzar el servidor mediante `webServer`, ejecutar múltiples navegadores y generar reportes HTML. citeturn1search3turn0search0turn0search2

### Vercel Hobby

Para esta aplicación es la opción de despliegue de menor fricción porque el propio README ya está preparado para Vercel.

A fecha de esta especificación, Vercel publica Hobby a $0/mes y orientado a proyectos personales; su documentación incluye CI/CD, HTTPS/SSL, previews y recursos base. citeturn1search6turn1search8turn1search9

**Advertencia:** la documentación legal de Vercel indica que Hobby está destinado a uso personal/no comercial. Si la masterclass es parte de una actividad institucional/comercial, hay que verificar los términos aplicables antes del despliegue. citeturn0search9

## Arquitectura objetivo

```text
src/
├── app/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── Header.tsx
│   ├── CelebrationModal.tsx
│   └── missions/
│       ├── Mission1Superposition.tsx
│       ├── Mission2Entanglement.tsx
│       ├── Mission3Decoherence.tsx
│       └── Mission4Applications.tsx
├── domain/
│   └── quantum/
│       ├── bloch.ts
│       ├── measurement.ts
│       ├── entanglement.ts
│       ├── decoherence.ts
│       └── applications.ts
├── lib/
│   ├── cookies.ts
│   └── sound.ts
└── test/
    ├── setup.ts
    └── fixtures/
tests/
├── unit/
├── component/
└── e2e/
```

## Contrato de pruebas

### Unit
Prueban reglas puras.

Ejemplo:
```ts
expect(calculateBlochProbabilities(Math.PI / 2)).toEqual({
  prob0: 50,
  prob1: 50,
});
```

### Component
Prueban comportamiento React.

Ejemplo:
```ts
render(<Mission1Superposition ... />);
await user.click(screen.getByRole('button', { name: /tocar interruptor/i }));
expect(screen.getByText(/VALOR:/)).toHaveTextContent('1');
```

### E2E
Prueban el flujo completo en navegador real.

Ejemplo conceptual:
```ts
await page.getByRole('button', { name: /Disparar Detector Láser/i }).click();
await expect(page.getByText(/Reto de Comprensión/i)).toBeVisible();
```

## CI mínima

En cada push/pull request:

```text
npm ci
npm run typecheck
npm run lint
npm run test -- --run
npm run build
npx playwright test
```

Los tests E2E pueden ejecutar un servidor mediante `webServer`, tal como documenta Playwright. citeturn0search2

## Decisiones que NO recomiendo para esta versión

### No introducir backend completo
No es necesario para enseñar los cuatro conceptos.

### No introducir base de datos todavía
Primero resolver exportación de métricas. Solo añadir DB si realmente se necesita análisis centralizado.

### No migrar a otra librería 3D
Three.js ya cubre el caso.

### No reescribir toda la UI
La deuda principal es testabilidad/dominio, no falta de framework visual.

### No introducir un gestor global de estado solo por moda
El estado actual está acotado a la página/misión. Primero extraer dominio puro; después decidir si aparece una necesidad real.

## Fase de endurecimiento

1. Resolver Next.js 15/16 inconsistente en documentación.
2. Fijar Node y dependencias.
3. Añadir Vitest/RTL.
4. Extraer dominio.
5. Añadir Playwright.
6. Eliminar `ignoreDuringBuilds`.
7. Medir bundle real.
8. Añadir performance budget.
9. Añadir accesibilidad.
10. Desplegar Vercel.