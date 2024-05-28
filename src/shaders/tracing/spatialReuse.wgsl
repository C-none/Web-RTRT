@group(0) @binding(0) var<storage, read_write> frame: array<vec2u>;
@group(0) @binding(1) var<uniform> ubo: UBO;
@group(0) @binding(2) var<storage, read_write> gBufferTex : array<vec2u>;
@group(0) @binding(3) var<storage, read_write> gBufferAttri : array<vec4f>;


// #include <common.wgsl>;
// #include <reservoir.wgsl>;
// #include <light.wgsl>;
// #include <BSDF.wgsl>;

override ENABLE_DI: bool = true;
override ENABLE_GI: bool = true;
override WIDTH: u32;
override HEIGHT: u32;

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3u) {
    screen_size = vec2u(WIDTH, HEIGHT);
    if any(GlobalInvocationID.xy >= screen_size) {
        return;
    }
    var color = vec3f(0.0);
    let origin = ubo.origin;

    let screen_pos = vec2f(GlobalInvocationID.xy) + 0.5;
    let launchIndex = getCoord(screen_pos);
    var reservoirDI = ReservoirDI();
    var reservoirGI = ReservoirGI();
    var _seed: u32;
    loadReservoir(&previousReservoir, launchIndex, &reservoirDI, &reservoirGI, &_seed);

    if reservoirDI.W < 0.0 {
        storeReservoir(&currentReservoir, launchIndex, reservoirDI, reservoirGI, _seed);
        return;
    }
    seed = tea(GlobalInvocationID.y * screen_size.x + GlobalInvocationID.x, _seed, 2 + ubo.seed % 4);
    var pointInfo: PointInfo;
    loadGBuffer(launchIndex, &pointInfo);

    const scale = 4u;
    if reservoirDI.M > 4 {
        reservoirDI.w_sum *= f32(reservoirDI.M / scale) / f32(reservoirDI.M);
        reservoirDI.M /= scale;
    }
    // if ENABLE_GI && reservoirGI.M > 3 {
    //     reservoirGI.w_sum *= f32(reservoirGI.M / scale) / f32(reservoirGI.M);
    //     reservoirGI.M /= scale;
    // }

    var geometryTerm_luminance: f32;
    var bsdfLuminance: f32;
    var pHat: f32;
    var light: Light;
    let shadingPoint = pointInfo.pos;
    var wi = normalize(origin - shadingPoint);
    var depth = distance(shadingPoint, origin);
    var wo: vec3f;
    var dist: f32;
    // const bias2: array<vec2f, 8 > = array<vec2f, 8>(vec2f(-1.0, 1.0), vec2f(0.0, 1.0), vec2f(1.0, 0.0), vec2f(1.0, 1.0), vec2f(-1.0, 0.0), vec2f(0.0, -1.0), vec2f(-1.0, -1.0), vec2f(1.0, -1.0));
    for (var i = 0u; i < 5; i = i + 1u) {
        let neighbor_pos = screen_pos + samplingDisk() * 15.0;
        // let neighbor_pos = screen_pos + bias2[i] * 2.;
        let neighbor_launchIndex = getCoord(neighbor_pos);
        if !validateCoord(neighbor_pos) {
            continue;
        }
        var neighbor_reservoirDI = ReservoirDI();
        var neighbor_reservoirGI = ReservoirGI();
        loadReservoir(&previousReservoir, neighbor_launchIndex, &neighbor_reservoirDI, &neighbor_reservoirGI, &_seed);
        let neighbour_pointAttri: PointAttri = loadGBufferAttri(&gBufferAttri, neighbor_launchIndex);
        // check plane distance
        let posDiff = pointInfo.pos - neighbour_pointAttri.pos;
        let planeDist = abs(dot(posDiff, pointInfo.normalShading));
        if planeDist < 0.001 && dot(pointInfo.normalShading, neighbour_pointAttri.normalShading) > .9 {

            if ENABLE_DI && neighbor_reservoirDI.W > 0. {
                light = getLight(neighbor_reservoirDI.lightId);
                wo = light.position - pointInfo.pos;
                dist = length(wo);
                wo = normalize(wo);
                if dot(wo, pointInfo.normalShading) > 0. {
                    // color += vec3f(0.2);
                    // neighbor_reservoirDI.M = min(neighbor_reservoirDI.M, threshold);
                    neighbor_reservoirDI.M /= scale;
                    geometryTerm_luminance = light.intensity / (dist * dist);
                    bsdfLuminance = BSDFLuminance(pointInfo, wo, wi);
                    pHat = geometryTerm_luminance * bsdfLuminance;
                    neighbor_reservoirDI.w_sum = pHat * neighbor_reservoirDI.W * f32(neighbor_reservoirDI.M);
                    combineReservoirsDI(&reservoirDI, neighbor_reservoirDI);
                }
            }
            if ENABLE_GI && neighbor_reservoirGI.W > 0. {
                wo = neighbor_reservoirGI.xs - pointInfo.pos;
                dist = length(wo);
                wo = normalize(wo);
                if dot(wo, pointInfo.normalShading) > 0. && dot(-wo, neighbor_reservoirGI.ns) >= 0. {
                    // neighbor_reservoirGI.M /= scale;
                    pHat = luminance(neighbor_reservoirGI.Lo) / Jacobian(pointInfo.pos, neighbor_reservoirGI);
                    neighbor_reservoirGI.w_sum = pHat * neighbor_reservoirGI.W * f32(neighbor_reservoirGI.M);
                    combineReservoirsGI(&reservoirGI, neighbor_reservoirGI);
                }
            }
        }
    }
    // compute Weight
        {
        light = getLight(reservoirDI.lightId);
        wo = light.position - pointInfo.pos;
        dist = length(wo);
        wo = normalize(wo);
        geometryTerm_luminance = light.intensity / (dist * dist);
        bsdfLuminance = BSDFLuminance(pointInfo, wo, wi);
        pHat = geometryTerm_luminance * bsdfLuminance;
        if pHat <= 0.0 {
            reservoirDI.W = 0.0;
            reservoirDI.w_sum = 0.0;
        } else {
            reservoirDI.W = reservoirDI.w_sum / max(5e-2, pHat) / f32(reservoirDI.M);
        }
        if ENABLE_GI {
            reservoirGI.W = reservoirGI.w_sum / max(1e-3, luminance(reservoirGI.Lo)) / f32(reservoirGI.M);
        }
    }


    // storeColor(&frame, launchIndex, color);
    storeReservoir(&currentReservoir, launchIndex, reservoirDI, reservoirGI, seed);
}