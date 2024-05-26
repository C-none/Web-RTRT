import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader, DRACOLoader, KTX2Loader } from 'three/examples/jsm/Addons.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

let camera: any, scene: any, renderer: any;

init();

function init() {
    // let canvas = document.createElement('canvas');
    // canvas.width = 1920;
    // canvas.height = 1080;
    // canvas.style.width = `${1920 / devicePixelRatio}px`;
    // canvas.style.height = `${1080 / devicePixelRatio}px`;

    // canvas.style.alignSelf = 'center';
    // document.body.appendChild(canvas);
    // const container = document.querySelector('canvas');
    // document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 2000);
    camera.position.set(-1, 0, 0);

    scene = new THREE.Scene();

    new RGBELoader()
        .setPath('./assets/')
        .load('san_giuseppe_bridge_4k.hdr', function (texture) {

            texture.mapping = THREE.EquirectangularReflectionMapping;

            scene.background = texture;
            scene.environment = texture;

            render();

            // model
            // const draco = new DRACOLoader().setDecoderPath('./three/draco/');
            // const loader = new GLTFLoader().setDRACOLoader(draco);
            const loader = new GLTFLoader();
            loader.load('assets/box/scene.gltf', async function (gltf) {

                const model = gltf.scene;
                model.scale.set(0.1, 0.1, 0.1);
                // model.scale.set(10, 10, 10);

                // wait until the model can be added to the scene without blocking due to shader compilation
                model.traverse((child) => {
                    if (child instanceof THREE.Group) {
                        for (let i = child.children.length - 1; i >= 0; i--) {
                            if (child.children[i] instanceof THREE.Mesh) {
                                let mesh = child.children[i] as THREE.Mesh;
                                let material = mesh.material as any;
                                // if (material.ior !== undefined) {
                                //     child.children.splice(i, 1);
                                // } else {
                                console.log(mesh);
                                // }
                            }
                        }
                    }
                });
                await renderer.compileAsync(model, camera, scene);

                scene.add(model);

                render();

            });

        });

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        logarithmicDepthBuffer: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    document.body.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.addEventListener('change', render); // use if there is no animation loop
    controls.minDistance = 0.01;
    controls.maxDistance = 1000;
    controls.target.set(0, 0.1, 0);
    controls.update();

    window.addEventListener('resize', onWindowResize);

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

    render();

}

//

function render() {

    renderer.render(scene, camera);

}