import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/Addons.js'
import { webGPUDevice } from './device'
import { Plane } from "three";

class Frustum {

    planes: Plane[];

    constructor(p0 = new Plane(), p1 = new Plane(), p2 = new Plane(), p3 = new Plane(), p4 = new Plane(), p5 = new Plane()) {
        this.planes = [p0, p1, p2, p3, p4, p5];
    }
    setFromProjectionMatrix(m: THREE.Matrix4) {

        const planes = this.planes;
        const me = m.elements;
        const me0 = me[0], me1 = me[1], me2 = me[2], me3 = me[3];
        const me4 = me[4], me5 = me[5], me6 = me[6], me7 = me[7];
        const me8 = me[8], me9 = me[9], me10 = me[10], me11 = me[11];
        const me12 = me[12], me13 = me[13], me14 = me[14], me15 = me[15];
        planes[0].setComponents(me3 - me0, me7 - me4, me11 - me8, me15 - me12).normalize();
        planes[1].setComponents(me3 + me0, me7 + me4, me11 + me8, me15 + me12).normalize();
        planes[2].setComponents(me3 + me1, me7 + me5, me11 + me9, me15 + me13).normalize();
        planes[3].setComponents(me3 - me1, me7 - me5, me11 - me9, me15 - me13).normalize();
        planes[4].setComponents(me3 - me2, me7 - me6, me11 - me10, me15 - me14).normalize();
        planes[5].setComponents(me2, me6, me10, me14).normalize();
        return this;
    }

    intersectsSphere(sphere: THREE.Sphere): boolean {
        const planes = this.planes;
        const center = sphere.center;
        const negRadius = - sphere.radius;

        for (let i = 0; i < 6; i++) {
            const distance = planes[i].distanceToPoint(center);
            if (distance < negRadius) {
                return false;
            }
        }
        return true;
    }
}

class CameraManager {
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    Frustum: Frustum;

    cameraSize: number = 4 * 4 * 4 * Float32Array.BYTES_PER_ELEMENT;
    cameraBuffer: GPUBuffer;
    device: webGPUDevice;
    Halton_2_3: Float32Array[];
    jitter_index: number;
    jitter: GPUBuffer;
    ENABLE_JITTER: boolean = false;

    constructor(device: webGPUDevice) {
        this.device = device;
        this.camera = new THREE.PerspectiveCamera(60, this.device.canvas.width / this.device.canvas.height, 0.01, 50);
        this.controls = new OrbitControls(this.camera, this.device.canvas);
        // this.controls.enableDamping = true;
        // this.controls.dampingFactor = 0.001;
        this.controls.target.set(0, 3, 0);
        this.camera.position.set(-4.5, 3, 0);
        // this.controls.target.set(0, 0, 0);
        // this.camera.position.set(0, 0, 2);
        this.controls.update();
        this.Frustum = new Frustum();
        this.cameraBuffer = this.device.device.createBuffer({
            label: 'current view matrix and projection inverse',
            size: this.cameraSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        this.Halton_2_3 = [
            new Float32Array([-4, -7]), new Float32Array([-7, -5]), new Float32Array([-3, -5]), new Float32Array([-5, -4]),
            new Float32Array([-1, -4]), new Float32Array([-2, -2]), new Float32Array([-6, -1]), new Float32Array([-4, 0]),
            new Float32Array([-7, 1]), new Float32Array([-1, 2]), new Float32Array([-6, 3]), new Float32Array([-3, 3]),
            new Float32Array([-7, 6]), new Float32Array([-3, 6]), new Float32Array([-5, 7]), new Float32Array([-1, 7]),
            new Float32Array([5, -7]), new Float32Array([1, -6]), new Float32Array([6, -5]), new Float32Array([4, -4]),
            new Float32Array([2, -3]), new Float32Array([7, -2]), new Float32Array([1, -1]), new Float32Array([4, -1]),
            new Float32Array([2, 1]), new Float32Array([6, 2]), new Float32Array([0, 4]), new Float32Array([4, 4]),
            new Float32Array([2, 5]), new Float32Array([7, 5]), new Float32Array([5, 6]), new Float32Array([3, 7])
        ];
        this.Halton_2_3.forEach(pair => {
            // pair[0] /= 16*device.upscaleRatio*2;
            // pair[1] /= 16*device.upscaleRatio*2;
            pair[0] /= 16 * device.upscaleRatio;
            pair[1] /= 16 * device.upscaleRatio;
            // pair[0] /= 16;
            // pair[1] /= 16;
        });
        this.jitter_index = 0;
        this.jitter = device.device.createBuffer({
            label: 'sampler jitter by yyf',
            size: Float32Array.BYTES_PER_ELEMENT * 2, // 2 x float32
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
    }
    lastVp = new THREE.Matrix4();
    vp = new THREE.Matrix4();
    viewMatrix = new THREE.Matrix4();
    projectionMatrix = new THREE.Matrix4();
    uboArray = new Float32Array(16 * 4);
    update() {
        this.lastVp.copy(this.camera.projectionMatrix).multiply(this.camera.matrixWorldInverse);
        this.controls.update();
        let curCam = this.camera.clone();
        let originWidth = Math.floor(this.device.canvas.width / this.device.upscaleRatio);
        let originHeight = Math.floor(this.device.canvas.height / this.device.upscaleRatio);
        if (this.ENABLE_JITTER) {
            curCam.setViewOffset(originWidth, originHeight,
                this.Halton_2_3[this.jitter_index][0], this.Halton_2_3[this.jitter_index][1],
                originWidth, originHeight);
            var tmp: Float32Array = new Float32Array(this.Halton_2_3[this.jitter_index]);
            //tmp =new Float32Array([0,0]);
            this.device.device.queue.writeBuffer(this.jitter, 0, tmp);
            // this.device.device.queue.writeBuffer(this.jitter, 0, new Float32Array([0,0]));//
            this.jitter_index = (this.jitter_index + 1) % 32;
        }
        this.vp.copy(curCam.projectionMatrix).multiply(curCam.matrixWorldInverse);
        this.viewMatrix.copy(curCam.matrixWorld);
        this.projectionMatrix.copy(curCam.projectionMatrixInverse);
        // this.lastVp = this.camera.projectionMatrix.clone().multiply(this.camera.matrixWorldInverse);
        // this.controls.update();
        // this.vp = this.camera.projectionMatrix.clone().multiply(this.camera.matrixWorldInverse);
        // this.viewMatrix = this.camera.matrixWorld.clone();
        // this.projectionMatrix = this.camera.projectionMatrixInverse.clone();
        // const uboArray = new Float32Array([...viewMatrix.elements, ...projectionMatrix.elements, ...vp.elements, ...lastVp.elements]);
        this.Frustum.setFromProjectionMatrix(this.vp);
        // write uboArray
        this.uboArray.set(this.viewMatrix.elements, 0);
        this.uboArray.set(this.projectionMatrix.elements, 16);
        this.uboArray.set(this.vp.elements, 32);
        this.uboArray.set(this.lastVp.elements, 48);
        this.device.device.queue.writeBuffer(this.cameraBuffer, 0, this.uboArray);

    }
    checkFrustum(sphere: THREE.Sphere): boolean {
        if (sphere)
            return this.Frustum.intersectsSphere(sphere);
        return true;
    }
}

export { CameraManager };