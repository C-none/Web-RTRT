import { webGPUDevice } from "./device";
import { shaders } from "./shaders/manager";

// copy from framebuffer to the screen
class Display {
    displayPipeline?: GPUComputePipeline;
    displayBindGroup?: GPUBindGroup;
    displayPipelineLayout?: GPUPipelineLayout;
    displayBindGroupLayout?: GPUBindGroupLayout;

    device: webGPUDevice;
    currentFrameBuffer: GPUTexture;

    constructor(device: webGPUDevice, currentFrameBuffer: GPUTexture) {
        this.device = device;
        this.currentFrameBuffer = currentFrameBuffer;
        this.displayBindGroupLayout = device.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    texture: {
                        viewDimension: '2d',
                        sampleType: 'float',
                    },
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    storageTexture: {
                        access: 'write-only',
                        format: device.format,
                    },
                }
            ],
        });
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
            },
        });
        // console.log(shaders.get('display.wgsl').replace('displayFormat', device.format));
    }

    record(commandEncoder: GPUCommandEncoder) {
        const bindGroup = this.displayBindGroup = this.device.device.createBindGroup({
            layout: this.displayBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: this.currentFrameBuffer.createView(),
                },
                {
                    binding: 1,
                    resource: this.device.context.getCurrentTexture().createView(),
                }
            ],
        });
        const passEncoder = commandEncoder.beginComputePass();
        passEncoder.setPipeline(this.displayPipeline);
        passEncoder.setBindGroup(0, bindGroup);
        passEncoder.dispatchWorkgroups(Math.ceil(this.device.canvas.width / 8), Math.ceil(this.device.canvas.height / 8), 1);
        passEncoder.end();

    }
}

export { Display };