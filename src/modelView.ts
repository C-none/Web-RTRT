import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader, DRACOLoader, KTX2Loader } from 'three/examples/jsm/Addons.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

let camera: any, scene: any, renderer: any;

init();

function init() {

    // const container = document.querySelector('canvas');
    // document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 2000);
    camera.position.set(- 1.8, 0.6, 2.7);

    scene = new THREE.Scene();

    new RGBELoader()
        .setPath('./assets/')
        .load('san_giuseppe_bridge_4k.hdr', function (texture) {

            texture.mapping = THREE.EquirectangularReflectionMapping;

            scene.background = texture;
            scene.environment = texture;

            render();

            // model
            const draco = new DRACOLoader().setDecoderPath('./three/draco/');
            const loader = new GLTFLoader().setDRACOLoader(draco);
            // const loader = new GLTFLoader();
            loader.load('assets/bistro_external/external.gltf', async function (gltf) {

                const model = gltf.scene;

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
    controls.minDistance = 0.5;
    controls.maxDistance = 1000;
    controls.target.set(0, 0, - 0.2);
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