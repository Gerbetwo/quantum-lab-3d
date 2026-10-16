import { useQuantumStore, useSession } from "@/store/useQuantumStore";
import { useMemo, useCallback, useSyncExternalStore, useEffect } from "react";

// --- Section: src/features/missions/config/missions.ts ---
export type MissionId =
  | 'superposition'
  | 'entanglement'
  | 'decoherence'
  | 'applications'
  | 'gates'
  | 'grover'
  | 'error-correction';

export type { MissionDefinition, StepDefinition };

export const MISSIONS: readonly MissionDefinition[] = [
  {
    id: 'superposition',
    title: '1. Superposición Cuántica',
    subtitle: 'El estado base del qubit',
    description: 'Explora cómo un qubit puede existir simultáneamente en |0⟩ y |1⟩.',
    learningObjective: 'Distinguir el bit clásico del qubit y comprender por qué la superposición permite múltiples valores al mismo tiempo.',
    requiresQuiz: false,
    order: 1,
    prerequisites: [],
    unlocked: true,
    steps: [
      {
        id: 'classical-bit',
        phase: 'BRIEFING',
        title: 'El bit clásico',
        description: 'Un bit clásico siempre vale 0 o 1. Observa la diferencia con el qubit que verás a continuación.',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
      {
        id: 'coin-analogy',
        phase: 'BRIEFING',
        title: 'Analogía de la moneda',
        description: 'Una moneda girando no es cara ni cruz hasta que aterriza. El qubit en superposición se comporta de manera análoga.',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
      {
        id: 'bloch-state',
        phase: 'BRIEFING',
        title: 'La esfera de Bloch',
        description: 'Observa el qubit en la esfera de Bloch. El polo norte representa |0⟩ y el polo sur |1⟩; el ecuador es superposición perfecta.',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
      {
        id: 'measurement',
        phase: 'BRIEFING',
        title: 'Medir el qubit',
        description: 'Mide el qubit varias veces para observar el colapso estocástico: cada medición da 0 o 1 con la probabilidad que marca la amplitud.',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
    ],
  },
  {
    id: 'entanglement',
    title: '2. Entrelazamiento Cuántico',
    subtitle: 'Estados Bell y no-localidad',
    description: 'Comprende la correlación instantánea entre qubits entrelazados.',
    learningObjective: 'Crear un par de Bell y explicar por qué la correlación cuántica no permite transmitir información más rápido que la luz.',
    requiresQuiz: true,
    order: 2,
    prerequisites: [],
    unlocked: true,
    steps: [
      {
        id: 'independent-qubits',
        phase: 'BRIEFING',
        title: 'Qubits independientes',
        description: 'Inicializa dos qubits en |0⟩ por separado. Verifica que medir one no afecta al otro.',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
      {
        id: 'prepare-bell',
        phase: 'BRIEFING',
        title: 'Crear el par Bell',
        description: 'Aplica Hadamard al qubit A y luego CNOT con A como control y B como objetivo para crear el estado |Φ⁺⟩.',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
      {
        id: 'separation',
        phase: 'BRIEFING',
        title: 'Separación espacial',
        description: 'Observa que el estado entrelazado permanece aunque los qubits estén en regiones distintas del diagrama.',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
      {
        id: 'correlated-measurement',
        phase: 'BRIEFING',
        title: 'Medición correlacionada',
        description: 'Alice mide su qubit. Cuando obtiene |1⟩, el de Bob colapsa inmediatamente a |1⟩ en la misma base. Repite varias veces.',
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
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
    ],
    quiz: {
      id: 'quiz-entanglement',
      question: 'Alice mide su qubit en la base computacional y obtiene |1⟩. ¿Cuál es el resultado de Bob al medir en la misma base, y por qué esto no viola la relatividad especial?',
      options: [
        {
          id: 'ent-corr',
          text: 'El resultado de Bob es |1⟩ con certeza; la correlación no transmite información porque el resultado de Alice es aleatorio.',
          explanation: 'Correcto. El entrelazamiento solo crea correlación: ninguna de las dos partes puede controlar qué resultado obtiene, por lo que no hay señal utilizable.',
        },
        {
          id: 'ent-zero',
          text: 'El resultado de Bob es |0⟩ porque el colapso de Alice lo invierte.',
          explanation: 'Incorrecto. En el estado |Φ⁺⟩ ambos qubits colapsan al mismo valor, no al opuesto.',
        },
        {
          id: 'ent-signal',
          text: 'El resultado de Bob es |1⟩ y eso permite comunicación instantánea.',
          explanation: 'Incorrecto. Que la correlación sea instantánea no significa que pueda usarse para enviar información: el resultado de Alice es aleatorio e imprevisible.',
        },
      ],
      correctOptionId: 'ent-corr',
    },
  },
  {
    id: 'decoherence',
    title: '3. Decoherencia y Ruido',
    subtitle: 'Interacción con el entorno',
    description: 'Observa cómo la pérdida de fase destruye la superposición.',
    learningObjective: 'Entender por qué el aislamiento térmico es esencial y cómo el enfriamiento extremo reduce las perturbaciones que colapsan los estados cuánticos.',
    requiresQuiz: true,
    order: 3,
    prerequisites: [],
    unlocked: true,
    steps: [
      {
        id: 'thermal-photon',
        phase: 'BRIEFING',
        title: 'El fotón térmico',
        description: 'Un fotón de radiación térmica golpea el qubit y le transfiere información del entorno. Observa el efecto sobre la coherencia.',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
      {
        id: 'temperature-coherence',
        phase: 'BRIEFING',
        title: 'Temperatura y coherencia',
        description: 'Arrastra el control de temperatura y observa cómo el tiempo de coherencia T₂ disminuye al aumentar la temperatura.',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
      {
        id: 'refrigerator',
        phase: 'BRIEFING',
        title: 'Criostato de dilución',
        description: 'Activa el refrigerador. A ~15 mK el número medio de fotones térmicos cae a ≪ 1, reduciendo drásticamente la decoherencia.',
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
          explanation: 'Correcto. La población de fotones térmicos sigue la distribución de Bose-Einstein; a 15 mK es exponencialmente pequeña en la frecuencia de los qubits superconductores.',
        },
        {
          id: 'dec-speed',
          text: 'Los qubits procesan más rápido a bajas temperaturas.',
          explanation: 'Incorrecto. La velocidad de compuerta no es la razón principal del enfriamiento; el objetivo es reducir las perturbaciones ambientales.',
        },
        {
          id: 'dec-signal',
          text: 'El frío aumenta la amplitud de la superposición.',
          explanation: 'Incorrecto. La amplitud la fija la preparación del estado; el enfriamiento reduce la tasa de errores, no la magnitud de la amplitud.',
        },
      ],
      correctOptionId: 'dec-thermal',
    },
  },
  {
    id: 'applications',
    title: '4. Aplicaciones Cuánticas',
    subtitle: 'Casos de uso reales',
    description: 'Aplica los principios cuánticos a problemas de alto impacto.',
    learningObjective: 'Identificar las clases de problemas donde la computación cuántica puede ofrecer ventaja real, y distinguirlas de las tareas que siguen siendo más eficientes en clásico.',
    requiresQuiz: true,
    order: 4,
    prerequisites: [],
    unlocked: true,
    steps: [
      {
        id: 'myths-applications',
        phase: 'BRIEFING',
        title: 'Mitos y realidades',
        description: 'Revisa qué tareas se aceleran con computación cuántica y cuáles no. No todo es más rápido en cuántico.',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
      {
        id: 'molecular-comparison',
        phase: 'BRIEFING',
        title: 'Simulación molecular',
        description: 'Compara el coste de simular una molécula en un clásico vs. un procesador cuántico. Observa la diferencia exponencial de recursos.',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
      {
        id: 'shor-demo',
        phase: 'BRIEFING',
        title: 'Algoritmo de Shor',
        description: 'Ejecuta una versión simplificada del algoritmo de Shor para factorizar un número semi-primo y observa la ventaja cuadrática-exponencial.',
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
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
    ],
    quiz: {
      id: 'quiz-applications',
      question: '¿Para qué tipo de tareas puede la computación cuántica ofrecer una ventaja demostrable sobre los ordenadores clásicos?',
      options: [
        {
          id: 'app-selected',
          text: 'Tareas seleccionadas con estructura cuántica explotable, como factorización o simulación molecular.',
          explanation: 'Correcto. La ventaja cuántica es específica de problema: algoritmos como Shor o la simulación de Hamiltonians se benefician de interferencia cuántica que los clásicos no pueden aprovechar eficientemente.',
        },
        {
          id: 'app-all',
          text: 'Cualquier tarea computacional, porque los qubits procesan más información por ciclo.',
          explanation: 'Incorrecto. Los ordenadores cuánticos no son universalmente más rápidos; para muchas tareas (p. ej., búsqueda de texto, reproducción de vídeo) el clásico es igual o más eficiente.',
        },
        {
          id: 'app-crypto',
          text: 'Solo criptografía, porque los qubits son intrínsecamente secretos.',
          explanation: 'Incorrecto. La ventaja cuántica abarca también simulación química, optimización combinatoria y aprendizaje automático cuántico, entre otros.',
        },
      ],
      correctOptionId: 'app-selected',
    },
  },
  {
    id: 'gates',
    title: '5. Puertas Cuánticas',
    subtitle: 'Operaciones sobre qubits',
    description: 'Comprende y manipula las puertas cuánticas de un qubit y multi-qubit.',
    learningObjective: 'Aplicar puertas elementales (X, Z, H, CNOT) a qubits y predecir el estado resultante, incluyendo el uso del circuito de tres ranuras de la misión.',
    requiresQuiz: true,
    order: 5,
    prerequisites: [],
    unlocked: true,
    steps: [
      {
        id: 'gate-basics',
        phase: 'BRIEFING',
        title: 'Fundamentos de puertas',
        description: 'Una puerta cuántica es una rotación unitaria en el espacio de estados. Observa cómo X, Z y H mueven el vector de Bloch.',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
      {
        id: 'apply-gates',
        phase: 'BRIEFING',
        title: 'Aplicar puertas',
        description: 'Arrastra puertas X, Z y H al qubit y observa el resultado en la esfera de Bloch antes de medir.',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
      {
        id: 'teaching-circuit',
        phase: 'BRIEFING',
        title: 'Circuito de tres ranuras',
        description: 'Coloca exactamente tres puertas en el circuito de enseñanza: prueba H–X–H y comprueba que es equivalente a Z.',
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
          explanation: 'Correcto. H rota el polo norte de la esfera de Bloch hasta el ecuador, creando una superposición equitativa donde ambas medidas son igualmente probables.',
        },
        {
          id: 'gate-one',
          text: '|1⟩ — el qubit se invierte completamente.',
          explanation: 'Incorrecto. La inversión completa la produce la puerta Pauli-X, no H.',
        },
        {
          id: 'gate-zero',
          text: '|0⟩ — el qubit no cambia.',
          explanation: 'Incorrecto. H siempre mueve el estado; solo si se aplica dos veces consecutivas devuelve al estado original.',
        },
      ],
      correctOptionId: 'gate-plus',
    },
  },
  {
    id: 'grover',
    title: '6. Algoritmo de Grover',
    subtitle: 'Búsqueda cuántica',
    description: 'Aceleración cuadrática para búsqueda en bases no estructuradas.',
    learningObjective: 'Explicar cómo el oráculo y el operador de difusión de Grover amplifican la amplitud del elemento buscado y qué ventaja complejidad-N tiene sobre la búsqueda clásica.',
    requiresQuiz: true,
    order: 6,
    prerequisites: [],
    unlocked: true,
    steps: [
      {
        id: 'grover-basics',
        phase: 'BRIEFING',
        title: 'Motivación del algoritmo',
        description: 'Un ordenador clásico necesita O(N) consultas para encontrar un elemento en una lista no ordenada. Grover lo reduce a O(√N).',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
      {
        id: 'search-cost',
        phase: 'BRIEFING',
        title: 'Coste de búsqueda',
        description: 'Ajusta el tamaño N de la lista y compara el número de consultas clásicas vs. cuánticas necesarias.',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
      {
        id: 'single-iteration',
        phase: 'BRIEFING',
        title: 'Una iteración de Grover',
        description: 'Observa cómo el oráculo invierte la fase del elemento marcado y el operador de difusión amplifica esa amplitud respecto al promedio.',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
      {
        id: 'full-run-measure',
        phase: 'BRIEFING',
        title: 'Ejecución completa y medición',
        description: 'Ejecuta ⌊π/4 · √N⌋ iteraciones y mide. La medición es estocástica: el elemento correcto aparece con alta probabilidad, no con certeza.',
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
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
    ],
    quiz: {
      id: 'quiz-grover',
      question: '¿Qué hace el operador de difusión (inversión sobre la media) en cada iteración de Grover, y qué asume el análisis de complejidad sobre las mediciones intermedias?',
      options: [
        {
          id: 'grov-amplify',
          text: 'Amplifica la amplitud del estado marcado respecto al promedio; el análisis asume que se mide solo al final del número óptimo de iteraciones.',
          explanation: 'Correcto. La inversión sobre la media aumenta las amplitudes por encima del promedio y disminuye las que están por debajo; medir antes del número óptimo de iteraciones reduce la probabilidad de éxito.',
        },
        {
          id: 'grov-collapse',
          text: 'Colapsa todas las amplitudes a la del elemento buscado de una vez.',
          explanation: 'Incorrecto. La amplificación es gradual: cada iteración aumenta la probabilidad del estado marcado, pero no lo selecciona instantáneamente.',
        },
        {
          id: 'grov-certain',
          text: 'Garantiza encontrar el elemento con probabilidad 1 en una sola iteración.',
          explanation: 'Incorrecto. Una sola iteración mejora la probabilidad pero rara vez es suficiente; se necesitan ⌊π/4·√N⌋ iteraciones y la medición sigue siendo estocástica.',
        },
      ],
      correctOptionId: 'grov-amplify',
    },
  },
  {
    id: 'error-correction',
    title: '7. Corrección de Errores',
    subtitle: 'Qubits lógicos y redundancia',
    description: 'Protección contra el ruido mediante redundancia cuántica.',
    learningObjective: 'Describir el código de repetición de tres qubits, distinguir la detección de síndrome de la medición directa, y enunciar el límite que impone el supuesto de error único.',
    requiresQuiz: true,
    order: 7,
    prerequisites: [],
    unlocked: true,
    steps: [
      {
        id: 'error-basics',
        phase: 'BRIEFING',
        title: 'Por qué necesitamos corrección',
        description: 'Los qubits físicos cometen errores. La corrección cuántica de errores codifica un qubit lógico en varios físicos para detectar y corregir fallos.',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
      {
        id: 'bit-flip',
        phase: 'BRIEFING',
        title: 'Error de bit-flip',
        description: 'Codifica |ψ⟩ en tres qubits (|000⟩ o |111⟩). Introduce un error X en uno de ellos y observa cómo el síndrome lo identifica.',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
      {
        id: 'phase-flip',
        phase: 'BRIEFING',
        title: 'Error de phase-flip',
        description: 'Aplica una puerta Hadamard para cambiar de base y observa un error Z (phase-flip) con el mismo mecanismo de síndrome.',
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
      {
        id: 'syndrome-majority',
        phase: 'BRIEFING',
        title: 'Síndrome y votación mayoritaria',
        description: 'Mide los ancilla para obtener el síndrome de error. La lógica de mayoría identifica qué qubit corregir sin colapsar el estado lógico.',
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
        targetTheta: 0,
        targetPhi: 0,
        allowedGates: ['X', 'Y', 'Z', 'H', 'S', 'T'],
        expectedProbability0: 1,
      },
    ],
    quiz: {
      id: 'quiz-error-correction',
      question: '¿Qué puede y qué no puede corregir el código de repetición de tres qubits físicos bajo el supuesto de error único?',
      options: [
        {
          id: 'ec-one',
          text: 'Corrige exactamente un error de bit-flip en cualquiera de los tres qubits; no puede corregir dos o más errores simultáneos.',
          explanation: 'Correcto. El código de distancia 3 corrige ⌊(3−1)/2⌋ = 1 error. Si dos qubits se corrompen simultáneamente, la votación mayoritaria identifica mal el error y el resultado es incorrecto.',
        },
        {
          id: 'ec-any',
          text: 'Corrige cualquier número de errores, ya que la redundancia siempre permite recuperar el estado.',
          explanation: 'Incorrecto. Con dos errores la mayoría vota al valor incorrecto; el código no puede distinguir ese caso del estado sin error.',
        },
        {
          id: 'ec-phase',
          text: 'Corrige tanto bit-flips como phase-flips sin necesidad de cambio de base.',
          explanation: 'Incorrecto. El código de repetición estándar solo corrige bit-flips. Para corregir phase-flips se necesita aplicar Hadamard o usar el código de Shor.',
        },
      ],
      correctOptionId: 'ec-one',
    },
  },
];

export const CORE_MISSION_IDS: readonly MissionId[] = MISSIONS.map((_m) => _m.id);

export function getCoreMissions(): MissionDefinition[] {
  return [...MISSIONS].sort((_a, _b) => _a.order - _b.order);
}

export function getMissionById(_id: string): MissionDefinition | undefined {
  return MISSIONS.find((_m) => _m.id === _id);
}

export function isMissionId(val: unknown): val is MissionId {
  return typeof val === 'string' && MISSIONS.some((_m) => _m.id === val);
}

export function isMainJourneyComplete(
  completed: string[] | Set<string> | Record<string, boolean>
): boolean {
  const coreIds = MISSIONS.map((_m) => _m.id);
  if (Array.isArray(completed)) {
    return coreIds.every((_id) => completed.includes(_id));
  }
  if (completed instanceof Set) {
    return coreIds.every((_id) => completed.has(_id));
  }
  if (completed && typeof completed === 'object') {
    return coreIds.every((_id) => Boolean(completed[_id as keyof typeof completed]));
  }
  return false;
}

export const missions = MISSIONS;

// --- Section: src/features/missions/domain/missionMachine.ts ---
export type MissionPhase =
  | 'BRIEFING'
  | 'PREDICTION'
  | 'MANIPULATION'
  | 'MEASUREMENT'
  | 'VERIFICATION'
  | 'SUCCESS';

export const MISSION_PHASES: readonly MissionPhase[] = [
  'BRIEFING',
  'PREDICTION',
  'MANIPULATION',
  'MEASUREMENT',
  'VERIFICATION',
  'SUCCESS',
] as const;

export const isMissionPhase = (value: unknown): value is MissionPhase =>
  typeof value === 'string' && (MISSION_PHASES as readonly string[]).includes(value);

export type MissionState = 'not_started' | 'in_progress' | 'assessment' | 'completed';

export interface MissionProgress {
  state: MissionState;
  currentStep: number;
  maxUnlockedStep: number;
  completedSteps: number[];
  quizPassed: boolean;
}

export function createInitialMissionState(): MissionProgress {
  return {
    state: 'not_started',
    currentStep: 0,
    maxUnlockedStep: 0,
    completedSteps: [],
    quizPassed: false,
  };
}

export function canNavigateToStep(
  targetStep: number,
  _totalSteps: number,
  progress: MissionProgress,
  _stepRequirements: Record<number, boolean> = {},
): boolean {
  if (targetStep < 0 || targetStep >= _totalSteps) return false;
  if (targetStep <= progress.maxUnlockedStep) return true;
  if (targetStep === progress.maxUnlockedStep + 1) {
    return _stepRequirements[progress.maxUnlockedStep] ?? true;
  }
  return false;
}

export function advanceStep(
  currentStep: number,
  totalSteps: number,
  progress: MissionProgress,
  _stepRequirements: Record<number, boolean> = {},
  _requiresQuiz = true,
): MissionProgress {
  if (progress.state === 'completed') return progress;

  const nextStep = currentStep + 1;

  if (nextStep >= totalSteps) {
    const completedSteps = Array.from(new Set([...progress.completedSteps, currentStep]));
    const finalState: MissionState =
      _requiresQuiz && !progress.quizPassed ? 'assessment' : 'completed';
    return {
      ...progress,
      state: finalState,
      currentStep: totalSteps - 1,
      maxUnlockedStep: Math.max(progress.maxUnlockedStep, totalSteps - 1),
      completedSteps,
    };
  }

  const isAllowed = canNavigateToStep(nextStep, totalSteps, progress, _stepRequirements);
  if (!isAllowed) return progress;

  const newMax = Math.max(progress.maxUnlockedStep, nextStep);
  const completedSteps = Array.from(new Set([...progress.completedSteps, currentStep]));

  return {
    ...progress,
    state: progress.state === 'not_started' ? 'in_progress' : progress.state,
    currentStep: nextStep,
    maxUnlockedStep: newMax,
    completedSteps,
  };
}

export function previousStep(
  currentStep: number,
  progress: MissionProgress,
): MissionProgress {
  if (currentStep <= 0) return progress;
  return { ...progress, currentStep: currentStep - 1 };
}

export function navigateToStep(
  targetStep: number,
  _totalSteps: number,
  progress: MissionProgress,
  _stepRequirements: Record<number, boolean> = {},
): MissionProgress {
  if (!canNavigateToStep(targetStep, _totalSteps, progress, _stepRequirements)) {
    return progress;
  }
  return { ...progress, currentStep: targetStep };
}

export function completeQuiz(progress: MissionProgress): MissionProgress {
  if (progress.quizPassed && progress.state === 'completed') return progress;
  return { ...progress, quizPassed: true, state: 'completed' };
}

export function isMissionComplete(_progress: MissionProgress): boolean {
  return _progress.state === 'completed';
}

export interface MissionProgressState {
  currentMissionId: string | null;
  activeStepIndex: number;
  currentPhase: MissionPhase;
  userPredictionProb0: number | null;
  appliedGatesHistory: string[];
  isVerified: boolean;
  errorState: string | null;
}

export const createInitialMissionProgressState = (
  _missionId: string | null = null,
): MissionProgressState => ({
  currentMissionId: _missionId,
  activeStepIndex: 0,
  currentPhase: 'BRIEFING',
  userPredictionProb0: null,
  appliedGatesHistory: [],
  isVerified: false,
  errorState: null,
});

export const VALID_TRANSITIONS: Record<MissionPhase, MissionPhase[]> = {
  BRIEFING: ['PREDICTION'],
  PREDICTION: ['MANIPULATION'],
  MANIPULATION: ['MEASUREMENT'],
  MEASUREMENT: ['VERIFICATION'],
  VERIFICATION: ['SUCCESS', 'MANIPULATION'],
  SUCCESS: ['BRIEFING'],
};

export function canTransition(
  currentState: MissionProgressState,
  nextPhase: MissionPhase,
): boolean {
  const allowedNextPhases = VALID_TRANSITIONS[currentState.currentPhase];
  if (!allowedNextPhases || !allowedNextPhases.includes(nextPhase)) {
    return false;
  }

  switch (currentState.currentPhase) {
    case 'PREDICTION':
      if (nextPhase === 'MANIPULATION') {
        return currentState.userPredictionProb0 !== null;
      }
      break;
    case 'MANIPULATION':
      if (nextPhase === 'MEASUREMENT') {
        return currentState.appliedGatesHistory.length > 0;
      }
      break;
    case 'VERIFICATION':
      if (nextPhase === 'SUCCESS') {
        return currentState.isVerified;
      }
      if (nextPhase === 'MANIPULATION') {
        return !currentState.isVerified;
      }
      break;
    default:
      break;
  }

  return true;
}

export function transitionPhase(
  currentState: MissionProgressState,
  nextPhase: MissionPhase,
): MissionProgressState {
  if (!canTransition(currentState, nextPhase)) {
    throw new Error(
      `Invalid phase transition from '${currentState.currentPhase}' to '${nextPhase}'.`,
    );
  }

  return {
    ...currentState,
    currentPhase: nextPhase,
    errorState: null,
  };
}

export function verifyState(
  _actualTheta: number,
  _actualPhi: number,
  targetTheta: number,
  _targetPhi: number,
  tolerance: number = 0.05,
): boolean {
  const thetaDiff = Math.abs(_actualTheta - targetTheta);

  const isAtPole =
    Math.abs(targetTheta) <= tolerance ||
    Math.abs(targetTheta - Math.PI) <= tolerance;

  if (isAtPole) {
    return thetaDiff <= tolerance;
  }

  const normPhiActual = ((_actualPhi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const normPhiTarget = ((_targetPhi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const rawPhiDiff = Math.abs(normPhiActual - normPhiTarget);
  const phiDiff = Math.min(rawPhiDiff, 2 * Math.PI - rawPhiDiff);

  return thetaDiff <= tolerance && phiDiff <= tolerance;
}

export interface MissionStep {
  id: string;
  phase: MissionPhase;
  title: string;
  description: string;
  instruction?: string;
  targetTheta: number;
  targetPhi: number;
  allowedGates: string[];
  expectedProbability0: number;
}

export type StepDefinition = MissionStep;

export interface QuizOptionDefinition {
  id: string;
  text: string;
  explanation?: string;
}

export interface QuizDefinition {
  id: string;
  question: string;
  options: QuizOptionDefinition[];
  correctOptionId: string;
  explanation?: string;
}

export type MissionSceneType = 'bloch' | 'cryostat' | 'entanglement' | 'shor';

export interface MissionDefinition {
  id: MissionId;
  title: string;
  subtitle: string;
  description: string;
  learningObjective: string;
  requiresQuiz: boolean;
  order: number;
  icon?: string;
  sceneType?: MissionSceneType;
  prerequisites: MissionId[];
  unlocked?: boolean;
  steps: MissionStep[];
  quiz?: QuizDefinition;
}

export type Mission = MissionDefinition;
export type MissionConfig = MissionDefinition;

export interface MissionExperienceProps<
  TState extends Record<string, unknown> = Record<string, unknown>,
> {
  missionId: MissionId;
  activeStepId: string;
  state: TState;
  onUpdateState: (newState: TState | ((prev: TState) => TState)) => void;
  onCompleteStep: (stepId?: string) => void;
  onAction: (actionName: string, payload?: unknown) => void;
}

export type MissionStepProps<
  TState extends Record<string, unknown> = Record<string, unknown>,
> = MissionExperienceProps<TState>;

export const getStepPhase = (_step: MissionStep): MissionPhase => _step.phase;

export const isGateAllowed = (_step: MissionStep, _gateId: string): boolean =>
  _step.allowedGates.includes(_gateId);

export const findStepIndexById = (
  _steps: readonly MissionStep[],
  _stepId: string,
): number => _steps.findIndex((_step) => _step.id === _stepId);

// --- Section: src/features/missions/hooks/useGuidedMission.ts ---
export interface MissionInternalState {
  currentStepIndex: number;
  completedSteps: string[];
  quizPassed: boolean;
  interaction: Record<string, unknown>;
  [key: string]: unknown;
}

export function useGuidedMission(missionId: MissionId | string) {
  const { session, updateMissionState, completeMission } = useSession();

  const missionState = useQuantumStore((state) => state.missionState);
  const transitionMissionPhase = useQuantumStore(
    (state) => state.transitionMissionPhase
  );
  const setPrediction = useQuantumStore((state) => state.setPrediction);
  const applyGateToMission = useQuantumStore(
    (state) => state.applyGateToMission
  );
  const evaluateMissionStep = useQuantumStore(
    (state) => state.evaluateMissionStep
  );

  const mission = useMemo(() => getMissionById(missionId), [missionId]);

  const rawMissionState = useMemo(
    () =>
      ((isMissionId(missionId)
        ? session.missionState[missionId]
        : (session.missionState as Record<string, unknown>)[
            missionId
          ]) as MissionInternalState) || {},
    [session.missionState, missionId]
  );

  const rawIndex = rawMissionState?.currentStepIndex;
  const currentStepIndex =
    typeof rawIndex === "number" && Number.isFinite(rawIndex)
      ? Math.max(0, Math.min(rawIndex, (mission?.steps.length ?? 1) - 1))
      : 0;

  const completedSteps = useMemo(
    () =>
      Array.isArray(rawMissionState.completedSteps)
        ? rawMissionState.completedSteps.filter(
            (s): s is string => typeof s === "string"
          )
        : [],
    [rawMissionState.completedSteps]
  );

  const quizPassed =
    typeof rawMissionState.quizPassed === "boolean"
      ? rawMissionState.quizPassed
      : false;

  const interaction = useMemo(
    () =>
      rawMissionState.interaction &&
      typeof rawMissionState.interaction === "object" &&
      !Array.isArray(rawMissionState.interaction)
        ? (rawMissionState.interaction as Record<string, unknown>)
        : {},
    [rawMissionState.interaction]
  );

  const steps = useMemo(() => mission?.steps || [], [mission?.steps]);
  const currentStep = steps[currentStepIndex];

  const currentStepConfig = useMemo((): MissionStep => {
    if (currentStep) {
      return currentStep;
    }
    return {
      id: "default-step",
      phase: missionState.currentPhase,
      title: mission?.title || "Mission Step",
      description: mission?.description || "",
      targetTheta: 0,
      targetPhi: 0,
      allowedGates: ["X", "Y", "Z", "H", "S", "T"],
      expectedProbability0: 1,
    };
  }, [currentStep, missionState.currentPhase, mission]);

  const isPredictionAllowed = useMemo(
    () => missionState.currentPhase === "PREDICTION",
    [missionState.currentPhase]
  );

  const isManipulationAllowed = useMemo(
    () => missionState.currentPhase === "MANIPULATION",
    [missionState.currentPhase]
  );

  const isMeasurementAllowed = useMemo(
    () => missionState.currentPhase === "MEASUREMENT",
    [missionState.currentPhase]
  );

  const isUnlocked = useMemo(() => {
    if (!mission) return false;
    if (!mission.prerequisites || mission.prerequisites.length === 0)
      return true;
    return mission.prerequisites.every((reqId) =>
      session.completed.includes(reqId)
    );
  }, [mission, session.completed]);

  const isCompleted = useMemo(() => {
    return (
      session.completed.includes(missionId as MissionId) ||
      (steps.length > 0 && completedSteps.length >= steps.length)
    );
  }, [session.completed, missionId, steps.length, completedSteps.length]);

  const progress = useMemo(() => {
    if (steps.length === 0) return 0;
    const uniqueCompleted = new Set(completedSteps).size;
    return Math.min(100, Math.round((uniqueCompleted / steps.length) * 100));
  }, [steps.length, completedSteps]);

  const submitPrediction = useCallback(
    (prob: number) => {
      setPrediction(prob);
      transitionMissionPhase("MANIPULATION");
    },
    [setPrediction, transitionMissionPhase]
  );

  const executeGate = useCallback(
    (gate: string) => {
      if (missionState.currentPhase === "MANIPULATION") {
        applyGateToMission(gate);
      }
    },
    [missionState.currentPhase, applyGateToMission]
  );

  const triggerMeasurement = useCallback(() => {
    if (missionState.currentPhase === "MANIPULATION") {
      transitionMissionPhase("MEASUREMENT");
    }
  }, [missionState.currentPhase, transitionMissionPhase]);

  const advanceToNextStep = useCallback(() => {
    if (missionState.currentPhase === "MEASUREMENT") {
      transitionMissionPhase("VERIFICATION");
      const passed = evaluateMissionStep(
        currentStepConfig.targetTheta,
        currentStepConfig.targetPhi
      );

      if (passed) {
        transitionMissionPhase("SUCCESS");
      } else {
        transitionMissionPhase("MANIPULATION");
      }
    } else if (missionState.currentPhase === "SUCCESS") {
      const nextIndex = currentStepIndex + 1;
      if (nextIndex < steps.length) {
        updateMissionState(missionId, {
          ...rawMissionState,
          currentStepIndex: nextIndex,
        });
        transitionMissionPhase("BRIEFING");
      } else {
        completeMission(missionId as MissionId);
      }
    }
  }, [
    missionState.currentPhase,
    transitionMissionPhase,
    evaluateMissionStep,
    currentStepConfig,
    currentStepIndex,
    steps.length,
    updateMissionState,
    missionId,
    rawMissionState,
    completeMission,
  ]);

  const updateInteraction = useCallback(
    (partialState: Record<string, unknown>) => {
      const updatedInteraction = {
        ...interaction,
        ...partialState,
      };
      updateMissionState(missionId, {
        ...rawMissionState,
        interaction: updatedInteraction,
      });
    },
    [missionId, interaction, rawMissionState, updateMissionState]
  );

  const markCurrentStepComplete = useCallback(() => {
    if (!currentStep) return;
    const stepId = currentStep.id;
    const newCompleted = completedSteps.includes(stepId)
      ? completedSteps
      : [...completedSteps, stepId];

    const isLastStep = currentStepIndex >= steps.length - 1;

    updateMissionState(missionId, {
      ...rawMissionState,
      completedSteps: newCompleted,
    });

    if (isLastStep && (!mission?.requiresQuiz || quizPassed)) {
      completeMission(missionId as MissionId);
    }
  }, [
    currentStep,
    currentStepIndex,
    completedSteps,
    steps.length,
    mission,
    quizPassed,
    missionId,
    rawMissionState,
    updateMissionState,
    completeMission,
  ]);

  const passQuiz = useCallback(() => {
    const stepId = currentStep?.id;
    const newCompleted =
      stepId && !completedSteps.includes(stepId)
        ? [...completedSteps, stepId]
        : completedSteps;

    updateMissionState(missionId, {
      ...rawMissionState,
      quizPassed: true,
      completedSteps: newCompleted,
    });
    completeMission(missionId as MissionId);
  }, [
    missionId,
    rawMissionState,
    currentStep,
    completedSteps,
    updateMissionState,
    completeMission,
  ]);

  const handleContinue = useCallback(() => {
    if (!mission) return;
    const isLastStep = currentStepIndex >= steps.length - 1;

    if (isLastStep) {
      if (!mission.requiresQuiz || quizPassed) {
        completeMission(missionId as MissionId);
      }
    }

    const nextIndex = currentStepIndex + 1;
    updateMissionState(missionId, {
      ...rawMissionState,
      currentStepIndex: nextIndex,
    });
  }, [
    mission,
    currentStepIndex,
    steps.length,
    missionId,
    quizPassed,
    rawMissionState,
    updateMissionState,
    completeMission,
  ]);

  const handlePrevious = useCallback(() => {
    if (currentStepIndex <= 0) return;
    const prevIndex = currentStepIndex - 1;
    updateMissionState(missionId, {
      ...rawMissionState,
      currentStepIndex: prevIndex,
    });
  }, [currentStepIndex, missionId, rawMissionState, updateMissionState]);

  const goToStep = useCallback(
    (indexOrId: number | string) => {
      let targetIndex = -1;
      if (typeof indexOrId === "number") {
        targetIndex = indexOrId;
      } else {
        targetIndex = steps.findIndex((_s) => _s.id === indexOrId);
      }

      if (targetIndex >= 0 && targetIndex < steps.length) {
        updateMissionState(missionId, {
          ...rawMissionState,
          currentStepIndex: targetIndex,
        });
      }
    },
    [steps, missionId, rawMissionState, updateMissionState]
  );

  return {
    mission,
    steps,
    currentStep,
    currentStepConfig,
    currentStepIndex,
    totalSteps: steps.length,
    progress,
    interactionState: interaction,
    missionState,
    isPredictionAllowed,
    isManipulationAllowed,
    isMeasurementAllowed,
    submitPrediction,
    executeGate,
    triggerMeasurement,
    advanceToNextStep,
    updateInteraction,
    markCurrentStepComplete,
    nextStep: handleContinue,
    continueMission: handleContinue,
    previousStep: handlePrevious,
    goToStep,
    isUnlocked,
    isCompleted,
    quizPassed,
    passQuiz,
  };
}

// --- Section: src/features/missions/hooks/useMissionTitle.ts ---
let currentTitle = '';
const listeners = new Set<() => void>();

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

const getSnapshot = (): string => currentTitle;
const getServerSnapshot = (): string => '';

function setMissionTitle(next: string): void {
  if (next === currentTitle) return;
  currentTitle = next;
  for (const cb of listeners) cb();
}

export function useMissionTitleState(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useMissionTitle(title: string): void {
  useEffect(() => {
    setMissionTitle(title);
    return () => {
      if (currentTitle === title) setMissionTitle('');
    };
  }, [title]);
}