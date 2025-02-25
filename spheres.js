import * as THREE from 'three';
import { OrbitControls } from 'jsm/controls/OrbitControls.js';

// Set up renderer
const w = window.innerWidth;
const h = window.innerHeight;
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);

// Create UI elements
const uiContainer = document.createElement('div');
uiContainer.style.position = 'absolute';
uiContainer.style.top = '10px';
uiContainer.style.left = '10px';
uiContainer.style.color = 'white';
uiContainer.style.fontFamily = 'Arial, sans-serif';
uiContainer.style.fontSize = '16px';
uiContainer.style.padding = '10px';
uiContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
uiContainer.style.borderRadius = '8px';

// Navigation links
const navLinks = document.createElement('div');
navLinks.innerHTML = `
  <a href="index.html" style="color: white; text-decoration: underline; margin-right: 10px;">Home</a>
  <a href="earth/index.html" style="color: white; text-decoration: underline; margin-right: 10px;">Earth</a>
  <a href="wormhole_tunnel/index.html" style="color: white; text-decoration: underline;">Wormhole</a>
  <a href="entangled_spheres/index.html" style="color: white; text-decoration: underline; margin-left: 10px;">Entangled Spheres</a>
  <a href="imposter_spheres/index.html" style="color: white; text-decoration: underline; margin-left: 10px;">Imposter Spheres: 1 million</a>
`;

// Number of spheres display
const sphereCountText = document.createElement('p');
sphereCountText.textContent = `Number of spheres: 700,000`;

uiContainer.appendChild(navLinks);
uiContainer.appendChild(sphereCountText);
document.body.appendChild(uiContainer);

// Set up camera
const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.z = 350;

// Create scene
const scene = new THREE.Scene();

// Add controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.03;

// Define LOD levels
const highDetailGeo = new THREE.SphereGeometry(0.5, 8, 8);
const mediumDetailGeo = new THREE.SphereGeometry(0.5, 6, 6);
const lowDetailGeo = new THREE.SphereGeometry(0.5, 4, 4);
const mat = new THREE.MeshStandardMaterial({ color: 0x44ff88 });

const count = 700000;
const radius = 200;

const highDetailMesh = new THREE.InstancedMesh(highDetailGeo, mat, count);
const mediumDetailMesh = new THREE.InstancedMesh(mediumDetailGeo, mat, count);
const lowDetailMesh = new THREE.InstancedMesh(lowDetailGeo, mat, count);
scene.add(highDetailMesh, mediumDetailMesh, lowDetailMesh);

const highDetailDistance = 50;
const mediumDetailDistance = 100;

const dummy = new THREE.Object3D();
const color = new THREE.Color();
let highIndex = 0, medIndex = 0, lowIndex = 0;

for (let i = 0; i < count; i++) {
    const r = Math.cbrt(Math.random()) * radius;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
    dummy.position.set(x, y, z);
    dummy.updateMatrix();

    const distance = dummy.position.length();
    if (distance < highDetailDistance) {
        highDetailMesh.setMatrixAt(highIndex, dummy.matrix);
        highDetailMesh.setColorAt(highIndex, color.setHSL(Math.random(), 1.0, 0.5));
        highIndex++;
    } else if (distance < mediumDetailDistance) {
        mediumDetailMesh.setMatrixAt(medIndex, dummy.matrix);
        mediumDetailMesh.setColorAt(medIndex, color.setHSL(Math.random(), 1.0, 0.5));
        medIndex++;
    } else {
        lowDetailMesh.setMatrixAt(lowIndex, dummy.matrix);
        lowDetailMesh.setColorAt(lowIndex, color.setHSL(Math.random(), 1.0, 0.5));
        lowIndex++;
    }
}

highDetailMesh.count = highIndex;
mediumDetailMesh.count = medIndex;
lowDetailMesh.count = lowIndex;

highDetailMesh.instanceColor.needsUpdate = true;
mediumDetailMesh.instanceColor.needsUpdate = true;
lowDetailMesh.instanceColor.needsUpdate = true;

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
scene.add(hemiLight);

// Sphere selection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selected = { mesh: null, instanceId: null, originalColor: null };

renderer.domElement.addEventListener('click', onClick, false);

function onClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([highDetailMesh, mediumDetailMesh, lowDetailMesh]);

    if (intersects.length > 0) {
        const intersect = intersects[0];
        const mesh = intersect.object;
        const instanceId = intersect.instanceId;

        if (selected.mesh && selected.instanceId !== null) {
            selected.mesh.setColorAt(selected.instanceId, selected.originalColor);
            selected.mesh.instanceColor.needsUpdate = true;
        }

        const originalColor = new THREE.Color();
        mesh.getColorAt(instanceId, originalColor);

        selected = { mesh, instanceId, originalColor: originalColor.clone() };

        mesh.setColorAt(instanceId, new THREE.Color(0xffff00));
        mesh.instanceColor.needsUpdate = true;
    }
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    controls.update();
}

animate();
