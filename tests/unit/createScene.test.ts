import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { createScene, disposeResource } from '@/lib/three/createScene';

describe('Infraestructura WebGL - createScene y Gestión de Memoria', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    Object.defineProperty(container, 'clientWidth', { value: 800 });
    Object.defineProperty(container, 'clientHeight', { value: 600 });
  });

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

  it('debe ejecutar la disposición completa del renderizador y remover el canvas al invocar dispose', () => {
    const controller = createScene(container);
    
    const rendererDisposeSpy = vi.spyOn(controller.renderer, 'dispose');
    const forceContextLossSpy = vi.spyOn(controller.renderer, 'forceContextLoss');

    expect(container.querySelector('canvas')).not.toBeNull();

    controller.dispose();

    expect(rendererDisposeSpy).toHaveBeenCalledTimes(1);
    expect(forceContextLossSpy).toHaveBeenCalledTimes(1);
    expect(container.querySelector('canvas')).toBeNull();
  });
});
