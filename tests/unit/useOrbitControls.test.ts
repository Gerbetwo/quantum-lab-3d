import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as THREE from 'three';
import { createOrbitControls, type OrbitControlsHandle } from '@/features/quantum-3d/hooks/useOrbitControls';

// jsdom lacks PointerEvent in some versions; polyfill minimally.
if (typeof (globalThis as { PointerEvent?: unknown }).PointerEvent === 'undefined') {
  class PointerEventPolyfill extends MouseEvent {
    pointerId: number;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = (init as { pointerId?: number }).pointerId ?? 1;
    }
  }
  (globalThis as { PointerEvent: typeof PointerEventPolyfill }).PointerEvent = PointerEventPolyfill;
}

function makeCanvas(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  (c as unknown as { setPointerCapture: (id: number) => void }).setPointerCapture = vi.fn();
  (c as unknown as { releasePointerCapture: (id: number) => void }).releasePointerCapture = vi.fn();
  return c;
}

function dispatchPointer(target: EventTarget, type: string, init: { clientX: number; clientY: number; pointerId?: number; button?: number } = { clientX: 0, clientY: 0 }) {
  const ev = new PointerEvent(type, {
    bubbles: true, cancelable: true,
    pointerId: init.pointerId ?? 1,
    button: init.button ?? 0,
    buttons: 1,
    clientX: init.clientX, clientY: init.clientY,
  });
  target.dispatchEvent(ev);
}

describe('createOrbitControls', () => {
  let camera: THREE.PerspectiveCamera;
  let canvas: HTMLCanvasElement;
  let controls: OrbitControlsHandle;

  beforeEach(() => {
    camera = new THREE.PerspectiveCamera(45, 16 / 10, 0.1, 100);
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
    canvas = makeCanvas();
    controls = createOrbitControls(camera, canvas, { enableDamping: false, minDistance: 1, maxDistance: 10 });
  });

  afterEach(() => { controls.dispose(); });

  it('applies initial spherical position on construction', () => {
    expect(camera.position.length()).toBeCloseTo(5, 1);
  });

  it('rotates camera on drag', () => {
    const before = camera.position.clone();
    dispatchPointer(canvas, 'pointerdown', { clientX: 100, clientY: 100 });
    dispatchPointer(canvas, 'pointermove', { clientX: 200, clientY: 100 });
    dispatchPointer(canvas, 'pointerup', { clientX: 200, clientY: 100 });
    controls.update(0);
    expect(before.distanceTo(camera.position)).toBeGreaterThan(0.1);
  });

  it('clamps zoom distance to min on strong wheel-in', () => {
    canvas.dispatchEvent(new WheelEvent('wheel', { deltaY: -100000, bubbles: true, cancelable: true }));
    for (let i = 0; i < 30; i++) controls.update(0.05);
    expect(camera.position.length()).toBeGreaterThanOrEqual(1 - 0.05);
    expect(camera.position.length()).toBeLessThan(1.5);
  });

  it('clamps zoom distance to max on strong wheel-out', () => {
    canvas.dispatchEvent(new WheelEvent('wheel', { deltaY: 100000, bubbles: true, cancelable: true }));
    for (let i = 0; i < 30; i++) controls.update(0.05);
    expect(camera.position.length()).toBeLessThanOrEqual(10 + 0.05);
    expect(camera.position.length()).toBeGreaterThan(9);
  });

  it('resetView restores initial spherical coordinates', () => {
    dispatchPointer(canvas, 'pointerdown', { clientX: 100, clientY: 100 });
    dispatchPointer(canvas, 'pointermove', { clientX: 300, clientY: 100 });
    dispatchPointer(canvas, 'pointerup', { clientX: 300, clientY: 100 });
    controls.update(0);
    expect(camera.position.distanceTo(new THREE.Vector3(0, 0, 5))).toBeGreaterThan(0.1);

    controls.resetView();
    expect(camera.position.x).toBeCloseTo(0, 1);
    expect(camera.position.y).toBeCloseTo(0, 1);
    expect(camera.position.z).toBeCloseTo(5, 1);
  });

  it('reports dragging state transitions', () => {
    expect(controls.isDragging()).toBe(false);
    dispatchPointer(canvas, 'pointerdown', { clientX: 100, clientY: 100 });
    expect(controls.isDragging()).toBe(true);
    dispatchPointer(canvas, 'pointerup', { clientX: 100, clientY: 100 });
    expect(controls.isDragging()).toBe(false);
  });

  it('dispose stops responding to pointer events', () => {
    controls.dispose();
    const before = camera.position.clone();
    dispatchPointer(canvas, 'pointerdown', { clientX: 100, clientY: 100 });
    dispatchPointer(canvas, 'pointermove', { clientX: 300, clientY: 100 });
    controls.update(0);
    expect(camera.position.distanceTo(before)).toBeLessThan(0.01);
  });

  it('respects minDistance/maxDistance invariants under random wheels', () => {
    for (let i = 0; i < 40; i++) {
      const dy = (Math.random() - 0.5) * 8000;
      canvas.dispatchEvent(new WheelEvent('wheel', { deltaY: dy, bubbles: true, cancelable: true }));
      controls.update(0.02);
      const d = camera.position.length();
      expect(d).toBeGreaterThanOrEqual(1 - 0.05);
      expect(d).toBeLessThanOrEqual(10 + 0.05);
    }
  });
});
