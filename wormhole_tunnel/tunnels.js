import * as THREE from 'three';
import {OrbitControls} from 'jsm/controls/OrbitControls.js';

import spline from './spline.js';
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
camera.position.z = 10 ;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.3); // fog color, density

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.03;

// create a line geometry from the spline
const points = spline.getPoints(100);
const geometry = new THREE.BufferGeometry().setFromPoints(points);
const material = new THREE.LineBasicMaterial({color: 0xff0000});
const line = new THREE.Line(geometry, material);
// scene.add(line);

// create a tube geometry from the spline
// params: path, tubularSegments, radius, radialSegments, closed
const tubeGeometry = new THREE.TubeGeometry(spline, 222, 0.65, 16, true);
const tubeMaterial = new THREE.MeshBasicMaterial({
    color: 0x0099ff,
    // side: THREE.DoubleSide,
    wireframe: true
});
const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
// scene.add(tube);

// create edges gemoetry from the spline
const edges = new THREE.EdgesGeometry(tubeGeometry, 0.3); // threshold angle
// threshold angle: it will only draw edges at the threshold angle. 
// e.g 0.1 will draw edges at 0.1 radians
const lineMaterial = new THREE.LineBasicMaterial({color: 0xffffff});
const tubeLines = new THREE.LineSegments(edges, lineMaterial);
scene.add(tubeLines);

const numberOfBoxes = 55;
const size = 0.075;
const boxGeo = new THREE.BoxGeometry(size, size, size);
for (let i = 0; i < numberOfBoxes; i++) {
    const boxMat = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        wireframe: true
    });
    const box = new THREE.Mesh(boxGeo, boxMat);
    const p = (i / numberOfBoxes + Math.random() * 0.1) % 1;
    const pos = tubeGeometry.parameters.path.getPointAt(p);
    pos.x += (Math.random() - 0.5);
    pos.z += (Math.random() - 0.5);
    box.position.copy(pos);
    const rote = new THREE.Vector3(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
    )
    box.rotation.set(rote.x, rote.y, rote.z);
    const edges = new THREE.EdgesGeometry(boxGeo, 0.1);
    const color = new THREE.Color().setHSL(1.0 - p, 1.0, 0.5);
    const lineMat = new THREE.LineBasicMaterial({color: 0xffffff});
    const boxLines = new THREE.LineSegments(edges, lineMat);
    boxLines.position.copy(pos);
    boxLines.rotation.set(rote.x, rote.y, rote.z);
    scene.add(boxLines);
    scene.add(box);
}

// this function does
// 1. move the camera along the path
// 2. make the camera look at the next point on the path
// 3. update the camera's position and rotation
function updateCamera(t) {
    const time = t * 0.1;
    const looptime = 10 * 1000;
    const p = (time % looptime) / looptime;
    const pos = tubeGeometry.parameters.path.getPointAt(p);
    camera.position.copy(pos);
    const lookAt = tubeGeometry.parameters.path.getPointAt((p + 0.01) % 1);
    camera.lookAt(lookAt);
}

renderer.frustumCulled = true;

// Animation loop
function animate(t = 0) {
    requestAnimationFrame(animate);
    updateCamera(t);
    renderer.render(scene, camera);
    controls.update();
}

animate();
console.log(renderer.info);