
@group(0) @binding(0) var<uniform> sampJitter : vec2<f32>;
@group(0) @binding(1) var samp : sampler;
//@group(0) @binding(2) var currentFrame : texture_2d<f32>;
@group(0) @binding(2) var<storage, read_write> currentFrame : array<vec2u>;
@group(0) @binding(3) var lockInputLuma : texture_2d<f32>;
//@group(0) @binding(4) var reconstructedPreviousDepth : texture_storage_2d<r32float, write>;
@group(0) @binding(4) var<storage, read_write>  reconstructedPreviousDepth : array<i32>;
@group(0) @binding(5) var newLocks : texture_storage_2d<r32float, write>;




// #include <FSR_common.wgsl>;
const BORDER: i32 = 1;
const SHARED_SIZE: i32 = BATCH_SIZE + BORDER * 2;
var<workgroup> sharedInputLockLuma: array<array<f32, SHARED_SIZE>, SHARED_SIZE>;
//var<workgroup> sharedMotionVec: array<array<vec2<f32>, SHARED_SIZE>, SHARED_SIZE>;

var<private> globalInvocationID: vec3<i32> = vec3<i32>(0, 0, 0);
var<private> workgroupID: vec3<i32> = vec3<i32>(0, 0, 0);
var<private> localInvocationID: vec3<i32> = vec3<i32>(0, 0, 0);
fn preload(sharedPos: vec2i, globalPos: vec2i) {
    let globalId = clamp(globalPos, vec2i(0), vec2i(RenderSize()) - 1);
    let lumaValue = textureLoad(lockInputLuma, globalId, 0);
    sharedInputLockLuma[sharedPos.y][sharedPos.x] = lumaValue.x;
    // var visibility: vec4<u32> = textureLoad(vBuffer, globalId, 0);
    // let motionVec: vec2<f32> = unpack2x16float(visibility.x);
    //sharedMotionVec[sharedPos.y][sharedPos.x] = motionVec;
}   
fn slove_cache_idx(iPxPos: vec2<i32>) -> vec2<i32> {
    let group_base = globalInvocationID - localInvocationID - BORDER;
    let ipx_offset: vec2<i32> = iPxPos - group_base.xy;
    let offsets = ipx_offset.x + ipx_offset.y * SHARED_SIZE;
    let idx: vec2<i32> = vec2i(offsets % SHARED_SIZE, offsets / SHARED_SIZE);
    return idx;
}

fn invokePreload(GlobalInvocationID: vec2i, LocalInvocationID: vec2i) {
    let group_base = GlobalInvocationID - LocalInvocationID - BORDER;
    let stage_num = (SHARED_SIZE * SHARED_SIZE + BATCH_SIZE * BATCH_SIZE - 1) / (BATCH_SIZE * BATCH_SIZE);
    for (var i: i32 = 0; i < stage_num; i = i + 1) {
        let threadIdx: i32 = LocalInvocationID.y * BATCH_SIZE + LocalInvocationID.x;
        let virtualIdx: i32 = threadIdx + i * BATCH_SIZE * BATCH_SIZE;
        let loadIdx = vec2i(virtualIdx % SHARED_SIZE, virtualIdx / SHARED_SIZE);
        if i == 0 || virtualIdx < SHARED_SIZE * SHARED_SIZE {
            preload(loadIdx, group_base + loadIdx);
        }
    }
    workgroupBarrier();
}

fn LoadLockInputLuma(iPxPos: vec2<i32>) -> f32 {
    if enCache {
        let sharedPos = slove_cache_idx(iPxPos);
        return sharedInputLockLuma[sharedPos.y][sharedPos.x] ;
    }
    return textureLoad(lockInputLuma, iPxPos, 0).x;
}

fn StoreNewLocks(iPxPos: vec2<i32>, fnewLock: f32) {
    textureStore(newLocks, iPxPos, vec4<f32>(fnewLock, 0, 0, 0));
}
fn StoreReconstructedPreviousDepth(iPxPos: vec2<i32>, fDilatedDepth: i32) {
    //textureStore(reconstructedPreviousDepth, iPxPos, vec4<f32>(fDilatedDepth, 0, 0, 0));\
    var idx = u32(iPxPos.x) * u32(RenderSize().x) + u32(iPxPos.y);
    //atomicStore(&reconstructedPreviousDepth[idx], fDilatedDepth);
    reconstructedPreviousDepth[idx] = fDilatedDepth;
    // var atomic_ptr:
    // atomicMin(atomic_ptr: ptr<SC, atomic<T>, A>, v: T) -> T
}

fn ClearResourcesForNextFrame(iPxHrPos: vec2<i32>) {
    if IsOnScreen(iPxHrPos, RenderSize()) {
        // #if FSR2_OPTION_INVERTED_DEPTH
        //         let UInt32 farZ = 0x0;
        // #else
        let farZ: u32 = 0x3f800000;
        StoreReconstructedPreviousDepth(iPxHrPos, i32(farZ));
    }
}
fn ComputeThinFeatureConfidence(pos: vec2<i32>) -> bool {
    let RADIUS: i32 = 1;

    var fNucleus: f32 = LoadLockInputLuma(pos);

    let similar_threshold: f32 = 1.05;
    var dissimilarLumaMin: f32 = FLT_MAX;
    var dissimilarLumaMax: f32 = 0;
    //  0 1 2
    //  3 4 5
    //  6 7 8
    var mask: u32 = 16; //flag fNucleus as similar

//     let uNumRejectionMasks = 4;
//     let uRejectionMasks[uNumRejectionMasks]: = {
//     1 << 0 | 1 << 1 | 1 << 3 | 1 << 4, //Upper left
//     1 << 1 | 1 << 2 | 1 << 4 | 1 << 5, //Upper right
//     1 << 3 | 1 << 4 | 1 << 6 | 1 << 7, //Lower left
//     1 << 4 | 1 << 5 | 1 << 7 | 1 << 8, //Lower right
// };

    let uNumRejectionMasks = 4;
    // let uRejectionMasks: array<u32,4> = array<u32,4>(
    //     1 + 2 + 8 + 16, //Upper left
    //     2 + 4 + 16 + 32, //Upper right
    //     8 + 16 + 64 + 128, //Lower left
    //     16 + 32 + 128 + 256, //Lower right
    // );

    let uRejectionMasks: array<u32,4> = array<u32,4>(
        (1 << 0) | (1 << 1) | (1 << 3) | (1 << 4), //Upper left
        (1 << 1) | (1 << 2) | (1 << 4) | (1 << 5), //Upper right
        (1 << 3) | (1 << 4) | (1 << 6) | (1 << 7), //Lower left
        (1 << 4) | (1 << 5) | (1 << 7) | (1 << 8), //Lower right
    );

    var idx: i32 = -1;

    for (var y = -RADIUS; y <= RADIUS; y += 1) {
        for (var x = -RADIUS; x <= RADIUS; x += 1) {
            idx += 1;
            if x == 0 && y == 0 {
                continue;
            }

            let samplePos: vec2<i32> = ClampLoad(pos, vec2<i32>(x, y), vec2<i32>(RenderSize()));

            let sampleLuma: f32 = LoadLockInputLuma(samplePos);
            let difference: f32 = max(sampleLuma, fNucleus) / min(sampleLuma, fNucleus);

            if difference > 0 && (difference < similar_threshold) {
                mask |= u32(pow(2, f32(idx)));//1 << idx
            } else {
                dissimilarLumaMin = min(dissimilarLumaMin, sampleLuma);
                dissimilarLumaMax = max(dissimilarLumaMax, sampleLuma);
            }
        }
    }

    let isRidge: bool = fNucleus > dissimilarLumaMax || fNucleus < dissimilarLumaMin;

    if false == isRidge {
        return false;
    }


    for (var i = 0; i < 4; i++) {
        if (mask & uRejectionMasks[i]) == uRejectionMasks[i] {
            return false;
        }
    }
    return true;
}


fn ComputeLock(iPxLrPos: vec2<i32>) {
    if ComputeThinFeatureConfidence(iPxLrPos) {
        StoreNewLocks(ComputeHrPosFromLrPos(iPxLrPos), 1);
    }

    ClearResourcesForNextFrame(iPxLrPos);
}
    
    

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3u, @builtin(workgroup_id) WorkgroupID: vec3u, @builtin(local_invocation_id) LocalInvocationID: vec3u) {
    let origin_size: vec2<i32> = RenderSize();
    let pos: vec2<i32> = vec2<i32>(GlobalInvocationID.xy);
    if enCache {
        globalInvocationID = vec3<i32>(GlobalInvocationID);
        workgroupID = vec3<i32>(WorkgroupID);
        localInvocationID = vec3<i32>(LocalInvocationID);
        invokePreload(vec2i(GlobalInvocationID.xy), vec2i(LocalInvocationID.xy));
    }
    if !IsOnScreen(pos, origin_size) {
        let zlinear = zNear * zFar / (zFar + 0 * (zNear - zFar));
        return;
    }

    ComputeLock(pos);
}