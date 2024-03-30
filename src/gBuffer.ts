import { gltfmodel } from "./gltf";
import { webGPUDevice } from "./device";
import { CameraManager } from "./camera";
import { shaders } from "./shaders/manager";

class GBuffer {
    device: webGPUDevice;
    model: gltfmodel;
    camera: CameraManager;
    gBufferTextures: GPUTexture;
}