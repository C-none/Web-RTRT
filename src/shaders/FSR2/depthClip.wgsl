
@group(0) @binding(0) var<uniform> sampJitter : vec2<f32>;

@group(0) @binding(1) var samp : sampler;
//@group(0) @binding(2) var currentFrame : texture_2d<f32>;
@group(0) @binding(2) var<storage, read_write> currentFrame : array<vec2u>;
@group(0) @binding(3) var preparedInputColor : texture_storage_2d<rgba16float, write>;
@group(0) @binding(4) var vBuffer : texture_2d<u32>;
@group(0) @binding(5) var depthBuffer : texture_depth_2d;
@group(0) @binding(6) var dilatedDepth : texture_2d<f32>;
//@group(0) @binding(7) var reconstructedPreviousDepth : texture_depth_2d;
@group(0) @binding(7) var<storage, read_write>  reconstructedPreviousDepth : array<i32>;
@group(0) @binding(8) var dilatedMotionVectors : texture_2d<f32>;
@group(0) @binding(9) var previousDilatedMotionVectors : texture_2d<f32>;
@group(0) @binding(10) var dilatedReactiveMasks : texture_storage_2d<rgba16float, write>;
// @group(0) @binding(0) var VPMat: mat4x4f;
// @group(0) @binding(0) var lastVPMat: mat4x4f;
    
// #include <FSR_common.wgsl>;





const BORDER: i32 = 1;
const SHARED_SIZE: i32 = BATCH_SIZE + BORDER * 2;
var<workgroup> sharedDilatedDepth: array<array<f32, SHARED_SIZE>, SHARED_SIZE>;
//var<workgroup> sharedMotionVec: array<array<vec2<f32>, SHARED_SIZE>, SHARED_SIZE>;

var<private> globalInvocationID: vec3<i32> = vec3<i32>(0, 0, 0);
var<private> workgroupID: vec3<i32> = vec3<i32>(0, 0, 0);
var<private> localInvocationID: vec3<i32> = vec3<i32>(0, 0, 0);
fn preload(sharedPos: vec2i, globalPos: vec2i) {
    let globalId = clamp(globalPos, vec2i(0), vec2i(RenderSize()) - 1);
    let depthValue = (textureLoad(dilatedDepth, globalId, 0).x + 1.0) / 2.0;
    sharedDilatedDepth[sharedPos.y][sharedPos.x] = depthValue;
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
    //return textureLoad(depthBuffer, iPxPos, 0);
    return (textureLoad(depthBuffer, iPxPos, 0) + 1.0) / 2.0;
}
fn LoadDilatedDepth(iPxPos: vec2<i32>) -> f32 {
    //return textureLoad(dilatedDepth, iPxPos, 0).x;
    if enCache {
        let sharedPos = slove_cache_idx(iPxPos);
        return sharedDilatedDepth[sharedPos.y][sharedPos.x] ;
    }

    return (textureLoad(dilatedDepth, iPxPos, 0).x + 1.0) / 2.0;
}
fn LoadReconstructedPreviousDepth(iPxPos: vec2<i32>) -> f32 {
    //return textureLoad(reconstructedPreviousDepth, iPxPos, 0).x;
    //return textureLoad(reconstructedPreviousDepth, iPxPos, 0).x;
    //return (textureLoad(reconstructedPreviousDepth, iPxPos, 0) + 1.0) / 2.0;
    var idx = u32(iPxPos.x) * u32(RenderSize().x) + u32(iPxPos.y);
    return f32(reconstructedPreviousDepth[idx]);

    // var atomic_ptr:
    // atomicMin(atomic_ptr: ptr<SC, atomic<T>, A>, v: T) -> T
}

fn LoadDilatedMotionVector(iPxPos: vec2<i32>) -> vec2<f32> {
    // var dilatedMotionVec: u32 = textureLoad(dilatedMotionVectors, iPxPos, 0);
    // let motionVec: vec2<f32> = unpack2x16float(dilatedMotionVec).x;
    let motionVec: vec2<f32> = textureLoad(dilatedMotionVectors, iPxPos, 0).xy;
    return motionVec;
}

fn SamplePreviousDilatedMotionVector(fUv: vec2<f32>) -> vec2<f32> {
    return textureSampleLevel(previousDilatedMotionVectors, samp, fUv, 0).xy;
    //return textureLoad(previousDilatedMotionVectors, vec2<i32>(round(fUv * vec2<f32>(RenderSize()))), 0).xy;
}


fn StorePreparedInputColor(iPxPos: vec2<i32>, fpreparedInputColor: vec4<f32>) {
    textureStore(preparedInputColor, iPxPos, fpreparedInputColor);
}

fn StoreDilatedReactiveMask(iPxPos: vec2<i32>, fdilatedReactiveMask: vec2<f32>) {
    textureStore(dilatedReactiveMasks, iPxPos, vec4<f32>(fdilatedReactiveMask, 0, 0));
}
fn LoadReactiveMask(iPxPos: vec2<i32>) -> f32 {
    //return textureLoad(reactiveMasks, iPxPos, 0).x;
    return 0.0;
}
fn LoadTransparencyAndCompositionMask(iPxPos: vec2<i32>) -> f32 {
    //return textureLoad(transparencyAndCompositionMasks, iPxPos, 0).x;
    return 0.0;
}






fn ComputeDepthClip(fUvSample: vec2<f32>, fCurrentDepthSample: f32) -> f32 {

    let fCurrentDepthViewSpace: f32 = GetViewSpaceDepth(fCurrentDepthSample);
    let bilinearInfo: BilinearSamplingData = GetBilinearSamplingData(fUvSample, RenderSize());

    var fDilatedSum: f32 = 0.0;
    var fDepth: f32 = 0.0;
    var fWeightSum: f32 = 0.0;
    var flag: f32 = 0;
    for (var iSampleIndex: i32 = 0; iSampleIndex < 4; iSampleIndex += 1) {

        let  iOffset: vec2<i32> = bilinearInfo.iOffsets[iSampleIndex];
        let  iSamplePos: vec2<i32> = bilinearInfo.iBasePos + iOffset;

        if IsOnScreen(iSamplePos, RenderSize()) {
            let  fWeight: f32 = bilinearInfo.fWeights[iSampleIndex];
            if fWeight > fReletructedDepthBilinearWeightThreshold {

                let  fPrevDepthSample: f32 = LoadReconstructedPreviousDepth(iSamplePos);//LoadReletructedPrevDepth
                let  fPrevNearestDepthViewSpace: f32 = GetViewSpaceDepth(fPrevDepthSample);

                var fDepthDiff: f32 = fCurrentDepthViewSpace - fPrevNearestDepthViewSpace;
                //fDepthDiff=abs(fDepthDiff);
                if fDepthDiff > 0.0 {
                    let fPlaneDepth: f32 = max(fPrevDepthSample, fCurrentDepthSample);

                    let fCenter: vec3<f32> = GetViewSpacePosition(vec2<i32>(vec2<f32>(RenderSize()) * 0.5), RenderSize(), fPlaneDepth);
                    let fCorner: vec3<f32> = GetViewSpacePosition(vec2<i32>(0, 0), RenderSize(), fPlaneDepth);

                    let fHalfViewportWidth: f32 = length(vec2<f32>(RenderSize()));
                    let fDepthThreshold: f32 = max(fCurrentDepthViewSpace, fPrevNearestDepthViewSpace);

                    let Ksep: f32 = 1.37e-05;
                    let Kfov: f32 = length(fCorner) / length(fCenter);
                    let fRequiredDepthSeparation: f32 = Ksep * Kfov * fHalfViewportWidth * fDepthThreshold;

                    let fResolutionFactor: f32 = Saturate(length(vec2<f32>(RenderSize())) / length(vec2<f32>(1920.0, 1080.0)));
                    let fPower: f32 = mix(1.0, 3.0, fResolutionFactor);
                    fDepth += pow(Saturate(f32(fRequiredDepthSeparation / fDepthDiff)), fPower) * fWeight;
                    fWeightSum += fWeight;
                    flag += 0.25;
                    fDepth = fDepthDiff / 2;
                }
            }
        }
    }
    if fWeightSum > 0 {
        return Saturate(1.0 - fDepth / fWeightSum);
        //return Saturate(fDepthDiff * 20);
    }

    return 0;
}
fn ComputeMotionDivergence(iPxPos: vec2<i32>, iPxInputMotionVectorSize: vec2<i32>) -> f32 {
    var minconvergence: f32 = 1.0;

    let fMotionVectorNucleus: vec2<f32> = LoadInputMotionVector(iPxPos);
    let fNucleusVelocityLr: f32 = length(fMotionVectorNucleus * vec2<f32>(RenderSize()));
    var fMaxVelocityUv: f32 = length(fMotionVectorNucleus);

    let MotionVectorVelocityEpsilon: f32 = 1e-02;

    if fNucleusVelocityLr > MotionVectorVelocityEpsilon {
        for (var y = -1; y <= 1; y += 1) {
            for (var x = -1; x <= 1; x += 1) {

                let sp: vec2<i32> = ClampLoad(iPxPos, vec2<i32>(x, y), iPxInputMotionVectorSize);

                let fMotionVector: vec2<f32> = LoadInputMotionVector(sp);
                var fVelocityUv: f32 = length(fMotionVector);

                fMaxVelocityUv = max(fVelocityUv, fMaxVelocityUv);
                fVelocityUv = max(fVelocityUv, fMaxVelocityUv);
                minconvergence = min(minconvergence, dot(fMotionVector / fVelocityUv, fMotionVectorNucleus / fVelocityUv));
            }
        }
    }

    return Saturate(1.0 - minconvergence) * Saturate(fMaxVelocityUv / 0.01);
}
fn ComputeDepthDivergence(iPxPos: vec2<i32>) -> f32 {
    let fMaxDistInMeters: f32 = GetMaxDistanceInMeters();
    var fDepthMax: f32 = 0.0;
    var fDepthMin: f32 = fMaxDistInMeters;

    var iMaxDistFound: i32 = 0;

    for (var y = -1; y < 2; y += 1) {
        for (var x = -1; x < 2; x += 1) {

            let iOffset: vec2<i32> = vec2<i32>(x, y);
            let iSamplePos: vec2<i32> = iPxPos + iOffset;

            let fOnScreenFactor: f32 = f32(IsOnScreen(iSamplePos, RenderSize()));

            let fDepth: f32 = GetViewSpaceDepthInMeters(LoadDilatedDepth(iSamplePos)) * fOnScreenFactor;

            iMaxDistFound |= i32(fMaxDistInMeters == fDepth);

            fDepthMin = min(fDepthMin, fDepth);
            fDepthMax = max(fDepthMax, fDepth);
        }
    }

    if bool(iMaxDistFound) == false {
        return (1.0 - fDepthMin / fDepthMax);
    } else {
        return 0;
    }
}

fn ComputeTemporalMotionDivergence(iPxPos: vec2<i32>) -> f32 {
    let  fUv: vec2<f32> = vec2<f32>(vec2<f32>(iPxPos) + vec2<f32>(0.5, 0.5)) / vec2<f32>(RenderSize());

    let fMotionVector: vec2<f32> = LoadDilatedMotionVector(iPxPos);
    var fReprojectedUv: vec2<f32> = fUv - fMotionVector;
    fReprojectedUv = ClampUv(fReprojectedUv, RenderSize(), MaxRenderSize());
    let fPrevMotionVector: vec2<f32> = SamplePreviousDilatedMotionVector(fReprojectedUv);

    let fPxDistance: f32 = length(fMotionVector * vec2<f32>(RenderSize()));

    if fPxDistance > 1.0 {
        return mix(0.0, 1.0 - Saturate(length(fPrevMotionVector) / length(fMotionVector)), Saturate(pow(fPxDistance / 20.0, 3.0)));
    } else {
        return 0;
    }
}
fn ComputePreparedInputColor(iPxLrPos: vec2<i32>) -> vec3<f32> {
    // We assume linear data. if non-linear input (sRGB, ...),
    // then we should convert to linear first and back to sRGB on output.
    var fRgb: vec3<f32> = max(vec3<f32>(0, 0, 0), LoadInputColor(iPxLrPos));

    fRgb = PrepareRgb(fRgb, Exposure(), PreExposure());

    let fPreparedYCoCg: vec3<f32> = RGBToYCoCg(fRgb);

    return fPreparedYCoCg;
}
fn PreProcessReactiveMasks(iPxLrPos: vec2<i32>, fMotionDivergence: f32) {
    // Compensate for bilinear sampling in accumulation pass
    let fReferenceColor: vec3<f32> = LoadInputColor(iPxLrPos).xyz;
    var fReactiveFactor: vec2<f32> = vec2<f32>(0.0, fMotionDivergence);

    var fMasksSum: f32 = 0.0;

    var fColorSamples: array<vec3<f32>,9> = array<vec3<f32>,9>();
    var fReactiveSamples: array<f32,9> = array<f32,9>();
    var fTransparencyAndCompositionSamples: array<f32,9> = array<f32,9>();

    // for (var  y = -1; y < 2; y += 1) {
    //     for (var  x = -1; x < 2; x += 1) {

    //         let  sampleCoord: vec2<i32> = ClampLoad(iPxLrPos, vec2<i32>(x, y), vec2<i32>(RenderSize()));

    //         var  sampleIdx = (y + 1) * 3 + x + 1;

    //         let fColorSample: vec3<f32> = LoadInputColor(sampleCoord).xyz;
    //         let fReactiveSample: f32 = LoadReactiveMask(sampleCoord);
    //         let fTransparencyAndCompositionSample: f32 = LoadTransparencyAndCompositionMask(sampleCoord);

    //         fColorSamples[sampleIdx] = fColorSample;
    //         fReactiveSamples[sampleIdx] = fReactiveSample;
    //         fTransparencyAndCompositionSamples[sampleIdx] = fTransparencyAndCompositionSample;

    //         fMasksSum += (fReactiveSample + fTransparencyAndCompositionSample);
    //     }
    // }
    // if fMasksSum > 0 {
    //     for (var sampleIdx = 0; sampleIdx < 9; sampleIdx += 1) {
    //         let fColorSample: vec3<f32> = fColorSamples[sampleIdx];
    //         let fReactiveSample = fReactiveSamples[sampleIdx];
    //         let fTransparencyAndCompositionSample = fTransparencyAndCompositionSamples[sampleIdx];

    //         let  fMaxLenSq: f32 = max(dot(fReferenceColor, fReferenceColor), dot(fColorSample, fColorSample));
    //         let  fSimilarity: f32 = dot(fReferenceColor, fColorSample) / fMaxLenSq;

    //         // Increase power for non-similar samples
    //         let fPowerBiasMax: f32 = 6.0;
    //         let fSimilarityPower: f32 = 1.0 + (fPowerBiasMax - fSimilarity * fPowerBiasMax);
    //         let fWeightedReactiveSample: f32 = pow(fReactiveSample, fSimilarityPower);
    //         let fWeightedTransparencyAndCompositionSample: f32 = pow(fTransparencyAndCompositionSample, fSimilarityPower);

    //         fReactiveFactor = max(fReactiveFactor, vec2<f32>(fWeightedReactiveSample, fWeightedTransparencyAndCompositionSample));
    //     }
    // }

    StoreDilatedReactiveMask(iPxLrPos, fReactiveFactor);
}



fn EvaluateSurface(iPxPos: vec2<i32>, fMotionVector: vec2<f32>) -> f32 {
    // let d0: f32 = GetViewSpaceDepth(LoadReconstructedPreviousDepth(iPxPos + vec2<i32>(0, -1)));
    // let d1: f32 = GetViewSpaceDepth(LoadReconstructedPreviousDepth(iPxPos + vec2<i32>(0, 0)));
    // let d2: f32 = GetViewSpaceDepth(LoadReconstructedPreviousDepth(iPxPos + vec2<i32>(0, 1)));
    let d0: f32 = GetViewSpaceDepth(LoadReconstructedPreviousDepth(vec2<i32>(floor((vec2<f32>(iPxPos) + 0.5) - fMotionVector)) + vec2<i32>(0, -1)));
    let d1: f32 = GetViewSpaceDepth(LoadReconstructedPreviousDepth(vec2<i32>(((vec2<f32>(iPxPos) + 0.5) - fMotionVector)) + vec2<i32>(0, 0)));
    let d2: f32 = GetViewSpaceDepth(LoadReconstructedPreviousDepth(vec2<i32>(((vec2<f32>(iPxPos) + 0.5) - fMotionVector)) + vec2<i32>(0, 1)));

    return 1.0 - f32(((d0 - d1) > (d1 * 0.01)) && ((d1 - d2) > (d2 * 0.01)));
}

fn DepthClip(iPxPos: vec2<i32>) {
    let fDepthUv: vec2<f32> = (vec2<f32>(iPxPos) + 0.5) / vec2<f32>(RenderSize());
    var fMotionVector: vec2<f32> = LoadDilatedMotionVector(iPxPos);

    // Discard tiny mvs
    fMotionVector *= f32(length(fMotionVector * vec2<f32>(RenderSize())) > 0.01);

    let fDilatedUv: vec2<f32> = fDepthUv - fMotionVector; ///doubtful
    let fDilatedDepth: f32 = LoadDilatedDepth(iPxPos);
    //let fDilatedDepth: f32 = LoadInputDepth(iPxPos);
    let fCurrentDepthViewSpace: f32 = GetViewSpaceDepth(LoadInputDepth(iPxPos));

    // Compute prepared input color and depth clip
    let fDepthClip: f32 = ComputeDepthClip(fDilatedUv, fDilatedDepth) * EvaluateSurface(iPxPos, (fMotionVector * vec2<f32>(RenderSize())));
    let fPreparedYCoCg: vec3<f32> = ComputePreparedInputColor(iPxPos);
    StorePreparedInputColor(iPxPos, vec4<f32>(fPreparedYCoCg, fDepthClip));
    //StorePreparedInputColor(iPxPos, vec4<f32>(fPreparedYCoCg, 0));

    // Compute dilated reactive mask

    //let iSamplePos: vec2<i32> = ComputeHrPosFromLrPos(iPxPos); 有高分辨率motion vec时启用
    let iSamplePos: vec2<i32> = iPxPos;

    let fMotionDivergence: f32 = ComputeMotionDivergence(iSamplePos, RenderSize());
    let fTemporalMotionDifference: f32 = Saturate(ComputeTemporalMotionDivergence(iPxPos) - ComputeDepthDivergence(iPxPos));

    PreProcessReactiveMasks(iPxPos, max(fTemporalMotionDifference, fMotionDivergence));
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
    // linear depth
    // let depth = (textureSampleLevel(depthBuffer, samp, vec2<f32>(pos) / vec2<f32>(origin_size), 0) + 1.0) / 2.0;
    // // let depth = (textureLoad(depthBuffer, origin_pos, 0) + 1.0) / 2.0;
    // let zlinear = zNear * zFar / (zFar + depth * (zNear - zFar));
    // // textureStore(output, screen_pos, vec4<f32>(vec3<f32>(zlinear / 20.0), 1.0));

    DepthClip(pos);
}