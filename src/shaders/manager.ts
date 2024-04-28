import basic from './basic.instanced.vert.wgsl?raw';
import position from './position.frag.wgsl?raw';
import compute from './compute.position.wgsl?raw';

import vBuffer from './vBuffer.wgsl?raw';

import lightUpdate from './lightUpdate.wgsl?raw';

import light from './tracing/light.wgsl?raw';
import common from './tracing/common.wgsl?raw';
import sampleInit from './tracing/sampleInit.wgsl?raw';
import reservoir from './tracing/reservoir.wgsl?raw';
import trace from './tracing/trace.wgsl?raw';
import BSDF from './tracing/BSDF.wgsl?raw';
import rayGen from './tracing/rayGen.wgsl?raw';
import slopeAABBTest from './tracing/slopeAABBTest.wgsl?raw';
import spatialReuse from './tracing/spatialReuse.wgsl?raw';
import accumulate from './tracing/accumulate.wgsl?raw';

import display from './display.wgsl?raw';

const insert = (wgsl: string, snippets: any) =>
    wgsl.replace(/\/\/ #include\s+<(.*?)>;/g, (_, name: any): string => snippets[name]);

class ShaderManager {
    shaders: { [key: string]: string } = {
        "basic.instanced.vert.wgsl": basic,
        "position.frag.wgsl": position,
        "compute.position.wgsl": compute,
        "light.wgsl": light,
        "lightUpdate.wgsl": lightUpdate,
        "common.wgsl": common,
        "sampleInit.wgsl": sampleInit,
        "reservoir.wgsl": reservoir,
        "trace.wgsl": trace,
        "BSDF.wgsl": BSDF,
        "vBuffer.wgsl": vBuffer,
        "rayGen.wgsl": rayGen,
        "display.wgsl": display,
        "slopeAABBTest.wgsl": slopeAABBTest,
        "spatialReuse.wgsl": spatialReuse,
        "accumulate.wgsl": accumulate,
    }
    constructor() {
        for (const name in this.shaders) {
            let depth = 0;
            while (this.shaders[name].includes("#include")) {
                this.shaders[name] = insert(this.shaders[name], this.shaders);
                if (depth++ > 10)
                    throw new Error("Too deep include chain in shader: " + name);
            }
        }
    }
    get(name: keyof typeof this.shaders) {
        return this.shaders[name];
    }
}

export const shaders = new ShaderManager();