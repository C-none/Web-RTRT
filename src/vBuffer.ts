import { gltfmodel } from "./gltf";
import { webGPUDevice } from "./device";
import { CameraManager } from "./camera";
import { BufferPool } from "./screenBuffer";
import { shaders } from "./shaders/manager";

class VBuffer {
    device: webGPUDevice;
    model: gltfmodel;
    camera: CameraManager;
    vBuffer: GPUTexture;
    depthTexture: GPUTexture;
    sampler: GPUSampler;

    bindGroupLayout: GPUBindGroupLayout;
    bindingGroup: GPUBindGroup;
    pipeline: GPURenderPipeline;
    renderBundle: GPURenderBundle;

    constructor(device: webGPUDevice, model: gltfmodel, cameraManager: CameraManager, buffers: BufferPool) {
        this.device = device;
        this.model = model;
        this.camera = cameraManager;
        this.vBuffer = buffers.vBuffer;
        this.depthTexture = buffers.depthTexture;
        this.sampler = this.device.device.createSampler({
            addressModeU: "mirror-repeat",
            addressModeV: "mirror-repeat",
            magFilter: "linear",
            minFilter: "linear",
            // mipmapFilter: "linear",
            // maxAnisotropy: 16,
        });

    }
    buildBindGroupLayout() {
        this.bindGroupLayout = this.device.device.createBindGroupLayout({
            entries: [
                {// camera
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {
                        type: 'uniform',
                    }
                },
                {// albedo map
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {
                        sampleType: "float",
                        viewDimension: "2d-array",
                    }
                },
                {// sampler
                    binding: 2,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: {
                        type: 'filtering',
                    }
                },
            ]

        });
    }
    buildBindingGroup() {
        this.bindingGroup = this.device.device.createBindGroup({
            layout: this.bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.camera.cameraBuffer,
                    },
                },
                {
                    binding: 1,
                    resource: this.model.albedo.texture.createView(
                        {
                            dimension: '2d-array',
                            baseArrayLayer: 0,
                            arrayLayerCount: Math.max(this.model.albedo.Storages.length, 1),
                        }
                    ),
                },
                {
                    binding: 2,
                    resource: this.sampler,
                },
            ]
        });
    }
    buildPipeline() {
        const module = this.device.device.createShaderModule({
            label: 'vBuffer',
            code: shaders.get('vBuffer.wgsl'),

        });
        this.pipeline = this.device.device.createRenderPipeline({
            label: 'vBuffer',
            layout: this.device.device.createPipelineLayout({
                bindGroupLayouts: [this.bindGroupLayout],
            }),
            vertex: {
                module: module,
                entryPoint: 'vs',
                buffers: [
                    {
                        // position
                        arrayStride: 4 * 4,
                        attributes: [
                            {
                                shaderLocation: 0,
                                offset: 0,
                                format: 'float32x4',
                            },
                        ],
                    },
                    {
                        //geometry
                        arrayStride: 16 * 4,
                        attributes: [
                            {
                                // albedo map
                                shaderLocation: 1,
                                offset: 0,
                                format: 'uint16x4',
                            },
                            {   // uv
                                shaderLocation: 2,
                                offset: 4 * 12,
                                format: 'float32x2',
                            },
                        ],

                    }
                ],
            },
            fragment: {
                module: module,
                entryPoint: 'fs',
                targets: [{ format: this.vBuffer.format, },],
                constants: {
                    width: this.device.canvas.width,
                    height: this.device.canvas.height,
                },
            },
            primitive: {
                topology: 'triangle-list',
                cullMode: 'none',
                unclippedDepth: false,
            },
            depthStencil: {
                format: 'depth32float',
                depthWriteEnabled: true,
                depthCompare: 'less',

            }
        });
    }

    async init() {
        this.buildBindGroupLayout();
        this.buildBindingGroup();
        this.buildPipeline();
    }

    record(commandEncoder: GPUCommandEncoder) {
        const passEncoder = commandEncoder.beginRenderPass({
            colorAttachments: [
                {
                    view: this.vBuffer.createView(),
                    clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                    loadOp: 'clear',
                    storeOp: 'store',
                },
            ],
            depthStencilAttachment: {
                view: this.depthTexture.createView(),
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
            },
        });
        passEncoder.setPipeline(this.pipeline);
        passEncoder.setBindGroup(0, this.bindingGroup);
        passEncoder.setVertexBuffer(0, this.model.vertexBuffer);
        passEncoder.setVertexBuffer(1, this.model.geometryBuffer);
        passEncoder.setIndexBuffer(this.model.indexBuffer, 'uint32');
        for (let i = 0; i < this.model.meshes.length; i++) {
            const mesh = this.model.meshes[i];
            if (this.camera.checkFrustum(mesh.boundingSphere)) {
                passEncoder.drawIndexed(mesh.primitiveCount * 3, 1, mesh.primitiveOffset * 3);
            }
        }
        passEncoder.end();
    }

}

export { VBuffer };