import { describe, test, expect, vi } from 'vitest';
import { ResourceTracker } from '@/features/quantum-3d/lib/resourceTracker';
import * as THREE from 'three';

describe('Ciclo de Vida WebGL y ResourceTracker', () => {
  test('Registra y libera recursos correctamente', () => {
    const tracker = new ResourceTracker();
    const geometry = tracker.track(new THREE.BoxGeometry(1, 1, 1));
    const spyDispose = vi.spyOn(geometry, 'dispose');

    tracker.dispose();
    expect(spyDispose).toHaveBeenCalledTimes(1);
  });

  test('Respeta recursos compartidos etiquetados con __shared', () => {
    const tracker = new ResourceTracker();
    const material = tracker.track(new THREE.MeshBasicMaterial());
    material.userData.__shared = true;
    const spyDispose = vi.spyOn(material, 'dispose');

    tracker.dispose();
    expect(spyDispose).not.toHaveBeenCalled();
  });
});
