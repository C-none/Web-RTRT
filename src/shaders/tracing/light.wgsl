struct PackedLight {
    position: vec3f,
    color: u32,
    prob: f32,
    aliasId: u32,
    intensity: f32,
};
struct Lights {
    cnt: u32,
    powerSum: f32,
    light: array<PackedLight,LIGHT_COUNT>,
};
struct Light {
    position: vec3f,
    id: u32,
    color: vec3f,
    intensity: f32,
};
@group(3) @binding(0) var<uniform> lights: Lights;

fn unpackLight(packed: PackedLight, id: u32) -> Light {
    return Light(packed.position, id, unpack4x8unorm(packed.color).xyz, packed.intensity);
}

fn getLight(id: u32) -> Light {
    return unpackLight(lights.light[id], id);
}

fn sampleLightProb(light: Light) -> f32 {
    // possibility of sampling alias table
    return light.intensity / lights.powerSum;
}

fn sampleLight() -> Light {
    var id = u32(random() * f32(lights.cnt));
    let light = lights.light[id];
    if random() < light.prob {
        return unpackLight(light, id);
    } else {
        return unpackLight(lights.light[light.aliasId], light.aliasId);
    }
    // return unpackLight(lights.light[1]);
}