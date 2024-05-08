const PI:f32=3.14159265359;
const INVPI:f32=0.31830988618;
// #include <utils.wgsl>;

var<private> seed:u32=0;
struct UBO {
    origin: vec3f,
    seed: u32,
};

fn tea(seed0: u32, seed1: u32, loopCount: u32) -> u32 {
    var v0: u32 = seed0;
    var v1: u32 = seed1;
    var s0: u32 = 0;
    for (var i = 0u; i < loopCount; i++) {
        s0 += 0x9e3779b9;
        v0 += ((v1 << 4) + 0xA341316C) ^ (v1 + s0) ^ ((v1 >> 5) + 0xC8013EA4);
        v1 += ((v0 << 4) + 0xAD90777D) ^ (v0 + s0) ^ ((v0 >> 5) + 0x7E95761E);
    }
    return v0;
}

fn lcg() -> u32 {
    let LCG_A: u32 = 1664525;
    let LCG_C: u32 = 1013904223;
    seed = LCG_A * seed + LCG_C;
    return seed;
}

fn random() -> f32 {
    return f32(lcg() & 0x7fffffff) / f32(0x80000000);
}

fn samplingHemisphere() -> vec4f {
    let r1 = random();
    let r2 = random();
    let sq = sqrt(r1);
    return vec4f(cos(2.0 * PI * r2) * sq, sin(2.0 * PI * r2) * sq, sqrt(1.0 - r1), sqrt(1.0 - r1) * INVPI);
}

fn samplingDisk() -> vec2f {
    let r1 = random();
    let r2 = random();
    let sq = sqrt(r1);
    return vec2f(cos(2.0 * PI * r2) * sq, sin(2.0 * PI * r2) * sq);
}

struct PointInfo {
    pos: vec3f,
    normalGeo: vec3f,
    normalShading: vec3f,
    baseColor: vec3f,
    metallicRoughness: vec2f,
};

fn loadGBuffer(idx: u32, pointInfo: ptr<function,PointInfo>) {
    let tex = gBufferTex[idx];
    (*pointInfo).baseColor = vec3f(unpack2x16unorm(tex.x), unpack2x16unorm(tex.y).x);
    (*pointInfo).metallicRoughness = unpack4x8unorm(tex.y).zw;
    let attri = gBufferAttri[idx];
    (*pointInfo).pos = attri.xyz;
    (*pointInfo).normalShading = normalDecode(bitcast<u32>(attri.w));
}
struct PointAttri {
    pos: vec3f,
    normalShading: vec3f,
};

fn loadGBufferAttri(gBufferAttri: ptr<storage,array<vec4f>>, idx: u32) -> PointAttri {
    let attri = (*gBufferAttri)[idx];
    var ret: PointAttri;
    ret.pos = attri.xyz;
    ret.normalShading = normalDecode(bitcast<u32>(attri.w));
    return ret;
}

fn storeColor(buffer: ptr<storage,array<vec2u>,read_write>, idx: u32, color: vec3f) {
    (*buffer)[idx] = vec2u(pack2x16float(color.xy), pack2x16float(vec2f(color.z, 0)));
}