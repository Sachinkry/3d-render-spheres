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
camera.position.z = 2;

const scene = new THREE.Scene();

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.03;

const earthGroup = new THREE.Group();
earthGroup.rotation.z = -23.4* Math.PI / 180;
scene.add(earthGroup);

// First icosahedron (original geometry)
const loader = new THREE.TextureLoader();
const geo = new THREE.IcosahedronGeometry(1, 12); // Your original shape
const mat = new THREE.MeshStandardMaterial({
    map: loader.load('../textures/8k_earth_daymap.jpg'),
});
const earthMesh = new THREE.Mesh(geo, mat);
earthGroup.add(earthMesh);




const hemiLight = new THREE.HemisphereLight(0x0099ff, 0xffffff, 1);
scene.add(hemiLight);

function animate(t = 0) {
    requestAnimationFrame(animate);

    // earthMesh.rotation.x += 0.001;
    earthMesh.rotation.y += 0.01;

    renderer.render(scene, camera);
    controls.update();
}

animate();