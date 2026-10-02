# HU_Extraidas.md — Historias de Usuario extraídas por ingeniería inversa

> **Fuente de verdad:** `code.txt`, snapshot del proyecto suministrado.  
> **Regla:** las HUs de esta sección describen comportamiento observable o explícitamente implementado; no representan funcionalidades deseadas. Las mejoras futuras están fuera de este documento.
>
> **Convención:** F = funcional, I = información/datos, UI = UI/UX, NF = no funcional.

## Resumen de cobertura

| ID | Tipo | Área | Impacto |
|---|---|---|---|
| HU-01 | F/I | Identidad de sesión | Alto |
| HU-02 | F/I | Temporizador y tiempo | Alto |
| HU-03 | F/UI | Navegación y progreso | Alto |
| HU-04 | F/UI | Misión 1 — bit clásico | Alto |
| HU-05 | F/UI | Misión 1 — qubit/Dirac | Alto |
| HU-06 | F/UI | Misión 1 — esfera de Bloch | Alto |
| HU-07 | F/I/UI | Misión 1 — medición y colapso | Crítico |
| HU-08 | F/UI | Misión 1 — reto final | Alto |
| HU-09 | F/UI | Misión 2 — qubits independientes | Alto |
| HU-10 | F/UI/I | Misión 2 — entrelazamiento Bell | Crítico |
| HU-11 | F/UI | Misión 2 — separación espacial | Alto |
| HU-12 | F/I/UI | Misión 2 — medición correlacionada | Crítico |
| HU-13 | F/UI | Misión 2 — reto final | Alto |
| HU-14 | F/I/UI | Misión 3 — impactos térmicos | Alto |
| HU-15 | F/UI/I | Misión 3 — temperatura/decoherencia | Crítico |
| HU-16 | F/UI | Misión 3 — blindaje criogénico | Alto |
| HU-17 | F/UI | Misión 3 — reto final | Alto |
| HU-18 | F/UI | Misión 4 — desmitificación | Alto |
| HU-19 | F/UI | Misión 4 — simulación molecular | Alto |
| HU-20 | F/UI/I | Misión 4 — Shor | Crítico |
| HU-21 | F/UI | Misión 4 — reto y cierre | Alto |
| HU-22 | F/UI | Finalización del laboratorio | Crítico |
| HU-23 | I/F | Persistencia de progreso | Alto |
| HU-24 | I/F | Persistencia de métricas de interacción | Alto |
| HU-25 | UI/NF | Audio procedural | Medio |
| HU-26 | UI/NF | Interacción 3D responsive | Medio |

---

# 1. Identidad y sesión

## HU-01 — Identidad persistente de estudiante
**Historia:** Como estudiante, quiero recibir un identificador persistente de sesión, para que la aplicación pueda asociar mis métricas y progreso al mismo navegador.

**Implementación observada:** `getOrCreateUserId()` busca `quantum_user_id`; si no existe genera `QL-` seguido de cinco caracteres alfanuméricos en mayúsculas y guarda la cookie durante 30 días con `sameSite=lax`.

**Criterios de aceptación**
- **Given** no existe `quantum_user_id`, **When** se solicita el ID, **Then** se genera un valor con prefijo `QL-`.
- **And** el sufijo generado tiene cinco caracteres.
- **Given** ya existe `quantum_user_id`, **When** se solicita el ID, **Then** se devuelve el mismo valor.
- **When** se crea un ID, **Then** se persiste durante 30 días con `sameSite=lax`.
- **Then** el ID usado por las métricas coincide con el ID de sesión.

---

## HU-02 — Sesión cronometrada de 10 minutos
**Historia:** Como estudiante, quiero disponer de un contador regresivo de 10 minutos, para trabajar dentro de la ventana temporal definida por el laboratorio.

**Criterios de aceptación**
- **Given** se carga la página, **Then** `timeLeft` inicia en `600`.
- **Given** el temporizador está activo, **When** transcurre un segundo, **Then** `timeLeft` disminuye en uno.
- **Given** `timeLeft` llega a `0`, **Then** no continúa decreciendo.
- **Given** el temporizador está pausado, **When** transcurre tiempo, **Then** el contador no cambia.
- **When** se alterna el control de pausa/reanudación, **Then** cambia el estado `isTimerRunning`.
- **When** transcurre un segundo mientras está activo, **Then** `totalTimeSeconds` de métricas aumenta en uno.

**Observación de ingeniería:** el código no bloquea las misiones cuando el contador llega a cero.

---

# 2. Navegación y progreso

## HU-03 — Navegación entre las cuatro misiones
**Historia:** Como estudiante, quiero cambiar entre las cuatro tareas del laboratorio, para explorar los conceptos en una interfaz única.

**Criterios de aceptación**
- **Given** la página está cargada, **Then** existen cuatro pestañas: Superposición, Entrelazamiento, Cero Absoluto y Aplicaciones.
- **When** se pulsa una pestaña, **Then** `activeTab` toma su índice.
- **When** se cambia de pestaña, **Then** se reproduce el sonido de clic.
- **Then** la misión correspondiente ocupa el área principal.
- **When** una misión se completa, **Then** el índice siguiente se marca como completado y pasa a ser la pestaña activa.
- **When** una pestaña ya completada no es la activa, **Then** muestra un indicador de check.

## HU-23 — Persistencia del progreso
**Historia:** Como estudiante, quiero conservar las misiones completadas entre cargas, para no perder mi avance.

**Criterios de aceptación**
- **Given** no existe `quantum_lab_progress`, **Then** el progreso devuelto es `[0]`.
- **Given** la cookie contiene JSON válido, **Then** `getStoredProgress()` devuelve ese arreglo.
- **Given** la cookie contiene JSON inválido, **Then** se recupera `[0]`.
- **When** se guarda una misión que no estaba en el progreso, **Then** se añade una sola vez.
- **When** se intenta guardar una misión ya presente, **Then** el arreglo no se duplica.
- **Then** la cookie expira en 30 días y usa `sameSite=lax`.

**Observación de ingeniería:** la interfaz permite seleccionar directamente cualquier pestaña; el código no implementa un bloqueo de misiones futuras.

---

# 3. Misión 1 — Superposición y colapso

## HU-04 — Manipulación del bit clásico
**Historia:** Como estudiante, quiero alternar un bit clásico entre 0 y 1, para visualizar que el bit tradicional tiene dos estados discretos.

**Criterios de aceptación**
- **Given** la misión inicia en el paso 1, **Then** `classicBit` es `0`.
- **When** se pulsa “Tocar Interruptor”, **Then** 0 cambia a 1.
- **When** se pulsa nuevamente, **Then** 1 cambia a 0.
- **Then** la etiqueta muestra `0V (BAJO)` para 0 y `5V (ALTO)` para 1.
- **Then** el valor mostrado coincide con `classicBit`.

## HU-05 — Exploración conceptual del qubit
**Historia:** Como estudiante, quiero avanzar al contenido sobre qubits y notación de Dirac, para observar la diferencia entre bit clásico y qubit.

**Criterios de aceptación**
- **When** se avanza al paso 2 de la misión, **Then** se muestra el contenido “El Qubit y su Notación”.
- **Then** se presentan las notaciones `|0⟩`, `|1⟩`, `|ψ⟩` y la explicación textual implementada.
- **Then** se muestra la analogía de la moneda incluida en el componente.
- **When** se pulsa navegación siguiente/anterior, **Then** el índice de paso se incrementa/decrementa sin salir del rango.

## HU-06 — Manipulación 3D de la esfera de Bloch
**Historia:** Como estudiante, quiero rotar una esfera de Bloch y modificar su ángulo de estado, para observar visualmente cómo cambia la representación del qubit.

**Criterios de aceptación**
- **Given** el paso de esfera está activo, **Then** existe un canvas WebGL.
- **When** se arrastra con el puntero, **Then** cambia la rotación de la esfera.
- **When** se mueve el slider `theta`, **Then** se actualiza el ángulo del estado.
- **Then** `alpha = cos(theta/2)` y `beta = sin(theta/2)`.
- **Then** `P(|0⟩)` se muestra como `round(alpha² * 100)` mientras existe superposición.
- **Then** `P(|1⟩)` es `100 - P(|0⟩)`.
- **When** se seleccionan los presets de polo norte, ecuador o polo sur, **Then** se establece el ángulo correspondiente.
- **Then** la escena se redimensiona cuando cambia el ancho del contenedor.

## HU-07 — Medición y colapso del qubit
**Historia:** Como estudiante, quiero medir el qubit mediante el detector láser, para observar que la superposición termina en un estado base.

**Criterios de aceptación**
- **Given** el qubit está en superposición, **When** se pulsa “Disparar Detector Láser”, **Then** se reproduce el sonido de escaneo.
- **Then** se dispara el sonido de colapso aproximadamente 150 ms después.
- **Then** aparece una animación de shockwave.
- **Then** el resultado es `0` o `1`.
- **Then** el resultado se obtiene mediante `Math.random() < cos(theta/2)^2`.
- **Then** `isSuperposition` pasa a `false`.
- **Then** `collapsedState` toma el resultado.
- **Then** las probabilidades visualizadas pasan a 100/0 o 0/100.
- **Then** `superpositionMeasurements` aumenta en uno.
- **When** se pulsa “Probar de nuevo”, **Then** el qubit vuelve a superposición con `theta = π/2`.

## HU-08 — Validación de comprensión de superposición
**Historia:** Como estudiante, quiero responder un reto sobre la medición de un qubit, para comprobar mi comprensión del colapso.

**Criterios de aceptación**
- **Given** el paso final está activo, **Then** aparecen tres alternativas.
- **When** se selecciona B (`collapse`), **Then** se muestra feedback correcto.
- **Then** se reproduce el sonido de éxito.
- **Then** se guarda la misión 0 como completada.
- **Then** aparece el botón “Pasar a Tarea 2”.
- **When** se selecciona A o C, **Then** se muestra feedback de pista y no aparece el botón de continuación.
- **Then** el feedback permanece asociado a la opción seleccionada.

---

# 4. Misión 2 — Entrelazamiento

## HU-09 — Comparación de qubits independientes
**Historia:** Como estudiante, quiero cambiar independientemente los estados de Alice y Bob, para observar que dos qubits no entrelazados no se afectan entre sí.

**Criterios de aceptación**
- **Given** el paso inicial está activo, **Then** Alice y Bob empiezan en 0.
- **When** se conmuta Alice, **Then** cambia Alice sin modificar Bob.
- **When** se conmuta Bob, **Then** cambia Bob sin modificar Alice.
- **Then** la interfaz indica que no existe conexión cuántica en este estado.

## HU-10 — Creación de un par de Bell
**Historia:** Como estudiante, quiero generar un par entrelazado, para transformar los dos qubits independientes en un sistema compartido.

**Criterios de aceptación**
- **Given** el paso de creación está activo, **When** se ejecuta la acción de generación, **Then** `isEntangled` pasa a `true`.
- **Then** se reproduce un escaneo y posteriormente un sonido de éxito.
- **Then** la interfaz muestra “Estado de Bell creado”.
- **Then** la visualización 3D representa el vínculo entre Alice y Bob.
- **Then** el código registra la acción en `entanglementMeasurements`.

## HU-11 — Ajuste de separación espacial
**Historia:** Como estudiante, quiero modificar la distancia entre Alice y Bob, para observar que la visualización mantiene la correlación a distintas separaciones.

**Criterios de aceptación**
- **Given** el paso de separación está activo, **Then** la distancia inicial es `384400 km`.
- **When** se mueve el slider, **Then** `distanceKm` se actualiza.
- **Then** la distancia se muestra formateada en kilómetros.
- **Then** la escena 3D se actualiza usando la distancia actual.
- **Then** el texto indica que la correlación no se atenúa con la distancia.

## HU-12 — Medición correlacionada
**Historia:** Como estudiante, quiero medir el qubit de Alice y observar el resultado de Bob, para experimentar la correlación implementada por el modelo de entrelazamiento.

**Criterios de aceptación**
- **Given** existe un par entrelazado y se pulsa “Medir en Laboratorio de Alice”, **Then** Alice obtiene aleatoriamente 0 o 1 con probabilidad 50/50.
- **Then** Bob recibe exactamente el mismo valor.
- **Then** `hasTriggeredMeasurement` pasa a `true`.
- **Then** se reproducen los sonidos de escaneo y colapso.
- **Then** se muestra “¡Correlación Perfecta Instantánea!”.
- **Then** se incrementa `entanglementMeasurements`.
- **When** se pulsa reiniciar, **Then** Alice y Bob vuelven a `null` y `hasTriggeredMeasurement` a `false`.

## HU-13 — Validación de comprensión de entrelazamiento
**Historia:** Como estudiante, quiero responder qué observaría Bob tras medir Alice, para comprobar mi comprensión de la correlación implementada.

**Criterios de aceptación**
- **When** se selecciona B (`instant_same`), **Then** se muestra feedback correcto, se reproduce éxito y se guarda la misión 1.
- **When** se selecciona A o C, **Then** se muestra una pista y no se habilita la continuación.
- **When** la respuesta correcta está activa, **Then** aparece “Pasar a Tarea 3”.

---

# 5. Misión 3 — Decoherencia y criogenia

## HU-14 — Simulación de perturbaciones térmicas
**Historia:** Como estudiante, quiero disparar fotones térmicos sobre el qubit, para observar que las perturbaciones aumentan y afectan al sistema.

**Criterios de aceptación**
- **Given** el paso inicial está activo, **Then** `photonHits` inicia en 0.
- **When** se pulsa “Disparar Fotón Térmico Parásito”, **Then** `photonHits` aumenta en uno.
- **Then** se reproduce la alerta de decoherencia.
- **When** `photonHits > 0`, **Then** aparece el mensaje de alerta.
- **Then** se mantiene el conteo visible.

## HU-15 — Exploración temperatura/decoherencia
**Historia:** Como estudiante, quiero mover la temperatura del procesador, para observar su relación con el tiempo de coherencia.

**Criterios de aceptación**
- **Given** el simulador inicia, **Then** la temperatura es `15 mK`.
- **When** se mueve el slider, **Then** `temperatureMilliKelvin` toma el valor seleccionado.
- **Then** el estado crítico se activa cuando la temperatura supera `1200 mK`.
- **Then** el tiempo de coherencia se calcula como `max(0.1, round(250 * exp(-temperature/800) * 10)/10)`.
- **Then** el estado visual cambia según el régimen térmico implementado.
- **When** la temperatura supera `1200 mK`, **Then** se reproduce la alerta de decoherencia.
- **Then** `decoherenceTested` se guarda como `true`.
- **Then** la temperatura se presenta en mK o K/°C según el valor.

## HU-16 — Activación del refrigerador de dilución
**Historia:** Como estudiante, quiero activar el blindaje criogénico, para observar el estado operativo a 15 mK.

**Criterios de aceptación**
- **When** se pulsa “Activar Bombas Criogénicas de Dilución”, **Then** `isCryoShieldActive` pasa a `true`.
- **Then** la temperatura se fuerza a `15 mK`.
- **Then** se reproduce escaneo y posteriormente chime de éxito.
- **Then** aparece el estado “¡Enfriamiento Cuántico a 15 mK Activo!”.
- **Then** aparece la lectura `15 mK (-273.135 °C)`.
- **Then** se muestra el mensaje de operación de alta fidelidad implementado.

## HU-17 — Validación de comprensión de decoherencia
**Historia:** Como estudiante, quiero responder por qué se requiere una temperatura cercana al cero absoluto, para comprobar mi comprensión de la decoherencia.

**Criterios de aceptación**
- **When** se selecciona B (`vibrations_noise`), **Then** se muestra feedback correcto.
- **Then** se reproduce éxito.
- **Then** se guarda la misión 2.
- **When** se selecciona A o C, **Then** se muestra una pista y no se habilita el paso siguiente.
- **When** la respuesta es correcta, **Then** aparece “Pasar a Tarea 4”.

---

# 6. Misión 4 — Aplicaciones

## HU-18 — Desmitificación del computador cuántico
**Historia:** Como estudiante, quiero inspeccionar el contraste entre usos cotidianos y problemas cuánticos, para distinguir el tipo de problemas al que apunta la tecnología.

**Criterios de aceptación**
- **Given** el paso inicial está activo, **Then** aparecen las tarjetas “Uso Inadecuado” y “Verdadera Ventaja”.
- **When** se inspecciona “Videojuegos, Navegar o YouTube”, **Then** `inspectedMyth` toma `gaming`.
- **When** se inspecciona la tarjeta científica, **Then** `inspectedMyth` toma `science`.
- **Then** el estilo visual cambia según la tarjeta inspeccionada.
- **Then** se presenta el contenido textual existente en el componente.

## HU-19 — Visualización de simulación molecular
**Historia:** Como estudiante, quiero comparar el enfoque clásico y cuántico para una simulación molecular, para visualizar una aplicación de computación cuántica.

**Criterios de aceptación**
- **Given** el paso molecular está activo, **Then** existe una visualización 3D de molécula.
- **Then** se muestra el contraste textual “+10.000 años” frente a “Minutos”.
- **Then** la escena WebGL responde al tamaño del contenedor.
- **Then** la animación 3D se mantiene activa mientras el paso está montado.

## HU-20 — Simulación del algoritmo de Shor
**Historia:** Como estudiante, quiero ejecutar la demostración del algoritmo de Shor, para observar una simulación visual de factorización aplicada a criptografía.

**Criterios de aceptación**
- **Given** el paso de criptografía está activo, **Then** se muestra la referencia a RSA-2048 y el contraste clásico/cuántico.
- **When** se pulsa “Probar Algoritmo de Shor Cuántico”, **Then** `isCracking` pasa a `true`.
- **Then** el botón queda deshabilitado durante el procesamiento.
- **Then** `crackSpeed` cambia a “Procesando estados cuánticos en superposición...”.
- **After** aproximadamente 1200 ms, **Then** `isCracking` pasa a `false`.
- **Then** `crackSpeed` muestra el texto implementado de factorización en 0.42 segundos.
- **Then** se registran `molecular_simulation` y `cryptography_shor` sin duplicados.
- **Then** se reproduce el sonido de éxito al terminar.

## HU-21 — Reto final de aplicaciones
**Historia:** Como estudiante, quiero responder qué problemas presentan una ventaja cuántica, para comprobar la comprensión de las aplicaciones mostradas.

**Criterios de aceptación**
- **When** se selecciona B (`molecules_crypto`), **Then** se muestra feedback correcto.
- **Then** se reproduce éxito.
- **Then** se muestra “Finalizar Laboratorio”.
- **When** se selecciona A o C, **Then** se muestra una pista y no aparece el cierre.
- **Then** la opción seleccionada queda visualmente diferenciada.

---

# 7. Finalización

## HU-22 — Finalizar el laboratorio
**Historia:** Como estudiante, quiero finalizar el laboratorio después de responder correctamente el reto final, para recibir una confirmación visual de completitud.

**Criterios de aceptación**
- **Given** la respuesta correcta de la Misión 4 está seleccionada, **When** se pulsa “Finalizar Laboratorio”, **Then** se abre `CelebrationModal`.
- **Then** el modal indica “Entrenamiento Completado”.
- **Then** se indica que se interactuó con los cuatro conceptos fundamentales.
- **Then** se reproduce un chime.
- **Then** se registra `completedAt` como fecha ISO.
- **Then** se ejecuta confeti.
- **When** se pulsa cerrar, **Then** el modal deja de mostrarse.
- **If** `formUrl` existe, **Then** se ofrece el enlace externo de evaluación en una nueva pestaña.
- **If** `formUrl` no existe, **Then** se ofrece “Cerrar y Revisar Módulos”.

---

# 8. Persistencia y métricas

## HU-24 — Persistencia local de métricas
**Historia:** Como sistema, quiero almacenar métricas de interacción en el navegador, para conservar el estado de la sesión del estudiante.

**Criterios de aceptación**
- **Given** no existe `quantum_lab_metrics`, **Then** se crea una estructura con `userId`, `startedAt`, tiempos por misión y acciones.
- **Then** `totalTimeSeconds` inicia en 0.
- **Then** los cuatro `missionTimes` inician en 0.
- **Then** los contadores de medición inician en 0.
- **Then** `decoherenceTested` inicia en `false`.
- **Then** `applicationsExplored` inicia como arreglo vacío.
- **When** existen métricas válidas en cookie, **Then** se recuperan sin recrearlas.
- **When** el JSON es inválido, **Then** se genera una estructura inicial.
- **When** se actualizan métricas, **Then** se persiste el objeto resultante durante 30 días.

**Hallazgo:** los campos `missionTimes.superposition`, `missionTimes.entanglement`, `missionTimes.decoherence` y `missionTimes.applications` existen en el modelo, pero en el código entregado no se observan actualizaciones a esos campos.

---

# 9. Audio e interacción

## HU-25 — Retroalimentación sonora procedural
**Historia:** Como estudiante, quiero recibir sonidos sintetizados al interactuar con el laboratorio, para obtener feedback audiovisual inmediato.

**Criterios de aceptación**
- **When** se solicita un sonido en entorno navegador, **Then** se obtiene/reutiliza un `AudioContext`.
- **If** el contexto está suspendido, **Then** se intenta reanudar.
- **Then** los sonidos se generan mediante Web Audio API sin archivos de audio externos.
- **Then** existen sonidos separados para escaneo láser, colapso cuántico, éxito, alerta de decoherencia y clic de botón.
- **Then** las acciones que llaman a esos sonidos no dependen de recursos de audio remotos.

---

# 10. Renderizado e interacción 3D

## HU-26 — Escenas 3D adaptables
**Historia:** Como estudiante, quiero manipular las escenas 3D desde el navegador, para explorar visualmente los fenómenos.

**Criterios de aceptación**
- **Given** una misión entra en un paso 3D, **Then** se crea una escena Three.js.
- **Then** se crea una cámara perspectiva y un renderer WebGL con antialiasing.
- **Then** el pixel ratio se limita a `min(devicePixelRatio, 2)` en las escenas correspondientes.
- **When** cambia el tamaño del contenedor, **Then** se actualiza el aspect ratio y el tamaño del renderer.
- **When** el paso se desmonta, **Then** se cancela el animation frame y se liberan recursos Three.js implementados.
- **Then** la interacción 3D utiliza eventos de puntero donde el componente lo implementa.

---

# 11. Requisitos no funcionales observables en el código

Estos puntos no son nuevas HUs; son restricciones/decisiones ya presentes en el proyecto:

- Aplicación web cliente con Next.js, React y TypeScript.
- WebGL/Three.js para visualizaciones 3D.
- Tailwind CSS para estilos.
- `reactStrictMode: true`.
- Documento raíz en español (`lang="es"`).
- Diseño responsive mediante clases Tailwind `sm:` y contenedores fluidos.
- La hoja global desactiva selección de texto y overflow horizontal.
- El renderer 3D limita el pixel ratio a 2 en las escenas correspondientes.
- El README declara como objetivo un bundle ligero y 60 FPS, pero **no se encuentra en el snapshot un test de rendimiento que lo verifique**.
- El README describe seguimiento de sesión/métricas, pero la implementación entregada lo hace localmente mediante cookies; no se identifica una API, base de datos o servicio central de analítica.

---

# 12. Deuda de especificación detectada durante la extracción

1. No existen archivos de pruebas en el snapshot: no aparecen `*.test.*`, `*.spec.*`, `__tests__`, Vitest, Jest ni Playwright.
2. El `package.json` no contiene scripts `test`, `test:e2e` o `coverage`.
3. El README declara Next.js 15.1, mientras `package.json` declara `next: ^16.3.8`; esto debe resolverse explícitamente antes de fijar el baseline.
4. `next.config.ts` tiene `ignoreDuringBuilds: true` para ESLint, reduciendo la capacidad del build de actuar como gate de calidad.
5. El modelo de métricas incluye tiempos por misión que no se actualizan.
6. El ID usa `Math.random()`; es suficiente para una demo local, pero no debe interpretarse como identificador fuerte o seguro.
7. La navegación no está bloqueada por completitud, aunque existe un modelo de progreso.
8. La lógica pedagógica está embebida directamente en componentes grandes; dificulta unit testing de reglas de dominio.
9. Las escenas Three.js y las reglas de negocio están acopladas a los componentes React.
10. La medición cuántica depende de aleatoriedad no inyectable, lo que dificulta pruebas deterministas.
11. No existe persistencia remota ni exportación de métricas para el docente.
12. No se observa una política explícita de accesibilidad (focus management, ARIA, reducción de movimiento, navegación completa por teclado para los controles 3D).