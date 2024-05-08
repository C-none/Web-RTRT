@group(0) @binding(0) var<storage, read_write> frame: array<vec2u>;
@group(0) @binding(1) var<uniform> ubo: UBO;
@group(0) @binding(2) var<storage, read> gBufferTex : array<vec2u>;
@group(0) @binding(3) var<storage, read> gBufferAttri : array<vec4f>;


// #include <common.wgsl>;
// #include <trace.wgsl>;
// #include <reservoir.wgsl>;
// #include <light.wgsl>;
// #include <BSDF.wgsl>;

override ENABLE_GI: bool = true;
override WIDTH: u32;
override HEIGHT: u32;

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3u) {
    let screen_size = vec2u(WIDTH, HEIGHT);
    if any(GlobalInvocationID.xy >= screen_size) {
        return;
    }
    var color = vec3f(0.0);
    var illuminace = vec3f(0.0);
    let origin = ubo.origin;

    let launchIndex = GlobalInvocationID.y * screen_size.x + GlobalInvocationID.x;
    var reservoirDI = ReservoirDI();
    var reservoirGI = ReservoirGI();

    var _seed: u32;
    loadReservoir(&previousReservoir, launchIndex, &reservoirDI, &reservoirGI, &_seed);

    if reservoirDI.W < 0.0 {
        storeColor(&frame, launchIndex, vec3f(0.0));
        return;
    }
    seed = tea(GlobalInvocationID.y * screen_size.x + GlobalInvocationID.x, _seed, 4);
    var pointInfo: PointInfo;
    loadGBuffer(launchIndex, &pointInfo);

    var bsdf = vec3f(0.0);
    var geometryTerm = vec3f(1.0);
    var light = getLight(reservoirDI.lightId);
    let shadingPoint = pointInfo.pos;
    var wi = normalize(origin - shadingPoint);
    var wo = light.position - shadingPoint;
    var dist = length(wo);
    wo = normalize(wo);
    var reflectance = vec3f(0.0);
    if reservoirDI.W > 0. {
        if traceShadowRay(shadingPoint, wo, dist) {
            reservoirDI.W = 0.;
        }
    }
    bsdf = BSDF(pointInfo, wo, wi);
    geometryTerm = light.color * light.intensity * dot(wo, pointInfo.normalShading) / (dist * dist);
    color += reservoirDI.W * bsdf * geometryTerm;
    illuminace += reservoirDI.W * geometryTerm ;
    reflectance += bsdf;
    if ENABLE_GI {
        if reservoirGI.W > 0 {
            wo = reservoirGI.xs - shadingPoint;
            dist = length(wo);
            wo = normalize(wo);
        // color = reservoirGI.Lo;
            if traceShadowRay(shadingPoint, wo, dist) {
            // if dot(wo, pointInfo.normalShading) < 0. || dot(-wo, reservoirGI.ns) < 0. {
                reservoirGI.W = 0.;
            }
        }
        bsdf = BSDF(pointInfo, wo, wi);
        geometryTerm = reservoirGI.Lo * dot(wo, pointInfo.normalShading) * 4 ;
                // geometryTerm = reservoirGI.Lo / Jacobian(shadingPoint, reservoirGI);
        color += reservoirGI.W * bsdf * geometryTerm;
        illuminace += reservoirGI.W * geometryTerm;
    }
    storeColor(&frame, launchIndex, color);
}