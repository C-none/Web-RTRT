@group(0) @binding(0) var frame : texture_storage_2d<rgba16float, write>;
@group(0) @binding(1) var<uniform> ubo: UBO;
@group(0) @binding(2) var<storage, read> gBuffer : array<vec2u>;

// #include <common.wgsl>;
// #include <trace.wgsl>;
// #include <reservoir.wgsl>;
// #include <light.wgsl>;
// #include <BSDF.wgsl>;


@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3u) {
    let screen_size: vec2u = textureDimensions(frame);
    if any(GlobalInvocationID.xy >= screen_size) {
        return;
    }
    var color = vec3f(0.0);
    let origin = ubo.origin;
    tea(GlobalInvocationID.y * screen_size.x + GlobalInvocationID.x, ubo.seed, 4);

    let launchIndex = GlobalInvocationID.y * screen_size.x + GlobalInvocationID.x;
    var reservoirDI = ReservoirDI();
    var reservoirGI = ReservoirGI();

    loadReservoir(&previousReservoir, launchIndex, &reservoirDI, &reservoirGI);

    if reservoirDI.W < 0.0 {
        textureStore(frame, GlobalInvocationID.xy, vec4f(0.));
    }

    var pointInfo = PointInfo(reservoirGI.xv, reservoirGI.nv, vec3f(0.), mat3x3f(), vec2f(0.));
        {
        var baseColor = vec3f(0.);
        var metallicRoughness = vec2f(0.);
        loadGBuffer(launchIndex, &baseColor, &metallicRoughness);
        pointInfo.baseColor = baseColor;
        pointInfo.metallicRoughness = metallicRoughness;
    }

    var light: Light;
    var wo: vec3f;
    var wi: vec3f;
    var dist: f32;
    var bsdf = vec3f(0.0);
    var geometryTerm = vec3f(1.0);
    var visiblity = 0.;
    light = getLight(reservoirDI.lightId);
    let shadingPoint = pointInfo.pos;
    wi = normalize(origin - shadingPoint);
    wo = light.position - shadingPoint;
    dist = length(wo);
    wo = normalize(wo);
    if traceShadowRay(shadingPoint, wo, dist) {
        visiblity = 0.;
    } else {
        visiblity = 1.;
        bsdf = BSDF(pointInfo, wo, wi);
        geometryTerm = light.color * light.intensity / (dist * dist);
    }
    color = reservoirDI.W * bsdf * geometryTerm * visiblity;
    textureStore(frame, GlobalInvocationID.xy, vec4f(color, 1.));
}