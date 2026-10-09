import * as THREE from 'three';

export interface DisposableResource {
  dispose(): void;
}

export class ResourceTracker {
  private resources = new Set<DisposableResource | THREE.Object3D>();

  track<T extends DisposableResource | THREE.Object3D>(resource: T): T {
    if (!resource) return resource;
    if (resource instanceof THREE.Object3D) {
      resource.traverse((child: THREE.Object3D) => {
        const meshChild = child as THREE.Mesh;
        if (meshChild.geometry && typeof meshChild.geometry.dispose === 'function') {
          this.resources.add(meshChild.geometry as DisposableResource);
        }
        const mat = meshChild.material;
        if (mat) {
          if (Array.isArray(mat)) {
            mat.forEach((m) => {
              if (m && typeof m.dispose === 'function') {
                this.resources.add(m as DisposableResource);
              }
            });
          } else if (typeof mat.dispose === 'function') {
            this.resources.add(mat as DisposableResource);
          }
        }
      });
    } else if ('dispose' in resource && typeof (resource as DisposableResource).dispose === 'function') {
      this.resources.add(resource as DisposableResource);
    }
    return resource;
  }

  dispose() {
    for (const resource of this.resources) {
      const resWithData = resource as { userData?: { __shared?: boolean }; dispose?: () => void };
      if (resWithData.userData && resWithData.userData.__shared === true) {
        continue;
      }
      if (resWithData.dispose && typeof resWithData.dispose === 'function') {
        resWithData.dispose();
      }
    }
    this.resources.clear();
  }
}
