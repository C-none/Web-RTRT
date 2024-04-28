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
struct padMotion {
    v: vec3f,
    pad: vec3f,
};
struct Motion {
    cnt: u32,
    motion: array<padMotion,LIGHT_COUNT>,
}
@group(0) @binding(0) var<storage,read_write> lights: Lights;
@group(0) @binding(1) var<storage,read_write> motions: Motion;

@compute @workgroup_size(32)
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3u) {
    let id = GlobalInvocationID.x;
    if id >= lights.cnt {
        return;
    }
    const velocity = 2.;
    const BoundaryMin = vec3f(-10);
    const BoundaryMax = vec3f(10);
    var pos = lights.light[id].position;
    var v = motions.motion[id].v;
    pos += v * velocity;
    if pos.x < BoundaryMin.x || pos.x > BoundaryMax.x {
        v.x = -v.x;
    }
    if pos.y < BoundaryMin.y || pos.y > BoundaryMax.y {
        v.y = -v.y;
    }
    if pos.z < BoundaryMin.z || pos.z > BoundaryMax.z {
        v.z = -v.z;
    }
    motions.motion[id].v = v;
    lights.light[id].position = pos;
}
