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
struct UBO {
    seed: u32,
};
@group(0) @binding(0) var frame : texture_storage_2d<rgba16float, write>;
@group(0) @binding(1) var<uniform> camera : Camera;
@group(0) @binding(2) var<storage, read> bvh : BVH;
@group(0) @binding(3) var<storage, read> vertices : array<vec4f>;
@group(0) @binding(4) var<storage, read> indices : array<u32>;
@group(0) @binding(5) var<storage, read> geometries : array<GeometryInfo>;
@group(0) @binding(6) var albedo: texture_2d_array<f32>;
@group(0) @binding(7) var normalMap: texture_2d_array<f32>;
@group(0) @binding(8) var specularMap: texture_2d_array<f32>;
@group(0) @binding(9) var vBuffer : texture_2d<u32>;
@group(0) @binding(10) var samp: sampler;
@group(0) @binding(11) var<uniform> ubo: UBO;

// #include <common.wgsl>;
// #include <light.wgsl>;
// #include <trace.wgsl>;
// #include <BSDF.wgsl>;

override halfConeAngle:f32=0.0;

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3u) {
    let screen_size: vec2u = textureDimensions(frame);
    if any(GlobalInvocationID.xy >= screen_size) {
        return;
    }
    tea(GlobalInvocationID.y * screen_size.x + GlobalInvocationID.x, ubo.seed, 4);
    let origin: vec3f = (camera.world * vec4f(0.0, 0.0, 0.0, 1.0)).xyz;
    var direction: vec3f = vec3f(0.0);

    let screen_target: vec2f = vec2f(f32(GlobalInvocationID.x) + 0.5, f32(screen_size.y - GlobalInvocationID.y - 1u) + 0.5) / vec2f(screen_size);
    let screen_target_ndc: vec2f = screen_target * 2.0 - 1.0;
    let screen_target_world: vec4f = camera.projInv * vec4f(screen_target_ndc, 1.0, 1.0);
    direction = (camera.world * vec4f(normalize(screen_target_world.xyz), 0.0)).xyz;

    var color = vec4f(0.0, 0.0, 0.0, 1.0);
    // var rayInfo: RayInfo = traceRay(origin, direction);

    // var primaryHit = PrimaryHitInfo(rayInfo.hitAttribute, rayInfo.PrimitiveIndex);
    // if rayInfo.isHit == 0 {
    //     textureStore(frame, GlobalInvocationID.xy, color);
    //     return;
    // }
    var primaryHit = primaryHit(GlobalInvocationID.xy);
    if primaryHit.primId == 0 && all(primaryHit.baryCoord == vec3f(1.0, 0.0, 0.0)) {
        textureStore(frame, GlobalInvocationID.xy, color);
        return;
    }
    
    // var light: Light;
    // light = unpackLight(lights.light[select(1, 0, GlobalInvocationID.x < screen_size.x / 2)]);

    var pointInfo = unpackTriangle(primaryHit, origin, direction, halfConeAngle);
    let light = sampleLight();
    // color = vec4f(pointInfo.normalShading, 1.0);
    var bsdf = vec3f(0.1);
    var shadingPoint: vec3f = pointInfo.pos.xyz;
    var wo = light.position - shadingPoint;
    let distance = length(wo);
    wo = normalize(wo);
    var visibility = 1.0;
    //  pointInfo.normalShading = normalize(pointInfo.tbn * pointInfo.normalShading);
    if traceShadowRay(shadingPoint, wo, distance) {
        visibility = 0.0;
    } else {
        visibility = 1.0;
    }
    pointInfo.normalShading = normalize(pointInfo.tbn * pointInfo.normalShading);
    bsdf = BSDF(pointInfo, wo, -direction);
    var geometryTerm = light.color * light.intensity / (distance * distance);
    color += vec4f(bsdf * geometryTerm * visibility, 1.0);

    // color = vec4f(light.intensity / 30);
    // color = vec4f(pointInfo.baseColor, 1.0);
    textureStore(frame, GlobalInvocationID.xy, color);
}
