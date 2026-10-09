import * as THREE from 'three';

export class ResourceTracker {
  private resources = new Set<THREE.Object3D | THREE.BufferGeometry | THREE.Material | THREE.Texture>();

  public track<T extends THREE.Object3D | THREE.BufferGeometry | THREE.Material | THREE.Texture>(resource: T): T {
    if (!resource) return resource;

    if ('dispose' in resource || resource instanceof THREE.Object3D) {
      this.resources.add(resource);
    }
    return resource;
  }

  public dispose(): void {
    for (const resource of this.resources) {
      if ('userData' in resource && resource.userData?.__shared) {
        // No liberar recursos compartidos globales
        continue;
      }

      if (resource instanceof THREE.Object3D) {
        if (resource.parent) {
          resource.parent.remove(resource);
        }
      } else if ('dispose' in resource && typeof resource.dispose === 'function') {
        resource.dispose();
      }
    }
    this.resources.clear();
  }
}
