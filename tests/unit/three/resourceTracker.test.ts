
import { describe, test, expect, vi } from 'vitest';
import * as THREE from 'three';
import { ResourceTracker } from '@/features/quantum-3d/lib/resourceTracker';

describe('ResourceTracker', () => {
  test('registra y libera recursos disponsables', () => {
    const tracker = new ResourceTracker();
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial();
    const spyGeo = vi.spyOn(geometry, 'dispose');
    const spyMat = vi.spyOn(material, 'dispose');

    tracker.track(geometry);
    tracker.track(material);

    tracker.dispose();

    expect(spyGeo).toHaveBeenCalled();
    expect(spyMat).toHaveBeenCalled();
  });
});
