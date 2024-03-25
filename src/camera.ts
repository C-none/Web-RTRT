import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/Addons.js'
import { webGPUDevice } from './util/device.ts'
import { update } from 'three/examples/jsm/libs/tween.module.js';
class CameraManager {
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;

    cameraSize: number = 2 * 4 * 4 * Float32Array.BYTES_PER_ELEMENT;
    cameraBuffer: GPUBuffer;
    device: webGPUDevice;

    constructor(device: webGPUDevice) {
        this.device = device;
        this.camera = new THREE.PerspectiveCamera(60, this.device.canvas.width / this.device.canvas.height, 0.1, 1000);
        this.controls = new OrbitControls(this.camera, this.device.canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.02
        this.controls.target.set(0, 500, 0);
        this.camera.position.set(500, 500, 0);
        this.controls.update();

        this.cameraBuffer = this.device.device.createBuffer({
            label: 'current view matrix and projection inverse',
            size: this.cameraSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
    }
    update() {
        this.controls.update();
        const viewMatrix = this.camera.matrixWorld.clone();
        const projectionMatrix = this.camera.projectionMatrixInverse.clone();

        const uboArray = new Float32Array([...viewMatrix.elements, ...projectionMatrix.elements]);
        this.device.device.queue.writeBuffer(this.cameraBuffer, 0, uboArray);
    }
}

export { CameraManager };