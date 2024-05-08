@group(0) @binding(0) var<storage, read_write> illumination: array<vec2u>;
@group(0) @binding(1) var<storage, read> gBufferTex : array<vec2u>;

override WIDTH: u32;
override HEIGHT: u32;

fn loadIllumination(illum: ptr<storage,array<vec2u>, read_write>, launchIndex: u32) -> vec3f {
    let data = (*illum)[launchIndex];
    return vec3f(unpack2x16float(data.x), unpack2x16float(data.y).x);
}

fn loadReflectance(reflect: ptr<storage,array<vec2u>, read>, launchIndex: u32) -> vec3f {
    const INVPI: f32 = 0.31830988618;
    let data = (*reflect)[launchIndex];
    return  vec3f(unpack2x16unorm(data.x), unpack2x16unorm(data.y).x) * INVPI;
}

fn storeColor(colorBuffer: ptr<storage,array<vec2u>, read_write>, launchIndex: u32, color: vec3f) {
    (*colorBuffer)[launchIndex] = vec2u(pack2x16float(color.xy), pack2x16float(vec2f(color.z, 0)));
}

@compute @workgroup_size(BATCH_SIZE, BATCH_SIZE, 1)
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3u, @builtin(workgroup_id) WorkgroupID: vec3u, @builtin(local_invocation_id) LocalInvocationID: vec3u) {
    let screen_size = vec2u(WIDTH, HEIGHT);
    let x = GlobalInvocationID.x;
    let y = GlobalInvocationID.y;
    let launchIndex = y * WIDTH + x;
    let illum = loadIllumination(&illumination, launchIndex);
    let reflectance = loadReflectance(&gBufferTex, launchIndex);
    let color = vec3f(illum) * vec3f(reflectance);
    storeColor(&illumination, launchIndex, color);
}