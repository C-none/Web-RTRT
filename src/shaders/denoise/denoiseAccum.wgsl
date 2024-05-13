@group(0) @binding(0) var<storage, read_write> illumination: array<vec2u>;
@group(0) @binding(1) var<storage, read_write> output : array<vec2u>;
@group(0) @binding(2) var<storage, read_write> gBufferTex : array<vec2u>;
@group(0) @binding(3) var<storage, read_write> variance : array<f32>;

override WIDTH: u32;
override HEIGHT: u32;

// #include <denoiseCommon.wgsl>;

fn loadReflectance(reflect: ptr<storage,array<vec2u>, read_write>, launchIndex: u32) -> vec3f {
    let data = (*reflect)[launchIndex];
    return  vec3f(unpack2x16unorm(data.x), unpack2x16unorm(data.y).x);
}

@compute @workgroup_size(BATCH_SIZE, BATCH_SIZE, 1)
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3u, @builtin(workgroup_id) WorkgroupID: vec3u, @builtin(local_invocation_id) LocalInvocationID: vec3u) {
    screen_size = vec2u(WIDTH, HEIGHT);
    if any(GlobalInvocationID.xy >= screen_size) {
        return;
    }
    let x = GlobalInvocationID.x;
    let y = GlobalInvocationID.y;
    let launchIndex = y * WIDTH + x;
    loadIllumination(&illumination, launchIndex);
    let illum = loadIllumination(&illumination, launchIndex);
    let reflectance = loadReflectance(&gBufferTex, launchIndex);
    let color = vec3f(illum) * vec3f(reflectance);
    let variance = variance[launchIndex];

    // storeColor(&output, launchIndex, vec3f(sqrt(variance) / 8));
    storeColor(&output, launchIndex, color);
    // storeColor(&illumination, launchIndex, illum / 10);
    // storeColor(&output, launchIndex, illum / 5);
}