import { webGPUDevice } from "./device";

class BufferPool {
    currentFrameBuffer: GPUTexture;
    previousFrameBuffer: GPUTexture;
    depthTexture: GPUTexture;
    depthTexturePrev: GPUTexture;
    vBuffer: GPUTexture;

    gBuffer: GPUBuffer;
    currentReservoir: GPUBuffer;
    previousReservoir: GPUBuffer;
    constructor(device: webGPUDevice) {
        let originWidth = Math.floor(device.canvas.width / device.upscaleRatio);
        let originHeight = Math.floor(device.canvas.height / device.upscaleRatio);
        this.currentFrameBuffer = device.device.createTexture({
            size: { width: originWidth, height: originHeight, },
            format: 'rgba16float', dimension: '2d',
            usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC,
        });
        this.previousFrameBuffer = device.device.createTexture({
            size: { width: originWidth, height: originHeight, },
            format: 'rgba16float', dimension: '2d',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        });
        this.depthTexture = device.device.createTexture({
            size: { width: originWidth, height: originHeight },
            format: "depth32float",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
        });
        this.vBuffer = device.device.createTexture({
            size: { width: originWidth, height: originHeight },
            format: "rgba32uint",// baryCoord.yz, primitiveID, motionVec
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
        });
        this.gBuffer = device.device.createBuffer({
            size: 2 * 4 * originWidth * originHeight,
            usage: GPUBufferUsage.STORAGE,
        });
        // LightDI,wDI,WDI,MDIGI.xy
        // Xvisible.xyz Nvisible.xy
        // Xsample.xyz Nsample.xy
        // wGI,WGI, Lo.xy, Lo.zw
        this.currentReservoir = device.device.createBuffer({
            size: 16 * (4 * originWidth * originHeight),
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
        });
        this.previousReservoir = device.device.createBuffer({
            size: 16 * (4 * originWidth * originHeight),
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
    }
    update(encode: GPUCommandEncoder, device: webGPUDevice) {
        let originWidth = Math.floor(device.canvas.width / device.upscaleRatio);
        let originHeight = Math.floor(device.canvas.height / device.upscaleRatio);

        encode.copyTextureToTexture({ texture: this.currentFrameBuffer, }, { texture: this.previousFrameBuffer, }, { width: originWidth, height: originHeight });
        encode.copyBufferToBuffer(this.currentReservoir, 0, this.previousReservoir, 0, 16 * 4 * originWidth * originHeight);

    }
}

export { BufferPool };