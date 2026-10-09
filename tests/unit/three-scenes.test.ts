import { describe, it, test, expect, vi, beforeEach } from 'vitest';
import '../helpers/webgl-stub';
import * as THREE from 'three';
import {
  disposeResource,
  cached,
  clearResourceCache,
  clearSpriteMaterialCache,
} from '@/features/quantum-3d/lib/sceneManager';

describe('Infraestructura WebGL - createScene y Gestión de Memoria', () => {
  it('debe liberar recursivamente geometrías, materiales y texturas con disposeResource', () => {
    const scene = new THREE.Scene();
    const geometry = new THREE.BufferGeometry();
    const texture = new THREE.Texture();
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const mesh = new THREE.Mesh(geometry, material);

    const geoDisposeSpy = vi.spyOn(geometry, 'dispose');
    const matDisposeSpy = vi.spyOn(material, 'dispose');
    const texDisposeSpy = vi.spyOn(texture, 'dispose');

    scene.add(mesh);
    disposeResource(scene);

    expect(geoDisposeSpy).toHaveBeenCalledTimes(1);
    expect(matDisposeSpy).toHaveBeenCalledTimes(1);
    expect(texDisposeSpy).toHaveBeenCalledTimes(1);
  });
});

describe('DT-09: WebGL Infrastructure & Material Cache Unit Tests', () => {
  beforeEach(() => {
    clearResourceCache();
    clearSpriteMaterialCache();
  });

  test('cached() helper reusa geometrías/materiales compartidos', () => {
    const geo1 = cached('test-box', () => new THREE.BoxGeometry(1, 1, 1));
    const geo2 = cached('test-box', () => new THREE.BoxGeometry(2, 2, 2));
    expect(geo1).toBe(geo2);
  });
});
