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

    constructor(device: webGPUDevice) {
        this.device = device;
        this.camera = new THREE.PerspectiveCamera(60, this.device.canvas.width / this.device.canvas.height, 0.01, 50);
        this.controls = new OrbitControls(this.camera, this.device.canvas);
        // this.controls.enableDamping = true;
        // this.controls.dampingFactor = 0.02
        this.controls.target.set(0, 5, 0);
        this.camera.position.set(5, 5, 0);
        // this.controls.target.set(0, 0, 0);
        // this.camera.position.set(0, 0, 2);
        this.controls.update();
        this.Frustum = new Frustum();
        this.cameraBuffer = this.device.device.createBuffer({
            label: 'current view matrix and projection inverse',
            size: this.cameraSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
    }
    update() {
        let lastVp = this.camera.projectionMatrix.clone().multiply(this.camera.matrixWorldInverse);
        this.controls.update();
        let vp = this.camera.projectionMatrix.clone().multiply(this.camera.matrixWorldInverse);
        this.Frustum.setFromProjectionMatrix(vp);
        const viewMatrix = this.camera.matrixWorld.clone();
        const projectionMatrix = this.camera.projectionMatrixInverse.clone();

        const uboArray = new Float32Array([...viewMatrix.elements, ...projectionMatrix.elements, ...vp.elements, ...lastVp.elements]);
        this.device.device.queue.writeBuffer(this.cameraBuffer, 0, uboArray);
    }
    checkFrustum(sphere: THREE.Sphere): boolean {
        if (sphere)
            return this.Frustum.intersectsSphere(sphere);
        return true;
    }
}

export { CameraManager };