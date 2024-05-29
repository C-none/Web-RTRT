import basic from './basic.instanced.vert.wgsl?raw';
import position from './position.frag.wgsl?raw';
import compute from './compute.position.wgsl?raw';

import utils from './utils.wgsl?raw';
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

import denoiseCommon from './denoise/denoiseCommon.wgsl?raw';
import preloadInvoker from './denoise/preloadInvoker.wgsl?raw';
import temperalAccum from './denoise/temperalAccum.wgsl?raw';
import firefly from './denoise/firefly.wgsl?raw';
import filterVariance from './denoise/filterVariance.wgsl?raw';
import atrous from './denoise/atrous.wgsl?raw';
import denoiseAccum from './denoise/denoiseAccum.wgsl?raw';

import reconstruct_dilated from './FSR2/reconstruct_dilated.wgsl?raw'
import depthClip from './FSR2/depthClip.wgsl?raw'
import lock from './FSR2/lock.wgsl?raw'
//import display from './display.wgsl?raw';
import display from './FSR2/display.wgsl?raw';
import racs from './FSR2/racs.wgsl?raw'
import FSR_common from './FSR2/FSR_common.wgsl?raw'

import FXAA from './FSR2/FXAA.wgsl?raw'


import raw_display from './raw_display.wgsl?raw';

const insert = (wgsl: string, snippets: any) =>
    wgsl.replace(/\/\/ #include\s+<(.*?)>;/g, (_, name: any): string => snippets[name]);

class ShaderManager {
    shaders: { [key: string]: string } = {
        "basic.instanced.vert.wgsl": basic,
        "position.frag.wgsl": position,
        "compute.position.wgsl": compute,
        "utils.wgsl": utils,

        "light.wgsl": light,
        "lightUpdate.wgsl": lightUpdate,
        "common.wgsl": common,
        "sampleInit.wgsl": sampleInit,
        "reservoir.wgsl": reservoir,
        "trace.wgsl": trace,
        "BSDF.wgsl": BSDF,
        "vBuffer.wgsl": vBuffer,
        "rayGen.wgsl": rayGen,
        "slopeAABBTest.wgsl": slopeAABBTest,
        "spatialReuse.wgsl": spatialReuse,
        "accumulate.wgsl": accumulate,

        "denoiseCommon.wgsl": denoiseCommon,
        "preloadInvoker.wgsl": preloadInvoker,
        "temperalAccum.wgsl": temperalAccum,
        "firefly.wgsl": firefly,
        "filterVariance.wgsl": filterVariance,
        "atrous.wgsl": atrous,
        "denoiseAccum.wgsl": denoiseAccum,

        'FSR_common.wgsl': FSR_common,
        "reconstruct_dilated.wgsl": reconstruct_dilated,
        "depthClip.wgsl": depthClip,
        'lock.wgsl': lock,
        "display.wgsl": display,
        'racs.wgsl': racs,

        'FXAA.wgsl':FXAA,
        'raw_display.wgsl':raw_display,
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