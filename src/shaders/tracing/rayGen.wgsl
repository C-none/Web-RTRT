struct Camera {
    world: mat4x4<f32>,
    projInv: mat4x4<f32>,
};

struct BVHNode {
    min: vec3<f32 >,
    isLeaf: u32,
    max: vec3<f32 >,
    child: u32,
};

struct BVH {
    nodes: array<BVHNode>,
};

struct RayInfo {
    worldRayOrigin: vec3<f32>,
    isHit: u32,
    worldRayDirection: vec3<f32>,
    hitDistance: f32,
    directionInverse: vec3<f32>,
    PrimitiveIndex: u32,
    hitAttribute: vec3<f32>,
};

@group(0) @binding(0) var frame : texture_storage_2d<rgba16float, write>;
@group(0) @binding(1) var<uniform> camera : Camera;
@group(0) @binding(2) var<storage,read> bvh : BVH;
@group(0) @binding(3) var<storage,read> vertices : array<vec4<f32>>;
@group(0) @binding(4) var<storage,read> indices : array<vec4<u32>>;


struct PrimHitInfo {
    pos: array<vec4<f32>,3>
};

struct HitInfo {
    barycentricCoord: vec3<f32>,
    hitDistance: f32,
    isHit: bool,
};

fn unpackPrimHitInfo(primId: u32) -> PrimHitInfo {
    // let v0: vec4<f32> = vertices[indices[primId].x];
    // let v1: vec4<f32> = vertices[indices[primId].y];
    // let v2: vec4<f32> = vertices[indices[primId].z];
    // let primInfo: PrimHitInfo = PrimHitInfo(array<vec4<f32>,3>(v0, v1, v2));
    // return primInfo;
    let offset = indices[primId];
    return PrimHitInfo(array<vec4<f32>,3>(vertices[offset.x], vertices[offset.y], vertices[offset.z]));
}

// according to https://www.blurredcode.com/2020/04/%E7%9B%B4%E7%BA%BF%E4%B8%8E%E4%B8%89%E8%A7%92%E5%BD%A2%E7%9B%B8%E4%BA%A4moller-trumbore%E7%AE%97%E6%B3%95%E6%8E%A8%E5%AF%BC/

fn hitTriangle(rayInfo: RayInfo, triangleIndex: u32) -> HitInfo {

    let primInfo: PrimHitInfo = unpackPrimHitInfo(triangleIndex);

    const INTERSECT_EPSILON: f32 = 0.0001;
    let origin = rayInfo.worldRayOrigin;
    let direction = rayInfo.worldRayDirection;

    let e1: vec3<f32> = primInfo.pos[1].xyz - primInfo.pos[0].xyz;
    let e2: vec3<f32> = primInfo.pos[2].xyz - primInfo.pos[0].xyz;
    let s1: vec3<f32> = cross(direction, e2);

    let det = dot(e1, s1);
    if det == 0.0 {
        return HitInfo(vec3<f32>(0.0), 0.0, false);
    }
    let s: vec3<f32> = (origin - primInfo.pos[0].xyz) / det;
    let s2: vec3<f32> = cross(s, e1);

    let t = dot(e2, s2);
    let b1 = dot(s, s1);
    let b2 = dot(direction, s2);

    var ret: HitInfo = HitInfo();
    ret.barycentricCoord = vec3<f32>(1.0 - (b1 + b2), b1, b2);
    ret.hitDistance = t;
    ret.isHit = (t > INTERSECT_EPSILON) && all(ret.barycentricCoord >= vec3<f32>(0.0));
    return ret;
}

fn hitAABB(rayInfo: RayInfo, minCorner: vec3<f32>, maxCorner: vec3<f32>, distance: f32) -> bool {
    let t1: vec3<f32> = (minCorner - rayInfo.worldRayOrigin) * rayInfo.directionInverse;
    let t2: vec3<f32> = (maxCorner - rayInfo.worldRayOrigin) * rayInfo.directionInverse;
    let tmin: vec3<f32> = min(t1, t2);
    let tmax: vec3<f32> = max(t1, t2);
    let t_min: f32 = max(max(tmin.x, tmin.y), tmin.z);
    let t_max: f32 = min(min(tmax.x, tmax.y), tmax.z);
    if t_min > t_max || t_max < 0.0 || t_min > distance {
        return false;
    }
    return true;
}


fn traceRay(rayOrigin: vec3<f32>, rayDirection: vec3<f32>) -> RayInfo {
    var rayInfo: RayInfo;
    rayInfo.isHit = 0u;
    rayInfo.hitDistance = 1000000.0;
    rayInfo.worldRayOrigin = rayOrigin;
    rayInfo.worldRayDirection = normalize(rayDirection);
    rayInfo.directionInverse = vec3<f32>(1.0) / rayDirection;
    rayInfo.PrimitiveIndex = 0u;

    var stack: array<u32, TREE_DEPTH> = array<u32, TREE_DEPTH>();
    var stackCurl: i32 = 0;
    stack[0] = 0u;

    while stackCurl >= 0 {
        let nodeIndex: u32 = stack[stackCurl];
        stackCurl = stackCurl - 1;
        let node: BVHNode = bvh.nodes[nodeIndex];
        if node.isLeaf == 0u {
            if !hitAABB(rayInfo, node.min, node.max, rayInfo.hitDistance) {
                continue;
            }
            stackCurl = stackCurl + 1;
            stack[stackCurl] = node.child;
            stackCurl = stackCurl + 1;
            stack[stackCurl] = node.child + 1u;
            continue;
        }
        let hitInfo = hitTriangle(rayInfo, node.child);
        if hitInfo.isHit && hitInfo.hitDistance < rayInfo.hitDistance {
            rayInfo.isHit = 1u;
            rayInfo.hitDistance = hitInfo.hitDistance;
            rayInfo.hitAttribute = hitInfo.barycentricCoord;
            rayInfo.PrimitiveIndex = node.child;
        }
    }
    return rayInfo;
}

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3<u32>) {
    let screen_size: vec2<u32> = textureDimensions(frame);
    if GlobalInvocationID.x >= screen_size.x || GlobalInvocationID.y >= screen_size.y {
        return;
    }
    let origin: vec3<f32> = (camera.world * vec4<f32 >(0.0, 0.0, 0.0, 1.0)).xyz;
    let screen_target: vec2<f32> = vec2<f32 >(GlobalInvocationID.xy) / vec2<f32 >(screen_size);
    let screen_target_ndc: vec2<f32> = screen_target * 2.0 - 1.0;
    let screen_target_world: vec4<f32> = camera.projInv * vec4<f32 >(screen_target_ndc, 1.0, 1.0);
    let direction: vec3<f32> = (camera.world * vec4<f32 >(normalize(screen_target_world.xyz), 0.0)).xyz;

    let rayInfo: RayInfo = traceRay(origin, direction);
    var color = vec4<f32>(0.0, 0.0, 0.0, 1.0);
    if rayInfo.isHit == 1u {
        let distance: f32 = rayInfo.hitDistance;
        color = vec4<f32>(vec3<f32>(distance / 4.0), 1.0);
    } else {
        color = vec4<f32>(0.0, 0.15, 0.1, 1.0);
    }
    textureStore(frame, vec2<u32>(GlobalInvocationID.x, screen_size.y - GlobalInvocationID.y - 1u), color);
}
