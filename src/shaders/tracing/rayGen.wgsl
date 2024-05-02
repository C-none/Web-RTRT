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
@group(0) @binding(9) var<storage, read_write> gBufferTex : array<vec2u>;
@group(0) @binding(10) var<storage, read_write> gBufferAttri : array<vec4f>;
@group(0) @binding(11) var<storage, read> previousGBufferAttri : array<vec4f>;
// #include <common.wgsl>;
// #include <trace.wgsl>;
// #include <sampleInit.wgsl>;
// #include <reservoir.wgsl>;
// #include <light.wgsl>;
// #include <BSDF.wgsl>;

override halfConeAngle = 0.0;
override ENABLE_GI: bool = true;

fn generateTBN(normal: vec3f) -> mat3x3f {
    let sign = select(1.0, -1.0, normal.z < 0.0);
    let a = -1. / (sign + normal.z);
    let b = normal.x * normal.y * a;
    let T = vec3f(1.0 + sign * normal.x * normal.x * a, sign * b, -sign * normal.x);
    let B = vec3f(b, sign + normal.y * normal.y * a, -normal.y);
    return mat3x3f(T, B, normal);
}

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3u, @builtin(workgroup_id) WorkgroupID: vec3u) {
    let screen_size: vec2u = textureDimensions(frame);
    if any(GlobalInvocationID.xy >= screen_size) {
        return;
    }

    // var rayInfo: RayInfo = traceRay(origin, direction);
    var color = vec3f(0.0);
    var primaryTri = primaryHit(GlobalInvocationID.xy);
    let launchIndex = GlobalInvocationID.y * screen_size.x + GlobalInvocationID.x;
    var reservoirCurDI = ReservoirDI();
    var reservoirCurGI = ReservoirGI();
    var reservoirPrevDI = ReservoirDI();
    var reservoirPrevGI = ReservoirGI();

    if primaryTri.primId == 0 && all(primaryTri.baryCoord == vec3f(1.0, 0.0, 0.0)) {
        reservoirCurDI.W = -1.;
        storeGBuffer(launchIndex, vec3f(0), vec3f(0), vec3f(0.), vec2f(0.));
        storeReservoir(&currentReservoir, launchIndex, reservoirCurDI, reservoirCurGI, ubo.seed);
        return;
    }

    seed = tea(GlobalInvocationID.y * screen_size.x + GlobalInvocationID.x, ubo.seed, 4);
    let origin: vec3f = ubo.origin;
    // let screen_target: vec2f = vec2f(f32(GlobalInvocationID.x) + 0.5, f32(screen_size.y - GlobalInvocationID.y - 1u) + 0.5) / vec2f(screen_size);
    // let screen_target_ndc: vec2f = screen_target * 2.0 - 1.0;
    // let screen_target_world: vec4f = camera.projInv * vec4f(screen_target_ndc, 1.0, 1.0);
    var pointInfo = unpackTriangle(primaryTri, origin, halfConeAngle);
    let direction = normalize(pointInfo.pos - origin);
    var pointPrev: PointAttri;


    let globalPreId = vec2f(GlobalInvocationID.xy) + 0.5 - primaryTri.motionVec;
    let launchPreIndex = select(-1, i32(globalPreId.y) * i32(screen_size.x) + i32(globalPreId.x), all(globalPreId >= vec2f(0.0)) && all(globalPreId < vec2f(screen_size)));
    let shadingPoint: vec3f = pointInfo.pos;

    if launchPreIndex >= 0 {
        var _seed: u32;
        loadReservoir(&previousReservoir, u32(launchPreIndex), &reservoirPrevDI, &reservoirPrevGI, &_seed);
        pointPrev = loadGBufferAttri(&previousGBufferAttri, u32(launchPreIndex));
    }
    var _seed = tea(WorkgroupID.y * screen_size.x + WorkgroupID.x, ubo.seed, 2);
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
        if dot(wo, pointInfo.normalShading) <= 0.0 || dot(wo, pointInfo.normalGeo) <= 0.0 {
            reservoirCurGI.M += 1;
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

    // indirect illumination
    if ENABLE_GI {
        let sampleVec: vec4f = samplingHemisphere();
        // let sampleVec: vec4f = vec4f(0.0, 0.0, 1.0, 1.0);
        let wi: vec3f = normalize(generateTBN(pointInfo.normalGeo) * sampleVec.xyz);
        let tracePdf = max(0.001, sampleVec.w);
        if dot(wi, pointInfo.normalGeo) >= 0. {
            let rayInfo: RayInfo = traceRay(pointInfo.pos, wi);
            if rayInfo.isHit == 1 {
                let triangle: PrimaryHitInfo = PrimaryHitInfo(rayInfo.hitAttribute, rayInfo.PrimitiveIndex, vec2f(0));
                let pointSampleInfo: PointInfo = unpackTriangleIndirect(triangle, wi);
                let samplePoint = pointSampleInfo.pos;

                light = sampleLight();
                let lightPdf = sampleLightProb(light);
                wo = light.position - samplePoint;
                dist = length(wo);
                wo = normalize(wo);
            // check the visibility from sample point to light
                if dot(wo, pointSampleInfo.normalShading) > 0.0 && dot(wo, pointSampleInfo.normalGeo) > 0.0 {
                    if !traceShadowRay(samplePoint, wo, dist) {
                        let geometryTerm = light.color * light.intensity / (dist * dist);
                        let bsdf = BSDF(pointSampleInfo, wo, -wi);
                        let Lo = bsdf * geometryTerm / lightPdf;
                        updateReservoirGI(&reservoirCurGI, pointInfo.pos, pointInfo.normalShading, pointSampleInfo.pos, pointSampleInfo.normalShading, luminance(Lo) / tracePdf, Lo, light.id);
                    }
                }
            }
        }
        reservoirCurGI.M = 1;
    }

    // temperal reuse

    let depth = distance(shadingPoint, origin);
    if distance(shadingPoint, pointPrev.pos) < 0.1 * depth && dot(pointInfo.normalShading, pointPrev.normalShading) > 0.9 {
        if reservoirPrevDI.W > 0.0 {
            const capped = 8u;
            reservoirPrevDI.M = min(reservoirPrevDI.M, capped * reservoirCurDI.M);
            light = getLight(reservoirPrevDI.lightId);
            wo = light.position - shadingPoint;
            dist = length(wo);
            wo = normalize(wo);
            if dot(wo, pointInfo.normalShading) > 0.0 && dot(wo, pointInfo.normalGeo) > 0.0 {
                geometryTerm_luminance = light.intensity / (dist * dist);
                bsdfLuminance = BSDFLuminance(pointInfo, wo, -direction);
                pHat = bsdfLuminance * geometryTerm_luminance;
                reservoirPrevDI.w_sum = pHat * reservoirPrevDI.W * f32(reservoirPrevDI.M);

                combineReservoirsDI(&reservoirCurDI, reservoirPrevDI);
            }
        }
        if ENABLE_GI {
            reservoirPrevGI.M = min(reservoirPrevGI.M, 30);
            wo = reservoirPrevGI.xs - shadingPoint;
            dist = length(wo);
            wo = normalize(wo);

            var flag = true;
            if f32(_seed & 0x7fffffff) / f32(0x80000000) < 1. / 8. {
                // check visibility from light to sample point
                light = getLight(reservoirPrevGI.lightId);
                let dir = light.position - reservoirPrevGI.xs;
                let dist = length(dir);
                let wo = normalize(dir);
                if traceShadowRay(reservoirPrevGI.xs, wo, dist) {
                    flag = false;
                }
            }
            if flag && dot(wo, pointInfo.normalShading) > 0.0 && dot(wo, pointInfo.normalGeo) > 0.0 {
                pHat = luminance(reservoirPrevGI.Lo);
                reservoirPrevGI.w_sum = pHat * reservoirPrevGI.W * f32(reservoirPrevGI.M);

                combineReservoirsGI(&reservoirCurGI, reservoirPrevGI);
            }
        }
    }




// compute Weight
        {
            // DI
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

        // GI
        if ENABLE_GI {
            reservoirCurGI.W = reservoirCurGI.w_sum / max(0.001, luminance(reservoirCurGI.Lo)) / f32(reservoirCurGI.M);
        }
    }
    // traceShadowRay(shadingPoint, wo, dist);
    // traceShadowRay(shadingPoint, wo, dist);
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

    storeGBuffer(launchIndex, pointInfo.pos, pointInfo.normalShading, pointInfo.baseColor, pointInfo.metallicRoughness);
    // write reservoir
    storeReservoir(&currentReservoir, launchIndex, reservoirCurDI, reservoirCurGI, seed);
    // textureStore(frame, GlobalInvocationID.xy, vec4f(color, 1.));
}
