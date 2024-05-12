@group(0) @binding(0) var<storage,read_write> illumination_input: array<vec2u>;
@group(0) @binding(1) var<storage,read_write> illumination_output: array<vec2u>;
@group(0) @binding(2) var<storage,read_write> gBufferAttri:array<vec4f>;
@group(0) @binding(3) var depth : texture_depth_2d;

override WIDTH: u32;
override HEIGHT: u32;

// #include <denoiseCommon.wgsl>;

const BORDER: i32 = 1;
const SHARED_SIZE: i32 = BATCH_SIZE + BORDER * 2;

var<workgroup> sharedNormalDepth: array<array<vec4f, SHARED_SIZE>, SHARED_SIZE>;
var<workgroup> sharedPosition: array<array<vec3f, SHARED_SIZE>, SHARED_SIZE>;
var<workgroup> sharedIllumination: array<array<vec3f, SHARED_SIZE>, SHARED_SIZE>;

fn preload(sharedPos: vec2i, globalPos: vec2i) {
    let globalId = clamp(globalPos, vec2i(0), vec2i(screen_size) - 1);
    let pointAttri = loadGBufferAttri(&gBufferAttri, getCoord(vec2f(globalId) + 0.5));
    let pos = pointAttri.pos;
    sharedPosition[sharedPos.y][sharedPos.x] = pos;
    let normal = pointAttri.normalShading;
    let depth: f32 = textureLoad(depth, globalPos, 0) ;
    sharedNormalDepth[sharedPos.y][sharedPos.x] = vec4f(normal, depth);
    let illum = loadIllumination(&illumination_input, getCoord(vec2f(globalId) + 0.5));
    sharedIllumination[sharedPos.y][sharedPos.x] = illum;
}   

fn invokePreload(GlobalInvocationID: vec2i, LocalInvocationID: vec2i) {
    let group_base = GlobalInvocationID - LocalInvocationID - BORDER;
    let stage_num = (SHARED_SIZE * SHARED_SIZE + BATCH_SIZE * BATCH_SIZE - 1) / (BATCH_SIZE * BATCH_SIZE);
    for (var i: i32 = 0; i < stage_num; i = i + 1) {
        let threadIdx: i32 = LocalInvocationID.y * BATCH_SIZE + LocalInvocationID.x;
        let virtualIdx: i32 = threadIdx + i * BATCH_SIZE * BATCH_SIZE;
        let loadIdx = vec2i(virtualIdx % SHARED_SIZE, virtualIdx / SHARED_SIZE);
        if i == 0 || virtualIdx < SHARED_SIZE * SHARED_SIZE {
            preload(loadIdx, group_base + loadIdx);
        }
    }
    workgroupBarrier();
}

fn validateNeighbour(normalCenter: vec3f, posCenter: vec3f, posNeighbour: vec3f) -> f32 {
    let posDiff = posCenter - posNeighbour;
    let planeDist = abs(dot(normalCenter, posDiff));
    return f32(planeDist < 0.02);
}

@compute @workgroup_size(BATCH_SIZE, BATCH_SIZE, 1)
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3u, @builtin(workgroup_id) WorkgroupID: vec3u, @builtin(local_invocation_id) LocalInvocationID: vec3u) {
    screen_size = vec2u(WIDTH, HEIGHT);
    let screen_pos = vec2f(GlobalInvocationID.xy) + 0.5;
    invokePreload(vec2i(GlobalInvocationID.xy), vec2i(LocalInvocationID.xy));
    if any(screen_pos >= vec2f(screen_size)) {
        return;
    }
    let sharedIdx = vec2i(LocalInvocationID.xy) + BORDER;
    var color = vec3f(0);
    if sharedNormalDepth[sharedIdx.y][sharedIdx.x].w >= 1 {
        return;
    }

    let normalCenter = sharedNormalDepth[sharedIdx.y][sharedIdx.x].xyz;
    let posCenter = sharedPosition[sharedIdx.y][sharedIdx.x];
    let illuminationCenter = sharedIllumination[sharedIdx.y][sharedIdx.x];
    let luminanceCenter = luminance(illuminationCenter);

    var maxLuminance = -1.0;
    var minLuminance = 1e10;
    var maxLuminanceCoord = sharedIdx;
    var minLuminanceCoord = sharedIdx;

    const offset: array<vec2i, 8> = array<vec2i, 8>(
        vec2i(-1, -1), vec2i(0, -1), vec2i(1, -1),
        vec2i(-1, 0), vec2i(1, 0),
        vec2i(-1, 1), vec2i(0, 1), vec2i(1, 1)
    );

    for (var i: i32 = 0; i < 8; i = i + 1) {
        let neighborGlobalIdx = screen_pos + vec2f(offset[i]);
        if !validateCoord(neighborGlobalIdx) {
            continue;
        }
        let neighborIdx = sharedIdx + offset[i];
        let depth = sharedNormalDepth[neighborIdx.y][neighborIdx.x].w;
        if depth >= 1 {
            continue;
        }
        let normal = sharedNormalDepth[neighborIdx.y][neighborIdx.x].xyz;
        let pos = sharedPosition[neighborIdx.y][neighborIdx.x];
        let illumination = sharedIllumination[neighborIdx.y][neighborIdx.x];
        let luminance = luminance(illumination);
        // var weight = f32(select(0, 1, dot(normalCenter, normal) > 0.95));
        // weight *= validateNeighbour(normalCenter, posCenter, pos);
        var weight = validateNeighbour(normalCenter, posCenter, pos);
        if weight > 0 {
            if luminance > maxLuminance {
                maxLuminance = luminance;
                maxLuminanceCoord = neighborIdx;
            }
            if luminance < minLuminance {
                minLuminance = luminance;
                minLuminanceCoord = neighborIdx;
            }
        }
    }
    var inputCoord = sharedIdx;
    if luminanceCenter > maxLuminance {
        inputCoord = maxLuminanceCoord;
    }
    if luminanceCenter < minLuminance {
        inputCoord = minLuminanceCoord;
    }
    storeIllumination(&illumination_output, getCoord(screen_pos), sharedIllumination[inputCoord.y][inputCoord.x]);
}