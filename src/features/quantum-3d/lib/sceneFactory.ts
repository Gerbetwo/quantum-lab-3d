import * as THREE from 'three';
import { ResourceTracker } from './resourceTracker';

export type SceneType = 'bloch' | 'cryostat' | 'entanglement' | 'shor';

export interface SceneConfig {
  theme?: string;
  interactive?: boolean;
}

export class QuantumSceneFactory {
  private tracker = new ResourceTracker();

  public buildQuantumScene(type: SceneType, baseScene: THREE.Scene, config: SceneConfig = {}): THREE.Scene {
    const builders: Record<SceneType, (scene: THREE.Scene, cfg: SceneConfig) => void> = {
      bloch: (s) => this.buildBlochSphere(s),
      cryostat: (s) => this.buildCryostat(s),
      entanglement: (s) => this.buildEntanglement(s),
      shor: (s) => this.buildShorPeriod(s),
    };

    if (builders[type]) {
      builders[type](baseScene, config);
    }
    return baseScene;
  }

  private buildBlochSphere(scene: THREE.Scene) {
    const geometry = this.tracker.track(new THREE.SphereGeometry(1, 32, 32));
    const material = this.tracker.track(
      new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })
    );
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
  }

  private buildCryostat(scene: THREE.Scene) {
    const geometry = this.tracker.track(new THREE.CylinderGeometry(1, 1, 3, 16));
    const material = this.tracker.track(new THREE.MeshBasicMaterial({ color: 0x0088ff }));
    const cylinder = new THREE.Mesh(geometry, material);
    scene.add(cylinder);
  }

  private buildEntanglement(_scene: THREE.Scene) {
    // Constructio pro entrelazamiento
  }

  private buildShorPeriod(_scene: THREE.Scene) {
    // Constructio pro periodo Shor
  }

  public dispose() {
    this.tracker.dispose();
  }
}
