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
    rayTracing: rayTracing;
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
            format: 'rgba16float', dimension: '2d',
            usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
        });

        this.display = new Display(this.device, currentFrameBuffer);
        this.model = new gltfmodel();
        await this.model.init("./assets/sponza/Sponza.gltf", this.device);
        this.rayTracing = new rayTracing(this.device, this.model, currentFrameBuffer);
        await this.rayTracing.init();
        console.log("my model:", this.model);
    }

    buildCmdBuffer() {
        const commandEncoder = this.device.device.createCommandEncoder();

        this.rayTracing.record(commandEncoder);

        this.display.record(commandEncoder);

        this.cmdBuffer = commandEncoder.finish();
        this.device.device.queue.submit([this.cmdBuffer]);
    }

    timeStamp = Date.now();
    frameCnt = 0;
    run() {
        this.buildCmdBuffer();
        if (this.frameCnt == 100) {
            const now = Date.now()
            // present fps on screen fixed 2 decimal
            document.querySelector('span')!.textContent = "fps: " + (1000 * 100 / (now - this.timeStamp)).toFixed(1)
            this.timeStamp = now
            this.frameCnt = 0;
        }
        this.frameCnt++
        requestAnimationFrame(() => this.run());
    }
}

const app = new Application();
await app.init();
app.run();