import { or } from "three/examples/jsm/nodes/Nodes.js";
import { webGPUDevice } from "./device";
import { BufferPool } from "./screenBuffer";
import { shaders } from "./shaders/manager";

class Denoiser {
    device: webGPUDevice;
    patchSize: number = 8;
    gBufferTex: GPUBuffer;
    motionVec: GPUTexture;
    historyLength: GPUBuffer;
    moment: GPUBuffer;
    variance: GPUBuffer;

    illumination: GPUBuffer;
    previousIllumination: GPUBuffer;

    gBufferAttri: GPUBuffer;
    previousGBufferAttri: GPUBuffer;

    accumlatePipeline: GPUComputePipeline;
    accumulateBindGroup: GPUBindGroup;

    temperalAccumlateBindGroupLayout: GPUBindGroupLayout;
    temperalAccumlatePipeline: GPUComputePipeline;
    temperalAccumlateBindGroup: GPUBindGroup;

    constructor(device: webGPUDevice, buffers: BufferPool) {
        this.device = device;
        this.gBufferTex = buffers.gBufferTex;
        this.motionVec = buffers.motionVec;
        this.illumination = buffers.currentFrameBuffer;
        this.gBufferAttri = buffers.gBufferAttri;
        this.previousGBufferAttri = buffers.previousGBufferAttri;

        let originWidth = Math.floor(this.device.canvas.width / this.device.upscaleRatio);
        let originHeight = Math.floor(this.device.canvas.height / this.device.upscaleRatio);

        this.previousIllumination = this.device.device.createBuffer({
            size: 2 * 4 * originWidth * originHeight,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
        this.historyLength = this.device.device.createBuffer({
            size: 1 * 4 * originWidth * originHeight,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
            mappedAtCreation: true,
        });
    }

    buildBindGroupLayout() {
    }

    async buildPipeline() {
        let originWidth = Math.floor(this.device.canvas.width / this.device.upscaleRatio);
        let originHeight = Math.floor(this.device.canvas.height / this.device.upscaleRatio);
        let denoiseAccum = this.device.device.createShaderModule({ code: shaders.get("denoiseAccum.wgsl").replace(/BATCH_SIZE/g, this.patchSize.toString()) });
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
    }

    buildBindGroup() {
        this.accumulateBindGroup = this.device.device.createBindGroup({
            layout: this.accumlatePipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: { buffer: this.illumination },
                },
                {
                    binding: 1,
                    resource: { buffer: this.gBufferTex },
                }
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
        const pass = encoder.beginComputePass();
        pass.setPipeline(this.accumlatePipeline);
        pass.setBindGroup(0, this.accumulateBindGroup);
        pass.dispatchWorkgroups(Math.ceil(originWidth / this.patchSize), Math.ceil(originHeight / this.patchSize), 1);
        pass.end();

        encoder.copyBufferToBuffer(this.illumination, 0, this.previousIllumination, 0, this.illumination.size);
    }

}

export { Denoiser };