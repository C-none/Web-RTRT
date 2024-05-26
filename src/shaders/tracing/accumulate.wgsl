@group(0) @binding(0) var<storage, read_write> frame: array<vec2u>;
@group(0) @binding(1) var<uniform> ubo: UBO;
@group(0) @binding(2) var<storage, read_write> gBufferTex : array<vec2u>;
@group(0) @binding(3) var<storage, read_write> gBufferAttri : array<vec4f>;


// #include <common.wgsl>;
// #include <trace.wgsl>;
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
    var illuminace = vec3f(0.0);
    let origin = ubo.origin;

    let launchIndex = getCoord(vec2f(GlobalInvocationID.xy));
    var reservoirDI = ReservoirDI();
    var reservoirGI = ReservoirGI();

    var _seed: u32;
    loadReservoir(&previousReservoir, launchIndex, &reservoirDI, &reservoirGI, &_seed);

    if reservoirDI.W < 0.0 {
        storeColor(&frame, launchIndex, vec3f(0));
        return;
    }
    seed = tea(GlobalInvocationID.y * screen_size.x + GlobalInvocationID.x, _seed, 4);
    var pointInfo: PointInfo;
    loadGBuffer(launchIndex, &pointInfo);

    var bsdf = vec3f(0.0);
    var geometryTerm = vec3f(1.0);
    var light: Light;
    let shadingPoint = pointInfo.pos;
    var wi = normalize(origin - shadingPoint);
    var wo: vec3f = vec3f(0.0);
    var dist: f32 = 0.0;
    if ENABLE_DI {
        light = getLight(reservoirDI.lightId);
        wo = light.position - shadingPoint;
        dist = length(wo);
        wo = normalize(wo);
        if reservoirDI.W < 0. || (reservoirDI.W > 0. && traceShadowRay(shadingPoint, wo, dist)) {
            reservoirDI.W = 0.;
            reservoirDI.w_sum = 0.;
        }
        bsdf = BSDF(pointInfo, wo, wi);
        geometryTerm = light.color * light.intensity / (dist * dist);
        color += max(0, reservoirDI.W) * bsdf * geometryTerm;
    }
    if ENABLE_GI {
        if reservoirGI.W > 0 {
            wo = reservoirGI.xs - shadingPoint;
            dist = length(wo);
            wo = normalize(wo);
            // color = reservoirGI.Lo;
            if traceShadowRay(shadingPoint, wo, dist) {
            // if dot(wo, pointInfo.normalShading) < 0. || dot(-wo, reservoirGI.ns) < 0. {
                reservoirGI.W = 0.;
                reservoirGI.w_sum = 0.;
            }
            bsdf = BSDF(pointInfo, wo, wi);
            geometryTerm = reservoirGI.Lo * 4;
                // geometryTerm = reservoirGI.Lo / Jacobian(shadingPoint, reservoirGI);
            color += reservoirGI.W * bsdf * geometryTerm;
        }
    }
    storeColor(&frame, launchIndex, color / max(pointInfo.baseColor, vec3f(1. / 256.)));

    // storeColor(&frame, launchIndex, color);

    // storeColor(&frame, launchIndex, (pointInfo.normalShading + 1) / 2.);
}