@group(0) @binding(0) var output : texture_storage_2d<displayFormat, write>;
@group(0) @binding(1) var samp : sampler;
@group(0) @binding(2) var vBuffer : texture_2d<u32>;
@group(0) @binding(3) var depthBuffer : texture_depth_2d;
@group(0) @binding(4) var currentFrame : texture_2d<f32>;
@group(0) @binding(5) var previousFrame : texture_2d<f32>;


@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3<u32>) {
    let screen_size: vec2<u32> = textureDimensions(output);
    let screen_pos: vec2<u32> = vec2<u32>(GlobalInvocationID.xy);
    if screen_pos.x >= screen_size.x || screen_pos.y >= screen_size.y {
        return;
    }
    let origin_size: vec2<u32> = textureDimensions(currentFrame);
    let scale_ratio: f32 = f32(screen_size.x) / f32(origin_size.x);
    let origin_pos: vec2<u32> = vec2<u32>(vec2<f32>(screen_pos) / scale_ratio);

    // linear depth
    const zNear: f32 = 0.01;
    const zFar: f32 = 50.0;
    let depth = (textureSampleLevel(depthBuffer, samp, vec2<f32>(origin_pos), 0) + 1.0) / 2.0;
    let zlinear = zNear * zFar / (zFar + depth * (zNear - zFar));
    // textureStore(output, screen_pos, vec4<f32>(vec3<f32>(zlinear / 3000.0), 1.0));
    // vbuffer 
    var visibility: vec4<u32> = textureLoad(vBuffer, origin_pos, 0);
    let betagamma = unpack2x16float(visibility.x);
    let barycentric = vec3<f32>(1.0 - betagamma.x - betagamma.y, betagamma.x, betagamma.y);
    // textureStore(output, screen_pos, vec4<f32>(barycentric, 1.0));

    // [0, width] x [0, height] range of motion vector
    // .------> X
    // |
    // v
    // Y
    let motionVec = unpack2x16float(visibility.y);
    // textureStore(output, screen_pos, vec4<f32>(motionVec.xy * 0.05, 0.0, 1.0));
    let trianlgeID = visibility.z;
    // textureStore(output, screen_pos, vec4<f32>(vec3<f32>(f32(visibility.z) / 3.), 1.));
    let albedo = unpack4x8unorm(visibility.w);
    // textureStore(output, screen_pos, vec4<f32>(albedo.rgb, 1.0));
    // textureStore(output, screen_pos, vec4<f32>(f32(visibility.w) / 10., 0., 0., 1.0));

    // raytracing depth
    var color = vec4<f32>(0.0, 0.0, 0.0, 1.0);
    if screen_pos.x < screen_size.x / 2 {
        color = textureLoad(currentFrame, origin_pos, 0);
    } else {
        color = textureLoad(previousFrame, origin_pos, 0);
    }
    textureStore(output, screen_pos, color);
}