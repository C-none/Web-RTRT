// Lambert Azimuthal Equal-Area projection
// fn normalEncode(normal: vec3f) -> u32 {
//     let f = sqrt(2. * normal.z + 2.);
//     let XY = normal.xy / f;
//     return pack2x16snorm(XY);
// }

// fn normalDecode(encoded: u32) -> vec3f {
//     let fenc = unpack2x16snorm(encoded) * 2;
//     let f = dot(fenc, fenc);
//     let g = sqrt(1 - f / 4);
//     return vec3f(fenc * g, 1 - f / 2);
// }

// Cry Engine 3 Normal Encoding
fn normalEncode(normal: vec3f) -> u32 {
    return pack2x16float(select(normalize(normal.xy), vec2f(1, 0), dot(normal.xy, normal.xy) == 0.0) * sqrt(normal.z * 0.5 + 0.5));
}

fn normalDecode(encoded: u32) -> vec3f {
    let g = unpack2x16float(encoded);
    var ret = vec3f(0, 0, dot(g, g) * 2 - 1);
    ret = vec3f(select(normalize(g) * sqrt(1 - ret.z * ret.z), vec2f(0), dot(g, g) == 0.0), ret.z);
    return ret;
}

// Stereographic Projection
// fn normalEncode(normal: vec3f) -> u32 {
//     let XY = normal.xy / (1.0 - normal.z);
//     return pack2x16float(XY);
// }
// fn normalDecode(encoded: u32) -> vec3f {
//     let XY = unpack2x16float(encoded);
//     let denom = 1.0 + dot(XY, XY);
//     return vec3f(2.0 * XY, denom - 2) / denom;
// }