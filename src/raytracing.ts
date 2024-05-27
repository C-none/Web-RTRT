import { gltfmodel } from "./gltf";
import { webGPUDevice } from "./device";
import { CameraManager } from "./camera";
import { BufferPool } from "./screenBuffer";
import { LightManager } from "./light";
import { shaders } from "./shaders/manager";

class rayTracing {
    device: webGPUDevice;
    model: gltfmodel;
    camera: CameraManager;
    lights: LightManager;
    spatialReuseIteration: number = 2;
    DI_FLAG: number = 1;
    GI_FLAG: number = 0;
    RIS_FLAG: number = 1;
    TEMPORAL_FLAG: number = 1;
    dynamicLight: boolean = true;

    vBuffer: GPUTexture;
    motionVec: GPUTexture;
    gBufferTex: GPUBuffer;
    gBufferAttri: GPUBuffer;
    previousGBufferAttri: GPUBuffer;
    outputBuffer: GPUBuffer;
    uniformBuffer: GPUBuffer;
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
        this.motionVec = buffers.motionVec;
        this.gBufferTex = buffers.gBufferTex;
        this.gBufferAttri = buffers.gBufferAttri;
        this.previousGBufferAttri = buffers.previousGBufferAttri;
        this.outputBuffer = buffers.currentFrameBuffer;
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
        let originWidth = Math.floor(device.canvas.width / device.upscaleRatio);
        let originHeight = Math.floor(device.canvas.height / device.upscaleRatio);
        // LightDI/GI,wDI,WDI,MDIGI.xy
        // Xvisible.xyz Nvisible.xy
        // Xsample.xyz Nsample.xy
        // wGI,WGI, Lo.xy, (Lo.z,seed)
        this.currentReservoir = device.device.createBuffer({
            size: 16 * (4 * originWidth * originHeight),
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
        });
        this.previousReservoir = device.device.createBuffer({
            size: 16 * (4 * originWidth * originHeight),
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
    }
    private buildBindGroupLayout() {
        this.bindGroupLayoutInit = this.device.device.createBindGroupLayout({
            label: 'rayTracingInit',
            entries: [
                {// output texture
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'storage', },
                },
                {// camera buffer
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'uniform', },
                },
                {// geometry buffer
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'storage', },
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
                    buffer: { type: 'storage', },
                },
                {// motion vector
                    binding: 12,
                    visibility: GPUShaderStage.COMPUTE,
                    texture: { sampleType: 'uint', },
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
                    buffer: { type: 'storage', },
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
                    buffer: { type: 'storage', },
                },
                {// uniform buffer
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'uniform', },
                },
                {// gBufferTex
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'storage', },
                },
                {// reservoir buffer
                    binding: 3,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'storage', },
                }
            ]
        });
        this.bindGroupLayoutAccumulate = this.device.device.createBindGroupLayout({
            label: 'rayTracingAccumulate',
            entries: [
                {// output texture
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'storage', },
                },
                {// uniform buffer
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'uniform', },
                },
                {// gBufferTex
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'storage', },
                },
                {// gBufferAttri
                    binding: 3,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'storage', },
                }
            ]
        });
    }
    private async buildPipeline() {
        let originWidth = Math.floor(this.device.canvas.width / this.device.upscaleRatio);
        let originHeight = Math.floor(this.device.canvas.height / this.device.upscaleRatio);
        const sampleInitModule = this.device.device.createShaderModule({
            label: 'rayGen.wgsl',
            code: shaders.get("rayGen.wgsl").replace(/TREE_DEPTH/g, this.model.bvhMaxDepth.toString()).replace(/LIGHT_COUNT/g, this.lights.lightCount.toString()),
        });
        const spatialReuseModule = this.device.device.createShaderModule({
            label: 'spatialReuse.wgsl',
            code: shaders.get("spatialReuse.wgsl").replace(/LIGHT_COUNT/g, this.lights.lightCount.toString()),
        });
        const accumulateModule = this.device.device.createShaderModule({
            label: 'accumulate.wgsl',
            code: shaders.get("accumulate.wgsl").replace(/TREE_DEPTH/g, this.model.bvhMaxDepth.toString()).replace(/LIGHT_COUNT/g, this.lights.lightCount.toString()),
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
                    ENABLE_DI: this.DI_FLAG,
                    ENABLE_GI: this.GI_FLAG,
                    ENABLE_RIS: this.RIS_FLAG,
                    ENABLE_TEMPORAL: this.TEMPORAL_FLAG,
                    WIDTH: originWidth,
                    HEIGHT: originHeight,
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
                constants: {
                    ENABLE_DI: this.DI_FLAG,
                    ENABLE_GI: this.GI_FLAG,
                    WIDTH: originWidth,
                    HEIGHT: originHeight,
                }
            },
        });
        this.pipelineAccumulate = await this.device.device.createComputePipelineAsync({
            layout: this.device.device.createPipelineLayout({
                bindGroupLayouts: [this.bindGroupLayoutAccumulate, this.bindGroupLayoutReservoir, this.bindGroupLayoutLight, this.bindGroupLayoutAccelerationStructure,],
            }),
            compute: {
                module: accumulateModule,
                entryPoint: 'main',
                constants: {
                    ENABLE_DI: this.DI_FLAG,
                    ENABLE_GI: this.GI_FLAG,
                    WIDTH: originWidth,
                    HEIGHT: originHeight,
                }
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
                    resource: { buffer: this.outputBuffer, }
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
                },
                {// motion vector
                    binding: 12,
                    resource: this.motionVec.createView(),
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
        this.bindingGroupLight = this.device.device.createBindGroup({
            label: 'rayTracingLight',
            layout: this.bindGroupLayoutLight,
            entries: [
                {// light buffer
                    binding: 0,
                    resource: { buffer: this.lights.lightBuffer, },
                },
            ]
        });
        this.bindingGroupReuse = this.device.device.createBindGroup({
            label: 'rayTracingSpatialReuse',
            layout: this.bindGroupLayoutReuse,
            entries: [
                {// output texture
                    binding: 0,
                    resource: { buffer: this.outputBuffer, }
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
        this.bindingGroupAccumulate = this.device.device.createBindGroup({
            label: 'rayTracingAccumulate',
            layout: this.bindGroupLayoutAccumulate,
            entries: [
                {// output texture
                    binding: 0,
                    resource: { buffer: this.outputBuffer, }
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
    async init(lights: LightManager) {
        this.lights = lights;
        this.buildBindGroupLayout();
        await this.buildPipeline();
        this.buildBindGroup();
    }
    uboBuffer = new ArrayBuffer(4 * 4);
    timeStamp = window.performance.now();
    updateUBO() {
        let uboUint = new Uint32Array(this.uboBuffer);
        let uboFloat = new Float32Array(this.uboBuffer);
        uboUint[3] = Math.floor(Math.random() * 0x100000000);
        uboFloat.set(this.camera.camera.position.toArray(), 0);
        this.device.device.queue.writeBuffer(this.uniformBuffer, 0, this.uboBuffer);
        // update light position
        let interval = window.performance.now() - this.timeStamp;
        this.timeStamp = window.performance.now();
        if (this.dynamicLight) {
            let time = window.performance.now() / 1000;
            for (let i = 0; i < this.lights.lightCount; i++) {
                if (this.lights.lights[i].transform == null) continue;
                this.lights.lights[i].transform(interval);
                this.device.device.queue.writeBuffer(this.lights.lightBuffer, 4 * (4 + 8 * i), this.lights.lights[i].position);
            }
        }
    }

    async record(commandEncoder: GPUCommandEncoder) {
        let originWidth = Math.floor(this.device.canvas.width / this.device.upscaleRatio);
        let originHeight = Math.floor(this.device.canvas.height / this.device.upscaleRatio);

        this.updateUBO();

        const sampleInitEncoder = commandEncoder.beginComputePass();
        sampleInitEncoder.setPipeline(this.pipelineInit);
        sampleInitEncoder.setBindGroup(0, this.bindingGroupInit);
        sampleInitEncoder.setBindGroup(1, this.bindingGroupReservoir);
        sampleInitEncoder.setBindGroup(2, this.bindingGroupLight);
        sampleInitEncoder.setBindGroup(3, this.bindingGroupAccelerationStructure);
        sampleInitEncoder.dispatchWorkgroups(Math.ceil(originWidth / 8), Math.ceil(originHeight / 8), 1);
        sampleInitEncoder.end();

        for (let i = 0; i < this.spatialReuseIteration; i++) {
            const spatialReuseEncoder = commandEncoder.beginComputePass();
            spatialReuseEncoder.setPipeline(this.pipelineReuse);
            spatialReuseEncoder.setBindGroup(0, this.bindingGroupReuse);
            spatialReuseEncoder.setBindGroup(1, i % 2 == 0 ? this.bindingGroupReservoirInverse : this.bindingGroupReservoir);
            spatialReuseEncoder.setBindGroup(2, this.bindingGroupLight);
            spatialReuseEncoder.dispatchWorkgroups(Math.ceil(originWidth / 8), Math.ceil(originHeight / 8), 1);
            spatialReuseEncoder.end();
        }

        const accumulateEncoder = commandEncoder.beginComputePass();
        accumulateEncoder.setPipeline(this.pipelineAccumulate);
        accumulateEncoder.setBindGroup(0, this.bindingGroupAccumulate);
        accumulateEncoder.setBindGroup(1, this.spatialReuseIteration % 2 == 0 ? this.bindingGroupReservoirInverse : this.bindingGroupReservoir);
        accumulateEncoder.setBindGroup(2, this.bindingGroupLight);
        accumulateEncoder.setBindGroup(3, this.bindingGroupAccelerationStructure);
        accumulateEncoder.dispatchWorkgroups(Math.ceil(originWidth / 8), Math.ceil(originHeight / 8), 1);
        accumulateEncoder.end();

        if (this.spatialReuseIteration % 2 == 1) {
            commandEncoder.copyBufferToBuffer(this.currentReservoir, 0, this.previousReservoir, 0, 16 * 4 * originWidth * originHeight);
        }
    }
}

export { rayTracing };