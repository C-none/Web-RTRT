import { webGPUDevice } from "./device";

class BufferPool {
    currentFrameBuffer: GPUTexture;
    previousFrameBuffer: GPUTexture;
    previousDisplayBuffer: GPUTexture;
    depthTexture: GPUTexture;
    vBuffer: GPUTexture;

    gBufferTex: GPUBuffer;
    gBufferAttri: GPUBuffer;
    previousGBufferAttri: GPUBuffer;
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
        this.previousDisplayBuffer = device.device.createTexture({
            size: { width: device.canvas.width, height: device.canvas.height, },
            format: device.format, dimension: '2d',
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
        // LightDI/GI,wDI,WDI,MDIGI.xy
        // Xvisible.xyz Nvisible.xy
        // Xsample.xyz Nsample.xy
        // wGI,WGI, Lo.xy, (Lo.z,seed)
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
        encode.copyBufferToBuffer(this.gBufferAttri, 0, this.previousGBufferAttri, 0, 4 * 4 * originWidth * originHeight);
        encode.copyTextureToTexture({ texture: this.currentFrameBuffer, }, { texture: this.previousFrameBuffer, }, { width: originWidth, height: originHeight });

        encode.copyTextureToTexture({ texture: device.context.getCurrentTexture(), }, { texture: this.previousDisplayBuffer, }, { width: device.canvas.width, height: device.canvas.height });
    }
}

export { BufferPool };