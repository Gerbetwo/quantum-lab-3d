
/**
 * Componente React que envuelve la escena de la Esfera de Bloch
 */
import React from 'react';
import { useThreeScene } from '../../hooks/useThreeScene';
import { createBlochSphereScene } from '../../lib/three/scenes/createBlochSphereScene';

interface BlochSphereSceneProps {
  theta: number;
  phi?: number;
}

export function BlochSphereScene({ theta, phi = 0 }: BlochSphereSceneProps) {
  const containerRef = useThreeScene(createBlochSphereScene, theta, phi);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[280px] rounded-xl overflow-hidden relative"
      role="img"
      aria-label="Representación 3D interactiva de la Esfera de Bloch"
    />
  );
}
