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
    worldRayOrigin: vec3f,
    isHit: u32,
    worldRayDirection: vec3f,
    hitDistance: f32,
    directionInverse: vec3f,
    PrimitiveIndex: u32,
    hitAttribute: vec3f,
};


struct PrimHitInfo {
    pos: array<vec4f, 3>
};

struct HitInfo {
    baryCoord: vec3f,
    hitDistance: f32,
    isHit: bool,
};

fn unpackPrimHitInfo(primId: u32) -> PrimHitInfo {
    let offset = vec3u(indices[primId * 3], indices[primId * 3 + 1], indices[primId * 3 + 2]);
    return PrimHitInfo(array<vec4f, 3 >(vertices[offset.x], vertices[offset.y], vertices[offset.z]));
}

fn hitTriangle(rayInfo: RayInfo, triangleIndex: u32) -> HitInfo {
    //Möller-Trumbore algorithm
    let primInfo: PrimHitInfo = unpackPrimHitInfo(triangleIndex);

    let INTERSECT_EPSILON: f32 = 0.00001;
    let origin = rayInfo.worldRayOrigin;
    let direction = rayInfo.worldRayDirection;

    let e1: vec3f = primInfo.pos[1].xyz - primInfo.pos[0].xyz;
    let e2: vec3f = primInfo.pos[2].xyz - primInfo.pos[0].xyz;
    let s1: vec3f = cross(direction, e2);

    let det = dot(e1, s1);
    var ret = HitInfo(vec3<f32 >(0.0), 0.0, false);
    if abs(det) < INTERSECT_EPSILON {
        return ret;
    }
    let s: vec3f = (origin - primInfo.pos[0].xyz) / det;
    let b1 = dot(s, s1);
    if b1 < 0.0 || b1 > 1.0 {
        return ret;
    }
    let s2: vec3f = cross(s, e1);
    let b2 = dot(direction, s2);
    if b2 < 0.0 || b1 + b2 > 1.0 {
        return ret;
    }
    ret.hitDistance = dot(e2, s2);
    if ret.hitDistance < 0.0 && ret.hitDistance < rayInfo.hitDistance {
        return ret;
    }
    ret.baryCoord = vec3<f32 >(1.0 - (b1 + b2), b1, b2);
    // ret.isHit = all(ret.baryCoord > vec3f(0.)) && ret.hitDistance >= 0.0 && ret.hitDistance < rayInfo.hitDistance;
    ret.isHit = true;
    return ret;
}

fn hitAABB(rayInfo: RayInfo, minCorner: vec3f, maxCorner: vec3f) -> bool {
    let t1: vec3f = (minCorner - rayInfo.worldRayOrigin) * rayInfo.directionInverse;
    let t2: vec3f = (maxCorner - rayInfo.worldRayOrigin) * rayInfo.directionInverse;
    let tmin: vec3f = min(t1, t2);
    let tmax: vec3f = max(t1, t2);
    let t_min: f32 = max(max(tmin.x, tmin.y), tmin.z);
    let t_max: f32 = min(min(tmax.x, tmax.y), tmax.z);
    if t_min > t_max || t_max < 0.0 || t_min > rayInfo.hitDistance {
        return false;
    }
    return true;
}
var<private> stack: array<u32, TREE_DEPTH>;
fn traceRay(rayOrigin: vec3f, rayDirection: vec3f) -> RayInfo {
    var rayInfo: RayInfo;
    rayInfo.isHit = 0u;
    rayInfo.hitDistance = 10000.0;
    rayInfo.worldRayDirection = normalize(rayDirection);
    rayInfo.worldRayOrigin = rayOrigin + rayInfo.worldRayDirection * 0.001;
    rayInfo.directionInverse = vec3<f32 >(1.0) / rayDirection;
    rayInfo.PrimitiveIndex = 0u;

    // var stack: array<u32, TREE_DEPTH> = array<u32, TREE_DEPTH >();
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
                if hitInfo.isHit {
                    rayInfo.isHit = 1u;
                    rayInfo.hitDistance = hitInfo.hitDistance;
                    rayInfo.hitAttribute = hitInfo.baryCoord;
                    rayInfo.PrimitiveIndex = node.child;
                }
            }
        }
    }
    return rayInfo;
}

fn traceShadowRay(rayOrigin: vec3f, rayDirection: vec3f, lightDistance: f32) -> bool {
    var rayInfo: RayInfo;
    rayInfo.isHit = 0u;
    rayInfo.hitDistance = lightDistance-0.0001;
    rayInfo.worldRayDirection = normalize(rayDirection);
    rayInfo.worldRayOrigin = rayOrigin + rayInfo.worldRayDirection * 0.001;
    rayInfo.directionInverse = vec3<f32 >(1.0) / rayDirection;
    rayInfo.PrimitiveIndex = 0u;

    // var stack: array<u32, TREE_DEPTH> = array<u32, TREE_DEPTH >();
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
                if hitInfo.isHit {
                    return true;
                }
            }
        }
    }
    return false;
}