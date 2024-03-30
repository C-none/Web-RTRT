import { webGPUDevice } from './device';
import { Display } from './display';
import { gltfmodel } from './gltf';
import { CameraManager } from './camera';
import { rayTracing } from './raytracing';
import { LogOnScreen } from './utils';

class Application {
    device: webGPUDevice;
    gBufferTextures: GPUTexture;
    currentFrameBuffer: GPUTexture;
    display: Display;
    rayTracing: rayTracing;
    model: gltfmodel;
    camera: CameraManager;
    async init() {
        this.device = new webGPUDevice();
        await this.device.init(await document.querySelector('canvas') as HTMLCanvasElement);
        this.camera = new CameraManager(this.device);

        this.display = new Display(this.device, this.currentFrameBuffer);
        this.model = new gltfmodel();
        await this.model.init("./assets/sponza/sponza.gltf", this.device);
        this.rayTracing = new rayTracing(this.device, this.model, this.camera, this.currentFrameBuffer);
        await this.rayTracing.init();
        console.log("my model:", this.model);
    }

    buildCmdBuffer() {
        this.camera.update();

        const commandEncoder = this.device.device.createCommandEncoder();

        this.rayTracing.record(commandEncoder);
        this.display.record(commandEncoder);

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