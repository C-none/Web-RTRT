


@group(0) @binding(0) var<uniform> sampJitter : vec2<f32>;
@group(0) @binding(1) var samp : sampler;
// @group(0) @binding(2) var currentFrame : texture_2d<f32>;
// @group(0) @binding(3) var previousFrame : texture_2d<f32>;
@group(0) @binding(2) var<storage, read_write> currentFrame : array<vec2u>;
@group(0) @binding(3) var<storage, read_write> previousFrame : array<vec2u>;
@group(0) @binding(4) var vBuffer : texture_2d<u32>;
@group(0) @binding(5) var depthBuffer : texture_depth_2d;
@group(0) @binding(6) var dilatedDepth : texture_storage_2d<r32float, write>;
// @group(0) @binding(7) var reconstructedPreviousDepth : texture_storage_2d<r32, read_write>;
@group(0) @binding(7) var<storage, read_write>  reconstructedPreviousDepth : array<i32>;
@group(0) @binding(8) var dilatedMotionVectors : texture_storage_2d<rgba16float, write>;
@group(0) @binding(9) var lockInputLuma : texture_storage_2d<r32float, write>;
@group(0) @binding(10) var previousdepthBuffer : texture_depth_2d;

// #include <FSR_common.wgsl>;

const BORDER: i32 = 1;
const SHARED_SIZE: i32 = BATCH_SIZE + BORDER * 2;



var<workgroup> sharedDepth: array<array<f32, SHARED_SIZE>, SHARED_SIZE>;
//var<workgroup> sharedMotionVec: array<array<vec2<f32>, SHARED_SIZE>, SHARED_SIZE>;

var<private> globalInvocationID: vec3<i32> = vec3<i32>(0, 0, 0);
var<private> workgroupID: vec3<i32> = vec3<i32>(0, 0, 0);
var<private> localInvocationID: vec3<i32> = vec3<i32>(0, 0, 0);
fn preload(sharedPos: vec2i, globalPos: vec2i) {
    let globalId = clamp(globalPos, vec2i(0), vec2i(RenderSize()) - 1);
    let depthValue = textureLoad(depthBuffer, globalId, 0);
    sharedDepth[sharedPos.y][sharedPos.x] = depthValue;
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




fn LoadInputMotionVector(iPxHrPos: vec2<i32>) -> vec2<f32> {
    var visibility: vec4<u32> = textureLoad(vBuffer, iPxHrPos, 0);
    let motionVec: vec2<f32> = unpack2x16float(visibility.x);
    //return vec2<f32>(0,0);
    return motionVec;
}

fn LoadInputColor(iPxPos: vec2<i32>) -> vec3<f32> {
    //return textureLoad(rawColor, iPxPos, 0).xyz;
    let idx: i32 = iPxPos.y * _renderWidth + iPxPos.x;
    let data = currentFrame[idx];
    let color: vec3<f32> = vec3f(unpack2x16float(data.x).xy, unpack2x16float(data.y).x);

    return color;
}
fn LoadInputDepth(iPxPos: vec2<i32>) -> f32 {
    if enCache {
        let sharedPos = slove_cache_idx(iPxPos);
        return sharedDepth[sharedPos.y][sharedPos.x] ;
    }
    return textureLoad(depthBuffer, iPxPos, 0);
}


// fn LoadDilatedDepth(iPxPos: vec2<i32>) -> f32 {
//     return textureLoad(dilatedDepth, iPxPos, 0);
// }
fn StoreDilatedDepth(iPxPos: vec2<i32>, fDilatedDepth: f32) {
    textureStore(dilatedDepth, iPxPos, vec4<f32>(fDilatedDepth, 0, 0, 0));
}
// fn LoadReconstructedPreviousDepth(iPxPos: vec2<i32>) -> f32 {
//     return textureLoad(reconstructedPreviousDepth, iPxPos, 0);
// }
fn StoreReconstructedPreviousDepth(iPxPos: vec2<i32>, fDilatedDepth: i32) {
    //textureStore(reconstructedPreviousDepth, iPxPos, vec4<f32>(fDilatedDepth, 0, 0, 0));\
    var idx = u32(iPxPos.x) * u32(RenderSize().x) + u32(iPxPos.y);
    //atomicMin(&reconstructedPreviousDepth[idx], fDilatedDepth);
    reconstructedPreviousDepth[idx] = fDilatedDepth;
    // var atomic_ptr:
    // atomicMin(atomic_ptr: ptr<SC, atomic<T>, A>, v: T) -> T
}
// fn LoadDilatedMotionVector(iPxPos: vec2<i32>) -> vec2<f32> {
//     var dilatedMotionVec: u32 = textureLoad(dilatedMotionVectors, iPxPos, 0);
//     let motionVec: vec2<f32> = unpack2x16float(dilatedMotionVec);
//     return motionVec;
// }
fn StoreDilatedMotionVector(iPxPos: vec2<i32>, dilatedMotionVec: vec2<f32>) {
    var uvalue: u32 = pack2x16float(dilatedMotionVec);
    //var fptr: ptr<function,f32> = ptr<function,f32>(&uvalue);
    textureStore(dilatedMotionVectors, iPxPos, vec4<f32>(dilatedMotionVec, 0, 0));
}
// fn LoadLockInputLuma(iPxPos: vec2<i32>) -> f32 {
//     return textureLoad(lockInputLuma, iPxPos, 0);
// }
fn StoreLockInputLuma(iPxPos: vec2<i32>, flockInputLuma: f32) {
    textureStore(lockInputLuma, iPxPos, vec4<f32>(flockInputLuma, 0, 0, 0));
}


fn ComputeLockInputLuma(iPxLrPos: vec2<i32>) -> f32 {
    // We assume linear data. if non-linear input (sRGB, ...),
    // then we should convert to linear first and back to sRGB on output.
    var fRgb: vec3<f32> = max(vec3<f32>(0, 0, 0), LoadInputColor(iPxLrPos));

    // Use internal auto exposure for locking logic
    fRgb /= PreExposure();
    fRgb *= Exposure();

    // compute luma used to lock pixels, if used elsewhere the pow must be moved!
    let fLockInputLuma: f32 = pow(RGBToPerceivedLuma(fRgb), f32(1.0 / 6.0));

    return fLockInputLuma;
}
fn RectificationBoxAddInitialSample(rectificationBox: ptr<function,RectificationBox>, colorSample: vec3<f32>, fSampleWeight: f32) {
    (*rectificationBox).aabbMin = colorSample;
    (*rectificationBox).aabbMax = colorSample;

    let weightedSample: vec3<f32> = colorSample * fSampleWeight;
    (*rectificationBox).boxCenter = weightedSample;
    (*rectificationBox).boxVec = colorSample * weightedSample;
    (*rectificationBox).fBoxCenterWeight = fSampleWeight;
}
fn RectificationBoxAddSample(bInitialSample: bool, rectificationBox: ptr<function,RectificationBox>, colorSample: vec3<f32>, fSampleWeight: f32) {
    if bInitialSample {
        RectificationBoxAddInitialSample(rectificationBox, colorSample, fSampleWeight);
    } else {
        (*rectificationBox).aabbMin = min((*rectificationBox).aabbMin, colorSample);
        (*rectificationBox).aabbMax = max((*rectificationBox).aabbMax, colorSample);

        let weightedSample: vec3<f32> = colorSample * fSampleWeight;
        (*rectificationBox).boxCenter += weightedSample;
        (*rectificationBox).boxVec += colorSample * weightedSample;
        (*rectificationBox).fBoxCenterWeight += fSampleWeight;
    }
}




fn ReconstructPrevDepth(iPxPos: vec2<i32>, fDepth: f32, fMotionVector: vec2<f32>, iPxDepthSize: vec2<i32>) -> bool {
    var _fMotionVector: vec2<f32> = vec2<f32>(0, 0);
    if length(fMotionVector * vec2<f32>(DisplaySize())) > 0.1 {
        _fMotionVector = fMotionVector;
    }
    let fUv: vec2<f32> = (vec2<f32>(iPxPos) + vec2<f32>(0.5, 0.5)) / vec2<f32>(iPxDepthSize);
    let fReprojectedUv: vec2<f32> = fUv - _fMotionVector;

    let bilinearInfo: BilinearSamplingData = GetBilinearSamplingData(fReprojectedUv, RenderSize());

    // Project current depth into previous frame locations.
    // Push to all pixels having some contribution if reprojection is using bilinear logic.
    for (var iSampleIndex = 0; iSampleIndex < 4; iSampleIndex += 1) {

        let iOffset: vec2<i32> = bilinearInfo.iOffsets[iSampleIndex];
        let fWeight: f32 = bilinearInfo.fWeights[iSampleIndex];

        if fWeight > fReconstructedDepthBilinearWeightThreshold {

            let iStorePos: vec2<i32> = bilinearInfo.iBasePos + iOffset;
            if IsOnScreen(iStorePos, iPxDepthSize) {
                StoreReconstructedPreviousDepth(iStorePos, i32(fDepth));
                return true;
            }
        }
    }
    return false;
}
fn FindNearestDepth(iPxPos: vec2<i32>, iPxSize: vec2<i32>, fNearestDepth: ptr<function,f32>, fNearestDepthCoord: ptr<function,vec2<i32>>) {
    let iSampleCount: i32 = 9;
    var iSampleOffsets: array<vec2<i32>,9> = array<vec2<i32>,9>();
    iSampleOffsets[0] = vec2<i32>(0, 0);
    iSampleOffsets[1] = vec2<i32>(1, 0);
    iSampleOffsets[2] = vec2<i32>(0, 1);
    iSampleOffsets[3] = vec2<i32>(0, -1);
    iSampleOffsets[4] = vec2<i32>(-1, 0);
    iSampleOffsets[5] = vec2<i32>(-1, 1);
    iSampleOffsets[6] = vec2<i32>(1, 1);
    iSampleOffsets[7] = vec2<i32>(-1, -1);
    iSampleOffsets[8] = vec2<i32>(1, -1);


    // pull out the depth loads to allow SC to batch them
    var depth: array<f32,9>;

    for (var iSampleIndex = 0; iSampleIndex < iSampleCount; iSampleIndex += 1) {

        let iPos: vec2<i32> = iPxPos + iSampleOffsets[iSampleIndex];
        depth[iSampleIndex] = LoadInputDepth(iPos);
    }

    // find closest depth
    *fNearestDepthCoord = iPxPos;
    *fNearestDepth = depth[0];

    for (var iSampleIndex = 1; iSampleIndex < iSampleCount; iSampleIndex += 1) {

        let iPos: vec2<i32> = iPxPos + iSampleOffsets[iSampleIndex];
        if IsOnScreen(iPos, iPxSize) {

            let fNdDepth: f32 = depth[iSampleIndex];

            if fNdDepth < *fNearestDepth {
                *fNearestDepthCoord = iPos;
                *fNearestDepth = fNdDepth;
            }
        }
    }
}

fn FindPrevNearestDepth(iPxPos: vec2<i32>, iPxSize: vec2<i32>) {
    let iSampleCount: i32 = 9;
    var iSampleOffsets: array<vec2<i32>,9> = array<vec2<i32>,9>();
    iSampleOffsets[0] = vec2<i32>(0, 0);
    iSampleOffsets[1] = vec2<i32>(1, 0);
    iSampleOffsets[2] = vec2<i32>(0, 1);
    iSampleOffsets[3] = vec2<i32>(0, -1);
    iSampleOffsets[4] = vec2<i32>(-1, 0);
    iSampleOffsets[5] = vec2<i32>(-1, 1);
    iSampleOffsets[6] = vec2<i32>(1, 1);
    iSampleOffsets[7] = vec2<i32>(-1, -1);
    iSampleOffsets[8] = vec2<i32>(1, -1);


    // pull out the depth loads to allow SC to batch them
    var depth: array<f32,9>;

    for (var iSampleIndex = 0; iSampleIndex < iSampleCount; iSampleIndex += 1) {

        let iPos: vec2<i32> = iPxPos + iSampleOffsets[iSampleIndex];
        depth[iSampleIndex] = LoadInputDepth(iPos);
    }

    // find closest depth

    var fNearestDepth = depth[0];

    for (var iSampleIndex = 1; iSampleIndex < iSampleCount; iSampleIndex += 1) {

        let iPos: vec2<i32> = iPxPos + iSampleOffsets[iSampleIndex];
        if IsOnScreen(iPos, iPxSize) {

            let fNdDepth: f32 = depth[iSampleIndex];

            if fNdDepth < fNearestDepth {
                fNearestDepth = fNdDepth;
            }
        }
    }
    StoreReconstructedPreviousDepth(iPxPos, i32(fNearestDepth));
}

fn ReconstructAndDilate(iPxLrPos: vec2<i32>) {
    var fDilatedDepth: f32 = 0;
    var iNearestDepthCoord: vec2<i32> = vec2<i32>(0, 0);

    FindNearestDepth(iPxLrPos, RenderSize(), &fDilatedDepth, &iNearestDepthCoord);


    //var iSamplePos: vec2<i32> = ComputeHrPosFromLrPos(iPxLrPos);
    // var fSrcJitteredPos: vec2<f32> = vec2<f32>(iPxLrPos) + 0.5 - Jitter();
    // var fLrPosInHr: vec2<f32> = (fSrcJitteredPos / vec2<f32>(RenderSize())) * vec2<f32>(DisplaySize());
    // var iSamplePos: vec2<i32> = vec2<i32>(floor(fLrPosInHr));
    
    //var iMotionVectorPos: vec2<i32> = ComputeHrPosFromLrPos(iNearestDepthCoord);
    var fSrcJitteredPos = vec2<f32>(iNearestDepthCoord) + 0.5 - Jitter();
    ///fLrPosInHr = (fSrcJitteredPos / vec2<f32>(RenderSize())) * vec2<f32>(DisplaySize());
    var iMotionVectorPos: vec2<i32> = vec2<i32>(floor(fSrcJitteredPos));

    var fDilatedMotionVector: vec2<f32> = LoadInputMotionVector(iMotionVectorPos);

    StoreDilatedDepth(iPxLrPos, fDilatedDepth);
    StoreDilatedMotionVector(iPxLrPos, fDilatedMotionVector);

    //let res: bool = ReconstructPrevDepth(iPxLrPos, fDilatedDepth, fDilatedMotionVector, RenderSize());

    let fReprojectedPos: vec2<f32> = vec2<f32>(iPxLrPos) + vec2<f32>(0.5, 0.5) - fDilatedMotionVector * vec2<f32>(RenderSize());


    FindPrevNearestDepth(vec2<i32>(fReprojectedPos), RenderSize());

    let fLockInputLuma: f32 = ComputeLockInputLuma(iPxLrPos);
    StoreLockInputLuma(iPxLrPos, fLockInputLuma);


    // var reconstructDilatedInfo: vec4<f32> = vec4<f32>(fDilatedDepth, fDilatedDepth, f32(pack2x16float(fDilatedMotionVector)), fLockInputLuma);

    // // if res == false {
    // //     // let dilated_preDepth=LoadReconstructDilatedInfo(iPxLrPos).y
    // //     // if reconstructDilatedInfo.y <  dilated_preDepth{
    // //     //     reconstructDilatedInfo.y =  dilated_preDepth;
    // //     // }
    // //     reconstructDilatedInfo.y = LoadReconstructDilatedInfo(iPxLrPos).y;
    // // }




    // StoreReconstructDilatedInfo(iPxLrPos, reconstructDilatedInfo);
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
        return;
    }
    DisplaySize();
    // // linear depth
    // let depth = (textureSampleLevel(depthBuffer, samp, vec2<f32>(pos) / vec2<f32>(origin_size), 0) + 1.0) / 2.0;
    // // let depth = (textureLoad(depthBuffer, origin_pos, 0) + 1.0) / 2.0;
    let zlinear = zNear * zFar / (zFar + 0 * (zNear - zFar));
    // // textureStore(output, screen_pos, vec4<f32>(vec3<f32>(zlinear / 20.0), 1.0));

    ReconstructAndDilate(pos);
}