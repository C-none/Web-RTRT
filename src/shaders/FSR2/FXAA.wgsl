
struct BilinearSamplingData {
    iOffsets: array<vec2<i32>,4>,
    fWeights: array<f32,4>,
    iBasePos: vec2<i32>,
};

// @group(0) @binding(0) var rawColor : texture_2d<f32>;
// @group(0) @binding(1) var FXAAcolor  :texture_storage_2d<rgba16float, write> ;
@group(0) @binding(0) var<storage, read_write> rawColor : array<vec2u>;
@group(0) @binding(1) var<storage, read_write>  FXAAcolor : array<vec2u>;



override _renderWidth:i32 = 0;
override _renderHeight:i32 = 0;
const EDGE_THRESHOLD_MIN = 0.0312;
const EDGE_THRESHOLD_MAX = 0.125;
const SUBPIXEL_QUALITY = 0.75;
const ITERATIONS=12;



fn RenderSize() -> vec2<i32> {
    return vec2<i32>(_renderWidth, _renderHeight);
}

fn InverseScreenSize() -> vec2<f32> {
    return 1.0 / vec2<f32>(f32(_renderWidth), f32(_renderHeight));
}
fn IsOnScreen(pos: vec2<i32>, size: vec2<i32>) -> bool {
    return pos.x < size.x && pos.y < size.y;
}

fn RGBToLuma(fLinearRgb: vec3<f32>) -> f32 {
    return dot(fLinearRgb, vec3<f32>(0.2126, 0.7152, 0.0722));
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
fn BilinearTextureSampling(fUv: vec2<f32>) -> vec3<f32> {
    let bilinearInfo: BilinearSamplingData = GetBilinearSamplingData(fUv, RenderSize());
    var fColor: vec3<f32> = vec3<f32>(0, 0, 0);
    var fWeightSum: f32 = 0.0;
    for (var iSampleIndex: i32 = 0; iSampleIndex < 4; iSampleIndex += 1) {

        let  iOffset: vec2<i32> = bilinearInfo.iOffsets[iSampleIndex];
        let  iSamplePos: vec2<i32> = bilinearInfo.iBasePos + iOffset;

        if IsOnScreen(iSamplePos, RenderSize()) {
            let  fWeight: f32 = bilinearInfo.fWeights[iSampleIndex];

            let  fColorSample: vec3<f32> = LoadInputColor(iSamplePos);

            fColor += fColorSample * fWeight;
            fWeightSum += fWeight;
        }
    }
    return fColor / fWeightSum;
}
fn QUALITY(i: i32) -> f32 {
    return 1.0;
    
    //const QUALITY:array<f32,12>=array<f32,12>(1.5, 2.0, 2.0, 2.0, 2.0, 4.0, 8.0);
}
// fn LoadInputColor(iPxPos: vec2<i32>) -> vec3<f32> {
//     return textureLoad(rawColor, iPxPos, 0).xyz;
// }
fn LoadInputColor(iPxPos: vec2<i32>) -> vec3<f32> {
    //return textureLoad(rawColor, iPxPos, 0).xyz;
    let idx: i32 = iPxPos.y * _renderWidth + iPxPos.x;
    let data = rawColor[idx];
    let color: vec3<f32> = vec3f(unpack2x16float(data.x).xy, unpack2x16float(data.y).x);

    return color;
}
fn StoreFXAAColor(iPxPos: vec2<i32>, fcolor: vec3<f32>) {
    let idx: u32 = u32(iPxPos.y) * u32(_renderWidth) + u32(iPxPos.x);
    FXAAcolor[idx] = vec2<u32>(pack2x16float(fcolor.xy), pack2x16float(fcolor.zz));
    //textureStore(FXAAcolor, iPxPos, vec4<f32>(fcolor,1));
}

fn fxaa(iPxPos: vec2<i32>) {
    var colorCenter: vec3<f32> = LoadInputColor(iPxPos);
    let inverseScreenSize = InverseScreenSize();
    let fCenterUV: vec2<f32> = (vec2<f32>(iPxPos) + 0.5) / vec2<f32>(RenderSize());
  // Luma at the current fragment
    var lumaCenter: f32 = RGBToLuma(colorCenter);

  // Luma at the four direct neighbours of the current fragment.
    var lumaDown: f32 = RGBToLuma(LoadInputColor(iPxPos + vec2<i32>(0, -1)).rgb);
    var lumaUp: f32 = RGBToLuma(LoadInputColor(iPxPos + vec2<i32>(0, 1)).rgb);
    var lumaLeft: f32 = RGBToLuma(LoadInputColor(iPxPos + vec2<i32>(-1, 0)).rgb);
    var lumaRight: f32 = RGBToLuma(LoadInputColor(iPxPos + vec2<i32>(1, 0)).rgb);

  // Find the maximum and minimum luma around the current fragment.
    var lumaMin: f32 = min(lumaCenter, min(min(lumaDown, lumaUp), min(lumaLeft, lumaRight)));
    var lumaMax: f32 = max(lumaCenter, max(max(lumaDown, lumaUp), max(lumaLeft, lumaRight)));

  // Compute the delta.
    var lumaRange: f32 = lumaMax - lumaMin;

  // If the luma variation is lower that a threshold (or if we are in a really dark area), we are not on an edge, don't perform any AA.
    if lumaRange < max(EDGE_THRESHOLD_MIN, lumaMax * EDGE_THRESHOLD_MAX) {
        StoreFXAAColor(iPxPos, colorCenter);
        //StoreFXAAColor(iPxPos, vec3<f32>(0, 0, 0));
        return;
    }
  ///////////////////
  // Query the 4 remaining corners lumas.
    var lumaDownLeft: f32 = RGBToLuma(LoadInputColor(iPxPos + vec2<i32>(-1, -1)).rgb);
    var lumaUpRight: f32 = RGBToLuma(LoadInputColor(iPxPos + vec2<i32>(1, 1)).rgb);
    var lumaUpLeft: f32 = RGBToLuma(LoadInputColor(iPxPos + vec2<i32>(-1, 1)).rgb);
    var lumaDownRight: f32 = RGBToLuma(LoadInputColor(iPxPos + vec2<i32>(1, -1)).rgb);

  // Combine the four edges lumas (using intermediary variables for future computations with the same values).
    var lumaDownUp: f32 = lumaDown + lumaUp;
    var lumaLeftRight: f32 = lumaLeft + lumaRight;

  // Same for corners
    var lumaLeftCorners: f32 = lumaDownLeft + lumaUpLeft;
    var lumaDownCorners: f32 = lumaDownLeft + lumaDownRight;
    var lumaRightCorners: f32 = lumaDownRight + lumaUpRight;
    var lumaUpCorners: f32 = lumaUpRight + lumaUpLeft;

  // Compute an estimation of the gradient along the horizontal and vertical axis.
    var edgeHorizontal: f32 = abs(-2.0 * lumaLeft + lumaLeftCorners) + abs(-2.0 * lumaCenter + lumaDownUp) * 2.0 + abs(-2.0 * lumaRight + lumaRightCorners);
    var edgeVertical: f32 = abs(-2.0 * lumaUp + lumaUpCorners) + abs(-2.0 * lumaCenter + lumaLeftRight) * 2.0 + abs(-2.0 * lumaDown + lumaDownCorners);

  // Is the local edge horizontal or vertical ?
    var isHorizontal: bool = (edgeHorizontal >= edgeVertical);

  //////////////////
  // Select the two neighboring texels lumas in the opposite direction to the local edge.
    var luma1: f32 = lumaLeft;
    if isHorizontal {
        luma1 = lumaDown;
    }
    var luma2: f32 = lumaRight;
    if isHorizontal {
        luma1 = lumaUp;
    }
  // Compute gradients in this direction.
    var gradient1: f32 = luma1 - lumaCenter;
    var gradient2: f32 = luma2 - lumaCenter;

  // Which direction is the steepest ?
    var is1Steepest: bool = abs(gradient1) >= abs(gradient2);

  // Gradient in the corresponding direction, normalized.
    var gradientScaled: f32 = 0.25 * max(abs(gradient1), abs(gradient2));



  // Choose the step size (one pixel) according to the edge direction.
    var stepLength: f32 = inverseScreenSize.x;// inverseScreenSize (1.0/width, 1.0/height);
    if isHorizontal {
        stepLength = inverseScreenSize.y;
    }
  // Average luma in the correct direction.
    var lumaLocalAverage: f32 = 0.0;

    if is1Steepest {
      // Switch the direction
        stepLength = - stepLength;
        lumaLocalAverage = 0.5 * (luma1 + lumaCenter);
    } else {
        lumaLocalAverage = 0.5 * (luma2 + lumaCenter);
    }

  // Shift UV in the correct direction by half a pixel.
    var currentUv: vec2<f32> = fCenterUV;
    if isHorizontal {
        currentUv.y += stepLength * 0.5;
    } else {
        currentUv.x += stepLength * 0.5;
    }


  // Compute offset (for each iteration step) in the right direction.
    var offset: vec2<f32> = vec2<f32>(0.0, inverseScreenSize.y);
    if isHorizontal {
        offset = vec2<f32>(inverseScreenSize.x, 0.0);
    }
  // Compute UVs to explore on each side of the edge, orthogonally. The QUALITY allows us to step faster.
    var uv1: vec2<f32> = currentUv - offset;
    var uv2: vec2<f32> = currentUv + offset;

  // Read the lumas at both current extremities of the exploration segment, and compute the delta wrt to the local average luma.
    var lumaEnd1: f32 = RGBToLuma(BilinearTextureSampling(uv1));
    var lumaEnd2: f32 = RGBToLuma(BilinearTextureSampling(uv2));
    lumaEnd1 -= lumaLocalAverage;
    lumaEnd2 -= lumaLocalAverage;

  // If the luma deltas at the current extremities are larger than the local gradient, we have reached the side of the edge.
    var reached1: bool = abs(lumaEnd1) >= gradientScaled;
    var reached2: bool = abs(lumaEnd2) >= gradientScaled;
    var reachedBoth: bool = reached1 && reached2;

  // If the side is not reached, we continue to explore in this direction.
    if !reached1 {
        uv1 -= offset;
    }
    if !reached2 {
        uv2 += offset;
    }


  /////////////
  // If both sides have not been reached, continue to explore.
    if !reachedBoth {
    // We keep iterating until both extremities of the edge are reached,
    // or until the maximum number of iterations (12) is reached. To speed things up, 
    //we start stepping by an increasing amount of pixels QUALITY(i) 
    //after the fifth iteration : 1.5, 2.0, 2.0, 2.0, 2.0, 4.0, 8.0.
        for (var i = 2; i < ITERATIONS; i += 1) {
        // If needed, read luma in 1st direction, compute delta.
            if !reached1 {
                lumaEnd1 = RGBToLuma(BilinearTextureSampling(uv1));
                lumaEnd1 = lumaEnd1 - lumaLocalAverage;
            }
        // If needed, read luma in opposite direction, compute delta.
            if !reached2 {
                lumaEnd2 = RGBToLuma(BilinearTextureSampling(uv2));
                lumaEnd2 = lumaEnd2 - lumaLocalAverage;
            }
        // If the luma deltas at the current extremities is larger than the local gradient, we have reached the side of the edge.
            reached1 = abs(lumaEnd1) >= gradientScaled;
            reached2 = abs(lumaEnd2) >= gradientScaled;
            reachedBoth = reached1 && reached2;

        // If the side is not reached, we continue to explore in this direction, with a variable quality.
            if !reached1 {
                uv1 -= offset * QUALITY(i);
            }
            if !reached2 {
                uv2 += offset * QUALITY(i);
            }

        // If both sides have been reached, stop the exploration.
            if reachedBoth { break;}
        }
    }   


  // Compute the distances to each extremity of the edge.


    var distance1: f32 = (fCenterUV.y / - uv1.y);
    if isHorizontal {
        distance1 = (fCenterUV.x - uv1.x);
    }

    var distance2: f32 = (uv2.y - fCenterUV.y);
    if isHorizontal {
        distance1 = (uv2.x - fCenterUV.x) ;
    }
  // In which direction is the extremity of the edge closer ?
    var isDirection1: bool = distance1 < distance2;
    var distanceFinal: f32 = min(distance1, distance2);

  // Length of the edge.
    var edgeThickness: f32 = (distance1 + distance2);

  // UV offset: read in the direction of the closest side of the edge.
    var pixelOffset: f32 = - distanceFinal / edgeThickness + 0.5;

  // Is the luma at center smaller than the local average ?
    var isLumaCenterSmaller: bool = lumaCenter < lumaLocalAverage;

  // If the luma at center is smaller than at its neighbour, the delta luma at each end should be positive (same variation).
  // (in the direction of the closer side of the edge.)
    var correctVariation: bool = (lumaEnd2 < 0.0) != isLumaCenterSmaller;
    if isDirection1 {
        correctVariation = (lumaEnd1 < 0.0) != isLumaCenterSmaller;
    }


  // If the luma variation is incorrect, do not offset.
    var finalOffset: f32 = 0.0;
    if correctVariation {
        finalOffset = pixelOffset;
    }



  // Sub-pixel shifting
  // Full weighted average of the luma over the 3x3 neighborhood.
    var lumaAverage: f32 = (1.0 / 12.0) * (2.0 * (lumaDownUp + lumaLeftRight) + lumaLeftCorners + lumaRightCorners);
  // Ratio of the delta between the global average and the center luma, over the luma range in the 3x3 neighborhood.
    var subPixelOffset1: f32 = clamp(abs(lumaAverage - lumaCenter) / lumaRange, 0.0, 1.0);
    var subPixelOffset2: f32 = (-2.0 * subPixelOffset1 + 3.0) * subPixelOffset1 * subPixelOffset1;
  // Compute a sub-pixel offset based on this delta.
    var subPixelOffsetFinal: f32 = subPixelOffset2 * subPixelOffset2 * SUBPIXEL_QUALITY;

  // Pick the biggest of the two offsets.
    finalOffset = max(finalOffset, subPixelOffsetFinal);





  // Compute the final UV coordinates.
    var finalUv: vec2<f32> = fCenterUV;
    if isHorizontal {
        finalUv.y += finalOffset * stepLength;
    } else {
        finalUv.x += finalOffset * stepLength;
    }

  // Read the color at the new UV coordinates, and use it.
    var finalColor: vec3<f32> = BilinearTextureSampling(finalUv);

    StoreFXAAColor(iPxPos, finalColor);
    //StoreFXAAColor(iPxPos, vec3<f32>(0, 0, 0));
}


@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3<u32>) {
    let screen_size: vec2<i32> = RenderSize();
    let screen_pos: vec2<i32> = vec2<i32>(GlobalInvocationID.xy);
    if !IsOnScreen(screen_pos, screen_size) {
        return;
    }
    fxaa(screen_pos);
} 