struct Camera {
    world: mat4x4<f32>,
    projInv: mat4x4<f32>,
};

@group(0) @binding(0) var frame : texture_storage_2d<rgba16float, write>;
@group(0) @binding(1) var<uniform> camera : Camera;
@group(0) @binding(2) var<storage, read> bvh : BVH;
@group(0) @binding(3) var<storage, read> vertices : array<vec4<f32>>;
@group(0) @binding(4) var<storage, read> indices : array<u32>;
@group(0) @binding(5) var vBuffer : texture_2d<u32>;

struct PrimaryHitInfo {
    barycentricCoord: vec3<f32>,
    primId: u32,
    albedo: vec3<f32>, 
}
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
    // textureStore(frame, vec2<u32 >(GlobalInvocationID.x, GlobalInvocationID.y), vec4<f32 >(screen_target, 0.0, 1.0));
    // var rayInfo: RayInfo = traceRay(origin, direction);
    var color = vec4<f32 >(0.0, 0.0, 0.0, 1.0);
    // if rayInfo.isHit == 1u {
    //     let distance: f32 = rayInfo.hitDistance;
    //     color = vec4<f32 >(vec3<f32 >(distance / 2500.0), 1.0);
    // } else {
    //     color = vec4<f32 >(0.8, 0.0, 0.1, 1.0);
    // }
    // textureStore(frame, vec2<u32 >(GlobalInvocationID.x, GlobalInvocationID.y), color);

    var primaryHit = primaryHit(GlobalInvocationID.xy);
    if primaryHit.primId == 0u && all(primaryHit.barycentricCoord.yz == vec2<f32>(0.0)) {
        color = vec4<f32 >(0.0);
    } else {
        color = vec4<f32 >(primaryHit.barycentricCoord, 1.0);
    }
    textureStore(frame, GlobalInvocationID.xy, color);
}
