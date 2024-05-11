import { webGPUDevice } from "./device";
import { BufferPool } from "./screenBuffer";
import { CameraManager } from "./camera";
import { shaders } from "./shaders/manager";

// copy from framebuffer to the screen
class Display {
    displayPipeline: GPUComputePipeline;
    displayBindGroup: GPUBindGroup;
    displayPipelineLayout: GPUPipelineLayout;
    displayBindGroupLayout: GPUBindGroupLayout;
    bindGroupEntries: GPUBindGroupEntry[];

    device: webGPUDevice;
    motionVec: GPUTexture;
    depthTexture: GPUTexture;
    previousDisplayBuffer: GPUTexture;
    currentFrameBuffer: GPUBuffer;
    previousFrameBuffer: GPUBuffer;
    sampler: GPUSampler;

    constructor(device: webGPUDevice, buffers: BufferPool, camera: CameraManager) {
        this.device = device;
        this.motionVec = buffers.motionVec;
        this.depthTexture = buffers.depthTexture;
        this.previousDisplayBuffer = buffers.previousDisplayBuffer;
        this.currentFrameBuffer = buffers.currentFrameBuffer;
        this.previousFrameBuffer = buffers.previousFrameBuffer;
        this.displayBindGroupLayout = device.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    storageTexture: {
                        access: 'write-only',
                        format: device.format,
                    },
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    texture: {},
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    sampler: {}
                },
                {
                    binding: 3,
                    visibility: GPUShaderStage.COMPUTE,
                    texture: { sampleType: 'uint', },
                },
                {
                    binding: 4,
                    visibility: GPUShaderStage.COMPUTE,
                    texture: { sampleType: 'depth', }
                },
                {
                    binding: 5,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'storage' },
                },
                {
                    binding: 6,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'storage' },
                }
            ],
        });
        this.sampler = device.device.createSampler({
            addressModeU: "clamp-to-edge",
            addressModeV: "clamp-to-edge",
            magFilter: "nearest",
            minFilter: "nearest",
        });
        this.bindGroupEntries = [
            { binding: 0, resource: this.device.context.getCurrentTexture().createView(), },
            { binding: 1, resource: this.previousDisplayBuffer.createView(), },
            { binding: 2, resource: this.sampler, },
            { binding: 3, resource: this.motionVec.createView(), },
            { binding: 4, resource: this.depthTexture.createView(), },
            { binding: 5, resource: { buffer: this.currentFrameBuffer }, },
            { binding: 6, resource: { buffer: this.previousFrameBuffer }, },
        ]
        this.displayPipelineLayout = device.device.createPipelineLayout({
            bindGroupLayouts: [this.displayBindGroupLayout],
        });
        this.displayPipeline = device.device.createComputePipeline({
            layout: this.displayPipelineLayout,
            compute: {
                module: device.device.createShaderModule({
                    label: 'display.wgsl',
                    code: shaders.get('display.wgsl').replace('displayFormat', device.format),
                }),
                entryPoint: 'main',
                constants: {
                    zNear: camera.camera.near,
                    zFar: camera.camera.far,
                }
            },
        });
    }

    record(commandEncoder: GPUCommandEncoder) {
        this.bindGroupEntries[0].resource = this.device.context.getCurrentTexture().createView();
        this.displayBindGroup = this.device.device.createBindGroup({
            layout: this.displayBindGroupLayout,
            entries: this.bindGroupEntries,
        });
        const passEncoder = commandEncoder.beginComputePass();
        passEncoder.setPipeline(this.displayPipeline);
        passEncoder.setBindGroup(0, this.displayBindGroup);
        passEncoder.dispatchWorkgroups(Math.ceil(this.device.canvas.width / 8), Math.ceil(this.device.canvas.height / 8), 1);
        passEncoder.end();

    }
}

export { Display };