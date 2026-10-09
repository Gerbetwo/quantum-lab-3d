/**
 * Generador de escena Three.js para Entrelazamiento (Alice y Bob)
 */
import * as THREE from 'three';

export function createEntanglementScene(container: HTMLDivElement, onUpdate?: () => void) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(0, 2, 6);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  // Estaciones Alice y Bob
  const aliceGroup = new THREE.Group();
  aliceGroup.position.set(-2, 0, 0);
  const aliceSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.8, 32, 32),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3 })
  );
  aliceGroup.add(aliceSphere);
  scene.add(aliceGroup);

  const bobGroup = new THREE.Group();
  bobGroup.position.set(2, 0, 0);
  const bobSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.8, 32, 32),
    new THREE.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.3 })
  );
  bobGroup.add(bobSphere);
  scene.add(bobGroup);

  // Conexión visual (Línea de entrelazamiento)
  const lineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-1.2, 0, 0),
    new THREE.Vector3(1.2, 0, 0)
  ]);
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0x06b6d4, linewidth: 2 });
  const connectionLine = new THREE.Line(lineGeometry, lineMaterial);
  scene.add(connectionLine);

  // Iluminación
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);
  const pointLight = new THREE.PointLight(0xffffff, 1);
  pointLight.position.set(5, 5, 5);
  scene.add(pointLight);

  let animId: number;
  const animate = () => {
    animId = requestAnimationFrame(animate);
    aliceGroup.rotation.y += 0.005;
    bobGroup.rotation.y -= 0.005;
    renderer.render(scene, camera);
    if (onUpdate) onUpdate();
  };
  animate();

  return {
    scene,
    camera,
    renderer,
    updateState: (measured: boolean, outcome: 0 | 1 | null) => {
      const color = measured ? (outcome === 1 ? 0x10b981 : 0xef4444) : 0x38bdf8;
      (aliceSphere.material as THREE.MeshStandardMaterial).color.setHex(color);
      (bobSphere.material as THREE.MeshStandardMaterial).color.setHex(color);
    },
    dispose: () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    }
  };
}
