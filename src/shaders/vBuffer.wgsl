struct Camera {
    world: mat4x4<f32>,
    projInv: mat4x4<f32>,
    VPMat: mat4x4<f32>,
    lastVPMat: mat4x4<f32>,
};
struct Visibility {
    baryCoord: vec2<f32>,
    motionVec: vec2<f32>,
    primId: u32,
    albedo: vec4<f32>,
}

@group(0) @binding(0) var<uniform> camera: Camera;
@group(0) @binding(1) var albedo: texture_2d_array<f32>;
@group(0) @binding(2) var sample: sampler;

struct InterStage {
    @builtin(position) pos: vec4<f32>,
    @location(0) BaryCoord: vec4<f32>,
    // @location(1) uv: vec2<f32>,
    // @location(2) @interpolate(flat) textureId: u32,
    @location(3) @interpolate(flat) primId: u32,
    @location(4) lastPos: vec4<f32>,
};

@vertex
fn vs(
    @builtin(vertex_index) index: u32,
    @location(0) pos: vec4<f32>,
    // @location(1) uv: vec2<f32>,
    // @location(2) textureId: u32,
) -> InterStage {
    let BaryCoords: array<vec4<f32>,3> = array<vec4<f32>,3>(
        vec4<f32>(1.0, 0.0, 0.0, 1.0),
        vec4<f32>(0.0, 1.0, 0.0, 1.0),
        vec4<f32>(0.0, 0.0, 1.0, 1.0)
    );
    let vtxpos = camera.VPMat * pos;
    let lastvtxpos = camera.lastVPMat * pos;
    return InterStage(
        vtxpos,
        BaryCoords[index % 3],
        // uv,
        // textureId,
        index / 3,
        lastvtxpos,
    );
}

override width: f32 ;          
override height: f32 ; 

@fragment
fn fs(
    stage: InterStage,
) -> @location(0) vec4<u32> {

    _ = height;
    _ = width;
    var color = vec4<f32>(1.0);
    // var sampleId = stage.textureId;
    // color = textureSampleLevel(albedo, sample, stage.uv, sampleId, 0.0);
    // color = textureSample(albedo, sample, stage.uv, sampleId); // mipmap
    // if color.a < 0.5 {
    //         discard;
    // }

    let lastScreenPos = vec2<f32>(stage.lastPos.x / stage.lastPos.w, - stage.lastPos.y / stage.lastPos.w) / 2.0 + 0.5;
    let currentScreenPos = vec2<f32>(stage.pos.x / width, stage.pos.y / height);
    let motionVec = currentScreenPos - lastScreenPos;
    var visibility = Visibility(
        stage.BaryCoord.yz,
        vec2<f32>(motionVec.x * width, motionVec.y * height), // motionVec
        stage.primId,
        color,
    );

    return vec4<u32>(bitcast<vec2<u32>>(visibility.baryCoord), visibility.primId, pack2x16float(visibility.motionVec));
}
