import { webGPUDevice } from "./device";

class BufferPool {
    currentFrameBuffer: GPUTexture;
    previousFrameBuffer: GPUTexture;
    depthTexture: GPUTexture;
    vBuffer: GPUTexture;

    constructor(device: webGPUDevice) {
        this.currentFrameBuffer = device.device.createTexture({
            size: {
                width: device.canvas.width / device.upscaleRatio,
                height: device.canvas.height / device.upscaleRatio,
            },
            format: 'rgba16float', dimension: '2d',
            usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC,
        });
        this.previousFrameBuffer = device.device.createTexture({
            size: {
                width: device.canvas.width / device.upscaleRatio,
                height: device.canvas.height / device.upscaleRatio,
            },
            format: 'rgba16float', dimension: '2d',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        });
        this.depthTexture = device.device.createTexture({
            size: { width: device.canvas.width / device.upscaleRatio, height: device.canvas.height / device.upscaleRatio },
            format: "depth32float",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
        });
        this.vBuffer = device.device.createTexture({
            size: { width: device.canvas.width / device.upscaleRatio, height: device.canvas.height / device.upscaleRatio },
            format: "rgba32uint",// baryCoord.yz, motionVec, primitiveID, albedo.rgba
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
        });
    }
    update(encode: GPUCommandEncoder, device: webGPUDevice) {
        encode.copyTextureToTexture({ texture: this.currentFrameBuffer, }, { texture: this.previousFrameBuffer, }, { width: device.canvas.width / device.upscaleRatio, height: device.canvas.height / device.upscaleRatio });

    }
}

export { BufferPool };