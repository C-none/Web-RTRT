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

@group(0) @binding(0) var<storage, read_write> frame: array<vec2u>;
@group(0) @binding(1) var<uniform> camera : Camera;
@group(0) @binding(2) var<storage, read_write> geometries : array<GeometryInfo>;
@group(0) @binding(3) var albedo: texture_2d_array<f32>;
@group(0) @binding(4) var normalMap: texture_2d_array<f32>;
@group(0) @binding(5) var specularMap: texture_2d_array<f32>;
@group(0) @binding(6) var vBuffer : texture_2d<u32>;
@group(0) @binding(7) var samp: sampler;
@group(0) @binding(8) var<uniform> ubo: UBO;
@group(0) @binding(9) var<storage, read_write> gBufferTex : array<vec2u>;
@group(0) @binding(10) var<storage, read_write> gBufferAttri : array<vec4f>;
@group(0) @binding(11) var<storage, read_write> previousGBufferAttri : array<vec4f>;
@group(0) @binding(12) var motionVec: texture_2d<u32>;
// #include <common.wgsl>;
// #include <trace.wgsl>;
// #include <sampleInit.wgsl>;
// #include <reservoir.wgsl>;
// #include <light.wgsl>;
// #include <BSDF.wgsl>;

override halfConeAngle = 0.0;
override ENABLE_GI: bool = true;
override WIDTH: u32;
override HEIGHT: u32;

fn generateTBN(normal: vec3f) -> mat3x3f {
    let sign = select(1.0, -1.0, normal.z < 0.0);
    let a = -1. / (sign + normal.z);
    let b = normal.x * normal.y * a;
    let T = vec3f(1.0 + sign * normal.x * normal.x * a, sign * b, -sign * normal.x);
    let B = vec3f(b, sign + normal.y * normal.y * a, -normal.y);
    return mat3x3f(T, B, normal);
}

fn updateDIResforGI(reservoir: ptr<function,ReservoirDI>, lightId: u32, weight: f32, pHat: f32, select_pHat: ptr<function, f32>) {
    (*reservoir).M += 1;
    (*reservoir).w_sum += weight;
    if random() < weight / (*reservoir).w_sum {
        (*reservoir).lightId = lightId;
        (*select_pHat) = pHat;
    }
}

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3u, @builtin(workgroup_id) WorkgroupID: vec3u) {
    screen_size = vec2u(WIDTH, HEIGHT);
    if any(GlobalInvocationID.xy >= screen_size) {
        return;
    }
    _ = ENABLE_GI;
    // var rayInfo: RayInfo = traceRay(origin, direction);
    var color = vec3f(0.0);
    var primaryTri = primaryHit(GlobalInvocationID.xy);
    let screen_pos = vec2f(GlobalInvocationID.xy) + 0.5;
    let launchIndex = getCoord(screen_pos);
    var reservoirCurDI = ReservoirDI();
    var reservoirCurGI = ReservoirGI();
    var reservoirPrevDI = ReservoirDI();
    var reservoirPrevGI = ReservoirGI();
    if primaryTri.primId == 0 && all(primaryTri.baryCoord.yz == vec2f(0)) {
        reservoirCurDI.W = -1.;
        reservoirCurGI.W = -1.;
        // storeColor(&frame, launchIndex, vec3f(0));
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
    let shadingPoint: vec3f = pointInfo.pos;
    var pointPrev: PointAttri;


    let globalPreId = screen_pos - primaryTri.motionVec * vec2f(screen_size);
    let launchPreIndex = getCoord(globalPreId);
    if validateCoord(globalPreId) {
        var _seed: u32;
        loadReservoir(&previousReservoir, launchPreIndex, &reservoirPrevDI, &reservoirPrevGI, &_seed);
        pointPrev = loadGBufferAttri(&previousGBufferAttri, launchPreIndex);
    }
    var _seed = tea(WorkgroupID.y * screen_size.x + WorkgroupID.x, ubo.seed, 2);
    var geometryTerm_luminance: f32;
    var bsdfLuminance: f32;
    var pHat: f32;
    // initial candidates
    var light: Light;
    var wo: vec3f;
    var dist: f32;

    for (var i = 0; i < 8; i = i + 1) {
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
        {
        light = getLight(reservoirCurDI.lightId);
        wo = light.position - shadingPoint;
        dist = length(wo);
        wo = normalize(wo);
        if traceShadowRay(shadingPoint, wo, dist) {
            reservoirCurDI.W = 0.0;
        // reservoirCurDI.w_sum = 0.0;
        }
    }

    // indirect illumination
    if ENABLE_GI {
        let sampleVec: vec4f = samplingHemisphere();
        // let sampleVec: vec4f = vec4f(0.0, 0.0, 1.0, 1.0);
        let wi: vec3f = normalize(generateTBN(pointInfo.normalGeo) * sampleVec.xyz);
        let tracePdf = max(0.01, sampleVec.w);
        if dot(wi, pointInfo.normalGeo) >= 0. {
            let rayInfo: RayInfo = traceRay(shadingPoint, wi);
            if rayInfo.isHit == 1 {
                let triangle: PrimaryHitInfo = PrimaryHitInfo(rayInfo.hitAttribute, rayInfo.PrimitiveIndex, vec2f(0));
                let pointSampleInfo: PointInfo = unpackTriangleIndirect(triangle, wi);
                let samplePoint = pointSampleInfo.pos;

                var tmpReservoir = ReservoirDI();
                var selected_pHat: f32 = 0.0;
                for (var i = 0; i < 4; i = i + 1) {
                    light = sampleLight();
                    let samplePdf = sampleLightProb(light);
                    wo = light.position - samplePoint;
                    dist = length(wo);
                    wo = normalize(wo);
                    if dot(wo, pointSampleInfo.normalShading) <= 0.0 || dot(wo, pointSampleInfo.normalGeo) <= 0.0 {
                        tmpReservoir.M += 1;
                        continue;
                    }
                    geometryTerm_luminance = light.intensity / (dist * dist);
                    bsdfLuminance = BSDFLuminance(pointSampleInfo, wo, -wi);
                    pHat = bsdfLuminance * geometryTerm_luminance;
                    updateDIResforGI(&tmpReservoir, light.id, pHat / samplePdf, pHat, &selected_pHat);
                }
                light = getLight(tmpReservoir.lightId);
                wo = light.position - samplePoint;
                dist = length(wo);
                wo = normalize(wo);
                // check the visibility from sample point to light
                if !traceShadowRay(samplePoint, wo, dist) {
                    tmpReservoir.W = tmpReservoir.w_sum / max(0.001, selected_pHat) / f32(tmpReservoir.M);
                    let geometryTerm = light.color * light.intensity / (dist * dist);
                    let bsdf = BSDF(pointSampleInfo, wo, -wi);
                    let Lo = tmpReservoir.W * bsdf * geometryTerm;
                    updateReservoirGI(&reservoirCurGI, pointInfo.pos, pointInfo.normalShading, pointSampleInfo.pos, pointSampleInfo.normalShading, luminance(Lo) / tracePdf, Lo, light.id);
                }

            //     light = sampleLight();
            //     let lightPdf = sampleLightProb(light);
            //     wo = light.position - samplePoint;
            //     dist = length(wo);
            //     wo = normalize(wo);
            // // check the visibility from sample point to light
            //     if dot(wo, pointSampleInfo.normalShading) > 0.0 && dot(wo, pointSampleInfo.normalGeo) > 0.0 {
            //         if !traceShadowRay(samplePoint, wo, dist) {
            //             let geometryTerm = light.color * light.intensity / (dist * dist);
            //             let bsdf = BSDF(pointSampleInfo, wo, -wi);
            //             let Lo = bsdf * geometryTerm / lightPdf;
            //             updateReservoirGI(&reservoirCurGI, pointInfo.pos, pointInfo.normalShading, pointSampleInfo.pos, pointSampleInfo.normalShading, luminance(Lo) / tracePdf, Lo, light.id);
            //         }
            //     }
            }
        }
        reservoirCurGI.M = 1;
    }

    // temperal reuse
    // plane distance
    let posDiff = pointPrev.pos - pointInfo.pos;
    let planeDist = abs(dot(posDiff, pointInfo.normalShading));
    if dot(pointInfo.normalShading, pointPrev.normalShading) > 0.5 && planeDist < 0.05 {
        color = vec3f(1.0);
        if reservoirPrevDI.W > 0.0 {
            const capped = 16 ;
            reservoirPrevDI.M = min(reservoirPrevDI.M, capped);
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
            if reservoirPrevGI.W > 0.0 {
                reservoirPrevGI.M = min(reservoirPrevGI.M, 12);
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
                if flag && dot(wo, pointInfo.normalShading) > 0.0 && dot(wo, pointInfo.normalGeo) > 0.0 && dot(-wo, reservoirPrevGI.ns) >= 0.0 {

                    pHat = luminance(reservoirPrevGI.Lo);
                    // pHat = luminance(reservoirPrevGI.Lo) / Jacobian(pointInfo.pos, reservoirPrevGI);
                    reservoirPrevGI.w_sum = pHat * reservoirPrevGI.W * f32(reservoirPrevGI.M);

                    combineReservoirsGI(&reservoirCurGI, reservoirPrevGI);
                }
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
            reservoirCurDI.W = reservoirCurDI.w_sum / max(0.01, pHat) / f32(reservoirCurDI.M);
        } else {
            reservoirCurDI.W = 0.0;
            // reservoirCurDI.w_sum = 0.0;
        }

        // GI
        if ENABLE_GI {
            reservoirCurGI.W = reservoirCurGI.w_sum / max(0.01, luminance(reservoirCurGI.Lo)) / f32(reservoirCurGI.M);
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
    //     // traceShadowRay(shadingPoint, wo, dist);
    //     // traceShadowRay(shadingPoint, wo, dist);
    //     if traceShadowRay(shadingPoint, wo, dist) {
    //         visibility = 0.0;
    //     } else {
    //         visibility = 1.0;
    //     }
    //     color = bsdf * geometryTerm * visibility / samplePdf / pointInfo.baseColor;
    // }

    // reference color
    // for (var i = 0; i < 4; i = i + 1) {
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
    // // write reservoir
    storeReservoir(&currentReservoir, launchIndex, reservoirCurDI, reservoirCurGI, seed);
    // storeColor(&frame, launchIndex, color);
}