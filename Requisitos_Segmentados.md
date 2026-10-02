# Requisitos_Segmentados.md

## Fuente y alcance

Este documento separa lo que el código suministrado implementa actualmente en cuatro categorías: funcional, no funcional, información/datos y UI/UX.

No convierte aspiraciones del README en funcionalidades existentes.

---

# 1. Requisitos funcionales

| ID | Requisito |
|---|---|
| RF-01 | La aplicación debe iniciar con cuatro misiones: Superposición, Entrelazamiento, Cero Absoluto y Aplicaciones. |
| RF-02 | Debe existir un temporizador inicial de 600 segundos. |
| RF-03 | El usuario debe poder pausar y reanudar el temporizador. |
| RF-04 | El usuario debe poder seleccionar cualquiera de las cuatro pestañas. |
| RF-05 | La Misión 1 debe permitir alternar un bit clásico 0/1. |
| RF-06 | La Misión 1 debe mostrar conceptos de qubit y notación de Dirac. |
| RF-07 | La Misión 1 debe permitir cambiar `theta` mediante slider y presets. |
| RF-08 | La esfera de Bloch debe poder rotarse mediante puntero. |
| RF-09 | El sistema debe calcular y mostrar probabilidades de medición a partir de `theta`. |
| RF-10 | El usuario debe poder medir el qubit y observar un resultado 0/1. |
| RF-11 | El usuario debe poder reiniciar la superposición después de medir. |
| RF-12 | La Misión 1 debe validar un reto de comprensión sobre colapso. |
| RF-13 | La Misión 2 debe permitir cambiar independientemente Alice y Bob. |
| RF-14 | La Misión 2 debe permitir crear un par entrelazado. |
| RF-15 | La Misión 2 debe permitir cambiar la distancia entre qubits. |
| RF-16 | La Misión 2 debe permitir medir Alice y reflejar el mismo resultado en Bob. |
| RF-17 | La Misión 2 debe permitir reiniciar la medición. |
| RF-18 | La Misión 2 debe validar un reto sobre correlación. |
| RF-19 | La Misión 3 debe permitir simular impactos de fotones térmicos. |
| RF-20 | La Misión 3 debe permitir cambiar temperatura. |
| RF-21 | La Misión 3 debe calcular un tiempo de coherencia según temperatura. |
| RF-22 | La Misión 3 debe detectar régimen crítico por encima de 1200 mK. |
| RF-23 | La Misión 3 debe activar el blindaje/refrigeración a 15 mK. |
| RF-24 | La Misión 3 debe validar un reto sobre decoherencia. |
| RF-25 | La Misión 4 debe permitir inspeccionar tarjetas de uso inadecuado/ventaja. |
| RF-26 | La Misión 4 debe mostrar una visualización 3D molecular. |
| RF-27 | La Misión 4 debe permitir ejecutar la simulación de Shor. |
| RF-28 | La Misión 4 debe bloquear el botón de Shor mientras procesa. |
| RF-29 | La Misión 4 debe registrar las aplicaciones exploradas. |
| RF-30 | La Misión 4 debe validar el reto final. |
| RF-31 | La aplicación debe abrir un modal de finalización. |
| RF-32 | La finalización debe registrar `completedAt`. |
| RF-33 | La finalización debe disparar confeti y sonido de éxito. |
| RF-34 | El sistema debe permitir cerrar el modal. |
| RF-35 | Si existe `formUrl`, debe ofrecer un enlace externo de evaluación. |

---

# 2. Requisitos no funcionales

## RNF-01 — Compatibilidad tecnológica
La aplicación debe ejecutarse como aplicación web basada en Next.js, React y TypeScript.

## RNF-02 — Responsive
La UI debe adaptar tamaños y disposición mediante breakpoints y contenedores fluidos existentes.

## RNF-03 — WebGL
Las escenas 3D deben utilizar WebGL mediante Three.js.

## RNF-04 — Gestión de recursos
Las escenas deben cancelar `requestAnimationFrame`, remover listeners y liberar geometrías/materiales/renderer donde el código ya lo contempla.

## RNF-05 — Pixel ratio
Las escenas correspondientes deben limitar `devicePixelRatio` a un máximo de 2.

## RNF-06 — Rendimiento declarado
El README declara objetivo de 60 FPS y bundle inferior a 250 KB. Estos objetivos requieren instrumentación antes de convertirse en requisitos verificables.

## RNF-07 — Accesibilidad
El estado actual no define un conjunto suficiente de requisitos WCAG. Debe crearse una especificación explícita antes de afirmar conformidad.

## RNF-08 — Calidad de build
El proyecto debe compilar sin errores TypeScript/build. La configuración actual ignora errores de ESLint durante build y debe endurecerse.

## RNF-09 — Testabilidad
Cada HU P0/P1 debe tener pruebas automatizadas antes de considerarse cerrada.

## RNF-10 — Determinismo de tests
Las operaciones probabilísticas deben permitir inyección de RNG para evitar pruebas no deterministas.

---

# 3. Requisitos de información/datos

## RI-01 — Identidad
```ts
userId: string
```

Formato implementado: `QL-XXXXX`.

## RI-02 — Progreso
```ts
number[]
```

Representa índices de misiones completadas.

## RI-03 — Métricas
```ts
interface UserMetrics {
  userId: string;
  startedAt: string;
  completedAt?: string;
  totalTimeSeconds: number;
  missionTimes: {
    superposition: number;
    entanglement: number;
    decoherence: number;
    applications: number;
  };
  actions: {
    superpositionMeasurements: number;
    entanglementMeasurements: number;
    decoherenceTested: boolean;
    applicationsExplored: string[];
  };
}
```

## RI-04 — Claves de almacenamiento
- `quantum_user_id`
- `quantum_lab_progress`
- `quantum_lab_metrics`

## RI-05 — Expiración
Las cookies se almacenan durante 30 días.

## RI-06 — Métricas de superposición
Cada medición incrementa `superpositionMeasurements`.

## RI-07 — Métricas de entrelazamiento
Las acciones implementadas incrementan `entanglementMeasurements`.

## RI-08 — Métrica de decoherencia
Modificar la temperatura marca `decoherenceTested = true`.

## RI-09 — Aplicaciones exploradas
Shor registra:
- `molecular_simulation`
- `cryptography_shor`

usando deduplicación mediante `Set`.

## RI-10 — Tiempo por misión
Los campos existen pero no se actualizan en el código suministrado. Debe decidirse si son parte del contrato real.

---

# 4. Requisitos UI/UX

## RUX-01 — Identidad visual
La interfaz debe usar el lenguaje visual oscuro/neón ya implementado:
- fondo oscuro;
- cyan;
- púrpura;
- verde de éxito;
- ámbar para criogenia/alertas.

## RUX-02 — Tipografía
Se utilizan familias Orbitron, Rajdhani e Inter mediante clases CSS.

## RUX-03 — Navegación
La navegación debe mostrar:
- misión activa;
- misión completada;
- progreso global;
- botones anterior/siguiente.

## RUX-04 — Feedback
Las respuestas correctas muestran feedback verde y las incorrectas feedback de pista.

## RUX-05 — Feedback sonoro
Las acciones importantes deben poder producir:
- clic;
- escaneo;
- colapso;
- éxito;
- alerta.

## RUX-06 — Animación
Las transiciones utilizan animaciones visuales como fade/zoom, glow, shockwave, confeti y movimiento 3D.

## RUX-07 — Interacción 3D
La esfera de Bloch debe admitir drag con puntero.

## RUX-08 — Controles de rango
Los sliders deben presentar valor actual y usar un thumb visualmente destacado.

## RUX-09 — Estado
Los estados importantes deben ser visibles:
- valor del bit;
- probabilidades;
- resultado de medición;
- distancia;
- temperatura;
- tiempo de coherencia;
- estado de Shor.

## RUX-10 — Cierre
El modal final debe comunicar explícitamente que el entrenamiento terminó y permitir continuar/revisar.

## RUX-11 — Keyboard
Las misiones implementan flechas izquierda/derecha para navegar pasos.

## RUX-12 — Responsive
La UI debe funcionar en desktop y móvil según las clases responsive presentes.

---

# 5. Matriz de cobertura conceptual

| Concepto | Misión | Evidencia |
|---|---|---|
| Bit clásico | 1 | Interruptor 0/1 |
| Qubit | 1 | Ket, vector, esfera de Bloch |
| Superposición | 1 | `theta`, probabilidades |
| Medición | 1 | detector + colapso |
| Entrelazamiento | 2 | par de Bell |
| No-localidad/correlación | 2 | Alice/Bob |
| Decoherencia | 3 | fotón térmico |
| Temperatura | 3 | slider |
| Criogenia | 3 | refrigerador |
| Aplicaciones | 4 | moléculas, optimización, criptografía |
| Shor | 4 | simulación de factorización |

---

# 6. Requisitos que NO deben asumirse todavía

Los siguientes puntos aparecen como objetivos o descripciones del README, pero no deben convertirse automáticamente en requisitos implementados:

- análisis empírico centralizado de estudiantes;
- 60 FPS garantizados;
- bundle <250 KB garantizado;
- escalabilidad multiusuario;
- seguridad de nivel producción;
- base de datos;
- colaboración entre estudiantes;
- exportación de métricas;
- accesibilidad WCAG;
- autenticación real.

Cada uno necesita una HU y criterios propios antes de implementarse.