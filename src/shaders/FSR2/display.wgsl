

@group(0) @binding(0) var<uniform> sampJitter : vec2<f32>;
@group(0) @binding(1) var samp : sampler;
//@group(0) @binding(2) var currentDisplay : texture_storage_2d<displayFormat, write>;
@group(0) @binding(2) var currentDisplay : texture_storage_2d<rgba16float, write>;
@group(0) @binding(3) var rPreviousDisplay: texture_2d<f32>;
@group(0) @binding(4) var wPreviousDisplay: texture_storage_2d<rgba16float, write>;
@group(0) @binding(5) var vBuffer : texture_2d<u32>;
//@group(0) @binding(6) var currentFrame : texture_2d<f32>;
@group(0) @binding(6) var <storage, read_write> currentFrame : array<vec2<u32>>;
@group(0) @binding(7) var preparedInputColor: texture_2d<f32>;
//@group(0) @binding(7) var preparedInputColor: texture_storage_2d<rgba16float, read>;
@group(0) @binding(8) var dilatedReactiveMasks: texture_2d<f32>;
@group(0) @binding(9) var  newLocks: texture_storage_2d<r32float, read_write>;
@group(0) @binding(10) var lockStatus: texture_storage_2d<r32float, read_write>;

@group(0) @binding(11) var <storage, read_write> luma_history : array<vec4<f32>>;







// #include <FSR_common.wgsl>;

const BORDER: i32 = 1;
const SHARED_SIZE: i32 = BATCH_SIZE + BORDER * 2;
var<workgroup> sharedPreparedColor: array<array<vec4<f32>, SHARED_SIZE>, SHARED_SIZE>;
//var<workgroup> sharedMotionVec: array<array<vec2<f32>, SHARED_SIZE>, SHARED_SIZE>;

var<private> globalInvocationID: vec3<i32> = vec3<i32>(0, 0, 0);
var<private> workgroupID: vec3<i32> = vec3<i32>(0, 0, 0);
var<private> localInvocationID: vec3<i32> = vec3<i32>(0, 0, 0);
fn preload(sharedPos: vec2i, globalPos: vec2i) {
    //var globalId = vec2<i32>(vec2<f32>(globalPos) * DownscaleFactor());

    var globalId = clamp(globalPos, vec2i(0), vec2i(RenderSize()) - 1);
    let colorValue = textureLoad(preparedInputColor, globalId, 0);
    sharedPreparedColor[sharedPos.y][sharedPos.x] = colorValue;
    // var visibility: vec4<u32> = textureLoad(vBuffer, globalId, 0);
    // let motionVec: vec2<f32> = unpack2x16float(visibility.x);
    //sharedMotionVec[sharedPos.y][sharedPos.x] = motionVec;
}   
fn slove_cache_idx(iPxPos: vec2<i32>) -> vec2<i32> {
    let group_base = vec2<i32>(vec2<f32>(globalInvocationID.xy - localInvocationID.xy) * DownscaleFactor()) - BORDER;
    let ipx_offset = iPxPos - group_base;
    let real_shared_size = i32(ceil(f32(BATCH_SIZE) * DownscaleFactor().x)) + BORDER * 2;
    let offsets = ipx_offset.x + ipx_offset.y * real_shared_size;
    let idx: vec2<i32> = vec2i(offsets % real_shared_size, offsets / real_shared_size);
    return idx;
}

fn invokePreload(GlobalInvocationID: vec2i, LocalInvocationID: vec2i) {
    let real_shared_size = i32(ceil(f32(BATCH_SIZE) * DownscaleFactor().x)) + BORDER * 2;
    let group_base = vec2<i32>(vec2<f32>(GlobalInvocationID - LocalInvocationID) * DownscaleFactor()) - BORDER;
    let stage_num = (real_shared_size * real_shared_size + BATCH_SIZE * BATCH_SIZE - 1) / (BATCH_SIZE * BATCH_SIZE);
    for (var i: i32 = 0; i < stage_num; i = i + 1) {
        let threadIdx: i32 = LocalInvocationID.y * BATCH_SIZE + LocalInvocationID.x;
        let virtualIdx: i32 = threadIdx + i * BATCH_SIZE * BATCH_SIZE;
        let loadIdx = vec2i(virtualIdx % real_shared_size, virtualIdx / real_shared_size);
        if i == 0 || virtualIdx < real_shared_size * real_shared_size {
            preload(loadIdx, group_base + loadIdx);
        }
    }
    workgroupBarrier();
}

fn SampleMipLuma(fUv: vec2<f32>) -> f32 {
    let iPxPos: vec2<i32> = vec2<i32>(round(fUv * vec2<f32>(RenderSize())));
    //let color = textureSampleLevel(currentFrame, samp, fUv, 0).xyz;
    let color = LoadInputColor(iPxPos);
    //return color;
    return 0.299 * color.x + 0.587 * color.y + 0.114 * color.z;
}
fn SampleLumaHistory(fUv: vec2<f32>) -> vec4<f32> {
    let iPxSample: vec2<i32> = vec2<i32>((fUv * vec2<f32>(DisplaySize())));
    //let color = textureSampleLevel(currentFrame, samp, fUv, 0).xyz;
    //let color = textureLod(sampler2D(r_luma_history, s_LinearClamp), fUV, 0.0);
    let idx = iPxSample.x * DisplaySize().y + iPxSample.y;
    //let color = textureLoad(luma_history, iPxSample, 0);
    let color = luma_history[idx];
    //return color;
    return color;
}
fn StoreLumaHistory(iPxPos: vec2<i32>, fhistoryLuma: vec4<f32>) {
    let idx = iPxPos.x * DisplaySize().y + iPxPos.y;
    luma_history[idx] = fhistoryLuma;
}
fn LoadInputMotionVector(iPxHrPos: vec2<i32>) -> vec2<f32> {
    var visibility: vec4<u32> = textureLoad(vBuffer, iPxHrPos, 0);
    let motionVec: vec2<f32> = unpack2x16float(visibility.x);
    //return vec2<f32>(0,0);
    return motionVec;
}
// fn LoadInputColor(iPxPos: vec2<i32>) -> vec3<f32> {
//     return textureLoad(currentFrame, iPxPos, 0).xyz;
// }
fn LoadInputColor(iPxPos: vec2<i32>) -> vec3<f32> {
    //return textureLoad(rawColor, iPxPos, 0).xyz;
    let idx: i32 = iPxPos.y * _renderWidth + iPxPos.x;
    let data = currentFrame[idx];
    let color: vec3<f32> = vec3f(unpack2x16float(data.x).xy, unpack2x16float(data.y).x);

    return color;
}
fn LoadPreparedInputColor(iPxPos: vec2<i32>) -> vec4<f32> {
    if enCache {
        let sharedPos = slove_cache_idx(iPxPos);
        return sharedPreparedColor[sharedPos.y][sharedPos.x] ;
    }
    return textureLoad(preparedInputColor, iPxPos, 0);
}
fn SamplePreparedInputColor(fUv: vec2<f32>) -> vec4<f32> {
    //return textureLoad(preparedInputColor, vec2<i32>(round(fUv * vec2<f32>(RenderSize()))), 0);
    return textureSampleLevel(preparedInputColor, samp, fUv, 0);
    //return textureSample(preparedInputColor, samp, fUv);
}
fn SampleDilatedReactiveMasks(fUv: vec2<f32>) -> vec2<f32> {
    //return textureLoad(dilatedReactiveMasks, iPxPos, 0).xy;
    //return textureLoad(dilatedReactiveMasks, vec2<i32>(round(fUv * vec2<f32>(RenderSize()))), 0).xy;
    return textureSampleLevel(dilatedReactiveMasks, samp, fUv, 0).xy;
}
fn LoadRwNewLocks(iPxPos: vec2<i32>) -> f32 {
    return textureLoad(newLocks, iPxPos).x;
}
fn StoreNewLocks(iPxPos: vec2<i32>, fnewLock: f32) {
    textureStore(newLocks, iPxPos, vec4<f32>(fnewLock, 0, 0, 0));
}

fn SampleLockStatus(fUv: vec2<f32>) -> vec2<f32> {
    let lock: f32 = textureLoad(lockStatus, vec2<i32>(round(fUv * vec2<f32>(RenderSize())))).x;
    //let lock: f32 = textureSampleLevel(lockStatus, samp, fUv, 0).x;
    var lockstate: vec2<f32> = vec2<f32>(0, 0);
    if lock == 0.0 {
        lockstate = vec2<f32>(0, 0);
    }
    if lock == 1.0 {
        lockstate = vec2<f32>(0, 1);
    }
    if lock == 2.0 {
        lockstate = vec2<f32>(1, 0);
    }
    if lock == 3.0 {
        lockstate = vec2<f32>(1, 1);
    }

    return lockstate;
}

fn StoreLockStatus(iPxPos: vec2<i32>, fLockStatus: vec2<f32>) {
    var lockstate: f32 = 0;
    if fLockStatus.y == 1.0 {
        lockstate += 1;
    }
    if fLockStatus.x == 1.0 {
        lockstate += 2;
    }
    textureStore(newLocks, iPxPos, vec4<f32>(lockstate, 0, 0, 0));
}

fn ComputeLockInputLuma(iPxLrPos: vec2<i32>) -> f32 {
    // We assume linear data. if non-linear input (sRGB, ...),
    // then we should convert to linear first and back to sRGB on output.
    let idx: u32 = u32(iPxLrPos.x * iPxLrPos.y + iPxLrPos.x);
    //var fRgb: vec3<f32> = max(vec3<f32>(0, 0, 0), readColor(&currentFrame, idx));
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





fn WrapHistory(iPxSample: vec2<i32>) -> vec4<f32> {
    return textureLoad(rPreviousDisplay, iPxSample, 0);
    //return vec4<f32>(0, 0, 0, 0);
    //return vec4f(0);
}
fn StoreInternalColorAndWeight(iPxPos: vec2<i32>, fvalue: vec4<f32>) {
    textureStore(wPreviousDisplay, iPxPos, fvalue);
}

fn FetchHistorySamples(iPxSample: vec2<i32>, iTextureSize: vec2<i32>) -> FetchedBicubicSamples {
    var Samples: FetchedBicubicSamples = FetchedBicubicSamples();

    Samples.fColor00 = vec4<f32>(WrapHistory(ClampCoord(iPxSample, vec2<i32>(-1, -1), iTextureSize)));
    Samples.fColor10 = vec4<f32>(WrapHistory(ClampCoord(iPxSample, vec2<i32>(0, -1), iTextureSize)));
    Samples.fColor20 = vec4<f32>(WrapHistory(ClampCoord(iPxSample, vec2<i32>(1, -1), iTextureSize)));
    Samples.fColor30 = vec4<f32>(WrapHistory(ClampCoord(iPxSample, vec2<i32>(2, -1), iTextureSize)));

    Samples.fColor01 = vec4<f32>(WrapHistory(ClampCoord(iPxSample, vec2<i32>(-1, 0), iTextureSize)));
    Samples.fColor11 = vec4<f32>(WrapHistory(ClampCoord(iPxSample, vec2<i32>(0, 0), iTextureSize)));
    Samples.fColor21 = vec4<f32>(WrapHistory(ClampCoord(iPxSample, vec2<i32>(1, 0), iTextureSize)));
    Samples.fColor31 = vec4<f32>(WrapHistory(ClampCoord(iPxSample, vec2<i32>(2, 0), iTextureSize)));

    Samples.fColor02 = vec4<f32>(WrapHistory(ClampCoord(iPxSample, vec2<i32>(-1, 1), iTextureSize)));
    Samples.fColor12 = vec4<f32>(WrapHistory(ClampCoord(iPxSample, vec2<i32>(0, 1), iTextureSize)));
    Samples.fColor22 = vec4<f32>(WrapHistory(ClampCoord(iPxSample, vec2<i32>(1, 1), iTextureSize)));
    Samples.fColor32 = vec4<f32>(WrapHistory(ClampCoord(iPxSample, vec2<i32>(2, 1), iTextureSize)));

    Samples.fColor03 = vec4<f32>(WrapHistory(ClampCoord(iPxSample, vec2<i32>(-1, 2), iTextureSize)));
    Samples.fColor13 = vec4<f32>(WrapHistory(ClampCoord(iPxSample, vec2<i32>(0, 2), iTextureSize)));
    Samples.fColor23 = vec4<f32>(WrapHistory(ClampCoord(iPxSample, vec2<i32>(1, 2), iTextureSize)));
    Samples.fColor33 = vec4<f32>(WrapHistory(ClampCoord(iPxSample, vec2<i32>(2, 2), iTextureSize)));

    return Samples;
}

fn HistorySample(fUvSample: vec2<f32>, iTextureSize: vec2<i32>) -> vec4<f32> {
    var fPxSample: vec2<f32> = fUvSample * vec2<f32>(iTextureSize) - (Jitter() * vec2<f32>(iTextureSize) / vec2<f32>(RenderSize())) ;//- vec2<f32>(0.5, 0.5);             
    ///* Clamp base coords */                                                                                   
    fPxSample.x = max(0.0, min(f32(iTextureSize.x), fPxSample.x));
    fPxSample.y = max(0.0, min(f32(iTextureSize.y), fPxSample.y));

    let iPxSample: vec2<i32> = vec2<i32>(floor(fPxSample));
    let fPxFrac: vec2<f32> = fract(fPxSample);
    let fColorXY: vec4<f32> = vec4<f32>(Lanczos2(FetchHistorySamples(iPxSample, iTextureSize), fPxFrac));

    //let fColorXY: vec4<f32> = vec4<f32>(textureLoad(rPreviousDisplay, iPxSample, 0));
    return fColorXY;
}

fn ReprojectHistoryColor(params: AccumulationPassCommonParams, fHistoryColor: ptr<function,vec3<f32>>, fTemporalReactiveFactor: ptr<function,f32>, bInMotionLastFrame: ptr<function,bool>) {
    let fHistory: vec4<f32> = HistorySample(params.fReprojectedHrUv, DisplaySize());

    *fHistoryColor = fHistory.xyz;

    *fHistoryColor = RGBToYCoCg(*fHistoryColor);

    //Compute temporal reactivity info
    *fTemporalReactiveFactor = Saturate(abs(fHistory.w));
    *bInMotionLastFrame = (fHistory.w < 0.0);
}

fn ReprojectHistoryLockStatus(params: AccumulationPassCommonParams, fReprojectedLockStatus: ptr<function,vec2<f32>>) -> LockState {
    var state: LockState = LockState(false, false);
    let fNewLockIntensity: f32 = LoadRwNewLocks(params.iPxHrPos);
    state.NewLock = fNewLockIntensity > (127.0 / 255.0);

    var fInPlaceLockLifetime: f32 = 0;
    if state.NewLock {
        fInPlaceLockLifetime = fNewLockIntensity;
    }

    *fReprojectedLockStatus = SampleLockStatus(params.fReprojectedHrUv);

    if (*fReprojectedLockStatus)[LOCK_LIFETIME_REMAINING] != f32(0.0) {
        state.WasLockedPrevFrame = true;
    }

    return state;
}

fn ComputeReprojectedUVs(params: AccumulationPassCommonParams, fReprojectedHrUv: ptr<function,vec2<f32>>, bIsExistingSample: ptr<function,bool>) {
    *fReprojectedHrUv = params.fHrUv + params.fMotionVector;

    *bIsExistingSample = IsUvInside(*fReprojectedHrUv);
}


fn ComputeMaxKernelWeight() -> f32 {
    let  fKernelSizeBias: f32 = 1.0;

    let fKernelWeight: f32 = 1.0 + ((1.0) / vec2<f32>(DownscaleFactor()) - (1.0)).x * (fKernelSizeBias);

    return min(f32(1.99), fKernelWeight);
}

// fn GetUpsampleLanczosWeight(fSrcSampleOffset: vec2<f32>, fKernelWeight: f32) -> f32 {
//     let fSrcSampleOffsetBiased: vec2<f32> = fSrcSampleOffset * vec2<f32>(fKernelWeight, fKernelWeight);
//     //LANCZOS_TYPE_REFERENCE
//     let fSampleWeight: f32 = Lanczos2_s(length(fSrcSampleOffsetBiased));
//     // LANCZOS_TYPE_LUT
//     let fSampleWeight: f32 = Lanczos2_UseLUT(length(fSrcSampleOffsetBiased));
//     // LANCZOS_TYPE_APPROXIMATE
//     let fSampleWeight: f32 = Lanczos2ApproxSq(dot(fSrcSampleOffsetBiased, fSrcSampleOffsetBiased));
//     return fSampleWeight;
// }

fn RectificationBoxComputeVarianceBoxData(rectificationBox: ptr<function,RectificationBox>) {

    if abs((*rectificationBox).fBoxCenterWeight) <= f32(EPSILON) {
        (*rectificationBox).fBoxCenterWeight = 1;
    }
    (*rectificationBox).boxCenter /= (*rectificationBox).fBoxCenterWeight;
    (*rectificationBox).boxVec /= (*rectificationBox).fBoxCenterWeight;
    let stdDev: vec3<f32> = sqrt(abs((*rectificationBox).boxVec - (*rectificationBox).boxCenter * (*rectificationBox).boxCenter));
    (*rectificationBox).boxVec = stdDev;
}

fn ComputeUpsampledColorAndWeight(params: AccumulationPassCommonParams,
    clippingBox: ptr<function,RectificationBox>, fReactiveFactor: f32) -> vec4<f32> {

    let fDstOutputPos: vec2<f32> = vec2<f32>(params.iPxHrPos) + vec2<f32>(0.5, 0.5);
    let fSrcOutputPos: vec2<f32> = fDstOutputPos * DownscaleFactor();
    let iSrcInputPos: vec2<i32> = vec2<i32>(floor(fSrcOutputPos));
     // TODO: what about weird upscale factors...
    var fSamples: array<vec4<f32>,16> = array<vec4<f32>,16>();
    let fSrcUnjitteredPos: vec2<f32> = (vec2<f32>(iSrcInputPos) + vec2<f32>(0.5, 0.5)) - Jitter();
    var offsetTL: vec2<i32> = vec2<i32>(-1, -1);
    if fSrcUnjitteredPos.x > fSrcOutputPos.x {
        offsetTL.x = -2;
    }
    if fSrcUnjitteredPos.y > fSrcOutputPos.y {
        offsetTL.y = -2;
    }
    let bFlipRow = fSrcUnjitteredPos.y > fSrcOutputPos.y;
    let bFlipCol = fSrcUnjitteredPos.x > fSrcOutputPos.x;

    let fOffsetTL: vec2<f32> = vec2<f32>(offsetTL);

    var fColorAndWeight: vec4<f32> = vec4<f32>(0.0, 0.0, 0.0, 0.0);

    let fBaseSampleOffset = vec2<f32>(fSrcUnjitteredPos - fSrcOutputPos);
    let fRectificationCurveBias = mix(-2.0, -3.0, Saturate(params.fHrVelocity / 50.0));



    let fKernelReactiveFactor = max(fReactiveFactor, f32(params.bIsNewSample));
    let fKernelBiasMax = ComputeMaxKernelWeight() * (1.0 - fKernelReactiveFactor);

    let fKernelBiasMin = max(1.0, ((1.0 + fKernelBiasMax) * 0.3));
    let fKernelBiasFactor = max(0.0, max(0.25 * params.fDepthClipFactor, fKernelReactiveFactor));
    let fKernelBias = mix(fKernelBiasMax, fKernelBiasMin, fKernelBiasFactor);


    for (var row = 0; row < 3; row += 1) {
        for (var col = 0; col < 3; col += 1) {
            let iSampleIndex: i32 = col + (row << 2);

            var sampleColRow: vec2<i32> = vec2<i32>(col, row);

            if fSrcUnjitteredPos.x > fSrcOutputPos.x {
                sampleColRow.x = (3 - col);
            }
            if fSrcUnjitteredPos.y > fSrcOutputPos.y {
                sampleColRow.y = (3 - row);
            }


            let fOffset = fOffsetTL + vec2<f32>(sampleColRow);
            let fSrcSampleOffset = fBaseSampleOffset + fOffset;

            let iSrcSamplePos = vec2<i32>(iSrcInputPos) + vec2<i32>(offsetTL) + sampleColRow;
            let sampleCoord: vec2<i32> = ClampLoad(iSrcSamplePos, vec2<i32>(0, 0), vec2<i32>(RenderSize()));

            let color: vec4<f32> = LoadPreparedInputColor(vec2<i32>(sampleCoord));
            let fOnScreenFactor = f32(IsOnScreen(vec2<i32>(iSrcSamplePos), vec2<i32>(RenderSize())));



            let fSrcSampleOffsetBiased: vec2<f32> = fSrcSampleOffset * fKernelBias;
            var fSampleWeight = fOnScreenFactor * Lanczos2_s(length(fSrcSampleOffset));


            
            //LANCZOS_TYPE_REFERENCE
            //fSampleWeight = Lanczos2_s(length(fSrcSampleOffsetBiased));
            // // LANCZOS_TYPE_LUT
            // fSampleWeight = Lanczos2_UseLUT(length(fSrcSampleOffsetBiased));
            // // LANCZOS_TYPE_APPROXIMATE
            // fSampleWeight = Lanczos2ApproxSq(dot(fSrcSampleOffsetBiased, fSrcSampleOffsetBiased));
            fColorAndWeight += vec4<f32>(color.xyz * fSampleWeight, fSampleWeight);

            // Update rectification box

                {
                let fSrcSampleOffsetSq = dot(fSrcSampleOffset, fSrcSampleOffset);
                let fBoxSampleWeight = exp(fRectificationCurveBias * fSrcSampleOffsetSq);

                let bInitialSample = (row == 0) && (col == 0);
                RectificationBoxAddSample(bInitialSample, (clippingBox), color.xyz, fBoxSampleWeight);
            }
        }
    }

    RectificationBoxComputeVarianceBoxData((clippingBox));
    if fColorAndWeight.w > EPSILON {
        // Normalize for deringing (we need to compare colors)
        fColorAndWeight.x = fColorAndWeight.x / fColorAndWeight.w;
        fColorAndWeight.y = fColorAndWeight.y / fColorAndWeight.w;
        fColorAndWeight.z = fColorAndWeight.z / fColorAndWeight.w;
        fColorAndWeight.w *= fUpsampleLanczosWeightScale;

        let tmp_clamp = clamp(fColorAndWeight.xyz, (*clippingBox).aabbMin, (*clippingBox).aabbMax);
        fColorAndWeight.x = tmp_clamp.x ;
        fColorAndWeight.y = tmp_clamp.y ;
        fColorAndWeight.z = tmp_clamp.z ;
    }
    // fColorAndWeight.w = fKernelReactiveFactor;
    //fColorAndWeight.w = Lanczos2_s(length(fBaseSampleOffset));//length(fBaseSampleOffset) ;//Lanczos2_s();

    return fColorAndWeight;
}


fn ComputeBaseAccumulationWeight(params: AccumulationPassCommonParams, fThisFrameReactiveFactor: f32, bInMotionLastFrame: bool, fUpsampledWeight: f32) -> vec3<f32> {
    // Always assume max accumulation was reached
    var fBaseAccumulation: f32 = fMaxAccumulationLanczosWeight * f32(params.bIsExistingSample) * (1.0 - fThisFrameReactiveFactor) * (1.0 - params.fDepthClipFactor);

    //fBaseAccumulation = 1 - params.fDepthClipFactor ;
    fBaseAccumulation = min(fBaseAccumulation, mix(fBaseAccumulation, fUpsampledWeight * 10.0,
        max(f32(bInMotionLastFrame), Saturate(params.fHrVelocity * f32(10)))));

    fBaseAccumulation = min(fBaseAccumulation, mix(fBaseAccumulation, fUpsampledWeight, Saturate(params.fHrVelocity / f32(20))));

    return vec3<f32>(fBaseAccumulation, fBaseAccumulation, fBaseAccumulation);
}

fn ComputeLumaInstabilityFactor(params: AccumulationPassCommonParams, clippingBox: RectificationBox, fThisFrameReactiveFactor: f32, fLuminanceDiff: f32) -> f32 {
    let fUnormThreshold: f32 = 1.0 / 255.0;
    let N_MINUS_1 = 0;
    let N_MINUS_2 = 1;
    let N_MINUS_3 = 2;
    let N_MINUS_4 = 3;

    var  fCurrentFrameLuma: f32 = clippingBox.boxCenter.x;


//#if FFX_FSR2_OPTION_HDR_COLOR_INPUT
    fCurrentFrameLuma = fCurrentFrameLuma / (1.0 + max(0.0, fCurrentFrameLuma));
//#endif
    fCurrentFrameLuma = round(fCurrentFrameLuma * 255.0) / 255.0;

    let bSampleLumaHistory: bool = (max(max(params.fDepthClipFactor, params.fAccumulationMask), fLuminanceDiff) < 0.1) && (params.bIsNewSample == false);
    var fCurrentFrameLumaHistory: vec4<f32> = vec4<f32>(0, 0, 0, 0);
    if bSampleLumaHistory {
        //let aaaa = 1;
        fCurrentFrameLumaHistory = SampleLumaHistory(params.fReprojectedHrUv);
        
        //textureLod(sampler2D(r_luma_history, s_LinearClamp), fUV, 0.0);
    }

    var fLumaInstability: f32 = 0.0;
    let fDiffs0: f32 = (fCurrentFrameLuma - fCurrentFrameLumaHistory[N_MINUS_1]);
    var fMin: f32 = abs(fDiffs0);

    if fMin >= fUnormThreshold {
        for (var  i = N_MINUS_2; i <= N_MINUS_4; i++) {
            let fDiffs1: f32 = (fCurrentFrameLuma - fCurrentFrameLumaHistory[i]);

            if sign(fDiffs0) == sign(fDiffs1) {
                
                // Scale difference to protect historically similar values
                let fMinBias: f32 = 1.0;
                fMin = min(fMin, abs(fDiffs1) * fMinBias);
            }
        }

        let fBoxSize: f32 = clippingBox.boxVec.x;
        let fBoxSizeFactor: f32 = pow(Saturate(fBoxSize / 0.1), 6.0);

        fLumaInstability = f32(fMin != abs(fDiffs0)) * fBoxSizeFactor;
        fLumaInstability = f32(fLumaInstability > fUnormThreshold);

        fLumaInstability *= 1.0 - max(params.fAccumulationMask, pow(fThisFrameReactiveFactor, 1.0 / 6.0));
    }

    //shift history
    fCurrentFrameLumaHistory[N_MINUS_4] = fCurrentFrameLumaHistory[N_MINUS_3];
    fCurrentFrameLumaHistory[N_MINUS_3] = fCurrentFrameLumaHistory[N_MINUS_2];
    fCurrentFrameLumaHistory[N_MINUS_2] = fCurrentFrameLumaHistory[N_MINUS_1];
    fCurrentFrameLumaHistory[N_MINUS_1] = fCurrentFrameLuma;

    StoreLumaHistory(params.iPxHrPos, fCurrentFrameLumaHistory);

    return fLumaInstability * f32(fCurrentFrameLumaHistory[N_MINUS_4] != 0);
}

fn ComputeTemporalReactiveFactor(params: AccumulationPassCommonParams, fTemporalReactiveFactor: f32) -> f32 {
    var fNewFactor: f32 = min(0.99, fTemporalReactiveFactor);

    fNewFactor = max(fNewFactor, mix(fNewFactor, 0.4, Saturate(params.fHrVelocity)));

    fNewFactor = max(fNewFactor * fNewFactor, params.fDepthClipFactor * 0.1);

    // Force reactive factor for new samples
    if params.bIsNewSample {
        fNewFactor = 1.0;
    }

    if Saturate(params.fHrVelocity * 10.0) >= 1.0 {
        fNewFactor = max(EPSILON, fNewFactor) * -1.0;
    }

    return fNewFactor;
}



fn RectifyHistory(
    params: AccumulationPassCommonParams,
    clippingBox: RectificationBox, fHistoryColor: ptr<function, vec3<f32>>, fAccumulation: ptr<function,vec3<f32>>,
    fLockContributionThisFrame: f32, fTemporalReactiveFactor: f32, fLumaInstabilityFactor: f32
) -> vec3<f32> {
    let fScaleFactorInfluence: f32 = min(20.0, pow(f32(1.0 / length(DownscaleFactor().x * DownscaleFactor().y)), 3.0));

    let fVecolityFactor: f32 = Saturate(params.fHrVelocity / 20.0);
    let fBoxScaleT: f32 = max(params.fDepthClipFactor, max(params.fAccumulationMask, fVecolityFactor));
    let fBoxScale: f32 = mix(fScaleFactorInfluence, 1.0, fBoxScaleT);

    let fScaledBoxVec: vec3<f32> = clippingBox.boxVec * fBoxScale;
    var boxMin: vec3<f32> = clippingBox.boxCenter - fScaledBoxVec;
    var boxMax: vec3<f32> = clippingBox.boxCenter + fScaledBoxVec;
    let boxCenter: vec3<f32> = clippingBox.boxCenter;
    let boxVecSize: f32 = length(clippingBox.boxVec);

    boxMin = max(clippingBox.aabbMin, boxMin);
    boxMax = min(clippingBox.aabbMax, boxMax);

    if any((boxMin >= (*fHistoryColor))) || any(((*fHistoryColor) >= boxMax)) {

        let fClampedHistoryColor: vec3<f32> = clamp((*fHistoryColor), boxMin, boxMax);

        var fHistoryContribution: vec3<f32> = Broadcast3(max(fLumaInstabilityFactor, fLockContributionThisFrame));

        let fReactiveFactor: f32 = params.fDilatedReactiveFactor;
        let fReactiveContribution: f32 = 1.0 - pow(fReactiveFactor, 1.0 / 2.0);
        fHistoryContribution *= fReactiveContribution;

        // Scale history color using rectification info, also using accumulation mask to avoid potential invalid color protection
        (*fHistoryColor) = mix(fClampedHistoryColor, (*fHistoryColor), Saturate3(fHistoryContribution));

        // Scale accumulation using rectification info
        let fAccumulationMin: vec3<f32> = min((*fAccumulation), vec3<f32>(0.3, 0.3, 0.3));
        (*fAccumulation) = mix(fAccumulationMin, (*fAccumulation), Saturate3(fHistoryContribution));
        return fHistoryContribution;
    }
    return vec3<f32>(1.0, 1.0, 1.0);
}


fn GetShadingChangeLuma(iPxHrPos: vec2<i32>, fUvCoord: vec2<f32>) -> f32 {
    var fShadingChangeLuma: f32 = 0;

    let fDiv: f32 = pow(1, f32(1 + LumaMipLevelToUse()));
    var iMipRenderSize: vec2<i32> = vec2<i32>(vec2<f32>(RenderSize()) / fDiv);


    var _fUvCoord = ClampUv(fUvCoord, iMipRenderSize, LumaMipDimensions());
    //fShadingChangeLuma = Exposure() * exp(f32(SampleMipLuma(_fUvCoord)));
    //Exposure() * exp(f32(SampleMipLuma(_fUvCoord, LumaMipLevelToUse())));
    fShadingChangeLuma = Exposure() * exp(f32(SampleMipLuma(
        (vec2<f32>(iPxHrPos) / vec2<f32>(DisplaySize()) * vec2<f32>(RenderSize()))
    )));
    fShadingChangeLuma = pow(fShadingChangeLuma, 1.0 / 6.0);

    return fShadingChangeLuma;
}


fn UpdateLockStatus(params: AccumulationPassCommonParams,
    fReactiveFactor: ptr<function,f32>,
    state: LockState,
    fLockStatus: ptr<function,vec2<f32>>,
    fLockContributionThisFrame: ptr<function,f32>,
    fLuminanceDiff: ptr<function,f32>) {

    let fShadingChangeLuma: f32 = GetShadingChangeLuma(params.iPxHrPos, params.fHrUv);

    // init temporal shading change factor, init to -1 or so in reproject to know if "true new"?
    if (*fLockStatus)[LOCK_TEMPORAL_LUMA] == f32(0.0) {
        (*fLockStatus)[LOCK_TEMPORAL_LUMA] = fShadingChangeLuma;
    }

    var fPreviousShadingChangeLuma: f32 = (*fLockStatus)[LOCK_TEMPORAL_LUMA];

    *fLuminanceDiff = 1.0 - MinDividedByMax(fPreviousShadingChangeLuma, fShadingChangeLuma);

    if state.NewLock {
        (*fLockStatus)[LOCK_TEMPORAL_LUMA] = fShadingChangeLuma;
        if (*fLockStatus)[LOCK_LIFETIME_REMAINING] != 0.0 {
            (*fLockStatus)[LOCK_LIFETIME_REMAINING] = 2;
        } else {
            (*fLockStatus)[LOCK_LIFETIME_REMAINING] = 1;
        }
    } else if (*fLockStatus)[LOCK_LIFETIME_REMAINING] <= 1.0 {
        (*fLockStatus)[LOCK_TEMPORAL_LUMA] = mix((*fLockStatus)[LOCK_TEMPORAL_LUMA], f32(fShadingChangeLuma), 0.5);
    } else {
        if *fLuminanceDiff > 0.1 {
           // KillLock((*fLockStatus));
            (*fLockStatus)[LOCK_LIFETIME_REMAINING] = 0;
        }
    }

    (*fReactiveFactor) = max((*fReactiveFactor), Saturate((*fLuminanceDiff - 0.1) * 10.0));
    (*fLockStatus)[LOCK_LIFETIME_REMAINING] *= (1.0 - (*fReactiveFactor));

    (*fLockStatus)[LOCK_LIFETIME_REMAINING] *= Saturate(1.0 - params.fAccumulationMask);
    (*fLockStatus)[LOCK_LIFETIME_REMAINING] *= f32(params.fDepthClipFactor < 0.1);

    // Compute this frame lock contribution
    let fLifetimeContribution: f32 = Saturate((*fLockStatus)[LOCK_LIFETIME_REMAINING] - 1.0);
    let fShadingChangeContribution: f32 = Saturate(MinDividedByMax((*fLockStatus)[LOCK_TEMPORAL_LUMA], fShadingChangeLuma));

    *fLockContributionThisFrame = Saturate(Saturate(fLifetimeContribution * 4.0) * fShadingChangeContribution);
}


fn FinalizeLockStatus(params: AccumulationPassCommonParams, fLockStatus: vec2<f32>, fUpsampledWeight: f32) {
    // we expect similar motion for next frame
    // kill lock if that location is outside screen, avoid locks to be clamped to screen borders
    var fEstimatedUvNextFrame: vec2<f32> = params.fHrUv - params.fMotionVector;
    var _fLockStatus: vec2<f32> = fLockStatus;
    if IsUvInside(fEstimatedUvNextFrame) == false {
        _fLockStatus[LOCK_LIFETIME_REMAINING] = 0.0;
    } else {
        // Decrease lock lifetime
        let fLifetimeDecreaseLanczosMax: f32 = f32(JitterSequenceLength()) * f32(fAverageLanczosWeightPerFrame);
        let fLifetimeDecrease: f32 = f32(fUpsampledWeight / fLifetimeDecreaseLanczosMax);
        _fLockStatus[LOCK_LIFETIME_REMAINING] = max(f32(0), _fLockStatus[LOCK_LIFETIME_REMAINING] - fLifetimeDecrease);
    }

    StoreLockStatus(params.iPxHrPos, _fLockStatus);
}

fn InitParams(iPxHrPos: vec2<i32>) -> AccumulationPassCommonParams {
    var params: AccumulationPassCommonParams;

    params.iPxHrPos = iPxHrPos;
    params.fHrUv = (vec2<f32>(iPxHrPos) + 0.5) / vec2<f32>(DisplaySize());

    let fLrUvJittered: vec2<f32> = params.fHrUv ;//+ Jitter() / vec2<f32>(RenderSize())
    params.fLrUv_HwSampler = ClampUv(fLrUvJittered, RenderSize(), MaxRenderSize());


    //params.fMotionVector = LoadInputMotionVector(iPxHrPos);
    params.fMotionVector = LoadInputMotionVector(vec2<i32>(params.fHrUv * vec2<f32>(RenderSize())));

    params.fHrVelocity = length(params.fMotionVector * vec2<f32>(DisplaySize()));

    //ComputeReprojectedUVs(params, &params.fReprojectedHrUv, &params.bIsExistingSample);
    params.fReprojectedHrUv = params.fHrUv - params.fMotionVector;
    params.bIsExistingSample = (params.fReprojectedHrUv.x >= 0.0 && params.fReprojectedHrUv.x <= 1.0) && (params.fReprojectedHrUv.y >= 0.0 && params.fReprojectedHrUv.y <= 1.0);

    params.fDepthClipFactor = Saturate(SamplePreparedInputColor(params.fLrUv_HwSampler).w);
    //params.fDepthClipFactor = 0.5;

    let  fDilatedReactiveMasks: vec2<f32> = SampleDilatedReactiveMasks(params.fLrUv_HwSampler);
    //let  fDilatedReactiveMasks: vec2<f32> = vec2<f32>(0.1, 0.1);
    //params.fDilatedReactiveFactor = fDilatedReactiveMasks.x;
    //params.fDilatedReactiveFactor = 0.9;
    params.fAccumulationMask = fDilatedReactiveMasks.y;
    //params.bIsResetFrame = (0 == FrameIndex());
    params.bIsResetFrame = false;
    params.bIsNewSample = (params.bIsExistingSample == false || params.bIsResetFrame);
    //params.bIsNewSample = (params.bIsExistingSample == false || params.bIsResetFrame);

    return params;
}

fn Accumulate(iPxHrPos: vec2<i32>) {
    var params: AccumulationPassCommonParams = InitParams(iPxHrPos);
    var iPxLrPos: vec2<i32> = vec2<i32>(round(params.fHrUv * vec2<f32>(RenderSize())));

    var fHistoryColor: vec3<f32> = vec3<f32>(0, 0, 0);
    var fLockStatus: vec2<f32> = vec2<f32>(0, 0);

    var fTemporalReactiveFactor: f32 = 0.0;
    var bInMotionLastFrame: bool = false;
    var lockState: LockState = LockState(false, false);

    if params.bIsExistingSample && !params.bIsResetFrame {

        lockState = ReprojectHistoryLockStatus(params, &fLockStatus);
    }
    ReprojectHistoryColor(params, &fHistoryColor, &fTemporalReactiveFactor, &bInMotionLastFrame);//ycocg
    var bk = fTemporalReactiveFactor;
    var fThisFrameReactiveFactor: f32 = fTemporalReactiveFactor;

    var fLuminanceDiff: f32 = 0.0;
    var fLockContributionThisFrame: f32 = 0.0;

    UpdateLockStatus(params, &fThisFrameReactiveFactor, lockState, &fLockStatus, &fLockContributionThisFrame,
        &fLuminanceDiff);

    // // Load upsampled input color
    var clippingBox: RectificationBox = RectificationBox();
    var fUpsampledColorAndWeight: vec4<f32> = vec4<f32>(0, 0, 0, 0);
    fUpsampledColorAndWeight = ComputeUpsampledColorAndWeight(params, &clippingBox, fThisFrameReactiveFactor);

    // fUpsampledColorAndWeight = LoadPreparedInputColor(iPxLrPos);
    // RectificationBoxAddSample(true, (&clippingBox), fUpsampledColorAndWeight.xyz, fUpsampledColorAndWeight.w);
    // RectificationBoxComputeVarianceBoxData((&clippingBox));

    var fLumaInstabilityFactor: f32 = ComputeLumaInstabilityFactor(params, clippingBox, fThisFrameReactiveFactor, fLuminanceDiff);

    //fThisFrameReactiveFactor = 0.3;

    var fAccumulation: vec3<f32> = ComputeBaseAccumulationWeight(params, fThisFrameReactiveFactor,
        bInMotionLastFrame, fUpsampledColorAndWeight.w);
    var fAccumulation_bk = fAccumulation;
    if params.bIsNewSample {
        fHistoryColor = YCoCgToRGB(fUpsampledColorAndWeight.xyz);
    } else {
        let contribution = RectifyHistory(params, clippingBox, &fHistoryColor, &fAccumulation, fLockContributionThisFrame, fThisFrameReactiveFactor, fLumaInstabilityFactor);
        fAccumulation = max(vec3<f32>(EPSILON, EPSILON, EPSILON), fAccumulation + fUpsampledColorAndWeight.www);
        var fAlpha: vec3<f32> = fUpsampledColorAndWeight.www / fAccumulation;
        // fAlpha = vec3<f32>(0.05, 0.05, 0.05);
        // fAlpha *= 0.2;
        // fAlpha = fUpsampledColorAndWeight.www;
        fHistoryColor = mix(fHistoryColor, (fUpsampledColorAndWeight.xyz), fAlpha);
        fHistoryColor = YCoCgToRGB(fHistoryColor);
        //fHistoryColor = YCoCgToRGB(fUpsampledColorAndWeight.xyz);
        // if all(fHistoryColor <= vec3<f32>(1.0 / 255.0, 1.0 / 255.0, 1.0 / 255.0)) {
        //     fHistoryColor = YCoCgToRGB(LoadPreparedInputColor(iPxLrPos).xyz);
        // } else {
        //     fHistoryColor = vec3<f32>(0, 0, 0);
        // }
        //fHistoryColor = vec3<f32>(0, LoadRwNewLocks(iPxLrPos), 0);
        //fHistoryColor = YCoCgToRGB(LoadPreparedInputColor(iPxLrPos).xyz);
        //fHistoryColor = textureLoad(rPreviousDisplay, iPxHrPos, 0).xyz - (fHistoryColor);
        //fHistoryColor = mix(YCoCgToRGB(fHistoryColor), YCoCgToRGB(fUpsampledColorAndWeight.xyz), fAlpha);
        //
        //fHistoryColor = vec3<f32>(0, params.fDepthClipFactor, 0);
        //fHistoryColor = vec3<f32>(0, fLumaInstabilityFactor, 0);
        //fHistoryColor = vec3<f32>(0, params.fMotionVector);

        if showWeight {
        }
        
        //fHistoryColor = vec3<f32>(0, params.fAccumulationMask, 0);
        //fHistoryColor = vec3<f32>(0, fThisFrameReactiveFactor, 0);
        
        //fHistoryColor = YCoCgToRGB(fUpsampledColorAndWeight.xyz);
    }

    fHistoryColor = UnprepareRgb(fHistoryColor, Exposure());

    FinalizeLockStatus(params, fLockStatus, fUpsampledColorAndWeight.w);

    // // Get new temporal reactive factor
    fTemporalReactiveFactor = ComputeTemporalReactiveFactor(params, fThisFrameReactiveFactor);

    StoreInternalColorAndWeight(iPxHrPos, vec4<f32>(fHistoryColor, fTemporalReactiveFactor));

    //textureStore(wPreviousDisplay, iPxHrPos, vec4<f32>(fHistoryColor, 1));

    // Output final color when RCAS is disabled

    textureStore(currentDisplay, iPxHrPos, vec4<f32>(fHistoryColor.xyz, 1));
    // var iPxLrPos= vec2<i32>(params.fHrUv*vec2<f32>(RenderSize()));
    // textureStore(currentDisplay, iPxHrPos, vec4<f32>(,0, 1));
    //textureStore(currentDisplay, iPxHrPos, vec4<f32>(0,f32(params.bIsNewSample)/1.0,   0, 1));
    StoreNewLocks(iPxHrPos, 0);
}






@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3u, @builtin(workgroup_id) WorkgroupID: vec3u, @builtin(local_invocation_id) LocalInvocationID: vec3u) {
    let screen_size: vec2<i32> = DisplaySize();
    let screen_pos: vec2<i32> = vec2<i32>(GlobalInvocationID.xy);
    // globalInvocationID = vec3<i32>(GlobalInvocationID);
    // workgroupID = vec3<i32>(WorkgroupID);
    // localInvocationID = vec3<i32>(LocalInvocationID);
    //invokePreload(vec2i(GlobalInvocationID.xy), vec2i(LocalInvocationID.xy));
    if enCache {
        globalInvocationID = vec3<i32>(GlobalInvocationID);
        workgroupID = vec3<i32>(WorkgroupID);
        localInvocationID = vec3<i32>(LocalInvocationID);
        invokePreload(vec2i(GlobalInvocationID.xy), vec2i(LocalInvocationID.xy));
    }
    if !IsOnScreen(screen_pos, screen_size) {
        let zlinear = zNear * zFar / (zFar + 0 * (zNear - zFar));
        return;
    }
    let origin_size: vec2<i32> = RenderSize();
    let scale_ratio: f32 = f32(screen_size.x) / f32(origin_size.x);
    let origin_pos: vec2<i32> = vec2<i32>(vec2<f32>(screen_pos) / scale_ratio);
    // let origin_abs_pos: vec2<u32>;
    // let prev_pos: vec2<u32> ;

    // linear depth
    // let depth = (textureSampleLevel(depthBuffer, samp, vec2<f32>(origin_pos) / vec2<f32>(origin_size), 0) + 1.0) / 2.0;
    // // let depth = (textureLoad(depthBuffer, origin_pos, 0) + 1.0) / 2.0;
    // let zlinear = zNear * zFar / (zFar + depth * (zNear - zFar));
    // // textureStore(output, screen_pos, vec4<f32>(vec3<f32>(zlinear / 20.0), 1.0));

    

    // vbuffer //getClosestOffset(origin_size, origin_pos)
    // var visibility: vec4<u32> = textureLoad(vBuffer, origin_pos, 0);
    // let betagamma = bitcast<vec2<f32>>(visibility.xy);
    // let barycentric = vec3<f32>(1.0 - betagamma.x - betagamma.y, betagamma.x, betagamma.y);
    // // textureStore(output, screen_pos, vec4<f32>(barycentric, 1.0));

    // // [0, width] x [0, height] range of motion vector
    // // .------> X
    // // |
    // // v
    // // Y
    // let motionVec: vec2<f32> = LoadInputMotionVector(origin_pos);//currentScreenPos - lastScreenPos
    // //let motionVec: vec2<f32> = vec2<f32>(0, 0);
    // // textureStore(output, screen_pos, vec4<f32>(motionVec.xy * 0.05+0.5, 0.0, 1.0));
    // let trianlgeID = visibility.z;
    // textureStore(output, screen_pos, vec4<f32>(vec3<f32>(f32(visibility.z) / 3.), 1.));

    // raytracing depth

    //Accumulate(origin_pos);
    Accumulate(screen_pos);

    // let fHrUv = (vec2<f32>(screen_pos) + 0.5) / vec2<f32>(DisplaySize());
    // //params.fMotionVector = LoadInputMotionVector(iPxHrPos);
    // let fMotionVector = LoadInputMotionVector(vec2<i32>(fHrUv * vec2<f32>(RenderSize())));

    // let fHrVelocity = length(fMotionVector * vec2<f32>(DisplaySize()));

    // //ComputeReprojectedUVs(params, &params.fReprojectedHrUv, &params.bIsExistingSample);
    // let fReprojectedHrUv = fHrUv - fMotionVector;
    // let bIsExistingSample = (fReprojectedHrUv.x >= 0.0 && fReprojectedHrUv.x <= 1.0) && (fReprojectedHrUv.y >= 0.0 && fReprojectedHrUv.y <= 1.0);

    // let bIsResetFrame = false;
    // let bIsNewSample = (bIsExistingSample == false || bIsResetFrame);

    // var color = vec4<f32>(0.0, 0.0, 0.0, 1.0);
    // var last_color = vec4<f32>(0.0, 0.0, 0.0, 1.0);
    // if bIsNewSample {
    //     color = vec4<f32>(LoadInputColor(origin_pos), 0);
    //     textureStore(wPreviousDisplay, screen_pos, vec4<f32>(color.xyz, 1));
    //     textureStore(currentDisplay, screen_pos, color);
    // } else {
    //     last_color = textureLoad(rPreviousDisplay, screen_pos, 0);
    //     //last_color = HistorySample(fReprojectedHrUv, DisplaySize());
    //     color = vec4<f32>(LoadInputColor(origin_pos), 0);
    //     let alpha = 0.05;
    //     color = alpha * color + (1 - alpha) * last_color;
    //     textureStore(wPreviousDisplay, screen_pos, vec4<f32>(color.xyz, 1));
        
    //     //color = vec4<f32>(fReprojectedHrUv, 0, 1);
    //     textureStore(currentDisplay, screen_pos, color);
    // }
    // color = vec4<f32>(LoadInputColor(origin_pos), 0);
    // textureStore(currentDisplay, origin_pos, color);
}