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
        this.context.configure({ device: this.device, format: this.format, alphaMode: 'opaque' });
        return this;
    }
}

export { webGPUDevice };