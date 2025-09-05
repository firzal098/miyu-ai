// These "bare" imports are now mapped to your local files by the importmap
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRMLoaderPlugin } from '@pixiv/three-vrm';


// 1. Scene, Camera, and Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.01, 100);

const top = 0.1;

// Set the camera's position
camera.position.set(0, 1.3 + top, 1.4); // Example: a nice portrait position

// ADD THIS LINE to point the camera at the character's chest
camera.lookAt(0, 1.1 + top, 0); 

const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#canvas'),
    antialias: true,
    alpha: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearAlpha(0); 

// Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 2. Lighting
const hemisphereLight = new THREE.HemisphereLight(0xbbbbff, 0x444422, 1.5);
scene.add(hemisphereLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
directionalLight.position.set(1,1,1.5);
scene.add(directionalLight);

// 3. Controls
// const controls = new OrbitControls(camera, renderer.domElement);
// controls.target.set(0, 1.0, 0); // Set the point to orbit around
// controls.update();

// 4. Load VRM Model
const loader = new GLTFLoader();

// Install the VRMLoaderPlugin
loader.register((parser) => {
    return new VRMLoaderPlugin(parser);
});

let currentVrm = null; // Variable to hold the VRM model
const clock = new THREE.Clock(); // Clock for animation updates

loader.load(
    './assets/miyu.vrm', // Path to your VRM file
    (gltf) => {
        const vrm = gltf.userData.vrm; // Get the VRM data from the loaded model
        scene.add(vrm.scene); // Add the model to the scene
        vrm.scene.rotation.y = Math.PI;

        vrm.expressionManager.setValue('happy', 1.0);

        currentVrm = vrm; // Store the VRM object
        console.log('VRM model loaded successfully!', vrm);
        console.log('available expressions:', vrm.expressionManager);
    },
    (progress) => console.log('Loading model...', 100.0 * (progress.loaded / progress.total), '%'),
    (error) => console.error(error)
);

// 5. Animation Loop
function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta(); // Get time difference between frames

    // If the VRM model is loaded, update it
    if (currentVrm) {
        currentVrm.update(delta);
    }
    
    renderer.render(scene, camera);
}

animate(); // Start the loop