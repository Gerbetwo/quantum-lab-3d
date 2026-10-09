/**
 * Generador de escena Three.js para Criostato y Decoherencia Térmica
 */
import * as THREE from 'three';

export function createCryostatScene(container: HTMLDivElement, temperature: number) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(0, 0, 5);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const cryoGeometry = new THREE.CylinderGeometry(1.2, 1.2, 3, 32, 1, true);
  const cryoMaterial = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    wireframe: true,
    transparent: true,
    opacity: 0.4
  });
  const cryostat = new THREE.Mesh(cryoGeometry, cryoMaterial);
  scene.add(cryostat);

  const qubitMesh = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.6),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2 })
  );
  scene.add(qubitMesh);

  const particleCount = 150;
  const particleGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 3;
  }
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particleMaterial = new THREE.PointsMaterial({
    color: temperature > 150000 ? 0xef4444 : 0x38bdf8,
    size: 0.05
  });
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);

  scene.add(new THREE.AmbientLight(0xffffff, 0.7));

  let animId: number;
  const clock = new THREE.Clock(); // Corregido de let a const

  const animate = () => {
    animId = requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();
    qubitMesh.rotation.x = elapsedTime * 0.5;
    qubitMesh.rotation.y = elapsedTime * 0.3;

    const speedFactor = Math.min(5, Math.max(0.1, temperature / 10000));
    particles.rotation.y = elapsedTime * 0.2 * speedFactor;

    renderer.render(scene, camera);
  };
  animate();

  return {
    scene,
    renderer,
    updateTemperature: (newTemp: number) => {
      const isHot = newTemp > 150000;
      particleMaterial.color.setHex(isHot ? 0xef4444 : 0x38bdf8);
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
