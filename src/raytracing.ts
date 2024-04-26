import { gltfmodel } from "./gltf";
import { webGPUDevice } from "./device";
import { CameraManager } from "./camera";
import { BufferPool } from "./screenBuffer";
import { shaders } from "./shaders/manager";
import { arrayBuffer } from "stream/consumers";

class rayTracing {
    device: webGPUDevice;
    model: gltfmodel;
    camera: CameraManager;
    lightCount: number = 256;

    vBuffer: GPUTexture;
    gBuffer: GPUBuffer;
    outputTexture: GPUTexture;
    uniformBuffer: GPUBuffer;
    lightBuffer: GPUBuffer;
    sampler: GPUSampler;

    currentReservoir: GPUBuffer;
    previousReservoir: GPUBuffer;

    bindGroupLayoutInit: GPUBindGroupLayout;
    bindingGroupInit: GPUBindGroup;

    bindGroupLayoutReuse: GPUBindGroupLayout;
    bindingGroupReuse: GPUBindGroup;

    bindGroupLayoutAccumulate: GPUBindGroupLayout;
    bindingGroupAccumulate: GPUBindGroup;

    bindGroupLayoutAccelerationStructure: GPUBindGroupLayout;
    bindingGroupAccelerationStructure: GPUBindGroup;

    bindGroupLayoutReservoir: GPUBindGroupLayout;
    bindingGroupReservoir: GPUBindGroup;
    bindingGroupReservoirInverse: GPUBindGroup;

    bindGroupLayoutLight: GPUBindGroupLayout;
    bindingGroupLight: GPUBindGroup;

    pipelineInit: GPUComputePipeline;
    pipelineReuse: GPUComputePipeline;
    pipelineAccumulate: GPUComputePipeline;

    constructor(device: webGPUDevice, model: gltfmodel, cameraManager: CameraManager, buffers: BufferPool) {
        this.device = device;
        this.model = model;
        this.camera = cameraManager;
        this.vBuffer = buffers.vBuffer;
        this.gBuffer = buffers.gBuffer;
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
            size: 4 * 4,// random seed(u32), origin.xyz(f32)
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        this.currentReservoir = buffers.currentReservoir;
        this.previousReservoir = buffers.previousReservoir;
    }
    private prepareLights() {
        let cnt = this.lightCount;
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
        const dimension = Math.sqrt(cnt);
        // lights[0] = new light(new Float32Array([0, 5, 0]), new Float32Array([1, 1, 1]), 40, 0);
        // lights[1] = new light(new Float32Array([-4, 5, 0]), new Float32Array([0, 1, 1]), 40, 1);
        // generate light in grid
        for (let i = 0; i < cnt; i++) {
            // let x = (i % dimension) / dimension * 12 - 6;
            // let y = 5;
            // let z = Math.floor(i / dimension) / dimension * 12 - 6;
            let x = Math.random() * 12 - 6;
            let y = Math.random() * 8;
            let z = Math.random() * 12 - 6;
            let r = Math.random() * 0.7 + 0.3;
            let g = Math.random() * 0.7 + 0.3;
            let b = Math.random() * 0.7 + 0.3;
            // generate color correlated to the position randomly
            // let r = Math.abs(x) / 6;
            // let g = 0.5;
            // let b = Math.abs(z) / 6;
            let intensity = Math.random() * 1 + 2;
            lights[i] = new light(new Float32Array([x, y, z]), new Float32Array([r, g, b]), intensity, i);
        }

        this.lightBuffer = this.device.device.createBuffer({
            label: 'light buffer',
            size: 4 * (4 + cnt * (8)), // 1 for light count, 8 for each light
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.UNIFORM,
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
            return sumIntensity;
        };
        let sumIntensity = initAliasTable(lights);
        let ArrayBuffer = this.lightBuffer.getMappedRange();
        let UintArray = new Uint32Array(ArrayBuffer);
        let FloatArray = new Float32Array(ArrayBuffer);
        UintArray[0] = lights.length;
        FloatArray[1] = sumIntensity;
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
        this.bindGroupLayoutInit = this.device.device.createBindGroupLayout({
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
                {// geometry buffer
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'read-only-storage', },
                },
                {// albedo map
                    binding: 3,
                    visibility: GPUShaderStage.COMPUTE,
                    texture: { sampleType: "float", viewDimension: "2d-array", }
                },
                {// normal map
                    binding: 4,
                    visibility: GPUShaderStage.COMPUTE,
                    texture: { sampleType: "float", viewDimension: "2d-array", }
                },
                {// specularRoughness map
                    binding: 5,
                    visibility: GPUShaderStage.COMPUTE,
                    texture: { sampleType: "float", viewDimension: "2d-array", }
                },
                {// visibility buffer
                    binding: 6,
                    visibility: GPUShaderStage.COMPUTE,
                    texture: { sampleType: 'uint', },
                },
                {// sampler
                    binding: 7,
                    visibility: GPUShaderStage.COMPUTE,
                    sampler: { type: 'filtering', },
                },
                {// uniform buffer
                    binding: 8,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'uniform', },
                },
                {// gBuffer
                    binding: 9,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'storage', },
                }
            ]
        });
        this.bindGroupLayoutAccelerationStructure = this.device.device.createBindGroupLayout({
            entries: [
                {// BVH buffer
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'read-only-storage', },
                },
                {// vertex buffer
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'read-only-storage', },
                },
                {// index buffer
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'read-only-storage', },
                },
            ]
        });
        this.bindGroupLayoutReservoir = this.device.device.createBindGroupLayout({
            entries: [
                {// current reservoir
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'storage', },
                },
                {// previous reservoir
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'read-only-storage', },
                },
            ]
        });
        this.bindGroupLayoutLight = this.device.device.createBindGroupLayout({
            entries: [
                {// light buffer
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'uniform', },
                },]
        });
        this.bindGroupLayoutReuse = this.device.device.createBindGroupLayout({
            entries: [
                {// output texture
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    storageTexture: { access: 'write-only', format: this.outputTexture.format, },
                },
                {// uniform buffer
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'uniform', },
                },
                {// gBuffer
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'read-only-storage', },
                }
            ]
        });
        this.bindGroupLayoutAccumulate = this.device.device.createBindGroupLayout({
            entries: [
                {// output texture
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    storageTexture: { access: 'write-only', format: this.outputTexture.format, },
                },
                {// uniform buffer
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'uniform', },
                },
                {// gBuffer
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'read-only-storage', },
                }
            ]
        });
    }
    private buildBindGroup() {
        this.bindingGroupInit = this.device.device.createBindGroup({
            layout: this.bindGroupLayoutInit,
            entries: [
                {// output texture
                    binding: 0,
                    resource: this.outputTexture.createView(),
                },
                {// camera buffer
                    binding: 1,
                    resource: { buffer: this.camera.cameraBuffer, },
                },
                {// geometry buffer
                    binding: 2,
                    resource: { buffer: this.model.geometryBuffer, },
                },
                {// albedo map
                    binding: 3,
                    resource: this.model.albedo.texture.createView(
                        {
                            dimension: '2d-array',
                            baseArrayLayer: 0,
                            arrayLayerCount: Math.max(this.model.albedo.Storages.length, 1),
                        }
                    ),
                },
                {// normal map
                    binding: 4,
                    resource: this.model.normalMap.texture.createView(
                        {
                            dimension: '2d-array',
                            baseArrayLayer: 0,
                            arrayLayerCount: Math.max(this.model.normalMap.Storages.length, 1),
                        }
                    ),
                },
                {// specularRoughness map
                    binding: 5,
                    resource: this.model.specularRoughnessMap.texture.createView(
                        {
                            dimension: '2d-array',
                            baseArrayLayer: 0,
                            arrayLayerCount: Math.max(this.model.specularRoughnessMap.Storages.length, 1),
                        }
                    ),
                },
                {// visibility buffer
                    binding: 6,
                    resource: this.vBuffer.createView(),
                },
                {// sampler
                    binding: 7,
                    resource: this.sampler,
                },
                {// uniform buffer
                    binding: 8,
                    resource: { buffer: this.uniformBuffer, },
                },
                {// gBuffer
                    binding: 9,
                    resource: { buffer: this.gBuffer, },
                }
            ]
        });
        this.bindingGroupAccelerationStructure = this.device.device.createBindGroup({
            layout: this.bindGroupLayoutAccelerationStructure,
            entries: [
                {// BVH buffer
                    binding: 0,
                    resource: { buffer: this.model.bvhBuffer, },
                },
                {// vertex buffer
                    binding: 1,
                    resource: { buffer: this.model.vertexBuffer, },
                },
                {// index buffer
                    binding: 2,
                    resource: { buffer: this.model.indexBuffer, },
                },
            ]
        });
        this.bindingGroupReservoir = this.device.device.createBindGroup({
            layout: this.bindGroupLayoutReservoir,
            entries: [
                {// current reservoir
                    binding: 0,
                    resource: { buffer: this.currentReservoir, },
                },
                {// previous reservoir
                    binding: 1,
                    resource: { buffer: this.previousReservoir, },
                },
            ]
        });
        this.bindingGroupLight = this.device.device.createBindGroup({
            layout: this.bindGroupLayoutLight,
            entries: [
                {// light buffer
                    binding: 0,
                    resource: { buffer: this.lightBuffer, },
                },
            ]
        });
        this.bindingGroupReuse = this.device.device.createBindGroup({
            layout: this.bindGroupLayoutReuse,
            entries: [
                {// output texture
                    binding: 0,
                    resource: this.outputTexture.createView(),
                },
                {// uniform buffer
                    binding: 1,
                    resource: { buffer: this.uniformBuffer, },
                },
                {// gBuffer
                    binding: 2,
                    resource: { buffer: this.gBuffer, },
                }
            ]
        });
        this.bindingGroupReservoirInverse = this.device.device.createBindGroup({
            layout: this.bindGroupLayoutReservoir,
            entries: [
                {// current reservoir
                    binding: 0,
                    resource: { buffer: this.previousReservoir, },
                },
                {// previous reservoir
                    binding: 1,
                    resource: { buffer: this.currentReservoir, },
                },
            ]
        });
    }
    private async buildPipeline() {
        const sampleInitModule = this.device.device.createShaderModule({
            label: 'rayGen.wgsl',
            code: shaders.get("rayGen.wgsl").replace(/TREE_DEPTH/g, this.model.bvhMaxDepth.toString()).replace(/LIGHT_COUNT/g, this.lightCount.toString()),
        });
        const spatialReuseModule = this.device.device.createShaderModule({
            label: 'spatialReuse.wgsl',
            code: shaders.get("spatialReuse.wgsl").replace(/TREE_DEPTH/g, this.model.bvhMaxDepth.toString()).replace(/LIGHT_COUNT/g, this.lightCount.toString()),
        });
        const accumulateModule = this.device.device.createShaderModule({
            label: 'accumulate.wgsl',
            code: shaders.get("accumulate.wgsl").replace(/TREE_DEPTH/g, this.model.bvhMaxDepth.toString()).replace(/LIGHT_COUNT/g, this.lightCount.toString()),
        });
        this.pipelineInit = await this.device.device.createComputePipelineAsync({
            layout: this.device.device.createPipelineLayout({
                bindGroupLayouts: [this.bindGroupLayoutInit, this.bindGroupLayoutAccelerationStructure, this.bindGroupLayoutReservoir, this.bindGroupLayoutLight],
            }),
            compute: {
                module: sampleInitModule,
                entryPoint: 'main',
                constants: {
                    halfConeAngle: this.camera.camera.fov * Math.PI / 180 / (this.device.canvas.height / this.device.upscaleRatio * 2),
                }
            }
        });
        this.pipelineReuse = await this.device.device.createComputePipelineAsync({
            layout: this.device.device.createPipelineLayout({
                bindGroupLayouts: [this.bindGroupLayoutReuse, this.bindGroupLayoutAccelerationStructure, this.bindGroupLayoutReservoir, this.bindGroupLayoutLight],
            }),
            compute: {
                module: spatialReuseModule,
                entryPoint: 'main',
            }
        });
        this.pipelineAccumulate = await this.device.device.createComputePipelineAsync({
            layout: this.device.device.createPipelineLayout({
                bindGroupLayouts: [this.bindGroupLayoutInit, this.bindGroupLayoutAccelerationStructure, this.bindGroupLayoutReservoir, this.bindGroupLayoutLight],
            }),
            compute: {
                module: accumulateModule,
                entryPoint: 'main',
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
        let uboBuffer = new ArrayBuffer(4 * 4);
        let uboUint = new Uint32Array(uboBuffer);
        let uboFloat = new Float32Array(uboBuffer);
        uboUint[3] = Math.floor(Math.random() * 0x100000000);
        uboFloat.set(this.camera.camera.position.toArray(), 0);
        this.device.device.queue.writeBuffer(this.uniformBuffer, 0, uboBuffer);
    }
    async record(commandEncoder: GPUCommandEncoder) {
        this.updateUBO();

        const sampleInitEncoder = commandEncoder.beginComputePass();
        sampleInitEncoder.setPipeline(this.pipelineInit);
        sampleInitEncoder.setBindGroup(0, this.bindingGroupInit);
        sampleInitEncoder.setBindGroup(1, this.bindingGroupAccelerationStructure);
        sampleInitEncoder.setBindGroup(2, this.bindingGroupReservoir);
        sampleInitEncoder.setBindGroup(3, this.bindingGroupLight);
        sampleInitEncoder.dispatchWorkgroups(Math.ceil(this.outputTexture.width / 8), Math.ceil(this.outputTexture.height / 8), 1);
        sampleInitEncoder.end();

        const spatialReuseEncoder = commandEncoder.beginComputePass();
        spatialReuseEncoder.setPipeline(this.pipelineReuse);
        spatialReuseEncoder.setBindGroup(0, this.bindingGroupReuse);
        spatialReuseEncoder.setBindGroup(1, this.bindingGroupAccelerationStructure);
        spatialReuseEncoder.setBindGroup(2, this.bindingGroupReservoirInverse);
        spatialReuseEncoder.setBindGroup(3, this.bindingGroupLight);
        spatialReuseEncoder.dispatchWorkgroups(Math.ceil(this.outputTexture.width / 8), Math.ceil(this.outputTexture.height / 8), 1);
        spatialReuseEncoder.end();
    }
}

export { rayTracing };