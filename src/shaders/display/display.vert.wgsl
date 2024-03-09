@vertex
fn main(@builtin(vertex_index) VertexIndex : u32) -> @builtin(position) vec4<f32> {
  let pos:vec2<f32> = vec2<f32>(f32((VertexIndex << 1u) & 2u), f32(VertexIndex & 2u));
  return vec4<f32>(pos * 2.0 - 1.0, 0.0, 1.0);
}