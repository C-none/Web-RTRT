import { gltfmodel } from "./gltf";
import { webGPUDevice } from "./device";
import { CameraManager } from "./camera";
import { BufferPool } from "./screenBuffer";
import { shaders } from "./shaders/manager";

class rayTracing {
    device: webGPUDevice;
    model: gltfmodel;
    camera: CameraManager;
    lightCount: number = 2;
    spatialReuseIteration: number = 2;
    GI_FLAG: number = 1;

    vBuffer: GPUTexture;
    gBufferTex: GPUBuffer;
    gBufferAttri: GPUBuffer;
    previousGBufferAttri: GPUBuffer;
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
        this.gBufferTex = buffers.gBufferTex;
        this.gBufferAttri = buffers.gBufferAttri;
        this.previousGBufferAttri = buffers.previousGBufferAttri;
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
    lightPosition = Array<Float32Array>(this.lightCount);
    lightVelocity = Array<Array<number>>(this.lightCount);
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
        lights[0] = new light(new Float32Array([0, 8, 0]), new Float32Array([1, 1, 0]), 40, 0);
        lights[1] = new light(new Float32Array([-4, 5, 0]), new Float32Array([0, 1, 1]), 30, 1);
        // generate light in grid
        // for (let i = 0; i < cnt; i++) {
        //     // let x = (i % dimension) / dimension * 12 - 6;
        //     // let y = 5;
        //     // let z = Math.floor(i / dimension) / dimension * 12 - 6;
        //     // // generate color correlated to the position randomly
        //     // let r = Math.abs(x) / 6;
        //     // let g = 0.5;
        //     // let b = Math.abs(z) / 6;
        //     let x = Math.random() * 12 - 6;
        //     let y = Math.random() * 8;
        //     let z = Math.random() * 12 - 6;
        //     let r = Math.random() * 0.7 + 0.3;
        //     let g = Math.random() * 0.7 + 0.3;
        //     let b = Math.random() * 0.7 + 0.3;
        //     let intensity = Math.random() * 4 + 8;
        //     lights[i] = new light(new Float32Array([x, y, z]), new Float32Array([r, g, b]), intensity, i);
        // }

        this.lightBuffer = this.device.device.createBuffer({
            label: 'light buffer',
            size: 4 * (4 + cnt * (8)), // 1 for light count, 8 for each light
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
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
            this.lightPosition[i] = lights[i].position;
            let color = Math.round(lights[i].color[0] * 255) << 0 | Math.round(lights[i].color[1] * 255) << 8 | Math.round(lights[i].color[2] * 255) << 16;
            UintArray[bias + 3] = color;
            FloatArray[bias + 4] = lights[i].prob;
            UintArray[bias + 5] = lights[i].alias;
            FloatArray[bias + 6] = lights[i].intensity;
        }
        this.lightBuffer.unmap();
        for (let i = 0; i < lights.length; i++) {
            // generate 3d vector on sphere uniformly
            let theta = 2 * Math.PI * Math.random();
            let phi = Math.acos(2 * Math.random() - 1);
            let unit = [Math.sin(phi) * Math.cos(theta), Math.sin(phi) * Math.sin(theta), Math.cos(phi)];
            let speed = (Math.random() + 1);
            for (let i = 0; i < 3; i++)
                unit[i] *= speed;
            this.lightVelocity[i] = unit;
        }
    }
    private buildBindGroupLayout() {
        this.bindGroupLayoutInit = this.device.device.createBindGroupLayout({
            label: 'rayTracingInit',
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
                {// gBufferTex
                    binding: 9,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'storage', },
                },
                {// gBufferAttri
                    binding: 10,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'storage', },
                },
                {// previous gBufferAttri
                    binding: 11,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'read-only-storage', },
                }
            ]
        });
        this.bindGroupLayoutAccelerationStructure = this.device.device.createBindGroupLayout({
            label: 'rayTracingAccelerationStructure',
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
            label: 'rayTracingReservoir',
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
            label: 'rayTracingLight',
            entries: [
                {// light buffer
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'uniform', },
                },
            ]
        });
        this.bindGroupLayoutReuse = this.device.device.createBindGroupLayout({
            label: 'rayTracingSpatialReuse',
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
                {// gBufferTex
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'read-only-storage', },
                },
                {// reservoir buffer
                    binding: 3,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'read-only-storage', },
                }
            ]
        });
        this.bindGroupLayoutAccumulate = this.device.device.createBindGroupLayout({
            label: 'rayTracingAccumulate',
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
                {// gBufferTex
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'read-only-storage', },
                },
                {// gBufferAttri
                    binding: 3,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'read-only-storage', },
                }
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
            code: shaders.get("spatialReuse.wgsl").replace(/LIGHT_COUNT/g, this.lightCount.toString()),
        });
        const accumulateModule = this.device.device.createShaderModule({
            label: 'accumulate.wgsl',
            code: shaders.get("accumulate.wgsl").replace(/TREE_DEPTH/g, this.model.bvhMaxDepth.toString()).replace(/LIGHT_COUNT/g, this.lightCount.toString()),
        });
        this.pipelineInit = await this.device.device.createComputePipelineAsync({
            layout: this.device.device.createPipelineLayout({
                bindGroupLayouts: [this.bindGroupLayoutInit, this.bindGroupLayoutReservoir, this.bindGroupLayoutLight, this.bindGroupLayoutAccelerationStructure],
            }),
            compute: {
                module: sampleInitModule,
                entryPoint: 'main',
                constants: {
                    halfConeAngle: this.camera.camera.fov * Math.PI / 180 / (this.device.canvas.height / this.device.upscaleRatio * 2),
                    ENABLE_GI: this.GI_FLAG,
                }
            }
        });
        this.pipelineReuse = await this.device.device.createComputePipelineAsync({
            layout: this.device.device.createPipelineLayout({
                bindGroupLayouts: [this.bindGroupLayoutReuse, this.bindGroupLayoutReservoir, this.bindGroupLayoutLight],
            }),
            compute: {
                module: spatialReuseModule,
                entryPoint: 'main',
                constants: { ENABLE_GI: this.GI_FLAG, }
            },
        });
        this.pipelineAccumulate = await this.device.device.createComputePipelineAsync({
            layout: this.device.device.createPipelineLayout({
                bindGroupLayouts: [this.bindGroupLayoutAccumulate, this.bindGroupLayoutReservoir, this.bindGroupLayoutLight, this.bindGroupLayoutAccelerationStructure,],
            }),
            compute: {
                module: accumulateModule,
                entryPoint: 'main',
                constants: { ENABLE_GI: this.GI_FLAG, }
            }
        });
    }
    private buildBindGroup() {
        this.bindingGroupInit = this.device.device.createBindGroup({
            label: 'rayTracingInit',
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
                {// gBufferTex
                    binding: 9,
                    resource: { buffer: this.gBufferTex, },
                },
                {// gBufferAttri
                    binding: 10,
                    resource: { buffer: this.gBufferAttri, },
                },
                {// previous gBufferAttri
                    binding: 11,
                    resource: { buffer: this.previousGBufferAttri, },
                }
            ]
        });
        this.bindingGroupAccelerationStructure = this.device.device.createBindGroup({
            label: 'rayTracingAccelerationStructure',
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
            label: 'rayTracingReservoir',
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
            label: 'rayTracingLight',
            layout: this.bindGroupLayoutLight,
            entries: [
                {// light buffer
                    binding: 0,
                    resource: { buffer: this.lightBuffer, },
                },
            ]
        });
        this.bindingGroupReuse = this.device.device.createBindGroup({
            label: 'rayTracingSpatialReuse',
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
                {// gBufferTex
                    binding: 2,
                    resource: { buffer: this.gBufferTex, },
                },
                {// gBufferAttri
                    binding: 3,
                    resource: { buffer: this.gBufferAttri, },
                }
            ]
        });
        this.bindingGroupReservoirInverse = this.device.device.createBindGroup({
            label: 'rayTracingReservoirInverse',
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
        this.bindingGroupAccumulate = this.device.device.createBindGroup({
            label: 'rayTracingAccumulate',
            layout: this.bindGroupLayoutAccumulate,
            entries: [
                {// output texture
                    binding: 0,
                    resource: this.outputTexture.createView(),
                },
                {// uniform buffer
                    binding: 1,
                    resource: { buffer: this.uniformBuffer, },
                },
                {// gBufferTex
                    binding: 2,
                    resource: { buffer: this.gBufferTex, },
                },
                {// gBufferAttri
                    binding: 3,
                    resource: { buffer: this.gBufferAttri, },
                }
            ]
        });
    }
    async init() {
        this.prepareLights();
        this.buildBindGroupLayout();
        await this.buildPipeline();
        this.buildBindGroup();
    }
    uboBuffer = new ArrayBuffer(4 * 4);
    updateUBO() {
        let uboUint = new Uint32Array(this.uboBuffer);
        let uboFloat = new Float32Array(this.uboBuffer);
        uboUint[3] = Math.floor(Math.random() * 0x100000000);
        uboFloat.set(this.camera.camera.position.toArray(), 0);
        this.device.device.queue.writeBuffer(this.uniformBuffer, 0, this.uboBuffer);
        // update light position
        const minBound = [-6, 2, -1];
        const maxBound = [6, 8, 1];
        const center = [0, 5, 0];
        for (let i = 0; i < this.lightCount; i++) {
            for (let j = 0; j < 3; j++) {
                if (this.lightPosition[i][j] < minBound[j] || this.lightPosition[i][j] > maxBound[j]) {
                    this.lightVelocity[i][j] = -this.lightVelocity[i][j];
                }
                // this.lightPosition[i][j] += this.lightVelocity[i][j] * 0.015 - (this.lightPosition[i][j] - center[j]) * 0.0015;
                this.lightPosition[i][j] += this.lightVelocity[i][j] * 0.01;
            }
            // write light position
            this.device.device.queue.writeBuffer(this.lightBuffer, 4 * (4 + 8 * i), this.lightPosition[i]);
        }
    }

    async record(commandEncoder: GPUCommandEncoder) {
        this.updateUBO();

        const sampleInitEncoder = commandEncoder.beginComputePass();
        sampleInitEncoder.setPipeline(this.pipelineInit);
        sampleInitEncoder.setBindGroup(0, this.bindingGroupInit);
        sampleInitEncoder.setBindGroup(1, this.bindingGroupReservoir);
        sampleInitEncoder.setBindGroup(2, this.bindingGroupLight);
        sampleInitEncoder.setBindGroup(3, this.bindingGroupAccelerationStructure);
        sampleInitEncoder.dispatchWorkgroups(Math.ceil(this.outputTexture.width / 8), Math.ceil(this.outputTexture.height / 8), 1);
        sampleInitEncoder.end();

        for (let i = 0; i < this.spatialReuseIteration; i++) {
            const spatialReuseEncoder = commandEncoder.beginComputePass();
            spatialReuseEncoder.setPipeline(this.pipelineReuse);
            spatialReuseEncoder.setBindGroup(0, this.bindingGroupReuse);
            spatialReuseEncoder.setBindGroup(1, i % 2 == 0 ? this.bindingGroupReservoirInverse : this.bindingGroupReservoir);
            spatialReuseEncoder.setBindGroup(2, this.bindingGroupLight);
            spatialReuseEncoder.dispatchWorkgroups(Math.ceil(this.outputTexture.width / 8), Math.ceil(this.outputTexture.height / 8), 1);
            spatialReuseEncoder.end();
        }

        const accumulateEncoder = commandEncoder.beginComputePass();
        accumulateEncoder.setPipeline(this.pipelineAccumulate);
        accumulateEncoder.setBindGroup(0, this.bindingGroupAccumulate);
        accumulateEncoder.setBindGroup(1, this.spatialReuseIteration % 2 == 0 ? this.bindingGroupReservoirInverse : this.bindingGroupReservoir);
        accumulateEncoder.setBindGroup(2, this.bindingGroupLight);
        accumulateEncoder.setBindGroup(3, this.bindingGroupAccelerationStructure);
        accumulateEncoder.dispatchWorkgroups(Math.ceil(this.outputTexture.width / 8), Math.ceil(this.outputTexture.height / 8), 1);
        accumulateEncoder.end();

        if (this.spatialReuseIteration % 2 == 0) {
            let originWidth = Math.floor(this.device.canvas.width / this.device.upscaleRatio);
            let originHeight = Math.floor(this.device.canvas.height / this.device.upscaleRatio);

            commandEncoder.copyBufferToBuffer(this.currentReservoir, 0, this.previousReservoir, 0, 16 * 4 * originWidth * originHeight);
        }
    }
}

export { rayTracing };