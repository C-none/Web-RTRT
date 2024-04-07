import { webGPUDevice } from './device';
import { Display } from './display';
import { gltfmodel } from './gltf';
import { CameraManager } from './camera';
import { VBuffer } from './vBuffer';
import { rayTracing } from './raytracing';
import { LogOnScreen } from './utils';
import { BufferPool } from './screenBuffer';

class Application {
    device: webGPUDevice;
    buffers: BufferPool;
    model: gltfmodel;
    camera: CameraManager;

    vBuffer: VBuffer;
    rayTracing: rayTracing;
    display: Display;

    async init() {
        this.device = new webGPUDevice();
        await this.device.init(await document.querySelector('canvas') as HTMLCanvasElement);
        this.buffers = new BufferPool(this.device);
        this.camera = new CameraManager(this.device);
        this.model = new gltfmodel();
        await this.model.init("./assets/sponza/sponza.gltf", this.device);

        this.vBuffer = new VBuffer(this.device, this.model, this.camera, this.buffers);
        await this.vBuffer.init();

        this.rayTracing = new rayTracing(this.device, this.model, this.camera, this.buffers);
        await this.rayTracing.init();

        this.display = new Display(this.device, this.buffers);

        console.log("my model:", this.model);
    }

    buildCmdBuffer() {
        this.camera.update();

        const commandEncoder = this.device.device.createCommandEncoder();

        this.vBuffer.record(commandEncoder);
        this.rayTracing.record(commandEncoder);
        this.display.record(commandEncoder);

        this.buffers.update(commandEncoder, this.device);

        let cmdBuffer = commandEncoder.finish();
        this.device.device.queue.submit([cmdBuffer]);
    }

    timeStamp = Date.now();
    frameCnt = 0;
    run() {
        this.buildCmdBuffer();
        if (this.frameCnt == 100) {
            const now = Date.now()
            LogOnScreen("fps: " + (1000 * 100 / (now - this.timeStamp)).toFixed(1));
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