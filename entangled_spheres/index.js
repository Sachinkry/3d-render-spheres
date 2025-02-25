import * as THREE from 'three';
import {OrbitControls} from 'jsm/controls/OrbitControls.js';

const w = window.innerWidth;
const h = window.innerHeight;
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);

const fov = 75;
const aspect = w/h;
const near = 0.1;
const far = 1000;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.z = 3;

const scene = new THREE.Scene();

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.03;

// First icosahedron (original geometry)
const geo = new THREE.IcosahedronGeometry(1, 2); // Your original shape
const mat = new THREE.MeshStandardMaterial({
    color: 0xffffee,
    flatShading: true,
    metalness: 0.4,
    roughness: 0.5
});
const icosa1 = new THREE.Mesh(geo, mat);
icosa1.position.x = -1.5; // Fixed position to the left
scene.add(icosa1);

const wireMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true,
    transparent: true
});
const wireMesh1 = new THREE.Mesh(geo, wireMat);
wireMesh1.scale.setScalar(1.0001); // Your original scale
icosa1.add(wireMesh1);

// Second icosahedron (entangled)
const mat2 = new THREE.MeshStandardMaterial({
    color: 0xeeffee, // Slightly different color to distinguish
    flatShading: true,
    metalness: 0.4,
    roughness: 0.5
});
const icosa2 = new THREE.Mesh(geo, mat2);
icosa2.position.x = 1.5; // Fixed position to the right
scene.add(icosa2);

const wireMesh2 = new THREE.Mesh(geo, wireMat);
wireMesh2.scale.setScalar(1.0001);
icosa2.add(wireMesh2);

const hemiLight = new THREE.HemisphereLight(0x0099ff, 0xaa5500, 1);
scene.add(hemiLight);

// Mouse interaction variables
let mouseX = 0;
let targetRotation = 0;
let currentRotation = 0;

// Mouse move listener
document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    targetRotation = mouseX * Math.PI;
});

function animate(t = 0) {
    requestAnimationFrame(animate);

    // Slow automatic spin
    const slowSpin = t * 0.0001;

    // Smoothly interpolate rotation toward mouse target
    currentRotation += (targetRotation - currentRotation) * 0.05;

    // Apply entangled rotation (fixed positions, only rotation changes)
    icosa1.rotation.y = currentRotation + slowSpin;
    icosa2.rotation.y = -currentRotation - slowSpin;

    renderer.render(scene, camera);
    controls.update();
}

animate();