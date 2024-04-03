import { webGPUDevice } from "./device";

class BufferPool {
    currentFrameBuffer: GPUTexture;
    depthTexture: GPUTexture;
    vBuffer: GPUTexture;

    constructor(device: webGPUDevice) {
        this.currentFrameBuffer = device.device.createTexture({
            size: {
                width: device.canvas.width,
                height: device.canvas.height,
                depthOrArrayLayers: 1,
            },
            format: 'rgba16float', dimension: '2d',
            usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
        });
        this.depthTexture = device.device.createTexture({
            size: { width: device.canvas.width, height: device.canvas.height },
            format: "depth32float",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
        });
        this.vBuffer = device.device.createTexture({
            size: { width: device.canvas.width, height: device.canvas.height },
            format: "rgba32uint",// baryCoord.yz, motionVec, primitiveID, albedo.rgba
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
        });
    }
    update(encode: GPUCommandEncoder) {


    }
}

export { BufferPool };