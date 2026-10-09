/**
 * Generador de escena Three.js para la demostración del Algoritmo de Shor
 */
import * as THREE from 'three';

export function createShorPeriodScene(container: HTMLDivElement, sequence: number[]) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(0, 0, 6);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const group = new THREE.Group();
  scene.add(group);

  const spheres: THREE.Mesh[] = [];
  sequence.forEach((val, index) => {
    const x = (index - sequence.length / 2) * 1.2;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.8, 0.8),
      new THREE.MeshStandardMaterial({ color: val === 1 ? 0x10b981 : 0x38bdf8, roughness: 0.3 })
    );
    mesh.position.set(x, 0, 0);
    group.add(mesh);
    spheres.push(mesh);
  });

  scene.add(new THREE.AmbientLight(0xffffff, 0.8));

  let animId: number;
  const animate = () => {
    animId = requestAnimationFrame(animate);
    group.rotation.y += 0.005;
    renderer.render(scene, camera);
  };
  animate();

  return {
    scene,
    renderer,
    dispose: () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    }
  };
}
