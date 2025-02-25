import * as THREE from 'three';
import { OrbitControls } from 'jsm/controls/OrbitControls.js';

// Set up renderer
const w = window.innerWidth;
const h = window.innerHeight;
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);

// Set up camera
const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.z = 500;

// Create scene
const scene = new THREE.Scene();

// Add controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.03;

// Define LOD levels for high and medium detail using sphere geometry
const highDetailGeo = new THREE.SphereGeometry(0.5, 10, 10);
const mediumDetailGeo = new THREE.SphereGeometry(0.5, 8, 8);
const mat = new THREE.MeshStandardMaterial({ color: 0x44ff88 });

// Settings
const count = 1000000;
const radius = 300;
const highDetailDistance = 50;
const mediumDetailDistance = 100;

// Create instanced meshes for high and medium LOD
const highDetailMesh = new THREE.InstancedMesh(highDetailGeo, mat, count);
const mediumDetailMesh = new THREE.InstancedMesh(mediumDetailGeo, mat, count);
scene.add(highDetailMesh, mediumDetailMesh);

// Arrays for imposters
const imposterPositions = [];
const imposterColors = [];

let highIndex = 0, medIndex = 0, lowIndex = 0;
const dummy = new THREE.Object3D();
const color = new THREE.Color();

for (let i = 0; i < count; i++) {
  const r = Math.cbrt(Math.random()) * radius;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.sin(phi) * Math.sin(theta);
  const z = r * Math.cos(phi);
  dummy.position.set(x, y, z);
  dummy.updateMatrix();

  const d = dummy.position.length();
  if (d < highDetailDistance) {
    highDetailMesh.setMatrixAt(highIndex, dummy.matrix);
    highDetailMesh.setColorAt(highIndex, color.setHSL(Math.random(), 1.0, 0.5));
    highIndex++;
  } else if (d < mediumDetailDistance) {
    mediumDetailMesh.setMatrixAt(medIndex, dummy.matrix);
    mediumDetailMesh.setColorAt(medIndex, color.setHSL(Math.random(), 1.0, 0.5));
    medIndex++;
  } else {
    imposterPositions.push(x, y, z);
    const c = color.setHSL(Math.random(), 1.0, 0.5);
    imposterColors.push(c.r, c.g, c.b);
    lowIndex++;
  }
}

// Set instance counts and update instance colors
highDetailMesh.count = highIndex;
mediumDetailMesh.count = medIndex;
highDetailMesh.instanceColor.needsUpdate = true;
mediumDetailMesh.instanceColor.needsUpdate = true;

// Create buffer geometry for imposters
const imposterGeo = new THREE.BufferGeometry();
imposterGeo.setAttribute('position', new THREE.Float32BufferAttribute(imposterPositions, 3));
imposterGeo.setAttribute('color', new THREE.Float32BufferAttribute(imposterColors, 3));

// Imposter Shader Material with Hemisphere lighting
const imposterMat = new THREE.ShaderMaterial({
  uniforms: {
    skyColor: { value: new THREE.Color(0xffffff) },
    groundColor: { value: new THREE.Color(0x444444) },
    lightDir: { value: new THREE.Vector3(0, 1, 0) },
  },
  vertexShader: `
    varying vec3 vColor;
    varying vec3 vNormal;
    
    void main() {
      vColor = color;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = 5.0 * (200.0 / length(mvPosition.xyz));
      gl_Position = projectionMatrix * mvPosition;
      vNormal = normalize(position);
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    varying vec3 vNormal;
    uniform vec3 skyColor;
    uniform vec3 groundColor;
    uniform vec3 lightDir;

    void main() {
      vec2 uv = gl_PointCoord * 2.0 - 1.0;
      float dist = dot(uv, uv);
      if (dist > 1.0) discard;

      vec3 normal = normalize(vec3(uv, sqrt(1.0 - dist)));
      float factor = (normal.y + 1.0) / 2.0;
      vec3 hemiLight = mix(groundColor, skyColor, factor);
      
      gl_FragColor = vec4(vColor * hemiLight, 1.0);
    }
  `,
  transparent: true,
  vertexColors: true,
});

// Create Points object for imposters and add to scene
const lowDetailPoints = new THREE.Points(imposterGeo, imposterMat);
scene.add(lowDetailPoints);

// Add lighting for 3D spheres
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
scene.add(hemiLight);

// ----- Raycasting for Selection ----- //
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', onClick, false);

function onClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const objectsToTest = [highDetailMesh, mediumDetailMesh, lowDetailPoints];
  const intersects = raycaster.intersectObjects(objectsToTest);

  if (intersects.length > 0) {
    const intersect = intersects[0];
    
    // If the object is an InstancedMesh, do a per-instance check:
    if (intersect.object.isInstancedMesh && intersect.instanceId !== undefined) {
      const instanceId = intersect.instanceId;
      const instanceMatrix = new THREE.Matrix4();
      intersect.object.getMatrixAt(instanceId, instanceMatrix);

      // Decompose to get the instance's world position
      const instancePos = new THREE.Vector3();
      const instanceQuat = new THREE.Quaternion();
      const instanceScale = new THREE.Vector3();
      instanceMatrix.decompose(instancePos, instanceQuat, instanceScale);

      // Transform the instance center into world space
      intersect.object.localToWorld(instancePos);

      // Assume each sphere has a radius of 0.5 (adjust if necessary)
      const sphereRadius = 0.5 * instanceScale.x;

      // Check if the intersection point is within the sphere
      if (instancePos.distanceTo(intersect.point) <= sphereRadius) {
        highlightAt(intersect.point);
        console.log('Instance selected:', instanceId);
      } else {
        console.log('Clicked bounding volume, but missed the instance sphere.');
      }
    } else {
      // For imposters (Points), you can consider the point size as the "radius"
      // Here we assume a simple case and accept the intersection.
      highlightAt(intersect.point);
      console.log('Point selected');
    }
  }
}

function highlightAt(position) {
  const markerGeo = new THREE.SphereGeometry(1, 8, 8);
  const markerMat = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true });
  const marker = new THREE.Mesh(markerGeo, markerMat);
  marker.position.copy(position);
  scene.add(marker);
  setTimeout(() => {
    scene.remove(marker);
  }, 1000);
}


// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();
console.log(renderer.info.render);
