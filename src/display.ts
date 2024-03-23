import { webGPUDevice } from "./util/device";
import DISPLAY_VERTEX from "./shaders/display/display.vert.wgsl?raw";
import DISPLAY_FRAG from "./shaders/display/display.frag.wgsl?raw";

// to be modified according to https://webgpufundamentals.org/webgpu/lessons/webgpu-storage-textures.html

// copy from framebuffer to the screen
class Display {
    displayPipeline?: GPURenderPipeline;
    displayBindGroup?: GPUBindGroup;
    resolutionUniformBuffer?: GPUBuffer;
    constructor(device: webGPUDevice, currentFrameBuffer: GPUTextureView) {
        this.resolutionUniformBuffer = device.device.createBuffer({
            size: 2 * Float32Array.BYTES_PER_ELEMENT,
            usage: GPUBufferUsage.UNIFORM,
            mappedAtCreation: true,
        });
        new Float32Array(this.resolutionUniformBuffer.getMappedRange()).set(new Float32Array([
            device.canvas.width, device.canvas.height,
        ]));
        this.resolutionUniformBuffer.unmap();

        const bindGroupLayouts = device.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0, visibility: GPUShaderStage.FRAGMENT,
                    storageTexture: {
                        access: 'read-only',
                        format: 'rgba16float',
                    },
                },
                {
                    binding: 1, visibility: GPUShaderStage.FRAGMENT,
                    buffer: { type: 'uniform' },
                }
            ],
        });
        const pipelineLayout = device.device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayouts,],
        });
        this.displayBindGroup = device.device.createBindGroup({
            layout: bindGroupLayouts,
            entries: [
                { binding: 0, resource: currentFrameBuffer, },
                { binding: 1, resource: { buffer: this.resolutionUniformBuffer, }, },
            ],
        });
        this.displayPipeline = device.device.createRenderPipeline({
            layout: pipelineLayout,
            vertex: {
                module: device.device.createShaderModule({ code: DISPLAY_VERTEX, }),
                entryPoint: "main",
            },
            fragment: {
                module: device.device.createShaderModule({ code: DISPLAY_FRAG, }),
                entryPoint: "main",
                targets: [{ format: device.format, },],
            },
            primitive: {
                topology: 'triangle-list', frontFace: "ccw", cullMode: "none",
            },
        });

    }

    buildPipeline(commandEncoder: GPUCommandEncoder, screenView: GPUTextureView) {
        const displayPass = commandEncoder.beginRenderPass({
            colorAttachments: [{
                clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                loadOp: 'clear',
                storeOp: 'store',
                view: screenView,
            }]
        });
        displayPass.setPipeline(this.displayPipeline);
        displayPass.setBindGroup(0, this.displayBindGroup);
        displayPass.draw(3, 1, 0, 0);
        displayPass.end();

    }
}

export { Display };