(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))r(n);new MutationObserver(n=>{for(const i of n)if(i.type==="childList")for(const s of i.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&r(s)}).observe(document,{childList:!0,subtree:!0});function t(n){const i={};return n.integrity&&(i.integrity=n.integrity),n.referrerPolicy&&(i.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?i.credentials="include":n.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function r(n){if(n.ep)return;n.ep=!0;const i=t(n);fetch(n.href,i)}})();class $s{canvas;adapter;device;context;format;upscaleRatio=2;async init(e){if(this.canvas=e,!navigator.gpu)throw new Error("Not Support WebGPU");let t=await navigator.gpu.requestAdapter({powerPreference:"high-performance"});if(!t)throw new Error("No Adapter Found");this.adapter=t;const r=this.adapter.features.has("bgra8unorm-storage");let n=await this.adapter.requestDevice({requiredLimits:{maxBufferSize:this.adapter.limits.maxBufferSize,maxStorageBufferBindingSize:this.adapter.limits.maxStorageBufferBindingSize,maxStorageBuffersPerShaderStage:this.adapter.limits.maxStorageBuffersPerShaderStage},requiredFeatures:r?["bgra8unorm-storage"]:[]});if(!n)throw new Error("No Device Found");this.device=n;let i=this.canvas.getContext("webgpu");if(!i)throw new Error("No GPUContext Found");this.context=i,this.format=r?navigator.gpu.getPreferredCanvasFormat():"rgba8unorm";const s=window.devicePixelRatio||1;return e.width=e.clientWidth*s,e.height=e.clientHeight*s,this.context.configure({device:this.device,format:this.format,alphaMode:"opaque",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.COPY_SRC}),this}}const Qs=`@binding(0) @group(0) var<storage, read> mvpMatrix : array<mat4x4<f32>>;\r
\r
struct VertexOutput {\r
    @builtin(position) Position : vec4<f32>,\r
    @location(0) fragUV : vec2<f32>,\r
    @location(1) fragPosition: vec4<f32>\r
\r
};\r
\r
@vertex\r
fn main(\r
    @builtin(instance_index) index : u32,\r
    @location(0) position : vec4<f32>,\r
    @location(1) uv : vec2<f32>\r
) -> VertexOutput {\r
    var output : VertexOutput;\r
    output.Position = mvpMatrix[index] * position;\r
    output.fragUV = uv;\r
    output.fragPosition = 0.5 * (position + vec4<f32>(1.0, 1.0, 1.0, 1.0));\r
    return output;\r
}\r
`,eo=`@fragment\r
fn main(\r
    @location(0) fragUV: vec2<f32>,\r
    @location(1) fragPosition: vec4<f32>\r
) -> @location(0) vec4<f32> {\r
    return fragPosition;\r
}`,to=`@group(0) @binding(0) var<storage, read> input : array<f32, 7>;\r
@group(0) @binding(1) var<storage, read_write> velocity : array<vec4<f32>>;\r
@group(0) @binding(2) var<storage, read_write> modelView : array<mat4x4<f32>>;\r
@group(0) @binding(3) var<uniform> projection : mat4x4<f32>;\r
@group(0) @binding(4) var<storage, read_write> mvp : array<mat4x4<f32>>;\r
\r
override size = 1;\r
\r
@compute @workgroup_size(size)\r
fn main(\r
    @builtin(global_invocation_id) GlobalInvocationID: vec3<u32>\r
) {\r
    var index = GlobalInvocationID.x;\r
\r
    if index >= u32(input[0]) {\r
        return;\r
    }\r
\r
    //if(index >= u32(input[0]))\r
    //{\r
    //return;\r
    //}\r
    var xMin = input[1];\r
    var xMax = input[2];\r
    var yMin = input[3];\r
    var yMax = input[4];\r
    var zMin = input[5];\r
    var zMax = input[6];\r
    var pos = modelView[index][3];\r
    var vel = velocity[index];\r
    //change x\r
    pos.x += vel.x;\r
    if pos.x < xMin {\r
        pos.x = xMin;\r
        vel.x = -vel.x;\r
    } else if pos.x > xMax {\r
        pos.x = xMax;\r
        vel.x = -vel.x;\r
    }\r
    //change y\r
    pos.y += vel.y;\r
    if pos.y < yMin {\r
        pos.y = yMin;\r
        vel.y = -vel.y;\r
    } else if pos.y > yMax {\r
        pos.y = yMax;\r
        vel.y = -vel.y;\r
    }\r
    //change z\r
    pos.z += vel.z;\r
    if pos.z < zMin {\r
        pos.z = zMin;\r
        vel.z = -vel.z;\r
    } else if pos.z > zMax {\r
        pos.z = zMax;\r
        vel.z = -vel.z;\r
    }\r
    //update velocity\r
    velocity[index] = vel;\r
    //update position in modelView matrix\r
    modelView[index][3] = pos;\r
    //update mvp\r
    mvp[index] = projection * modelView[index];\r
}\r
`,ro=`struct Camera {\r
    world: mat4x4f,\r
    projInv: mat4x4f,\r
    VPMat: mat4x4f,\r
    lastVPMat: mat4x4f,\r
};\r
struct Visibility {\r
    baryCoord: vec2f,\r
    motionVec: vec2f,\r
    primId: u32,\r
    // albedo: vec4f,\r
}\r
\r
@group(0) @binding(0) var<uniform> camera: Camera;\r
@group(0) @binding(1) var albedo: texture_2d_array<f32>;\r
@group(0) @binding(2) var sample: sampler;\r
\r
struct InterStage {\r
    @builtin(position) pos: vec4f,\r
    @location(0) BaryCoord: vec4f,\r
    // @location(1) uv: vec2f,\r
    // @location(2) @interpolate(flat) textureId: u32,\r
    @location(3) @interpolate(flat) primId: u32,\r
    @location(4) lastPos: vec4f,\r
};\r
\r
@vertex\r
fn vs(\r
    @builtin(vertex_index) index: u32,\r
    @location(0) pos: vec4f,\r
    // @location(1) uv: vec2f,\r
    // @location(2) textureId: u32,\r
) -> InterStage {\r
    let BaryCoords: array<vec4f,3> = array<vec4f,3>(\r
        vec4f(1.0, 0.0, 0.0, 1.0),\r
        vec4f(0.0, 1.0, 0.0, 1.0),\r
        vec4f(0.0, 0.0, 1.0, 1.0)\r
    );\r
    let vtxpos = camera.VPMat * pos;\r
    let lastvtxpos = camera.lastVPMat * pos;\r
    return InterStage(\r
        vtxpos,\r
        BaryCoords[index % 3],\r
        // uv,\r
        // textureId,\r
        index / 3,\r
        lastvtxpos,\r
    );\r
}\r
\r
override width: u32 ;          \r
override height: u32 ; \r
\r
@fragment\r
fn fs(\r
    stage: InterStage,\r
) -> @location(0) vec4u {\r
\r
    _ = height;\r
    _ = width;\r
    // var color = vec4f(1.0);\r
    // var sampleId = stage.textureId;\r
    // color = textureSampleLevel(albedo, sample, stage.uv, sampleId, 0.0);\r
    // color = textureSample(albedo, sample, stage.uv, sampleId); // mipmap\r
    // if color.a < 0.5 {\r
    //         discard;\r
    // }\r
\r
    let lastScreenPos = vec2f(stage.lastPos.x / stage.lastPos.w, - stage.lastPos.y / stage.lastPos.w) / 2.0 + 0.5;\r
    let currentScreenPos = vec2f(stage.pos.x / f32(width), stage.pos.y / f32(height));\r
    let motionVec = currentScreenPos - lastScreenPos;\r
    var visibility = Visibility(\r
        stage.BaryCoord.yz,\r
        vec2f(motionVec.x, motionVec.y), // motionVec\r
        stage.primId,\r
        // color,\r
    );\r
\r
    return vec4u(bitcast<vec2u>(visibility.baryCoord), visibility.primId, pack2x16snorm(visibility.motionVec));\r
}\r
`,no=`struct PackedLight {\r
    position: vec3f,\r
    color: u32,\r
    prob: f32,\r
    aliasId: u32,\r
    intensity: f32,\r
};\r
struct Lights {\r
    cnt: u32,\r
    powerSum: f32,\r
    light: array<PackedLight,LIGHT_COUNT>,\r
};\r
struct padMotion {\r
    v: vec3f,\r
    pad: vec3f,\r
};\r
struct Motion {\r
    cnt: u32,\r
    motion: array<padMotion,LIGHT_COUNT>,\r
}\r
@group(0) @binding(0) var<storage,read_write> lights: Lights;\r
@group(0) @binding(1) var<storage,read_write> motions: Motion;\r
\r
@compute @workgroup_size(32)\r
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3u) {\r
    let id = GlobalInvocationID.x;\r
    if id >= lights.cnt {\r
        return;\r
    }\r
    const velocity = 2.;\r
    const BoundaryMin = vec3f(-10);\r
    const BoundaryMax = vec3f(10);\r
    var pos = lights.light[id].position;\r
    var v = motions.motion[id].v;\r
    pos += v * velocity;\r
    if pos.x < BoundaryMin.x || pos.x > BoundaryMax.x {\r
        v.x = -v.x;\r
    }\r
    if pos.y < BoundaryMin.y || pos.y > BoundaryMax.y {\r
        v.y = -v.y;\r
    }\r
    if pos.z < BoundaryMin.z || pos.z > BoundaryMax.z {\r
        v.z = -v.z;\r
    }\r
    motions.motion[id].v = v;\r
    lights.light[id].position = pos;\r
}\r
`,io=`struct PackedLight {\r
    position: vec3f,\r
    color: u32,\r
    prob: f32,\r
    aliasId: u32,\r
    intensity: f32,\r
};\r
struct Lights {\r
    cnt: u32,\r
    powerSum: f32,\r
    light: array<PackedLight,LIGHT_COUNT>,\r
};\r
struct Light {\r
    position: vec3f,\r
    id: u32,\r
    color: vec3f,\r
    intensity: f32,\r
};\r
@group(2) @binding(0) var<uniform> lights: Lights;\r
\r
fn unpackLight(packed: PackedLight, id: u32) -> Light {\r
    return Light(packed.position, id, unpack4x8unorm(packed.color).xyz, packed.intensity);\r
}\r
\r
fn getLight(id: u32) -> Light {\r
    return unpackLight(lights.light[id], id);\r
}\r
\r
fn sampleLightProb(light: Light) -> f32 {\r
    // possibility of sampling alias table\r
    return light.intensity / lights.powerSum;\r
}\r
\r
fn sampleLight() -> Light {\r
    var id = u32(random() * f32(lights.cnt));\r
    let light = lights.light[id];\r
    if random() < light.prob {\r
        return unpackLight(light, id);\r
    } else {\r
        return unpackLight(lights.light[light.aliasId], light.aliasId);\r
    }\r
    // return unpackLight(lights.light[1]);\r
}`,so=`const PI:f32=3.14159265359;\r
const INVPI:f32=0.31830988618;\r
var<private> seed:u32=0;\r
struct UBO {\r
    origin: vec3f,\r
    seed: u32,\r
};\r
\r
fn tea(seed0: u32, seed1: u32, loopCount: u32) -> u32 {\r
    var v0: u32 = seed0;\r
    var v1: u32 = seed1;\r
    var s0: u32 = 0;\r
    for (var i = 0u; i < loopCount; i++) {\r
        s0 += 0x9e3779b9;\r
        v0 += ((v1 << 4) + 0xA341316C) ^ (v1 + s0) ^ ((v1 >> 5) + 0xC8013EA4);\r
        v1 += ((v0 << 4) + 0xAD90777D) ^ (v0 + s0) ^ ((v0 >> 5) + 0x7E95761E);\r
    }\r
    return v0;\r
}\r
\r
fn lcg() -> u32 {\r
    let LCG_A: u32 = 1664525;\r
    let LCG_C: u32 = 1013904223;\r
    seed = LCG_A * seed + LCG_C;\r
    return seed;\r
}\r
\r
fn random() -> f32 {\r
    return f32(lcg() & 0x7fffffff) / f32(0x80000000);\r
}\r
\r
fn samplingHemisphere() -> vec4f {\r
    let r1 = random();\r
    let r2 = random();\r
    let sq = sqrt(r1);\r
    return vec4f(cos(2.0 * PI * r2) * sq, sin(2.0 * PI * r2) * sq, sqrt(1.0 - r1), sqrt(1.0 - r1) * INVPI);\r
}\r
\r
fn samplingDisk() -> vec2f {\r
    let r1 = random();\r
    let r2 = random();\r
    let sq = sqrt(r1);\r
    return vec2f(cos(2.0 * PI * r2) * sq, sin(2.0 * PI * r2) * sq);\r
}\r
\r
struct PointInfo {\r
    pos: vec3f,\r
    normalGeo: vec3f,\r
    normalShading: vec3f,\r
    baseColor: vec3f,\r
    metallicRoughness: vec2f,\r
};\r
\r
fn normalEncode(normal: vec3f) -> u32 {\r
    // Stereographic projection\r
    let XY = vec2f(normal.xy / (1.0 - normal.z));\r
    return pack2x16float(XY);\r
}\r
\r
fn normalDecode(encoded: u32) -> vec3f {\r
    let XY = unpack2x16float(encoded);\r
    let denom = 1.0 + dot(XY, XY);\r
    return vec3f(2.0 * XY / denom, (denom - 2.0) / denom);\r
}\r
\r
fn loadGBuffer(idx: u32, pointInfo: ptr<function,PointInfo>) {\r
    let tex = gBufferTex[idx];\r
    (*pointInfo).baseColor = vec3f(unpack2x16unorm(tex.x), unpack2x16unorm(tex.y).x);\r
    (*pointInfo).metallicRoughness = unpack4x8unorm(tex.y).zw;\r
    let attri = gBufferAttri[idx];\r
    (*pointInfo).pos = attri.xyz;\r
    (*pointInfo).normalShading = normalDecode(bitcast<u32>(attri.w));\r
}\r
struct PointAttri {\r
    pos: vec3f,\r
    normalShading: vec3f,\r
};\r
\r
fn loadGBufferAttri(gBufferAttri: ptr<storage,array<vec4f>>, idx: u32) -> PointAttri {\r
    let attri = (*gBufferAttri)[idx];\r
    var ret: PointAttri;\r
    ret.pos = attri.xyz;\r
    ret.normalShading = normalDecode(bitcast<u32>(attri.w));\r
    return ret;\r
}`,oo=`\r
struct PrimaryHitInfo {\r
    baryCoord: vec3f,\r
    primId: u32,\r
    motionVec: vec2f,\r
};\r
fn primaryHit(screen_pos: vec2u) -> PrimaryHitInfo {\r
    let visibilityInfo = textureLoad(vBuffer, screen_pos, 0);\r
    var primaryHitInfo: PrimaryHitInfo = PrimaryHitInfo();\r
    let bataGamma = bitcast<vec2f>(visibilityInfo.xy);\r
    primaryHitInfo.baryCoord = vec3f(1.0 - bataGamma.x - bataGamma.y, bataGamma.x, bataGamma.y);\r
    primaryHitInfo.primId = visibilityInfo.z;\r
    primaryHitInfo.motionVec = unpack2x16snorm(visibilityInfo.w);\r
    return primaryHitInfo;\r
}\r
\r
fn sampleTex(tex: texture_2d_array<f32>, uv: vec2f, index: u32, grad: vec2f, defaultValue: vec4f) -> vec4f {\r
    if ~index == 0 {\r
        return defaultValue;\r
    }\r
    return textureSampleGrad(tex, samp, uv, index, grad, grad.yx);\r
    // return textureSampleLevel(tex, samp, uv, index, 0.0);\r
}\r
\r
fn sampleTexIndirect(tex: texture_2d_array<f32>, uv: vec2f, index: u32, defaultValue: vec4f) -> vec4f {\r
    if ~index == 0 {\r
        return defaultValue;\r
    }\r
    return textureSampleLevel(tex, samp, uv, index, 0.0);\r
}\r
\r
fn unpackTriangle(triangle: PrimaryHitInfo, origin: vec3f, halfConeAngle: f32) -> PointInfo {\r
    let offset = vec3u(indices[triangle.primId * 3], indices[triangle.primId * 3 + 1], indices[triangle.primId * 3 + 2]);\r
    let vtx = array<vec4f, 3>(vertices[offset.x], vertices[offset.y], vertices[offset.z]);\r
    let geo = array<GeometryInfo, 3>(geometries[offset.x], geometries[offset.y], geometries[offset.z]);\r
\r
    var retInfo: PointInfo = PointInfo();\r
    let albedoId = geo[0].id.x;\r
    let normalMapId = geo[0].id.y;\r
    let specularMapId = geo[0].id.z;\r
    retInfo.pos = vec3f(triangle.baryCoord.x * vtx[0].xyz + triangle.baryCoord.y * vtx[1].xyz + triangle.baryCoord.z * vtx[2].xyz);\r
    let direction = normalize(retInfo.pos - origin);\r
    var normalGeo = normalize(cross(vtx[1].xyz - vtx[0].xyz, vtx[2].xyz - vtx[0].xyz));\r
    let uv = triangle.baryCoord.x * geo[0].uv.xy + triangle.baryCoord.y * geo[1].uv.xy + triangle.baryCoord.z * geo[2].uv.xy;\r
\r
    // compute uv gradient using ray cone\r
    var uvGradient: vec2f = vec2f(0.);\r
        {\r
        let uv10 = geo[1].uv - geo[0].uv;\r
        let uv20 = geo[2].uv - geo[0].uv;\r
        let quadUvArea = abs(uv10.x * uv20.y - uv10.y * uv20.x);\r
        let edge10 = vtx[1].xyz - vtx[0].xyz;\r
        let edge20 = vtx[2].xyz - vtx[0].xyz;\r
        let faceNormal = cross(edge10, edge20);\r
        let quadArea = length(faceNormal);\r
        let normalTerm = abs(dot(direction, normalGeo));\r
        let rayConeWidth = 2.0 * tan(halfConeAngle) * length(retInfo.pos - origin) ;\r
        let prjConeWidth = rayConeWidth / normalTerm;\r
        let visibleAreaRatio = prjConeWidth * prjConeWidth / quadArea;\r
        let visibleUvArea = visibleAreaRatio * quadUvArea;\r
        let uvLength = sqrt(visibleUvArea);\r
        uvGradient = vec2f(uvLength, 0);\r
    }\r
\r
    // sample textures. The sampled value should be used as far as possible to avoid the texture cache miss.\r
    retInfo.normalShading = sampleTex(normalMap, uv, normalMapId, uvGradient, vec4f(0., 0., 1., 1.)).xyz * 2.0 - 1.0;\r
    retInfo.metallicRoughness = sampleTex(specularMap, uv, specularMapId, uvGradient, vec4f(0.5)).zy;\r
    // retInfo.metallicRoughness = vec2f(0.9, 0.5);\r
    retInfo.baseColor = sampleTex(albedo, uv, albedoId, uvGradient, vec4f(1.)).xyz;\r
\r
    // fix normal orientation\r
    var iterpolatedNormal = normalize(triangle.baryCoord.x * geo[0].normal.xyz + triangle.baryCoord.y * geo[1].normal.xyz + triangle.baryCoord.z * geo[2].normal.xyz);\r
    var tangent = triangle.baryCoord.x * geo[0].tangent + triangle.baryCoord.y * geo[1].tangent + triangle.baryCoord.z * geo[2].tangent;\r
    if dot(normalGeo, iterpolatedNormal) < 0.0 {\r
        normalGeo = -normalGeo;\r
    }\r
    if dot(normalGeo, direction) > 0.0 {\r
        normalGeo = -normalGeo;\r
        iterpolatedNormal = -iterpolatedNormal;\r
        tangent = vec4f(-tangent.xyz, tangent.w);\r
    }\r
    retInfo.normalGeo = normalGeo;\r
    // compute normal shading\r
    var T = normalize(tangent.xyz);\r
    var B = normalize(cross(iterpolatedNormal, T) * tangent.w);\r
    let tbn = mat3x3f(T, B, iterpolatedNormal);\r
    retInfo.normalShading = normalize(tbn * retInfo.normalShading);\r
    // retInfo.normalShading = normalGeo;\r
    return retInfo;\r
}\r
\r
// simplify computing normal and sampling tex.\r
fn unpackTriangleIndirect(triangle: PrimaryHitInfo, origin: vec3f) -> PointInfo {\r
\r
    let offset = vec3u(indices[triangle.primId * 3], indices[triangle.primId * 3 + 1], indices[triangle.primId * 3 + 2]);\r
    let vtx = array<vec4f, 3>(vertices[offset.x], vertices[offset.y], vertices[offset.z]);\r
    let geo = array<GeometryInfo, 3>(geometries[offset.x], geometries[offset.y], geometries[offset.z]);\r
\r
    var retInfo: PointInfo = PointInfo();\r
    let albedoId = geo[0].id.x;\r
    let normalMapId = geo[0].id.y;\r
    let specularMapId = geo[0].id.z;\r
    let uv = triangle.baryCoord.x * geo[0].uv.xy + triangle.baryCoord.y * geo[1].uv.xy + triangle.baryCoord.z * geo[2].uv.xy;\r
    retInfo.metallicRoughness = sampleTexIndirect(specularMap, uv, specularMapId, vec4f(0.5)).zy;\r
    // retInfo.metallicRoughness = vec2f(0.9, 0.5);\r
    retInfo.baseColor = sampleTexIndirect(albedo, uv, albedoId, vec4f(1.)).xyz;\r
\r
    retInfo.pos = vec3f(triangle.baryCoord.x * vtx[0].xyz + triangle.baryCoord.y * vtx[1].xyz + triangle.baryCoord.z * vtx[2].xyz);\r
    let direction = normalize(retInfo.pos - origin);\r
    var normalGeo = normalize(cross(vtx[1].xyz - vtx[0].xyz, vtx[2].xyz - vtx[0].xyz));\r
\r
    // fix normal orientation\r
    var iterpolatedNormal = normalize(triangle.baryCoord.x * geo[0].normal.xyz + triangle.baryCoord.y * geo[1].normal.xyz + triangle.baryCoord.z * geo[2].normal.xyz);\r
    if dot(normalGeo, iterpolatedNormal) < 0.0 {\r
        normalGeo = -normalGeo;\r
    }\r
    if dot(normalGeo, direction) > 0.0 {\r
        normalGeo = -normalGeo;\r
        iterpolatedNormal = -iterpolatedNormal;\r
    }\r
    // compute normal shading\r
    retInfo.normalShading = iterpolatedNormal;\r
    retInfo.normalGeo = normalGeo;\r
    return retInfo;\r
}\r
\r
fn storeGBuffer(idx: u32, pos: vec3f, normal: vec3f, baseColor: vec3f, metallicRoughness: vec2f) {\r
    // {f16(baseColor.xy)} {f16(baseColor.z)f8(metallicRoughness.xy)}\r
    let tex = vec2u(pack2x16unorm(baseColor.xy), pack2x16unorm(vec2f(baseColor.z, 0)) | pack4x8unorm(vec4f(0., 0., metallicRoughness)));\r
    gBufferTex[idx] = tex;\r
    let attri: vec4f = vec4f(pos, bitcast<f32>(normalEncode(normal)));\r
    gBufferAttri[idx] = attri;\r
}\r
`,ao=`struct ReservoirDI {\r
    lightId: u32,\r
    w_sum: f32,\r
    W: f32,\r
    M: u32,\r
};\r
struct ReservoirGI {\r
    // x: point n:normal\r
    // v: visible point\r
    // s: sample point\r
    xv: vec3f,\r
    w_sum: f32,\r
    nv: vec3f,\r
    M: u32,\r
    xs: vec3f,\r
    W: f32,\r
    ns: vec3f,\r
    lightId: u32,\r
    Lo: vec3f,\r
}\r
\r
fn Jacobian(x: vec3f, reservoir: ReservoirGI) -> f32 {\r
    let qs = reservoir.xv - reservoir.xs;\r
    let rs = x - reservoir.xs;\r
    let thetaq = dot(reservoir.ns, normalize(qs));\r
    let thetar = dot(reservoir.ns, normalize(rs));\r
    return thetar / thetaq * dot(qs, qs) / dot(rs, rs);\r
}\r
\r
fn updateReservoirGI(reservoir: ptr<function,ReservoirGI>, xv: vec3f, nv: vec3f, xs: vec3f, ns: vec3f, w: f32, Lo: vec3f, lightId: u32) {\r
    (*reservoir).M += 1;\r
    (*reservoir).w_sum += w;\r
    if random() < w / (*reservoir).w_sum {\r
        (*reservoir).xv = xv;\r
        (*reservoir).nv = nv;\r
        (*reservoir).xs = xs;\r
        (*reservoir).ns = ns;\r
        (*reservoir).Lo = Lo;\r
        (*reservoir).lightId = lightId;\r
    }\r
}\r
\r
fn combineReservoirsGI(reservoir: ptr<function,ReservoirGI>, other: ReservoirGI) {\r
    (*reservoir).M += other.M;\r
    (*reservoir).w_sum += other.w_sum;\r
    if random() < other.w_sum / (*reservoir).w_sum {\r
        (*reservoir).xv = other.xv;\r
        (*reservoir).nv = other.nv;\r
        (*reservoir).xs = other.xs;\r
        (*reservoir).ns = other.ns;\r
        (*reservoir).Lo = other.Lo;\r
        (*reservoir).lightId = other.lightId;\r
    }\r
}\r
\r
@group(1) @binding(0) var<storage, read_write> currentReservoir: array<array<u32,16>>;\r
@group(1) @binding(1) var<storage, read> previousReservoir: array<array<u32,16>>;\r
\r
fn loadReservoir(reservoir: ptr<storage,array<array<u32,16>>>, idx: u32, reservoirDI: ptr<function,ReservoirDI>, reservoirGI: ptr<function,ReservoirGI>, seed: ptr<function,u32>) {\r
    // LightDI/GI,wDI,WDI,MDIGI.xy\r
    // Xvisible.xyz Nvisible.xy\r
    // Xsample.xyz Nsample.xy\r
    // wGI,WGI, Lo.xy, Lo.z/seed\r
    let reservoirAll = (*reservoir)[idx];\r
    (*reservoirDI).lightId = reservoirAll[0] & 0xFFFF;\r
    (*reservoirDI).w_sum = bitcast<f32>(reservoirAll[1]);\r
    (*reservoirDI).W = bitcast<f32>(reservoirAll[2]);\r
    let MAll = vec2u(reservoirAll[3] & 0xFFFF, reservoirAll[3] >> 16);\r
    (*reservoirDI).M = MAll.x;\r
\r
    (*reservoirGI).lightId = reservoirAll[0] >> 16;\r
    (*reservoirGI).M = MAll.y;\r
    (*reservoirGI).xv = bitcast<vec3f>(vec3u(reservoirAll[4], reservoirAll[5], reservoirAll[6]));\r
    (*reservoirGI).nv = normalDecode(reservoirAll[7]);\r
    (*reservoirGI).xs = bitcast<vec3f>(vec3u(reservoirAll[8], reservoirAll[9], reservoirAll[10]));\r
    (*reservoirGI).ns = normalDecode(reservoirAll[11]);\r
    (*reservoirGI).w_sum = bitcast<f32>(reservoirAll[12]);\r
    (*reservoirGI).W = bitcast<f32>(reservoirAll[13]);\r
    (*reservoirGI).Lo = vec3f(unpack2x16float(reservoirAll[14]), unpack2x16float(reservoirAll[15]).x);\r
    *seed = (reservoirAll[15] & 0xFFFF0000) >> 16;\r
}\r
\r
fn storeReservoir(reservoir: ptr<storage,array<array<u32,16>>,read_write>, idx: u32, reservoirDI: ReservoirDI, reservoirGI: ReservoirGI, seed: u32) {\r
    // LightDI/GI,wDI,WDI,MDIGI.xy\r
    // Xvisible.xyz Nvisible.xy\r
    // Xsample.xyz Nsample.xy\r
    // wGI,WGI, Lo.xy, Lo.z/seed\r
    let MAll = vec2u(reservoirDI.M, reservoirGI.M);\r
    (*reservoir)[idx] = array<u32,16>(\r
        reservoirDI.lightId | (reservoirGI.lightId << 16),\r
        bitcast<u32>(reservoirDI.w_sum),\r
        bitcast<u32>(reservoirDI.W),\r
        MAll.x | (MAll.y << 16),\r
        bitcast<u32>(reservoirGI.xv.x),\r
        bitcast<u32>(reservoirGI.xv.y),\r
        bitcast<u32>(reservoirGI.xv.z),\r
        normalEncode(reservoirGI.nv),\r
        bitcast<u32>(reservoirGI.xs.x),\r
        bitcast<u32>(reservoirGI.xs.y),\r
        bitcast<u32>(reservoirGI.xs.z),\r
        normalEncode(reservoirGI.ns),\r
        bitcast<u32>(reservoirGI.w_sum),\r
        bitcast<u32>(reservoirGI.W),\r
        pack2x16float(reservoirGI.Lo.xy),\r
        pack2x16float(vec2f(reservoirGI.Lo.z, 0.0)) | (seed << 16),\r
    );\r
}\r
\r
fn updateReservoirDI(reservoir: ptr<function,ReservoirDI>, lightId: u32, weight: f32) {\r
    (*reservoir).M += 1;\r
    (*reservoir).w_sum += weight;\r
    if random() < weight / (*reservoir).w_sum {\r
        (*reservoir).lightId = lightId;\r
    }\r
}\r
\r
fn combineReservoirsDI(reservoir: ptr<function,ReservoirDI>, other: ReservoirDI) {\r
    (*reservoir).M += other.M;\r
    (*reservoir).w_sum += other.w_sum;\r
    if random() < other.w_sum / (*reservoir).w_sum {\r
        (*reservoir).lightId = other.lightId;\r
    }\r
}\r
`,lo=`@group(3) @binding(0) var<storage, read> bvh : BVH;\r
@group(3) @binding(1) var<storage, read> vertices : array<vec4f>;\r
@group(3) @binding(2) var<storage, read> indices : array<u32>;\r
\r
struct BVHNode {\r
    min: vec3<f32 >,\r
    isLeaf: u32,\r
    max: vec3<f32 >,\r
    child: u32,\r
};\r
\r
struct BVH {\r
    nodes: array<BVHNode>,\r
};\r
\r
struct RayInfo {\r
    worldRayOrigin: vec3f,\r
    isHit: u32,\r
    worldRayDirection: vec3f,\r
    hitDistance: f32,\r
    directionInverse: vec3f,\r
    PrimitiveIndex: u32,\r
    hitAttribute: vec3f,\r
};\r
\r
\r
struct PrimHitInfo {\r
    pos: array<vec4f, 3>\r
};\r
\r
struct HitInfo {\r
    baryCoord: vec3f,\r
    hitDistance: f32,\r
    isHit: bool,\r
};\r
\r
fn unpackPrimHitInfo(primId: u32) -> PrimHitInfo {\r
    let offset = vec3u(indices[primId * 3], indices[primId * 3 + 1], indices[primId * 3 + 2]);\r
    return PrimHitInfo(array<vec4f, 3 >(vertices[offset.x], vertices[offset.y], vertices[offset.z]));\r
}\r
\r
fn hitTriangle(rayInfo: RayInfo, triangleIndex: u32) -> HitInfo {\r
    //Möller-Trumbore algorithm\r
    let primInfo: PrimHitInfo = unpackPrimHitInfo(triangleIndex);\r
\r
    let origin = rayInfo.worldRayOrigin;\r
    let direction = rayInfo.worldRayDirection;\r
\r
    let e1: vec3f = primInfo.pos[1].xyz - primInfo.pos[0].xyz;\r
    let e2: vec3f = primInfo.pos[2].xyz - primInfo.pos[0].xyz;\r
    let s1: vec3f = cross(direction, e2);\r
\r
    let det = dot(e1, s1);\r
    var ret = HitInfo(vec3<f32 >(0.0), 0.0, false);\r
        // const INTERSECT_EPSILON: f32 = 0.000000001;\r
    if abs(det) == 0. {\r
        return ret;\r
    }\r
    let s: vec3f = (origin - primInfo.pos[0].xyz) / det;\r
    let b1 = dot(s, s1);\r
    if b1 < 0.0 || b1 > 1.0 {\r
        return ret;\r
    }\r
    let s2: vec3f = cross(s, e1);\r
    let b2 = dot(direction, s2);\r
    if b2 < 0.0 || b1 + b2 > 1.0 {\r
        return ret;\r
    }\r
    ret.hitDistance = dot(e2, s2);\r
    if ret.hitDistance < 0.0 || ret.hitDistance > rayInfo.hitDistance {\r
        return ret;\r
    }\r
    ret.baryCoord = vec3<f32 >(1.0 - (b1 + b2), b1, b2);\r
    // ret.isHit = all(ret.baryCoord > vec3f(0.)) && ret.hitDistance >= 0.0 && ret.hitDistance < rayInfo.hitDistance;\r
    ret.isHit = true;\r
    return ret;\r
}\r
\r
fn hitAABB(rayInfo: RayInfo, minCorner: vec3f, maxCorner: vec3f) -> bool {\r
    let t1: vec3f = (minCorner - rayInfo.worldRayOrigin) * rayInfo.directionInverse;\r
    let t2: vec3f = (maxCorner - rayInfo.worldRayOrigin) * rayInfo.directionInverse;\r
    let tmin: vec3f = min(t1, t2);\r
    let tmax: vec3f = max(t1, t2);\r
    let t_min: f32 = max(max(tmin.x, tmin.y), tmin.z);\r
    let t_max: f32 = min(min(tmax.x, tmax.y), tmax.z);\r
    if t_min > t_max || t_max < 0.0 || t_min > rayInfo.hitDistance {\r
        return false;\r
    }\r
    return true;\r
}\r
var<private> stack: array<u32, TREE_DEPTH>;\r
fn traceRay(rayOrigin: vec3f, rayDirection: vec3f) -> RayInfo {\r
    var rayInfo: RayInfo;\r
    rayInfo.isHit = 0u;\r
    rayInfo.hitDistance = 10000.0;\r
    rayInfo.worldRayDirection = normalize(rayDirection);\r
    rayInfo.worldRayOrigin = rayOrigin + rayInfo.worldRayDirection * 0.00001;\r
    rayInfo.directionInverse = vec3<f32 >(1.0) / rayDirection;\r
    rayInfo.PrimitiveIndex = 0u;\r
\r
    // var stack: array<u32, TREE_DEPTH> = array<u32, TREE_DEPTH >();\r
    var stackCurl: i32 = 0;\r
    stack[0] = 0u;\r
\r
    while stackCurl >= 0 {\r
        let nodeIndex: u32 = stack[stackCurl];\r
        stackCurl = stackCurl - 1;\r
        let node: BVHNode = bvh.nodes[nodeIndex];\r
\r
        if hitAABB(rayInfo, node.min, node.max) {\r
            if (node.isLeaf & 1u) == 0u {\r
                //(node.isLeaf & 6) >> 1): split axis; x=0,y=1,z=2 the same as emun Axis in bvh.ts\r
                let leftChildFarther: u32 = u32(rayInfo.worldRayDirection[((node.isLeaf & 6) >> 1)] > 0.0);\r
                stackCurl = stackCurl + 1;\r
                stack[stackCurl] = node.child + leftChildFarther;\r
                stackCurl = stackCurl + 1;\r
                stack[stackCurl] = node.child + 1u - leftChildFarther;\r
            } else {\r
                let hitInfo = hitTriangle(rayInfo, node.child);\r
                if hitInfo.isHit {\r
                    rayInfo.isHit = 1u;\r
                    rayInfo.hitDistance = hitInfo.hitDistance;\r
                    rayInfo.hitAttribute = hitInfo.baryCoord;\r
                    rayInfo.PrimitiveIndex = node.child;\r
                }\r
            }\r
        }\r
    }\r
    return rayInfo;\r
}\r
\r
fn traceShadowRay(rayOrigin: vec3f, rayDirection: vec3f, lightDistance: f32) -> bool {\r
    var rayInfo: RayInfo;\r
    rayInfo.isHit = 0u;\r
    rayInfo.worldRayDirection = normalize(rayDirection);\r
    rayInfo.worldRayOrigin = rayOrigin + rayInfo.worldRayDirection * 0.00001;\r
    rayInfo.hitDistance = lightDistance * 0.99;\r
    rayInfo.directionInverse = vec3<f32 >(1.0) / rayDirection;\r
    rayInfo.PrimitiveIndex = 0u;\r
\r
    // var stack: array<u32, TREE_DEPTH> = array<u32, TREE_DEPTH >();\r
    var stackCurl: i32 = 0;\r
    stack[0] = 0u;\r
\r
    while stackCurl >= 0 {\r
        let nodeIndex: u32 = stack[stackCurl];\r
        stackCurl = stackCurl - 1;\r
        let node: BVHNode = bvh.nodes[nodeIndex];\r
\r
        if hitAABB(rayInfo, node.min, node.max) {\r
            if (node.isLeaf & 1u) == 0u {\r
                //(node.isLeaf & 6) >> 1): split axis; x=0,y=1,z=2 the same as emun Axis in bvh.ts\r
                let leftChildFarther: u32 = u32(rayInfo.worldRayDirection[((node.isLeaf & 6) >> 1)] > 0.0);\r
                stackCurl = stackCurl + 1;\r
                stack[stackCurl] = node.child + leftChildFarther;\r
                stackCurl = stackCurl + 1;\r
                stack[stackCurl] = node.child + 1u - leftChildFarther;\r
            } else {\r
                let hitInfo = hitTriangle(rayInfo, node.child);\r
                if hitInfo.isHit {\r
                    return true;\r
                }\r
            }\r
        }\r
    }\r
    return false;\r
}`,ho=`fn pow5(x: f32) -> f32 {\r
    let x1 = x;\r
    let x2 = x1 * x1;\r
    return x2 * x2 * x1;\r
}\r
\r
fn luminance(color: vec3f) -> f32 {\r
    return dot(color, vec3f(0.2126, 0.7152, 0.0722));\r
}\r
\r
fn Fdiffuse(baseColor: vec3f, roughness: f32, ndoti: f32, ndoto: f32, hdoto: f32) -> vec3f {\r
    let FD90 = 0.5 + 2. * roughness * hdoto * hdoto;\r
    let FDwi = mix(1., FD90, pow5(1. - ndoti));\r
    let FDwo = mix(1., FD90, pow5(1. - ndoto));\r
    return baseColor * INVPI * FDwi * FDwo * ndoto;\r
}\r
\r
fn FdiffuseLuminance(baseColorLuminance: f32, roughness: f32, ndoti: f32, ndoto: f32, hdoto: f32) -> f32 {\r
    let FD90 = 0.5 + 2. * roughness * hdoto * hdoto;\r
    let FDwi = mix(1., FD90, pow5(1. - ndoti));\r
    let FDwo = mix(1., FD90, pow5(1. - ndoto));\r
    return baseColorLuminance * INVPI * FDwi * FDwo * ndoto;\r
}\r
\r
fn SmithGGX(ndoti: f32, ndoti2: f32, alpha2: f32) -> f32 {\r
    return 1.0 / (ndoti + sqrt(alpha2 + ndoti2 - ndoti2 * alpha2));\r
}\r
\r
fn Fmetallic(baseColor: vec3f, roughness: f32, ndoth: f32, h: vec3f, hdoto: f32, ndoti: f32, ndoto: f32) -> vec3f {\r
\r
    let Fm = mix(baseColor, vec3f(1.), pow5(1. - hdoto));\r
    // GTR2\r
    let alpha = max(0.001, roughness * roughness);\r
    let alpha2 = alpha * alpha;\r
    let t = 1.0 + (alpha2 - 1.0) * ndoth * ndoth;\r
    let Dm = alpha2 / (PI * t * t);\r
    // smith GGX \r
    let ndoti2 = ndoti * ndoti;\r
    let ndoto2 = ndoto * ndoto;\r
    let Gm = SmithGGX(ndoti, ndoti2, alpha2) * SmithGGX(ndoto, ndoto2, alpha2);\r
    return Fm * Dm * Gm / 4.0 * ndoti;\r
}\r
\r
fn FmetallicLuminance(baseColorLuminance: f32, roughness: f32, ndoth: f32, h: vec3f, hdoto: f32, ndoti: f32, ndoto: f32) -> f32 {\r
\r
    let Fm = mix(baseColorLuminance, 1., pow5(1. - hdoto));\r
    // GTR2\r
    let alpha = max(0.001, roughness * roughness);\r
    let alpha2 = alpha * alpha;\r
    let t = 1.0 + (alpha2 - 1.0) * ndoth * ndoth;\r
    let Dm = alpha2 / (PI * t * t);\r
    // smith GGX \r
    let ndoti2 = ndoti * ndoti;\r
    let ndoto2 = ndoto * ndoto;\r
    let Gm = SmithGGX(ndoti, ndoti2, alpha2) * SmithGGX(ndoto, ndoto2, alpha2);\r
    return Fm * Dm * Gm / 4.0 * ndoti;\r
}\r
\r
fn BSDF(shadingPoint: PointInfo, wo: vec3f, wi: vec3f) -> vec3f {\r
    let h = normalize(wi + wo);\r
    let ndoti = max(0.01, dot(shadingPoint.normalShading, wi));\r
    let ndoto = max(0.01, dot(shadingPoint.normalShading, wo));\r
    let hdoto = dot(h, wo);\r
    let ndoth = max(0.01, dot(shadingPoint.normalShading, h));\r
    let diffuse = Fdiffuse(shadingPoint.baseColor, shadingPoint.metallicRoughness.y, ndoti, ndoto, hdoto);\r
    let metallic = Fmetallic(shadingPoint.baseColor, shadingPoint.metallicRoughness.y, ndoth, h, hdoto, ndoti, ndoto);\r
    return (1.0 - shadingPoint.metallicRoughness.x) * diffuse + (shadingPoint.metallicRoughness.x) * metallic;\r
}\r
\r
fn BSDFLuminance(shadingPoint: PointInfo, wo: vec3f, wi: vec3f) -> f32 {\r
    let ndoto = max(0.000, dot(shadingPoint.normalShading, wo));\r
    return ndoto * INVPI;\r
\r
    // let h = normalize(wi + wo);\r
    // let ndoti = max(0.000, dot(shadingPoint.normalShading, wi));\r
    // let ndoto = max(0.000, dot(shadingPoint.normalShading, wo));\r
    // let hdoto = dot(h, wo);\r
    // let ndoth = max(0.000, dot(shadingPoint.normalShading, h));\r
    // let baseColorLuminance = luminance(shadingPoint.baseColor);\r
    // let diffuse = FdiffuseLuminance(baseColorLuminance, shadingPoint.metallicRoughness.y, ndoti, ndoto, hdoto);\r
    // let metallic = FmetallicLuminance(baseColorLuminance, shadingPoint.metallicRoughness.y, ndoth, h, hdoto, ndoti, ndoto);\r
    // return ((1.0 - shadingPoint.metallicRoughness.x) * diffuse + (shadingPoint.metallicRoughness.x) * metallic);\r
}`,co=`struct Camera {\r
    world: mat4x4f,\r
    projInv: mat4x4f,\r
    VPMat: mat4x4f,\r
    lastVPMat: mat4x4f,\r
};\r
struct GeometryInfo {\r
    id: vec4u,\r
    normal: vec3f,\r
    color: u32,\r
    tangent: vec4f,\r
    uv: vec2f,\r
};\r
\r
@group(0) @binding(0) var frame : texture_storage_2d<rgba16float, write>;\r
@group(0) @binding(1) var<uniform> camera : Camera;\r
@group(0) @binding(2) var<storage, read> geometries : array<GeometryInfo>;\r
@group(0) @binding(3) var albedo: texture_2d_array<f32>;\r
@group(0) @binding(4) var normalMap: texture_2d_array<f32>;\r
@group(0) @binding(5) var specularMap: texture_2d_array<f32>;\r
@group(0) @binding(6) var vBuffer : texture_2d<u32>;\r
@group(0) @binding(7) var samp: sampler;\r
@group(0) @binding(8) var<uniform> ubo: UBO;\r
@group(0) @binding(9) var<storage, read_write> gBufferTex : array<vec2u>;\r
@group(0) @binding(10) var<storage, read_write> gBufferAttri : array<vec4f>;\r
@group(0) @binding(11) var<storage, read> previousGBufferAttri : array<vec4f>;\r
// #include <common.wgsl>;\r
// #include <trace.wgsl>;\r
// #include <sampleInit.wgsl>;\r
// #include <reservoir.wgsl>;\r
// #include <light.wgsl>;\r
// #include <BSDF.wgsl>;\r
\r
override halfConeAngle = 0.0;\r
override ENABLE_GI: bool = true;\r
\r
fn generateTBN(normal: vec3f) -> mat3x3f {\r
    let sign = select(1.0, -1.0, normal.z < 0.0);\r
    let a = -1. / (sign + normal.z);\r
    let b = normal.x * normal.y * a;\r
    let T = vec3f(1.0 + sign * normal.x * normal.x * a, sign * b, -sign * normal.x);\r
    let B = vec3f(b, sign + normal.y * normal.y * a, -normal.y);\r
    return mat3x3f(T, B, normal);\r
}\r
\r
@compute @workgroup_size(8, 8, 1)\r
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3u, @builtin(workgroup_id) WorkgroupID: vec3u) {\r
    let screen_size: vec2u = textureDimensions(frame);\r
    if any(GlobalInvocationID.xy >= screen_size) {\r
        return;\r
    }\r
\r
    // var rayInfo: RayInfo = traceRay(origin, direction);\r
    var color = vec3f(0.0);\r
    var primaryTri = primaryHit(GlobalInvocationID.xy);\r
    let launchIndex = GlobalInvocationID.y * screen_size.x + GlobalInvocationID.x;\r
    var reservoirCurDI = ReservoirDI();\r
    var reservoirCurGI = ReservoirGI();\r
    var reservoirPrevDI = ReservoirDI();\r
    var reservoirPrevGI = ReservoirGI();\r
\r
    if primaryTri.primId == 0 && all(primaryTri.baryCoord == vec3f(1.0, 0.0, 0.0)) {\r
        reservoirCurDI.W = -1.;\r
        storeGBuffer(launchIndex, vec3f(0), vec3f(0), vec3f(0.), vec2f(0.));\r
        storeReservoir(&currentReservoir, launchIndex, reservoirCurDI, reservoirCurGI, ubo.seed);\r
        return;\r
    }\r
\r
    seed = tea(GlobalInvocationID.y * screen_size.x + GlobalInvocationID.x, ubo.seed, 4);\r
    let origin: vec3f = ubo.origin;\r
    // let screen_target: vec2f = vec2f(f32(GlobalInvocationID.x) + 0.5, f32(screen_size.y - GlobalInvocationID.y - 1u) + 0.5) / vec2f(screen_size);\r
    // let screen_target_ndc: vec2f = screen_target * 2.0 - 1.0;\r
    // let screen_target_world: vec4f = camera.projInv * vec4f(screen_target_ndc, 1.0, 1.0);\r
    var pointInfo = unpackTriangle(primaryTri, origin, halfConeAngle);\r
    let direction = normalize(pointInfo.pos - origin);\r
    var pointPrev: PointAttri;\r
\r
\r
    let globalPreId = vec2f(GlobalInvocationID.xy) + 0.5 - primaryTri.motionVec * vec2f(screen_size);\r
    let launchPreIndex = select(-1, i32(globalPreId.y) * i32(screen_size.x) + i32(globalPreId.x), all(globalPreId >= vec2f(0.0)) && all(globalPreId < vec2f(screen_size)));\r
    let shadingPoint: vec3f = pointInfo.pos;\r
\r
    if launchPreIndex >= 0 {\r
        var _seed: u32;\r
        loadReservoir(&previousReservoir, u32(launchPreIndex), &reservoirPrevDI, &reservoirPrevGI, &_seed);\r
        pointPrev = loadGBufferAttri(&previousGBufferAttri, u32(launchPreIndex));\r
    }\r
    var _seed = tea(WorkgroupID.y * screen_size.x + WorkgroupID.x, ubo.seed, 2);\r
    var geometryTerm_luminance: f32;\r
    var bsdfLuminance: f32;\r
    var pHat: f32;\r
    // initial candidates\r
    var light: Light;\r
    var wo: vec3f;\r
    var dist: f32;\r
\r
    for (var i = 0; i < 16; i = i + 1) {\r
        light = sampleLight();\r
        let samplePdf = sampleLightProb(light);\r
        wo = light.position - shadingPoint;\r
        dist = length(wo);\r
        wo = normalize(wo);\r
        if dot(wo, pointInfo.normalShading) <= 0.0 || dot(wo, pointInfo.normalGeo) <= 0.0 {\r
            reservoirCurGI.M += 1;\r
            continue;\r
        }\r
        geometryTerm_luminance = light.intensity / (dist * dist);\r
        bsdfLuminance = BSDFLuminance(pointInfo, wo, -direction);\r
        pHat = bsdfLuminance * geometryTerm_luminance;\r
        updateReservoirDI(&reservoirCurDI, light.id, pHat / samplePdf);\r
    }\r
\r
    // check visibility\r
    light = getLight(reservoirCurDI.lightId);\r
    wo = light.position - shadingPoint;\r
    dist = length(wo);\r
    wo = normalize(wo);\r
    if traceShadowRay(shadingPoint, wo, dist) {\r
        reservoirCurDI.W = 0.0;\r
        reservoirCurDI.w_sum = 0.0;\r
    } else {\r
        geometryTerm_luminance = light.intensity / (dist * dist);\r
        bsdfLuminance = BSDFLuminance(pointInfo, wo, -direction);\r
        pHat = bsdfLuminance * geometryTerm_luminance;\r
    }\r
\r
    // indirect illumination\r
    if ENABLE_GI {\r
        let sampleVec: vec4f = samplingHemisphere();\r
        // let sampleVec: vec4f = vec4f(0.0, 0.0, 1.0, 1.0);\r
        let wi: vec3f = normalize(generateTBN(pointInfo.normalGeo) * sampleVec.xyz);\r
        let tracePdf = max(0.01, sampleVec.w);\r
        if dot(wi, pointInfo.normalGeo) >= 0. {\r
            let rayInfo: RayInfo = traceRay(pointInfo.pos, wi);\r
            if rayInfo.isHit == 1 {\r
                let triangle: PrimaryHitInfo = PrimaryHitInfo(rayInfo.hitAttribute, rayInfo.PrimitiveIndex, vec2f(0));\r
                let pointSampleInfo: PointInfo = unpackTriangleIndirect(triangle, wi);\r
                let samplePoint = pointSampleInfo.pos;\r
\r
                light = sampleLight();\r
                let lightPdf = sampleLightProb(light);\r
                wo = light.position - samplePoint;\r
                dist = length(wo);\r
                wo = normalize(wo);\r
            // check the visibility from sample point to light\r
                if dot(wo, pointSampleInfo.normalShading) > 0.0 && dot(wo, pointSampleInfo.normalGeo) > 0.0 {\r
                    if !traceShadowRay(samplePoint, wo, dist) {\r
                        let geometryTerm = light.color * light.intensity / (dist * dist);\r
                        let bsdf = BSDF(pointSampleInfo, wo, -wi);\r
                        let Lo = bsdf * geometryTerm / lightPdf;\r
                        updateReservoirGI(&reservoirCurGI, pointInfo.pos, pointInfo.normalShading, pointSampleInfo.pos, pointSampleInfo.normalShading, luminance(Lo) / tracePdf, Lo, light.id);\r
                    }\r
                }\r
            }\r
        }\r
        reservoirCurGI.M = 1;\r
    }\r
\r
    // temperal reuse\r
\r
    // plane distance\r
    let posDiff = pointPrev.pos - pointInfo.pos;\r
    let planeDist = abs(dot(posDiff, pointInfo.normalShading));\r
    if dot(pointInfo.normalShading, pointPrev.normalShading) > 0.5 && planeDist < 0.05 {\r
        if reservoirPrevDI.W > 0.0 {\r
            const capped = 8u;\r
            reservoirPrevDI.M = min(reservoirPrevDI.M, capped * reservoirCurDI.M);\r
            light = getLight(reservoirPrevDI.lightId);\r
            wo = light.position - shadingPoint;\r
            dist = length(wo);\r
            wo = normalize(wo);\r
            if dot(wo, pointInfo.normalShading) > 0.0 && dot(wo, pointInfo.normalGeo) > 0.0 {\r
                geometryTerm_luminance = light.intensity / (dist * dist);\r
                bsdfLuminance = BSDFLuminance(pointInfo, wo, -direction);\r
                pHat = bsdfLuminance * geometryTerm_luminance;\r
                reservoirPrevDI.w_sum = pHat * reservoirPrevDI.W * f32(reservoirPrevDI.M);\r
\r
                combineReservoirsDI(&reservoirCurDI, reservoirPrevDI);\r
            }\r
        }\r
        if ENABLE_GI {\r
            if reservoirPrevGI.W > 0.0 {\r
                reservoirPrevGI.M = min(reservoirPrevGI.M, 20);\r
                wo = reservoirPrevGI.xs - shadingPoint;\r
                dist = length(wo);\r
                wo = normalize(wo);\r
\r
                var flag = true;\r
                if f32(_seed & 0x7fffffff) / f32(0x80000000) < 1. / 8. {\r
                // check visibility from light to sample point\r
                    light = getLight(reservoirPrevGI.lightId);\r
                    let dir = light.position - reservoirPrevGI.xs;\r
                    let dist = length(dir);\r
                    let wo = normalize(dir);\r
                    if traceShadowRay(reservoirPrevGI.xs, wo, dist) {\r
                        flag = false;\r
                    }\r
                }\r
                if flag && dot(wo, pointInfo.normalShading) > 0.0 && dot(wo, pointInfo.normalGeo) > 0.0 {\r
                    pHat = luminance(reservoirPrevGI.Lo);\r
                // pHat = luminance(reservoirPrevGI.Lo) / Jacobian(pointInfo.pos, reservoirPrevGI);\r
                    reservoirPrevGI.w_sum = pHat * reservoirPrevGI.W * f32(reservoirPrevGI.M);\r
\r
                    combineReservoirsGI(&reservoirCurGI, reservoirPrevGI);\r
                }\r
            }\r
        }\r
    }\r
\r
\r
\r
\r
// compute Weight\r
        {\r
            // DI\r
        light = getLight(reservoirCurDI.lightId);\r
        wo = light.position - shadingPoint;\r
        dist = length(wo);\r
        wo = normalize(wo);\r
        geometryTerm_luminance = light.intensity / (dist * dist);\r
        bsdfLuminance = BSDFLuminance(pointInfo, wo, -direction);\r
        pHat = bsdfLuminance * geometryTerm_luminance;\r
        if pHat > 0.0 {\r
            reservoirCurDI.W = reservoirCurDI.w_sum / max(0.001, pHat) / f32(reservoirCurDI.M);\r
        } else {\r
            reservoirCurDI.W = 0.0;\r
            reservoirCurDI.w_sum = 0.0;\r
        }\r
\r
        // GI\r
        if ENABLE_GI {\r
            reservoirCurGI.W = reservoirCurGI.w_sum / max(0.001, luminance(reservoirCurGI.Lo)) / f32(reservoirCurGI.M);\r
        }\r
    }\r
    // traceShadowRay(shadingPoint, wo, dist);\r
    // traceShadowRay(shadingPoint, wo, dist);\r
    // random select light\r
    //     {\r
    //     let light = sampleLight();\r
    //     let samplePdf = sampleLightProb(light);\r
    //     var bsdf = vec3f(0.1);\r
    //     var wo = light.position - shadingPoint;\r
    //     let dist = length(wo);\r
    //     wo = normalize(wo);\r
    //     var visibility = 1.0;\r
    //     var geometryTerm = vec3f(1.0);\r
    //     bsdf = BSDF(pointInfo, wo, -direction);\r
    //     geometryTerm = light.color * light.intensity / (dist * dist);\r
    //     if traceShadowRay(shadingPoint, wo, dist) {\r
    //         visibility = 0.0;\r
    //     } else {\r
    //         visibility = 1.0;\r
    //     }\r
    //     color = bsdf * geometryTerm * visibility / samplePdf;\r
    // }\r
\r
    // reference color\r
    // color = vec4f(0.0);\r
    // for (var i = 0; i < 256; i = i + 1) {\r
    //     let light = getLight(u32(i));\r
    //     var bsdf = vec3f(0.1);\r
    //     var wo = light.position - shadingPoint;\r
    //     let dist = length(wo);\r
    //     wo = normalize(wo);\r
    //     var visibility = 1.0;\r
    //     var geometryTerm = vec3f(1.0);\r
    //     if traceShadowRay(shadingPoint, wo, dist) {\r
    //         visibility = 0.0;\r
    //     } else {\r
    //         visibility = 1.0;\r
    //         bsdf = BSDF(pointInfo, wo, -direction);\r
    //         geometryTerm = light.color * light.intensity / (dist * dist);\r
    //     }\r
    //     color = color.xyz + bsdf * geometryTerm * visibility;\r
    // }\r
\r
    storeGBuffer(launchIndex, pointInfo.pos, pointInfo.normalShading, pointInfo.baseColor, pointInfo.metallicRoughness);\r
    // write reservoir\r
    storeReservoir(&currentReservoir, launchIndex, reservoirCurDI, reservoirCurGI, seed);\r
    // textureStore(frame, GlobalInvocationID.xy, vec4f(color, 1.));\r
}\r
`,uo=`// https://www.cg.cs.tu-bs.de/publications/Eisemann07FRA\r
//example usage\r
//var rayInfo : RayInfo;\r
//let raySlopeInfo : RaySlopeInfo = initSlopeRayInfo(rayInfo);\r
//hitAABBSlope(rayInfo, raySlopeInfo, node.min, node.max);\r
\r
struct RaySlopeInfo {\r
    ibjy : f32,\r
    jbyi : f32,\r
    jbyk : f32,\r
    kbyj : f32,\r
    ibyk : f32,\r
    kbyi : f32,\r
    cxy : f32,\r
    cxz : f32,\r
    cyx : f32,\r
    cyz : f32,\r
    czx : f32,\r
    czy : f32,\r
}\r
\r
fn initSlopeRayInfo(rayInfo : RayInfo) -> RaySlopeInfo {\r
    let o = rayInfo.worldRayOrigin;\r
    let d = rayInfo.worldRayDirection;\r
    let invd = rayInfo.directionInverse;\r
\r
    var raySlopeInfo = RaySlopeInfo();\r
    raySlopeInfo.ibjy = d.x * invd.y;\r
    raySlopeInfo.jbyi = d.y * invd.x;\r
    raySlopeInfo.jbyk = d.y * invd.z;\r
    raySlopeInfo.kbyj = d.z * invd.y;\r
    raySlopeInfo.ibyk = d.x * invd.z;\r
    raySlopeInfo.kbyi = d.z * invd.x;\r
\r
    raySlopeInfo.cxy = o.y - raySlopeInfo.jbyi * o.x;\r
    raySlopeInfo.cxz = o.z - raySlopeInfo.kbyi * o.x;\r
    raySlopeInfo.cyx = o.x - raySlopeInfo.ibjy * o.y;\r
    raySlopeInfo.cyz = o.z - raySlopeInfo.kbyj * o.y;\r
    raySlopeInfo.czx = o.x - raySlopeInfo.ibyk * o.z;\r
    raySlopeInfo.czy = o.y - raySlopeInfo.jbyk * o.z;\r
\r
    return raySlopeInfo;\r
}\r
\r
fn hitAABBSlope(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {\r
    let testClass = u32(dot(vec3 < i32 > (sign(rayInfo.worldRayDirection)), vec3 < i32 > (16, 4, 1)) + 32);\r
    switch testClass{\r
        case u32(-16 - 4 - 1 + 32) : {\r
            return _slopeAABBtestMMM(rayInfo, raySlopeInfo, minCorner, maxCorner);\r
        }\r
        case u32(-16 - 4 + 1 + 32) : {\r
            return _slopeAABBtestMMP(rayInfo, raySlopeInfo, minCorner, maxCorner);\r
        }\r
        case u32(-16 + 4 - 1 + 32) : {\r
            return _slopeAABBtestMPM(rayInfo, raySlopeInfo, minCorner, maxCorner);\r
        }\r
        case u32(-16 + 4 + 1 + 32) : {\r
            return _slopeAABBtestMPP(rayInfo, raySlopeInfo, minCorner, maxCorner);\r
        }\r
        case u32(16 - 4 - 1 + 32) : {\r
            return _slopeAABBtestPMM(rayInfo, raySlopeInfo, minCorner, maxCorner);\r
        }\r
        case u32(16 - 4 + 1 + 32) : {\r
            return _slopeAABBtestPMP(rayInfo, raySlopeInfo, minCorner, maxCorner);\r
        }\r
        case u32(16 + 4 - 1 + 32) : {\r
            return _slopeAABBtestPPM(rayInfo, raySlopeInfo, minCorner, maxCorner);\r
        }\r
        case u32(16 + 4 + 1 + 32) : {\r
            return _slopeAABBtestPPP(rayInfo, raySlopeInfo, minCorner, maxCorner);\r
        }\r
        default : {\r
            switch testClass{\r
                case u32(0 - 4 - 1 + 32) : {\r
                    return _slopeAABBtestOMM(rayInfo, raySlopeInfo, minCorner, maxCorner);\r
                }\r
                case u32(0 - 4 + 1 + 32) : {\r
                    return _slopeAABBtestOMP(rayInfo, raySlopeInfo, minCorner, maxCorner);\r
                }\r
                case u32(0 + 4 - 1 + 32) : {\r
                    return _slopeAABBtestOPM(rayInfo, raySlopeInfo, minCorner, maxCorner);\r
                }\r
                case u32(0 + 4 + 1 + 32) : {\r
                    return _slopeAABBtestOPP(rayInfo, raySlopeInfo, minCorner, maxCorner);\r
                }\r
                case u32(-16 + 0 - 1 + 32) : {\r
                    return _slopeAABBtestMOM(rayInfo, raySlopeInfo, minCorner, maxCorner);\r
                }\r
                case u32(-16 + 0 + 1 + 32) : {\r
                    return _slopeAABBtestMOP(rayInfo, raySlopeInfo, minCorner, maxCorner);\r
                }\r
                case u32(16 + 0 - 1 + 32) : {\r
                    return _slopeAABBtestPOM(rayInfo, raySlopeInfo, minCorner, maxCorner);\r
                }\r
                case u32(16 + 0 + 1 + 32) : {\r
                    return _slopeAABBtestPOP(rayInfo, raySlopeInfo, minCorner, maxCorner);\r
                }\r
                case u32(-16 - 4 + 0 + 32) : {\r
                    return _slopeAABBtestMMO(rayInfo, raySlopeInfo, minCorner, maxCorner);\r
                }\r
                case u32(-16 + 4 + 0 + 32) : {\r
                    return _slopeAABBtestMPO(rayInfo, raySlopeInfo, minCorner, maxCorner);\r
                }\r
                case u32(16 - 4 + 0 + 32) : {\r
                    return _slopeAABBtestPPO(rayInfo, raySlopeInfo, minCorner, maxCorner);\r
                }\r
                case u32(16 + 4 + 0 + 32) : {\r
                    return _slopeAABBtestPPO(rayInfo, raySlopeInfo, minCorner, maxCorner);\r
                }\r
                case u32(-16 + 0 + 0 + 32) : {\r
                    return _slopeAABBtestMOO(rayInfo, raySlopeInfo, minCorner, maxCorner);\r
                }\r
                case u32(16 + 0 + 0 + 32) : {\r
                    return _slopeAABBtestPOO(rayInfo, raySlopeInfo, minCorner, maxCorner);\r
                }\r
                case u32(0 - 4 + 0 + 32) : {\r
                    return _slopeAABBtestOMO(rayInfo, raySlopeInfo, minCorner, maxCorner);\r
                }\r
                case u32(0 + 4 + 0 + 32) : {\r
                    return _slopeAABBtestOPO(rayInfo, raySlopeInfo, minCorner, maxCorner);\r
                }\r
                case u32(0 + 0 - 1 + 32) : {\r
                    return _slopeAABBtestOOM(rayInfo, raySlopeInfo, minCorner, maxCorner);\r
                }\r
                case u32(0 + 0 + 1 + 32) : {\r
                    return _slopeAABBtestOOP(rayInfo, raySlopeInfo, minCorner, maxCorner);\r
                }\r
                default : {\r
                    return false;\r
                }\r
            }\r
        }\r
    }\r
}\r
\r
fn _slopeAABBtestMMM(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {\r
\r
    let flag : bool = !(rayInfo.worldRayOrigin.x < minCorner.x ||\r
    rayInfo.worldRayOrigin.y < minCorner.y ||\r
    rayInfo.worldRayOrigin.z < minCorner.z ||\r
    raySlopeInfo.jbyi * minCorner.x - maxCorner.y + raySlopeInfo.cxy > 0 ||\r
    raySlopeInfo.ibjy * minCorner.y - maxCorner.x + raySlopeInfo.cyx > 0 ||\r
    raySlopeInfo.jbyk * minCorner.z - maxCorner.y + raySlopeInfo.czy > 0 ||\r
    raySlopeInfo.kbyj * minCorner.y - maxCorner.z + raySlopeInfo.cyz > 0 ||\r
    raySlopeInfo.kbyi * minCorner.x - maxCorner.z + raySlopeInfo.cxz > 0 ||\r
    raySlopeInfo.ibyk * minCorner.z - maxCorner.x + raySlopeInfo.czx > 0);\r
    if !flag {\r
        return false;\r
    }\r
    let distance : vec3 <f32> = (vec3 <f32> (maxCorner.x, maxCorner.y, maxCorner.z) - rayInfo.worldRayOrigin) * rayInfo.directionInverse;\r
    if max(max(distance.x, distance.y), distance.z) > rayInfo.hitDistance {\r
        return false;\r
    }\r
    return true;\r
}\r
\r
fn _slopeAABBtestMMP(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {\r
    let flag : bool = !(rayInfo.worldRayOrigin.x < minCorner.x ||\r
    rayInfo.worldRayOrigin.y < minCorner.y ||\r
    rayInfo.worldRayOrigin.z > maxCorner.z ||\r
    raySlopeInfo.jbyi * minCorner.x - maxCorner.y + raySlopeInfo.cxy > 0 ||\r
    raySlopeInfo.ibjy * minCorner.y - maxCorner.x + raySlopeInfo.cyx > 0 ||\r
    raySlopeInfo.jbyk * maxCorner.z - maxCorner.y + raySlopeInfo.czy > 0 ||\r
    raySlopeInfo.kbyj * minCorner.y - minCorner.z + raySlopeInfo.cyz < 0 ||\r
    raySlopeInfo.kbyi * minCorner.x - minCorner.z + raySlopeInfo.cxz < 0 ||\r
    raySlopeInfo.ibyk * maxCorner.z - maxCorner.x + raySlopeInfo.czx > 0);\r
    if !flag {\r
        return false;\r
    }\r
    let distance : vec3 <f32> = (vec3 <f32> (maxCorner.x, maxCorner.y, minCorner.z) - rayInfo.worldRayOrigin) * rayInfo.directionInverse;\r
    if max(max(distance.x, distance.y), distance.z) > rayInfo.hitDistance {\r
        return false;\r
    }\r
    return true;\r
}\r
\r
fn _slopeAABBtestMPM(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {\r
    let flag : bool = !(rayInfo.worldRayOrigin.x < minCorner.x ||\r
    rayInfo.worldRayOrigin.y > maxCorner.y ||\r
    rayInfo.worldRayOrigin.z < minCorner.z ||\r
    raySlopeInfo.jbyi * minCorner.x - minCorner.y + raySlopeInfo.cxy < 0 ||\r
    raySlopeInfo.ibjy * maxCorner.y - maxCorner.x + raySlopeInfo.cyx > 0 ||\r
    raySlopeInfo.jbyk * minCorner.z - minCorner.y + raySlopeInfo.czy < 0 ||\r
    raySlopeInfo.kbyj * maxCorner.y - maxCorner.z + raySlopeInfo.cyz > 0 ||\r
    raySlopeInfo.kbyi * minCorner.x - maxCorner.z + raySlopeInfo.cxz > 0 ||\r
    raySlopeInfo.ibyk * minCorner.z - maxCorner.x + raySlopeInfo.czx > 0);\r
    if !flag {\r
        return false;\r
    }\r
    let distance : vec3 <f32> = (vec3 <f32> (maxCorner.x, minCorner.y, maxCorner.z) - rayInfo.worldRayOrigin) * rayInfo.directionInverse;\r
    if max(max(distance.x, distance.y), distance.z) > rayInfo.hitDistance {\r
        return false;\r
    }\r
    return true;\r
}\r
\r
fn _slopeAABBtestMPP(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {\r
    let flag : bool = !(rayInfo.worldRayOrigin.x < minCorner.x ||\r
    rayInfo.worldRayOrigin.y > maxCorner.y ||\r
    rayInfo.worldRayOrigin.z > maxCorner.z ||\r
    raySlopeInfo.jbyi * minCorner.x - minCorner.y + raySlopeInfo.cxy < 0 ||\r
    raySlopeInfo.ibjy * maxCorner.y - maxCorner.x + raySlopeInfo.cyx > 0 ||\r
    raySlopeInfo.jbyk * maxCorner.z - minCorner.y + raySlopeInfo.czy < 0 ||\r
    raySlopeInfo.kbyj * maxCorner.y - minCorner.z + raySlopeInfo.cyz < 0 ||\r
    raySlopeInfo.kbyi * minCorner.x - minCorner.z + raySlopeInfo.cxz < 0 ||\r
    raySlopeInfo.ibyk * maxCorner.z - maxCorner.x + raySlopeInfo.czx > 0);\r
    if !flag {\r
        return false;\r
    }\r
    let distance : vec3 <f32> = (vec3 <f32> (maxCorner.x, minCorner.y, minCorner.z) - rayInfo.worldRayOrigin) * rayInfo.directionInverse;\r
    if max(max(distance.x, distance.y), distance.z) > rayInfo.hitDistance {\r
        return false;\r
    }\r
    return true;\r
}\r
\r
fn _slopeAABBtestPMM(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {\r
    let flag : bool = !(rayInfo.worldRayOrigin.x > maxCorner.x ||\r
    rayInfo.worldRayOrigin.y < minCorner.y ||\r
    rayInfo.worldRayOrigin.z < minCorner.z ||\r
    raySlopeInfo.jbyi * maxCorner.x - maxCorner.y + raySlopeInfo.cxy > 0 ||\r
    raySlopeInfo.ibjy * minCorner.y - minCorner.x + raySlopeInfo.cyx < 0 ||\r
    raySlopeInfo.jbyk * minCorner.z - maxCorner.y + raySlopeInfo.czy > 0 ||\r
    raySlopeInfo.kbyj * minCorner.y - maxCorner.z + raySlopeInfo.cyz > 0 ||\r
    raySlopeInfo.kbyi * maxCorner.x - maxCorner.z + raySlopeInfo.cxz > 0 ||\r
    raySlopeInfo.ibyk * minCorner.z - minCorner.x + raySlopeInfo.czx < 0);\r
    if !flag {\r
        return false;\r
    }\r
    let distance : vec3 <f32> = (vec3 <f32> (minCorner.x, maxCorner.y, maxCorner.z) - rayInfo.worldRayOrigin) * rayInfo.directionInverse;\r
    if max(max(distance.x, distance.y), distance.z) > rayInfo.hitDistance {\r
        return false;\r
    }\r
    return true;\r
}\r
\r
fn _slopeAABBtestPMP(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {\r
    let flag : bool = !(rayInfo.worldRayOrigin.x > maxCorner.x ||\r
    rayInfo.worldRayOrigin.y < minCorner.y ||\r
    rayInfo.worldRayOrigin.z > maxCorner.z ||\r
    raySlopeInfo.jbyi * maxCorner.x - maxCorner.y + raySlopeInfo.cxy > 0 ||\r
    raySlopeInfo.ibjy * minCorner.y - minCorner.x + raySlopeInfo.cyx < 0 ||\r
    raySlopeInfo.jbyk * maxCorner.z - maxCorner.y + raySlopeInfo.czy > 0 ||\r
    raySlopeInfo.kbyj * minCorner.y - minCorner.z + raySlopeInfo.cyz < 0 ||\r
    raySlopeInfo.kbyi * maxCorner.x - minCorner.z + raySlopeInfo.cxz < 0 ||\r
    raySlopeInfo.ibyk * maxCorner.z - minCorner.x + raySlopeInfo.czx < 0);\r
    if !flag {\r
        return false;\r
    }\r
    let distance : vec3 <f32> = (vec3 <f32> (minCorner.x, maxCorner.y, minCorner.z) - rayInfo.worldRayOrigin) * rayInfo.directionInverse;\r
    if max(max(distance.x, distance.y), distance.z) > rayInfo.hitDistance {\r
        return false;\r
    }\r
    return true;\r
}\r
\r
fn _slopeAABBtestPPM(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {\r
    let flag : bool = !(rayInfo.worldRayOrigin.x > maxCorner.x ||\r
    rayInfo.worldRayOrigin.y > maxCorner.y ||\r
    rayInfo.worldRayOrigin.z < minCorner.z ||\r
    raySlopeInfo.jbyi * maxCorner.x - minCorner.y + raySlopeInfo.cxy < 0 ||\r
    raySlopeInfo.ibjy * maxCorner.y - minCorner.x + raySlopeInfo.cyx < 0 ||\r
    raySlopeInfo.jbyk * minCorner.z - minCorner.y + raySlopeInfo.czy < 0 ||\r
    raySlopeInfo.kbyj * maxCorner.y - maxCorner.z + raySlopeInfo.cyz > 0 ||\r
    raySlopeInfo.kbyi * maxCorner.x - maxCorner.z + raySlopeInfo.cxz > 0 ||\r
    raySlopeInfo.ibyk * minCorner.z - minCorner.x + raySlopeInfo.czx < 0);\r
    if !flag {\r
        return false;\r
    }\r
    let distance : vec3 <f32> = (vec3 <f32> (minCorner.x, minCorner.y, maxCorner.z) - rayInfo.worldRayOrigin) * rayInfo.directionInverse;\r
    if max(max(distance.x, distance.y), distance.z) > rayInfo.hitDistance {\r
        return false;\r
    }\r
    return true;\r
}\r
\r
fn _slopeAABBtestPPP(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {\r
    let flag : bool = !(rayInfo.worldRayOrigin.x > maxCorner.x ||\r
    rayInfo.worldRayOrigin.y > maxCorner.y ||\r
    rayInfo.worldRayOrigin.z > maxCorner.z ||\r
    raySlopeInfo.jbyi * maxCorner.x - minCorner.y + raySlopeInfo.cxy < 0 ||\r
    raySlopeInfo.ibjy * maxCorner.y - minCorner.x + raySlopeInfo.cyx < 0 ||\r
    raySlopeInfo.jbyk * maxCorner.z - minCorner.y + raySlopeInfo.czy < 0 ||\r
    raySlopeInfo.kbyj * maxCorner.y - minCorner.z + raySlopeInfo.cyz < 0 ||\r
    raySlopeInfo.kbyi * maxCorner.x - minCorner.z + raySlopeInfo.cxz < 0 ||\r
    raySlopeInfo.ibyk * maxCorner.z - minCorner.x + raySlopeInfo.czx < 0);\r
    if !flag {\r
        return false;\r
    }\r
    let distance : vec3 <f32> = (vec3 <f32> (minCorner.x, minCorner.y, minCorner.z) - rayInfo.worldRayOrigin) * rayInfo.directionInverse;\r
    if max(max(distance.x, distance.y), distance.z) > rayInfo.hitDistance {\r
        return false;\r
    }\r
    return true;\r
}\r
\r
fn _slopeAABBtestOMM(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {\r
    let flag : bool = !(rayInfo.worldRayOrigin.x < minCorner.x ||\r
    rayInfo.worldRayOrigin.x > maxCorner.x ||\r
    rayInfo.worldRayOrigin.y < minCorner.y ||\r
    rayInfo.worldRayOrigin.z < minCorner.z ||\r
    raySlopeInfo.jbyk * minCorner.z - maxCorner.y + raySlopeInfo.czy > 0 ||\r
    raySlopeInfo.kbyj * minCorner.y - maxCorner.z + raySlopeInfo.cyz > 0);\r
    if !flag {\r
        return false;\r
    }\r
    let distance : vec2 <f32> = (vec2 <f32> (maxCorner.y, maxCorner.z) - rayInfo.worldRayOrigin.yz) * rayInfo.directionInverse.yz;\r
    if max(distance.x, distance.y) > rayInfo.hitDistance {\r
        return false;\r
    }\r
    return true;\r
}\r
\r
fn _slopeAABBtestOMP(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {\r
    let flag : bool = !(rayInfo.worldRayOrigin.x < minCorner.x ||\r
    rayInfo.worldRayOrigin.x > maxCorner.x ||\r
    rayInfo.worldRayOrigin.y < minCorner.y ||\r
    rayInfo.worldRayOrigin.z > maxCorner.z ||\r
    raySlopeInfo.jbyk * maxCorner.z - maxCorner.y + raySlopeInfo.czy > 0 ||\r
    raySlopeInfo.kbyj * minCorner.y - minCorner.z + raySlopeInfo.cyz < 0);\r
    if !flag {\r
        return false;\r
    }\r
    let distance : vec2 <f32> = (vec2 <f32> (maxCorner.y, minCorner.z) - rayInfo.worldRayOrigin.yz) * rayInfo.directionInverse.yz;\r
    if max(distance.x, distance.y) > rayInfo.hitDistance {\r
        return false;\r
    }\r
    return true;\r
}\r
\r
fn _slopeAABBtestOPM(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {\r
    let flag : bool = !(rayInfo.worldRayOrigin.x < minCorner.x ||\r
    rayInfo.worldRayOrigin.x > maxCorner.x ||\r
    rayInfo.worldRayOrigin.y > maxCorner.y ||\r
    rayInfo.worldRayOrigin.z < minCorner.z ||\r
    raySlopeInfo.jbyk * minCorner.z - minCorner.y + raySlopeInfo.czy < 0 ||\r
    raySlopeInfo.kbyj * maxCorner.y - maxCorner.z + raySlopeInfo.cyz > 0);\r
    if !flag {\r
        return false;\r
    }\r
    let distance : vec2 <f32> = (vec2 <f32> (minCorner.y, maxCorner.z) - rayInfo.worldRayOrigin.yz) * rayInfo.directionInverse.yz;\r
    if max(distance.x, distance.y) > rayInfo.hitDistance {\r
        return false;\r
    }\r
    return true;\r
}\r
\r
fn _slopeAABBtestOPP(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {\r
    let flag : bool = !(rayInfo.worldRayOrigin.x < minCorner.x ||\r
    rayInfo.worldRayOrigin.x > maxCorner.x ||\r
    rayInfo.worldRayOrigin.y > maxCorner.y ||\r
    rayInfo.worldRayOrigin.z > maxCorner.z ||\r
    raySlopeInfo.jbyk * maxCorner.z - minCorner.y + raySlopeInfo.czy < 0 ||\r
    raySlopeInfo.kbyj * maxCorner.y - minCorner.z + raySlopeInfo.cyz < 0);\r
    if !flag {\r
        return false;\r
    }\r
    let distance : vec2 <f32> = (vec2 <f32> (minCorner.y, minCorner.z) - rayInfo.worldRayOrigin.yz) * rayInfo.directionInverse.yz;\r
    if max(distance.x, distance.y) > rayInfo.hitDistance {\r
        return false;\r
    }\r
    return true;\r
}\r
\r
fn _slopeAABBtestMOM(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {\r
    let flag : bool = !(rayInfo.worldRayOrigin.y < minCorner.y ||\r
    rayInfo.worldRayOrigin.y > maxCorner.y ||\r
    rayInfo.worldRayOrigin.x < minCorner.x ||\r
    rayInfo.worldRayOrigin.z < minCorner.z ||\r
    raySlopeInfo.kbyi * minCorner.x - maxCorner.z + raySlopeInfo.cxz > 0 ||\r
    raySlopeInfo.ibyk * minCorner.z - maxCorner.x + raySlopeInfo.czx > 0);\r
    if !flag {\r
        return false;\r
    }\r
    let distance : vec2 <f32> = (vec2 <f32> (maxCorner.x, maxCorner.z) - rayInfo.worldRayOrigin.xz) * rayInfo.directionInverse.xz;\r
    if max(distance.x, distance.y) > rayInfo.hitDistance {\r
        return false;\r
    }\r
    return true;\r
}\r
\r
fn _slopeAABBtestMOP(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {\r
    let flag : bool = !(rayInfo.worldRayOrigin.y < minCorner.y ||\r
    rayInfo.worldRayOrigin.y > maxCorner.y ||\r
    rayInfo.worldRayOrigin.x < minCorner.x ||\r
    rayInfo.worldRayOrigin.z > maxCorner.z ||\r
    raySlopeInfo.kbyi * minCorner.x - minCorner.z + raySlopeInfo.cxz < 0 ||\r
    raySlopeInfo.ibyk * maxCorner.z - maxCorner.x + raySlopeInfo.czx > 0);\r
    if !flag {\r
        return false;\r
    }\r
    let distance : vec2 <f32> = (vec2 <f32> (maxCorner.x, minCorner.z) - rayInfo.worldRayOrigin.xz) * rayInfo.directionInverse.xz;\r
    if max(distance.x, distance.y) > rayInfo.hitDistance {\r
        return false;\r
    }\r
    return true;\r
}\r
\r
fn _slopeAABBtestPOM(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {\r
    let flag : bool = !(rayInfo.worldRayOrigin.y < minCorner.y ||\r
    rayInfo.worldRayOrigin.y > maxCorner.y ||\r
    rayInfo.worldRayOrigin.x > maxCorner.x ||\r
    rayInfo.worldRayOrigin.z < minCorner.z ||\r
    raySlopeInfo.kbyi * maxCorner.x - maxCorner.z + raySlopeInfo.cxz > 0 ||\r
    raySlopeInfo.ibyk * minCorner.z - minCorner.x + raySlopeInfo.czx < 0);\r
    if !flag {\r
        return false;\r
    }\r
    let distance : vec2 <f32> = (vec2 <f32> (minCorner.x, maxCorner.z) - rayInfo.worldRayOrigin.xz) * rayInfo.directionInverse.xz;\r
    if max(distance.x, distance.y) > rayInfo.hitDistance {\r
        return false;\r
    }\r
    return true;\r
}\r
\r
fn _slopeAABBtestPOP(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {\r
    let flag : bool = !(rayInfo.worldRayOrigin.y < minCorner.y ||\r
    rayInfo.worldRayOrigin.y > maxCorner.y ||\r
    rayInfo.worldRayOrigin.x > maxCorner.x ||\r
    rayInfo.worldRayOrigin.z > maxCorner.z ||\r
    raySlopeInfo.kbyi * maxCorner.x - minCorner.z + raySlopeInfo.cxz < 0 ||\r
    raySlopeInfo.ibyk * maxCorner.z - minCorner.x + raySlopeInfo.czx < 0);\r
    if !flag {\r
        return false;\r
    }\r
    let distance : vec2 <f32> = (vec2 <f32> (minCorner.x, minCorner.z) - rayInfo.worldRayOrigin.xz) * rayInfo.directionInverse.xz;\r
    if max(distance.x, distance.y) > rayInfo.hitDistance {\r
        return false;\r
    }\r
    return true;\r
}\r
\r
fn _slopeAABBtestMMO(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {\r
    let flag : bool = !(rayInfo.worldRayOrigin.z < minCorner.z ||\r
    rayInfo.worldRayOrigin.z > maxCorner.z ||\r
    rayInfo.worldRayOrigin.x < minCorner.x ||\r
    rayInfo.worldRayOrigin.y < minCorner.y);\r
    if !flag {\r
        return false;\r
    }\r
    let distance : vec2 <f32> = (vec2 <f32> (maxCorner.x, maxCorner.y) - rayInfo.worldRayOrigin.xy) * rayInfo.directionInverse.xy;\r
    if max(distance.x, distance.y) > rayInfo.hitDistance {\r
        return false;\r
    }\r
    return true;\r
}\r
\r
fn _slopeAABBtestMPO(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {\r
    let flag : bool = !(rayInfo.worldRayOrigin.z < minCorner.z ||\r
    rayInfo.worldRayOrigin.z > maxCorner.z ||\r
    rayInfo.worldRayOrigin.x < minCorner.x ||\r
    rayInfo.worldRayOrigin.y > maxCorner.y);\r
    if !flag {\r
        return false;\r
    }\r
    let distance : vec2 <f32> = (vec2 <f32> (maxCorner.x, minCorner.y) - rayInfo.worldRayOrigin.xy) * rayInfo.directionInverse.xy;\r
    if max(distance.x, distance.y) > rayInfo.hitDistance {\r
        return false;\r
    }\r
    return true;\r
}\r
\r
fn _slopeAABBtestPPO(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {\r
    let flag : bool = !(rayInfo.worldRayOrigin.z < minCorner.z ||\r
    rayInfo.worldRayOrigin.z > maxCorner.z ||\r
    rayInfo.worldRayOrigin.x > maxCorner.x ||\r
    rayInfo.worldRayOrigin.y > maxCorner.y);\r
    if !flag {\r
        return false;\r
    }\r
    let distance : vec2 <f32> = (vec2 <f32> (minCorner.x, minCorner.y) - rayInfo.worldRayOrigin.xy) * rayInfo.directionInverse.xy;\r
    if max(distance.x, distance.y) > rayInfo.hitDistance {\r
        return false;\r
    }\r
    return true;\r
}\r
\r
fn _slopeAABBtestMOO(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {\r
    let flag : bool = !(rayInfo.worldRayOrigin.x < minCorner.x ||\r
    rayInfo.worldRayOrigin.y < minCorner.y ||\r
    rayInfo.worldRayOrigin.y > maxCorner.y ||\r
    rayInfo.worldRayOrigin.z < minCorner.z ||\r
    rayInfo.worldRayOrigin.z > maxCorner.z);\r
    if !flag {\r
        return false;\r
    }\r
    let distance : f32 = (maxCorner.x - rayInfo.worldRayOrigin.x) * rayInfo.directionInverse.x;\r
    if distance > rayInfo.hitDistance {\r
        return false;\r
    }\r
    return true;\r
}\r
\r
fn _slopeAABBtestPOO(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {\r
    let flag : bool = !(rayInfo.worldRayOrigin.x > maxCorner.x ||\r
    rayInfo.worldRayOrigin.y < minCorner.y ||\r
    rayInfo.worldRayOrigin.y > maxCorner.y ||\r
    rayInfo.worldRayOrigin.z < minCorner.z ||\r
    rayInfo.worldRayOrigin.z > maxCorner.z);\r
    if !flag {\r
        return false;\r
    }\r
    let distance : f32 = (minCorner.x - rayInfo.worldRayOrigin.x) * rayInfo.directionInverse.x;\r
    if distance > rayInfo.hitDistance {\r
        return false;\r
    }\r
    return true;\r
}\r
\r
fn _slopeAABBtestOMO(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {\r
    let flag : bool = !(rayInfo.worldRayOrigin.y < minCorner.y ||\r
    rayInfo.worldRayOrigin.x < minCorner.x ||\r
    rayInfo.worldRayOrigin.x > maxCorner.x ||\r
    rayInfo.worldRayOrigin.z < minCorner.z ||\r
    rayInfo.worldRayOrigin.z > maxCorner.z);\r
    if !flag {\r
        return false;\r
    }\r
    let distance : f32 = (maxCorner.y - rayInfo.worldRayOrigin.y) * rayInfo.directionInverse.y;\r
    if distance > rayInfo.hitDistance {\r
        return false;\r
    }\r
    return true;\r
}\r
\r
fn _slopeAABBtestOPO(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {\r
    let flag : bool = !(rayInfo.worldRayOrigin.y > maxCorner.y ||\r
    rayInfo.worldRayOrigin.x < minCorner.x ||\r
    rayInfo.worldRayOrigin.x > maxCorner.x ||\r
    rayInfo.worldRayOrigin.z < minCorner.z ||\r
    rayInfo.worldRayOrigin.z > maxCorner.z);\r
    if !flag {\r
        return false;\r
    }\r
    let distance : f32 = (minCorner.y - rayInfo.worldRayOrigin.y) * rayInfo.directionInverse.y;\r
    if distance > rayInfo.hitDistance {\r
        return false;\r
    }\r
    return true;\r
}\r
\r
fn _slopeAABBtestOOM(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {\r
    let flag : bool = !(rayInfo.worldRayOrigin.z < minCorner.z ||\r
    rayInfo.worldRayOrigin.x < minCorner.x ||\r
    rayInfo.worldRayOrigin.x > maxCorner.x ||\r
    rayInfo.worldRayOrigin.y < minCorner.y ||\r
    rayInfo.worldRayOrigin.y > maxCorner.y);\r
    if !flag {\r
        return false;\r
    }\r
    let distance : f32 = (maxCorner.z - rayInfo.worldRayOrigin.z) * rayInfo.directionInverse.z;\r
    if distance > rayInfo.hitDistance {\r
        return false;\r
    }\r
    return true;\r
}\r
\r
fn _slopeAABBtestOOP(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {\r
    let flag : bool = !(rayInfo.worldRayOrigin.z > maxCorner.z ||\r
    rayInfo.worldRayOrigin.x < minCorner.x ||\r
    rayInfo.worldRayOrigin.x > maxCorner.x ||\r
    rayInfo.worldRayOrigin.y < minCorner.y ||\r
    rayInfo.worldRayOrigin.y > maxCorner.y);\r
    if !flag {\r
        return false;\r
    }\r
    let distance : f32 = (minCorner.z - rayInfo.worldRayOrigin.z) * rayInfo.directionInverse.z;\r
    if distance > rayInfo.hitDistance {\r
        return false;\r
    }\r
    return true;\r
}\r
`,fo=`@group(0) @binding(0) var frame : texture_storage_2d<rgba16float, write>;\r
@group(0) @binding(1) var<uniform> ubo: UBO;\r
@group(0) @binding(2) var<storage, read> gBufferTex : array<vec2u>;\r
@group(0) @binding(3) var<storage, read> gBufferAttri : array<vec4f>;\r
\r
\r
// #include <common.wgsl>;\r
// #include <reservoir.wgsl>;\r
// #include <light.wgsl>;\r
// #include <BSDF.wgsl>;\r
\r
override ENABLE_GI: bool = true;\r
\r
@compute @workgroup_size(8, 8, 1)\r
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3u) {\r
    let screen_size: vec2u = textureDimensions(frame);\r
    if any(GlobalInvocationID.xy >= screen_size) {\r
        return;\r
    }\r
    var color = vec3f(0.0);\r
    let origin = ubo.origin;\r
\r
    let screen_pos = vec2f(GlobalInvocationID.xy) + 0.5;\r
    let launchIndex = u32(screen_pos.y) * screen_size.x + u32(screen_pos.x);\r
    var reservoirDI = ReservoirDI();\r
    var reservoirGI = ReservoirGI();\r
    var _seed: u32;\r
    loadReservoir(&previousReservoir, launchIndex, &reservoirDI, &reservoirGI, &_seed);\r
\r
    if reservoirDI.W < 0.0 {\r
        textureStore(frame, GlobalInvocationID.xy, vec4f(0.));\r
    }\r
    seed = tea(GlobalInvocationID.y * screen_size.x + GlobalInvocationID.x, _seed, 4);\r
    var pointInfo: PointInfo;\r
    loadGBuffer(launchIndex, &pointInfo);\r
\r
    var geometryTerm_luminance: f32;\r
    var bsdfLuminance: f32;\r
    var pHat: f32;\r
    var light: Light;\r
    let shadingPoint = pointInfo.pos;\r
    var wi = normalize(origin - shadingPoint);\r
    var depth = distance(shadingPoint, origin);\r
    var wo: vec3f;\r
    var dist: f32;\r
    // const bias2: array<vec2f, 8 > = array<vec2f, 8>(vec2f(-1.0, 1.0), vec2f(0.0, 1.0), vec2f(1.0, 0.0), vec2f(1.0, 1.0), vec2f(-1.0, 0.0), vec2f(0.0, -1.0), vec2f(-1.0, -1.0), vec2f(1.0, -1.0));\r
    for (var i = 0u; i < 5; i = i + 1u) {\r
        let neighbor_pos = screen_pos + samplingDisk() * 20.0;\r
        // let neighbor_pos = screen_pos + bias2[i] * 2.;\r
        if any(neighbor_pos < vec2f(0.0)) || any(neighbor_pos >= vec2f(screen_size)) {\r
            continue;\r
        }\r
        let neighbor_launchIndex = u32(neighbor_pos.y) * screen_size.x + u32(neighbor_pos.x);\r
        var neighbor_reservoirDI = ReservoirDI();\r
        var neighbor_reservoirGI = ReservoirGI();\r
        loadReservoir(&previousReservoir, neighbor_launchIndex, &neighbor_reservoirDI, &neighbor_reservoirGI, &_seed);\r
        let neighbour_pointAttri: PointAttri = loadGBufferAttri(&gBufferAttri, neighbor_launchIndex);\r
        // check plane distance\r
        let posDiff = pointInfo.pos - neighbour_pointAttri.pos;\r
        let planeDist = abs(dot(posDiff, pointInfo.normalShading));\r
        if planeDist < 0.04 && dot(pointInfo.normalShading, neighbour_pointAttri.normalShading) > .8 {\r
            // color += vec3f(0.2);\r
            if neighbor_reservoirDI.W > 0. {\r
                light = getLight(neighbor_reservoirDI.lightId);\r
                wo = light.position - pointInfo.pos;\r
                dist = length(wo);\r
                wo = normalize(wo);\r
                if dot(wo, pointInfo.normalShading) > 0. {\r
                // color += vec3f(0.2);\r
                    neighbor_reservoirDI.M = min(neighbor_reservoirDI.M, 256);\r
                    geometryTerm_luminance = light.intensity / (dist * dist);\r
                    bsdfLuminance = BSDFLuminance(pointInfo, wo, wi);\r
                    pHat = geometryTerm_luminance * bsdfLuminance;\r
                    neighbor_reservoirDI.w_sum = pHat * neighbor_reservoirDI.W * f32(neighbor_reservoirDI.M);\r
                    combineReservoirsDI(&reservoirDI, neighbor_reservoirDI);\r
                }\r
            }\r
            if ENABLE_GI {\r
                wo = neighbor_reservoirGI.xs - pointInfo.pos;\r
                dist = length(wo);\r
                wo = normalize(wo);\r
                if dot(wo, pointInfo.normalShading) > 0. {\r
                    neighbor_reservoirGI.M = min(neighbor_reservoirGI.M, 200);\r
                    // pHat = luminance(neighbor_reservoirGI.Lo) / Jacobian(pointInfo.pos, neighbor_reservoirGI);\r
                    pHat = luminance(neighbor_reservoirGI.Lo);\r
                    neighbor_reservoirGI.w_sum = pHat * neighbor_reservoirGI.W * f32(neighbor_reservoirGI.M);\r
                    combineReservoirsGI(&reservoirGI, neighbor_reservoirGI);\r
                }\r
            }\r
        }\r
    }\r
    // compute Weight\r
        {\r
        light = getLight(reservoirDI.lightId);\r
        wo = light.position - pointInfo.pos;\r
        dist = length(wo);\r
        wo = normalize(wo);\r
        geometryTerm_luminance = light.intensity / (dist * dist);\r
        bsdfLuminance = BSDFLuminance(pointInfo, wo, wi);\r
        pHat = geometryTerm_luminance * bsdfLuminance;\r
        if pHat <= 0.0 {\r
            reservoirDI.W = 0.0;\r
            reservoirDI.w_sum = 0.0;\r
        } else {\r
            reservoirDI.W = reservoirDI.w_sum / max(0.001, pHat) / f32(reservoirDI.M);\r
        }\r
        if ENABLE_GI {\r
            reservoirGI.W = reservoirGI.w_sum / max(0.001, luminance(reservoirGI.Lo)) / f32(reservoirGI.M);\r
        }\r
    }\r
\r
\r
    // textureStore(frame, GlobalInvocationID.xy, vec4f(color, 1.));\r
    storeReservoir(&currentReservoir, launchIndex, reservoirDI, reservoirGI, seed);\r
}`,po=`@group(0) @binding(0) var frame : texture_storage_2d<rgba16float, write>;\r
@group(0) @binding(1) var<uniform> ubo: UBO;\r
@group(0) @binding(2) var<storage, read> gBufferTex : array<vec2u>;\r
@group(0) @binding(3) var<storage, read> gBufferAttri : array<vec4f>;\r
\r
\r
// #include <common.wgsl>;\r
// #include <trace.wgsl>;\r
// #include <reservoir.wgsl>;\r
// #include <light.wgsl>;\r
// #include <BSDF.wgsl>;\r
\r
override ENABLE_GI: bool = true;\r
\r
@compute @workgroup_size(8, 8, 1)\r
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3u) {\r
    let screen_size: vec2u = textureDimensions(frame);\r
    if any(GlobalInvocationID.xy >= screen_size) {\r
        return;\r
    }\r
    var color = vec3f(0.0);\r
    let origin = ubo.origin;\r
\r
    let launchIndex = GlobalInvocationID.y * screen_size.x + GlobalInvocationID.x;\r
    var reservoirDI = ReservoirDI();\r
    var reservoirGI = ReservoirGI();\r
\r
    var _seed: u32;\r
    loadReservoir(&previousReservoir, launchIndex, &reservoirDI, &reservoirGI, &_seed);\r
\r
    if reservoirDI.W < 0.0 {\r
        textureStore(frame, GlobalInvocationID.xy, vec4f(0.));\r
    }\r
    seed = tea(GlobalInvocationID.y * screen_size.x + GlobalInvocationID.x, _seed, 4);\r
    var pointInfo: PointInfo;\r
    loadGBuffer(launchIndex, &pointInfo);\r
\r
    var bsdf = vec3f(0.0);\r
    var geometryTerm = vec3f(1.0);\r
    var light = getLight(reservoirDI.lightId);\r
    let shadingPoint = pointInfo.pos;\r
    var wi = normalize(origin - shadingPoint);\r
    var wo = light.position - shadingPoint;\r
    var dist = length(wo);\r
    wo = normalize(wo);\r
    if reservoirDI.W > 0. {\r
        if traceShadowRay(shadingPoint, wo, dist) {\r
            reservoirDI.W = 0.;\r
            reservoirDI.w_sum = 0.;\r
        } else {\r
            bsdf = BSDF(pointInfo, wo, wi);\r
            geometryTerm = light.color * light.intensity / (dist * dist);\r
        }\r
        color += reservoirDI.W * bsdf * geometryTerm;\r
    }\r
    if ENABLE_GI {\r
        if reservoirGI.W > 0 {\r
            wo = reservoirGI.xs - shadingPoint;\r
            dist = length(wo);\r
            wo = normalize(wo);\r
        // color = reservoirGI.Lo;\r
            if traceShadowRay(shadingPoint, wo, dist) {\r
                reservoirGI.W = 0.;\r
                reservoirGI.w_sum = 0.;\r
            } else {\r
                bsdf = BSDF(pointInfo, wo, wi);\r
                geometryTerm = reservoirGI.Lo;\r
                // geometryTerm = reservoirGI.Lo / Jacobian(shadingPoint, reservoirGI);\r
                color += reservoirGI.W * bsdf * geometryTerm * 4.;\r
            }\r
        }\r
    }\r
    textureStore(frame, GlobalInvocationID.xy, vec4f(color, 1.));\r
}`,mo=`@group(0) @binding(0) var currentDisplay : texture_storage_2d<displayFormat, write>;\r
@group(0) @binding(1) var previouDisplay: texture_2d<f32>;\r
@group(0) @binding(2) var samp : sampler;\r
@group(0) @binding(3) var vBuffer : texture_2d<u32>;\r
@group(0) @binding(4) var depthBuffer : texture_depth_2d;\r
@group(0) @binding(5) var currentFrame : texture_2d<f32>;\r
@group(0) @binding(6) var previousFrame : texture_2d<f32>;\r
\r
override zNear: f32 = 0.01;\r
override zFar: f32 = 50.0;\r
\r
@compute @workgroup_size(8, 8, 1)\r
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3u) {\r
    let screen_size: vec2u = textureDimensions(currentDisplay);\r
    let screen_pos: vec2u = vec2u(GlobalInvocationID.xy);\r
    if screen_pos.x >= screen_size.x || screen_pos.y >= screen_size.y {\r
        return;\r
    }\r
    let origin_size: vec2u = textureDimensions(currentFrame);\r
    let scale_ratio: f32 = f32(screen_size.x) / f32(origin_size.x);\r
    let origin_pos: vec2u = vec2u(vec2f(screen_pos) / scale_ratio);\r
\r
    // linear depth\r
    let depth = (textureSampleLevel(depthBuffer, samp, vec2f(origin_pos) / vec2f(origin_size), 0) + 1.0) / 2.0;\r
    // let depth = (textureLoad(depthBuffer, origin_pos, 0) + 1.0) / 2.0;\r
    let zlinear = zNear * zFar / (zFar + depth * (zNear - zFar));\r
    // textureStore(currentDisplay, screen_pos, vec4f(vec3f(zlinear / 20.0), 1.0));\r
\r
    // vbuffer \r
    var visibility: vec4u = textureLoad(vBuffer, origin_pos, 0);\r
    let betagamma = bitcast<vec2f>(visibility.xy);\r
    let barycentric = vec3f(1.0 - betagamma.x - betagamma.y, betagamma.x, betagamma.y);\r
    // textureStore(currentDisplay, screen_pos, vec4f(barycentric, 1.0));\r
\r
    // [0, width] x [0, height] range of motion vector\r
    // .------> X\r
    // |\r
    // v\r
    // Y\r
    let motionVec: vec2f = unpack2x16snorm(visibility.w) * vec2f(origin_size.xy);\r
    // textureStore(currentDisplay, screen_pos, vec4f(motionVec.xy * 0.05 + 0.5, 0.0, 1.0));\r
    let trianlgeID = visibility.z;\r
    // textureStore(currentDisplay, screen_pos, vec4f(vec3f(f32(visibility.z) / 3.), 1.));\r
\r
    // raytracing depth\r
    var color = vec4f(0.0, 0.0, 0.0, 1.0);\r
    // if screen_pos.x < screen_size.x / 2 {\r
    color = textureLoad(currentFrame, origin_pos, 0);\r
    // } else {\r
    //     color = textureSampleLevel(previousFrame, samp, vec2f(origin_pos) / vec2f(origin_size), 0);\r
    // }\r
    textureStore(currentDisplay, screen_pos, color);\r
}`,yo=(u,e)=>u.replace(/\/\/ #include\s+<(.*?)>;/g,(t,r)=>e[r]);class go{shaders={"basic.instanced.vert.wgsl":Qs,"position.frag.wgsl":eo,"compute.position.wgsl":to,"light.wgsl":io,"lightUpdate.wgsl":no,"common.wgsl":so,"sampleInit.wgsl":oo,"reservoir.wgsl":ao,"trace.wgsl":lo,"BSDF.wgsl":ho,"vBuffer.wgsl":ro,"rayGen.wgsl":co,"display.wgsl":mo,"slopeAABBTest.wgsl":uo,"spatialReuse.wgsl":fo,"accumulate.wgsl":po};constructor(){for(const e in this.shaders){let t=0;for(;this.shaders[e].includes("#include");)if(this.shaders[e]=yo(this.shaders[e],this.shaders),t++>10)throw new Error("Too deep include chain in shader: "+e)}}get(e){return this.shaders[e]}}const Yt=new go;class xo{displayPipeline;displayBindGroup;displayPipelineLayout;displayBindGroupLayout;bindGroupEntries;device;vBuffer;depthTexture;previousDisplayBuffer;currentFrameBuffer;previousFrameBuffer;sampler;constructor(e,t,r){this.device=e,this.vBuffer=t.vBuffer,this.depthTexture=t.depthTexture,this.previousDisplayBuffer=t.previousDisplayBuffer,this.currentFrameBuffer=t.currentFrameBuffer,this.previousFrameBuffer=t.previousFrameBuffer,this.displayBindGroupLayout=e.device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,storageTexture:{access:"write-only",format:e.format}},{binding:1,visibility:GPUShaderStage.COMPUTE,texture:{}},{binding:2,visibility:GPUShaderStage.COMPUTE,sampler:{}},{binding:3,visibility:GPUShaderStage.COMPUTE,texture:{sampleType:"uint"}},{binding:4,visibility:GPUShaderStage.COMPUTE,texture:{sampleType:"depth"}},{binding:5,visibility:GPUShaderStage.COMPUTE,texture:{sampleType:"float"}},{binding:6,visibility:GPUShaderStage.COMPUTE,texture:{sampleType:"float"}}]}),this.sampler=e.device.createSampler({addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge",magFilter:"nearest",minFilter:"nearest"}),this.bindGroupEntries=[{binding:0,resource:this.device.context.getCurrentTexture().createView()},{binding:1,resource:this.previousDisplayBuffer.createView()},{binding:2,resource:this.sampler},{binding:3,resource:this.vBuffer.createView()},{binding:4,resource:this.depthTexture.createView()},{binding:5,resource:this.currentFrameBuffer.createView()},{binding:6,resource:this.previousFrameBuffer.createView()}],this.displayPipelineLayout=e.device.createPipelineLayout({bindGroupLayouts:[this.displayBindGroupLayout]}),this.displayPipeline=e.device.createComputePipeline({layout:this.displayPipelineLayout,compute:{module:e.device.createShaderModule({label:"display.wgsl",code:Yt.get("display.wgsl").replace("displayFormat",e.format)}),entryPoint:"main",constants:{zNear:r.camera.near,zFar:r.camera.far}}})}record(e){this.bindGroupEntries[0].resource=this.device.context.getCurrentTexture().createView(),this.displayBindGroup=this.device.device.createBindGroup({layout:this.displayBindGroupLayout,entries:this.bindGroupEntries});const t=e.beginComputePass();t.setPipeline(this.displayPipeline),t.setBindGroup(0,this.displayBindGroup),t.dispatchWorkgroups(Math.ceil(this.device.canvas.width/8),Math.ceil(this.device.canvas.height/8),1),t.end()}}/**
 * @license
 * Copyright 2010-2023 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const fs="162",ct={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},ut={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},Pr=0,bo=1,wo=2,ii=1,si=100,oi=204,ai=205,li=3,vo=0,hi="attached",Io="detached",ps=300,$t=1e3,qt=1001,bn=1002,Qt=1003,_o=1004,Mo=1005,Rn=1006,Ao=1007,zn=1008,So=1009,To=1014,kn=1015,Co=1020,ms=1023,Ur=1026,ci=1027,Ro=1028,er=2300,Rt=2301,Vr=2302,ui=2400,di=2401,fi=2402,zo=2500,ko=0,ys=1,wn=2,Eo=0,gs="",ee="srgb",oe="srgb-linear",Bo="display-p3",xs="display-p3-linear",vn="linear",pi="srgb",mi="rec709",yi="p3",dt=7680,gi=519,Po=515,In=35044,st=2e3,_n=2001;class rr{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const r=this._listeners;r[e]===void 0&&(r[e]=[]),r[e].indexOf(t)===-1&&r[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;const r=this._listeners;return r[e]!==void 0&&r[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;const n=this._listeners[e];if(n!==void 0){const i=n.indexOf(t);i!==-1&&n.splice(i,1)}}dispatchEvent(e){if(this._listeners===void 0)return;const r=this._listeners[e.type];if(r!==void 0){e.target=this;const n=r.slice(0);for(let i=0,s=n.length;i<s;i++)n[i].call(this,e);e.target=null}}}const Z=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let xi=1234567;const Kt=Math.PI/180,tr=180/Math.PI;function xe(){const u=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,r=Math.random()*4294967295|0;return(Z[u&255]+Z[u>>8&255]+Z[u>>16&255]+Z[u>>24&255]+"-"+Z[e&255]+Z[e>>8&255]+"-"+Z[e>>16&15|64]+Z[e>>24&255]+"-"+Z[t&63|128]+Z[t>>8&255]+"-"+Z[t>>16&255]+Z[t>>24&255]+Z[r&255]+Z[r>>8&255]+Z[r>>16&255]+Z[r>>24&255]).toLowerCase()}function K(u,e,t){return Math.max(e,Math.min(t,u))}function En(u,e){return(u%e+e)%e}function Lo(u,e,t,r,n){return r+(u-e)*(n-r)/(t-e)}function Oo(u,e,t){return u!==e?(t-u)/(e-u):0}function Zt(u,e,t){return(1-t)*u+t*e}function Do(u,e,t,r){return Zt(u,e,1-Math.exp(-t*r))}function Fo(u,e=1){return e-Math.abs(En(u,e*2)-e)}function Go(u,e,t){return u<=e?0:u>=t?1:(u=(u-e)/(t-e),u*u*(3-2*u))}function No(u,e,t){return u<=e?0:u>=t?1:(u=(u-e)/(t-e),u*u*u*(u*(u*6-15)+10))}function Uo(u,e){return u+Math.floor(Math.random()*(e-u+1))}function Vo(u,e){return u+Math.random()*(e-u)}function Ho(u){return u*(.5-Math.random())}function jo(u){u!==void 0&&(xi=u);let e=xi+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function Wo(u){return u*Kt}function qo(u){return u*tr}function Xo(u){return(u&u-1)===0&&u!==0}function Yo(u){return Math.pow(2,Math.ceil(Math.log(u)/Math.LN2))}function Ko(u){return Math.pow(2,Math.floor(Math.log(u)/Math.LN2))}function Zo(u,e,t,r,n){const i=Math.cos,s=Math.sin,o=i(t/2),a=s(t/2),l=i((e+r)/2),h=s((e+r)/2),c=i((e-r)/2),d=s((e-r)/2),f=i((r-e)/2),p=s((r-e)/2);switch(n){case"XYX":u.set(o*h,a*c,a*d,o*l);break;case"YZY":u.set(a*d,o*h,a*c,o*l);break;case"ZXZ":u.set(a*c,a*d,o*h,o*l);break;case"XZX":u.set(o*h,a*p,a*f,o*l);break;case"YXY":u.set(a*f,o*h,a*p,o*l);break;case"ZYZ":u.set(a*p,a*f,o*h,o*l);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+n)}}function ge(u,e){switch(e.constructor){case Float32Array:return u;case Uint32Array:return u/4294967295;case Uint16Array:return u/65535;case Uint8Array:return u/255;case Int32Array:return Math.max(u/2147483647,-1);case Int16Array:return Math.max(u/32767,-1);case Int8Array:return Math.max(u/127,-1);default:throw new Error("Invalid component type.")}}function D(u,e){switch(e.constructor){case Float32Array:return u;case Uint32Array:return Math.round(u*4294967295);case Uint16Array:return Math.round(u*65535);case Uint8Array:return Math.round(u*255);case Int32Array:return Math.round(u*2147483647);case Int16Array:return Math.round(u*32767);case Int8Array:return Math.round(u*127);default:throw new Error("Invalid component type.")}}const bs={DEG2RAD:Kt,RAD2DEG:tr,generateUUID:xe,clamp:K,euclideanModulo:En,mapLinear:Lo,inverseLerp:Oo,lerp:Zt,damp:Do,pingpong:Fo,smoothstep:Go,smootherstep:No,randInt:Uo,randFloat:Vo,randFloatSpread:Ho,seededRandom:jo,degToRad:Wo,radToDeg:qo,isPowerOfTwo:Xo,ceilPowerOfTwo:Yo,floorPowerOfTwo:Ko,setQuaternionFromProperEuler:Zo,normalize:D,denormalize:ge};class P{constructor(e=0,t=0){P.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,r=this.y,n=e.elements;return this.x=n[0]*t+n[3]*r+n[6],this.y=n[1]*t+n[4]*r+n[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this}clampLength(e,t){const r=this.length();return this.divideScalar(r||1).multiplyScalar(Math.max(e,Math.min(t,r)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const r=this.dot(e)/t;return Math.acos(K(r,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,r=this.y-e.y;return t*t+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,r){return this.x=e.x+(t.x-e.x)*r,this.y=e.y+(t.y-e.y)*r,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const r=Math.cos(t),n=Math.sin(t),i=this.x-e.x,s=this.y-e.y;return this.x=i*r-s*n+e.x,this.y=i*n+s*r+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Pe{constructor(e,t,r,n,i,s,o,a,l){Pe.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,r,n,i,s,o,a,l)}set(e,t,r,n,i,s,o,a,l){const h=this.elements;return h[0]=e,h[1]=n,h[2]=o,h[3]=t,h[4]=i,h[5]=a,h[6]=r,h[7]=s,h[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,r=e.elements;return t[0]=r[0],t[1]=r[1],t[2]=r[2],t[3]=r[3],t[4]=r[4],t[5]=r[5],t[6]=r[6],t[7]=r[7],t[8]=r[8],this}extractBasis(e,t,r){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),r.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const r=e.elements,n=t.elements,i=this.elements,s=r[0],o=r[3],a=r[6],l=r[1],h=r[4],c=r[7],d=r[2],f=r[5],p=r[8],y=n[0],b=n[3],v=n[6],_=n[1],A=n[4],M=n[7],T=n[2],z=n[5],S=n[8];return i[0]=s*y+o*_+a*T,i[3]=s*b+o*A+a*z,i[6]=s*v+o*M+a*S,i[1]=l*y+h*_+c*T,i[4]=l*b+h*A+c*z,i[7]=l*v+h*M+c*S,i[2]=d*y+f*_+p*T,i[5]=d*b+f*A+p*z,i[8]=d*v+f*M+p*S,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],r=e[1],n=e[2],i=e[3],s=e[4],o=e[5],a=e[6],l=e[7],h=e[8];return t*s*h-t*o*l-r*i*h+r*o*a+n*i*l-n*s*a}invert(){const e=this.elements,t=e[0],r=e[1],n=e[2],i=e[3],s=e[4],o=e[5],a=e[6],l=e[7],h=e[8],c=h*s-o*l,d=o*a-h*i,f=l*i-s*a,p=t*c+r*d+n*f;if(p===0)return this.set(0,0,0,0,0,0,0,0,0);const y=1/p;return e[0]=c*y,e[1]=(n*l-h*r)*y,e[2]=(o*r-n*s)*y,e[3]=d*y,e[4]=(h*t-n*a)*y,e[5]=(n*i-o*t)*y,e[6]=f*y,e[7]=(r*a-l*t)*y,e[8]=(s*t-r*i)*y,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,r,n,i,s,o){const a=Math.cos(i),l=Math.sin(i);return this.set(r*a,r*l,-r*(a*s+l*o)+s+e,-n*l,n*a,-n*(-l*s+a*o)+o+t,0,0,1),this}scale(e,t){return this.premultiply(Hr.makeScale(e,t)),this}rotate(e){return this.premultiply(Hr.makeRotation(-e)),this}translate(e,t){return this.premultiply(Hr.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),r=Math.sin(e);return this.set(t,-r,0,r,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,r=e.elements;for(let n=0;n<9;n++)if(t[n]!==r[n])return!1;return!0}fromArray(e,t=0){for(let r=0;r<9;r++)this.elements[r]=e[r+t];return this}toArray(e=[],t=0){const r=this.elements;return e[t]=r[0],e[t+1]=r[1],e[t+2]=r[2],e[t+3]=r[3],e[t+4]=r[4],e[t+5]=r[5],e[t+6]=r[6],e[t+7]=r[7],e[t+8]=r[8],e}clone(){return new this.constructor().fromArray(this.elements)}}const Hr=new Pe;function Jo(u){for(let e=u.length-1;e>=0;--e)if(u[e]>=65535)return!0;return!1}function Mn(u){return document.createElementNS("http://www.w3.org/1999/xhtml",u)}const bi={};function ws(u){u in bi||(bi[u]=!0,console.warn(u))}const wi=new Pe().set(.8224621,.177538,0,.0331941,.9668058,0,.0170827,.0723974,.9105199),vi=new Pe().set(1.2249401,-.2249404,0,-.0420569,1.0420571,0,-.0196376,-.0786361,1.0982735),or={[oe]:{transfer:vn,primaries:mi,toReference:u=>u,fromReference:u=>u},[ee]:{transfer:pi,primaries:mi,toReference:u=>u.convertSRGBToLinear(),fromReference:u=>u.convertLinearToSRGB()},[xs]:{transfer:vn,primaries:yi,toReference:u=>u.applyMatrix3(vi),fromReference:u=>u.applyMatrix3(wi)},[Bo]:{transfer:pi,primaries:yi,toReference:u=>u.convertSRGBToLinear().applyMatrix3(vi),fromReference:u=>u.applyMatrix3(wi).convertLinearToSRGB()}},$o=new Set([oe,xs]),ie={enabled:!0,_workingColorSpace:oe,get workingColorSpace(){return this._workingColorSpace},set workingColorSpace(u){if(!$o.has(u))throw new Error(`Unsupported working color space, "${u}".`);this._workingColorSpace=u},convert:function(u,e,t){if(this.enabled===!1||e===t||!e||!t)return u;const r=or[e].toReference,n=or[t].fromReference;return n(r(u))},fromWorkingColorSpace:function(u,e){return this.convert(u,this._workingColorSpace,e)},toWorkingColorSpace:function(u,e){return this.convert(u,e,this._workingColorSpace)},getPrimaries:function(u){return or[u].primaries},getTransfer:function(u){return u===gs?vn:or[u].transfer}};function Tt(u){return u<.04045?u*.0773993808:Math.pow(u*.9478672986+.0521327014,2.4)}function jr(u){return u<.0031308?u*12.92:1.055*Math.pow(u,.41666)-.055}let ft;class Qo{static getDataURL(e){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let t;if(e instanceof HTMLCanvasElement)t=e;else{ft===void 0&&(ft=Mn("canvas")),ft.width=e.width,ft.height=e.height;const r=ft.getContext("2d");e instanceof ImageData?r.putImageData(e,0,0):r.drawImage(e,0,0,e.width,e.height),t=ft}return t.width>2048||t.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",e),t.toDataURL("image/jpeg",.6)):t.toDataURL("image/png")}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=Mn("canvas");t.width=e.width,t.height=e.height;const r=t.getContext("2d");r.drawImage(e,0,0,e.width,e.height);const n=r.getImageData(0,0,e.width,e.height),i=n.data;for(let s=0;s<i.length;s++)i[s]=Tt(i[s]/255)*255;return r.putImageData(n,0,0),t}else if(e.data){const t=e.data.slice(0);for(let r=0;r<t.length;r++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[r]=Math.floor(Tt(t[r]/255)*255):t[r]=Tt(t[r]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let ea=0;class ta{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:ea++}),this.uuid=xe(),this.data=e,this.dataReady=!0,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const r={uuid:this.uuid,url:""},n=this.data;if(n!==null){let i;if(Array.isArray(n)){i=[];for(let s=0,o=n.length;s<o;s++)n[s].isDataTexture?i.push(Wr(n[s].image)):i.push(Wr(n[s]))}else i=Wr(n);r.url=i}return t||(e.images[this.uuid]=r),r}}function Wr(u){return typeof HTMLImageElement<"u"&&u instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&u instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&u instanceof ImageBitmap?Qo.getDataURL(u):u.data?{data:Array.from(u.data),width:u.width,height:u.height,type:u.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let ra=0;class ue extends rr{constructor(e=ue.DEFAULT_IMAGE,t=ue.DEFAULT_MAPPING,r=qt,n=qt,i=Rn,s=zn,o=ms,a=So,l=ue.DEFAULT_ANISOTROPY,h=gs){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:ra++}),this.uuid=xe(),this.name="",this.source=new ta(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=r,this.wrapT=n,this.magFilter=i,this.minFilter=s,this.anisotropy=l,this.format=o,this.internalFormat=null,this.type=a,this.offset=new P(0,0),this.repeat=new P(1,1),this.center=new P(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Pe,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.needsPMREMUpdate=!1}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const r={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(r.userData=this.userData),t||(e.textures[this.uuid]=r),r}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==ps)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case $t:e.x=e.x-Math.floor(e.x);break;case qt:e.x=e.x<0?0:1;break;case bn:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case $t:e.y=e.y-Math.floor(e.y);break;case qt:e.y=e.y<0?0:1;break;case bn:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}}ue.DEFAULT_IMAGE=null;ue.DEFAULT_MAPPING=ps;ue.DEFAULT_ANISOTROPY=1;class ce{constructor(e=0,t=0,r=0,n=1){ce.prototype.isVector4=!0,this.x=e,this.y=t,this.z=r,this.w=n}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,r,n){return this.x=e,this.y=t,this.z=r,this.w=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,r=this.y,n=this.z,i=this.w,s=e.elements;return this.x=s[0]*t+s[4]*r+s[8]*n+s[12]*i,this.y=s[1]*t+s[5]*r+s[9]*n+s[13]*i,this.z=s[2]*t+s[6]*r+s[10]*n+s[14]*i,this.w=s[3]*t+s[7]*r+s[11]*n+s[15]*i,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,r,n,i;const a=e.elements,l=a[0],h=a[4],c=a[8],d=a[1],f=a[5],p=a[9],y=a[2],b=a[6],v=a[10];if(Math.abs(h-d)<.01&&Math.abs(c-y)<.01&&Math.abs(p-b)<.01){if(Math.abs(h+d)<.1&&Math.abs(c+y)<.1&&Math.abs(p+b)<.1&&Math.abs(l+f+v-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const A=(l+1)/2,M=(f+1)/2,T=(v+1)/2,z=(h+d)/4,S=(c+y)/4,R=(p+b)/4;return A>M&&A>T?A<.01?(r=0,n=.707106781,i=.707106781):(r=Math.sqrt(A),n=z/r,i=S/r):M>T?M<.01?(r=.707106781,n=0,i=.707106781):(n=Math.sqrt(M),r=z/n,i=R/n):T<.01?(r=.707106781,n=.707106781,i=0):(i=Math.sqrt(T),r=S/i,n=R/i),this.set(r,n,i,t),this}let _=Math.sqrt((b-p)*(b-p)+(c-y)*(c-y)+(d-h)*(d-h));return Math.abs(_)<.001&&(_=1),this.x=(b-p)/_,this.y=(c-y)/_,this.z=(d-h)/_,this.w=Math.acos((l+f+v-1)/2),this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this.w=Math.max(e.w,Math.min(t.w,this.w)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this.w=Math.max(e,Math.min(t,this.w)),this}clampLength(e,t){const r=this.length();return this.divideScalar(r||1).multiplyScalar(Math.max(e,Math.min(t,r)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,r){return this.x=e.x+(t.x-e.x)*r,this.y=e.y+(t.y-e.y)*r,this.z=e.z+(t.z-e.z)*r,this.w=e.w+(t.w-e.w)*r,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class Ie{constructor(e=0,t=0,r=0,n=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=r,this._w=n}static slerpFlat(e,t,r,n,i,s,o){let a=r[n+0],l=r[n+1],h=r[n+2],c=r[n+3];const d=i[s+0],f=i[s+1],p=i[s+2],y=i[s+3];if(o===0){e[t+0]=a,e[t+1]=l,e[t+2]=h,e[t+3]=c;return}if(o===1){e[t+0]=d,e[t+1]=f,e[t+2]=p,e[t+3]=y;return}if(c!==y||a!==d||l!==f||h!==p){let b=1-o;const v=a*d+l*f+h*p+c*y,_=v>=0?1:-1,A=1-v*v;if(A>Number.EPSILON){const T=Math.sqrt(A),z=Math.atan2(T,v*_);b=Math.sin(b*z)/T,o=Math.sin(o*z)/T}const M=o*_;if(a=a*b+d*M,l=l*b+f*M,h=h*b+p*M,c=c*b+y*M,b===1-o){const T=1/Math.sqrt(a*a+l*l+h*h+c*c);a*=T,l*=T,h*=T,c*=T}}e[t]=a,e[t+1]=l,e[t+2]=h,e[t+3]=c}static multiplyQuaternionsFlat(e,t,r,n,i,s){const o=r[n],a=r[n+1],l=r[n+2],h=r[n+3],c=i[s],d=i[s+1],f=i[s+2],p=i[s+3];return e[t]=o*p+h*c+a*f-l*d,e[t+1]=a*p+h*d+l*c-o*f,e[t+2]=l*p+h*f+o*d-a*c,e[t+3]=h*p-o*c-a*d-l*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,r,n){return this._x=e,this._y=t,this._z=r,this._w=n,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const r=e._x,n=e._y,i=e._z,s=e._order,o=Math.cos,a=Math.sin,l=o(r/2),h=o(n/2),c=o(i/2),d=a(r/2),f=a(n/2),p=a(i/2);switch(s){case"XYZ":this._x=d*h*c+l*f*p,this._y=l*f*c-d*h*p,this._z=l*h*p+d*f*c,this._w=l*h*c-d*f*p;break;case"YXZ":this._x=d*h*c+l*f*p,this._y=l*f*c-d*h*p,this._z=l*h*p-d*f*c,this._w=l*h*c+d*f*p;break;case"ZXY":this._x=d*h*c-l*f*p,this._y=l*f*c+d*h*p,this._z=l*h*p+d*f*c,this._w=l*h*c-d*f*p;break;case"ZYX":this._x=d*h*c-l*f*p,this._y=l*f*c+d*h*p,this._z=l*h*p-d*f*c,this._w=l*h*c+d*f*p;break;case"YZX":this._x=d*h*c+l*f*p,this._y=l*f*c+d*h*p,this._z=l*h*p-d*f*c,this._w=l*h*c-d*f*p;break;case"XZY":this._x=d*h*c-l*f*p,this._y=l*f*c-d*h*p,this._z=l*h*p+d*f*c,this._w=l*h*c+d*f*p;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+s)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const r=t/2,n=Math.sin(r);return this._x=e.x*n,this._y=e.y*n,this._z=e.z*n,this._w=Math.cos(r),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,r=t[0],n=t[4],i=t[8],s=t[1],o=t[5],a=t[9],l=t[2],h=t[6],c=t[10],d=r+o+c;if(d>0){const f=.5/Math.sqrt(d+1);this._w=.25/f,this._x=(h-a)*f,this._y=(i-l)*f,this._z=(s-n)*f}else if(r>o&&r>c){const f=2*Math.sqrt(1+r-o-c);this._w=(h-a)/f,this._x=.25*f,this._y=(n+s)/f,this._z=(i+l)/f}else if(o>c){const f=2*Math.sqrt(1+o-r-c);this._w=(i-l)/f,this._x=(n+s)/f,this._y=.25*f,this._z=(a+h)/f}else{const f=2*Math.sqrt(1+c-r-o);this._w=(s-n)/f,this._x=(i+l)/f,this._y=(a+h)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let r=e.dot(t)+1;return r<Number.EPSILON?(r=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=r):(this._x=0,this._y=-e.z,this._z=e.y,this._w=r)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=r),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(K(this.dot(e),-1,1)))}rotateTowards(e,t){const r=this.angleTo(e);if(r===0)return this;const n=Math.min(1,t/r);return this.slerp(e,n),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const r=e._x,n=e._y,i=e._z,s=e._w,o=t._x,a=t._y,l=t._z,h=t._w;return this._x=r*h+s*o+n*l-i*a,this._y=n*h+s*a+i*o-r*l,this._z=i*h+s*l+r*a-n*o,this._w=s*h-r*o-n*a-i*l,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);const r=this._x,n=this._y,i=this._z,s=this._w;let o=s*e._w+r*e._x+n*e._y+i*e._z;if(o<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,o=-o):this.copy(e),o>=1)return this._w=s,this._x=r,this._y=n,this._z=i,this;const a=1-o*o;if(a<=Number.EPSILON){const f=1-t;return this._w=f*s+t*this._w,this._x=f*r+t*this._x,this._y=f*n+t*this._y,this._z=f*i+t*this._z,this.normalize(),this}const l=Math.sqrt(a),h=Math.atan2(l,o),c=Math.sin((1-t)*h)/l,d=Math.sin(t*h)/l;return this._w=s*c+this._w*d,this._x=r*c+this._x*d,this._y=n*c+this._y*d,this._z=i*c+this._z*d,this._onChangeCallback(),this}slerpQuaternions(e,t,r){return this.copy(e).slerp(t,r)}random(){const e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),r=Math.random(),n=Math.sqrt(1-r),i=Math.sqrt(r);return this.set(n*Math.sin(e),n*Math.cos(e),i*Math.sin(t),i*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class w{constructor(e=0,t=0,r=0){w.prototype.isVector3=!0,this.x=e,this.y=t,this.z=r}set(e,t,r){return r===void 0&&(r=this.z),this.x=e,this.y=t,this.z=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Ii.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Ii.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,r=this.y,n=this.z,i=e.elements;return this.x=i[0]*t+i[3]*r+i[6]*n,this.y=i[1]*t+i[4]*r+i[7]*n,this.z=i[2]*t+i[5]*r+i[8]*n,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,r=this.y,n=this.z,i=e.elements,s=1/(i[3]*t+i[7]*r+i[11]*n+i[15]);return this.x=(i[0]*t+i[4]*r+i[8]*n+i[12])*s,this.y=(i[1]*t+i[5]*r+i[9]*n+i[13])*s,this.z=(i[2]*t+i[6]*r+i[10]*n+i[14])*s,this}applyQuaternion(e){const t=this.x,r=this.y,n=this.z,i=e.x,s=e.y,o=e.z,a=e.w,l=2*(s*n-o*r),h=2*(o*t-i*n),c=2*(i*r-s*t);return this.x=t+a*l+s*c-o*h,this.y=r+a*h+o*l-i*c,this.z=n+a*c+i*h-s*l,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,r=this.y,n=this.z,i=e.elements;return this.x=i[0]*t+i[4]*r+i[8]*n,this.y=i[1]*t+i[5]*r+i[9]*n,this.z=i[2]*t+i[6]*r+i[10]*n,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this}clampLength(e,t){const r=this.length();return this.divideScalar(r||1).multiplyScalar(Math.max(e,Math.min(t,r)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,r){return this.x=e.x+(t.x-e.x)*r,this.y=e.y+(t.y-e.y)*r,this.z=e.z+(t.z-e.z)*r,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const r=e.x,n=e.y,i=e.z,s=t.x,o=t.y,a=t.z;return this.x=n*a-i*o,this.y=i*s-r*a,this.z=r*o-n*s,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const r=e.dot(this)/t;return this.copy(e).multiplyScalar(r)}projectOnPlane(e){return qr.copy(this).projectOnVector(e),this.sub(qr)}reflect(e){return this.sub(qr.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const r=this.dot(e)/t;return Math.acos(K(r,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,r=this.y-e.y,n=this.z-e.z;return t*t+r*r+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,r){const n=Math.sin(t)*e;return this.x=n*Math.sin(r),this.y=Math.cos(t)*e,this.z=n*Math.cos(r),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,r){return this.x=e*Math.sin(t),this.y=r,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),r=this.setFromMatrixColumn(e,1).length(),n=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=r,this.z=n,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=Math.random()*Math.PI*2,t=Math.random()*2-1,r=Math.sqrt(1-t*t);return this.x=r*Math.cos(e),this.y=t,this.z=r*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const qr=new w,Ii=new Ie;class Le{constructor(e=new w(1/0,1/0,1/0),t=new w(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,r=e.length;t<r;t+=3)this.expandByPoint(pe.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,r=e.count;t<r;t++)this.expandByPoint(pe.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,r=e.length;t<r;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const r=pe.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(r),this.max.copy(e).add(r),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const r=e.geometry;if(r!==void 0){const i=r.getAttribute("position");if(t===!0&&i!==void 0&&e.isInstancedMesh!==!0)for(let s=0,o=i.count;s<o;s++)e.isMesh===!0?e.getVertexPosition(s,pe):pe.fromBufferAttribute(i,s),pe.applyMatrix4(e.matrixWorld),this.expandByPoint(pe);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),ar.copy(e.boundingBox)):(r.boundingBox===null&&r.computeBoundingBox(),ar.copy(r.boundingBox)),ar.applyMatrix4(e.matrixWorld),this.union(ar)}const n=e.children;for(let i=0,s=n.length;i<s;i++)this.expandByObject(n[i],t);return this}containsPoint(e){return!(e.x<this.min.x||e.x>this.max.x||e.y<this.min.y||e.y>this.max.y||e.z<this.min.z||e.z>this.max.z)}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return!(e.max.x<this.min.x||e.min.x>this.max.x||e.max.y<this.min.y||e.min.y>this.max.y||e.max.z<this.min.z||e.min.z>this.max.z)}intersectsSphere(e){return this.clampPoint(e.center,pe),pe.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,r;return e.normal.x>0?(t=e.normal.x*this.min.x,r=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,r=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,r+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,r+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,r+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,r+=e.normal.z*this.min.z),t<=-e.constant&&r>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Ft),lr.subVectors(this.max,Ft),pt.subVectors(e.a,Ft),mt.subVectors(e.b,Ft),yt.subVectors(e.c,Ft),Ue.subVectors(mt,pt),Ve.subVectors(yt,mt),et.subVectors(pt,yt);let t=[0,-Ue.z,Ue.y,0,-Ve.z,Ve.y,0,-et.z,et.y,Ue.z,0,-Ue.x,Ve.z,0,-Ve.x,et.z,0,-et.x,-Ue.y,Ue.x,0,-Ve.y,Ve.x,0,-et.y,et.x,0];return!Xr(t,pt,mt,yt,lr)||(t=[1,0,0,0,1,0,0,0,1],!Xr(t,pt,mt,yt,lr))?!1:(hr.crossVectors(Ue,Ve),t=[hr.x,hr.y,hr.z],Xr(t,pt,mt,yt,lr))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,pe).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(pe).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Te[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Te[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Te[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Te[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Te[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Te[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Te[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Te[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Te),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}}const Te=[new w,new w,new w,new w,new w,new w,new w,new w],pe=new w,ar=new Le,pt=new w,mt=new w,yt=new w,Ue=new w,Ve=new w,et=new w,Ft=new w,lr=new w,hr=new w,tt=new w;function Xr(u,e,t,r,n){for(let i=0,s=u.length-3;i<=s;i+=3){tt.fromArray(u,i);const o=n.x*Math.abs(tt.x)+n.y*Math.abs(tt.y)+n.z*Math.abs(tt.z),a=e.dot(tt),l=t.dot(tt),h=r.dot(tt);if(Math.max(-Math.max(a,l,h),Math.min(a,l,h))>o)return!1}return!0}const na=new Le,Gt=new w,Yr=new w;class be{constructor(e=new w,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const r=this.center;t!==void 0?r.copy(t):na.setFromPoints(e).getCenter(r);let n=0;for(let i=0,s=e.length;i<s;i++)n=Math.max(n,r.distanceToSquared(e[i]));return this.radius=Math.sqrt(n),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const r=this.center.distanceToSquared(e);return t.copy(e),r>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Gt.subVectors(e,this.center);const t=Gt.lengthSq();if(t>this.radius*this.radius){const r=Math.sqrt(t),n=(r-this.radius)*.5;this.center.addScaledVector(Gt,n/r),this.radius+=n}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Yr.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Gt.copy(e.center).add(Yr)),this.expandByPoint(Gt.copy(e.center).sub(Yr))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}}const Ce=new w,Kr=new w,cr=new w,He=new w,Zr=new w,ur=new w,Jr=new w;class nr{constructor(e=new w,t=new w(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Ce)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const r=t.dot(this.direction);return r<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,r)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=Ce.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Ce.copy(this.origin).addScaledVector(this.direction,t),Ce.distanceToSquared(e))}distanceSqToSegment(e,t,r,n){Kr.copy(e).add(t).multiplyScalar(.5),cr.copy(t).sub(e).normalize(),He.copy(this.origin).sub(Kr);const i=e.distanceTo(t)*.5,s=-this.direction.dot(cr),o=He.dot(this.direction),a=-He.dot(cr),l=He.lengthSq(),h=Math.abs(1-s*s);let c,d,f,p;if(h>0)if(c=s*a-o,d=s*o-a,p=i*h,c>=0)if(d>=-p)if(d<=p){const y=1/h;c*=y,d*=y,f=c*(c+s*d+2*o)+d*(s*c+d+2*a)+l}else d=i,c=Math.max(0,-(s*d+o)),f=-c*c+d*(d+2*a)+l;else d=-i,c=Math.max(0,-(s*d+o)),f=-c*c+d*(d+2*a)+l;else d<=-p?(c=Math.max(0,-(-s*i+o)),d=c>0?-i:Math.min(Math.max(-i,-a),i),f=-c*c+d*(d+2*a)+l):d<=p?(c=0,d=Math.min(Math.max(-i,-a),i),f=d*(d+2*a)+l):(c=Math.max(0,-(s*i+o)),d=c>0?i:Math.min(Math.max(-i,-a),i),f=-c*c+d*(d+2*a)+l);else d=s>0?-i:i,c=Math.max(0,-(s*d+o)),f=-c*c+d*(d+2*a)+l;return r&&r.copy(this.origin).addScaledVector(this.direction,c),n&&n.copy(Kr).addScaledVector(cr,d),f}intersectSphere(e,t){Ce.subVectors(e.center,this.origin);const r=Ce.dot(this.direction),n=Ce.dot(Ce)-r*r,i=e.radius*e.radius;if(n>i)return null;const s=Math.sqrt(i-n),o=r-s,a=r+s;return a<0?null:o<0?this.at(a,t):this.at(o,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const r=-(this.origin.dot(e.normal)+e.constant)/t;return r>=0?r:null}intersectPlane(e,t){const r=this.distanceToPlane(e);return r===null?null:this.at(r,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let r,n,i,s,o,a;const l=1/this.direction.x,h=1/this.direction.y,c=1/this.direction.z,d=this.origin;return l>=0?(r=(e.min.x-d.x)*l,n=(e.max.x-d.x)*l):(r=(e.max.x-d.x)*l,n=(e.min.x-d.x)*l),h>=0?(i=(e.min.y-d.y)*h,s=(e.max.y-d.y)*h):(i=(e.max.y-d.y)*h,s=(e.min.y-d.y)*h),r>s||i>n||((i>r||isNaN(r))&&(r=i),(s<n||isNaN(n))&&(n=s),c>=0?(o=(e.min.z-d.z)*c,a=(e.max.z-d.z)*c):(o=(e.max.z-d.z)*c,a=(e.min.z-d.z)*c),r>a||o>n)||((o>r||r!==r)&&(r=o),(a<n||n!==n)&&(n=a),n<0)?null:this.at(r>=0?r:n,t)}intersectsBox(e){return this.intersectBox(e,Ce)!==null}intersectTriangle(e,t,r,n,i){Zr.subVectors(t,e),ur.subVectors(r,e),Jr.crossVectors(Zr,ur);let s=this.direction.dot(Jr),o;if(s>0){if(n)return null;o=1}else if(s<0)o=-1,s=-s;else return null;He.subVectors(this.origin,e);const a=o*this.direction.dot(ur.crossVectors(He,ur));if(a<0)return null;const l=o*this.direction.dot(Zr.cross(He));if(l<0||a+l>s)return null;const h=-o*He.dot(Jr);return h<0?null:this.at(h/s,i)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class k{constructor(e,t,r,n,i,s,o,a,l,h,c,d,f,p,y,b){k.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,r,n,i,s,o,a,l,h,c,d,f,p,y,b)}set(e,t,r,n,i,s,o,a,l,h,c,d,f,p,y,b){const v=this.elements;return v[0]=e,v[4]=t,v[8]=r,v[12]=n,v[1]=i,v[5]=s,v[9]=o,v[13]=a,v[2]=l,v[6]=h,v[10]=c,v[14]=d,v[3]=f,v[7]=p,v[11]=y,v[15]=b,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new k().fromArray(this.elements)}copy(e){const t=this.elements,r=e.elements;return t[0]=r[0],t[1]=r[1],t[2]=r[2],t[3]=r[3],t[4]=r[4],t[5]=r[5],t[6]=r[6],t[7]=r[7],t[8]=r[8],t[9]=r[9],t[10]=r[10],t[11]=r[11],t[12]=r[12],t[13]=r[13],t[14]=r[14],t[15]=r[15],this}copyPosition(e){const t=this.elements,r=e.elements;return t[12]=r[12],t[13]=r[13],t[14]=r[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,r){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),r.setFromMatrixColumn(this,2),this}makeBasis(e,t,r){return this.set(e.x,t.x,r.x,0,e.y,t.y,r.y,0,e.z,t.z,r.z,0,0,0,0,1),this}extractRotation(e){const t=this.elements,r=e.elements,n=1/gt.setFromMatrixColumn(e,0).length(),i=1/gt.setFromMatrixColumn(e,1).length(),s=1/gt.setFromMatrixColumn(e,2).length();return t[0]=r[0]*n,t[1]=r[1]*n,t[2]=r[2]*n,t[3]=0,t[4]=r[4]*i,t[5]=r[5]*i,t[6]=r[6]*i,t[7]=0,t[8]=r[8]*s,t[9]=r[9]*s,t[10]=r[10]*s,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,r=e.x,n=e.y,i=e.z,s=Math.cos(r),o=Math.sin(r),a=Math.cos(n),l=Math.sin(n),h=Math.cos(i),c=Math.sin(i);if(e.order==="XYZ"){const d=s*h,f=s*c,p=o*h,y=o*c;t[0]=a*h,t[4]=-a*c,t[8]=l,t[1]=f+p*l,t[5]=d-y*l,t[9]=-o*a,t[2]=y-d*l,t[6]=p+f*l,t[10]=s*a}else if(e.order==="YXZ"){const d=a*h,f=a*c,p=l*h,y=l*c;t[0]=d+y*o,t[4]=p*o-f,t[8]=s*l,t[1]=s*c,t[5]=s*h,t[9]=-o,t[2]=f*o-p,t[6]=y+d*o,t[10]=s*a}else if(e.order==="ZXY"){const d=a*h,f=a*c,p=l*h,y=l*c;t[0]=d-y*o,t[4]=-s*c,t[8]=p+f*o,t[1]=f+p*o,t[5]=s*h,t[9]=y-d*o,t[2]=-s*l,t[6]=o,t[10]=s*a}else if(e.order==="ZYX"){const d=s*h,f=s*c,p=o*h,y=o*c;t[0]=a*h,t[4]=p*l-f,t[8]=d*l+y,t[1]=a*c,t[5]=y*l+d,t[9]=f*l-p,t[2]=-l,t[6]=o*a,t[10]=s*a}else if(e.order==="YZX"){const d=s*a,f=s*l,p=o*a,y=o*l;t[0]=a*h,t[4]=y-d*c,t[8]=p*c+f,t[1]=c,t[5]=s*h,t[9]=-o*h,t[2]=-l*h,t[6]=f*c+p,t[10]=d-y*c}else if(e.order==="XZY"){const d=s*a,f=s*l,p=o*a,y=o*l;t[0]=a*h,t[4]=-c,t[8]=l*h,t[1]=d*c+y,t[5]=s*h,t[9]=f*c-p,t[2]=p*c-f,t[6]=o*h,t[10]=y*c+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(ia,e,sa)}lookAt(e,t,r){const n=this.elements;return re.subVectors(e,t),re.lengthSq()===0&&(re.z=1),re.normalize(),je.crossVectors(r,re),je.lengthSq()===0&&(Math.abs(r.z)===1?re.x+=1e-4:re.z+=1e-4,re.normalize(),je.crossVectors(r,re)),je.normalize(),dr.crossVectors(re,je),n[0]=je.x,n[4]=dr.x,n[8]=re.x,n[1]=je.y,n[5]=dr.y,n[9]=re.y,n[2]=je.z,n[6]=dr.z,n[10]=re.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const r=e.elements,n=t.elements,i=this.elements,s=r[0],o=r[4],a=r[8],l=r[12],h=r[1],c=r[5],d=r[9],f=r[13],p=r[2],y=r[6],b=r[10],v=r[14],_=r[3],A=r[7],M=r[11],T=r[15],z=n[0],S=n[4],R=n[8],O=n[12],V=n[1],H=n[5],te=n[9],j=n[13],de=n[2],Je=n[6],fe=n[10],De=n[14],$e=n[3],Fe=n[7],Ge=n[11],Qe=n[15];return i[0]=s*z+o*V+a*de+l*$e,i[4]=s*S+o*H+a*Je+l*Fe,i[8]=s*R+o*te+a*fe+l*Ge,i[12]=s*O+o*j+a*De+l*Qe,i[1]=h*z+c*V+d*de+f*$e,i[5]=h*S+c*H+d*Je+f*Fe,i[9]=h*R+c*te+d*fe+f*Ge,i[13]=h*O+c*j+d*De+f*Qe,i[2]=p*z+y*V+b*de+v*$e,i[6]=p*S+y*H+b*Je+v*Fe,i[10]=p*R+y*te+b*fe+v*Ge,i[14]=p*O+y*j+b*De+v*Qe,i[3]=_*z+A*V+M*de+T*$e,i[7]=_*S+A*H+M*Je+T*Fe,i[11]=_*R+A*te+M*fe+T*Ge,i[15]=_*O+A*j+M*De+T*Qe,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],r=e[4],n=e[8],i=e[12],s=e[1],o=e[5],a=e[9],l=e[13],h=e[2],c=e[6],d=e[10],f=e[14],p=e[3],y=e[7],b=e[11],v=e[15];return p*(+i*a*c-n*l*c-i*o*d+r*l*d+n*o*f-r*a*f)+y*(+t*a*f-t*l*d+i*s*d-n*s*f+n*l*h-i*a*h)+b*(+t*l*c-t*o*f-i*s*c+r*s*f+i*o*h-r*l*h)+v*(-n*o*h-t*a*c+t*o*d+n*s*c-r*s*d+r*a*h)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,r){const n=this.elements;return e.isVector3?(n[12]=e.x,n[13]=e.y,n[14]=e.z):(n[12]=e,n[13]=t,n[14]=r),this}invert(){const e=this.elements,t=e[0],r=e[1],n=e[2],i=e[3],s=e[4],o=e[5],a=e[6],l=e[7],h=e[8],c=e[9],d=e[10],f=e[11],p=e[12],y=e[13],b=e[14],v=e[15],_=c*b*l-y*d*l+y*a*f-o*b*f-c*a*v+o*d*v,A=p*d*l-h*b*l-p*a*f+s*b*f+h*a*v-s*d*v,M=h*y*l-p*c*l+p*o*f-s*y*f-h*o*v+s*c*v,T=p*c*a-h*y*a-p*o*d+s*y*d+h*o*b-s*c*b,z=t*_+r*A+n*M+i*T;if(z===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const S=1/z;return e[0]=_*S,e[1]=(y*d*i-c*b*i-y*n*f+r*b*f+c*n*v-r*d*v)*S,e[2]=(o*b*i-y*a*i+y*n*l-r*b*l-o*n*v+r*a*v)*S,e[3]=(c*a*i-o*d*i-c*n*l+r*d*l+o*n*f-r*a*f)*S,e[4]=A*S,e[5]=(h*b*i-p*d*i+p*n*f-t*b*f-h*n*v+t*d*v)*S,e[6]=(p*a*i-s*b*i-p*n*l+t*b*l+s*n*v-t*a*v)*S,e[7]=(s*d*i-h*a*i+h*n*l-t*d*l-s*n*f+t*a*f)*S,e[8]=M*S,e[9]=(p*c*i-h*y*i-p*r*f+t*y*f+h*r*v-t*c*v)*S,e[10]=(s*y*i-p*o*i+p*r*l-t*y*l-s*r*v+t*o*v)*S,e[11]=(h*o*i-s*c*i-h*r*l+t*c*l+s*r*f-t*o*f)*S,e[12]=T*S,e[13]=(h*y*n-p*c*n+p*r*d-t*y*d-h*r*b+t*c*b)*S,e[14]=(p*o*n-s*y*n-p*r*a+t*y*a+s*r*b-t*o*b)*S,e[15]=(s*c*n-h*o*n+h*r*a-t*c*a-s*r*d+t*o*d)*S,this}scale(e){const t=this.elements,r=e.x,n=e.y,i=e.z;return t[0]*=r,t[4]*=n,t[8]*=i,t[1]*=r,t[5]*=n,t[9]*=i,t[2]*=r,t[6]*=n,t[10]*=i,t[3]*=r,t[7]*=n,t[11]*=i,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],r=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],n=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,r,n))}makeTranslation(e,t,r){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,r,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),r=Math.sin(e);return this.set(1,0,0,0,0,t,-r,0,0,r,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),r=Math.sin(e);return this.set(t,0,r,0,0,1,0,0,-r,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),r=Math.sin(e);return this.set(t,-r,0,0,r,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const r=Math.cos(t),n=Math.sin(t),i=1-r,s=e.x,o=e.y,a=e.z,l=i*s,h=i*o;return this.set(l*s+r,l*o-n*a,l*a+n*o,0,l*o+n*a,h*o+r,h*a-n*s,0,l*a-n*o,h*a+n*s,i*a*a+r,0,0,0,0,1),this}makeScale(e,t,r){return this.set(e,0,0,0,0,t,0,0,0,0,r,0,0,0,0,1),this}makeShear(e,t,r,n,i,s){return this.set(1,r,i,0,e,1,s,0,t,n,1,0,0,0,0,1),this}compose(e,t,r){const n=this.elements,i=t._x,s=t._y,o=t._z,a=t._w,l=i+i,h=s+s,c=o+o,d=i*l,f=i*h,p=i*c,y=s*h,b=s*c,v=o*c,_=a*l,A=a*h,M=a*c,T=r.x,z=r.y,S=r.z;return n[0]=(1-(y+v))*T,n[1]=(f+M)*T,n[2]=(p-A)*T,n[3]=0,n[4]=(f-M)*z,n[5]=(1-(d+v))*z,n[6]=(b+_)*z,n[7]=0,n[8]=(p+A)*S,n[9]=(b-_)*S,n[10]=(1-(d+y))*S,n[11]=0,n[12]=e.x,n[13]=e.y,n[14]=e.z,n[15]=1,this}decompose(e,t,r){const n=this.elements;let i=gt.set(n[0],n[1],n[2]).length();const s=gt.set(n[4],n[5],n[6]).length(),o=gt.set(n[8],n[9],n[10]).length();this.determinant()<0&&(i=-i),e.x=n[12],e.y=n[13],e.z=n[14],me.copy(this);const l=1/i,h=1/s,c=1/o;return me.elements[0]*=l,me.elements[1]*=l,me.elements[2]*=l,me.elements[4]*=h,me.elements[5]*=h,me.elements[6]*=h,me.elements[8]*=c,me.elements[9]*=c,me.elements[10]*=c,t.setFromRotationMatrix(me),r.x=i,r.y=s,r.z=o,this}makePerspective(e,t,r,n,i,s,o=st){const a=this.elements,l=2*i/(t-e),h=2*i/(r-n),c=(t+e)/(t-e),d=(r+n)/(r-n);let f,p;if(o===st)f=-(s+i)/(s-i),p=-2*s*i/(s-i);else if(o===_n)f=-s/(s-i),p=-s*i/(s-i);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return a[0]=l,a[4]=0,a[8]=c,a[12]=0,a[1]=0,a[5]=h,a[9]=d,a[13]=0,a[2]=0,a[6]=0,a[10]=f,a[14]=p,a[3]=0,a[7]=0,a[11]=-1,a[15]=0,this}makeOrthographic(e,t,r,n,i,s,o=st){const a=this.elements,l=1/(t-e),h=1/(r-n),c=1/(s-i),d=(t+e)*l,f=(r+n)*h;let p,y;if(o===st)p=(s+i)*c,y=-2*c;else if(o===_n)p=i*c,y=-1*c;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return a[0]=2*l,a[4]=0,a[8]=0,a[12]=-d,a[1]=0,a[5]=2*h,a[9]=0,a[13]=-f,a[2]=0,a[6]=0,a[10]=y,a[14]=-p,a[3]=0,a[7]=0,a[11]=0,a[15]=1,this}equals(e){const t=this.elements,r=e.elements;for(let n=0;n<16;n++)if(t[n]!==r[n])return!1;return!0}fromArray(e,t=0){for(let r=0;r<16;r++)this.elements[r]=e[r+t];return this}toArray(e=[],t=0){const r=this.elements;return e[t]=r[0],e[t+1]=r[1],e[t+2]=r[2],e[t+3]=r[3],e[t+4]=r[4],e[t+5]=r[5],e[t+6]=r[6],e[t+7]=r[7],e[t+8]=r[8],e[t+9]=r[9],e[t+10]=r[10],e[t+11]=r[11],e[t+12]=r[12],e[t+13]=r[13],e[t+14]=r[14],e[t+15]=r[15],e}}const gt=new w,me=new k,ia=new w(0,0,0),sa=new w(1,1,1),je=new w,dr=new w,re=new w,_i=new k,Mi=new Ie;class Et{constructor(e=0,t=0,r=0,n=Et.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=r,this._order=n}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,r,n=this._order){return this._x=e,this._y=t,this._z=r,this._order=n,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,r=!0){const n=e.elements,i=n[0],s=n[4],o=n[8],a=n[1],l=n[5],h=n[9],c=n[2],d=n[6],f=n[10];switch(t){case"XYZ":this._y=Math.asin(K(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,f),this._z=Math.atan2(-s,i)):(this._x=Math.atan2(d,l),this._z=0);break;case"YXZ":this._x=Math.asin(-K(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,f),this._z=Math.atan2(a,l)):(this._y=Math.atan2(-c,i),this._z=0);break;case"ZXY":this._x=Math.asin(K(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-c,f),this._z=Math.atan2(-s,l)):(this._y=0,this._z=Math.atan2(a,i));break;case"ZYX":this._y=Math.asin(-K(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(a,i)):(this._x=0,this._z=Math.atan2(-s,l));break;case"YZX":this._z=Math.asin(K(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-h,l),this._y=Math.atan2(-c,i)):(this._x=0,this._y=Math.atan2(o,f));break;case"XZY":this._z=Math.asin(-K(s,-1,1)),Math.abs(s)<.9999999?(this._x=Math.atan2(d,l),this._y=Math.atan2(o,i)):(this._x=Math.atan2(-h,f),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,r===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,r){return _i.makeRotationFromQuaternion(e),this.setFromRotationMatrix(_i,t,r)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Mi.setFromEuler(this),this.setFromQuaternion(Mi,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}Et.DEFAULT_ORDER="XYZ";class oa{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let aa=0;const Ai=new w,xt=new Ie,Re=new k,fr=new w,Nt=new w,la=new w,ha=new Ie,Si=new w(1,0,0),Ti=new w(0,1,0),Ci=new w(0,0,1),ca={type:"added"},ua={type:"removed"},$r={type:"childadded",child:null},Qr={type:"childremoved",child:null};class W extends rr{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:aa++}),this.uuid=xe(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=W.DEFAULT_UP.clone();const e=new w,t=new Et,r=new Ie,n=new w(1,1,1);function i(){r.setFromEuler(t,!1)}function s(){t.setFromQuaternion(r,void 0,!1)}t._onChange(i),r._onChange(s),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:r},scale:{configurable:!0,enumerable:!0,value:n},modelViewMatrix:{value:new k},normalMatrix:{value:new Pe}}),this.matrix=new k,this.matrixWorld=new k,this.matrixAutoUpdate=W.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=W.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new oa,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return xt.setFromAxisAngle(e,t),this.quaternion.multiply(xt),this}rotateOnWorldAxis(e,t){return xt.setFromAxisAngle(e,t),this.quaternion.premultiply(xt),this}rotateX(e){return this.rotateOnAxis(Si,e)}rotateY(e){return this.rotateOnAxis(Ti,e)}rotateZ(e){return this.rotateOnAxis(Ci,e)}translateOnAxis(e,t){return Ai.copy(e).applyQuaternion(this.quaternion),this.position.add(Ai.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Si,e)}translateY(e){return this.translateOnAxis(Ti,e)}translateZ(e){return this.translateOnAxis(Ci,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Re.copy(this.matrixWorld).invert())}lookAt(e,t,r){e.isVector3?fr.copy(e):fr.set(e,t,r);const n=this.parent;this.updateWorldMatrix(!0,!1),Nt.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Re.lookAt(Nt,fr,this.up):Re.lookAt(fr,Nt,this.up),this.quaternion.setFromRotationMatrix(Re),n&&(Re.extractRotation(n.matrixWorld),xt.setFromRotationMatrix(Re),this.quaternion.premultiply(xt.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.parent!==null&&e.parent.remove(e),e.parent=this,this.children.push(e),e.dispatchEvent(ca),$r.child=e,this.dispatchEvent($r),$r.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let r=0;r<arguments.length;r++)this.remove(arguments[r]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(ua),Qr.child=e,this.dispatchEvent(Qr),Qr.child=null),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Re.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Re.multiply(e.parent.matrixWorld)),e.applyMatrix4(Re),this.add(e),e.updateWorldMatrix(!1,!0),this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let r=0,n=this.children.length;r<n;r++){const s=this.children[r].getObjectByProperty(e,t);if(s!==void 0)return s}}getObjectsByProperty(e,t,r=[]){this[e]===t&&r.push(this);const n=this.children;for(let i=0,s=n.length;i<s;i++)n[i].getObjectsByProperty(e,t,r);return r}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Nt,e,la),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Nt,ha,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);const t=this.children;for(let r=0,n=t.length;r<n;r++)t[r].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let r=0,n=t.length;r<n;r++)t[r].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let r=0,n=t.length;r<n;r++){const i=t[r];(i.matrixWorldAutoUpdate===!0||e===!0)&&i.updateMatrixWorld(e)}}updateWorldMatrix(e,t){const r=this.parent;if(e===!0&&r!==null&&r.matrixWorldAutoUpdate===!0&&r.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),t===!0){const n=this.children;for(let i=0,s=n.length;i<s;i++){const o=n[i];o.matrixWorldAutoUpdate===!0&&o.updateWorldMatrix(!1,!0)}}}toJSON(e){const t=e===void 0||typeof e=="string",r={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},r.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const n={};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.castShadow===!0&&(n.castShadow=!0),this.receiveShadow===!0&&(n.receiveShadow=!0),this.visible===!1&&(n.visible=!1),this.frustumCulled===!1&&(n.frustumCulled=!1),this.renderOrder!==0&&(n.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(n.userData=this.userData),n.layers=this.layers.mask,n.matrix=this.matrix.toArray(),n.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(n.matrixAutoUpdate=!1),this.isInstancedMesh&&(n.type="InstancedMesh",n.count=this.count,n.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(n.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(n.type="BatchedMesh",n.perObjectFrustumCulled=this.perObjectFrustumCulled,n.sortObjects=this.sortObjects,n.drawRanges=this._drawRanges,n.reservedRanges=this._reservedRanges,n.visibility=this._visibility,n.active=this._active,n.bounds=this._bounds.map(o=>({boxInitialized:o.boxInitialized,boxMin:o.box.min.toArray(),boxMax:o.box.max.toArray(),sphereInitialized:o.sphereInitialized,sphereRadius:o.sphere.radius,sphereCenter:o.sphere.center.toArray()})),n.maxGeometryCount=this._maxGeometryCount,n.maxVertexCount=this._maxVertexCount,n.maxIndexCount=this._maxIndexCount,n.geometryInitialized=this._geometryInitialized,n.geometryCount=this._geometryCount,n.matricesTexture=this._matricesTexture.toJSON(e),this.boundingSphere!==null&&(n.boundingSphere={center:n.boundingSphere.center.toArray(),radius:n.boundingSphere.radius}),this.boundingBox!==null&&(n.boundingBox={min:n.boundingBox.min.toArray(),max:n.boundingBox.max.toArray()}));function i(o,a){return o[a.uuid]===void 0&&(o[a.uuid]=a.toJSON(e)),a.uuid}if(this.isScene)this.background&&(this.background.isColor?n.background=this.background.toJSON():this.background.isTexture&&(n.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(n.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){n.geometry=i(e.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const a=o.shapes;if(Array.isArray(a))for(let l=0,h=a.length;l<h;l++){const c=a[l];i(e.shapes,c)}else i(e.shapes,a)}}if(this.isSkinnedMesh&&(n.bindMode=this.bindMode,n.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(i(e.skeletons,this.skeleton),n.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let a=0,l=this.material.length;a<l;a++)o.push(i(e.materials,this.material[a]));n.material=o}else n.material=i(e.materials,this.material);if(this.children.length>0){n.children=[];for(let o=0;o<this.children.length;o++)n.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){n.animations=[];for(let o=0;o<this.animations.length;o++){const a=this.animations[o];n.animations.push(i(e.animations,a))}}if(t){const o=s(e.geometries),a=s(e.materials),l=s(e.textures),h=s(e.images),c=s(e.shapes),d=s(e.skeletons),f=s(e.animations),p=s(e.nodes);o.length>0&&(r.geometries=o),a.length>0&&(r.materials=a),l.length>0&&(r.textures=l),h.length>0&&(r.images=h),c.length>0&&(r.shapes=c),d.length>0&&(r.skeletons=d),f.length>0&&(r.animations=f),p.length>0&&(r.nodes=p)}return r.object=n,r;function s(o){const a=[];for(const l in o){const h=o[l];delete h.metadata,a.push(h)}return a}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let r=0;r<e.children.length;r++){const n=e.children[r];this.add(n.clone())}return this}}W.DEFAULT_UP=new w(0,1,0);W.DEFAULT_MATRIX_AUTO_UPDATE=!0;W.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const ye=new w,ze=new w,en=new w,ke=new w,bt=new w,wt=new w,Ri=new w,tn=new w,rn=new w,nn=new w;class we{constructor(e=new w,t=new w,r=new w){this.a=e,this.b=t,this.c=r}static getNormal(e,t,r,n){n.subVectors(r,t),ye.subVectors(e,t),n.cross(ye);const i=n.lengthSq();return i>0?n.multiplyScalar(1/Math.sqrt(i)):n.set(0,0,0)}static getBarycoord(e,t,r,n,i){ye.subVectors(n,t),ze.subVectors(r,t),en.subVectors(e,t);const s=ye.dot(ye),o=ye.dot(ze),a=ye.dot(en),l=ze.dot(ze),h=ze.dot(en),c=s*l-o*o;if(c===0)return i.set(0,0,0),null;const d=1/c,f=(l*a-o*h)*d,p=(s*h-o*a)*d;return i.set(1-f-p,p,f)}static containsPoint(e,t,r,n){return this.getBarycoord(e,t,r,n,ke)===null?!1:ke.x>=0&&ke.y>=0&&ke.x+ke.y<=1}static getInterpolation(e,t,r,n,i,s,o,a){return this.getBarycoord(e,t,r,n,ke)===null?(a.x=0,a.y=0,"z"in a&&(a.z=0),"w"in a&&(a.w=0),null):(a.setScalar(0),a.addScaledVector(i,ke.x),a.addScaledVector(s,ke.y),a.addScaledVector(o,ke.z),a)}static isFrontFacing(e,t,r,n){return ye.subVectors(r,t),ze.subVectors(e,t),ye.cross(ze).dot(n)<0}set(e,t,r){return this.a.copy(e),this.b.copy(t),this.c.copy(r),this}setFromPointsAndIndices(e,t,r,n){return this.a.copy(e[t]),this.b.copy(e[r]),this.c.copy(e[n]),this}setFromAttributeAndIndices(e,t,r,n){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,r),this.c.fromBufferAttribute(e,n),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return ye.subVectors(this.c,this.b),ze.subVectors(this.a,this.b),ye.cross(ze).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return we.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return we.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,r,n,i){return we.getInterpolation(e,this.a,this.b,this.c,t,r,n,i)}containsPoint(e){return we.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return we.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const r=this.a,n=this.b,i=this.c;let s,o;bt.subVectors(n,r),wt.subVectors(i,r),tn.subVectors(e,r);const a=bt.dot(tn),l=wt.dot(tn);if(a<=0&&l<=0)return t.copy(r);rn.subVectors(e,n);const h=bt.dot(rn),c=wt.dot(rn);if(h>=0&&c<=h)return t.copy(n);const d=a*c-h*l;if(d<=0&&a>=0&&h<=0)return s=a/(a-h),t.copy(r).addScaledVector(bt,s);nn.subVectors(e,i);const f=bt.dot(nn),p=wt.dot(nn);if(p>=0&&f<=p)return t.copy(i);const y=f*l-a*p;if(y<=0&&l>=0&&p<=0)return o=l/(l-p),t.copy(r).addScaledVector(wt,o);const b=h*p-f*c;if(b<=0&&c-h>=0&&f-p>=0)return Ri.subVectors(i,n),o=(c-h)/(c-h+(f-p)),t.copy(n).addScaledVector(Ri,o);const v=1/(b+y+d);return s=y*v,o=d*v,t.copy(r).addScaledVector(bt,s).addScaledVector(wt,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}const vs={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},We={h:0,s:0,l:0},pr={h:0,s:0,l:0};function sn(u,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?u+(e-u)*6*t:t<1/2?e:t<2/3?u+(e-u)*6*(2/3-t):u}class X{constructor(e,t,r){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,r)}set(e,t,r){if(t===void 0&&r===void 0){const n=e;n&&n.isColor?this.copy(n):typeof n=="number"?this.setHex(n):typeof n=="string"&&this.setStyle(n)}else this.setRGB(e,t,r);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=ee){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,ie.toWorkingColorSpace(this,t),this}setRGB(e,t,r,n=ie.workingColorSpace){return this.r=e,this.g=t,this.b=r,ie.toWorkingColorSpace(this,n),this}setHSL(e,t,r,n=ie.workingColorSpace){if(e=En(e,1),t=K(t,0,1),r=K(r,0,1),t===0)this.r=this.g=this.b=r;else{const i=r<=.5?r*(1+t):r+t-r*t,s=2*r-i;this.r=sn(s,i,e+1/3),this.g=sn(s,i,e),this.b=sn(s,i,e-1/3)}return ie.toWorkingColorSpace(this,n),this}setStyle(e,t=ee){function r(i){i!==void 0&&parseFloat(i)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let n;if(n=/^(\w+)\(([^\)]*)\)/.exec(e)){let i;const s=n[1],o=n[2];switch(s){case"rgb":case"rgba":if(i=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return r(i[4]),this.setRGB(Math.min(255,parseInt(i[1],10))/255,Math.min(255,parseInt(i[2],10))/255,Math.min(255,parseInt(i[3],10))/255,t);if(i=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return r(i[4]),this.setRGB(Math.min(100,parseInt(i[1],10))/100,Math.min(100,parseInt(i[2],10))/100,Math.min(100,parseInt(i[3],10))/100,t);break;case"hsl":case"hsla":if(i=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return r(i[4]),this.setHSL(parseFloat(i[1])/360,parseFloat(i[2])/100,parseFloat(i[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(n=/^\#([A-Fa-f\d]+)$/.exec(e)){const i=n[1],s=i.length;if(s===3)return this.setRGB(parseInt(i.charAt(0),16)/15,parseInt(i.charAt(1),16)/15,parseInt(i.charAt(2),16)/15,t);if(s===6)return this.setHex(parseInt(i,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=ee){const r=vs[e.toLowerCase()];return r!==void 0?this.setHex(r,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Tt(e.r),this.g=Tt(e.g),this.b=Tt(e.b),this}copyLinearToSRGB(e){return this.r=jr(e.r),this.g=jr(e.g),this.b=jr(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=ee){return ie.fromWorkingColorSpace(J.copy(this),e),Math.round(K(J.r*255,0,255))*65536+Math.round(K(J.g*255,0,255))*256+Math.round(K(J.b*255,0,255))}getHexString(e=ee){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=ie.workingColorSpace){ie.fromWorkingColorSpace(J.copy(this),t);const r=J.r,n=J.g,i=J.b,s=Math.max(r,n,i),o=Math.min(r,n,i);let a,l;const h=(o+s)/2;if(o===s)a=0,l=0;else{const c=s-o;switch(l=h<=.5?c/(s+o):c/(2-s-o),s){case r:a=(n-i)/c+(n<i?6:0);break;case n:a=(i-r)/c+2;break;case i:a=(r-n)/c+4;break}a/=6}return e.h=a,e.s=l,e.l=h,e}getRGB(e,t=ie.workingColorSpace){return ie.fromWorkingColorSpace(J.copy(this),t),e.r=J.r,e.g=J.g,e.b=J.b,e}getStyle(e=ee){ie.fromWorkingColorSpace(J.copy(this),e);const t=J.r,r=J.g,n=J.b;return e!==ee?`color(${e} ${t.toFixed(3)} ${r.toFixed(3)} ${n.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(r*255)},${Math.round(n*255)})`}offsetHSL(e,t,r){return this.getHSL(We),this.setHSL(We.h+e,We.s+t,We.l+r)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,r){return this.r=e.r+(t.r-e.r)*r,this.g=e.g+(t.g-e.g)*r,this.b=e.b+(t.b-e.b)*r,this}lerpHSL(e,t){this.getHSL(We),e.getHSL(pr);const r=Zt(We.h,pr.h,t),n=Zt(We.s,pr.s,t),i=Zt(We.l,pr.l,t);return this.setHSL(r,n,i),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,r=this.g,n=this.b,i=e.elements;return this.r=i[0]*t+i[3]*r+i[6]*n,this.g=i[1]*t+i[4]*r+i[7]*n,this.b=i[2]*t+i[5]*r+i[8]*n,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const J=new X;X.NAMES=vs;let da=0;class ot extends rr{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:da++}),this.uuid=xe(),this.name="",this.type="Material",this.blending=ii,this.side=Pr,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=oi,this.blendDst=ai,this.blendEquation=si,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new X(0,0,0),this.blendAlpha=0,this.depthFunc=li,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=gi,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=dt,this.stencilZFail=dt,this.stencilZPass=dt,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBuild(){}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const r=e[t];if(r===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}const n=this[t];if(n===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}n&&n.isColor?n.set(r):n&&n.isVector3&&r&&r.isVector3?n.copy(r):this[t]=r}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const r={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};r.uuid=this.uuid,r.type=this.type,this.name!==""&&(r.name=this.name),this.color&&this.color.isColor&&(r.color=this.color.getHex()),this.roughness!==void 0&&(r.roughness=this.roughness),this.metalness!==void 0&&(r.metalness=this.metalness),this.sheen!==void 0&&(r.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(r.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(r.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(r.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(r.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(r.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(r.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(r.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(r.shininess=this.shininess),this.clearcoat!==void 0&&(r.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(r.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(r.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(r.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(r.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,r.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.iridescence!==void 0&&(r.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(r.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(r.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(r.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(r.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(r.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(r.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(r.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(r.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(r.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(r.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(r.lightMap=this.lightMap.toJSON(e).uuid,r.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(r.aoMap=this.aoMap.toJSON(e).uuid,r.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(r.bumpMap=this.bumpMap.toJSON(e).uuid,r.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(r.normalMap=this.normalMap.toJSON(e).uuid,r.normalMapType=this.normalMapType,r.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(r.displacementMap=this.displacementMap.toJSON(e).uuid,r.displacementScale=this.displacementScale,r.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(r.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(r.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(r.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(r.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(r.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(r.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(r.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(r.combine=this.combine)),this.envMapRotation!==void 0&&(r.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(r.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(r.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(r.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(r.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(r.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(r.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(r.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(r.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(r.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(r.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(r.size=this.size),this.shadowSide!==null&&(r.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(r.sizeAttenuation=this.sizeAttenuation),this.blending!==ii&&(r.blending=this.blending),this.side!==Pr&&(r.side=this.side),this.vertexColors===!0&&(r.vertexColors=!0),this.opacity<1&&(r.opacity=this.opacity),this.transparent===!0&&(r.transparent=!0),this.blendSrc!==oi&&(r.blendSrc=this.blendSrc),this.blendDst!==ai&&(r.blendDst=this.blendDst),this.blendEquation!==si&&(r.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(r.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(r.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(r.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(r.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(r.blendAlpha=this.blendAlpha),this.depthFunc!==li&&(r.depthFunc=this.depthFunc),this.depthTest===!1&&(r.depthTest=this.depthTest),this.depthWrite===!1&&(r.depthWrite=this.depthWrite),this.colorWrite===!1&&(r.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(r.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==gi&&(r.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(r.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(r.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==dt&&(r.stencilFail=this.stencilFail),this.stencilZFail!==dt&&(r.stencilZFail=this.stencilZFail),this.stencilZPass!==dt&&(r.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(r.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(r.rotation=this.rotation),this.polygonOffset===!0&&(r.polygonOffset=!0),this.polygonOffsetFactor!==0&&(r.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(r.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(r.linewidth=this.linewidth),this.dashSize!==void 0&&(r.dashSize=this.dashSize),this.gapSize!==void 0&&(r.gapSize=this.gapSize),this.scale!==void 0&&(r.scale=this.scale),this.dithering===!0&&(r.dithering=!0),this.alphaTest>0&&(r.alphaTest=this.alphaTest),this.alphaHash===!0&&(r.alphaHash=!0),this.alphaToCoverage===!0&&(r.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(r.premultipliedAlpha=!0),this.forceSinglePass===!0&&(r.forceSinglePass=!0),this.wireframe===!0&&(r.wireframe=!0),this.wireframeLinewidth>1&&(r.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(r.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(r.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(r.flatShading=!0),this.visible===!1&&(r.visible=!1),this.toneMapped===!1&&(r.toneMapped=!1),this.fog===!1&&(r.fog=!1),Object.keys(this.userData).length>0&&(r.userData=this.userData);function n(i){const s=[];for(const o in i){const a=i[o];delete a.metadata,s.push(a)}return s}if(t){const i=n(e.textures),s=n(e.images);i.length>0&&(r.textures=i),s.length>0&&(r.images=s)}return r}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let r=null;if(t!==null){const n=t.length;r=new Array(n);for(let i=0;i!==n;++i)r[i]=t[i].clone()}return this.clippingPlanes=r,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}class St extends ot{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new X(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Et,this.combine=vo,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const q=new w,mr=new P;class N{constructor(e,t,r=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=r,this.usage=In,this._updateRange={offset:0,count:-1},this.updateRanges=[],this.gpuType=kn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}get updateRange(){return ws("THREE.BufferAttribute: updateRange() is deprecated and will be removed in r169. Use addUpdateRange() instead."),this._updateRange}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,r){e*=this.itemSize,r*=t.itemSize;for(let n=0,i=this.itemSize;n<i;n++)this.array[e+n]=t.array[r+n];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,r=this.count;t<r;t++)mr.fromBufferAttribute(this,t),mr.applyMatrix3(e),this.setXY(t,mr.x,mr.y);else if(this.itemSize===3)for(let t=0,r=this.count;t<r;t++)q.fromBufferAttribute(this,t),q.applyMatrix3(e),this.setXYZ(t,q.x,q.y,q.z);return this}applyMatrix4(e){for(let t=0,r=this.count;t<r;t++)q.fromBufferAttribute(this,t),q.applyMatrix4(e),this.setXYZ(t,q.x,q.y,q.z);return this}applyNormalMatrix(e){for(let t=0,r=this.count;t<r;t++)q.fromBufferAttribute(this,t),q.applyNormalMatrix(e),this.setXYZ(t,q.x,q.y,q.z);return this}transformDirection(e){for(let t=0,r=this.count;t<r;t++)q.fromBufferAttribute(this,t),q.transformDirection(e),this.setXYZ(t,q.x,q.y,q.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let r=this.array[e*this.itemSize+t];return this.normalized&&(r=ge(r,this.array)),r}setComponent(e,t,r){return this.normalized&&(r=D(r,this.array)),this.array[e*this.itemSize+t]=r,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=ge(t,this.array)),t}setX(e,t){return this.normalized&&(t=D(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=ge(t,this.array)),t}setY(e,t){return this.normalized&&(t=D(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=ge(t,this.array)),t}setZ(e,t){return this.normalized&&(t=D(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=ge(t,this.array)),t}setW(e,t){return this.normalized&&(t=D(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,r){return e*=this.itemSize,this.normalized&&(t=D(t,this.array),r=D(r,this.array)),this.array[e+0]=t,this.array[e+1]=r,this}setXYZ(e,t,r,n){return e*=this.itemSize,this.normalized&&(t=D(t,this.array),r=D(r,this.array),n=D(n,this.array)),this.array[e+0]=t,this.array[e+1]=r,this.array[e+2]=n,this}setXYZW(e,t,r,n,i){return e*=this.itemSize,this.normalized&&(t=D(t,this.array),r=D(r,this.array),n=D(n,this.array),i=D(i,this.array)),this.array[e+0]=t,this.array[e+1]=r,this.array[e+2]=n,this.array[e+3]=i,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==In&&(e.usage=this.usage),e}}class fa extends N{constructor(e,t,r){super(new Uint16Array(e),t,r)}}class pa extends N{constructor(e,t,r){super(new Uint32Array(e),t,r)}}class Bn extends N{constructor(e,t,r){super(new Float32Array(e),t,r)}}let ma=0;const le=new k,on=new W,vt=new w,ne=new Le,Ut=new Le,Y=new w;class ve extends rr{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:ma++}),this.uuid=xe(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Jo(e)?pa:fa)(e,1):this.index=e,this}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,r=0){this.groups.push({start:e,count:t,materialIndex:r})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const r=this.attributes.normal;if(r!==void 0){const i=new Pe().getNormalMatrix(e);r.applyNormalMatrix(i),r.needsUpdate=!0}const n=this.attributes.tangent;return n!==void 0&&(n.transformDirection(e),n.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return le.makeRotationFromQuaternion(e),this.applyMatrix4(le),this}rotateX(e){return le.makeRotationX(e),this.applyMatrix4(le),this}rotateY(e){return le.makeRotationY(e),this.applyMatrix4(le),this}rotateZ(e){return le.makeRotationZ(e),this.applyMatrix4(le),this}translate(e,t,r){return le.makeTranslation(e,t,r),this.applyMatrix4(le),this}scale(e,t,r){return le.makeScale(e,t,r),this.applyMatrix4(le),this}lookAt(e){return on.lookAt(e),on.updateMatrix(),this.applyMatrix4(on.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(vt).negate(),this.translate(vt.x,vt.y,vt.z),this}setFromPoints(e){const t=[];for(let r=0,n=e.length;r<n;r++){const i=e[r];t.push(i.x,i.y,i.z||0)}return this.setAttribute("position",new Bn(t,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Le);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new w(-1/0,-1/0,-1/0),new w(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let r=0,n=t.length;r<n;r++){const i=t[r];ne.setFromBufferAttribute(i),this.morphTargetsRelative?(Y.addVectors(this.boundingBox.min,ne.min),this.boundingBox.expandByPoint(Y),Y.addVectors(this.boundingBox.max,ne.max),this.boundingBox.expandByPoint(Y)):(this.boundingBox.expandByPoint(ne.min),this.boundingBox.expandByPoint(ne.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new be);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new w,1/0);return}if(e){const r=this.boundingSphere.center;if(ne.setFromBufferAttribute(e),t)for(let i=0,s=t.length;i<s;i++){const o=t[i];Ut.setFromBufferAttribute(o),this.morphTargetsRelative?(Y.addVectors(ne.min,Ut.min),ne.expandByPoint(Y),Y.addVectors(ne.max,Ut.max),ne.expandByPoint(Y)):(ne.expandByPoint(Ut.min),ne.expandByPoint(Ut.max))}ne.getCenter(r);let n=0;for(let i=0,s=e.count;i<s;i++)Y.fromBufferAttribute(e,i),n=Math.max(n,r.distanceToSquared(Y));if(t)for(let i=0,s=t.length;i<s;i++){const o=t[i],a=this.morphTargetsRelative;for(let l=0,h=o.count;l<h;l++)Y.fromBufferAttribute(o,l),a&&(vt.fromBufferAttribute(e,l),Y.add(vt)),n=Math.max(n,r.distanceToSquared(Y))}this.boundingSphere.radius=Math.sqrt(n),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const r=t.position,n=t.normal,i=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new N(new Float32Array(4*r.count),4));const s=this.getAttribute("tangent"),o=[],a=[];for(let R=0;R<r.count;R++)o[R]=new w,a[R]=new w;const l=new w,h=new w,c=new w,d=new P,f=new P,p=new P,y=new w,b=new w;function v(R,O,V){l.fromBufferAttribute(r,R),h.fromBufferAttribute(r,O),c.fromBufferAttribute(r,V),d.fromBufferAttribute(i,R),f.fromBufferAttribute(i,O),p.fromBufferAttribute(i,V),h.sub(l),c.sub(l),f.sub(d),p.sub(d);const H=1/(f.x*p.y-p.x*f.y);isFinite(H)&&(y.copy(h).multiplyScalar(p.y).addScaledVector(c,-f.y).multiplyScalar(H),b.copy(c).multiplyScalar(f.x).addScaledVector(h,-p.x).multiplyScalar(H),o[R].add(y),o[O].add(y),o[V].add(y),a[R].add(b),a[O].add(b),a[V].add(b))}let _=this.groups;_.length===0&&(_=[{start:0,count:e.count}]);for(let R=0,O=_.length;R<O;++R){const V=_[R],H=V.start,te=V.count;for(let j=H,de=H+te;j<de;j+=3)v(e.getX(j+0),e.getX(j+1),e.getX(j+2))}const A=new w,M=new w,T=new w,z=new w;function S(R){T.fromBufferAttribute(n,R),z.copy(T);const O=o[R];A.copy(O),A.sub(T.multiplyScalar(T.dot(O))).normalize(),M.crossVectors(z,O);const H=M.dot(a[R])<0?-1:1;s.setXYZW(R,A.x,A.y,A.z,H)}for(let R=0,O=_.length;R<O;++R){const V=_[R],H=V.start,te=V.count;for(let j=H,de=H+te;j<de;j+=3)S(e.getX(j+0)),S(e.getX(j+1)),S(e.getX(j+2))}}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let r=this.getAttribute("normal");if(r===void 0)r=new N(new Float32Array(t.count*3),3),this.setAttribute("normal",r);else for(let d=0,f=r.count;d<f;d++)r.setXYZ(d,0,0,0);const n=new w,i=new w,s=new w,o=new w,a=new w,l=new w,h=new w,c=new w;if(e)for(let d=0,f=e.count;d<f;d+=3){const p=e.getX(d+0),y=e.getX(d+1),b=e.getX(d+2);n.fromBufferAttribute(t,p),i.fromBufferAttribute(t,y),s.fromBufferAttribute(t,b),h.subVectors(s,i),c.subVectors(n,i),h.cross(c),o.fromBufferAttribute(r,p),a.fromBufferAttribute(r,y),l.fromBufferAttribute(r,b),o.add(h),a.add(h),l.add(h),r.setXYZ(p,o.x,o.y,o.z),r.setXYZ(y,a.x,a.y,a.z),r.setXYZ(b,l.x,l.y,l.z)}else for(let d=0,f=t.count;d<f;d+=3)n.fromBufferAttribute(t,d+0),i.fromBufferAttribute(t,d+1),s.fromBufferAttribute(t,d+2),h.subVectors(s,i),c.subVectors(n,i),h.cross(c),r.setXYZ(d+0,h.x,h.y,h.z),r.setXYZ(d+1,h.x,h.y,h.z),r.setXYZ(d+2,h.x,h.y,h.z);this.normalizeNormals(),r.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let t=0,r=e.count;t<r;t++)Y.fromBufferAttribute(e,t),Y.normalize(),e.setXYZ(t,Y.x,Y.y,Y.z)}toNonIndexed(){function e(o,a){const l=o.array,h=o.itemSize,c=o.normalized,d=new l.constructor(a.length*h);let f=0,p=0;for(let y=0,b=a.length;y<b;y++){o.isInterleavedBufferAttribute?f=a[y]*o.data.stride+o.offset:f=a[y]*h;for(let v=0;v<h;v++)d[p++]=l[f++]}return new N(d,h,c)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new ve,r=this.index.array,n=this.attributes;for(const o in n){const a=n[o],l=e(a,r);t.setAttribute(o,l)}const i=this.morphAttributes;for(const o in i){const a=[],l=i[o];for(let h=0,c=l.length;h<c;h++){const d=l[h],f=e(d,r);a.push(f)}t.morphAttributes[o]=a}t.morphTargetsRelative=this.morphTargetsRelative;const s=this.groups;for(let o=0,a=s.length;o<a;o++){const l=s[o];t.addGroup(l.start,l.count,l.materialIndex)}return t}toJSON(){const e={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){const a=this.parameters;for(const l in a)a[l]!==void 0&&(e[l]=a[l]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const r=this.attributes;for(const a in r){const l=r[a];e.data.attributes[a]=l.toJSON(e.data)}const n={};let i=!1;for(const a in this.morphAttributes){const l=this.morphAttributes[a],h=[];for(let c=0,d=l.length;c<d;c++){const f=l[c];h.push(f.toJSON(e.data))}h.length>0&&(n[a]=h,i=!0)}i&&(e.data.morphAttributes=n,e.data.morphTargetsRelative=this.morphTargetsRelative);const s=this.groups;s.length>0&&(e.data.groups=JSON.parse(JSON.stringify(s)));const o=this.boundingSphere;return o!==null&&(e.data.boundingSphere={center:o.center.toArray(),radius:o.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const r=e.index;r!==null&&this.setIndex(r.clone(t));const n=e.attributes;for(const l in n){const h=n[l];this.setAttribute(l,h.clone(t))}const i=e.morphAttributes;for(const l in i){const h=[],c=i[l];for(let d=0,f=c.length;d<f;d++)h.push(c[d].clone(t));this.morphAttributes[l]=h}this.morphTargetsRelative=e.morphTargetsRelative;const s=e.groups;for(let l=0,h=s.length;l<h;l++){const c=s[l];this.addGroup(c.start,c.count,c.materialIndex)}const o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());const a=e.boundingSphere;return a!==null&&(this.boundingSphere=a.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const zi=new k,rt=new nr,yr=new be,ki=new w,It=new w,_t=new w,Mt=new w,an=new w,gr=new w,xr=new P,br=new P,wr=new P,Ei=new w,Bi=new w,Pi=new w,vr=new w,Ir=new w;let Be=class extends W{constructor(e=new ve,t=new St){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,r=Object.keys(t);if(r.length>0){const n=t[r[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let i=0,s=n.length;i<s;i++){const o=n[i].name||String(i);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=i}}}}getVertexPosition(e,t){const r=this.geometry,n=r.attributes.position,i=r.morphAttributes.position,s=r.morphTargetsRelative;t.fromBufferAttribute(n,e);const o=this.morphTargetInfluences;if(i&&o){gr.set(0,0,0);for(let a=0,l=i.length;a<l;a++){const h=o[a],c=i[a];h!==0&&(an.fromBufferAttribute(c,e),s?gr.addScaledVector(an,h):gr.addScaledVector(an.sub(t),h))}t.add(gr)}return t}raycast(e,t){const r=this.geometry,n=this.material,i=this.matrixWorld;n!==void 0&&(r.boundingSphere===null&&r.computeBoundingSphere(),yr.copy(r.boundingSphere),yr.applyMatrix4(i),rt.copy(e.ray).recast(e.near),!(yr.containsPoint(rt.origin)===!1&&(rt.intersectSphere(yr,ki)===null||rt.origin.distanceToSquared(ki)>(e.far-e.near)**2))&&(zi.copy(i).invert(),rt.copy(e.ray).applyMatrix4(zi),!(r.boundingBox!==null&&rt.intersectsBox(r.boundingBox)===!1)&&this._computeIntersections(e,t,rt)))}_computeIntersections(e,t,r){let n;const i=this.geometry,s=this.material,o=i.index,a=i.attributes.position,l=i.attributes.uv,h=i.attributes.uv1,c=i.attributes.normal,d=i.groups,f=i.drawRange;if(o!==null)if(Array.isArray(s))for(let p=0,y=d.length;p<y;p++){const b=d[p],v=s[b.materialIndex],_=Math.max(b.start,f.start),A=Math.min(o.count,Math.min(b.start+b.count,f.start+f.count));for(let M=_,T=A;M<T;M+=3){const z=o.getX(M),S=o.getX(M+1),R=o.getX(M+2);n=_r(this,v,e,r,l,h,c,z,S,R),n&&(n.faceIndex=Math.floor(M/3),n.face.materialIndex=b.materialIndex,t.push(n))}}else{const p=Math.max(0,f.start),y=Math.min(o.count,f.start+f.count);for(let b=p,v=y;b<v;b+=3){const _=o.getX(b),A=o.getX(b+1),M=o.getX(b+2);n=_r(this,s,e,r,l,h,c,_,A,M),n&&(n.faceIndex=Math.floor(b/3),t.push(n))}}else if(a!==void 0)if(Array.isArray(s))for(let p=0,y=d.length;p<y;p++){const b=d[p],v=s[b.materialIndex],_=Math.max(b.start,f.start),A=Math.min(a.count,Math.min(b.start+b.count,f.start+f.count));for(let M=_,T=A;M<T;M+=3){const z=M,S=M+1,R=M+2;n=_r(this,v,e,r,l,h,c,z,S,R),n&&(n.faceIndex=Math.floor(M/3),n.face.materialIndex=b.materialIndex,t.push(n))}}else{const p=Math.max(0,f.start),y=Math.min(a.count,f.start+f.count);for(let b=p,v=y;b<v;b+=3){const _=b,A=b+1,M=b+2;n=_r(this,s,e,r,l,h,c,_,A,M),n&&(n.faceIndex=Math.floor(b/3),t.push(n))}}}};function ya(u,e,t,r,n,i,s,o){let a;if(e.side===bo?a=r.intersectTriangle(s,i,n,!0,o):a=r.intersectTriangle(n,i,s,e.side===Pr,o),a===null)return null;Ir.copy(o),Ir.applyMatrix4(u.matrixWorld);const l=t.ray.origin.distanceTo(Ir);return l<t.near||l>t.far?null:{distance:l,point:Ir.clone(),object:u}}function _r(u,e,t,r,n,i,s,o,a,l){u.getVertexPosition(o,It),u.getVertexPosition(a,_t),u.getVertexPosition(l,Mt);const h=ya(u,e,t,r,It,_t,Mt,vr);if(h){n&&(xr.fromBufferAttribute(n,o),br.fromBufferAttribute(n,a),wr.fromBufferAttribute(n,l),h.uv=we.getInterpolation(vr,It,_t,Mt,xr,br,wr,new P)),i&&(xr.fromBufferAttribute(i,o),br.fromBufferAttribute(i,a),wr.fromBufferAttribute(i,l),h.uv1=we.getInterpolation(vr,It,_t,Mt,xr,br,wr,new P)),s&&(Ei.fromBufferAttribute(s,o),Bi.fromBufferAttribute(s,a),Pi.fromBufferAttribute(s,l),h.normal=we.getInterpolation(vr,It,_t,Mt,Ei,Bi,Pi,new w),h.normal.dot(r.direction)>0&&h.normal.multiplyScalar(-1));const c={a:o,b:a,c:l,normal:new w,materialIndex:0};we.getNormal(It,_t,Mt,c.normal),h.face=c}return h}class Is extends W{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new k,this.projectionMatrix=new k,this.projectionMatrixInverse=new k,this.coordinateSystem=st}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const qe=new w,Li=new P,Oi=new P;class Fr extends Is{constructor(e=50,t=1,r=.1,n=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=r,this.far=n,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=tr*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(Kt*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return tr*2*Math.atan(Math.tan(Kt*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,r){qe.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(qe.x,qe.y).multiplyScalar(-e/qe.z),qe.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),r.set(qe.x,qe.y).multiplyScalar(-e/qe.z)}getViewSize(e,t){return this.getViewBounds(e,Li,Oi),t.subVectors(Oi,Li)}setViewOffset(e,t,r,n,i,s){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=r,this.view.offsetY=n,this.view.width=i,this.view.height=s,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(Kt*.5*this.fov)/this.zoom,r=2*t,n=this.aspect*r,i=-.5*n;const s=this.view;if(this.view!==null&&this.view.enabled){const a=s.fullWidth,l=s.fullHeight;i+=s.offsetX*n/a,t-=s.offsetY*r/l,n*=s.width/a,r*=s.height/l}const o=this.filmOffset;o!==0&&(i+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(i,i+n,t,t-r,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}const ln=new w,ga=new w,xa=new Pe;class se{constructor(e=new w(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,r,n){return this.normal.set(e,t,r),this.constant=n,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,r){const n=ln.subVectors(r,t).cross(ga.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(n,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){const r=e.delta(ln),n=this.normal.dot(r);if(n===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const i=-(e.start.dot(this.normal)+this.constant)/n;return i<0||i>1?null:t.copy(e.start).addScaledVector(r,i)}intersectsLine(e){const t=this.distanceToPoint(e.start),r=this.distanceToPoint(e.end);return t<0&&r>0||r<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const r=t||xa.getNormalMatrix(e),n=this.coplanarPoint(ln).applyMatrix4(e),i=this.normal.applyMatrix3(r).normalize();return this.constant=-n.dot(i),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}}const nt=new be,Mr=new w;let ba=class{constructor(e=new se,t=new se,r=new se,n=new se,i=new se,s=new se){this.planes=[e,t,r,n,i,s]}set(e,t,r,n,i,s){const o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(r),o[3].copy(n),o[4].copy(i),o[5].copy(s),this}copy(e){const t=this.planes;for(let r=0;r<6;r++)t[r].copy(e.planes[r]);return this}setFromProjectionMatrix(e,t=st){const r=this.planes,n=e.elements,i=n[0],s=n[1],o=n[2],a=n[3],l=n[4],h=n[5],c=n[6],d=n[7],f=n[8],p=n[9],y=n[10],b=n[11],v=n[12],_=n[13],A=n[14],M=n[15];if(r[0].setComponents(a-i,d-l,b-f,M-v).normalize(),r[1].setComponents(a+i,d+l,b+f,M+v).normalize(),r[2].setComponents(a+s,d+h,b+p,M+_).normalize(),r[3].setComponents(a-s,d-h,b-p,M-_).normalize(),r[4].setComponents(a-o,d-c,b-y,M-A).normalize(),t===st)r[5].setComponents(a+o,d+c,b+y,M+A).normalize();else if(t===_n)r[5].setComponents(o,c,y,A).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),nt.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),nt.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(nt)}intersectsSprite(e){return nt.center.set(0,0,0),nt.radius=.7071067811865476,nt.applyMatrix4(e.matrixWorld),this.intersectsSphere(nt)}intersectsSphere(e){const t=this.planes,r=e.center,n=-e.radius;for(let i=0;i<6;i++)if(t[i].distanceToPoint(r)<n)return!1;return!0}intersectsBox(e){const t=this.planes;for(let r=0;r<6;r++){const n=t[r];if(Mr.x=n.normal.x>0?e.max.x:e.min.x,Mr.y=n.normal.y>0?e.max.y:e.min.y,Mr.z=n.normal.z>0?e.max.z:e.min.z,n.distanceToPoint(Mr)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let r=0;r<6;r++)if(t[r].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};class _s extends Is{constructor(e=-1,t=1,r=1,n=-1,i=.1,s=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=r,this.bottom=n,this.near=i,this.far=s,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,r,n,i,s){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=r,this.view.offsetY=n,this.view.width=i,this.view.height=s,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),r=(this.right+this.left)/2,n=(this.top+this.bottom)/2;let i=r-e,s=r+e,o=n+t,a=n-t;if(this.view!==null&&this.view.enabled){const l=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;i+=l*this.view.offsetX,s=i+l*this.view.width,o-=h*this.view.offsetY,a=o-h*this.view.height}this.projectionMatrix.makeOrthographic(i,s,o,a,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}class wa extends ue{constructor(e,t,r,n,i,s,o,a,l,h){if(h=h!==void 0?h:Ur,h!==Ur&&h!==ci)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");r===void 0&&h===Ur&&(r=To),r===void 0&&h===ci&&(r=Co),super(null,n,i,s,o,a,h,r,l),this.isDepthTexture=!0,this.image={width:e,height:t},this.magFilter=o!==void 0?o:Qt,this.minFilter=a!==void 0?a:Qt,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}}const va=new wa(1,1);va.compareFunction=Po;class Br extends W{constructor(){super(),this.isGroup=!0,this.type="Group"}}class Ia{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e!==void 0?e.length/t:0,this.usage=In,this._updateRange={offset:0,count:-1},this.updateRanges=[],this.version=0,this.uuid=xe()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}get updateRange(){return ws("THREE.InterleavedBuffer: updateRange() is deprecated and will be removed in r169. Use addUpdateRange() instead."),this._updateRange}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,r){e*=this.stride,r*=t.stride;for(let n=0,i=this.stride;n<i;n++)this.array[e+n]=t.array[r+n];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=xe()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);const t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),r=new this.constructor(t,this.stride);return r.setUsage(this.usage),r}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){return e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=xe()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}}const Q=new w;class Pn{constructor(e,t,r,n=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=e,this.itemSize=t,this.offset=r,this.normalized=n}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,r=this.data.count;t<r;t++)Q.fromBufferAttribute(this,t),Q.applyMatrix4(e),this.setXYZ(t,Q.x,Q.y,Q.z);return this}applyNormalMatrix(e){for(let t=0,r=this.count;t<r;t++)Q.fromBufferAttribute(this,t),Q.applyNormalMatrix(e),this.setXYZ(t,Q.x,Q.y,Q.z);return this}transformDirection(e){for(let t=0,r=this.count;t<r;t++)Q.fromBufferAttribute(this,t),Q.transformDirection(e),this.setXYZ(t,Q.x,Q.y,Q.z);return this}getComponent(e,t){let r=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(r=ge(r,this.array)),r}setComponent(e,t,r){return this.normalized&&(r=D(r,this.array)),this.data.array[e*this.data.stride+this.offset+t]=r,this}setX(e,t){return this.normalized&&(t=D(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=D(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=D(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=D(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=ge(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=ge(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=ge(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=ge(t,this.array)),t}setXY(e,t,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=D(t,this.array),r=D(r,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=r,this}setXYZ(e,t,r,n){return e=e*this.data.stride+this.offset,this.normalized&&(t=D(t,this.array),r=D(r,this.array),n=D(n,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=r,this.data.array[e+2]=n,this}setXYZW(e,t,r,n,i){return e=e*this.data.stride+this.offset,this.normalized&&(t=D(t,this.array),r=D(r,this.array),n=D(n,this.array),i=D(i,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=r,this.data.array[e+2]=n,this.data.array[e+3]=i,this}clone(e){if(e===void 0){console.log("THREE.InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");const t=[];for(let r=0;r<this.count;r++){const n=r*this.data.stride+this.offset;for(let i=0;i<this.itemSize;i++)t.push(this.data.array[n+i])}return new N(new this.array.constructor(t),this.itemSize,this.normalized)}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.clone(e)),new Pn(e.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){console.log("THREE.InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");const t=[];for(let r=0;r<this.count;r++){const n=r*this.data.stride+this.offset;for(let i=0;i<this.itemSize;i++)t.push(this.data.array[n+i])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:t,normalized:this.normalized}}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}}const Di=new w,Fi=new ce,Gi=new ce,_a=new w,Ni=new k,Ar=new w,hn=new be,Ui=new k,cn=new nr;class Ma extends Be{constructor(e,t){super(e,t),this.isSkinnedMesh=!0,this.type="SkinnedMesh",this.bindMode=hi,this.bindMatrix=new k,this.bindMatrixInverse=new k,this.boundingBox=null,this.boundingSphere=null}computeBoundingBox(){const e=this.geometry;this.boundingBox===null&&(this.boundingBox=new Le),this.boundingBox.makeEmpty();const t=e.getAttribute("position");for(let r=0;r<t.count;r++)this.getVertexPosition(r,Ar),this.boundingBox.expandByPoint(Ar)}computeBoundingSphere(){const e=this.geometry;this.boundingSphere===null&&(this.boundingSphere=new be),this.boundingSphere.makeEmpty();const t=e.getAttribute("position");for(let r=0;r<t.count;r++)this.getVertexPosition(r,Ar),this.boundingSphere.expandByPoint(Ar)}copy(e,t){return super.copy(e,t),this.bindMode=e.bindMode,this.bindMatrix.copy(e.bindMatrix),this.bindMatrixInverse.copy(e.bindMatrixInverse),this.skeleton=e.skeleton,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}raycast(e,t){const r=this.material,n=this.matrixWorld;r!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),hn.copy(this.boundingSphere),hn.applyMatrix4(n),e.ray.intersectsSphere(hn)!==!1&&(Ui.copy(n).invert(),cn.copy(e.ray).applyMatrix4(Ui),!(this.boundingBox!==null&&cn.intersectsBox(this.boundingBox)===!1)&&this._computeIntersections(e,t,cn)))}getVertexPosition(e,t){return super.getVertexPosition(e,t),this.applyBoneTransform(e,t),t}bind(e,t){this.skeleton=e,t===void 0&&(this.updateMatrixWorld(!0),this.skeleton.calculateInverses(),t=this.matrixWorld),this.bindMatrix.copy(t),this.bindMatrixInverse.copy(t).invert()}pose(){this.skeleton.pose()}normalizeSkinWeights(){const e=new ce,t=this.geometry.attributes.skinWeight;for(let r=0,n=t.count;r<n;r++){e.fromBufferAttribute(t,r);const i=1/e.manhattanLength();i!==1/0?e.multiplyScalar(i):e.set(1,0,0,0),t.setXYZW(r,e.x,e.y,e.z,e.w)}}updateMatrixWorld(e){super.updateMatrixWorld(e),this.bindMode===hi?this.bindMatrixInverse.copy(this.matrixWorld).invert():this.bindMode===Io?this.bindMatrixInverse.copy(this.bindMatrix).invert():console.warn("THREE.SkinnedMesh: Unrecognized bindMode: "+this.bindMode)}applyBoneTransform(e,t){const r=this.skeleton,n=this.geometry;Fi.fromBufferAttribute(n.attributes.skinIndex,e),Gi.fromBufferAttribute(n.attributes.skinWeight,e),Di.copy(t).applyMatrix4(this.bindMatrix),t.set(0,0,0);for(let i=0;i<4;i++){const s=Gi.getComponent(i);if(s!==0){const o=Fi.getComponent(i);Ni.multiplyMatrices(r.bones[o].matrixWorld,r.boneInverses[o]),t.addScaledVector(_a.copy(Di).applyMatrix4(Ni),s)}}return t.applyMatrix4(this.bindMatrixInverse)}}class Ms extends W{constructor(){super(),this.isBone=!0,this.type="Bone"}}class As extends ue{constructor(e=null,t=1,r=1,n,i,s,o,a,l=Qt,h=Qt,c,d){super(null,s,o,a,l,h,n,i,c,d),this.isDataTexture=!0,this.image={data:e,width:t,height:r},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const Vi=new k,Aa=new k;class Ln{constructor(e=[],t=[]){this.uuid=xe(),this.bones=e.slice(0),this.boneInverses=t,this.boneMatrices=null,this.boneTexture=null,this.init()}init(){const e=this.bones,t=this.boneInverses;if(this.boneMatrices=new Float32Array(e.length*16),t.length===0)this.calculateInverses();else if(e.length!==t.length){console.warn("THREE.Skeleton: Number of inverse bone matrices does not match amount of bones."),this.boneInverses=[];for(let r=0,n=this.bones.length;r<n;r++)this.boneInverses.push(new k)}}calculateInverses(){this.boneInverses.length=0;for(let e=0,t=this.bones.length;e<t;e++){const r=new k;this.bones[e]&&r.copy(this.bones[e].matrixWorld).invert(),this.boneInverses.push(r)}}pose(){for(let e=0,t=this.bones.length;e<t;e++){const r=this.bones[e];r&&r.matrixWorld.copy(this.boneInverses[e]).invert()}for(let e=0,t=this.bones.length;e<t;e++){const r=this.bones[e];r&&(r.parent&&r.parent.isBone?(r.matrix.copy(r.parent.matrixWorld).invert(),r.matrix.multiply(r.matrixWorld)):r.matrix.copy(r.matrixWorld),r.matrix.decompose(r.position,r.quaternion,r.scale))}}update(){const e=this.bones,t=this.boneInverses,r=this.boneMatrices,n=this.boneTexture;for(let i=0,s=e.length;i<s;i++){const o=e[i]?e[i].matrixWorld:Aa;Vi.multiplyMatrices(o,t[i]),Vi.toArray(r,i*16)}n!==null&&(n.needsUpdate=!0)}clone(){return new Ln(this.bones,this.boneInverses)}computeBoneTexture(){let e=Math.sqrt(this.bones.length*4);e=Math.ceil(e/4)*4,e=Math.max(e,4);const t=new Float32Array(e*e*4);t.set(this.boneMatrices);const r=new As(t,e,e,ms,kn);return r.needsUpdate=!0,this.boneMatrices=t,this.boneTexture=r,this}getBoneByName(e){for(let t=0,r=this.bones.length;t<r;t++){const n=this.bones[t];if(n.name===e)return n}}dispose(){this.boneTexture!==null&&(this.boneTexture.dispose(),this.boneTexture=null)}fromJSON(e,t){this.uuid=e.uuid;for(let r=0,n=e.bones.length;r<n;r++){const i=e.bones[r];let s=t[i];s===void 0&&(console.warn("THREE.Skeleton: No bone found with UUID:",i),s=new Ms),this.bones.push(s),this.boneInverses.push(new k().fromArray(e.boneInverses[r]))}return this.init(),this}toJSON(){const e={metadata:{version:4.6,type:"Skeleton",generator:"Skeleton.toJSON"},bones:[],boneInverses:[]};e.uuid=this.uuid;const t=this.bones,r=this.boneInverses;for(let n=0,i=t.length;n<i;n++){const s=t[n];e.bones.push(s.uuid);const o=r[n];e.boneInverses.push(o.toArray())}return e}}class An extends N{constructor(e,t,r,n=1){super(e,t,r),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=n}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){const e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}}const At=new k,Hi=new k,Sr=[],ji=new Le,Sa=new k,Vt=new Be,Ht=new be;class Ta extends Be{constructor(e,t,r){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new An(new Float32Array(r*16),16),this.instanceColor=null,this.morphTexture=null,this.count=r,this.boundingBox=null,this.boundingSphere=null;for(let n=0;n<r;n++)this.setMatrixAt(n,Sa)}computeBoundingBox(){const e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new Le),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let r=0;r<t;r++)this.getMatrixAt(r,At),ji.copy(e.boundingBox).applyMatrix4(At),this.boundingBox.union(ji)}computeBoundingSphere(){const e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new be),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let r=0;r<t;r++)this.getMatrixAt(r,At),Ht.copy(e.boundingSphere).applyMatrix4(At),this.boundingSphere.union(Ht)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){const r=t.morphTargetInfluences,n=this.morphTexture.source.data.data,i=r.length+1,s=e*i+1;for(let o=0;o<r.length;o++)r[o]=n[s+o]}raycast(e,t){const r=this.matrixWorld,n=this.count;if(Vt.geometry=this.geometry,Vt.material=this.material,Vt.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Ht.copy(this.boundingSphere),Ht.applyMatrix4(r),e.ray.intersectsSphere(Ht)!==!1))for(let i=0;i<n;i++){this.getMatrixAt(i,At),Hi.multiplyMatrices(r,At),Vt.matrixWorld=Hi,Vt.raycast(e,Sr);for(let s=0,o=Sr.length;s<o;s++){const a=Sr[s];a.instanceId=i,a.object=this,t.push(a)}Sr.length=0}}setColorAt(e,t){this.instanceColor===null&&(this.instanceColor=new An(new Float32Array(this.instanceMatrix.count*3),3)),t.toArray(this.instanceColor.array,e*3)}setMatrixAt(e,t){t.toArray(this.instanceMatrix.array,e*16)}setMorphAt(e,t){const r=t.morphTargetInfluences,n=r.length+1;this.morphTexture===null&&(this.morphTexture=new As(new Float32Array(n*this.count),n,this.count,Ro,kn));const i=this.morphTexture.source.data.data;let s=0;for(let l=0;l<r.length;l++)s+=r[l];const o=this.geometry.morphTargetsRelative?1:1-s,a=n*e;i[a]=o,i.set(r,a+1)}updateMorphTargets(){}dispose(){this.dispatchEvent({type:"dispose"})}}class Ss extends ot{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new X(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}}const Wi=new w,qi=new w,Xi=new k,un=new nr,Tr=new be;class On extends W{constructor(e=new ve,t=new Ss){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){const e=this.geometry;if(e.index===null){const t=e.attributes.position,r=[0];for(let n=1,i=t.count;n<i;n++)Wi.fromBufferAttribute(t,n-1),qi.fromBufferAttribute(t,n),r[n]=r[n-1],r[n]+=Wi.distanceTo(qi);e.setAttribute("lineDistance",new Bn(r,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){const r=this.geometry,n=this.matrixWorld,i=e.params.Line.threshold,s=r.drawRange;if(r.boundingSphere===null&&r.computeBoundingSphere(),Tr.copy(r.boundingSphere),Tr.applyMatrix4(n),Tr.radius+=i,e.ray.intersectsSphere(Tr)===!1)return;Xi.copy(n).invert(),un.copy(e.ray).applyMatrix4(Xi);const o=i/((this.scale.x+this.scale.y+this.scale.z)/3),a=o*o,l=new w,h=new w,c=new w,d=new w,f=this.isLineSegments?2:1,p=r.index,b=r.attributes.position;if(p!==null){const v=Math.max(0,s.start),_=Math.min(p.count,s.start+s.count);for(let A=v,M=_-1;A<M;A+=f){const T=p.getX(A),z=p.getX(A+1);if(l.fromBufferAttribute(b,T),h.fromBufferAttribute(b,z),un.distanceSqToSegment(l,h,d,c)>a)continue;d.applyMatrix4(this.matrixWorld);const R=e.ray.origin.distanceTo(d);R<e.near||R>e.far||t.push({distance:R,point:c.clone().applyMatrix4(this.matrixWorld),index:A,face:null,faceIndex:null,object:this})}}else{const v=Math.max(0,s.start),_=Math.min(b.count,s.start+s.count);for(let A=v,M=_-1;A<M;A+=f){if(l.fromBufferAttribute(b,A),h.fromBufferAttribute(b,A+1),un.distanceSqToSegment(l,h,d,c)>a)continue;d.applyMatrix4(this.matrixWorld);const z=e.ray.origin.distanceTo(d);z<e.near||z>e.far||t.push({distance:z,point:c.clone().applyMatrix4(this.matrixWorld),index:A,face:null,faceIndex:null,object:this})}}}updateMorphTargets(){const t=this.geometry.morphAttributes,r=Object.keys(t);if(r.length>0){const n=t[r[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let i=0,s=n.length;i<s;i++){const o=n[i].name||String(i);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=i}}}}}const Yi=new w,Ki=new w;class Ca extends On{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){const e=this.geometry;if(e.index===null){const t=e.attributes.position,r=[];for(let n=0,i=t.count;n<i;n+=2)Yi.fromBufferAttribute(t,n),Ki.fromBufferAttribute(t,n+1),r[n]=n===0?0:r[n-1],r[n+1]=r[n]+Yi.distanceTo(Ki);e.setAttribute("lineDistance",new Bn(r,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class Ra extends On{constructor(e,t){super(e,t),this.isLineLoop=!0,this.type="LineLoop"}}class Ts extends ot{constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new X(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}}const Zi=new k,Sn=new nr,Cr=new be,Rr=new w;class za extends W{constructor(e=new ve,t=new Ts){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}raycast(e,t){const r=this.geometry,n=this.matrixWorld,i=e.params.Points.threshold,s=r.drawRange;if(r.boundingSphere===null&&r.computeBoundingSphere(),Cr.copy(r.boundingSphere),Cr.applyMatrix4(n),Cr.radius+=i,e.ray.intersectsSphere(Cr)===!1)return;Zi.copy(n).invert(),Sn.copy(e.ray).applyMatrix4(Zi);const o=i/((this.scale.x+this.scale.y+this.scale.z)/3),a=o*o,l=r.index,c=r.attributes.position;if(l!==null){const d=Math.max(0,s.start),f=Math.min(l.count,s.start+s.count);for(let p=d,y=f;p<y;p++){const b=l.getX(p);Rr.fromBufferAttribute(c,b),Ji(Rr,b,a,n,e,t,this)}}else{const d=Math.max(0,s.start),f=Math.min(c.count,s.start+s.count);for(let p=d,y=f;p<y;p++)Rr.fromBufferAttribute(c,p),Ji(Rr,p,a,n,e,t,this)}}updateMorphTargets(){const t=this.geometry.morphAttributes,r=Object.keys(t);if(r.length>0){const n=t[r[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let i=0,s=n.length;i<s;i++){const o=n[i].name||String(i);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=i}}}}}function Ji(u,e,t,r,n,i,s){const o=Sn.distanceSqToPoint(u);if(o<t){const a=new w;Sn.closestPointToPoint(u,a),a.applyMatrix4(r);const l=n.ray.origin.distanceTo(a);if(l<n.near||l>n.far)return;i.push({distance:l,distanceToRay:Math.sqrt(o),point:a,index:e,face:null,object:s})}}class Dn extends ot{constructor(e){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.type="MeshStandardMaterial",this.color=new X(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new X(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Eo,this.normalScale=new P(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Et,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}class Oe extends Dn{constructor(e){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new P(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return K(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(t){this.ior=(1+.4*t)/(1-.4*t)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new X(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new X(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new X(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._iridescence=0,this._sheen=0,this._transmission=0,this.setValues(e)}get anisotropy(){return this._anisotropy}set anisotropy(e){this._anisotropy>0!=e>0&&this.version++,this._anisotropy=e}get clearcoat(){return this._clearcoat}set clearcoat(e){this._clearcoat>0!=e>0&&this.version++,this._clearcoat=e}get iridescence(){return this._iridescence}set iridescence(e){this._iridescence>0!=e>0&&this.version++,this._iridescence=e}get sheen(){return this._sheen}set sheen(e){this._sheen>0!=e>0&&this.version++,this._sheen=e}get transmission(){return this._transmission}set transmission(e){this._transmission>0!=e>0&&this.version++,this._transmission=e}copy(e){return super.copy(e),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=e.anisotropy,this.anisotropyRotation=e.anisotropyRotation,this.anisotropyMap=e.anisotropyMap,this.clearcoat=e.clearcoat,this.clearcoatMap=e.clearcoatMap,this.clearcoatRoughness=e.clearcoatRoughness,this.clearcoatRoughnessMap=e.clearcoatRoughnessMap,this.clearcoatNormalMap=e.clearcoatNormalMap,this.clearcoatNormalScale.copy(e.clearcoatNormalScale),this.ior=e.ior,this.iridescence=e.iridescence,this.iridescenceMap=e.iridescenceMap,this.iridescenceIOR=e.iridescenceIOR,this.iridescenceThicknessRange=[...e.iridescenceThicknessRange],this.iridescenceThicknessMap=e.iridescenceThicknessMap,this.sheen=e.sheen,this.sheenColor.copy(e.sheenColor),this.sheenColorMap=e.sheenColorMap,this.sheenRoughness=e.sheenRoughness,this.sheenRoughnessMap=e.sheenRoughnessMap,this.transmission=e.transmission,this.transmissionMap=e.transmissionMap,this.thickness=e.thickness,this.thicknessMap=e.thicknessMap,this.attenuationDistance=e.attenuationDistance,this.attenuationColor.copy(e.attenuationColor),this.specularIntensity=e.specularIntensity,this.specularIntensityMap=e.specularIntensityMap,this.specularColor.copy(e.specularColor),this.specularColorMap=e.specularColorMap,this}}function zr(u,e,t){return!u||!t&&u.constructor===e?u:typeof e.BYTES_PER_ELEMENT=="number"?new e(u):Array.prototype.slice.call(u)}function ka(u){return ArrayBuffer.isView(u)&&!(u instanceof DataView)}function Ea(u){function e(n,i){return u[n]-u[i]}const t=u.length,r=new Array(t);for(let n=0;n!==t;++n)r[n]=n;return r.sort(e),r}function $i(u,e,t){const r=u.length,n=new u.constructor(r);for(let i=0,s=0;s!==r;++i){const o=t[i]*e;for(let a=0;a!==e;++a)n[s++]=u[o+a]}return n}function Cs(u,e,t,r){let n=1,i=u[0];for(;i!==void 0&&i[r]===void 0;)i=u[n++];if(i===void 0)return;let s=i[r];if(s!==void 0)if(Array.isArray(s))do s=i[r],s!==void 0&&(e.push(i.time),t.push.apply(t,s)),i=u[n++];while(i!==void 0);else if(s.toArray!==void 0)do s=i[r],s!==void 0&&(e.push(i.time),s.toArray(t,t.length)),i=u[n++];while(i!==void 0);else do s=i[r],s!==void 0&&(e.push(i.time),t.push(s)),i=u[n++];while(i!==void 0)}class ir{constructor(e,t,r,n){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=n!==void 0?n:new t.constructor(r),this.sampleValues=t,this.valueSize=r,this.settings=null,this.DefaultSettings_={}}evaluate(e){const t=this.parameterPositions;let r=this._cachedIndex,n=t[r],i=t[r-1];r:{e:{let s;t:{n:if(!(e<n)){for(let o=r+2;;){if(n===void 0){if(e<i)break n;return r=t.length,this._cachedIndex=r,this.copySampleValue_(r-1)}if(r===o)break;if(i=n,n=t[++r],e<n)break e}s=t.length;break t}if(!(e>=i)){const o=t[1];e<o&&(r=2,i=o);for(let a=r-2;;){if(i===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(r===a)break;if(n=i,i=t[--r-1],e>=i)break e}s=r,r=0;break t}break r}for(;r<s;){const o=r+s>>>1;e<t[o]?s=o:r=o+1}if(n=t[r],i=t[r-1],i===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===void 0)return r=t.length,this._cachedIndex=r,this.copySampleValue_(r-1)}this._cachedIndex=r,this.intervalChanged_(r,i,n)}return this.interpolate_(r,i,e,n)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){const t=this.resultBuffer,r=this.sampleValues,n=this.valueSize,i=e*n;for(let s=0;s!==n;++s)t[s]=r[i+s];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}}class Ba extends ir{constructor(e,t,r,n){super(e,t,r,n),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:ui,endingEnd:ui}}intervalChanged_(e,t,r){const n=this.parameterPositions;let i=e-2,s=e+1,o=n[i],a=n[s];if(o===void 0)switch(this.getSettings_().endingStart){case di:i=e,o=2*t-r;break;case fi:i=n.length-2,o=t+n[i]-n[i+1];break;default:i=e,o=r}if(a===void 0)switch(this.getSettings_().endingEnd){case di:s=e,a=2*r-t;break;case fi:s=1,a=r+n[1]-n[0];break;default:s=e-1,a=t}const l=(r-t)*.5,h=this.valueSize;this._weightPrev=l/(t-o),this._weightNext=l/(a-r),this._offsetPrev=i*h,this._offsetNext=s*h}interpolate_(e,t,r,n){const i=this.resultBuffer,s=this.sampleValues,o=this.valueSize,a=e*o,l=a-o,h=this._offsetPrev,c=this._offsetNext,d=this._weightPrev,f=this._weightNext,p=(r-t)/(n-t),y=p*p,b=y*p,v=-d*b+2*d*y-d*p,_=(1+d)*b+(-1.5-2*d)*y+(-.5+d)*p+1,A=(-1-f)*b+(1.5+f)*y+.5*p,M=f*b-f*y;for(let T=0;T!==o;++T)i[T]=v*s[h+T]+_*s[l+T]+A*s[a+T]+M*s[c+T];return i}}class Pa extends ir{constructor(e,t,r,n){super(e,t,r,n)}interpolate_(e,t,r,n){const i=this.resultBuffer,s=this.sampleValues,o=this.valueSize,a=e*o,l=a-o,h=(r-t)/(n-t),c=1-h;for(let d=0;d!==o;++d)i[d]=s[l+d]*c+s[a+d]*h;return i}}class La extends ir{constructor(e,t,r,n){super(e,t,r,n)}interpolate_(e){return this.copySampleValue_(e-1)}}class _e{constructor(e,t,r,n){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=zr(t,this.TimeBufferType),this.values=zr(r,this.ValueBufferType),this.setInterpolation(n||this.DefaultInterpolation)}static toJSON(e){const t=e.constructor;let r;if(t.toJSON!==this.toJSON)r=t.toJSON(e);else{r={name:e.name,times:zr(e.times,Array),values:zr(e.values,Array)};const n=e.getInterpolation();n!==e.DefaultInterpolation&&(r.interpolation=n)}return r.type=e.ValueTypeName,r}InterpolantFactoryMethodDiscrete(e){return new La(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new Pa(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new Ba(this.times,this.values,this.getValueSize(),e)}setInterpolation(e){let t;switch(e){case er:t=this.InterpolantFactoryMethodDiscrete;break;case Rt:t=this.InterpolantFactoryMethodLinear;break;case Vr:t=this.InterpolantFactoryMethodSmooth;break}if(t===void 0){const r="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(r);return console.warn("THREE.KeyframeTrack:",r),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return er;case this.InterpolantFactoryMethodLinear:return Rt;case this.InterpolantFactoryMethodSmooth:return Vr}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){const t=this.times;for(let r=0,n=t.length;r!==n;++r)t[r]+=e}return this}scale(e){if(e!==1){const t=this.times;for(let r=0,n=t.length;r!==n;++r)t[r]*=e}return this}trim(e,t){const r=this.times,n=r.length;let i=0,s=n-1;for(;i!==n&&r[i]<e;)++i;for(;s!==-1&&r[s]>t;)--s;if(++s,i!==0||s!==n){i>=s&&(s=Math.max(s,1),i=s-1);const o=this.getValueSize();this.times=r.slice(i,s),this.values=this.values.slice(i*o,s*o)}return this}validate(){let e=!0;const t=this.getValueSize();t-Math.floor(t)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),e=!1);const r=this.times,n=this.values,i=r.length;i===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),e=!1);let s=null;for(let o=0;o!==i;o++){const a=r[o];if(typeof a=="number"&&isNaN(a)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,o,a),e=!1;break}if(s!==null&&s>a){console.error("THREE.KeyframeTrack: Out of order keys.",this,o,a,s),e=!1;break}s=a}if(n!==void 0&&ka(n))for(let o=0,a=n.length;o!==a;++o){const l=n[o];if(isNaN(l)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,o,l),e=!1;break}}return e}optimize(){const e=this.times.slice(),t=this.values.slice(),r=this.getValueSize(),n=this.getInterpolation()===Vr,i=e.length-1;let s=1;for(let o=1;o<i;++o){let a=!1;const l=e[o],h=e[o+1];if(l!==h&&(o!==1||l!==e[0]))if(n)a=!0;else{const c=o*r,d=c-r,f=c+r;for(let p=0;p!==r;++p){const y=t[c+p];if(y!==t[d+p]||y!==t[f+p]){a=!0;break}}}if(a){if(o!==s){e[s]=e[o];const c=o*r,d=s*r;for(let f=0;f!==r;++f)t[d+f]=t[c+f]}++s}}if(i>0){e[s]=e[i];for(let o=i*r,a=s*r,l=0;l!==r;++l)t[a+l]=t[o+l];++s}return s!==e.length?(this.times=e.slice(0,s),this.values=t.slice(0,s*r)):(this.times=e,this.values=t),this}clone(){const e=this.times.slice(),t=this.values.slice(),r=this.constructor,n=new r(this.name,e,t);return n.createInterpolant=this.createInterpolant,n}}_e.prototype.TimeBufferType=Float32Array;_e.prototype.ValueBufferType=Float32Array;_e.prototype.DefaultInterpolation=Rt;class Bt extends _e{}Bt.prototype.ValueTypeName="bool";Bt.prototype.ValueBufferType=Array;Bt.prototype.DefaultInterpolation=er;Bt.prototype.InterpolantFactoryMethodLinear=void 0;Bt.prototype.InterpolantFactoryMethodSmooth=void 0;class Rs extends _e{}Rs.prototype.ValueTypeName="color";class zt extends _e{}zt.prototype.ValueTypeName="number";class Oa extends ir{constructor(e,t,r,n){super(e,t,r,n)}interpolate_(e,t,r,n){const i=this.resultBuffer,s=this.sampleValues,o=this.valueSize,a=(r-t)/(n-t);let l=e*o;for(let h=l+o;l!==h;l+=4)Ie.slerpFlat(i,0,s,l-o,s,l,a);return i}}class at extends _e{InterpolantFactoryMethodLinear(e){return new Oa(this.times,this.values,this.getValueSize(),e)}}at.prototype.ValueTypeName="quaternion";at.prototype.DefaultInterpolation=Rt;at.prototype.InterpolantFactoryMethodSmooth=void 0;class Pt extends _e{}Pt.prototype.ValueTypeName="string";Pt.prototype.ValueBufferType=Array;Pt.prototype.DefaultInterpolation=er;Pt.prototype.InterpolantFactoryMethodLinear=void 0;Pt.prototype.InterpolantFactoryMethodSmooth=void 0;class kt extends _e{}kt.prototype.ValueTypeName="vector";class Da{constructor(e,t=-1,r,n=zo){this.name=e,this.tracks=r,this.duration=t,this.blendMode=n,this.uuid=xe(),this.duration<0&&this.resetDuration()}static parse(e){const t=[],r=e.tracks,n=1/(e.fps||1);for(let s=0,o=r.length;s!==o;++s)t.push(Ga(r[s]).scale(n));const i=new this(e.name,e.duration,t,e.blendMode);return i.uuid=e.uuid,i}static toJSON(e){const t=[],r=e.tracks,n={name:e.name,duration:e.duration,tracks:t,uuid:e.uuid,blendMode:e.blendMode};for(let i=0,s=r.length;i!==s;++i)t.push(_e.toJSON(r[i]));return n}static CreateFromMorphTargetSequence(e,t,r,n){const i=t.length,s=[];for(let o=0;o<i;o++){let a=[],l=[];a.push((o+i-1)%i,o,(o+1)%i),l.push(0,1,0);const h=Ea(a);a=$i(a,1,h),l=$i(l,1,h),!n&&a[0]===0&&(a.push(i),l.push(l[0])),s.push(new zt(".morphTargetInfluences["+t[o].name+"]",a,l).scale(1/r))}return new this(e,-1,s)}static findByName(e,t){let r=e;if(!Array.isArray(e)){const n=e;r=n.geometry&&n.geometry.animations||n.animations}for(let n=0;n<r.length;n++)if(r[n].name===t)return r[n];return null}static CreateClipsFromMorphTargetSequences(e,t,r){const n={},i=/^([\w-]*?)([\d]+)$/;for(let o=0,a=e.length;o<a;o++){const l=e[o],h=l.name.match(i);if(h&&h.length>1){const c=h[1];let d=n[c];d||(n[c]=d=[]),d.push(l)}}const s=[];for(const o in n)s.push(this.CreateFromMorphTargetSequence(o,n[o],t,r));return s}static parseAnimation(e,t){if(!e)return console.error("THREE.AnimationClip: No animation in JSONLoader data."),null;const r=function(c,d,f,p,y){if(f.length!==0){const b=[],v=[];Cs(f,b,v,p),b.length!==0&&y.push(new c(d,b,v))}},n=[],i=e.name||"default",s=e.fps||30,o=e.blendMode;let a=e.length||-1;const l=e.hierarchy||[];for(let c=0;c<l.length;c++){const d=l[c].keys;if(!(!d||d.length===0))if(d[0].morphTargets){const f={};let p;for(p=0;p<d.length;p++)if(d[p].morphTargets)for(let y=0;y<d[p].morphTargets.length;y++)f[d[p].morphTargets[y]]=-1;for(const y in f){const b=[],v=[];for(let _=0;_!==d[p].morphTargets.length;++_){const A=d[p];b.push(A.time),v.push(A.morphTarget===y?1:0)}n.push(new zt(".morphTargetInfluence["+y+"]",b,v))}a=f.length*s}else{const f=".bones["+t[c].name+"]";r(kt,f+".position",d,"pos",n),r(at,f+".quaternion",d,"rot",n),r(kt,f+".scale",d,"scl",n)}}return n.length===0?null:new this(i,a,n,o)}resetDuration(){const e=this.tracks;let t=0;for(let r=0,n=e.length;r!==n;++r){const i=this.tracks[r];t=Math.max(t,i.times[i.times.length-1])}return this.duration=t,this}trim(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].trim(0,this.duration);return this}validate(){let e=!0;for(let t=0;t<this.tracks.length;t++)e=e&&this.tracks[t].validate();return e}optimize(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].optimize();return this}clone(){const e=[];for(let t=0;t<this.tracks.length;t++)e.push(this.tracks[t].clone());return new this.constructor(this.name,this.duration,e,this.blendMode)}toJSON(){return this.constructor.toJSON(this)}}function Fa(u){switch(u.toLowerCase()){case"scalar":case"double":case"float":case"number":case"integer":return zt;case"vector":case"vector2":case"vector3":case"vector4":return kt;case"color":return Rs;case"quaternion":return at;case"bool":case"boolean":return Bt;case"string":return Pt}throw new Error("THREE.KeyframeTrack: Unsupported typeName: "+u)}function Ga(u){if(u.type===void 0)throw new Error("THREE.KeyframeTrack: track type undefined, can not parse");const e=Fa(u.type);if(u.times===void 0){const t=[],r=[];Cs(u.keys,t,r,"value"),u.times=t,u.values=r}return e.parse!==void 0?e.parse(u):new e(u.name,u.times,u.values,u.interpolation)}const Ke={enabled:!1,files:{},add:function(u,e){this.enabled!==!1&&(this.files[u]=e)},get:function(u){if(this.enabled!==!1)return this.files[u]},remove:function(u){delete this.files[u]},clear:function(){this.files={}}};class Na{constructor(e,t,r){const n=this;let i=!1,s=0,o=0,a;const l=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=r,this.itemStart=function(h){o++,i===!1&&n.onStart!==void 0&&n.onStart(h,s,o),i=!0},this.itemEnd=function(h){s++,n.onProgress!==void 0&&n.onProgress(h,s,o),s===o&&(i=!1,n.onLoad!==void 0&&n.onLoad())},this.itemError=function(h){n.onError!==void 0&&n.onError(h)},this.resolveURL=function(h){return a?a(h):h},this.setURLModifier=function(h){return a=h,this},this.addHandler=function(h,c){return l.push(h,c),this},this.removeHandler=function(h){const c=l.indexOf(h);return c!==-1&&l.splice(c,2),this},this.getHandler=function(h){for(let c=0,d=l.length;c<d;c+=2){const f=l[c],p=l[c+1];if(f.global&&(f.lastIndex=0),f.test(h))return p}return null}}}const Ua=new Na;class lt{constructor(e){this.manager=e!==void 0?e:Ua,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){const r=this;return new Promise(function(n,i){r.load(e,n,t,i)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}}lt.DEFAULT_MATERIAL_NAME="__DEFAULT";const Ee={};class Va extends Error{constructor(e,t){super(e),this.response=t}}class Lr extends lt{constructor(e){super(e)}load(e,t,r,n){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);const i=Ke.get(e);if(i!==void 0)return this.manager.itemStart(e),setTimeout(()=>{t&&t(i),this.manager.itemEnd(e)},0),i;if(Ee[e]!==void 0){Ee[e].push({onLoad:t,onProgress:r,onError:n});return}Ee[e]=[],Ee[e].push({onLoad:t,onProgress:r,onError:n});const s=new Request(e,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin"}),o=this.mimeType,a=this.responseType;fetch(s).then(l=>{if(l.status===200||l.status===0){if(l.status===0&&console.warn("THREE.FileLoader: HTTP Status 0 received."),typeof ReadableStream>"u"||l.body===void 0||l.body.getReader===void 0)return l;const h=Ee[e],c=l.body.getReader(),d=l.headers.get("Content-Length")||l.headers.get("X-File-Size"),f=d?parseInt(d):0,p=f!==0;let y=0;const b=new ReadableStream({start(v){_();function _(){c.read().then(({done:A,value:M})=>{if(A)v.close();else{y+=M.byteLength;const T=new ProgressEvent("progress",{lengthComputable:p,loaded:y,total:f});for(let z=0,S=h.length;z<S;z++){const R=h[z];R.onProgress&&R.onProgress(T)}v.enqueue(M),_()}})}}});return new Response(b)}else throw new Va(`fetch for "${l.url}" responded with ${l.status}: ${l.statusText}`,l)}).then(l=>{switch(a){case"arraybuffer":return l.arrayBuffer();case"blob":return l.blob();case"document":return l.text().then(h=>new DOMParser().parseFromString(h,o));case"json":return l.json();default:if(o===void 0)return l.text();{const c=/charset="?([^;"\s]*)"?/i.exec(o),d=c&&c[1]?c[1].toLowerCase():void 0,f=new TextDecoder(d);return l.arrayBuffer().then(p=>f.decode(p))}}}).then(l=>{Ke.add(e,l);const h=Ee[e];delete Ee[e];for(let c=0,d=h.length;c<d;c++){const f=h[c];f.onLoad&&f.onLoad(l)}}).catch(l=>{const h=Ee[e];if(h===void 0)throw this.manager.itemError(e),l;delete Ee[e];for(let c=0,d=h.length;c<d;c++){const f=h[c];f.onError&&f.onError(l)}this.manager.itemError(e)}).finally(()=>{this.manager.itemEnd(e)}),this.manager.itemStart(e)}setResponseType(e){return this.responseType=e,this}setMimeType(e){return this.mimeType=e,this}}class Ha extends lt{constructor(e){super(e)}load(e,t,r,n){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);const i=this,s=Ke.get(e);if(s!==void 0)return i.manager.itemStart(e),setTimeout(function(){t&&t(s),i.manager.itemEnd(e)},0),s;const o=Mn("img");function a(){h(),Ke.add(e,this),t&&t(this),i.manager.itemEnd(e)}function l(c){h(),n&&n(c),i.manager.itemError(e),i.manager.itemEnd(e)}function h(){o.removeEventListener("load",a,!1),o.removeEventListener("error",l,!1)}return o.addEventListener("load",a,!1),o.addEventListener("error",l,!1),e.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(o.crossOrigin=this.crossOrigin),i.manager.itemStart(e),o.src=e,o}}class ja extends lt{constructor(e){super(e)}load(e,t,r,n){const i=new ue,s=new Ha(this.manager);return s.setCrossOrigin(this.crossOrigin),s.setPath(this.path),s.load(e,function(o){i.image=o,i.needsUpdate=!0,t!==void 0&&t(i)},r,n),i}}class Fn extends W{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new X(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){const t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),t}}const dn=new k,Qi=new w,es=new w;class Gn{constructor(e){this.camera=e,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new P(512,512),this.map=null,this.mapPass=null,this.matrix=new k,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new ba,this._frameExtents=new P(1,1),this._viewportCount=1,this._viewports=[new ce(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){const t=this.camera,r=this.matrix;Qi.setFromMatrixPosition(e.matrixWorld),t.position.copy(Qi),es.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(es),t.updateMatrixWorld(),dn.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(dn),r.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),r.multiply(dn)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.bias=e.bias,this.radius=e.radius,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const e={};return this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}}class Wa extends Gn{constructor(){super(new Fr(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1}updateMatrices(e){const t=this.camera,r=tr*2*e.angle*this.focus,n=this.mapSize.width/this.mapSize.height,i=e.distance||t.far;(r!==t.fov||n!==t.aspect||i!==t.far)&&(t.fov=r,t.aspect=n,t.far=i,t.updateProjectionMatrix()),super.updateMatrices(e)}copy(e){return super.copy(e),this.focus=e.focus,this}}class qa extends Fn{constructor(e,t,r=0,n=Math.PI/3,i=0,s=2){super(e,t),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(W.DEFAULT_UP),this.updateMatrix(),this.target=new W,this.distance=r,this.angle=n,this.penumbra=i,this.decay=s,this.map=null,this.shadow=new Wa}get power(){return this.intensity*Math.PI}set power(e){this.intensity=e/Math.PI}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.angle=e.angle,this.penumbra=e.penumbra,this.decay=e.decay,this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}}const ts=new k,jt=new w,fn=new w;class Xa extends Gn{constructor(){super(new Fr(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new P(4,2),this._viewportCount=6,this._viewports=[new ce(2,1,1,1),new ce(0,1,1,1),new ce(3,1,1,1),new ce(1,1,1,1),new ce(3,0,1,1),new ce(1,0,1,1)],this._cubeDirections=[new w(1,0,0),new w(-1,0,0),new w(0,0,1),new w(0,0,-1),new w(0,1,0),new w(0,-1,0)],this._cubeUps=[new w(0,1,0),new w(0,1,0),new w(0,1,0),new w(0,1,0),new w(0,0,1),new w(0,0,-1)]}updateMatrices(e,t=0){const r=this.camera,n=this.matrix,i=e.distance||r.far;i!==r.far&&(r.far=i,r.updateProjectionMatrix()),jt.setFromMatrixPosition(e.matrixWorld),r.position.copy(jt),fn.copy(r.position),fn.add(this._cubeDirections[t]),r.up.copy(this._cubeUps[t]),r.lookAt(fn),r.updateMatrixWorld(),n.makeTranslation(-jt.x,-jt.y,-jt.z),ts.multiplyMatrices(r.projectionMatrix,r.matrixWorldInverse),this._frustum.setFromProjectionMatrix(ts)}}class Ya extends Fn{constructor(e,t,r=0,n=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=r,this.decay=n,this.shadow=new Xa}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}}class Ka extends Gn{constructor(){super(new _s(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class Za extends Fn{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(W.DEFAULT_UP),this.updateMatrix(),this.target=new W,this.shadow=new Ka}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}}class Jt{static decodeText(e){if(typeof TextDecoder<"u")return new TextDecoder().decode(e);let t="";for(let r=0,n=e.length;r<n;r++)t+=String.fromCharCode(e[r]);try{return decodeURIComponent(escape(t))}catch{return t}}static extractUrlBase(e){const t=e.lastIndexOf("/");return t===-1?"./":e.slice(0,t+1)}static resolveURL(e,t){return typeof e!="string"||e===""?"":(/^https?:\/\//i.test(t)&&/^\//.test(e)&&(t=t.replace(/(^https?:\/\/[^\/]+).*/i,"$1")),/^(https?:)?\/\//i.test(e)||/^data:.*,.*$/i.test(e)||/^blob:.*$/i.test(e)?e:t+e)}}class Ja extends lt{constructor(e){super(e),this.isImageBitmapLoader=!0,typeof createImageBitmap>"u"&&console.warn("THREE.ImageBitmapLoader: createImageBitmap() not supported."),typeof fetch>"u"&&console.warn("THREE.ImageBitmapLoader: fetch() not supported."),this.options={premultiplyAlpha:"none"}}setOptions(e){return this.options=e,this}load(e,t,r,n){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);const i=this,s=Ke.get(e);if(s!==void 0){if(i.manager.itemStart(e),s.then){s.then(l=>{t&&t(l),i.manager.itemEnd(e)}).catch(l=>{n&&n(l)});return}return setTimeout(function(){t&&t(s),i.manager.itemEnd(e)},0),s}const o={};o.credentials=this.crossOrigin==="anonymous"?"same-origin":"include",o.headers=this.requestHeader;const a=fetch(e,o).then(function(l){return l.blob()}).then(function(l){return createImageBitmap(l,Object.assign(i.options,{colorSpaceConversion:"none"}))}).then(function(l){return Ke.add(e,l),t&&t(l),i.manager.itemEnd(e),l}).catch(function(l){n&&n(l),Ke.remove(e),i.manager.itemError(e),i.manager.itemEnd(e)});Ke.add(e,a),i.manager.itemStart(e)}}const Nn="\\[\\]\\.:\\/",$a=new RegExp("["+Nn+"]","g"),Un="[^"+Nn+"]",Qa="[^"+Nn.replace("\\.","")+"]",el=/((?:WC+[\/:])*)/.source.replace("WC",Un),tl=/(WCOD+)?/.source.replace("WCOD",Qa),rl=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Un),nl=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Un),il=new RegExp("^"+el+tl+rl+nl+"$"),sl=["material","materials","bones","map"];class ol{constructor(e,t,r){const n=r||F.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,n)}getValue(e,t){this.bind();const r=this._targetGroup.nCachedObjects_,n=this._bindings[r];n!==void 0&&n.getValue(e,t)}setValue(e,t){const r=this._bindings;for(let n=this._targetGroup.nCachedObjects_,i=r.length;n!==i;++n)r[n].setValue(e,t)}bind(){const e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,r=e.length;t!==r;++t)e[t].bind()}unbind(){const e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,r=e.length;t!==r;++t)e[t].unbind()}}class F{constructor(e,t,r){this.path=t,this.parsedPath=r||F.parseTrackName(t),this.node=F.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,r){return e&&e.isAnimationObjectGroup?new F.Composite(e,t,r):new F(e,t,r)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace($a,"")}static parseTrackName(e){const t=il.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);const r={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},n=r.nodeName&&r.nodeName.lastIndexOf(".");if(n!==void 0&&n!==-1){const i=r.nodeName.substring(n+1);sl.indexOf(i)!==-1&&(r.nodeName=r.nodeName.substring(0,n),r.objectName=i)}if(r.propertyName===null||r.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return r}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){const r=e.skeleton.getBoneByName(t);if(r!==void 0)return r}if(e.children){const r=function(i){for(let s=0;s<i.length;s++){const o=i[s];if(o.name===t||o.uuid===t)return o;const a=r(o.children);if(a)return a}return null},n=r(e.children);if(n)return n}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){const r=this.resolvedProperty;for(let n=0,i=r.length;n!==i;++n)e[t++]=r[n]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){const r=this.resolvedProperty;for(let n=0,i=r.length;n!==i;++n)r[n]=e[t++]}_setValue_array_setNeedsUpdate(e,t){const r=this.resolvedProperty;for(let n=0,i=r.length;n!==i;++n)r[n]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){const r=this.resolvedProperty;for(let n=0,i=r.length;n!==i;++n)r[n]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node;const t=this.parsedPath,r=t.objectName,n=t.propertyName;let i=t.propertyIndex;if(e||(e=F.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(r){let l=t.objectIndex;switch(r){case"materials":if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let h=0;h<e.length;h++)if(e[h].name===l){l=h;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[r]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[r]}if(l!==void 0){if(e[l]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[l]}}const s=e[n];if(s===void 0){const l=t.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+l+"."+n+" but it wasn't found.",e);return}let o=this.Versioning.None;this.targetObject=e,e.needsUpdate!==void 0?o=this.Versioning.NeedsUpdate:e.matrixWorldNeedsUpdate!==void 0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let a=this.BindingType.Direct;if(i!==void 0){if(n==="morphTargetInfluences"){if(!e.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[i]!==void 0&&(i=e.morphTargetDictionary[i])}a=this.BindingType.ArrayElement,this.resolvedProperty=s,this.propertyIndex=i}else s.fromArray!==void 0&&s.toArray!==void 0?(a=this.BindingType.HasFromToArray,this.resolvedProperty=s):Array.isArray(s)?(a=this.BindingType.EntireArray,this.resolvedProperty=s):this.propertyName=n;this.getValue=this.GetterByBindingType[a],this.setValue=this.SetterByBindingTypeAndVersioning[a][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}}F.Composite=ol;F.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};F.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};F.prototype.GetterByBindingType=[F.prototype._getValue_direct,F.prototype._getValue_array,F.prototype._getValue_arrayElement,F.prototype._getValue_toArray];F.prototype.SetterByBindingTypeAndVersioning=[[F.prototype._setValue_direct,F.prototype._setValue_direct_setNeedsUpdate,F.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[F.prototype._setValue_array,F.prototype._setValue_array_setNeedsUpdate,F.prototype._setValue_array_setMatrixWorldNeedsUpdate],[F.prototype._setValue_arrayElement,F.prototype._setValue_arrayElement_setNeedsUpdate,F.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[F.prototype._setValue_fromArray,F.prototype._setValue_fromArray_setNeedsUpdate,F.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];class rs{constructor(e=1,t=0,r=0){return this.radius=e,this.phi=t,this.theta=r,this}set(e,t,r){return this.radius=e,this.phi=t,this.theta=r,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){return this.phi=Math.max(1e-6,Math.min(Math.PI-1e-6,this.phi)),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,r){return this.radius=Math.sqrt(e*e+t*t+r*r),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,r),this.phi=Math.acos(K(t/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:fs}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=fs);const ns={type:"change"},pn={type:"start"},is={type:"end"},kr=new nr,ss=new se,al=Math.cos(70*bs.DEG2RAD);class ll extends rr{constructor(e,t){super(),this.object=e,this.domElement=t,this.domElement.style.touchAction="none",this.enabled=!0,this.target=new w,this.cursor=new w,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:ct.ROTATE,MIDDLE:ct.DOLLY,RIGHT:ct.PAN},this.touches={ONE:ut.ROTATE,TWO:ut.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._domElementKeyEvents=null,this.getPolarAngle=function(){return o.phi},this.getAzimuthalAngle=function(){return o.theta},this.getDistance=function(){return this.object.position.distanceTo(this.target)},this.listenToKeyEvents=function(m){m.addEventListener("keydown",Nr),this._domElementKeyEvents=m},this.stopListenToKeyEvents=function(){this._domElementKeyEvents.removeEventListener("keydown",Nr),this._domElementKeyEvents=null},this.saveState=function(){r.target0.copy(r.target),r.position0.copy(r.object.position),r.zoom0=r.object.zoom},this.reset=function(){r.target.copy(r.target0),r.object.position.copy(r.position0),r.object.zoom=r.zoom0,r.object.updateProjectionMatrix(),r.dispatchEvent(ns),r.update(),i=n.NONE},this.update=function(){const m=new w,C=new Ie().setFromUnitVectors(e.up,new w(0,1,0)),E=C.clone().invert(),G=new w,$=new Ie,Ne=new w,ae=2*Math.PI;return function(Js=null){const ri=r.object.position;m.copy(ri).sub(r.target),m.applyQuaternion(C),o.setFromVector3(m),r.autoRotate&&i===n.NONE&&te(V(Js)),r.enableDamping?(o.theta+=a.theta*r.dampingFactor,o.phi+=a.phi*r.dampingFactor):(o.theta+=a.theta,o.phi+=a.phi);let Me=r.minAzimuthAngle,Ae=r.maxAzimuthAngle;isFinite(Me)&&isFinite(Ae)&&(Me<-Math.PI?Me+=ae:Me>Math.PI&&(Me-=ae),Ae<-Math.PI?Ae+=ae:Ae>Math.PI&&(Ae-=ae),Me<=Ae?o.theta=Math.max(Me,Math.min(Ae,o.theta)):o.theta=o.theta>(Me+Ae)/2?Math.max(Me,o.theta):Math.min(Ae,o.theta)),o.phi=Math.max(r.minPolarAngle,Math.min(r.maxPolarAngle,o.phi)),o.makeSafe(),r.enableDamping===!0?r.target.addScaledVector(h,r.dampingFactor):r.target.add(h),r.target.sub(r.cursor),r.target.clampLength(r.minTargetRadius,r.maxTargetRadius),r.target.add(r.cursor);let Ot=!1;if(r.zoomToCursor&&z||r.object.isOrthographicCamera)o.radius=Ge(o.radius);else{const Se=o.radius;o.radius=Ge(o.radius*l),Ot=Se!=o.radius}if(m.setFromSpherical(o),m.applyQuaternion(E),ri.copy(r.target).add(m),r.object.lookAt(r.target),r.enableDamping===!0?(a.theta*=1-r.dampingFactor,a.phi*=1-r.dampingFactor,h.multiplyScalar(1-r.dampingFactor)):(a.set(0,0,0),h.set(0,0,0)),r.zoomToCursor&&z){let Se=null;if(r.object.isPerspectiveCamera){const Dt=m.length();Se=Ge(Dt*l);const sr=Dt-Se;r.object.position.addScaledVector(M,sr),r.object.updateMatrixWorld(),Ot=!!sr}else if(r.object.isOrthographicCamera){const Dt=new w(T.x,T.y,0);Dt.unproject(r.object);const sr=r.object.zoom;r.object.zoom=Math.max(r.minZoom,Math.min(r.maxZoom,r.object.zoom/l)),r.object.updateProjectionMatrix(),Ot=sr!==r.object.zoom;const ni=new w(T.x,T.y,0);ni.unproject(r.object),r.object.position.sub(ni).add(Dt),r.object.updateMatrixWorld(),Se=m.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),r.zoomToCursor=!1;Se!==null&&(this.screenSpacePanning?r.target.set(0,0,-1).transformDirection(r.object.matrix).multiplyScalar(Se).add(r.object.position):(kr.origin.copy(r.object.position),kr.direction.set(0,0,-1).transformDirection(r.object.matrix),Math.abs(r.object.up.dot(kr.direction))<al?e.lookAt(r.target):(ss.setFromNormalAndCoplanarPoint(r.object.up,r.target),kr.intersectPlane(ss,r.target))))}else if(r.object.isOrthographicCamera){const Se=r.object.zoom;r.object.zoom=Math.max(r.minZoom,Math.min(r.maxZoom,r.object.zoom/l)),Se!==r.object.zoom&&(r.object.updateProjectionMatrix(),Ot=!0)}return l=1,z=!1,Ot||G.distanceToSquared(r.object.position)>s||8*(1-$.dot(r.object.quaternion))>s||Ne.distanceToSquared(r.target)>s?(r.dispatchEvent(ns),G.copy(r.object.position),$.copy(r.object.quaternion),Ne.copy(r.target),!0):!1}}(),this.dispose=function(){r.domElement.removeEventListener("contextmenu",ei),r.domElement.removeEventListener("pointerdown",Kn),r.domElement.removeEventListener("pointercancel",Lt),r.domElement.removeEventListener("wheel",Zn),r.domElement.removeEventListener("pointermove",Gr),r.domElement.removeEventListener("pointerup",Lt),r.domElement.getRootNode().removeEventListener("keydown",Jn,{capture:!0}),r._domElementKeyEvents!==null&&(r._domElementKeyEvents.removeEventListener("keydown",Nr),r._domElementKeyEvents=null)};const r=this,n={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6};let i=n.NONE;const s=1e-6,o=new rs,a=new rs;let l=1;const h=new w,c=new P,d=new P,f=new P,p=new P,y=new P,b=new P,v=new P,_=new P,A=new P,M=new w,T=new P;let z=!1;const S=[],R={};let O=!1;function V(m){return m!==null?2*Math.PI/60*r.autoRotateSpeed*m:2*Math.PI/60/60*r.autoRotateSpeed}function H(m){const C=Math.abs(m*.01);return Math.pow(.95,r.zoomSpeed*C)}function te(m){a.theta-=m}function j(m){a.phi-=m}const de=function(){const m=new w;return function(E,G){m.setFromMatrixColumn(G,0),m.multiplyScalar(-E),h.add(m)}}(),Je=function(){const m=new w;return function(E,G){r.screenSpacePanning===!0?m.setFromMatrixColumn(G,1):(m.setFromMatrixColumn(G,0),m.crossVectors(r.object.up,m)),m.multiplyScalar(E),h.add(m)}}(),fe=function(){const m=new w;return function(E,G){const $=r.domElement;if(r.object.isPerspectiveCamera){const Ne=r.object.position;m.copy(Ne).sub(r.target);let ae=m.length();ae*=Math.tan(r.object.fov/2*Math.PI/180),de(2*E*ae/$.clientHeight,r.object.matrix),Je(2*G*ae/$.clientHeight,r.object.matrix)}else r.object.isOrthographicCamera?(de(E*(r.object.right-r.object.left)/r.object.zoom/$.clientWidth,r.object.matrix),Je(G*(r.object.top-r.object.bottom)/r.object.zoom/$.clientHeight,r.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),r.enablePan=!1)}}();function De(m){r.object.isPerspectiveCamera||r.object.isOrthographicCamera?l/=m:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),r.enableZoom=!1)}function $e(m){r.object.isPerspectiveCamera||r.object.isOrthographicCamera?l*=m:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),r.enableZoom=!1)}function Fe(m,C){if(!r.zoomToCursor)return;z=!0;const E=r.domElement.getBoundingClientRect(),G=m-E.left,$=C-E.top,Ne=E.width,ae=E.height;T.x=G/Ne*2-1,T.y=-($/ae)*2+1,M.set(T.x,T.y,1).unproject(r.object).sub(r.object.position).normalize()}function Ge(m){return Math.max(r.minDistance,Math.min(r.maxDistance,m))}function Qe(m){c.set(m.clientX,m.clientY)}function Ps(m){Fe(m.clientX,m.clientX),v.set(m.clientX,m.clientY)}function Vn(m){p.set(m.clientX,m.clientY)}function Ls(m){d.set(m.clientX,m.clientY),f.subVectors(d,c).multiplyScalar(r.rotateSpeed);const C=r.domElement;te(2*Math.PI*f.x/C.clientHeight),j(2*Math.PI*f.y/C.clientHeight),c.copy(d),r.update()}function Os(m){_.set(m.clientX,m.clientY),A.subVectors(_,v),A.y>0?De(H(A.y)):A.y<0&&$e(H(A.y)),v.copy(_),r.update()}function Ds(m){y.set(m.clientX,m.clientY),b.subVectors(y,p).multiplyScalar(r.panSpeed),fe(b.x,b.y),p.copy(y),r.update()}function Fs(m){Fe(m.clientX,m.clientY),m.deltaY<0?$e(H(m.deltaY)):m.deltaY>0&&De(H(m.deltaY)),r.update()}function Gs(m){let C=!1;switch(m.code){case r.keys.UP:m.ctrlKey||m.metaKey||m.shiftKey?j(2*Math.PI*r.rotateSpeed/r.domElement.clientHeight):fe(0,r.keyPanSpeed),C=!0;break;case r.keys.BOTTOM:m.ctrlKey||m.metaKey||m.shiftKey?j(-2*Math.PI*r.rotateSpeed/r.domElement.clientHeight):fe(0,-r.keyPanSpeed),C=!0;break;case r.keys.LEFT:m.ctrlKey||m.metaKey||m.shiftKey?te(2*Math.PI*r.rotateSpeed/r.domElement.clientHeight):fe(r.keyPanSpeed,0),C=!0;break;case r.keys.RIGHT:m.ctrlKey||m.metaKey||m.shiftKey?te(-2*Math.PI*r.rotateSpeed/r.domElement.clientHeight):fe(-r.keyPanSpeed,0),C=!0;break}C&&(m.preventDefault(),r.update())}function Hn(m){if(S.length===1)c.set(m.pageX,m.pageY);else{const C=ht(m),E=.5*(m.pageX+C.x),G=.5*(m.pageY+C.y);c.set(E,G)}}function jn(m){if(S.length===1)p.set(m.pageX,m.pageY);else{const C=ht(m),E=.5*(m.pageX+C.x),G=.5*(m.pageY+C.y);p.set(E,G)}}function Wn(m){const C=ht(m),E=m.pageX-C.x,G=m.pageY-C.y,$=Math.sqrt(E*E+G*G);v.set(0,$)}function Ns(m){r.enableZoom&&Wn(m),r.enablePan&&jn(m)}function Us(m){r.enableZoom&&Wn(m),r.enableRotate&&Hn(m)}function qn(m){if(S.length==1)d.set(m.pageX,m.pageY);else{const E=ht(m),G=.5*(m.pageX+E.x),$=.5*(m.pageY+E.y);d.set(G,$)}f.subVectors(d,c).multiplyScalar(r.rotateSpeed);const C=r.domElement;te(2*Math.PI*f.x/C.clientHeight),j(2*Math.PI*f.y/C.clientHeight),c.copy(d)}function Xn(m){if(S.length===1)y.set(m.pageX,m.pageY);else{const C=ht(m),E=.5*(m.pageX+C.x),G=.5*(m.pageY+C.y);y.set(E,G)}b.subVectors(y,p).multiplyScalar(r.panSpeed),fe(b.x,b.y),p.copy(y)}function Yn(m){const C=ht(m),E=m.pageX-C.x,G=m.pageY-C.y,$=Math.sqrt(E*E+G*G);_.set(0,$),A.set(0,Math.pow(_.y/v.y,r.zoomSpeed)),De(A.y),v.copy(_);const Ne=(m.pageX+C.x)*.5,ae=(m.pageY+C.y)*.5;Fe(Ne,ae)}function Vs(m){r.enableZoom&&Yn(m),r.enablePan&&Xn(m)}function Hs(m){r.enableZoom&&Yn(m),r.enableRotate&&qn(m)}function Kn(m){r.enabled!==!1&&(S.length===0&&(r.domElement.setPointerCapture(m.pointerId),r.domElement.addEventListener("pointermove",Gr),r.domElement.addEventListener("pointerup",Lt)),!Zs(m)&&(Ys(m),m.pointerType==="touch"?Qn(m):js(m)))}function Gr(m){r.enabled!==!1&&(m.pointerType==="touch"?Xs(m):Ws(m))}function Lt(m){switch(Ks(m),S.length){case 0:r.domElement.releasePointerCapture(m.pointerId),r.domElement.removeEventListener("pointermove",Gr),r.domElement.removeEventListener("pointerup",Lt),r.dispatchEvent(is),i=n.NONE;break;case 1:const C=S[0],E=R[C];Qn({pointerId:C,pageX:E.x,pageY:E.y});break}}function js(m){let C;switch(m.button){case 0:C=r.mouseButtons.LEFT;break;case 1:C=r.mouseButtons.MIDDLE;break;case 2:C=r.mouseButtons.RIGHT;break;default:C=-1}switch(C){case ct.DOLLY:if(r.enableZoom===!1)return;Ps(m),i=n.DOLLY;break;case ct.ROTATE:if(m.ctrlKey||m.metaKey||m.shiftKey){if(r.enablePan===!1)return;Vn(m),i=n.PAN}else{if(r.enableRotate===!1)return;Qe(m),i=n.ROTATE}break;case ct.PAN:if(m.ctrlKey||m.metaKey||m.shiftKey){if(r.enableRotate===!1)return;Qe(m),i=n.ROTATE}else{if(r.enablePan===!1)return;Vn(m),i=n.PAN}break;default:i=n.NONE}i!==n.NONE&&r.dispatchEvent(pn)}function Ws(m){switch(i){case n.ROTATE:if(r.enableRotate===!1)return;Ls(m);break;case n.DOLLY:if(r.enableZoom===!1)return;Os(m);break;case n.PAN:if(r.enablePan===!1)return;Ds(m);break}}function Zn(m){r.enabled===!1||r.enableZoom===!1||i!==n.NONE||(m.preventDefault(),r.dispatchEvent(pn),Fs(qs(m)),r.dispatchEvent(is))}function qs(m){const C=m.deltaMode,E={clientX:m.clientX,clientY:m.clientY,deltaY:m.deltaY};switch(C){case 1:E.deltaY*=16;break;case 2:E.deltaY*=100;break}return m.ctrlKey&&!O&&(E.deltaY*=10),E}function Jn(m){m.key==="Control"&&(O=!0,r.domElement.getRootNode().addEventListener("keyup",$n,{passive:!0,capture:!0}))}function $n(m){m.key==="Control"&&(O=!1,r.domElement.getRootNode().removeEventListener("keyup",$n,{passive:!0,capture:!0}))}function Nr(m){r.enabled===!1||r.enablePan===!1||Gs(m)}function Qn(m){switch(ti(m),S.length){case 1:switch(r.touches.ONE){case ut.ROTATE:if(r.enableRotate===!1)return;Hn(m),i=n.TOUCH_ROTATE;break;case ut.PAN:if(r.enablePan===!1)return;jn(m),i=n.TOUCH_PAN;break;default:i=n.NONE}break;case 2:switch(r.touches.TWO){case ut.DOLLY_PAN:if(r.enableZoom===!1&&r.enablePan===!1)return;Ns(m),i=n.TOUCH_DOLLY_PAN;break;case ut.DOLLY_ROTATE:if(r.enableZoom===!1&&r.enableRotate===!1)return;Us(m),i=n.TOUCH_DOLLY_ROTATE;break;default:i=n.NONE}break;default:i=n.NONE}i!==n.NONE&&r.dispatchEvent(pn)}function Xs(m){switch(ti(m),i){case n.TOUCH_ROTATE:if(r.enableRotate===!1)return;qn(m),r.update();break;case n.TOUCH_PAN:if(r.enablePan===!1)return;Xn(m),r.update();break;case n.TOUCH_DOLLY_PAN:if(r.enableZoom===!1&&r.enablePan===!1)return;Vs(m),r.update();break;case n.TOUCH_DOLLY_ROTATE:if(r.enableZoom===!1&&r.enableRotate===!1)return;Hs(m),r.update();break;default:i=n.NONE}}function ei(m){r.enabled!==!1&&m.preventDefault()}function Ys(m){S.push(m.pointerId)}function Ks(m){delete R[m.pointerId];for(let C=0;C<S.length;C++)if(S[C]==m.pointerId){S.splice(C,1);return}}function Zs(m){for(let C=0;C<S.length;C++)if(S[C]==m.pointerId)return!0;return!1}function ti(m){let C=R[m.pointerId];C===void 0&&(C=new P,R[m.pointerId]=C),C.set(m.pageX,m.pageY)}function ht(m){const C=m.pointerId===S[0]?S[1]:S[0];return R[C]}r.domElement.addEventListener("contextmenu",ei),r.domElement.addEventListener("pointerdown",Kn),r.domElement.addEventListener("pointercancel",Lt),r.domElement.addEventListener("wheel",Zn,{passive:!1}),r.domElement.getRootNode().addEventListener("keydown",Jn,{passive:!0,capture:!0}),this.update()}}function os(u,e){if(e===ko)return console.warn("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles."),u;if(e===wn||e===ys){let t=u.getIndex();if(t===null){const s=[],o=u.getAttribute("position");if(o!==void 0){for(let a=0;a<o.count;a++)s.push(a);u.setIndex(s),t=u.getIndex()}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible."),u}const r=t.count-2,n=[];if(e===wn)for(let s=1;s<=r;s++)n.push(t.getX(0)),n.push(t.getX(s)),n.push(t.getX(s+1));else for(let s=0;s<r;s++)s%2===0?(n.push(t.getX(s)),n.push(t.getX(s+1)),n.push(t.getX(s+2))):(n.push(t.getX(s+2)),n.push(t.getX(s+1)),n.push(t.getX(s)));n.length/3!==r&&console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.");const i=u.clone();return i.setIndex(n),i.clearGroups(),i}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:",e),u}const mn=new WeakMap;class hl extends lt{constructor(e){super(e),this.decoderPath="",this.decoderConfig={},this.decoderBinary=null,this.decoderPending=null,this.workerLimit=4,this.workerPool=[],this.workerNextTaskID=1,this.workerSourceURL="",this.defaultAttributeIDs={position:"POSITION",normal:"NORMAL",color:"COLOR",uv:"TEX_COORD"},this.defaultAttributeTypes={position:"Float32Array",normal:"Float32Array",color:"Float32Array",uv:"Float32Array"}}setDecoderPath(e){return this.decoderPath=e,this}setDecoderConfig(e){return this.decoderConfig=e,this}setWorkerLimit(e){return this.workerLimit=e,this}load(e,t,r,n){const i=new Lr(this.manager);i.setPath(this.path),i.setResponseType("arraybuffer"),i.setRequestHeader(this.requestHeader),i.setWithCredentials(this.withCredentials),i.load(e,s=>{this.parse(s,t,n)},r,n)}parse(e,t,r=()=>{}){this.decodeDracoFile(e,t,null,null,ee).catch(r)}decodeDracoFile(e,t,r,n,i=oe,s=()=>{}){const o={attributeIDs:r||this.defaultAttributeIDs,attributeTypes:n||this.defaultAttributeTypes,useUniqueIDs:!!r,vertexColorSpace:i};return this.decodeGeometry(e,o).then(t).catch(s)}decodeGeometry(e,t){const r=JSON.stringify(t);if(mn.has(e)){const a=mn.get(e);if(a.key===r)return a.promise;if(e.byteLength===0)throw new Error("THREE.DRACOLoader: Unable to re-decode a buffer with different settings. Buffer has already been transferred.")}let n;const i=this.workerNextTaskID++,s=e.byteLength,o=this._getWorker(i,s).then(a=>(n=a,new Promise((l,h)=>{n._callbacks[i]={resolve:l,reject:h},n.postMessage({type:"decode",id:i,taskConfig:t,buffer:e},[e])}))).then(a=>this._createGeometry(a.geometry));return o.catch(()=>!0).then(()=>{n&&i&&this._releaseTask(n,i)}),mn.set(e,{key:r,promise:o}),o}_createGeometry(e){const t=new ve;e.index&&t.setIndex(new N(e.index.array,1));for(let r=0;r<e.attributes.length;r++){const n=e.attributes[r],i=n.name,s=n.array,o=n.itemSize,a=new N(s,o);i==="color"&&(this._assignVertexColorSpace(a,n.vertexColorSpace),a.normalized=!(s instanceof Float32Array)),t.setAttribute(i,a)}return t}_assignVertexColorSpace(e,t){if(t!==ee)return;const r=new X;for(let n=0,i=e.count;n<i;n++)r.fromBufferAttribute(e,n).convertSRGBToLinear(),e.setXYZ(n,r.r,r.g,r.b)}_loadLibrary(e,t){const r=new Lr(this.manager);return r.setPath(this.decoderPath),r.setResponseType(t),r.setWithCredentials(this.withCredentials),new Promise((n,i)=>{r.load(e,n,void 0,i)})}preload(){return this._initDecoder(),this}_initDecoder(){if(this.decoderPending)return this.decoderPending;const e=typeof WebAssembly!="object"||this.decoderConfig.type==="js",t=[];return e?t.push(this._loadLibrary("draco_decoder.js","text")):(t.push(this._loadLibrary("draco_wasm_wrapper.js","text")),t.push(this._loadLibrary("draco_decoder.wasm","arraybuffer"))),this.decoderPending=Promise.all(t).then(r=>{const n=r[0];e||(this.decoderConfig.wasmBinary=r[1]);const i=cl.toString(),s=["/* draco decoder */",n,"","/* worker */",i.substring(i.indexOf("{")+1,i.lastIndexOf("}"))].join(`
`);this.workerSourceURL=URL.createObjectURL(new Blob([s]))}),this.decoderPending}_getWorker(e,t){return this._initDecoder().then(()=>{if(this.workerPool.length<this.workerLimit){const n=new Worker(this.workerSourceURL);n._callbacks={},n._taskCosts={},n._taskLoad=0,n.postMessage({type:"init",decoderConfig:this.decoderConfig}),n.onmessage=function(i){const s=i.data;switch(s.type){case"decode":n._callbacks[s.id].resolve(s);break;case"error":n._callbacks[s.id].reject(s);break;default:console.error('THREE.DRACOLoader: Unexpected message, "'+s.type+'"')}},this.workerPool.push(n)}else this.workerPool.sort(function(n,i){return n._taskLoad>i._taskLoad?-1:1});const r=this.workerPool[this.workerPool.length-1];return r._taskCosts[e]=t,r._taskLoad+=t,r})}_releaseTask(e,t){e._taskLoad-=e._taskCosts[t],delete e._callbacks[t],delete e._taskCosts[t]}debug(){console.log("Task load: ",this.workerPool.map(e=>e._taskLoad))}dispose(){for(let e=0;e<this.workerPool.length;++e)this.workerPool[e].terminate();return this.workerPool.length=0,this.workerSourceURL!==""&&URL.revokeObjectURL(this.workerSourceURL),this}}function cl(){let u,e;onmessage=function(s){const o=s.data;switch(o.type){case"init":u=o.decoderConfig,e=new Promise(function(h){u.onModuleLoaded=function(c){h({draco:c})},DracoDecoderModule(u)});break;case"decode":const a=o.buffer,l=o.taskConfig;e.then(h=>{const c=h.draco,d=new c.Decoder;try{const f=t(c,d,new Int8Array(a),l),p=f.attributes.map(y=>y.array.buffer);f.index&&p.push(f.index.array.buffer),self.postMessage({type:"decode",id:o.id,geometry:f},p)}catch(f){console.error(f),self.postMessage({type:"error",id:o.id,error:f.message})}finally{c.destroy(d)}});break}};function t(s,o,a,l){const h=l.attributeIDs,c=l.attributeTypes;let d,f;const p=o.GetEncodedGeometryType(a);if(p===s.TRIANGULAR_MESH)d=new s.Mesh,f=o.DecodeArrayToMesh(a,a.byteLength,d);else if(p===s.POINT_CLOUD)d=new s.PointCloud,f=o.DecodeArrayToPointCloud(a,a.byteLength,d);else throw new Error("THREE.DRACOLoader: Unexpected geometry type.");if(!f.ok()||d.ptr===0)throw new Error("THREE.DRACOLoader: Decoding failed: "+f.error_msg());const y={index:null,attributes:[]};for(const b in h){const v=self[c[b]];let _,A;if(l.useUniqueIDs)A=h[b],_=o.GetAttributeByUniqueId(d,A);else{if(A=o.GetAttributeId(d,s[h[b]]),A===-1)continue;_=o.GetAttribute(d,A)}const M=n(s,o,d,b,v,_);b==="color"&&(M.vertexColorSpace=l.vertexColorSpace),y.attributes.push(M)}return p===s.TRIANGULAR_MESH&&(y.index=r(s,o,d)),s.destroy(d),y}function r(s,o,a){const h=a.num_faces()*3,c=h*4,d=s._malloc(c);o.GetTrianglesUInt32Array(a,c,d);const f=new Uint32Array(s.HEAPF32.buffer,d,h).slice();return s._free(d),{array:f,itemSize:1}}function n(s,o,a,l,h,c){const d=c.num_components(),p=a.num_points()*d,y=p*h.BYTES_PER_ELEMENT,b=i(s,h),v=s._malloc(y);o.GetAttributeDataArrayForAllPoints(a,c,b,y,v);const _=new h(s.HEAPF32.buffer,v,p).slice();return s._free(v),{name:l,array:_,itemSize:d}}function i(s,o){switch(o){case Float32Array:return s.DT_FLOAT32;case Int8Array:return s.DT_INT8;case Int16Array:return s.DT_INT16;case Int32Array:return s.DT_INT32;case Uint8Array:return s.DT_UINT8;case Uint16Array:return s.DT_UINT16;case Uint32Array:return s.DT_UINT32}}}class ul extends lt{constructor(e){super(e),this.dracoLoader=null,this.ktx2Loader=null,this.meshoptDecoder=null,this.pluginCallbacks=[],this.register(function(t){return new yl(t)}),this.register(function(t){return new Al(t)}),this.register(function(t){return new Sl(t)}),this.register(function(t){return new Tl(t)}),this.register(function(t){return new xl(t)}),this.register(function(t){return new bl(t)}),this.register(function(t){return new wl(t)}),this.register(function(t){return new vl(t)}),this.register(function(t){return new ml(t)}),this.register(function(t){return new Il(t)}),this.register(function(t){return new gl(t)}),this.register(function(t){return new Ml(t)}),this.register(function(t){return new _l(t)}),this.register(function(t){return new fl(t)}),this.register(function(t){return new Cl(t)}),this.register(function(t){return new Rl(t)})}load(e,t,r,n){const i=this;let s;if(this.resourcePath!=="")s=this.resourcePath;else if(this.path!==""){const l=Jt.extractUrlBase(e);s=Jt.resolveURL(l,this.path)}else s=Jt.extractUrlBase(e);this.manager.itemStart(e);const o=function(l){n?n(l):console.error(l),i.manager.itemError(e),i.manager.itemEnd(e)},a=new Lr(this.manager);a.setPath(this.path),a.setResponseType("arraybuffer"),a.setRequestHeader(this.requestHeader),a.setWithCredentials(this.withCredentials),a.load(e,function(l){try{i.parse(l,s,function(h){t(h),i.manager.itemEnd(e)},o)}catch(h){o(h)}},r,o)}setDRACOLoader(e){return this.dracoLoader=e,this}setDDSLoader(){throw new Error('THREE.GLTFLoader: "MSFT_texture_dds" no longer supported. Please update to "KHR_texture_basisu".')}setKTX2Loader(e){return this.ktx2Loader=e,this}setMeshoptDecoder(e){return this.meshoptDecoder=e,this}register(e){return this.pluginCallbacks.indexOf(e)===-1&&this.pluginCallbacks.push(e),this}unregister(e){return this.pluginCallbacks.indexOf(e)!==-1&&this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(e),1),this}parse(e,t,r,n){let i;const s={},o={},a=new TextDecoder;if(typeof e=="string")i=JSON.parse(e);else if(e instanceof ArrayBuffer)if(a.decode(new Uint8Array(e,0,4))===zs){try{s[B.KHR_BINARY_GLTF]=new zl(e)}catch(c){n&&n(c);return}i=JSON.parse(s[B.KHR_BINARY_GLTF].content)}else i=JSON.parse(a.decode(e));else i=e;if(i.asset===void 0||i.asset.version[0]<2){n&&n(new Error("THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported."));return}const l=new Hl(i,{path:t||this.resourcePath||"",crossOrigin:this.crossOrigin,requestHeader:this.requestHeader,manager:this.manager,ktx2Loader:this.ktx2Loader,meshoptDecoder:this.meshoptDecoder});l.fileLoader.setRequestHeader(this.requestHeader);for(let h=0;h<this.pluginCallbacks.length;h++){const c=this.pluginCallbacks[h](l);c.name||console.error("THREE.GLTFLoader: Invalid plugin found: missing name"),o[c.name]=c,s[c.name]=!0}if(i.extensionsUsed)for(let h=0;h<i.extensionsUsed.length;++h){const c=i.extensionsUsed[h],d=i.extensionsRequired||[];switch(c){case B.KHR_MATERIALS_UNLIT:s[c]=new pl;break;case B.KHR_DRACO_MESH_COMPRESSION:s[c]=new kl(i,this.dracoLoader);break;case B.KHR_TEXTURE_TRANSFORM:s[c]=new El;break;case B.KHR_MESH_QUANTIZATION:s[c]=new Bl;break;default:d.indexOf(c)>=0&&o[c]===void 0&&console.warn('THREE.GLTFLoader: Unknown extension "'+c+'".')}}l.setExtensions(s),l.setPlugins(o),l.parse(r,n)}parseAsync(e,t){const r=this;return new Promise(function(n,i){r.parse(e,t,n,i)})}}function dl(){let u={};return{get:function(e){return u[e]},add:function(e,t){u[e]=t},remove:function(e){delete u[e]},removeAll:function(){u={}}}}const B={KHR_BINARY_GLTF:"KHR_binary_glTF",KHR_DRACO_MESH_COMPRESSION:"KHR_draco_mesh_compression",KHR_LIGHTS_PUNCTUAL:"KHR_lights_punctual",KHR_MATERIALS_CLEARCOAT:"KHR_materials_clearcoat",KHR_MATERIALS_IOR:"KHR_materials_ior",KHR_MATERIALS_SHEEN:"KHR_materials_sheen",KHR_MATERIALS_SPECULAR:"KHR_materials_specular",KHR_MATERIALS_TRANSMISSION:"KHR_materials_transmission",KHR_MATERIALS_IRIDESCENCE:"KHR_materials_iridescence",KHR_MATERIALS_ANISOTROPY:"KHR_materials_anisotropy",KHR_MATERIALS_UNLIT:"KHR_materials_unlit",KHR_MATERIALS_VOLUME:"KHR_materials_volume",KHR_TEXTURE_BASISU:"KHR_texture_basisu",KHR_TEXTURE_TRANSFORM:"KHR_texture_transform",KHR_MESH_QUANTIZATION:"KHR_mesh_quantization",KHR_MATERIALS_EMISSIVE_STRENGTH:"KHR_materials_emissive_strength",EXT_MATERIALS_BUMP:"EXT_materials_bump",EXT_TEXTURE_WEBP:"EXT_texture_webp",EXT_TEXTURE_AVIF:"EXT_texture_avif",EXT_MESHOPT_COMPRESSION:"EXT_meshopt_compression",EXT_MESH_GPU_INSTANCING:"EXT_mesh_gpu_instancing"};class fl{constructor(e){this.parser=e,this.name=B.KHR_LIGHTS_PUNCTUAL,this.cache={refs:{},uses:{}}}_markDefs(){const e=this.parser,t=this.parser.json.nodes||[];for(let r=0,n=t.length;r<n;r++){const i=t[r];i.extensions&&i.extensions[this.name]&&i.extensions[this.name].light!==void 0&&e._addNodeRef(this.cache,i.extensions[this.name].light)}}_loadLight(e){const t=this.parser,r="light:"+e;let n=t.cache.get(r);if(n)return n;const i=t.json,a=((i.extensions&&i.extensions[this.name]||{}).lights||[])[e];let l;const h=new X(16777215);a.color!==void 0&&h.setRGB(a.color[0],a.color[1],a.color[2],oe);const c=a.range!==void 0?a.range:0;switch(a.type){case"directional":l=new Za(h),l.target.position.set(0,0,-1),l.add(l.target);break;case"point":l=new Ya(h),l.distance=c;break;case"spot":l=new qa(h),l.distance=c,a.spot=a.spot||{},a.spot.innerConeAngle=a.spot.innerConeAngle!==void 0?a.spot.innerConeAngle:0,a.spot.outerConeAngle=a.spot.outerConeAngle!==void 0?a.spot.outerConeAngle:Math.PI/4,l.angle=a.spot.outerConeAngle,l.penumbra=1-a.spot.innerConeAngle/a.spot.outerConeAngle,l.target.position.set(0,0,-1),l.add(l.target);break;default:throw new Error("THREE.GLTFLoader: Unexpected light type: "+a.type)}return l.position.set(0,0,0),l.decay=2,Ye(l,a),a.intensity!==void 0&&(l.intensity=a.intensity),l.name=t.createUniqueName(a.name||"light_"+e),n=Promise.resolve(l),t.cache.add(r,n),n}getDependency(e,t){if(e==="light")return this._loadLight(t)}createNodeAttachment(e){const t=this,r=this.parser,i=r.json.nodes[e],o=(i.extensions&&i.extensions[this.name]||{}).light;return o===void 0?null:this._loadLight(o).then(function(a){return r._getNodeRef(t.cache,o,a)})}}class pl{constructor(){this.name=B.KHR_MATERIALS_UNLIT}getMaterialType(){return St}extendParams(e,t,r){const n=[];e.color=new X(1,1,1),e.opacity=1;const i=t.pbrMetallicRoughness;if(i){if(Array.isArray(i.baseColorFactor)){const s=i.baseColorFactor;e.color.setRGB(s[0],s[1],s[2],oe),e.opacity=s[3]}i.baseColorTexture!==void 0&&n.push(r.assignTexture(e,"map",i.baseColorTexture,ee))}return Promise.all(n)}}class ml{constructor(e){this.parser=e,this.name=B.KHR_MATERIALS_EMISSIVE_STRENGTH}extendMaterialParams(e,t){const n=this.parser.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const i=n.extensions[this.name].emissiveStrength;return i!==void 0&&(t.emissiveIntensity=i),Promise.resolve()}}class yl{constructor(e){this.parser=e,this.name=B.KHR_MATERIALS_CLEARCOAT}getMaterialType(e){const r=this.parser.json.materials[e];return!r.extensions||!r.extensions[this.name]?null:Oe}extendMaterialParams(e,t){const r=this.parser,n=r.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const i=[],s=n.extensions[this.name];if(s.clearcoatFactor!==void 0&&(t.clearcoat=s.clearcoatFactor),s.clearcoatTexture!==void 0&&i.push(r.assignTexture(t,"clearcoatMap",s.clearcoatTexture)),s.clearcoatRoughnessFactor!==void 0&&(t.clearcoatRoughness=s.clearcoatRoughnessFactor),s.clearcoatRoughnessTexture!==void 0&&i.push(r.assignTexture(t,"clearcoatRoughnessMap",s.clearcoatRoughnessTexture)),s.clearcoatNormalTexture!==void 0&&(i.push(r.assignTexture(t,"clearcoatNormalMap",s.clearcoatNormalTexture)),s.clearcoatNormalTexture.scale!==void 0)){const o=s.clearcoatNormalTexture.scale;t.clearcoatNormalScale=new P(o,o)}return Promise.all(i)}}class gl{constructor(e){this.parser=e,this.name=B.KHR_MATERIALS_IRIDESCENCE}getMaterialType(e){const r=this.parser.json.materials[e];return!r.extensions||!r.extensions[this.name]?null:Oe}extendMaterialParams(e,t){const r=this.parser,n=r.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const i=[],s=n.extensions[this.name];return s.iridescenceFactor!==void 0&&(t.iridescence=s.iridescenceFactor),s.iridescenceTexture!==void 0&&i.push(r.assignTexture(t,"iridescenceMap",s.iridescenceTexture)),s.iridescenceIor!==void 0&&(t.iridescenceIOR=s.iridescenceIor),t.iridescenceThicknessRange===void 0&&(t.iridescenceThicknessRange=[100,400]),s.iridescenceThicknessMinimum!==void 0&&(t.iridescenceThicknessRange[0]=s.iridescenceThicknessMinimum),s.iridescenceThicknessMaximum!==void 0&&(t.iridescenceThicknessRange[1]=s.iridescenceThicknessMaximum),s.iridescenceThicknessTexture!==void 0&&i.push(r.assignTexture(t,"iridescenceThicknessMap",s.iridescenceThicknessTexture)),Promise.all(i)}}class xl{constructor(e){this.parser=e,this.name=B.KHR_MATERIALS_SHEEN}getMaterialType(e){const r=this.parser.json.materials[e];return!r.extensions||!r.extensions[this.name]?null:Oe}extendMaterialParams(e,t){const r=this.parser,n=r.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const i=[];t.sheenColor=new X(0,0,0),t.sheenRoughness=0,t.sheen=1;const s=n.extensions[this.name];if(s.sheenColorFactor!==void 0){const o=s.sheenColorFactor;t.sheenColor.setRGB(o[0],o[1],o[2],oe)}return s.sheenRoughnessFactor!==void 0&&(t.sheenRoughness=s.sheenRoughnessFactor),s.sheenColorTexture!==void 0&&i.push(r.assignTexture(t,"sheenColorMap",s.sheenColorTexture,ee)),s.sheenRoughnessTexture!==void 0&&i.push(r.assignTexture(t,"sheenRoughnessMap",s.sheenRoughnessTexture)),Promise.all(i)}}class bl{constructor(e){this.parser=e,this.name=B.KHR_MATERIALS_TRANSMISSION}getMaterialType(e){const r=this.parser.json.materials[e];return!r.extensions||!r.extensions[this.name]?null:Oe}extendMaterialParams(e,t){const r=this.parser,n=r.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const i=[],s=n.extensions[this.name];return s.transmissionFactor!==void 0&&(t.transmission=s.transmissionFactor),s.transmissionTexture!==void 0&&i.push(r.assignTexture(t,"transmissionMap",s.transmissionTexture)),Promise.all(i)}}class wl{constructor(e){this.parser=e,this.name=B.KHR_MATERIALS_VOLUME}getMaterialType(e){const r=this.parser.json.materials[e];return!r.extensions||!r.extensions[this.name]?null:Oe}extendMaterialParams(e,t){const r=this.parser,n=r.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const i=[],s=n.extensions[this.name];t.thickness=s.thicknessFactor!==void 0?s.thicknessFactor:0,s.thicknessTexture!==void 0&&i.push(r.assignTexture(t,"thicknessMap",s.thicknessTexture)),t.attenuationDistance=s.attenuationDistance||1/0;const o=s.attenuationColor||[1,1,1];return t.attenuationColor=new X().setRGB(o[0],o[1],o[2],oe),Promise.all(i)}}class vl{constructor(e){this.parser=e,this.name=B.KHR_MATERIALS_IOR}getMaterialType(e){const r=this.parser.json.materials[e];return!r.extensions||!r.extensions[this.name]?null:Oe}extendMaterialParams(e,t){const n=this.parser.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const i=n.extensions[this.name];return t.ior=i.ior!==void 0?i.ior:1.5,Promise.resolve()}}class Il{constructor(e){this.parser=e,this.name=B.KHR_MATERIALS_SPECULAR}getMaterialType(e){const r=this.parser.json.materials[e];return!r.extensions||!r.extensions[this.name]?null:Oe}extendMaterialParams(e,t){const r=this.parser,n=r.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const i=[],s=n.extensions[this.name];t.specularIntensity=s.specularFactor!==void 0?s.specularFactor:1,s.specularTexture!==void 0&&i.push(r.assignTexture(t,"specularIntensityMap",s.specularTexture));const o=s.specularColorFactor||[1,1,1];return t.specularColor=new X().setRGB(o[0],o[1],o[2],oe),s.specularColorTexture!==void 0&&i.push(r.assignTexture(t,"specularColorMap",s.specularColorTexture,ee)),Promise.all(i)}}class _l{constructor(e){this.parser=e,this.name=B.EXT_MATERIALS_BUMP}getMaterialType(e){const r=this.parser.json.materials[e];return!r.extensions||!r.extensions[this.name]?null:Oe}extendMaterialParams(e,t){const r=this.parser,n=r.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const i=[],s=n.extensions[this.name];return t.bumpScale=s.bumpFactor!==void 0?s.bumpFactor:1,s.bumpTexture!==void 0&&i.push(r.assignTexture(t,"bumpMap",s.bumpTexture)),Promise.all(i)}}class Ml{constructor(e){this.parser=e,this.name=B.KHR_MATERIALS_ANISOTROPY}getMaterialType(e){const r=this.parser.json.materials[e];return!r.extensions||!r.extensions[this.name]?null:Oe}extendMaterialParams(e,t){const r=this.parser,n=r.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const i=[],s=n.extensions[this.name];return s.anisotropyStrength!==void 0&&(t.anisotropy=s.anisotropyStrength),s.anisotropyRotation!==void 0&&(t.anisotropyRotation=s.anisotropyRotation),s.anisotropyTexture!==void 0&&i.push(r.assignTexture(t,"anisotropyMap",s.anisotropyTexture)),Promise.all(i)}}class Al{constructor(e){this.parser=e,this.name=B.KHR_TEXTURE_BASISU}loadTexture(e){const t=this.parser,r=t.json,n=r.textures[e];if(!n.extensions||!n.extensions[this.name])return null;const i=n.extensions[this.name],s=t.options.ktx2Loader;if(!s){if(r.extensionsRequired&&r.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");return null}return t.loadTextureImage(e,i.source,s)}}class Sl{constructor(e){this.parser=e,this.name=B.EXT_TEXTURE_WEBP,this.isSupported=null}loadTexture(e){const t=this.name,r=this.parser,n=r.json,i=n.textures[e];if(!i.extensions||!i.extensions[t])return null;const s=i.extensions[t],o=n.images[s.source];let a=r.textureLoader;if(o.uri){const l=r.options.manager.getHandler(o.uri);l!==null&&(a=l)}return this.detectSupport().then(function(l){if(l)return r.loadTextureImage(e,s.source,a);if(n.extensionsRequired&&n.extensionsRequired.indexOf(t)>=0)throw new Error("THREE.GLTFLoader: WebP required by asset but unsupported.");return r.loadTexture(e)})}detectSupport(){return this.isSupported||(this.isSupported=new Promise(function(e){const t=new Image;t.src="data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA",t.onload=t.onerror=function(){e(t.height===1)}})),this.isSupported}}class Tl{constructor(e){this.parser=e,this.name=B.EXT_TEXTURE_AVIF,this.isSupported=null}loadTexture(e){const t=this.name,r=this.parser,n=r.json,i=n.textures[e];if(!i.extensions||!i.extensions[t])return null;const s=i.extensions[t],o=n.images[s.source];let a=r.textureLoader;if(o.uri){const l=r.options.manager.getHandler(o.uri);l!==null&&(a=l)}return this.detectSupport().then(function(l){if(l)return r.loadTextureImage(e,s.source,a);if(n.extensionsRequired&&n.extensionsRequired.indexOf(t)>=0)throw new Error("THREE.GLTFLoader: AVIF required by asset but unsupported.");return r.loadTexture(e)})}detectSupport(){return this.isSupported||(this.isSupported=new Promise(function(e){const t=new Image;t.src="data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABcAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB9tZGF0EgAKCBgABogQEDQgMgkQAAAAB8dSLfI=",t.onload=t.onerror=function(){e(t.height===1)}})),this.isSupported}}class Cl{constructor(e){this.name=B.EXT_MESHOPT_COMPRESSION,this.parser=e}loadBufferView(e){const t=this.parser.json,r=t.bufferViews[e];if(r.extensions&&r.extensions[this.name]){const n=r.extensions[this.name],i=this.parser.getDependency("buffer",n.buffer),s=this.parser.options.meshoptDecoder;if(!s||!s.supported){if(t.extensionsRequired&&t.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files");return null}return i.then(function(o){const a=n.byteOffset||0,l=n.byteLength||0,h=n.count,c=n.byteStride,d=new Uint8Array(o,a,l);return s.decodeGltfBufferAsync?s.decodeGltfBufferAsync(h,c,d,n.mode,n.filter).then(function(f){return f.buffer}):s.ready.then(function(){const f=new ArrayBuffer(h*c);return s.decodeGltfBuffer(new Uint8Array(f),h,c,d,n.mode,n.filter),f})})}else return null}}class Rl{constructor(e){this.name=B.EXT_MESH_GPU_INSTANCING,this.parser=e}createNodeMesh(e){const t=this.parser.json,r=t.nodes[e];if(!r.extensions||!r.extensions[this.name]||r.mesh===void 0)return null;const n=t.meshes[r.mesh];for(const l of n.primitives)if(l.mode!==he.TRIANGLES&&l.mode!==he.TRIANGLE_STRIP&&l.mode!==he.TRIANGLE_FAN&&l.mode!==void 0)return null;const s=r.extensions[this.name].attributes,o=[],a={};for(const l in s)o.push(this.parser.getDependency("accessor",s[l]).then(h=>(a[l]=h,a[l])));return o.length<1?null:(o.push(this.parser.createNodeMesh(e)),Promise.all(o).then(l=>{const h=l.pop(),c=h.isGroup?h.children:[h],d=l[0].count,f=[];for(const p of c){const y=new k,b=new w,v=new Ie,_=new w(1,1,1),A=new Ta(p.geometry,p.material,d);for(let M=0;M<d;M++)a.TRANSLATION&&b.fromBufferAttribute(a.TRANSLATION,M),a.ROTATION&&v.fromBufferAttribute(a.ROTATION,M),a.SCALE&&_.fromBufferAttribute(a.SCALE,M),A.setMatrixAt(M,y.compose(b,v,_));for(const M in a)if(M==="_COLOR_0"){const T=a[M];A.instanceColor=new An(T.array,T.itemSize,T.normalized)}else M!=="TRANSLATION"&&M!=="ROTATION"&&M!=="SCALE"&&p.geometry.setAttribute(M,a[M]);W.prototype.copy.call(A,p),this.parser.assignFinalMaterial(A),f.push(A)}return h.isGroup?(h.clear(),h.add(...f),h):f[0]}))}}const zs="glTF",Wt=12,as={JSON:1313821514,BIN:5130562};class zl{constructor(e){this.name=B.KHR_BINARY_GLTF,this.content=null,this.body=null;const t=new DataView(e,0,Wt),r=new TextDecoder;if(this.header={magic:r.decode(new Uint8Array(e.slice(0,4))),version:t.getUint32(4,!0),length:t.getUint32(8,!0)},this.header.magic!==zs)throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");if(this.header.version<2)throw new Error("THREE.GLTFLoader: Legacy binary file detected.");const n=this.header.length-Wt,i=new DataView(e,Wt);let s=0;for(;s<n;){const o=i.getUint32(s,!0);s+=4;const a=i.getUint32(s,!0);if(s+=4,a===as.JSON){const l=new Uint8Array(e,Wt+s,o);this.content=r.decode(l)}else if(a===as.BIN){const l=Wt+s;this.body=e.slice(l,l+o)}s+=o}if(this.content===null)throw new Error("THREE.GLTFLoader: JSON content not found.")}}class kl{constructor(e,t){if(!t)throw new Error("THREE.GLTFLoader: No DRACOLoader instance provided.");this.name=B.KHR_DRACO_MESH_COMPRESSION,this.json=e,this.dracoLoader=t,this.dracoLoader.preload()}decodePrimitive(e,t){const r=this.json,n=this.dracoLoader,i=e.extensions[this.name].bufferView,s=e.extensions[this.name].attributes,o={},a={},l={};for(const h in s){const c=Tn[h]||h.toLowerCase();o[c]=s[h]}for(const h in e.attributes){const c=Tn[h]||h.toLowerCase();if(s[h]!==void 0){const d=r.accessors[e.attributes[h]],f=Ct[d.componentType];l[c]=f.name,a[c]=d.normalized===!0}}return t.getDependency("bufferView",i).then(function(h){return new Promise(function(c,d){n.decodeDracoFile(h,function(f){for(const p in f.attributes){const y=f.attributes[p],b=a[p];b!==void 0&&(y.normalized=b)}c(f)},o,l,oe,d)})})}}class El{constructor(){this.name=B.KHR_TEXTURE_TRANSFORM}extendTexture(e,t){return(t.texCoord===void 0||t.texCoord===e.channel)&&t.offset===void 0&&t.rotation===void 0&&t.scale===void 0||(e=e.clone(),t.texCoord!==void 0&&(e.channel=t.texCoord),t.offset!==void 0&&e.offset.fromArray(t.offset),t.rotation!==void 0&&(e.rotation=t.rotation),t.scale!==void 0&&e.repeat.fromArray(t.scale),e.needsUpdate=!0),e}}class Bl{constructor(){this.name=B.KHR_MESH_QUANTIZATION}}class ks extends ir{constructor(e,t,r,n){super(e,t,r,n)}copySampleValue_(e){const t=this.resultBuffer,r=this.sampleValues,n=this.valueSize,i=e*n*3+n;for(let s=0;s!==n;s++)t[s]=r[i+s];return t}interpolate_(e,t,r,n){const i=this.resultBuffer,s=this.sampleValues,o=this.valueSize,a=o*2,l=o*3,h=n-t,c=(r-t)/h,d=c*c,f=d*c,p=e*l,y=p-l,b=-2*f+3*d,v=f-d,_=1-b,A=v-d+c;for(let M=0;M!==o;M++){const T=s[y+M+o],z=s[y+M+a]*h,S=s[p+M+o],R=s[p+M]*h;i[M]=_*T+A*z+b*S+v*R}return i}}const Pl=new Ie;class Ll extends ks{interpolate_(e,t,r,n){const i=super.interpolate_(e,t,r,n);return Pl.fromArray(i).normalize().toArray(i),i}}const he={FLOAT:5126,FLOAT_MAT3:35675,FLOAT_MAT4:35676,FLOAT_VEC2:35664,FLOAT_VEC3:35665,FLOAT_VEC4:35666,LINEAR:9729,REPEAT:10497,SAMPLER_2D:35678,POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6,UNSIGNED_BYTE:5121,UNSIGNED_SHORT:5123},Ct={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array},ls={9728:Qt,9729:Rn,9984:_o,9985:Ao,9986:Mo,9987:zn},hs={33071:qt,33648:bn,10497:$t},yn={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},Tn={POSITION:"position",NORMAL:"normal",TANGENT:"tangent",TEXCOORD_0:"uv",TEXCOORD_1:"uv1",TEXCOORD_2:"uv2",TEXCOORD_3:"uv3",COLOR_0:"color",WEIGHTS_0:"skinWeight",JOINTS_0:"skinIndex"},Xe={scale:"scale",translation:"position",rotation:"quaternion",weights:"morphTargetInfluences"},Ol={CUBICSPLINE:void 0,LINEAR:Rt,STEP:er},gn={OPAQUE:"OPAQUE",MASK:"MASK",BLEND:"BLEND"};function Dl(u){return u.DefaultMaterial===void 0&&(u.DefaultMaterial=new Dn({color:16777215,emissive:0,metalness:1,roughness:1,transparent:!1,depthTest:!0,side:Pr})),u.DefaultMaterial}function it(u,e,t){for(const r in t.extensions)u[r]===void 0&&(e.userData.gltfExtensions=e.userData.gltfExtensions||{},e.userData.gltfExtensions[r]=t.extensions[r])}function Ye(u,e){e.extras!==void 0&&(typeof e.extras=="object"?Object.assign(u.userData,e.extras):console.warn("THREE.GLTFLoader: Ignoring primitive type .extras, "+e.extras))}function Fl(u,e,t){let r=!1,n=!1,i=!1;for(let l=0,h=e.length;l<h;l++){const c=e[l];if(c.POSITION!==void 0&&(r=!0),c.NORMAL!==void 0&&(n=!0),c.COLOR_0!==void 0&&(i=!0),r&&n&&i)break}if(!r&&!n&&!i)return Promise.resolve(u);const s=[],o=[],a=[];for(let l=0,h=e.length;l<h;l++){const c=e[l];if(r){const d=c.POSITION!==void 0?t.getDependency("accessor",c.POSITION):u.attributes.position;s.push(d)}if(n){const d=c.NORMAL!==void 0?t.getDependency("accessor",c.NORMAL):u.attributes.normal;o.push(d)}if(i){const d=c.COLOR_0!==void 0?t.getDependency("accessor",c.COLOR_0):u.attributes.color;a.push(d)}}return Promise.all([Promise.all(s),Promise.all(o),Promise.all(a)]).then(function(l){const h=l[0],c=l[1],d=l[2];return r&&(u.morphAttributes.position=h),n&&(u.morphAttributes.normal=c),i&&(u.morphAttributes.color=d),u.morphTargetsRelative=!0,u})}function Gl(u,e){if(u.updateMorphTargets(),e.weights!==void 0)for(let t=0,r=e.weights.length;t<r;t++)u.morphTargetInfluences[t]=e.weights[t];if(e.extras&&Array.isArray(e.extras.targetNames)){const t=e.extras.targetNames;if(u.morphTargetInfluences.length===t.length){u.morphTargetDictionary={};for(let r=0,n=t.length;r<n;r++)u.morphTargetDictionary[t[r]]=r}else console.warn("THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.")}}function Nl(u){let e;const t=u.extensions&&u.extensions[B.KHR_DRACO_MESH_COMPRESSION];if(t?e="draco:"+t.bufferView+":"+t.indices+":"+xn(t.attributes):e=u.indices+":"+xn(u.attributes)+":"+u.mode,u.targets!==void 0)for(let r=0,n=u.targets.length;r<n;r++)e+=":"+xn(u.targets[r]);return e}function xn(u){let e="";const t=Object.keys(u).sort();for(let r=0,n=t.length;r<n;r++)e+=t[r]+":"+u[t[r]]+";";return e}function Cn(u){switch(u){case Int8Array:return 1/127;case Uint8Array:return 1/255;case Int16Array:return 1/32767;case Uint16Array:return 1/65535;default:throw new Error("THREE.GLTFLoader: Unsupported normalized accessor component type.")}}function Ul(u){return u.search(/\.jpe?g($|\?)/i)>0||u.search(/^data\:image\/jpeg/)===0?"image/jpeg":u.search(/\.webp($|\?)/i)>0||u.search(/^data\:image\/webp/)===0?"image/webp":"image/png"}const Vl=new k;class Hl{constructor(e={},t={}){this.json=e,this.extensions={},this.plugins={},this.options=t,this.cache=new dl,this.associations=new Map,this.primitiveCache={},this.nodeCache={},this.meshCache={refs:{},uses:{}},this.cameraCache={refs:{},uses:{}},this.lightCache={refs:{},uses:{}},this.sourceCache={},this.textureCache={},this.nodeNamesUsed={};let r=!1,n=!1,i=-1;typeof navigator<"u"&&(r=/^((?!chrome|android).)*safari/i.test(navigator.userAgent)===!0,n=navigator.userAgent.indexOf("Firefox")>-1,i=n?navigator.userAgent.match(/Firefox\/([0-9]+)\./)[1]:-1),typeof createImageBitmap>"u"||r||n&&i<98?this.textureLoader=new ja(this.options.manager):this.textureLoader=new Ja(this.options.manager),this.textureLoader.setCrossOrigin(this.options.crossOrigin),this.textureLoader.setRequestHeader(this.options.requestHeader),this.fileLoader=new Lr(this.options.manager),this.fileLoader.setResponseType("arraybuffer"),this.options.crossOrigin==="use-credentials"&&this.fileLoader.setWithCredentials(!0)}setExtensions(e){this.extensions=e}setPlugins(e){this.plugins=e}parse(e,t){const r=this,n=this.json,i=this.extensions;this.cache.removeAll(),this.nodeCache={},this._invokeAll(function(s){return s._markDefs&&s._markDefs()}),Promise.all(this._invokeAll(function(s){return s.beforeRoot&&s.beforeRoot()})).then(function(){return Promise.all([r.getDependencies("scene"),r.getDependencies("animation"),r.getDependencies("camera")])}).then(function(s){const o={scene:s[0][n.scene||0],scenes:s[0],animations:s[1],cameras:s[2],asset:n.asset,parser:r,userData:{}};return it(i,o,n),Ye(o,n),Promise.all(r._invokeAll(function(a){return a.afterRoot&&a.afterRoot(o)})).then(function(){e(o)})}).catch(t)}_markDefs(){const e=this.json.nodes||[],t=this.json.skins||[],r=this.json.meshes||[];for(let n=0,i=t.length;n<i;n++){const s=t[n].joints;for(let o=0,a=s.length;o<a;o++)e[s[o]].isBone=!0}for(let n=0,i=e.length;n<i;n++){const s=e[n];s.mesh!==void 0&&(this._addNodeRef(this.meshCache,s.mesh),s.skin!==void 0&&(r[s.mesh].isSkinnedMesh=!0)),s.camera!==void 0&&this._addNodeRef(this.cameraCache,s.camera)}}_addNodeRef(e,t){t!==void 0&&(e.refs[t]===void 0&&(e.refs[t]=e.uses[t]=0),e.refs[t]++)}_getNodeRef(e,t,r){if(e.refs[t]<=1)return r;const n=r.clone(),i=(s,o)=>{const a=this.associations.get(s);a!=null&&this.associations.set(o,a);for(const[l,h]of s.children.entries())i(h,o.children[l])};return i(r,n),n.name+="_instance_"+e.uses[t]++,n}_invokeOne(e){const t=Object.values(this.plugins);t.push(this);for(let r=0;r<t.length;r++){const n=e(t[r]);if(n)return n}return null}_invokeAll(e){const t=Object.values(this.plugins);t.unshift(this);const r=[];for(let n=0;n<t.length;n++){const i=e(t[n]);i&&r.push(i)}return r}getDependency(e,t){const r=e+":"+t;let n=this.cache.get(r);if(!n){switch(e){case"scene":n=this.loadScene(t);break;case"node":n=this._invokeOne(function(i){return i.loadNode&&i.loadNode(t)});break;case"mesh":n=this._invokeOne(function(i){return i.loadMesh&&i.loadMesh(t)});break;case"accessor":n=this.loadAccessor(t);break;case"bufferView":n=this._invokeOne(function(i){return i.loadBufferView&&i.loadBufferView(t)});break;case"buffer":n=this.loadBuffer(t);break;case"material":n=this._invokeOne(function(i){return i.loadMaterial&&i.loadMaterial(t)});break;case"texture":n=this._invokeOne(function(i){return i.loadTexture&&i.loadTexture(t)});break;case"skin":n=this.loadSkin(t);break;case"animation":n=this._invokeOne(function(i){return i.loadAnimation&&i.loadAnimation(t)});break;case"camera":n=this.loadCamera(t);break;default:if(n=this._invokeOne(function(i){return i!=this&&i.getDependency&&i.getDependency(e,t)}),!n)throw new Error("Unknown type: "+e);break}this.cache.add(r,n)}return n}getDependencies(e){let t=this.cache.get(e);if(!t){const r=this,n=this.json[e+(e==="mesh"?"es":"s")]||[];t=Promise.all(n.map(function(i,s){return r.getDependency(e,s)})),this.cache.add(e,t)}return t}loadBuffer(e){const t=this.json.buffers[e],r=this.fileLoader;if(t.type&&t.type!=="arraybuffer")throw new Error("THREE.GLTFLoader: "+t.type+" buffer type is not supported.");if(t.uri===void 0&&e===0)return Promise.resolve(this.extensions[B.KHR_BINARY_GLTF].body);const n=this.options;return new Promise(function(i,s){r.load(Jt.resolveURL(t.uri,n.path),i,void 0,function(){s(new Error('THREE.GLTFLoader: Failed to load buffer "'+t.uri+'".'))})})}loadBufferView(e){const t=this.json.bufferViews[e];return this.getDependency("buffer",t.buffer).then(function(r){const n=t.byteLength||0,i=t.byteOffset||0;return r.slice(i,i+n)})}loadAccessor(e){const t=this,r=this.json,n=this.json.accessors[e];if(n.bufferView===void 0&&n.sparse===void 0){const s=yn[n.type],o=Ct[n.componentType],a=n.normalized===!0,l=new o(n.count*s);return Promise.resolve(new N(l,s,a))}const i=[];return n.bufferView!==void 0?i.push(this.getDependency("bufferView",n.bufferView)):i.push(null),n.sparse!==void 0&&(i.push(this.getDependency("bufferView",n.sparse.indices.bufferView)),i.push(this.getDependency("bufferView",n.sparse.values.bufferView))),Promise.all(i).then(function(s){const o=s[0],a=yn[n.type],l=Ct[n.componentType],h=l.BYTES_PER_ELEMENT,c=h*a,d=n.byteOffset||0,f=n.bufferView!==void 0?r.bufferViews[n.bufferView].byteStride:void 0,p=n.normalized===!0;let y,b;if(f&&f!==c){const v=Math.floor(d/f),_="InterleavedBuffer:"+n.bufferView+":"+n.componentType+":"+v+":"+n.count;let A=t.cache.get(_);A||(y=new l(o,v*f,n.count*f/h),A=new Ia(y,f/h),t.cache.add(_,A)),b=new Pn(A,a,d%f/h,p)}else o===null?y=new l(n.count*a):y=new l(o,d,n.count*a),b=new N(y,a,p);if(n.sparse!==void 0){const v=yn.SCALAR,_=Ct[n.sparse.indices.componentType],A=n.sparse.indices.byteOffset||0,M=n.sparse.values.byteOffset||0,T=new _(s[1],A,n.sparse.count*v),z=new l(s[2],M,n.sparse.count*a);o!==null&&(b=new N(b.array.slice(),b.itemSize,b.normalized));for(let S=0,R=T.length;S<R;S++){const O=T[S];if(b.setX(O,z[S*a]),a>=2&&b.setY(O,z[S*a+1]),a>=3&&b.setZ(O,z[S*a+2]),a>=4&&b.setW(O,z[S*a+3]),a>=5)throw new Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.")}}return b})}loadTexture(e){const t=this.json,r=this.options,i=t.textures[e].source,s=t.images[i];let o=this.textureLoader;if(s.uri){const a=r.manager.getHandler(s.uri);a!==null&&(o=a)}return this.loadTextureImage(e,i,o)}loadTextureImage(e,t,r){const n=this,i=this.json,s=i.textures[e],o=i.images[t],a=(o.uri||o.bufferView)+":"+s.sampler;if(this.textureCache[a])return this.textureCache[a];const l=this.loadImageSource(t,r).then(function(h){h.flipY=!1,h.name=s.name||o.name||"",h.name===""&&typeof o.uri=="string"&&o.uri.startsWith("data:image/")===!1&&(h.name=o.uri);const d=(i.samplers||{})[s.sampler]||{};return h.magFilter=ls[d.magFilter]||Rn,h.minFilter=ls[d.minFilter]||zn,h.wrapS=hs[d.wrapS]||$t,h.wrapT=hs[d.wrapT]||$t,n.associations.set(h,{textures:e}),h}).catch(function(){return null});return this.textureCache[a]=l,l}loadImageSource(e,t){const r=this,n=this.json,i=this.options;if(this.sourceCache[e]!==void 0)return this.sourceCache[e].then(c=>c.clone());const s=n.images[e],o=self.URL||self.webkitURL;let a=s.uri||"",l=!1;if(s.bufferView!==void 0)a=r.getDependency("bufferView",s.bufferView).then(function(c){l=!0;const d=new Blob([c],{type:s.mimeType});return a=o.createObjectURL(d),a});else if(s.uri===void 0)throw new Error("THREE.GLTFLoader: Image "+e+" is missing URI and bufferView");const h=Promise.resolve(a).then(function(c){return new Promise(function(d,f){let p=d;t.isImageBitmapLoader===!0&&(p=function(y){const b=new ue(y);b.needsUpdate=!0,d(b)}),t.load(Jt.resolveURL(c,i.path),p,void 0,f)})}).then(function(c){return l===!0&&o.revokeObjectURL(a),c.userData.mimeType=s.mimeType||Ul(s.uri),c}).catch(function(c){throw console.error("THREE.GLTFLoader: Couldn't load texture",a),c});return this.sourceCache[e]=h,h}assignTexture(e,t,r,n){const i=this;return this.getDependency("texture",r.index).then(function(s){if(!s)return null;if(r.texCoord!==void 0&&r.texCoord>0&&(s=s.clone(),s.channel=r.texCoord),i.extensions[B.KHR_TEXTURE_TRANSFORM]){const o=r.extensions!==void 0?r.extensions[B.KHR_TEXTURE_TRANSFORM]:void 0;if(o){const a=i.associations.get(s);s=i.extensions[B.KHR_TEXTURE_TRANSFORM].extendTexture(s,o),i.associations.set(s,a)}}return n!==void 0&&(s.colorSpace=n),e[t]=s,s})}assignFinalMaterial(e){const t=e.geometry;let r=e.material;const n=t.attributes.tangent===void 0,i=t.attributes.color!==void 0,s=t.attributes.normal===void 0;if(e.isPoints){const o="PointsMaterial:"+r.uuid;let a=this.cache.get(o);a||(a=new Ts,ot.prototype.copy.call(a,r),a.color.copy(r.color),a.map=r.map,a.sizeAttenuation=!1,this.cache.add(o,a)),r=a}else if(e.isLine){const o="LineBasicMaterial:"+r.uuid;let a=this.cache.get(o);a||(a=new Ss,ot.prototype.copy.call(a,r),a.color.copy(r.color),a.map=r.map,this.cache.add(o,a)),r=a}if(n||i||s){let o="ClonedMaterial:"+r.uuid+":";n&&(o+="derivative-tangents:"),i&&(o+="vertex-colors:"),s&&(o+="flat-shading:");let a=this.cache.get(o);a||(a=r.clone(),i&&(a.vertexColors=!0),s&&(a.flatShading=!0),n&&(a.normalScale&&(a.normalScale.y*=-1),a.clearcoatNormalScale&&(a.clearcoatNormalScale.y*=-1)),this.cache.add(o,a),this.associations.set(a,this.associations.get(r))),r=a}e.material=r}getMaterialType(){return Dn}loadMaterial(e){const t=this,r=this.json,n=this.extensions,i=r.materials[e];let s;const o={},a=i.extensions||{},l=[];if(a[B.KHR_MATERIALS_UNLIT]){const c=n[B.KHR_MATERIALS_UNLIT];s=c.getMaterialType(),l.push(c.extendParams(o,i,t))}else{const c=i.pbrMetallicRoughness||{};if(o.color=new X(1,1,1),o.opacity=1,Array.isArray(c.baseColorFactor)){const d=c.baseColorFactor;o.color.setRGB(d[0],d[1],d[2],oe),o.opacity=d[3]}c.baseColorTexture!==void 0&&l.push(t.assignTexture(o,"map",c.baseColorTexture,ee)),o.metalness=c.metallicFactor!==void 0?c.metallicFactor:1,o.roughness=c.roughnessFactor!==void 0?c.roughnessFactor:1,c.metallicRoughnessTexture!==void 0&&(l.push(t.assignTexture(o,"metalnessMap",c.metallicRoughnessTexture)),l.push(t.assignTexture(o,"roughnessMap",c.metallicRoughnessTexture))),s=this._invokeOne(function(d){return d.getMaterialType&&d.getMaterialType(e)}),l.push(Promise.all(this._invokeAll(function(d){return d.extendMaterialParams&&d.extendMaterialParams(e,o)})))}i.doubleSided===!0&&(o.side=wo);const h=i.alphaMode||gn.OPAQUE;if(h===gn.BLEND?(o.transparent=!0,o.depthWrite=!1):(o.transparent=!1,h===gn.MASK&&(o.alphaTest=i.alphaCutoff!==void 0?i.alphaCutoff:.5)),i.normalTexture!==void 0&&s!==St&&(l.push(t.assignTexture(o,"normalMap",i.normalTexture)),o.normalScale=new P(1,1),i.normalTexture.scale!==void 0)){const c=i.normalTexture.scale;o.normalScale.set(c,c)}if(i.occlusionTexture!==void 0&&s!==St&&(l.push(t.assignTexture(o,"aoMap",i.occlusionTexture)),i.occlusionTexture.strength!==void 0&&(o.aoMapIntensity=i.occlusionTexture.strength)),i.emissiveFactor!==void 0&&s!==St){const c=i.emissiveFactor;o.emissive=new X().setRGB(c[0],c[1],c[2],oe)}return i.emissiveTexture!==void 0&&s!==St&&l.push(t.assignTexture(o,"emissiveMap",i.emissiveTexture,ee)),Promise.all(l).then(function(){const c=new s(o);return i.name&&(c.name=i.name),Ye(c,i),t.associations.set(c,{materials:e}),i.extensions&&it(n,c,i),c})}createUniqueName(e){const t=F.sanitizeNodeName(e||"");return t in this.nodeNamesUsed?t+"_"+ ++this.nodeNamesUsed[t]:(this.nodeNamesUsed[t]=0,t)}loadGeometries(e){const t=this,r=this.extensions,n=this.primitiveCache;function i(o){return r[B.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(o,t).then(function(a){return cs(a,o,t)})}const s=[];for(let o=0,a=e.length;o<a;o++){const l=e[o],h=Nl(l),c=n[h];if(c)s.push(c.promise);else{let d;l.extensions&&l.extensions[B.KHR_DRACO_MESH_COMPRESSION]?d=i(l):d=cs(new ve,l,t),n[h]={primitive:l,promise:d},s.push(d)}}return Promise.all(s)}loadMesh(e){const t=this,r=this.json,n=this.extensions,i=r.meshes[e],s=i.primitives,o=[];for(let a=0,l=s.length;a<l;a++){const h=s[a].material===void 0?Dl(this.cache):this.getDependency("material",s[a].material);o.push(h)}return o.push(t.loadGeometries(s)),Promise.all(o).then(function(a){const l=a.slice(0,a.length-1),h=a[a.length-1],c=[];for(let f=0,p=h.length;f<p;f++){const y=h[f],b=s[f];let v;const _=l[f];if(b.mode===he.TRIANGLES||b.mode===he.TRIANGLE_STRIP||b.mode===he.TRIANGLE_FAN||b.mode===void 0)v=i.isSkinnedMesh===!0?new Ma(y,_):new Be(y,_),v.isSkinnedMesh===!0&&v.normalizeSkinWeights(),b.mode===he.TRIANGLE_STRIP?v.geometry=os(v.geometry,ys):b.mode===he.TRIANGLE_FAN&&(v.geometry=os(v.geometry,wn));else if(b.mode===he.LINES)v=new Ca(y,_);else if(b.mode===he.LINE_STRIP)v=new On(y,_);else if(b.mode===he.LINE_LOOP)v=new Ra(y,_);else if(b.mode===he.POINTS)v=new za(y,_);else throw new Error("THREE.GLTFLoader: Primitive mode unsupported: "+b.mode);Object.keys(v.geometry.morphAttributes).length>0&&Gl(v,i),v.name=t.createUniqueName(i.name||"mesh_"+e),Ye(v,i),b.extensions&&it(n,v,b),t.assignFinalMaterial(v),c.push(v)}for(let f=0,p=c.length;f<p;f++)t.associations.set(c[f],{meshes:e,primitives:f});if(c.length===1)return i.extensions&&it(n,c[0],i),c[0];const d=new Br;i.extensions&&it(n,d,i),t.associations.set(d,{meshes:e});for(let f=0,p=c.length;f<p;f++)d.add(c[f]);return d})}loadCamera(e){let t;const r=this.json.cameras[e],n=r[r.type];if(!n){console.warn("THREE.GLTFLoader: Missing camera parameters.");return}return r.type==="perspective"?t=new Fr(bs.radToDeg(n.yfov),n.aspectRatio||1,n.znear||1,n.zfar||2e6):r.type==="orthographic"&&(t=new _s(-n.xmag,n.xmag,n.ymag,-n.ymag,n.znear,n.zfar)),r.name&&(t.name=this.createUniqueName(r.name)),Ye(t,r),Promise.resolve(t)}loadSkin(e){const t=this.json.skins[e],r=[];for(let n=0,i=t.joints.length;n<i;n++)r.push(this._loadNodeShallow(t.joints[n]));return t.inverseBindMatrices!==void 0?r.push(this.getDependency("accessor",t.inverseBindMatrices)):r.push(null),Promise.all(r).then(function(n){const i=n.pop(),s=n,o=[],a=[];for(let l=0,h=s.length;l<h;l++){const c=s[l];if(c){o.push(c);const d=new k;i!==null&&d.fromArray(i.array,l*16),a.push(d)}else console.warn('THREE.GLTFLoader: Joint "%s" could not be found.',t.joints[l])}return new Ln(o,a)})}loadAnimation(e){const t=this.json,r=this,n=t.animations[e],i=n.name?n.name:"animation_"+e,s=[],o=[],a=[],l=[],h=[];for(let c=0,d=n.channels.length;c<d;c++){const f=n.channels[c],p=n.samplers[f.sampler],y=f.target,b=y.node,v=n.parameters!==void 0?n.parameters[p.input]:p.input,_=n.parameters!==void 0?n.parameters[p.output]:p.output;y.node!==void 0&&(s.push(this.getDependency("node",b)),o.push(this.getDependency("accessor",v)),a.push(this.getDependency("accessor",_)),l.push(p),h.push(y))}return Promise.all([Promise.all(s),Promise.all(o),Promise.all(a),Promise.all(l),Promise.all(h)]).then(function(c){const d=c[0],f=c[1],p=c[2],y=c[3],b=c[4],v=[];for(let _=0,A=d.length;_<A;_++){const M=d[_],T=f[_],z=p[_],S=y[_],R=b[_];if(M===void 0)continue;M.updateMatrix&&M.updateMatrix();const O=r._createAnimationTracks(M,T,z,S,R);if(O)for(let V=0;V<O.length;V++)v.push(O[V])}return new Da(i,void 0,v)})}createNodeMesh(e){const t=this.json,r=this,n=t.nodes[e];return n.mesh===void 0?null:r.getDependency("mesh",n.mesh).then(function(i){const s=r._getNodeRef(r.meshCache,n.mesh,i);return n.weights!==void 0&&s.traverse(function(o){if(o.isMesh)for(let a=0,l=n.weights.length;a<l;a++)o.morphTargetInfluences[a]=n.weights[a]}),s})}loadNode(e){const t=this.json,r=this,n=t.nodes[e],i=r._loadNodeShallow(e),s=[],o=n.children||[];for(let l=0,h=o.length;l<h;l++)s.push(r.getDependency("node",o[l]));const a=n.skin===void 0?Promise.resolve(null):r.getDependency("skin",n.skin);return Promise.all([i,Promise.all(s),a]).then(function(l){const h=l[0],c=l[1],d=l[2];d!==null&&h.traverse(function(f){f.isSkinnedMesh&&f.bind(d,Vl)});for(let f=0,p=c.length;f<p;f++)h.add(c[f]);return h})}_loadNodeShallow(e){const t=this.json,r=this.extensions,n=this;if(this.nodeCache[e]!==void 0)return this.nodeCache[e];const i=t.nodes[e],s=i.name?n.createUniqueName(i.name):"",o=[],a=n._invokeOne(function(l){return l.createNodeMesh&&l.createNodeMesh(e)});return a&&o.push(a),i.camera!==void 0&&o.push(n.getDependency("camera",i.camera).then(function(l){return n._getNodeRef(n.cameraCache,i.camera,l)})),n._invokeAll(function(l){return l.createNodeAttachment&&l.createNodeAttachment(e)}).forEach(function(l){o.push(l)}),this.nodeCache[e]=Promise.all(o).then(function(l){let h;if(i.isBone===!0?h=new Ms:l.length>1?h=new Br:l.length===1?h=l[0]:h=new W,h!==l[0])for(let c=0,d=l.length;c<d;c++)h.add(l[c]);if(i.name&&(h.userData.name=i.name,h.name=s),Ye(h,i),i.extensions&&it(r,h,i),i.matrix!==void 0){const c=new k;c.fromArray(i.matrix),h.applyMatrix4(c)}else i.translation!==void 0&&h.position.fromArray(i.translation),i.rotation!==void 0&&h.quaternion.fromArray(i.rotation),i.scale!==void 0&&h.scale.fromArray(i.scale);return n.associations.has(h)||n.associations.set(h,{}),n.associations.get(h).nodes=e,h}),this.nodeCache[e]}loadScene(e){const t=this.extensions,r=this.json.scenes[e],n=this,i=new Br;r.name&&(i.name=n.createUniqueName(r.name)),Ye(i,r),r.extensions&&it(t,i,r);const s=r.nodes||[],o=[];for(let a=0,l=s.length;a<l;a++)o.push(n.getDependency("node",s[a]));return Promise.all(o).then(function(a){for(let h=0,c=a.length;h<c;h++)i.add(a[h]);const l=h=>{const c=new Map;for(const[d,f]of n.associations)(d instanceof ot||d instanceof ue)&&c.set(d,f);return h.traverse(d=>{const f=n.associations.get(d);f!=null&&c.set(d,f)}),c};return n.associations=l(i),i})}_createAnimationTracks(e,t,r,n,i){const s=[],o=e.name?e.name:e.uuid,a=[];Xe[i.path]===Xe.weights?e.traverse(function(d){d.morphTargetInfluences&&a.push(d.name?d.name:d.uuid)}):a.push(o);let l;switch(Xe[i.path]){case Xe.weights:l=zt;break;case Xe.rotation:l=at;break;case Xe.position:case Xe.scale:l=kt;break;default:switch(r.itemSize){case 1:l=zt;break;case 2:case 3:default:l=kt;break}break}const h=n.interpolation!==void 0?Ol[n.interpolation]:Rt,c=this._getArrayFromAccessor(r);for(let d=0,f=a.length;d<f;d++){const p=new l(a[d]+"."+Xe[i.path],t.array,c,h);n.interpolation==="CUBICSPLINE"&&this._createCubicSplineTrackInterpolant(p),s.push(p)}return s}_getArrayFromAccessor(e){let t=e.array;if(e.normalized){const r=Cn(t.constructor),n=new Float32Array(t.length);for(let i=0,s=t.length;i<s;i++)n[i]=t[i]*r;t=n}return t}_createCubicSplineTrackInterpolant(e){e.createInterpolant=function(r){const n=this instanceof at?Ll:ks;return new n(this.times,this.values,this.getValueSize()/3,r)},e.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline=!0}}function jl(u,e,t){const r=e.attributes,n=new Le;if(r.POSITION!==void 0){const o=t.json.accessors[r.POSITION],a=o.min,l=o.max;if(a!==void 0&&l!==void 0){if(n.set(new w(a[0],a[1],a[2]),new w(l[0],l[1],l[2])),o.normalized){const h=Cn(Ct[o.componentType]);n.min.multiplyScalar(h),n.max.multiplyScalar(h)}}else{console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");return}}else return;const i=e.targets;if(i!==void 0){const o=new w,a=new w;for(let l=0,h=i.length;l<h;l++){const c=i[l];if(c.POSITION!==void 0){const d=t.json.accessors[c.POSITION],f=d.min,p=d.max;if(f!==void 0&&p!==void 0){if(a.setX(Math.max(Math.abs(f[0]),Math.abs(p[0]))),a.setY(Math.max(Math.abs(f[1]),Math.abs(p[1]))),a.setZ(Math.max(Math.abs(f[2]),Math.abs(p[2]))),d.normalized){const y=Cn(Ct[d.componentType]);a.multiplyScalar(y)}o.max(a)}else console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.")}}n.expandByVector(o)}u.boundingBox=n;const s=new be;n.getCenter(s.center),s.radius=n.min.distanceTo(n.max)/2,u.boundingSphere=s}function cs(u,e,t){const r=e.attributes,n=[];function i(s,o){return t.getDependency("accessor",s).then(function(a){u.setAttribute(o,a)})}for(const s in r){const o=Tn[s]||s.toLowerCase();o in u.attributes||n.push(i(r[s],o))}if(e.indices!==void 0&&!u.index){const s=t.getDependency("accessor",e.indices).then(function(o){u.setIndex(o)});n.push(s)}return ie.workingColorSpace!==oe&&"COLOR_0"in r&&console.warn(`THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${ie.workingColorSpace}" not supported.`),Ye(u,e),jl(u,e,t),Promise.all(n).then(function(){return e.targets!==void 0?Fl(u,e.targets,t):u})}function Xt(u){document.querySelector("span").innerHTML=u}function Wl(u){return Object.keys(u)}const ql=u=>u&&typeof u.length=="number"&&u.buffer instanceof ArrayBuffer&&typeof u.byteLength=="number",L={i32:{numElements:1,align:4,size:4,type:"i32",View:Int32Array},u32:{numElements:1,align:4,size:4,type:"u32",View:Uint32Array},f32:{numElements:1,align:4,size:4,type:"f32",View:Float32Array},f16:{numElements:1,align:2,size:2,type:"u16",View:Uint16Array},vec2f:{numElements:2,align:8,size:8,type:"f32",View:Float32Array},vec2i:{numElements:2,align:8,size:8,type:"i32",View:Int32Array},vec2u:{numElements:2,align:8,size:8,type:"u32",View:Uint32Array},vec2h:{numElements:2,align:4,size:4,type:"u16",View:Uint16Array},vec3i:{numElements:3,align:16,size:12,type:"i32",View:Int32Array},vec3u:{numElements:3,align:16,size:12,type:"u32",View:Uint32Array},vec3f:{numElements:3,align:16,size:12,type:"f32",View:Float32Array},vec3h:{numElements:3,align:8,size:6,type:"u16",View:Uint16Array},vec4i:{numElements:4,align:16,size:16,type:"i32",View:Int32Array},vec4u:{numElements:4,align:16,size:16,type:"u32",View:Uint32Array},vec4f:{numElements:4,align:16,size:16,type:"f32",View:Float32Array},vec4h:{numElements:4,align:8,size:8,type:"u16",View:Uint16Array},mat2x2f:{numElements:4,align:8,size:16,type:"f32",View:Float32Array},mat2x2h:{numElements:4,align:4,size:8,type:"u16",View:Uint16Array},mat3x2f:{numElements:6,align:8,size:24,type:"f32",View:Float32Array},mat3x2h:{numElements:6,align:4,size:12,type:"u16",View:Uint16Array},mat4x2f:{numElements:8,align:8,size:32,type:"f32",View:Float32Array},mat4x2h:{numElements:8,align:4,size:16,type:"u16",View:Uint16Array},mat2x3f:{numElements:8,align:16,size:32,pad:[3,1],type:"f32",View:Float32Array},mat2x3h:{numElements:8,align:8,size:16,pad:[3,1],type:"u16",View:Uint16Array},mat3x3f:{numElements:12,align:16,size:48,pad:[3,1],type:"f32",View:Float32Array},mat3x3h:{numElements:12,align:8,size:24,pad:[3,1],type:"u16",View:Uint16Array},mat4x3f:{numElements:16,align:16,size:64,pad:[3,1],type:"f32",View:Float32Array},mat4x3h:{numElements:16,align:8,size:32,pad:[3,1],type:"u16",View:Uint16Array},mat2x4f:{numElements:8,align:16,size:32,type:"f32",View:Float32Array},mat2x4h:{numElements:8,align:8,size:16,type:"u16",View:Uint16Array},mat3x4f:{numElements:12,align:16,size:48,pad:[3,1],type:"f32",View:Float32Array},mat3x4h:{numElements:12,align:8,size:24,pad:[3,1],type:"u16",View:Uint16Array},mat4x4f:{numElements:16,align:16,size:64,type:"f32",View:Float32Array},mat4x4h:{numElements:16,align:8,size:32,type:"u16",View:Uint16Array},bool:{numElements:0,align:1,size:0,type:"bool",View:Uint32Array}},Es={...L,"atomic<i32>":L.i32,"atomic<u32>":L.u32,"vec2<i32>":L.vec2i,"vec2<u32>":L.vec2u,"vec2<f32>":L.vec2f,"vec2<f16>":L.vec2h,"vec3<i32>":L.vec3i,"vec3<u32>":L.vec3u,"vec3<f32>":L.vec3f,"vec3<f16>":L.vec3h,"vec4<i32>":L.vec4i,"vec4<u32>":L.vec4u,"vec4<f32>":L.vec4f,"vec4<f16>":L.vec4h,"mat2x2<f32>":L.mat2x2f,"mat2x2<f16>":L.mat2x2h,"mat3x2<f32>":L.mat3x2f,"mat3x2<f16>":L.mat3x2h,"mat4x2<f32>":L.mat4x2f,"mat4x2<f16>":L.mat4x2h,"mat2x3<f32>":L.mat2x3f,"mat2x3<f16>":L.mat2x3h,"mat3x3<f32>":L.mat3x3f,"mat3x3<f16>":L.mat3x3h,"mat4x3<f32>":L.mat4x3f,"mat4x3<f16>":L.mat4x3h,"mat2x4<f32>":L.mat2x4f,"mat2x4<f16>":L.mat2x4h,"mat3x4<f32>":L.mat3x4f,"mat3x4<f16>":L.mat3x4h,"mat4x4<f32>":L.mat4x4f,"mat4x4<f16>":L.mat4x4h},Xl=Wl(Es);function Yl(u=[],e){const t=new Set;for(const r of Xl){const n=Es[r];t.has(n)||(t.add(n),n.flatten=u.includes(r)?e:!e)}}Yl();var Or;(function(u){u.increment="++",u.decrement="--"})(Or||(Or={}));(function(u){function e(t){const r=t;if(r=="parse")throw new Error("Invalid value for IncrementOperator");return u[r]}u.parse=e})(Or||(Or={}));var Dr;(function(u){u.assign="=",u.addAssign="+=",u.subtractAssin="-=",u.multiplyAssign="*=",u.divideAssign="/=",u.moduloAssign="%=",u.andAssign="&=",u.orAssign="|=",u.xorAssign="^=",u.shiftLeftAssign="<<=",u.shiftRightAssign=">>="})(Dr||(Dr={}));(function(u){function e(t){const r=t;if(r=="parse")throw new Error("Invalid value for AssignOperator");return r}u.parse=e})(Dr||(Dr={}));var I,g;(function(u){u[u.token=0]="token",u[u.keyword=1]="keyword",u[u.reserved=2]="reserved"})(g||(g={}));class x{constructor(e,t,r){this.name=e,this.type=t,this.rule=r}toString(){return this.name}}class U{}I=U;U.none=new x("",g.reserved,"");U.eof=new x("EOF",g.token,"");U.reserved={asm:new x("asm",g.reserved,"asm"),bf16:new x("bf16",g.reserved,"bf16"),do:new x("do",g.reserved,"do"),enum:new x("enum",g.reserved,"enum"),f16:new x("f16",g.reserved,"f16"),f64:new x("f64",g.reserved,"f64"),handle:new x("handle",g.reserved,"handle"),i8:new x("i8",g.reserved,"i8"),i16:new x("i16",g.reserved,"i16"),i64:new x("i64",g.reserved,"i64"),mat:new x("mat",g.reserved,"mat"),premerge:new x("premerge",g.reserved,"premerge"),regardless:new x("regardless",g.reserved,"regardless"),typedef:new x("typedef",g.reserved,"typedef"),u8:new x("u8",g.reserved,"u8"),u16:new x("u16",g.reserved,"u16"),u64:new x("u64",g.reserved,"u64"),unless:new x("unless",g.reserved,"unless"),using:new x("using",g.reserved,"using"),vec:new x("vec",g.reserved,"vec"),void:new x("void",g.reserved,"void")};U.keywords={array:new x("array",g.keyword,"array"),atomic:new x("atomic",g.keyword,"atomic"),bool:new x("bool",g.keyword,"bool"),f32:new x("f32",g.keyword,"f32"),i32:new x("i32",g.keyword,"i32"),mat2x2:new x("mat2x2",g.keyword,"mat2x2"),mat2x3:new x("mat2x3",g.keyword,"mat2x3"),mat2x4:new x("mat2x4",g.keyword,"mat2x4"),mat3x2:new x("mat3x2",g.keyword,"mat3x2"),mat3x3:new x("mat3x3",g.keyword,"mat3x3"),mat3x4:new x("mat3x4",g.keyword,"mat3x4"),mat4x2:new x("mat4x2",g.keyword,"mat4x2"),mat4x3:new x("mat4x3",g.keyword,"mat4x3"),mat4x4:new x("mat4x4",g.keyword,"mat4x4"),ptr:new x("ptr",g.keyword,"ptr"),sampler:new x("sampler",g.keyword,"sampler"),sampler_comparison:new x("sampler_comparison",g.keyword,"sampler_comparison"),struct:new x("struct",g.keyword,"struct"),texture_1d:new x("texture_1d",g.keyword,"texture_1d"),texture_2d:new x("texture_2d",g.keyword,"texture_2d"),texture_2d_array:new x("texture_2d_array",g.keyword,"texture_2d_array"),texture_3d:new x("texture_3d",g.keyword,"texture_3d"),texture_cube:new x("texture_cube",g.keyword,"texture_cube"),texture_cube_array:new x("texture_cube_array",g.keyword,"texture_cube_array"),texture_multisampled_2d:new x("texture_multisampled_2d",g.keyword,"texture_multisampled_2d"),texture_storage_1d:new x("texture_storage_1d",g.keyword,"texture_storage_1d"),texture_storage_2d:new x("texture_storage_2d",g.keyword,"texture_storage_2d"),texture_storage_2d_array:new x("texture_storage_2d_array",g.keyword,"texture_storage_2d_array"),texture_storage_3d:new x("texture_storage_3d",g.keyword,"texture_storage_3d"),texture_depth_2d:new x("texture_depth_2d",g.keyword,"texture_depth_2d"),texture_depth_2d_array:new x("texture_depth_2d_array",g.keyword,"texture_depth_2d_array"),texture_depth_cube:new x("texture_depth_cube",g.keyword,"texture_depth_cube"),texture_depth_cube_array:new x("texture_depth_cube_array",g.keyword,"texture_depth_cube_array"),texture_depth_multisampled_2d:new x("texture_depth_multisampled_2d",g.keyword,"texture_depth_multisampled_2d"),texture_external:new x("texture_external",g.keyword,"texture_external"),u32:new x("u32",g.keyword,"u32"),vec2:new x("vec2",g.keyword,"vec2"),vec3:new x("vec3",g.keyword,"vec3"),vec4:new x("vec4",g.keyword,"vec4"),bitcast:new x("bitcast",g.keyword,"bitcast"),block:new x("block",g.keyword,"block"),break:new x("break",g.keyword,"break"),case:new x("case",g.keyword,"case"),continue:new x("continue",g.keyword,"continue"),continuing:new x("continuing",g.keyword,"continuing"),default:new x("default",g.keyword,"default"),discard:new x("discard",g.keyword,"discard"),else:new x("else",g.keyword,"else"),enable:new x("enable",g.keyword,"enable"),fallthrough:new x("fallthrough",g.keyword,"fallthrough"),false:new x("false",g.keyword,"false"),fn:new x("fn",g.keyword,"fn"),for:new x("for",g.keyword,"for"),function:new x("function",g.keyword,"function"),if:new x("if",g.keyword,"if"),let:new x("let",g.keyword,"let"),const:new x("const",g.keyword,"const"),loop:new x("loop",g.keyword,"loop"),while:new x("while",g.keyword,"while"),private:new x("private",g.keyword,"private"),read:new x("read",g.keyword,"read"),read_write:new x("read_write",g.keyword,"read_write"),return:new x("return",g.keyword,"return"),storage:new x("storage",g.keyword,"storage"),switch:new x("switch",g.keyword,"switch"),true:new x("true",g.keyword,"true"),alias:new x("alias",g.keyword,"alias"),type:new x("type",g.keyword,"type"),uniform:new x("uniform",g.keyword,"uniform"),var:new x("var",g.keyword,"var"),override:new x("override",g.keyword,"override"),workgroup:new x("workgroup",g.keyword,"workgroup"),write:new x("write",g.keyword,"write"),r8unorm:new x("r8unorm",g.keyword,"r8unorm"),r8snorm:new x("r8snorm",g.keyword,"r8snorm"),r8uint:new x("r8uint",g.keyword,"r8uint"),r8sint:new x("r8sint",g.keyword,"r8sint"),r16uint:new x("r16uint",g.keyword,"r16uint"),r16sint:new x("r16sint",g.keyword,"r16sint"),r16float:new x("r16float",g.keyword,"r16float"),rg8unorm:new x("rg8unorm",g.keyword,"rg8unorm"),rg8snorm:new x("rg8snorm",g.keyword,"rg8snorm"),rg8uint:new x("rg8uint",g.keyword,"rg8uint"),rg8sint:new x("rg8sint",g.keyword,"rg8sint"),r32uint:new x("r32uint",g.keyword,"r32uint"),r32sint:new x("r32sint",g.keyword,"r32sint"),r32float:new x("r32float",g.keyword,"r32float"),rg16uint:new x("rg16uint",g.keyword,"rg16uint"),rg16sint:new x("rg16sint",g.keyword,"rg16sint"),rg16float:new x("rg16float",g.keyword,"rg16float"),rgba8unorm:new x("rgba8unorm",g.keyword,"rgba8unorm"),rgba8unorm_srgb:new x("rgba8unorm_srgb",g.keyword,"rgba8unorm_srgb"),rgba8snorm:new x("rgba8snorm",g.keyword,"rgba8snorm"),rgba8uint:new x("rgba8uint",g.keyword,"rgba8uint"),rgba8sint:new x("rgba8sint",g.keyword,"rgba8sint"),bgra8unorm:new x("bgra8unorm",g.keyword,"bgra8unorm"),bgra8unorm_srgb:new x("bgra8unorm_srgb",g.keyword,"bgra8unorm_srgb"),rgb10a2unorm:new x("rgb10a2unorm",g.keyword,"rgb10a2unorm"),rg11b10float:new x("rg11b10float",g.keyword,"rg11b10float"),rg32uint:new x("rg32uint",g.keyword,"rg32uint"),rg32sint:new x("rg32sint",g.keyword,"rg32sint"),rg32float:new x("rg32float",g.keyword,"rg32float"),rgba16uint:new x("rgba16uint",g.keyword,"rgba16uint"),rgba16sint:new x("rgba16sint",g.keyword,"rgba16sint"),rgba16float:new x("rgba16float",g.keyword,"rgba16float"),rgba32uint:new x("rgba32uint",g.keyword,"rgba32uint"),rgba32sint:new x("rgba32sint",g.keyword,"rgba32sint"),rgba32float:new x("rgba32float",g.keyword,"rgba32float"),static_assert:new x("static_assert",g.keyword,"static_assert")};U.tokens={decimal_float_literal:new x("decimal_float_literal",g.token,/((-?[0-9]*\.[0-9]+|-?[0-9]+\.[0-9]*)((e|E)(\+|-)?[0-9]+)?f?)|(-?[0-9]+(e|E)(\+|-)?[0-9]+f?)|([0-9]+f)/),hex_float_literal:new x("hex_float_literal",g.token,/-?0x((([0-9a-fA-F]*\.[0-9a-fA-F]+|[0-9a-fA-F]+\.[0-9a-fA-F]*)((p|P)(\+|-)?[0-9]+f?)?)|([0-9a-fA-F]+(p|P)(\+|-)?[0-9]+f?))/),int_literal:new x("int_literal",g.token,/-?0x[0-9a-fA-F]+|0i?|-?[1-9][0-9]*i?/),uint_literal:new x("uint_literal",g.token,/0x[0-9a-fA-F]+u|0u|[1-9][0-9]*u/),ident:new x("ident",g.token,/[a-zA-Z][0-9a-zA-Z_]*/),and:new x("and",g.token,"&"),and_and:new x("and_and",g.token,"&&"),arrow:new x("arrow ",g.token,"->"),attr:new x("attr",g.token,"@"),attr_left:new x("attr_left",g.token,"[["),attr_right:new x("attr_right",g.token,"]]"),forward_slash:new x("forward_slash",g.token,"/"),bang:new x("bang",g.token,"!"),bracket_left:new x("bracket_left",g.token,"["),bracket_right:new x("bracket_right",g.token,"]"),brace_left:new x("brace_left",g.token,"{"),brace_right:new x("brace_right",g.token,"}"),colon:new x("colon",g.token,":"),comma:new x("comma",g.token,","),equal:new x("equal",g.token,"="),equal_equal:new x("equal_equal",g.token,"=="),not_equal:new x("not_equal",g.token,"!="),greater_than:new x("greater_than",g.token,">"),greater_than_equal:new x("greater_than_equal",g.token,">="),shift_right:new x("shift_right",g.token,">>"),less_than:new x("less_than",g.token,"<"),less_than_equal:new x("less_than_equal",g.token,"<="),shift_left:new x("shift_left",g.token,"<<"),modulo:new x("modulo",g.token,"%"),minus:new x("minus",g.token,"-"),minus_minus:new x("minus_minus",g.token,"--"),period:new x("period",g.token,"."),plus:new x("plus",g.token,"+"),plus_plus:new x("plus_plus",g.token,"++"),or:new x("or",g.token,"|"),or_or:new x("or_or",g.token,"||"),paren_left:new x("paren_left",g.token,"("),paren_right:new x("paren_right",g.token,")"),semicolon:new x("semicolon",g.token,";"),star:new x("star",g.token,"*"),tilde:new x("tilde",g.token,"~"),underscore:new x("underscore",g.token,"_"),xor:new x("xor",g.token,"^"),plus_equal:new x("plus_equal",g.token,"+="),minus_equal:new x("minus_equal",g.token,"-="),times_equal:new x("times_equal",g.token,"*="),division_equal:new x("division_equal",g.token,"/="),modulo_equal:new x("modulo_equal",g.token,"%="),and_equal:new x("and_equal",g.token,"&="),or_equal:new x("or_equal",g.token,"|="),xor_equal:new x("xor_equal",g.token,"^="),shift_right_equal:new x("shift_right_equal",g.token,">>="),shift_left_equal:new x("shift_left_equal",g.token,"<<=")};U.storage_class=[I.keywords.function,I.keywords.private,I.keywords.workgroup,I.keywords.uniform,I.keywords.storage];U.access_mode=[I.keywords.read,I.keywords.write,I.keywords.read_write];U.sampler_type=[I.keywords.sampler,I.keywords.sampler_comparison];U.sampled_texture_type=[I.keywords.texture_1d,I.keywords.texture_2d,I.keywords.texture_2d_array,I.keywords.texture_3d,I.keywords.texture_cube,I.keywords.texture_cube_array];U.multisampled_texture_type=[I.keywords.texture_multisampled_2d];U.storage_texture_type=[I.keywords.texture_storage_1d,I.keywords.texture_storage_2d,I.keywords.texture_storage_2d_array,I.keywords.texture_storage_3d];U.depth_texture_type=[I.keywords.texture_depth_2d,I.keywords.texture_depth_2d_array,I.keywords.texture_depth_cube,I.keywords.texture_depth_cube_array,I.keywords.texture_depth_multisampled_2d];U.texture_external_type=[I.keywords.texture_external];U.any_texture_type=[...I.sampled_texture_type,...I.multisampled_texture_type,...I.storage_texture_type,...I.depth_texture_type,...I.texture_external_type];U.texel_format=[I.keywords.r8unorm,I.keywords.r8snorm,I.keywords.r8uint,I.keywords.r8sint,I.keywords.r16uint,I.keywords.r16sint,I.keywords.r16float,I.keywords.rg8unorm,I.keywords.rg8snorm,I.keywords.rg8uint,I.keywords.rg8sint,I.keywords.r32uint,I.keywords.r32sint,I.keywords.r32float,I.keywords.rg16uint,I.keywords.rg16sint,I.keywords.rg16float,I.keywords.rgba8unorm,I.keywords.rgba8unorm_srgb,I.keywords.rgba8snorm,I.keywords.rgba8uint,I.keywords.rgba8sint,I.keywords.bgra8unorm,I.keywords.bgra8unorm_srgb,I.keywords.rgb10a2unorm,I.keywords.rg11b10float,I.keywords.rg32uint,I.keywords.rg32sint,I.keywords.rg32float,I.keywords.rgba16uint,I.keywords.rgba16sint,I.keywords.rgba16float,I.keywords.rgba32uint,I.keywords.rgba32sint,I.keywords.rgba32float];U.const_literal=[I.tokens.int_literal,I.tokens.uint_literal,I.tokens.decimal_float_literal,I.tokens.hex_float_literal,I.keywords.true,I.keywords.false];U.literal_or_ident=[I.tokens.ident,I.tokens.int_literal,I.tokens.uint_literal,I.tokens.decimal_float_literal,I.tokens.hex_float_literal];U.element_count_expression=[I.tokens.int_literal,I.tokens.uint_literal,I.tokens.ident];U.template_types=[I.keywords.vec2,I.keywords.vec3,I.keywords.vec4,I.keywords.mat2x2,I.keywords.mat2x3,I.keywords.mat2x4,I.keywords.mat3x2,I.keywords.mat3x3,I.keywords.mat3x4,I.keywords.mat4x2,I.keywords.mat4x3,I.keywords.mat4x4,I.keywords.atomic,I.keywords.bitcast,...I.any_texture_type];U.attribute_name=[I.tokens.ident,I.keywords.block];U.assignment_operators=[I.tokens.equal,I.tokens.plus_equal,I.tokens.minus_equal,I.tokens.times_equal,I.tokens.division_equal,I.tokens.modulo_equal,I.tokens.and_equal,I.tokens.or_equal,I.tokens.xor_equal,I.tokens.shift_right_equal,I.tokens.shift_left_equal];U.increment_operators=[I.tokens.plus_plus,I.tokens.minus_minus];var us;(function(u){u[u.Uniform=0]="Uniform",u[u.Storage=1]="Storage",u[u.Texture=2]="Texture",u[u.Sampler=3]="Sampler",u[u.StorageTexture=4]="StorageTexture"})(us||(us={}));U.any_texture_type.map(u=>u.name);U.sampler_type.map(u=>u.name);function Kl(u){switch(u.dimension){case"1d":return"1d";case"3d":return"3d";default:case"2d":return u.depthOrArrayLayers>1?"2d-array":"2d"}}function Zl(u){return[u.width,u.height||1,u.depthOrArrayLayers||1]}function Jl(u){return Array.isArray(u)||ql(u)?[...u,1,1].slice(0,3):Zl(u)}function $l(u,e){const t=Jl(u),r=Math.max(...t.slice(0,e==="3d"?3:2));return 1+Math.log2(r)|0}function Ql(u){let e,t;switch(u){case"2d":e="texture_2d<f32>",t="textureSample(ourTexture, ourSampler, fsInput.texcoord)";break;case"2d-array":e="texture_2d_array<f32>",t=`
          textureSample(
              ourTexture,
              ourSampler,
              fsInput.texcoord,
              uni.layer)`;break;case"cube":e="texture_cube<f32>",t=`
          textureSample(
              ourTexture,
              ourSampler,
              faceMat[uni.layer] * vec3f(fract(fsInput.texcoord), 1))`;break;case"cube-array":e="texture_cube_array<f32>",t=`
          textureSample(
              ourTexture,
              ourSampler,
              faceMat[uni.layer] * vec3f(fract(fsInput.texcoord), 1), uni.layer)`;break;default:throw new Error(`unsupported view: ${u}`)}return`
        const faceMat = array(
          mat3x3f( 0,  0,  -2,  0, -2,   0,  1,  1,   1),   // pos-x
          mat3x3f( 0,  0,   2,  0, -2,   0, -1,  1,  -1),   // neg-x
          mat3x3f( 2,  0,   0,  0,  0,   2, -1,  1,  -1),   // pos-y
          mat3x3f( 2,  0,   0,  0,  0,  -2, -1, -1,   1),   // neg-y
          mat3x3f( 2,  0,   0,  0, -2,   0, -1,  1,   1),   // pos-z
          mat3x3f(-2,  0,   0,  0, -2,   0,  1,  1,  -1));  // neg-z

        struct VSOutput {
          @builtin(position) position: vec4f,
          @location(0) texcoord: vec2f,
        };

        @vertex fn vs(
          @builtin(vertex_index) vertexIndex : u32
        ) -> VSOutput {
          var pos = array<vec2f, 3>(
            vec2f(-1.0, -1.0),
            vec2f(-1.0,  3.0),
            vec2f( 3.0, -1.0),
          );

          var vsOutput: VSOutput;
          let xy = pos[vertexIndex];
          vsOutput.position = vec4f(xy, 0.0, 1.0);
          vsOutput.texcoord = xy * vec2f(0.5, -0.5) + vec2f(0.5);
          return vsOutput;
        }

        struct Uniforms {
          layer: u32,
        };

        @group(0) @binding(0) var ourSampler: sampler;
        @group(0) @binding(1) var ourTexture: ${e};
        @group(0) @binding(2) var<uniform> uni: Uniforms;

        @fragment fn fs(fsInput: VSOutput) -> @location(0) vec4f {
          _ = uni.layer; // make sure this is used so all pipelines have the same bindings
          return ${t};
        }
      `}const ds=new WeakMap;function eh(u,e,t){let r=ds.get(u);r||(r={pipelineByFormatAndView:{},moduleByViewType:{}},ds.set(u,r));let{sampler:n,uniformBuffer:i,uniformValues:s}=r;const{pipelineByFormatAndView:o,moduleByViewType:a}=r;t=t||Kl(e);let l=a[t];if(!l){const d=Ql(t);l=u.createShaderModule({label:`mip level generation for ${t}`,code:d}),a[t]=l}n||(n=u.createSampler({minFilter:"linear",magFilter:"linear"}),i=u.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),s=new Uint32Array(1),Object.assign(r,{sampler:n,uniformBuffer:i,uniformValues:s}));const h=`${e.format}.${t}`;o[h]||(o[h]=u.createRenderPipeline({label:`mip level generator pipeline for ${t}`,layout:"auto",vertex:{module:l,entryPoint:"vs"},fragment:{module:l,entryPoint:"fs",targets:[{format:e.format}]}}));const c=o[h];for(let d=1;d<e.mipLevelCount;++d)for(let f=0;f<e.depthOrArrayLayers;++f){s[0]=f,u.queue.writeBuffer(i,0,s);const p=u.createBindGroup({layout:c.getBindGroupLayout(0),entries:[{binding:0,resource:n},{binding:1,resource:e.createView({dimension:t,baseMipLevel:d-1,mipLevelCount:1})},{binding:2,resource:{buffer:i}}]}),y={label:"mip gen renderPass",colorAttachments:[{view:e.createView({dimension:"2d",baseMipLevel:d,mipLevelCount:1,baseArrayLayer:f,arrayLayerCount:1}),loadOp:"clear",storeOp:"store"}]},b=u.createCommandEncoder({label:"mip gen encoder"}),v=b.beginRenderPass(y);v.setPipeline(c),v.setBindGroup(0,p),v.draw(3),v.end();const _=b.finish();u.queue.submit([_])}}const th=new Map([[Int8Array,{formats:["sint8","snorm8"],defaultForType:1}],[Uint8Array,{formats:["uint8","unorm8"],defaultForType:1}],[Int16Array,{formats:["sint16","snorm16"],defaultForType:1}],[Uint16Array,{formats:["uint16","unorm16"],defaultForType:1}],[Int32Array,{formats:["sint32","snorm32"],defaultForType:0}],[Uint32Array,{formats:["uint32","unorm32"],defaultForType:0}],[Float32Array,{formats:["float32","float32"],defaultForType:0}]]);new Map([...th.entries()].map(([u,{formats:[e,t]}])=>[[e,u],[t,u]]).flat());function rh(u){return new Worker(""+new URL("computeWorker-CNpWzIe7.js",import.meta.url).href,{name:u?.name})}class nh{position=new Float32Array;normal=new Float32Array;uv=new Float32Array;tangent=new Float32Array;indices=new Uint32Array;constructor(e){this.position=e.attributes.position.array,this.normal=e.attributes.normal.array,this.tangent=e.attributes.tangent.array,this.uv=e.attributes.uv.array,this.indices=e.index.array}}class Er{geometry;boundingSphere=new be;TextureId=new Uint32Array([4294967295,4294967295,4294967295]);vertexOffset=0;primitiveOffset=0;vertexCount=0;primitiveCount=0;constructor(e){e.geometry.attributes.tangent===void 0&&e.geometry.computeTangents(),e.geometry.computeBoundingSphere(),this.boundingSphere=e.geometry.boundingSphere,this.vertexCount=e.geometry.attributes.position.count,this.primitiveCount=e.geometry.index.count/3,this.geometry=new nh(e.geometry)}}class Ze{textureMap=new Map;Storages=[];texture;Resolution=4;static rszCtx;add(e){let t=4294967295;return e&&(this.textureMap.has(e.name)?t=this.textureMap.get(e.name):(this.Resolution=Math.max(e.source.data.height,this.Resolution),t=this.textureMap.size,this.textureMap.set(e.name,this.Storages.length),this.Storages.push(e))),t}async submit(e,t="rgba8unorm"){if(this.Resolution=Math.pow(2,Math.ceil(Math.log2(this.Resolution))),!Ze.rszCtx){let n=document.createElement("canvas");n.width=this.Resolution,n.height=this.Resolution,Ze.rszCtx=n.getContext("2d")}for(let n of this.Storages)n.source.data.width===this.Resolution&&n.source.data.height===this.Resolution||(Ze.rszCtx.drawImage(n.source.data,0,0,this.Resolution,this.Resolution),n.source.data=await createImageBitmap(Ze.rszCtx.getImageData(0,0,this.Resolution,this.Resolution)));let r=GPUTextureUsage.COPY_DST|GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.RENDER_ATTACHMENT;this.texture=e.device.createTexture({label:"Textures",format:t,usage:r,mipLevelCount:$l([this.Resolution,this.Resolution]),size:{width:this.Resolution,height:this.Resolution,depthOrArrayLayers:Math.max(this.textureMap.size,1)}});for(let n of this.Storages)e.device.queue.copyExternalImageToTexture({source:n.source.data},{texture:this.texture,origin:{x:0,y:0,z:this.textureMap.get(n.name)}},{width:n.source.data.width,height:n.source.data.height,depthOrArrayLayers:1});eh(e.device,this.texture)}}class ih{meshes=[];albedo=new Ze;normalMap=new Ze;specularRoughnessMap=new Ze;vertexArray;indexArray;bvhMaxDepth=0;bvhBuffer;vertexBuffer;indexBuffer;geometryBuffer;rasterVtxBuffer;vertexSum=0;triangleSum=0;async init(e,t){await this.loadModel(e),this.prepareRasterVtxBuffer(t),this.prepareVtxIdxArray();let r=this.prepareBVH(t);return this.albedo.submit(t,"rgba8unorm-srgb"),this.normalMap.submit(t),this.specularRoughnessMap.submit(t),this.allocateBuffer(t),this.writeBuffer(),new Promise(async(n,i)=>{await r,n()})}async loadModel(e){const n=(await new ul().setDRACOLoader(new hl().setDecoderPath("./three/draco/")).loadAsync(e,i=>{i.loaded/i.total-1<.001?Xt("textures downloading..."):Xt("model downloading: "+(i.loaded/i.total*100).toPrecision(3)+"%"),console.log("loading: "+i.loaded/i.total*100+"%")})).scene;n.traverse(i=>{if(i instanceof Br){for(let s=i.children.length-1;s>=0;s--)if(i.children[s]instanceof Be){let o=i.children[s];o.material,o.geometry.scale(i.scale.x,i.scale.y,i.scale.z)}}}),n.traverse(i=>{if(i instanceof Be){let s=new Er(i);s.vertexOffset=this.vertexSum,s.primitiveOffset=this.triangleSum,this.vertexSum+=s.vertexCount,this.triangleSum+=s.primitiveCount,s.TextureId[0]=this.albedo.add(i.material.map),s.TextureId[1]=this.normalMap.add(i.material.normalMap),s.TextureId[2]=this.specularRoughnessMap.add(i.material.metalnessMap),this.meshes.push(s)}})}loadTriangle(){let e=new Float32Array([-.5,-.5,0,0,.5,0,.5,-.5,0]),t=new Float32Array([0,0,1,0,0,1,0,0,1]),r=new Float32Array([0,0,.5,1,1,0]),n=new Uint32Array([0,1,2]),i=new ve;i.setAttribute("position",new N(e,3)),i.setAttribute("normal",new N(t,3)),i.setAttribute("uv",new N(r,2)),i.setIndex(new N(n,1));let s=new Be(i),o=new Er(s);o.primitiveOffset=this.triangleSum,o.vertexOffset=this.vertexSum,this.vertexSum+=3,this.triangleSum+=1,this.meshes.push(o),e=new Float32Array([-.5,-.5,-1,0,.5,-1,.5,-.5,-1]),t=new Float32Array([0,0,1,0,0,1,0,0,1]),r=new Float32Array([0,0,.5,1,1,0]),n=new Uint32Array([0,1,2]),i=new ve,i.setAttribute("position",new N(e,3)),i.setAttribute("normal",new N(t,3)),i.setAttribute("uv",new N(r,2)),i.setIndex(new N(n,1)),s=new Be(i),o=new Er(s),o.primitiveOffset=this.triangleSum,o.vertexOffset=this.vertexSum,this.vertexSum+=3,this.triangleSum+=1,this.meshes.push(o),e=new Float32Array([-.5,-.5,1,.5,-.5,1,0,.5,1]),t=new Float32Array([0,0,-1,0,0,-1,0,0,-1]),r=new Float32Array([0,0,.5,1,1,0]),n=new Uint32Array([0,1,2]),i=new ve,i.setAttribute("position",new N(e,3)),i.setAttribute("normal",new N(t,3)),i.setAttribute("uv",new N(r,2)),i.setIndex(new N(n,1)),s=new Be(i),o=new Er(s),o.primitiveOffset=this.triangleSum,o.vertexOffset=this.vertexSum,this.vertexSum+=3,this.triangleSum+=1,this.meshes.push(o)}prepareRasterVtxBuffer(e){this.rasterVtxBuffer=e.device.createBuffer({label:"rasterVtxBuffer",size:this.triangleSum*3*Float32Array.BYTES_PER_ELEMENT*3,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.VERTEX,mappedAtCreation:!0});const t=this.rasterVtxBuffer.getMappedRange(),r=new Float32Array(t);for(let n=0;n<this.meshes.length;n++){let i=this.meshes[n];for(let s=0;s<i.primitiveCount;s++)for(let o=0;o<3;o++){const a=(s+i.primitiveOffset)*9+o*3,l=i.geometry.indices[s*3+o];r.set(i.geometry.position.slice(l*3,l*3+3),a)}}this.rasterVtxBuffer.unmap()}prepareVtxIdxArray(){this.vertexArray=new Float32Array(this.vertexSum*4).fill(1),this.indexArray=new Uint32Array(this.triangleSum*3).fill(0);for(let e=0;e<this.meshes.length;e++){let t=this.meshes[e];for(let r=0;r<t.vertexCount;r++){const n=(r+t.vertexOffset)*4;this.vertexArray.set(t.geometry.position.slice(r*3,r*3+3),n)}for(let r=0;r<t.primitiveCount;r++){const n=(r+t.primitiveOffset)*3,i=new Uint32Array([t.geometry.indices[r*3]+t.vertexOffset,t.geometry.indices[r*3+1]+t.vertexOffset,t.geometry.indices[r*3+2]+t.vertexOffset]);this.indexArray.set(i,n)}t.geometry.position=null,t.geometry.indices=null}}async prepareBVH(e){return new Promise(async(t,r)=>{let n=new rh;n.onmessage=async i=>{if(typeof i.data=="string"){Xt(i.data);return}if(typeof i.data=="number"){this.bvhMaxDepth=i.data;return}Xt("bvh building finished"),this.bvhBuffer=e.device.createBuffer({label:"bvhBuffer",size:i.data.byteLength,usage:GPUBufferUsage.STORAGE,mappedAtCreation:!0});let s=new Uint8Array(this.bvhBuffer.getMappedRange()),o=new Uint8Array(i.data);s.set(o),this.bvhBuffer.unmap(),n.terminate(),t()},n.postMessage({vertexArray:this.vertexArray,indexArray:this.indexArray})})}allocateBuffer(e){this.vertexBuffer=e.device.createBuffer({label:"vertexBuffer",size:this.vertexArray.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.VERTEX,mappedAtCreation:!0}),this.indexBuffer=e.device.createBuffer({label:"indexBuffer",size:this.indexArray.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.INDEX,mappedAtCreation:!0}),this.geometryBuffer=e.device.createBuffer({label:"geometryBuffer",size:this.vertexSum*16*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.VERTEX,mappedAtCreation:!0})}writeBuffer(){new Float32Array(this.vertexBuffer.getMappedRange()).set(this.vertexArray),this.vertexBuffer.unmap(),this.vertexArray=null,new Uint32Array(this.indexBuffer.getMappedRange()).set(this.indexArray),this.indexBuffer.unmap(),this.indexArray=null;{const e=this.geometryBuffer.getMappedRange(),t=new Float32Array(e),r=new Uint32Array(e);for(let n=0;n<this.meshes.length;n++){let i=this.meshes[n];for(let s=0;s<i.vertexCount;s++){let o=(s+i.vertexOffset)*16;r.set(i.TextureId,o),r.set([32896],o+7),t.set(i.geometry.normal.slice(s*3,s*3+3),o+4),t.set(i.geometry.tangent.slice(s*4,s*4+4),o+8),t.set(i.geometry.uv.slice(s*2,s*2+2),o+12)}i.geometry.normal=null,i.geometry.uv=null,i.geometry.tangent=null,i.geometry=null}this.geometryBuffer.unmap()}console.log("writing finished")}}class sh{planes;constructor(e=new se,t=new se,r=new se,n=new se,i=new se,s=new se){this.planes=[e,t,r,n,i,s]}setFromProjectionMatrix(e){const t=this.planes,r=e.elements,n=r[0],i=r[1],s=r[2],o=r[3],a=r[4],l=r[5],h=r[6],c=r[7],d=r[8],f=r[9],p=r[10],y=r[11],b=r[12],v=r[13],_=r[14],A=r[15];return t[0].setComponents(o-n,c-a,y-d,A-b).normalize(),t[1].setComponents(o+n,c+a,y+d,A+b).normalize(),t[2].setComponents(o+i,c+l,y+f,A+v).normalize(),t[3].setComponents(o-i,c-l,y-f,A-v).normalize(),t[4].setComponents(o-s,c-h,y-p,A-_).normalize(),t[5].setComponents(s,h,p,_).normalize(),this}intersectsSphere(e){const t=this.planes,r=e.center,n=-e.radius;for(let i=0;i<6;i++)if(t[i].distanceToPoint(r)<n)return!1;return!0}}class oh{camera;controls;Frustum;cameraSize=4*4*4*Float32Array.BYTES_PER_ELEMENT;cameraBuffer;device;constructor(e){this.device=e,this.camera=new Fr(60,this.device.canvas.width/this.device.canvas.height,.01,50),this.controls=new ll(this.camera,this.device.canvas),this.controls.target.set(0,5,0),this.camera.position.set(-4.5,5,0),this.controls.update(),this.Frustum=new sh,this.cameraBuffer=this.device.device.createBuffer({label:"current view matrix and projection inverse",size:this.cameraSize,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})}lastVp=new k;vp=new k;viewMatrix=new k;projectionMatrix=new k;uboArray=new Float32Array(16*4);update(){this.lastVp.copy(this.camera.projectionMatrix).multiply(this.camera.matrixWorldInverse),this.controls.update(),this.vp.copy(this.camera.projectionMatrix).multiply(this.camera.matrixWorldInverse),this.viewMatrix.copy(this.camera.matrixWorld),this.projectionMatrix.copy(this.camera.projectionMatrixInverse),this.Frustum.setFromProjectionMatrix(this.vp),this.uboArray.set(this.viewMatrix.elements,0),this.uboArray.set(this.projectionMatrix.elements,16),this.uboArray.set(this.vp.elements,32),this.uboArray.set(this.lastVp.elements,48),this.device.device.queue.writeBuffer(this.cameraBuffer,0,this.uboArray)}checkFrustum(e){return e?this.Frustum.intersectsSphere(e):!0}}class ah{device;model;camera;vBuffer;depthTexture;sampler;bindGroupLayout;bindingGroup;pipeline;renderBundle;constructor(e,t,r,n){this.device=e,this.model=t,this.camera=r,this.vBuffer=n.vBuffer,this.depthTexture=n.depthTexture,this.sampler=this.device.device.createSampler({addressModeU:"mirror-repeat",addressModeV:"mirror-repeat",magFilter:"linear",minFilter:"linear",mipmapFilter:"linear",maxAnisotropy:16})}buildBindGroupLayout(){this.bindGroupLayout=this.device.device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float",viewDimension:"2d-array"}},{binding:2,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"filtering"}}]})}buildBindingGroup(){this.bindingGroup=this.device.device.createBindGroup({layout:this.bindGroupLayout,entries:[{binding:0,resource:{buffer:this.camera.cameraBuffer}},{binding:1,resource:this.model.albedo.texture.createView({dimension:"2d-array",baseArrayLayer:0,arrayLayerCount:Math.max(this.model.albedo.Storages.length,1)})},{binding:2,resource:this.sampler}]})}buildPipeline(){const e=this.device.device.createShaderModule({label:"vBuffer",code:Yt.get("vBuffer.wgsl")});this.pipeline=this.device.device.createRenderPipeline({label:"vBuffer",layout:this.device.device.createPipelineLayout({bindGroupLayouts:[this.bindGroupLayout]}),vertex:{module:e,entryPoint:"vs",buffers:[{arrayStride:3*4,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:e,entryPoint:"fs",targets:[{format:this.vBuffer.format}],constants:{width:Math.floor(this.device.canvas.width/this.device.upscaleRatio),height:Math.floor(this.device.canvas.height/this.device.upscaleRatio)}},primitive:{topology:"triangle-list",cullMode:"none",unclippedDepth:!1},depthStencil:{format:"depth32float",depthWriteEnabled:!0,depthCompare:"less"}})}async init(){this.buildBindGroupLayout(),this.buildBindingGroup(),this.buildPipeline()}record(e){const t=e.beginRenderPass({colorAttachments:[{view:this.vBuffer.createView(),clearValue:{r:0,g:0,b:0,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:this.depthTexture.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});t.setPipeline(this.pipeline),t.setBindGroup(0,this.bindingGroup),t.setVertexBuffer(0,this.model.rasterVtxBuffer);for(let r=0;r<this.model.meshes.length;r++){const n=this.model.meshes[r];this.camera.checkFrustum(n.boundingSphere)&&t.draw(n.primitiveCount*3,1,n.primitiveOffset*3)}t.end()}}class lh{device;model;camera;lightCount=1;spatialReuseIteration=2;GI_FLAG=1;vBuffer;gBufferTex;gBufferAttri;previousGBufferAttri;outputTexture;uniformBuffer;lightBuffer;sampler;currentReservoir;previousReservoir;bindGroupLayoutInit;bindingGroupInit;bindGroupLayoutReuse;bindingGroupReuse;bindGroupLayoutAccumulate;bindingGroupAccumulate;bindGroupLayoutAccelerationStructure;bindingGroupAccelerationStructure;bindGroupLayoutReservoir;bindingGroupReservoir;bindingGroupReservoirInverse;bindGroupLayoutLight;bindingGroupLight;pipelineInit;pipelineReuse;pipelineAccumulate;constructor(e,t,r,n){this.device=e,this.model=t,this.camera=r,this.vBuffer=n.vBuffer,this.gBufferTex=n.gBufferTex,this.gBufferAttri=n.gBufferAttri,this.previousGBufferAttri=n.previousGBufferAttri,this.outputTexture=n.currentFrameBuffer,this.sampler=this.device.device.createSampler({addressModeU:"mirror-repeat",addressModeV:"mirror-repeat",magFilter:"linear",minFilter:"linear",mipmapFilter:"linear"}),this.uniformBuffer=this.device.device.createBuffer({size:4*4,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.currentReservoir=n.currentReservoir,this.previousReservoir=n.previousReservoir}lightPosition=Array(this.lightCount);lightVelocity=Array(this.lightCount);prepareLights(){let e=this.lightCount;class t{position;color;intensity;prob;alias;constructor(h,c,d,f){this.position=h,this.color=c,this.intensity=d,this.prob=1,this.alias=f}}let r=Array(e);r[0]=new t(new Float32Array([0,5,0]),new Float32Array([.7,.9,1]),80,0),this.lightBuffer=this.device.device.createBuffer({label:"light buffer",size:4*(4+e*8),usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST,mappedAtCreation:!0});function n(l){let h=0;l.forEach(p=>{h+=p.intensity});let c=h/l.length,d=Array(),f=Array();for(l.forEach(p=>{p.prob=p.intensity/c,p.prob<1?d.push(p):f.push(p)});d.length>0&&f.length>0;){let p=d.pop(),y=f.pop();p.alias=y.alias,y.prob+=p.prob-1,y.prob<1?d.push(y):f.push(y)}for(;f.length>0;){let p=f.pop();p.prob=1}for(;d.length>0;){let p=d.pop();p.prob=1}return h}let i=n(r),s=this.lightBuffer.getMappedRange(),o=new Uint32Array(s),a=new Float32Array(s);o[0]=r.length,a[1]=i;for(let l=0;l<r.length;l++){let h=4+8*l;a.set(r[l].position,h),this.lightPosition[l]=r[l].position;let c=Math.round(r[l].color[0]*255)<<0|Math.round(r[l].color[1]*255)<<8|Math.round(r[l].color[2]*255)<<16;o[h+3]=c,a[h+4]=r[l].prob,o[h+5]=r[l].alias,a[h+6]=r[l].intensity}this.lightBuffer.unmap();for(let l=0;l<r.length;l++){let h=2*Math.PI*Math.random(),c=Math.acos(2*Math.random()-1),d=[Math.sin(c)*Math.cos(h),Math.sin(c)*Math.sin(h),Math.cos(c)],f=Math.random()+1;for(let p=0;p<3;p++)d[p]*=f;this.lightVelocity[l]=d}this.lightVelocity[0]=[2,0,0]}buildBindGroupLayout(){this.bindGroupLayoutInit=this.device.device.createBindGroupLayout({label:"rayTracingInit",entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,storageTexture:{access:"write-only",format:this.outputTexture.format}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage"}},{binding:3,visibility:GPUShaderStage.COMPUTE,texture:{sampleType:"float",viewDimension:"2d-array"}},{binding:4,visibility:GPUShaderStage.COMPUTE,texture:{sampleType:"float",viewDimension:"2d-array"}},{binding:5,visibility:GPUShaderStage.COMPUTE,texture:{sampleType:"float",viewDimension:"2d-array"}},{binding:6,visibility:GPUShaderStage.COMPUTE,texture:{sampleType:"uint"}},{binding:7,visibility:GPUShaderStage.COMPUTE,sampler:{type:"filtering"}},{binding:8,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}},{binding:9,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:10,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:11,visibility:GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage"}}]}),this.bindGroupLayoutAccelerationStructure=this.device.device.createBindGroupLayout({label:"rayTracingAccelerationStructure",entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage"}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage"}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage"}}]}),this.bindGroupLayoutReservoir=this.device.device.createBindGroupLayout({label:"rayTracingReservoir",entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage"}}]}),this.bindGroupLayoutLight=this.device.device.createBindGroupLayout({label:"rayTracingLight",entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}}]}),this.bindGroupLayoutReuse=this.device.device.createBindGroupLayout({label:"rayTracingSpatialReuse",entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,storageTexture:{access:"write-only",format:this.outputTexture.format}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage"}},{binding:3,visibility:GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage"}}]}),this.bindGroupLayoutAccumulate=this.device.device.createBindGroupLayout({label:"rayTracingAccumulate",entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,storageTexture:{access:"write-only",format:this.outputTexture.format}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage"}},{binding:3,visibility:GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage"}}]})}async buildPipeline(){const e=this.device.device.createShaderModule({label:"rayGen.wgsl",code:Yt.get("rayGen.wgsl").replace(/TREE_DEPTH/g,this.model.bvhMaxDepth.toString()).replace(/LIGHT_COUNT/g,this.lightCount.toString())}),t=this.device.device.createShaderModule({label:"spatialReuse.wgsl",code:Yt.get("spatialReuse.wgsl").replace(/LIGHT_COUNT/g,this.lightCount.toString())}),r=this.device.device.createShaderModule({label:"accumulate.wgsl",code:Yt.get("accumulate.wgsl").replace(/TREE_DEPTH/g,this.model.bvhMaxDepth.toString()).replace(/LIGHT_COUNT/g,this.lightCount.toString())});this.pipelineInit=await this.device.device.createComputePipelineAsync({layout:this.device.device.createPipelineLayout({bindGroupLayouts:[this.bindGroupLayoutInit,this.bindGroupLayoutReservoir,this.bindGroupLayoutLight,this.bindGroupLayoutAccelerationStructure]}),compute:{module:e,entryPoint:"main",constants:{halfConeAngle:this.camera.camera.fov*Math.PI/180/(this.device.canvas.height/this.device.upscaleRatio*2)}}}),this.pipelineReuse=await this.device.device.createComputePipelineAsync({layout:this.device.device.createPipelineLayout({bindGroupLayouts:[this.bindGroupLayoutReuse,this.bindGroupLayoutReservoir,this.bindGroupLayoutLight]}),compute:{module:t,entryPoint:"main",constants:{ENABLE_GI:this.GI_FLAG}}}),this.pipelineAccumulate=await this.device.device.createComputePipelineAsync({layout:this.device.device.createPipelineLayout({bindGroupLayouts:[this.bindGroupLayoutAccumulate,this.bindGroupLayoutReservoir,this.bindGroupLayoutLight,this.bindGroupLayoutAccelerationStructure]}),compute:{module:r,entryPoint:"main",constants:{ENABLE_GI:this.GI_FLAG}}})}buildBindGroup(){this.bindingGroupInit=this.device.device.createBindGroup({label:"rayTracingInit",layout:this.bindGroupLayoutInit,entries:[{binding:0,resource:this.outputTexture.createView()},{binding:1,resource:{buffer:this.camera.cameraBuffer}},{binding:2,resource:{buffer:this.model.geometryBuffer}},{binding:3,resource:this.model.albedo.texture.createView({dimension:"2d-array",baseArrayLayer:0,arrayLayerCount:Math.max(this.model.albedo.Storages.length,1)})},{binding:4,resource:this.model.normalMap.texture.createView({dimension:"2d-array",baseArrayLayer:0,arrayLayerCount:Math.max(this.model.normalMap.Storages.length,1)})},{binding:5,resource:this.model.specularRoughnessMap.texture.createView({dimension:"2d-array",baseArrayLayer:0,arrayLayerCount:Math.max(this.model.specularRoughnessMap.Storages.length,1)})},{binding:6,resource:this.vBuffer.createView()},{binding:7,resource:this.sampler},{binding:8,resource:{buffer:this.uniformBuffer}},{binding:9,resource:{buffer:this.gBufferTex}},{binding:10,resource:{buffer:this.gBufferAttri}},{binding:11,resource:{buffer:this.previousGBufferAttri}}]}),this.bindingGroupAccelerationStructure=this.device.device.createBindGroup({label:"rayTracingAccelerationStructure",layout:this.bindGroupLayoutAccelerationStructure,entries:[{binding:0,resource:{buffer:this.model.bvhBuffer}},{binding:1,resource:{buffer:this.model.vertexBuffer}},{binding:2,resource:{buffer:this.model.indexBuffer}}]}),this.bindingGroupReservoir=this.device.device.createBindGroup({label:"rayTracingReservoir",layout:this.bindGroupLayoutReservoir,entries:[{binding:0,resource:{buffer:this.currentReservoir}},{binding:1,resource:{buffer:this.previousReservoir}}]}),this.bindingGroupLight=this.device.device.createBindGroup({label:"rayTracingLight",layout:this.bindGroupLayoutLight,entries:[{binding:0,resource:{buffer:this.lightBuffer}}]}),this.bindingGroupReuse=this.device.device.createBindGroup({label:"rayTracingSpatialReuse",layout:this.bindGroupLayoutReuse,entries:[{binding:0,resource:this.outputTexture.createView()},{binding:1,resource:{buffer:this.uniformBuffer}},{binding:2,resource:{buffer:this.gBufferTex}},{binding:3,resource:{buffer:this.gBufferAttri}}]}),this.bindingGroupReservoirInverse=this.device.device.createBindGroup({label:"rayTracingReservoirInverse",layout:this.bindGroupLayoutReservoir,entries:[{binding:0,resource:{buffer:this.previousReservoir}},{binding:1,resource:{buffer:this.currentReservoir}}]}),this.bindingGroupAccumulate=this.device.device.createBindGroup({label:"rayTracingAccumulate",layout:this.bindGroupLayoutAccumulate,entries:[{binding:0,resource:this.outputTexture.createView()},{binding:1,resource:{buffer:this.uniformBuffer}},{binding:2,resource:{buffer:this.gBufferTex}},{binding:3,resource:{buffer:this.gBufferAttri}}]})}async init(){this.prepareLights(),this.buildBindGroupLayout(),await this.buildPipeline(),this.buildBindGroup()}uboBuffer=new ArrayBuffer(4*4);updateUBO(){let e=new Uint32Array(this.uboBuffer),t=new Float32Array(this.uboBuffer);e[3]=Math.floor(Math.random()*4294967296),t.set(this.camera.camera.position.toArray(),0),this.device.device.queue.writeBuffer(this.uniformBuffer,0,this.uboBuffer);const r=[-5,1,-1],n=[5,8,1];for(let i=0;i<this.lightCount;i++){for(let s=0;s<3;s++)(this.lightPosition[i][s]<r[s]||this.lightPosition[i][s]>n[s])&&(this.lightVelocity[i][s]=-this.lightVelocity[i][s]),this.lightPosition[i][s]+=this.lightVelocity[i][s]*.03;this.device.device.queue.writeBuffer(this.lightBuffer,4*(4+8*i),this.lightPosition[i])}}async record(e){this.updateUBO();const t=e.beginComputePass();t.setPipeline(this.pipelineInit),t.setBindGroup(0,this.bindingGroupInit),t.setBindGroup(1,this.bindingGroupReservoir),t.setBindGroup(2,this.bindingGroupLight),t.setBindGroup(3,this.bindingGroupAccelerationStructure),t.dispatchWorkgroups(Math.ceil(this.outputTexture.width/8),Math.ceil(this.outputTexture.height/8),1),t.end();for(let n=0;n<this.spatialReuseIteration;n++){const i=e.beginComputePass();i.setPipeline(this.pipelineReuse),i.setBindGroup(0,this.bindingGroupReuse),i.setBindGroup(1,n%2==0?this.bindingGroupReservoirInverse:this.bindingGroupReservoir),i.setBindGroup(2,this.bindingGroupLight),i.dispatchWorkgroups(Math.ceil(this.outputTexture.width/8),Math.ceil(this.outputTexture.height/8),1),i.end()}const r=e.beginComputePass();if(r.setPipeline(this.pipelineAccumulate),r.setBindGroup(0,this.bindingGroupAccumulate),r.setBindGroup(1,this.spatialReuseIteration%2==0?this.bindingGroupReservoirInverse:this.bindingGroupReservoir),r.setBindGroup(2,this.bindingGroupLight),r.setBindGroup(3,this.bindingGroupAccelerationStructure),r.dispatchWorkgroups(Math.ceil(this.outputTexture.width/8),Math.ceil(this.outputTexture.height/8),1),r.end(),this.spatialReuseIteration%2==0){let n=Math.floor(this.device.canvas.width/this.device.upscaleRatio),i=Math.floor(this.device.canvas.height/this.device.upscaleRatio);e.copyBufferToBuffer(this.currentReservoir,0,this.previousReservoir,0,16*4*n*i)}}}class hh{currentFrameBuffer;previousFrameBuffer;previousDisplayBuffer;depthTexture;vBuffer;gBufferTex;gBufferAttri;previousGBufferAttri;currentReservoir;previousReservoir;constructor(e){let t=Math.floor(e.canvas.width/e.upscaleRatio),r=Math.floor(e.canvas.height/e.upscaleRatio);this.currentFrameBuffer=e.device.createTexture({size:{width:t,height:r},format:"rgba16float",dimension:"2d",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_SRC}),this.previousFrameBuffer=e.device.createTexture({size:{width:t,height:r},format:"rgba16float",dimension:"2d",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST}),this.previousDisplayBuffer=e.device.createTexture({size:{width:e.canvas.width,height:e.canvas.height},format:e.format,dimension:"2d",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST}),this.depthTexture=e.device.createTexture({size:{width:t,height:r},format:"depth32float",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING}),this.vBuffer=e.device.createTexture({size:{width:t,height:r},format:"rgba32uint",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING}),this.gBufferTex=e.device.createBuffer({size:2*4*t*r,usage:GPUBufferUsage.STORAGE}),this.gBufferAttri=e.device.createBuffer({size:4*4*t*r,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC}),this.previousGBufferAttri=e.device.createBuffer({size:4*4*t*r,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.currentReservoir=e.device.createBuffer({size:16*(4*t*r),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC}),this.previousReservoir=e.device.createBuffer({size:16*(4*t*r),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST})}update(e,t){let r=Math.floor(t.canvas.width/t.upscaleRatio),n=Math.floor(t.canvas.height/t.upscaleRatio);e.copyBufferToBuffer(this.gBufferAttri,0,this.previousGBufferAttri,0,4*4*r*n),e.copyTextureToTexture({texture:this.currentFrameBuffer},{texture:this.previousFrameBuffer},{width:r,height:n}),e.copyTextureToTexture({texture:t.context.getCurrentTexture()},{texture:this.previousDisplayBuffer},{width:t.canvas.width,height:t.canvas.height})}}class ch{device;buffers;model;camera;vBuffer;rayTracing;display;async init(){this.device=new $s,await this.device.init(await document.querySelector("canvas")),this.buffers=new hh(this.device),this.camera=new oh(this.device),this.model=new ih,await this.model.init("./assets/sponza/sponza.gltf",this.device),this.vBuffer=new ah(this.device,this.model,this.camera,this.buffers),await this.vBuffer.init(),this.rayTracing=new lh(this.device,this.model,this.camera,this.buffers),await this.rayTracing.init(),this.display=new xo(this.device,this.buffers,this.camera),console.log("my model:",this.model)}buildCmdBuffer(){this.camera.update();const e=this.device.device.createCommandEncoder();this.vBuffer.record(e),this.rayTracing.record(e),this.display.record(e),this.buffers.update(e,this.device);let t=e.finish();this.device.device.queue.submit([t])}timeStamp=Date.now();run(){class e{total=0;cursor=0;numSamples=50;samples=new Array(this.numSamples).fill(0);addSample(i){i=Math.min(1e3,i),this.total+=i-this.samples[this.cursor],this.samples[this.cursor]=i,this.cursor=(this.cursor+1)%this.numSamples}print(){this.cursor==0&&Xt("fps: "+(this.total/this.numSamples).toPrecision(3))}}let t=new e;const r=()=>{requestAnimationFrame(r),this.buildCmdBuffer();const n=performance.now(),i=n-this.timeStamp;this.timeStamp=n,t.addSample(1e3/i),t.print()};requestAnimationFrame(r)}}const Bs=new ch;await Bs.init();Bs.run();
