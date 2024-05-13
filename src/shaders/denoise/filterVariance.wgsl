@group(0) @binding(0) var<storage,read_write> variance_input: array<f32>;
@group(0) @binding(1) var<storage,read_write> variance_output: array<f32>;
@group(0) @binding(2) var depth : texture_depth_2d;

override WIDTH: u32;
override HEIGHT: u32;

// #include <denoiseCommon.wgsl>;

const BORDER: i32 = 1;
const SHARED_SIZE: i32 = BATCH_SIZE + BORDER * 2;

var<workgroup> sharedVarianceDepth: array<array<vec2f, SHARED_SIZE>, SHARED_SIZE>;

fn preload(sharedPos: vec2i, globalPos: vec2i) {
    let globalId = clamp(globalPos, vec2i(0), vec2i(screen_size) - 1);
    let launchIndex = getCoord(vec2f(globalId) + 0.5);
    let variance = variance_input[launchIndex];
    let depthValue = textureLoad(depth, globalId, 0);
    sharedVarianceDepth[sharedPos.y][sharedPos.x] = vec2f(variance, depthValue);
}   
// #include <preloadInvoker.wgsl>;

@compute @workgroup_size(BATCH_SIZE, BATCH_SIZE, 1)
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3u, @builtin(workgroup_id) WorkgroupID: vec3u, @builtin(local_invocation_id) LocalInvocationID: vec3u) {
    screen_size = vec2u(WIDTH, HEIGHT);
    let screen_pos = vec2f(GlobalInvocationID.xy) + 0.5;
    invokePreload(vec2i(GlobalInvocationID.xy), vec2i(LocalInvocationID.xy));
    if any(screen_pos >= vec2f(screen_size)) {
        return;
    }
    let launchIndex = getCoord(screen_pos);
    let sharedIdx = vec2i(LocalInvocationID.xy) + BORDER;
    if sharedVarianceDepth[sharedIdx.y][sharedIdx.x].y >= 1 {
        return;
    }

    const offset: array<vec2i, 9> = array<vec2i, 9>(
        vec2i(-1, -1), vec2i(0, -1), vec2i(1, -1),
        vec2i(-1, 0), vec2i(0, 0), vec2i(1, 0),
        vec2i(-1, 1), vec2i(0, 1), vec2i(1, 1)
    );
    const gaussian: array<f32, 9> = array<f32, 9>(
        0.0625, 0.125, 0.0625,
        0.125, 0.25, 0.125,
        0.0625, 0.125, 0.0625
    );

    var sum: f32 = 0.0;
    var sumWeight: f32 = 0.0;

    for (var i = 0; i < 9; i = i + 1) {
        let neighborGlobalIdx = screen_pos + vec2f(offset[i]);
        if !validateCoord(neighborGlobalIdx) {
            continue;
        }
        let neighbor = sharedVarianceDepth[sharedIdx.y + offset[i].y][sharedIdx.x + offset[i].x];
        if neighbor.y >= 1 {
            continue;
        }
        sum += gaussian[i] * neighbor.x;
        sumWeight += gaussian[i];
    }
    variance_output[launchIndex] = max(0, sum / sumWeight);
}