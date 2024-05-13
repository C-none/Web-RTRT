import { webGPUDevice } from "./device";

class BufferPool {
    currentFrameBuffer: GPUBuffer;
    previousFrameBuffer: GPUBuffer;
    previousDisplayBuffer: GPUTexture;
    depthTexture: GPUTexture;
    previousDepthTexture: GPUTexture;
    vBuffer: GPUTexture;
    motionVec: GPUTexture;

    gBufferTex: GPUBuffer;
    gBufferAttri: GPUBuffer;
    previousGBufferAttri: GPUBuffer;
    constructor(device: webGPUDevice) {
        let originWidth = Math.floor(device.canvas.width / device.upscaleRatio);
        let originHeight = Math.floor(device.canvas.height / device.upscaleRatio);
        this.currentFrameBuffer = device.device.createBuffer({
            size: 2 * 4 * originWidth * originHeight,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
        });
        this.previousFrameBuffer = device.device.createBuffer({
            size: 2 * 4 * originWidth * originHeight,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
        this.previousDisplayBuffer = device.device.createTexture({
            size: { width: device.canvas.width, height: device.canvas.height, },
            format: device.format, dimension: '2d',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        });
        this.depthTexture = device.device.createTexture({
            size: { width: originWidth, height: originHeight },
            format: "depth32float",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC,
        });
        this.previousDepthTexture = device.device.createTexture({
            size: { width: originWidth, height: originHeight },
            format: "depth32float",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        });
        this.vBuffer = device.device.createTexture({
            size: { width: originWidth, height: originHeight },
            format: "rgba32uint",// baryCoord.yz, primitiveID, instanceID
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
        });
        this.motionVec = device.device.createTexture({
            size: { width: originWidth, height: originHeight },
            format: "r32uint",// motionVec.xy
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
        });
        this.gBufferTex = device.device.createBuffer({
            size: 2 * 4 * originWidth * originHeight,
            usage: GPUBufferUsage.STORAGE,
        });
        this.gBufferAttri = device.device.createBuffer({
            size: 4 * 4 * originWidth * originHeight,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
        });
        this.previousGBufferAttri = device.device.createBuffer({
            size: 4 * 4 * originWidth * originHeight,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });

    }
    update(encode: GPUCommandEncoder, device: webGPUDevice) {
        let originWidth = Math.floor(device.canvas.width / device.upscaleRatio);
        let originHeight = Math.floor(device.canvas.height / device.upscaleRatio);
        encode.copyBufferToBuffer(this.gBufferAttri, 0, this.previousGBufferAttri, 0, 4 * 4 * originWidth * originHeight);
        encode.copyBufferToBuffer(this.currentFrameBuffer, 0, this.previousFrameBuffer, 0, 2 * 4 * originWidth * originHeight);
        encode.copyTextureToTexture({ texture: this.depthTexture, }, { texture: this.previousDepthTexture, }, { width: originWidth, height: originHeight });
        encode.copyTextureToTexture({ texture: device.context.getCurrentTexture(), }, { texture: this.previousDisplayBuffer, }, { width: device.canvas.width, height: device.canvas.height });
    }
}

export { BufferPool };