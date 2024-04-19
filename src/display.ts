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
    vBuffer: GPUTexture;
    depthTexture: GPUTexture;
    currentFrameBuffer: GPUTexture;
    previousFrameBuffer: GPUTexture;
    sampler: GPUSampler;

    constructor(device: webGPUDevice, buffers: BufferPool, camera: CameraManager) {
        this.device = device;
        this.vBuffer = buffers.vBuffer;
        this.depthTexture = buffers.depthTexture;
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
                    sampler: {}
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    texture: { sampleType: 'uint', },
                },
                {
                    binding: 3,
                    visibility: GPUShaderStage.COMPUTE,
                    texture: { sampleType: 'depth', }
                },
                {
                    binding: 4,
                    visibility: GPUShaderStage.COMPUTE,
                    texture: { sampleType: 'float', }
                },
                {
                    binding: 5,
                    visibility: GPUShaderStage.COMPUTE,
                    texture: { sampleType: 'float', }
                }
            ],
        });
        this.sampler = device.device.createSampler({
            addressModeU: "repeat",
            addressModeV: "repeat",
            magFilter: "nearest",
            minFilter: "nearest",
            mipmapFilter: "nearest",
        });
        this.bindGroupEntries = [
            { binding: 0, resource: this.device.context.getCurrentTexture().createView(), },
            { binding: 1, resource: this.sampler, },
            { binding: 2, resource: this.vBuffer.createView(), },
            { binding: 3, resource: this.depthTexture.createView(), },
            { binding: 4, resource: this.currentFrameBuffer.createView(), },
            { binding: 5, resource: this.previousFrameBuffer.createView(), },
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