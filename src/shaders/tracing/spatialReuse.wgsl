@group(0) @binding(0) var frame : texture_storage_2d<rgba16float, write>;
@group(0) @binding(1) var<uniform> ubo: UBO;
@group(0) @binding(2) var<storage, read> gBufferTex : array<vec2u>;
@group(0) @binding(3) var<storage, read> gBufferAttri : array<vec4f>;


// #include <common.wgsl>;
// #include <reservoir.wgsl>;
// #include <light.wgsl>;
// #include <BSDF.wgsl>;

override ENABLE_GI: bool = true;

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3u) {
    let screen_size: vec2u = textureDimensions(frame);
    if any(GlobalInvocationID.xy >= screen_size) {
        return;
    }
    var color = vec3f(0.0);
    let origin = ubo.origin;

    let screen_pos = vec2f(GlobalInvocationID.xy) + 0.5;
    let launchIndex = u32(screen_pos.y) * screen_size.x + u32(screen_pos.x);
    var reservoirDI = ReservoirDI();
    var reservoirGI = ReservoirGI();
    var _seed: u32;
    loadReservoir(&previousReservoir, launchIndex, &reservoirDI, &reservoirGI, &_seed);

    if reservoirDI.W < 0.0 {
        textureStore(frame, GlobalInvocationID.xy, vec4f(0.));
    }
    seed = tea(GlobalInvocationID.y * screen_size.x + GlobalInvocationID.x, _seed, 4);
    var pointInfo: PointInfo;
    loadGBuffer(launchIndex, &pointInfo);

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
        let neighbor_pos = screen_pos + samplingDisk() * 20.0;
        // let neighbor_pos = screen_pos + bias2[i] * 2.;
        if any(neighbor_pos < vec2f(0.0)) || any(neighbor_pos >= vec2f(screen_size)) {
            continue;
        }
        let neighbor_launchIndex = u32(neighbor_pos.y) * screen_size.x + u32(neighbor_pos.x);
        var neighbor_reservoirDI = ReservoirDI();
        var neighbor_reservoirGI = ReservoirGI();
        loadReservoir(&previousReservoir, neighbor_launchIndex, &neighbor_reservoirDI, &neighbor_reservoirGI, &_seed);
        let neighbour_pointAttri: PointAttri = loadGBufferAttri(&gBufferAttri, neighbor_launchIndex);
        // check plane distance
        let posDiff = pointInfo.pos - neighbour_pointAttri.pos;
        let planeDist = abs(dot(posDiff, pointInfo.normalShading));
        if planeDist < 0.04 && dot(pointInfo.normalShading, neighbour_pointAttri.normalShading) > .8 {
            // color += vec3f(0.2);
            if neighbor_reservoirDI.W > 0. {
                light = getLight(neighbor_reservoirDI.lightId);
                wo = light.position - pointInfo.pos;
                dist = length(wo);
                wo = normalize(wo);
                if dot(wo, pointInfo.normalShading) > 0. {
                // color += vec3f(0.2);
                    neighbor_reservoirDI.M = min(neighbor_reservoirDI.M, 256);
                    geometryTerm_luminance = light.intensity / (dist * dist);
                    bsdfLuminance = BSDFLuminance(pointInfo, wo, wi);
                    pHat = geometryTerm_luminance * bsdfLuminance;
                    neighbor_reservoirDI.w_sum = pHat * neighbor_reservoirDI.W * f32(neighbor_reservoirDI.M);
                    combineReservoirsDI(&reservoirDI, neighbor_reservoirDI);
                }
            }
            if ENABLE_GI {
                wo = neighbor_reservoirGI.xs - pointInfo.pos;
                dist = length(wo);
                wo = normalize(wo);
                if dot(wo, pointInfo.normalShading) > 0. && dot(-wo, neighbor_reservoirGI.ns) >= 0. {
                    neighbor_reservoirGI.M = min(neighbor_reservoirGI.M, 200);
                    // pHat = luminance(neighbor_reservoirGI.Lo) / Jacobian(pointInfo.pos, neighbor_reservoirGI);
                    pHat = luminance(neighbor_reservoirGI.Lo);
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
            reservoirDI.W = reservoirDI.w_sum / max(0.001, pHat) / f32(reservoirDI.M);
        }
        if ENABLE_GI {
            reservoirGI.W = reservoirGI.w_sum / max(0.001, luminance(reservoirGI.Lo)) / f32(reservoirGI.M);
        }
    }


    // textureStore(frame, GlobalInvocationID.xy, vec4f(color, 1.));
    storeReservoir(&currentReservoir, launchIndex, reservoirDI, reservoirGI, seed);
}