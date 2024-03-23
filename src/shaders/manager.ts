import utils from './utils.wgsl?raw';
import basic from './basic.instanced.vert.wgsl?raw';
import position from './position.frag.wgsl?raw';
import compute from './compute.position.wgsl?raw';



const insert = (wgsl: string, snippets: any) =>
    wgsl.replace(/#include\s+<(.*?)>;/g, (_, name: any): string => snippets[name]);

class ShaderManager {
    shaders: { [key: string]: string } = {
        "utils.wgsl": utils,
        "basic.instanced.vert.wgsl": basic,
        "position.frag.wgsl": position,
        "compute.position.wgsl": compute,
    }
    constructor() {
        for (const name in this.shaders) {
            this.shaders[name] = insert(this.shaders[name], this.shaders);
        }
    }
    get(name: keyof typeof this.shaders) {
        return this.shaders[name];
    }
}

export const shaders = new ShaderManager();