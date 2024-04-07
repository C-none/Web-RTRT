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


struct PrimHitInfo {
    pos: array<vec4<f32>, 3>
};

struct HitInfo {
    barycentricCoord: vec3<f32>,
    hitDistance: f32,
    isHit: bool,
};

fn unpackPrimHitInfo(primId: u32) -> PrimHitInfo {
    let offset = vec3<u32>(indices[primId * 3], indices[primId * 3 + 1], indices[primId * 3 + 2]);
    return PrimHitInfo(array<vec4<f32>, 3 >(vertices[offset.x], vertices[offset.y], vertices[offset.z]));
}

fn hitTriangle(rayInfo: RayInfo, triangleIndex: u32) -> HitInfo {
    //Möller-Trumbore algorithm
    let primInfo: PrimHitInfo = unpackPrimHitInfo(triangleIndex);

    let INTERSECT_EPSILON: f32 = 0.00001;
    let origin = rayInfo.worldRayOrigin;
    let direction = rayInfo.worldRayDirection;

    let e1: vec3<f32> = primInfo.pos[1].xyz - primInfo.pos[0].xyz;
    let e2: vec3<f32> = primInfo.pos[2].xyz - primInfo.pos[0].xyz;
    let s1: vec3<f32> = cross(direction, e2);

    let det = dot(e1, s1);
    var ret = HitInfo(vec3<f32 >(0.0), 0.0, false);
    if det < INTERSECT_EPSILON && det > -INTERSECT_EPSILON {
        return ret;
    }

    let s: vec3<f32> = (origin - primInfo.pos[0].xyz) / det;
    let b1 = dot(s, s1);
    if b1 < 0.0 || b1 > 1.0 {
        return ret;
    }

    let s2: vec3<f32> = cross(s, e1);
    let b2 = dot(direction, s2);
    if b2 < 0.0 || b1 + b2 > 1.0 {
        return ret;
    }
    ret.barycentricCoord = vec3<f32 >(1.0 - (b1 + b2), b1, b2);
    ret.hitDistance = dot(e2, s2);
    ret.isHit = true;
    return ret;
}

fn hitAABB(rayInfo: RayInfo, minCorner: vec3<f32>, maxCorner: vec3<f32>) -> bool {
    let t1: vec3<f32> = (minCorner - rayInfo.worldRayOrigin) * rayInfo.directionInverse;
    let t2: vec3<f32> = (maxCorner - rayInfo.worldRayOrigin) * rayInfo.directionInverse;
    let tmin: vec3<f32> = min(t1, t2);
    let tmax: vec3<f32> = max(t1, t2);
    let t_min: f32 = max(max(tmin.x, tmin.y), tmin.z);
    let t_max: f32 = min(min(tmax.x, tmax.y), tmax.z);
    if t_min > t_max || t_max < 0.0 || t_min > rayInfo.hitDistance {
        return false;
    }
    return true;
}

fn traceRay(rayOrigin: vec3<f32>, rayDirection: vec3<f32>) -> RayInfo {
    var rayInfo: RayInfo;
    rayInfo.isHit = 0u;
    rayInfo.hitDistance = 10000.0;
    rayInfo.worldRayOrigin = rayOrigin;
    rayInfo.worldRayDirection = normalize(rayDirection);
    rayInfo.directionInverse = vec3<f32 >(1.0) / rayDirection;
    rayInfo.PrimitiveIndex = 0u;

    var stack: array<u32, TREE_DEPTH> = array<u32, TREE_DEPTH >();
    var stackCurl: i32 = 0;
    stack[0] = 0u;

    while stackCurl >= 0 {
        let nodeIndex: u32 = stack[stackCurl];
        stackCurl = stackCurl - 1;
        let node: BVHNode = bvh.nodes[nodeIndex];

        if hitAABB(rayInfo, node.min, node.max) {
            if (node.isLeaf & 1u) == 0u {
                //(node.isLeaf & 6) >> 1): split axis; x=0,y=1,z=2 the same as emun Axis in bvh.ts
                let leftChildFarther: u32 = u32(rayInfo.worldRayDirection[((node.isLeaf & 6) >> 1)] > 0.0);
                stackCurl = stackCurl + 1;
                stack[stackCurl] = node.child + leftChildFarther;
                stackCurl = stackCurl + 1;
                stack[stackCurl] = node.child + 1u - leftChildFarther;
            } else {
                let hitInfo = hitTriangle(rayInfo, node.child);
                if hitInfo.isHit && hitInfo.hitDistance < rayInfo.hitDistance {
                    rayInfo.isHit = 1u;
                    rayInfo.hitDistance = hitInfo.hitDistance;
                    rayInfo.hitAttribute = hitInfo.barycentricCoord;
                    rayInfo.PrimitiveIndex = node.child;
                }
            }
        }
    }
    return rayInfo;
}

fn traceShadowRay(rayOrigin: vec3<f32>, rayDirection: vec3<f32>, lightDistance: f32) -> bool {
    var rayInfo: RayInfo;
    rayInfo.isHit = 0u;
    rayInfo.hitDistance = lightDistance-0.0001;
    rayInfo.worldRayOrigin = rayOrigin;
    rayInfo.worldRayDirection = normalize(rayDirection);
    rayInfo.directionInverse = vec3<f32 >(1.0) / rayDirection;
    rayInfo.PrimitiveIndex = 0u;

    var stack: array<u32, TREE_DEPTH> = array<u32, TREE_DEPTH >();
    var stackCurl: i32 = 0;
    stack[0] = 0u;

    while stackCurl >= 0 {
        let nodeIndex: u32 = stack[stackCurl];
        stackCurl = stackCurl - 1;
        let node: BVHNode = bvh.nodes[nodeIndex];

        if hitAABB(rayInfo, node.min, node.max) {
            if (node.isLeaf & 1u) == 0u {
                //(node.isLeaf & 6) >> 1): split axis; x=0,y=1,z=2 the same as emun Axis in bvh.ts
                let leftChildFarther: u32 = u32(rayInfo.worldRayDirection[((node.isLeaf & 6) >> 1)] > 0.0);
                stackCurl = stackCurl + 1;
                stack[stackCurl] = node.child + leftChildFarther;
                stackCurl = stackCurl + 1;
                stack[stackCurl] = node.child + 1u - leftChildFarther;
            } else {
                let hitInfo = hitTriangle(rayInfo, node.child);
                if hitInfo.isHit && hitInfo.hitDistance < rayInfo.hitDistance {
                    return true;
                }
            }
        }
    }
    return false;
}