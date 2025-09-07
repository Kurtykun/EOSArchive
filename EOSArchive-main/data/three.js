import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("spikeScene"), alpha: true });
renderer.setSize(400, 400); // Match container size

const geometry = new THREE.IcosahedronGeometry(1, 2); // Fake protein shape
const material = new THREE.MeshStandardMaterial({ color: 0x9f7eff, wireframe: true });
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

const light = new THREE.PointLight(0xff00ff, 1, 100);
light.position.set(5, 5, 5);
scene.add(light);

camera.position.z = 3;

function animate() {
  requestAnimationFrame(animate);
  mesh.rotation.y += 0.01;
  mesh.rotation.x += 0.005;
  renderer.render(scene, camera);
}
animate();
