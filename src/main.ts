// import * as THREE from 'three'
// import { OrbitControls } from 'three/examples/jsm/Addons.js'
import { webGPUDevice } from './util/device.ts'
import { Display } from './display.ts'
import { gltfmodel } from './gltf.ts'
import { rayTracing } from './raytracing.ts';

class Application {
    device: webGPUDevice;
    currentFrameBuffer: GPUTexture;
    cmdBuffer: GPUCommandBuffer;
    display: Display;
    rayTracingPipeline: rayTracing;
    model: gltfmodel;

    async init() {
        this.device = new webGPUDevice();
        await this.device.init(await document.querySelector('canvas') as HTMLCanvasElement);

        const currentFrameBuffer = this.device.device.createTexture({
            size: {
                width: this.device.canvas.width,
                height: this.device.canvas.height,
                depthOrArrayLayers: 1,
            },
            format: 'rgba16float',
            usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
        });

        this.display = new Display(this.device, currentFrameBuffer.createView({}));
        this.model = new gltfmodel();
        await this.model.init("./assets/sponza/Sponza.gltf", this.device);
        this.rayTracingPipeline = new rayTracing(this.device, this.model, currentFrameBuffer);
        console.log("my model:", this.model);
    }

    buildCmdBuffer() {
        const commandEncoder = this.device.device.createCommandEncoder();

        // display pipeline
        // this.display.buildPipeline(commandEncoder, this.device.context.getCurrentTexture().createView());

        this.cmdBuffer = commandEncoder.finish();
        this.device.device.queue.submit([this.cmdBuffer]);
    }
}

const app = new Application();
await app.init();