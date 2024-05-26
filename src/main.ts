import { webGPUDevice } from './device';
import { Display } from './display';
import { gltfmodel } from './gltf';
import { LightManager, Light } from './light';
import { CameraManager } from './camera';
import { VBuffer } from './vBuffer';
import { rayTracing } from './raytracing';
import { Denoiser } from './denoiser';
import { LogOnScreen } from './utils';
import { BufferPool } from './screenBuffer';
import * as THREE from 'three';
import { GLTFLoader, DRACOLoader } from 'three/examples/jsm/Addons.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

let stats = new Stats();
document.body.appendChild(stats.dom);

let GPUdevice = await new webGPUDevice().init();

enum sceneName {
    rabbit,
    sponza,
};

let conf = {
    flag: false,
    upscaleRatio: GPUdevice.upscaleRatio,
    scene: sceneName.sponza,
    dynamicLight: false,
    DI: true,
    GI: false,
    denoiser: true,
}
let gui = new GUI({ title: 'Settings' });
{
    gui.add(conf, 'upscaleRatio', 1, 4).name('Upscale Ratio').decimals(1).onFinishChange(() => {
        conf.flag = true;
    });
    gui.add(conf, 'scene', { 'Rabbit': sceneName.rabbit, 'Sponza': sceneName.sponza }).name('Scene').onChange(() => {
        conf.flag = true;
    });
    gui.add(conf, 'dynamicLight').name('Dynamic Light').onChange(() => {
        conf.flag = true;
    });
    gui.add(conf, 'DI').name('DI').onChange(() => {
        conf.flag = true;
    });
    gui.add(conf, 'GI').name('GI').onChange(() => {
        conf.flag = true;
    });
    gui.add(conf, 'denoiser').name('Denoiser').onChange(() => {
        conf.flag = true;
    });
    gui.add({
        title: () => {
            alert(
                "Please try this demo before upgrading your Chrome or Edge browser to the latest version.\n" +
                "For windows users with multiple graphic cards, please make sure you are using the high-performance graphic card. \n\n" +
                "You can set it in settings -> system -> display -> graphic settings ->  select the browser you are using -> options -> high-performance"
            );
        }
    }, 'title').name('Read Me ^.^');
}
let sponzaLight = Array<Light>();
{
    sponzaLight = [
        new Light(new Float32Array([-4, 8, 0]), new Float32Array([1, 0.5, 0.6]), 50),
        new Light(new Float32Array([4, 8, 0]), new Float32Array([0.5, 1, 1]), 50),
        new Light(new Float32Array([0, 3, 0]), new Float32Array([1, 1, 1]), 50),
        new Light(new Float32Array([8, 6, 3]), new Float32Array([1, 1, 0.7]), 40),
        new Light(new Float32Array([8, 6, -3]), new Float32Array([0.2, 0.5, 1]), 30),
        new Light(new Float32Array([-10, 6, -4]), new Float32Array([0.8, 0.8, 1]), 40),
        new Light(new Float32Array([-10, 6, 4]), new Float32Array([0.5, 1, 0.2]), 35),
        new Light(new Float32Array([-9.5, 1.5, -3.5]), new Float32Array([1, 0.5, 0.2]), 20),
        new Light(new Float32Array([-9.5, 1.5, 3]), new Float32Array([1, 0.5, 0.2]), 15),
        new Light(new Float32Array([9, 1.5, -3.5]), new Float32Array([1, 0.5, 0.2]), 15),
        new Light(new Float32Array([9, 1.5, 3]), new Float32Array([1, 0.5, 0.2]), 20),
    ];
    for (let i = 0; i < 3; i++) {
        // generate 3d vector on sphere uniformly
        let theta = 2 * Math.PI * Math.random();
        let phi = Math.acos(2 * Math.random() - 1);
        let unit = [Math.sin(phi) * Math.cos(theta), Math.sin(phi) * Math.sin(theta), Math.cos(phi)];
        let speed = (Math.random() * 2 + 1);
        for (let j = 0; j < 3; j++)
            unit[j] *= speed;
        sponzaLight[i].velocity = unit;

        sponzaLight[i].transform = function (this: Light, time: number) {
            const minBound = [-5, 1, -0.5];
            let maxBound = [5, 8, 0.5];
            if (i == 2) maxBound[1] = 4;
            else minBound[1] = 4;
            for (let j = 0; j < 3; j++) {
                if (this.position[j] < minBound[j]) {
                    this.velocity[j] = Math.abs(this.velocity[j]);
                }
                if (this.position[j] > maxBound[j]) {
                    this.velocity[j] = -Math.abs(this.velocity[j]);
                }
                // this.lightPosition[i][j] += this.lightVelocity[i][j] * 0.015 - (this.lightPosition[i][j] - center[j]) * 0.0015;
                this.position[j] += this.velocity[j] * time / 1000 * 0.5;
            }
        }.bind(sponzaLight[i]);
    }
}
let bunnyLight = Array<Light>();
{
    bunnyLight = [
        new Light(new Float32Array([0, 3, 0]), new Float32Array([1, 1, 1]), 40),
    ];
}

class Application {
    device: webGPUDevice;
    buffers: BufferPool;
    model: gltfmodel;
    lights: LightManager;
    camera: CameraManager;

    vBuffer: VBuffer;
    rayTracing: rayTracing;
    denoiser: Denoiser
    display: Display;

    async init() {
        this.device = GPUdevice;
        let loader = new GLTFLoader().setDRACOLoader(new DRACOLoader().setDecoderPath('./three/draco/'));
        LogOnScreen("model downloading...");
        let bunny = await loader.loadAsync("./assets/stanford_bunny/bunny.gltf") as any;
        bunny = bunny.scene;
        bunny.children[0].geometry.rotateX(-Math.PI / 2);
        bunny.children[0].geometry.scale(10, 10, 10);

        let sponza = await loader.loadAsync("./assets/sponza/sponza.gltf") as any;
        sponza = sponza.scene;

        sponza.add(bunny);
        this.model = new gltfmodel();
        await this.model.init(sponza, this.device);
        this.lights = new LightManager(sponzaLight, this.device);

        await this.reset();
        // console.log("my model:", this.model);
        LogOnScreen("");
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

    run() {
        const render = async () => {
            if (conf.flag) {
                this.rayTracing.dynamicLight = conf.dynamicLight;
                this.denoiser.ENABLE_DENOISE = conf.denoiser;
                if (this.rayTracing.DI_FLAG != (conf.DI ? 1 : 0)) {
                    this.rayTracing.DI_FLAG = conf.DI ? 1 : 0;
                    await this.rayTracing.init(this.lights);
                }
                if (this.rayTracing.GI_FLAG != (conf.GI ? 1 : 0)) {
                    this.rayTracing.GI_FLAG = conf.GI ? 1 : 0;
                    await this.rayTracing.init(this.lights);
                }
                if (conf.upscaleRatio != GPUdevice.upscaleRatio) {
                    GPUdevice.upscaleRatio = conf.upscaleRatio;
                    await this.reset();
                }
                conf.flag = false;
            }
            this.buildCmdBuffer();
            stats.update();
            requestAnimationFrame(render);
        }
        requestAnimationFrame(render);
    }

    async reset() {
        this.buffers = new BufferPool(this.device);
        this.camera = new CameraManager(this.device);

        this.vBuffer = new VBuffer(this.device, this.model, this.camera, this.buffers);
        await this.vBuffer.init();

        this.rayTracing = new rayTracing(this.device, this.model, this.camera, this.buffers);
        this.rayTracing.DI_FLAG = conf.DI ? 1 : 0;
        this.rayTracing.GI_FLAG = conf.GI ? 1 : 0;
        this.rayTracing.dynamicLight = conf.dynamicLight;
        await this.rayTracing.init(this.lights);

        this.denoiser = new Denoiser(this.device, this.buffers, this.camera);
        await this.denoiser.init();
        this.denoiser.ENABLE_DENOISE = conf.denoiser;

        this.display = new Display(this.device, this.buffers, this.camera);
    }
}

const app = new Application();
await app.init();
app.run();