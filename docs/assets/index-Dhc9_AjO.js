(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))r(n);new MutationObserver(n=>{for(const i of n)if(i.type==="childList")for(const s of i.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&r(s)}).observe(document,{childList:!0,subtree:!0});function t(n){const i={};return n.integrity&&(i.integrity=n.integrity),n.referrerPolicy&&(i.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?i.credentials="include":n.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function r(n){if(n.ep)return;n.ep=!0;const i=t(n);fetch(n.href,i)}})();class uo{canvas;adapter;device;context;format;upscaleRatio=2;async init(){let e={width:document.documentElement.clientWidth,height:document.documentElement.clientHeight};this.canvas=document.createElement("canvas");const t=window.devicePixelRatio||1,r={width:1920,height:1080},n={width:1280,height:720};let i=!1;if(e.width<e.height&&(i=!0),i&&(e={width:e.height,height:e.width}),e.width*=t,e.height*=t,e.width>r.width||e.height>r.height?(e=r,console.log("1080p")):(e=n,console.log("720p")),i?(this.canvas.width=e.height,this.canvas.height=e.width,this.canvas.style.width=`${e.height/t}px`,this.canvas.style.height=`${e.width/t}px`):(this.canvas.width=e.width,this.canvas.height=e.height,this.canvas.style.width=`${e.width/t}px`,this.canvas.style.height=`${e.height/t}px`),this.canvas.style.alignSelf="center",document.body.appendChild(this.canvas),!navigator.gpu)throw alert("WebGPU may not supported in your browser"),new Error("Not Support WebGPU");let s=await navigator.gpu.requestAdapter({powerPreference:"high-performance"});if(!s)throw alert("No Adapter Found"),new Error("No Adapter Found");this.adapter=s;const o=this.adapter.features.has("bgra8unorm-storage");let a=await this.adapter.requestDevice({requiredLimits:{maxBufferSize:this.adapter.limits.maxBufferSize,maxStorageBufferBindingSize:this.adapter.limits.maxStorageBufferBindingSize,maxStorageBuffersPerShaderStage:this.adapter.limits.maxStorageBuffersPerShaderStage},requiredFeatures:o?["bgra8unorm-storage"]:[]});if(!a)throw alert("No Device Found"),new Error("No Device Found");this.device=a;let l=this.canvas.getContext("webgpu");if(!l)throw alert("No GPUContext Found"),new Error("No GPUContext Found");return this.context=l,this.format=o?navigator.gpu.getPreferredCanvasFormat():"rgba8unorm",t>=3&&(this.upscaleRatio=3),this.context.configure({device:this.device,format:this.format,alphaMode:"opaque",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.COPY_SRC}),this}}const fo=`@binding(0) @group(0) var<storage, read> mvpMatrix : array<mat4x4<f32>>;\r
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
`,po=`@fragment\r
fn main(\r
    @location(0) fragUV: vec2<f32>,\r
    @location(1) fragPosition: vec4<f32>\r
) -> @location(0) vec4<f32> {\r
    return fragPosition;\r
}`,mo=`@group(0) @binding(0) var<storage, read> input : array<f32, 7>;\r
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
`,yo=`// Lambert Azimuthal Equal-Area projection\r
// fn normalEncode(normal: vec3f) -> u32 {\r
//     let f = sqrt(2. * normal.z + 2.);\r
//     let XY = normal.xy / f;\r
//     return pack2x16snorm(XY);\r
// }\r
\r
// fn normalDecode(encoded: u32) -> vec3f {\r
//     let fenc = unpack2x16snorm(encoded) * 2;\r
//     let f = dot(fenc, fenc);\r
//     let g = sqrt(1 - f / 4);\r
//     return vec3f(fenc * g, 1 - f / 2);\r
// }\r
\r
// Cry Engine 3 Normal Encoding\r
fn normalEncode(normal: vec3f) -> u32 {\r
    return pack2x16float(select(normalize(normal.xy), vec2f(1, 1), dot(normal.xy, normal.xy) == 0.0) * sqrt(normal.z * 0.5 + 0.5));\r
}\r
\r
fn normalDecode(encoded: u32) -> vec3f {\r
    let g = unpack2x16float(encoded);\r
    let g2 = dot(g, g);\r
    var ret = vec3f(0, 0, g2 * 2 - 1);\r
    ret = vec3f(select(normalize(g) * sqrt(1 - ret.z * ret.z), vec2f(0), g2 == 0.0 || g2 > 1), ret.z);\r
    return normalize(ret);\r
}\r
\r
// Stereographic Projection\r
// fn normalEncode(normal: vec3f) -> u32 {\r
//     let XY = normal.xy / (1.0 - normal.z);\r
//     return pack2x16float(XY);\r
// }\r
// fn normalDecode(encoded: u32) -> vec3f {\r
//     let XY = unpack2x16float(encoded);\r
//     let denom = 1.0 + dot(XY, XY);\r
//     return vec3f(2.0 * XY, denom - 2) / denom;\r
// }\r
\r
// Octahedron-normal vectors\r
// fn normalEncode(normal: vec3f) -> u32 {\r
//     var p = normal / dot(vec3f(1.), abs(normal));\r
//     if p.z < 0 {\r
//         p = vec3f((1 - abs(p.yx)) * select(-1., 1., all(p.xy >= vec2f(0))), p.z);\r
//     }\r
//     return pack2x16snorm(p.xy);\r
// }\r
\r
// fn normalDecode(encoded: u32) -> vec3f {\r
//     var p = unpack2x16snorm(encoded);\r
//     var n = vec3f(p, 1 - abs(p.x) - abs(p.y));\r
//     var t = max(-n.z, 0);\r
//     n = vec3f(n.xy + select(t, -t, all(n.xy >= vec2f(0))), n.z);\r
//     return normalize(n);\r
// }\r
\r
fn luminance(color: vec3f) -> f32 {\r
    return dot(color, vec3f(0.2126, 0.7152, 0.0722));\r
}\r
\r
struct PointAttri {\r
    pos: vec3f,\r
    normalShading: vec3f,\r
};\r
\r
fn loadGBufferAttri(gBufferAttri: ptr<storage,array<vec4f>,read_write>, idx: u32) -> PointAttri {\r
    let attri = (*gBufferAttri)[idx];\r
    var ret: PointAttri;\r
    ret.pos = attri.xyz;\r
    ret.normalShading = normalDecode(bitcast<u32>(attri.w));\r
    return ret;\r
}\r
\r
fn storeColor(buffer: ptr<storage,array<vec2u>,read_write>, idx: u32, color: vec3f) {\r
    (*buffer)[idx] = vec2u(pack2x16float(color.xy), pack2x16float(vec2f(color.z, 0)));\r
}\r
\r
fn loadColor(buffer: ptr<storage,array<vec2u>,read_write>, idx: u32) -> vec3f {\r
    let color = (*buffer)[idx];\r
    return vec3f(unpack2x16float(color.x), unpack2x16float(color.y).x);\r
}\r
\r
var<private> screen_size:vec2u;\r
\r
fn validateCoord(coord: vec2f) -> bool {\r
    return all(coord >= vec2f(0)) && all(coord < vec2f(screen_size));\r
}\r
\r
fn getCoord(coord: vec2f) -> u32 {\r
    return u32(coord.x) + u32(coord.y) * screen_size.x;\r
}\r
`,go=`struct Camera {\r
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
struct VBufferOut {\r
    @location(0) vBuffer: vec4u,\r
    @location(1) motionVec: u32,\r
};\r
\r
\r
@fragment\r
fn fs(\r
    stage: InterStage,\r
) -> VBufferOut {\r
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
    let screen_size = vec2f(f32(width), f32(height));\r
    let lastScreenPos = vec2f(stage.lastPos.x, - stage.lastPos.y) / stage.lastPos.w / 2.0 + 0.5;\r
    let currentScreenPos = stage.pos.xy / screen_size;\r
    let motionVec = currentScreenPos - lastScreenPos;\r
    var visibility = Visibility(\r
        stage.BaryCoord.yz,\r
        motionVec,\r
        stage.primId,\r
        // color,\r
    );\r
\r
    return VBufferOut(\r
        vec4u(bitcast<vec2u>(visibility.baryCoord), visibility.primId, 0),\r
        pack2x16float(visibility.motionVec)\r
    );\r
} \r
`,xo=`struct PackedLight {\r
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
`,bo=`struct PackedLight {\r
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
}`,vo=`const PI:f32=3.14159265359;\r
const INVPI:f32=0.31830988618;\r
// #include <utils.wgsl>;\r
\r
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
fn loadGBuffer(idx: u32, pointInfo: ptr<function,PointInfo>) {\r
    let tex = gBufferTex[idx];\r
    (*pointInfo).baseColor = vec3f(unpack2x16unorm(tex.x), unpack2x16unorm(tex.y).x);\r
    (*pointInfo).metallicRoughness = unpack4x8unorm(tex.y).zw;\r
    let attri = gBufferAttri[idx];\r
    (*pointInfo).pos = attri.xyz;\r
    (*pointInfo).normalShading = normalDecode(bitcast<u32>(attri.w));\r
}\r
\r
`,wo=`\r
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
    primaryHitInfo.motionVec = unpack2x16float(textureLoad(motionVec, screen_pos, 0).r);\r
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
    // let vtx = unpackPrimHitInfo(triangle.primId).pos;\r
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
    retInfo.normalShading = sampleTex(normalMap, uv, normalMapId, uvGradient, vec4f(0., 0., 1., 1.)).xyz * 2.-1.;\r
    retInfo.metallicRoughness = sampleTex(specularMap, uv, specularMapId, uvGradient, vec4f(0, 1, 0, 0)).zy;\r
    // retInfo.metallicRoughness = vec2f(0.9, 0.5);\r
    retInfo.baseColor = sampleTex(albedo, uv, albedoId, uvGradient, vec4f(0.8)).xyz;\r
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
    T = normalize(cross(B, iterpolatedNormal) * tangent.w);\r
    let tbn = mat3x3f(T, B, iterpolatedNormal);\r
    if all(tangent.xyz == vec3f(0.0)) {\r
        retInfo.normalShading = iterpolatedNormal;\r
    } else {\r
        retInfo.normalShading = normalize(tbn * retInfo.normalShading);\r
    }\r
    // retInfo.normalShading = iterpolatedNormal ;\r
    return retInfo;\r
}\r
\r
// simplify computing normal and sampling tex.\r
fn unpackTriangleIndirect(triangle: PrimaryHitInfo, origin: vec3f) -> PointInfo {\r
\r
    let offset = vec3u(indices[triangle.primId * 3], indices[triangle.primId * 3 + 1], indices[triangle.primId * 3 + 2]);\r
    let geo = array<GeometryInfo, 3>(geometries[offset.x], geometries[offset.y], geometries[offset.z]);\r
\r
    var retInfo: PointInfo = PointInfo();\r
    let albedoId = geo[0].id.x;\r
    let normalMapId = geo[0].id.y;\r
    let specularMapId = geo[0].id.z;\r
    let uv = triangle.baryCoord.x * geo[0].uv.xy + triangle.baryCoord.y * geo[1].uv.xy + triangle.baryCoord.z * geo[2].uv.xy;\r
    retInfo.metallicRoughness = sampleTexIndirect(specularMap, uv, specularMapId, vec4f(0, 1, 0, 0)).zy;\r
    // retInfo.metallicRoughness = vec2f(0.9, 0.5);\r
    retInfo.baseColor = sampleTexIndirect(albedo, uv, albedoId, vec4f(0.8)).xyz;\r
\r
    // let vtx = unpackPrimHitInfo(triangle.primId).pos;\r
    let vtx = array<vec4f, 3>(vertices[offset.x], vertices[offset.y], vertices[offset.z]);\r
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
`,Io=`struct ReservoirDI {\r
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
    // return thetar / thetaq;\r
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
@group(1) @binding(1) var<storage, read_write> previousReservoir: array<array<u32,16>>;\r
\r
fn loadReservoir(reservoir: ptr<storage,array<array<u32,16>>,read_write>, idx: u32, reservoirDI: ptr<function,ReservoirDI>, reservoirGI: ptr<function,ReservoirGI>, seed: ptr<function,u32>) {\r
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
`,_o=`@group(3) @binding(0) var<storage, read> bvh : BVH;\r
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
// fn unpackPrimHitInfo(primId: u32) -> PrimHitInfo {\r
//     const triStride = 9u;\r
//     const vtxStride = 3u;\r
//     var primHitInfo = PrimHitInfo(array<vec4f, 3 >(vec4<f32>(0.0), vec4<f32>(0.0), vec4<f32>(0.0)));\r
//     for (var i = 0u; i < 3u; i = i + 1u) {\r
//         primHitInfo.pos[i] = vec4<f32>(vertices[primId * triStride + i * vtxStride], vertices[primId * triStride + i * vtxStride + 1u], vertices[primId * triStride + i * vtxStride + 2u], 1.0);\r
//     }\r
//     return primHitInfo;\r
// }\r
fn unpackPrimHitInfo(primId: u32) -> PrimHitInfo {\r
    const triStride = 9;\r
    const vtxStride = 3;\r
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
}\r
`,Ao=`fn pow5(x: f32) -> f32 {\r
    let x1 = x;\r
    let x2 = x1 * x1;\r
    return x2 * x2 * x1;\r
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
    return Fm * Dm * Gm / (4.0 * max(1e-1, ndoti));\r
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
    return Fm * Dm * Gm / (4.0 * max(1e-1, ndoti));\r
}\r
\r
fn BSDF(shadingPoint: PointInfo, wo: vec3f, wi: vec3f) -> vec3f {\r
\r
    let ndoto = max(1e-5, dot(shadingPoint.normalShading, wo));\r
    let h = normalize(wi + wo);\r
    let ndoti = max(1e-5, dot(shadingPoint.normalShading, wi));\r
    let ndoth = max(1e-5, dot(shadingPoint.normalShading, h));\r
    let hdoto = dot(h, wo);\r
    let diffuse = Fdiffuse(shadingPoint.baseColor, shadingPoint.metallicRoughness.y, ndoti, ndoto, hdoto);\r
    let metallic = Fmetallic(shadingPoint.baseColor, shadingPoint.metallicRoughness.y, ndoth, h, hdoto, ndoti, ndoto);\r
    return (1.0 - shadingPoint.metallicRoughness.x) * diffuse + (shadingPoint.metallicRoughness.x) * metallic;\r
    // return shadingPoint.baseColor * INVPI * ndoto;\r
}\r
\r
fn BSDFLuminance(shadingPoint: PointInfo, wo: vec3f, wi: vec3f) -> f32 {\r
    let ndoto = max(0.0, dot(shadingPoint.normalShading, wo));\r
    return INVPI * ndoto;\r
    // return 1;\r
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
}`,So=`struct Camera {\r
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
@group(0) @binding(0) var<storage, read_write> frame: array<vec2u>;\r
@group(0) @binding(1) var<uniform> camera : Camera;\r
@group(0) @binding(2) var<storage, read_write> geometries : array<GeometryInfo>;\r
@group(0) @binding(3) var albedo: texture_2d_array<f32>;\r
@group(0) @binding(4) var normalMap: texture_2d_array<f32>;\r
@group(0) @binding(5) var specularMap: texture_2d_array<f32>;\r
@group(0) @binding(6) var vBuffer : texture_2d<u32>;\r
@group(0) @binding(7) var samp: sampler;\r
@group(0) @binding(8) var<uniform> ubo: UBO;\r
@group(0) @binding(9) var<storage, read_write> gBufferTex : array<vec2u>;\r
@group(0) @binding(10) var<storage, read_write> gBufferAttri : array<vec4f>;\r
@group(0) @binding(11) var<storage, read_write> previousGBufferAttri : array<vec4f>;\r
@group(0) @binding(12) var motionVec: texture_2d<u32>;\r
// #include <common.wgsl>;\r
// #include <trace.wgsl>;\r
// #include <sampleInit.wgsl>;\r
// #include <reservoir.wgsl>;\r
// #include <light.wgsl>;\r
// #include <BSDF.wgsl>;\r
\r
override halfConeAngle = 0.0;\r
override ENABLE_DI: bool = true;\r
override ENABLE_GI: bool = true;\r
override WIDTH: u32;\r
override HEIGHT: u32;\r
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
fn updateDIResforGI(reservoir: ptr<function,ReservoirDI>, lightId: u32, weight: f32, pHat: f32, select_pHat: ptr<function, f32>) {\r
    (*reservoir).M += 1;\r
    (*reservoir).w_sum += weight;\r
    if random() < weight / (*reservoir).w_sum {\r
        (*reservoir).lightId = lightId;\r
        (*select_pHat) = pHat;\r
    }\r
}\r
\r
@compute @workgroup_size(8, 8, 1)\r
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3u, @builtin(workgroup_id) WorkgroupID: vec3u) {\r
    screen_size = vec2u(WIDTH, HEIGHT);\r
    if any(GlobalInvocationID.xy >= screen_size) {\r
        return;\r
    }\r
    _ = ENABLE_GI;\r
    // var rayInfo: RayInfo = traceRay(origin, direction);\r
    var color = vec3f(0.0);\r
    var primaryTri = primaryHit(GlobalInvocationID.xy);\r
    let screen_pos = vec2f(GlobalInvocationID.xy) + 0.5;\r
    let launchIndex = getCoord(screen_pos);\r
    var reservoirCurDI = ReservoirDI();\r
    var reservoirCurGI = ReservoirGI();\r
    var reservoirPrevDI = ReservoirDI();\r
    var reservoirPrevGI = ReservoirGI();\r
    if primaryTri.primId == 0 && all(primaryTri.baryCoord.yz == vec2f(0)) {\r
        reservoirCurDI.W = -1.;\r
        reservoirCurGI.W = -1.;\r
        // storeColor(&frame, launchIndex, vec3f(0));\r
        storeGBuffer(launchIndex, vec3f(0), vec3f(0), vec3f(0.), vec2f(0.));\r
        storeReservoir(&currentReservoir, launchIndex, reservoirCurDI, reservoirCurGI, ubo.seed);\r
        return;\r
    }\r
    seed = tea(GlobalInvocationID.y * screen_size.x + GlobalInvocationID.x, ubo.seed, 4);\r
    let origin: vec3f = ubo.origin;\r
    // let screen_target: vec2f = vec2f(f32(GlobalInvocationID.x) + 0.5, f32(screen_size.y - GlobalInvocationID.y - 1u) + 0.5) / vec2f(screen_size);\r
    // let screen_target_ndc: vec2f = screen_target * 2.0 - 1.0;\r
    // let screen_target_world: vec4f = camera.projInv * vec4f(screen_target_ndc, 1.0, 1.0);\r
    var pointInfo = unpackTriangle(primaryTri, origin, halfConeAngle);\r
    let direction = normalize(pointInfo.pos - origin);\r
    let shadingPoint: vec3f = pointInfo.pos;\r
    var pointPrev: PointAttri;\r
\r
\r
    let globalPreId = screen_pos - primaryTri.motionVec * vec2f(screen_size);\r
    let launchPreIndex = getCoord(globalPreId);\r
    if validateCoord(globalPreId) {\r
        var _seed: u32;\r
        loadReservoir(&previousReservoir, launchPreIndex, &reservoirPrevDI, &reservoirPrevGI, &_seed);\r
        pointPrev = loadGBufferAttri(&previousGBufferAttri, launchPreIndex);\r
    }\r
    var _seed = tea(WorkgroupID.y * screen_size.x + WorkgroupID.x, ubo.seed, 2);\r
    var geometryTerm_luminance: f32;\r
    var bsdfLuminance: f32;\r
    var pHat: f32;\r
    // initial candidates\r
    var light: Light;\r
    var wo: vec3f;\r
    var dist: f32;\r
    if ENABLE_DI {\r
        for (var i = 0; i < 8; i = i + 1) {\r
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
            {\r
            light = getLight(reservoirCurDI.lightId);\r
            wo = light.position - shadingPoint;\r
            dist = length(wo);\r
            wo = normalize(wo);\r
            if traceShadowRay(shadingPoint, wo, dist) {\r
                reservoirCurDI.W = 0.0;\r
                reservoirCurDI.w_sum = 0.0;\r
            }\r
        }\r
    }\r
    // indirect illumination\r
    if ENABLE_GI {\r
        let sampleVec: vec4f = samplingHemisphere();\r
        // let sampleVec: vec4f = vec4f(0.0, 0.0, 1.0, 1.0);\r
        let wi: vec3f = normalize(generateTBN(pointInfo.normalGeo) * sampleVec.xyz);\r
        let tracePdf = max(0.01, sampleVec.w);\r
        if dot(wi, pointInfo.normalGeo) >= 0. {\r
            let rayInfo: RayInfo = traceRay(shadingPoint, wi);\r
            if rayInfo.isHit == 1 {\r
                let triangle: PrimaryHitInfo = PrimaryHitInfo(rayInfo.hitAttribute, rayInfo.PrimitiveIndex, vec2f(0));\r
                let pointSampleInfo: PointInfo = unpackTriangleIndirect(triangle, wi);\r
                let samplePoint = pointSampleInfo.pos;\r
\r
                var tmpReservoir = ReservoirDI();\r
                var selected_pHat: f32 = 0.0;\r
                for (var i = 0; i < 4; i = i + 1) {\r
                    light = sampleLight();\r
                    let samplePdf = sampleLightProb(light);\r
                    wo = light.position - samplePoint;\r
                    dist = length(wo);\r
                    wo = normalize(wo);\r
                    if dot(wo, pointSampleInfo.normalShading) <= 0.0 || dot(wo, pointSampleInfo.normalGeo) <= 0.0 {\r
                        tmpReservoir.M += 1;\r
                        continue;\r
                    }\r
                    geometryTerm_luminance = light.intensity / (dist * dist);\r
                    bsdfLuminance = BSDFLuminance(pointSampleInfo, wo, -wi);\r
                    pHat = bsdfLuminance * geometryTerm_luminance;\r
                    updateDIResforGI(&tmpReservoir, light.id, pHat / samplePdf, pHat, &selected_pHat);\r
                }\r
                light = getLight(tmpReservoir.lightId);\r
                wo = light.position - samplePoint;\r
                dist = length(wo);\r
                wo = normalize(wo);\r
                // check the visibility from sample point to light\r
                if !traceShadowRay(samplePoint, wo, dist) {\r
                    tmpReservoir.W = tmpReservoir.w_sum / max(0.001, selected_pHat) / f32(tmpReservoir.M);\r
                    let geometryTerm = light.color * light.intensity / (dist * dist);\r
                    let bsdf = BSDF(pointSampleInfo, wo, -wi);\r
                    let Lo = tmpReservoir.W * bsdf * geometryTerm;\r
                    updateReservoirGI(&reservoirCurGI, pointInfo.pos, pointInfo.normalShading, pointSampleInfo.pos, pointSampleInfo.normalShading, luminance(Lo) / tracePdf, Lo, light.id);\r
                }\r
\r
            //     light = sampleLight();\r
            //     let lightPdf = sampleLightProb(light);\r
            //     wo = light.position - samplePoint;\r
            //     dist = length(wo);\r
            //     wo = normalize(wo);\r
            // // check the visibility from sample point to light\r
            //     if dot(wo, pointSampleInfo.normalShading) > 0.0 && dot(wo, pointSampleInfo.normalGeo) > 0.0 {\r
            //         if !traceShadowRay(samplePoint, wo, dist) {\r
            //             let geometryTerm = light.color * light.intensity / (dist * dist);\r
            //             let bsdf = BSDF(pointSampleInfo, wo, -wi);\r
            //             let Lo = bsdf * geometryTerm / lightPdf;\r
            //             updateReservoirGI(&reservoirCurGI, pointInfo.pos, pointInfo.normalShading, pointSampleInfo.pos, pointSampleInfo.normalShading, luminance(Lo) / tracePdf, Lo, light.id);\r
            //         }\r
            //     }\r
            }\r
        }\r
        reservoirCurGI.M = 1;\r
    }\r
\r
    // temperal reuse\r
    // plane distance\r
    let posDiff = pointPrev.pos - pointInfo.pos;\r
    let planeDist = abs(dot(posDiff, pointInfo.normalShading));\r
    if dot(pointInfo.normalShading, pointPrev.normalShading) > 0.5 && planeDist < 0.05 {\r
        if ENABLE_DI {\r
            if reservoirPrevDI.W > 0.0 {\r
                const capped = 8 * 5 ;\r
                reservoirPrevDI.M = min(reservoirPrevDI.M, capped);\r
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
        }\r
        if ENABLE_GI {\r
            if reservoirPrevGI.W > 0.0 {\r
                reservoirPrevGI.M = min(reservoirPrevGI.M, 12);\r
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
                if flag && dot(wo, pointInfo.normalShading) > 0.0 && dot(wo, pointInfo.normalGeo) > 0.0 && dot(-wo, reservoirPrevGI.ns) >= 0.0 {\r
\r
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
    // compute Weight\r
        {\r
        // DI\r
        if ENABLE_DI {\r
            light = getLight(reservoirCurDI.lightId);\r
            wo = light.position - shadingPoint;\r
            dist = length(wo);\r
            wo = normalize(wo);\r
            geometryTerm_luminance = light.intensity / (dist * dist);\r
            bsdfLuminance = BSDFLuminance(pointInfo, wo, -direction);\r
            pHat = bsdfLuminance * geometryTerm_luminance;\r
            if pHat > 0.0 {\r
                reservoirCurDI.W = reservoirCurDI.w_sum / max(1e-3, pHat) / f32(reservoirCurDI.M);\r
            } else {\r
                reservoirCurDI.W = 0.0;\r
                reservoirCurDI.w_sum = 0.0;\r
            }\r
        }\r
\r
        // GI\r
        if ENABLE_GI {\r
            reservoirCurGI.W = reservoirCurGI.w_sum / max(1e-3, luminance(reservoirCurGI.Lo)) / f32(reservoirCurGI.M);\r
        }\r
    }\r
\r
    // // random select light\r
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
    //     // traceShadowRay(shadingPoint, wo, dist);\r
    //     // traceShadowRay(shadingPoint, wo, dist);\r
    //     if traceShadowRay(shadingPoint, wo, dist) {\r
    //         visibility = 0.0;\r
    //     } else {\r
    //         visibility = 1.0;\r
    //     }\r
    //     color = bsdf * geometryTerm * visibility / samplePdf;\r
    // }\r
\r
    // // reference color\r
    // for (var i = 0; i < 11; i = i + 1) {\r
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
    // // write reservoir\r
    storeReservoir(&currentReservoir, launchIndex, reservoirCurDI, reservoirCurGI, seed);\r
    // storeColor(&frame, launchIndex, color / pointInfo.baseColor);\r
}`,Mo=`// https://www.cg.cs.tu-bs.de/publications/Eisemann07FRA\r
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
`,Co=`@group(0) @binding(0) var<storage, read_write> frame: array<vec2u>;\r
@group(0) @binding(1) var<uniform> ubo: UBO;\r
@group(0) @binding(2) var<storage, read_write> gBufferTex : array<vec2u>;\r
@group(0) @binding(3) var<storage, read_write> gBufferAttri : array<vec4f>;\r
\r
\r
// #include <common.wgsl>;\r
// #include <reservoir.wgsl>;\r
// #include <light.wgsl>;\r
// #include <BSDF.wgsl>;\r
\r
override ENABLE_DI: bool = true;\r
override ENABLE_GI: bool = true;\r
override WIDTH: u32;\r
override HEIGHT: u32;\r
\r
@compute @workgroup_size(8, 8, 1)\r
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3u) {\r
    screen_size = vec2u(WIDTH, HEIGHT);\r
    if any(GlobalInvocationID.xy >= screen_size) {\r
        return;\r
    }\r
    var color = vec3f(0.0);\r
    let origin = ubo.origin;\r
\r
    let screen_pos = vec2f(GlobalInvocationID.xy) + 0.5;\r
    let launchIndex = getCoord(screen_pos);\r
    var reservoirDI = ReservoirDI();\r
    var reservoirGI = ReservoirGI();\r
    var _seed: u32;\r
    loadReservoir(&previousReservoir, launchIndex, &reservoirDI, &reservoirGI, &_seed);\r
\r
    if reservoirDI.W < 0.0 {\r
        storeReservoir(&currentReservoir, launchIndex, reservoirDI, reservoirGI, seed);\r
        return;\r
    }\r
    seed = tea(GlobalInvocationID.y * screen_size.x + GlobalInvocationID.x, _seed, 4);\r
    var pointInfo: PointInfo;\r
    loadGBuffer(launchIndex, &pointInfo);\r
\r
    const scale = 4u;\r
    if reservoirDI.M > 4 {\r
        reservoirDI.w_sum *= f32(reservoirDI.M / scale) / f32(reservoirDI.M);\r
        reservoirDI.M /= scale;\r
    }\r
    // if ENABLE_GI && reservoirGI.M > 3 {\r
    //     reservoirGI.w_sum *= f32(reservoirGI.M / scale) / f32(reservoirGI.M);\r
    //     reservoirGI.M /= scale;\r
    // }\r
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
        let neighbor_pos = screen_pos + samplingDisk() * 15.0;\r
        // let neighbor_pos = screen_pos + bias2[i] * 2.;\r
        let neighbor_launchIndex = getCoord(neighbor_pos);\r
        if !validateCoord(neighbor_pos) {\r
            continue;\r
        }\r
        var neighbor_reservoirDI = ReservoirDI();\r
        var neighbor_reservoirGI = ReservoirGI();\r
        loadReservoir(&previousReservoir, neighbor_launchIndex, &neighbor_reservoirDI, &neighbor_reservoirGI, &_seed);\r
        let neighbour_pointAttri: PointAttri = loadGBufferAttri(&gBufferAttri, neighbor_launchIndex);\r
        // check plane distance\r
        let posDiff = pointInfo.pos - neighbour_pointAttri.pos;\r
        let planeDist = abs(dot(posDiff, pointInfo.normalShading));\r
        if planeDist < 0.01 && dot(pointInfo.normalShading, neighbour_pointAttri.normalShading) > .8 {\r
\r
            if ENABLE_DI && neighbor_reservoirDI.W > 0. {\r
                light = getLight(neighbor_reservoirDI.lightId);\r
                wo = light.position - pointInfo.pos;\r
                dist = length(wo);\r
                wo = normalize(wo);\r
                if dot(wo, pointInfo.normalShading) > 0. {\r
                    // color += vec3f(0.2);\r
                    // neighbor_reservoirDI.M = min(neighbor_reservoirDI.M, threshold);\r
                    neighbor_reservoirDI.M /= scale;\r
                    geometryTerm_luminance = light.intensity / (dist * dist);\r
                    bsdfLuminance = BSDFLuminance(pointInfo, wo, wi);\r
                    pHat = geometryTerm_luminance * bsdfLuminance;\r
                    neighbor_reservoirDI.w_sum = pHat * neighbor_reservoirDI.W * f32(neighbor_reservoirDI.M);\r
                    combineReservoirsDI(&reservoirDI, neighbor_reservoirDI);\r
                }\r
            }\r
            if ENABLE_GI && neighbor_reservoirGI.W > 0. {\r
                wo = neighbor_reservoirGI.xs - pointInfo.pos;\r
                dist = length(wo);\r
                wo = normalize(wo);\r
                if dot(wo, pointInfo.normalShading) > 0. && dot(-wo, neighbor_reservoirGI.ns) >= 0. {\r
                    // neighbor_reservoirGI.M /= scale;\r
                    pHat = luminance(neighbor_reservoirGI.Lo);\r
                    // pHat = luminance(neighbor_reservoirGI.Lo) / Jacobian(pointInfo.pos, neighbor_reservoirGI);\r
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
            reservoirDI.W = reservoirDI.w_sum / max(1e-2, pHat) / f32(reservoirDI.M);\r
        }\r
        if ENABLE_GI {\r
            reservoirGI.W = reservoirGI.w_sum / max(1e-3, luminance(reservoirGI.Lo)) / f32(reservoirGI.M);\r
        }\r
    }\r
\r
\r
    // storeColor(&frame, launchIndex, color);\r
    storeReservoir(&currentReservoir, launchIndex, reservoirDI, reservoirGI, seed);\r
}`,To=`@group(0) @binding(0) var<storage, read_write> frame: array<vec2u>;\r
@group(0) @binding(1) var<uniform> ubo: UBO;\r
@group(0) @binding(2) var<storage, read_write> gBufferTex : array<vec2u>;\r
@group(0) @binding(3) var<storage, read_write> gBufferAttri : array<vec4f>;\r
\r
\r
// #include <common.wgsl>;\r
// #include <trace.wgsl>;\r
// #include <reservoir.wgsl>;\r
// #include <light.wgsl>;\r
// #include <BSDF.wgsl>;\r
\r
override ENABLE_DI: bool = true;\r
override ENABLE_GI: bool = true;\r
override WIDTH: u32;\r
override HEIGHT: u32;\r
\r
@compute @workgroup_size(8, 8, 1)\r
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3u) {\r
    screen_size = vec2u(WIDTH, HEIGHT);\r
    if any(GlobalInvocationID.xy >= screen_size) {\r
        return;\r
    }\r
    var color = vec3f(0.0);\r
    var illuminace = vec3f(0.0);\r
    let origin = ubo.origin;\r
\r
    let launchIndex = getCoord(vec2f(GlobalInvocationID.xy));\r
    var reservoirDI = ReservoirDI();\r
    var reservoirGI = ReservoirGI();\r
\r
    var _seed: u32;\r
    loadReservoir(&previousReservoir, launchIndex, &reservoirDI, &reservoirGI, &_seed);\r
\r
    if reservoirDI.W < 0.0 {\r
        storeColor(&frame, launchIndex, vec3f(0));\r
        return;\r
    }\r
    seed = tea(GlobalInvocationID.y * screen_size.x + GlobalInvocationID.x, _seed, 4);\r
    var pointInfo: PointInfo;\r
    loadGBuffer(launchIndex, &pointInfo);\r
\r
    var bsdf = vec3f(0.0);\r
    var geometryTerm = vec3f(1.0);\r
    var light: Light;\r
    let shadingPoint = pointInfo.pos;\r
    var wi = normalize(origin - shadingPoint);\r
    var wo: vec3f = vec3f(0.0);\r
    var dist: f32 = 0.0;\r
    if ENABLE_DI {\r
        light = getLight(reservoirDI.lightId);\r
        wo = light.position - shadingPoint;\r
        dist = length(wo);\r
        wo = normalize(wo);\r
        if reservoirDI.W < 0. || (reservoirDI.W > 0. && traceShadowRay(shadingPoint, wo, dist)) {\r
            reservoirDI.W = 0.;\r
            reservoirDI.w_sum = 0.;\r
        }\r
        bsdf = BSDF(pointInfo, wo, wi);\r
        geometryTerm = light.color * light.intensity / (dist * dist);\r
        color += max(0, reservoirDI.W) * bsdf * geometryTerm;\r
    }\r
    if ENABLE_GI {\r
        if reservoirGI.W > 0 {\r
            wo = reservoirGI.xs - shadingPoint;\r
            dist = length(wo);\r
            wo = normalize(wo);\r
            // color = reservoirGI.Lo;\r
            if traceShadowRay(shadingPoint, wo, dist) {\r
            // if dot(wo, pointInfo.normalShading) < 0. || dot(-wo, reservoirGI.ns) < 0. {\r
                reservoirGI.W = 0.;\r
                reservoirGI.w_sum = 0.;\r
            }\r
            bsdf = BSDF(pointInfo, wo, wi);\r
            geometryTerm = reservoirGI.Lo * 4;\r
                // geometryTerm = reservoirGI.Lo / Jacobian(shadingPoint, reservoirGI);\r
            color += reservoirGI.W * bsdf * geometryTerm;\r
        }\r
    }\r
    storeColor(&frame, launchIndex, color / max(pointInfo.baseColor, vec3f(1. / 256.)));\r
\r
    // storeColor(&frame, launchIndex, color);\r
\r
    // storeColor(&frame, launchIndex, (pointInfo.normalShading + 1) / 2.);\r
}`,Eo=`// #include <utils.wgsl>;\r
\r
fn loadIllumination(illum: ptr<storage,array<vec2u>, read_write>, launchIndex: u32) -> vec3f {\r
    return max(vec3f(0), loadColor(illum, launchIndex));\r
}\r
\r
fn storeIllumination(illum: ptr<storage,array<vec2u>, read_write>, launchIndex: u32, color: vec3f) {\r
    storeColor(illum, launchIndex, color);\r
}\r
\r
fn loadNormal(gBuffer: ptr<storage,array<vec4f>, read_write>, launchIndex: u32) -> vec3f {\r
    let point = loadGBufferAttri(gBuffer, launchIndex);\r
    return point.normalShading;\r
}`,Ro=`fn invokePreload(GlobalInvocationID: vec2i, LocalInvocationID: vec2i) {\r
    let group_base = GlobalInvocationID - LocalInvocationID - BORDER;\r
    let stage_num = (SHARED_SIZE * SHARED_SIZE + BATCH_SIZE * BATCH_SIZE - 1) / (BATCH_SIZE * BATCH_SIZE);\r
    for (var i: i32 = 0; i < stage_num; i = i + 1) {\r
        let threadIdx: i32 = LocalInvocationID.y * BATCH_SIZE + LocalInvocationID.x;\r
        let virtualIdx: i32 = threadIdx + i * BATCH_SIZE * BATCH_SIZE;\r
        let loadIdx = vec2i(virtualIdx % SHARED_SIZE, virtualIdx / SHARED_SIZE);\r
        if i == 0 || virtualIdx < SHARED_SIZE * SHARED_SIZE {\r
            preload(loadIdx, group_base + loadIdx);\r
        }\r
    }\r
    workgroupBarrier();\r
}`,Bo=`struct Camera {\r
    world: mat4x4f,\r
    projInv: mat4x4f,\r
    VPMat: mat4x4f,\r
    lastVPMat: mat4x4f,\r
};\r
\r
@group(0) @binding(0) var<uniform> camera : Camera;\r
@group(0) @binding(1) var motionVec: texture_2d<u32>;\r
@group(0) @binding(2) var<storage,read_write> illumination_previous: array<vec2u>;\r
@group(0) @binding(3) var<storage,read_write> illumination_current: array<vec2u>;\r
@group(0) @binding(4) var<storage,read_write> illumination_sample: array<vec2u>;\r
@group(0) @binding(5) var<storage,read_write> gBufferAttri:array<vec4f>;\r
@group(0) @binding(6) var<storage,read_write> gBufferAttriPrevious : array<vec4f>;\r
@group(0) @binding(7) var depth : texture_depth_2d;\r
@group(0) @binding(8) var<storage,read_write> historyLength: array<f32>;\r
@group(0) @binding(9) var<storage,read_write> historyLengthPrevious: array<f32>;\r
@group(0) @binding(10) var<storage,read_write> moment:array<vec2f>;\r
@group(0) @binding(11) var<storage,read_write> momentPrevious:array<vec2f>;\r
@group(0) @binding(12) var<storage, read_write> variance_current: array<f32>;\r
\r
override WIDTH: u32;\r
override HEIGHT: u32;\r
\r
// #include <denoiseCommon.wgsl>;\r
\r
fn loadPosition(gBuffer: ptr<storage,array<vec4f>, read_write>, launchIndex: u32) -> vec3f {\r
    let point = loadGBufferAttri(gBuffer, launchIndex);\r
    return point.pos;\r
}\r
\r
fn validateReprojection(normalCenter: vec3f, posCenter: vec3f, posPre: vec3f) -> bool {\r
    let posDiff = posCenter - posPre;\r
    let planeDist = abs(dot(normalCenter, posDiff));\r
    return planeDist < 0.001;\r
}\r
const BORDER: i32 = 1;\r
const SHARED_SIZE: i32 = BATCH_SIZE + BORDER * 2;\r
\r
var<workgroup> sharedNormalDepth: array<array<vec4f, SHARED_SIZE>, SHARED_SIZE>;\r
\r
fn loadNormalShared(sharedPos: vec2i) -> vec3f {\r
    return sharedNormalDepth[sharedPos.y][sharedPos.x].xyz;\r
}\r
\r
fn preload(sharedPos: vec2i, globalPos: vec2i) {\r
    let globalId = clamp(globalPos, vec2i(0), vec2i(screen_size) - 1);\r
    let normal = loadNormal(&gBufferAttri, getCoord(vec2f(globalId) + 0.5));\r
    let depth = textureLoad(depth, vec2u(globalId), 0);\r
    sharedNormalDepth[sharedPos.y][sharedPos.x] = vec4f(normal, depth);\r
}\r
// #include <preloadInvoker.wgsl>;\r
\r
@compute @workgroup_size(BATCH_SIZE, BATCH_SIZE, 1)\r
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3u, @builtin(workgroup_id) WorkgroupID: vec3u, @builtin(local_invocation_id) LocalInvocationID: vec3u) {\r
    screen_size = vec2u(WIDTH, HEIGHT);\r
    let screen_pos = vec2f(GlobalInvocationID.xy) + 0.5;\r
    invokePreload(vec2i(GlobalInvocationID.xy), vec2i(LocalInvocationID.xy));\r
    if any(screen_pos >= vec2f(screen_size)) {\r
        return;\r
    }\r
    var color = vec3f(0);\r
    let depthCenter = textureLoad(depth, vec2u(screen_pos), 0);\r
    if depthCenter == 1.0 {\r
        storeIllumination(&illumination_current, getCoord(screen_pos), vec3f(0));\r
        variance_current[ getCoord(screen_pos)] = 64.;\r
        moment[getCoord(screen_pos)] = vec2f(0);\r
        historyLength[getCoord(screen_pos)] = 0.0;\r
        return;\r
    }\r
    let motion: vec2f = unpack2x16float(textureLoad(motionVec, GlobalInvocationID.xy, 0).r) * vec2f(screen_size);\r
    let screen_pos_pre = screen_pos - motion;\r
    let launchIndex: u32 = getCoord(screen_pos);\r
    var illumSamp = loadIllumination(&illumination_sample, launchIndex);\r
    var illumSampLuminance = luminance(illumSamp);\r
    var normalCenterAvg = vec3f(0);\r
    var posCenter = loadPosition(&gBufferAttri, launchIndex);\r
\r
\r
    const offset33: array<vec2f,9> = array<vec2f,9>(\r
        vec2f(-1, -1), vec2f(0, -1), vec2f(1, -1),\r
        vec2f(-1, 0), vec2f(0, 0), vec2f(1, 0),\r
        vec2f(-1, 1), vec2f(0, 1), vec2f(1, 1)\r
    );\r
\r
    for (var i: i32 = 0; i < 9; i = i + 1) {\r
        let offset = offset33[i];\r
        let screen_pos_offset = screen_pos + offset;\r
        let launchIndexOffset = getCoord(screen_pos_offset);\r
        if !validateCoord(screen_pos_offset) {\r
            continue;\r
        }\r
        let groupSharedPos = vec2i(LocalInvocationID.xy) + vec2i(offset) + BORDER;\r
        if sharedNormalDepth[groupSharedPos.y][groupSharedPos.x].w >= 1 {\r
            continue;\r
        }\r
        normalCenterAvg += loadNormalShared(groupSharedPos);\r
        // normalCenterAvg += loadNormal(&gBufferAttri, u32(launchIndexOffset));\r
    }\r
    normalCenterAvg = normalize(normalCenterAvg);\r
\r
    // reproject\r
        {\r
        var sumWeight = 0.0;\r
        var sumIllum = vec3f(0);\r
        var sumMoment = vec2f(0);\r
        var sumHistoryLength = 0.0;\r
\r
        var illumOut = vec3f(0);\r
        var momentOut = vec2f(0);\r
        var historyLengthOut = 0.;\r
        var variance = 0.;\r
\r
        let pos_floor = floor(screen_pos_pre - 0.5);\r
        let frac = screen_pos_pre-0.5 - pos_floor;\r
        let weight: array<f32,4> = array<f32,4>(\r
            (1.0 - frac.x) * (1.0 - frac.y),\r
            frac.x * (1.0 - frac.y),\r
            (1.0 - frac.x) * frac.y,\r
            frac.x * frac.y\r
        );\r
        const offset22: array<vec2f,4> = array<vec2f,4>(\r
            vec2f(0, 0), vec2f(1, 0), vec2f(0, 1), vec2f(1, 1)\r
        );\r
        for (var i: i32 = 0; i < 4; i = i + 1) {\r
            let offset = offset22[i];\r
            let screen_pos_pre_offset = screen_pos_pre -0.5 + offset;\r
            let launchIndexOffset = getCoord(screen_pos_pre_offset);\r
            if !validateCoord(screen_pos_pre_offset) {\r
                continue;\r
            }\r
            let posPre = gBufferAttriPrevious[launchIndexOffset].xyz;\r
            if validateReprojection(normalCenterAvg, posCenter, posPre) {\r
                sumIllum += loadIllumination(&illumination_previous, u32(launchIndexOffset)) * weight[i];\r
                sumMoment += momentPrevious[launchIndexOffset] * weight[i];\r
                sumHistoryLength += historyLengthPrevious[launchIndexOffset] * weight[i];\r
                sumWeight += weight[i];\r
            }\r
        }\r
        let posPre = gBufferAttriPrevious[getCoord(screen_pos_pre)].xyz;\r
        if sumWeight > 0. {\r
            sumIllum /= sumWeight;\r
            sumMoment /= sumWeight;\r
            sumHistoryLength /= sumWeight;\r
            historyLengthOut = clamp(sumHistoryLength + 1., 1., 5.);\r
            var alpha = 1. / historyLengthOut;\r
\r
            // history clamping\r
            let variance_prev = max(sumMoment.y - sumMoment.x * sumMoment.x, 1e-5);\r
            momentOut = mix(sumMoment, vec2f(illumSampLuminance, illumSampLuminance * illumSampLuminance), alpha);\r
            variance = max(momentOut.y - momentOut.x * momentOut.x, 1e-5);\r
            let posDiff = posCenter - posPre;\r
            let varRatio = variance / variance_prev;\r
            let historyFactor = exp(- 1 * pow(varRatio, 2) * log(1e-2 * length(posDiff) + 1.000));\r
\r
            historyLengthOut *= historyFactor;\r
            historyLengthOut = clamp(historyLengthOut, 1.1, 5.);\r
            alpha = 1. / historyLengthOut;\r
            momentOut = mix(sumMoment, vec2f(illumSampLuminance, illumSampLuminance * illumSampLuminance), alpha);\r
            variance = max(momentOut.y - momentOut.x * momentOut.x, 1e-5);\r
\r
            // let deviation = sqrt(variance);\r
            illumOut = mix(sumIllum, illumSamp, alpha);\r
            // color = vec3f(historyFactor);\r
        } else {\r
            sumIllum = vec3f(0);\r
            illumOut = illumSamp;\r
            momentOut = vec2f(illumSampLuminance, illumSampLuminance * illumSampLuminance);\r
            historyLengthOut = 1.0;\r
            variance = 64.;\r
            color = vec3f(1, 0, 0);\r
        }\r
        variance_current[launchIndex] = variance;\r
        moment[launchIndex] = momentOut;\r
        historyLength[launchIndex] = historyLengthOut;\r
        // if validateCoord(screen_pos_pre) {\r
        //     sumIllum = loadIllumination(&illumination_previous, u32(getCoord(screen_pos_pre))) ;\r
        //     sumHistoryLength = historyLengthPrevious[getCoord(screen_pos_pre)];\r
        //     sumWeight = 1;\r
        // }\r
        storeIllumination(&illumination_current, launchIndex, illumOut);\r
        // storeIllumination(&illumination_sample, launchIndex, illumOut);\r
        // storeIllumination(&illumination_sample, launchIndex, vec3f(sqrt(variance) / 8));\r
        // storeIllumination(&illumination_sample, launchIndex, color);\r
    }\r
}`,zo=`@group(0) @binding(0) var<storage,read_write> illumination_input: array<vec2u>;\r
@group(0) @binding(1) var<storage,read_write> illumination_output: array<vec2u>;\r
@group(0) @binding(2) var<storage,read_write> gBufferAttri:array<vec4f>;\r
@group(0) @binding(3) var depth : texture_depth_2d;\r
\r
override WIDTH: u32;\r
override HEIGHT: u32;\r
\r
// #include <denoiseCommon.wgsl>;\r
\r
const BORDER: i32 = 1;\r
const SHARED_SIZE: i32 = BATCH_SIZE + BORDER * 2;\r
\r
var<workgroup> sharedNormalDepth: array<array<vec4f, SHARED_SIZE>, SHARED_SIZE>;\r
var<workgroup> sharedPosition: array<array<vec3f, SHARED_SIZE>, SHARED_SIZE>;\r
var<workgroup> sharedIllumination: array<array<vec3f, SHARED_SIZE>, SHARED_SIZE>;\r
\r
fn preload(sharedPos: vec2i, globalPos: vec2i) {\r
    let globalId = clamp(globalPos, vec2i(0), vec2i(screen_size) - 1);\r
    let pointAttri = loadGBufferAttri(&gBufferAttri, getCoord(vec2f(globalId) + 0.5));\r
    let pos = pointAttri.pos;\r
    sharedPosition[sharedPos.y][sharedPos.x] = pos;\r
    let normal = pointAttri.normalShading;\r
    let depth: f32 = textureLoad(depth, globalPos, 0) ;\r
    sharedNormalDepth[sharedPos.y][sharedPos.x] = vec4f(normal, depth);\r
    let illum = loadIllumination(&illumination_input, getCoord(vec2f(globalId) + 0.5));\r
    sharedIllumination[sharedPos.y][sharedPos.x] = illum;\r
}   \r
\r
// #include <preloadInvoker.wgsl>;\r
\r
fn validateNeighbour(normalCenter: vec3f, posCenter: vec3f, posNeighbour: vec3f) -> f32 {\r
    let posDiff = posCenter - posNeighbour;\r
    let planeDist = abs(dot(normalCenter, posDiff));\r
    return f32(planeDist < 0.02);\r
}\r
\r
@compute @workgroup_size(BATCH_SIZE, BATCH_SIZE, 1)\r
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3u, @builtin(workgroup_id) WorkgroupID: vec3u, @builtin(local_invocation_id) LocalInvocationID: vec3u) {\r
    screen_size = vec2u(WIDTH, HEIGHT);\r
    let screen_pos = vec2f(GlobalInvocationID.xy) + 0.5;\r
    invokePreload(vec2i(GlobalInvocationID.xy), vec2i(LocalInvocationID.xy));\r
    if any(screen_pos >= vec2f(screen_size)) {\r
        return;\r
    }\r
    let sharedIdx = vec2i(LocalInvocationID.xy) + BORDER;\r
    var color = vec3f(0);\r
    if sharedNormalDepth[sharedIdx.y][sharedIdx.x].w >= 1 {\r
        return;\r
    }\r
\r
    let normalCenter = sharedNormalDepth[sharedIdx.y][sharedIdx.x].xyz;\r
    let posCenter = sharedPosition[sharedIdx.y][sharedIdx.x];\r
    let illuminationCenter = sharedIllumination[sharedIdx.y][sharedIdx.x];\r
    let luminanceCenter = luminance(illuminationCenter);\r
\r
    var maxLuminance = -1.0;\r
    var minLuminance = 1e10;\r
    var maxLuminanceCoord = sharedIdx;\r
    var minLuminanceCoord = sharedIdx;\r
\r
    const offset: array<vec2i, 8> = array<vec2i, 8>(\r
        vec2i(-1, -1), vec2i(0, -1), vec2i(1, -1),\r
        vec2i(-1, 0), vec2i(1, 0),\r
        vec2i(-1, 1), vec2i(0, 1), vec2i(1, 1)\r
    );\r
\r
    for (var i: i32 = 0; i < 8; i = i + 1) {\r
        let neighborGlobalIdx = screen_pos + vec2f(offset[i]);\r
        if !validateCoord(neighborGlobalIdx) {\r
            continue;\r
        }\r
        let neighborIdx = sharedIdx + offset[i];\r
        let depth = sharedNormalDepth[neighborIdx.y][neighborIdx.x].w;\r
        if depth >= 1 {\r
            continue;\r
        }\r
        let normal = sharedNormalDepth[neighborIdx.y][neighborIdx.x].xyz;\r
        let pos = sharedPosition[neighborIdx.y][neighborIdx.x];\r
        let illumination = sharedIllumination[neighborIdx.y][neighborIdx.x];\r
        let luminance = luminance(illumination);\r
        // var weight = f32(select(0, 1, dot(normalCenter, normal) > 0.95));\r
        // weight *= validateNeighbour(normalCenter, posCenter, pos);\r
        var weight = validateNeighbour(normalCenter, posCenter, pos);\r
        if weight > 0 {\r
            if luminance > maxLuminance {\r
                maxLuminance = luminance;\r
                maxLuminanceCoord = neighborIdx;\r
            }\r
            if luminance < minLuminance {\r
                minLuminance = luminance;\r
                minLuminanceCoord = neighborIdx;\r
            }\r
        }\r
    }\r
    var inputCoord = sharedIdx;\r
    if luminanceCenter > maxLuminance {\r
        inputCoord = maxLuminanceCoord;\r
    }\r
    if luminanceCenter < minLuminance {\r
        inputCoord = minLuminanceCoord;\r
    }\r
    // if any(inputCoord != sharedIdx) {\r
    //     storeIllumination(&illumination_output, getCoord(screen_pos), vec3f(0, 10, 0));\r
    // } else {\r
    storeIllumination(&illumination_output, getCoord(screen_pos), sharedIllumination[inputCoord.y][inputCoord.x]);\r
    // } \r
}`,Po=`@group(0) @binding(0) var<storage,read_write> variance_input: array<f32>;\r
@group(0) @binding(1) var<storage,read_write> variance_output: array<f32>;\r
@group(0) @binding(2) var depth : texture_depth_2d;\r
\r
override WIDTH: u32;\r
override HEIGHT: u32;\r
\r
// #include <denoiseCommon.wgsl>;\r
\r
const BORDER: i32 = 1;\r
const SHARED_SIZE: i32 = BATCH_SIZE + BORDER * 2;\r
\r
var<workgroup> sharedVarianceDepth: array<array<vec2f, SHARED_SIZE>, SHARED_SIZE>;\r
\r
fn preload(sharedPos: vec2i, globalPos: vec2i) {\r
    let globalId = clamp(globalPos, vec2i(0), vec2i(screen_size) - 1);\r
    let launchIndex = getCoord(vec2f(globalId) + 0.5);\r
    let variance = variance_input[launchIndex];\r
    let depthValue = textureLoad(depth, globalId, 0);\r
    sharedVarianceDepth[sharedPos.y][sharedPos.x] = vec2f(variance, depthValue);\r
}   \r
// #include <preloadInvoker.wgsl>;\r
\r
@compute @workgroup_size(BATCH_SIZE, BATCH_SIZE, 1)\r
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3u, @builtin(workgroup_id) WorkgroupID: vec3u, @builtin(local_invocation_id) LocalInvocationID: vec3u) {\r
    screen_size = vec2u(WIDTH, HEIGHT);\r
    let screen_pos = vec2f(GlobalInvocationID.xy) + 0.5;\r
    invokePreload(vec2i(GlobalInvocationID.xy), vec2i(LocalInvocationID.xy));\r
    if any(screen_pos >= vec2f(screen_size)) {\r
        return;\r
    }\r
    let launchIndex = getCoord(screen_pos);\r
    let sharedIdx = vec2i(LocalInvocationID.xy) + BORDER;\r
    if sharedVarianceDepth[sharedIdx.y][sharedIdx.x].y >= 1 {\r
        return;\r
    }\r
\r
    const offset: array<vec2i, 9> = array<vec2i, 9>(\r
        vec2i(-1, -1), vec2i(0, -1), vec2i(1, -1),\r
        vec2i(-1, 0), vec2i(0, 0), vec2i(1, 0),\r
        vec2i(-1, 1), vec2i(0, 1), vec2i(1, 1)\r
    );\r
    const gaussian: array<f32, 9> = array<f32, 9>(\r
        0.0625, 0.125, 0.0625,\r
        0.125, 0.25, 0.125,\r
        0.0625, 0.125, 0.0625\r
    );\r
\r
    var sum: f32 = 0.0;\r
    var sumWeight: f32 = 0.0;\r
\r
    for (var i = 0; i < 9; i = i + 1) {\r
        let neighborGlobalIdx = screen_pos + vec2f(offset[i]);\r
        if !validateCoord(neighborGlobalIdx) {\r
            continue;\r
        }\r
        let neighbor = sharedVarianceDepth[sharedIdx.y + offset[i].y][sharedIdx.x + offset[i].x];\r
        if neighbor.y >= 1 {\r
            continue;\r
        }\r
        sum += gaussian[i] * neighbor.x;\r
        sumWeight += gaussian[i];\r
    }\r
    variance_output[launchIndex] = max(0, sum / sumWeight);\r
}`,ko=`@group(0) @binding(0) var<storage,read_write> illumination_in: array<vec2u>;\r
@group(0) @binding(1) var<storage,read_write> illumination_out: array<vec2u>;\r
@group(0) @binding(2) var<storage,read_write> gBufferAttri:array<vec4f>;\r
\r
@group(1) @binding(0) var<storage,read_write> variance_input: array<f32>;\r
@group(1) @binding(1) var<storage,read_write> variance_output: array<f32>;\r
@group(1) @binding(2) var depth : texture_depth_2d;\r
\r
override WIDTH: u32;\r
override HEIGHT: u32;\r
const step: f32=f32(1 << STEP_SIZE);\r
// #include <denoiseCommon.wgsl>;\r
\r
fn fastPow(x: f32, y: f32) -> f32 {\r
    return exp(x * log(y));\r
}\r
\r
@compute @workgroup_size(BATCH_SIZE, BATCH_SIZE, 1)\r
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3u, @builtin(workgroup_id) WorkgroupID: vec3u, @builtin(local_invocation_id) LocalInvocationID: vec3u) {\r
    screen_size = vec2u(WIDTH, HEIGHT);\r
    let screen_pos = vec2f(GlobalInvocationID.xy) + 0.5;\r
    if any(screen_pos >= vec2f(screen_size)) {\r
        return;\r
    }\r
    var color = vec3f(0);\r
    if textureLoad(depth, vec2u(screen_pos), 0) >= 1 {\r
        return;\r
    }\r
    let launchIndex = getCoord(screen_pos);\r
    let illuminanceCenter = loadIllumination(&illumination_in, launchIndex);\r
    let luminanceCenter = luminance(illuminanceCenter);\r
    let pointAttriCenter = loadGBufferAttri(&gBufferAttri, launchIndex);\r
    let posCenter = pointAttriCenter.pos;\r
    let normalCenter = pointAttriCenter.normalShading;\r
    let varianceCenter = variance_input[launchIndex];\r
\r
    // const offset55: array<vec2i,25> = array<vec2i,25>(\r
    //     vec2i(-2, -2), vec2i(-1, -2), vec2i(0, -2), vec2i(1, -2), vec2i(2, -2),\r
    //     vec2i(-2, -1), vec2i(-1, -1), vec2i(0, -1), vec2i(1, -1), vec2i(2, -1),\r
    //     vec2i(-2, 0), vec2i(-1, 0), vec2i(0, 0), vec2i(1, 0), vec2i(2, 0),\r
    //     vec2i(-2, 1), vec2i(-1, 1), vec2i(0, 1), vec2i(1, 1), vec2i(2, 1),\r
    //     vec2i(-2, 2), vec2i(-1, 2), vec2i(0, 2), vec2i(1, 2), vec2i(2, 2)\r
    // );\r
    // // high precision 5x5 gaussian filter weight\r
    // const weight55: array<f32,25> = array<f32,25>(\r
    //     1 / 256.0, 4 / 256.0, 6 / 256.0, 4 / 256.0, 1 / 256.0,\r
    //     4 / 256.0, 16 / 256.0, 24 / 256.0, 16 / 256.0, 4 / 256.0,\r
    //     6 / 256.0, 24 / 256.0, 36 / 256.0, 24 / 256.0, 6 / 256.0,\r
    //     4 / 256.0, 16 / 256.0, 24 / 256.0, 16 / 256.0, 4 / 256.0,\r
    //     1 / 256.0, 4 / 256.0, 6 / 256.0, 4 / 256.0, 1 / 256.0\r
    // );\r
    const offset33: array<vec2i,9> = array<vec2i,9>(\r
        vec2i(-1, -1), vec2i(0, -1), vec2i(1, -1),\r
        vec2i(-1, 0), vec2i(0, 0), vec2i(1, 0),\r
        vec2i(-1, 1), vec2i(0, 1), vec2i(1, 1)\r
    );\r
    // high precision 3x3 gaussian filter weight\r
    const weight33: array<f32,9> = array<f32,9>(\r
        1 / 16.0, 2 / 16.0, 1 / 16.0,\r
        2 / 16.0, 4 / 16.0, 2 / 16.0,\r
        1 / 16.0, 2 / 16.0, 1 / 16.0\r
    );\r
\r
    const sigma_luminance: f32 = 0.5;\r
    const sigma_normal: f32 = 128;\r
    const sigma_position: f32 = 0.05;\r
    const epsilon: f32 = 0.0001;\r
\r
    var sumWeight = 0.0;\r
    var sumWeight2 = 0.0;\r
    var sumIlluminance = vec3f(0);\r
    var sumVariance = 0.0;\r
\r
    for (var i = 0; i < 9; i = i + 1) {\r
        let offset = offset33[i];\r
        let screen_pos_offset = screen_pos + step * vec2f(offset);\r
        let launchIndex_offset = getCoord(screen_pos_offset);\r
        if !validateCoord(screen_pos_offset) {\r
            continue;\r
        }\r
        let illuminance = loadIllumination(&illumination_in, launchIndex_offset);\r
        let luminance = luminance(illuminance);\r
        let pointAttri = loadGBufferAttri(&gBufferAttri, launchIndex_offset);\r
        let pos = pointAttri.pos;\r
        let normal = pointAttri.normalShading;\r
\r
        // Edge-stopping weights\r
        let luminDiff = luminance - luminanceCenter;\r
        let wluminance = exp(-abs(luminDiff) / (varianceCenter * sigma_luminance + epsilon));\r
        let wnormal = fastPow(max(0, dot(normal, normalCenter)), sigma_normal);\r
        let planeDist = abs(dot(normalCenter, pos - posCenter));\r
        let wposition = exp(- planeDist / sigma_position);\r
\r
        let weight = wposition * wnormal * wluminance * weight33[i];\r
        sumWeight += weight;\r
        sumWeight2 += weight * weight;\r
        sumIlluminance += illuminance * weight;\r
        sumVariance += variance_input[launchIndex_offset] * weight;\r
    }\r
    var illumiance = vec3f(0);\r
    if sumWeight > epsilon {\r
        illumiance = sumIlluminance / sumWeight;\r
        variance_output[launchIndex] = sumVariance / sumWeight;\r
    } else {\r
        illumiance = illuminanceCenter;\r
        variance_output[launchIndex] = varianceCenter;\r
    }\r
    storeIllumination(&illumination_out, launchIndex, illumiance);\r
}\r
`,Lo=`@group(0) @binding(0) var<storage, read_write> illumination: array<vec2u>;\r
@group(0) @binding(1) var<storage, read_write> output : array<vec2u>;\r
@group(0) @binding(2) var<storage, read_write> gBufferTex : array<vec2u>;\r
@group(0) @binding(3) var<storage, read_write> variance : array<f32>;\r
\r
override WIDTH: u32;\r
override HEIGHT: u32;\r
\r
// #include <denoiseCommon.wgsl>;\r
\r
fn loadReflectance(reflect: ptr<storage,array<vec2u>, read_write>, launchIndex: u32) -> vec3f {\r
    let data = (*reflect)[launchIndex];\r
    return  vec3f(unpack2x16unorm(data.x), unpack2x16unorm(data.y).x);\r
}\r
\r
@compute @workgroup_size(BATCH_SIZE, BATCH_SIZE, 1)\r
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3u, @builtin(workgroup_id) WorkgroupID: vec3u, @builtin(local_invocation_id) LocalInvocationID: vec3u) {\r
    screen_size = vec2u(WIDTH, HEIGHT);\r
    if any(GlobalInvocationID.xy >= screen_size) {\r
        return;\r
    }\r
    let x = GlobalInvocationID.x;\r
    let y = GlobalInvocationID.y;\r
    let launchIndex = y * WIDTH + x;\r
    loadIllumination(&illumination, launchIndex);\r
    let illum = loadIllumination(&illumination, launchIndex);\r
    let reflectance = loadReflectance(&gBufferTex, launchIndex);\r
    let color = vec3f(illum) * vec3f(reflectance);\r
    let variance = variance[launchIndex];\r
\r
    // storeColor(&output, launchIndex, vec3f(sqrt(variance) / 8));\r
    storeColor(&output, launchIndex, color);\r
    // storeColor(&illumination, launchIndex, illum / 10);\r
    // storeColor(&output, launchIndex, illum / 5);\r
}`,Do=`@group(0) @binding(0) var currentDisplay : texture_storage_2d<displayFormat, write>;\r
@group(0) @binding(1) var previouDisplay: texture_2d<f32>;\r
@group(0) @binding(2) var samp : sampler;\r
@group(0) @binding(3) var motionVec : texture_2d<u32>;\r
@group(0) @binding(4) var depthBuffer : texture_depth_2d;\r
@group(0) @binding(5) var<storage, read_write> currentFrame : array<vec2u>;\r
@group(0) @binding(6) var<storage, read_write> previousFrame : array<vec2u>;\r
\r
override zNear: f32 = 0.01;\r
override zFar: f32 = 50.0;\r
\r
fn ACESToneMapping(color: vec3f, adapted_lum: f32) -> vec3f {\r
    const A = 2.51;\r
    const B = 0.03;\r
    const C = 2.43;\r
    const D = 0.59;\r
    const E = 0.14;\r
    let ret = color * adapted_lum;\r
    return (ret * (A * ret + B)) / (ret * (C * ret + D) + E);\r
    // return color;\r
}\r
\r
fn readColor(buffer: ptr<storage,array<vec2u>,read_write>, idx: u32) -> vec3f {\r
    let color = vec3f(unpack2x16float(buffer[idx].x).xy, unpack2x16float(buffer[idx].y).x);\r
    return color;\r
}\r
\r
@compute @workgroup_size(8, 8, 1)\r
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3u) {\r
    let screen_size: vec2u = textureDimensions(currentDisplay);\r
    let screen_pos: vec2u = vec2u(GlobalInvocationID.xy);\r
    if screen_pos.x >= screen_size.x || screen_pos.y >= screen_size.y {\r
        return;\r
    }\r
    let origin_size: vec2u = textureDimensions(motionVec);\r
    let scale_ratio: f32 = f32(screen_size.x) / f32(origin_size.x);\r
    let origin_pos: vec2u = vec2u(vec2f(screen_pos) / scale_ratio);\r
    let origin_pos_idx: u32 = origin_pos.y * origin_size.x + origin_pos.x;\r
\r
    _ = zFar;\r
    _ = zNear;\r
    // linear depth\r
    // let depth = (textureSampleLevel(depthBuffer, samp, vec2f(origin_pos) / vec2f(origin_size), 0) + 1.0) / 2.0;\r
    // let depth = (textureLoad(depthBuffer, origin_pos, 0) + 1.0) / 2.0;\r
    // let zlinear = zNear * zFar / (zFar + depth * (zNear - zFar));\r
    // textureStore(currentDisplay, screen_pos, vec4f(vec3f(textureLoad(depthBuffer, origin_pos, 0)), 1.0));\r
\r
    // [0, width] x [0, height] range of motion vector\r
    // .------> X\r
    // |\r
    // v\r
    // Y\r
    // let motionVec: vec2f = unpack2x16float(textureLoad(motionVec, origin_pos, 0).r) * vec2f(origin_size);\r
    // textureStore(currentDisplay, screen_pos, vec4f(motionVec.xy * 0.005 + 0.5, 0.0, 1.0));\r
\r
    // raytracing depth\r
    var color: vec3f = readColor(&currentFrame, origin_pos_idx);\r
    // if screen_pos.x < screen_size.x / 2 {\r
    // } else {\r
    //     color = textureSampleLevel(previousFrame, samp, vec2f(origin_pos) / vec2f(origin_size), 0);\r
    // }\r
    textureStore(currentDisplay, screen_pos, vec4f(ACESToneMapping(color, 1), 1.0));\r
}`,Oo=(c,e)=>c.replace(/\/\/ #include\s+<(.*?)>;/g,(t,r)=>e[r]);class Go{shaders={"basic.instanced.vert.wgsl":fo,"position.frag.wgsl":po,"compute.position.wgsl":mo,"utils.wgsl":yo,"light.wgsl":bo,"lightUpdate.wgsl":xo,"common.wgsl":vo,"sampleInit.wgsl":wo,"reservoir.wgsl":Io,"trace.wgsl":_o,"BSDF.wgsl":Ao,"vBuffer.wgsl":go,"rayGen.wgsl":So,"slopeAABBTest.wgsl":Mo,"spatialReuse.wgsl":Co,"accumulate.wgsl":To,"denoiseCommon.wgsl":Eo,"preloadInvoker.wgsl":Ro,"temperalAccum.wgsl":Bo,"firefly.wgsl":zo,"filterVariance.wgsl":Po,"atrous.wgsl":ko,"denoiseAccum.wgsl":Lo,"display.wgsl":Do};constructor(){for(const e in this.shaders){let t=0;for(;this.shaders[e].includes("#include");)if(this.shaders[e]=Oo(this.shaders[e],this.shaders),t++>10)throw new Error("Too deep include chain in shader: "+e)}}get(e){return this.shaders[e]}}const Ie=new Go;class Fo{displayPipeline;displayBindGroup;displayPipelineLayout;displayBindGroupLayout;bindGroupEntries;device;motionVec;depthTexture;previousDisplayBuffer;currentFrameBuffer;previousFrameBuffer;sampler;constructor(e,t,r){this.device=e,this.motionVec=t.motionVec,this.depthTexture=t.depthTexture,this.previousDisplayBuffer=t.previousDisplayBuffer,this.currentFrameBuffer=t.currentFrameBuffer,this.previousFrameBuffer=t.previousFrameBuffer,this.displayBindGroupLayout=e.device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,storageTexture:{access:"write-only",format:e.format}},{binding:1,visibility:GPUShaderStage.COMPUTE,texture:{}},{binding:2,visibility:GPUShaderStage.COMPUTE,sampler:{}},{binding:3,visibility:GPUShaderStage.COMPUTE,texture:{sampleType:"uint"}},{binding:4,visibility:GPUShaderStage.COMPUTE,texture:{sampleType:"depth"}},{binding:5,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:6,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}}]}),this.sampler=e.device.createSampler({addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge",magFilter:"nearest",minFilter:"nearest"}),this.bindGroupEntries=[{binding:0,resource:this.device.context.getCurrentTexture().createView()},{binding:1,resource:this.previousDisplayBuffer.createView()},{binding:2,resource:this.sampler},{binding:3,resource:this.motionVec.createView()},{binding:4,resource:this.depthTexture.createView()},{binding:5,resource:{buffer:this.currentFrameBuffer}},{binding:6,resource:{buffer:this.previousFrameBuffer}}],this.displayPipelineLayout=e.device.createPipelineLayout({bindGroupLayouts:[this.displayBindGroupLayout]}),this.displayPipeline=e.device.createComputePipeline({layout:this.displayPipelineLayout,compute:{module:e.device.createShaderModule({label:"display.wgsl",code:Ie.get("display.wgsl").replace("displayFormat",e.format)}),entryPoint:"main",constants:{zNear:r.camera.near,zFar:r.camera.far}}})}record(e){this.bindGroupEntries[0].resource=this.device.context.getCurrentTexture().createView(),this.displayBindGroup=this.device.device.createBindGroup({layout:this.displayBindGroupLayout,entries:this.bindGroupEntries});const t=e.beginComputePass();t.setPipeline(this.displayPipeline),t.setBindGroup(0,this.displayBindGroup),t.dispatchWorkgroups(Math.ceil(this.device.canvas.width/8),Math.ceil(this.device.canvas.height/8),1),t.end()}}/**
 * @license
 * Copyright 2010-2023 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const Ss="162",mt={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},yt={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},Ur=0,No=1,Uo=2,mi=1,yi=100,gi=204,xi=205,bi=3,Ho=0,vi="attached",Vo="detached",Ms=300,nr=1e3,Kt=1001,Tn=1002,ir=1003,jo=1004,Wo=1005,Fn=1006,qo=1007,Nn=1008,$o=1009,Yo=1014,Un=1015,Xo=1020,Cs=1023,Xr=1026,wi=1027,Zo=1028,sr=2300,kt=2301,Zr=2302,Ii=2400,_i=2401,Ai=2402,Ko=2500,Jo=0,Ts=1,En=2,Qo=0,Es="",te="srgb",ae="srgb-linear",ea="display-p3",Rs="display-p3-linear",Rn="linear",Si="srgb",Mi="rec709",Ci="p3",gt=7680,Ti=519,ta=515,Bn=35044,ct=2e3,zn=2001;class lr{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const r=this._listeners;r[e]===void 0&&(r[e]=[]),r[e].indexOf(t)===-1&&r[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;const r=this._listeners;return r[e]!==void 0&&r[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;const n=this._listeners[e];if(n!==void 0){const i=n.indexOf(t);i!==-1&&n.splice(i,1)}}dispatchEvent(e){if(this._listeners===void 0)return;const r=this._listeners[e.type];if(r!==void 0){e.target=this;const n=r.slice(0);for(let i=0,s=n.length;i<s;i++)n[i].call(this,e);e.target=null}}}const K=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let Ei=1234567;const Qt=Math.PI/180,or=180/Math.PI;function ve(){const c=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,r=Math.random()*4294967295|0;return(K[c&255]+K[c>>8&255]+K[c>>16&255]+K[c>>24&255]+"-"+K[e&255]+K[e>>8&255]+"-"+K[e>>16&15|64]+K[e>>24&255]+"-"+K[t&63|128]+K[t>>8&255]+"-"+K[t>>16&255]+K[t>>24&255]+K[r&255]+K[r>>8&255]+K[r>>16&255]+K[r>>24&255]).toLowerCase()}function Z(c,e,t){return Math.max(e,Math.min(t,c))}function Hn(c,e){return(c%e+e)%e}function ra(c,e,t,r,n){return r+(c-e)*(n-r)/(t-e)}function na(c,e,t){return c!==e?(t-c)/(e-c):0}function er(c,e,t){return(1-t)*c+t*e}function ia(c,e,t,r){return er(c,e,1-Math.exp(-t*r))}function sa(c,e=1){return e-Math.abs(Hn(c,e*2)-e)}function oa(c,e,t){return c<=e?0:c>=t?1:(c=(c-e)/(t-e),c*c*(3-2*c))}function aa(c,e,t){return c<=e?0:c>=t?1:(c=(c-e)/(t-e),c*c*c*(c*(c*6-15)+10))}function la(c,e){return c+Math.floor(Math.random()*(e-c+1))}function ha(c,e){return c+Math.random()*(e-c)}function ca(c){return c*(.5-Math.random())}function ua(c){c!==void 0&&(Ei=c);let e=Ei+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function da(c){return c*Qt}function fa(c){return c*or}function pa(c){return(c&c-1)===0&&c!==0}function ma(c){return Math.pow(2,Math.ceil(Math.log(c)/Math.LN2))}function ya(c){return Math.pow(2,Math.floor(Math.log(c)/Math.LN2))}function ga(c,e,t,r,n){const i=Math.cos,s=Math.sin,o=i(t/2),a=s(t/2),l=i((e+r)/2),h=s((e+r)/2),u=i((e-r)/2),d=s((e-r)/2),f=i((r-e)/2),p=s((r-e)/2);switch(n){case"XYX":c.set(o*h,a*u,a*d,o*l);break;case"YZY":c.set(a*d,o*h,a*u,o*l);break;case"ZXZ":c.set(a*u,a*d,o*h,o*l);break;case"XZX":c.set(o*h,a*p,a*f,o*l);break;case"YXY":c.set(a*f,o*h,a*p,o*l);break;case"ZYZ":c.set(a*p,a*f,o*h,o*l);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+n)}}function be(c,e){switch(e.constructor){case Float32Array:return c;case Uint32Array:return c/4294967295;case Uint16Array:return c/65535;case Uint8Array:return c/255;case Int32Array:return Math.max(c/2147483647,-1);case Int16Array:return Math.max(c/32767,-1);case Int8Array:return Math.max(c/127,-1);default:throw new Error("Invalid component type.")}}function O(c,e){switch(e.constructor){case Float32Array:return c;case Uint32Array:return Math.round(c*4294967295);case Uint16Array:return Math.round(c*65535);case Uint8Array:return Math.round(c*255);case Int32Array:return Math.round(c*2147483647);case Int16Array:return Math.round(c*32767);case Int8Array:return Math.round(c*127);default:throw new Error("Invalid component type.")}}const Bs={DEG2RAD:Qt,RAD2DEG:or,generateUUID:ve,clamp:Z,euclideanModulo:Hn,mapLinear:ra,inverseLerp:na,lerp:er,damp:ia,pingpong:sa,smoothstep:oa,smootherstep:aa,randInt:la,randFloat:ha,randFloatSpread:ca,seededRandom:ua,degToRad:da,radToDeg:fa,isPowerOfTwo:pa,ceilPowerOfTwo:ma,floorPowerOfTwo:ya,setQuaternionFromProperEuler:ga,normalize:O,denormalize:be};class k{constructor(e=0,t=0){k.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,r=this.y,n=e.elements;return this.x=n[0]*t+n[3]*r+n[6],this.y=n[1]*t+n[4]*r+n[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this}clampLength(e,t){const r=this.length();return this.divideScalar(r||1).multiplyScalar(Math.max(e,Math.min(t,r)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const r=this.dot(e)/t;return Math.acos(Z(r,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,r=this.y-e.y;return t*t+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,r){return this.x=e.x+(t.x-e.x)*r,this.y=e.y+(t.y-e.y)*r,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const r=Math.cos(t),n=Math.sin(t),i=this.x-e.x,s=this.y-e.y;return this.x=i*r-s*n+e.x,this.y=i*n+s*r+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Ge{constructor(e,t,r,n,i,s,o,a,l){Ge.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,r,n,i,s,o,a,l)}set(e,t,r,n,i,s,o,a,l){const h=this.elements;return h[0]=e,h[1]=n,h[2]=o,h[3]=t,h[4]=i,h[5]=a,h[6]=r,h[7]=s,h[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,r=e.elements;return t[0]=r[0],t[1]=r[1],t[2]=r[2],t[3]=r[3],t[4]=r[4],t[5]=r[5],t[6]=r[6],t[7]=r[7],t[8]=r[8],this}extractBasis(e,t,r){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),r.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const r=e.elements,n=t.elements,i=this.elements,s=r[0],o=r[3],a=r[6],l=r[1],h=r[4],u=r[7],d=r[2],f=r[5],p=r[8],g=n[0],m=n[3],w=n[6],_=n[1],A=n[4],S=n[7],C=n[2],R=n[5],M=n[8];return i[0]=s*g+o*_+a*C,i[3]=s*m+o*A+a*R,i[6]=s*w+o*S+a*M,i[1]=l*g+h*_+u*C,i[4]=l*m+h*A+u*R,i[7]=l*w+h*S+u*M,i[2]=d*g+f*_+p*C,i[5]=d*m+f*A+p*R,i[8]=d*w+f*S+p*M,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],r=e[1],n=e[2],i=e[3],s=e[4],o=e[5],a=e[6],l=e[7],h=e[8];return t*s*h-t*o*l-r*i*h+r*o*a+n*i*l-n*s*a}invert(){const e=this.elements,t=e[0],r=e[1],n=e[2],i=e[3],s=e[4],o=e[5],a=e[6],l=e[7],h=e[8],u=h*s-o*l,d=o*a-h*i,f=l*i-s*a,p=t*u+r*d+n*f;if(p===0)return this.set(0,0,0,0,0,0,0,0,0);const g=1/p;return e[0]=u*g,e[1]=(n*l-h*r)*g,e[2]=(o*r-n*s)*g,e[3]=d*g,e[4]=(h*t-n*a)*g,e[5]=(n*i-o*t)*g,e[6]=f*g,e[7]=(r*a-l*t)*g,e[8]=(s*t-r*i)*g,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,r,n,i,s,o){const a=Math.cos(i),l=Math.sin(i);return this.set(r*a,r*l,-r*(a*s+l*o)+s+e,-n*l,n*a,-n*(-l*s+a*o)+o+t,0,0,1),this}scale(e,t){return this.premultiply(Kr.makeScale(e,t)),this}rotate(e){return this.premultiply(Kr.makeRotation(-e)),this}translate(e,t){return this.premultiply(Kr.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),r=Math.sin(e);return this.set(t,-r,0,r,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,r=e.elements;for(let n=0;n<9;n++)if(t[n]!==r[n])return!1;return!0}fromArray(e,t=0){for(let r=0;r<9;r++)this.elements[r]=e[r+t];return this}toArray(e=[],t=0){const r=this.elements;return e[t]=r[0],e[t+1]=r[1],e[t+2]=r[2],e[t+3]=r[3],e[t+4]=r[4],e[t+5]=r[5],e[t+6]=r[6],e[t+7]=r[7],e[t+8]=r[8],e}clone(){return new this.constructor().fromArray(this.elements)}}const Kr=new Ge;function xa(c){for(let e=c.length-1;e>=0;--e)if(c[e]>=65535)return!0;return!1}function Pn(c){return document.createElementNS("http://www.w3.org/1999/xhtml",c)}const Ri={};function zs(c){c in Ri||(Ri[c]=!0,console.warn(c))}const Bi=new Ge().set(.8224621,.177538,0,.0331941,.9668058,0,.0170827,.0723974,.9105199),zi=new Ge().set(1.2249401,-.2249404,0,-.0420569,1.0420571,0,-.0196376,-.0786361,1.0982735),dr={[ae]:{transfer:Rn,primaries:Mi,toReference:c=>c,fromReference:c=>c},[te]:{transfer:Si,primaries:Mi,toReference:c=>c.convertSRGBToLinear(),fromReference:c=>c.convertLinearToSRGB()},[Rs]:{transfer:Rn,primaries:Ci,toReference:c=>c.applyMatrix3(zi),fromReference:c=>c.applyMatrix3(Bi)},[ea]:{transfer:Si,primaries:Ci,toReference:c=>c.convertSRGBToLinear().applyMatrix3(zi),fromReference:c=>c.applyMatrix3(Bi).convertLinearToSRGB()}},ba=new Set([ae,Rs]),se={enabled:!0,_workingColorSpace:ae,get workingColorSpace(){return this._workingColorSpace},set workingColorSpace(c){if(!ba.has(c))throw new Error(`Unsupported working color space, "${c}".`);this._workingColorSpace=c},convert:function(c,e,t){if(this.enabled===!1||e===t||!e||!t)return c;const r=dr[e].toReference,n=dr[t].fromReference;return n(r(c))},fromWorkingColorSpace:function(c,e){return this.convert(c,this._workingColorSpace,e)},toWorkingColorSpace:function(c,e){return this.convert(c,e,this._workingColorSpace)},getPrimaries:function(c){return dr[c].primaries},getTransfer:function(c){return c===Es?Rn:dr[c].transfer}};function zt(c){return c<.04045?c*.0773993808:Math.pow(c*.9478672986+.0521327014,2.4)}function Jr(c){return c<.0031308?c*12.92:1.055*Math.pow(c,.41666)-.055}let xt;class va{static getDataURL(e){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let t;if(e instanceof HTMLCanvasElement)t=e;else{xt===void 0&&(xt=Pn("canvas")),xt.width=e.width,xt.height=e.height;const r=xt.getContext("2d");e instanceof ImageData?r.putImageData(e,0,0):r.drawImage(e,0,0,e.width,e.height),t=xt}return t.width>2048||t.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",e),t.toDataURL("image/jpeg",.6)):t.toDataURL("image/png")}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=Pn("canvas");t.width=e.width,t.height=e.height;const r=t.getContext("2d");r.drawImage(e,0,0,e.width,e.height);const n=r.getImageData(0,0,e.width,e.height),i=n.data;for(let s=0;s<i.length;s++)i[s]=zt(i[s]/255)*255;return r.putImageData(n,0,0),t}else if(e.data){const t=e.data.slice(0);for(let r=0;r<t.length;r++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[r]=Math.floor(zt(t[r]/255)*255):t[r]=zt(t[r]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let wa=0;class Ia{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:wa++}),this.uuid=ve(),this.data=e,this.dataReady=!0,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const r={uuid:this.uuid,url:""},n=this.data;if(n!==null){let i;if(Array.isArray(n)){i=[];for(let s=0,o=n.length;s<o;s++)n[s].isDataTexture?i.push(Qr(n[s].image)):i.push(Qr(n[s]))}else i=Qr(n);r.url=i}return t||(e.images[this.uuid]=r),r}}function Qr(c){return typeof HTMLImageElement<"u"&&c instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&c instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&c instanceof ImageBitmap?va.getDataURL(c):c.data?{data:Array.from(c.data),width:c.width,height:c.height,type:c.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let _a=0;class fe extends lr{constructor(e=fe.DEFAULT_IMAGE,t=fe.DEFAULT_MAPPING,r=Kt,n=Kt,i=Fn,s=Nn,o=Cs,a=$o,l=fe.DEFAULT_ANISOTROPY,h=Es){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:_a++}),this.uuid=ve(),this.name="",this.source=new Ia(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=r,this.wrapT=n,this.magFilter=i,this.minFilter=s,this.anisotropy=l,this.format=o,this.internalFormat=null,this.type=a,this.offset=new k(0,0),this.repeat=new k(1,1),this.center=new k(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Ge,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.needsPMREMUpdate=!1}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const r={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(r.userData=this.userData),t||(e.textures[this.uuid]=r),r}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==Ms)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case nr:e.x=e.x-Math.floor(e.x);break;case Kt:e.x=e.x<0?0:1;break;case Tn:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case nr:e.y=e.y-Math.floor(e.y);break;case Kt:e.y=e.y<0?0:1;break;case Tn:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}}fe.DEFAULT_IMAGE=null;fe.DEFAULT_MAPPING=Ms;fe.DEFAULT_ANISOTROPY=1;class de{constructor(e=0,t=0,r=0,n=1){de.prototype.isVector4=!0,this.x=e,this.y=t,this.z=r,this.w=n}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,r,n){return this.x=e,this.y=t,this.z=r,this.w=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,r=this.y,n=this.z,i=this.w,s=e.elements;return this.x=s[0]*t+s[4]*r+s[8]*n+s[12]*i,this.y=s[1]*t+s[5]*r+s[9]*n+s[13]*i,this.z=s[2]*t+s[6]*r+s[10]*n+s[14]*i,this.w=s[3]*t+s[7]*r+s[11]*n+s[15]*i,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,r,n,i;const a=e.elements,l=a[0],h=a[4],u=a[8],d=a[1],f=a[5],p=a[9],g=a[2],m=a[6],w=a[10];if(Math.abs(h-d)<.01&&Math.abs(u-g)<.01&&Math.abs(p-m)<.01){if(Math.abs(h+d)<.1&&Math.abs(u+g)<.1&&Math.abs(p+m)<.1&&Math.abs(l+f+w-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const A=(l+1)/2,S=(f+1)/2,C=(w+1)/2,R=(h+d)/4,M=(u+g)/4,E=(p+m)/4;return A>S&&A>C?A<.01?(r=0,n=.707106781,i=.707106781):(r=Math.sqrt(A),n=R/r,i=M/r):S>C?S<.01?(r=.707106781,n=0,i=.707106781):(n=Math.sqrt(S),r=R/n,i=E/n):C<.01?(r=.707106781,n=.707106781,i=0):(i=Math.sqrt(C),r=M/i,n=E/i),this.set(r,n,i,t),this}let _=Math.sqrt((m-p)*(m-p)+(u-g)*(u-g)+(d-h)*(d-h));return Math.abs(_)<.001&&(_=1),this.x=(m-p)/_,this.y=(u-g)/_,this.z=(d-h)/_,this.w=Math.acos((l+f+w-1)/2),this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this.w=Math.max(e.w,Math.min(t.w,this.w)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this.w=Math.max(e,Math.min(t,this.w)),this}clampLength(e,t){const r=this.length();return this.divideScalar(r||1).multiplyScalar(Math.max(e,Math.min(t,r)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,r){return this.x=e.x+(t.x-e.x)*r,this.y=e.y+(t.y-e.y)*r,this.z=e.z+(t.z-e.z)*r,this.w=e.w+(t.w-e.w)*r,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class Me{constructor(e=0,t=0,r=0,n=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=r,this._w=n}static slerpFlat(e,t,r,n,i,s,o){let a=r[n+0],l=r[n+1],h=r[n+2],u=r[n+3];const d=i[s+0],f=i[s+1],p=i[s+2],g=i[s+3];if(o===0){e[t+0]=a,e[t+1]=l,e[t+2]=h,e[t+3]=u;return}if(o===1){e[t+0]=d,e[t+1]=f,e[t+2]=p,e[t+3]=g;return}if(u!==g||a!==d||l!==f||h!==p){let m=1-o;const w=a*d+l*f+h*p+u*g,_=w>=0?1:-1,A=1-w*w;if(A>Number.EPSILON){const C=Math.sqrt(A),R=Math.atan2(C,w*_);m=Math.sin(m*R)/C,o=Math.sin(o*R)/C}const S=o*_;if(a=a*m+d*S,l=l*m+f*S,h=h*m+p*S,u=u*m+g*S,m===1-o){const C=1/Math.sqrt(a*a+l*l+h*h+u*u);a*=C,l*=C,h*=C,u*=C}}e[t]=a,e[t+1]=l,e[t+2]=h,e[t+3]=u}static multiplyQuaternionsFlat(e,t,r,n,i,s){const o=r[n],a=r[n+1],l=r[n+2],h=r[n+3],u=i[s],d=i[s+1],f=i[s+2],p=i[s+3];return e[t]=o*p+h*u+a*f-l*d,e[t+1]=a*p+h*d+l*u-o*f,e[t+2]=l*p+h*f+o*d-a*u,e[t+3]=h*p-o*u-a*d-l*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,r,n){return this._x=e,this._y=t,this._z=r,this._w=n,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const r=e._x,n=e._y,i=e._z,s=e._order,o=Math.cos,a=Math.sin,l=o(r/2),h=o(n/2),u=o(i/2),d=a(r/2),f=a(n/2),p=a(i/2);switch(s){case"XYZ":this._x=d*h*u+l*f*p,this._y=l*f*u-d*h*p,this._z=l*h*p+d*f*u,this._w=l*h*u-d*f*p;break;case"YXZ":this._x=d*h*u+l*f*p,this._y=l*f*u-d*h*p,this._z=l*h*p-d*f*u,this._w=l*h*u+d*f*p;break;case"ZXY":this._x=d*h*u-l*f*p,this._y=l*f*u+d*h*p,this._z=l*h*p+d*f*u,this._w=l*h*u-d*f*p;break;case"ZYX":this._x=d*h*u-l*f*p,this._y=l*f*u+d*h*p,this._z=l*h*p-d*f*u,this._w=l*h*u+d*f*p;break;case"YZX":this._x=d*h*u+l*f*p,this._y=l*f*u+d*h*p,this._z=l*h*p-d*f*u,this._w=l*h*u-d*f*p;break;case"XZY":this._x=d*h*u-l*f*p,this._y=l*f*u-d*h*p,this._z=l*h*p+d*f*u,this._w=l*h*u+d*f*p;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+s)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const r=t/2,n=Math.sin(r);return this._x=e.x*n,this._y=e.y*n,this._z=e.z*n,this._w=Math.cos(r),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,r=t[0],n=t[4],i=t[8],s=t[1],o=t[5],a=t[9],l=t[2],h=t[6],u=t[10],d=r+o+u;if(d>0){const f=.5/Math.sqrt(d+1);this._w=.25/f,this._x=(h-a)*f,this._y=(i-l)*f,this._z=(s-n)*f}else if(r>o&&r>u){const f=2*Math.sqrt(1+r-o-u);this._w=(h-a)/f,this._x=.25*f,this._y=(n+s)/f,this._z=(i+l)/f}else if(o>u){const f=2*Math.sqrt(1+o-r-u);this._w=(i-l)/f,this._x=(n+s)/f,this._y=.25*f,this._z=(a+h)/f}else{const f=2*Math.sqrt(1+u-r-o);this._w=(s-n)/f,this._x=(i+l)/f,this._y=(a+h)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let r=e.dot(t)+1;return r<Number.EPSILON?(r=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=r):(this._x=0,this._y=-e.z,this._z=e.y,this._w=r)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=r),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Z(this.dot(e),-1,1)))}rotateTowards(e,t){const r=this.angleTo(e);if(r===0)return this;const n=Math.min(1,t/r);return this.slerp(e,n),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const r=e._x,n=e._y,i=e._z,s=e._w,o=t._x,a=t._y,l=t._z,h=t._w;return this._x=r*h+s*o+n*l-i*a,this._y=n*h+s*a+i*o-r*l,this._z=i*h+s*l+r*a-n*o,this._w=s*h-r*o-n*a-i*l,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);const r=this._x,n=this._y,i=this._z,s=this._w;let o=s*e._w+r*e._x+n*e._y+i*e._z;if(o<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,o=-o):this.copy(e),o>=1)return this._w=s,this._x=r,this._y=n,this._z=i,this;const a=1-o*o;if(a<=Number.EPSILON){const f=1-t;return this._w=f*s+t*this._w,this._x=f*r+t*this._x,this._y=f*n+t*this._y,this._z=f*i+t*this._z,this.normalize(),this}const l=Math.sqrt(a),h=Math.atan2(l,o),u=Math.sin((1-t)*h)/l,d=Math.sin(t*h)/l;return this._w=s*u+this._w*d,this._x=r*u+this._x*d,this._y=n*u+this._y*d,this._z=i*u+this._z*d,this._onChangeCallback(),this}slerpQuaternions(e,t,r){return this.copy(e).slerp(t,r)}random(){const e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),r=Math.random(),n=Math.sqrt(1-r),i=Math.sqrt(r);return this.set(n*Math.sin(e),n*Math.cos(e),i*Math.sin(t),i*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class v{constructor(e=0,t=0,r=0){v.prototype.isVector3=!0,this.x=e,this.y=t,this.z=r}set(e,t,r){return r===void 0&&(r=this.z),this.x=e,this.y=t,this.z=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Pi.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Pi.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,r=this.y,n=this.z,i=e.elements;return this.x=i[0]*t+i[3]*r+i[6]*n,this.y=i[1]*t+i[4]*r+i[7]*n,this.z=i[2]*t+i[5]*r+i[8]*n,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,r=this.y,n=this.z,i=e.elements,s=1/(i[3]*t+i[7]*r+i[11]*n+i[15]);return this.x=(i[0]*t+i[4]*r+i[8]*n+i[12])*s,this.y=(i[1]*t+i[5]*r+i[9]*n+i[13])*s,this.z=(i[2]*t+i[6]*r+i[10]*n+i[14])*s,this}applyQuaternion(e){const t=this.x,r=this.y,n=this.z,i=e.x,s=e.y,o=e.z,a=e.w,l=2*(s*n-o*r),h=2*(o*t-i*n),u=2*(i*r-s*t);return this.x=t+a*l+s*u-o*h,this.y=r+a*h+o*l-i*u,this.z=n+a*u+i*h-s*l,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,r=this.y,n=this.z,i=e.elements;return this.x=i[0]*t+i[4]*r+i[8]*n,this.y=i[1]*t+i[5]*r+i[9]*n,this.z=i[2]*t+i[6]*r+i[10]*n,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this}clampLength(e,t){const r=this.length();return this.divideScalar(r||1).multiplyScalar(Math.max(e,Math.min(t,r)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,r){return this.x=e.x+(t.x-e.x)*r,this.y=e.y+(t.y-e.y)*r,this.z=e.z+(t.z-e.z)*r,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const r=e.x,n=e.y,i=e.z,s=t.x,o=t.y,a=t.z;return this.x=n*a-i*o,this.y=i*s-r*a,this.z=r*o-n*s,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const r=e.dot(this)/t;return this.copy(e).multiplyScalar(r)}projectOnPlane(e){return en.copy(this).projectOnVector(e),this.sub(en)}reflect(e){return this.sub(en.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const r=this.dot(e)/t;return Math.acos(Z(r,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,r=this.y-e.y,n=this.z-e.z;return t*t+r*r+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,r){const n=Math.sin(t)*e;return this.x=n*Math.sin(r),this.y=Math.cos(t)*e,this.z=n*Math.cos(r),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,r){return this.x=e*Math.sin(t),this.y=r,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),r=this.setFromMatrixColumn(e,1).length(),n=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=r,this.z=n,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=Math.random()*Math.PI*2,t=Math.random()*2-1,r=Math.sqrt(1-t*t);return this.x=r*Math.cos(e),this.y=t,this.z=r*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const en=new v,Pi=new Me;class Fe{constructor(e=new v(1/0,1/0,1/0),t=new v(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,r=e.length;t<r;t+=3)this.expandByPoint(ye.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,r=e.count;t<r;t++)this.expandByPoint(ye.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,r=e.length;t<r;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const r=ye.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(r),this.max.copy(e).add(r),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const r=e.geometry;if(r!==void 0){const i=r.getAttribute("position");if(t===!0&&i!==void 0&&e.isInstancedMesh!==!0)for(let s=0,o=i.count;s<o;s++)e.isMesh===!0?e.getVertexPosition(s,ye):ye.fromBufferAttribute(i,s),ye.applyMatrix4(e.matrixWorld),this.expandByPoint(ye);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),fr.copy(e.boundingBox)):(r.boundingBox===null&&r.computeBoundingBox(),fr.copy(r.boundingBox)),fr.applyMatrix4(e.matrixWorld),this.union(fr)}const n=e.children;for(let i=0,s=n.length;i<s;i++)this.expandByObject(n[i],t);return this}containsPoint(e){return!(e.x<this.min.x||e.x>this.max.x||e.y<this.min.y||e.y>this.max.y||e.z<this.min.z||e.z>this.max.z)}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return!(e.max.x<this.min.x||e.min.x>this.max.x||e.max.y<this.min.y||e.min.y>this.max.y||e.max.z<this.min.z||e.min.z>this.max.z)}intersectsSphere(e){return this.clampPoint(e.center,ye),ye.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,r;return e.normal.x>0?(t=e.normal.x*this.min.x,r=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,r=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,r+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,r+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,r+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,r+=e.normal.z*this.min.z),t<=-e.constant&&r>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Vt),pr.subVectors(this.max,Vt),bt.subVectors(e.a,Vt),vt.subVectors(e.b,Vt),wt.subVectors(e.c,Vt),We.subVectors(vt,bt),qe.subVectors(wt,vt),it.subVectors(bt,wt);let t=[0,-We.z,We.y,0,-qe.z,qe.y,0,-it.z,it.y,We.z,0,-We.x,qe.z,0,-qe.x,it.z,0,-it.x,-We.y,We.x,0,-qe.y,qe.x,0,-it.y,it.x,0];return!tn(t,bt,vt,wt,pr)||(t=[1,0,0,0,1,0,0,0,1],!tn(t,bt,vt,wt,pr))?!1:(mr.crossVectors(We,qe),t=[mr.x,mr.y,mr.z],tn(t,bt,vt,wt,pr))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,ye).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(ye).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Be[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Be[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Be[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Be[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Be[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Be[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Be[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Be[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Be),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}}const Be=[new v,new v,new v,new v,new v,new v,new v,new v],ye=new v,fr=new Fe,bt=new v,vt=new v,wt=new v,We=new v,qe=new v,it=new v,Vt=new v,pr=new v,mr=new v,st=new v;function tn(c,e,t,r,n){for(let i=0,s=c.length-3;i<=s;i+=3){st.fromArray(c,i);const o=n.x*Math.abs(st.x)+n.y*Math.abs(st.y)+n.z*Math.abs(st.z),a=e.dot(st),l=t.dot(st),h=r.dot(st);if(Math.max(-Math.max(a,l,h),Math.min(a,l,h))>o)return!1}return!0}const Aa=new Fe,jt=new v,rn=new v;class we{constructor(e=new v,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const r=this.center;t!==void 0?r.copy(t):Aa.setFromPoints(e).getCenter(r);let n=0;for(let i=0,s=e.length;i<s;i++)n=Math.max(n,r.distanceToSquared(e[i]));return this.radius=Math.sqrt(n),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const r=this.center.distanceToSquared(e);return t.copy(e),r>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;jt.subVectors(e,this.center);const t=jt.lengthSq();if(t>this.radius*this.radius){const r=Math.sqrt(t),n=(r-this.radius)*.5;this.center.addScaledVector(jt,n/r),this.radius+=n}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(rn.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(jt.copy(e.center).add(rn)),this.expandByPoint(jt.copy(e.center).sub(rn))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}}const ze=new v,nn=new v,yr=new v,$e=new v,sn=new v,gr=new v,on=new v;class hr{constructor(e=new v,t=new v(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,ze)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const r=t.dot(this.direction);return r<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,r)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=ze.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(ze.copy(this.origin).addScaledVector(this.direction,t),ze.distanceToSquared(e))}distanceSqToSegment(e,t,r,n){nn.copy(e).add(t).multiplyScalar(.5),yr.copy(t).sub(e).normalize(),$e.copy(this.origin).sub(nn);const i=e.distanceTo(t)*.5,s=-this.direction.dot(yr),o=$e.dot(this.direction),a=-$e.dot(yr),l=$e.lengthSq(),h=Math.abs(1-s*s);let u,d,f,p;if(h>0)if(u=s*a-o,d=s*o-a,p=i*h,u>=0)if(d>=-p)if(d<=p){const g=1/h;u*=g,d*=g,f=u*(u+s*d+2*o)+d*(s*u+d+2*a)+l}else d=i,u=Math.max(0,-(s*d+o)),f=-u*u+d*(d+2*a)+l;else d=-i,u=Math.max(0,-(s*d+o)),f=-u*u+d*(d+2*a)+l;else d<=-p?(u=Math.max(0,-(-s*i+o)),d=u>0?-i:Math.min(Math.max(-i,-a),i),f=-u*u+d*(d+2*a)+l):d<=p?(u=0,d=Math.min(Math.max(-i,-a),i),f=d*(d+2*a)+l):(u=Math.max(0,-(s*i+o)),d=u>0?i:Math.min(Math.max(-i,-a),i),f=-u*u+d*(d+2*a)+l);else d=s>0?-i:i,u=Math.max(0,-(s*d+o)),f=-u*u+d*(d+2*a)+l;return r&&r.copy(this.origin).addScaledVector(this.direction,u),n&&n.copy(nn).addScaledVector(yr,d),f}intersectSphere(e,t){ze.subVectors(e.center,this.origin);const r=ze.dot(this.direction),n=ze.dot(ze)-r*r,i=e.radius*e.radius;if(n>i)return null;const s=Math.sqrt(i-n),o=r-s,a=r+s;return a<0?null:o<0?this.at(a,t):this.at(o,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const r=-(this.origin.dot(e.normal)+e.constant)/t;return r>=0?r:null}intersectPlane(e,t){const r=this.distanceToPlane(e);return r===null?null:this.at(r,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let r,n,i,s,o,a;const l=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,d=this.origin;return l>=0?(r=(e.min.x-d.x)*l,n=(e.max.x-d.x)*l):(r=(e.max.x-d.x)*l,n=(e.min.x-d.x)*l),h>=0?(i=(e.min.y-d.y)*h,s=(e.max.y-d.y)*h):(i=(e.max.y-d.y)*h,s=(e.min.y-d.y)*h),r>s||i>n||((i>r||isNaN(r))&&(r=i),(s<n||isNaN(n))&&(n=s),u>=0?(o=(e.min.z-d.z)*u,a=(e.max.z-d.z)*u):(o=(e.max.z-d.z)*u,a=(e.min.z-d.z)*u),r>a||o>n)||((o>r||r!==r)&&(r=o),(a<n||n!==n)&&(n=a),n<0)?null:this.at(r>=0?r:n,t)}intersectsBox(e){return this.intersectBox(e,ze)!==null}intersectTriangle(e,t,r,n,i){sn.subVectors(t,e),gr.subVectors(r,e),on.crossVectors(sn,gr);let s=this.direction.dot(on),o;if(s>0){if(n)return null;o=1}else if(s<0)o=-1,s=-s;else return null;$e.subVectors(this.origin,e);const a=o*this.direction.dot(gr.crossVectors($e,gr));if(a<0)return null;const l=o*this.direction.dot(sn.cross($e));if(l<0||a+l>s)return null;const h=-o*$e.dot(on);return h<0?null:this.at(h/s,i)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class B{constructor(e,t,r,n,i,s,o,a,l,h,u,d,f,p,g,m){B.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,r,n,i,s,o,a,l,h,u,d,f,p,g,m)}set(e,t,r,n,i,s,o,a,l,h,u,d,f,p,g,m){const w=this.elements;return w[0]=e,w[4]=t,w[8]=r,w[12]=n,w[1]=i,w[5]=s,w[9]=o,w[13]=a,w[2]=l,w[6]=h,w[10]=u,w[14]=d,w[3]=f,w[7]=p,w[11]=g,w[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new B().fromArray(this.elements)}copy(e){const t=this.elements,r=e.elements;return t[0]=r[0],t[1]=r[1],t[2]=r[2],t[3]=r[3],t[4]=r[4],t[5]=r[5],t[6]=r[6],t[7]=r[7],t[8]=r[8],t[9]=r[9],t[10]=r[10],t[11]=r[11],t[12]=r[12],t[13]=r[13],t[14]=r[14],t[15]=r[15],this}copyPosition(e){const t=this.elements,r=e.elements;return t[12]=r[12],t[13]=r[13],t[14]=r[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,r){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),r.setFromMatrixColumn(this,2),this}makeBasis(e,t,r){return this.set(e.x,t.x,r.x,0,e.y,t.y,r.y,0,e.z,t.z,r.z,0,0,0,0,1),this}extractRotation(e){const t=this.elements,r=e.elements,n=1/It.setFromMatrixColumn(e,0).length(),i=1/It.setFromMatrixColumn(e,1).length(),s=1/It.setFromMatrixColumn(e,2).length();return t[0]=r[0]*n,t[1]=r[1]*n,t[2]=r[2]*n,t[3]=0,t[4]=r[4]*i,t[5]=r[5]*i,t[6]=r[6]*i,t[7]=0,t[8]=r[8]*s,t[9]=r[9]*s,t[10]=r[10]*s,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,r=e.x,n=e.y,i=e.z,s=Math.cos(r),o=Math.sin(r),a=Math.cos(n),l=Math.sin(n),h=Math.cos(i),u=Math.sin(i);if(e.order==="XYZ"){const d=s*h,f=s*u,p=o*h,g=o*u;t[0]=a*h,t[4]=-a*u,t[8]=l,t[1]=f+p*l,t[5]=d-g*l,t[9]=-o*a,t[2]=g-d*l,t[6]=p+f*l,t[10]=s*a}else if(e.order==="YXZ"){const d=a*h,f=a*u,p=l*h,g=l*u;t[0]=d+g*o,t[4]=p*o-f,t[8]=s*l,t[1]=s*u,t[5]=s*h,t[9]=-o,t[2]=f*o-p,t[6]=g+d*o,t[10]=s*a}else if(e.order==="ZXY"){const d=a*h,f=a*u,p=l*h,g=l*u;t[0]=d-g*o,t[4]=-s*u,t[8]=p+f*o,t[1]=f+p*o,t[5]=s*h,t[9]=g-d*o,t[2]=-s*l,t[6]=o,t[10]=s*a}else if(e.order==="ZYX"){const d=s*h,f=s*u,p=o*h,g=o*u;t[0]=a*h,t[4]=p*l-f,t[8]=d*l+g,t[1]=a*u,t[5]=g*l+d,t[9]=f*l-p,t[2]=-l,t[6]=o*a,t[10]=s*a}else if(e.order==="YZX"){const d=s*a,f=s*l,p=o*a,g=o*l;t[0]=a*h,t[4]=g-d*u,t[8]=p*u+f,t[1]=u,t[5]=s*h,t[9]=-o*h,t[2]=-l*h,t[6]=f*u+p,t[10]=d-g*u}else if(e.order==="XZY"){const d=s*a,f=s*l,p=o*a,g=o*l;t[0]=a*h,t[4]=-u,t[8]=l*h,t[1]=d*u+g,t[5]=s*h,t[9]=f*u-p,t[2]=p*u-f,t[6]=o*h,t[10]=g*u+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Sa,e,Ma)}lookAt(e,t,r){const n=this.elements;return ne.subVectors(e,t),ne.lengthSq()===0&&(ne.z=1),ne.normalize(),Ye.crossVectors(r,ne),Ye.lengthSq()===0&&(Math.abs(r.z)===1?ne.x+=1e-4:ne.z+=1e-4,ne.normalize(),Ye.crossVectors(r,ne)),Ye.normalize(),xr.crossVectors(ne,Ye),n[0]=Ye.x,n[4]=xr.x,n[8]=ne.x,n[1]=Ye.y,n[5]=xr.y,n[9]=ne.y,n[2]=Ye.z,n[6]=xr.z,n[10]=ne.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const r=e.elements,n=t.elements,i=this.elements,s=r[0],o=r[4],a=r[8],l=r[12],h=r[1],u=r[5],d=r[9],f=r[13],p=r[2],g=r[6],m=r[10],w=r[14],_=r[3],A=r[7],S=r[11],C=r[15],R=n[0],M=n[4],E=n[8],D=n[12],V=n[1],j=n[5],re=n[9],W=n[13],pe=n[2],tt=n[6],me=n[10],Ue=n[14],rt=n[3],He=n[7],Ve=n[11],nt=n[15];return i[0]=s*R+o*V+a*pe+l*rt,i[4]=s*M+o*j+a*tt+l*He,i[8]=s*E+o*re+a*me+l*Ve,i[12]=s*D+o*W+a*Ue+l*nt,i[1]=h*R+u*V+d*pe+f*rt,i[5]=h*M+u*j+d*tt+f*He,i[9]=h*E+u*re+d*me+f*Ve,i[13]=h*D+u*W+d*Ue+f*nt,i[2]=p*R+g*V+m*pe+w*rt,i[6]=p*M+g*j+m*tt+w*He,i[10]=p*E+g*re+m*me+w*Ve,i[14]=p*D+g*W+m*Ue+w*nt,i[3]=_*R+A*V+S*pe+C*rt,i[7]=_*M+A*j+S*tt+C*He,i[11]=_*E+A*re+S*me+C*Ve,i[15]=_*D+A*W+S*Ue+C*nt,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],r=e[4],n=e[8],i=e[12],s=e[1],o=e[5],a=e[9],l=e[13],h=e[2],u=e[6],d=e[10],f=e[14],p=e[3],g=e[7],m=e[11],w=e[15];return p*(+i*a*u-n*l*u-i*o*d+r*l*d+n*o*f-r*a*f)+g*(+t*a*f-t*l*d+i*s*d-n*s*f+n*l*h-i*a*h)+m*(+t*l*u-t*o*f-i*s*u+r*s*f+i*o*h-r*l*h)+w*(-n*o*h-t*a*u+t*o*d+n*s*u-r*s*d+r*a*h)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,r){const n=this.elements;return e.isVector3?(n[12]=e.x,n[13]=e.y,n[14]=e.z):(n[12]=e,n[13]=t,n[14]=r),this}invert(){const e=this.elements,t=e[0],r=e[1],n=e[2],i=e[3],s=e[4],o=e[5],a=e[6],l=e[7],h=e[8],u=e[9],d=e[10],f=e[11],p=e[12],g=e[13],m=e[14],w=e[15],_=u*m*l-g*d*l+g*a*f-o*m*f-u*a*w+o*d*w,A=p*d*l-h*m*l-p*a*f+s*m*f+h*a*w-s*d*w,S=h*g*l-p*u*l+p*o*f-s*g*f-h*o*w+s*u*w,C=p*u*a-h*g*a-p*o*d+s*g*d+h*o*m-s*u*m,R=t*_+r*A+n*S+i*C;if(R===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const M=1/R;return e[0]=_*M,e[1]=(g*d*i-u*m*i-g*n*f+r*m*f+u*n*w-r*d*w)*M,e[2]=(o*m*i-g*a*i+g*n*l-r*m*l-o*n*w+r*a*w)*M,e[3]=(u*a*i-o*d*i-u*n*l+r*d*l+o*n*f-r*a*f)*M,e[4]=A*M,e[5]=(h*m*i-p*d*i+p*n*f-t*m*f-h*n*w+t*d*w)*M,e[6]=(p*a*i-s*m*i-p*n*l+t*m*l+s*n*w-t*a*w)*M,e[7]=(s*d*i-h*a*i+h*n*l-t*d*l-s*n*f+t*a*f)*M,e[8]=S*M,e[9]=(p*u*i-h*g*i-p*r*f+t*g*f+h*r*w-t*u*w)*M,e[10]=(s*g*i-p*o*i+p*r*l-t*g*l-s*r*w+t*o*w)*M,e[11]=(h*o*i-s*u*i-h*r*l+t*u*l+s*r*f-t*o*f)*M,e[12]=C*M,e[13]=(h*g*n-p*u*n+p*r*d-t*g*d-h*r*m+t*u*m)*M,e[14]=(p*o*n-s*g*n-p*r*a+t*g*a+s*r*m-t*o*m)*M,e[15]=(s*u*n-h*o*n+h*r*a-t*u*a-s*r*d+t*o*d)*M,this}scale(e){const t=this.elements,r=e.x,n=e.y,i=e.z;return t[0]*=r,t[4]*=n,t[8]*=i,t[1]*=r,t[5]*=n,t[9]*=i,t[2]*=r,t[6]*=n,t[10]*=i,t[3]*=r,t[7]*=n,t[11]*=i,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],r=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],n=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,r,n))}makeTranslation(e,t,r){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,r,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),r=Math.sin(e);return this.set(1,0,0,0,0,t,-r,0,0,r,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),r=Math.sin(e);return this.set(t,0,r,0,0,1,0,0,-r,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),r=Math.sin(e);return this.set(t,-r,0,0,r,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const r=Math.cos(t),n=Math.sin(t),i=1-r,s=e.x,o=e.y,a=e.z,l=i*s,h=i*o;return this.set(l*s+r,l*o-n*a,l*a+n*o,0,l*o+n*a,h*o+r,h*a-n*s,0,l*a-n*o,h*a+n*s,i*a*a+r,0,0,0,0,1),this}makeScale(e,t,r){return this.set(e,0,0,0,0,t,0,0,0,0,r,0,0,0,0,1),this}makeShear(e,t,r,n,i,s){return this.set(1,r,i,0,e,1,s,0,t,n,1,0,0,0,0,1),this}compose(e,t,r){const n=this.elements,i=t._x,s=t._y,o=t._z,a=t._w,l=i+i,h=s+s,u=o+o,d=i*l,f=i*h,p=i*u,g=s*h,m=s*u,w=o*u,_=a*l,A=a*h,S=a*u,C=r.x,R=r.y,M=r.z;return n[0]=(1-(g+w))*C,n[1]=(f+S)*C,n[2]=(p-A)*C,n[3]=0,n[4]=(f-S)*R,n[5]=(1-(d+w))*R,n[6]=(m+_)*R,n[7]=0,n[8]=(p+A)*M,n[9]=(m-_)*M,n[10]=(1-(d+g))*M,n[11]=0,n[12]=e.x,n[13]=e.y,n[14]=e.z,n[15]=1,this}decompose(e,t,r){const n=this.elements;let i=It.set(n[0],n[1],n[2]).length();const s=It.set(n[4],n[5],n[6]).length(),o=It.set(n[8],n[9],n[10]).length();this.determinant()<0&&(i=-i),e.x=n[12],e.y=n[13],e.z=n[14],ge.copy(this);const l=1/i,h=1/s,u=1/o;return ge.elements[0]*=l,ge.elements[1]*=l,ge.elements[2]*=l,ge.elements[4]*=h,ge.elements[5]*=h,ge.elements[6]*=h,ge.elements[8]*=u,ge.elements[9]*=u,ge.elements[10]*=u,t.setFromRotationMatrix(ge),r.x=i,r.y=s,r.z=o,this}makePerspective(e,t,r,n,i,s,o=ct){const a=this.elements,l=2*i/(t-e),h=2*i/(r-n),u=(t+e)/(t-e),d=(r+n)/(r-n);let f,p;if(o===ct)f=-(s+i)/(s-i),p=-2*s*i/(s-i);else if(o===zn)f=-s/(s-i),p=-s*i/(s-i);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return a[0]=l,a[4]=0,a[8]=u,a[12]=0,a[1]=0,a[5]=h,a[9]=d,a[13]=0,a[2]=0,a[6]=0,a[10]=f,a[14]=p,a[3]=0,a[7]=0,a[11]=-1,a[15]=0,this}makeOrthographic(e,t,r,n,i,s,o=ct){const a=this.elements,l=1/(t-e),h=1/(r-n),u=1/(s-i),d=(t+e)*l,f=(r+n)*h;let p,g;if(o===ct)p=(s+i)*u,g=-2*u;else if(o===zn)p=i*u,g=-1*u;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return a[0]=2*l,a[4]=0,a[8]=0,a[12]=-d,a[1]=0,a[5]=2*h,a[9]=0,a[13]=-f,a[2]=0,a[6]=0,a[10]=g,a[14]=-p,a[3]=0,a[7]=0,a[11]=0,a[15]=1,this}equals(e){const t=this.elements,r=e.elements;for(let n=0;n<16;n++)if(t[n]!==r[n])return!1;return!0}fromArray(e,t=0){for(let r=0;r<16;r++)this.elements[r]=e[r+t];return this}toArray(e=[],t=0){const r=this.elements;return e[t]=r[0],e[t+1]=r[1],e[t+2]=r[2],e[t+3]=r[3],e[t+4]=r[4],e[t+5]=r[5],e[t+6]=r[6],e[t+7]=r[7],e[t+8]=r[8],e[t+9]=r[9],e[t+10]=r[10],e[t+11]=r[11],e[t+12]=r[12],e[t+13]=r[13],e[t+14]=r[14],e[t+15]=r[15],e}}const It=new v,ge=new B,Sa=new v(0,0,0),Ma=new v(1,1,1),Ye=new v,xr=new v,ne=new v,ki=new B,Li=new Me;class Ot{constructor(e=0,t=0,r=0,n=Ot.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=r,this._order=n}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,r,n=this._order){return this._x=e,this._y=t,this._z=r,this._order=n,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,r=!0){const n=e.elements,i=n[0],s=n[4],o=n[8],a=n[1],l=n[5],h=n[9],u=n[2],d=n[6],f=n[10];switch(t){case"XYZ":this._y=Math.asin(Z(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,f),this._z=Math.atan2(-s,i)):(this._x=Math.atan2(d,l),this._z=0);break;case"YXZ":this._x=Math.asin(-Z(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,f),this._z=Math.atan2(a,l)):(this._y=Math.atan2(-u,i),this._z=0);break;case"ZXY":this._x=Math.asin(Z(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,f),this._z=Math.atan2(-s,l)):(this._y=0,this._z=Math.atan2(a,i));break;case"ZYX":this._y=Math.asin(-Z(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(a,i)):(this._x=0,this._z=Math.atan2(-s,l));break;case"YZX":this._z=Math.asin(Z(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-h,l),this._y=Math.atan2(-u,i)):(this._x=0,this._y=Math.atan2(o,f));break;case"XZY":this._z=Math.asin(-Z(s,-1,1)),Math.abs(s)<.9999999?(this._x=Math.atan2(d,l),this._y=Math.atan2(o,i)):(this._x=Math.atan2(-h,f),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,r===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,r){return ki.makeRotationFromQuaternion(e),this.setFromRotationMatrix(ki,t,r)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Li.setFromEuler(this),this.setFromQuaternion(Li,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}Ot.DEFAULT_ORDER="XYZ";class Ca{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let Ta=0;const Di=new v,_t=new Me,Pe=new B,br=new v,Wt=new v,Ea=new v,Ra=new Me,Oi=new v(1,0,0),Gi=new v(0,1,0),Fi=new v(0,0,1),Ba={type:"added"},za={type:"removed"},an={type:"childadded",child:null},ln={type:"childremoved",child:null};class q extends lr{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Ta++}),this.uuid=ve(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=q.DEFAULT_UP.clone();const e=new v,t=new Ot,r=new Me,n=new v(1,1,1);function i(){r.setFromEuler(t,!1)}function s(){t.setFromQuaternion(r,void 0,!1)}t._onChange(i),r._onChange(s),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:r},scale:{configurable:!0,enumerable:!0,value:n},modelViewMatrix:{value:new B},normalMatrix:{value:new Ge}}),this.matrix=new B,this.matrixWorld=new B,this.matrixAutoUpdate=q.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=q.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Ca,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return _t.setFromAxisAngle(e,t),this.quaternion.multiply(_t),this}rotateOnWorldAxis(e,t){return _t.setFromAxisAngle(e,t),this.quaternion.premultiply(_t),this}rotateX(e){return this.rotateOnAxis(Oi,e)}rotateY(e){return this.rotateOnAxis(Gi,e)}rotateZ(e){return this.rotateOnAxis(Fi,e)}translateOnAxis(e,t){return Di.copy(e).applyQuaternion(this.quaternion),this.position.add(Di.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Oi,e)}translateY(e){return this.translateOnAxis(Gi,e)}translateZ(e){return this.translateOnAxis(Fi,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Pe.copy(this.matrixWorld).invert())}lookAt(e,t,r){e.isVector3?br.copy(e):br.set(e,t,r);const n=this.parent;this.updateWorldMatrix(!0,!1),Wt.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Pe.lookAt(Wt,br,this.up):Pe.lookAt(br,Wt,this.up),this.quaternion.setFromRotationMatrix(Pe),n&&(Pe.extractRotation(n.matrixWorld),_t.setFromRotationMatrix(Pe),this.quaternion.premultiply(_t.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.parent!==null&&e.parent.remove(e),e.parent=this,this.children.push(e),e.dispatchEvent(Ba),an.child=e,this.dispatchEvent(an),an.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let r=0;r<arguments.length;r++)this.remove(arguments[r]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(za),ln.child=e,this.dispatchEvent(ln),ln.child=null),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Pe.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Pe.multiply(e.parent.matrixWorld)),e.applyMatrix4(Pe),this.add(e),e.updateWorldMatrix(!1,!0),this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let r=0,n=this.children.length;r<n;r++){const s=this.children[r].getObjectByProperty(e,t);if(s!==void 0)return s}}getObjectsByProperty(e,t,r=[]){this[e]===t&&r.push(this);const n=this.children;for(let i=0,s=n.length;i<s;i++)n[i].getObjectsByProperty(e,t,r);return r}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Wt,e,Ea),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Wt,Ra,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);const t=this.children;for(let r=0,n=t.length;r<n;r++)t[r].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let r=0,n=t.length;r<n;r++)t[r].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let r=0,n=t.length;r<n;r++){const i=t[r];(i.matrixWorldAutoUpdate===!0||e===!0)&&i.updateMatrixWorld(e)}}updateWorldMatrix(e,t){const r=this.parent;if(e===!0&&r!==null&&r.matrixWorldAutoUpdate===!0&&r.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),t===!0){const n=this.children;for(let i=0,s=n.length;i<s;i++){const o=n[i];o.matrixWorldAutoUpdate===!0&&o.updateWorldMatrix(!1,!0)}}}toJSON(e){const t=e===void 0||typeof e=="string",r={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},r.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const n={};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.castShadow===!0&&(n.castShadow=!0),this.receiveShadow===!0&&(n.receiveShadow=!0),this.visible===!1&&(n.visible=!1),this.frustumCulled===!1&&(n.frustumCulled=!1),this.renderOrder!==0&&(n.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(n.userData=this.userData),n.layers=this.layers.mask,n.matrix=this.matrix.toArray(),n.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(n.matrixAutoUpdate=!1),this.isInstancedMesh&&(n.type="InstancedMesh",n.count=this.count,n.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(n.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(n.type="BatchedMesh",n.perObjectFrustumCulled=this.perObjectFrustumCulled,n.sortObjects=this.sortObjects,n.drawRanges=this._drawRanges,n.reservedRanges=this._reservedRanges,n.visibility=this._visibility,n.active=this._active,n.bounds=this._bounds.map(o=>({boxInitialized:o.boxInitialized,boxMin:o.box.min.toArray(),boxMax:o.box.max.toArray(),sphereInitialized:o.sphereInitialized,sphereRadius:o.sphere.radius,sphereCenter:o.sphere.center.toArray()})),n.maxGeometryCount=this._maxGeometryCount,n.maxVertexCount=this._maxVertexCount,n.maxIndexCount=this._maxIndexCount,n.geometryInitialized=this._geometryInitialized,n.geometryCount=this._geometryCount,n.matricesTexture=this._matricesTexture.toJSON(e),this.boundingSphere!==null&&(n.boundingSphere={center:n.boundingSphere.center.toArray(),radius:n.boundingSphere.radius}),this.boundingBox!==null&&(n.boundingBox={min:n.boundingBox.min.toArray(),max:n.boundingBox.max.toArray()}));function i(o,a){return o[a.uuid]===void 0&&(o[a.uuid]=a.toJSON(e)),a.uuid}if(this.isScene)this.background&&(this.background.isColor?n.background=this.background.toJSON():this.background.isTexture&&(n.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(n.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){n.geometry=i(e.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const a=o.shapes;if(Array.isArray(a))for(let l=0,h=a.length;l<h;l++){const u=a[l];i(e.shapes,u)}else i(e.shapes,a)}}if(this.isSkinnedMesh&&(n.bindMode=this.bindMode,n.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(i(e.skeletons,this.skeleton),n.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let a=0,l=this.material.length;a<l;a++)o.push(i(e.materials,this.material[a]));n.material=o}else n.material=i(e.materials,this.material);if(this.children.length>0){n.children=[];for(let o=0;o<this.children.length;o++)n.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){n.animations=[];for(let o=0;o<this.animations.length;o++){const a=this.animations[o];n.animations.push(i(e.animations,a))}}if(t){const o=s(e.geometries),a=s(e.materials),l=s(e.textures),h=s(e.images),u=s(e.shapes),d=s(e.skeletons),f=s(e.animations),p=s(e.nodes);o.length>0&&(r.geometries=o),a.length>0&&(r.materials=a),l.length>0&&(r.textures=l),h.length>0&&(r.images=h),u.length>0&&(r.shapes=u),d.length>0&&(r.skeletons=d),f.length>0&&(r.animations=f),p.length>0&&(r.nodes=p)}return r.object=n,r;function s(o){const a=[];for(const l in o){const h=o[l];delete h.metadata,a.push(h)}return a}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let r=0;r<e.children.length;r++){const n=e.children[r];this.add(n.clone())}return this}}q.DEFAULT_UP=new v(0,1,0);q.DEFAULT_MATRIX_AUTO_UPDATE=!0;q.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const xe=new v,ke=new v,hn=new v,Le=new v,At=new v,St=new v,Ni=new v,cn=new v,un=new v,dn=new v;class _e{constructor(e=new v,t=new v,r=new v){this.a=e,this.b=t,this.c=r}static getNormal(e,t,r,n){n.subVectors(r,t),xe.subVectors(e,t),n.cross(xe);const i=n.lengthSq();return i>0?n.multiplyScalar(1/Math.sqrt(i)):n.set(0,0,0)}static getBarycoord(e,t,r,n,i){xe.subVectors(n,t),ke.subVectors(r,t),hn.subVectors(e,t);const s=xe.dot(xe),o=xe.dot(ke),a=xe.dot(hn),l=ke.dot(ke),h=ke.dot(hn),u=s*l-o*o;if(u===0)return i.set(0,0,0),null;const d=1/u,f=(l*a-o*h)*d,p=(s*h-o*a)*d;return i.set(1-f-p,p,f)}static containsPoint(e,t,r,n){return this.getBarycoord(e,t,r,n,Le)===null?!1:Le.x>=0&&Le.y>=0&&Le.x+Le.y<=1}static getInterpolation(e,t,r,n,i,s,o,a){return this.getBarycoord(e,t,r,n,Le)===null?(a.x=0,a.y=0,"z"in a&&(a.z=0),"w"in a&&(a.w=0),null):(a.setScalar(0),a.addScaledVector(i,Le.x),a.addScaledVector(s,Le.y),a.addScaledVector(o,Le.z),a)}static isFrontFacing(e,t,r,n){return xe.subVectors(r,t),ke.subVectors(e,t),xe.cross(ke).dot(n)<0}set(e,t,r){return this.a.copy(e),this.b.copy(t),this.c.copy(r),this}setFromPointsAndIndices(e,t,r,n){return this.a.copy(e[t]),this.b.copy(e[r]),this.c.copy(e[n]),this}setFromAttributeAndIndices(e,t,r,n){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,r),this.c.fromBufferAttribute(e,n),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return xe.subVectors(this.c,this.b),ke.subVectors(this.a,this.b),xe.cross(ke).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return _e.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return _e.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,r,n,i){return _e.getInterpolation(e,this.a,this.b,this.c,t,r,n,i)}containsPoint(e){return _e.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return _e.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const r=this.a,n=this.b,i=this.c;let s,o;At.subVectors(n,r),St.subVectors(i,r),cn.subVectors(e,r);const a=At.dot(cn),l=St.dot(cn);if(a<=0&&l<=0)return t.copy(r);un.subVectors(e,n);const h=At.dot(un),u=St.dot(un);if(h>=0&&u<=h)return t.copy(n);const d=a*u-h*l;if(d<=0&&a>=0&&h<=0)return s=a/(a-h),t.copy(r).addScaledVector(At,s);dn.subVectors(e,i);const f=At.dot(dn),p=St.dot(dn);if(p>=0&&f<=p)return t.copy(i);const g=f*l-a*p;if(g<=0&&l>=0&&p<=0)return o=l/(l-p),t.copy(r).addScaledVector(St,o);const m=h*p-f*u;if(m<=0&&u-h>=0&&f-p>=0)return Ni.subVectors(i,n),o=(u-h)/(u-h+(f-p)),t.copy(n).addScaledVector(Ni,o);const w=1/(m+g+d);return s=g*w,o=d*w,t.copy(r).addScaledVector(At,s).addScaledVector(St,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}const Ps={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Xe={h:0,s:0,l:0},vr={h:0,s:0,l:0};function fn(c,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?c+(e-c)*6*t:t<1/2?e:t<2/3?c+(e-c)*6*(2/3-t):c}class Y{constructor(e,t,r){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,r)}set(e,t,r){if(t===void 0&&r===void 0){const n=e;n&&n.isColor?this.copy(n):typeof n=="number"?this.setHex(n):typeof n=="string"&&this.setStyle(n)}else this.setRGB(e,t,r);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=te){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,se.toWorkingColorSpace(this,t),this}setRGB(e,t,r,n=se.workingColorSpace){return this.r=e,this.g=t,this.b=r,se.toWorkingColorSpace(this,n),this}setHSL(e,t,r,n=se.workingColorSpace){if(e=Hn(e,1),t=Z(t,0,1),r=Z(r,0,1),t===0)this.r=this.g=this.b=r;else{const i=r<=.5?r*(1+t):r+t-r*t,s=2*r-i;this.r=fn(s,i,e+1/3),this.g=fn(s,i,e),this.b=fn(s,i,e-1/3)}return se.toWorkingColorSpace(this,n),this}setStyle(e,t=te){function r(i){i!==void 0&&parseFloat(i)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let n;if(n=/^(\w+)\(([^\)]*)\)/.exec(e)){let i;const s=n[1],o=n[2];switch(s){case"rgb":case"rgba":if(i=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return r(i[4]),this.setRGB(Math.min(255,parseInt(i[1],10))/255,Math.min(255,parseInt(i[2],10))/255,Math.min(255,parseInt(i[3],10))/255,t);if(i=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return r(i[4]),this.setRGB(Math.min(100,parseInt(i[1],10))/100,Math.min(100,parseInt(i[2],10))/100,Math.min(100,parseInt(i[3],10))/100,t);break;case"hsl":case"hsla":if(i=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return r(i[4]),this.setHSL(parseFloat(i[1])/360,parseFloat(i[2])/100,parseFloat(i[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(n=/^\#([A-Fa-f\d]+)$/.exec(e)){const i=n[1],s=i.length;if(s===3)return this.setRGB(parseInt(i.charAt(0),16)/15,parseInt(i.charAt(1),16)/15,parseInt(i.charAt(2),16)/15,t);if(s===6)return this.setHex(parseInt(i,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=te){const r=Ps[e.toLowerCase()];return r!==void 0?this.setHex(r,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=zt(e.r),this.g=zt(e.g),this.b=zt(e.b),this}copyLinearToSRGB(e){return this.r=Jr(e.r),this.g=Jr(e.g),this.b=Jr(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=te){return se.fromWorkingColorSpace(J.copy(this),e),Math.round(Z(J.r*255,0,255))*65536+Math.round(Z(J.g*255,0,255))*256+Math.round(Z(J.b*255,0,255))}getHexString(e=te){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=se.workingColorSpace){se.fromWorkingColorSpace(J.copy(this),t);const r=J.r,n=J.g,i=J.b,s=Math.max(r,n,i),o=Math.min(r,n,i);let a,l;const h=(o+s)/2;if(o===s)a=0,l=0;else{const u=s-o;switch(l=h<=.5?u/(s+o):u/(2-s-o),s){case r:a=(n-i)/u+(n<i?6:0);break;case n:a=(i-r)/u+2;break;case i:a=(r-n)/u+4;break}a/=6}return e.h=a,e.s=l,e.l=h,e}getRGB(e,t=se.workingColorSpace){return se.fromWorkingColorSpace(J.copy(this),t),e.r=J.r,e.g=J.g,e.b=J.b,e}getStyle(e=te){se.fromWorkingColorSpace(J.copy(this),e);const t=J.r,r=J.g,n=J.b;return e!==te?`color(${e} ${t.toFixed(3)} ${r.toFixed(3)} ${n.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(r*255)},${Math.round(n*255)})`}offsetHSL(e,t,r){return this.getHSL(Xe),this.setHSL(Xe.h+e,Xe.s+t,Xe.l+r)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,r){return this.r=e.r+(t.r-e.r)*r,this.g=e.g+(t.g-e.g)*r,this.b=e.b+(t.b-e.b)*r,this}lerpHSL(e,t){this.getHSL(Xe),e.getHSL(vr);const r=er(Xe.h,vr.h,t),n=er(Xe.s,vr.s,t),i=er(Xe.l,vr.l,t);return this.setHSL(r,n,i),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,r=this.g,n=this.b,i=e.elements;return this.r=i[0]*t+i[3]*r+i[6]*n,this.g=i[1]*t+i[4]*r+i[7]*n,this.b=i[2]*t+i[5]*r+i[8]*n,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const J=new Y;Y.NAMES=Ps;let Pa=0;class ut extends lr{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Pa++}),this.uuid=ve(),this.name="",this.type="Material",this.blending=mi,this.side=Ur,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=gi,this.blendDst=xi,this.blendEquation=yi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Y(0,0,0),this.blendAlpha=0,this.depthFunc=bi,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Ti,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=gt,this.stencilZFail=gt,this.stencilZPass=gt,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBuild(){}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const r=e[t];if(r===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}const n=this[t];if(n===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}n&&n.isColor?n.set(r):n&&n.isVector3&&r&&r.isVector3?n.copy(r):this[t]=r}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const r={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};r.uuid=this.uuid,r.type=this.type,this.name!==""&&(r.name=this.name),this.color&&this.color.isColor&&(r.color=this.color.getHex()),this.roughness!==void 0&&(r.roughness=this.roughness),this.metalness!==void 0&&(r.metalness=this.metalness),this.sheen!==void 0&&(r.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(r.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(r.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(r.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(r.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(r.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(r.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(r.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(r.shininess=this.shininess),this.clearcoat!==void 0&&(r.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(r.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(r.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(r.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(r.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,r.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.iridescence!==void 0&&(r.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(r.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(r.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(r.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(r.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(r.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(r.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(r.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(r.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(r.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(r.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(r.lightMap=this.lightMap.toJSON(e).uuid,r.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(r.aoMap=this.aoMap.toJSON(e).uuid,r.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(r.bumpMap=this.bumpMap.toJSON(e).uuid,r.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(r.normalMap=this.normalMap.toJSON(e).uuid,r.normalMapType=this.normalMapType,r.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(r.displacementMap=this.displacementMap.toJSON(e).uuid,r.displacementScale=this.displacementScale,r.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(r.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(r.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(r.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(r.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(r.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(r.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(r.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(r.combine=this.combine)),this.envMapRotation!==void 0&&(r.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(r.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(r.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(r.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(r.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(r.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(r.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(r.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(r.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(r.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(r.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(r.size=this.size),this.shadowSide!==null&&(r.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(r.sizeAttenuation=this.sizeAttenuation),this.blending!==mi&&(r.blending=this.blending),this.side!==Ur&&(r.side=this.side),this.vertexColors===!0&&(r.vertexColors=!0),this.opacity<1&&(r.opacity=this.opacity),this.transparent===!0&&(r.transparent=!0),this.blendSrc!==gi&&(r.blendSrc=this.blendSrc),this.blendDst!==xi&&(r.blendDst=this.blendDst),this.blendEquation!==yi&&(r.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(r.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(r.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(r.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(r.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(r.blendAlpha=this.blendAlpha),this.depthFunc!==bi&&(r.depthFunc=this.depthFunc),this.depthTest===!1&&(r.depthTest=this.depthTest),this.depthWrite===!1&&(r.depthWrite=this.depthWrite),this.colorWrite===!1&&(r.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(r.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Ti&&(r.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(r.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(r.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==gt&&(r.stencilFail=this.stencilFail),this.stencilZFail!==gt&&(r.stencilZFail=this.stencilZFail),this.stencilZPass!==gt&&(r.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(r.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(r.rotation=this.rotation),this.polygonOffset===!0&&(r.polygonOffset=!0),this.polygonOffsetFactor!==0&&(r.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(r.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(r.linewidth=this.linewidth),this.dashSize!==void 0&&(r.dashSize=this.dashSize),this.gapSize!==void 0&&(r.gapSize=this.gapSize),this.scale!==void 0&&(r.scale=this.scale),this.dithering===!0&&(r.dithering=!0),this.alphaTest>0&&(r.alphaTest=this.alphaTest),this.alphaHash===!0&&(r.alphaHash=!0),this.alphaToCoverage===!0&&(r.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(r.premultipliedAlpha=!0),this.forceSinglePass===!0&&(r.forceSinglePass=!0),this.wireframe===!0&&(r.wireframe=!0),this.wireframeLinewidth>1&&(r.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(r.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(r.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(r.flatShading=!0),this.visible===!1&&(r.visible=!1),this.toneMapped===!1&&(r.toneMapped=!1),this.fog===!1&&(r.fog=!1),Object.keys(this.userData).length>0&&(r.userData=this.userData);function n(i){const s=[];for(const o in i){const a=i[o];delete a.metadata,s.push(a)}return s}if(t){const i=n(e.textures),s=n(e.images);i.length>0&&(r.textures=i),s.length>0&&(r.images=s)}return r}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let r=null;if(t!==null){const n=t.length;r=new Array(n);for(let i=0;i!==n;++i)r[i]=t[i].clone()}return this.clippingPlanes=r,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}class Bt extends ut{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Y(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ot,this.combine=Ho,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const $=new v,wr=new k;class U{constructor(e,t,r=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=r,this.usage=Bn,this._updateRange={offset:0,count:-1},this.updateRanges=[],this.gpuType=Un,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}get updateRange(){return zs("THREE.BufferAttribute: updateRange() is deprecated and will be removed in r169. Use addUpdateRange() instead."),this._updateRange}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,r){e*=this.itemSize,r*=t.itemSize;for(let n=0,i=this.itemSize;n<i;n++)this.array[e+n]=t.array[r+n];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,r=this.count;t<r;t++)wr.fromBufferAttribute(this,t),wr.applyMatrix3(e),this.setXY(t,wr.x,wr.y);else if(this.itemSize===3)for(let t=0,r=this.count;t<r;t++)$.fromBufferAttribute(this,t),$.applyMatrix3(e),this.setXYZ(t,$.x,$.y,$.z);return this}applyMatrix4(e){for(let t=0,r=this.count;t<r;t++)$.fromBufferAttribute(this,t),$.applyMatrix4(e),this.setXYZ(t,$.x,$.y,$.z);return this}applyNormalMatrix(e){for(let t=0,r=this.count;t<r;t++)$.fromBufferAttribute(this,t),$.applyNormalMatrix(e),this.setXYZ(t,$.x,$.y,$.z);return this}transformDirection(e){for(let t=0,r=this.count;t<r;t++)$.fromBufferAttribute(this,t),$.transformDirection(e),this.setXYZ(t,$.x,$.y,$.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let r=this.array[e*this.itemSize+t];return this.normalized&&(r=be(r,this.array)),r}setComponent(e,t,r){return this.normalized&&(r=O(r,this.array)),this.array[e*this.itemSize+t]=r,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=be(t,this.array)),t}setX(e,t){return this.normalized&&(t=O(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=be(t,this.array)),t}setY(e,t){return this.normalized&&(t=O(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=be(t,this.array)),t}setZ(e,t){return this.normalized&&(t=O(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=be(t,this.array)),t}setW(e,t){return this.normalized&&(t=O(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,r){return e*=this.itemSize,this.normalized&&(t=O(t,this.array),r=O(r,this.array)),this.array[e+0]=t,this.array[e+1]=r,this}setXYZ(e,t,r,n){return e*=this.itemSize,this.normalized&&(t=O(t,this.array),r=O(r,this.array),n=O(n,this.array)),this.array[e+0]=t,this.array[e+1]=r,this.array[e+2]=n,this}setXYZW(e,t,r,n,i){return e*=this.itemSize,this.normalized&&(t=O(t,this.array),r=O(r,this.array),n=O(n,this.array),i=O(i,this.array)),this.array[e+0]=t,this.array[e+1]=r,this.array[e+2]=n,this.array[e+3]=i,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==Bn&&(e.usage=this.usage),e}}class ka extends U{constructor(e,t,r){super(new Uint16Array(e),t,r)}}class La extends U{constructor(e,t,r){super(new Uint32Array(e),t,r)}}class Vn extends U{constructor(e,t,r){super(new Float32Array(e),t,r)}}let Da=0;const he=new B,pn=new q,Mt=new v,ie=new Fe,qt=new Fe,X=new v;class Ae extends lr{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Da++}),this.uuid=ve(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(xa(e)?La:ka)(e,1):this.index=e,this}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,r=0){this.groups.push({start:e,count:t,materialIndex:r})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const r=this.attributes.normal;if(r!==void 0){const i=new Ge().getNormalMatrix(e);r.applyNormalMatrix(i),r.needsUpdate=!0}const n=this.attributes.tangent;return n!==void 0&&(n.transformDirection(e),n.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return he.makeRotationFromQuaternion(e),this.applyMatrix4(he),this}rotateX(e){return he.makeRotationX(e),this.applyMatrix4(he),this}rotateY(e){return he.makeRotationY(e),this.applyMatrix4(he),this}rotateZ(e){return he.makeRotationZ(e),this.applyMatrix4(he),this}translate(e,t,r){return he.makeTranslation(e,t,r),this.applyMatrix4(he),this}scale(e,t,r){return he.makeScale(e,t,r),this.applyMatrix4(he),this}lookAt(e){return pn.lookAt(e),pn.updateMatrix(),this.applyMatrix4(pn.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Mt).negate(),this.translate(Mt.x,Mt.y,Mt.z),this}setFromPoints(e){const t=[];for(let r=0,n=e.length;r<n;r++){const i=e[r];t.push(i.x,i.y,i.z||0)}return this.setAttribute("position",new Vn(t,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Fe);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new v(-1/0,-1/0,-1/0),new v(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let r=0,n=t.length;r<n;r++){const i=t[r];ie.setFromBufferAttribute(i),this.morphTargetsRelative?(X.addVectors(this.boundingBox.min,ie.min),this.boundingBox.expandByPoint(X),X.addVectors(this.boundingBox.max,ie.max),this.boundingBox.expandByPoint(X)):(this.boundingBox.expandByPoint(ie.min),this.boundingBox.expandByPoint(ie.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new we);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new v,1/0);return}if(e){const r=this.boundingSphere.center;if(ie.setFromBufferAttribute(e),t)for(let i=0,s=t.length;i<s;i++){const o=t[i];qt.setFromBufferAttribute(o),this.morphTargetsRelative?(X.addVectors(ie.min,qt.min),ie.expandByPoint(X),X.addVectors(ie.max,qt.max),ie.expandByPoint(X)):(ie.expandByPoint(qt.min),ie.expandByPoint(qt.max))}ie.getCenter(r);let n=0;for(let i=0,s=e.count;i<s;i++)X.fromBufferAttribute(e,i),n=Math.max(n,r.distanceToSquared(X));if(t)for(let i=0,s=t.length;i<s;i++){const o=t[i],a=this.morphTargetsRelative;for(let l=0,h=o.count;l<h;l++)X.fromBufferAttribute(o,l),a&&(Mt.fromBufferAttribute(e,l),X.add(Mt)),n=Math.max(n,r.distanceToSquared(X))}this.boundingSphere.radius=Math.sqrt(n),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const r=t.position,n=t.normal,i=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new U(new Float32Array(4*r.count),4));const s=this.getAttribute("tangent"),o=[],a=[];for(let E=0;E<r.count;E++)o[E]=new v,a[E]=new v;const l=new v,h=new v,u=new v,d=new k,f=new k,p=new k,g=new v,m=new v;function w(E,D,V){l.fromBufferAttribute(r,E),h.fromBufferAttribute(r,D),u.fromBufferAttribute(r,V),d.fromBufferAttribute(i,E),f.fromBufferAttribute(i,D),p.fromBufferAttribute(i,V),h.sub(l),u.sub(l),f.sub(d),p.sub(d);const j=1/(f.x*p.y-p.x*f.y);isFinite(j)&&(g.copy(h).multiplyScalar(p.y).addScaledVector(u,-f.y).multiplyScalar(j),m.copy(u).multiplyScalar(f.x).addScaledVector(h,-p.x).multiplyScalar(j),o[E].add(g),o[D].add(g),o[V].add(g),a[E].add(m),a[D].add(m),a[V].add(m))}let _=this.groups;_.length===0&&(_=[{start:0,count:e.count}]);for(let E=0,D=_.length;E<D;++E){const V=_[E],j=V.start,re=V.count;for(let W=j,pe=j+re;W<pe;W+=3)w(e.getX(W+0),e.getX(W+1),e.getX(W+2))}const A=new v,S=new v,C=new v,R=new v;function M(E){C.fromBufferAttribute(n,E),R.copy(C);const D=o[E];A.copy(D),A.sub(C.multiplyScalar(C.dot(D))).normalize(),S.crossVectors(R,D);const j=S.dot(a[E])<0?-1:1;s.setXYZW(E,A.x,A.y,A.z,j)}for(let E=0,D=_.length;E<D;++E){const V=_[E],j=V.start,re=V.count;for(let W=j,pe=j+re;W<pe;W+=3)M(e.getX(W+0)),M(e.getX(W+1)),M(e.getX(W+2))}}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let r=this.getAttribute("normal");if(r===void 0)r=new U(new Float32Array(t.count*3),3),this.setAttribute("normal",r);else for(let d=0,f=r.count;d<f;d++)r.setXYZ(d,0,0,0);const n=new v,i=new v,s=new v,o=new v,a=new v,l=new v,h=new v,u=new v;if(e)for(let d=0,f=e.count;d<f;d+=3){const p=e.getX(d+0),g=e.getX(d+1),m=e.getX(d+2);n.fromBufferAttribute(t,p),i.fromBufferAttribute(t,g),s.fromBufferAttribute(t,m),h.subVectors(s,i),u.subVectors(n,i),h.cross(u),o.fromBufferAttribute(r,p),a.fromBufferAttribute(r,g),l.fromBufferAttribute(r,m),o.add(h),a.add(h),l.add(h),r.setXYZ(p,o.x,o.y,o.z),r.setXYZ(g,a.x,a.y,a.z),r.setXYZ(m,l.x,l.y,l.z)}else for(let d=0,f=t.count;d<f;d+=3)n.fromBufferAttribute(t,d+0),i.fromBufferAttribute(t,d+1),s.fromBufferAttribute(t,d+2),h.subVectors(s,i),u.subVectors(n,i),h.cross(u),r.setXYZ(d+0,h.x,h.y,h.z),r.setXYZ(d+1,h.x,h.y,h.z),r.setXYZ(d+2,h.x,h.y,h.z);this.normalizeNormals(),r.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let t=0,r=e.count;t<r;t++)X.fromBufferAttribute(e,t),X.normalize(),e.setXYZ(t,X.x,X.y,X.z)}toNonIndexed(){function e(o,a){const l=o.array,h=o.itemSize,u=o.normalized,d=new l.constructor(a.length*h);let f=0,p=0;for(let g=0,m=a.length;g<m;g++){o.isInterleavedBufferAttribute?f=a[g]*o.data.stride+o.offset:f=a[g]*h;for(let w=0;w<h;w++)d[p++]=l[f++]}return new U(d,h,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new Ae,r=this.index.array,n=this.attributes;for(const o in n){const a=n[o],l=e(a,r);t.setAttribute(o,l)}const i=this.morphAttributes;for(const o in i){const a=[],l=i[o];for(let h=0,u=l.length;h<u;h++){const d=l[h],f=e(d,r);a.push(f)}t.morphAttributes[o]=a}t.morphTargetsRelative=this.morphTargetsRelative;const s=this.groups;for(let o=0,a=s.length;o<a;o++){const l=s[o];t.addGroup(l.start,l.count,l.materialIndex)}return t}toJSON(){const e={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){const a=this.parameters;for(const l in a)a[l]!==void 0&&(e[l]=a[l]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const r=this.attributes;for(const a in r){const l=r[a];e.data.attributes[a]=l.toJSON(e.data)}const n={};let i=!1;for(const a in this.morphAttributes){const l=this.morphAttributes[a],h=[];for(let u=0,d=l.length;u<d;u++){const f=l[u];h.push(f.toJSON(e.data))}h.length>0&&(n[a]=h,i=!0)}i&&(e.data.morphAttributes=n,e.data.morphTargetsRelative=this.morphTargetsRelative);const s=this.groups;s.length>0&&(e.data.groups=JSON.parse(JSON.stringify(s)));const o=this.boundingSphere;return o!==null&&(e.data.boundingSphere={center:o.center.toArray(),radius:o.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const r=e.index;r!==null&&this.setIndex(r.clone(t));const n=e.attributes;for(const l in n){const h=n[l];this.setAttribute(l,h.clone(t))}const i=e.morphAttributes;for(const l in i){const h=[],u=i[l];for(let d=0,f=u.length;d<f;d++)h.push(u[d].clone(t));this.morphAttributes[l]=h}this.morphTargetsRelative=e.morphTargetsRelative;const s=e.groups;for(let l=0,h=s.length;l<h;l++){const u=s[l];this.addGroup(u.start,u.count,u.materialIndex)}const o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());const a=e.boundingSphere;return a!==null&&(this.boundingSphere=a.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const Ui=new B,ot=new hr,Ir=new we,Hi=new v,Ct=new v,Tt=new v,Et=new v,mn=new v,_r=new v,Ar=new k,Sr=new k,Mr=new k,Vi=new v,ji=new v,Wi=new v,Cr=new v,Tr=new v;let Oe=class extends q{constructor(e=new Ae,t=new Bt){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,r=Object.keys(t);if(r.length>0){const n=t[r[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let i=0,s=n.length;i<s;i++){const o=n[i].name||String(i);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=i}}}}getVertexPosition(e,t){const r=this.geometry,n=r.attributes.position,i=r.morphAttributes.position,s=r.morphTargetsRelative;t.fromBufferAttribute(n,e);const o=this.morphTargetInfluences;if(i&&o){_r.set(0,0,0);for(let a=0,l=i.length;a<l;a++){const h=o[a],u=i[a];h!==0&&(mn.fromBufferAttribute(u,e),s?_r.addScaledVector(mn,h):_r.addScaledVector(mn.sub(t),h))}t.add(_r)}return t}raycast(e,t){const r=this.geometry,n=this.material,i=this.matrixWorld;n!==void 0&&(r.boundingSphere===null&&r.computeBoundingSphere(),Ir.copy(r.boundingSphere),Ir.applyMatrix4(i),ot.copy(e.ray).recast(e.near),!(Ir.containsPoint(ot.origin)===!1&&(ot.intersectSphere(Ir,Hi)===null||ot.origin.distanceToSquared(Hi)>(e.far-e.near)**2))&&(Ui.copy(i).invert(),ot.copy(e.ray).applyMatrix4(Ui),!(r.boundingBox!==null&&ot.intersectsBox(r.boundingBox)===!1)&&this._computeIntersections(e,t,ot)))}_computeIntersections(e,t,r){let n;const i=this.geometry,s=this.material,o=i.index,a=i.attributes.position,l=i.attributes.uv,h=i.attributes.uv1,u=i.attributes.normal,d=i.groups,f=i.drawRange;if(o!==null)if(Array.isArray(s))for(let p=0,g=d.length;p<g;p++){const m=d[p],w=s[m.materialIndex],_=Math.max(m.start,f.start),A=Math.min(o.count,Math.min(m.start+m.count,f.start+f.count));for(let S=_,C=A;S<C;S+=3){const R=o.getX(S),M=o.getX(S+1),E=o.getX(S+2);n=Er(this,w,e,r,l,h,u,R,M,E),n&&(n.faceIndex=Math.floor(S/3),n.face.materialIndex=m.materialIndex,t.push(n))}}else{const p=Math.max(0,f.start),g=Math.min(o.count,f.start+f.count);for(let m=p,w=g;m<w;m+=3){const _=o.getX(m),A=o.getX(m+1),S=o.getX(m+2);n=Er(this,s,e,r,l,h,u,_,A,S),n&&(n.faceIndex=Math.floor(m/3),t.push(n))}}else if(a!==void 0)if(Array.isArray(s))for(let p=0,g=d.length;p<g;p++){const m=d[p],w=s[m.materialIndex],_=Math.max(m.start,f.start),A=Math.min(a.count,Math.min(m.start+m.count,f.start+f.count));for(let S=_,C=A;S<C;S+=3){const R=S,M=S+1,E=S+2;n=Er(this,w,e,r,l,h,u,R,M,E),n&&(n.faceIndex=Math.floor(S/3),n.face.materialIndex=m.materialIndex,t.push(n))}}else{const p=Math.max(0,f.start),g=Math.min(a.count,f.start+f.count);for(let m=p,w=g;m<w;m+=3){const _=m,A=m+1,S=m+2;n=Er(this,s,e,r,l,h,u,_,A,S),n&&(n.faceIndex=Math.floor(m/3),t.push(n))}}}};function Oa(c,e,t,r,n,i,s,o){let a;if(e.side===No?a=r.intersectTriangle(s,i,n,!0,o):a=r.intersectTriangle(n,i,s,e.side===Ur,o),a===null)return null;Tr.copy(o),Tr.applyMatrix4(c.matrixWorld);const l=t.ray.origin.distanceTo(Tr);return l<t.near||l>t.far?null:{distance:l,point:Tr.clone(),object:c}}function Er(c,e,t,r,n,i,s,o,a,l){c.getVertexPosition(o,Ct),c.getVertexPosition(a,Tt),c.getVertexPosition(l,Et);const h=Oa(c,e,t,r,Ct,Tt,Et,Cr);if(h){n&&(Ar.fromBufferAttribute(n,o),Sr.fromBufferAttribute(n,a),Mr.fromBufferAttribute(n,l),h.uv=_e.getInterpolation(Cr,Ct,Tt,Et,Ar,Sr,Mr,new k)),i&&(Ar.fromBufferAttribute(i,o),Sr.fromBufferAttribute(i,a),Mr.fromBufferAttribute(i,l),h.uv1=_e.getInterpolation(Cr,Ct,Tt,Et,Ar,Sr,Mr,new k)),s&&(Vi.fromBufferAttribute(s,o),ji.fromBufferAttribute(s,a),Wi.fromBufferAttribute(s,l),h.normal=_e.getInterpolation(Cr,Ct,Tt,Et,Vi,ji,Wi,new v),h.normal.dot(r.direction)>0&&h.normal.multiplyScalar(-1));const u={a:o,b:a,c:l,normal:new v,materialIndex:0};_e.getNormal(Ct,Tt,Et,u.normal),h.face=u}return h}class ks extends q{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new B,this.projectionMatrix=new B,this.projectionMatrixInverse=new B,this.coordinateSystem=ct}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const Ze=new v,qi=new k,$i=new k;class qr extends ks{constructor(e=50,t=1,r=.1,n=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=r,this.far=n,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=or*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(Qt*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return or*2*Math.atan(Math.tan(Qt*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,r){Ze.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Ze.x,Ze.y).multiplyScalar(-e/Ze.z),Ze.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),r.set(Ze.x,Ze.y).multiplyScalar(-e/Ze.z)}getViewSize(e,t){return this.getViewBounds(e,qi,$i),t.subVectors($i,qi)}setViewOffset(e,t,r,n,i,s){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=r,this.view.offsetY=n,this.view.width=i,this.view.height=s,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(Qt*.5*this.fov)/this.zoom,r=2*t,n=this.aspect*r,i=-.5*n;const s=this.view;if(this.view!==null&&this.view.enabled){const a=s.fullWidth,l=s.fullHeight;i+=s.offsetX*n/a,t-=s.offsetY*r/l,n*=s.width/a,r*=s.height/l}const o=this.filmOffset;o!==0&&(i+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(i,i+n,t,t-r,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}const yn=new v,Ga=new v,Fa=new Ge;class oe{constructor(e=new v(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,r,n){return this.normal.set(e,t,r),this.constant=n,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,r){const n=yn.subVectors(r,t).cross(Ga.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(n,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){const r=e.delta(yn),n=this.normal.dot(r);if(n===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const i=-(e.start.dot(this.normal)+this.constant)/n;return i<0||i>1?null:t.copy(e.start).addScaledVector(r,i)}intersectsLine(e){const t=this.distanceToPoint(e.start),r=this.distanceToPoint(e.end);return t<0&&r>0||r<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const r=t||Fa.getNormalMatrix(e),n=this.coplanarPoint(yn).applyMatrix4(e),i=this.normal.applyMatrix3(r).normalize();return this.constant=-n.dot(i),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}}const at=new we,Rr=new v;let Na=class{constructor(e=new oe,t=new oe,r=new oe,n=new oe,i=new oe,s=new oe){this.planes=[e,t,r,n,i,s]}set(e,t,r,n,i,s){const o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(r),o[3].copy(n),o[4].copy(i),o[5].copy(s),this}copy(e){const t=this.planes;for(let r=0;r<6;r++)t[r].copy(e.planes[r]);return this}setFromProjectionMatrix(e,t=ct){const r=this.planes,n=e.elements,i=n[0],s=n[1],o=n[2],a=n[3],l=n[4],h=n[5],u=n[6],d=n[7],f=n[8],p=n[9],g=n[10],m=n[11],w=n[12],_=n[13],A=n[14],S=n[15];if(r[0].setComponents(a-i,d-l,m-f,S-w).normalize(),r[1].setComponents(a+i,d+l,m+f,S+w).normalize(),r[2].setComponents(a+s,d+h,m+p,S+_).normalize(),r[3].setComponents(a-s,d-h,m-p,S-_).normalize(),r[4].setComponents(a-o,d-u,m-g,S-A).normalize(),t===ct)r[5].setComponents(a+o,d+u,m+g,S+A).normalize();else if(t===zn)r[5].setComponents(o,u,g,A).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),at.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),at.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(at)}intersectsSprite(e){return at.center.set(0,0,0),at.radius=.7071067811865476,at.applyMatrix4(e.matrixWorld),this.intersectsSphere(at)}intersectsSphere(e){const t=this.planes,r=e.center,n=-e.radius;for(let i=0;i<6;i++)if(t[i].distanceToPoint(r)<n)return!1;return!0}intersectsBox(e){const t=this.planes;for(let r=0;r<6;r++){const n=t[r];if(Rr.x=n.normal.x>0?e.max.x:e.min.x,Rr.y=n.normal.y>0?e.max.y:e.min.y,Rr.z=n.normal.z>0?e.max.z:e.min.z,n.distanceToPoint(Rr)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let r=0;r<6;r++)if(t[r].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};class Ls extends ks{constructor(e=-1,t=1,r=1,n=-1,i=.1,s=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=r,this.bottom=n,this.near=i,this.far=s,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,r,n,i,s){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=r,this.view.offsetY=n,this.view.width=i,this.view.height=s,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),r=(this.right+this.left)/2,n=(this.top+this.bottom)/2;let i=r-e,s=r+e,o=n+t,a=n-t;if(this.view!==null&&this.view.enabled){const l=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;i+=l*this.view.offsetX,s=i+l*this.view.width,o-=h*this.view.offsetY,a=o-h*this.view.height}this.projectionMatrix.makeOrthographic(i,s,o,a,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}class Ua extends fe{constructor(e,t,r,n,i,s,o,a,l,h){if(h=h!==void 0?h:Xr,h!==Xr&&h!==wi)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");r===void 0&&h===Xr&&(r=Yo),r===void 0&&h===wi&&(r=Xo),super(null,n,i,s,o,a,h,r,l),this.isDepthTexture=!0,this.image={width:e,height:t},this.magFilter=o!==void 0?o:ir,this.minFilter=a!==void 0?a:ir,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}}const Ha=new Ua(1,1);Ha.compareFunction=ta;class Fr extends q{constructor(){super(),this.isGroup=!0,this.type="Group"}}class Va{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e!==void 0?e.length/t:0,this.usage=Bn,this._updateRange={offset:0,count:-1},this.updateRanges=[],this.version=0,this.uuid=ve()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}get updateRange(){return zs("THREE.InterleavedBuffer: updateRange() is deprecated and will be removed in r169. Use addUpdateRange() instead."),this._updateRange}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,r){e*=this.stride,r*=t.stride;for(let n=0,i=this.stride;n<i;n++)this.array[e+n]=t.array[r+n];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=ve()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);const t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),r=new this.constructor(t,this.stride);return r.setUsage(this.usage),r}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){return e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=ve()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}}const ee=new v;class jn{constructor(e,t,r,n=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=e,this.itemSize=t,this.offset=r,this.normalized=n}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,r=this.data.count;t<r;t++)ee.fromBufferAttribute(this,t),ee.applyMatrix4(e),this.setXYZ(t,ee.x,ee.y,ee.z);return this}applyNormalMatrix(e){for(let t=0,r=this.count;t<r;t++)ee.fromBufferAttribute(this,t),ee.applyNormalMatrix(e),this.setXYZ(t,ee.x,ee.y,ee.z);return this}transformDirection(e){for(let t=0,r=this.count;t<r;t++)ee.fromBufferAttribute(this,t),ee.transformDirection(e),this.setXYZ(t,ee.x,ee.y,ee.z);return this}getComponent(e,t){let r=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(r=be(r,this.array)),r}setComponent(e,t,r){return this.normalized&&(r=O(r,this.array)),this.data.array[e*this.data.stride+this.offset+t]=r,this}setX(e,t){return this.normalized&&(t=O(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=O(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=O(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=O(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=be(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=be(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=be(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=be(t,this.array)),t}setXY(e,t,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=O(t,this.array),r=O(r,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=r,this}setXYZ(e,t,r,n){return e=e*this.data.stride+this.offset,this.normalized&&(t=O(t,this.array),r=O(r,this.array),n=O(n,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=r,this.data.array[e+2]=n,this}setXYZW(e,t,r,n,i){return e=e*this.data.stride+this.offset,this.normalized&&(t=O(t,this.array),r=O(r,this.array),n=O(n,this.array),i=O(i,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=r,this.data.array[e+2]=n,this.data.array[e+3]=i,this}clone(e){if(e===void 0){console.log("THREE.InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");const t=[];for(let r=0;r<this.count;r++){const n=r*this.data.stride+this.offset;for(let i=0;i<this.itemSize;i++)t.push(this.data.array[n+i])}return new U(new this.array.constructor(t),this.itemSize,this.normalized)}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.clone(e)),new jn(e.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){console.log("THREE.InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");const t=[];for(let r=0;r<this.count;r++){const n=r*this.data.stride+this.offset;for(let i=0;i<this.itemSize;i++)t.push(this.data.array[n+i])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:t,normalized:this.normalized}}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}}const Yi=new v,Xi=new de,Zi=new de,ja=new v,Ki=new B,Br=new v,gn=new we,Ji=new B,xn=new hr;class Wa extends Oe{constructor(e,t){super(e,t),this.isSkinnedMesh=!0,this.type="SkinnedMesh",this.bindMode=vi,this.bindMatrix=new B,this.bindMatrixInverse=new B,this.boundingBox=null,this.boundingSphere=null}computeBoundingBox(){const e=this.geometry;this.boundingBox===null&&(this.boundingBox=new Fe),this.boundingBox.makeEmpty();const t=e.getAttribute("position");for(let r=0;r<t.count;r++)this.getVertexPosition(r,Br),this.boundingBox.expandByPoint(Br)}computeBoundingSphere(){const e=this.geometry;this.boundingSphere===null&&(this.boundingSphere=new we),this.boundingSphere.makeEmpty();const t=e.getAttribute("position");for(let r=0;r<t.count;r++)this.getVertexPosition(r,Br),this.boundingSphere.expandByPoint(Br)}copy(e,t){return super.copy(e,t),this.bindMode=e.bindMode,this.bindMatrix.copy(e.bindMatrix),this.bindMatrixInverse.copy(e.bindMatrixInverse),this.skeleton=e.skeleton,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}raycast(e,t){const r=this.material,n=this.matrixWorld;r!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),gn.copy(this.boundingSphere),gn.applyMatrix4(n),e.ray.intersectsSphere(gn)!==!1&&(Ji.copy(n).invert(),xn.copy(e.ray).applyMatrix4(Ji),!(this.boundingBox!==null&&xn.intersectsBox(this.boundingBox)===!1)&&this._computeIntersections(e,t,xn)))}getVertexPosition(e,t){return super.getVertexPosition(e,t),this.applyBoneTransform(e,t),t}bind(e,t){this.skeleton=e,t===void 0&&(this.updateMatrixWorld(!0),this.skeleton.calculateInverses(),t=this.matrixWorld),this.bindMatrix.copy(t),this.bindMatrixInverse.copy(t).invert()}pose(){this.skeleton.pose()}normalizeSkinWeights(){const e=new de,t=this.geometry.attributes.skinWeight;for(let r=0,n=t.count;r<n;r++){e.fromBufferAttribute(t,r);const i=1/e.manhattanLength();i!==1/0?e.multiplyScalar(i):e.set(1,0,0,0),t.setXYZW(r,e.x,e.y,e.z,e.w)}}updateMatrixWorld(e){super.updateMatrixWorld(e),this.bindMode===vi?this.bindMatrixInverse.copy(this.matrixWorld).invert():this.bindMode===Vo?this.bindMatrixInverse.copy(this.bindMatrix).invert():console.warn("THREE.SkinnedMesh: Unrecognized bindMode: "+this.bindMode)}applyBoneTransform(e,t){const r=this.skeleton,n=this.geometry;Xi.fromBufferAttribute(n.attributes.skinIndex,e),Zi.fromBufferAttribute(n.attributes.skinWeight,e),Yi.copy(t).applyMatrix4(this.bindMatrix),t.set(0,0,0);for(let i=0;i<4;i++){const s=Zi.getComponent(i);if(s!==0){const o=Xi.getComponent(i);Ki.multiplyMatrices(r.bones[o].matrixWorld,r.boneInverses[o]),t.addScaledVector(ja.copy(Yi).applyMatrix4(Ki),s)}}return t.applyMatrix4(this.bindMatrixInverse)}}class Ds extends q{constructor(){super(),this.isBone=!0,this.type="Bone"}}class Os extends fe{constructor(e=null,t=1,r=1,n,i,s,o,a,l=ir,h=ir,u,d){super(null,s,o,a,l,h,n,i,u,d),this.isDataTexture=!0,this.image={data:e,width:t,height:r},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const Qi=new B,qa=new B;class Wn{constructor(e=[],t=[]){this.uuid=ve(),this.bones=e.slice(0),this.boneInverses=t,this.boneMatrices=null,this.boneTexture=null,this.init()}init(){const e=this.bones,t=this.boneInverses;if(this.boneMatrices=new Float32Array(e.length*16),t.length===0)this.calculateInverses();else if(e.length!==t.length){console.warn("THREE.Skeleton: Number of inverse bone matrices does not match amount of bones."),this.boneInverses=[];for(let r=0,n=this.bones.length;r<n;r++)this.boneInverses.push(new B)}}calculateInverses(){this.boneInverses.length=0;for(let e=0,t=this.bones.length;e<t;e++){const r=new B;this.bones[e]&&r.copy(this.bones[e].matrixWorld).invert(),this.boneInverses.push(r)}}pose(){for(let e=0,t=this.bones.length;e<t;e++){const r=this.bones[e];r&&r.matrixWorld.copy(this.boneInverses[e]).invert()}for(let e=0,t=this.bones.length;e<t;e++){const r=this.bones[e];r&&(r.parent&&r.parent.isBone?(r.matrix.copy(r.parent.matrixWorld).invert(),r.matrix.multiply(r.matrixWorld)):r.matrix.copy(r.matrixWorld),r.matrix.decompose(r.position,r.quaternion,r.scale))}}update(){const e=this.bones,t=this.boneInverses,r=this.boneMatrices,n=this.boneTexture;for(let i=0,s=e.length;i<s;i++){const o=e[i]?e[i].matrixWorld:qa;Qi.multiplyMatrices(o,t[i]),Qi.toArray(r,i*16)}n!==null&&(n.needsUpdate=!0)}clone(){return new Wn(this.bones,this.boneInverses)}computeBoneTexture(){let e=Math.sqrt(this.bones.length*4);e=Math.ceil(e/4)*4,e=Math.max(e,4);const t=new Float32Array(e*e*4);t.set(this.boneMatrices);const r=new Os(t,e,e,Cs,Un);return r.needsUpdate=!0,this.boneMatrices=t,this.boneTexture=r,this}getBoneByName(e){for(let t=0,r=this.bones.length;t<r;t++){const n=this.bones[t];if(n.name===e)return n}}dispose(){this.boneTexture!==null&&(this.boneTexture.dispose(),this.boneTexture=null)}fromJSON(e,t){this.uuid=e.uuid;for(let r=0,n=e.bones.length;r<n;r++){const i=e.bones[r];let s=t[i];s===void 0&&(console.warn("THREE.Skeleton: No bone found with UUID:",i),s=new Ds),this.bones.push(s),this.boneInverses.push(new B().fromArray(e.boneInverses[r]))}return this.init(),this}toJSON(){const e={metadata:{version:4.6,type:"Skeleton",generator:"Skeleton.toJSON"},bones:[],boneInverses:[]};e.uuid=this.uuid;const t=this.bones,r=this.boneInverses;for(let n=0,i=t.length;n<i;n++){const s=t[n];e.bones.push(s.uuid);const o=r[n];e.boneInverses.push(o.toArray())}return e}}class kn extends U{constructor(e,t,r,n=1){super(e,t,r),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=n}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){const e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}}const Rt=new B,es=new B,zr=[],ts=new Fe,$a=new B,$t=new Oe,Yt=new we;class Ya extends Oe{constructor(e,t,r){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new kn(new Float32Array(r*16),16),this.instanceColor=null,this.morphTexture=null,this.count=r,this.boundingBox=null,this.boundingSphere=null;for(let n=0;n<r;n++)this.setMatrixAt(n,$a)}computeBoundingBox(){const e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new Fe),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let r=0;r<t;r++)this.getMatrixAt(r,Rt),ts.copy(e.boundingBox).applyMatrix4(Rt),this.boundingBox.union(ts)}computeBoundingSphere(){const e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new we),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let r=0;r<t;r++)this.getMatrixAt(r,Rt),Yt.copy(e.boundingSphere).applyMatrix4(Rt),this.boundingSphere.union(Yt)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){const r=t.morphTargetInfluences,n=this.morphTexture.source.data.data,i=r.length+1,s=e*i+1;for(let o=0;o<r.length;o++)r[o]=n[s+o]}raycast(e,t){const r=this.matrixWorld,n=this.count;if($t.geometry=this.geometry,$t.material=this.material,$t.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Yt.copy(this.boundingSphere),Yt.applyMatrix4(r),e.ray.intersectsSphere(Yt)!==!1))for(let i=0;i<n;i++){this.getMatrixAt(i,Rt),es.multiplyMatrices(r,Rt),$t.matrixWorld=es,$t.raycast(e,zr);for(let s=0,o=zr.length;s<o;s++){const a=zr[s];a.instanceId=i,a.object=this,t.push(a)}zr.length=0}}setColorAt(e,t){this.instanceColor===null&&(this.instanceColor=new kn(new Float32Array(this.instanceMatrix.count*3),3)),t.toArray(this.instanceColor.array,e*3)}setMatrixAt(e,t){t.toArray(this.instanceMatrix.array,e*16)}setMorphAt(e,t){const r=t.morphTargetInfluences,n=r.length+1;this.morphTexture===null&&(this.morphTexture=new Os(new Float32Array(n*this.count),n,this.count,Zo,Un));const i=this.morphTexture.source.data.data;let s=0;for(let l=0;l<r.length;l++)s+=r[l];const o=this.geometry.morphTargetsRelative?1:1-s,a=n*e;i[a]=o,i.set(r,a+1)}updateMorphTargets(){}dispose(){this.dispatchEvent({type:"dispose"})}}class Gs extends ut{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Y(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}}const rs=new v,ns=new v,is=new B,bn=new hr,Pr=new we;class qn extends q{constructor(e=new Ae,t=new Gs){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){const e=this.geometry;if(e.index===null){const t=e.attributes.position,r=[0];for(let n=1,i=t.count;n<i;n++)rs.fromBufferAttribute(t,n-1),ns.fromBufferAttribute(t,n),r[n]=r[n-1],r[n]+=rs.distanceTo(ns);e.setAttribute("lineDistance",new Vn(r,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){const r=this.geometry,n=this.matrixWorld,i=e.params.Line.threshold,s=r.drawRange;if(r.boundingSphere===null&&r.computeBoundingSphere(),Pr.copy(r.boundingSphere),Pr.applyMatrix4(n),Pr.radius+=i,e.ray.intersectsSphere(Pr)===!1)return;is.copy(n).invert(),bn.copy(e.ray).applyMatrix4(is);const o=i/((this.scale.x+this.scale.y+this.scale.z)/3),a=o*o,l=new v,h=new v,u=new v,d=new v,f=this.isLineSegments?2:1,p=r.index,m=r.attributes.position;if(p!==null){const w=Math.max(0,s.start),_=Math.min(p.count,s.start+s.count);for(let A=w,S=_-1;A<S;A+=f){const C=p.getX(A),R=p.getX(A+1);if(l.fromBufferAttribute(m,C),h.fromBufferAttribute(m,R),bn.distanceSqToSegment(l,h,d,u)>a)continue;d.applyMatrix4(this.matrixWorld);const E=e.ray.origin.distanceTo(d);E<e.near||E>e.far||t.push({distance:E,point:u.clone().applyMatrix4(this.matrixWorld),index:A,face:null,faceIndex:null,object:this})}}else{const w=Math.max(0,s.start),_=Math.min(m.count,s.start+s.count);for(let A=w,S=_-1;A<S;A+=f){if(l.fromBufferAttribute(m,A),h.fromBufferAttribute(m,A+1),bn.distanceSqToSegment(l,h,d,u)>a)continue;d.applyMatrix4(this.matrixWorld);const R=e.ray.origin.distanceTo(d);R<e.near||R>e.far||t.push({distance:R,point:u.clone().applyMatrix4(this.matrixWorld),index:A,face:null,faceIndex:null,object:this})}}}updateMorphTargets(){const t=this.geometry.morphAttributes,r=Object.keys(t);if(r.length>0){const n=t[r[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let i=0,s=n.length;i<s;i++){const o=n[i].name||String(i);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=i}}}}}const ss=new v,os=new v;class Xa extends qn{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){const e=this.geometry;if(e.index===null){const t=e.attributes.position,r=[];for(let n=0,i=t.count;n<i;n+=2)ss.fromBufferAttribute(t,n),os.fromBufferAttribute(t,n+1),r[n]=n===0?0:r[n-1],r[n+1]=r[n]+ss.distanceTo(os);e.setAttribute("lineDistance",new Vn(r,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class Za extends qn{constructor(e,t){super(e,t),this.isLineLoop=!0,this.type="LineLoop"}}class Fs extends ut{constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new Y(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}}const as=new B,Ln=new hr,kr=new we,Lr=new v;class Ka extends q{constructor(e=new Ae,t=new Fs){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}raycast(e,t){const r=this.geometry,n=this.matrixWorld,i=e.params.Points.threshold,s=r.drawRange;if(r.boundingSphere===null&&r.computeBoundingSphere(),kr.copy(r.boundingSphere),kr.applyMatrix4(n),kr.radius+=i,e.ray.intersectsSphere(kr)===!1)return;as.copy(n).invert(),Ln.copy(e.ray).applyMatrix4(as);const o=i/((this.scale.x+this.scale.y+this.scale.z)/3),a=o*o,l=r.index,u=r.attributes.position;if(l!==null){const d=Math.max(0,s.start),f=Math.min(l.count,s.start+s.count);for(let p=d,g=f;p<g;p++){const m=l.getX(p);Lr.fromBufferAttribute(u,m),ls(Lr,m,a,n,e,t,this)}}else{const d=Math.max(0,s.start),f=Math.min(u.count,s.start+s.count);for(let p=d,g=f;p<g;p++)Lr.fromBufferAttribute(u,p),ls(Lr,p,a,n,e,t,this)}}updateMorphTargets(){const t=this.geometry.morphAttributes,r=Object.keys(t);if(r.length>0){const n=t[r[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let i=0,s=n.length;i<s;i++){const o=n[i].name||String(i);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=i}}}}}function ls(c,e,t,r,n,i,s){const o=Ln.distanceSqToPoint(c);if(o<t){const a=new v;Ln.closestPointToPoint(c,a),a.applyMatrix4(r);const l=n.ray.origin.distanceTo(a);if(l<n.near||l>n.far)return;i.push({distance:l,distanceToRay:Math.sqrt(o),point:a,index:e,face:null,object:s})}}class $n extends ut{constructor(e){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.type="MeshStandardMaterial",this.color=new Y(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Y(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Qo,this.normalScale=new k(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ot,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}class Ne extends $n{constructor(e){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new k(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return Z(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(t){this.ior=(1+.4*t)/(1-.4*t)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new Y(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new Y(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new Y(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._iridescence=0,this._sheen=0,this._transmission=0,this.setValues(e)}get anisotropy(){return this._anisotropy}set anisotropy(e){this._anisotropy>0!=e>0&&this.version++,this._anisotropy=e}get clearcoat(){return this._clearcoat}set clearcoat(e){this._clearcoat>0!=e>0&&this.version++,this._clearcoat=e}get iridescence(){return this._iridescence}set iridescence(e){this._iridescence>0!=e>0&&this.version++,this._iridescence=e}get sheen(){return this._sheen}set sheen(e){this._sheen>0!=e>0&&this.version++,this._sheen=e}get transmission(){return this._transmission}set transmission(e){this._transmission>0!=e>0&&this.version++,this._transmission=e}copy(e){return super.copy(e),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=e.anisotropy,this.anisotropyRotation=e.anisotropyRotation,this.anisotropyMap=e.anisotropyMap,this.clearcoat=e.clearcoat,this.clearcoatMap=e.clearcoatMap,this.clearcoatRoughness=e.clearcoatRoughness,this.clearcoatRoughnessMap=e.clearcoatRoughnessMap,this.clearcoatNormalMap=e.clearcoatNormalMap,this.clearcoatNormalScale.copy(e.clearcoatNormalScale),this.ior=e.ior,this.iridescence=e.iridescence,this.iridescenceMap=e.iridescenceMap,this.iridescenceIOR=e.iridescenceIOR,this.iridescenceThicknessRange=[...e.iridescenceThicknessRange],this.iridescenceThicknessMap=e.iridescenceThicknessMap,this.sheen=e.sheen,this.sheenColor.copy(e.sheenColor),this.sheenColorMap=e.sheenColorMap,this.sheenRoughness=e.sheenRoughness,this.sheenRoughnessMap=e.sheenRoughnessMap,this.transmission=e.transmission,this.transmissionMap=e.transmissionMap,this.thickness=e.thickness,this.thicknessMap=e.thicknessMap,this.attenuationDistance=e.attenuationDistance,this.attenuationColor.copy(e.attenuationColor),this.specularIntensity=e.specularIntensity,this.specularIntensityMap=e.specularIntensityMap,this.specularColor.copy(e.specularColor),this.specularColorMap=e.specularColorMap,this}}function Dr(c,e,t){return!c||!t&&c.constructor===e?c:typeof e.BYTES_PER_ELEMENT=="number"?new e(c):Array.prototype.slice.call(c)}function Ja(c){return ArrayBuffer.isView(c)&&!(c instanceof DataView)}function Qa(c){function e(n,i){return c[n]-c[i]}const t=c.length,r=new Array(t);for(let n=0;n!==t;++n)r[n]=n;return r.sort(e),r}function hs(c,e,t){const r=c.length,n=new c.constructor(r);for(let i=0,s=0;s!==r;++i){const o=t[i]*e;for(let a=0;a!==e;++a)n[s++]=c[o+a]}return n}function Ns(c,e,t,r){let n=1,i=c[0];for(;i!==void 0&&i[r]===void 0;)i=c[n++];if(i===void 0)return;let s=i[r];if(s!==void 0)if(Array.isArray(s))do s=i[r],s!==void 0&&(e.push(i.time),t.push.apply(t,s)),i=c[n++];while(i!==void 0);else if(s.toArray!==void 0)do s=i[r],s!==void 0&&(e.push(i.time),s.toArray(t,t.length)),i=c[n++];while(i!==void 0);else do s=i[r],s!==void 0&&(e.push(i.time),t.push(s)),i=c[n++];while(i!==void 0)}class cr{constructor(e,t,r,n){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=n!==void 0?n:new t.constructor(r),this.sampleValues=t,this.valueSize=r,this.settings=null,this.DefaultSettings_={}}evaluate(e){const t=this.parameterPositions;let r=this._cachedIndex,n=t[r],i=t[r-1];r:{e:{let s;t:{n:if(!(e<n)){for(let o=r+2;;){if(n===void 0){if(e<i)break n;return r=t.length,this._cachedIndex=r,this.copySampleValue_(r-1)}if(r===o)break;if(i=n,n=t[++r],e<n)break e}s=t.length;break t}if(!(e>=i)){const o=t[1];e<o&&(r=2,i=o);for(let a=r-2;;){if(i===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(r===a)break;if(n=i,i=t[--r-1],e>=i)break e}s=r,r=0;break t}break r}for(;r<s;){const o=r+s>>>1;e<t[o]?s=o:r=o+1}if(n=t[r],i=t[r-1],i===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===void 0)return r=t.length,this._cachedIndex=r,this.copySampleValue_(r-1)}this._cachedIndex=r,this.intervalChanged_(r,i,n)}return this.interpolate_(r,i,e,n)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){const t=this.resultBuffer,r=this.sampleValues,n=this.valueSize,i=e*n;for(let s=0;s!==n;++s)t[s]=r[i+s];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}}class el extends cr{constructor(e,t,r,n){super(e,t,r,n),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Ii,endingEnd:Ii}}intervalChanged_(e,t,r){const n=this.parameterPositions;let i=e-2,s=e+1,o=n[i],a=n[s];if(o===void 0)switch(this.getSettings_().endingStart){case _i:i=e,o=2*t-r;break;case Ai:i=n.length-2,o=t+n[i]-n[i+1];break;default:i=e,o=r}if(a===void 0)switch(this.getSettings_().endingEnd){case _i:s=e,a=2*r-t;break;case Ai:s=1,a=r+n[1]-n[0];break;default:s=e-1,a=t}const l=(r-t)*.5,h=this.valueSize;this._weightPrev=l/(t-o),this._weightNext=l/(a-r),this._offsetPrev=i*h,this._offsetNext=s*h}interpolate_(e,t,r,n){const i=this.resultBuffer,s=this.sampleValues,o=this.valueSize,a=e*o,l=a-o,h=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,f=this._weightNext,p=(r-t)/(n-t),g=p*p,m=g*p,w=-d*m+2*d*g-d*p,_=(1+d)*m+(-1.5-2*d)*g+(-.5+d)*p+1,A=(-1-f)*m+(1.5+f)*g+.5*p,S=f*m-f*g;for(let C=0;C!==o;++C)i[C]=w*s[h+C]+_*s[l+C]+A*s[a+C]+S*s[u+C];return i}}class tl extends cr{constructor(e,t,r,n){super(e,t,r,n)}interpolate_(e,t,r,n){const i=this.resultBuffer,s=this.sampleValues,o=this.valueSize,a=e*o,l=a-o,h=(r-t)/(n-t),u=1-h;for(let d=0;d!==o;++d)i[d]=s[l+d]*u+s[a+d]*h;return i}}class rl extends cr{constructor(e,t,r,n){super(e,t,r,n)}interpolate_(e){return this.copySampleValue_(e-1)}}class Ce{constructor(e,t,r,n){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=Dr(t,this.TimeBufferType),this.values=Dr(r,this.ValueBufferType),this.setInterpolation(n||this.DefaultInterpolation)}static toJSON(e){const t=e.constructor;let r;if(t.toJSON!==this.toJSON)r=t.toJSON(e);else{r={name:e.name,times:Dr(e.times,Array),values:Dr(e.values,Array)};const n=e.getInterpolation();n!==e.DefaultInterpolation&&(r.interpolation=n)}return r.type=e.ValueTypeName,r}InterpolantFactoryMethodDiscrete(e){return new rl(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new tl(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new el(this.times,this.values,this.getValueSize(),e)}setInterpolation(e){let t;switch(e){case sr:t=this.InterpolantFactoryMethodDiscrete;break;case kt:t=this.InterpolantFactoryMethodLinear;break;case Zr:t=this.InterpolantFactoryMethodSmooth;break}if(t===void 0){const r="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(r);return console.warn("THREE.KeyframeTrack:",r),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return sr;case this.InterpolantFactoryMethodLinear:return kt;case this.InterpolantFactoryMethodSmooth:return Zr}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){const t=this.times;for(let r=0,n=t.length;r!==n;++r)t[r]+=e}return this}scale(e){if(e!==1){const t=this.times;for(let r=0,n=t.length;r!==n;++r)t[r]*=e}return this}trim(e,t){const r=this.times,n=r.length;let i=0,s=n-1;for(;i!==n&&r[i]<e;)++i;for(;s!==-1&&r[s]>t;)--s;if(++s,i!==0||s!==n){i>=s&&(s=Math.max(s,1),i=s-1);const o=this.getValueSize();this.times=r.slice(i,s),this.values=this.values.slice(i*o,s*o)}return this}validate(){let e=!0;const t=this.getValueSize();t-Math.floor(t)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),e=!1);const r=this.times,n=this.values,i=r.length;i===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),e=!1);let s=null;for(let o=0;o!==i;o++){const a=r[o];if(typeof a=="number"&&isNaN(a)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,o,a),e=!1;break}if(s!==null&&s>a){console.error("THREE.KeyframeTrack: Out of order keys.",this,o,a,s),e=!1;break}s=a}if(n!==void 0&&Ja(n))for(let o=0,a=n.length;o!==a;++o){const l=n[o];if(isNaN(l)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,o,l),e=!1;break}}return e}optimize(){const e=this.times.slice(),t=this.values.slice(),r=this.getValueSize(),n=this.getInterpolation()===Zr,i=e.length-1;let s=1;for(let o=1;o<i;++o){let a=!1;const l=e[o],h=e[o+1];if(l!==h&&(o!==1||l!==e[0]))if(n)a=!0;else{const u=o*r,d=u-r,f=u+r;for(let p=0;p!==r;++p){const g=t[u+p];if(g!==t[d+p]||g!==t[f+p]){a=!0;break}}}if(a){if(o!==s){e[s]=e[o];const u=o*r,d=s*r;for(let f=0;f!==r;++f)t[d+f]=t[u+f]}++s}}if(i>0){e[s]=e[i];for(let o=i*r,a=s*r,l=0;l!==r;++l)t[a+l]=t[o+l];++s}return s!==e.length?(this.times=e.slice(0,s),this.values=t.slice(0,s*r)):(this.times=e,this.values=t),this}clone(){const e=this.times.slice(),t=this.values.slice(),r=this.constructor,n=new r(this.name,e,t);return n.createInterpolant=this.createInterpolant,n}}Ce.prototype.TimeBufferType=Float32Array;Ce.prototype.ValueBufferType=Float32Array;Ce.prototype.DefaultInterpolation=kt;class Gt extends Ce{}Gt.prototype.ValueTypeName="bool";Gt.prototype.ValueBufferType=Array;Gt.prototype.DefaultInterpolation=sr;Gt.prototype.InterpolantFactoryMethodLinear=void 0;Gt.prototype.InterpolantFactoryMethodSmooth=void 0;class Us extends Ce{}Us.prototype.ValueTypeName="color";class Lt extends Ce{}Lt.prototype.ValueTypeName="number";class nl extends cr{constructor(e,t,r,n){super(e,t,r,n)}interpolate_(e,t,r,n){const i=this.resultBuffer,s=this.sampleValues,o=this.valueSize,a=(r-t)/(n-t);let l=e*o;for(let h=l+o;l!==h;l+=4)Me.slerpFlat(i,0,s,l-o,s,l,a);return i}}class dt extends Ce{InterpolantFactoryMethodLinear(e){return new nl(this.times,this.values,this.getValueSize(),e)}}dt.prototype.ValueTypeName="quaternion";dt.prototype.DefaultInterpolation=kt;dt.prototype.InterpolantFactoryMethodSmooth=void 0;class Ft extends Ce{}Ft.prototype.ValueTypeName="string";Ft.prototype.ValueBufferType=Array;Ft.prototype.DefaultInterpolation=sr;Ft.prototype.InterpolantFactoryMethodLinear=void 0;Ft.prototype.InterpolantFactoryMethodSmooth=void 0;class Dt extends Ce{}Dt.prototype.ValueTypeName="vector";class il{constructor(e,t=-1,r,n=Ko){this.name=e,this.tracks=r,this.duration=t,this.blendMode=n,this.uuid=ve(),this.duration<0&&this.resetDuration()}static parse(e){const t=[],r=e.tracks,n=1/(e.fps||1);for(let s=0,o=r.length;s!==o;++s)t.push(ol(r[s]).scale(n));const i=new this(e.name,e.duration,t,e.blendMode);return i.uuid=e.uuid,i}static toJSON(e){const t=[],r=e.tracks,n={name:e.name,duration:e.duration,tracks:t,uuid:e.uuid,blendMode:e.blendMode};for(let i=0,s=r.length;i!==s;++i)t.push(Ce.toJSON(r[i]));return n}static CreateFromMorphTargetSequence(e,t,r,n){const i=t.length,s=[];for(let o=0;o<i;o++){let a=[],l=[];a.push((o+i-1)%i,o,(o+1)%i),l.push(0,1,0);const h=Qa(a);a=hs(a,1,h),l=hs(l,1,h),!n&&a[0]===0&&(a.push(i),l.push(l[0])),s.push(new Lt(".morphTargetInfluences["+t[o].name+"]",a,l).scale(1/r))}return new this(e,-1,s)}static findByName(e,t){let r=e;if(!Array.isArray(e)){const n=e;r=n.geometry&&n.geometry.animations||n.animations}for(let n=0;n<r.length;n++)if(r[n].name===t)return r[n];return null}static CreateClipsFromMorphTargetSequences(e,t,r){const n={},i=/^([\w-]*?)([\d]+)$/;for(let o=0,a=e.length;o<a;o++){const l=e[o],h=l.name.match(i);if(h&&h.length>1){const u=h[1];let d=n[u];d||(n[u]=d=[]),d.push(l)}}const s=[];for(const o in n)s.push(this.CreateFromMorphTargetSequence(o,n[o],t,r));return s}static parseAnimation(e,t){if(!e)return console.error("THREE.AnimationClip: No animation in JSONLoader data."),null;const r=function(u,d,f,p,g){if(f.length!==0){const m=[],w=[];Ns(f,m,w,p),m.length!==0&&g.push(new u(d,m,w))}},n=[],i=e.name||"default",s=e.fps||30,o=e.blendMode;let a=e.length||-1;const l=e.hierarchy||[];for(let u=0;u<l.length;u++){const d=l[u].keys;if(!(!d||d.length===0))if(d[0].morphTargets){const f={};let p;for(p=0;p<d.length;p++)if(d[p].morphTargets)for(let g=0;g<d[p].morphTargets.length;g++)f[d[p].morphTargets[g]]=-1;for(const g in f){const m=[],w=[];for(let _=0;_!==d[p].morphTargets.length;++_){const A=d[p];m.push(A.time),w.push(A.morphTarget===g?1:0)}n.push(new Lt(".morphTargetInfluence["+g+"]",m,w))}a=f.length*s}else{const f=".bones["+t[u].name+"]";r(Dt,f+".position",d,"pos",n),r(dt,f+".quaternion",d,"rot",n),r(Dt,f+".scale",d,"scl",n)}}return n.length===0?null:new this(i,a,n,o)}resetDuration(){const e=this.tracks;let t=0;for(let r=0,n=e.length;r!==n;++r){const i=this.tracks[r];t=Math.max(t,i.times[i.times.length-1])}return this.duration=t,this}trim(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].trim(0,this.duration);return this}validate(){let e=!0;for(let t=0;t<this.tracks.length;t++)e=e&&this.tracks[t].validate();return e}optimize(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].optimize();return this}clone(){const e=[];for(let t=0;t<this.tracks.length;t++)e.push(this.tracks[t].clone());return new this.constructor(this.name,this.duration,e,this.blendMode)}toJSON(){return this.constructor.toJSON(this)}}function sl(c){switch(c.toLowerCase()){case"scalar":case"double":case"float":case"number":case"integer":return Lt;case"vector":case"vector2":case"vector3":case"vector4":return Dt;case"color":return Us;case"quaternion":return dt;case"bool":case"boolean":return Gt;case"string":return Ft}throw new Error("THREE.KeyframeTrack: Unsupported typeName: "+c)}function ol(c){if(c.type===void 0)throw new Error("THREE.KeyframeTrack: track type undefined, can not parse");const e=sl(c.type);if(c.times===void 0){const t=[],r=[];Ns(c.keys,t,r,"value"),c.times=t,c.values=r}return e.parse!==void 0?e.parse(c):new e(c.name,c.times,c.values,c.interpolation)}const Qe={enabled:!1,files:{},add:function(c,e){this.enabled!==!1&&(this.files[c]=e)},get:function(c){if(this.enabled!==!1)return this.files[c]},remove:function(c){delete this.files[c]},clear:function(){this.files={}}};class al{constructor(e,t,r){const n=this;let i=!1,s=0,o=0,a;const l=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=r,this.itemStart=function(h){o++,i===!1&&n.onStart!==void 0&&n.onStart(h,s,o),i=!0},this.itemEnd=function(h){s++,n.onProgress!==void 0&&n.onProgress(h,s,o),s===o&&(i=!1,n.onLoad!==void 0&&n.onLoad())},this.itemError=function(h){n.onError!==void 0&&n.onError(h)},this.resolveURL=function(h){return a?a(h):h},this.setURLModifier=function(h){return a=h,this},this.addHandler=function(h,u){return l.push(h,u),this},this.removeHandler=function(h){const u=l.indexOf(h);return u!==-1&&l.splice(u,2),this},this.getHandler=function(h){for(let u=0,d=l.length;u<d;u+=2){const f=l[u],p=l[u+1];if(f.global&&(f.lastIndex=0),f.test(h))return p}return null}}}const ll=new al;class ft{constructor(e){this.manager=e!==void 0?e:ll,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){const r=this;return new Promise(function(n,i){r.load(e,n,t,i)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}}ft.DEFAULT_MATERIAL_NAME="__DEFAULT";const De={};class hl extends Error{constructor(e,t){super(e),this.response=t}}class Hr extends ft{constructor(e){super(e)}load(e,t,r,n){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);const i=Qe.get(e);if(i!==void 0)return this.manager.itemStart(e),setTimeout(()=>{t&&t(i),this.manager.itemEnd(e)},0),i;if(De[e]!==void 0){De[e].push({onLoad:t,onProgress:r,onError:n});return}De[e]=[],De[e].push({onLoad:t,onProgress:r,onError:n});const s=new Request(e,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin"}),o=this.mimeType,a=this.responseType;fetch(s).then(l=>{if(l.status===200||l.status===0){if(l.status===0&&console.warn("THREE.FileLoader: HTTP Status 0 received."),typeof ReadableStream>"u"||l.body===void 0||l.body.getReader===void 0)return l;const h=De[e],u=l.body.getReader(),d=l.headers.get("Content-Length")||l.headers.get("X-File-Size"),f=d?parseInt(d):0,p=f!==0;let g=0;const m=new ReadableStream({start(w){_();function _(){u.read().then(({done:A,value:S})=>{if(A)w.close();else{g+=S.byteLength;const C=new ProgressEvent("progress",{lengthComputable:p,loaded:g,total:f});for(let R=0,M=h.length;R<M;R++){const E=h[R];E.onProgress&&E.onProgress(C)}w.enqueue(S),_()}})}}});return new Response(m)}else throw new hl(`fetch for "${l.url}" responded with ${l.status}: ${l.statusText}`,l)}).then(l=>{switch(a){case"arraybuffer":return l.arrayBuffer();case"blob":return l.blob();case"document":return l.text().then(h=>new DOMParser().parseFromString(h,o));case"json":return l.json();default:if(o===void 0)return l.text();{const u=/charset="?([^;"\s]*)"?/i.exec(o),d=u&&u[1]?u[1].toLowerCase():void 0,f=new TextDecoder(d);return l.arrayBuffer().then(p=>f.decode(p))}}}).then(l=>{Qe.add(e,l);const h=De[e];delete De[e];for(let u=0,d=h.length;u<d;u++){const f=h[u];f.onLoad&&f.onLoad(l)}}).catch(l=>{const h=De[e];if(h===void 0)throw this.manager.itemError(e),l;delete De[e];for(let u=0,d=h.length;u<d;u++){const f=h[u];f.onError&&f.onError(l)}this.manager.itemError(e)}).finally(()=>{this.manager.itemEnd(e)}),this.manager.itemStart(e)}setResponseType(e){return this.responseType=e,this}setMimeType(e){return this.mimeType=e,this}}class cl extends ft{constructor(e){super(e)}load(e,t,r,n){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);const i=this,s=Qe.get(e);if(s!==void 0)return i.manager.itemStart(e),setTimeout(function(){t&&t(s),i.manager.itemEnd(e)},0),s;const o=Pn("img");function a(){h(),Qe.add(e,this),t&&t(this),i.manager.itemEnd(e)}function l(u){h(),n&&n(u),i.manager.itemError(e),i.manager.itemEnd(e)}function h(){o.removeEventListener("load",a,!1),o.removeEventListener("error",l,!1)}return o.addEventListener("load",a,!1),o.addEventListener("error",l,!1),e.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(o.crossOrigin=this.crossOrigin),i.manager.itemStart(e),o.src=e,o}}class ul extends ft{constructor(e){super(e)}load(e,t,r,n){const i=new fe,s=new cl(this.manager);return s.setCrossOrigin(this.crossOrigin),s.setPath(this.path),s.load(e,function(o){i.image=o,i.needsUpdate=!0,t!==void 0&&t(i)},r,n),i}}let Yn=class extends q{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new Y(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){const t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),t}};const vn=new B,cs=new v,us=new v;class Xn{constructor(e){this.camera=e,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new k(512,512),this.map=null,this.mapPass=null,this.matrix=new B,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Na,this._frameExtents=new k(1,1),this._viewportCount=1,this._viewports=[new de(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){const t=this.camera,r=this.matrix;cs.setFromMatrixPosition(e.matrixWorld),t.position.copy(cs),us.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(us),t.updateMatrixWorld(),vn.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(vn),r.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),r.multiply(vn)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.bias=e.bias,this.radius=e.radius,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const e={};return this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}}class dl extends Xn{constructor(){super(new qr(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1}updateMatrices(e){const t=this.camera,r=or*2*e.angle*this.focus,n=this.mapSize.width/this.mapSize.height,i=e.distance||t.far;(r!==t.fov||n!==t.aspect||i!==t.far)&&(t.fov=r,t.aspect=n,t.far=i,t.updateProjectionMatrix()),super.updateMatrices(e)}copy(e){return super.copy(e),this.focus=e.focus,this}}class fl extends Yn{constructor(e,t,r=0,n=Math.PI/3,i=0,s=2){super(e,t),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(q.DEFAULT_UP),this.updateMatrix(),this.target=new q,this.distance=r,this.angle=n,this.penumbra=i,this.decay=s,this.map=null,this.shadow=new dl}get power(){return this.intensity*Math.PI}set power(e){this.intensity=e/Math.PI}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.angle=e.angle,this.penumbra=e.penumbra,this.decay=e.decay,this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}}const ds=new B,Xt=new v,wn=new v;class pl extends Xn{constructor(){super(new qr(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new k(4,2),this._viewportCount=6,this._viewports=[new de(2,1,1,1),new de(0,1,1,1),new de(3,1,1,1),new de(1,1,1,1),new de(3,0,1,1),new de(1,0,1,1)],this._cubeDirections=[new v(1,0,0),new v(-1,0,0),new v(0,0,1),new v(0,0,-1),new v(0,1,0),new v(0,-1,0)],this._cubeUps=[new v(0,1,0),new v(0,1,0),new v(0,1,0),new v(0,1,0),new v(0,0,1),new v(0,0,-1)]}updateMatrices(e,t=0){const r=this.camera,n=this.matrix,i=e.distance||r.far;i!==r.far&&(r.far=i,r.updateProjectionMatrix()),Xt.setFromMatrixPosition(e.matrixWorld),r.position.copy(Xt),wn.copy(r.position),wn.add(this._cubeDirections[t]),r.up.copy(this._cubeUps[t]),r.lookAt(wn),r.updateMatrixWorld(),n.makeTranslation(-Xt.x,-Xt.y,-Xt.z),ds.multiplyMatrices(r.projectionMatrix,r.matrixWorldInverse),this._frustum.setFromProjectionMatrix(ds)}}class ml extends Yn{constructor(e,t,r=0,n=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=r,this.decay=n,this.shadow=new pl}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}}class yl extends Xn{constructor(){super(new Ls(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class gl extends Yn{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(q.DEFAULT_UP),this.updateMatrix(),this.target=new q,this.shadow=new yl}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}}class tr{static decodeText(e){if(typeof TextDecoder<"u")return new TextDecoder().decode(e);let t="";for(let r=0,n=e.length;r<n;r++)t+=String.fromCharCode(e[r]);try{return decodeURIComponent(escape(t))}catch{return t}}static extractUrlBase(e){const t=e.lastIndexOf("/");return t===-1?"./":e.slice(0,t+1)}static resolveURL(e,t){return typeof e!="string"||e===""?"":(/^https?:\/\//i.test(t)&&/^\//.test(e)&&(t=t.replace(/(^https?:\/\/[^\/]+).*/i,"$1")),/^(https?:)?\/\//i.test(e)||/^data:.*,.*$/i.test(e)||/^blob:.*$/i.test(e)?e:t+e)}}class xl extends ft{constructor(e){super(e),this.isImageBitmapLoader=!0,typeof createImageBitmap>"u"&&console.warn("THREE.ImageBitmapLoader: createImageBitmap() not supported."),typeof fetch>"u"&&console.warn("THREE.ImageBitmapLoader: fetch() not supported."),this.options={premultiplyAlpha:"none"}}setOptions(e){return this.options=e,this}load(e,t,r,n){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);const i=this,s=Qe.get(e);if(s!==void 0){if(i.manager.itemStart(e),s.then){s.then(l=>{t&&t(l),i.manager.itemEnd(e)}).catch(l=>{n&&n(l)});return}return setTimeout(function(){t&&t(s),i.manager.itemEnd(e)},0),s}const o={};o.credentials=this.crossOrigin==="anonymous"?"same-origin":"include",o.headers=this.requestHeader;const a=fetch(e,o).then(function(l){return l.blob()}).then(function(l){return createImageBitmap(l,Object.assign(i.options,{colorSpaceConversion:"none"}))}).then(function(l){return Qe.add(e,l),t&&t(l),i.manager.itemEnd(e),l}).catch(function(l){n&&n(l),Qe.remove(e),i.manager.itemError(e),i.manager.itemEnd(e)});Qe.add(e,a),i.manager.itemStart(e)}}const Zn="\\[\\]\\.:\\/",bl=new RegExp("["+Zn+"]","g"),Kn="[^"+Zn+"]",vl="[^"+Zn.replace("\\.","")+"]",wl=/((?:WC+[\/:])*)/.source.replace("WC",Kn),Il=/(WCOD+)?/.source.replace("WCOD",vl),_l=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Kn),Al=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Kn),Sl=new RegExp("^"+wl+Il+_l+Al+"$"),Ml=["material","materials","bones","map"];class Cl{constructor(e,t,r){const n=r||G.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,n)}getValue(e,t){this.bind();const r=this._targetGroup.nCachedObjects_,n=this._bindings[r];n!==void 0&&n.getValue(e,t)}setValue(e,t){const r=this._bindings;for(let n=this._targetGroup.nCachedObjects_,i=r.length;n!==i;++n)r[n].setValue(e,t)}bind(){const e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,r=e.length;t!==r;++t)e[t].bind()}unbind(){const e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,r=e.length;t!==r;++t)e[t].unbind()}}class G{constructor(e,t,r){this.path=t,this.parsedPath=r||G.parseTrackName(t),this.node=G.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,r){return e&&e.isAnimationObjectGroup?new G.Composite(e,t,r):new G(e,t,r)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(bl,"")}static parseTrackName(e){const t=Sl.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);const r={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},n=r.nodeName&&r.nodeName.lastIndexOf(".");if(n!==void 0&&n!==-1){const i=r.nodeName.substring(n+1);Ml.indexOf(i)!==-1&&(r.nodeName=r.nodeName.substring(0,n),r.objectName=i)}if(r.propertyName===null||r.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return r}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){const r=e.skeleton.getBoneByName(t);if(r!==void 0)return r}if(e.children){const r=function(i){for(let s=0;s<i.length;s++){const o=i[s];if(o.name===t||o.uuid===t)return o;const a=r(o.children);if(a)return a}return null},n=r(e.children);if(n)return n}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){const r=this.resolvedProperty;for(let n=0,i=r.length;n!==i;++n)e[t++]=r[n]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){const r=this.resolvedProperty;for(let n=0,i=r.length;n!==i;++n)r[n]=e[t++]}_setValue_array_setNeedsUpdate(e,t){const r=this.resolvedProperty;for(let n=0,i=r.length;n!==i;++n)r[n]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){const r=this.resolvedProperty;for(let n=0,i=r.length;n!==i;++n)r[n]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node;const t=this.parsedPath,r=t.objectName,n=t.propertyName;let i=t.propertyIndex;if(e||(e=G.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(r){let l=t.objectIndex;switch(r){case"materials":if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let h=0;h<e.length;h++)if(e[h].name===l){l=h;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[r]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[r]}if(l!==void 0){if(e[l]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[l]}}const s=e[n];if(s===void 0){const l=t.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+l+"."+n+" but it wasn't found.",e);return}let o=this.Versioning.None;this.targetObject=e,e.needsUpdate!==void 0?o=this.Versioning.NeedsUpdate:e.matrixWorldNeedsUpdate!==void 0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let a=this.BindingType.Direct;if(i!==void 0){if(n==="morphTargetInfluences"){if(!e.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[i]!==void 0&&(i=e.morphTargetDictionary[i])}a=this.BindingType.ArrayElement,this.resolvedProperty=s,this.propertyIndex=i}else s.fromArray!==void 0&&s.toArray!==void 0?(a=this.BindingType.HasFromToArray,this.resolvedProperty=s):Array.isArray(s)?(a=this.BindingType.EntireArray,this.resolvedProperty=s):this.propertyName=n;this.getValue=this.GetterByBindingType[a],this.setValue=this.SetterByBindingTypeAndVersioning[a][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}}G.Composite=Cl;G.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};G.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};G.prototype.GetterByBindingType=[G.prototype._getValue_direct,G.prototype._getValue_array,G.prototype._getValue_arrayElement,G.prototype._getValue_toArray];G.prototype.SetterByBindingTypeAndVersioning=[[G.prototype._setValue_direct,G.prototype._setValue_direct_setNeedsUpdate,G.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[G.prototype._setValue_array,G.prototype._setValue_array_setNeedsUpdate,G.prototype._setValue_array_setMatrixWorldNeedsUpdate],[G.prototype._setValue_arrayElement,G.prototype._setValue_arrayElement_setNeedsUpdate,G.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[G.prototype._setValue_fromArray,G.prototype._setValue_fromArray_setNeedsUpdate,G.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];class fs{constructor(e=1,t=0,r=0){return this.radius=e,this.phi=t,this.theta=r,this}set(e,t,r){return this.radius=e,this.phi=t,this.theta=r,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){return this.phi=Math.max(1e-6,Math.min(Math.PI-1e-6,this.phi)),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,r){return this.radius=Math.sqrt(e*e+t*t+r*r),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,r),this.phi=Math.acos(Z(t/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Ss}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Ss);function Vr(c){document.querySelector("span").innerHTML=c}function Tl(c){return Object.keys(c)}const El=c=>c&&typeof c.length=="number"&&c.buffer instanceof ArrayBuffer&&typeof c.byteLength=="number",L={i32:{numElements:1,align:4,size:4,type:"i32",View:Int32Array},u32:{numElements:1,align:4,size:4,type:"u32",View:Uint32Array},f32:{numElements:1,align:4,size:4,type:"f32",View:Float32Array},f16:{numElements:1,align:2,size:2,type:"u16",View:Uint16Array},vec2f:{numElements:2,align:8,size:8,type:"f32",View:Float32Array},vec2i:{numElements:2,align:8,size:8,type:"i32",View:Int32Array},vec2u:{numElements:2,align:8,size:8,type:"u32",View:Uint32Array},vec2h:{numElements:2,align:4,size:4,type:"u16",View:Uint16Array},vec3i:{numElements:3,align:16,size:12,type:"i32",View:Int32Array},vec3u:{numElements:3,align:16,size:12,type:"u32",View:Uint32Array},vec3f:{numElements:3,align:16,size:12,type:"f32",View:Float32Array},vec3h:{numElements:3,align:8,size:6,type:"u16",View:Uint16Array},vec4i:{numElements:4,align:16,size:16,type:"i32",View:Int32Array},vec4u:{numElements:4,align:16,size:16,type:"u32",View:Uint32Array},vec4f:{numElements:4,align:16,size:16,type:"f32",View:Float32Array},vec4h:{numElements:4,align:8,size:8,type:"u16",View:Uint16Array},mat2x2f:{numElements:4,align:8,size:16,type:"f32",View:Float32Array},mat2x2h:{numElements:4,align:4,size:8,type:"u16",View:Uint16Array},mat3x2f:{numElements:6,align:8,size:24,type:"f32",View:Float32Array},mat3x2h:{numElements:6,align:4,size:12,type:"u16",View:Uint16Array},mat4x2f:{numElements:8,align:8,size:32,type:"f32",View:Float32Array},mat4x2h:{numElements:8,align:4,size:16,type:"u16",View:Uint16Array},mat2x3f:{numElements:8,align:16,size:32,pad:[3,1],type:"f32",View:Float32Array},mat2x3h:{numElements:8,align:8,size:16,pad:[3,1],type:"u16",View:Uint16Array},mat3x3f:{numElements:12,align:16,size:48,pad:[3,1],type:"f32",View:Float32Array},mat3x3h:{numElements:12,align:8,size:24,pad:[3,1],type:"u16",View:Uint16Array},mat4x3f:{numElements:16,align:16,size:64,pad:[3,1],type:"f32",View:Float32Array},mat4x3h:{numElements:16,align:8,size:32,pad:[3,1],type:"u16",View:Uint16Array},mat2x4f:{numElements:8,align:16,size:32,type:"f32",View:Float32Array},mat2x4h:{numElements:8,align:8,size:16,type:"u16",View:Uint16Array},mat3x4f:{numElements:12,align:16,size:48,pad:[3,1],type:"f32",View:Float32Array},mat3x4h:{numElements:12,align:8,size:24,pad:[3,1],type:"u16",View:Uint16Array},mat4x4f:{numElements:16,align:16,size:64,type:"f32",View:Float32Array},mat4x4h:{numElements:16,align:8,size:32,type:"u16",View:Uint16Array},bool:{numElements:0,align:1,size:0,type:"bool",View:Uint32Array}},Hs={...L,"atomic<i32>":L.i32,"atomic<u32>":L.u32,"vec2<i32>":L.vec2i,"vec2<u32>":L.vec2u,"vec2<f32>":L.vec2f,"vec2<f16>":L.vec2h,"vec3<i32>":L.vec3i,"vec3<u32>":L.vec3u,"vec3<f32>":L.vec3f,"vec3<f16>":L.vec3h,"vec4<i32>":L.vec4i,"vec4<u32>":L.vec4u,"vec4<f32>":L.vec4f,"vec4<f16>":L.vec4h,"mat2x2<f32>":L.mat2x2f,"mat2x2<f16>":L.mat2x2h,"mat3x2<f32>":L.mat3x2f,"mat3x2<f16>":L.mat3x2h,"mat4x2<f32>":L.mat4x2f,"mat4x2<f16>":L.mat4x2h,"mat2x3<f32>":L.mat2x3f,"mat2x3<f16>":L.mat2x3h,"mat3x3<f32>":L.mat3x3f,"mat3x3<f16>":L.mat3x3h,"mat4x3<f32>":L.mat4x3f,"mat4x3<f16>":L.mat4x3h,"mat2x4<f32>":L.mat2x4f,"mat2x4<f16>":L.mat2x4h,"mat3x4<f32>":L.mat3x4f,"mat3x4<f16>":L.mat3x4h,"mat4x4<f32>":L.mat4x4f,"mat4x4<f16>":L.mat4x4h},Rl=Tl(Hs);function Bl(c=[],e){const t=new Set;for(const r of Rl){const n=Hs[r];t.has(n)||(t.add(n),n.flatten=c.includes(r)?e:!e)}}Bl();var jr;(function(c){c.increment="++",c.decrement="--"})(jr||(jr={}));(function(c){function e(t){const r=t;if(r=="parse")throw new Error("Invalid value for IncrementOperator");return c[r]}c.parse=e})(jr||(jr={}));var Wr;(function(c){c.assign="=",c.addAssign="+=",c.subtractAssin="-=",c.multiplyAssign="*=",c.divideAssign="/=",c.moduloAssign="%=",c.andAssign="&=",c.orAssign="|=",c.xorAssign="^=",c.shiftLeftAssign="<<=",c.shiftRightAssign=">>="})(Wr||(Wr={}));(function(c){function e(t){const r=t;if(r=="parse")throw new Error("Invalid value for AssignOperator");return r}c.parse=e})(Wr||(Wr={}));var I,x;(function(c){c[c.token=0]="token",c[c.keyword=1]="keyword",c[c.reserved=2]="reserved"})(x||(x={}));class b{constructor(e,t,r){this.name=e,this.type=t,this.rule=r}toString(){return this.name}}class H{}I=H;H.none=new b("",x.reserved,"");H.eof=new b("EOF",x.token,"");H.reserved={asm:new b("asm",x.reserved,"asm"),bf16:new b("bf16",x.reserved,"bf16"),do:new b("do",x.reserved,"do"),enum:new b("enum",x.reserved,"enum"),f16:new b("f16",x.reserved,"f16"),f64:new b("f64",x.reserved,"f64"),handle:new b("handle",x.reserved,"handle"),i8:new b("i8",x.reserved,"i8"),i16:new b("i16",x.reserved,"i16"),i64:new b("i64",x.reserved,"i64"),mat:new b("mat",x.reserved,"mat"),premerge:new b("premerge",x.reserved,"premerge"),regardless:new b("regardless",x.reserved,"regardless"),typedef:new b("typedef",x.reserved,"typedef"),u8:new b("u8",x.reserved,"u8"),u16:new b("u16",x.reserved,"u16"),u64:new b("u64",x.reserved,"u64"),unless:new b("unless",x.reserved,"unless"),using:new b("using",x.reserved,"using"),vec:new b("vec",x.reserved,"vec"),void:new b("void",x.reserved,"void")};H.keywords={array:new b("array",x.keyword,"array"),atomic:new b("atomic",x.keyword,"atomic"),bool:new b("bool",x.keyword,"bool"),f32:new b("f32",x.keyword,"f32"),i32:new b("i32",x.keyword,"i32"),mat2x2:new b("mat2x2",x.keyword,"mat2x2"),mat2x3:new b("mat2x3",x.keyword,"mat2x3"),mat2x4:new b("mat2x4",x.keyword,"mat2x4"),mat3x2:new b("mat3x2",x.keyword,"mat3x2"),mat3x3:new b("mat3x3",x.keyword,"mat3x3"),mat3x4:new b("mat3x4",x.keyword,"mat3x4"),mat4x2:new b("mat4x2",x.keyword,"mat4x2"),mat4x3:new b("mat4x3",x.keyword,"mat4x3"),mat4x4:new b("mat4x4",x.keyword,"mat4x4"),ptr:new b("ptr",x.keyword,"ptr"),sampler:new b("sampler",x.keyword,"sampler"),sampler_comparison:new b("sampler_comparison",x.keyword,"sampler_comparison"),struct:new b("struct",x.keyword,"struct"),texture_1d:new b("texture_1d",x.keyword,"texture_1d"),texture_2d:new b("texture_2d",x.keyword,"texture_2d"),texture_2d_array:new b("texture_2d_array",x.keyword,"texture_2d_array"),texture_3d:new b("texture_3d",x.keyword,"texture_3d"),texture_cube:new b("texture_cube",x.keyword,"texture_cube"),texture_cube_array:new b("texture_cube_array",x.keyword,"texture_cube_array"),texture_multisampled_2d:new b("texture_multisampled_2d",x.keyword,"texture_multisampled_2d"),texture_storage_1d:new b("texture_storage_1d",x.keyword,"texture_storage_1d"),texture_storage_2d:new b("texture_storage_2d",x.keyword,"texture_storage_2d"),texture_storage_2d_array:new b("texture_storage_2d_array",x.keyword,"texture_storage_2d_array"),texture_storage_3d:new b("texture_storage_3d",x.keyword,"texture_storage_3d"),texture_depth_2d:new b("texture_depth_2d",x.keyword,"texture_depth_2d"),texture_depth_2d_array:new b("texture_depth_2d_array",x.keyword,"texture_depth_2d_array"),texture_depth_cube:new b("texture_depth_cube",x.keyword,"texture_depth_cube"),texture_depth_cube_array:new b("texture_depth_cube_array",x.keyword,"texture_depth_cube_array"),texture_depth_multisampled_2d:new b("texture_depth_multisampled_2d",x.keyword,"texture_depth_multisampled_2d"),texture_external:new b("texture_external",x.keyword,"texture_external"),u32:new b("u32",x.keyword,"u32"),vec2:new b("vec2",x.keyword,"vec2"),vec3:new b("vec3",x.keyword,"vec3"),vec4:new b("vec4",x.keyword,"vec4"),bitcast:new b("bitcast",x.keyword,"bitcast"),block:new b("block",x.keyword,"block"),break:new b("break",x.keyword,"break"),case:new b("case",x.keyword,"case"),continue:new b("continue",x.keyword,"continue"),continuing:new b("continuing",x.keyword,"continuing"),default:new b("default",x.keyword,"default"),discard:new b("discard",x.keyword,"discard"),else:new b("else",x.keyword,"else"),enable:new b("enable",x.keyword,"enable"),fallthrough:new b("fallthrough",x.keyword,"fallthrough"),false:new b("false",x.keyword,"false"),fn:new b("fn",x.keyword,"fn"),for:new b("for",x.keyword,"for"),function:new b("function",x.keyword,"function"),if:new b("if",x.keyword,"if"),let:new b("let",x.keyword,"let"),const:new b("const",x.keyword,"const"),loop:new b("loop",x.keyword,"loop"),while:new b("while",x.keyword,"while"),private:new b("private",x.keyword,"private"),read:new b("read",x.keyword,"read"),read_write:new b("read_write",x.keyword,"read_write"),return:new b("return",x.keyword,"return"),storage:new b("storage",x.keyword,"storage"),switch:new b("switch",x.keyword,"switch"),true:new b("true",x.keyword,"true"),alias:new b("alias",x.keyword,"alias"),type:new b("type",x.keyword,"type"),uniform:new b("uniform",x.keyword,"uniform"),var:new b("var",x.keyword,"var"),override:new b("override",x.keyword,"override"),workgroup:new b("workgroup",x.keyword,"workgroup"),write:new b("write",x.keyword,"write"),r8unorm:new b("r8unorm",x.keyword,"r8unorm"),r8snorm:new b("r8snorm",x.keyword,"r8snorm"),r8uint:new b("r8uint",x.keyword,"r8uint"),r8sint:new b("r8sint",x.keyword,"r8sint"),r16uint:new b("r16uint",x.keyword,"r16uint"),r16sint:new b("r16sint",x.keyword,"r16sint"),r16float:new b("r16float",x.keyword,"r16float"),rg8unorm:new b("rg8unorm",x.keyword,"rg8unorm"),rg8snorm:new b("rg8snorm",x.keyword,"rg8snorm"),rg8uint:new b("rg8uint",x.keyword,"rg8uint"),rg8sint:new b("rg8sint",x.keyword,"rg8sint"),r32uint:new b("r32uint",x.keyword,"r32uint"),r32sint:new b("r32sint",x.keyword,"r32sint"),r32float:new b("r32float",x.keyword,"r32float"),rg16uint:new b("rg16uint",x.keyword,"rg16uint"),rg16sint:new b("rg16sint",x.keyword,"rg16sint"),rg16float:new b("rg16float",x.keyword,"rg16float"),rgba8unorm:new b("rgba8unorm",x.keyword,"rgba8unorm"),rgba8unorm_srgb:new b("rgba8unorm_srgb",x.keyword,"rgba8unorm_srgb"),rgba8snorm:new b("rgba8snorm",x.keyword,"rgba8snorm"),rgba8uint:new b("rgba8uint",x.keyword,"rgba8uint"),rgba8sint:new b("rgba8sint",x.keyword,"rgba8sint"),bgra8unorm:new b("bgra8unorm",x.keyword,"bgra8unorm"),bgra8unorm_srgb:new b("bgra8unorm_srgb",x.keyword,"bgra8unorm_srgb"),rgb10a2unorm:new b("rgb10a2unorm",x.keyword,"rgb10a2unorm"),rg11b10float:new b("rg11b10float",x.keyword,"rg11b10float"),rg32uint:new b("rg32uint",x.keyword,"rg32uint"),rg32sint:new b("rg32sint",x.keyword,"rg32sint"),rg32float:new b("rg32float",x.keyword,"rg32float"),rgba16uint:new b("rgba16uint",x.keyword,"rgba16uint"),rgba16sint:new b("rgba16sint",x.keyword,"rgba16sint"),rgba16float:new b("rgba16float",x.keyword,"rgba16float"),rgba32uint:new b("rgba32uint",x.keyword,"rgba32uint"),rgba32sint:new b("rgba32sint",x.keyword,"rgba32sint"),rgba32float:new b("rgba32float",x.keyword,"rgba32float"),static_assert:new b("static_assert",x.keyword,"static_assert")};H.tokens={decimal_float_literal:new b("decimal_float_literal",x.token,/((-?[0-9]*\.[0-9]+|-?[0-9]+\.[0-9]*)((e|E)(\+|-)?[0-9]+)?f?)|(-?[0-9]+(e|E)(\+|-)?[0-9]+f?)|([0-9]+f)/),hex_float_literal:new b("hex_float_literal",x.token,/-?0x((([0-9a-fA-F]*\.[0-9a-fA-F]+|[0-9a-fA-F]+\.[0-9a-fA-F]*)((p|P)(\+|-)?[0-9]+f?)?)|([0-9a-fA-F]+(p|P)(\+|-)?[0-9]+f?))/),int_literal:new b("int_literal",x.token,/-?0x[0-9a-fA-F]+|0i?|-?[1-9][0-9]*i?/),uint_literal:new b("uint_literal",x.token,/0x[0-9a-fA-F]+u|0u|[1-9][0-9]*u/),ident:new b("ident",x.token,/[a-zA-Z][0-9a-zA-Z_]*/),and:new b("and",x.token,"&"),and_and:new b("and_and",x.token,"&&"),arrow:new b("arrow ",x.token,"->"),attr:new b("attr",x.token,"@"),attr_left:new b("attr_left",x.token,"[["),attr_right:new b("attr_right",x.token,"]]"),forward_slash:new b("forward_slash",x.token,"/"),bang:new b("bang",x.token,"!"),bracket_left:new b("bracket_left",x.token,"["),bracket_right:new b("bracket_right",x.token,"]"),brace_left:new b("brace_left",x.token,"{"),brace_right:new b("brace_right",x.token,"}"),colon:new b("colon",x.token,":"),comma:new b("comma",x.token,","),equal:new b("equal",x.token,"="),equal_equal:new b("equal_equal",x.token,"=="),not_equal:new b("not_equal",x.token,"!="),greater_than:new b("greater_than",x.token,">"),greater_than_equal:new b("greater_than_equal",x.token,">="),shift_right:new b("shift_right",x.token,">>"),less_than:new b("less_than",x.token,"<"),less_than_equal:new b("less_than_equal",x.token,"<="),shift_left:new b("shift_left",x.token,"<<"),modulo:new b("modulo",x.token,"%"),minus:new b("minus",x.token,"-"),minus_minus:new b("minus_minus",x.token,"--"),period:new b("period",x.token,"."),plus:new b("plus",x.token,"+"),plus_plus:new b("plus_plus",x.token,"++"),or:new b("or",x.token,"|"),or_or:new b("or_or",x.token,"||"),paren_left:new b("paren_left",x.token,"("),paren_right:new b("paren_right",x.token,")"),semicolon:new b("semicolon",x.token,";"),star:new b("star",x.token,"*"),tilde:new b("tilde",x.token,"~"),underscore:new b("underscore",x.token,"_"),xor:new b("xor",x.token,"^"),plus_equal:new b("plus_equal",x.token,"+="),minus_equal:new b("minus_equal",x.token,"-="),times_equal:new b("times_equal",x.token,"*="),division_equal:new b("division_equal",x.token,"/="),modulo_equal:new b("modulo_equal",x.token,"%="),and_equal:new b("and_equal",x.token,"&="),or_equal:new b("or_equal",x.token,"|="),xor_equal:new b("xor_equal",x.token,"^="),shift_right_equal:new b("shift_right_equal",x.token,">>="),shift_left_equal:new b("shift_left_equal",x.token,"<<=")};H.storage_class=[I.keywords.function,I.keywords.private,I.keywords.workgroup,I.keywords.uniform,I.keywords.storage];H.access_mode=[I.keywords.read,I.keywords.write,I.keywords.read_write];H.sampler_type=[I.keywords.sampler,I.keywords.sampler_comparison];H.sampled_texture_type=[I.keywords.texture_1d,I.keywords.texture_2d,I.keywords.texture_2d_array,I.keywords.texture_3d,I.keywords.texture_cube,I.keywords.texture_cube_array];H.multisampled_texture_type=[I.keywords.texture_multisampled_2d];H.storage_texture_type=[I.keywords.texture_storage_1d,I.keywords.texture_storage_2d,I.keywords.texture_storage_2d_array,I.keywords.texture_storage_3d];H.depth_texture_type=[I.keywords.texture_depth_2d,I.keywords.texture_depth_2d_array,I.keywords.texture_depth_cube,I.keywords.texture_depth_cube_array,I.keywords.texture_depth_multisampled_2d];H.texture_external_type=[I.keywords.texture_external];H.any_texture_type=[...I.sampled_texture_type,...I.multisampled_texture_type,...I.storage_texture_type,...I.depth_texture_type,...I.texture_external_type];H.texel_format=[I.keywords.r8unorm,I.keywords.r8snorm,I.keywords.r8uint,I.keywords.r8sint,I.keywords.r16uint,I.keywords.r16sint,I.keywords.r16float,I.keywords.rg8unorm,I.keywords.rg8snorm,I.keywords.rg8uint,I.keywords.rg8sint,I.keywords.r32uint,I.keywords.r32sint,I.keywords.r32float,I.keywords.rg16uint,I.keywords.rg16sint,I.keywords.rg16float,I.keywords.rgba8unorm,I.keywords.rgba8unorm_srgb,I.keywords.rgba8snorm,I.keywords.rgba8uint,I.keywords.rgba8sint,I.keywords.bgra8unorm,I.keywords.bgra8unorm_srgb,I.keywords.rgb10a2unorm,I.keywords.rg11b10float,I.keywords.rg32uint,I.keywords.rg32sint,I.keywords.rg32float,I.keywords.rgba16uint,I.keywords.rgba16sint,I.keywords.rgba16float,I.keywords.rgba32uint,I.keywords.rgba32sint,I.keywords.rgba32float];H.const_literal=[I.tokens.int_literal,I.tokens.uint_literal,I.tokens.decimal_float_literal,I.tokens.hex_float_literal,I.keywords.true,I.keywords.false];H.literal_or_ident=[I.tokens.ident,I.tokens.int_literal,I.tokens.uint_literal,I.tokens.decimal_float_literal,I.tokens.hex_float_literal];H.element_count_expression=[I.tokens.int_literal,I.tokens.uint_literal,I.tokens.ident];H.template_types=[I.keywords.vec2,I.keywords.vec3,I.keywords.vec4,I.keywords.mat2x2,I.keywords.mat2x3,I.keywords.mat2x4,I.keywords.mat3x2,I.keywords.mat3x3,I.keywords.mat3x4,I.keywords.mat4x2,I.keywords.mat4x3,I.keywords.mat4x4,I.keywords.atomic,I.keywords.bitcast,...I.any_texture_type];H.attribute_name=[I.tokens.ident,I.keywords.block];H.assignment_operators=[I.tokens.equal,I.tokens.plus_equal,I.tokens.minus_equal,I.tokens.times_equal,I.tokens.division_equal,I.tokens.modulo_equal,I.tokens.and_equal,I.tokens.or_equal,I.tokens.xor_equal,I.tokens.shift_right_equal,I.tokens.shift_left_equal];H.increment_operators=[I.tokens.plus_plus,I.tokens.minus_minus];var ps;(function(c){c[c.Uniform=0]="Uniform",c[c.Storage=1]="Storage",c[c.Texture=2]="Texture",c[c.Sampler=3]="Sampler",c[c.StorageTexture=4]="StorageTexture"})(ps||(ps={}));H.any_texture_type.map(c=>c.name);H.sampler_type.map(c=>c.name);function zl(c){switch(c.dimension){case"1d":return"1d";case"3d":return"3d";default:case"2d":return c.depthOrArrayLayers>1?"2d-array":"2d"}}function Pl(c){return[c.width,c.height||1,c.depthOrArrayLayers||1]}function kl(c){return Array.isArray(c)||El(c)?[...c,1,1].slice(0,3):Pl(c)}function Ll(c,e){const t=kl(c),r=Math.max(...t.slice(0,e==="3d"?3:2));return 1+Math.log2(r)|0}function Dl(c){let e,t;switch(c){case"2d":e="texture_2d<f32>",t="textureSample(ourTexture, ourSampler, fsInput.texcoord)";break;case"2d-array":e="texture_2d_array<f32>",t=`
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
              faceMat[uni.layer] * vec3f(fract(fsInput.texcoord), 1), uni.layer)`;break;default:throw new Error(`unsupported view: ${c}`)}return`
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
      `}const ms=new WeakMap;function Ol(c,e,t){let r=ms.get(c);r||(r={pipelineByFormatAndView:{},moduleByViewType:{}},ms.set(c,r));let{sampler:n,uniformBuffer:i,uniformValues:s}=r;const{pipelineByFormatAndView:o,moduleByViewType:a}=r;t=t||zl(e);let l=a[t];if(!l){const d=Dl(t);l=c.createShaderModule({label:`mip level generation for ${t}`,code:d}),a[t]=l}n||(n=c.createSampler({minFilter:"linear",magFilter:"linear"}),i=c.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),s=new Uint32Array(1),Object.assign(r,{sampler:n,uniformBuffer:i,uniformValues:s}));const h=`${e.format}.${t}`;o[h]||(o[h]=c.createRenderPipeline({label:`mip level generator pipeline for ${t}`,layout:"auto",vertex:{module:l,entryPoint:"vs"},fragment:{module:l,entryPoint:"fs",targets:[{format:e.format}]}}));const u=o[h];for(let d=1;d<e.mipLevelCount;++d)for(let f=0;f<e.depthOrArrayLayers;++f){s[0]=f,c.queue.writeBuffer(i,0,s);const p=c.createBindGroup({layout:u.getBindGroupLayout(0),entries:[{binding:0,resource:n},{binding:1,resource:e.createView({dimension:t,baseMipLevel:d-1,mipLevelCount:1})},{binding:2,resource:{buffer:i}}]}),g={label:"mip gen renderPass",colorAttachments:[{view:e.createView({dimension:"2d",baseMipLevel:d,mipLevelCount:1,baseArrayLayer:f,arrayLayerCount:1}),loadOp:"clear",storeOp:"store"}]},m=c.createCommandEncoder({label:"mip gen encoder"}),w=m.beginRenderPass(g);w.setPipeline(u),w.setBindGroup(0,p),w.draw(3),w.end();const _=m.finish();c.queue.submit([_])}}const Gl=new Map([[Int8Array,{formats:["sint8","snorm8"],defaultForType:1}],[Uint8Array,{formats:["uint8","unorm8"],defaultForType:1}],[Int16Array,{formats:["sint16","snorm16"],defaultForType:1}],[Uint16Array,{formats:["uint16","unorm16"],defaultForType:1}],[Int32Array,{formats:["sint32","snorm32"],defaultForType:0}],[Uint32Array,{formats:["uint32","unorm32"],defaultForType:0}],[Float32Array,{formats:["float32","float32"],defaultForType:0}]]);new Map([...Gl.entries()].map(([c,{formats:[e,t]}])=>[[e,c],[t,c]]).flat());function Fl(c){return new Worker(""+new URL("computeWorker-CNpWzIe7.js",import.meta.url).href,{name:c?.name})}class Nl{position=new Float32Array;normal=new Float32Array;uv=new Float32Array;tangent=new Float32Array;indices=new Uint32Array;constructor(e){this.position=e.attributes.position.array,this.normal=e.attributes.normal.array,this.tangent=e.attributes.tangent.array,this.uv=e.attributes.uv.array,this.indices=e.index.array}}class Or{geometry;boundingSphere=new we;TextureId=new Uint32Array([4294967295,4294967295,4294967295]);vertexOffset=0;primitiveOffset=0;vertexCount=0;primitiveCount=0;constructor(e){if(e.geometry.attributes.uv===void 0){e.geometry.setAttribute("uv",new U(new Float32Array(e.geometry.attributes.position.count*2),2));let t=e.geometry.attributes.uv.array;for(let r=0;r<t.length;r+=2)t[r]=t[r+1]=.5}e.geometry.attributes.tangent===void 0&&e.geometry.computeTangents(),e.geometry.computeBoundingSphere(),this.boundingSphere=e.geometry.boundingSphere,this.vertexCount=e.geometry.attributes.position.count,this.primitiveCount=e.geometry.index.count/3,this.geometry=new Nl(e.geometry)}}class et{textureMap=new Map;Storages=[];texture;Resolution=4;static rszCtx;add(e){let t=4294967295;return e&&(this.textureMap.has(e.name)?t=this.textureMap.get(e.name):(e.source.data||console.log(e),this.Resolution=Math.max(e.source.data.height,this.Resolution),t=this.textureMap.size,this.textureMap.set(e.name,this.Storages.length),this.Storages.push(e))),t}async submit(e,t="rgba8unorm"){if(this.Resolution=Math.pow(2,Math.ceil(Math.log2(this.Resolution))),!et.rszCtx){let n=document.createElement("canvas");n.width=this.Resolution,n.height=this.Resolution,et.rszCtx=n.getContext("2d")}for(let n of this.Storages)n.source.data.width===this.Resolution&&n.source.data.height===this.Resolution||(et.rszCtx.drawImage(n.source.data,0,0,this.Resolution,this.Resolution),n.source.data=await createImageBitmap(et.rszCtx.getImageData(0,0,this.Resolution,this.Resolution)));let r=GPUTextureUsage.COPY_DST|GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.RENDER_ATTACHMENT;this.texture=e.device.createTexture({label:"Textures",format:t,usage:r,mipLevelCount:Ll([this.Resolution,this.Resolution]),size:{width:this.Resolution,height:this.Resolution,depthOrArrayLayers:Math.max(this.textureMap.size,1)}});for(let n of this.Storages)e.device.queue.copyExternalImageToTexture({source:n.source.data},{texture:this.texture,origin:{x:0,y:0,z:this.textureMap.get(n.name)}},{width:n.source.data.width,height:n.source.data.height,depthOrArrayLayers:1});Ol(e.device,this.texture)}}class Ul{meshes=[];albedo=new et;normalMap=new et;specularRoughnessMap=new et;vertexArray;indexArray;bvhMaxDepth=0;bvhBuffer;vertexBuffer;indexBuffer;geometryBuffer;rasterVtxBuffer;vertexSum=0;triangleSum=0;async init(e,t){await this.loadModel(e),this.prepareRasterVtxBuffer(t),this.prepareVtxIdxArray();let r=this.prepareBVH(t);return this.albedo.submit(t,"rgba8unorm-srgb"),this.normalMap.submit(t),this.specularRoughnessMap.submit(t),this.allocateBuffer(t),this.writeBuffer(),new Promise(async(n,i)=>{await r,n()})}async loadModel(e){e.traverse(t=>{if(t instanceof Fr){for(let r=t.children.length-1;r>=0;r--)if(t.children[r]instanceof Oe){let n=t.children[r];n.material,n.geometry.scale(t.scale.x,t.scale.y,t.scale.z)}}}),e.traverse(t=>{if(t instanceof Oe){let r=new Or(t);r.vertexOffset=this.vertexSum,r.primitiveOffset=this.triangleSum,this.vertexSum+=r.vertexCount,this.triangleSum+=r.primitiveCount,r.TextureId[0]=this.albedo.add(t.material.map),r.TextureId[1]=this.normalMap.add(t.material.normalMap),r.TextureId[2]=this.specularRoughnessMap.add(t.material.metalnessMap),this.meshes.push(r)}})}loadTriangle(){let e=new Float32Array([-.5,-.5,0,0,.5,0,.5,-.5,0]),t=new Float32Array([0,0,1,0,0,1,0,0,1]),r=new Float32Array([0,0,.5,1,1,0]),n=new Uint32Array([0,1,2]),i=new Ae;i.setAttribute("position",new U(e,3)),i.setAttribute("normal",new U(t,3)),i.setAttribute("uv",new U(r,2)),i.setIndex(new U(n,1));let s=new Oe(i),o=new Or(s);o.primitiveOffset=this.triangleSum,o.vertexOffset=this.vertexSum,this.vertexSum+=3,this.triangleSum+=1,this.meshes.push(o),e=new Float32Array([-.5,-.5,-1,0,.5,-1,.5,-.5,-1]),t=new Float32Array([0,0,1,0,0,1,0,0,1]),r=new Float32Array([0,0,.5,1,1,0]),n=new Uint32Array([0,1,2]),i=new Ae,i.setAttribute("position",new U(e,3)),i.setAttribute("normal",new U(t,3)),i.setAttribute("uv",new U(r,2)),i.setIndex(new U(n,1)),s=new Oe(i),o=new Or(s),o.primitiveOffset=this.triangleSum,o.vertexOffset=this.vertexSum,this.vertexSum+=3,this.triangleSum+=1,this.meshes.push(o),e=new Float32Array([-.5,-.5,1,.5,-.5,1,0,.5,1]),t=new Float32Array([0,0,-1,0,0,-1,0,0,-1]),r=new Float32Array([0,0,.5,1,1,0]),n=new Uint32Array([0,1,2]),i=new Ae,i.setAttribute("position",new U(e,3)),i.setAttribute("normal",new U(t,3)),i.setAttribute("uv",new U(r,2)),i.setIndex(new U(n,1)),s=new Oe(i),o=new Or(s),o.primitiveOffset=this.triangleSum,o.vertexOffset=this.vertexSum,this.vertexSum+=3,this.triangleSum+=1,this.meshes.push(o)}prepareRasterVtxBuffer(e){this.rasterVtxBuffer=e.device.createBuffer({label:"rasterVtxBuffer",size:this.triangleSum*3*Float32Array.BYTES_PER_ELEMENT*3,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.VERTEX,mappedAtCreation:!0});const t=this.rasterVtxBuffer.getMappedRange(),r=new Float32Array(t);for(let n=0;n<this.meshes.length;n++){let i=this.meshes[n];for(let s=0;s<i.primitiveCount;s++)for(let o=0;o<3;o++){const a=(s+i.primitiveOffset)*9+o*3,l=i.geometry.indices[s*3+o];r.set(i.geometry.position.slice(l*3,l*3+3),a)}}this.rasterVtxBuffer.unmap()}prepareVtxIdxArray(){this.vertexArray=new Float32Array(this.vertexSum*4).fill(1),this.indexArray=new Uint32Array(this.triangleSum*3).fill(0);for(let e=0;e<this.meshes.length;e++){let t=this.meshes[e];for(let r=0;r<t.vertexCount;r++){const n=(r+t.vertexOffset)*4;this.vertexArray.set(t.geometry.position.slice(r*3,r*3+3),n)}for(let r=0;r<t.primitiveCount;r++){const n=(r+t.primitiveOffset)*3,i=new Uint32Array([t.geometry.indices[r*3]+t.vertexOffset,t.geometry.indices[r*3+1]+t.vertexOffset,t.geometry.indices[r*3+2]+t.vertexOffset]);this.indexArray.set(i,n)}t.geometry.position=null,t.geometry.indices=null}}async prepareBVH(e){return new Promise(async(t,r)=>{let n=new Fl;n.onmessage=async i=>{if(typeof i.data=="string"){Vr(i.data);return}if(typeof i.data=="number"){this.bvhMaxDepth=i.data;return}Vr("bvh building finished"),this.bvhBuffer=e.device.createBuffer({label:"bvhBuffer",size:i.data.byteLength,usage:GPUBufferUsage.STORAGE,mappedAtCreation:!0});let s=new Uint8Array(this.bvhBuffer.getMappedRange()),o=new Uint8Array(i.data);s.set(o),this.bvhBuffer.unmap(),n.terminate(),t()},n.postMessage({vertexArray:this.vertexArray,indexArray:this.indexArray})})}allocateBuffer(e){this.vertexBuffer=e.device.createBuffer({label:"vertexBuffer",size:this.vertexArray.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.VERTEX,mappedAtCreation:!0}),this.indexBuffer=e.device.createBuffer({label:"indexBuffer",size:this.indexArray.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.INDEX,mappedAtCreation:!0}),this.geometryBuffer=e.device.createBuffer({label:"geometryBuffer",size:this.vertexSum*16*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.VERTEX,mappedAtCreation:!0})}writeBuffer(){new Float32Array(this.vertexBuffer.getMappedRange()).set(this.vertexArray),this.vertexBuffer.unmap(),this.vertexArray=null,new Uint32Array(this.indexBuffer.getMappedRange()).set(this.indexArray),this.indexBuffer.unmap(),this.indexArray=null;{const e=this.geometryBuffer.getMappedRange(),t=new Float32Array(e),r=new Uint32Array(e);for(let n=0;n<this.meshes.length;n++){let i=this.meshes[n];for(let s=0;s<i.vertexCount;s++){let o=(s+i.vertexOffset)*16;r.set(i.TextureId,o),r.set([32896],o+7),t.set(i.geometry.normal.slice(s*3,s*3+3),o+4),t.set(i.geometry.tangent.slice(s*4,s*4+4),o+8),t.set(i.geometry.uv.slice(s*2,s*2+2),o+12)}i.geometry.normal=null,i.geometry.uv=null,i.geometry.tangent=null,i.geometry=null}this.geometryBuffer.unmap()}console.log("writing finished")}}class ce{position;color;intensity;prob;alias;constructor(e,t,r){this.position=e,this.color=t,this.intensity=r,this.prob=1,this.alias=0,window.performance.now()}velocity=[0,0,0];transform}class Hl{device;lightCount=11;lights;lightBuffer;constructor(e,t){this.lights=e,this.device=t,this.lightCount=e.length;for(let a=0;a<e.length;a++)e[a].alias=a;this.lightBuffer=this.device.device.createBuffer({label:"light buffer",size:4*(4+this.lightCount*8),usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST,mappedAtCreation:!0});function r(a){let l=0;a.forEach(f=>{l+=f.intensity});let h=l/a.length,u=Array(),d=Array();for(a.forEach(f=>{f.prob=f.intensity/h,f.prob<1?u.push(f):d.push(f)});u.length>0&&d.length>0;){let f=u.pop(),p=d.pop();f.alias=p.alias,p.prob+=f.prob-1,p.prob<1?u.push(p):d.push(p)}for(;d.length>0;){let f=d.pop();f.prob=1}for(;u.length>0;){let f=u.pop();f.prob=1}return l}let n=r(e),i=this.lightBuffer.getMappedRange(),s=new Uint32Array(i),o=new Float32Array(i);s[0]=e.length,o[1]=n;for(let a=0;a<e.length;a++){let l=4+8*a;o.set(e[a].position,l);let h=Math.round(e[a].color[0]*255)<<0|Math.round(e[a].color[1]*255)<<8|Math.round(e[a].color[2]*255)<<16;s[l+3]=h,o[l+4]=e[a].prob,s[l+5]=e[a].alias,o[l+6]=e[a].intensity}this.lightBuffer.unmap()}}const ys={type:"change"},In={type:"start"},gs={type:"end"},Gr=new hr,xs=new oe,Vl=Math.cos(70*Bs.DEG2RAD);class jl extends lr{constructor(e,t){super(),this.object=e,this.domElement=t,this.domElement.style.touchAction="none",this.enabled=!0,this.target=new v,this.cursor=new v,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:mt.ROTATE,MIDDLE:mt.DOLLY,RIGHT:mt.PAN},this.touches={ONE:yt.ROTATE,TWO:yt.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._domElementKeyEvents=null,this.getPolarAngle=function(){return o.phi},this.getAzimuthalAngle=function(){return o.theta},this.getDistance=function(){return this.object.position.distanceTo(this.target)},this.listenToKeyEvents=function(y){y.addEventListener("keydown",Yr),this._domElementKeyEvents=y},this.stopListenToKeyEvents=function(){this._domElementKeyEvents.removeEventListener("keydown",Yr),this._domElementKeyEvents=null},this.saveState=function(){r.target0.copy(r.target),r.position0.copy(r.object.position),r.zoom0=r.object.zoom},this.reset=function(){r.target.copy(r.target0),r.object.position.copy(r.position0),r.object.zoom=r.zoom0,r.object.updateProjectionMatrix(),r.dispatchEvent(ys),r.update(),i=n.NONE},this.update=function(){const y=new v,T=new Me().setFromUnitVectors(e.up,new v(0,1,0)),z=T.clone().invert(),F=new v,Q=new Me,je=new v,le=2*Math.PI;return function(co=null){const fi=r.object.position;y.copy(fi).sub(r.target),y.applyQuaternion(T),o.setFromVector3(y),r.autoRotate&&i===n.NONE&&re(V(co)),r.enableDamping?(o.theta+=a.theta*r.dampingFactor,o.phi+=a.phi*r.dampingFactor):(o.theta+=a.theta,o.phi+=a.phi);let Te=r.minAzimuthAngle,Ee=r.maxAzimuthAngle;isFinite(Te)&&isFinite(Ee)&&(Te<-Math.PI?Te+=le:Te>Math.PI&&(Te-=le),Ee<-Math.PI?Ee+=le:Ee>Math.PI&&(Ee-=le),Te<=Ee?o.theta=Math.max(Te,Math.min(Ee,o.theta)):o.theta=o.theta>(Te+Ee)/2?Math.max(Te,o.theta):Math.min(Ee,o.theta)),o.phi=Math.max(r.minPolarAngle,Math.min(r.maxPolarAngle,o.phi)),o.makeSafe(),r.enableDamping===!0?r.target.addScaledVector(h,r.dampingFactor):r.target.add(h),r.target.sub(r.cursor),r.target.clampLength(r.minTargetRadius,r.maxTargetRadius),r.target.add(r.cursor);let Ut=!1;if(r.zoomToCursor&&R||r.object.isOrthographicCamera)o.radius=Ve(o.radius);else{const Re=o.radius;o.radius=Ve(o.radius*l),Ut=Re!=o.radius}if(y.setFromSpherical(o),y.applyQuaternion(z),fi.copy(r.target).add(y),r.object.lookAt(r.target),r.enableDamping===!0?(a.theta*=1-r.dampingFactor,a.phi*=1-r.dampingFactor,h.multiplyScalar(1-r.dampingFactor)):(a.set(0,0,0),h.set(0,0,0)),r.zoomToCursor&&R){let Re=null;if(r.object.isPerspectiveCamera){const Ht=y.length();Re=Ve(Ht*l);const ur=Ht-Re;r.object.position.addScaledVector(S,ur),r.object.updateMatrixWorld(),Ut=!!ur}else if(r.object.isOrthographicCamera){const Ht=new v(C.x,C.y,0);Ht.unproject(r.object);const ur=r.object.zoom;r.object.zoom=Math.max(r.minZoom,Math.min(r.maxZoom,r.object.zoom/l)),r.object.updateProjectionMatrix(),Ut=ur!==r.object.zoom;const pi=new v(C.x,C.y,0);pi.unproject(r.object),r.object.position.sub(pi).add(Ht),r.object.updateMatrixWorld(),Re=y.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),r.zoomToCursor=!1;Re!==null&&(this.screenSpacePanning?r.target.set(0,0,-1).transformDirection(r.object.matrix).multiplyScalar(Re).add(r.object.position):(Gr.origin.copy(r.object.position),Gr.direction.set(0,0,-1).transformDirection(r.object.matrix),Math.abs(r.object.up.dot(Gr.direction))<Vl?e.lookAt(r.target):(xs.setFromNormalAndCoplanarPoint(r.object.up,r.target),Gr.intersectPlane(xs,r.target))))}else if(r.object.isOrthographicCamera){const Re=r.object.zoom;r.object.zoom=Math.max(r.minZoom,Math.min(r.maxZoom,r.object.zoom/l)),Re!==r.object.zoom&&(r.object.updateProjectionMatrix(),Ut=!0)}return l=1,R=!1,Ut||F.distanceToSquared(r.object.position)>s||8*(1-Q.dot(r.object.quaternion))>s||je.distanceToSquared(r.target)>s?(r.dispatchEvent(ys),F.copy(r.object.position),Q.copy(r.object.quaternion),je.copy(r.target),!0):!1}}(),this.dispose=function(){r.domElement.removeEventListener("contextmenu",ui),r.domElement.removeEventListener("pointerdown",oi),r.domElement.removeEventListener("pointercancel",Nt),r.domElement.removeEventListener("wheel",ai),r.domElement.removeEventListener("pointermove",$r),r.domElement.removeEventListener("pointerup",Nt),r.domElement.getRootNode().removeEventListener("keydown",li,{capture:!0}),r._domElementKeyEvents!==null&&(r._domElementKeyEvents.removeEventListener("keydown",Yr),r._domElementKeyEvents=null)};const r=this,n={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6};let i=n.NONE;const s=1e-6,o=new fs,a=new fs;let l=1;const h=new v,u=new k,d=new k,f=new k,p=new k,g=new k,m=new k,w=new k,_=new k,A=new k,S=new v,C=new k;let R=!1;const M=[],E={};let D=!1;function V(y){return y!==null?2*Math.PI/60*r.autoRotateSpeed*y:2*Math.PI/60/60*r.autoRotateSpeed}function j(y){const T=Math.abs(y*.01);return Math.pow(.95,r.zoomSpeed*T)}function re(y){a.theta-=y}function W(y){a.phi-=y}const pe=function(){const y=new v;return function(z,F){y.setFromMatrixColumn(F,0),y.multiplyScalar(-z),h.add(y)}}(),tt=function(){const y=new v;return function(z,F){r.screenSpacePanning===!0?y.setFromMatrixColumn(F,1):(y.setFromMatrixColumn(F,0),y.crossVectors(r.object.up,y)),y.multiplyScalar(z),h.add(y)}}(),me=function(){const y=new v;return function(z,F){const Q=r.domElement;if(r.object.isPerspectiveCamera){const je=r.object.position;y.copy(je).sub(r.target);let le=y.length();le*=Math.tan(r.object.fov/2*Math.PI/180),pe(2*z*le/Q.clientHeight,r.object.matrix),tt(2*F*le/Q.clientHeight,r.object.matrix)}else r.object.isOrthographicCamera?(pe(z*(r.object.right-r.object.left)/r.object.zoom/Q.clientWidth,r.object.matrix),tt(F*(r.object.top-r.object.bottom)/r.object.zoom/Q.clientHeight,r.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),r.enablePan=!1)}}();function Ue(y){r.object.isPerspectiveCamera||r.object.isOrthographicCamera?l/=y:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),r.enableZoom=!1)}function rt(y){r.object.isPerspectiveCamera||r.object.isOrthographicCamera?l*=y:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),r.enableZoom=!1)}function He(y,T){if(!r.zoomToCursor)return;R=!0;const z=r.domElement.getBoundingClientRect(),F=y-z.left,Q=T-z.top,je=z.width,le=z.height;C.x=F/je*2-1,C.y=-(Q/le)*2+1,S.set(C.x,C.y,1).unproject(r.object).sub(r.object.position).normalize()}function Ve(y){return Math.max(r.minDistance,Math.min(r.maxDistance,y))}function nt(y){u.set(y.clientX,y.clientY)}function $s(y){He(y.clientX,y.clientX),w.set(y.clientX,y.clientY)}function Qn(y){p.set(y.clientX,y.clientY)}function Ys(y){d.set(y.clientX,y.clientY),f.subVectors(d,u).multiplyScalar(r.rotateSpeed);const T=r.domElement;re(2*Math.PI*f.x/T.clientHeight),W(2*Math.PI*f.y/T.clientHeight),u.copy(d),r.update()}function Xs(y){_.set(y.clientX,y.clientY),A.subVectors(_,w),A.y>0?Ue(j(A.y)):A.y<0&&rt(j(A.y)),w.copy(_),r.update()}function Zs(y){g.set(y.clientX,y.clientY),m.subVectors(g,p).multiplyScalar(r.panSpeed),me(m.x,m.y),p.copy(g),r.update()}function Ks(y){He(y.clientX,y.clientY),y.deltaY<0?rt(j(y.deltaY)):y.deltaY>0&&Ue(j(y.deltaY)),r.update()}function Js(y){let T=!1;switch(y.code){case r.keys.UP:y.ctrlKey||y.metaKey||y.shiftKey?W(2*Math.PI*r.rotateSpeed/r.domElement.clientHeight):me(0,r.keyPanSpeed),T=!0;break;case r.keys.BOTTOM:y.ctrlKey||y.metaKey||y.shiftKey?W(-2*Math.PI*r.rotateSpeed/r.domElement.clientHeight):me(0,-r.keyPanSpeed),T=!0;break;case r.keys.LEFT:y.ctrlKey||y.metaKey||y.shiftKey?re(2*Math.PI*r.rotateSpeed/r.domElement.clientHeight):me(r.keyPanSpeed,0),T=!0;break;case r.keys.RIGHT:y.ctrlKey||y.metaKey||y.shiftKey?re(-2*Math.PI*r.rotateSpeed/r.domElement.clientHeight):me(-r.keyPanSpeed,0),T=!0;break}T&&(y.preventDefault(),r.update())}function ei(y){if(M.length===1)u.set(y.pageX,y.pageY);else{const T=pt(y),z=.5*(y.pageX+T.x),F=.5*(y.pageY+T.y);u.set(z,F)}}function ti(y){if(M.length===1)p.set(y.pageX,y.pageY);else{const T=pt(y),z=.5*(y.pageX+T.x),F=.5*(y.pageY+T.y);p.set(z,F)}}function ri(y){const T=pt(y),z=y.pageX-T.x,F=y.pageY-T.y,Q=Math.sqrt(z*z+F*F);w.set(0,Q)}function Qs(y){r.enableZoom&&ri(y),r.enablePan&&ti(y)}function eo(y){r.enableZoom&&ri(y),r.enableRotate&&ei(y)}function ni(y){if(M.length==1)d.set(y.pageX,y.pageY);else{const z=pt(y),F=.5*(y.pageX+z.x),Q=.5*(y.pageY+z.y);d.set(F,Q)}f.subVectors(d,u).multiplyScalar(r.rotateSpeed);const T=r.domElement;re(2*Math.PI*f.x/T.clientHeight),W(2*Math.PI*f.y/T.clientHeight),u.copy(d)}function ii(y){if(M.length===1)g.set(y.pageX,y.pageY);else{const T=pt(y),z=.5*(y.pageX+T.x),F=.5*(y.pageY+T.y);g.set(z,F)}m.subVectors(g,p).multiplyScalar(r.panSpeed),me(m.x,m.y),p.copy(g)}function si(y){const T=pt(y),z=y.pageX-T.x,F=y.pageY-T.y,Q=Math.sqrt(z*z+F*F);_.set(0,Q),A.set(0,Math.pow(_.y/w.y,r.zoomSpeed)),Ue(A.y),w.copy(_);const je=(y.pageX+T.x)*.5,le=(y.pageY+T.y)*.5;He(je,le)}function to(y){r.enableZoom&&si(y),r.enablePan&&ii(y)}function ro(y){r.enableZoom&&si(y),r.enableRotate&&ni(y)}function oi(y){r.enabled!==!1&&(M.length===0&&(r.domElement.setPointerCapture(y.pointerId),r.domElement.addEventListener("pointermove",$r),r.domElement.addEventListener("pointerup",Nt)),!ho(y)&&(ao(y),y.pointerType==="touch"?ci(y):no(y)))}function $r(y){r.enabled!==!1&&(y.pointerType==="touch"?oo(y):io(y))}function Nt(y){switch(lo(y),M.length){case 0:r.domElement.releasePointerCapture(y.pointerId),r.domElement.removeEventListener("pointermove",$r),r.domElement.removeEventListener("pointerup",Nt),r.dispatchEvent(gs),i=n.NONE;break;case 1:const T=M[0],z=E[T];ci({pointerId:T,pageX:z.x,pageY:z.y});break}}function no(y){let T;switch(y.button){case 0:T=r.mouseButtons.LEFT;break;case 1:T=r.mouseButtons.MIDDLE;break;case 2:T=r.mouseButtons.RIGHT;break;default:T=-1}switch(T){case mt.DOLLY:if(r.enableZoom===!1)return;$s(y),i=n.DOLLY;break;case mt.ROTATE:if(y.ctrlKey||y.metaKey||y.shiftKey){if(r.enablePan===!1)return;Qn(y),i=n.PAN}else{if(r.enableRotate===!1)return;nt(y),i=n.ROTATE}break;case mt.PAN:if(y.ctrlKey||y.metaKey||y.shiftKey){if(r.enableRotate===!1)return;nt(y),i=n.ROTATE}else{if(r.enablePan===!1)return;Qn(y),i=n.PAN}break;default:i=n.NONE}i!==n.NONE&&r.dispatchEvent(In)}function io(y){switch(i){case n.ROTATE:if(r.enableRotate===!1)return;Ys(y);break;case n.DOLLY:if(r.enableZoom===!1)return;Xs(y);break;case n.PAN:if(r.enablePan===!1)return;Zs(y);break}}function ai(y){r.enabled===!1||r.enableZoom===!1||i!==n.NONE||(y.preventDefault(),r.dispatchEvent(In),Ks(so(y)),r.dispatchEvent(gs))}function so(y){const T=y.deltaMode,z={clientX:y.clientX,clientY:y.clientY,deltaY:y.deltaY};switch(T){case 1:z.deltaY*=16;break;case 2:z.deltaY*=100;break}return y.ctrlKey&&!D&&(z.deltaY*=10),z}function li(y){y.key==="Control"&&(D=!0,r.domElement.getRootNode().addEventListener("keyup",hi,{passive:!0,capture:!0}))}function hi(y){y.key==="Control"&&(D=!1,r.domElement.getRootNode().removeEventListener("keyup",hi,{passive:!0,capture:!0}))}function Yr(y){r.enabled===!1||r.enablePan===!1||Js(y)}function ci(y){switch(di(y),M.length){case 1:switch(r.touches.ONE){case yt.ROTATE:if(r.enableRotate===!1)return;ei(y),i=n.TOUCH_ROTATE;break;case yt.PAN:if(r.enablePan===!1)return;ti(y),i=n.TOUCH_PAN;break;default:i=n.NONE}break;case 2:switch(r.touches.TWO){case yt.DOLLY_PAN:if(r.enableZoom===!1&&r.enablePan===!1)return;Qs(y),i=n.TOUCH_DOLLY_PAN;break;case yt.DOLLY_ROTATE:if(r.enableZoom===!1&&r.enableRotate===!1)return;eo(y),i=n.TOUCH_DOLLY_ROTATE;break;default:i=n.NONE}break;default:i=n.NONE}i!==n.NONE&&r.dispatchEvent(In)}function oo(y){switch(di(y),i){case n.TOUCH_ROTATE:if(r.enableRotate===!1)return;ni(y),r.update();break;case n.TOUCH_PAN:if(r.enablePan===!1)return;ii(y),r.update();break;case n.TOUCH_DOLLY_PAN:if(r.enableZoom===!1&&r.enablePan===!1)return;to(y),r.update();break;case n.TOUCH_DOLLY_ROTATE:if(r.enableZoom===!1&&r.enableRotate===!1)return;ro(y),r.update();break;default:i=n.NONE}}function ui(y){r.enabled!==!1&&y.preventDefault()}function ao(y){M.push(y.pointerId)}function lo(y){delete E[y.pointerId];for(let T=0;T<M.length;T++)if(M[T]==y.pointerId){M.splice(T,1);return}}function ho(y){for(let T=0;T<M.length;T++)if(M[T]==y.pointerId)return!0;return!1}function di(y){let T=E[y.pointerId];T===void 0&&(T=new k,E[y.pointerId]=T),T.set(y.pageX,y.pageY)}function pt(y){const T=y.pointerId===M[0]?M[1]:M[0];return E[T]}r.domElement.addEventListener("contextmenu",ui),r.domElement.addEventListener("pointerdown",oi),r.domElement.addEventListener("pointercancel",Nt),r.domElement.addEventListener("wheel",ai,{passive:!1}),r.domElement.getRootNode().addEventListener("keydown",li,{passive:!0,capture:!0}),this.update()}}function bs(c,e){if(e===Jo)return console.warn("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles."),c;if(e===En||e===Ts){let t=c.getIndex();if(t===null){const s=[],o=c.getAttribute("position");if(o!==void 0){for(let a=0;a<o.count;a++)s.push(a);c.setIndex(s),t=c.getIndex()}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible."),c}const r=t.count-2,n=[];if(e===En)for(let s=1;s<=r;s++)n.push(t.getX(0)),n.push(t.getX(s)),n.push(t.getX(s+1));else for(let s=0;s<r;s++)s%2===0?(n.push(t.getX(s)),n.push(t.getX(s+1)),n.push(t.getX(s+2))):(n.push(t.getX(s+2)),n.push(t.getX(s+1)),n.push(t.getX(s)));n.length/3!==r&&console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.");const i=c.clone();return i.setIndex(n),i.clearGroups(),i}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:",e),c}const _n=new WeakMap;class Wl extends ft{constructor(e){super(e),this.decoderPath="",this.decoderConfig={},this.decoderBinary=null,this.decoderPending=null,this.workerLimit=4,this.workerPool=[],this.workerNextTaskID=1,this.workerSourceURL="",this.defaultAttributeIDs={position:"POSITION",normal:"NORMAL",color:"COLOR",uv:"TEX_COORD"},this.defaultAttributeTypes={position:"Float32Array",normal:"Float32Array",color:"Float32Array",uv:"Float32Array"}}setDecoderPath(e){return this.decoderPath=e,this}setDecoderConfig(e){return this.decoderConfig=e,this}setWorkerLimit(e){return this.workerLimit=e,this}load(e,t,r,n){const i=new Hr(this.manager);i.setPath(this.path),i.setResponseType("arraybuffer"),i.setRequestHeader(this.requestHeader),i.setWithCredentials(this.withCredentials),i.load(e,s=>{this.parse(s,t,n)},r,n)}parse(e,t,r=()=>{}){this.decodeDracoFile(e,t,null,null,te).catch(r)}decodeDracoFile(e,t,r,n,i=ae,s=()=>{}){const o={attributeIDs:r||this.defaultAttributeIDs,attributeTypes:n||this.defaultAttributeTypes,useUniqueIDs:!!r,vertexColorSpace:i};return this.decodeGeometry(e,o).then(t).catch(s)}decodeGeometry(e,t){const r=JSON.stringify(t);if(_n.has(e)){const a=_n.get(e);if(a.key===r)return a.promise;if(e.byteLength===0)throw new Error("THREE.DRACOLoader: Unable to re-decode a buffer with different settings. Buffer has already been transferred.")}let n;const i=this.workerNextTaskID++,s=e.byteLength,o=this._getWorker(i,s).then(a=>(n=a,new Promise((l,h)=>{n._callbacks[i]={resolve:l,reject:h},n.postMessage({type:"decode",id:i,taskConfig:t,buffer:e},[e])}))).then(a=>this._createGeometry(a.geometry));return o.catch(()=>!0).then(()=>{n&&i&&this._releaseTask(n,i)}),_n.set(e,{key:r,promise:o}),o}_createGeometry(e){const t=new Ae;e.index&&t.setIndex(new U(e.index.array,1));for(let r=0;r<e.attributes.length;r++){const n=e.attributes[r],i=n.name,s=n.array,o=n.itemSize,a=new U(s,o);i==="color"&&(this._assignVertexColorSpace(a,n.vertexColorSpace),a.normalized=!(s instanceof Float32Array)),t.setAttribute(i,a)}return t}_assignVertexColorSpace(e,t){if(t!==te)return;const r=new Y;for(let n=0,i=e.count;n<i;n++)r.fromBufferAttribute(e,n).convertSRGBToLinear(),e.setXYZ(n,r.r,r.g,r.b)}_loadLibrary(e,t){const r=new Hr(this.manager);return r.setPath(this.decoderPath),r.setResponseType(t),r.setWithCredentials(this.withCredentials),new Promise((n,i)=>{r.load(e,n,void 0,i)})}preload(){return this._initDecoder(),this}_initDecoder(){if(this.decoderPending)return this.decoderPending;const e=typeof WebAssembly!="object"||this.decoderConfig.type==="js",t=[];return e?t.push(this._loadLibrary("draco_decoder.js","text")):(t.push(this._loadLibrary("draco_wasm_wrapper.js","text")),t.push(this._loadLibrary("draco_decoder.wasm","arraybuffer"))),this.decoderPending=Promise.all(t).then(r=>{const n=r[0];e||(this.decoderConfig.wasmBinary=r[1]);const i=ql.toString(),s=["/* draco decoder */",n,"","/* worker */",i.substring(i.indexOf("{")+1,i.lastIndexOf("}"))].join(`
`);this.workerSourceURL=URL.createObjectURL(new Blob([s]))}),this.decoderPending}_getWorker(e,t){return this._initDecoder().then(()=>{if(this.workerPool.length<this.workerLimit){const n=new Worker(this.workerSourceURL);n._callbacks={},n._taskCosts={},n._taskLoad=0,n.postMessage({type:"init",decoderConfig:this.decoderConfig}),n.onmessage=function(i){const s=i.data;switch(s.type){case"decode":n._callbacks[s.id].resolve(s);break;case"error":n._callbacks[s.id].reject(s);break;default:console.error('THREE.DRACOLoader: Unexpected message, "'+s.type+'"')}},this.workerPool.push(n)}else this.workerPool.sort(function(n,i){return n._taskLoad>i._taskLoad?-1:1});const r=this.workerPool[this.workerPool.length-1];return r._taskCosts[e]=t,r._taskLoad+=t,r})}_releaseTask(e,t){e._taskLoad-=e._taskCosts[t],delete e._callbacks[t],delete e._taskCosts[t]}debug(){console.log("Task load: ",this.workerPool.map(e=>e._taskLoad))}dispose(){for(let e=0;e<this.workerPool.length;++e)this.workerPool[e].terminate();return this.workerPool.length=0,this.workerSourceURL!==""&&URL.revokeObjectURL(this.workerSourceURL),this}}function ql(){let c,e;onmessage=function(s){const o=s.data;switch(o.type){case"init":c=o.decoderConfig,e=new Promise(function(h){c.onModuleLoaded=function(u){h({draco:u})},DracoDecoderModule(c)});break;case"decode":const a=o.buffer,l=o.taskConfig;e.then(h=>{const u=h.draco,d=new u.Decoder;try{const f=t(u,d,new Int8Array(a),l),p=f.attributes.map(g=>g.array.buffer);f.index&&p.push(f.index.array.buffer),self.postMessage({type:"decode",id:o.id,geometry:f},p)}catch(f){console.error(f),self.postMessage({type:"error",id:o.id,error:f.message})}finally{u.destroy(d)}});break}};function t(s,o,a,l){const h=l.attributeIDs,u=l.attributeTypes;let d,f;const p=o.GetEncodedGeometryType(a);if(p===s.TRIANGULAR_MESH)d=new s.Mesh,f=o.DecodeArrayToMesh(a,a.byteLength,d);else if(p===s.POINT_CLOUD)d=new s.PointCloud,f=o.DecodeArrayToPointCloud(a,a.byteLength,d);else throw new Error("THREE.DRACOLoader: Unexpected geometry type.");if(!f.ok()||d.ptr===0)throw new Error("THREE.DRACOLoader: Decoding failed: "+f.error_msg());const g={index:null,attributes:[]};for(const m in h){const w=self[u[m]];let _,A;if(l.useUniqueIDs)A=h[m],_=o.GetAttributeByUniqueId(d,A);else{if(A=o.GetAttributeId(d,s[h[m]]),A===-1)continue;_=o.GetAttribute(d,A)}const S=n(s,o,d,m,w,_);m==="color"&&(S.vertexColorSpace=l.vertexColorSpace),g.attributes.push(S)}return p===s.TRIANGULAR_MESH&&(g.index=r(s,o,d)),s.destroy(d),g}function r(s,o,a){const h=a.num_faces()*3,u=h*4,d=s._malloc(u);o.GetTrianglesUInt32Array(a,u,d);const f=new Uint32Array(s.HEAPF32.buffer,d,h).slice();return s._free(d),{array:f,itemSize:1}}function n(s,o,a,l,h,u){const d=u.num_components(),p=a.num_points()*d,g=p*h.BYTES_PER_ELEMENT,m=i(s,h),w=s._malloc(g);o.GetAttributeDataArrayForAllPoints(a,u,m,g,w);const _=new h(s.HEAPF32.buffer,w,p).slice();return s._free(w),{name:l,array:_,itemSize:d}}function i(s,o){switch(o){case Float32Array:return s.DT_FLOAT32;case Int8Array:return s.DT_INT8;case Int16Array:return s.DT_INT16;case Int32Array:return s.DT_INT32;case Uint8Array:return s.DT_UINT8;case Uint16Array:return s.DT_UINT16;case Uint32Array:return s.DT_UINT32}}}class $l extends ft{constructor(e){super(e),this.dracoLoader=null,this.ktx2Loader=null,this.meshoptDecoder=null,this.pluginCallbacks=[],this.register(function(t){return new Jl(t)}),this.register(function(t){return new ah(t)}),this.register(function(t){return new lh(t)}),this.register(function(t){return new hh(t)}),this.register(function(t){return new eh(t)}),this.register(function(t){return new th(t)}),this.register(function(t){return new rh(t)}),this.register(function(t){return new nh(t)}),this.register(function(t){return new Kl(t)}),this.register(function(t){return new ih(t)}),this.register(function(t){return new Ql(t)}),this.register(function(t){return new oh(t)}),this.register(function(t){return new sh(t)}),this.register(function(t){return new Xl(t)}),this.register(function(t){return new ch(t)}),this.register(function(t){return new uh(t)})}load(e,t,r,n){const i=this;let s;if(this.resourcePath!=="")s=this.resourcePath;else if(this.path!==""){const l=tr.extractUrlBase(e);s=tr.resolveURL(l,this.path)}else s=tr.extractUrlBase(e);this.manager.itemStart(e);const o=function(l){n?n(l):console.error(l),i.manager.itemError(e),i.manager.itemEnd(e)},a=new Hr(this.manager);a.setPath(this.path),a.setResponseType("arraybuffer"),a.setRequestHeader(this.requestHeader),a.setWithCredentials(this.withCredentials),a.load(e,function(l){try{i.parse(l,s,function(h){t(h),i.manager.itemEnd(e)},o)}catch(h){o(h)}},r,o)}setDRACOLoader(e){return this.dracoLoader=e,this}setDDSLoader(){throw new Error('THREE.GLTFLoader: "MSFT_texture_dds" no longer supported. Please update to "KHR_texture_basisu".')}setKTX2Loader(e){return this.ktx2Loader=e,this}setMeshoptDecoder(e){return this.meshoptDecoder=e,this}register(e){return this.pluginCallbacks.indexOf(e)===-1&&this.pluginCallbacks.push(e),this}unregister(e){return this.pluginCallbacks.indexOf(e)!==-1&&this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(e),1),this}parse(e,t,r,n){let i;const s={},o={},a=new TextDecoder;if(typeof e=="string")i=JSON.parse(e);else if(e instanceof ArrayBuffer)if(a.decode(new Uint8Array(e,0,4))===Vs){try{s[P.KHR_BINARY_GLTF]=new dh(e)}catch(u){n&&n(u);return}i=JSON.parse(s[P.KHR_BINARY_GLTF].content)}else i=JSON.parse(a.decode(e));else i=e;if(i.asset===void 0||i.asset.version[0]<2){n&&n(new Error("THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported."));return}const l=new Sh(i,{path:t||this.resourcePath||"",crossOrigin:this.crossOrigin,requestHeader:this.requestHeader,manager:this.manager,ktx2Loader:this.ktx2Loader,meshoptDecoder:this.meshoptDecoder});l.fileLoader.setRequestHeader(this.requestHeader);for(let h=0;h<this.pluginCallbacks.length;h++){const u=this.pluginCallbacks[h](l);u.name||console.error("THREE.GLTFLoader: Invalid plugin found: missing name"),o[u.name]=u,s[u.name]=!0}if(i.extensionsUsed)for(let h=0;h<i.extensionsUsed.length;++h){const u=i.extensionsUsed[h],d=i.extensionsRequired||[];switch(u){case P.KHR_MATERIALS_UNLIT:s[u]=new Zl;break;case P.KHR_DRACO_MESH_COMPRESSION:s[u]=new fh(i,this.dracoLoader);break;case P.KHR_TEXTURE_TRANSFORM:s[u]=new ph;break;case P.KHR_MESH_QUANTIZATION:s[u]=new mh;break;default:d.indexOf(u)>=0&&o[u]===void 0&&console.warn('THREE.GLTFLoader: Unknown extension "'+u+'".')}}l.setExtensions(s),l.setPlugins(o),l.parse(r,n)}parseAsync(e,t){const r=this;return new Promise(function(n,i){r.parse(e,t,n,i)})}}function Yl(){let c={};return{get:function(e){return c[e]},add:function(e,t){c[e]=t},remove:function(e){delete c[e]},removeAll:function(){c={}}}}const P={KHR_BINARY_GLTF:"KHR_binary_glTF",KHR_DRACO_MESH_COMPRESSION:"KHR_draco_mesh_compression",KHR_LIGHTS_PUNCTUAL:"KHR_lights_punctual",KHR_MATERIALS_CLEARCOAT:"KHR_materials_clearcoat",KHR_MATERIALS_IOR:"KHR_materials_ior",KHR_MATERIALS_SHEEN:"KHR_materials_sheen",KHR_MATERIALS_SPECULAR:"KHR_materials_specular",KHR_MATERIALS_TRANSMISSION:"KHR_materials_transmission",KHR_MATERIALS_IRIDESCENCE:"KHR_materials_iridescence",KHR_MATERIALS_ANISOTROPY:"KHR_materials_anisotropy",KHR_MATERIALS_UNLIT:"KHR_materials_unlit",KHR_MATERIALS_VOLUME:"KHR_materials_volume",KHR_TEXTURE_BASISU:"KHR_texture_basisu",KHR_TEXTURE_TRANSFORM:"KHR_texture_transform",KHR_MESH_QUANTIZATION:"KHR_mesh_quantization",KHR_MATERIALS_EMISSIVE_STRENGTH:"KHR_materials_emissive_strength",EXT_MATERIALS_BUMP:"EXT_materials_bump",EXT_TEXTURE_WEBP:"EXT_texture_webp",EXT_TEXTURE_AVIF:"EXT_texture_avif",EXT_MESHOPT_COMPRESSION:"EXT_meshopt_compression",EXT_MESH_GPU_INSTANCING:"EXT_mesh_gpu_instancing"};class Xl{constructor(e){this.parser=e,this.name=P.KHR_LIGHTS_PUNCTUAL,this.cache={refs:{},uses:{}}}_markDefs(){const e=this.parser,t=this.parser.json.nodes||[];for(let r=0,n=t.length;r<n;r++){const i=t[r];i.extensions&&i.extensions[this.name]&&i.extensions[this.name].light!==void 0&&e._addNodeRef(this.cache,i.extensions[this.name].light)}}_loadLight(e){const t=this.parser,r="light:"+e;let n=t.cache.get(r);if(n)return n;const i=t.json,a=((i.extensions&&i.extensions[this.name]||{}).lights||[])[e];let l;const h=new Y(16777215);a.color!==void 0&&h.setRGB(a.color[0],a.color[1],a.color[2],ae);const u=a.range!==void 0?a.range:0;switch(a.type){case"directional":l=new gl(h),l.target.position.set(0,0,-1),l.add(l.target);break;case"point":l=new ml(h),l.distance=u;break;case"spot":l=new fl(h),l.distance=u,a.spot=a.spot||{},a.spot.innerConeAngle=a.spot.innerConeAngle!==void 0?a.spot.innerConeAngle:0,a.spot.outerConeAngle=a.spot.outerConeAngle!==void 0?a.spot.outerConeAngle:Math.PI/4,l.angle=a.spot.outerConeAngle,l.penumbra=1-a.spot.innerConeAngle/a.spot.outerConeAngle,l.target.position.set(0,0,-1),l.add(l.target);break;default:throw new Error("THREE.GLTFLoader: Unexpected light type: "+a.type)}return l.position.set(0,0,0),l.decay=2,Je(l,a),a.intensity!==void 0&&(l.intensity=a.intensity),l.name=t.createUniqueName(a.name||"light_"+e),n=Promise.resolve(l),t.cache.add(r,n),n}getDependency(e,t){if(e==="light")return this._loadLight(t)}createNodeAttachment(e){const t=this,r=this.parser,i=r.json.nodes[e],o=(i.extensions&&i.extensions[this.name]||{}).light;return o===void 0?null:this._loadLight(o).then(function(a){return r._getNodeRef(t.cache,o,a)})}}class Zl{constructor(){this.name=P.KHR_MATERIALS_UNLIT}getMaterialType(){return Bt}extendParams(e,t,r){const n=[];e.color=new Y(1,1,1),e.opacity=1;const i=t.pbrMetallicRoughness;if(i){if(Array.isArray(i.baseColorFactor)){const s=i.baseColorFactor;e.color.setRGB(s[0],s[1],s[2],ae),e.opacity=s[3]}i.baseColorTexture!==void 0&&n.push(r.assignTexture(e,"map",i.baseColorTexture,te))}return Promise.all(n)}}class Kl{constructor(e){this.parser=e,this.name=P.KHR_MATERIALS_EMISSIVE_STRENGTH}extendMaterialParams(e,t){const n=this.parser.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const i=n.extensions[this.name].emissiveStrength;return i!==void 0&&(t.emissiveIntensity=i),Promise.resolve()}}class Jl{constructor(e){this.parser=e,this.name=P.KHR_MATERIALS_CLEARCOAT}getMaterialType(e){const r=this.parser.json.materials[e];return!r.extensions||!r.extensions[this.name]?null:Ne}extendMaterialParams(e,t){const r=this.parser,n=r.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const i=[],s=n.extensions[this.name];if(s.clearcoatFactor!==void 0&&(t.clearcoat=s.clearcoatFactor),s.clearcoatTexture!==void 0&&i.push(r.assignTexture(t,"clearcoatMap",s.clearcoatTexture)),s.clearcoatRoughnessFactor!==void 0&&(t.clearcoatRoughness=s.clearcoatRoughnessFactor),s.clearcoatRoughnessTexture!==void 0&&i.push(r.assignTexture(t,"clearcoatRoughnessMap",s.clearcoatRoughnessTexture)),s.clearcoatNormalTexture!==void 0&&(i.push(r.assignTexture(t,"clearcoatNormalMap",s.clearcoatNormalTexture)),s.clearcoatNormalTexture.scale!==void 0)){const o=s.clearcoatNormalTexture.scale;t.clearcoatNormalScale=new k(o,o)}return Promise.all(i)}}class Ql{constructor(e){this.parser=e,this.name=P.KHR_MATERIALS_IRIDESCENCE}getMaterialType(e){const r=this.parser.json.materials[e];return!r.extensions||!r.extensions[this.name]?null:Ne}extendMaterialParams(e,t){const r=this.parser,n=r.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const i=[],s=n.extensions[this.name];return s.iridescenceFactor!==void 0&&(t.iridescence=s.iridescenceFactor),s.iridescenceTexture!==void 0&&i.push(r.assignTexture(t,"iridescenceMap",s.iridescenceTexture)),s.iridescenceIor!==void 0&&(t.iridescenceIOR=s.iridescenceIor),t.iridescenceThicknessRange===void 0&&(t.iridescenceThicknessRange=[100,400]),s.iridescenceThicknessMinimum!==void 0&&(t.iridescenceThicknessRange[0]=s.iridescenceThicknessMinimum),s.iridescenceThicknessMaximum!==void 0&&(t.iridescenceThicknessRange[1]=s.iridescenceThicknessMaximum),s.iridescenceThicknessTexture!==void 0&&i.push(r.assignTexture(t,"iridescenceThicknessMap",s.iridescenceThicknessTexture)),Promise.all(i)}}class eh{constructor(e){this.parser=e,this.name=P.KHR_MATERIALS_SHEEN}getMaterialType(e){const r=this.parser.json.materials[e];return!r.extensions||!r.extensions[this.name]?null:Ne}extendMaterialParams(e,t){const r=this.parser,n=r.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const i=[];t.sheenColor=new Y(0,0,0),t.sheenRoughness=0,t.sheen=1;const s=n.extensions[this.name];if(s.sheenColorFactor!==void 0){const o=s.sheenColorFactor;t.sheenColor.setRGB(o[0],o[1],o[2],ae)}return s.sheenRoughnessFactor!==void 0&&(t.sheenRoughness=s.sheenRoughnessFactor),s.sheenColorTexture!==void 0&&i.push(r.assignTexture(t,"sheenColorMap",s.sheenColorTexture,te)),s.sheenRoughnessTexture!==void 0&&i.push(r.assignTexture(t,"sheenRoughnessMap",s.sheenRoughnessTexture)),Promise.all(i)}}class th{constructor(e){this.parser=e,this.name=P.KHR_MATERIALS_TRANSMISSION}getMaterialType(e){const r=this.parser.json.materials[e];return!r.extensions||!r.extensions[this.name]?null:Ne}extendMaterialParams(e,t){const r=this.parser,n=r.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const i=[],s=n.extensions[this.name];return s.transmissionFactor!==void 0&&(t.transmission=s.transmissionFactor),s.transmissionTexture!==void 0&&i.push(r.assignTexture(t,"transmissionMap",s.transmissionTexture)),Promise.all(i)}}class rh{constructor(e){this.parser=e,this.name=P.KHR_MATERIALS_VOLUME}getMaterialType(e){const r=this.parser.json.materials[e];return!r.extensions||!r.extensions[this.name]?null:Ne}extendMaterialParams(e,t){const r=this.parser,n=r.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const i=[],s=n.extensions[this.name];t.thickness=s.thicknessFactor!==void 0?s.thicknessFactor:0,s.thicknessTexture!==void 0&&i.push(r.assignTexture(t,"thicknessMap",s.thicknessTexture)),t.attenuationDistance=s.attenuationDistance||1/0;const o=s.attenuationColor||[1,1,1];return t.attenuationColor=new Y().setRGB(o[0],o[1],o[2],ae),Promise.all(i)}}class nh{constructor(e){this.parser=e,this.name=P.KHR_MATERIALS_IOR}getMaterialType(e){const r=this.parser.json.materials[e];return!r.extensions||!r.extensions[this.name]?null:Ne}extendMaterialParams(e,t){const n=this.parser.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const i=n.extensions[this.name];return t.ior=i.ior!==void 0?i.ior:1.5,Promise.resolve()}}class ih{constructor(e){this.parser=e,this.name=P.KHR_MATERIALS_SPECULAR}getMaterialType(e){const r=this.parser.json.materials[e];return!r.extensions||!r.extensions[this.name]?null:Ne}extendMaterialParams(e,t){const r=this.parser,n=r.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const i=[],s=n.extensions[this.name];t.specularIntensity=s.specularFactor!==void 0?s.specularFactor:1,s.specularTexture!==void 0&&i.push(r.assignTexture(t,"specularIntensityMap",s.specularTexture));const o=s.specularColorFactor||[1,1,1];return t.specularColor=new Y().setRGB(o[0],o[1],o[2],ae),s.specularColorTexture!==void 0&&i.push(r.assignTexture(t,"specularColorMap",s.specularColorTexture,te)),Promise.all(i)}}class sh{constructor(e){this.parser=e,this.name=P.EXT_MATERIALS_BUMP}getMaterialType(e){const r=this.parser.json.materials[e];return!r.extensions||!r.extensions[this.name]?null:Ne}extendMaterialParams(e,t){const r=this.parser,n=r.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const i=[],s=n.extensions[this.name];return t.bumpScale=s.bumpFactor!==void 0?s.bumpFactor:1,s.bumpTexture!==void 0&&i.push(r.assignTexture(t,"bumpMap",s.bumpTexture)),Promise.all(i)}}class oh{constructor(e){this.parser=e,this.name=P.KHR_MATERIALS_ANISOTROPY}getMaterialType(e){const r=this.parser.json.materials[e];return!r.extensions||!r.extensions[this.name]?null:Ne}extendMaterialParams(e,t){const r=this.parser,n=r.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const i=[],s=n.extensions[this.name];return s.anisotropyStrength!==void 0&&(t.anisotropy=s.anisotropyStrength),s.anisotropyRotation!==void 0&&(t.anisotropyRotation=s.anisotropyRotation),s.anisotropyTexture!==void 0&&i.push(r.assignTexture(t,"anisotropyMap",s.anisotropyTexture)),Promise.all(i)}}class ah{constructor(e){this.parser=e,this.name=P.KHR_TEXTURE_BASISU}loadTexture(e){const t=this.parser,r=t.json,n=r.textures[e];if(!n.extensions||!n.extensions[this.name])return null;const i=n.extensions[this.name],s=t.options.ktx2Loader;if(!s){if(r.extensionsRequired&&r.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");return null}return t.loadTextureImage(e,i.source,s)}}class lh{constructor(e){this.parser=e,this.name=P.EXT_TEXTURE_WEBP,this.isSupported=null}loadTexture(e){const t=this.name,r=this.parser,n=r.json,i=n.textures[e];if(!i.extensions||!i.extensions[t])return null;const s=i.extensions[t],o=n.images[s.source];let a=r.textureLoader;if(o.uri){const l=r.options.manager.getHandler(o.uri);l!==null&&(a=l)}return this.detectSupport().then(function(l){if(l)return r.loadTextureImage(e,s.source,a);if(n.extensionsRequired&&n.extensionsRequired.indexOf(t)>=0)throw new Error("THREE.GLTFLoader: WebP required by asset but unsupported.");return r.loadTexture(e)})}detectSupport(){return this.isSupported||(this.isSupported=new Promise(function(e){const t=new Image;t.src="data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA",t.onload=t.onerror=function(){e(t.height===1)}})),this.isSupported}}class hh{constructor(e){this.parser=e,this.name=P.EXT_TEXTURE_AVIF,this.isSupported=null}loadTexture(e){const t=this.name,r=this.parser,n=r.json,i=n.textures[e];if(!i.extensions||!i.extensions[t])return null;const s=i.extensions[t],o=n.images[s.source];let a=r.textureLoader;if(o.uri){const l=r.options.manager.getHandler(o.uri);l!==null&&(a=l)}return this.detectSupport().then(function(l){if(l)return r.loadTextureImage(e,s.source,a);if(n.extensionsRequired&&n.extensionsRequired.indexOf(t)>=0)throw new Error("THREE.GLTFLoader: AVIF required by asset but unsupported.");return r.loadTexture(e)})}detectSupport(){return this.isSupported||(this.isSupported=new Promise(function(e){const t=new Image;t.src="data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABcAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB9tZGF0EgAKCBgABogQEDQgMgkQAAAAB8dSLfI=",t.onload=t.onerror=function(){e(t.height===1)}})),this.isSupported}}class ch{constructor(e){this.name=P.EXT_MESHOPT_COMPRESSION,this.parser=e}loadBufferView(e){const t=this.parser.json,r=t.bufferViews[e];if(r.extensions&&r.extensions[this.name]){const n=r.extensions[this.name],i=this.parser.getDependency("buffer",n.buffer),s=this.parser.options.meshoptDecoder;if(!s||!s.supported){if(t.extensionsRequired&&t.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files");return null}return i.then(function(o){const a=n.byteOffset||0,l=n.byteLength||0,h=n.count,u=n.byteStride,d=new Uint8Array(o,a,l);return s.decodeGltfBufferAsync?s.decodeGltfBufferAsync(h,u,d,n.mode,n.filter).then(function(f){return f.buffer}):s.ready.then(function(){const f=new ArrayBuffer(h*u);return s.decodeGltfBuffer(new Uint8Array(f),h,u,d,n.mode,n.filter),f})})}else return null}}class uh{constructor(e){this.name=P.EXT_MESH_GPU_INSTANCING,this.parser=e}createNodeMesh(e){const t=this.parser.json,r=t.nodes[e];if(!r.extensions||!r.extensions[this.name]||r.mesh===void 0)return null;const n=t.meshes[r.mesh];for(const l of n.primitives)if(l.mode!==ue.TRIANGLES&&l.mode!==ue.TRIANGLE_STRIP&&l.mode!==ue.TRIANGLE_FAN&&l.mode!==void 0)return null;const s=r.extensions[this.name].attributes,o=[],a={};for(const l in s)o.push(this.parser.getDependency("accessor",s[l]).then(h=>(a[l]=h,a[l])));return o.length<1?null:(o.push(this.parser.createNodeMesh(e)),Promise.all(o).then(l=>{const h=l.pop(),u=h.isGroup?h.children:[h],d=l[0].count,f=[];for(const p of u){const g=new B,m=new v,w=new Me,_=new v(1,1,1),A=new Ya(p.geometry,p.material,d);for(let S=0;S<d;S++)a.TRANSLATION&&m.fromBufferAttribute(a.TRANSLATION,S),a.ROTATION&&w.fromBufferAttribute(a.ROTATION,S),a.SCALE&&_.fromBufferAttribute(a.SCALE,S),A.setMatrixAt(S,g.compose(m,w,_));for(const S in a)if(S==="_COLOR_0"){const C=a[S];A.instanceColor=new kn(C.array,C.itemSize,C.normalized)}else S!=="TRANSLATION"&&S!=="ROTATION"&&S!=="SCALE"&&p.geometry.setAttribute(S,a[S]);q.prototype.copy.call(A,p),this.parser.assignFinalMaterial(A),f.push(A)}return h.isGroup?(h.clear(),h.add(...f),h):f[0]}))}}const Vs="glTF",Zt=12,vs={JSON:1313821514,BIN:5130562};class dh{constructor(e){this.name=P.KHR_BINARY_GLTF,this.content=null,this.body=null;const t=new DataView(e,0,Zt),r=new TextDecoder;if(this.header={magic:r.decode(new Uint8Array(e.slice(0,4))),version:t.getUint32(4,!0),length:t.getUint32(8,!0)},this.header.magic!==Vs)throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");if(this.header.version<2)throw new Error("THREE.GLTFLoader: Legacy binary file detected.");const n=this.header.length-Zt,i=new DataView(e,Zt);let s=0;for(;s<n;){const o=i.getUint32(s,!0);s+=4;const a=i.getUint32(s,!0);if(s+=4,a===vs.JSON){const l=new Uint8Array(e,Zt+s,o);this.content=r.decode(l)}else if(a===vs.BIN){const l=Zt+s;this.body=e.slice(l,l+o)}s+=o}if(this.content===null)throw new Error("THREE.GLTFLoader: JSON content not found.")}}class fh{constructor(e,t){if(!t)throw new Error("THREE.GLTFLoader: No DRACOLoader instance provided.");this.name=P.KHR_DRACO_MESH_COMPRESSION,this.json=e,this.dracoLoader=t,this.dracoLoader.preload()}decodePrimitive(e,t){const r=this.json,n=this.dracoLoader,i=e.extensions[this.name].bufferView,s=e.extensions[this.name].attributes,o={},a={},l={};for(const h in s){const u=Dn[h]||h.toLowerCase();o[u]=s[h]}for(const h in e.attributes){const u=Dn[h]||h.toLowerCase();if(s[h]!==void 0){const d=r.accessors[e.attributes[h]],f=Pt[d.componentType];l[u]=f.name,a[u]=d.normalized===!0}}return t.getDependency("bufferView",i).then(function(h){return new Promise(function(u,d){n.decodeDracoFile(h,function(f){for(const p in f.attributes){const g=f.attributes[p],m=a[p];m!==void 0&&(g.normalized=m)}u(f)},o,l,ae,d)})})}}class ph{constructor(){this.name=P.KHR_TEXTURE_TRANSFORM}extendTexture(e,t){return(t.texCoord===void 0||t.texCoord===e.channel)&&t.offset===void 0&&t.rotation===void 0&&t.scale===void 0||(e=e.clone(),t.texCoord!==void 0&&(e.channel=t.texCoord),t.offset!==void 0&&e.offset.fromArray(t.offset),t.rotation!==void 0&&(e.rotation=t.rotation),t.scale!==void 0&&e.repeat.fromArray(t.scale),e.needsUpdate=!0),e}}class mh{constructor(){this.name=P.KHR_MESH_QUANTIZATION}}class js extends cr{constructor(e,t,r,n){super(e,t,r,n)}copySampleValue_(e){const t=this.resultBuffer,r=this.sampleValues,n=this.valueSize,i=e*n*3+n;for(let s=0;s!==n;s++)t[s]=r[i+s];return t}interpolate_(e,t,r,n){const i=this.resultBuffer,s=this.sampleValues,o=this.valueSize,a=o*2,l=o*3,h=n-t,u=(r-t)/h,d=u*u,f=d*u,p=e*l,g=p-l,m=-2*f+3*d,w=f-d,_=1-m,A=w-d+u;for(let S=0;S!==o;S++){const C=s[g+S+o],R=s[g+S+a]*h,M=s[p+S+o],E=s[p+S]*h;i[S]=_*C+A*R+m*M+w*E}return i}}const yh=new Me;class gh extends js{interpolate_(e,t,r,n){const i=super.interpolate_(e,t,r,n);return yh.fromArray(i).normalize().toArray(i),i}}const ue={FLOAT:5126,FLOAT_MAT3:35675,FLOAT_MAT4:35676,FLOAT_VEC2:35664,FLOAT_VEC3:35665,FLOAT_VEC4:35666,LINEAR:9729,REPEAT:10497,SAMPLER_2D:35678,POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6,UNSIGNED_BYTE:5121,UNSIGNED_SHORT:5123},Pt={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array},ws={9728:ir,9729:Fn,9984:jo,9985:qo,9986:Wo,9987:Nn},Is={33071:Kt,33648:Tn,10497:nr},An={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},Dn={POSITION:"position",NORMAL:"normal",TANGENT:"tangent",TEXCOORD_0:"uv",TEXCOORD_1:"uv1",TEXCOORD_2:"uv2",TEXCOORD_3:"uv3",COLOR_0:"color",WEIGHTS_0:"skinWeight",JOINTS_0:"skinIndex"},Ke={scale:"scale",translation:"position",rotation:"quaternion",weights:"morphTargetInfluences"},xh={CUBICSPLINE:void 0,LINEAR:kt,STEP:sr},Sn={OPAQUE:"OPAQUE",MASK:"MASK",BLEND:"BLEND"};function bh(c){return c.DefaultMaterial===void 0&&(c.DefaultMaterial=new $n({color:16777215,emissive:0,metalness:1,roughness:1,transparent:!1,depthTest:!0,side:Ur})),c.DefaultMaterial}function lt(c,e,t){for(const r in t.extensions)c[r]===void 0&&(e.userData.gltfExtensions=e.userData.gltfExtensions||{},e.userData.gltfExtensions[r]=t.extensions[r])}function Je(c,e){e.extras!==void 0&&(typeof e.extras=="object"?Object.assign(c.userData,e.extras):console.warn("THREE.GLTFLoader: Ignoring primitive type .extras, "+e.extras))}function vh(c,e,t){let r=!1,n=!1,i=!1;for(let l=0,h=e.length;l<h;l++){const u=e[l];if(u.POSITION!==void 0&&(r=!0),u.NORMAL!==void 0&&(n=!0),u.COLOR_0!==void 0&&(i=!0),r&&n&&i)break}if(!r&&!n&&!i)return Promise.resolve(c);const s=[],o=[],a=[];for(let l=0,h=e.length;l<h;l++){const u=e[l];if(r){const d=u.POSITION!==void 0?t.getDependency("accessor",u.POSITION):c.attributes.position;s.push(d)}if(n){const d=u.NORMAL!==void 0?t.getDependency("accessor",u.NORMAL):c.attributes.normal;o.push(d)}if(i){const d=u.COLOR_0!==void 0?t.getDependency("accessor",u.COLOR_0):c.attributes.color;a.push(d)}}return Promise.all([Promise.all(s),Promise.all(o),Promise.all(a)]).then(function(l){const h=l[0],u=l[1],d=l[2];return r&&(c.morphAttributes.position=h),n&&(c.morphAttributes.normal=u),i&&(c.morphAttributes.color=d),c.morphTargetsRelative=!0,c})}function wh(c,e){if(c.updateMorphTargets(),e.weights!==void 0)for(let t=0,r=e.weights.length;t<r;t++)c.morphTargetInfluences[t]=e.weights[t];if(e.extras&&Array.isArray(e.extras.targetNames)){const t=e.extras.targetNames;if(c.morphTargetInfluences.length===t.length){c.morphTargetDictionary={};for(let r=0,n=t.length;r<n;r++)c.morphTargetDictionary[t[r]]=r}else console.warn("THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.")}}function Ih(c){let e;const t=c.extensions&&c.extensions[P.KHR_DRACO_MESH_COMPRESSION];if(t?e="draco:"+t.bufferView+":"+t.indices+":"+Mn(t.attributes):e=c.indices+":"+Mn(c.attributes)+":"+c.mode,c.targets!==void 0)for(let r=0,n=c.targets.length;r<n;r++)e+=":"+Mn(c.targets[r]);return e}function Mn(c){let e="";const t=Object.keys(c).sort();for(let r=0,n=t.length;r<n;r++)e+=t[r]+":"+c[t[r]]+";";return e}function On(c){switch(c){case Int8Array:return 1/127;case Uint8Array:return 1/255;case Int16Array:return 1/32767;case Uint16Array:return 1/65535;default:throw new Error("THREE.GLTFLoader: Unsupported normalized accessor component type.")}}function _h(c){return c.search(/\.jpe?g($|\?)/i)>0||c.search(/^data\:image\/jpeg/)===0?"image/jpeg":c.search(/\.webp($|\?)/i)>0||c.search(/^data\:image\/webp/)===0?"image/webp":"image/png"}const Ah=new B;class Sh{constructor(e={},t={}){this.json=e,this.extensions={},this.plugins={},this.options=t,this.cache=new Yl,this.associations=new Map,this.primitiveCache={},this.nodeCache={},this.meshCache={refs:{},uses:{}},this.cameraCache={refs:{},uses:{}},this.lightCache={refs:{},uses:{}},this.sourceCache={},this.textureCache={},this.nodeNamesUsed={};let r=!1,n=!1,i=-1;typeof navigator<"u"&&(r=/^((?!chrome|android).)*safari/i.test(navigator.userAgent)===!0,n=navigator.userAgent.indexOf("Firefox")>-1,i=n?navigator.userAgent.match(/Firefox\/([0-9]+)\./)[1]:-1),typeof createImageBitmap>"u"||r||n&&i<98?this.textureLoader=new ul(this.options.manager):this.textureLoader=new xl(this.options.manager),this.textureLoader.setCrossOrigin(this.options.crossOrigin),this.textureLoader.setRequestHeader(this.options.requestHeader),this.fileLoader=new Hr(this.options.manager),this.fileLoader.setResponseType("arraybuffer"),this.options.crossOrigin==="use-credentials"&&this.fileLoader.setWithCredentials(!0)}setExtensions(e){this.extensions=e}setPlugins(e){this.plugins=e}parse(e,t){const r=this,n=this.json,i=this.extensions;this.cache.removeAll(),this.nodeCache={},this._invokeAll(function(s){return s._markDefs&&s._markDefs()}),Promise.all(this._invokeAll(function(s){return s.beforeRoot&&s.beforeRoot()})).then(function(){return Promise.all([r.getDependencies("scene"),r.getDependencies("animation"),r.getDependencies("camera")])}).then(function(s){const o={scene:s[0][n.scene||0],scenes:s[0],animations:s[1],cameras:s[2],asset:n.asset,parser:r,userData:{}};return lt(i,o,n),Je(o,n),Promise.all(r._invokeAll(function(a){return a.afterRoot&&a.afterRoot(o)})).then(function(){e(o)})}).catch(t)}_markDefs(){const e=this.json.nodes||[],t=this.json.skins||[],r=this.json.meshes||[];for(let n=0,i=t.length;n<i;n++){const s=t[n].joints;for(let o=0,a=s.length;o<a;o++)e[s[o]].isBone=!0}for(let n=0,i=e.length;n<i;n++){const s=e[n];s.mesh!==void 0&&(this._addNodeRef(this.meshCache,s.mesh),s.skin!==void 0&&(r[s.mesh].isSkinnedMesh=!0)),s.camera!==void 0&&this._addNodeRef(this.cameraCache,s.camera)}}_addNodeRef(e,t){t!==void 0&&(e.refs[t]===void 0&&(e.refs[t]=e.uses[t]=0),e.refs[t]++)}_getNodeRef(e,t,r){if(e.refs[t]<=1)return r;const n=r.clone(),i=(s,o)=>{const a=this.associations.get(s);a!=null&&this.associations.set(o,a);for(const[l,h]of s.children.entries())i(h,o.children[l])};return i(r,n),n.name+="_instance_"+e.uses[t]++,n}_invokeOne(e){const t=Object.values(this.plugins);t.push(this);for(let r=0;r<t.length;r++){const n=e(t[r]);if(n)return n}return null}_invokeAll(e){const t=Object.values(this.plugins);t.unshift(this);const r=[];for(let n=0;n<t.length;n++){const i=e(t[n]);i&&r.push(i)}return r}getDependency(e,t){const r=e+":"+t;let n=this.cache.get(r);if(!n){switch(e){case"scene":n=this.loadScene(t);break;case"node":n=this._invokeOne(function(i){return i.loadNode&&i.loadNode(t)});break;case"mesh":n=this._invokeOne(function(i){return i.loadMesh&&i.loadMesh(t)});break;case"accessor":n=this.loadAccessor(t);break;case"bufferView":n=this._invokeOne(function(i){return i.loadBufferView&&i.loadBufferView(t)});break;case"buffer":n=this.loadBuffer(t);break;case"material":n=this._invokeOne(function(i){return i.loadMaterial&&i.loadMaterial(t)});break;case"texture":n=this._invokeOne(function(i){return i.loadTexture&&i.loadTexture(t)});break;case"skin":n=this.loadSkin(t);break;case"animation":n=this._invokeOne(function(i){return i.loadAnimation&&i.loadAnimation(t)});break;case"camera":n=this.loadCamera(t);break;default:if(n=this._invokeOne(function(i){return i!=this&&i.getDependency&&i.getDependency(e,t)}),!n)throw new Error("Unknown type: "+e);break}this.cache.add(r,n)}return n}getDependencies(e){let t=this.cache.get(e);if(!t){const r=this,n=this.json[e+(e==="mesh"?"es":"s")]||[];t=Promise.all(n.map(function(i,s){return r.getDependency(e,s)})),this.cache.add(e,t)}return t}loadBuffer(e){const t=this.json.buffers[e],r=this.fileLoader;if(t.type&&t.type!=="arraybuffer")throw new Error("THREE.GLTFLoader: "+t.type+" buffer type is not supported.");if(t.uri===void 0&&e===0)return Promise.resolve(this.extensions[P.KHR_BINARY_GLTF].body);const n=this.options;return new Promise(function(i,s){r.load(tr.resolveURL(t.uri,n.path),i,void 0,function(){s(new Error('THREE.GLTFLoader: Failed to load buffer "'+t.uri+'".'))})})}loadBufferView(e){const t=this.json.bufferViews[e];return this.getDependency("buffer",t.buffer).then(function(r){const n=t.byteLength||0,i=t.byteOffset||0;return r.slice(i,i+n)})}loadAccessor(e){const t=this,r=this.json,n=this.json.accessors[e];if(n.bufferView===void 0&&n.sparse===void 0){const s=An[n.type],o=Pt[n.componentType],a=n.normalized===!0,l=new o(n.count*s);return Promise.resolve(new U(l,s,a))}const i=[];return n.bufferView!==void 0?i.push(this.getDependency("bufferView",n.bufferView)):i.push(null),n.sparse!==void 0&&(i.push(this.getDependency("bufferView",n.sparse.indices.bufferView)),i.push(this.getDependency("bufferView",n.sparse.values.bufferView))),Promise.all(i).then(function(s){const o=s[0],a=An[n.type],l=Pt[n.componentType],h=l.BYTES_PER_ELEMENT,u=h*a,d=n.byteOffset||0,f=n.bufferView!==void 0?r.bufferViews[n.bufferView].byteStride:void 0,p=n.normalized===!0;let g,m;if(f&&f!==u){const w=Math.floor(d/f),_="InterleavedBuffer:"+n.bufferView+":"+n.componentType+":"+w+":"+n.count;let A=t.cache.get(_);A||(g=new l(o,w*f,n.count*f/h),A=new Va(g,f/h),t.cache.add(_,A)),m=new jn(A,a,d%f/h,p)}else o===null?g=new l(n.count*a):g=new l(o,d,n.count*a),m=new U(g,a,p);if(n.sparse!==void 0){const w=An.SCALAR,_=Pt[n.sparse.indices.componentType],A=n.sparse.indices.byteOffset||0,S=n.sparse.values.byteOffset||0,C=new _(s[1],A,n.sparse.count*w),R=new l(s[2],S,n.sparse.count*a);o!==null&&(m=new U(m.array.slice(),m.itemSize,m.normalized));for(let M=0,E=C.length;M<E;M++){const D=C[M];if(m.setX(D,R[M*a]),a>=2&&m.setY(D,R[M*a+1]),a>=3&&m.setZ(D,R[M*a+2]),a>=4&&m.setW(D,R[M*a+3]),a>=5)throw new Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.")}}return m})}loadTexture(e){const t=this.json,r=this.options,i=t.textures[e].source,s=t.images[i];let o=this.textureLoader;if(s.uri){const a=r.manager.getHandler(s.uri);a!==null&&(o=a)}return this.loadTextureImage(e,i,o)}loadTextureImage(e,t,r){const n=this,i=this.json,s=i.textures[e],o=i.images[t],a=(o.uri||o.bufferView)+":"+s.sampler;if(this.textureCache[a])return this.textureCache[a];const l=this.loadImageSource(t,r).then(function(h){h.flipY=!1,h.name=s.name||o.name||"",h.name===""&&typeof o.uri=="string"&&o.uri.startsWith("data:image/")===!1&&(h.name=o.uri);const d=(i.samplers||{})[s.sampler]||{};return h.magFilter=ws[d.magFilter]||Fn,h.minFilter=ws[d.minFilter]||Nn,h.wrapS=Is[d.wrapS]||nr,h.wrapT=Is[d.wrapT]||nr,n.associations.set(h,{textures:e}),h}).catch(function(){return null});return this.textureCache[a]=l,l}loadImageSource(e,t){const r=this,n=this.json,i=this.options;if(this.sourceCache[e]!==void 0)return this.sourceCache[e].then(u=>u.clone());const s=n.images[e],o=self.URL||self.webkitURL;let a=s.uri||"",l=!1;if(s.bufferView!==void 0)a=r.getDependency("bufferView",s.bufferView).then(function(u){l=!0;const d=new Blob([u],{type:s.mimeType});return a=o.createObjectURL(d),a});else if(s.uri===void 0)throw new Error("THREE.GLTFLoader: Image "+e+" is missing URI and bufferView");const h=Promise.resolve(a).then(function(u){return new Promise(function(d,f){let p=d;t.isImageBitmapLoader===!0&&(p=function(g){const m=new fe(g);m.needsUpdate=!0,d(m)}),t.load(tr.resolveURL(u,i.path),p,void 0,f)})}).then(function(u){return l===!0&&o.revokeObjectURL(a),u.userData.mimeType=s.mimeType||_h(s.uri),u}).catch(function(u){throw console.error("THREE.GLTFLoader: Couldn't load texture",a),u});return this.sourceCache[e]=h,h}assignTexture(e,t,r,n){const i=this;return this.getDependency("texture",r.index).then(function(s){if(!s)return null;if(r.texCoord!==void 0&&r.texCoord>0&&(s=s.clone(),s.channel=r.texCoord),i.extensions[P.KHR_TEXTURE_TRANSFORM]){const o=r.extensions!==void 0?r.extensions[P.KHR_TEXTURE_TRANSFORM]:void 0;if(o){const a=i.associations.get(s);s=i.extensions[P.KHR_TEXTURE_TRANSFORM].extendTexture(s,o),i.associations.set(s,a)}}return n!==void 0&&(s.colorSpace=n),e[t]=s,s})}assignFinalMaterial(e){const t=e.geometry;let r=e.material;const n=t.attributes.tangent===void 0,i=t.attributes.color!==void 0,s=t.attributes.normal===void 0;if(e.isPoints){const o="PointsMaterial:"+r.uuid;let a=this.cache.get(o);a||(a=new Fs,ut.prototype.copy.call(a,r),a.color.copy(r.color),a.map=r.map,a.sizeAttenuation=!1,this.cache.add(o,a)),r=a}else if(e.isLine){const o="LineBasicMaterial:"+r.uuid;let a=this.cache.get(o);a||(a=new Gs,ut.prototype.copy.call(a,r),a.color.copy(r.color),a.map=r.map,this.cache.add(o,a)),r=a}if(n||i||s){let o="ClonedMaterial:"+r.uuid+":";n&&(o+="derivative-tangents:"),i&&(o+="vertex-colors:"),s&&(o+="flat-shading:");let a=this.cache.get(o);a||(a=r.clone(),i&&(a.vertexColors=!0),s&&(a.flatShading=!0),n&&(a.normalScale&&(a.normalScale.y*=-1),a.clearcoatNormalScale&&(a.clearcoatNormalScale.y*=-1)),this.cache.add(o,a),this.associations.set(a,this.associations.get(r))),r=a}e.material=r}getMaterialType(){return $n}loadMaterial(e){const t=this,r=this.json,n=this.extensions,i=r.materials[e];let s;const o={},a=i.extensions||{},l=[];if(a[P.KHR_MATERIALS_UNLIT]){const u=n[P.KHR_MATERIALS_UNLIT];s=u.getMaterialType(),l.push(u.extendParams(o,i,t))}else{const u=i.pbrMetallicRoughness||{};if(o.color=new Y(1,1,1),o.opacity=1,Array.isArray(u.baseColorFactor)){const d=u.baseColorFactor;o.color.setRGB(d[0],d[1],d[2],ae),o.opacity=d[3]}u.baseColorTexture!==void 0&&l.push(t.assignTexture(o,"map",u.baseColorTexture,te)),o.metalness=u.metallicFactor!==void 0?u.metallicFactor:1,o.roughness=u.roughnessFactor!==void 0?u.roughnessFactor:1,u.metallicRoughnessTexture!==void 0&&(l.push(t.assignTexture(o,"metalnessMap",u.metallicRoughnessTexture)),l.push(t.assignTexture(o,"roughnessMap",u.metallicRoughnessTexture))),s=this._invokeOne(function(d){return d.getMaterialType&&d.getMaterialType(e)}),l.push(Promise.all(this._invokeAll(function(d){return d.extendMaterialParams&&d.extendMaterialParams(e,o)})))}i.doubleSided===!0&&(o.side=Uo);const h=i.alphaMode||Sn.OPAQUE;if(h===Sn.BLEND?(o.transparent=!0,o.depthWrite=!1):(o.transparent=!1,h===Sn.MASK&&(o.alphaTest=i.alphaCutoff!==void 0?i.alphaCutoff:.5)),i.normalTexture!==void 0&&s!==Bt&&(l.push(t.assignTexture(o,"normalMap",i.normalTexture)),o.normalScale=new k(1,1),i.normalTexture.scale!==void 0)){const u=i.normalTexture.scale;o.normalScale.set(u,u)}if(i.occlusionTexture!==void 0&&s!==Bt&&(l.push(t.assignTexture(o,"aoMap",i.occlusionTexture)),i.occlusionTexture.strength!==void 0&&(o.aoMapIntensity=i.occlusionTexture.strength)),i.emissiveFactor!==void 0&&s!==Bt){const u=i.emissiveFactor;o.emissive=new Y().setRGB(u[0],u[1],u[2],ae)}return i.emissiveTexture!==void 0&&s!==Bt&&l.push(t.assignTexture(o,"emissiveMap",i.emissiveTexture,te)),Promise.all(l).then(function(){const u=new s(o);return i.name&&(u.name=i.name),Je(u,i),t.associations.set(u,{materials:e}),i.extensions&&lt(n,u,i),u})}createUniqueName(e){const t=G.sanitizeNodeName(e||"");return t in this.nodeNamesUsed?t+"_"+ ++this.nodeNamesUsed[t]:(this.nodeNamesUsed[t]=0,t)}loadGeometries(e){const t=this,r=this.extensions,n=this.primitiveCache;function i(o){return r[P.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(o,t).then(function(a){return _s(a,o,t)})}const s=[];for(let o=0,a=e.length;o<a;o++){const l=e[o],h=Ih(l),u=n[h];if(u)s.push(u.promise);else{let d;l.extensions&&l.extensions[P.KHR_DRACO_MESH_COMPRESSION]?d=i(l):d=_s(new Ae,l,t),n[h]={primitive:l,promise:d},s.push(d)}}return Promise.all(s)}loadMesh(e){const t=this,r=this.json,n=this.extensions,i=r.meshes[e],s=i.primitives,o=[];for(let a=0,l=s.length;a<l;a++){const h=s[a].material===void 0?bh(this.cache):this.getDependency("material",s[a].material);o.push(h)}return o.push(t.loadGeometries(s)),Promise.all(o).then(function(a){const l=a.slice(0,a.length-1),h=a[a.length-1],u=[];for(let f=0,p=h.length;f<p;f++){const g=h[f],m=s[f];let w;const _=l[f];if(m.mode===ue.TRIANGLES||m.mode===ue.TRIANGLE_STRIP||m.mode===ue.TRIANGLE_FAN||m.mode===void 0)w=i.isSkinnedMesh===!0?new Wa(g,_):new Oe(g,_),w.isSkinnedMesh===!0&&w.normalizeSkinWeights(),m.mode===ue.TRIANGLE_STRIP?w.geometry=bs(w.geometry,Ts):m.mode===ue.TRIANGLE_FAN&&(w.geometry=bs(w.geometry,En));else if(m.mode===ue.LINES)w=new Xa(g,_);else if(m.mode===ue.LINE_STRIP)w=new qn(g,_);else if(m.mode===ue.LINE_LOOP)w=new Za(g,_);else if(m.mode===ue.POINTS)w=new Ka(g,_);else throw new Error("THREE.GLTFLoader: Primitive mode unsupported: "+m.mode);Object.keys(w.geometry.morphAttributes).length>0&&wh(w,i),w.name=t.createUniqueName(i.name||"mesh_"+e),Je(w,i),m.extensions&&lt(n,w,m),t.assignFinalMaterial(w),u.push(w)}for(let f=0,p=u.length;f<p;f++)t.associations.set(u[f],{meshes:e,primitives:f});if(u.length===1)return i.extensions&&lt(n,u[0],i),u[0];const d=new Fr;i.extensions&&lt(n,d,i),t.associations.set(d,{meshes:e});for(let f=0,p=u.length;f<p;f++)d.add(u[f]);return d})}loadCamera(e){let t;const r=this.json.cameras[e],n=r[r.type];if(!n){console.warn("THREE.GLTFLoader: Missing camera parameters.");return}return r.type==="perspective"?t=new qr(Bs.radToDeg(n.yfov),n.aspectRatio||1,n.znear||1,n.zfar||2e6):r.type==="orthographic"&&(t=new Ls(-n.xmag,n.xmag,n.ymag,-n.ymag,n.znear,n.zfar)),r.name&&(t.name=this.createUniqueName(r.name)),Je(t,r),Promise.resolve(t)}loadSkin(e){const t=this.json.skins[e],r=[];for(let n=0,i=t.joints.length;n<i;n++)r.push(this._loadNodeShallow(t.joints[n]));return t.inverseBindMatrices!==void 0?r.push(this.getDependency("accessor",t.inverseBindMatrices)):r.push(null),Promise.all(r).then(function(n){const i=n.pop(),s=n,o=[],a=[];for(let l=0,h=s.length;l<h;l++){const u=s[l];if(u){o.push(u);const d=new B;i!==null&&d.fromArray(i.array,l*16),a.push(d)}else console.warn('THREE.GLTFLoader: Joint "%s" could not be found.',t.joints[l])}return new Wn(o,a)})}loadAnimation(e){const t=this.json,r=this,n=t.animations[e],i=n.name?n.name:"animation_"+e,s=[],o=[],a=[],l=[],h=[];for(let u=0,d=n.channels.length;u<d;u++){const f=n.channels[u],p=n.samplers[f.sampler],g=f.target,m=g.node,w=n.parameters!==void 0?n.parameters[p.input]:p.input,_=n.parameters!==void 0?n.parameters[p.output]:p.output;g.node!==void 0&&(s.push(this.getDependency("node",m)),o.push(this.getDependency("accessor",w)),a.push(this.getDependency("accessor",_)),l.push(p),h.push(g))}return Promise.all([Promise.all(s),Promise.all(o),Promise.all(a),Promise.all(l),Promise.all(h)]).then(function(u){const d=u[0],f=u[1],p=u[2],g=u[3],m=u[4],w=[];for(let _=0,A=d.length;_<A;_++){const S=d[_],C=f[_],R=p[_],M=g[_],E=m[_];if(S===void 0)continue;S.updateMatrix&&S.updateMatrix();const D=r._createAnimationTracks(S,C,R,M,E);if(D)for(let V=0;V<D.length;V++)w.push(D[V])}return new il(i,void 0,w)})}createNodeMesh(e){const t=this.json,r=this,n=t.nodes[e];return n.mesh===void 0?null:r.getDependency("mesh",n.mesh).then(function(i){const s=r._getNodeRef(r.meshCache,n.mesh,i);return n.weights!==void 0&&s.traverse(function(o){if(o.isMesh)for(let a=0,l=n.weights.length;a<l;a++)o.morphTargetInfluences[a]=n.weights[a]}),s})}loadNode(e){const t=this.json,r=this,n=t.nodes[e],i=r._loadNodeShallow(e),s=[],o=n.children||[];for(let l=0,h=o.length;l<h;l++)s.push(r.getDependency("node",o[l]));const a=n.skin===void 0?Promise.resolve(null):r.getDependency("skin",n.skin);return Promise.all([i,Promise.all(s),a]).then(function(l){const h=l[0],u=l[1],d=l[2];d!==null&&h.traverse(function(f){f.isSkinnedMesh&&f.bind(d,Ah)});for(let f=0,p=u.length;f<p;f++)h.add(u[f]);return h})}_loadNodeShallow(e){const t=this.json,r=this.extensions,n=this;if(this.nodeCache[e]!==void 0)return this.nodeCache[e];const i=t.nodes[e],s=i.name?n.createUniqueName(i.name):"",o=[],a=n._invokeOne(function(l){return l.createNodeMesh&&l.createNodeMesh(e)});return a&&o.push(a),i.camera!==void 0&&o.push(n.getDependency("camera",i.camera).then(function(l){return n._getNodeRef(n.cameraCache,i.camera,l)})),n._invokeAll(function(l){return l.createNodeAttachment&&l.createNodeAttachment(e)}).forEach(function(l){o.push(l)}),this.nodeCache[e]=Promise.all(o).then(function(l){let h;if(i.isBone===!0?h=new Ds:l.length>1?h=new Fr:l.length===1?h=l[0]:h=new q,h!==l[0])for(let u=0,d=l.length;u<d;u++)h.add(l[u]);if(i.name&&(h.userData.name=i.name,h.name=s),Je(h,i),i.extensions&&lt(r,h,i),i.matrix!==void 0){const u=new B;u.fromArray(i.matrix),h.applyMatrix4(u)}else i.translation!==void 0&&h.position.fromArray(i.translation),i.rotation!==void 0&&h.quaternion.fromArray(i.rotation),i.scale!==void 0&&h.scale.fromArray(i.scale);return n.associations.has(h)||n.associations.set(h,{}),n.associations.get(h).nodes=e,h}),this.nodeCache[e]}loadScene(e){const t=this.extensions,r=this.json.scenes[e],n=this,i=new Fr;r.name&&(i.name=n.createUniqueName(r.name)),Je(i,r),r.extensions&&lt(t,i,r);const s=r.nodes||[],o=[];for(let a=0,l=s.length;a<l;a++)o.push(n.getDependency("node",s[a]));return Promise.all(o).then(function(a){for(let h=0,u=a.length;h<u;h++)i.add(a[h]);const l=h=>{const u=new Map;for(const[d,f]of n.associations)(d instanceof ut||d instanceof fe)&&u.set(d,f);return h.traverse(d=>{const f=n.associations.get(d);f!=null&&u.set(d,f)}),u};return n.associations=l(i),i})}_createAnimationTracks(e,t,r,n,i){const s=[],o=e.name?e.name:e.uuid,a=[];Ke[i.path]===Ke.weights?e.traverse(function(d){d.morphTargetInfluences&&a.push(d.name?d.name:d.uuid)}):a.push(o);let l;switch(Ke[i.path]){case Ke.weights:l=Lt;break;case Ke.rotation:l=dt;break;case Ke.position:case Ke.scale:l=Dt;break;default:switch(r.itemSize){case 1:l=Lt;break;case 2:case 3:default:l=Dt;break}break}const h=n.interpolation!==void 0?xh[n.interpolation]:kt,u=this._getArrayFromAccessor(r);for(let d=0,f=a.length;d<f;d++){const p=new l(a[d]+"."+Ke[i.path],t.array,u,h);n.interpolation==="CUBICSPLINE"&&this._createCubicSplineTrackInterpolant(p),s.push(p)}return s}_getArrayFromAccessor(e){let t=e.array;if(e.normalized){const r=On(t.constructor),n=new Float32Array(t.length);for(let i=0,s=t.length;i<s;i++)n[i]=t[i]*r;t=n}return t}_createCubicSplineTrackInterpolant(e){e.createInterpolant=function(r){const n=this instanceof dt?gh:js;return new n(this.times,this.values,this.getValueSize()/3,r)},e.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline=!0}}function Mh(c,e,t){const r=e.attributes,n=new Fe;if(r.POSITION!==void 0){const o=t.json.accessors[r.POSITION],a=o.min,l=o.max;if(a!==void 0&&l!==void 0){if(n.set(new v(a[0],a[1],a[2]),new v(l[0],l[1],l[2])),o.normalized){const h=On(Pt[o.componentType]);n.min.multiplyScalar(h),n.max.multiplyScalar(h)}}else{console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");return}}else return;const i=e.targets;if(i!==void 0){const o=new v,a=new v;for(let l=0,h=i.length;l<h;l++){const u=i[l];if(u.POSITION!==void 0){const d=t.json.accessors[u.POSITION],f=d.min,p=d.max;if(f!==void 0&&p!==void 0){if(a.setX(Math.max(Math.abs(f[0]),Math.abs(p[0]))),a.setY(Math.max(Math.abs(f[1]),Math.abs(p[1]))),a.setZ(Math.max(Math.abs(f[2]),Math.abs(p[2]))),d.normalized){const g=On(Pt[d.componentType]);a.multiplyScalar(g)}o.max(a)}else console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.")}}n.expandByVector(o)}c.boundingBox=n;const s=new we;n.getCenter(s.center),s.radius=n.min.distanceTo(n.max)/2,c.boundingSphere=s}function _s(c,e,t){const r=e.attributes,n=[];function i(s,o){return t.getDependency("accessor",s).then(function(a){c.setAttribute(o,a)})}for(const s in r){const o=Dn[s]||s.toLowerCase();o in c.attributes||n.push(i(r[s],o))}if(e.indices!==void 0&&!c.index){const s=t.getDependency("accessor",e.indices).then(function(o){c.setIndex(o)});n.push(s)}return se.workingColorSpace!==ae&&"COLOR_0"in r&&console.warn(`THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${se.workingColorSpace}" not supported.`),Je(c,e),Mh(c,e,t),Promise.all(n).then(function(){return e.targets!==void 0?vh(c,e.targets,t):c})}var rr=function(){var c=0,e=document.createElement("div");e.style.cssText="position:fixed;top:0;left:0;cursor:pointer;opacity:0.9;z-index:10000",e.addEventListener("click",function(h){h.preventDefault(),r(++c%e.children.length)},!1);function t(h){return e.appendChild(h.dom),h}function r(h){for(var u=0;u<e.children.length;u++)e.children[u].style.display=u===h?"block":"none";c=h}var n=(performance||Date).now(),i=n,s=0,o=t(new rr.Panel("FPS","#0ff","#002")),a=t(new rr.Panel("MS","#0f0","#020"));if(self.performance&&self.performance.memory)var l=t(new rr.Panel("MB","#f08","#201"));return r(0),{REVISION:16,dom:e,addPanel:t,showPanel:r,begin:function(){n=(performance||Date).now()},end:function(){s++;var h=(performance||Date).now();if(a.update(h-n,200),h>=i+1e3&&(o.update(s*1e3/(h-i),100),i=h,s=0,l)){var u=performance.memory;l.update(u.usedJSHeapSize/1048576,u.jsHeapSizeLimit/1048576)}return h},update:function(){n=this.end()},domElement:e,setMode:r}};rr.Panel=function(c,e,t){var r=1/0,n=0,i=Math.round,s=i(window.devicePixelRatio||1),o=80*s,a=48*s,l=3*s,h=2*s,u=3*s,d=15*s,f=74*s,p=30*s,g=document.createElement("canvas");g.width=o,g.height=a,g.style.cssText="width:80px;height:48px";var m=g.getContext("2d");return m.font="bold "+9*s+"px Helvetica,Arial,sans-serif",m.textBaseline="top",m.fillStyle=t,m.fillRect(0,0,o,a),m.fillStyle=e,m.fillText(c,l,h),m.fillRect(u,d,f,p),m.fillStyle=t,m.globalAlpha=.9,m.fillRect(u,d,f,p),{dom:g,update:function(w,_){r=Math.min(r,w),n=Math.max(n,w),m.fillStyle=t,m.globalAlpha=1,m.fillRect(0,0,o,d),m.fillStyle=e,m.fillText(i(w)+" "+c+" ("+i(r)+"-"+i(n)+")",l,h),m.drawImage(g,u+s,d,f-s,p,u,d,f-s,p),m.fillRect(u+f-s,d,s,p),m.fillStyle=t,m.globalAlpha=.9,m.fillRect(u+f-s,d,s,i((1-w/_)*p))}}};class Ch{planes;constructor(e=new oe,t=new oe,r=new oe,n=new oe,i=new oe,s=new oe){this.planes=[e,t,r,n,i,s]}setFromProjectionMatrix(e){const t=this.planes,r=e.elements,n=r[0],i=r[1],s=r[2],o=r[3],a=r[4],l=r[5],h=r[6],u=r[7],d=r[8],f=r[9],p=r[10],g=r[11],m=r[12],w=r[13],_=r[14],A=r[15];return t[0].setComponents(o-n,u-a,g-d,A-m).normalize(),t[1].setComponents(o+n,u+a,g+d,A+m).normalize(),t[2].setComponents(o+i,u+l,g+f,A+w).normalize(),t[3].setComponents(o-i,u-l,g-f,A-w).normalize(),t[4].setComponents(o-s,u-h,g-p,A-_).normalize(),t[5].setComponents(s,h,p,_).normalize(),this}intersectsSphere(e){const t=this.planes,r=e.center,n=-e.radius;for(let i=0;i<6;i++)if(t[i].distanceToPoint(r)<n)return!1;return!0}}class Th{camera;controls;Frustum;cameraSize=4*4*4*Float32Array.BYTES_PER_ELEMENT;cameraBuffer;device;Halton_2_3;jitter_index;jitter;ENABLE_JITTER=!1;constructor(e){this.device=e,this.camera=new qr(60,this.device.canvas.width/this.device.canvas.height,.01,50),this.controls=new jl(this.camera,this.device.canvas),this.controls.target.set(0,4,0),this.camera.position.set(-4.5,4,0),this.controls.update(),this.Frustum=new Ch,this.cameraBuffer=this.device.device.createBuffer({label:"current view matrix and projection inverse",size:this.cameraSize,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.Halton_2_3=[new Float32Array([-4,-7]),new Float32Array([-7,-5]),new Float32Array([-3,-5]),new Float32Array([-5,-4]),new Float32Array([-1,-4]),new Float32Array([-2,-2]),new Float32Array([-6,-1]),new Float32Array([-4,0]),new Float32Array([-7,1]),new Float32Array([-1,2]),new Float32Array([-6,3]),new Float32Array([-3,3]),new Float32Array([-7,6]),new Float32Array([-3,6]),new Float32Array([-5,7]),new Float32Array([-1,7]),new Float32Array([5,-7]),new Float32Array([1,-6]),new Float32Array([6,-5]),new Float32Array([4,-4]),new Float32Array([2,-3]),new Float32Array([7,-2]),new Float32Array([1,-1]),new Float32Array([4,-1]),new Float32Array([2,1]),new Float32Array([6,2]),new Float32Array([0,4]),new Float32Array([4,4]),new Float32Array([2,5]),new Float32Array([7,5]),new Float32Array([5,6]),new Float32Array([3,7])],this.Halton_2_3.forEach(t=>{t[0]/=16*e.upscaleRatio,t[1]/=16*e.upscaleRatio}),this.jitter_index=0,this.jitter=e.device.createBuffer({label:"sampler jitter by yyf",size:Float32Array.BYTES_PER_ELEMENT*2,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})}lastVp=new B;vp=new B;viewMatrix=new B;projectionMatrix=new B;uboArray=new Float32Array(16*4);update(){this.lastVp.copy(this.camera.projectionMatrix).multiply(this.camera.matrixWorldInverse),this.controls.update();let e=this.camera.clone(),t=Math.floor(this.device.canvas.width/this.device.upscaleRatio),r=Math.floor(this.device.canvas.height/this.device.upscaleRatio);if(this.ENABLE_JITTER){e.setViewOffset(t,r,this.Halton_2_3[this.jitter_index][0],this.Halton_2_3[this.jitter_index][1],t,r);var n=new Float32Array(this.Halton_2_3[this.jitter_index]);this.device.device.queue.writeBuffer(this.jitter,0,n),this.jitter_index=(this.jitter_index+1)%32}this.vp.copy(e.projectionMatrix).multiply(e.matrixWorldInverse),this.viewMatrix.copy(e.matrixWorld),this.projectionMatrix.copy(e.projectionMatrixInverse),this.Frustum.setFromProjectionMatrix(this.vp),this.uboArray.set(this.viewMatrix.elements,0),this.uboArray.set(this.projectionMatrix.elements,16),this.uboArray.set(this.vp.elements,32),this.uboArray.set(this.lastVp.elements,48),this.device.device.queue.writeBuffer(this.cameraBuffer,0,this.uboArray)}checkFrustum(e){return e?this.Frustum.intersectsSphere(e):!0}}class Eh{device;model;camera;vBuffer;motionVec;depthTexture;sampler;bindGroupLayout;bindingGroup;pipeline;renderBundle;constructor(e,t,r,n){this.device=e,this.model=t,this.camera=r,this.vBuffer=n.vBuffer,this.motionVec=n.motionVec,this.depthTexture=n.depthTexture,this.sampler=this.device.device.createSampler({addressModeU:"mirror-repeat",addressModeV:"mirror-repeat",magFilter:"linear",minFilter:"linear",mipmapFilter:"linear",maxAnisotropy:16})}buildBindGroupLayout(){this.bindGroupLayout=this.device.device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float",viewDimension:"2d-array"}},{binding:2,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"filtering"}}]})}buildBindingGroup(){this.bindingGroup=this.device.device.createBindGroup({layout:this.bindGroupLayout,entries:[{binding:0,resource:{buffer:this.camera.cameraBuffer}},{binding:1,resource:this.model.albedo.texture.createView({dimension:"2d-array",baseArrayLayer:0,arrayLayerCount:Math.max(this.model.albedo.Storages.length,1)})},{binding:2,resource:this.sampler}]})}renderPassDescriptor;buildPipeline(){const e=this.device.device.createShaderModule({label:"vBuffer",code:Ie.get("vBuffer.wgsl")});this.pipeline=this.device.device.createRenderPipeline({label:"vBuffer",layout:this.device.device.createPipelineLayout({bindGroupLayouts:[this.bindGroupLayout]}),vertex:{module:e,entryPoint:"vs",buffers:[{arrayStride:3*4,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:e,entryPoint:"fs",targets:[{format:this.vBuffer.format},{format:this.motionVec.format}],constants:{width:Math.floor(this.device.canvas.width/this.device.upscaleRatio),height:Math.floor(this.device.canvas.height/this.device.upscaleRatio)}},primitive:{topology:"triangle-list",cullMode:"none",unclippedDepth:!1},depthStencil:{format:"depth32float",depthWriteEnabled:!0,depthCompare:"less"}}),this.renderPassDescriptor={colorAttachments:[{view:this.vBuffer.createView(),loadOp:"clear",storeOp:"store"},{view:this.motionVec.createView(),loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:this.depthTexture.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}}}async init(){this.buildBindGroupLayout(),this.buildBindingGroup(),this.buildPipeline()}record(e){const t=e.beginRenderPass(this.renderPassDescriptor);t.setPipeline(this.pipeline),t.setBindGroup(0,this.bindingGroup),t.setVertexBuffer(0,this.model.rasterVtxBuffer);for(let r=0;r<this.model.meshes.length;r++){const n=this.model.meshes[r];this.camera.checkFrustum(n.boundingSphere)&&t.draw(n.primitiveCount*3,1,n.primitiveOffset*3)}t.end()}}class Rh{device;model;camera;lights;spatialReuseIteration=2;DI_FLAG=1;GI_FLAG=0;dynamicLight=!0;vBuffer;motionVec;gBufferTex;gBufferAttri;previousGBufferAttri;outputBuffer;uniformBuffer;sampler;currentReservoir;previousReservoir;bindGroupLayoutInit;bindingGroupInit;bindGroupLayoutReuse;bindingGroupReuse;bindGroupLayoutAccumulate;bindingGroupAccumulate;bindGroupLayoutAccelerationStructure;bindingGroupAccelerationStructure;bindGroupLayoutReservoir;bindingGroupReservoir;bindingGroupReservoirInverse;bindGroupLayoutLight;bindingGroupLight;pipelineInit;pipelineReuse;pipelineAccumulate;constructor(e,t,r,n){this.device=e,this.model=t,this.camera=r,this.vBuffer=n.vBuffer,this.motionVec=n.motionVec,this.gBufferTex=n.gBufferTex,this.gBufferAttri=n.gBufferAttri,this.previousGBufferAttri=n.previousGBufferAttri,this.outputBuffer=n.currentFrameBuffer,this.sampler=this.device.device.createSampler({addressModeU:"mirror-repeat",addressModeV:"mirror-repeat",magFilter:"linear",minFilter:"linear",mipmapFilter:"linear"}),this.uniformBuffer=this.device.device.createBuffer({size:4*4,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});let i=Math.floor(e.canvas.width/e.upscaleRatio),s=Math.floor(e.canvas.height/e.upscaleRatio);this.currentReservoir=e.device.createBuffer({size:16*(4*i*s),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC}),this.previousReservoir=e.device.createBuffer({size:16*(4*i*s),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST})}buildBindGroupLayout(){this.bindGroupLayoutInit=this.device.device.createBindGroupLayout({label:"rayTracingInit",entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:3,visibility:GPUShaderStage.COMPUTE,texture:{sampleType:"float",viewDimension:"2d-array"}},{binding:4,visibility:GPUShaderStage.COMPUTE,texture:{sampleType:"float",viewDimension:"2d-array"}},{binding:5,visibility:GPUShaderStage.COMPUTE,texture:{sampleType:"float",viewDimension:"2d-array"}},{binding:6,visibility:GPUShaderStage.COMPUTE,texture:{sampleType:"uint"}},{binding:7,visibility:GPUShaderStage.COMPUTE,sampler:{type:"filtering"}},{binding:8,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}},{binding:9,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:10,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:11,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:12,visibility:GPUShaderStage.COMPUTE,texture:{sampleType:"uint"}}]}),this.bindGroupLayoutAccelerationStructure=this.device.device.createBindGroupLayout({label:"rayTracingAccelerationStructure",entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage"}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage"}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage"}}]}),this.bindGroupLayoutReservoir=this.device.device.createBindGroupLayout({label:"rayTracingReservoir",entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}}]}),this.bindGroupLayoutLight=this.device.device.createBindGroupLayout({label:"rayTracingLight",entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}}]}),this.bindGroupLayoutReuse=this.device.device.createBindGroupLayout({label:"rayTracingSpatialReuse",entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:3,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}}]}),this.bindGroupLayoutAccumulate=this.device.device.createBindGroupLayout({label:"rayTracingAccumulate",entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:3,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}}]})}async buildPipeline(){let e=Math.floor(this.device.canvas.width/this.device.upscaleRatio),t=Math.floor(this.device.canvas.height/this.device.upscaleRatio);const r=this.device.device.createShaderModule({label:"rayGen.wgsl",code:Ie.get("rayGen.wgsl").replace(/TREE_DEPTH/g,this.model.bvhMaxDepth.toString()).replace(/LIGHT_COUNT/g,this.lights.lightCount.toString())}),n=this.device.device.createShaderModule({label:"spatialReuse.wgsl",code:Ie.get("spatialReuse.wgsl").replace(/LIGHT_COUNT/g,this.lights.lightCount.toString())}),i=this.device.device.createShaderModule({label:"accumulate.wgsl",code:Ie.get("accumulate.wgsl").replace(/TREE_DEPTH/g,this.model.bvhMaxDepth.toString()).replace(/LIGHT_COUNT/g,this.lights.lightCount.toString())});this.pipelineInit=await this.device.device.createComputePipelineAsync({layout:this.device.device.createPipelineLayout({bindGroupLayouts:[this.bindGroupLayoutInit,this.bindGroupLayoutReservoir,this.bindGroupLayoutLight,this.bindGroupLayoutAccelerationStructure]}),compute:{module:r,entryPoint:"main",constants:{halfConeAngle:this.camera.camera.fov*Math.PI/180/(this.device.canvas.height/this.device.upscaleRatio*2),ENABLE_DI:this.DI_FLAG,ENABLE_GI:this.GI_FLAG,WIDTH:e,HEIGHT:t}}}),this.pipelineReuse=await this.device.device.createComputePipelineAsync({layout:this.device.device.createPipelineLayout({bindGroupLayouts:[this.bindGroupLayoutReuse,this.bindGroupLayoutReservoir,this.bindGroupLayoutLight]}),compute:{module:n,entryPoint:"main",constants:{ENABLE_DI:this.DI_FLAG,ENABLE_GI:this.GI_FLAG,WIDTH:e,HEIGHT:t}}}),this.pipelineAccumulate=await this.device.device.createComputePipelineAsync({layout:this.device.device.createPipelineLayout({bindGroupLayouts:[this.bindGroupLayoutAccumulate,this.bindGroupLayoutReservoir,this.bindGroupLayoutLight,this.bindGroupLayoutAccelerationStructure]}),compute:{module:i,entryPoint:"main",constants:{ENABLE_DI:this.DI_FLAG,ENABLE_GI:this.GI_FLAG,WIDTH:e,HEIGHT:t}}})}buildBindGroup(){this.bindingGroupInit=this.device.device.createBindGroup({label:"rayTracingInit",layout:this.bindGroupLayoutInit,entries:[{binding:0,resource:{buffer:this.outputBuffer}},{binding:1,resource:{buffer:this.camera.cameraBuffer}},{binding:2,resource:{buffer:this.model.geometryBuffer}},{binding:3,resource:this.model.albedo.texture.createView({dimension:"2d-array",baseArrayLayer:0,arrayLayerCount:Math.max(this.model.albedo.Storages.length,1)})},{binding:4,resource:this.model.normalMap.texture.createView({dimension:"2d-array",baseArrayLayer:0,arrayLayerCount:Math.max(this.model.normalMap.Storages.length,1)})},{binding:5,resource:this.model.specularRoughnessMap.texture.createView({dimension:"2d-array",baseArrayLayer:0,arrayLayerCount:Math.max(this.model.specularRoughnessMap.Storages.length,1)})},{binding:6,resource:this.vBuffer.createView()},{binding:7,resource:this.sampler},{binding:8,resource:{buffer:this.uniformBuffer}},{binding:9,resource:{buffer:this.gBufferTex}},{binding:10,resource:{buffer:this.gBufferAttri}},{binding:11,resource:{buffer:this.previousGBufferAttri}},{binding:12,resource:this.motionVec.createView()}]}),this.bindingGroupAccelerationStructure=this.device.device.createBindGroup({label:"rayTracingAccelerationStructure",layout:this.bindGroupLayoutAccelerationStructure,entries:[{binding:0,resource:{buffer:this.model.bvhBuffer}},{binding:1,resource:{buffer:this.model.vertexBuffer}},{binding:2,resource:{buffer:this.model.indexBuffer}}]}),this.bindingGroupReservoir=this.device.device.createBindGroup({label:"rayTracingReservoir",layout:this.bindGroupLayoutReservoir,entries:[{binding:0,resource:{buffer:this.currentReservoir}},{binding:1,resource:{buffer:this.previousReservoir}}]}),this.bindingGroupReservoirInverse=this.device.device.createBindGroup({label:"rayTracingReservoirInverse",layout:this.bindGroupLayoutReservoir,entries:[{binding:0,resource:{buffer:this.previousReservoir}},{binding:1,resource:{buffer:this.currentReservoir}}]}),this.bindingGroupLight=this.device.device.createBindGroup({label:"rayTracingLight",layout:this.bindGroupLayoutLight,entries:[{binding:0,resource:{buffer:this.lights.lightBuffer}}]}),this.bindingGroupReuse=this.device.device.createBindGroup({label:"rayTracingSpatialReuse",layout:this.bindGroupLayoutReuse,entries:[{binding:0,resource:{buffer:this.outputBuffer}},{binding:1,resource:{buffer:this.uniformBuffer}},{binding:2,resource:{buffer:this.gBufferTex}},{binding:3,resource:{buffer:this.gBufferAttri}}]}),this.bindingGroupAccumulate=this.device.device.createBindGroup({label:"rayTracingAccumulate",layout:this.bindGroupLayoutAccumulate,entries:[{binding:0,resource:{buffer:this.outputBuffer}},{binding:1,resource:{buffer:this.uniformBuffer}},{binding:2,resource:{buffer:this.gBufferTex}},{binding:3,resource:{buffer:this.gBufferAttri}}]})}async init(e){this.lights=e,this.buildBindGroupLayout(),await this.buildPipeline(),this.buildBindGroup()}uboBuffer=new ArrayBuffer(4*4);timeStamp=window.performance.now();updateUBO(){let e=new Uint32Array(this.uboBuffer),t=new Float32Array(this.uboBuffer);e[3]=Math.floor(Math.random()*4294967296),t.set(this.camera.camera.position.toArray(),0),this.device.device.queue.writeBuffer(this.uniformBuffer,0,this.uboBuffer);let r=window.performance.now()-this.timeStamp;if(this.timeStamp=window.performance.now(),this.dynamicLight){window.performance.now()/1e3;for(let n=0;n<this.lights.lightCount;n++)this.lights.lights[n].transform!=null&&(this.lights.lights[n].transform(r),this.device.device.queue.writeBuffer(this.lights.lightBuffer,4*(4+8*n),this.lights.lights[n].position))}}async record(e){let t=Math.floor(this.device.canvas.width/this.device.upscaleRatio),r=Math.floor(this.device.canvas.height/this.device.upscaleRatio);this.updateUBO();const n=e.beginComputePass();n.setPipeline(this.pipelineInit),n.setBindGroup(0,this.bindingGroupInit),n.setBindGroup(1,this.bindingGroupReservoir),n.setBindGroup(2,this.bindingGroupLight),n.setBindGroup(3,this.bindingGroupAccelerationStructure),n.dispatchWorkgroups(Math.ceil(t/8),Math.ceil(r/8),1),n.end();for(let s=0;s<this.spatialReuseIteration;s++){const o=e.beginComputePass();o.setPipeline(this.pipelineReuse),o.setBindGroup(0,this.bindingGroupReuse),o.setBindGroup(1,s%2==0?this.bindingGroupReservoirInverse:this.bindingGroupReservoir),o.setBindGroup(2,this.bindingGroupLight),o.dispatchWorkgroups(Math.ceil(t/8),Math.ceil(r/8),1),o.end()}const i=e.beginComputePass();i.setPipeline(this.pipelineAccumulate),i.setBindGroup(0,this.bindingGroupAccumulate),i.setBindGroup(1,this.spatialReuseIteration%2==0?this.bindingGroupReservoirInverse:this.bindingGroupReservoir),i.setBindGroup(2,this.bindingGroupLight),i.setBindGroup(3,this.bindingGroupAccelerationStructure),i.dispatchWorkgroups(Math.ceil(t/8),Math.ceil(r/8),1),i.end(),this.spatialReuseIteration%2==0&&e.copyBufferToBuffer(this.currentReservoir,0,this.previousReservoir,0,16*4*t*r)}}class Bh{device;camera;patchSize=8;iteration=3;ENABLE_DENOISE=!0;reflectance;motionVec;depthTexture;previousDepthTexture;historyLength;prevHistoryLength;moment;prevMoment;variance;prevVariance;illumination;previousIllumination;currentIllumination;gBufferAttri;previousGBufferAttri;accumlatePipeline;accumulateBindGroupLayout;accumulateBindGroup;temporalAccumulatePipeline;temporalAccumulateBindGroupLayout;temporalAccumulateBindGroup;fireflyPipeline;fireflyBindGroupLayout;fireflyBindGroup;filterVariancePipeline;varianceBindGroupLayout;varianceBindGroup;varianceBindGroupInverse;atrousPipeline=new Array(this.iteration);atrousBindGroupLayout;atrousBindGroup;atrousBindGroupInverse;constructor(e,t,r){this.device=e,this.camera=r,this.reflectance=t.gBufferTex,this.motionVec=t.motionVec,this.depthTexture=t.depthTexture,this.previousDepthTexture=t.previousDepthTexture,this.illumination=t.currentFrameBuffer,this.gBufferAttri=t.gBufferAttri,this.previousGBufferAttri=t.previousGBufferAttri;let n=Math.floor(this.device.canvas.width/this.device.upscaleRatio),i=Math.floor(this.device.canvas.height/this.device.upscaleRatio);this.previousIllumination=this.device.device.createBuffer({size:2*4*n*i,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST,label:"previousIllumination"}),this.currentIllumination=this.device.device.createBuffer({size:2*4*n*i,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST,label:"currentIllumination"}),this.historyLength=this.device.device.createBuffer({size:1*4*n*i,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC,label:"historyLength"}),this.prevHistoryLength=this.device.device.createBuffer({size:1*4*n*i,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST,label:"prevHistoryLength"}),this.moment=this.device.device.createBuffer({size:2*4*n*i,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC,label:"moment"}),this.prevMoment=this.device.device.createBuffer({size:2*4*n*i,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST,label:"prevMoment"}),this.variance=this.device.device.createBuffer({size:1*4*n*i,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC,label:"variance"}),this.prevVariance=this.device.device.createBuffer({size:1*4*n*i,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST,label:"prevVariance"})}buildBindGroupLayout(){this.varianceBindGroupLayout=this.device.device.createBindGroupLayout({label:"varianceBindGroupLayout",entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:2,visibility:GPUShaderStage.COMPUTE,texture:{sampleType:"depth"}}]}),this.temporalAccumulateBindGroupLayout=this.device.device.createBindGroupLayout({label:"temporalAccumulateBindGroupLayout",entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.COMPUTE,texture:{sampleType:"uint"}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:3,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:4,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:5,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:6,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:7,visibility:GPUShaderStage.COMPUTE,texture:{sampleType:"depth"}},{binding:8,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:9,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:10,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:11,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:12,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}}]}),this.fireflyBindGroupLayout=this.device.device.createBindGroupLayout({label:"fireflyBindGroupLayout",entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:3,visibility:GPUShaderStage.COMPUTE,texture:{sampleType:"depth"}}]}),this.atrousBindGroupLayout=this.device.device.createBindGroupLayout({label:"atrousBindGroupLayout",entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}}]})}async buildPipeline(){let e=Math.floor(this.device.canvas.width/this.device.upscaleRatio),t=Math.floor(this.device.canvas.height/this.device.upscaleRatio),r=this.device.device.createShaderModule({code:Ie.get("denoiseAccum.wgsl").replace(/BATCH_SIZE/g,this.patchSize.toString())});this.accumlatePipeline=await this.device.device.createComputePipelineAsync({label:"denoiseAccumulate",layout:"auto",compute:{module:r,entryPoint:"main",constants:{WIDTH:e,HEIGHT:t}}});let n=this.device.device.createShaderModule({code:Ie.get("temperalAccum.wgsl").replace(/BATCH_SIZE/g,this.patchSize.toString())});this.temporalAccumulatePipeline=await this.device.device.createComputePipelineAsync({label:"temperalAccumulate",layout:this.device.device.createPipelineLayout({bindGroupLayouts:[this.temporalAccumulateBindGroupLayout]}),compute:{module:n,entryPoint:"main",constants:{WIDTH:e,HEIGHT:t}}});let i=this.device.device.createShaderModule({code:Ie.get("firefly.wgsl").replace(/BATCH_SIZE/g,this.patchSize.toString())});this.fireflyPipeline=await this.device.device.createComputePipelineAsync({label:"firefly",layout:this.device.device.createPipelineLayout({bindGroupLayouts:[this.fireflyBindGroupLayout]}),compute:{module:i,entryPoint:"main",constants:{WIDTH:e,HEIGHT:t}}});let s=this.device.device.createShaderModule({code:Ie.get("filterVariance.wgsl").replace(/BATCH_SIZE/g,this.patchSize.toString())});this.filterVariancePipeline=await this.device.device.createComputePipelineAsync({label:"filterVariance",layout:this.device.device.createPipelineLayout({bindGroupLayouts:[this.varianceBindGroupLayout]}),compute:{module:s,entryPoint:"main",constants:{WIDTH:e,HEIGHT:t}}});for(let o=0;o<this.iteration;o++){let a=this.device.device.createShaderModule({code:Ie.get("atrous.wgsl").replace(/BATCH_SIZE/g,this.patchSize.toString()).replace(/STEP_SIZE/g,o.toString())});this.atrousPipeline[o]=await this.device.device.createComputePipelineAsync({label:"atrous",layout:this.device.device.createPipelineLayout({bindGroupLayouts:[this.atrousBindGroupLayout,this.varianceBindGroupLayout]}),compute:{module:a,entryPoint:"main",constants:{WIDTH:e,HEIGHT:t}}})}}buildBindGroup(){this.accumulateBindGroup=this.device.device.createBindGroup({label:"accumulateBindGroup",layout:this.accumlatePipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.currentIllumination}},{binding:1,resource:{buffer:this.illumination}},{binding:2,resource:{buffer:this.reflectance}},{binding:3,resource:{buffer:this.prevVariance}}]}),this.temporalAccumulateBindGroup=this.device.device.createBindGroup({label:"temperalAccumlateBindGroup",layout:this.temporalAccumulateBindGroupLayout,entries:[{binding:0,resource:{buffer:this.camera.cameraBuffer}},{binding:1,resource:this.motionVec.createView()},{binding:2,resource:{buffer:this.previousIllumination}},{binding:3,resource:{buffer:this.currentIllumination}},{binding:4,resource:{buffer:this.illumination}},{binding:5,resource:{buffer:this.gBufferAttri}},{binding:6,resource:{buffer:this.previousGBufferAttri}},{binding:7,resource:this.depthTexture.createView()},{binding:8,resource:{buffer:this.historyLength}},{binding:9,resource:{buffer:this.prevHistoryLength}},{binding:10,resource:{buffer:this.moment}},{binding:11,resource:{buffer:this.prevMoment}},{binding:12,resource:{buffer:this.variance}}]}),this.varianceBindGroup=this.device.device.createBindGroup({label:"varianceBindGroup",layout:this.varianceBindGroupLayout,entries:[{binding:0,resource:{buffer:this.variance}},{binding:1,resource:{buffer:this.prevVariance}},{binding:2,resource:this.depthTexture.createView()}]}),this.varianceBindGroupInverse=this.device.device.createBindGroup({label:"varianceBindGroupInverse",layout:this.varianceBindGroupLayout,entries:[{binding:0,resource:{buffer:this.prevVariance}},{binding:1,resource:{buffer:this.variance}},{binding:2,resource:this.previousDepthTexture.createView()}]}),this.fireflyBindGroup=this.device.device.createBindGroup({label:"fireflyBindGroup",layout:this.fireflyBindGroupLayout,entries:[{binding:0,resource:{buffer:this.currentIllumination}},{binding:1,resource:{buffer:this.illumination}},{binding:2,resource:{buffer:this.gBufferAttri}},{binding:3,resource:this.depthTexture.createView()}]}),this.atrousBindGroup=this.device.device.createBindGroup({label:"atrousBindGroup",layout:this.atrousBindGroupLayout,entries:[{binding:0,resource:{buffer:this.illumination}},{binding:1,resource:{buffer:this.currentIllumination}},{binding:2,resource:{buffer:this.gBufferAttri}}]}),this.atrousBindGroupInverse=this.device.device.createBindGroup({label:"atrousBindGroupInverse",layout:this.atrousBindGroupLayout,entries:[{binding:0,resource:{buffer:this.currentIllumination}},{binding:1,resource:{buffer:this.illumination}},{binding:2,resource:{buffer:this.gBufferAttri}}]})}async init(){this.buildBindGroupLayout(),await this.buildPipeline(),this.buildBindGroup()}record(e){let t=Math.floor(this.device.canvas.width/this.device.upscaleRatio),r=Math.floor(this.device.canvas.height/this.device.upscaleRatio);if(this.ENABLE_DENOISE==!0){const i=e.beginComputePass();i.setPipeline(this.temporalAccumulatePipeline),i.setBindGroup(0,this.temporalAccumulateBindGroup),i.dispatchWorkgroups(Math.ceil(t/this.patchSize),Math.ceil(r/this.patchSize),1),i.end();const s=e.beginComputePass();s.setPipeline(this.fireflyPipeline),s.setBindGroup(0,this.fireflyBindGroup),s.dispatchWorkgroups(Math.ceil(t/this.patchSize),Math.ceil(r/this.patchSize),1),s.end(),this.iteration==0&&e.copyBufferToBuffer(this.illumination,0,this.previousIllumination,0,2*4*t*r),e.copyBufferToBuffer(this.moment,0,this.prevMoment,0,2*4*t*r),e.copyBufferToBuffer(this.historyLength,0,this.prevHistoryLength,0,1*4*t*r);for(let o=0;o<this.iteration;o++){const a=e.beginComputePass();a.setPipeline(this.filterVariancePipeline),a.setBindGroup(0,this.varianceBindGroup),a.dispatchWorkgroups(Math.ceil(t/this.patchSize),Math.ceil(r/this.patchSize),1),a.end();const l=e.beginComputePass();l.setPipeline(this.atrousPipeline[o]),o%2==0?l.setBindGroup(0,this.atrousBindGroup):l.setBindGroup(0,this.atrousBindGroupInverse),l.setBindGroup(1,this.varianceBindGroupInverse),l.dispatchWorkgroups(Math.ceil(t/this.patchSize),Math.ceil(r/this.patchSize),1),l.end(),o==0&&e.copyBufferToBuffer(this.currentIllumination,0,this.previousIllumination,0,2*4*t*r)}}(this.ENABLE_DENOISE==!1||this.iteration%2==0)&&e.copyBufferToBuffer(this.illumination,0,this.currentIllumination,0,2*4*t*r);const n=e.beginComputePass();n.setPipeline(this.accumlatePipeline),n.setBindGroup(0,this.accumulateBindGroup),n.dispatchWorkgroups(Math.ceil(t/this.patchSize),Math.ceil(r/this.patchSize),1),n.end()}}class zh{currentFrameBuffer;previousFrameBuffer;previousDisplayBuffer;depthTexture;previousDepthTexture;vBuffer;motionVec;gBufferTex;gBufferAttri;previousGBufferAttri;constructor(e){let t=Math.floor(e.canvas.width/e.upscaleRatio),r=Math.floor(e.canvas.height/e.upscaleRatio);this.currentFrameBuffer=e.device.createBuffer({size:2*4*t*r,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),this.previousFrameBuffer=e.device.createBuffer({size:2*4*t*r,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.previousDisplayBuffer=e.device.createTexture({size:{width:e.canvas.width,height:e.canvas.height},format:e.format,dimension:"2d",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST}),this.depthTexture=e.device.createTexture({size:{width:t,height:r},format:"depth32float",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_SRC}),this.previousDepthTexture=e.device.createTexture({size:{width:t,height:r},format:"depth32float",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST}),this.vBuffer=e.device.createTexture({size:{width:t,height:r},format:"rgba32uint",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING}),this.motionVec=e.device.createTexture({size:{width:t,height:r},format:"r32uint",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING}),this.gBufferTex=e.device.createBuffer({size:2*4*t*r,usage:GPUBufferUsage.STORAGE}),this.gBufferAttri=e.device.createBuffer({size:4*4*t*r,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC}),this.previousGBufferAttri=e.device.createBuffer({size:4*4*t*r,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST})}update(e,t){let r=Math.floor(t.canvas.width/t.upscaleRatio),n=Math.floor(t.canvas.height/t.upscaleRatio);e.copyBufferToBuffer(this.gBufferAttri,0,this.previousGBufferAttri,0,4*4*r*n),e.copyBufferToBuffer(this.currentFrameBuffer,0,this.previousFrameBuffer,0,2*4*r*n),e.copyTextureToTexture({texture:this.depthTexture},{texture:this.previousDepthTexture},{width:r,height:n}),e.copyTextureToTexture({texture:t.context.getCurrentTexture()},{texture:this.previousDisplayBuffer},{width:t.canvas.width,height:t.canvas.height})}}/**
 * lil-gui
 * https://lil-gui.georgealways.com
 * @version 0.17.0
 * @author George Michael Brower
 * @license MIT
 */class Se{constructor(e,t,r,n,i="div"){this.parent=e,this.object=t,this.property=r,this._disabled=!1,this._hidden=!1,this.initialValue=this.getValue(),this.domElement=document.createElement("div"),this.domElement.classList.add("controller"),this.domElement.classList.add(n),this.$name=document.createElement("div"),this.$name.classList.add("name"),Se.nextNameID=Se.nextNameID||0,this.$name.id="lil-gui-name-"+ ++Se.nextNameID,this.$widget=document.createElement(i),this.$widget.classList.add("widget"),this.$disable=this.$widget,this.domElement.appendChild(this.$name),this.domElement.appendChild(this.$widget),this.parent.children.push(this),this.parent.controllers.push(this),this.parent.$children.appendChild(this.domElement),this._listenCallback=this._listenCallback.bind(this),this.name(r)}name(e){return this._name=e,this.$name.innerHTML=e,this}onChange(e){return this._onChange=e,this}_callOnChange(){this.parent._callOnChange(this),this._onChange!==void 0&&this._onChange.call(this,this.getValue()),this._changed=!0}onFinishChange(e){return this._onFinishChange=e,this}_callOnFinishChange(){this._changed&&(this.parent._callOnFinishChange(this),this._onFinishChange!==void 0&&this._onFinishChange.call(this,this.getValue())),this._changed=!1}reset(){return this.setValue(this.initialValue),this._callOnFinishChange(),this}enable(e=!0){return this.disable(!e)}disable(e=!0){return e===this._disabled||(this._disabled=e,this.domElement.classList.toggle("disabled",e),this.$disable.toggleAttribute("disabled",e)),this}show(e=!0){return this._hidden=!e,this.domElement.style.display=this._hidden?"none":"",this}hide(){return this.show(!1)}options(e){const t=this.parent.add(this.object,this.property,e);return t.name(this._name),this.destroy(),t}min(e){return this}max(e){return this}step(e){return this}decimals(e){return this}listen(e=!0){return this._listening=e,this._listenCallbackID!==void 0&&(cancelAnimationFrame(this._listenCallbackID),this._listenCallbackID=void 0),this._listening&&this._listenCallback(),this}_listenCallback(){this._listenCallbackID=requestAnimationFrame(this._listenCallback);const e=this.save();e!==this._listenPrevValue&&this.updateDisplay(),this._listenPrevValue=e}getValue(){return this.object[this.property]}setValue(e){return this.object[this.property]=e,this._callOnChange(),this.updateDisplay(),this}updateDisplay(){return this}load(e){return this.setValue(e),this._callOnFinishChange(),this}save(){return this.getValue()}destroy(){this.listen(!1),this.parent.children.splice(this.parent.children.indexOf(this),1),this.parent.controllers.splice(this.parent.controllers.indexOf(this),1),this.parent.$children.removeChild(this.domElement)}}class Ph extends Se{constructor(e,t,r){super(e,t,r,"boolean","label"),this.$input=document.createElement("input"),this.$input.setAttribute("type","checkbox"),this.$input.setAttribute("aria-labelledby",this.$name.id),this.$widget.appendChild(this.$input),this.$input.addEventListener("change",()=>{this.setValue(this.$input.checked),this._callOnFinishChange()}),this.$disable=this.$input,this.updateDisplay()}updateDisplay(){return this.$input.checked=this.getValue(),this}}function Gn(c){let e,t;return(e=c.match(/(#|0x)?([a-f0-9]{6})/i))?t=e[2]:(e=c.match(/rgb\(\s*(\d*)\s*,\s*(\d*)\s*,\s*(\d*)\s*\)/))?t=parseInt(e[1]).toString(16).padStart(2,0)+parseInt(e[2]).toString(16).padStart(2,0)+parseInt(e[3]).toString(16).padStart(2,0):(e=c.match(/^#?([a-f0-9])([a-f0-9])([a-f0-9])$/i))&&(t=e[1]+e[1]+e[2]+e[2]+e[3]+e[3]),!!t&&"#"+t}const kh={isPrimitive:!0,match:c=>typeof c=="string",fromHexString:Gn,toHexString:Gn},ar={isPrimitive:!0,match:c=>typeof c=="number",fromHexString:c=>parseInt(c.substring(1),16),toHexString:c=>"#"+c.toString(16).padStart(6,0)},Lh={isPrimitive:!1,match:Array.isArray,fromHexString(c,e,t=1){const r=ar.fromHexString(c);e[0]=(r>>16&255)/255*t,e[1]=(r>>8&255)/255*t,e[2]=(255&r)/255*t},toHexString:([c,e,t],r=1)=>ar.toHexString(c*(r=255/r)<<16^e*r<<8^t*r<<0)},Dh={isPrimitive:!1,match:c=>Object(c)===c,fromHexString(c,e,t=1){const r=ar.fromHexString(c);e.r=(r>>16&255)/255*t,e.g=(r>>8&255)/255*t,e.b=(255&r)/255*t},toHexString:({r:c,g:e,b:t},r=1)=>ar.toHexString(c*(r=255/r)<<16^e*r<<8^t*r<<0)},Oh=[kh,ar,Lh,Dh];class Gh extends Se{constructor(e,t,r,n){var i;super(e,t,r,"color"),this.$input=document.createElement("input"),this.$input.setAttribute("type","color"),this.$input.setAttribute("tabindex",-1),this.$input.setAttribute("aria-labelledby",this.$name.id),this.$text=document.createElement("input"),this.$text.setAttribute("type","text"),this.$text.setAttribute("spellcheck","false"),this.$text.setAttribute("aria-labelledby",this.$name.id),this.$display=document.createElement("div"),this.$display.classList.add("display"),this.$display.appendChild(this.$input),this.$widget.appendChild(this.$display),this.$widget.appendChild(this.$text),this._format=(i=this.initialValue,Oh.find(s=>s.match(i))),this._rgbScale=n,this._initialValueHexString=this.save(),this._textFocused=!1,this.$input.addEventListener("input",()=>{this._setValueFromHexString(this.$input.value)}),this.$input.addEventListener("blur",()=>{this._callOnFinishChange()}),this.$text.addEventListener("input",()=>{const s=Gn(this.$text.value);s&&this._setValueFromHexString(s)}),this.$text.addEventListener("focus",()=>{this._textFocused=!0,this.$text.select()}),this.$text.addEventListener("blur",()=>{this._textFocused=!1,this.updateDisplay(),this._callOnFinishChange()}),this.$disable=this.$text,this.updateDisplay()}reset(){return this._setValueFromHexString(this._initialValueHexString),this}_setValueFromHexString(e){if(this._format.isPrimitive){const t=this._format.fromHexString(e);this.setValue(t)}else this._format.fromHexString(e,this.getValue(),this._rgbScale),this._callOnChange(),this.updateDisplay()}save(){return this._format.toHexString(this.getValue(),this._rgbScale)}load(e){return this._setValueFromHexString(e),this._callOnFinishChange(),this}updateDisplay(){return this.$input.value=this._format.toHexString(this.getValue(),this._rgbScale),this._textFocused||(this.$text.value=this.$input.value.substring(1)),this.$display.style.backgroundColor=this.$input.value,this}}class Cn extends Se{constructor(e,t,r){super(e,t,r,"function"),this.$button=document.createElement("button"),this.$button.appendChild(this.$name),this.$widget.appendChild(this.$button),this.$button.addEventListener("click",n=>{n.preventDefault(),this.getValue().call(this.object)}),this.$button.addEventListener("touchstart",()=>{},{passive:!0}),this.$disable=this.$button}}class Fh extends Se{constructor(e,t,r,n,i,s){super(e,t,r,"number"),this._initInput(),this.min(n),this.max(i);const o=s!==void 0;this.step(o?s:this._getImplicitStep(),o),this.updateDisplay()}decimals(e){return this._decimals=e,this.updateDisplay(),this}min(e){return this._min=e,this._onUpdateMinMax(),this}max(e){return this._max=e,this._onUpdateMinMax(),this}step(e,t=!0){return this._step=e,this._stepExplicit=t,this}updateDisplay(){const e=this.getValue();if(this._hasSlider){let t=(e-this._min)/(this._max-this._min);t=Math.max(0,Math.min(t,1)),this.$fill.style.width=100*t+"%"}return this._inputFocused||(this.$input.value=this._decimals===void 0?e:e.toFixed(this._decimals)),this}_initInput(){this.$input=document.createElement("input"),this.$input.setAttribute("type","number"),this.$input.setAttribute("step","any"),this.$input.setAttribute("aria-labelledby",this.$name.id),this.$widget.appendChild(this.$input),this.$disable=this.$input;const e=h=>{const u=parseFloat(this.$input.value);isNaN(u)||(this._snapClampSetValue(u+h),this.$input.value=this.getValue())};let t,r,n,i,s,o=!1;const a=h=>{if(o){const u=h.clientX-t,d=h.clientY-r;Math.abs(d)>5?(h.preventDefault(),this.$input.blur(),o=!1,this._setDraggingStyle(!0,"vertical")):Math.abs(u)>5&&l()}if(!o){const u=h.clientY-n;s-=u*this._step*this._arrowKeyMultiplier(h),i+s>this._max?s=this._max-i:i+s<this._min&&(s=this._min-i),this._snapClampSetValue(i+s)}n=h.clientY},l=()=>{this._setDraggingStyle(!1,"vertical"),this._callOnFinishChange(),window.removeEventListener("mousemove",a),window.removeEventListener("mouseup",l)};this.$input.addEventListener("input",()=>{let h=parseFloat(this.$input.value);isNaN(h)||(this._stepExplicit&&(h=this._snap(h)),this.setValue(this._clamp(h)))}),this.$input.addEventListener("keydown",h=>{h.code==="Enter"&&this.$input.blur(),h.code==="ArrowUp"&&(h.preventDefault(),e(this._step*this._arrowKeyMultiplier(h))),h.code==="ArrowDown"&&(h.preventDefault(),e(this._step*this._arrowKeyMultiplier(h)*-1))}),this.$input.addEventListener("wheel",h=>{this._inputFocused&&(h.preventDefault(),e(this._step*this._normalizeMouseWheel(h)))},{passive:!1}),this.$input.addEventListener("mousedown",h=>{t=h.clientX,r=n=h.clientY,o=!0,i=this.getValue(),s=0,window.addEventListener("mousemove",a),window.addEventListener("mouseup",l)}),this.$input.addEventListener("focus",()=>{this._inputFocused=!0}),this.$input.addEventListener("blur",()=>{this._inputFocused=!1,this.updateDisplay(),this._callOnFinishChange()})}_initSlider(){this._hasSlider=!0,this.$slider=document.createElement("div"),this.$slider.classList.add("slider"),this.$fill=document.createElement("div"),this.$fill.classList.add("fill"),this.$slider.appendChild(this.$fill),this.$widget.insertBefore(this.$slider,this.$input),this.domElement.classList.add("hasSlider");const e=d=>{const f=this.$slider.getBoundingClientRect();let p=(g=d,m=f.left,w=f.right,_=this._min,A=this._max,(g-m)/(w-m)*(A-_)+_);var g,m,w,_,A;this._snapClampSetValue(p)},t=d=>{e(d.clientX)},r=()=>{this._callOnFinishChange(),this._setDraggingStyle(!1),window.removeEventListener("mousemove",t),window.removeEventListener("mouseup",r)};let n,i,s=!1;const o=d=>{d.preventDefault(),this._setDraggingStyle(!0),e(d.touches[0].clientX),s=!1},a=d=>{if(s){const f=d.touches[0].clientX-n,p=d.touches[0].clientY-i;Math.abs(f)>Math.abs(p)?o(d):(window.removeEventListener("touchmove",a),window.removeEventListener("touchend",l))}else d.preventDefault(),e(d.touches[0].clientX)},l=()=>{this._callOnFinishChange(),this._setDraggingStyle(!1),window.removeEventListener("touchmove",a),window.removeEventListener("touchend",l)},h=this._callOnFinishChange.bind(this);let u;this.$slider.addEventListener("mousedown",d=>{this._setDraggingStyle(!0),e(d.clientX),window.addEventListener("mousemove",t),window.addEventListener("mouseup",r)}),this.$slider.addEventListener("touchstart",d=>{d.touches.length>1||(this._hasScrollBar?(n=d.touches[0].clientX,i=d.touches[0].clientY,s=!0):o(d),window.addEventListener("touchmove",a,{passive:!1}),window.addEventListener("touchend",l))},{passive:!1}),this.$slider.addEventListener("wheel",d=>{if(Math.abs(d.deltaX)<Math.abs(d.deltaY)&&this._hasScrollBar)return;d.preventDefault();const f=this._normalizeMouseWheel(d)*this._step;this._snapClampSetValue(this.getValue()+f),this.$input.value=this.getValue(),clearTimeout(u),u=setTimeout(h,400)},{passive:!1})}_setDraggingStyle(e,t="horizontal"){this.$slider&&this.$slider.classList.toggle("active",e),document.body.classList.toggle("lil-gui-dragging",e),document.body.classList.toggle("lil-gui-"+t,e)}_getImplicitStep(){return this._hasMin&&this._hasMax?(this._max-this._min)/1e3:.1}_onUpdateMinMax(){!this._hasSlider&&this._hasMin&&this._hasMax&&(this._stepExplicit||this.step(this._getImplicitStep(),!1),this._initSlider(),this.updateDisplay())}_normalizeMouseWheel(e){let{deltaX:t,deltaY:r}=e;return Math.floor(e.deltaY)!==e.deltaY&&e.wheelDelta&&(t=0,r=-e.wheelDelta/120,r*=this._stepExplicit?1:10),t+-r}_arrowKeyMultiplier(e){let t=this._stepExplicit?1:10;return e.shiftKey?t*=10:e.altKey&&(t/=10),t}_snap(e){const t=Math.round(e/this._step)*this._step;return parseFloat(t.toPrecision(15))}_clamp(e){return e<this._min&&(e=this._min),e>this._max&&(e=this._max),e}_snapClampSetValue(e){this.setValue(this._clamp(this._snap(e)))}get _hasScrollBar(){const e=this.parent.root.$children;return e.scrollHeight>e.clientHeight}get _hasMin(){return this._min!==void 0}get _hasMax(){return this._max!==void 0}}class Nh extends Se{constructor(e,t,r,n){super(e,t,r,"option"),this.$select=document.createElement("select"),this.$select.setAttribute("aria-labelledby",this.$name.id),this.$display=document.createElement("div"),this.$display.classList.add("display"),this._values=Array.isArray(n)?n:Object.values(n),this._names=Array.isArray(n)?n:Object.keys(n),this._names.forEach(i=>{const s=document.createElement("option");s.innerHTML=i,this.$select.appendChild(s)}),this.$select.addEventListener("change",()=>{this.setValue(this._values[this.$select.selectedIndex]),this._callOnFinishChange()}),this.$select.addEventListener("focus",()=>{this.$display.classList.add("focus")}),this.$select.addEventListener("blur",()=>{this.$display.classList.remove("focus")}),this.$widget.appendChild(this.$select),this.$widget.appendChild(this.$display),this.$disable=this.$select,this.updateDisplay()}updateDisplay(){const e=this.getValue(),t=this._values.indexOf(e);return this.$select.selectedIndex=t,this.$display.innerHTML=t===-1?e:this._names[t],this}}class Uh extends Se{constructor(e,t,r){super(e,t,r,"string"),this.$input=document.createElement("input"),this.$input.setAttribute("type","text"),this.$input.setAttribute("aria-labelledby",this.$name.id),this.$input.addEventListener("input",()=>{this.setValue(this.$input.value)}),this.$input.addEventListener("keydown",n=>{n.code==="Enter"&&this.$input.blur()}),this.$input.addEventListener("blur",()=>{this._callOnFinishChange()}),this.$widget.appendChild(this.$input),this.$disable=this.$input,this.updateDisplay()}updateDisplay(){return this.$input.value=this.getValue(),this}}let As=!1;class Jn{constructor({parent:e,autoPlace:t=e===void 0,container:r,width:n,title:i="Controls",injectStyles:s=!0,touchStyles:o=!0}={}){if(this.parent=e,this.root=e?e.root:this,this.children=[],this.controllers=[],this.folders=[],this._closed=!1,this._hidden=!1,this.domElement=document.createElement("div"),this.domElement.classList.add("lil-gui"),this.$title=document.createElement("div"),this.$title.classList.add("title"),this.$title.setAttribute("role","button"),this.$title.setAttribute("aria-expanded",!0),this.$title.setAttribute("tabindex",0),this.$title.addEventListener("click",()=>this.openAnimated(this._closed)),this.$title.addEventListener("keydown",a=>{a.code!=="Enter"&&a.code!=="Space"||(a.preventDefault(),this.$title.click())}),this.$title.addEventListener("touchstart",()=>{},{passive:!0}),this.$children=document.createElement("div"),this.$children.classList.add("children"),this.domElement.appendChild(this.$title),this.domElement.appendChild(this.$children),this.title(i),o&&this.domElement.classList.add("allow-touch-styles"),this.parent)return this.parent.children.push(this),this.parent.folders.push(this),void this.parent.$children.appendChild(this.domElement);this.domElement.classList.add("root"),!As&&s&&(function(a){const l=document.createElement("style");l.innerHTML=a;const h=document.querySelector("head link[rel=stylesheet], head style");h?document.head.insertBefore(l,h):document.head.appendChild(l)}('.lil-gui{--background-color:#1f1f1f;--text-color:#ebebeb;--title-background-color:#111;--title-text-color:#ebebeb;--widget-color:#424242;--hover-color:#4f4f4f;--focus-color:#595959;--number-color:#2cc9ff;--string-color:#a2db3c;--font-size:11px;--input-font-size:11px;--font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;--font-family-mono:Menlo,Monaco,Consolas,"Droid Sans Mono",monospace;--padding:4px;--spacing:4px;--widget-height:20px;--name-width:45%;--slider-knob-width:2px;--slider-input-width:27%;--color-input-width:27%;--slider-input-min-width:45px;--color-input-min-width:45px;--folder-indent:7px;--widget-padding:0 0 0 3px;--widget-border-radius:2px;--checkbox-size:calc(var(--widget-height)*0.75);--scrollbar-width:5px;background-color:var(--background-color);color:var(--text-color);font-family:var(--font-family);font-size:var(--font-size);font-style:normal;font-weight:400;line-height:1;text-align:left;touch-action:manipulation;user-select:none;-webkit-user-select:none}.lil-gui,.lil-gui *{box-sizing:border-box;margin:0;padding:0}.lil-gui.root{display:flex;flex-direction:column;width:var(--width,245px)}.lil-gui.root>.title{background:var(--title-background-color);color:var(--title-text-color)}.lil-gui.root>.children{overflow-x:hidden;overflow-y:auto}.lil-gui.root>.children::-webkit-scrollbar{background:var(--background-color);height:var(--scrollbar-width);width:var(--scrollbar-width)}.lil-gui.root>.children::-webkit-scrollbar-thumb{background:var(--focus-color);border-radius:var(--scrollbar-width)}.lil-gui.force-touch-styles{--widget-height:28px;--padding:6px;--spacing:6px;--font-size:13px;--input-font-size:16px;--folder-indent:10px;--scrollbar-width:7px;--slider-input-min-width:50px;--color-input-min-width:65px}.lil-gui.autoPlace{max-height:100%;position:fixed;right:15px;top:0;z-index:1001}.lil-gui .controller{align-items:center;display:flex;margin:var(--spacing) 0;padding:0 var(--padding)}.lil-gui .controller.disabled{opacity:.5}.lil-gui .controller.disabled,.lil-gui .controller.disabled *{pointer-events:none!important}.lil-gui .controller>.name{flex-shrink:0;line-height:var(--widget-height);min-width:var(--name-width);padding-right:var(--spacing);white-space:pre}.lil-gui .controller .widget{align-items:center;display:flex;min-height:var(--widget-height);position:relative;width:100%}.lil-gui .controller.string input{color:var(--string-color)}.lil-gui .controller.boolean .widget{cursor:pointer}.lil-gui .controller.color .display{border-radius:var(--widget-border-radius);height:var(--widget-height);position:relative;width:100%}.lil-gui .controller.color input[type=color]{cursor:pointer;height:100%;opacity:0;width:100%}.lil-gui .controller.color input[type=text]{flex-shrink:0;font-family:var(--font-family-mono);margin-left:var(--spacing);min-width:var(--color-input-min-width);width:var(--color-input-width)}.lil-gui .controller.option select{max-width:100%;opacity:0;position:absolute;width:100%}.lil-gui .controller.option .display{background:var(--widget-color);border-radius:var(--widget-border-radius);height:var(--widget-height);line-height:var(--widget-height);max-width:100%;overflow:hidden;padding-left:.55em;padding-right:1.75em;pointer-events:none;position:relative;word-break:break-all}.lil-gui .controller.option .display.active{background:var(--focus-color)}.lil-gui .controller.option .display:after{bottom:0;content:"↕";font-family:lil-gui;padding-right:.375em;position:absolute;right:0;top:0}.lil-gui .controller.option .widget,.lil-gui .controller.option select{cursor:pointer}.lil-gui .controller.number input{color:var(--number-color)}.lil-gui .controller.number.hasSlider input{flex-shrink:0;margin-left:var(--spacing);min-width:var(--slider-input-min-width);width:var(--slider-input-width)}.lil-gui .controller.number .slider{background-color:var(--widget-color);border-radius:var(--widget-border-radius);cursor:ew-resize;height:var(--widget-height);overflow:hidden;padding-right:var(--slider-knob-width);touch-action:pan-y;width:100%}.lil-gui .controller.number .slider.active{background-color:var(--focus-color)}.lil-gui .controller.number .slider.active .fill{opacity:.95}.lil-gui .controller.number .fill{border-right:var(--slider-knob-width) solid var(--number-color);box-sizing:content-box;height:100%}.lil-gui-dragging .lil-gui{--hover-color:var(--widget-color)}.lil-gui-dragging *{cursor:ew-resize!important}.lil-gui-dragging.lil-gui-vertical *{cursor:ns-resize!important}.lil-gui .title{--title-height:calc(var(--widget-height) + var(--spacing)*1.25);-webkit-tap-highlight-color:transparent;text-decoration-skip:objects;cursor:pointer;font-weight:600;height:var(--title-height);line-height:calc(var(--title-height) - 4px);outline:none;padding:0 var(--padding)}.lil-gui .title:before{content:"▾";display:inline-block;font-family:lil-gui;padding-right:2px}.lil-gui .title:active{background:var(--title-background-color);opacity:.75}.lil-gui.root>.title:focus{text-decoration:none!important}.lil-gui.closed>.title:before{content:"▸"}.lil-gui.closed>.children{opacity:0;transform:translateY(-7px)}.lil-gui.closed:not(.transition)>.children{display:none}.lil-gui.transition>.children{overflow:hidden;pointer-events:none;transition-duration:.3s;transition-property:height,opacity,transform;transition-timing-function:cubic-bezier(.2,.6,.35,1)}.lil-gui .children:empty:before{content:"Empty";display:block;font-style:italic;height:var(--widget-height);line-height:var(--widget-height);margin:var(--spacing) 0;opacity:.5;padding:0 var(--padding)}.lil-gui.root>.children>.lil-gui>.title{border-width:0;border-bottom:1px solid var(--widget-color);border-left:0 solid var(--widget-color);border-right:0 solid var(--widget-color);border-top:1px solid var(--widget-color);transition:border-color .3s}.lil-gui.root>.children>.lil-gui.closed>.title{border-bottom-color:transparent}.lil-gui+.controller{border-top:1px solid var(--widget-color);margin-top:0;padding-top:var(--spacing)}.lil-gui .lil-gui .lil-gui>.title{border:none}.lil-gui .lil-gui .lil-gui>.children{border:none;border-left:2px solid var(--widget-color);margin-left:var(--folder-indent)}.lil-gui .lil-gui .controller{border:none}.lil-gui input{-webkit-tap-highlight-color:transparent;background:var(--widget-color);border:0;border-radius:var(--widget-border-radius);color:var(--text-color);font-family:var(--font-family);font-size:var(--input-font-size);height:var(--widget-height);outline:none;width:100%}.lil-gui input:disabled{opacity:1}.lil-gui input[type=number],.lil-gui input[type=text]{padding:var(--widget-padding)}.lil-gui input[type=number]:focus,.lil-gui input[type=text]:focus{background:var(--focus-color)}.lil-gui input::-webkit-inner-spin-button,.lil-gui input::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}.lil-gui input[type=number]{-moz-appearance:textfield}.lil-gui input[type=checkbox]{appearance:none;-webkit-appearance:none;border-radius:var(--widget-border-radius);cursor:pointer;height:var(--checkbox-size);text-align:center;width:var(--checkbox-size)}.lil-gui input[type=checkbox]:checked:before{content:"✓";font-family:lil-gui;font-size:var(--checkbox-size);line-height:var(--checkbox-size)}.lil-gui button{-webkit-tap-highlight-color:transparent;background:var(--widget-color);border:1px solid var(--widget-color);border-radius:var(--widget-border-radius);color:var(--text-color);cursor:pointer;font-family:var(--font-family);font-size:var(--font-size);height:var(--widget-height);line-height:calc(var(--widget-height) - 4px);outline:none;text-align:center;text-transform:none;width:100%}.lil-gui button:active{background:var(--focus-color)}@font-face{font-family:lil-gui;src:url("data:application/font-woff;charset=utf-8;base64,d09GRgABAAAAAAUsAAsAAAAACJwAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAABHU1VCAAABCAAAAH4AAADAImwmYE9TLzIAAAGIAAAAPwAAAGBKqH5SY21hcAAAAcgAAAD0AAACrukyyJBnbHlmAAACvAAAAF8AAACEIZpWH2hlYWQAAAMcAAAAJwAAADZfcj2zaGhlYQAAA0QAAAAYAAAAJAC5AHhobXR4AAADXAAAABAAAABMAZAAAGxvY2EAAANsAAAAFAAAACgCEgIybWF4cAAAA4AAAAAeAAAAIAEfABJuYW1lAAADoAAAASIAAAIK9SUU/XBvc3QAAATEAAAAZgAAAJCTcMc2eJxVjbEOgjAURU+hFRBK1dGRL+ALnAiToyMLEzFpnPz/eAshwSa97517c/MwwJmeB9kwPl+0cf5+uGPZXsqPu4nvZabcSZldZ6kfyWnomFY/eScKqZNWupKJO6kXN3K9uCVoL7iInPr1X5baXs3tjuMqCtzEuagm/AAlzQgPAAB4nGNgYRBlnMDAysDAYM/gBiT5oLQBAwuDJAMDEwMrMwNWEJDmmsJwgCFeXZghBcjlZMgFCzOiKOIFAB71Bb8AeJy1kjFuwkAQRZ+DwRAwBtNQRUGKQ8OdKCAWUhAgKLhIuAsVSpWz5Bbkj3dEgYiUIszqWdpZe+Z7/wB1oCYmIoboiwiLT2WjKl/jscrHfGg/pKdMkyklC5Zs2LEfHYpjcRoPzme9MWWmk3dWbK9ObkWkikOetJ554fWyoEsmdSlt+uR0pCJR34b6t/TVg1SY3sYvdf8vuiKrpyaDXDISiegp17p7579Gp3p++y7HPAiY9pmTibljrr85qSidtlg4+l25GLCaS8e6rRxNBmsnERunKbaOObRz7N72ju5vdAjYpBXHgJylOAVsMseDAPEP8LYoUHicY2BiAAEfhiAGJgZWBgZ7RnFRdnVJELCQlBSRlATJMoLV2DK4glSYs6ubq5vbKrJLSbGrgEmovDuDJVhe3VzcXFwNLCOILB/C4IuQ1xTn5FPilBTj5FPmBAB4WwoqAHicY2BkYGAA4sk1sR/j+W2+MnAzpDBgAyEMQUCSg4EJxAEAwUgFHgB4nGNgZGBgSGFggJMhDIwMqEAYAByHATJ4nGNgAIIUNEwmAABl3AGReJxjYAACIQYlBiMGJ3wQAEcQBEV4nGNgZGBgEGZgY2BiAAEQyQWEDAz/wXwGAAsPATIAAHicXdBNSsNAHAXwl35iA0UQXYnMShfS9GPZA7T7LgIu03SSpkwzYTIt1BN4Ak/gKTyAeCxfw39jZkjymzcvAwmAW/wgwHUEGDb36+jQQ3GXGot79L24jxCP4gHzF/EIr4jEIe7wxhOC3g2TMYy4Q7+Lu/SHuEd/ivt4wJd4wPxbPEKMX3GI5+DJFGaSn4qNzk8mcbKSR6xdXdhSzaOZJGtdapd4vVPbi6rP+cL7TGXOHtXKll4bY1Xl7EGnPtp7Xy2n00zyKLVHfkHBa4IcJ2oD3cgggWvt/V/FbDrUlEUJhTn/0azVWbNTNr0Ens8de1tceK9xZmfB1CPjOmPH4kitmvOubcNpmVTN3oFJyjzCvnmrwhJTzqzVj9jiSX911FjeAAB4nG3HMRKCMBBA0f0giiKi4DU8k0V2GWbIZDOh4PoWWvq6J5V8If9NVNQcaDhyouXMhY4rPTcG7jwYmXhKq8Wz+p762aNaeYXom2n3m2dLTVgsrCgFJ7OTmIkYbwIbC6vIB7WmFfAAAA==") format("woff")}@media (pointer:coarse){.lil-gui.allow-touch-styles{--widget-height:28px;--padding:6px;--spacing:6px;--font-size:13px;--input-font-size:16px;--folder-indent:10px;--scrollbar-width:7px;--slider-input-min-width:50px;--color-input-min-width:65px}}@media (hover:hover){.lil-gui .controller.color .display:hover:before{border:1px solid #fff9;border-radius:var(--widget-border-radius);bottom:0;content:" ";display:block;left:0;position:absolute;right:0;top:0}.lil-gui .controller.option .display.focus{background:var(--focus-color)}.lil-gui .controller.option .widget:hover .display{background:var(--hover-color)}.lil-gui .controller.number .slider:hover{background-color:var(--hover-color)}body:not(.lil-gui-dragging) .lil-gui .title:hover{background:var(--title-background-color);opacity:.85}.lil-gui .title:focus{text-decoration:underline var(--focus-color)}.lil-gui input:hover{background:var(--hover-color)}.lil-gui input:active{background:var(--focus-color)}.lil-gui input[type=checkbox]:focus{box-shadow:inset 0 0 0 1px var(--focus-color)}.lil-gui button:hover{background:var(--hover-color);border-color:var(--hover-color)}.lil-gui button:focus{border-color:var(--focus-color)}}'),As=!0),r?r.appendChild(this.domElement):t&&(this.domElement.classList.add("autoPlace"),document.body.appendChild(this.domElement)),n&&this.domElement.style.setProperty("--width",n+"px"),this.domElement.addEventListener("keydown",a=>a.stopPropagation()),this.domElement.addEventListener("keyup",a=>a.stopPropagation())}add(e,t,r,n,i){if(Object(r)===r)return new Nh(this,e,t,r);const s=e[t];switch(typeof s){case"number":return new Fh(this,e,t,r,n,i);case"boolean":return new Ph(this,e,t);case"string":return new Uh(this,e,t);case"function":return new Cn(this,e,t)}console.error(`gui.add failed
	property:`,t,`
	object:`,e,`
	value:`,s)}addColor(e,t,r=1){return new Gh(this,e,t,r)}addFolder(e){return new Jn({parent:this,title:e})}load(e,t=!0){return e.controllers&&this.controllers.forEach(r=>{r instanceof Cn||r._name in e.controllers&&r.load(e.controllers[r._name])}),t&&e.folders&&this.folders.forEach(r=>{r._title in e.folders&&r.load(e.folders[r._title])}),this}save(e=!0){const t={controllers:{},folders:{}};return this.controllers.forEach(r=>{if(!(r instanceof Cn)){if(r._name in t.controllers)throw new Error(`Cannot save GUI with duplicate property "${r._name}"`);t.controllers[r._name]=r.save()}}),e&&this.folders.forEach(r=>{if(r._title in t.folders)throw new Error(`Cannot save GUI with duplicate folder "${r._title}"`);t.folders[r._title]=r.save()}),t}open(e=!0){return this._closed=!e,this.$title.setAttribute("aria-expanded",!this._closed),this.domElement.classList.toggle("closed",this._closed),this}close(){return this.open(!1)}show(e=!0){return this._hidden=!e,this.domElement.style.display=this._hidden?"none":"",this}hide(){return this.show(!1)}openAnimated(e=!0){return this._closed=!e,this.$title.setAttribute("aria-expanded",!this._closed),requestAnimationFrame(()=>{const t=this.$children.clientHeight;this.$children.style.height=t+"px",this.domElement.classList.add("transition");const r=i=>{i.target===this.$children&&(this.$children.style.height="",this.domElement.classList.remove("transition"),this.$children.removeEventListener("transitionend",r))};this.$children.addEventListener("transitionend",r);const n=e?this.$children.scrollHeight:0;this.domElement.classList.toggle("closed",!e),requestAnimationFrame(()=>{this.$children.style.height=n+"px"})}),this}title(e){return this._title=e,this.$title.innerHTML=e,this}reset(e=!0){return(e?this.controllersRecursive():this.controllers).forEach(t=>t.reset()),this}onChange(e){return this._onChange=e,this}_callOnChange(e){this.parent&&this.parent._callOnChange(e),this._onChange!==void 0&&this._onChange.call(this,{object:e.object,property:e.property,value:e.getValue(),controller:e})}onFinishChange(e){return this._onFinishChange=e,this}_callOnFinishChange(e){this.parent&&this.parent._callOnFinishChange(e),this._onFinishChange!==void 0&&this._onFinishChange.call(this,{object:e.object,property:e.property,value:e.getValue(),controller:e})}destroy(){this.parent&&(this.parent.children.splice(this.parent.children.indexOf(this),1),this.parent.folders.splice(this.parent.folders.indexOf(this),1)),this.domElement.parentElement&&this.domElement.parentElement.removeChild(this.domElement),Array.from(this.children).forEach(e=>e.destroy())}controllersRecursive(){let e=Array.from(this.controllers);return this.folders.forEach(t=>{e=e.concat(t.controllersRecursive())}),e}foldersRecursive(){let e=Array.from(this.folders);return this.folders.forEach(t=>{e=e.concat(t.foldersRecursive())}),e}}let Ws=new rr;document.body.appendChild(Ws.dom);let Nr=await new uo().init(),N={flag:!1,upscaleRatio:Nr.upscaleRatio,scene:1,dynamicLight:!1,DI:!0,GI:!1,denoiser:!0},ht=new Jn({title:"Settings"});ht.add(N,"upscaleRatio",1,4).name("Upscale Ratio").decimals(1).onFinishChange(()=>{N.flag=!0}),ht.add(N,"scene",{Rabbit:0,Sponza:1}).name("Scene").onChange(()=>{N.flag=!0}),ht.add(N,"dynamicLight").name("Dynamic Light").onChange(()=>{N.flag=!0}),ht.add(N,"DI").name("DI").onChange(()=>{N.flag=!0}),ht.add(N,"GI").name("GI").onChange(()=>{N.flag=!0}),ht.add(N,"denoiser").name("Denoiser").onChange(()=>{N.flag=!0}),ht.add({title:()=>{alert(`Please try this demo before upgrading your Chrome or Edge browser to the latest version.
For windows users with multiple graphic cards, please make sure you are using the high-performance graphic card. 

You can set it in settings -> system -> display -> graphic settings ->  select the browser you are using -> options -> high-performance`)}},"title").name("Read Me ^.^");let Jt=Array();{Jt=[new ce(new Float32Array([-4,8,0]),new Float32Array([1,.5,.6]),50),new ce(new Float32Array([4,8,0]),new Float32Array([.5,1,1]),50),new ce(new Float32Array([0,3,0]),new Float32Array([1,1,1]),50),new ce(new Float32Array([8,6,3]),new Float32Array([1,1,.7]),40),new ce(new Float32Array([8,6,-3]),new Float32Array([.2,.5,1]),30),new ce(new Float32Array([-10,6,-4]),new Float32Array([.8,.8,1]),40),new ce(new Float32Array([-10,6,4]),new Float32Array([.5,1,.2]),35),new ce(new Float32Array([-9.5,1.5,-3.5]),new Float32Array([1,.5,.2]),20),new ce(new Float32Array([-9.5,1.5,3]),new Float32Array([1,.5,.2]),15),new ce(new Float32Array([9,1.5,-3.5]),new Float32Array([1,.5,.2]),15),new ce(new Float32Array([9,1.5,3]),new Float32Array([1,.5,.2]),20)];for(let c=0;c<3;c++){let e=2*Math.PI*Math.random(),t=Math.acos(2*Math.random()-1),r=[Math.sin(t)*Math.cos(e),Math.sin(t)*Math.sin(e),Math.cos(t)],n=Math.random()*2+1;for(let i=0;i<3;i++)r[i]*=n;Jt[c].velocity=r,Jt[c].transform=function(i){const s=[-5,1,-.5];let o=[5,8,.5];c==2?o[1]=4:s[1]=4;for(let a=0;a<3;a++)this.position[a]<s[a]&&(this.velocity[a]=Math.abs(this.velocity[a])),this.position[a]>o[a]&&(this.velocity[a]=-Math.abs(this.velocity[a])),this.position[a]+=this.velocity[a]*i/1e3*.5}.bind(Jt[c])}}Array();new ce(new Float32Array([0,3,0]),new Float32Array([1,1,1]),40);class Hh{device;buffers;model;lights;camera;vBuffer;rayTracing;denoiser;display;async init(){this.device=Nr;let e=new $l().setDRACOLoader(new Wl().setDecoderPath("./three/draco/"));Vr("model downloading...");let t=await e.loadAsync("./assets/stanford_bunny/bunny.gltf");t=t.scene,t.children[0].geometry.rotateX(-Math.PI/2),t.children[0].geometry.scale(10,10,10);let r=await e.loadAsync("./assets/sponza/sponza.gltf");r=r.scene,r.add(t.children[0]),this.model=new Ul,await this.model.init(r,this.device),this.lights=new Hl(Jt,this.device),await this.reset(),Vr("")}buildCmdBuffer(){this.camera.update();const e=this.device.device.createCommandEncoder();this.vBuffer.record(e),this.rayTracing.record(e),this.denoiser.record(e),this.display.record(e),this.buffers.update(e,this.device);let t=e.finish();this.device.device.queue.submit([t])}run(){const e=async()=>{N.flag&&(this.rayTracing.dynamicLight=N.dynamicLight,this.denoiser.ENABLE_DENOISE=N.denoiser,this.rayTracing.DI_FLAG!=(N.DI?1:0)&&(this.rayTracing.DI_FLAG=N.DI?1:0,await this.rayTracing.init(this.lights)),this.rayTracing.GI_FLAG!=(N.GI?1:0)&&(this.rayTracing.GI_FLAG=N.GI?1:0,await this.rayTracing.init(this.lights)),N.upscaleRatio!=Nr.upscaleRatio&&(Nr.upscaleRatio=N.upscaleRatio,await this.reset()),N.flag=!1),this.buildCmdBuffer(),Ws.update(),requestAnimationFrame(e)};requestAnimationFrame(e)}async reset(){this.buffers=new zh(this.device),this.camera=new Th(this.device),this.vBuffer=new Eh(this.device,this.model,this.camera,this.buffers),await this.vBuffer.init(),this.rayTracing=new Rh(this.device,this.model,this.camera,this.buffers),this.rayTracing.DI_FLAG=N.DI?1:0,this.rayTracing.GI_FLAG=N.GI?1:0,this.rayTracing.dynamicLight=N.dynamicLight,await this.rayTracing.init(this.lights),this.denoiser=new Bh(this.device,this.buffers,this.camera),await this.denoiser.init(),this.denoiser.ENABLE_DENOISE=N.denoiser,this.display=new Fo(this.device,this.buffers,this.camera)}}const qs=new Hh;await qs.init();qs.run();
