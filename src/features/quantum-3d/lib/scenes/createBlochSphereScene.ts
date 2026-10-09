import * as THREE from 'three';
import { ResourceTracker } from '../resourceTracker';

export function createBlochSphereScene(
  scene: THREE.Scene,
  tracker: ResourceTracker,
  theta: number = 0,
  phi: number = 0
) {
  const sphereGeo = tracker.track(new THREE.SphereGeometry(1, 32, 32));
  const sphereMat = tracker.track(
    new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true, transparent: true, opacity: 0.3 })
  );
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  scene.add(sphere);

  const x = Math.sin(theta) * Math.cos(phi);
  const y = Math.cos(theta);
  const z = Math.sin(theta) * Math.sin(phi);

  const dir = new THREE.Vector3(x, y, z).normalize();
  const arrow = tracker.track(new THREE.ArrowHelper(dir, new THREE.Vector3(0, 0, 0), 1, 0xff007f));
  scene.add(arrow);

  return { sphere, arrow };
}
