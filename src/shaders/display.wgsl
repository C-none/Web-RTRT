@group(0) @binding(0) var input : texture_2d<u32>;
@group(0) @binding(1) var output : texture_storage_2d<displayFormat, write>;

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3<u32>) {
    let screen_size: vec2<u32> = textureDimensions(output);
    let screen_pos: vec2<u32> = vec2<u32>(GlobalInvocationID.xy);
    if screen_pos.x >= screen_size.x || screen_pos.y >= screen_size.y {
        return;
    }
    // let store_pos = vec2<u32>(screen_pos.x, screen_size.y - screen_pos.y - 1);
    // let depth = (textureLoad(input, screen_pos, 0) + 1.0) / 2.0;
    // let zlinear = zNear * zFar / (zFar + depth * (zNear - zFar));

    var color = textureLoad(input, screen_pos, 0);
    textureStore(output, screen_pos, unpack4x8unorm(color.w));
    // let barycentric = unpack2x16float(color.x);
    // let motionVec = unpack2x16float(color.y);

    // textureStore(output, screen_pos, vec4<f32>(motionVec.xy / vec2<f32>(screen_size.xy) * 25.0 + 0.5, 0.0, 1.0));

    // if color.y <= 0.0001 {
    //     textureStore(output, screen_pos, vec4<f32>(0.1, 0.3, 0.1, 1.0));
    //     return;
    // }
    // let degree = i32(color.x * 256. * 2.);
    // let r = max(0, (degree - 256));
    // let g = max(0, 256 - abs(256 - degree));
    // let b = max(0, 256 - degree);

    // textureStore(output, screen_pos, vec4<f32>(f32(r) / 255.0, f32(g) / 255.0, f32(b) / 255.0, 1.0));
}