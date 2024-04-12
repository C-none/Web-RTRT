@group(0) @binding(0) var output : texture_storage_2d<displayFormat, write>;
@group(0) @binding(1) var samp : sampler;
@group(0) @binding(2) var vBuffer : texture_2d<u32>;
@group(0) @binding(3) var depthBuffer : texture_depth_2d;
@group(0) @binding(4) var currentFrame : texture_2d<f32>;
@group(0) @binding(5) var previousFrame : texture_2d<f32>;

override zNear: f32 = 0.01;
override zFar: f32 = 50.0;

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3u) {
    let screen_size: vec2u = textureDimensions(output);
    let screen_pos: vec2u = vec2u(GlobalInvocationID.xy);
    if screen_pos.x >= screen_size.x || screen_pos.y >= screen_size.y {
        return;
    }
    let origin_size: vec2u = textureDimensions(currentFrame);
    let scale_ratio: f32 = f32(screen_size.x) / f32(origin_size.x);
    let origin_pos: vec2u = vec2u(vec2f(screen_pos) / scale_ratio);

    // linear depth
    let depth = (textureSampleLevel(depthBuffer, samp, vec2f(origin_pos) / vec2f(origin_size), 0) + 1.0) / 2.0;
    // let depth = (textureLoad(depthBuffer, origin_pos, 0) + 1.0) / 2.0;
    let zlinear = zNear * zFar / (zFar + depth * (zNear - zFar));
    // textureStore(output, screen_pos, vec4f(vec3f(zlinear / 20.0), 1.0));

    // vbuffer 
    var visibility: vec4u = textureLoad(vBuffer, origin_pos, 0);
    let betagamma = bitcast<vec2f>(visibility.xy);
    let barycentric = vec3f(1.0 - betagamma.x - betagamma.y, betagamma.x, betagamma.y);
    // textureStore(output, screen_pos, vec4f(barycentric, 1.0));

    // [0, width] x [0, height] range of motion vector
    // .------> X
    // |
    // v
    // Y
    let motionVec: vec2f = unpack2x16float(visibility.w);
    // textureStore(output, screen_pos, vec4f(motionVec.xy * 0.05+0.5, 0.0, 1.0));
    let trianlgeID = visibility.z;
    // textureStore(output, screen_pos, vec4f(vec3f(f32(visibility.z) / 3.), 1.));

    // raytracing depth
    var color = vec4f(0.0, 0.0, 0.0, 1.0);
    // if screen_pos.x < screen_size.x / 2 {
    color = textureLoad(currentFrame, origin_pos, 0);
    // } else {
    //     color = textureSampleLevel(previousFrame, samp, vec2f(origin_pos) / vec2f(origin_size), 0);
    // }
    textureStore(output, screen_pos, color);
}