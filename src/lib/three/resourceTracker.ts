import * as THREE from 'three';

export class ResourceTracker {
  private resources = new Set<THREE.Object3D | THREE.BufferGeometry | THREE.Material | THREE.Texture>();

  track<T extends THREE.Object3D | THREE.BufferGeometry | THREE.Material | THREE.Texture>(resource: T): T {
    if (resource) this.resources.add(resource);
    return resource;
  }

  dispose() {
    for (const res of this.resources) {
      if ('dispose' in res && typeof res.dispose === 'function') {
        res.dispose();
      }
    }
    this.resources.clear();
  }
}
