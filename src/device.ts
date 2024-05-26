class webGPUDevice {
    canvas: HTMLCanvasElement;
    adapter: GPUAdapter;
    device: GPUDevice;
    context: GPUCanvasContext;
    format: GPUTextureFormat;
    upscaleRatio: number = 2;

    async init() {
        let size = { width: document.documentElement.clientWidth, height: document.documentElement.clientHeight };
        this.canvas = document.createElement('canvas');
        const devicePixelRatio = window.devicePixelRatio || 1;
        const p1080 = { width: 1920, height: 1080 };
        const p720 = { width: 1280, height: 720 };
        let vertical = false;
        if (size.width < size.height) {
            vertical = true;
        }
        if (vertical) {
            size = { width: size.height, height: size.width };
        }
        size.width *= devicePixelRatio;
        size.height *= devicePixelRatio;

        if (size.width > p1080.width || size.height > p1080.height) {
            size = p1080;
            console.log('1080p');
        } else {
            size = p720;
            console.log('720p');
        }

        if (vertical) {
            this.canvas.width = size.height;
            this.canvas.height = size.width;
            this.canvas.style.width = `${size.height / devicePixelRatio}px`;
            this.canvas.style.height = `${size.width / devicePixelRatio}px`;
        } else {
            this.canvas.width = size.width;
            this.canvas.height = size.height;
            this.canvas.style.width = `${size.width / devicePixelRatio}px`;
            this.canvas.style.height = `${size.height / devicePixelRatio}px`;
        }
        this.canvas.style.alignSelf = 'center';
        document.body.appendChild(this.canvas);

        if (!navigator.gpu) {
            alert('WebGPU may not supported in your browser');
            throw new Error('Not Support WebGPU')
        }
        let _ad = await navigator.gpu.requestAdapter({
            powerPreference: 'high-performance',
        })
        if (!_ad) {
            alert('No Adapter Found');
            throw new Error('No Adapter Found');
        }
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
        if (!_de) {
            alert('No Device Found');
            throw new Error('No Device Found');
        }
        this.device = _de as GPUDevice;

        let _context = this.canvas.getContext('webgpu') as GPUCanvasContext;
        if (!_context) {
            alert('No GPUContext Found');
            throw new Error('No GPUContext Found')
        } this.context = _context;

        this.format = supFeature ? navigator.gpu.getPreferredCanvasFormat() : 'rgba8unorm';

        if (devicePixelRatio >= 3) this.upscaleRatio = 3;

        this.context.configure({
            device: this.device, format: this.format, alphaMode: 'opaque',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_SRC,
        });
        return this;
    }
}

export { webGPUDevice };