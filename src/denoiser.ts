import { CameraManager } from "./camera";
import { webGPUDevice } from "./device";
import { BufferPool } from "./screenBuffer";
import { shaders } from "./shaders/manager";

class Denoiser {
    device: webGPUDevice;
    camera: CameraManager;
    patchSize: number = 8;
    reflectance: GPUBuffer;
    motionVec: GPUTexture;
    depthTexture: GPUTexture;
    previousDepthTexture: GPUTexture;

    historyLength: GPUBuffer;
    prevHistoryLength: GPUBuffer;

    moment: GPUBuffer;
    prevMoment: GPUBuffer;

    variance: GPUBuffer;
    prevVariance: GPUBuffer;
    varianceBindGroupLayout: GPUBindGroupLayout;
    varianceBindGroup: GPUBindGroup;
    varianceBindGroupInverse: GPUBindGroup;

    illumination: GPUBuffer;
    previousIllumination: GPUBuffer;
    currentIllumination: GPUBuffer;

    gBufferAttri: GPUBuffer;
    previousGBufferAttri: GPUBuffer;

    accumlatePipeline: GPUComputePipeline;
    accumulateBindGroupLayout: GPUBindGroupLayout;
    accumulateBindGroup: GPUBindGroup;

    temperalAccumlatePipeline: GPUComputePipeline;
    temperalAccumlateBindGroupLayout: GPUBindGroupLayout;
    temperalAccumlateBindGroup: GPUBindGroup;

    fireflyPipeline: GPUComputePipeline;
    fireflyBindGroupLayout: GPUBindGroupLayout;
    fireflyBindGroup: GPUBindGroup;

    constructor(device: webGPUDevice, buffers: BufferPool, camera: CameraManager) {
        this.device = device;
        this.camera = camera;
        this.reflectance = buffers.gBufferTex;
        this.motionVec = buffers.motionVec;
        this.depthTexture = buffers.depthTexture;
        this.previousDepthTexture = buffers.previousDepthTexture;
        this.illumination = buffers.currentFrameBuffer;
        this.gBufferAttri = buffers.gBufferAttri;
        this.previousGBufferAttri = buffers.previousGBufferAttri;

        let originWidth = Math.floor(this.device.canvas.width / this.device.upscaleRatio);
        let originHeight = Math.floor(this.device.canvas.height / this.device.upscaleRatio);

        this.previousIllumination = this.device.device.createBuffer({
            size: 2 * 4 * originWidth * originHeight,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            label: 'previousIllumination',
        });
        this.currentIllumination = this.device.device.createBuffer({
            size: 2 * 4 * originWidth * originHeight,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
            label: 'currentIllumination',
        });
        this.historyLength = this.device.device.createBuffer({
            size: 1 * 4 * originWidth * originHeight,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
            label: 'historyLength',
        });
        this.prevHistoryLength = this.device.device.createBuffer({
            size: 1 * 4 * originWidth * originHeight,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            label: 'prevHistoryLength',
        });
        this.moment = this.device.device.createBuffer({
            size: 2 * 4 * originWidth * originHeight,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
            label: 'moment',
        });
        this.prevMoment = this.device.device.createBuffer({
            size: 2 * 4 * originWidth * originHeight,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            label: 'prevMoment',
        });
        this.variance = this.device.device.createBuffer({
            size: 1 * 4 * originWidth * originHeight,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
            label: 'variance',
        });
        this.prevVariance = this.device.device.createBuffer({
            size: 1 * 4 * originWidth * originHeight,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            label: 'prevVariance',
        });

    }

    buildBindGroupLayout() {
        this.varianceBindGroupLayout = this.device.device.createBindGroupLayout({
            entries: [
                {// current variance
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'storage', },
                },
                {// previous variance
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'storage', },
                }
            ]
        });
        this.temperalAccumlateBindGroupLayout = this.device.device.createBindGroupLayout({
            entries: [
                {// camera buffer
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'uniform', },
                },
                {// motionVec
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    texture: { sampleType: 'uint', },
                },
                {// previous illumination
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'storage', },
                },
                {// current illumination
                    binding: 3,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'storage', },
                },
                {// illumination
                    binding: 4,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'storage', },
                },
                {// gBufferAttri
                    binding: 5,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'storage', },
                },
                {// previousGBufferAttri
                    binding: 6,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'storage', },
                },
                {// depthTexture
                    binding: 7,
                    visibility: GPUShaderStage.COMPUTE,
                    texture: { sampleType: 'depth', },
                },
                {// history length
                    binding: 8,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'storage', },
                },
                {// previous history length 
                    binding: 9,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'storage', },
                },
                {// moment
                    binding: 10,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'storage', },
                },
                {// previous moment
                    binding: 11,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'storage', },
                },
                {// variance
                    binding: 12,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'storage', },
                }
            ]
        });
        this.fireflyBindGroupLayout = this.device.device.createBindGroupLayout({
            entries: [
                {// illumination input
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'storage', },
                },
                {// illumination output
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'storage', },
                },
                {// gBufferAttri
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'storage', },
                },
                {// depthTexture
                    binding: 3,
                    visibility: GPUShaderStage.COMPUTE,
                    texture: { sampleType: 'depth', },
                },
            ]
        });
    }

    async buildPipeline() {
        let originWidth = Math.floor(this.device.canvas.width / this.device.upscaleRatio);
        let originHeight = Math.floor(this.device.canvas.height / this.device.upscaleRatio);
        let denoiseAccum = this.device.device.createShaderModule({ code: shaders.get("denoiseAccum.wgsl").replace(/BATCH_SIZE/g, this.patchSize.toString()) });
        let temperalAccum = this.device.device.createShaderModule({ code: shaders.get("temperalAccum.wgsl").replace(/BATCH_SIZE/g, this.patchSize.toString()) });
        let firefly = this.device.device.createShaderModule({ code: shaders.get("firefly.wgsl").replace(/BATCH_SIZE/g, this.patchSize.toString()) });
        this.accumlatePipeline = await this.device.device.createComputePipelineAsync({
            label: 'denoiseAccumulate',
            layout: 'auto',
            compute: {
                module: denoiseAccum,
                entryPoint: 'main',
                constants: {
                    WIDTH: originWidth,
                    HEIGHT: originHeight,
                }
            },
        });
        this.temperalAccumlatePipeline = await this.device.device.createComputePipelineAsync({
            label: 'temperalAccumulate',
            layout: this.device.device.createPipelineLayout({
                bindGroupLayouts: [this.temperalAccumlateBindGroupLayout],
            }),
            compute: {
                module: temperalAccum,
                entryPoint: 'main',
                constants: {
                    WIDTH: originWidth,
                    HEIGHT: originHeight,
                }
            },
        });
        this.fireflyPipeline = await this.device.device.createComputePipelineAsync({
            label: 'firefly',
            layout: this.device.device.createPipelineLayout({
                bindGroupLayouts: [this.fireflyBindGroupLayout],
            }),
            compute: {
                module: firefly,
                entryPoint: 'main',
                constants: {
                    WIDTH: originWidth,
                    HEIGHT: originHeight,
                }
            },
        });
    }

    buildBindGroup() {
        this.accumulateBindGroup = this.device.device.createBindGroup({
            label: 'accumulateBindGroup',
            layout: this.accumlatePipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.illumination }, },
                { binding: 1, resource: { buffer: this.reflectance }, }
            ]
        });
        this.temperalAccumlateBindGroup = this.device.device.createBindGroup({
            label: 'temperalAccumlateBindGroup',
            layout: this.temperalAccumlateBindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: this.camera.cameraBuffer }, },
                { binding: 1, resource: this.motionVec.createView(), },
                { binding: 2, resource: { buffer: this.previousIllumination }, },
                { binding: 3, resource: { buffer: this.currentIllumination }, },
                { binding: 4, resource: { buffer: this.illumination }, },
                { binding: 5, resource: { buffer: this.gBufferAttri }, },
                { binding: 6, resource: { buffer: this.previousGBufferAttri }, },
                { binding: 7, resource: this.depthTexture.createView(), },
                { binding: 8, resource: { buffer: this.historyLength }, },
                { binding: 9, resource: { buffer: this.prevHistoryLength }, },
                { binding: 10, resource: { buffer: this.moment }, },
                { binding: 11, resource: { buffer: this.prevMoment }, },
                { binding: 12, resource: { buffer: this.variance }, }
            ]
        });
        this.varianceBindGroup = this.device.device.createBindGroup({
            label: 'varianceBindGroup',
            layout: this.varianceBindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: this.variance }, },
                { binding: 1, resource: { buffer: this.prevVariance }, }
            ]
        });
        this.varianceBindGroupInverse = this.device.device.createBindGroup({
            label: 'varianceBindGroupInverse',
            layout: this.varianceBindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: this.prevVariance }, },
                { binding: 1, resource: { buffer: this.variance }, }
            ]
        });
        this.fireflyBindGroup = this.device.device.createBindGroup({
            label: 'fireflyBindGroup',
            layout: this.fireflyBindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: this.currentIllumination }, },
                { binding: 1, resource: { buffer: this.illumination }, },
                { binding: 2, resource: { buffer: this.gBufferAttri }, },
                { binding: 3, resource: this.depthTexture.createView(), },
            ]
        });
    }

    async init() {
        this.buildBindGroupLayout();
        await this.buildPipeline();
        this.buildBindGroup();
    }

    record(encoder: GPUCommandEncoder) {
        let originWidth = Math.floor(this.device.canvas.width / this.device.upscaleRatio);
        let originHeight = Math.floor(this.device.canvas.height / this.device.upscaleRatio);

        const temperalAccum = encoder.beginComputePass();
        temperalAccum.setPipeline(this.temperalAccumlatePipeline);
        temperalAccum.setBindGroup(0, this.temperalAccumlateBindGroup);
        temperalAccum.dispatchWorkgroups(Math.ceil(originWidth / this.patchSize), Math.ceil(originHeight / this.patchSize), 1);
        temperalAccum.end();

        const firefly = encoder.beginComputePass();
        firefly.setPipeline(this.fireflyPipeline);
        firefly.setBindGroup(0, this.fireflyBindGroup);
        firefly.dispatchWorkgroups(Math.ceil(originWidth / this.patchSize), Math.ceil(originHeight / this.patchSize), 1);
        firefly.end();

        const accumulate = encoder.beginComputePass();
        accumulate.setPipeline(this.accumlatePipeline);
        accumulate.setBindGroup(0, this.accumulateBindGroup);
        accumulate.dispatchWorkgroups(Math.ceil(originWidth / this.patchSize), Math.ceil(originHeight / this.patchSize), 1);
        accumulate.end();

        encoder.copyBufferToBuffer(this.moment, 0, this.prevMoment, 0, 2 * 4 * originWidth * originHeight);
        encoder.copyBufferToBuffer(this.historyLength, 0, this.prevHistoryLength, 0, 1 * 4 * originWidth * originHeight);
        encoder.copyBufferToBuffer(this.currentIllumination, 0, this.previousIllumination, 0, 2 * 4 * originWidth * originHeight);
    }

}

export { Denoiser };