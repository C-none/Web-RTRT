// #include <utils.wgsl>;

fn loadIllumination(illum: ptr<storage,array<vec2u>, read_write>, launchIndex: u32) -> vec3f {
    return max(vec3f(0), loadColor(illum, launchIndex));
}

fn storeIllumination(illum: ptr<storage,array<vec2u>, read_write>, launchIndex: u32, color: vec3f) {
    storeColor(illum, launchIndex, color);
}