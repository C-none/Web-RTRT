import { webGPUDevice } from "./util/device";
import DISPLAY_VERTEX from "./shaders/display/display.vert.wgsl?raw";
import DISPLAY_FRAG from "./shaders/display/display.frag.wgsl?raw";

// copy from framebuffer to the screen
class Display {
    displayPipeline?: GPURenderPipeline;
    displayBindGroup?: GPUBindGroup;
    resolutionUniformBuffer?: GPUBuffer;
    constructor(device: webGPUDevice, currentFrameBuffer: GPUBuffer) {
        this.displayPipeline = device.device.createRenderPipeline({
            layout: 'auto',
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
        this.resolutionUniformBuffer = device.device.createBuffer({
            size: 2 * Float32Array.BYTES_PER_ELEMENT,
            usage: GPUBufferUsage.UNIFORM,
            mappedAtCreation: true,
        });
        new Float32Array(this.resolutionUniformBuffer.getMappedRange()).set(new Float32Array([
            device.size.width, device.size.height,
        ]));
        this.resolutionUniformBuffer.unmap();
        this.displayBindGroup = device.device.createBindGroup({
            layout: this.displayPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: currentFrameBuffer, }, },
                { binding: 1, resource: { buffer: this.resolutionUniformBuffer, }, },
            ],
        });
    }

    buildPipeline(commandEncoder: GPUCommandEncoder, screenView: GPUTextureView) {
        const displaypass = commandEncoder.beginRenderPass({
            colorAttachments: [{
                clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                loadOp: 'clear',
                storeOp: 'store',
                view: screenView,
            }]
        });
        displaypass.setPipeline(this.displayPipeline);
        displaypass.setBindGroup(0, this.displayBindGroup);
        displaypass.draw(3, 1, 0, 0);
        displaypass.end();

    }
}

export { Display };