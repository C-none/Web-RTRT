struct Camera {
    world: mat4x4f,
    projInv: mat4x4f,
    VPMat: mat4x4f,
    lastVPMat: mat4x4f,
};
struct GeometryInfo {
    id: vec4u,
    normal: vec3f,
    color: u32,
    tangent: vec4f,
    uv: vec2f,
};

@group(0) @binding(0) var frame : texture_storage_2d<rgba16float, write>;
@group(0) @binding(1) var<uniform> camera : Camera;
@group(0) @binding(2) var<storage, read> geometries : array<GeometryInfo>;
@group(0) @binding(3) var albedo: texture_2d_array<f32>;
@group(0) @binding(4) var normalMap: texture_2d_array<f32>;
@group(0) @binding(5) var specularMap: texture_2d_array<f32>;
@group(0) @binding(6) var vBuffer : texture_2d<u32>;
@group(0) @binding(7) var samp: sampler;
@group(0) @binding(8) var<uniform> ubo: UBO;
@group(0) @binding(9) var<storage, read_write> gBuffer : array<vec2u>;

// #include <common.wgsl>;
// #include <trace.wgsl>;
// #include <sampleInit.wgsl>;
// #include <reservoir.wgsl>;
// #include <light.wgsl>;
// #include <BSDF.wgsl>;

override halfConeAngle = 0.0;
override ENABLE_GI: bool = true;

fn storeGBuffer(idx: u32, baseColor: vec3f, metallicRoughness: vec2f) {
    // {f16(baseColor.xy)} {f16(baseColor.z)f8(metallicRoughness.xy)}
    let result = vec2u(pack2x16unorm(baseColor.xy), pack2x16unorm(vec2f(baseColor.z, 0)) | pack4x8unorm(vec4f(0., 0., metallicRoughness)));
    gBuffer[idx] = result;
}

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3u) {
    let screen_size: vec2u = textureDimensions(frame);
    if any(GlobalInvocationID.xy >= screen_size) {
        return;
    }

    // var rayInfo: RayInfo = traceRay(origin, direction);
    var color = vec3f(0.0);
    var primaryHit = primaryHit(GlobalInvocationID.xy);
    let launchIndex = GlobalInvocationID.y * screen_size.x + GlobalInvocationID.x;
    var reservoirCurDI = ReservoirDI(0, 0., 0., 0);
    var reservoirCurGI = ReservoirGI(vec3f(0.0), 0.0, vec3f(0.0), 0, vec3f(0.0), 0.0, vec3f(0.0), vec3f(0.0));
    var reservoirPrevDI = ReservoirDI(0, 0., 0., 0);
    var reservoirPrevGI = ReservoirGI(vec3f(0.0), 0.0, vec3f(0.0), 0, vec3f(0.0), 0.0, vec3f(0.0), vec3f(0.0));

    if primaryHit.primId == 0 && all(primaryHit.baryCoord == vec3f(1.0, 0.0, 0.0)) {
        // textureStore(frame, GlobalInvocationID.xy, vec4f(0.));
        reservoirCurDI.W = -1.;
        storeGBuffer(launchIndex, vec3f(0.), vec2f(0.));
        storeReservoir(&currentReservoir, launchIndex, reservoirCurDI, reservoirCurGI, ubo.seed);
        return;
    }

    seed = tea(GlobalInvocationID.y * screen_size.x + GlobalInvocationID.x, ubo.seed, 16);
    let origin: vec3f = ubo.origin;
    let screen_target: vec2f = vec2f(f32(GlobalInvocationID.x) + 0.5, f32(screen_size.y - GlobalInvocationID.y - 1u) + 0.5) / vec2f(screen_size);
    let screen_target_ndc: vec2f = screen_target * 2.0 - 1.0;
    let screen_target_world: vec4f = camera.projInv * vec4f(screen_target_ndc, 1.0, 1.0);
    let direction = (camera.world * vec4f(normalize(screen_target_world.xyz), 0.0)).xyz;
    var pointInfo = unpackTriangle(primaryHit, origin, direction, halfConeAngle);


    let globalPreId = vec2f(GlobalInvocationID.xy) + 0.5 - primaryHit.motionVec;
    let launchPreIndex = select(-1, i32(globalPreId.y) * i32(screen_size.x) + i32(globalPreId.x), all(globalPreId >= vec2f(0.0)) && all(globalPreId < vec2f(screen_size)));
    let shadingPoint: vec3f = pointInfo.pos;

    if launchPreIndex >= 0 {
        var _seed: u32;
        loadReservoir(&previousReservoir, u32(launchPreIndex), &reservoirPrevDI, &reservoirPrevGI, &_seed);
    }

    var geometryTerm_luminance: f32;
    var bsdfLuminance: f32;
    var pHat: f32;
    // initial candidates
    var light: Light;
    var wo: vec3f;
    var dist: f32;

    for (var i = 0; i < 16; i = i + 1) {
        light = sampleLight();
        let samplePdf = sampleLightProb(light);
        wo = light.position - shadingPoint;
        dist = length(wo);
        wo = normalize(wo);
        if dot(wo, pointInfo.normalShading) <= 0.0 {
            continue;
        }
        geometryTerm_luminance = light.intensity / (dist * dist);
        bsdfLuminance = BSDFLuminance(pointInfo, wo, -direction);
        pHat = bsdfLuminance * geometryTerm_luminance;
        updateReservoirDI(&reservoirCurDI, light.id, pHat / samplePdf);
    }

    // check visibility
    light = getLight(reservoirCurDI.lightId);
    wo = light.position - shadingPoint;
    dist = length(wo);
    wo = normalize(wo);
    if traceShadowRay(shadingPoint, wo, dist) {
        reservoirCurDI.W = 0.0;
        reservoirCurDI.w_sum = 0.0;
    } else {
        geometryTerm_luminance = light.intensity / (dist * dist);
        bsdfLuminance = BSDFLuminance(pointInfo, wo, -direction);
        pHat = bsdfLuminance * geometryTerm_luminance;
    }

    // initial GI candidates
    reservoirCurGI.xv = shadingPoint;
    reservoirCurGI.nv = pointInfo.normalShading;

    if ENABLE_GI {
        let sampleVec = samplingHemisphere();
        let wi = normalize(pointInfo.tbn * sampleVec.xyz);
    }
    // temperal reuse
    if reservoirPrevDI.W > 0.0 {
        let depth = distance(reservoirCurGI.xv, origin);
        if distance(reservoirCurGI.xv, reservoirPrevGI.xv) < 0.1 * depth && dot(reservoirCurGI.nv, reservoirPrevGI.nv) > 0.9 {
            const capped = 12u;
            reservoirPrevDI.M = min(reservoirPrevDI.M, capped * reservoirCurDI.M);
            light = getLight(reservoirPrevDI.lightId);
            wo = light.position - shadingPoint;
            dist = length(wo);
            wo = normalize(wo);
            if dot(wo, pointInfo.normalShading) > 0.0 {
                geometryTerm_luminance = light.intensity / (dist * dist);
                bsdfLuminance = BSDFLuminance(pointInfo, wo, -direction);
                pHat = bsdfLuminance * geometryTerm_luminance;
                reservoirPrevDI.w_sum = pHat * reservoirPrevDI.W * f32(reservoirPrevDI.M);

                combineReservoirsDI(&reservoirCurDI, reservoirPrevDI);
            }
        }
    }

// compute Weight
        {
        light = getLight(reservoirCurDI.lightId);
        wo = light.position - shadingPoint;
        dist = length(wo);
        wo = normalize(wo);
        geometryTerm_luminance = light.intensity / (dist * dist);
        bsdfLuminance = BSDFLuminance(pointInfo, wo, -direction);
        pHat = bsdfLuminance * geometryTerm_luminance;
        if pHat > 0.0 {
            reservoirCurDI.W = reservoirCurDI.w_sum / max(0.001, pHat) / f32(reservoirCurDI.M);
        } else {
            reservoirCurDI.W = 0.0;
            reservoirCurDI.w_sum = 0.0;
        }
    }

    // random select light
    //     {
    //     let light = sampleLight();
    //     let samplePdf = sampleLightProb(light);
    //     var bsdf = vec3f(0.1);
    //     var wo = light.position - shadingPoint;
    //     let dist = length(wo);
    //     wo = normalize(wo);
    //     var visibility = 1.0;
    //     var geometryTerm = vec3f(1.0);
    //     bsdf = BSDF(pointInfo, wo, -direction);
    //     geometryTerm = light.color * light.intensity / (dist * dist);
    //     if traceShadowRay(shadingPoint, wo, dist) {
    //         visibility = 0.0;
    //     } else {
    //         visibility = 1.0;
    //     }
    //     color = bsdf * geometryTerm * visibility / samplePdf;
    // }

    // reference color
    // color = vec4f(0.0);
    // for (var i = 0; i < 256; i = i + 1) {
    //     let light = getLight(u32(i));
    //     var bsdf = vec3f(0.1);
    //     var wo = light.position - shadingPoint;
    //     let dist = length(wo);
    //     wo = normalize(wo);
    //     var visibility = 1.0;
    //     var geometryTerm = vec3f(1.0);
    //     if traceShadowRay(shadingPoint, wo, dist) {
    //         visibility = 0.0;
    //     } else {
    //         visibility = 1.0;
    //         bsdf = BSDF(pointInfo, wo, -direction);
    //         geometryTerm = light.color * light.intensity / (dist * dist);
    //     }
    //     color = color.xyz + bsdf * geometryTerm * visibility;
    // }

    storeGBuffer(launchIndex, pointInfo.baseColor, pointInfo.metallicRoughness);
    // write reservoir
    storeReservoir(&currentReservoir, launchIndex, reservoirCurDI, reservoirCurGI, seed);
    // textureStore(frame, GlobalInvocationID.xy, vec4f(color, 1.));
}
