// These "bare" imports are now mapped to your local files by the importmap
import * as THREE from 'three';
import { GLTFLoader  } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils  } from '@pixiv/three-vrm'; 
import { VRMAnimationLoaderPlugin } from '@pixiv/three-vrm-animation';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- CONTROL FLAG ---
const enableOrbitControls = true;

// 1. Scene, Camera, and Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.01, 100);
const top = 0.1; 
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

/**
 * Retargets AND INVERTS a VRM animation clip.
 * NOTE: This is a workaround and not the recommended solution.
 * @param {THREE.AnimationClip} sourceClip The animation clip to modify.
 * @param {VRM} vrm The loaded VRM object.
 * @returns {THREE.AnimationClip} A new, modified AnimationClip.
 */
function retargetAndInvertAnimation(sourceClip, vrm) {
    const newTracks = [];
    const humanoid = vrm.humanoid;

    for (const track of sourceClip.tracks) {
        const parts = track.name.split('.');
        const boneName = parts[0];
        const propertyName = parts[1];

        const camelCaseBoneName = boneName.charAt(0).toLowerCase() + boneName.slice(1);
        const targetNode = humanoid.getRawBoneNode(camelCaseBoneName);

        if (targetNode) {
            const newTrackName = `${targetNode.name}.${propertyName}`;
            const newTrack = track.clone();
            newTrack.name = newTrackName;

            // --- INVERSION LOGIC ---
            // Check if this is a quaternion (rotation) track
            if (propertyName === 'quaternion') {
                const values = newTrack.values;
                const tempQuat = new THREE.Quaternion();

                // The values array is a flat list of [qx1, qy1, qz1, qw1, qx2, qy2, ... ]
                // We need to step through it 4 values at a time
                for (let i = 0; i < values.length; i += 4) {
                    tempQuat.fromArray(values, i); // Load the quaternion
                    tempQuat.invert();             // Invert it
                    tempQuat.toArray(values, i);   // Store it back into the array
                }
            }
            // --- END INVERSION LOGIC ---

            newTracks.push(newTrack);
        }
    }

    return new THREE.AnimationClip(
        `${sourceClip.name}_retargeted_inverted`,
        sourceClip.duration,
        newTracks
    );
}

// 4. Load VRM Model
let currentVrm = null;
const clock = new THREE.Clock();
let mixer = null;

const loader = new GLTFLoader();
loader.register((parser) => new VRMLoaderPlugin(parser));

const animLoader = new GLTFLoader();
animLoader.register((parser) => new VRMAnimationLoaderPlugin(parser));

loader.load(
    './assets/miyu.vrm', // Your VRM file
    (gltf) => {
        currentVrm = gltf.userData.vrm;
        scene.add(currentVrm.scene);
        //currentVrm.scene.rotation.y = Math.PI;

        // This helper function is crucial for normalizing the model's T-pose before animation.
        VRMUtils.rotateVRM0(currentVrm);

        // console.log("--- VRM BONE NAMES (Destination for Instructions) ---");
        // console.log(currentVrm);

        mixer = new THREE.AnimationMixer(currentVrm.scene);

        animLoader.load(
            './animations/idle.vrma', // Your animation file
            (vrma) => {
                const animation = vrma.animations[0];
                console.log(vrma.animations);

                const retargeted = retargetAndInvertAnimation(animation, currentVrm);

                const action = mixer.clipAction(retargeted);
                action.play();
            },
        );
    },
);

// 5. Animation Loop
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    if (currentVrm) currentVrm.update(delta);
    if (mixer) mixer.update(delta);
    if (controls) controls.update();
    
    renderer.render(scene, camera);
}

animate();

