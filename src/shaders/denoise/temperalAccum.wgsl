struct Camera {
    world: mat4x4f,
    projInv: mat4x4f,
    VPMat: mat4x4f,
    lastVPMat: mat4x4f,
};

@group(0) @binding(0) var<uniform> camera : Camera;
@group(0) @binding(1) var motionVec: texture_2d<u32>;
@group(0) @binding(2) var<storage,read_write> illumination_previous: array<vec2u>;
@group(0) @binding(3) var<storage,read_write> illumination_current: array<vec2u>;
@group(0) @binding(4) var<storage,read_write> illumination_sample: array<vec2u>;
@group(0) @binding(5) var<storage,read_write> gBufferAttri:array<vec4f>;
@group(0) @binding(6) var<storage,read_write> gBufferAttriPrevious : array<vec4f>;
@group(0) @binding(7) var depth : texture_depth_2d;
@group(0) @binding(8) var<storage,read_write> historyLength: array<f32>;
@group(0) @binding(9) var<storage,read_write> historyLengthPrevious: array<f32>;
@group(0) @binding(10) var<storage,read_write> moment:array<vec2f>;
@group(0) @binding(11) var<storage,read_write> momentPrevious:array<vec2f>;
@group(0) @binding(12) var<storage, read_write> variance_current: array<f32>;

override WIDTH: u32;
override HEIGHT: u32;

// #include <denoiseCommon.wgsl>;

fn loadPosition(gBuffer: ptr<storage,array<vec4f>, read_write>, launchIndex: u32) -> vec3f {
    let point = loadGBufferAttri(gBuffer, launchIndex);
    return point.pos;
}

fn validateReprojection(normalCenter: vec3f, posCenter: vec3f, posPre: vec3f) -> bool {
    let posDiff = posCenter - posPre;
    let planeDist = abs(dot(normalCenter, posDiff));
    return planeDist < 0.01;
}
const BORDER: i32 = 1;
const SHARED_SIZE: i32 = BATCH_SIZE + BORDER * 2;

var<workgroup> sharedNormalDepth: array<array<vec4f, SHARED_SIZE>, SHARED_SIZE>;

fn loadNormalShared(sharedPos: vec2i) -> vec3f {
    return sharedNormalDepth[sharedPos.y][sharedPos.x].xyz;
}

fn preload(sharedPos: vec2i, globalPos: vec2i) {
    let globalId = clamp(globalPos, vec2i(0), vec2i(screen_size) - 1);
    let normal = loadNormal(&gBufferAttri, getCoord(vec2f(globalId) + 0.5));
    let depth = textureLoad(depth, vec2u(globalId), 0);
    sharedNormalDepth[sharedPos.y][sharedPos.x] = vec4f(normal, depth);
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
    var color = vec3f(0);
    let depthCenter = textureLoad(depth, vec2u(screen_pos), 0);
    if depthCenter == 1.0 {
        storeIllumination(&illumination_current, getCoord(screen_pos), vec3f(0));
        variance_current[ getCoord(screen_pos)] = 64.;
        moment[getCoord(screen_pos)] = vec2f(0);
        historyLength[getCoord(screen_pos)] = 0.0;
        return;
    }
    let motion: vec2f = unpack2x16float(textureLoad(motionVec, GlobalInvocationID.xy, 0).r) * vec2f(screen_size);
    let screen_pos_pre = screen_pos - motion;
    let launchIndex: u32 = getCoord(screen_pos);
    var illumSamp = loadIllumination(&illumination_sample, launchIndex);
    var illumSampLuminance = luminance(illumSamp);
    var normalCenterAvg = vec3f(0);
    var posCenter = loadPosition(&gBufferAttri, launchIndex);


    const offset33: array<vec2f,9> = array<vec2f,9>(
        vec2f(-1, -1), vec2f(0, -1), vec2f(1, -1),
        vec2f(-1, 0), vec2f(0, 0), vec2f(1, 0),
        vec2f(-1, 1), vec2f(0, 1), vec2f(1, 1)
    );

    for (var i: i32 = 0; i < 9; i = i + 1) {
        let offset = offset33[i];
        let screen_pos_offset = screen_pos + offset;
        let launchIndexOffset = getCoord(screen_pos_offset);
        if !validateCoord(screen_pos_offset) {
            continue;
        }
        let groupSharedPos = vec2i(LocalInvocationID.xy) + vec2i(offset) + BORDER;
        if sharedNormalDepth[groupSharedPos.y][groupSharedPos.x].w >= 1 {
            continue;
        }
        normalCenterAvg += loadNormalShared(groupSharedPos);
        // normalCenterAvg += loadNormal(&gBufferAttri, u32(launchIndexOffset));
    }
    normalCenterAvg = normalize(normalCenterAvg);

    // reproject
        {
        var sumWeight = 0.0;
        var sumIllum = vec3f(0);
        var sumMoment = vec2f(0);
        var sumHistoryLength = 0.0;

        var illumOut = vec3f(0);
        var momentOut = vec2f(0);
        var historyLengthOut = 0.;
        var variance = 0.;

        let pos_floor = floor(screen_pos_pre - 0.5);
        let frac = screen_pos_pre-0.5 - pos_floor;
        let weight: array<f32,4> = array<f32,4>(
            (1.0 - frac.x) * (1.0 - frac.y),
            frac.x * (1.0 - frac.y),
            (1.0 - frac.x) * frac.y,
            frac.x * frac.y
        );
        const offset22: array<vec2f,4> = array<vec2f,4>(
            vec2f(0, 0), vec2f(1, 0), vec2f(0, 1), vec2f(1, 1)
        );
        for (var i: i32 = 0; i < 4; i = i + 1) {
            let offset = offset22[i];
            let screen_pos_pre_offset = screen_pos_pre -0.5 + offset;
            let launchIndexOffset = getCoord(screen_pos_pre_offset);
            if !validateCoord(screen_pos_pre_offset) {
                continue;
            }
            let posPre = gBufferAttriPrevious[launchIndexOffset].xyz;
            if validateReprojection(normalCenterAvg, posCenter, posPre) {
                sumIllum += loadIllumination(&illumination_previous, u32(launchIndexOffset)) * weight[i];
                sumMoment += momentPrevious[launchIndexOffset] * weight[i];
                sumHistoryLength += historyLengthPrevious[launchIndexOffset] * weight[i];
                sumWeight += weight[i];
            }
        }
        let posPre = gBufferAttriPrevious[getCoord(screen_pos_pre)].xyz;
        if sumWeight > 0. {
            sumIllum /= sumWeight;
            sumMoment /= sumWeight;
            sumHistoryLength /= sumWeight;
            historyLengthOut = clamp(sumHistoryLength + 1., 1., 3.);
            var alpha = 1. / historyLengthOut;

            // history clamping
            let variance_prev = max(sumMoment.y - sumMoment.x * sumMoment.x, 1e-5);
            momentOut = mix(sumMoment, vec2f(illumSampLuminance, illumSampLuminance * illumSampLuminance), alpha);
            variance = max(momentOut.y - momentOut.x * momentOut.x, 1e-5);
            let posDiff = posCenter - posPre;
            let varRatio = variance / variance_prev;
            let historyFactor = exp(- 1 * pow(varRatio, 2) * log(1e-2 * length(posDiff) + 1.000));

            historyLengthOut *= historyFactor;
            historyLengthOut = clamp(historyLengthOut, 1.1, 3.);
            alpha = 1. / historyLengthOut;
            momentOut = mix(sumMoment, vec2f(illumSampLuminance, illumSampLuminance * illumSampLuminance), alpha);
            variance = max(momentOut.y - momentOut.x * momentOut.x, 1e-5);

            // let deviation = sqrt(variance);
            illumOut = mix(sumIllum, illumSamp, alpha);
            color = vec3f(historyFactor);
        } else {
            sumIllum = vec3f(0);
            illumOut = illumSamp;
            momentOut = vec2f(illumSampLuminance, illumSampLuminance * illumSampLuminance);
            historyLengthOut = 1.0;
            variance = 64.;
            color = vec3f(1, 0, 0);
        }
        variance_current[launchIndex] = variance;
        moment[launchIndex] = momentOut;
        historyLength[launchIndex] = historyLengthOut;
        // if validateCoord(screen_pos_pre) {
        //     sumIllum = loadIllumination(&illumination_previous, u32(getCoord(screen_pos_pre))) ;
        //     sumHistoryLength = historyLengthPrevious[getCoord(screen_pos_pre)];
        //     sumWeight = 1;
        // }
        storeIllumination(&illumination_current, launchIndex, illumOut);
        // storeIllumination(&illumination_sample, launchIndex, illumOut);
        // storeIllumination(&illumination_sample, launchIndex, vec3f(sqrt(variance) / 8));
        // storeIllumination(&illumination_sample, launchIndex, color);
    }
}