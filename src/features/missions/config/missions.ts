/**
 * Canonical Mission Registry for QuantumLab 3D
 * Single source of truth for all mission metadata.
 */

import type { MissionDefinition, StepDefinition, QuizDefinition } from '../types/mission';

export type MissionId =
  | 'superposition'
  | 'entanglement'
  | 'decoherence'
  | 'applications'
  | 'gates'
  | 'grover'
  | 'error-correction';

export type { MissionDefinition, StepDefinition, QuizDefinition };

export const MISSIONS: readonly MissionDefinition[] = [
  // ── M1 ──────────────────────────────────────────────────────────────────
  {
    id: 'superposition',
    title: '1. Superposición Cuántica',
    subtitle: 'El estado base del qubit',
    description: 'Explora cómo un qubit puede existir simultáneamente en |0⟩ y |1⟩.',
    learningObjective:
      'Distinguir el bit clásico del qubit y comprender por qué la superposición permite múltiples valores al mismo tiempo.',
    requiresQuiz: false,
    order: 1,
    prerequisites: [],
    steps: [
      {
        id: 'classical-bit',
        phase: 'BRIEFING',
        title: 'El bit clásico',
        description:
          'Un bit clásico siempre vale 0 o 1. Observa la diferencia con el qubit que verás a continuación.',
        instruction:
          'Un bit clásico siempre vale 0 o 1. Observa la diferencia con el qubit que verás a continuación.',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
      {
        id: 'coin-analogy',
        phase: 'BRIEFING',
        title: 'Analogía de la moneda',
        description:
          'Una moneda girando no es cara ni cruz hasta que aterriza. El qubit en superposición se comporta de manera análoga.',
        instruction:
          'Una moneda girando no es cara ni cruz hasta que aterriza. El qubit en superposición se comporta de manera análoga.',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
      {
        id: 'bloch-state',
        phase: 'BRIEFING',
        title: 'La esfera de Bloch',
        description:
          'Observa el qubit en la esfera de Bloch. El polo norte representa |0⟩ y el polo sur |1⟩; el ecuador es superposición perfecta.',
        instruction:
          'Observa el qubit en la esfera de Bloch. El polo norte representa |0⟩ y el polo sur |1⟩; el ecuador es superposición perfecta.',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
      {
        id: 'measurement',
        phase: 'BRIEFING',
        title: 'Medir el qubit',
        description:
          'Mide el qubit varias veces para observar el colapso estocástico: cada medición da 0 o 1 con la probabilidad que marca la amplitud.',
        instruction:
          'Mide el qubit varias veces para observar el colapso estocástico: cada medición da 0 o 1 con la probabilidad que marca la amplitud.',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
    ],
    quiz: undefined,
  },

  // ── M2 ──────────────────────────────────────────────────────────────────
  {
    id: 'entanglement',
    title: '2. Entrelazamiento Cuántico',
    subtitle: 'Estados Bell y no-localidad',
    description: 'Comprende la correlación instantánea entre qubits entrelazados.',
    learningObjective:
      'Crear un par de Bell y explicar por qué la correlación cuántica no permite transmitir información más rápido que la luz.',
    requiresQuiz: true,
    order: 2,
    prerequisites: ['superposition'],
    steps: [
      {
        id: 'independent-qubits',
        phase: 'BRIEFING',
        title: 'Qubits independientes',
        description:
          'Inicializa dos qubits en |0⟩ por separado. Verifica que medir uno no afecta al otro.',
        instruction:
          'Inicializa dos qubits en |0⟩ por separado. Verifica que medir uno no afecta al otro.',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
      {
        id: 'prepare-bell',
        phase: 'BRIEFING',
        title: 'Crear el par Bell',
        description:
          'Aplica Hadamard al qubit A y luego CNOT con A como control y B como objetivo para crear el estado |Φ⁺⟩.',
        instruction:
          'Aplica Hadamard al qubit A y luego CNOT con A como control y B como objetivo para crear el estado |Φ⁺⟩.',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
      {
        id: 'separation',
        phase: 'BRIEFING',
        title: 'Separación espacial',
        description:
          'Observa que el estado entrelazado permanece aunque los qubits estén en regiones distintas del diagrama.',
        instruction:
          'Observa que el estado entrelazado permanece aunque los qubits estén en regiones distintas del diagrama.',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
      {
        id: 'correlated-measurement',
        phase: 'BRIEFING',
        title: 'Medición correlacionada',
        description:
          'Alice mide su qubit. Cuando obtiene |1⟩, el de Bob colapsa inmediatamente a |1⟩ en la misma base. Repite varias veces.',
        instruction:
          'Alice mide su qubit. Cuando obtiene |1⟩, el de Bob colapsa inmediatamente a |1⟩ en la misma base. Repite varias veces.',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
      {
        id: 'knowledge-check',
        phase: 'BRIEFING',
        title: 'Comprobación de conocimiento',
        description: 'Responde la pregunta para completar la misión.',
        instruction: 'Responde la pregunta para completar la misión.',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
    ],
    quiz: {
      id: 'quiz-entanglement',
      question:
        'Alice mide su qubit en la base computacional y obtiene |1⟩. ¿Cuál es el resultado de Bob al medir en la misma base, y por qué esto no viola la relatividad especial?',
      options: [
        {
          id: 'ent-corr',
          text: 'El resultado de Bob es |1⟩ con certeza; la correlación no transmite información porque el resultado de Alice es aleatorio.',
          explanation:
            'Correcto. El entrelazamiento solo crea correlación: ninguna de las dos partes puede controlar qué resultado obtiene, por lo que no hay señal utilizable.',
        },
        {
          id: 'ent-zero',
          text: 'El resultado de Bob es |0⟩ porque el colapso de Alice lo invierte.',
          explanation:
            'Incorrecto. En el estado |Φ⁺⟩ ambos qubits colapsan al mismo valor, no al opuesto.',
        },
        {
          id: 'ent-signal',
          text: 'El resultado de Bob es |1⟩ y eso permite comunicación instantánea.',
          explanation:
            'Incorrecto. Que la correlación sea instantánea no significa que pueda usarse para enviar información: el resultado de Alice es aleatorio e imprevisible.',
        },
      ],
      correctOptionId: 'ent-corr',
    },
  },

  // ── M3 ──────────────────────────────────────────────────────────────────
  {
    id: 'decoherence',
    title: '3. Decoherencia y Ruido',
    subtitle: 'Interacción con el entorno',
    description: 'Observa cómo la pérdida de fase destruye la superposición.',
    learningObjective:
      'Entender por qué el aislamiento térmico es esencial y cómo el enfriamiento extremo reduce las perturbaciones que colapsan los estados cuánticos.',
    requiresQuiz: true,
    order: 3,
    prerequisites: ['entanglement'],
    steps: [
      {
        id: 'thermal-photon',
        phase: 'BRIEFING',
        title: 'El fotón térmico',
        description:
          'Un fotón de radiación térmica golpea el qubit y le transfiere información del entorno. Observa el efecto sobre la coherencia.',
        instruction:
          'Un fotón de radiación térmica golpea el qubit y le transfiere información del entorno. Observa el efecto sobre la coherencia.',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
      {
        id: 'temperature-coherence',
        phase: 'BRIEFING',
        title: 'Temperatura y coherencia',
        description:
          'Arrastra el control de temperatura y observa cómo el tiempo de coherencia T₂ disminuye al aumentar la temperatura.',
        instruction:
          'Arrastra el control de temperatura y observa cómo el tiempo de coherencia T₂ disminuye al aumentar la temperatura.',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
      {
        id: 'refrigerator',
        phase: 'BRIEFING',
        title: 'Criostato de dilución',
        description:
          'Activa el refrigerador. A ~15 mK el número medio de fotones térmicos cae a ≪ 1, reduciendo drásticamente la decoherencia.',
        instruction:
          'Activa el refrigerador. A ~15 mK el número medio de fotones térmicos cae a ≪ 1, reduciendo drásticamente la decoherencia.',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
      {
        id: 'knowledge-check',
        phase: 'BRIEFING',
        title: 'Comprobación de conocimiento',
        description: 'Responde la pregunta para completar la misión.',
        instruction: 'Responde la pregunta para completar la misión.',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
    ],
    quiz: {
      id: 'quiz-decoherence',
      question: '¿Por qué enfriar el procesador cuántico hasta millikelvin reduce la decoherencia?',
      options: [
        {
          id: 'dec-thermal',
          text: 'Hay menos fotones térmicos que puedan golpear y perturbar los qubits.',
          explanation:
            'Correcto. La población de fotones térmicos sigue la distribución de Bose-Einstein; a 15 mK es exponencialmente pequeña en la frecuencia de los qubits superconductores.',
        },
        {
          id: 'dec-speed',
          text: 'Los qubits procesan más rápido a bajas temperaturas.',
          explanation:
            'Incorrecto. La velocidad de compuerta no es la razón principal del enfriamiento; el objetivo es reducir las perturbaciones ambientales.',
        },
        {
          id: 'dec-signal',
          text: 'El frío aumenta la amplitud de la superposición.',
          explanation:
            'Incorrecto. La amplitud la fija la preparación del estado; el enfriamiento reduce la tasa de errores, no la magnitud de la amplitud.',
        },
      ],
      correctOptionId: 'dec-thermal',
    },
  },

  // ── M4 ──────────────────────────────────────────────────────────────────
  {
    id: 'applications',
    title: '4. Aplicaciones Cuánticas',
    subtitle: 'Casos de uso reales',
    description: 'Aplica los principios cuánticos a problemas de alto impacto.',
    learningObjective:
      'Identificar las clases de problemas donde la computación cuántica puede ofrecer ventaja real, y distinguirlas de las tareas que siguen siendo más eficientes en clásico.',
    requiresQuiz: true,
    order: 4,
    prerequisites: ['decoherence'],
    steps: [
      {
        id: 'myths-applications',
        phase: 'BRIEFING',
        title: 'Mitos y realidades',
        description:
          'Revisa qué tareas se aceleran con computación cuántica y cuáles no. No todo es más rápido en cuántico.',
        instruction:
          'Revisa qué tareas se aceleran con computación cuántica y cuáles no. No todo es más rápido en cuántico.',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
      {
        id: 'molecular-comparison',
        phase: 'BRIEFING',
        title: 'Simulación molecular',
        description:
          'Compara el coste de simular una molécula en un clásico vs. un procesador cuántico. Observa la diferencia exponencial de recursos.',
        instruction:
          'Compara el coste de simular una molécula en un clásico vs. un procesador cuántico. Observa la diferencia exponencial de recursos.',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
      {
        id: 'shor-demo',
        phase: 'BRIEFING',
        title: 'Algoritmo de Shor',
        description:
          'Ejecuta una versión simplificada del algoritmo de Shor para factorizar un número semi-primo y observa la ventaja cuadrática-exponencial.',
        instruction:
          'Ejecuta una versión simplificada del algoritmo de Shor para factorizar un número semi-primo y observa la ventaja cuadrática-exponencial.',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
      {
        id: 'knowledge-check',
        phase: 'BRIEFING',
        title: 'Comprobación de conocimiento',
        description: 'Responde la pregunta para completar la misión.',
        instruction: 'Responde la pregunta para completar la misión.',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
    ],
    quiz: {
      id: 'quiz-applications',
      question:
        '¿Para qué tipo de tareas puede la computación cuántica ofrecer una ventaja demostrable sobre los ordenadores clásicos?',
      options: [
        {
          id: 'app-selected',
          text: 'Tareas seleccionadas con estructura cuántica explotable, como factorización o simulación molecular.',
          explanation:
            'Correcto. La ventaja cuántica es específica de problema: algoritmos como Shor o la simulación de Hamiltonians se benefician de interferencia cuántica que los clásicos no pueden aprovechar eficientemente.',
        },
        {
          id: 'app-all',
          text: 'Cualquier tarea computacional, porque los qubits procesan más información por ciclo.',
          explanation:
            'Incorrecto. Los ordenadores cuánticos no son universalmente más rápidos; para muchas tareas (p. ej., búsqueda de texto, reproducción de vídeo) el clásico es igual o más eficiente.',
        },
        {
          id: 'app-crypto',
          text: 'Solo criptografía, porque los qubits son intrínsecamente secretos.',
          explanation:
            'Incorrecto. La ventaja cuántica abarca también simulación química, optimización combinatoria y aprendizaje automático cuántico, entre otros.',
        },
      ],
      correctOptionId: 'app-selected',
    },
  },

  // ── M5 ──────────────────────────────────────────────────────────────────
  {
    id: 'gates',
    title: '5. Puertas Cuánticas',
    subtitle: 'Operaciones sobre qubits',
    description: 'Comprende y manipula las puertas cuánticas de un qubit y multi-qubit.',
    learningObjective:
      'Aplicar puertas elementales (X, Z, H, CNOT) a qubits y predecir el estado resultante, incluyendo el uso del circuito de tres ranuras de la misión.',
    requiresQuiz: true,
    order: 5,
    prerequisites: ['applications'],
    steps: [
      {
        id: 'gate-basics',
        phase: 'BRIEFING',
        title: 'Fundamentos de puertas',
        description:
          'Una puerta cuántica es una rotación unitaria en el espacio de estados. Observa cómo X, Z y H mueven el vector de Bloch.',
        instruction:
          'Una puerta cuántica es una rotación unitaria en el espacio de estados. Observa cómo X, Z y H mueven el vector de Bloch.',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
      {
        id: 'apply-gates',
        phase: 'BRIEFING',
        title: 'Aplicar puertas',
        description:
          'Arrastra puertas X, Z y H al qubit y observa el resultado en la esfera de Bloch antes de medir.',
        instruction:
          'Arrastra puertas X, Z y H al qubit y observa el resultado en la esfera de Bloch antes de medir.',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
      {
        id: 'teaching-circuit',
        phase: 'BRIEFING',
        title: 'Circuito de tres ranuras',
        description:
          'Coloca exactamente tres puertas en el circuito de enseñanza: prueba H–X–H y comprueba que es equivalente a Z.',
        instruction:
          'Coloca exactamente tres puertas en el circuito de enseñanza: prueba H–X–H y comprueba que es equivalente a Z.',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
      {
        id: 'knowledge-check',
        phase: 'BRIEFING',
        title: 'Comprobación de conocimiento',
        description: 'Responde la pregunta para completar la misión.',
        instruction: 'Responde la pregunta para completar la misión.',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
    ],
    quiz: {
      id: 'quiz-gates',
      question: '¿Qué estado produce la puerta Hadamard (H) aplicada a |0⟩?',
      options: [
        {
          id: 'gate-plus',
          text: '|+⟩ = (|0⟩ + |1⟩) / √2 — superposición con 50 % de probabilidad para cada resultado.',
          explanation:
            'Correcto. H rota el polo norte de la esfera de Bloch hasta el ecuador, creando una superposición equitativa donde ambas medidas son igualmente probables.',
        },
        {
          id: 'gate-one',
          text: '|1⟩ — el qubit se invierte completamente.',
          explanation:
            'Incorrecto. La inversión completa la produce la puerta Pauli-X, no H.',
        },
        {
          id: 'gate-zero',
          text: '|0⟩ — el qubit no cambia.',
          explanation:
            'Incorrecto. H siempre mueve el estado; solo si se aplica dos veces consecutivas devuelve al estado original.',
        },
      ],
      correctOptionId: 'gate-plus',
    },
  },

  // ── M6 ──────────────────────────────────────────────────────────────────
  {
    id: 'grover',
    title: '6. Algoritmo de Grover',
    subtitle: 'Búsqueda cuántica',
    description: 'Aceleración cuadrática para búsqueda en bases no estructuradas.',
    learningObjective:
      'Explicar cómo el oráculo y el operador de difusión de Grover amplifican la amplitud del elemento buscado y qué ventaja complejidad-N tiene sobre la búsqueda clásica.',
    requiresQuiz: true,
    order: 6,
    prerequisites: ['gates'],
    steps: [
      {
        id: 'grover-basics',
        phase: 'BRIEFING',
        title: 'Motivación del algoritmo',
        description:
          'Un ordenador clásico necesita O(N) consultas para encontrar un elemento en una lista no ordenada. Grover lo reduce a O(√N).',
        instruction:
          'Un ordenador clásico necesita O(N) consultas para encontrar un elemento en una lista no ordenada. Grover lo reduce a O(√N).',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
      {
        id: 'search-cost',
        phase: 'BRIEFING',
        title: 'Coste de búsqueda',
        description:
          'Ajusta el tamaño N de la lista y compara el número de consultas clásicas vs. cuánticas necesarias.',
        instruction:
          'Ajusta el tamaño N de la lista y compara el número de consultas clásicas vs. cuánticas necesarias.',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
      {
        id: 'single-iteration',
        phase: 'BRIEFING',
        title: 'Una iteración de Grover',
        description:
          'Observa cómo el oráculo invierte la fase del elemento marcado y el operador de difusión amplifica esa amplitud respecto al promedio.',
        instruction:
          'Observa cómo el oráculo invierte la fase del elemento marcado y el operador de difusión amplifica esa amplitud respecto al promedio.',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
      {
        id: 'full-run-measure',
        phase: 'BRIEFING',
        title: 'Ejecución completa y medición',
        description:
          'Ejecuta ⌊π/4 · √N⌋ iteraciones y mide. La medición es estocástica: el elemento correcto aparece con alta probabilidad, no con certeza.',
        instruction:
          'Ejecuta ⌊π/4 · √N⌋ iteraciones y mide. La medición es estocástica: el elemento correcto aparece con alta probabilidad, no con certeza.',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
      {
        id: 'knowledge-check',
        phase: 'BRIEFING',
        title: 'Comprobación de conocimiento',
        description: 'Responde la pregunta para completar la misión.',
        instruction: 'Responde la pregunta para completar la misión.',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
    ],
    quiz: {
      id: 'quiz-grover',
      question:
        '¿Qué hace el operador de difusión (inversión sobre la media) en cada iteración de Grover, y qué asume el análisis de complejidad sobre las mediciones intermedias?',
      options: [
        {
          id: 'grov-amplify',
          text: 'Amplifica la amplitud del estado marcado respecto al promedio; el análisis asume que se mide solo al final del número óptimo de iteraciones.',
          explanation:
            'Correcto. La inversión sobre la media aumenta las amplitudes por encima del promedio y disminuye las que están por debajo; medir antes del número óptimo de iteraciones reduce la probabilidad de éxito.',
        },
        {
          id: 'grov-collapse',
          text: 'Colapsa todas las amplitudes a la del elemento buscado de una vez.',
          explanation:
            'Incorrecto. La amplificación es gradual: cada iteración aumenta la probabilidad del estado marcado, pero no lo selecciona instantáneamente.',
        },
        {
          id: 'grov-certain',
          text: 'Garantiza encontrar el elemento con probabilidad 1 en una sola iteración.',
          explanation:
            'Incorrecto. Una sola iteración mejora la probabilidad pero rara vez es suficiente; se necesitan ⌊π/4·√N⌋ iteraciones y la medición sigue siendo estocástica.',
        },
      ],
      correctOptionId: 'grov-amplify',
    },
  },

  // ── M7 ──────────────────────────────────────────────────────────────────
  {
    id: 'error-correction',
    title: '7. Corrección de Errores',
    subtitle: 'Qubits lógicos y redundancia',
    description: 'Protección contra el ruido mediante redundancia cuántica.',
    learningObjective:
      'Describir el código de repetición de tres qubits, distinguir la detección de síndrome de la medición directa, y enunciar el límite que impone el supuesto de error único.',
    requiresQuiz: true,
    order: 7,
    prerequisites: ['grover'],
    steps: [
      {
        id: 'error-basics',
        phase: 'BRIEFING',
        title: 'Por qué necesitamos corrección',
        description:
          'Los qubits físicos cometen errores. La corrección cuántica de errores codifica un qubit lógico en varios físicos para detectar y corregir fallos.',
        instruction:
          'Los qubits físicos cometen errores. La corrección cuántica de errores codifica un qubit lógico en varios físicos para detectar y corregir fallos.',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
      {
        id: 'bit-flip',
        phase: 'BRIEFING',
        title: 'Error de bit-flip',
        description:
          'Codifica |ψ⟩ en tres qubits (|000⟩ o |111⟩). Introduce un error X en uno de ellos y observa cómo el síndrome lo identifica.',
        instruction:
          'Codifica |ψ⟩ en tres qubits (|000⟩ o |111⟩). Introduce un error X en uno de ellos y observa cómo el síndrome lo identifica.',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
      {
        id: 'phase-flip',
        phase: 'BRIEFING',
        title: 'Error de phase-flip',
        description:
          'Aplica una puerta Hadamard para cambiar de base y observa un error Z (phase-flip) con el mismo mecanismo de síndrome.',
        instruction:
          'Aplica una puerta Hadamard para cambiar de base y observa un error Z (phase-flip) con el mismo mecanismo de síndrome.',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
      {
        id: 'syndrome-majority',
        phase: 'BRIEFING',
        title: 'Síndrome y votación mayoritaria',
        description:
          'Mide los ancilla para obtener el síndrome de error. La lógica de mayoría identifica qué qubit corregir sin colapsar el estado lógico.',
        instruction:
          'Mide los ancilla para obtener el síndrome de error. La lógica de mayoría identifica qué qubit corregir sin colapsar el estado lógico.',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
      {
        id: 'knowledge-check',
        phase: 'BRIEFING',
        title: 'Comprobación de conocimiento',
        description: 'Responde la pregunta para completar la misión.',
        instruction: 'Responde la pregunta para completar la misión.',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
    ],
    quiz: {
      id: 'quiz-error-correction',
      question:
        '¿Qué puede y qué no puede corregir el código de repetición de tres qubits físicos bajo el supuesto de error único?',
      options: [
        {
          id: 'ec-one',
          text: 'Corrige exactamente un error de bit-flip en cualquiera de los tres qubits; no puede corregir dos o más errores simultáneos.',
          explanation:
            'Correcto. El código de distancia 3 corrige ⌊(3−1)/2⌋ = 1 error. Si dos qubits se corrompen simultáneamente, la votación mayoritaria identifica mal el error y el resultado es incorrecto.',
        },
        {
          id: 'ec-any',
          text: 'Corrige cualquier número de errores, ya que la redundancia siempre permite recuperar el estado.',
          explanation:
            'Incorrecto. Con dos errores la mayoría vota al valor incorrecto; el código no puede distinguir ese caso del estado sin error.',
        },
        {
          id: 'ec-phase',
          text: 'Corrige tanto bit-flips como phase-flips sin necesidad de cambio de base.',
          explanation:
            'Incorrecto. El código de repetición estándar solo corrige bit-flips. Para corregir phase-flips se necesita aplicar Hadamard o usar el código de Shor.',
        },
      ],
      correctOptionId: 'ec-one',
    },
  },
];

export const CORE_MISSION_IDS: readonly MissionId[] = MISSIONS.map((m) => m.id);

export function getCoreMissions(): MissionDefinition[] {
  return [...MISSIONS].sort((a, b) => a.order - b.order);
}

export function getMissionById(id: string): MissionDefinition | undefined {
  return MISSIONS.find((m) => m.id === id);
}

export function isMissionId(val: unknown): val is MissionId {
  return typeof val === 'string' && MISSIONS.some((m) => m.id === val);
}

export function isMainJourneyComplete(
  completed: string[] | Set<string> | Record<string, boolean>
): boolean {
  const coreIds = MISSIONS.map((m) => m.id);
  if (Array.isArray(completed)) {
    return coreIds.every((id) => completed.includes(id));
  }
  if (completed instanceof Set) {
    return coreIds.every((id) => completed.has(id));
  }
  if (completed && typeof completed === 'object') {
    return coreIds.every((id) => Boolean(completed[id as keyof typeof completed]));
  }
  return false;
}

export const missions = MISSIONS;