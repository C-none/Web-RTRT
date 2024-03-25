import basicInstanced from './shaders/basic.instanced.vert.wgsl?raw'
import positionFrag from './shaders/position.frag.wgsl?raw'
import positionCompute from './shaders/compute.position.wgsl?raw'
import * as box from './util/box'
import { getModelViewMatrix } from './util/math'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/Addons.js'
import { GLTFLoader } from 'three/examples/jsm/Addons.js';
import { shaders } from './shaders/manager'
let loader = new GLTFLoader();
let model: THREE.Group<THREE.Object3DEventMap>;
// ./assets/bistro_external/external.gltf
// ./assets/sponza/Sponza.gltf

loader.load('./assets/sponza/Sponza.gltf', async function (gltf) {
    model = gltf.scene;
    console.log(model);
    let cnt: number = 0;
    let cnt2: number = 0;
    model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            if (child instanceof THREE.Mesh) {
                let material = child.material;
                if (!material.normalMap) {
                    model.remove(child);
                    console.log(child);
                }
            }
            // cnt += child.geometry.attributes.position.count;
            // let emi = child.material.emissive;
            // if (emi.getHex() == new THREE.Color(1, 1, 1).getHex()) {
            //     console.log(child);
            //     cnt++;
            // }
            // if (child.material.emissiveMap != null) {
            //     // console.log(child);
            //     console.log(typeof child.material);
            //     cnt2++;
            // }
            // let tmp = new THREE.Matrix4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)
            // for (let i = 0; i < child.matrix.elements.length; i++) {
            //     if (tmp.elements[i] != child.matrixWorld.elements[i]) {
            //         console.log(child);
            //         break;
            //     }
            // }
        }
    });
});



// initialize webgpu device & config canvas context
async function initWebGPU(canvas: HTMLCanvasElement) {
    if (!navigator.gpu)
        throw new Error('Not Support WebGPU')
    const adapter = await navigator.gpu.requestAdapter({
        powerPreference: 'high-performance'
    })
    if (!adapter)
        throw new Error('No Adapter Found')
    console.log(adapter.limits);
    const device = await adapter.requestDevice({
        requiredLimits: {
            maxStorageBufferBindingSize: adapter.limits.maxStorageBufferBindingSize
        },
    })
    const context = canvas.getContext('webgpu') as GPUCanvasContext
    const format = navigator.gpu.getPreferredCanvasFormat()
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
    const size = { width: canvas.clientWidth * devicePixelRatio, height: canvas.clientHeight * devicePixelRatio };
    context.configure({
        device, format,
        alphaMode: 'opaque'
    })
    return { device, context, format, size }
}

// create pipiline & buffers
async function initPipeline(device: GPUDevice, format: GPUTextureFormat, size: { width: number, height: number }) {
    const renderPipeline = await device.createRenderPipelineAsync({
        label: 'Basic Pipline',
        layout: 'auto',
        vertex: {
            module: device.createShaderModule({
                code: basicInstanced,
            }),
            entryPoint: 'main',
            buffers: [{
                arrayStride: 8 * 4, // 3 position 2 uv,
                attributes: [
                    {
                        // position
                        shaderLocation: 0,
                        offset: 0,
                        format: 'float32x3',
                    },
                    {
                        // normal
                        shaderLocation: 1,
                        offset: 3 * 4,
                        format: 'float32x3',
                    },
                    {
                        // uv
                        shaderLocation: 2,
                        offset: 6 * 4,
                        format: 'float32x2',
                    }
                ]
            }]
        },
        fragment: {
            module: device.createShaderModule({
                code: positionFrag,
            }),
            entryPoint: 'main',
            targets: [
                {
                    format: format
                }
            ]
        },
        primitive: {
            topology: 'triangle-list',
            // Culling backfaces pointing away from the camera
            cullMode: 'back'
        },
        // Enable depth testing since we have z-level positions
        // Fragment closest to the camera is rendered in front
        depthStencil: {
            depthWriteEnabled: true,
            depthCompare: 'less',
            format: 'depth24plus',
        }
    } as GPURenderPipelineDescriptor)
    // create depthTexture for renderPass
    const depthTexture = device.createTexture({
        size, format: 'depth24plus',
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    })
    const depthView = depthTexture.createView()
    const groupSize = 128;
    // create a compute pipeline
    const computePipeline = await device.createComputePipelineAsync({
        layout: 'auto',
        compute: {
            module: device.createShaderModule({
                label: 'compute position shader',
                code: shaders.get('compute.position.wgsl')
            }),
            entryPoint: 'main',
            constants: {
                size: groupSize,
            }
        }
    })

    // create vertex buffer
    const vertexBuffer = device.createBuffer({
        label: 'GPUBuffer store vertex',
        size: box.vertex.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    })
    device.queue.writeBuffer(vertexBuffer, 0, box.vertex)
    const indexBuffer = device.createBuffer({
        label: 'GPUBuffer store index',
        size: box.index.byteLength,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
    })
    device.queue.writeBuffer(indexBuffer, 0, box.index)

    const modelBuffer = device.createBuffer({
        label: 'GPUBuffer store MAX model matrix',
        size: 4 * 4 * 4 * MAX, // mat4x4 x float32 x MAX
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    })
    const projectionBuffer = device.createBuffer({
        label: 'GPUBuffer store camera projection',
        size: 4 * 4 * 4, // mat4x4 x float32
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    })
    const mvpBuffer = device.createBuffer({
        label: 'GPUBuffer store MAX MVP',
        size: 4 * 4 * 4 * MAX, // mat4x4 x float32 x MAX
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    })
    const velocityBuffer = device.createBuffer({
        label: 'GPUBuffer store MAX velocity',
        size: 4 * 4 * MAX, // 4 position x float32 x MAX
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    })
    const inputBuffer = device.createBuffer({
        label: 'GPUBuffer store input vars',
        size: 7 * 4, // float32 * 7
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    })


    // create a bindGroup for renderPass
    const renderGroup = device.createBindGroup({
        label: 'Group for renderPass',
        layout: renderPipeline.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: mvpBuffer
                }
            }
        ]
    })
    // create bindGroup for computePass
    const computeGroup = device.createBindGroup({
        label: 'Group for computePass',
        layout: computePipeline.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: inputBuffer
                }
            },
            {
                binding: 1,
                resource: {
                    buffer: velocityBuffer
                }
            },
            {
                binding: 2,
                resource: {
                    buffer: modelBuffer
                }
            },
            {
                binding: 3,
                resource: {
                    buffer: projectionBuffer
                }
            },
            {
                binding: 4,
                resource: {
                    buffer: mvpBuffer
                }
            }
        ]
    })
    // return all vars
    return {
        renderPipeline, computePipeline,
        vertexBuffer, indexBuffer,
        modelBuffer, projectionBuffer, inputBuffer, velocityBuffer,
        renderGroup, computeGroup,
        depthTexture, depthView
    }
}

// create & submit device commands
function draw(
    device: GPUDevice,
    context: GPUCanvasContext,
    pipelineObj: {
        renderPipeline: GPURenderPipeline,
        computePipeline: GPUComputePipeline,
        vertexBuffer: GPUBuffer,
        indexBuffer: GPUBuffer,
        renderGroup: GPUBindGroup,
        computeGroup: GPUBindGroup,
        depthView: GPUTextureView
    }
) {
    const commandEncoder = device.createCommandEncoder()
    const computePass = commandEncoder.beginComputePass()
    computePass.setPipeline(pipelineObj.computePipeline)
    computePass.setBindGroup(0, pipelineObj.computeGroup)
    computePass.dispatchWorkgroups(Math.ceil(NUM / 128))
    computePass.end()

    const passEncoder = commandEncoder.beginRenderPass({
        colorAttachments: [
            {
                view: context.getCurrentTexture().createView(),
                clearValue: { r: 0, g: 0, b: 0, a: 1.0 },
                loadOp: 'clear',
                storeOp: 'store'
            }
        ],
        depthStencilAttachment: {
            view: pipelineObj.depthView,
            depthClearValue: 1.0,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
        }
    })
    passEncoder.setPipeline(pipelineObj.renderPipeline)
    passEncoder.setVertexBuffer(0, pipelineObj.vertexBuffer)
    passEncoder.setIndexBuffer(pipelineObj.indexBuffer, 'uint16')
    passEncoder.setBindGroup(0, pipelineObj.renderGroup)
    passEncoder.drawIndexed(box.indexCount, NUM)
    passEncoder.end()
    device.queue.submit([commandEncoder.finish()])
}

// total objects
let NUM = 50000, MAX = 3000000
async function run() {
    const canvas = document.querySelector('canvas')
    if (!canvas)
        throw new Error('No Canvas')

    const { device, context, format, size } = await initWebGPU(canvas)
    const pipelineObj = await initPipeline(device, format, size)
    // create data
    const inputArray = new Float32Array([NUM, -500, 500, -250, 250, -500, 500]) // count, xmin/max, ymin/max, zmin/max
    const modelArray = new Float32Array(MAX * 4 * 4)
    const velocityArray = new Float32Array(MAX * 4)
    for (let i = 0; i < MAX; i++) {
        const x = Math.random() * 1000 - 500
        const y = Math.random() * 500 - 250
        const z = Math.random() * 1000 - 500
        const modelMatrix = getModelViewMatrix({ x, y, z }, { x: 0, y: 0, z: 0 }, { x: 2, y: 2, z: 2 })
        modelArray.set(modelMatrix, i * 4 * 4)

        velocityArray[i * 4 + 0] = Math.random() - 0.5 // x
        velocityArray[i * 4 + 1] = Math.random() - 0.5 // y
        velocityArray[i * 4 + 2] = Math.random() - 0.5 // z
        velocityArray[i * 4 + 3] = 1 // w
    }
    device.queue.writeBuffer(pipelineObj.velocityBuffer, 0, velocityArray)
    device.queue.writeBuffer(pipelineObj.modelBuffer, 0, modelArray)
    device.queue.writeBuffer(pipelineObj.inputBuffer, 0, inputArray)

    // auto rotated camera
    let cam = new THREE.PerspectiveCamera(60, size.width / size.height, 0.1, 10000);
    cam.position.set(0, 50, 1000); cam.lookAt(0, 0, 0);
    let orbit = new OrbitControls(cam, canvas);
    // const camera = { x: 0, y: 50, z: 1000 }
    // start loop
    let timestamp = Date.now()
    let cnt = 0
    function frame() {
        // const time = performance.now() / 5000
        // camera.x = 1000 * Math.sin(time)
        // camera.z = 1000 * Math.cos(time)
        // const projectionMatrix = getProjectionMatrix(aspect, 60 / 180 * Math.PI, 0.1, 10000, camera)
        // cam.position.set(1000 * Math.sin(time), 50, 1000 * Math.cos(time));
        // cam.lookAt(0, 0, 0);
        // cam.updateMatrixWorld();
        orbit.update();
        const pMatrix = cam.projectionMatrix.clone();
        const mvMatrix = cam.matrixWorldInverse.clone();
        const mvpMatrix = pMatrix.multiply(mvMatrix);
        device.queue.writeBuffer(pipelineObj.projectionBuffer, 0, new Float32Array(mvpMatrix.elements))
        draw(device, context, pipelineObj)
        if (cnt == 100) {
            const now = Date.now()
            // present fps on screen fixed 2 decimal
            document.querySelector('span')!.textContent = "fps: " + (1000 * 100 / (now - timestamp)).toFixed(1)
            timestamp = now
            cnt = 0;
        }
        cnt++
        requestAnimationFrame(frame)
    }
    frame()

    // re-configure context on resize
    window.addEventListener('resize', () => {
        size.width = canvas.width = canvas.clientWidth * devicePixelRatio
        size.height = canvas.height = canvas.clientHeight * devicePixelRatio
        // don't need to recall context.configure() after v104
        // re-create depth texture
        pipelineObj.depthTexture.destroy()
        pipelineObj.depthTexture = device.createTexture({
            size, format: 'depth24plus',
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        })
        pipelineObj.depthView = pipelineObj.depthTexture.createView()
        // update aspect
        cam.aspect = size.width / size.height;
        cam.updateProjectionMatrix();
    })

    // const range = document.querySelector('input') as HTMLInputElement
    // range.max = MAX.toString()
    // range.value = NUM.toString()
    // range.addEventListener('input', (e: Event) => {
    //     NUM = +(e.target as HTMLInputElement).value
    //     const span = document.querySelector('#num') as HTMLSpanElement
    //     span.innerHTML = NUM.toString()
    //     inputArray[0] = NUM
    //     device.queue.writeBuffer(pipelineObj.inputBuffer, 0, inputArray)
    // })
}
run()