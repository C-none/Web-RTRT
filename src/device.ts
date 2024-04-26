class webGPUDevice {
    canvas: HTMLCanvasElement;
    adapter: GPUAdapter;
    device: GPUDevice;
    context: GPUCanvasContext;
    format: GPUTextureFormat;
    upscaleRatio: number = 1.7;

    async init(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        if (!navigator.gpu)
            throw new Error('Not Support WebGPU')
        let _ad = await navigator.gpu.requestAdapter({
            powerPreference: 'high-performance',
        })
        if (!_ad) throw new Error('No Adapter Found')
        this.adapter = _ad as GPUAdapter;
        // console.log('limits: ', this.adapter.limits);
        const supFeature = this.adapter.features.has('bgra8unorm-storage');
        let _de = await this.adapter.requestDevice({
            requiredLimits: {
                maxBufferSize: this.adapter.limits.maxBufferSize,
                maxStorageBufferBindingSize: this.adapter.limits.maxStorageBufferBindingSize,
                maxStorageBuffersPerShaderStage: this.adapter.limits.maxStorageBuffersPerShaderStage,

            },
            requiredFeatures: supFeature ? ['bgra8unorm-storage'] : [],
        });
        if (!_de) throw new Error('No Device Found')
        this.device = _de as GPUDevice;

        let _context = this.canvas.getContext('webgpu') as GPUCanvasContext;
        if (!_context) throw new Error('No GPUContext Found')
        this.context = _context;

        this.format = supFeature ? navigator.gpu.getPreferredCanvasFormat() : 'rgba8unorm';
        const devicePixelRatio = window.devicePixelRatio || 1;
        canvas.width = canvas.clientWidth * devicePixelRatio;
        canvas.height = canvas.clientHeight * devicePixelRatio;
        this.context.configure({
            device: this.device, format: this.format, alphaMode: 'opaque',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_SRC,
        });
        return this;
    }
}

export { webGPUDevice };