import { webGPUDevice } from "./device";
import { BufferPool } from "./screenBuffer";
import { CameraManager } from "./camera";
import { shaders } from "./shaders/manager";

// copy from framebuffer to the screen
class Display {
    rendering_width:number;
    rendering_height:number;
    display_width:number;
    display_height:number;


    FXAA_renderPipeline: GPUComputePipeline;
    FXAA_renderBindGroup: GPUBindGroup;
    FXAA_renderPipelineLayout: GPUPipelineLayout;
    FXAA_renderBindGroupLayout: GPUBindGroupLayout;
    FXAA_renderBindGroupEntries: GPUBindGroupEntry[];


    reconstruct_dilatedPipeline: GPUComputePipeline;
    reconstruct_dilatedBindGroup: GPUBindGroup;
    reconstruct_dilatedPipelineLayout: GPUPipelineLayout;
    reconstruct_dilatedBindGroupLayout: GPUBindGroupLayout;
    reconstruct_dilatedBindGroupEntries: GPUBindGroupEntry[];


    depthClipPipeline: GPUComputePipeline;
    depthClipBindGroup: GPUBindGroup;
    depthClipPipelineLayout: GPUPipelineLayout;
    depthClipBindGroupLayout: GPUBindGroupLayout;
    depthClipBindGroupEntries: GPUBindGroupEntry[];

    lockPipeline: GPUComputePipeline;
    lockBindGroup: GPUBindGroup;
    lockPipelineLayout: GPUPipelineLayout;
    lockBindGroupLayout: GPUBindGroupLayout;
    lockBindGroupEntries: GPUBindGroupEntry[];

    displayPipeline: GPUComputePipeline;
    displayBindGroup: GPUBindGroup;
    displayPipelineLayout: GPUPipelineLayout;
    displayBindGroupLayout: GPUBindGroupLayout;
    displayBindGroupEntries: GPUBindGroupEntry[];

    racsPipeline: GPUComputePipeline;
    racsBindGroup: GPUBindGroup;
    racsPipelineLayout: GPUPipelineLayout;
    racsBindGroupLayout: GPUBindGroupLayout;
    racsBindGroupEntries: GPUBindGroupEntry[];


    rawPipeline: GPUComputePipeline;
    rawBindGroup: GPUBindGroup;
    rawPipelineLayout: GPUPipelineLayout;
    rawBindGroupLayout: GPUBindGroupLayout;
    bindGroupEntries: GPUBindGroupEntry[];


    //reconstructDilatedBuffer:GPUTexture;
    rawFrameBuffer:GPUBuffer;
    currentAAFrameBuffer:GPUBuffer;
    AADisplay:GPUTexture;

    LumaHistory:GPUBuffer;
    dilatedDepth:GPUTexture;
    //reconstructedPreviousDepth:GPUTexture;
    previousDepthTexture: GPUTexture;
    reconstructedPreviousDepth:GPUBuffer;
    dilatedMotionVectors:GPUTexture;
    previousDilatedMotionVectors:GPUTexture;
    lockInputLuma:GPUTexture;
    preparedInputColor:GPUTexture;
    newLocks:GPUTexture;
    dilatedReactiveMasks:GPUTexture;
    reactiveMasks:GPUTexture;
    transparencyAndCompositionMasks:GPUTexture;
    lockStatus:GPUTexture;
    rawDisplay:GPUTexture;

    device: webGPUDevice;
    motionVec: GPUTexture;
    depthTexture: GPUTexture;
    previousDisplayBuffer:GPUTexture;
    rPreviousDisplayBuffer: GPUTexture;
    wPreviousDisplayBuffer: GPUTexture;
    currentFrameBuffer: GPUBuffer;
    previousFrameBuffer: GPUBuffer;
    sampler: GPUSampler;
    liner_sampler:GPUSampler;
    camera:CameraManager;

    // this.FXAA_RENDER=false;
    // this.FXAA_DISPLAY=true;
    FXAA_RENDER:boolean=false;
    ENABLE_SR:boolean=true;
    enPreviousDepth:boolean=true;
    patchSize:number=8;
    currentFrameBuffer_bk: GPUBuffer;

    FSR_init(device: webGPUDevice, buffers: BufferPool, camera: CameraManager){

        this.display_width   =device.canvas.width;
        this.display_height  =device.canvas.height;
        this.rendering_width =Math.floor(device.canvas.width / device.upscaleRatio);
        this.rendering_height=Math.floor(device.canvas.height / device.upscaleRatio);
        let originWidth  = this.rendering_width;
        let originHeight = this.rendering_height;
        
        this.LumaHistory = device.device.createBuffer({
            size: 4 * 4 * device.canvas.width * device.canvas.height,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
        });
        this.dilatedDepth                   = device.device.createTexture({
            size: { width: originWidth, height: originHeight },
            format: "r32float",
            usage:  GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING,
        });
        this.reconstructedPreviousDepth     = device.device.createBuffer({
            size: (4 * originWidth * originHeight),//i32
            usage: GPUBufferUsage.STORAGE ,
        });
        this.dilatedMotionVectors           = device.device.createTexture({
            size: { width: originWidth, height: originHeight },
            format: "rgba16float",
            usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC,
        });
        this.previousDilatedMotionVectors   = device.device.createTexture({
            size: { width: originWidth, height: originHeight },
            format: "rgba16float", dimension: '2d',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        });
        this.lockInputLuma                  = device.device.createTexture({
            size: { width: originWidth, height: originHeight },
            format: "r32float",
            usage:  GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING,
        });
        this.preparedInputColor                  = device.device.createTexture({
            size: { width: originWidth, height: originHeight },
            format: "rgba16float",
            usage:  GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING,
        });
        this.newLocks                       = device.device.createTexture({
            size: { width: originWidth, height: originHeight },
            format: "r32float",
            usage:  GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING,
        });
        this.dilatedReactiveMasks           = device.device.createTexture({
            size: { width: originWidth, height: originHeight },
            format: "rgba16float",
            usage:  GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING,
        });
        this.lockStatus                     = device.device.createTexture({
            size: { width: originWidth, height: originHeight },
            format: "r32float",
            usage:  GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING,
        });
        this.rPreviousDisplayBuffer = device.device.createTexture({
            size: { width: device.canvas.width, height: device.canvas.height, },
            format: 'rgba16float', dimension: '2d',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        });
        this.wPreviousDisplayBuffer = device.device.createTexture({
            size: { width: device.canvas.width, height: device.canvas.height, },
            format: 'rgba16float', dimension: '2d',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_SRC,
        });
        this.rawDisplay= device.device.createTexture({
            size: { width: device.canvas.width, height: device.canvas.height, },
            format: "rgba16float",
            usage:  GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING,
        });
        this.AADisplay= device.device.createTexture({
            size: { width: device.canvas.width, height: device.canvas.height, },
            format: "rgba16float",
            usage:  GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING,
        });
        this.currentAAFrameBuffer=device.device.createBuffer({
            size: 2 * 4 * originWidth * originHeight,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
        });
    }

    FXAA_PASS_init(device: webGPUDevice, buffers: BufferPool, camera: CameraManager){
        if(this.ENABLE_SR && this.FXAA_RENDER){
            this.currentFrameBuffer=this.currentAAFrameBuffer;
        }
        else{
            this.currentFrameBuffer=this.currentFrameBuffer_bk;
        }
        this.FXAA_renderBindGroupLayout = device.device.createBindGroupLayout({
            entries: [
                {//rawcolor
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'storage', },
                },
                {//AAcolor
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'storage', },
                },                                                                                             
            ],
        });
        this.FXAA_renderBindGroupEntries = [            
            { binding: 0, resource: { buffer: this.rawFrameBuffer, },},
            { binding: 1, resource: { buffer: this.currentAAFrameBuffer, }, },     
        ]
        this.FXAA_renderPipelineLayout = device.device.createPipelineLayout({
            bindGroupLayouts: [this.FXAA_renderBindGroupLayout],
        });
        this.FXAA_renderPipeline = device.device.createComputePipeline({
            layout: this.FXAA_renderPipelineLayout,
            compute: {
                module: device.device.createShaderModule({
                    label: 'FXAA.wgsl',
                    code: shaders.get('FXAA.wgsl'),
                }),
                entryPoint: 'main',
                constants: {
                    _renderWidth  :this.rendering_width ,
                    _renderHeight :this.rendering_height,
                }
            },
        });
    }

    Reconstruct_dilated_PASS_init(device: webGPUDevice, buffers: BufferPool, camera: CameraManager)
    {
        
        this.reconstruct_dilatedBindGroupLayout = device.device.createBindGroupLayout({
            entries: [
                {// camera jitter
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'uniform', },
                },
                {//samp
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    sampler: {}
                },
                {//currentFrame
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'storage', },
                },
                {//previousFrame
                    binding: 3,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'storage', },
                },
                {//motionVec
                    binding: 4,
                    visibility: GPUShaderStage.COMPUTE,
                    texture: { sampleType: 'uint', },
                },
                {//depthBuffer
                    binding: 5,
                    visibility: GPUShaderStage.COMPUTE,
                    texture: { sampleType: 'depth', }
                },
                {//dilatedDepth
                    binding: 6,
                    visibility: GPUShaderStage.COMPUTE,
                    storageTexture: {
                        access: 'write-only',
                        format: 'r32float',
                    },
                },
                {// reconstructedPreviousDepth
                    binding: 7,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'storage', },
                },
                {//dilatedMotionVectors
                    binding: 8,
                    visibility: GPUShaderStage.COMPUTE,
                    storageTexture: {
                        access: 'write-only',
                        format: 'rgba16float',
                    },
                },
                {//lockInputLuma
                    binding: 9,
                    visibility: GPUShaderStage.COMPUTE,
                    storageTexture: {
                        access: 'write-only',
                        format: 'r32float',
                    },
                },
                {//depthBuffer
                    binding: 10,
                    visibility: GPUShaderStage.COMPUTE,
                    texture: { sampleType: 'depth', }
                },                                                                                                  
            ],
        });
        this.reconstruct_dilatedBindGroupEntries = [            
            { binding: 0, resource: { buffer: this.camera.jitter, },},
            { binding: 1, resource: this.sampler, },
            { binding: 2, resource: { buffer: this.currentFrameBuffer, }, },
            { binding: 3, resource: { buffer: this.previousFrameBuffer,}, },
            { binding: 4, resource: this.motionVec.createView(), },
            { binding: 5, resource: this.depthTexture.createView(), },
            { binding: 6, resource: this.dilatedDepth .createView(), },
            //{ binding: 7, resource: this.reconstructedPreviousDepth .createView(), },
            { binding: 7, resource: { buffer: this.reconstructedPreviousDepth, }, },
            { binding: 8, resource: this.dilatedMotionVectors .createView(), },
            // { binding: 9, resource: this.previousDilatedMotionVectors .createView(), },
            { binding: 9, resource:this.lockInputLuma.createView(), },   
            { binding: 10, resource: this.previousDepthTexture.createView(), }         
        ]
        this.reconstruct_dilatedPipelineLayout = device.device.createPipelineLayout({
            bindGroupLayouts: [this.reconstruct_dilatedBindGroupLayout],
        });
        this.reconstruct_dilatedPipeline = device.device.createComputePipeline({
            layout: this.reconstruct_dilatedPipelineLayout,
            compute: {
                module: device.device.createShaderModule({
                    label: 'reconstruct_dilated.wgsl',
                    code: shaders.get('reconstruct_dilated.wgsl'),
                }),
                entryPoint: 'main',
                constants: {
                    zNear: camera.camera.near,
                    zFar: camera.camera.far,
                    _renderWidth  :this.rendering_width ,
                    _renderHeight :this.rendering_height,
                    _displayWidth :this.display_width  ,
                    _displayHeight:this.display_height ,
                }
            },
        });
        
    }

    DepthClip_PASS_init(device: webGPUDevice, buffers: BufferPool, camera: CameraManager){
        this.depthClipBindGroupLayout = device.device.createBindGroupLayout({
            entries: [
                {// camera jitter
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'uniform', },
                },
                {//samp
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    sampler: {}
                },
                {//currentFrame
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'storage', },
                },
                {// preparedInputColor
                    binding: 3,
                    visibility: GPUShaderStage.COMPUTE,
                    storageTexture: {
                        access: 'write-only',
                        format: 'rgba16float',
                    },
                },
                {//motionVec
                    binding: 4,
                    visibility: GPUShaderStage.COMPUTE,
                    texture: { sampleType: 'uint', },
                },
                {//depthBuffer
                    binding: 5,
                    visibility: GPUShaderStage.COMPUTE,
                    texture: { sampleType: 'depth', }
                },
                {//dilatedDepth
                    binding: 6,
                    visibility: GPUShaderStage.COMPUTE,
                    texture: { sampleType: 'unfilterable-float', }
                },
                // {// reconstructedPreviousDepth
                //     binding: 7,
                //     visibility: GPUShaderStage.COMPUTE,
                //     texture: { sampleType: "depth", }
                // },
                {// reconstructedPreviousDepth
                    binding: 7,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'storage', },
                },
                {//dilatedMotionVectors
                    binding: 8,
                    visibility: GPUShaderStage.COMPUTE,
                    texture: { sampleType: 'float', },
                },
                {//previousDilatedMotionVectors
                    binding: 9,
                    visibility: GPUShaderStage.COMPUTE,
                    texture: { sampleType: 'float', },
                    //texture: { sampleType: 'unfilterable-float', },
                },
                {//dilatedReactiveMasks
                    binding: 10,
                    visibility: GPUShaderStage.COMPUTE,
                    storageTexture: {
                        access: 'write-only',
                        format: 'rgba16float',
                    },
                },


            ],
        });

        this.depthClipBindGroupEntries = [            
            { binding: 0, resource: { buffer: this.camera.jitter, },},
            { binding: 1, resource: this.sampler, },
            { binding: 2, resource: { buffer: this.currentFrameBuffer, }, },
            { binding: 3, resource: this.preparedInputColor.createView(), },
            { binding: 4, resource: this.motionVec.createView(), },
            { binding: 5, resource: this.depthTexture.createView(), },
            { binding: 6, resource: this.dilatedDepth .createView(), },
            //{ binding: 7, resource: this.previousDepthTexture.createView(), },
            { binding: 7, resource: { buffer: this.reconstructedPreviousDepth, }, },
            { binding: 8, resource: this.dilatedMotionVectors .createView(), },
            { binding: 9, resource:this.previousDilatedMotionVectors .createView(), },   
            { binding: 10, resource:this.dilatedReactiveMasks.createView(), },      
        ]
        this.depthClipPipelineLayout = device.device.createPipelineLayout({
            bindGroupLayouts: [this.depthClipBindGroupLayout],
        });
        this.depthClipPipeline = device.device.createComputePipeline({
            layout: this.depthClipPipelineLayout,
            compute: {
                module: device.device.createShaderModule({
                    label: 'depthClip.wgsl',
                    code: shaders.get('depthClip.wgsl'),
                }),
                entryPoint: 'main',
                constants: {
                    zNear: camera.camera.near,
                    zFar: camera.camera.far,
                    _renderWidth  :this.rendering_width ,
                    _renderHeight :this.rendering_height,
                    _displayWidth :this.display_width  ,
                    _displayHeight:this.display_height ,
                }
            },
        });
    }
    Lock_PASS_init(device: webGPUDevice, buffers: BufferPool, camera: CameraManager){
        this.lockBindGroupLayout = device.device.createBindGroupLayout({
            entries: [
                {// camera jitter
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'uniform', },
                },
                {//samp
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    sampler: {}
                },
                {//currentFrame
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'storage', },
                },
                {// lockInputLuma
                    binding: 3,
                    visibility: GPUShaderStage.COMPUTE,
                    texture: { sampleType: 'unfilterable-float', }
                },
                // {// reconstructedPreviousDepth
                //     binding: 4,
                //     visibility: GPUShaderStage.COMPUTE,
                //     storageTexture: {
                //         access: 'write-only',
                //         format: 'r32i32',
                //     },
                // },
                {// reconstructedPreviousDepth
                    binding: 4,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'storage', },
                },
                {//newLocks
                    binding: 5,
                    visibility: GPUShaderStage.COMPUTE,
                    storageTexture: {
                        access: 'write-only',
                        format: 'r32float',
                    },
                },
                // {//dilatedDepth
                //     binding: 6,
                //     visibility: GPUShaderStage.COMPUTE,
                //     texture: { sampleType: 'unfilterable-float', }
                // },


            ],
        });

        this.lockBindGroupEntries = [            
            { binding: 0, resource: { buffer: this.camera.jitter, },},
            { binding: 1, resource: this.sampler, },
            { binding: 2, resource: { buffer: this.currentFrameBuffer, }, },
            { binding: 3, resource: this.lockInputLuma .createView(), },
            //{ binding: 4, resource: this.reconstructedPreviousDepth.createView(), },
            { binding: 4, resource: { buffer: this.reconstructedPreviousDepth, }, },
            { binding: 5, resource: this.newLocks.createView(), },
        ]
        this.lockPipelineLayout = device.device.createPipelineLayout({
            bindGroupLayouts: [this.lockBindGroupLayout],
        });
        this.lockPipeline = device.device.createComputePipeline({
            layout: this.lockPipelineLayout,
            compute: {
                module: device.device.createShaderModule({
                    label: 'lock.wgsl',
                    code: shaders.get('lock.wgsl'),
                }),
                entryPoint: 'main',
                constants: {
                    zNear: camera.camera.near,
                    zFar: camera.camera.far,
                    _renderWidth  :this.rendering_width ,
                    _renderHeight :this.rendering_height,
                    _displayWidth :this.display_width  ,
                    _displayHeight:this.display_height ,
                }
            },
        });
    }
    Upsample_PASS_init(device: webGPUDevice, buffers: BufferPool, camera: CameraManager)
    {
        
        this.displayBindGroupLayout = device.device.createBindGroupLayout({
            entries: [
                {// camera jitter
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'uniform', },
                },
                {//samp
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    sampler: {}
                },
                {// rawDisplay  currentDisplay 
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    storageTexture: {
                        access: 'write-only',
                        //format: device.format,
                        format: 'rgba16float',
                    },
                },
                {//rPreviousDisplay
                    binding: 3,
                    visibility: GPUShaderStage.COMPUTE,
                    texture: {},
                },
                {//wPreviousDisplay
                    binding: 4,
                    visibility: GPUShaderStage.COMPUTE,
                    storageTexture: {
                        access: 'write-only',
                        format: 'rgba16float',
                    },
                },
                {//motionVec
                    binding: 5,
                    visibility: GPUShaderStage.COMPUTE,
                    texture: { sampleType: 'uint', },
                },
                {//currentFrame
                    binding: 6,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'storage', },
                },
                {//preparedInputColor: 
                    binding: 7,
                    visibility: GPUShaderStage.COMPUTE,
                    texture: { sampleType: 'float', }
                },
                {//dilatedReactiveMasks
                    binding: 8,
                    visibility: GPUShaderStage.COMPUTE,
                    texture: { sampleType: 'float', }
                    //texture: { sampleType: 'unfilterable-float', }
                },                
                {//newLocks
                    binding: 9,
                    visibility: GPUShaderStage.COMPUTE,
                    storageTexture: {
                        access: 'read-write',
                        format: 'r32float',
                    },
                },
                {//newLocks
                    binding: 10,
                    visibility: GPUShaderStage.COMPUTE,
                    storageTexture: {
                        access: 'read-write',
                        format: 'r32float',
                    },
                },
                {//lumahistory
                    binding: 11,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'storage', },
                },
            ],
        });
        this.displayBindGroupEntries = [
            { binding: 0, resource: { buffer: this.camera.jitter, },},
            { binding: 1, resource: this.sampler, },
            { binding: 2, resource: this.rawDisplay.createView(), },
            //{ binding: 2, resource: this.device.context.getCurrentTexture().createView(), },
            { binding: 3, resource: this.rPreviousDisplayBuffer.createView(), },
            { binding: 4, resource: this.wPreviousDisplayBuffer.createView(), },        
            { binding: 5, resource: this.motionVec.createView(), },
            { binding: 6, resource: { buffer: this.currentFrameBuffer, }, },
            { binding: 7, resource: this.preparedInputColor.createView(), },
            { binding: 8, resource: this.dilatedReactiveMasks .createView(), },
            { binding: 9, resource: this.newLocks.createView(), },
            { binding: 10, resource: this.lockStatus.createView(), },
            { binding: 11, resource: { buffer: this.LumaHistory, }, },
            
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
                    _renderWidth  :this.rendering_width ,
                    _renderHeight :this.rendering_height,
                    _displayWidth :this.display_width  ,
                    _displayHeight:this.display_height ,
                }
            },
        });
    }

    RCAS_PASS_init(device: webGPUDevice, buffers: BufferPool, camera: CameraManager){
        this.racsBindGroupLayout = device.device.createBindGroupLayout({
            entries: [
                {// camera jitter
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'uniform', },
                },
                {//samp
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    sampler: {}
                },
                {// rawDisplay 
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    texture: { sampleType: 'unfilterable-float', }
                },
                {// currentDisplay 
                    binding: 3,
                    visibility: GPUShaderStage.COMPUTE,
                    storageTexture: {
                        access: 'write-only',
                        format: device.format,
                    },
                },
            ],
        });
        this.racsBindGroupEntries = [
            { binding: 0, resource: { buffer: this.camera.jitter, },},
            { binding: 1, resource: this.sampler, },
            { binding: 2, resource: this.rawDisplay.createView(), },
            { binding: 3, resource: this.device.context.getCurrentTexture().createView(), },
        ]
        this.racsPipelineLayout = device.device.createPipelineLayout({
            bindGroupLayouts: [this.racsBindGroupLayout],
        });
        this.racsPipeline = device.device.createComputePipeline({
            layout: this.racsPipelineLayout,
            compute: {
                module: device.device.createShaderModule({
                    label: 'racs.wgsl',
                    code: shaders.get('racs.wgsl').replace('displayFormat', device.format),
                }),
                entryPoint: 'main',
                constants: {
                    zNear: camera.camera.near,
                    zFar: camera.camera.far,
                    _renderWidth  :this.rendering_width ,
                    _renderHeight :this.rendering_height,
                    _displayWidth :this.display_width  ,
                    _displayHeight:this.display_height ,
                }
            },
        });
    }

    Raw_display_init(device: webGPUDevice, buffers: BufferPool, camera: CameraManager){
        this.previousDisplayBuffer= buffers.previousDisplayBuffer;
        this.rawBindGroupLayout = device.device.createBindGroupLayout({
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
        this.bindGroupEntries = [
            { binding: 0, resource: this.device.context.getCurrentTexture().createView(), },
            { binding: 1, resource: this.previousDisplayBuffer.createView(), },
            { binding: 2, resource: this.sampler, },
            { binding: 3, resource: this.motionVec.createView(), },
            { binding: 4, resource: this.depthTexture.createView(), },
            { binding: 5, resource: { buffer: this.currentFrameBuffer }, },
            { binding: 6, resource: { buffer: this.previousFrameBuffer }, },
        ]
        this.rawPipelineLayout = device.device.createPipelineLayout({
            bindGroupLayouts: [this.rawBindGroupLayout],
        });
        this.rawPipeline = device.device.createComputePipeline({
            layout: this.rawPipelineLayout,
            compute: {
                module: device.device.createShaderModule({
                    label: 'raw_display.wgsl',
                    code: shaders.get('raw_display.wgsl').replace('displayFormat', device.format),
                }),
                entryPoint: 'main',
                constants: {
                    zNear: camera.camera.near,
                    zFar: camera.camera.far,
                }
            },
        });
    }
    constructor(device: webGPUDevice, buffers: BufferPool, camera: CameraManager) {
        this.device = device;
        this.camera=camera;
        this.motionVec = buffers.motionVec;
        this.depthTexture = buffers.depthTexture;
        this.previousDepthTexture=buffers.previousDepthTexture;
        this.currentFrameBuffer = buffers.currentFrameBuffer;
        this.previousFrameBuffer = buffers.previousFrameBuffer;
        this.currentFrameBuffer_bk=buffers.currentFrameBuffer;
        this.sampler = device.device.createSampler({
            addressModeU: "clamp-to-edge",
            addressModeV: "clamp-to-edge",
            magFilter: "nearest",
            minFilter: "nearest",
        });
        this.liner_sampler = device.device.createSampler({
            addressModeU: "mirror-repeat",
            addressModeV: "mirror-repeat",
            magFilter: "linear",
            minFilter: "linear",
        });


        
        this.FSR_init(device, buffers, camera);
        this.rawFrameBuffer=buffers.currentFrameBuffer;
        this.FXAA_PASS_init(device, buffers, camera);
        this.Reconstruct_dilated_PASS_init(device, buffers, camera);
        this.DepthClip_PASS_init(device, buffers, camera);
        this.Lock_PASS_init(device, buffers, camera);
        this.Upsample_PASS_init(device, buffers, camera);
        this.RCAS_PASS_init(device, buffers, camera);
        this.Raw_display_init(device, buffers, camera);
    }

    record(commandEncoder: GPUCommandEncoder) {
        if(this.ENABLE_SR){
            if(this.FXAA_RENDER){
                this.currentFrameBuffer=this.currentAAFrameBuffer;
                this.FXAA_renderBindGroup = this.device.device.createBindGroup({
                    layout: this.FXAA_renderBindGroupLayout,
                    entries: this.FXAA_renderBindGroupEntries,
                });
                const FXAA_renderpassEncoder = commandEncoder.beginComputePass();
                FXAA_renderpassEncoder.setPipeline(this.FXAA_renderPipeline);
                FXAA_renderpassEncoder.setBindGroup(0, this.FXAA_renderBindGroup);
                FXAA_renderpassEncoder.dispatchWorkgroups(Math.ceil(this.rendering_width/8), Math.ceil(this.rendering_height/8), 1);
                FXAA_renderpassEncoder.end();
            }
            else{
                this.currentFrameBuffer=this.currentFrameBuffer_bk;
            }
    
            this.reconstruct_dilatedBindGroup = this.device.device.createBindGroup({
                layout: this.reconstruct_dilatedBindGroupLayout,
                entries: this.reconstruct_dilatedBindGroupEntries,
            });
            const dilated_passEncoder = commandEncoder.beginComputePass();
            dilated_passEncoder.setPipeline(this.reconstruct_dilatedPipeline);
            dilated_passEncoder.setBindGroup(0, this.reconstruct_dilatedBindGroup);
            dilated_passEncoder.dispatchWorkgroups(Math.ceil(this.rendering_width/8), Math.ceil(this.rendering_height/8), 1);
            dilated_passEncoder.end();
        
            this.depthClipBindGroup = this.device.device.createBindGroup({
                layout: this.depthClipBindGroupLayout,
                entries: this.depthClipBindGroupEntries,
            });
            const depthClip_passEncoder = commandEncoder.beginComputePass();
            depthClip_passEncoder.setPipeline(this.depthClipPipeline);
            depthClip_passEncoder.setBindGroup(0, this.depthClipBindGroup);
            depthClip_passEncoder.dispatchWorkgroups(Math.ceil(this.rendering_width/8), Math.ceil(this.rendering_height/8), 1);
            depthClip_passEncoder.end();

            this.lockBindGroup = this.device.device.createBindGroup({
                layout: this.lockBindGroupLayout,
                entries: this.lockBindGroupEntries,
            });
            const lock_passEncoder = commandEncoder.beginComputePass();
            lock_passEncoder.setPipeline(this.lockPipeline);
            lock_passEncoder.setBindGroup(0, this.lockBindGroup);
            lock_passEncoder.dispatchWorkgroups(Math.ceil(this.rendering_width/8), Math.ceil(this.rendering_height/8), 1);
            lock_passEncoder.end();
    
            // //this.displayBindGroupEntries[2].resource = this.rawDisplay.createView();
            this.displayBindGroup = this.device.device.createBindGroup({
                layout: this.displayBindGroupLayout,
                entries: this.displayBindGroupEntries,
            });
            const display_passEncoder = commandEncoder.beginComputePass();
            display_passEncoder.setPipeline(this.displayPipeline);
            display_passEncoder.setBindGroup(0, this.displayBindGroup);
            display_passEncoder.dispatchWorkgroups(Math.ceil(this.device.canvas.width / 8), Math.ceil(this.device.canvas.height / 8), 1);
            display_passEncoder.end();

            //this.racsBindGroupEntries[2].resource = this.rawDisplay.createView();
            this.racsBindGroupEntries[3].resource = this.device.context.getCurrentTexture().createView();
            this.racsBindGroup = this.device.device.createBindGroup({
                layout: this.racsBindGroupLayout,
                entries: this.racsBindGroupEntries,
            });
            const racs_passEncoder = commandEncoder.beginComputePass();
            racs_passEncoder.setPipeline(this.racsPipeline);
            racs_passEncoder.setBindGroup(0, this.racsBindGroup);
            racs_passEncoder.dispatchWorkgroups(Math.ceil(this.device.canvas.width / 8), Math.ceil(this.device.canvas.height / 8), 1);
            racs_passEncoder.end();
        
            commandEncoder.copyTextureToTexture({ texture: this.dilatedMotionVectors, }, { texture: this.previousDilatedMotionVectors, },
                { width: this.rendering_width, height: this.rendering_height });
            commandEncoder.copyTextureToTexture({ texture: this.wPreviousDisplayBuffer, }, { texture: this.rPreviousDisplayBuffer, },
                { width: this.display_width, height: this.display_height, });
        }
        else{
                
            this.currentFrameBuffer=this.currentFrameBuffer_bk;
            this.bindGroupEntries[0].resource = this.device.context.getCurrentTexture().createView();
            this.rawBindGroup = this.device.device.createBindGroup({
                layout: this.rawBindGroupLayout,
                entries: this.bindGroupEntries,
            });
            const passEncoder = commandEncoder.beginComputePass();
            passEncoder.setPipeline(this.rawPipeline);
            passEncoder.setBindGroup(0, this.rawBindGroup);
            passEncoder.dispatchWorkgroups(Math.ceil(this.device.canvas.width / 8), Math.ceil(this.device.canvas.height / 8), 1);
            passEncoder.end();
        }

    }
}

export { Display };