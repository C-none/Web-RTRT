@group(0) @binding(0) var<storage,read_write> illumination_in: array<vec2u>;
@group(0) @binding(1) var<storage,read_write> illumination_out: array<vec2u>;
@group(0) @binding(2) var<storage,read_write> gBufferAttri:array<vec4f>;

@group(1) @binding(0) var<storage,read_write> variance_input: array<f32>;
@group(1) @binding(1) var<storage,read_write> variance_output: array<f32>;
@group(1) @binding(2) var depth : texture_depth_2d;

override WIDTH: u32;
override HEIGHT: u32;
const step: f32=f32(1 << STEP_SIZE);
// #include <denoiseCommon.wgsl>;

fn fastPow(x: f32, y: f32) -> f32 {
    return exp(x * log(y));
}

@compute @workgroup_size(BATCH_SIZE, BATCH_SIZE, 1)
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3u, @builtin(workgroup_id) WorkgroupID: vec3u, @builtin(local_invocation_id) LocalInvocationID: vec3u) {
    screen_size = vec2u(WIDTH, HEIGHT);
    let screen_pos = vec2f(GlobalInvocationID.xy) + 0.5;
    if any(screen_pos >= vec2f(screen_size)) {
        return;
    }
    var color = vec3f(0);
    if textureLoad(depth, vec2u(screen_pos), 0) >= 1 {
        return;
    }
    let launchIndex = getCoord(screen_pos);
    let illuminanceCenter = loadIllumination(&illumination_in, launchIndex);
    let luminanceCenter = luminance(illuminanceCenter);
    let pointAttriCenter = loadGBufferAttri(&gBufferAttri, launchIndex);
    let posCenter = pointAttriCenter.pos;
    let normalCenter = pointAttriCenter.normalShading;
    let varianceCenter = variance_input[launchIndex];

    const offset55: array<vec2i,25> = array<vec2i,25>(
        vec2i(-2, -2), vec2i(-1, -2), vec2i(0, -2), vec2i(1, -2), vec2i(2, -2),
        vec2i(-2, -1), vec2i(-1, -1), vec2i(0, -1), vec2i(1, -1), vec2i(2, -1),
        vec2i(-2, 0), vec2i(-1, 0), vec2i(0, 0), vec2i(1, 0), vec2i(2, 0),
        vec2i(-2, 1), vec2i(-1, 1), vec2i(0, 1), vec2i(1, 1), vec2i(2, 1),
        vec2i(-2, 2), vec2i(-1, 2), vec2i(0, 2), vec2i(1, 2), vec2i(2, 2)
    );
    // high precision 5x5 gaussian filter weight
    const weight55: array<f32,25> = array<f32,25>(
        1 / 256.0, 4 / 256.0, 6 / 256.0, 4 / 256.0, 1 / 256.0,
        4 / 256.0, 16 / 256.0, 24 / 256.0, 16 / 256.0, 4 / 256.0,
        6 / 256.0, 24 / 256.0, 36 / 256.0, 24 / 256.0, 6 / 256.0,
        4 / 256.0, 16 / 256.0, 24 / 256.0, 16 / 256.0, 4 / 256.0,
        1 / 256.0, 4 / 256.0, 6 / 256.0, 4 / 256.0, 1 / 256.0
    );
    // const offset33: array<vec2i,9> = array<vec2i,9>(
    //     vec2i(-1, -1), vec2i(0, -1), vec2i(1, -1),
    //     vec2i(-1, 0), vec2i(0, 0), vec2i(1, 0),
    //     vec2i(-1, 1), vec2i(0, 1), vec2i(1, 1)
    // );
    // // high precision 3x3 gaussian filter weight
    // const weight33: array<f32,9> = array<f32,9>(
    //     1 / 16.0, 2 / 16.0, 1 / 16.0,
    //     2 / 16.0, 4 / 16.0, 2 / 16.0,
    //     1 / 16.0, 2 / 16.0, 1 / 16.0
    // );

    const sigma_luminance: f32 = 0.5;
    const sigma_normal: f32 = 128;
    const sigma_position: f32 = 0.05;
    const epsilon: f32 = 0.0001;

    var sumWeight = 0.0;
    var sumWeight2 = 0.0;
    var sumIlluminance = vec3f(0);
    var sumVariance = 0.0;

    for (var i = 0; i < 25; i = i + 1) {
        let offset = offset55[i];
        let screen_pos_offset = screen_pos + step * vec2f(offset);
        let launchIndex_offset = getCoord(screen_pos_offset);
        if !validateCoord(screen_pos_offset) {
            continue;
        }
        let illuminance = loadIllumination(&illumination_in, launchIndex_offset);
        let luminance = luminance(illuminance);
        let pointAttri = loadGBufferAttri(&gBufferAttri, launchIndex_offset);
        let pos = pointAttri.pos;
        let normal = pointAttri.normalShading;

        // Edge-stopping weights
        let luminDiff = luminance - luminanceCenter;
        let wluminance = exp(-abs(luminDiff) / (varianceCenter * sigma_luminance + epsilon));
        let wnormal = fastPow(max(0, dot(normal, normalCenter)), sigma_normal);
        let planeDist = abs(dot(normalCenter, pos - posCenter));
        let wposition = exp(- planeDist / sigma_position);

        let weight = wposition * wnormal * wluminance * weight55[i];
        sumWeight += weight;
        sumWeight2 += weight * weight;
        sumIlluminance += illuminance * weight;
        sumVariance += variance_input[launchIndex_offset] * weight;
    }
    var illumiance = vec3f(0);
    if sumWeight > epsilon {
        illumiance = sumIlluminance / sumWeight;
        variance_output[launchIndex] = sumVariance / sumWeight;
    } else {
        illumiance = illuminanceCenter;
        variance_output[launchIndex] = varianceCenter;
    }
    storeIllumination(&illumination_out, launchIndex, illumiance);
}
