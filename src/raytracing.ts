import { gltfmodel } from "./gltf";
import { webGPUDevice } from "./util/device";

class rayTracing {
    device: webGPUDevice;
    model: gltfmodel;
    outputTexture: GPUTexture;

    bindGroupLayout: GPUBindGroupLayout;
    bindingGroup: GPUBindGroup;
    pipeline: GPURenderPipeline;

    constructor(device: webGPUDevice, model: gltfmodel, outputTexture: GPUTexture) {
        this.device = device;
        this.model = model;
        this.outputTexture = outputTexture;
    }

    buildBindGroupLayout(device: GPUDevice) {
        this.bindGroupLayout = device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "storage"
                    }
                }
            ]
        });
    }
}

export { rayTracing };