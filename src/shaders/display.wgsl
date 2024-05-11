@group(0) @binding(0) var currentDisplay : texture_storage_2d<displayFormat, write>;
@group(0) @binding(1) var previouDisplay: texture_2d<f32>;
@group(0) @binding(2) var samp : sampler;
@group(0) @binding(3) var motionVec : texture_2d<u32>;
@group(0) @binding(4) var depthBuffer : texture_depth_2d;
@group(0) @binding(5) var<storage, read_write> currentFrame : array<vec2u>;
@group(0) @binding(6) var<storage, read_write> previousFrame : array<vec2u>;

override zNear: f32 = 0.01;
override zFar: f32 = 50.0;

fn ACESToneMapping(color: vec3f, adapted_lum: f32) -> vec3f {
    const A = 2.51;
    const B = 0.03;
    const C = 2.43;
    const D = 0.59;
    const E = 0.14;
    let ret = color * adapted_lum;
    // return (ret * (A * ret + B)) / (ret * (C * ret + D) + E);
    return color;
}

fn readColor(buffer: ptr<storage,array<vec2u>,read_write>, idx: u32) -> vec3f {
    let color = vec3f(unpack2x16float(buffer[idx].x).xy, unpack2x16float(buffer[idx].y).x);
    return color;
}

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3u) {
    let screen_size: vec2u = textureDimensions(currentDisplay);
    let screen_pos: vec2u = vec2u(GlobalInvocationID.xy);
    if screen_pos.x >= screen_size.x || screen_pos.y >= screen_size.y {
        return;
    }
    let origin_size: vec2u = textureDimensions(motionVec);
    let scale_ratio: f32 = f32(screen_size.x) / f32(origin_size.x);
    let origin_pos: vec2u = vec2u(vec2f(screen_pos) / scale_ratio);
    let origin_pos_idx: u32 = origin_pos.y * origin_size.x + origin_pos.x;

    // linear depth
    // let depth = (textureSampleLevel(depthBuffer, samp, vec2f(origin_pos) / vec2f(origin_size), 0) + 1.0) / 2.0;
    let depth = (textureLoad(depthBuffer, origin_pos, 0) + 1.0) / 2.0;
    let zlinear = zNear * zFar / (zFar + depth * (zNear - zFar));
    // textureStore(currentDisplay, screen_pos, vec4f(vec3f(textureLoad(depthBuffer, origin_pos, 0)), 1.0));

    // [0, width] x [0, height] range of motion vector
    // .------> X
    // |
    // v
    // Y
    let motionVec: vec2f = unpack2x16float(textureLoad(motionVec, origin_pos, 0).r) * vec2f(origin_size);
    // textureStore(currentDisplay, screen_pos, vec4f(motionVec.xy * 0.005 + 0.5, 0.0, 1.0));

    // raytracing depth
    var color: vec3f = readColor(&currentFrame, origin_pos_idx);
    // if screen_pos.x < screen_size.x / 2 {
    // } else {
    //     color = textureSampleLevel(previousFrame, samp, vec2f(origin_pos) / vec2f(origin_size), 0);
    // }
    textureStore(currentDisplay, screen_pos, vec4f(ACESToneMapping(color, 1), 1.0));
}