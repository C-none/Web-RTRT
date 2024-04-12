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
@group(0) @binding(2) var<storage, read> bvh : BVH;
@group(0) @binding(3) var<storage, read> vertices : array<vec4f>;
@group(0) @binding(4) var<storage, read> indices : array<u32>;
@group(0) @binding(5) var<storage, read> geometries : array<GeometryInfo>;
@group(0) @binding(6) var albedo: texture_2d_array<f32>;
@group(0) @binding(7) var normalMap: texture_2d_array<f32>;
@group(0) @binding(8) var specularMap: texture_2d_array<f32>;
@group(0) @binding(9) var vBuffer : texture_2d<u32>;
@group(0) @binding(10) var samp: sampler;

struct PrimaryHitInfo {
    barycentricCoord: vec3f,
    primId: u32,
};

fn primaryHit(screen_pos: vec2u) -> PrimaryHitInfo {
    let visibilityInfo = textureLoad(vBuffer, screen_pos, 0);
    var primaryHitInfo: PrimaryHitInfo = PrimaryHitInfo();
    let bataGamma = bitcast<vec2f>(visibilityInfo.xy);
    primaryHitInfo.barycentricCoord = vec3f(1.0 - bataGamma.x - bataGamma.y, bataGamma.x, bataGamma.y);
    primaryHitInfo.primId = visibilityInfo.z;
    return primaryHitInfo;
}

struct PointInfo {
    pos: vec4f,
    albedoId: u32,
    normalMapId: u32,
    specularMapId: u32,
    normalGeo: vec3f,
    normalShading: vec3f,
    uv: vec2f,
    uvGrad: vec2f,
    baseColor: vec3f,
    metallicRoughness: vec2f,
};
// #include <common.wgsl>;
// #include <trace.wgsl>;

fn pow5(x: f32) -> f32 {
    let x1 = x;
    let x2 = x1 * x1;
    return x2 * x2 * x1;
}

fn Fdiffuse(baseColor: vec3f, roughness: f32, ndoti: f32, ndoto: f32, hdoto: f32) -> vec3f {
    let FD90 = 0.5 + 2. * roughness * hdoto * hdoto;
    let FDwi = mix(1., FD90, pow5(1. - ndoti));
    let FDwo = mix(1., FD90, pow5(1. - ndoto));
    return baseColor / PI * FDwi * ndoto;
}

fn SmithGGX(ndoti: f32, ndoti2: f32, alpha2: f32) -> f32 {
    return 1.0 / (ndoti + sqrt(alpha2 + ndoti2 - ndoti2 * alpha2));
}

fn Fmetallic(baseColor: vec3f, roughness: f32, ndoth: f32, h: vec3f, hdoto: f32, ndoti: f32, ndoto: f32) -> vec3f {

    let Fm = mix(baseColor, vec3f(1.), pow5(1. - hdoto));
    // GTR2
    let alpha = max(0.001, roughness * roughness);
    let alpha2 = alpha * alpha;
    let t = 1.0 + (alpha2 - 1.0) * ndoth * ndoth;
    let Dm = alpha2 / (PI * t * t);
    // smith GGX 
    let ndoti2 = ndoti * ndoti;
    let ndoto2 = ndoto * ndoto;
    let Gm = SmithGGX(ndoti, ndoti2, alpha2) * SmithGGX(ndoto, ndoto2, alpha2);
    return Fm * Dm * Gm / 4.0 * ndoti;
}

fn BSDF(shadingPoint: PointInfo, wo: vec3f, wi: vec3f) -> vec3f {
    let h = normalize(wi + wo);
    let ndoti = max(0.0, dot(shadingPoint.normalShading, wi));
    let ndoto = max(0.0, dot(shadingPoint.normalShading, wo));
    let hdoto = dot(h, wo);
    let ndoth = max(0.0, dot(shadingPoint.normalShading, h));
    let diffuse = Fdiffuse(shadingPoint.baseColor, shadingPoint.metallicRoughness.y, ndoti, ndoto, hdoto);
    let metallic = Fmetallic(shadingPoint.baseColor, shadingPoint.metallicRoughness.y, ndoth, h, hdoto, ndoti, ndoto);
    return (1.0 - shadingPoint.metallicRoughness.x) * diffuse + (shadingPoint.metallicRoughness.x) * metallic;
}

struct Light {
    position: vec3f,
    color: vec3f,
    intensity: f32,
};
const lights: array<Light, 1> = array<Light, 1>(Light(vec3f(0.0, 5.0, 0.0), vec3f(1.0, 1.0, 1.0), 40.0));

override halfConeAngle:f32=0.0;

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3u) {
    let screen_size: vec2u = textureDimensions(frame);
    if GlobalInvocationID.x >= screen_size.x || GlobalInvocationID.y >= screen_size.y {
        return;
    }
    let origin: vec3f = (camera.world * vec4f(0.0, 0.0, 0.0, 1.0)).xyz;
    let screen_target: vec2f = vec2f(f32(GlobalInvocationID.x) + 0.5, f32(screen_size.y - GlobalInvocationID.y - 1u) + 0.5) / vec2f(screen_size);
    let screen_target_ndc: vec2f = screen_target * 2.0 - 1.0;
    let screen_target_world: vec4f = camera.projInv * vec4f(screen_target_ndc, 1.0, 1.0);
    let direction: vec3f = (camera.world * vec4f(normalize(screen_target_world.xyz), 0.0)).xyz;

    var color = vec4f(0.0, 0.0, 0.0, 1.0);
    // var rayInfo: RayInfo = traceRay(origin, direction);

    // var primaryHit = PrimaryHitInfo(rayInfo.hitAttribute, rayInfo.PrimitiveIndex);
    // if rayInfo.isHit == 0 {
    //     textureStore(frame, GlobalInvocationID.xy, color);
    //     return;
    // }
    var primaryHit = primaryHit(GlobalInvocationID.xy);
    if primaryHit.primId == 0 && all(primaryHit.barycentricCoord == vec3f(1.0, 0.0, 0.0)) {
        textureStore(frame, GlobalInvocationID.xy, color);
        return;
    }
    var pointInfo = unpackTriangle(primaryHit, origin, direction, halfConeAngle);
    // color = vec4f(pointInfo.normalShading, 1.0);
    var bsdf = vec3f(0.1);
    var shadingPoint: vec3f = pointInfo.pos.xyz;
    var wo = lights[0].position - shadingPoint;
    let distance = length(wo);
    wo = normalize(wo);
    var visibility = 1.0;
    var geometryTerm = lights[0].intensity / (distance * distance);

    if traceShadowRay(shadingPoint, wo, distance) {
        visibility = 0.0;
    } else {
        visibility = 1.0;
        bsdf = BSDF(pointInfo, wo, -direction);
    }
    color = vec4f(bsdf * geometryTerm * visibility, 1.0);
    
    // color = vec4f(bsdf, 1.0);
    // color = vec4f((pointInfo.normalShading + 1.0) / 2.0, 1.0);


    textureStore(frame, GlobalInvocationID.xy, color);
}
