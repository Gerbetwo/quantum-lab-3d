import { describe, test, expect, beforeEach, vi } from 'vitest';
import '../helpers/webgl-stub';
import * as THREE from 'three';
import {
  cached,
  clearResourceCache,
  createTextSprite,
  clearSpriteMaterialCache,
  disposeResource,
  setupBaseScene,
} from '@/lib/three/createScene';

describe('DT-09: WebGL Infrastructure & Material Cache Unit Tests', () => {
  beforeEach(() => {
    clearResourceCache();
    clearSpriteMaterialCache();
  });

  test('cached() helper reusa geometrías/materiales compartidos', () => {
    const geo1 = cached('test-box', () => new THREE.BoxGeometry(1, 1, 1));
    const geo2 = cached('test-box', () => new THREE.BoxGeometry(2, 2, 2));

    expect(geo1).toBe(geo2);
    expect(geo1.userData.__shared).toBe(true);
  });

  test('disposeResource() respeta objetos marcados con userData.__shared = true', () => {
    const sharedGeo = new THREE.BufferGeometry();
    sharedGeo.userData.__shared = true;
    const disposeSpyShared = vi.spyOn(sharedGeo, 'dispose');

    disposeResource(sharedGeo);
    expect(disposeSpyShared).not.toHaveBeenCalled();

    const normalGeo = new THREE.BufferGeometry();
    const disposeSpyNormal = vi.spyOn(normalGeo, 'dispose');

    disposeResource(normalGeo);
    expect(disposeSpyNormal).toHaveBeenCalled();
  });

  test('DT-03: createTextSprite reusa SpriteMaterial compartidos', () => {
    const sprite1 = createTextSprite('|0⟩', { fontSize: 24, color: '#00ffff' });
    const sprite2 = createTextSprite('|0⟩', { fontSize: 24, color: '#00ffff' });

    expect(sprite1).not.toBe(sprite2);
    expect(sprite1.material).toBe(sprite2.material);

    const sprite3 = createTextSprite('|1⟩', { fontSize: 24, color: '#00ffff' });
    expect(sprite1.material).not.toBe(sprite3.material);
  });

  test('DT-02: Persistencia de canvas DOM y ciclo de vida ante cambios de visibilidad', () => {
    const container = document.createElement('div');
    Object.defineProperty(container, 'clientWidth', { value: 400 });
    Object.defineProperty(container, 'clientHeight', { value: 300 });
    document.body.appendChild(container);

    const sceneResult = setupBaseScene(container);
    expect(container.children.length).toBeGreaterThan(0);

    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(container.children.length).toBeGreaterThan(0);

    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(container.children.length).toBeGreaterThan(0);

    sceneResult.cleanup();
    expect(container.children.length).toBe(0);
    document.body.removeChild(container);
  });
});
