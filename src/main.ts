// import * as THREE from 'three'
// import { OrbitControls } from 'three/examples/jsm/Addons.js'
import { webGPUDevice } from './util/device.ts'
import { Display } from './display.ts'
import DISPLAY_VERTEX from './shaders/display/display.vert.wgsl?raw'
import DISPLAY_FRAG from './shaders/display/display.frag.wgsl?raw'



class Application {
    device: webGPUDevice;
    currentFrameBuffer?: GPUBuffer;
    cmdBuffer?: GPUCommandBuffer;
    display?: Display;

    constructor() {
        this.device = new webGPUDevice();
        this.device.init(document.getElementById('canvas') as HTMLCanvasElement);

        const currentFrameBuffer = this.device.device.createBuffer({
            size: this.device.size.width * this.device.size.height * 4 * Float32Array.BYTES_PER_ELEMENT,
            usage: GPUBufferUsage.STORAGE
        });
        this.display = new Display(this.device, currentFrameBuffer);
    }

    buildCmdBuffer() {
        const commandEncoder = this.device.device.createCommandEncoder();

        // display pipeline
        this.display.buildPipeline(commandEncoder, this.device.context.getCurrentTexture().createView());

        this.cmdBuffer = commandEncoder.finish();
        this.device.device.queue.submit([this.cmdBuffer]);
    }

    async init() {

    }
}