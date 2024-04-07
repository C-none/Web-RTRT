import { gltfmodel } from "./gltf";
import { webGPUDevice } from "./device";
import { CameraManager } from "./camera";
import { BufferPool } from "./screenBuffer";
import { shaders } from "./shaders/manager";

class rayTracing {
    device: webGPUDevice;
    model: gltfmodel;
    camera: CameraManager;

    vBuffer: GPUTexture;
    outputTexture: GPUTexture;
    sampler: GPUSampler;

    bindGroupLayout: GPUBindGroupLayout;
    bindingGroup: GPUBindGroup;
    pipeline: GPUComputePipeline;

    constructor(device: webGPUDevice, model: gltfmodel, cameraManager: CameraManager, buffers: BufferPool) {
        this.device = device;
        this.model = model;
        this.camera = cameraManager;
        this.vBuffer = buffers.vBuffer;
        this.outputTexture = buffers.currentFrameBuffer;
        this.sampler = this.device.device.createSampler({
            addressModeU: "mirror-repeat",
            addressModeV: "mirror-repeat",
            magFilter: "linear",
            minFilter: "linear",
        });
    }

    private buildBindGroupLayout() {
        this.bindGroupLayout = this.device.device.createBindGroupLayout({
            entries: [
                {// output texture
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    storageTexture: { access: 'write-only', format: this.outputTexture.format, },
                },
                {// camera buffer
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'uniform', },
                },
                {// BVH buffer
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'read-only-storage', },
                },
                {// vertex buffer
                    binding: 3,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'read-only-storage', },
                },
                {// index buffer
                    binding: 4,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'read-only-storage', },
                },
                {// geometry buffer
                    binding: 5,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'read-only-storage', },
                },
                {// albedo map
                    binding: 6,
                    visibility: GPUShaderStage.COMPUTE,
                    texture: { sampleType: "float", viewDimension: "2d-array", }
                },
                {// normal map
                    binding: 7,
                    visibility: GPUShaderStage.COMPUTE,
                    texture: { sampleType: "float", viewDimension: "2d-array", }
                },
                {// specularRoughness map
                    binding: 8,
                    visibility: GPUShaderStage.COMPUTE,
                    texture: { sampleType: "float", viewDimension: "2d-array", }
                },
                {// visibility buffer
                    binding: 9,
                    visibility: GPUShaderStage.COMPUTE,
                    texture: { sampleType: 'uint', viewDimension: "2d", },
                },
                {// sampler
                    binding: 10,
                    visibility: GPUShaderStage.COMPUTE,
                    sampler: { type: 'filtering', },
                }
            ]
        });
    }
    private buildBindGroup() {
        this.bindingGroup = this.device.device.createBindGroup({
            layout: this.bindGroupLayout,
            entries: [
                {// output texture
                    binding: 0,
                    resource: this.outputTexture.createView(),
                },
                {// camera buffer
                    binding: 1,
                    resource: { buffer: this.camera.cameraBuffer, },
                },
                {// BVH buffer
                    binding: 2,
                    resource: { buffer: this.model.bvhBuffer, },
                },
                {// vertex buffer
                    binding: 3,
                    resource: { buffer: this.model.vertexBuffer, },
                },
                {// index buffer
                    binding: 4,
                    resource: { buffer: this.model.indexBuffer, },
                },
                {// geometry buffer
                    binding: 5,
                    resource: { buffer: this.model.geometryBuffer, },
                },
                {// albedo map
                    binding: 6,
                    resource: this.model.albedo.texture.createView(
                        {
                            dimension: '2d-array',
                            baseArrayLayer: 0,
                            arrayLayerCount: Math.max(this.model.albedo.Storages.length, 1),
                        }
                    ),
                },
                {// normal map
                    binding: 7,
                    resource: this.model.normalMap.texture.createView(
                        {
                            dimension: '2d-array',
                            baseArrayLayer: 0,
                            arrayLayerCount: Math.max(this.model.normalMap.Storages.length, 1),
                        }
                    ),
                },
                {// specularRoughness map
                    binding: 8,
                    resource: this.model.specularRoughnessMap.texture.createView(
                        {
                            dimension: '2d-array',
                            baseArrayLayer: 0,
                            arrayLayerCount: Math.max(this.model.specularRoughnessMap.Storages.length, 1),
                        }
                    ),
                },
                {// visibility buffer
                    binding: 9,
                    resource: this.vBuffer.createView(),
                },
                {// sampler
                    binding: 10,
                    resource: this.sampler,
                }
            ]
        });
    }
    private async buildPipeline() {
        const computeShaderModule = this.device.device.createShaderModule({
            label: 'rayGen.wgsl',
            code: shaders.get("rayGen.wgsl").replace(/TREE_DEPTH/g, this.model.bvhMaxDepth.toString() + 'u'),
        });

        this.pipeline = await this.device.device.createComputePipelineAsync({
            layout: this.device.device.createPipelineLayout({
                bindGroupLayouts: [this.bindGroupLayout],
            }),
            compute: {
                module: computeShaderModule,
                entryPoint: 'main',
            }
        });
    }
    async init() {
        this.buildBindGroupLayout();
        this.buildBindGroup();
        await this.buildPipeline();
    }
    async record(commandEncoder: GPUCommandEncoder) {
        const passEncoder = commandEncoder.beginComputePass();
        passEncoder.setPipeline(this.pipeline);
        passEncoder.setBindGroup(0, this.bindingGroup);
        passEncoder.dispatchWorkgroups(Math.ceil(this.outputTexture.width / 8), Math.ceil(this.outputTexture.height / 8), 1);
        passEncoder.end();
    }
}

export { rayTracing };