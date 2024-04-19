import { gltfmodel } from "./gltf";
import { webGPUDevice } from "./device";
import { CameraManager } from "./camera";
import { BufferPool } from "./screenBuffer";
import { shaders } from "./shaders/manager";

class rayTracing {
    device: webGPUDevice;
    model: gltfmodel;
    camera: CameraManager;

    vBuffer: GPUTexture;
    outputTexture: GPUTexture;
    uniformBuffer: GPUBuffer;
    lightBuffer: GPUBuffer;
    sampler: GPUSampler;

    bindGroupLayout: GPUBindGroupLayout;
    bindingGroup: GPUBindGroup;
    pipeline: GPUComputePipeline;



    constructor(device: webGPUDevice, model: gltfmodel, cameraManager: CameraManager, buffers: BufferPool) {
        this.device = device;
        this.model = model;
        this.camera = cameraManager;
        this.vBuffer = buffers.vBuffer;
        this.outputTexture = buffers.currentFrameBuffer;
        this.sampler = this.device.device.createSampler({
            addressModeU: "mirror-repeat",
            addressModeV: "mirror-repeat",
            magFilter: "linear",
            minFilter: "linear",
            mipmapFilter: "linear",
            // maxAnisotropy: 16,
        });
        this.uniformBuffer = this.device.device.createBuffer({
            size: 1 * 4,// random seed(u32)
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

    }
    private prepareLights(cnt: number = 1) {
        class light {
            position: Float32Array;
            color: Float32Array;
            intensity: number;
            prob: number;
            alias: number;
            constructor(position: Float32Array, color: Float32Array, intensity: number, index: number) {
                this.position = position;
                this.color = color;
                this.intensity = intensity;
                this.prob = 1;
                this.alias = index;
            }
        };
        let lights = Array<light>(cnt);
        lights[0] = new light(new Float32Array([0, 5, 0]), new Float32Array([1, 1, 1]), 40, 0);
        // lights[1] = new light(new Float32Array([-4, 5, 0]), new Float32Array([0, 1, 1]), 40, 1);
        // generate light in grid
        // for (let i = 0; i < cnt; i++) {
        //     let x = (i % 16 - 8) * 1.5;
        //     let y = 5;
        //     let z = (Math.floor(i / 16) - 8) * 1.5;
        //     // let x = Math.random() * 12 - 6;
        //     // let y = Math.random() * 8;
        //     // let z = Math.random() * 12 - 6;
        //     let r = Math.random();
        //     let g = Math.random();
        //     let b = Math.random();
        //     let intensity = Math.random() * 50 + 800;
        //     lights[i] = new light(new Float32Array([x, y, z]), new Float32Array([r, g, b]), intensity, i);
        // }

        this.lightBuffer = this.device.device.createBuffer({
            label: 'light buffer',
            size: 4 * (4 + cnt * (8)), // 1 for light count, 8 for each light
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true,
        });
        // Vose's Alias Method
        function initAliasTable(lights: Array<light>) {
            let sumIntensity = 0;
            lights.forEach(light => { sumIntensity += light.intensity; });
            let averageIntensity = sumIntensity / lights.length;
            let smallLights = Array<light>();
            let largeLights = Array<light>();
            lights.forEach(light => {
                light.prob = light.intensity / averageIntensity;
                if (light.prob < 1) smallLights.push(light);
                else largeLights.push(light);
            });
            while (smallLights.length > 0 && largeLights.length > 0) {
                let small = smallLights.pop();
                let large = largeLights.pop();
                small.alias = large.alias;
                large.prob += small.prob - 1;
                if (large.prob < 1) smallLights.push(large);
                else largeLights.push(large);
            }
            while (largeLights.length > 0) {
                let large = largeLights.pop();
                large.prob = 1;
            }
            while (smallLights.length > 0) {
                let small = smallLights.pop();
                small.prob = 1;
            }
        };
        initAliasTable(lights);
        let ArrayBuffer = this.lightBuffer.getMappedRange();
        let UintArray = new Uint32Array(ArrayBuffer);
        let FloatArray = new Float32Array(ArrayBuffer);
        UintArray[0] = lights.length;
        for (let i = 0; i < lights.length; i++) {
            let bias = 4 + 8 * i;
            FloatArray.set(lights[i].position, bias);
            let color = Math.round(lights[i].color[0] * 255) << 0 | Math.round(lights[i].color[1] * 255) << 8 | Math.round(lights[i].color[2] * 255) << 16;
            UintArray[bias + 3] = color;
            FloatArray[bias + 4] = lights[i].prob;
            UintArray[bias + 5] = lights[i].alias;
            FloatArray[bias + 6] = lights[i].intensity;
        }
        this.lightBuffer.unmap();
    }
    private buildBindGroupLayout() {
        this.bindGroupLayout = this.device.device.createBindGroupLayout({
            entries: [
                {// output texture
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    storageTexture: { access: 'write-only', format: this.outputTexture.format, },
                },
                {// camera buffer
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'uniform', },
                },
                {// BVH buffer
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'read-only-storage', },
                },
                {// vertex buffer
                    binding: 3,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'read-only-storage', },
                },
                {// index buffer
                    binding: 4,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'read-only-storage', },
                },
                {// geometry buffer
                    binding: 5,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'read-only-storage', },
                },
                {// albedo map
                    binding: 6,
                    visibility: GPUShaderStage.COMPUTE,
                    texture: { sampleType: "float", viewDimension: "2d-array", }
                },
                {// normal map
                    binding: 7,
                    visibility: GPUShaderStage.COMPUTE,
                    texture: { sampleType: "float", viewDimension: "2d-array", }
                },
                {// specularRoughness map
                    binding: 8,
                    visibility: GPUShaderStage.COMPUTE,
                    texture: { sampleType: "float", viewDimension: "2d-array", }
                },
                {// visibility buffer
                    binding: 9,
                    visibility: GPUShaderStage.COMPUTE,
                    texture: { sampleType: 'uint', viewDimension: "2d", },
                },
                {// sampler
                    binding: 10,
                    visibility: GPUShaderStage.COMPUTE,
                    sampler: { type: 'filtering', },
                },
                {// uniform buffer
                    binding: 11,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'uniform', },
                },
                {// light buffer
                    binding: 12,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'read-only-storage', },
                }
            ]
        });
    }
    private buildBindGroup() {
        this.bindingGroup = this.device.device.createBindGroup({
            layout: this.bindGroupLayout,
            entries: [
                {// output texture
                    binding: 0,
                    resource: this.outputTexture.createView(),
                },
                {// camera buffer
                    binding: 1,
                    resource: { buffer: this.camera.cameraBuffer, },
                },
                {// BVH buffer
                    binding: 2,
                    resource: { buffer: this.model.bvhBuffer, },
                },
                {// vertex buffer
                    binding: 3,
                    resource: { buffer: this.model.vertexBuffer, },
                },
                {// index buffer
                    binding: 4,
                    resource: { buffer: this.model.indexBuffer, },
                },
                {// geometry buffer
                    binding: 5,
                    resource: { buffer: this.model.geometryBuffer, },
                },
                {// albedo map
                    binding: 6,
                    resource: this.model.albedo.texture.createView(
                        {
                            dimension: '2d-array',
                            baseArrayLayer: 0,
                            arrayLayerCount: Math.max(this.model.albedo.Storages.length, 1),
                        }
                    ),
                },
                {// normal map
                    binding: 7,
                    resource: this.model.normalMap.texture.createView(
                        {
                            dimension: '2d-array',
                            baseArrayLayer: 0,
                            arrayLayerCount: Math.max(this.model.normalMap.Storages.length, 1),
                        }
                    ),
                },
                {// specularRoughness map
                    binding: 8,
                    resource: this.model.specularRoughnessMap.texture.createView(
                        {
                            dimension: '2d-array',
                            baseArrayLayer: 0,
                            arrayLayerCount: Math.max(this.model.specularRoughnessMap.Storages.length, 1),
                        }
                    ),
                },
                {// visibility buffer
                    binding: 9,
                    resource: this.vBuffer.createView(),
                },
                {// sampler
                    binding: 10,
                    resource: this.sampler,
                },
                {// uniform buffer
                    binding: 11,
                    resource: { buffer: this.uniformBuffer, },
                },
                {// light buffer
                    binding: 12,
                    resource: { buffer: this.lightBuffer, },
                }
            ]
        });
    }
    private async buildPipeline() {
        const computeShaderModule = this.device.device.createShaderModule({
            label: 'rayGen.wgsl',
            code: shaders.get("rayGen.wgsl").replace(/TREE_DEPTH/g, this.model.bvhMaxDepth.toString() + 'u'),
        });

        this.pipeline = await this.device.device.createComputePipelineAsync({
            layout: this.device.device.createPipelineLayout({
                bindGroupLayouts: [this.bindGroupLayout],
            }),
            compute: {
                module: computeShaderModule,
                entryPoint: 'main',
                constants: {
                    halfConeAngle: this.camera.camera.fov * Math.PI / 180 / (this.device.canvas.height / this.device.upscaleRatio * 2),
                }
            }
        });
    }
    async init() {
        this.prepareLights();
        this.buildBindGroupLayout();
        this.buildBindGroup();
        await this.buildPipeline();
    }
    updateUBO() {
        let uboArray = new Uint32Array([Math.floor(Math.random() * 0x100000000)]);
        this.device.device.queue.writeBuffer(this.uniformBuffer, 0, uboArray.buffer);
    }
    async record(commandEncoder: GPUCommandEncoder) {
        this.updateUBO();
        const passEncoder = commandEncoder.beginComputePass();
        passEncoder.setPipeline(this.pipeline);
        passEncoder.setBindGroup(0, this.bindingGroup);
        passEncoder.dispatchWorkgroups(Math.ceil(this.outputTexture.width / 8), Math.ceil(this.outputTexture.height / 8), 1);
        passEncoder.end();
    }
}

export { rayTracing };