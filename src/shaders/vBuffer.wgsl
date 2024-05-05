struct Camera {
    world: mat4x4f,
    projInv: mat4x4f,
    VPMat: mat4x4f,
    lastVPMat: mat4x4f,
};
struct Visibility {
    baryCoord: vec2f,
    motionVec: vec2f,
    primId: u32,
    // albedo: vec4f,
}

@group(0) @binding(0) var<uniform> camera: Camera;
@group(0) @binding(1) var albedo: texture_2d_array<f32>;
@group(0) @binding(2) var sample: sampler;

struct InterStage {
    @builtin(position) pos: vec4f,
    @location(0) BaryCoord: vec4f,
    // @location(1) uv: vec2f,
    // @location(2) @interpolate(flat) textureId: u32,
    @location(3) @interpolate(flat) primId: u32,
    @location(4) lastPos: vec4f,
};

@vertex
fn vs(
    @builtin(vertex_index) index: u32,
    @location(0) pos: vec4f,
    // @location(1) uv: vec2f,
    // @location(2) textureId: u32,
) -> InterStage {
    let BaryCoords: array<vec4f,3> = array<vec4f,3>(
        vec4f(1.0, 0.0, 0.0, 1.0),
        vec4f(0.0, 1.0, 0.0, 1.0),
        vec4f(0.0, 0.0, 1.0, 1.0)
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

override width: u32 ;          
override height: u32 ; 

struct VBufferOut {
    @location(0) vBuffer: vec4u,
    @location(1) motionVec: u32,
};


@fragment
fn fs(
    stage: InterStage,
) -> VBufferOut {

    _ = height;
    _ = width;
    // var color = vec4f(1.0);
    // var sampleId = stage.textureId;
    // color = textureSampleLevel(albedo, sample, stage.uv, sampleId, 0.0);
    // color = textureSample(albedo, sample, stage.uv, sampleId); // mipmap
    // if color.a < 0.5 {
    //         discard;
    // }

    let lastScreenPos = vec2f(stage.lastPos.x / stage.lastPos.w, - stage.lastPos.y / stage.lastPos.w) / 2.0 + 0.5;
    let currentScreenPos = vec2f(stage.pos.x / f32(width), stage.pos.y / f32(height));
    let motionVec = currentScreenPos - lastScreenPos;
    var visibility = Visibility(
        stage.BaryCoord.yz,
        vec2f(motionVec.x, motionVec.y), // motionVec
        stage.primId,
        // color,
    );

    return VBufferOut(
        vec4u(bitcast<vec2u>(visibility.baryCoord), visibility.primId, pack2x16snorm(visibility.motionVec)),
        pack2x16snorm(visibility.motionVec)
    );
} 
