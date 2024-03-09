// import * as THREE from 'three'
// import { OrbitControls } from 'three/examples/jsm/Addons.js'

import DISPLAY_VERTEX from './shaders/display/display.vert.wgsl?raw'
import DISPLAY_FRAG from './shaders/display/display.frag.wgsl?raw'

class webGPUDevice {
    canvas?: HTMLCanvasElement;
    adapter?: GPUAdapter;
    device?: GPUDevice;
    context?: GPUCanvasContext;
    format?: GPUTextureFormat;
    size?: { width: number, height: number };
    async init(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        if (!navigator.gpu)
            throw new Error('Not Support WebGPU')
        let _ad = await navigator.gpu.requestAdapter({
            powerPreference: 'high-performance',
        })
        if (!_ad) throw new Error('No Adapter Found')
        this.adapter = _ad as GPUAdapter;
        let _de = await this.adapter.requestDevice({
            requiredLimits: {
                maxStorageBufferBindingSize: this.adapter.limits.maxStorageBufferBindingSize,
            }
        });
        if (!_de) throw new Error('No Device Found')
        this.device = _de as GPUDevice;

        let _context = this.canvas.getContext('webgpu') as GPUCanvasContext;
        if (!_context) throw new Error('No GPUContext Found')
        this.context = _context;

        this.format = navigator.gpu.getPreferredCanvasFormat();
        const devicePixelRatio = window.devicePixelRatio || 1;
        canvas.width = canvas.clientWidth * devicePixelRatio;
        canvas.height = canvas.clientHeight * devicePixelRatio;
        this.size = { width: canvas.width, height: canvas.height };
        this.context.configure({
            device: this.device,
            format: this.format,
            alphaMode: 'opaque'
        });
        return this;
    }
}

class Application {
    device: webGPUDevice;
    displayPipeline?: GPURenderPipeline;
    constructor() {
        this.device = new webGPUDevice();
        this.device.init(document.getElementById('canvas') as HTMLCanvasElement);
        this.displayPipelineInit();
    }

    displayPipelineInit() {
        this.displayPipeline = this.device.device!.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: this.device.device!.createShaderModule({
                    code: DISPLAY_VERTEX,
                }),
                entryPoint: "main",
            },
            fragment: {
                module: this.device.device!.createShaderModule({
                    code: DISPLAY_FRAG,
                }),
                entryPoint: "main",
                targets: [
                    {
                        format: this.device.format!,
                    },
                ],
            },
            primitive: {
                topology: 'triangle-list',
                frontFace: "ccw",
                cullMode: "none",
            },
        });
    }

    async init() {

    }
}