struct PixelBuffer {
  pixels: array<vec4<f32>>,
}
@group(0) @binding(0) var<storage, read> pixelBuffer: PixelBuffer;

struct ScreenDimension {
  resolution : vec2<f32>,
}
@group(0) @binding(1) var<uniform> screenDimension: ScreenDimension;

@fragment
fn main(
  @builtin(position) coord : vec4<f32>
)-> @location(0) vec4<f32> {
  let pixelIndex:u32 =
      u32(coord.x) + u32(coord.y) * u32(screenDimension.resolution.x);
  let pixelColor:vec4<f32> = pixelBuffer.pixels[pixelIndex];
  return vec4<f32>(pixelColor.xyz, 1.0);
}