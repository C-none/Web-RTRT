@group(0) @binding(0) var frame : texture_storage_2d<rgba16float, write>;
@group(0) @binding(1) var<uniform> ubo: UBO;
@group(0) @binding(2) var<storage, read> gBufferTex : array<vec2u>;
@group(0) @binding(3) var<storage, read> gBufferAttri : array<vec4f>;


// #include <common.wgsl>;
// #include <trace.wgsl>;
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
    var illuminace = vec3f(0.0);
    let origin = ubo.origin;

    let launchIndex = GlobalInvocationID.y * screen_size.x + GlobalInvocationID.x;
    var reservoirDI = ReservoirDI();
    var reservoirGI = ReservoirGI();

    var _seed: u32;
    loadReservoir(&previousReservoir, launchIndex, &reservoirDI, &reservoirGI, &_seed);

    if reservoirDI.W < 0.0 {
        textureStore(frame, GlobalInvocationID.xy, vec4f(0.));
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
    if reservoirDI.W > 0. {
        if traceShadowRay(shadingPoint, wo, dist) {
            reservoirDI.W = 0.;
            // reservoirDI.w_sum = 0.;
        } else {
            bsdf = BSDF(pointInfo, wo, wi);
            geometryTerm = light.color * light.intensity / (dist * dist);
        }
        color += reservoirDI.W * bsdf * geometryTerm;
        illuminace += reservoirDI.W * geometryTerm;
    }
    if ENABLE_GI {
        if reservoirGI.W > 0 {
            wo = reservoirGI.xs - shadingPoint;
            dist = length(wo);
            wo = normalize(wo);
        // color = reservoirGI.Lo;
            if dot(wo, pointInfo.normalShading) < 0. || dot(-wo, reservoirGI.ns) < 0. || traceShadowRay(shadingPoint, wo, dist) {
                reservoirGI.W = 0.;
                // reservoirGI.w_sum = 0.;
            } else {
                bsdf = BSDF(pointInfo, wo, wi);
                geometryTerm = reservoirGI.Lo * 4;
                // geometryTerm = reservoirGI.Lo / Jacobian(shadingPoint, reservoirGI);
            }
            color += reservoirGI.W * bsdf * geometryTerm;
            illuminace += reservoirGI.W * geometryTerm;
        }
    }
    textureStore(frame, GlobalInvocationID.xy, vec4f(color, 1.));
}