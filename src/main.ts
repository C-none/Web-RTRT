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
import { Controller, GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

let stats = new Stats();
document.body.appendChild(stats.dom);

let GPUdevice = await new webGPUDevice().init();

enum sceneName {
    box,
    room,
    seahouse,
    sponza,
};

let conf = {
    flag: false,
    scene: sceneName.box,
    upscaleRatio: GPUdevice.upscaleRatio,
    superResolution: true,
    dynamicLight: false,
    GI_RIS: true,
    DI: true,
    GI: false,
    spatial: true,
    temporal: true,
    denoiser: true,
}
let gui = new GUI({ title: 'Settings' });
{
    gui.add(conf, 'scene', { 'Box': sceneName.box, 'Room': sceneName.room, 'Sea House': sceneName.seahouse, 'Sponza': sceneName.sponza, }).name('Scene').onChange(() => {
        conf.flag = true;
    });
    (gui.children[0] as Controller).disable();
    gui.add(conf, 'upscaleRatio', [1, 1.5, 2, 3, 4]).name('Upscale Ratio').onFinishChange(() => {
        conf.flag = true;
    });
    gui.add(conf, 'superResolution').name('Super Resolution').onChange(() => {
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
    gui.add(conf, 'GI_RIS').name('RIS initialize GI samples').onChange(() => {
        conf.flag = true;
    });
    gui.add(conf, 'spatial').name('Spatial reuse').onChange(() => {
        conf.flag = true;
    });
    gui.add(conf, 'temporal').name('Temporal reuse').onChange(() => {
        conf.flag = true;
    });
    gui.add(conf, 'denoiser').name('Denoiser').onChange(() => {
        conf.flag = true;
    });
    gui.add({
        title: () => {
            alert(
                "Please try this demo after upgrading your Chrome or Edge browser to the latest version.\n\n" +
                "For windows users with multiple graphic cards, please make sure you are using the high-performance graphic card. \n\n" +
                "You can set it in settings -> system -> display -> graphic settings ->  select the browser you are using -> options -> high-performance\n\n" +
                "Operation:\n" +
                "hold left mouse button: rotate camera\n" +
                "hold right mouse button: move camera\n" +
                "mouse wheel: zoom in/out\n"
            );
        }
    }, 'title').name('Read Me ^.^');
}
let sponzaLight = Array<Light>();
{
    sponzaLight = [
        new Light(new Float32Array([-4, 8, 0]), new Float32Array([1, 0.5, 0.6]), 40),
        new Light(new Float32Array([4, 8, 0]), new Float32Array([0.5, 1, 1]), 40),
        new Light(new Float32Array([0, 8, 0]), new Float32Array([1, 1, 1]), 60),
        new Light(new Float32Array([0, 3, 0]), new Float32Array([1, 1, 1]), 40),

        new Light(new Float32Array([8, 6, 3]), new Float32Array([1, 1, 0.7]), 40),
        new Light(new Float32Array([8, 6, -3]), new Float32Array([0.2, 0.5, 1]), 30),
        new Light(new Float32Array([-10, 6, -4]), new Float32Array([0.8, 0.8, 1]), 40),
        new Light(new Float32Array([-10, 6, 4]), new Float32Array([0.5, 1, 0.2]), 35),
        new Light(new Float32Array([-9.5, 1.5, -3.5]), new Float32Array([1, 0.5, 0.2]), 20),
        new Light(new Float32Array([-9.5, 1.5, 3]), new Float32Array([1, 0.5, 0.2]), 15),
        new Light(new Float32Array([9, 1.5, -3.5]), new Float32Array([1, 0.5, 0.2]), 15),
        new Light(new Float32Array([9, 1.5, 3]), new Float32Array([1, 0.5, 0.2]), 20),

        new Light(new Float32Array([-18, -4, -12]), new Float32Array([1, 1, 1]), 80),
        new Light(new Float32Array([-18, -4, 12]), new Float32Array([1, 1, 1]), 80),
        new Light(new Float32Array([18, -4, -12]), new Float32Array([1, 1, 1]), 80),
        new Light(new Float32Array([18, -4, 12]), new Float32Array([1, 1, 1]), 80),
        new Light(new Float32Array([-18, 15, -12]), new Float32Array([1, 1, 1]), 80),
        new Light(new Float32Array([-18, 15, 12]), new Float32Array([1, 1, 1]), 80),
        new Light(new Float32Array([18, 15, -12]), new Float32Array([1, 1, 1]), 80),
        new Light(new Float32Array([18, 15, 12]), new Float32Array([1, 1, 1]), 80),
    ];
    for (let i = 0; i < 4; i++) {
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
            if (i == 3) maxBound[1] = 4;
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
    // sponzaLight = [new Light(new Float32Array([0, 5, -4]), new Float32Array([1, 1, 1]), 50)];
    // let unit = [0, 0, -1];
    // sponzaLight[0].velocity = unit;
    // sponzaLight[0].transform = function (this: Light, time: number) {
    //     const minBound = [0, 5, -6];
    //     let maxBound = [0, 5, -4];
    //     for (let j = 0; j < 3; j++) {
    //         if (this.position[j] < minBound[j]) {
    //             this.velocity[j] = Math.abs(this.velocity[j]);
    //         }
    //         if (this.position[j] > maxBound[j]) {
    //             this.velocity[j] = -Math.abs(this.velocity[j]);
    //         }
    //         this.position[j] += this.velocity[j] * time / 1000 * 0.5;
    //     }
    // }.bind(sponzaLight[0]);

}
let boxLight = Array<Light>();
{
    boxLight = [
        new Light(new Float32Array([2, 5.5, 0]), new Float32Array([0.8, 0.6, 0.0]), 10),
        new Light(new Float32Array([-2, 5.5, 0]), new Float32Array([0.9, 0.3, 1]), 25),
        // new Light(new Float32Array([2, 0.5, 2]), new Float32Array([1, 1, 1]), 1),
    ];
    // for (let i = 0; i < 16; i++) {
    //     // random initialize light
    //     let position = new Float32Array([Math.random() * 10 - 5, Math.random() * 12 - 6, Math.random() * 10 - 5]);
    //     let color = new Float32Array([Math.random(), Math.random(), Math.random()]);
    //     let intensity = Math.random() * 3 + 5;
    //     boxLight.push(new Light(position, color, intensity));
    // }
    for (let i = 0; i < 2; i++) {
        // generate 3d vector on sphere uniformly
        let unit = [1, 1, 1];
        let speed = 1;
        for (let j = 0; j < 3; j++)
            unit[j] *= speed;
        boxLight[i].velocity = unit;

        boxLight[i].transform = function (this: Light, time: number) {
            let theta = Math.atan2(this.position[2], this.position[0]);
            let r = Math.sqrt(this.position[0] * this.position[0] + this.position[2] * this.position[2]);
            theta += this.velocity[0] * time / 1000;
            this.position[0] = Math.cos(theta) * r;
            this.position[2] = Math.sin(theta) * r;
        }.bind(boxLight[i]);
    }
}
let roomLight = Array<Light>();
{
    roomLight = [
        new Light(new Float32Array([0, 0, 0]), new Float32Array([1, 1, 1]), 20),
        new Light(new Float32Array([1, 1, 0.5]), new Float32Array([0.2, 0.5, 1]), 20),
        new Light(new Float32Array([5, 0.5, -1.2]), new Float32Array([1, 0.3, 0.3]), 20),
        new Light(new Float32Array([-3, 0.4, 1]), new Float32Array([1, 1, 1]), 10),

        new Light(new Float32Array([-6, -4, -6]), new Float32Array([1, 1, 1]), 40),
        new Light(new Float32Array([-6, -4, 6]), new Float32Array([1, 1, 1]), 40),
        new Light(new Float32Array([6, -4, -6]), new Float32Array([1, 1, 1]), 40),
        new Light(new Float32Array([6, -4, 6]), new Float32Array([1, 1, 1]), 40),
        new Light(new Float32Array([-6, 4, -6]), new Float32Array([1, 1, 1]), 40),
        new Light(new Float32Array([-6, 4, 6]), new Float32Array([1, 1, 1]), 40),
        new Light(new Float32Array([6, 4, -6]), new Float32Array([1, 1, 1]), 40),
        new Light(new Float32Array([6, 4, 6]), new Float32Array([1, 1, 1]), 40),

        new Light(new Float32Array([-6, -4, -6]), new Float32Array([1, 1, 1]), 40),
        new Light(new Float32Array([-6, -4, 6]), new Float32Array([1, 1, 1]), 40),
        new Light(new Float32Array([6, -4, -6]), new Float32Array([1, 1, 1]), 40),
        new Light(new Float32Array([6, -4, 6]), new Float32Array([1, 1, 1]), 40),
        new Light(new Float32Array([-6, 4, -6]), new Float32Array([1, 1, 1]), 40),
        new Light(new Float32Array([-6, 4, 6]), new Float32Array([1, 1, 1]), 40),
        new Light(new Float32Array([6, 4, -6]), new Float32Array([1, 1, 1]), 40),
        new Light(new Float32Array([6, 4, 6]), new Float32Array([1, 1, 1]), 40),

    ];
    let rota = new THREE.Matrix4().makeRotationY(Math.PI / 4);
    for (let i = 4; i < 12; i++) {
        roomLight[i].position = new Float32Array(new THREE.Vector3(...roomLight[i].position).applyMatrix4(rota).toArray());
    }
    for (let i = 0; i < 1; i++) {
        let unit = [-1, 0, 0];
        let speed = 1;
        for (let j = 0; j < 3; j++)
            unit[j] *= speed;
        roomLight[i].velocity = unit;

        roomLight[i].transform = function (this: Light, time: number) {
            const minBound = [-2, -0.5, -0.5];
            let maxBound = [3, 0.5, 0.5];
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
        }.bind(roomLight[i]);
    }
}
let seaLight = Array<Light>();
{
    seaLight = [
        new Light(new Float32Array([0, 6, 0]), new Float32Array([1, 1, 1]), 30),

        new Light(new Float32Array([0.6, 0.9 + 0.5, 1.3 + 0.5]), new Float32Array([1, 0.2, 0.2]), 1),

        new Light(new Float32Array([3, 0.5, 3]), new Float32Array([1, 0.9, 0.8]), 5),
        new Light(new Float32Array([-3, 0.5, 3]), new Float32Array([0, 1, 0]), 6),
        new Light(new Float32Array([-3, 0.5, -3]), new Float32Array([1, 0.9, 0.8]), 5),
        new Light(new Float32Array([3, 0.5, -3]), new Float32Array([0, 0, 1]), 10),

        new Light(new Float32Array([-18, -4, -12]), new Float32Array([1, 1, 1]), 20),
        new Light(new Float32Array([-18, -4, 12]), new Float32Array([1, 1, 1]), 20),
        new Light(new Float32Array([18, -4, -12]), new Float32Array([1, 1, 1]), 20),
        new Light(new Float32Array([18, -4, 12]), new Float32Array([1, 1, 1]), 20),
        new Light(new Float32Array([-18, 15, -12]), new Float32Array([1, 1, 1]), 20),
        new Light(new Float32Array([-18, 15, 12]), new Float32Array([1, 1, 1]), 20),
        new Light(new Float32Array([18, 15, -12]), new Float32Array([1, 1, 1]), 20),
        new Light(new Float32Array([18, 15, 12]), new Float32Array([1, 1, 1]), 20),
    ];

    // for (let i = 0; i < 16; i++) {
    //     let position = new Float32Array([Math.random() * 4 - 2, 0.1, Math.random() * 4 - 2]);
    //     let color = new Float32Array([Math.random(), Math.random(), Math.random()]);
    //     let intensity = Math.random() * 2 + 2;
    //     seaLight.push(new Light(position, color, intensity));
    // }
    for (let i = 2; i < 6; i++) {
        seaLight[i].transform = function (this: Light, time: number) {
            let theta = Math.atan2(this.position[2], this.position[0]);
            let r = Math.sqrt(this.position[0] * this.position[0] + this.position[2] * this.position[2]);
            theta += time / 1000;
            this.position[0] = Math.cos(theta) * r;
            this.position[2] = Math.sin(theta) * r;
        }.bind(seaLight[i]);
    }

}
let loader = new GLTFLoader().setDRACOLoader(new DRACOLoader().setDecoderPath('./three/draco/'));
LogOnScreen("model downloading...");
let bunny = await loader.loadAsync("./assets/stanford_bunny/bunny.gltf") as any;
bunny = bunny.scene;
bunny.children[0].geometry.rotateX(-Math.PI / 2);
bunny.children[0].geometry.scale(5, 5, 5);

let box = await loader.loadAsync("./assets/box/scene.gltf") as any;
{
    box = box.scene;

    for (let i = 0; i < box.children.length; i++) {
        let child = box.children[i] as THREE.Mesh;
        child.geometry.applyQuaternion(child.quaternion);
        child.geometry.translate(child.position.x, child.position.y, child.position.z);
        // child.geometry.translate(child.position);
        for (let j = 0; j < child.geometry.attributes.tangent.array.length; j += 1) {
            child.geometry.attributes.tangent.array[j] = 0;
        }
        child.geometry.scale(3, 3, 3);
    }

    let boxBunny = bunny.children[0].clone();
    boxBunny.geometry.scale(4, 4, 4);
    boxBunny.geometry.translate(0.5, -0.3, 0);
    box.add(boxBunny);
}
let boxModel = new gltfmodel();
await boxModel.init(box, GPUdevice);
let loadCount = 0;
let judge = (show: string) => {
    if (loadCount < 2) {
        loadCount++
        show += " Wait for downloading other models...";
    } else {
        show += " Enjoy!";
        (gui.children[0] as Controller).enable();
    }
    LogOnScreen(show);
}
let roomModel = new gltfmodel();
loader.load("./assets/room/scene.gltf", (gltf) => {
    let room = gltf.scene;
    room.scale.set(5, 5, 5);
    roomModel.init(room, GPUdevice).then(() => {
        let show = "room building finished!";
        judge(show);
    });
});

let seaModel = new gltfmodel();
loader.load("./assets/sea/scene.gltf", (gltf) => {
    let bath = gltf.scene;
    for (let i = 0; i < bath.children.length; i++) {
        let child = bath.children[i] as THREE.Mesh;
        child.geometry.rotateX(-Math.PI / 2);
        child.geometry.scale(0.02, 0.02, 0.02);
    }
    seaModel.init(bath, GPUdevice).then(() => {
        let show = "sea building finished!";
        judge(show);
    });
});

let sponzaModel = new gltfmodel();
loader.load("./assets/sponza/sponza.gltf", (gltf) => {
    let sponza = gltf.scene;
    let sponzaBunny = bunny.children[0].clone();
    sponzaBunny.geometry.translate(0, 0, -0.5);
    sponzaBunny.geometry.scale(0.5, 0.5, 0.5);
    sponza.add(sponzaBunny);
    sponzaModel.init(sponza, GPUdevice).then(() => {
        let show = "sponza building finished!";
        judge(show);
    });

});

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
    selectModel: sceneName;
    async init() {
        this.device = GPUdevice;
        await this.reset();
        // console.log("my model:", this.model);
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
                this.display.ENABLE_SR = conf.superResolution;
                this.rayTracing.spatialReuseIteration = conf.spatial ? 2 : 0;
                if (this.rayTracing.DI_FLAG != (conf.DI ? 1 : 0)) {
                    this.rayTracing.DI_FLAG = conf.DI ? 1 : 0;
                    await this.rayTracing.init(this.lights);
                }
                if (this.rayTracing.GI_FLAG != (conf.GI ? 1 : 0)) {
                    this.rayTracing.GI_FLAG = conf.GI ? 1 : 0;
                    await this.rayTracing.init(this.lights);
                }
                if (this.rayTracing.RIS_FLAG != (conf.GI_RIS ? 1 : 0)) {
                    this.rayTracing.RIS_FLAG = conf.GI_RIS ? 1 : 0;
                    await this.rayTracing.init(this.lights);
                }
                if (this.rayTracing.TEMPORAL_FLAG != (conf.temporal ? 1 : 0)) {
                    this.rayTracing.TEMPORAL_FLAG = conf.temporal ? 1 : 0;
                    await this.rayTracing.init(this.lights);
                }
                if (conf.upscaleRatio != this.device.upscaleRatio) {
                    const originWidth = Math.floor(this.device.canvas.width / conf.upscaleRatio);
                    const originHeight = Math.floor(this.device.canvas.height / conf.upscaleRatio);
                    if (16 * (4 * originWidth * originWidth) >= this.device.adapter.limits.maxStorageBufferBindingSize) {
                        alert("exceed maxStorageBufferBindingSize, please increase upscaleRatio");
                    } else {
                        this.device.upscaleRatio = conf.upscaleRatio;
                        await this.reset(true);
                    }
                }
                if (conf.scene != this.selectModel) {
                    this.selectModel = conf.scene;
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
    cullMode: GPUCullMode = "none";
    async reset(save_pos: boolean = false) {
        let pos: THREE.Vector3;
        let target: THREE.Vector3;
        if (save_pos) {
            pos = this.camera.camera.position.clone();
            target = this.camera.controls.target.clone();
        }
        this.camera = new CameraManager(this.device);
        if (save_pos) {
            this.camera.camera.position.copy(pos);
            this.camera.controls.target.copy(target);
        }

        switch (conf.scene) {
            case sceneName.sponza:
                {
                    if (!save_pos) {
                        this.camera.camera.position.set(-4.5, 5.5, -4);
                        this.camera.controls.target.set(0, 5, 0);
                        // this.camera.camera.position.set(-4.5, 5, -4);
                        // this.camera.controls.target.set(0, 5, -4);
                    }
                    this.model = sponzaModel;
                    this.lights = new LightManager(sponzaLight, this.device);
                    this.cullMode = "none";
                    break;
                }
            case sceneName.box:
                {
                    if (!save_pos) {
                        this.camera.camera.position.set(-8, 3, 0);
                        this.camera.controls.target.set(0, 3, 0);
                    }
                    this.model = boxModel;
                    this.lights = new LightManager(boxLight, this.device);
                    this.cullMode = "back";
                    break;
                }
            case sceneName.room:
                {
                    if (!save_pos) {
                        this.camera.camera.position.set(3, -0.5, 0);
                        this.camera.controls.target.set(0, -0.5, 0);
                    }
                    this.model = roomModel;
                    this.lights = new LightManager(roomLight, this.device);
                    this.cullMode = "none";
                    break;
                }
            case sceneName.seahouse:
                {
                    if (!save_pos) {
                        this.camera.camera.position.set(-1, 1, -3);
                        this.camera.controls.target.set(0, 1, 0);
                    }
                    this.model = seaModel;
                    this.lights = new LightManager(seaLight, this.device);
                    this.cullMode = "back";
                    break;
                }
        }
        this.camera.controls.update();
        this.buffers = new BufferPool(this.device);
        this.vBuffer = new VBuffer(this.device, this.model, this.camera, this.buffers);
        await this.vBuffer.init(this.cullMode);

        this.rayTracing = new rayTracing(this.device, this.model, this.camera, this.buffers);
        this.rayTracing.DI_FLAG = conf.DI ? 1 : 0;
        this.rayTracing.GI_FLAG = conf.GI ? 1 : 0;
        this.rayTracing.RIS_FLAG = conf.GI_RIS ? 1 : 0;
        this.rayTracing.TEMPORAL_FLAG = conf.temporal ? 1 : 0;
        this.rayTracing.spatialReuseIteration = conf.spatial ? 2 : 0;
        this.rayTracing.dynamicLight = conf.dynamicLight;

        await this.rayTracing.init(this.lights);

        this.denoiser = new Denoiser(this.device, this.buffers, this.camera);
        this.denoiser.ENABLE_DENOISE = conf.denoiser;
        await this.denoiser.init();

        this.display = new Display(this.device, this.buffers, this.camera);
        this.display.ENABLE_SR = conf.superResolution;
    }
}

const app = new Application();
await app.init();
app.run();