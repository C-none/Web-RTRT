struct Camera {
    world: mat4x4<f32>,
    projInv: mat4x4<f32>,
    VPMat: mat4x4<f32>,
    lastVPMat: mat4x4<f32>,
};

struct lanczosInfo {
    res: vec4<f32>,
    weight: f32,
};

struct FetchedBicubicSamples {
     fColor00: vec4<f32>,
     fColor10: vec4<f32>,
     fColor20: vec4<f32>,
     fColor30: vec4<f32>,

     fColor01: vec4<f32>,
     fColor11: vec4<f32>,
     fColor21: vec4<f32>,
     fColor31: vec4<f32>,

     fColor02: vec4<f32>,
     fColor12: vec4<f32>,
     fColor22: vec4<f32>,
     fColor32: vec4<f32>,

     fColor03: vec4<f32>,
     fColor13: vec4<f32>,
     fColor23: vec4<f32>,
     fColor33: vec4<f32>,
};

struct AccumulationPassCommonParams {
    iPxHrPos: vec2<i32>,
    fHrUv: vec2<f32> ,
    fLrUv_HwSampler: vec2<f32>,
    fMotionVector: vec2<f32>,
    fReprojectedHrUv: vec2<f32>,
    fHrVelocity: f32,
    fDepthClipFactor: f32,
    fDilatedReactiveFactor: f32,
    fAccumulationMask: f32,
    bIsResetFrame: bool,
    bIsExistingSample: bool,
    bIsNewSample: bool,
};

struct RectificationBox {
    boxCenter: vec3<f32>,
    boxVec: vec3<f32>,
    aabbMin: vec3<f32>,
    aabbMax: vec3<f32>,
    fBoxCenterWeight: f32,
};

struct LockState {
    NewLock: bool, //Set for both unique new and re-locked new
    WasLockedPrevFrame: bool, //Set to identify if the pixel was already locked (relock)
};


struct BilinearSamplingData {
    iOffsets: array<vec2<i32>,4>,
    fWeights: array<f32,4>,
    iBasePos: vec2<i32>,
};







override zNear: f32 = 0.01;
override zFar: f32 = 50.0;
override _displayWidth:i32 = 0;
override _displayHeight:i32 = 0;
override _renderWidth:i32 = 0;
override _renderHeight:i32 = 0;


const BATCH_SIZE:i32 =8;
const enCache:bool=true;
const showWeight:bool=true;
const fSharpness:f32=0.5;
const GROUP_SIZE:u32 =  8;
const FSR_RCAS_DENOISE:u32= 1;
const LOCK_TEMPORAL_LUMA:i32=1;
const LOCK_LIFETIME_REMAINING:i32=0;
const FSR_RCAS_LIMIT:f32= (0.25 - (1.0 / 16.0));
const PI:f32 = 3.1415926;
const FP16_MIN = 6.10e-05;
const FP16_MAX = 65504.0;
const FLT_EPSILON=1.1920928955078125e-7;
const EPSILON = 1e-06;
const TONEMAP_EPSILON = 1.0 / FP16_MAX;
const FLT_MAX = 3.402823466e+38;
const FLT_MIN = 1.175494351e-38; 
const MinDepthSep:f32=0.1;
const fReconstructedDepthBilinearWeightThreshold:f32 = 0.01;
const DepthClipBaseScale = 4.0;
const fReletructedDepthBilinearWeightThreshold:f32=0.01;
// Accumulation
const  fUpsampleLanczosWeightScale:f32 = 1.0 / 12.0;
const  fMaxAccumulationLanczosWeight:f32 = 1.0;
const  fAverageLanczosWeightPerFrame:f32 = 0.74 * fUpsampleLanczosWeightScale; // Average lanczos weight for jitter accumulated samples
const  fAccumulationMaxOnMotion:f32 = 3.0 * fUpsampleLanczosWeightScale;
// Auto exposure
const  resetAutoExposureAverageSmoothing:f32 = 100000000;
const fExposure:f32=1.0;
const fPreExposure:f32=1.0;




fn Lanczos2NoClamp(x: f32) -> f32 {
    if abs(x) < EPSILON {
        return 1;
    } else {
        return (sin(PI * x) / (PI * x)) * (sin(0.5 * PI * x) / (0.5 * PI * x));
    }
}
fn Lanczos2_s(x: f32) -> f32 {
    let y = (min(abs(x), 2.0));
    return Lanczos2NoClamp(y);
}
// fn Lanczos2_v(fColor0: vec4<f32>, fColor1: vec4<f32>, fColor2: vec4<f32>, fColor3: vec4<f32>, t: f32) -> vec4<f32> {
//     let fWeight0: f32 = Lanczos2_s(-1 - t);
//     let fWeight1: f32 = Lanczos2_s(-0 - t);
//     let fWeight2: f32 = Lanczos2_s(1.0 - t);
//     let fWeight3: f32 = Lanczos2_s(2.0 - t);
//     return (fWeight0 * fColor0 + fWeight1 * fColor1 + fWeight2 * fColor2 + fWeight3 * fColor3) / (fWeight0 + fWeight1 + fWeight2 + fWeight3);
// }
fn Lanczos2_v(fColor0: vec4<f32>, fColor1: vec4<f32>, fColor2: vec4<f32>, fColor3: vec4<f32>, t: f32) -> vec4<f32> {
    let fWeight0: f32 = Lanczos2_s(-0.5 - t);
    let fWeight1: f32 = Lanczos2_s(0.5 - t);
    let fWeight2: f32 = Lanczos2_s(1.5 - t);
    let fWeight3: f32 = Lanczos2_s(2.5 - t);
    return (fWeight0 * fColor0 + fWeight1 * fColor1 + fWeight2 * fColor2 + fWeight3 * fColor3) / (fWeight0 + fWeight1 + fWeight2 + fWeight3);
}
fn Lanczos2(Samples: FetchedBicubicSamples, fPxFrac: vec2<f32>) -> vec4<f32> {
    let fColorX0: vec4<f32> = Lanczos2_v(Samples.fColor00, Samples.fColor10, Samples.fColor20, Samples.fColor30, fPxFrac.x);
    let fColorX1: vec4<f32> = Lanczos2_v(Samples.fColor01, Samples.fColor11, Samples.fColor21, Samples.fColor31, fPxFrac.x);
    let fColorX2: vec4<f32> = Lanczos2_v(Samples.fColor02, Samples.fColor12, Samples.fColor22, Samples.fColor32, fPxFrac.x);
    let fColorX3: vec4<f32> = Lanczos2_v(Samples.fColor03, Samples.fColor13, Samples.fColor23, Samples.fColor33, fPxFrac.x);
    var fColorXY: vec4<f32> = Lanczos2_v(fColorX0, fColorX1, fColorX2, fColorX3, fPxFrac.y);

    // Deringing

    // TODO: only use 4 by checking jitter
    let  iDeringingSampleCount: i32 = 4;
    let  fDeringingSamples: array<vec4<f32>,4> = array<vec4<f32>,4>(
        Samples.fColor11, Samples.fColor21,
        Samples.fColor12, Samples.fColor22,
    );

    var fDeringingMin = fDeringingSamples[0];
    var fDeringingMax = fDeringingSamples[0];

    for (var iSampleIndex: i32 = 1; iSampleIndex < iDeringingSampleCount; iSampleIndex += 1) {

        fDeringingMin = min(fDeringingMin, fDeringingSamples[iSampleIndex]);
        fDeringingMax = max(fDeringingMax, fDeringingSamples[iSampleIndex]);
    }

    fColorXY = clamp(fColorXY, fDeringingMin, fDeringingMax);

    return fColorXY;
}
// FSR1 lanczos approximation. Input is x*x and must be <= 4.
fn Lanczos2ApproxSqNoClamp(x2: f32) -> f32 {
    let a: f32 = (2.0 / 5.0) * x2 - 1;
    let b: f32 = (1.0 / 4.0) * x2 - 1;
    return ((25.0 / 16.0) * a * a - (25.0 / 16.0 - 1)) * (b * b);
}
fn Lanczos2ApproxSq(x2: f32) -> f32 {
    let y2 = min(x2, 4.0);
    return Lanczos2ApproxSqNoClamp(y2);
}
fn Lanczos2ApproxNoClamp(x: f32) -> f32 {
    return Lanczos2ApproxSqNoClamp(x * x);
}
fn Lanczos2Approx(x: f32) -> f32 {
    return Lanczos2ApproxSq(x * x);
}
fn GetBilinearSamplingData(fUv: vec2<f32>, iSize: vec2<i32>) -> BilinearSamplingData {
    var data: BilinearSamplingData = BilinearSamplingData();

    let fPxSample: vec2<f32> = (fUv * vec2<f32>(iSize)) - vec2<f32>(0.5, 0.5);
    data.iBasePos = vec2<i32>(floor(fPxSample));
    let fPxFrac: vec2<f32> = fract(fPxSample);

    data.iOffsets[0] = vec2<i32>(0, 0);
    data.iOffsets[1] = vec2<i32>(1, 0);
    data.iOffsets[2] = vec2<i32>(0, 1);
    data.iOffsets[3] = vec2<i32>(1, 1);

    data.fWeights[0] = (1 - fPxFrac.x) * (1 - fPxFrac.y);
    data.fWeights[1] = (fPxFrac.x) * (1 - fPxFrac.y);
    data.fWeights[2] = (1 - fPxFrac.x) * (fPxFrac.y);
    data.fWeights[3] = (fPxFrac.x) * (fPxFrac.y);

    return data;
}


fn DisplaySize() -> vec2<i32> {
    return vec2<i32>(_displayWidth, _displayHeight);
}
fn RenderSize() -> vec2<i32> {
    //let origin_size: vec2<i32> = vec2<i32>(_renderWidth, _renderHeight);
    return vec2<i32>(_renderWidth, _renderHeight);
}
fn LumaMipLevelToUse() -> i32 {
    return 1;
}
fn LumaMipDimensions() -> vec2<i32> {
    return RenderSize() / LumaMipLevelToUse();
}
fn IsOnScreen(pos: vec2<i32>, size: vec2<i32>) -> bool {
    return pos.x < size.x && pos.y < size.y;
}
fn MaxRenderSize() -> vec2<i32> {
    let screen_size: vec2<i32> = vec2<i32>(_displayWidth, _displayHeight);
    //return screen_size;
    return vec2<i32>(_renderWidth, _renderHeight);
}
fn DownscaleFactor() -> vec2<f32> {
    return vec2<f32>(f32(_renderWidth) / f32(_displayWidth), f32(_renderHeight) / f32(_displayHeight));
}
fn Jitter() -> vec2<f32> {
    return sampJitter;
    //return vec2<f32>(0, 0);
}
fn JitterSequenceLength() -> f32 {
    return 32;
}
fn Exposure() -> f32 {
    return fExposure;
}
fn PreExposure() -> f32 {
    return fPreExposure;
}
fn PrepareRgb(fRgb: vec3<f32>, fExposure: f32, fPreExposure: f32) -> vec3<f32> {
    var rgb: vec3<f32> = fRgb;
    rgb = rgb / Broadcast3(fPreExposure);
    rgb = rgb * Broadcast3(fExposure);

    rgb = clamp(rgb, Broadcast3(0.0), Broadcast3(65504.0));

    return rgb;
}

fn UnprepareRgb(fRgb: vec3<f32>, fExposure: f32) -> vec3<f32> {
    var rgb: vec3<f32> = fRgb;
    rgb = rgb / Broadcast3(fExposure);
    rgb = rgb * Broadcast3(fPreExposure);
    return rgb;
}

fn Broadcast2(value: f32) -> vec2<f32> {
    return vec2<f32>(value, value);
}
fn Broadcast3(value: f32) -> vec3<f32> {
    return vec3<f32>(value, value, value);
}
fn Broadcast4(value: f32) -> vec4<f32> {
    return vec4<f32>(value, value, value, value);
}
fn Saturate(a: f32) -> f32 {
    return min(1.0, max(0.0, a));
}
fn Saturate2(x: vec2<f32>) -> vec2<f32> {
    return clamp(x, Broadcast2(0.0), Broadcast2(1.0));
}
fn Saturate3(x: vec3<f32>) -> vec3<f32> {
    return clamp(x, Broadcast3(0.0), Broadcast3(1.0));
}
fn Saturate4(x: vec4<f32>) -> vec4<f32> {
    return clamp(x, Broadcast4(0.0), Broadcast4(1.0));
}
fn IsUvInside(fUv: vec2<f32>) -> bool {
    return (fUv.x >= 0.0 && fUv.x <= 1.0) && (fUv.y >= 0.0 && fUv.y <= 1.0);
}
fn ClampUv(fUv: vec2<f32>, iTextureSize: vec2<i32>, iResourceSize: vec2<i32>) -> vec2<f32> {
    let  fSampleLocation: vec2<f32> = fUv * vec2<f32>(iTextureSize);
    let  fClampedLocation: vec2<f32> = max(vec2<f32>(0.5, 0.5), min(fSampleLocation, vec2<f32>(iTextureSize) - vec2<f32>(0.5, 0.5)));
    let  fClampedUv: vec2<f32> = fClampedLocation / vec2<f32>(iResourceSize);
    return fClampedUv;
}
fn ClampLoad(iPxSample: vec2<i32>, iPxOffset: vec2<i32>, iTextureSize: vec2<i32>) -> vec2<i32> {
    var result: vec2<i32> = iPxSample + iPxOffset;
    if iPxOffset.x < 0 {
        result.x = max(result.x, 0);
    } else if iPxOffset.x > 0 {
        result.x = min(result.x, iTextureSize.x - 1);
    }
    if iPxOffset.y < 0 {
        result.y = max(result.y, 0);
    } else if iPxOffset.y > 0 {
        result.y = min(result.y, iTextureSize.y - 1);
    }
    return result;

    // return Med3(iPxSample + iPxOffset, Int32x2(0, 0), iTextureSize - Int32x2(1, 1));
}
fn ClampCoord(iPxSample: vec2<i32>, iPxOffset: vec2<i32>, iTextureSize: vec2<i32>) -> vec2<i32> {
    var result: vec2<i32> = iPxSample + iPxOffset;
    if iPxOffset.x < 0 {
        result.x = max(result.x, 0);
    }
    if iPxOffset.x > 0 {
        result.x = min(result.x, iTextureSize.x - 1);
    }
    if iPxOffset.x < 0 {
        result.y = max(result.y, 0);
    }
    if iPxOffset.x > 0 {
        result.y = min(result.y, iTextureSize.y - 1);
    }
    return result;
}
fn min3(a: f32, b: f32, c: f32) -> f32 {
    return min(min(a, b), c);
}
fn max3(a: f32, b: f32, c: f32) -> f32 {
    return max(max(a, b), c);
}
fn rcp(a: f32) -> f32 {
    return f32(1.0) / a;
}

fn MinDividedByMax(v0: f32, v1: f32) -> f32 {
    var m: f32 = max(v0, v1);
    if m != 0 {
        return min(v0, v1) / m;
    }
    return 0;
}
fn RGBToYCoCg(fRgb: vec3<f32>) -> vec3<f32> {
    let fYCoCg: vec3<f32> = vec3<f32>(
        0.25 * fRgb.x + 0.5 * fRgb.y + 0.25 * fRgb.z,
        0.5 * fRgb.x - 0.5 * fRgb.z,
        -0.25 * fRgb.x + 0.5 * fRgb.y - 0.25 * fRgb.z
    );
    return fYCoCg;
}
fn YCoCgToRGB(fYCoCg: vec3<f32>) -> vec3<f32> {
    let fRGB: vec3<f32> = vec3<f32>(
        fYCoCg.x + fYCoCg.y - fYCoCg.z,
        fYCoCg.x + fYCoCg.z,
        fYCoCg.x - fYCoCg.y - fYCoCg.z,
    );
    // 执行矩阵乘法，将 YCoCg 转换为 RGB
    return fRGB;
}
fn RGBToLuma(fLinearRgb: vec3<f32>) -> f32 {
    return dot(fLinearRgb, vec3<f32>(0.2126, 0.7152, 0.0722));
}

fn RGBToPerceivedLuma(fLinearRgb: vec3<f32>) -> f32 {
    var fLuminance: f32 = RGBToLuma(fLinearRgb);

    var fPercievedLuminance: f32 = 0;
    if fLuminance <= 216.0 / 24389.0 {
        fPercievedLuminance = fLuminance * (24389.0 / 27.0);
    } else {
        fPercievedLuminance = pow(fLuminance, 1.0 / 3.0) * 116.0 - 16.0;
    }

    return fPercievedLuminance * 0.01;
}

fn ViewSpaceToMetersFactor() -> f32 {
    //return fViewSpaceToMetersFactor;
    return 1.0;
}
fn ComputeNdc(fPxPos: vec2<f32>, iSize: vec2<i32>) -> vec2<f32> {
    return fPxPos / vec2<f32>(iSize) * vec2<f32>(2.0, -2.0) + vec2<f32>(-1.0, 1.0);
}
fn DeviceToViewSpaceTransformFactors() -> vec4<f32> {
    //return cbFSR2.fDeviceToViewDepth;
    //return Broadcast4(1.0);

    let fMin: f32 = min(zFar, zNear);
    let fMax: f32 = max(zFar, zNear);
    let fQ: f32 = fMax / (fMin - fMax);
    let d: f32 = -1.0; // for clarity
    let matrix_elem_c: vec2<f32> = vec2f(fQ, -1.0 - FLT_EPSILON);
    let matrix_elem_e: vec2<f32> = vec2f(fQ * fMin, -fMin - FLT_EPSILON);

    var fDeviceToViewDepth: vec4<f32> = vec4<f32>(0, 0, 0, 0);
    fDeviceToViewDepth[0] = d * matrix_elem_c[0];
    fDeviceToViewDepth[1] = d * matrix_elem_e[0];

    // revert x and y coords
    let aspect = f32(_renderWidth) / f32(_renderHeight);
    let cameraFovAngleVertical: f32 = PI / 3;
    let cotHalfFovY = cos(0.5 * cameraFovAngleVertical) / sin(0.5 * cameraFovAngleVertical);
    let a = cotHalfFovY / aspect;
    let b = cotHalfFovY;

    fDeviceToViewDepth[2] = (1.0 / a);
    fDeviceToViewDepth[3] = (1.0 / b);

    return fDeviceToViewDepth;
}
fn GetViewSpaceDepth(fDeviceDepth: f32) -> f32 {
    // let fDeviceToViewDepth: vec4<f32> = DeviceToViewSpaceTransformFactors();
    // return (fDeviceToViewDepth[1] / (fDeviceDepth - fDeviceToViewDepth[0]));
    let zlinear = zNear * zFar / (zFar + fDeviceDepth * (zNear - zFar));
    return zlinear;
}

fn GetViewSpacePosition(iViewportPos: vec2<i32>, iViewportSize: vec2<i32>, fDeviceDepth: f32) -> vec3<f32> {
    let fDeviceToViewDepth: vec4<f32> = DeviceToViewSpaceTransformFactors();

    let Z: f32 = GetViewSpaceDepth(fDeviceDepth);

    let fNdcPos: vec2<f32> = ComputeNdc(vec2<f32>(iViewportPos), iViewportSize);
    let X: f32 = fDeviceToViewDepth[2] * fNdcPos.x * Z;
    let Y: f32 = fDeviceToViewDepth[3] * fNdcPos.y * Z;

    return vec3<f32>(X, Y, Z);
}
fn GetMaxDistanceInMeters() -> f32 {

    //return GetViewSpaceDepth(0.0) * ViewSpaceToMetersFactor();

    return GetViewSpaceDepth(1.0) * ViewSpaceToMetersFactor();
}
fn GetViewSpaceDepthInMeters(fDeviceDepth: f32) -> f32 {
    return GetViewSpaceDepth(fDeviceDepth) * ViewSpaceToMetersFactor();
}


fn ComputeHrPosFromLrPos(iPxLrPos: vec2<i32>) -> vec2<i32> {
    let fSrcJitteredPos: vec2<f32> = vec2<f32>(iPxLrPos) + 0.5 - Jitter();
    let fLrPosInHr: vec2<f32> = (fSrcJitteredPos / vec2<f32>(RenderSize())) * vec2<f32>(DisplaySize());
    let iPxHrPos: vec2<i32> = vec2<i32>(floor(fLrPosInHr));
    return (iPxHrPos);
}

// fn readColor(buffer: ptr<storage,array<vec2u>,read_write>, iPxPos: vec2<i32>) -> vec3f {
//     let idx: u32 = u32(iPxPos.y * iPxPos.x + iPxPos.x);
//     let color = vec3f(unpack2x16float(buffer[idx].x).xy, unpack2x16float(buffer[idx].y).x);
//     return color;
// }
fn ACESToneMapping(color: vec3f, adapted_lum: f32) -> vec3f {
    const A = 2.51;
    const B = 0.03;
    const C = 2.43;
    const D = 0.59;
    const E = 0.14;
    let ret = color * adapted_lum;
    return (ret * (A * ret + B)) / (ret * (C * ret + D) + E);
    // return color;
}