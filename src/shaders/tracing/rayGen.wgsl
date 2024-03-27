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
@group(0) @binding(2) var<storage, read> bvh : BVH;
@group(0) @binding(3) var<storage, read> vertices : array<vec4<f32>>;
@group(0) @binding(4) var<storage, read> indices : array<vec4<u32>>;


struct PrimHitInfo {
    pos: array<vec4<f32>, 3>
};

struct HitInfo {
    barycentricCoord: vec3<f32>,
    hitDistance: f32,
    isHit: bool,
};

fn unpackPrimHitInfo(primId: u32) -> PrimHitInfo {
    let offset = indices[primId];
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
    rayInfo.hitDistance = 1000000.0;
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

//fn hitAABB(rayInfo: RayInfo, minCorner: vec3<f32>, maxCorner: vec3<f32>) -> f32 {
//let t1: vec3<f32> = (minCorner - rayInfo.worldRayOrigin) * rayInfo.directionInverse;
//let t2: vec3<f32> = (maxCorner - rayInfo.worldRayOrigin) * rayInfo.directionInverse;
//let tmin: vec3<f32> = min(t1, t2);
//let tmax: vec3<f32> = max(t1, t2);
//let t_min: f32 = max(max(tmin.x, tmin.y), tmin.z);
//let t_max: f32 = min(min(tmax.x, tmax.y), tmax.z);
//if t_min > t_max || t_max < 0.0 || t_min > rayInfo.hitDistance {
//return -1;
//}
//return max(t_min, 0.0);
//}

//fn traceRay(rayOrigin: vec3<f32>, rayDirection: vec3<f32>) -> RayInfo {
//var rayInfo: RayInfo;
//rayInfo.isHit = 0u;
//rayInfo.hitDistance = 1000000.0;
//rayInfo.worldRayOrigin = rayOrigin;
//rayInfo.worldRayDirection = normalize(rayDirection);
//rayInfo.directionInverse = vec3<f32>(1.0) / rayDirection;
//rayInfo.PrimitiveIndex = 0u;

//// var stack: array<u32, TREE_DEPTH> = array<u32, TREE_DEPTH>();
//// var stackCurl: i32 = 0;
//// stack[0] = 0u;

//// while stackCurl >= 0 {
////     let nodeIndex: u32 = stack[stackCurl];
////     stackCurl = stackCurl - 1;
////     let node: BVHNode = bvh.nodes[nodeIndex];

////     if hitAABB(rayInfo, node.min, node.max) {
////         if (node.isLeaf & 1u) == 0u {
////             let leftChildFarther: u32 = u32(rayInfo.worldRayDirection[((node.isLeaf & 6) >> 1)] > 0.0);

////             stackCurl = stackCurl + 1;
////             stack[stackCurl] = node.child + leftChildFarther;
////             stackCurl = stackCurl + 1;
////             stack[stackCurl] = node.child + 1u - leftChildFarther;
////         } else {
////             let hitInfo = hitTriangle(rayInfo, node.child);
////             if hitInfo.isHit && hitInfo.hitDistance < rayInfo.hitDistance {
////                 rayInfo.isHit = 1u;
////                 rayInfo.hitDistance = hitInfo.hitDistance;
////                 rayInfo.hitAttribute = hitInfo.barycentricCoord;
////                 rayInfo.PrimitiveIndex = node.child;
////             }
////         }
////     }
//// }
//// return rayInfo;


//var stackChild: array<u32, TREE_DEPTH> = array<u32, TREE_DEPTH>();
//var stackDistance: array<f32, TREE_DEPTH> = array<f32, TREE_DEPTH>();
//var stackIsLeaf: array<u32, TREE_DEPTH> = array<u32, TREE_DEPTH>();
//var stackCurl: i32 = 0;

//let root = bvh.nodes[0];

//stackChild[0] = root.child;
//stackDistance[0] = hitAABB(rayInfo, root.min, root.max);
//stackIsLeaf[0] = root.isLeaf;

//while stackCurl >= 0 {
//let nodeChild: u32 = stackChild[stackCurl];
//let nodeDistance: f32 = stackDistance[stackCurl];
//let nodeIsLeaf: u32 = stackIsLeaf[stackCurl];
//stackCurl = stackCurl - 1;
//if nodeDistance > rayInfo.hitDistance {
//continue;
//}

//if (nodeIsLeaf & 1u) == 0u {
//var letfChild: BVHNode = bvh.nodes[nodeChild];
//var rightChild: BVHNode = bvh.nodes[nodeChild + 1u];
//var leftChildDistance: f32 = hitAABB(rayInfo, letfChild.min, letfChild.max);
//var rightChildDistance: f32 = hitAABB(rayInfo, rightChild.min, rightChild.max);
//if leftChildDistance > rightChildDistance {
//let temp = letfChild;
//letfChild = rightChild;
//rightChild = temp;
//let tempDistance = leftChildDistance;
//leftChildDistance = rightChildDistance;
//rightChildDistance = tempDistance;
//}

//if rightChildDistance >= 0.0 {
//stackCurl = stackCurl + 1;
//stackChild[stackCurl] = rightChild.child;
//stackDistance[stackCurl] = rightChildDistance;
//stackIsLeaf[stackCurl] = rightChild.isLeaf;
//}

//if leftChildDistance >= 0.0 {
//stackCurl = stackCurl + 1;
//stackChild[stackCurl] = letfChild.child;
//stackDistance[stackCurl] = leftChildDistance;
//stackIsLeaf[stackCurl] = letfChild.isLeaf;
//}
//} else {
//let hitInfo = hitTriangle(rayInfo, nodeChild);
//if hitInfo.isHit && hitInfo.hitDistance < rayInfo.hitDistance {
//rayInfo.isHit = 1u;
//rayInfo.hitDistance = hitInfo.hitDistance;
//rayInfo.hitAttribute = hitInfo.barycentricCoord;
//rayInfo.PrimitiveIndex = nodeChild;
//}
//}
//}
//return rayInfo;
//}

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

    var rayInfo: RayInfo = RayInfo();
    //for (var i = 0; i < 2; i = i + 1) {
    rayInfo = traceRay(origin, direction);
    //}
    var color = vec4<f32 >(0.0, 0.0, 0.0, 1.0);
    if rayInfo.isHit == 1u {
        let distance: f32 = rayInfo.hitDistance;
        color = vec4<f32 >(vec3<f32 >(distance / 2500.0), 1.0);
    } else {
        color = vec4<f32 >(0.0, 0.15, 0.1, 1.0);
    }
    textureStore(frame, vec2<u32 >(GlobalInvocationID.x, screen_size.y - GlobalInvocationID.y - 1u), color);
}
