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
    return pack2x16float(select(normalize(normal.xy), vec2f(1, 1), dot(normal.xy, normal.xy) == 0.0) * sqrt(normal.z * 0.5 + 0.5));
}

fn normalDecode(encoded: u32) -> vec3f {
    let g = unpack2x16float(encoded);
    let g2 = dot(g, g);
    var ret = vec3f(0, 0, g2 * 2 - 1);
    ret = vec3f(select(normalize(g) * sqrt(1 - ret.z * ret.z), vec2f(0), g2 == 0.0 || g2 > 1), ret.z);
    return normalize(ret);
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

// Octahedron-normal vectors
// fn normalEncode(normal: vec3f) -> u32 {
//     var p = normal / dot(vec3f(1.), abs(normal));
//     if p.z < 0 {
//         p = vec3f((1 - abs(p.yx)) * select(-1., 1., all(p.xy >= vec2f(0))), p.z);
//     }
//     return pack2x16snorm(p.xy);
// }

// fn normalDecode(encoded: u32) -> vec3f {
//     var p = unpack2x16snorm(encoded);
//     var n = vec3f(p, 1 - abs(p.x) - abs(p.y));
//     var t = max(-n.z, 0);
//     n = vec3f(n.xy + select(t, -t, all(n.xy >= vec2f(0))), n.z);
//     return normalize(n);
// }

fn luminance(color: vec3f) -> f32 {
    return dot(color, vec3f(0.2126, 0.7152, 0.0722));
}

struct PointAttri {
    pos: vec3f,
    normalShading: vec3f,
};

fn loadGBufferAttri(gBufferAttri: ptr<storage,array<vec4f>,read_write>, idx: u32) -> PointAttri {
    let attri = (*gBufferAttri)[idx];
    var ret: PointAttri;
    ret.pos = attri.xyz;
    ret.normalShading = normalDecode(bitcast<u32>(attri.w));
    return ret;
}

fn storeColor(buffer: ptr<storage,array<vec2u>,read_write>, idx: u32, color: vec3f) {
    (*buffer)[idx] = vec2u(pack2x16float(color.xy), pack2x16float(vec2f(color.z, 0)));
}

fn loadColor(buffer: ptr<storage,array<vec2u>,read_write>, idx: u32) -> vec3f {
    let color = (*buffer)[idx];
    return vec3f(unpack2x16float(color.x), unpack2x16float(color.y).x);
}

var<private> screen_size:vec2u;

fn validateCoord(coord: vec2f) -> bool {
    return all(coord >= vec2f(0)) && all(coord < vec2f(screen_size));
}

fn getCoord(coord: vec2f) -> u32 {
    return u32(coord.x) + u32(coord.y) * screen_size.x;
}
