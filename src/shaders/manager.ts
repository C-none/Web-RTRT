import utils from './utils.wgsl?raw';
import basic from './basic.instanced.vert.wgsl?raw';
import position from './position.frag.wgsl?raw';
import compute from './compute.position.wgsl?raw';

import rayGen from './tracing/rayGen.wgsl?raw';
import slopeAABBTest from './tracing/slopeAABBTest.wgsl?raw';

import display from './display/display.wgsl?raw';

const insert = (wgsl: string, snippets: any) =>
    wgsl.replace(/#include\s+<(.*?)>;/g, (_, name: any): string => snippets[name]);

class ShaderManager {
    shaders: { [key: string]: string } = {
        "utils.wgsl": utils,
        "basic.instanced.vert.wgsl": basic,
        "position.frag.wgsl": position,
        "compute.position.wgsl": compute,
        "rayGen.wgsl": rayGen,
        "display.wgsl": display,
        "slopeAABBTest.wgsl": slopeAABBTest,
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