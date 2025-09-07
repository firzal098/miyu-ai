// These "bare" imports are now mapped to your local files by the importmap
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils, VRMHumanBoneName  } from '@pixiv/three-vrm'; 
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
 * The definitive translator function, built with your specific file data.
 * @param {THREE.AnimationClip} animationClip The animation clip from the loaded FBX.
 * @param {VRM} vrm The loaded VRM model.
 */
function retargetFBXAnimation(animationClip, vrm) {
    const tracks = [];
    const humanoid = vrm.humanoid;

    const unityVRMBoneMap = {
        'Hips': VRMHumanBoneName.Hips,
        'Spine': VRMHumanBoneName.Spine,
        'Chest': VRMHumanBoneName.Chest,
        'UpperChest': VRMHumanBoneName.UpperChest,
        'Neck': VRMHumanBoneName.Neck,
        'Head': VRMHumanBoneName.Head,
        'LeftShoulder': VRMHumanBoneName.LeftShoulder,
        'LeftUpperArm': VRMHumanBoneName.LeftUpperArm,
        'LeftLowerArm': VRMHumanBoneName.LeftLowerArm,
        'LeftHand': VRMHumanBoneName.LeftHand,
        'RightShoulder': VRMHumanBoneName.RightShoulder,
        'RightUpperArm': VRMHumanBoneName.RightUpperArm,
        'RightLowerArm': VRMHumanBoneName.RightLowerArm,
        'RightHand': VRMHumanBoneName.RightHand,
        'LeftUpperLeg': VRMHumanBoneName.LeftUpperLeg,
        'LeftLowerLeg': VRMHumanBoneName.LeftLowerLeg,
        'LeftFoot': VRMHumanBoneName.LeftFoot,
        'RightUpperLeg': VRMHumanBoneName.RightUpperLeg,
        'RightLowerLeg': VRMHumanBoneName.RightLowerLeg,
        'RightFoot': VRMHumanBoneName.RightFoot,
    };

    animationClip.tracks.forEach((track) => {
        // This regex will extract the base bone name from a prefixed name like "miyu_Hips"
        const match = track.name.match(/^(?:.*:)?([^.]+)\.(.+)$/);
        if (!match) return;

        const fbxBoneName = match[1];
        const propertyName = match[2];

        let unityBoneName = null;
        for (const name in unityVRMBoneMap) {
            if (fbxBoneName.endsWith(name)) {
                unityBoneName = name;
                break;
            }
        }
        
        if (unityBoneName) {
            const vrmHumanBoneName = unityVRMBoneMap[unityBoneName];
            const vrmBoneNode = humanoid.getNormalizedBoneNode(vrmHumanBoneName); // Using the correct method

            if (vrmBoneNode) {
                const newTrack = track.clone();
                newTrack.name = `${vrmBoneNode.name}.${propertyName}`;
                tracks.push(newTrack);
            }
        }
    });

    return new THREE.AnimationClip(animationClip.name, animationClip.duration, tracks);
}



// 4. Load VRM Model
let currentVrm = null;
const clock = new THREE.Clock();
let mixer = null;

const loader = new GLTFLoader();
loader.register((parser) => new VRMLoaderPlugin(parser));

loader.load(
    './assets/miyu.vrm', // Your VRM file
    (gltf) => {
        currentVrm = gltf.userData.vrm;
        scene.add(currentVrm.scene);
        currentVrm.scene.rotation.y = Math.PI;

        // This helper function is crucial for normalizing the model's T-pose before animation.
        VRMUtils.rotateVRM0(currentVrm);

        console.log("--- VRM BONE NAMES (Destination for Instructions) ---");

        const humanoid = currentVrm.humanoid;
   
        mixer = new THREE.AnimationMixer(currentVrm.scene);

        const animLoader = new FBXLoader();
        animLoader.load(
            './animations/miyu.fbx', // Your animation file
            (fbx) => {
                const animation = fbx.animations[0];
                console.log(fbx.animations);

                const retargeted = retargetFBXAnimation(animation, currentVrm);

                console.log('retargetted:', retargeted);
                // The rest of your code can stay for now
                const action = mixer.clipAction(animation);
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

