
/**
 * Componente React que envuelve la escena de la Esfera de Bloch
 */
import { useThreeScene } from '@/features/quantum-3d/hooks/useThreeScene';
import { createBlochSphereScene } from '@/features/quantum-3d/lib/scenes/createBlochSphereScene';

interface BlochSphereSceneProps {
  theta: number;
  phi?: number;
}

export function BlochSphereScene({ theta, phi = 0 }: BlochSphereSceneProps) {
  const containerRef = useThreeScene(createBlochSphereScene, theta, phi);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-70 rounded-xl overflow-hidden relative"
      role="img"
      aria-label="Representación 3D interactiva de la Esfera de Bloch"
    />
  );
}
