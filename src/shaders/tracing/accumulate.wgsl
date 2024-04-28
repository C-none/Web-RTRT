@group(0) @binding(0) var frame : texture_storage_2d<rgba16float, write>;
@group(0) @binding(1) var<uniform> ubo: UBO;
@group(0) @binding(2) var<storage, read> gBuffer : array<vec2u>;

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
    let origin = ubo.origin;

    let launchIndex = GlobalInvocationID.y * screen_size.x + GlobalInvocationID.x;
    var reservoirDI = ReservoirDI();
    var reservoirGI = ReservoirGI();

    var _seed: u32;
    loadReservoir(&previousReservoir, launchIndex, &reservoirDI, &reservoirGI, &_seed);

    if reservoirDI.W < 0.0 {
        textureStore(frame, GlobalInvocationID.xy, vec4f(0.));
    }
    seed = tea(GlobalInvocationID.y * screen_size.x + GlobalInvocationID.x, _seed, 4);
    var pointInfo = PointInfo(reservoirGI.xv, reservoirGI.nv, vec3f(0.), mat3x3f(), vec2f(0.));

    loadGBuffer(launchIndex, &(pointInfo));

    var bsdf = vec3f(0.0);
    var geometryTerm = vec3f(1.0);
    var light = getLight(reservoirDI.lightId);
    let shadingPoint = pointInfo.pos;
    var wi = normalize(origin - shadingPoint);
    var wo = light.position - shadingPoint;
    var dist = length(wo);
    wo = normalize(wo);
    if traceShadowRay(shadingPoint, wo, dist) {
        reservoirDI.W = 0.;
        reservoirDI.w_sum = 0.;
    } else {
        bsdf = BSDF(pointInfo, wo, wi);
        geometryTerm = light.color * light.intensity / (dist * dist);
    }
    color = reservoirDI.W * bsdf * geometryTerm;

    if ENABLE_GI {
    }
    textureStore(frame, GlobalInvocationID.xy, vec4f(color, 1.));
}