import { webGPUDevice } from './device';
import { Display } from './display';
import { gltfmodel } from './gltf';
import { CameraManager } from './camera';
import { VBuffer } from './vBuffer';
import { rayTracing } from './raytracing';
import { Denoiser } from './denoiser';
import { LogOnScreen } from './utils';
import { BufferPool } from './screenBuffer';

class Application {
    device: webGPUDevice;
    buffers: BufferPool;
    model: gltfmodel;
    camera: CameraManager;

    vBuffer: VBuffer;
    rayTracing: rayTracing;
    denoiser: Denoiser
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

        this.denoiser = new Denoiser(this.device, this.buffers);
        await this.denoiser.init();

        this.display = new Display(this.device, this.buffers, this.camera);

        console.log("my model:", this.model);
    }

    buildCmdBuffer() {
        this.camera.update();

        const commandEncoder = this.device.device.createCommandEncoder();

        this.vBuffer.record(commandEncoder);
        this.rayTracing.record(commandEncoder);
        this.denoiser.record(commandEncoder);
        this.display.record(commandEncoder);

        this.buffers.update(commandEncoder, this.device);

        let cmdBuffer = commandEncoder.finish();
        this.device.device.queue.submit([cmdBuffer]);

    }

    timeStamp = Date.now();
    run() {
        class Timer {
            total: number = 0;
            cursor: number = 0;
            numSamples: number = 50;
            samples: number[] = new Array(this.numSamples).fill(0);
            addSample(sample: number) {
                sample = Math.min(1000, sample);
                this.total += sample - this.samples[this.cursor];
                this.samples[this.cursor] = sample;
                this.cursor = (this.cursor + 1) % this.numSamples;
            }
            print() {
                if (this.cursor == 0)
                    LogOnScreen("fps: " + (this.total / this.numSamples).toPrecision(3));
            }
        };
        let timer = new Timer();
        const render = () => {
            requestAnimationFrame(render);
            this.buildCmdBuffer();
            const now = performance.now();
            const delta = now - this.timeStamp;
            this.timeStamp = now;
            timer.addSample(1000 / delta);
            timer.print();
        }
        requestAnimationFrame(render);
    }
}

const app = new Application();
await app.init();
app.run();