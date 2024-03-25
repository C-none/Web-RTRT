import { gltfmodel } from "./gltf";
import { webGPUDevice } from "./util/device";
import { CameraManager } from "./camera";
import { shaders } from "./shaders/manager";

class rayTracing {
    device: webGPUDevice;
    model: gltfmodel;
    camera: CameraManager;
    outputTexture: GPUTexture;

    bindGroupLayout: GPUBindGroupLayout;
    bindingGroup: GPUBindGroup;
    pipeline: GPUComputePipeline;

    constructor(device: webGPUDevice, model: gltfmodel, outputTexture: GPUTexture) {
        this.device = device;
        this.model = model;
        this.camera = new CameraManager(device);
        this.outputTexture = outputTexture;
    }

    private buildBindGroupLayout(device: GPUDevice) {
        this.bindGroupLayout = device.createBindGroupLayout({
            entries: [
                {// output texture
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    storageTexture: {
                        access: 'write-only',
                        format: this.outputTexture.format,
                    },
                },
                {// camera buffer
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: 'uniform',
                    },
                },
                {// BVH buffer
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: 'read-only-storage',
                    },
                },
                {// vertex buffer
                    binding: 3,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: 'read-only-storage',
                    },
                },
                {// index buffer
                    binding: 4,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: 'read-only-storage',
                    },
                },
            ]
        });
    }
    private buildBindGroup(device: GPUDevice) {
        this.bindingGroup = device.createBindGroup({
            layout: this.bindGroupLayout,
            entries: [
                {// output texture
                    binding: 0,
                    resource: this.outputTexture.createView(),
                },
                {// camera buffer
                    binding: 1,
                    resource: {
                        buffer: this.camera.cameraBuffer,
                    },
                },
                {// BVH buffer
                    binding: 2,
                    resource: {
                        buffer: this.model.bvhBuffer,
                    },
                },
                {// vertex buffer
                    binding: 3,
                    resource: {
                        buffer: this.model.vertexBuffer,
                    },
                },
                {// index buffer
                    binding: 4,
                    resource: {
                        buffer: this.model.indexBuffer,
                    },
                },
            ]
        });
    }
    private async buildPipeline(device: GPUDevice) {
        const computeShaderModule = device.createShaderModule({
            label: 'rayGen.wgsl',
            code: shaders.get("rayGen.wgsl").replace(/TREE_DEPTH/g, this.model.bvh.maxDepth.toString() + 'u'),
        });
        // console.log(shaders.get("rayGen.wgsl").replace(/TREE_DEPTH/g, this.model.bvh.maxDepth.toString() + 'u'));

        this.pipeline = await device.createComputePipelineAsync({
            layout: device.createPipelineLayout({
                bindGroupLayouts: [this.bindGroupLayout],
            }),
            compute: {
                module: computeShaderModule,
                entryPoint: 'main',
            }
        });
    }
    async init() {
        this.buildBindGroupLayout(this.device.device);
        this.buildBindGroup(this.device.device);
        await this.buildPipeline(this.device.device);
    }
    async record(commandEncoder: GPUCommandEncoder) {
        // update camera buffer
        this.camera.update();

        const passEncoder = commandEncoder.beginComputePass();
        passEncoder.setPipeline(this.pipeline);
        passEncoder.setBindGroup(0, this.bindingGroup);
        passEncoder.dispatchWorkgroups(Math.ceil(this.outputTexture.width / 8), Math.ceil(this.outputTexture.height / 8), 1);
        passEncoder.end();
    }
}

export { rayTracing };