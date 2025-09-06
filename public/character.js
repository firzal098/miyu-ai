// These "bare" imports are now mapped to your local files by the importmap
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin } from '@pixiv/three-vrm';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


// --- CONTROL FLAG ---
// Set this to true to enable mouse controls, or false to lock the camera.
const enableOrbitControls = true;


// 1. Scene, Camera, and Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.01, 100);

const top = 0.1; // A helper variable to easily adjust camera height



// Set the camera's default fixed position
camera.position.set(0, 1.3 + top, 1.4);
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
directionalLight.position.set(1, 1, 1.5);
scene.add(directionalLight);

// 3. Controls (now conditional)
let controls = null;
if (enableOrbitControls) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.0 + top, 0);
    controls.update();
}


// 4. Load VRM Model
const loader = new GLTFLoader();

// Install the VRMLoaderPlugin
loader.register((parser) => {
    return new VRMLoaderPlugin(parser);
});

let currentVrm = null;
const clock = new THREE.Clock();
let mixer = null;

loader.load(
    './assets/miyu.vrm', // Your VRM file
    (gltf) => {
        const vrm = gltf.userData.vrm;
        scene.add(vrm.scene);
        vrm.scene.rotation.y = Math.PI;
        currentVrm = vrm;

        // Create the AnimationMixer after the model is loaded
        mixer = new THREE.AnimationMixer(vrm.scene);

        // Load the animation
        const animLoader = new GLTFLoader();
        animLoader.load(
            './animations/miyu.glb', // Your animation file
            (animGltf) => {
                console.log(animGltf.animations);
                const animation = animGltf.animations[0];
                //retargetAnimation(animation, currentVrm);
                
                const action = mixer.clipAction(animation);
                action.play();
            },
            undefined,
            (error) => console.error(error)
        );
    },
);

// 5. Animation Loop
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    if (currentVrm) {
        currentVrm.update(delta);
    }
    
    if (mixer) {
        mixer.update(delta);
    }

    // Conditionally update controls if they exist
    if (controls) {
        controls.update();
    }
    
    renderer.render(scene, camera);
}

animate();


