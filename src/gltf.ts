import * as THREE from 'three'
import { webGPUDevice } from './device';
import { LogOnScreen } from './utils';
import * as GPUUtils from 'webgpu-utils';
import computeWorker from './computeWorker.ts?worker';

class Geometry {
    position: Float32Array = new Float32Array();
    normal: Float32Array = new Float32Array();
    uv: Float32Array = new Float32Array();
    tangent: Float32Array = new Float32Array();
    indices: Uint32Array = new Uint32Array();
    constructor(geometry: THREE.BufferGeometry) {
        this.position = geometry.attributes.position.array as Float32Array;
        this.normal = geometry.attributes.normal.array as Float32Array;
        this.tangent = geometry.attributes.tangent.array as Float32Array;
        this.uv = geometry.attributes.uv.array as Float32Array;
        this.indices = geometry.index.array as Uint32Array;
    }
}

class Mesh {
    geometry: Geometry;
    boundingSphere: THREE.Sphere = new THREE.Sphere();
    TextureId: Uint32Array = new Uint32Array([
        0xffffffff,// baseColor
        0xffffffff,// normal
        0xffffffff,// specularRoughness
    ]);
    vertexOffset: number = 0;
    primitiveOffset: number = 0;
    vertexCount: number = 0;
    primitiveCount: number = 0;
    constructor(mesh: THREE.Mesh) {
        if (mesh.geometry.attributes.uv === undefined) {

            mesh.geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(mesh.geometry.attributes.position.count * 2), 2));
            // initialize uv with (0.5,0.5)
            let uv = mesh.geometry.attributes.uv.array as Float32Array;
            for (let i = 0; i < uv.length; i += 2) {
                uv[i] = uv[i + 1] = 0.5;
            }
        }
        if (mesh.geometry.attributes.tangent === undefined) {
            mesh.geometry.computeTangents();
        }
        mesh.geometry.computeBoundingSphere();
        this.boundingSphere = mesh.geometry.boundingSphere;
        this.vertexCount = mesh.geometry.attributes.position.count as number;
        this.primitiveCount = mesh.geometry.index.count / 3 as number;
        this.geometry = new Geometry(mesh.geometry);
    }

}

class textureManager {
    textureMap: Map<string, number> = new Map();
    Storages: Array<THREE.Texture> = [];
    texture: GPUTexture;
    Resolution: number = 4;

    static rszCtx: CanvasRenderingContext2D;

    add(texture: any): number {
        let retIndex = 0xffffffff;
        if (!texture) return retIndex;
        if (this.textureMap.has(texture.name)) {
            retIndex = this.textureMap.get(texture.name);
        } else {
            this.Resolution = Math.max(texture.source.data.height as number, this.Resolution);
            retIndex = this.textureMap.size;
            this.textureMap.set(texture.name, this.Storages.length);
            this.Storages.push(texture);
        }
        return retIndex;
    }
    async submit(device: webGPUDevice, textureFormat: GPUTextureFormat = 'rgba8unorm'): Promise<void> {
        // resize to the same resolution
        this.Resolution = Math.pow(2, Math.ceil(Math.log2(this.Resolution)));
        if (!textureManager.rszCtx) {
            let rszCanvas = document.createElement('canvas');
            rszCanvas.width = this.Resolution;
            rszCanvas.height = this.Resolution;
            textureManager.rszCtx = rszCanvas.getContext('2d');
        }
        for (let tex of this.Storages) {
            if (tex.source.data.width === this.Resolution && tex.source.data.height === this.Resolution) continue;
            textureManager.rszCtx.drawImage(tex.source.data, 0, 0, this.Resolution, this.Resolution);
            tex.source.data = await createImageBitmap(textureManager.rszCtx.getImageData(0, 0, this.Resolution, this.Resolution));
        }

        // create texture
        let textureUsage = GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT;
        this.texture = device.device.createTexture({
            label: 'Textures', format: textureFormat, usage: textureUsage,
            mipLevelCount: GPUUtils.numMipLevels([this.Resolution, this.Resolution]),
            size: {
                width: this.Resolution, height: this.Resolution,
                depthOrArrayLayers: Math.max(this.textureMap.size, 1),
            },
        });

        for (let tex of this.Storages) {
            device.device.queue.copyExternalImageToTexture(
                { source: tex.source.data, },
                { texture: this.texture, origin: { x: 0, y: 0, z: this.textureMap.get(tex.name) }, },
                { width: tex.source.data.width, height: tex.source.data.height, depthOrArrayLayers: 1, }
            );
        }
        GPUUtils.generateMipmap(device.device, this.texture);
    }
}


class gltfmodel {
    meshes: Array<Mesh> = [];
    albedo: textureManager = new textureManager();
    normalMap: textureManager = new textureManager();
    specularRoughnessMap: textureManager = new textureManager();
    vertexArray: Float32Array;
    indexArray: Uint32Array;
    bvhMaxDepth: number = 0;
    bvhBuffer: GPUBuffer;
    vertexBuffer: GPUBuffer;
    indexBuffer: GPUBuffer;
    geometryBuffer: GPUBuffer;
    rasterVtxBuffer: GPUBuffer;
    vertexSum: number = 0;
    triangleSum: number = 0;
    async init(model: any, device: webGPUDevice): Promise<void> {

        await this.loadModel(model);
        // this.loadTriangle();
        this.prepareRasterVtxBuffer(device);
        this.prepareVtxIdxArray();
        let finished1 = this.prepareBVH(device);
        this.albedo.submit(device, 'rgba8unorm-srgb');
        this.normalMap.submit(device);
        this.specularRoughnessMap.submit(device);
        this.allocateBuffer(device);
        this.writeBuffer();
        return new Promise(async (resolve, reject) => {
            await finished1;
            resolve();
        });
    }
    async loadModel(model: any): Promise<void> {

        // find mesh without normal map and delete it.
        model.traverse((child: THREE.Object3D) => {
            if (child instanceof THREE.Group) {
                for (let i = child.children.length - 1; i >= 0; i--) {
                    if (child.children[i] instanceof THREE.Mesh) {
                        let mesh = child.children[i] as THREE.Mesh;
                        let material = mesh.material as any;
                        // if (!material.map) {
                        //     console.log(child.children[i]);
                        //     child.children.splice(i, 1);
                        //     continue;
                        // }
                        mesh.geometry.scale(child.scale.x, child.scale.y, child.scale.z);
                    }
                }
            }
        });

        model.traverse((child: THREE.Object3D) => {
            if (child instanceof THREE.Mesh) {
                let mesh = new Mesh(child);
                mesh.vertexOffset = this.vertexSum;
                mesh.primitiveOffset = this.triangleSum;
                this.vertexSum += mesh.vertexCount;
                this.triangleSum += mesh.primitiveCount;

                mesh.TextureId[0] = this.albedo.add(child.material.map);
                mesh.TextureId[1] = this.normalMap.add(child.material.normalMap);
                mesh.TextureId[2] = this.specularRoughnessMap.add(child.material.metalnessMap);
                this.meshes.push(mesh);
            }
        });
    }

    loadTriangle(): void {
        let triangle = new Float32Array([
            -0.5, -0.5, 0.0,
            0.0, 0.5, 0.0,
            0.5, -0.5, 0.0,
        ]);
        let normals = new Float32Array([
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,
        ]);
        let uv = new Float32Array([
            0.0, 0.0,
            0.5, 1.0,
            1.0, 0.0,
        ]);
        let indices = new Uint32Array([0, 1, 2]);
        let BufferGeometry = new THREE.BufferGeometry();
        BufferGeometry.setAttribute('position', new THREE.BufferAttribute(triangle, 3));
        BufferGeometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
        BufferGeometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
        BufferGeometry.setIndex(new THREE.BufferAttribute(indices, 1));
        let mesh = new THREE.Mesh(BufferGeometry);
        let mymesh = new Mesh(mesh);
        mymesh.primitiveOffset = this.triangleSum;
        mymesh.vertexOffset = this.vertexSum;
        this.vertexSum += 3;
        this.triangleSum += 1;
        this.meshes.push(mymesh);

        triangle = new Float32Array([
            -0.5, -0.5, -1.0,
            0.0, 0.5, -1.0,
            0.5, -0.5, -1.0,
        ]);
        normals = new Float32Array([
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,
        ]);
        uv = new Float32Array([
            0.0, 0.0,
            0.5, 1.0,
            1.0, 0.0,
        ]);
        indices = new Uint32Array([0, 1, 2]);
        BufferGeometry = new THREE.BufferGeometry();
        BufferGeometry.setAttribute('position', new THREE.BufferAttribute(triangle, 3));
        BufferGeometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
        BufferGeometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
        BufferGeometry.setIndex(new THREE.BufferAttribute(indices, 1));
        mesh = new THREE.Mesh(BufferGeometry);
        mymesh = new Mesh(mesh);
        mymesh.primitiveOffset = this.triangleSum;
        mymesh.vertexOffset = this.vertexSum;
        this.vertexSum += 3;
        this.triangleSum += 1;
        this.meshes.push(mymesh);

        triangle = new Float32Array([
            -0.5, -0.5, 1.0,
            0.5, -0.5, 1.0,
            0.0, 0.5, 1.0,
        ]);
        normals = new Float32Array([
            0.0, 0.0, -1.0,
            0.0, 0.0, -1.0,
            0.0, 0.0, -1.0,
        ]);
        uv = new Float32Array([
            0.0, 0.0,
            0.5, 1.0,
            1.0, 0.0,
        ]);
        indices = new Uint32Array([0, 1, 2]);
        BufferGeometry = new THREE.BufferGeometry();
        BufferGeometry.setAttribute('position', new THREE.BufferAttribute(triangle, 3));
        BufferGeometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
        BufferGeometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
        BufferGeometry.setIndex(new THREE.BufferAttribute(indices, 1));
        mesh = new THREE.Mesh(BufferGeometry);
        mymesh = new Mesh(mesh);
        mymesh.primitiveOffset = this.triangleSum;
        mymesh.vertexOffset = this.vertexSum;
        this.vertexSum += 3;
        this.triangleSum += 1;
        this.meshes.push(mymesh);

    }
    prepareRasterVtxBuffer(device: webGPUDevice): void {
        this.rasterVtxBuffer = device.device.createBuffer({
            label: 'rasterVtxBuffer', size: this.triangleSum * 3 * Float32Array.BYTES_PER_ELEMENT * 3,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX,
            mappedAtCreation: true,
        });
        const arrayBuffer = this.rasterVtxBuffer.getMappedRange();
        const floatArray = new Float32Array(arrayBuffer);
        const uintArray = new Uint32Array(arrayBuffer);
        for (let index = 0; index < this.meshes.length; index++) {
            let mesh = this.meshes[index];
            for (let i = 0; i < mesh.primitiveCount; i++) {
                for (let j = 0; j < 3; j++) {
                    const offset = (i + mesh.primitiveOffset) * 9 + j * 3;
                    const vertexOffset = mesh.geometry.indices[i * 3 + j];
                    floatArray.set(mesh.geometry.position.slice(vertexOffset * 3, vertexOffset * 3 + 3), offset);
                }
            }
        }
        this.rasterVtxBuffer.unmap();
    }
    prepareVtxIdxArray(): void {
        this.vertexArray = new Float32Array(this.vertexSum * 4).fill(1);
        this.indexArray = new Uint32Array(this.triangleSum * 3).fill(0);

        for (let index = 0; index < this.meshes.length; index++) {
            let mesh = this.meshes[index];
            for (let i = 0; i < mesh.vertexCount; i++) {
                const offset = (i + mesh.vertexOffset) * 4;
                // pos: Float32Array([x,y,z,1.0])
                this.vertexArray.set(mesh.geometry.position.slice(i * 3, i * 3 + 3), offset);
            }
            for (let i = 0; i < mesh.primitiveCount; i++) {
                const offset = (i + mesh.primitiveOffset) * 3;
                // idx: Uint32Array([a,b,c,0])
                const idx = new Uint32Array([
                    mesh.geometry.indices[i * 3] + mesh.vertexOffset,
                    mesh.geometry.indices[i * 3 + 1] + mesh.vertexOffset,
                    mesh.geometry.indices[i * 3 + 2] + mesh.vertexOffset]);
                this.indexArray.set(idx, offset);
            }
            // free memory
            mesh.geometry.position = null;
            mesh.geometry.indices = null;

        }
    }

    async prepareBVH(device: webGPUDevice): Promise<void> {
        return new Promise(async (resolve, reject) => {
            let bvhWorker = new computeWorker();
            bvhWorker.onmessage = async (e) => {
                if (typeof e.data === 'string') {
                    LogOnScreen(e.data);
                    return;
                }
                if (typeof e.data === 'number') {
                    this.bvhMaxDepth = e.data;
                    return;
                }
                LogOnScreen("bvh building finished");
                this.bvhBuffer = device.device.createBuffer({
                    label: 'bvhBuffer', size: e.data.byteLength,
                    usage: GPUBufferUsage.STORAGE,
                    mappedAtCreation: true,
                });
                let dstArrayView = new Uint8Array(this.bvhBuffer.getMappedRange());
                let srcArrayView = new Uint8Array(e.data);
                dstArrayView.set(srcArrayView);
                this.bvhBuffer.unmap();

                bvhWorker.terminate();
                resolve();
            }
            bvhWorker.postMessage({ vertexArray: this.vertexArray, indexArray: this.indexArray });
        });
    }

    allocateBuffer(device: webGPUDevice): void {
        // allocate buffer
        this.vertexBuffer = device.device.createBuffer({
            label: 'vertexBuffer', size: this.vertexArray.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX,
            mappedAtCreation: true,
        });
        this.indexBuffer = device.device.createBuffer({
            label: 'indexBuffer', size: this.indexArray.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.INDEX,
            mappedAtCreation: true,
        });
        /*
        struct{
            textureId: vec4u,
            node: array<f32,12>, // 3 normal, 2 uv, 4 tangent
        }
        offset
        0:  u32     u32     u32     u32
        4: norm.x  norm.y  norm.z  pad0
        8: tang.x  tang.y  tang.z  tang.w
        12: uv.u   uv.v    pad0    pad0
        */
        this.geometryBuffer = device.device.createBuffer({
            label: 'geometryBuffer', size: this.vertexSum * 16 * Float32Array.BYTES_PER_ELEMENT,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX,
            mappedAtCreation: true,
        });
    }

    // to be modified!!!!!
    writeBuffer(): void {
        {// upload vertex buffer
            const vertexArray = new Float32Array(this.vertexBuffer.getMappedRange());
            vertexArray.set(this.vertexArray);
            this.vertexBuffer.unmap();
            this.vertexArray = null;
        }
        {// upload index buffer
            const indexArray = new Uint32Array(this.indexBuffer.getMappedRange());
            indexArray.set(this.indexArray);
            this.indexBuffer.unmap();
            this.indexArray = null;
        }
        {// upload geometry buffer'
            const arrayBuffer = this.geometryBuffer.getMappedRange();
            const geometryArray = new Float32Array(arrayBuffer);
            const textureIDArray = new Uint32Array(arrayBuffer);
            for (let index = 0; index < this.meshes.length; index++) {
                let mesh = this.meshes[index];
                for (let i = 0; i < mesh.vertexCount; i++) {
                    let offset = (i + mesh.vertexOffset) * 16;
                    textureIDArray.set(mesh.TextureId, offset);
                    textureIDArray.set([128 + (128 << 8)], offset + 7);
                    geometryArray.set(mesh.geometry.normal.slice(i * 3, i * 3 + 3), offset + 4);
                    geometryArray.set(mesh.geometry.tangent.slice(i * 4, i * 4 + 4), offset + 8);
                    geometryArray.set(mesh.geometry.uv.slice(i * 2, i * 2 + 2), offset + 12);
                }
                mesh.geometry.normal = null;
                mesh.geometry.uv = null;
                mesh.geometry.tangent = null;
                mesh.geometry = null;
            }
            this.geometryBuffer.unmap();
        }
        console.log("writing finished");
    }
}

export { gltfmodel }