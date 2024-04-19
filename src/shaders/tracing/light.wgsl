struct PackedLight {
    position: vec3f,
    color: u32,
    prob: f32,
    aliasId: u32,
    intensity: f32,
};
struct Lights {
    cnt: u32,
    light: array<PackedLight>,
};
struct Light {
    position: vec3f,
    color: vec3f,
    intensity: f32,
};
@group(0) @binding(12) var<storage, read> lights: Lights;
fn unpackLight(packed: PackedLight) -> Light {
    return Light(packed.position, unpack4x8unorm(packed.color).xyz, packed.intensity);
}
fn sampleLight() -> Light {
    let light = lights.light[u32(random() * f32(lights.cnt))];
    if random() < light.prob {
        return unpackLight(light);
    } else {
        return unpackLight(lights.light[light.aliasId]);
    }
    // return unpackLight(lights.light[1]);
}