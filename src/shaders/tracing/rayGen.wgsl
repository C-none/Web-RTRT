struct Camera {
    world: mat4x4<f32>,
    projInv: mat4x4<f32>,
};
struct GeometryInfo {
    id: vec4<u32>,
    normal: vec3<f32>,
    tangent: vec4<f32>,
    uv: vec2<f32>,
};
@group(0) @binding(0) var frame : texture_storage_2d<rgba16float, write>;
@group(0) @binding(1) var<uniform> camera : Camera;
@group(0) @binding(2) var<storage, read> bvh : BVH;
@group(0) @binding(3) var<storage, read> vertices : array<vec4<f32>>;
@group(0) @binding(4) var<storage, read> indices : array<u32>;
@group(0) @binding(5) var<storage, read> geometries : array<GeometryInfo>;
@group(0) @binding(6) var albedo: texture_2d_array<f32>;
@group(0) @binding(7) var normalMap: texture_2d_array<f32>;
@group(0) @binding(8) var specularMap: texture_2d_array<f32>;
@group(0) @binding(9) var vBuffer : texture_2d<u32>;
@group(0) @binding(10) var samp: sampler;

struct PrimaryHitInfo {
    barycentricCoord: vec3<f32>,
    primId: u32,
    albedo: vec3<f32>, 
};

fn primaryHit(screen_pos: vec2<u32>) -> PrimaryHitInfo {
    let visibilityInfo = textureLoad(vBuffer, screen_pos, 0);
    var primaryHitInfo: PrimaryHitInfo = PrimaryHitInfo();
    let bataGamma = unpack2x16float(visibilityInfo.x);
    primaryHitInfo.barycentricCoord = vec3<f32>(1.0 - bataGamma.x - bataGamma.y, bataGamma.x, bataGamma.y);
    primaryHitInfo.primId = visibilityInfo.z;
    primaryHitInfo.albedo = unpack4x8unorm(visibilityInfo.w).xyz;
    return primaryHitInfo;
}

// #include <trace.wgsl>;

struct PointInfo {
    pos: vec4<f32>,
    albedoId: u32,
    normalMapId: u32,
    specularMapId: u32,
    materialId: u32,
    normal: vec3<f32>,
    uv: vec2<f32>,
}

fn unpackTriangle(triangle: PrimaryHitInfo) -> PointInfo {
    let offset = vec3<u32>(indices[triangle.primId * 3], indices[triangle.primId * 3 + 1], indices[triangle.primId * 3 + 2]);
    let vtx = array<vec4<f32>, 3 >(vertices[offset.x], vertices[offset.y], vertices[offset.z]);
    let geo = array<GeometryInfo, 3 >(geometries[offset.x], geometries[offset.y], geometries[offset.z]);
    var retInfo: PointInfo = PointInfo();
    retInfo.pos = vec4<f32 >(triangle.barycentricCoord.x * vtx[0].xyz + triangle.barycentricCoord.y * vtx[1].xyz + triangle.barycentricCoord.z * vtx[2].xyz, 1.0);
    retInfo.albedoId = geo[0].id.x;
    retInfo.normalMapId = geo[0].id.y;
    retInfo.specularMapId = geo[0].id.z;
    retInfo.materialId = geo[0].id.w;
    retInfo.normal = normalize(triangle.barycentricCoord.x * geo[0].normal.xyz + triangle.barycentricCoord.y * geo[1].normal.xyz + triangle.barycentricCoord.z * geo[2].normal.xyz);
    retInfo.uv = triangle.barycentricCoord.x * geo[0].uv.xy + triangle.barycentricCoord.y * geo[1].uv.xy + triangle.barycentricCoord.z * geo[2].uv.xy;
    return retInfo;
}

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3<u32>) {
    let screen_size: vec2<u32> = textureDimensions(frame);
    if GlobalInvocationID.x >= screen_size.x || GlobalInvocationID.y >= screen_size.y {
        return;
    }

    let origin: vec3<f32> = (camera.world * vec4<f32 >(0.0, 0.0, 0.0, 1.0)).xyz;
    let screen_target: vec2<f32> = vec2<f32>(f32(GlobalInvocationID.x), f32(screen_size.y - GlobalInvocationID.y - 1u)) / vec2<f32>(screen_size);
    let screen_target_ndc: vec2<f32> = screen_target * 2.0 - 1.0;
    let screen_target_world: vec4<f32> = camera.projInv * vec4<f32 >(screen_target_ndc, 1.0, 1.0);
    let direction: vec3<f32> = (camera.world * vec4<f32 >(normalize(screen_target_world.xyz), 0.0)).xyz;

    var color = vec4<f32 >(0.0, 0.0, 0.0, 1.0);
    var rayInfo: RayInfo = traceRay(origin, direction);
    // if rayInfo.isHit == 1u {
    //     let distance: f32 = rayInfo.hitDistance;
    //     color = vec4<f32 >(distance / 2.5, distance / 2.5, distance / 2.5, 1.0);
    // } else {
    //     color = vec4<f32 >(0.0, 0.0, 0.0, 1.0);
    // }
    // textureStore(frame, GlobalInvocationID.xy, color);

    var primaryHit = primaryHit(GlobalInvocationID.xy);
    if primaryHit.primId == 0u && all(primaryHit.barycentricCoord.yz == vec2<f32>(0.0)) {
        color = vec4<f32 >(0.0, 0.0, 0.0, 1.0);
    } else {
        let pointInfo = unpackTriangle(primaryHit);
        color = textureSampleLevel(albedo, samp, pointInfo.uv, pointInfo.albedoId, 0);
    }
    textureStore(frame, GlobalInvocationID.xy, color);
}
