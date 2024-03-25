@group(0) @binding(0) var input : texture_storage_2d<rgba16float, read>;
@group(0) @binding(1) var output : texture_storage_2d<displayFormat, write>;

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3<u32>) {
    let screen_size: vec2<u32> = textureDimensions(output);
    let screen_pos: vec2<u32> = GlobalInvocationID.xy;
    if GlobalInvocationID.x >= screen_size.x || GlobalInvocationID.y >= screen_size.y {
        return;
    }
    // textureStore(output, screen_pos, textureLoad(input, screen_pos));
    let color = textureLoad(input, screen_pos);
    if color.x <= 0.01 {
        textureStore(output, screen_pos, vec4<f32>(0.0, 0.0, 0.0, 1.0));
        return;
    }
    let degree = i32(color.x * 256. * 2.);
    let r = max(0, (degree - 256));
    let g = max(0, 256 - abs(256 - degree));
    let b = max(0, 256 - degree);
    textureStore(output, screen_pos, vec4<f32>(f32(r) / 255.0, f32(g) / 255.0, f32(b) / 255.0, 1.0));
}