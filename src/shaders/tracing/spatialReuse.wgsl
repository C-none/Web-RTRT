@group(0) @binding(0) var frame : texture_storage_2d<rgba16float, write>;
@group(0) @binding(1) var<uniform> ubo: UBO;
@group(0) @binding(2) var<storage, read> gBuffer : array<vec2u>;

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
    var pointInfo = PointInfo(reservoirGI.xv, reservoirGI.nv, vec3f(0.), mat3x3f(), vec2f(0.));
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
        // check distance and normal diff
        if neighbor_reservoirDI.W <= 0. || distance(shadingPoint, neighbor_reservoirGI.xv) >= 0.1 * depth || dot(pointInfo.normalShading, neighbor_reservoirGI.nv) < .9 {
            continue;
        }

        light = getLight(neighbor_reservoirDI.lightId);
        wo = light.position - pointInfo.pos;
        dist = length(wo);
        wo = normalize(wo);
        if dot(wo, pointInfo.normalShading) <= 0. {
            continue;
        }
        neighbor_reservoirDI.M = min(neighbor_reservoirDI.M, 256);
        geometryTerm_luminance = light.intensity / (dist * dist);
        bsdfLuminance = BSDFLuminance(pointInfo, wo, wi);
        pHat = geometryTerm_luminance * bsdfLuminance;
        neighbor_reservoirDI.w_sum = pHat * neighbor_reservoirDI.W * f32(neighbor_reservoirDI.M);
        combineReservoirsDI(&reservoirDI, neighbor_reservoirDI);
    }
    // compute Weight
        {
        light = getLight(reservoirDI.lightId);
        wo = light.position - pointInfo.pos;
        dist = length(wo);
        wo = normalize(wo);
        // if dot(wo, pointInfo.normalShading) <= 0. {
        //     color += vec3f(1., 0., 0.);
        // }
        // if dot(wi, pointInfo.normalShading) <= 0. {
        //     color += vec3f(0., 1., 0.);
        // }
        geometryTerm_luminance = light.intensity / (dist * dist);
        bsdfLuminance = BSDFLuminance(pointInfo, wo, wi);
        pHat = geometryTerm_luminance * bsdfLuminance;
        if pHat <= 0.0 {
            reservoirDI.W = 0.0;
            reservoirDI.w_sum = 0.0;
        } else {
            reservoirDI.W = reservoirDI.w_sum / max(0.001, pHat) / f32(reservoirDI.M);
        }
    }

    if ENABLE_GI {
    }
    // textureStore(frame, GlobalInvocationID.xy, vec4f(color, 1.));
    storeReservoir(&currentReservoir, launchIndex, reservoirDI, reservoirGI, seed);
}