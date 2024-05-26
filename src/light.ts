import { webGPUDevice } from "./device";
class Light {
    position: Float32Array;
    color: Float32Array;
    intensity: number;
    prob: number;
    alias: number;
    constructor(position: Float32Array, color: Float32Array, intensity: number) {
        this.position = position;
        this.color = color;
        this.intensity = intensity;
        this.prob = 1;
        this.alias = 0;
        window.performance.now();
    }
    velocity: Array<number> = [0, 0, 0];
    transform: ((time: number) => void) | null;
};

class LightManager {

    device: webGPUDevice;
    lightCount: number = 11;
    lights: Array<Light>;
    lightBuffer: GPUBuffer;
    constructor(lights: Array<Light>, device: webGPUDevice) {
        this.lights = lights;
        this.device = device;
        this.lightCount = lights.length;
        for (let i = 0; i < lights.length; i++) {
            lights[i].alias = i;
        }
        this.lightBuffer = this.device.device.createBuffer({
            label: 'light buffer',
            size: 4 * (4 + this.lightCount * (8)), // 1 for light count, 8 for each light
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true,
        });
        // Vose's Alias Method
        function initAliasTable(lights: Array<Light>) {
            let sumIntensity = 0;
            lights.forEach(light => { sumIntensity += light.intensity; });
            let averageIntensity = sumIntensity / lights.length;
            let smallLights = Array<Light>();
            let largeLights = Array<Light>();
            lights.forEach(light => {
                light.prob = light.intensity / averageIntensity;
                if (light.prob < 1) smallLights.push(light);
                else largeLights.push(light);
            });
            while (smallLights.length > 0 && largeLights.length > 0) {
                let small = smallLights.pop();
                let large = largeLights.pop();
                small.alias = large.alias;
                large.prob += small.prob - 1;
                if (large.prob < 1) smallLights.push(large);
                else largeLights.push(large);
            }
            while (largeLights.length > 0) {
                let large = largeLights.pop();
                large.prob = 1;
            }
            while (smallLights.length > 0) {
                let small = smallLights.pop();
                small.prob = 1;
            }
            return sumIntensity;
        };
        let sumIntensity = initAliasTable(lights);
        let ArrayBuffer = this.lightBuffer.getMappedRange();
        let UintArray = new Uint32Array(ArrayBuffer);
        let FloatArray = new Float32Array(ArrayBuffer);
        UintArray[0] = lights.length;
        FloatArray[1] = sumIntensity;
        for (let i = 0; i < lights.length; i++) {
            let bias = 4 + 8 * i;
            FloatArray.set(lights[i].position, bias);
            let color = Math.round(lights[i].color[0] * 255) << 0 | Math.round(lights[i].color[1] * 255) << 8 | Math.round(lights[i].color[2] * 255) << 16;
            UintArray[bias + 3] = color;
            FloatArray[bias + 4] = lights[i].prob;
            UintArray[bias + 5] = lights[i].alias;
            FloatArray[bias + 6] = lights[i].intensity;
        }
        this.lightBuffer.unmap();
    }

};

export { LightManager, Light };