(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))r(n);new MutationObserver(n=>{for(const i of n)if(i.type==="childList")for(const o of i.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&r(o)}).observe(document,{childList:!0,subtree:!0});function t(n){const i={};return n.integrity&&(i.integrity=n.integrity),n.referrerPolicy&&(i.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?i.credentials="include":n.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function r(n){if(n.ep)return;n.ep=!0;const i=t(n);fetch(n.href,i)}})();class Cs{canvas;adapter;device;context;format;upscaleRatio=2;async init(){let e={width:document.documentElement.clientWidth,height:document.documentElement.clientHeight};this.canvas=document.createElement("canvas"),this.canvas.id="webgpuCanvas";const t=window.devicePixelRatio||1,r={width:1920,height:1080},n={width:1280,height:720};let i=!1;if(e.width<e.height&&(i=!0),i&&(e={width:e.height,height:e.width}),e.width*=t,e.height*=t,e.width>r.width||e.height>r.height?(e=r,console.log("1080p")):(e=n,console.log("720p")),i?(this.canvas.width=e.height,this.canvas.height=e.width,this.canvas.style.width=`${e.height/t}px`,this.canvas.style.height=`${e.width/t}px`):(this.canvas.width=e.width,this.canvas.height=e.height,this.canvas.style.width=`${e.width/t}px`,this.canvas.style.height=`${e.height/t}px`),this.canvas.style.alignSelf="center",document.body.appendChild(this.canvas),!navigator.gpu)throw alert("WebGPU may not supported in your browser"),new Error("Not Support WebGPU");let o=await navigator.gpu.requestAdapter({powerPreference:"high-performance"});if(!o)throw alert("No Adapter Found"),new Error("No Adapter Found");this.adapter=o;const s=this.adapter.features.has("bgra8unorm-storage");let a=await this.adapter.requestDevice({requiredLimits:{maxBufferSize:this.adapter.limits.maxBufferSize,maxStorageBufferBindingSize:this.adapter.limits.maxStorageBufferBindingSize,maxStorageBuffersPerShaderStage:this.adapter.limits.maxStorageBuffersPerShaderStage},requiredFeatures:s?["bgra8unorm-storage"]:[]});if(!a)throw alert("No Device Found"),new Error("No Device Found");this.device=a;let l=this.canvas.getContext("webgpu");if(!l)throw alert("No GPUContext Found"),new Error("No GPUContext Found");return this.context=l,this.format=s?navigator.gpu.getPreferredCanvasFormat():"rgba8unorm",t>=3&&(this.upscaleRatio=3),this.context.configure({device:this.device,format:this.format,alphaMode:"opaque",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.COPY_SRC}),this}}const Ps=`@binding(0) @group(0) var<storage, read> mvpMatrix : array<mat4x4<f32>>;\r
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
`,Ms=`@fragment\r
fn main(\r
    @location(0) fragUV: vec2<f32>,\r
    @location(1) fragPosition: vec4<f32>\r
) -> @location(0) vec4<f32> {\r
    return fragPosition;\r
}`,Ts=`@group(0) @binding(0) var<storage, read> input : array<f32, 7>;\r
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
`,Rs=`// Lambert Azimuthal Equal-Area projection\r
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
`,Ls=`struct Camera {\r
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
`,Es=`struct PackedLight {\r
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
`,Bs=`struct PackedLight {\r
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
}`,Ds=`const PI:f32=3.14159265359;\r
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
`,zs=`\r
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
    // retInfo.normalShading = normalGeo;\r
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
`,ks=`struct ReservoirDI {\r
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
    return 1;\r
    // let qs = reservoir.xv - reservoir.xs;\r
    // let rs = x - reservoir.xs;\r
    // let thetaq = max(1e-5, dot(reservoir.ns, normalize(qs)));\r
    // let thetar = max(1e-5, dot(reservoir.ns, normalize(rs)));\r
    // return thetar / thetaq * dot(qs, qs) / dot(rs, rs);\r
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
`,Fs=`@group(3) @binding(0) var<storage, read> bvh : BVH;\r
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
`,Gs=`fn pow5(x: f32) -> f32 {\r
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
    return max(vec3f(0), (1.0 - shadingPoint.metallicRoughness.x) * diffuse + (shadingPoint.metallicRoughness.x) * metallic);\r
    // return shadingPoint.baseColor * INVPI * ndoto;\r
}\r
\r
fn BSDFLuminance(shadingPoint: PointInfo, wo: vec3f, wi: vec3f) -> f32 {\r
    let ndoto = max(0., dot(shadingPoint.normalShading, wo));\r
    return luminance(shadingPoint.baseColor) * INVPI * ndoto;\r
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
}`,Os=`struct Camera {\r
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
override ENABLE_RIS: bool = true;\r
override ENABLE_TEMPORAL: bool = true;\r
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
    _ = ENABLE_DI;\r
    _ = ENABLE_GI;\r
    _ = ENABLE_RIS;\r
    _ = ENABLE_TEMPORAL;\r
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
    var _seed = tea(WorkgroupID.y * ((screen_size.x + 7) / 8) + WorkgroupID.x, ubo.seed, 4);\r
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
                if ENABLE_RIS {\r
                    var tmpReservoir = ReservoirDI();\r
                    var selected_pHat: f32 = 0.0;\r
                    for (var i = 0; i < 8; i = i + 1) {\r
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
                    let lightpdfinv = tmpReservoir.w_sum / max(0.001, selected_pHat * f32(tmpReservoir.M));\r
                    wo = light.position - samplePoint;\r
                    dist = length(wo);\r
                    wo = normalize(wo);\r
                    // check the visibility from sample point to light、\r
                    if dot(wo, pointSampleInfo.normalShading) > 0.0 && dot(wo, pointSampleInfo.normalGeo) > 0.0 {\r
                        if !traceShadowRay(samplePoint, wo, dist) {\r
                            let geometryTerm = light.color * light.intensity / (dist * dist);\r
                            let bsdf = BSDF(pointSampleInfo, wo, -wi);\r
                            let Lo = bsdf * geometryTerm * lightpdfinv;\r
                            updateReservoirGI(&reservoirCurGI, pointInfo.pos, pointInfo.normalShading, pointSampleInfo.pos, pointSampleInfo.normalShading, luminance(Lo) / tracePdf, Lo, light.id);\r
                        }\r
                    }\r
                } else {\r
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
        }\r
        reservoirCurGI.M = 1;\r
    }\r
\r
    // temperal reuse\r
    if ENABLE_TEMPORAL {\r
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
                    reservoirPrevGI.M = min(reservoirPrevGI.M, 4);\r
                    wo = reservoirPrevGI.xs - shadingPoint;\r
                    dist = length(wo);\r
                    wo = normalize(wo);\r
\r
                    var flag = true;\r
                    // if f32(ubo.seed & 0x7fffffff) / f32(0x80000000) < 1. / 4 {\r
                    // // // if f32(_seed & 0x7fffffff) / f32(0x80000000) < 1. / 8 {\r
                    //     // check visibility from light to sample point\r
                    //     color = vec3f(1.0);\r
                    //     light = getLight(reservoirPrevGI.lightId);\r
                    //     let dir = light.position - reservoirPrevGI.xs;\r
                    //     let dist = length(dir);\r
                    //     let wo = normalize(dir);\r
                    //     if traceShadowRay(reservoirPrevGI.xs, wo, dist) {\r
                    //         flag = false;\r
                    //     }\r
                    // }\r
                    if flag && dot(wo, pointInfo.normalShading) > 0.0 && dot(wo, pointInfo.normalGeo) > 0.0 && dot(-wo, reservoirPrevGI.ns) >= 0.0 {\r
\r
                        pHat = luminance(reservoirPrevGI.Lo) / Jacobian(pointInfo.pos, reservoirPrevGI);\r
                        reservoirPrevGI.w_sum = pHat * reservoirPrevGI.W * f32(reservoirPrevGI.M);\r
\r
                        combineReservoirsGI(&reservoirCurGI, reservoirPrevGI);\r
                    }\r
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
                reservoirCurDI.W = reservoirCurDI.w_sum / max(1e-4, pHat * f32(reservoirCurDI.M))  ;\r
            } else {\r
                reservoirCurDI.W = 0.0;\r
                reservoirCurDI.w_sum = 0.0;\r
            }\r
        }\r
\r
        // GI\r
        if ENABLE_GI {\r
            reservoirCurGI.W = reservoirCurGI.w_sum / max(1e-4, luminance(reservoirCurGI.Lo) * f32(reservoirCurGI.M))  ;\r
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
    //     // bsdf = BSDF(pointInfo, wo, -direction);\r
    //     bsdf = pointInfo.baseColor * dot(pointInfo.normalShading, wo);\r
    //     geometryTerm = light.color * light.intensity / (dist * dist);\r
    //     if traceShadowRay(shadingPoint, wo, dist) {\r
    //         visibility = 0.0;\r
    //     } else {\r
    //         visibility = 1.0;\r
    //     }\r
    //     color = bsdf * geometryTerm * visibility / samplePdf;\r
    //     // color = bsdf;\r
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
    // storeColor(&frame, launchIndex, pointInfo.baseColor);\r
    // storeColor(&frame, launchIndex, (pointInfo.normalShading + 1) / 2);\r
    // storeColor(&frame, launchIndex, color);\r
}`,Us=`// https://www.cg.cs.tu-bs.de/publications/Eisemann07FRA\r
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
`,Ns=`@group(0) @binding(0) var<storage, read_write> frame: array<vec2u>;\r
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
        storeReservoir(&currentReservoir, launchIndex, reservoirDI, reservoirGI, _seed);\r
        return;\r
    }\r
    seed = tea(GlobalInvocationID.y * screen_size.x + GlobalInvocationID.x, _seed, 2 + ubo.seed % 4);\r
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
        if planeDist < 0.001 && dot(pointInfo.normalShading, neighbour_pointAttri.normalShading) > .9 {\r
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
                    pHat = luminance(neighbor_reservoirGI.Lo) / Jacobian(pointInfo.pos, neighbor_reservoirGI);\r
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
            reservoirDI.W = reservoirDI.w_sum / max(5e-2, pHat * f32(reservoirDI.M)) ;\r
        }\r
        if ENABLE_GI {\r
            reservoirGI.W = reservoirGI.w_sum / max(1e-3, luminance(reservoirGI.Lo) * f32(reservoirGI.M))  ;\r
        }\r
    }\r
\r
\r
    // storeColor(&frame, launchIndex, color);\r
    storeReservoir(&currentReservoir, launchIndex, reservoirDI, reservoirGI, seed);\r
}`,Hs=`@group(0) @binding(0) var<storage, read_write> frame: array<vec2u>;\r
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
        if reservoirDI.W > 0. && traceShadowRay(shadingPoint, wo, dist) {\r
            reservoirDI.W = 0.;\r
            reservoirDI.w_sum = 0.;\r
        }\r
        bsdf = BSDF(pointInfo, wo, wi);\r
        geometryTerm = light.color * light.intensity / (dist * dist);\r
        color += max(0, reservoirDI.W) * bsdf * geometryTerm;\r
        // color += bsdf * geometryTerm;\r
        // if reservoirDI.W > 1e5 {\r
        //     reservoirDI.W = 0.;\r
        //     reservoirDI.w_sum = 0.;\r
        // }\r
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
            geometryTerm = reservoirGI.Lo * 4 / Jacobian(shadingPoint, reservoirGI);\r
            color += reservoirGI.W * bsdf * geometryTerm;\r
            // if reservoirGI.W > 1e15 {\r
            //     reservoirGI.W = 0.;\r
            //     reservoirGI.w_sum = 0.;\r
            // }\r
        }\r
    }\r
    storeReservoir(&currentReservoir, launchIndex, reservoirDI, reservoirGI, seed);\r
\r
    storeColor(&frame, launchIndex, color / max(pointInfo.baseColor, vec3f(1e-3)));\r
\r
    // storeColor(&frame, launchIndex, pointInfo.baseColor);\r
\r
    // storeColor(&frame, launchIndex, (pointInfo.normalShading + 1) / 2.);\r
}`,Vs=`// #include <utils.wgsl>;\r
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
}`,Ws=`fn invokePreload(GlobalInvocationID: vec2i, LocalInvocationID: vec2i) {\r
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
}`,js=`struct Camera {\r
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
            let screen_pos_pre_offset = screen_pos_pre - 0.5 + offset;\r
            // let screen_pos_pre_offset = screen_pos_pre + offset;\r
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
            // if validateReprojection(normalCenterAvg, posCenter, posPre) {\r
            //     sumIllum += loadIllumination(&illumination_previous, u32(launchIndexOffset));\r
            //     sumMoment += momentPrevious[launchIndexOffset] ;\r
            //     sumHistoryLength += historyLengthPrevious[launchIndexOffset] ;\r
            //     sumWeight += 1;\r
            // }\r
        }\r
        let posPre = gBufferAttriPrevious[getCoord(screen_pos_pre)].xyz;\r
        if sumWeight > 0. {\r
            sumIllum /= sumWeight;\r
            sumMoment /= sumWeight;\r
            sumHistoryLength /= sumWeight;\r
            historyLengthOut = clamp(sumHistoryLength + 1., 1., 5.);\r
            var alpha = 1. / historyLengthOut;\r
\r
            momentOut = mix(sumMoment, vec2f(illumSampLuminance, illumSampLuminance * illumSampLuminance), alpha);\r
            variance = max(momentOut.y - momentOut.x * momentOut.x, 1e-5);\r
\r
            // history clamping\r
                {\r
                let variance_prev = max(sumMoment.y - sumMoment.x * sumMoment.x, 1e-5);\r
                let posDiff = posCenter - posPre;\r
                let varRatio = variance / variance_prev;\r
                let historyFactor = exp(- 1 * pow(varRatio, 2) * log(1e-2 * length(posDiff) + 1.000));\r
\r
                historyLengthOut *= historyFactor;\r
                historyLengthOut = clamp(historyLengthOut, 1.1, 5.);\r
                alpha = 1. / historyLengthOut;\r
                momentOut = mix(sumMoment, vec2f(illumSampLuminance, illumSampLuminance * illumSampLuminance), alpha);\r
                variance = max(momentOut.y - momentOut.x * momentOut.x, 1e-5);\r
            }\r
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
}`,Xs=`@group(0) @binding(0) var<storage,read_write> illumination_input: array<vec2u>;\r
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
}`,qs=`@group(0) @binding(0) var<storage,read_write> variance_input: array<f32>;\r
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
}`,Ys=`@group(0) @binding(0) var<storage,read_write> illumination_in: array<vec2u>;\r
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
    const offset55: array<vec2i,25> = array<vec2i,25>(\r
        vec2i(-2, -2), vec2i(-1, -2), vec2i(0, -2), vec2i(1, -2), vec2i(2, -2),\r
        vec2i(-2, -1), vec2i(-1, -1), vec2i(0, -1), vec2i(1, -1), vec2i(2, -1),\r
        vec2i(-2, 0), vec2i(-1, 0), vec2i(0, 0), vec2i(1, 0), vec2i(2, 0),\r
        vec2i(-2, 1), vec2i(-1, 1), vec2i(0, 1), vec2i(1, 1), vec2i(2, 1),\r
        vec2i(-2, 2), vec2i(-1, 2), vec2i(0, 2), vec2i(1, 2), vec2i(2, 2)\r
    );\r
    // high precision 5x5 gaussian filter weight\r
    const weight55: array<f32,25> = array<f32,25>(\r
        1 / 256.0, 4 / 256.0, 6 / 256.0, 4 / 256.0, 1 / 256.0,\r
        4 / 256.0, 16 / 256.0, 24 / 256.0, 16 / 256.0, 4 / 256.0,\r
        6 / 256.0, 24 / 256.0, 36 / 256.0, 24 / 256.0, 6 / 256.0,\r
        4 / 256.0, 16 / 256.0, 24 / 256.0, 16 / 256.0, 4 / 256.0,\r
        1 / 256.0, 4 / 256.0, 6 / 256.0, 4 / 256.0, 1 / 256.0\r
    );\r
    // const offset33: array<vec2i,9> = array<vec2i,9>(\r
    //     vec2i(-1, -1), vec2i(0, -1), vec2i(1, -1),\r
    //     vec2i(-1, 0), vec2i(0, 0), vec2i(1, 0),\r
    //     vec2i(-1, 1), vec2i(0, 1), vec2i(1, 1)\r
    // );\r
    // // high precision 3x3 gaussian filter weight\r
    // const weight33: array<f32,9> = array<f32,9>(\r
    //     1 / 16.0, 2 / 16.0, 1 / 16.0,\r
    //     2 / 16.0, 4 / 16.0, 2 / 16.0,\r
    //     1 / 16.0, 2 / 16.0, 1 / 16.0\r
    // );\r
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
    for (var i = 0; i < 25; i = i + 1) {\r
        let offset = offset55[i];\r
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
        let weight = wposition * wnormal * wluminance * weight55[i];\r
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
`,Zs=`@group(0) @binding(0) var<storage, read_write> illumination: array<vec2u>;\r
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
}`,$s=`\r
\r
\r
@group(0) @binding(0) var<uniform> sampJitter : vec2<f32>;\r
@group(0) @binding(1) var samp : sampler;\r
// @group(0) @binding(2) var currentFrame : texture_2d<f32>;\r
// @group(0) @binding(3) var previousFrame : texture_2d<f32>;\r
@group(0) @binding(2) var<storage, read_write> currentFrame : array<vec2u>;\r
@group(0) @binding(3) var<storage, read_write> previousFrame : array<vec2u>;\r
@group(0) @binding(4) var vBuffer : texture_2d<u32>;\r
@group(0) @binding(5) var depthBuffer : texture_depth_2d;\r
@group(0) @binding(6) var dilatedDepth : texture_storage_2d<r32float, write>;\r
// @group(0) @binding(7) var reconstructedPreviousDepth : texture_storage_2d<r32, read_write>;\r
@group(0) @binding(7) var<storage, read_write>  reconstructedPreviousDepth : array<i32>;\r
@group(0) @binding(8) var dilatedMotionVectors : texture_storage_2d<rgba16float, write>;\r
@group(0) @binding(9) var lockInputLuma : texture_storage_2d<r32float, write>;\r
@group(0) @binding(10) var previousdepthBuffer : texture_depth_2d;\r
\r
// #include <FSR_common.wgsl>;\r
\r
const BORDER: i32 = 1;\r
const SHARED_SIZE: i32 = BATCH_SIZE + BORDER * 2;\r
\r
\r
\r
var<workgroup> sharedDepth: array<array<f32, SHARED_SIZE>, SHARED_SIZE>;\r
//var<workgroup> sharedMotionVec: array<array<vec2<f32>, SHARED_SIZE>, SHARED_SIZE>;\r
\r
var<private> globalInvocationID: vec3<i32> = vec3<i32>(0, 0, 0);\r
var<private> workgroupID: vec3<i32> = vec3<i32>(0, 0, 0);\r
var<private> localInvocationID: vec3<i32> = vec3<i32>(0, 0, 0);\r
fn preload(sharedPos: vec2i, globalPos: vec2i) {\r
    let globalId = clamp(globalPos, vec2i(0), vec2i(RenderSize()) - 1);\r
    let depthValue = textureLoad(depthBuffer, globalId, 0);\r
    sharedDepth[sharedPos.y][sharedPos.x] = depthValue;\r
    // var visibility: vec4<u32> = textureLoad(vBuffer, globalId, 0);\r
    // let motionVec: vec2<f32> = unpack2x16float(visibility.x);\r
    //sharedMotionVec[sharedPos.y][sharedPos.x] = motionVec;\r
}   \r
fn slove_cache_idx(iPxPos: vec2<i32>) -> vec2<i32> {\r
    let group_base = globalInvocationID - localInvocationID - BORDER;\r
    let ipx_offset: vec2<i32> = iPxPos - group_base.xy;\r
    let offsets = ipx_offset.x + ipx_offset.y * SHARED_SIZE;\r
    let idx: vec2<i32> = vec2i(offsets % SHARED_SIZE, offsets / SHARED_SIZE);\r
    return idx;\r
}\r
\r
fn invokePreload(GlobalInvocationID: vec2i, LocalInvocationID: vec2i) {\r
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
}\r
\r
\r
\r
\r
fn LoadInputMotionVector(iPxHrPos: vec2<i32>) -> vec2<f32> {\r
    var visibility: vec4<u32> = textureLoad(vBuffer, iPxHrPos, 0);\r
    let motionVec: vec2<f32> = unpack2x16float(visibility.x);\r
    //return vec2<f32>(0,0);\r
    return motionVec;\r
}\r
\r
fn LoadInputColor(iPxPos: vec2<i32>) -> vec3<f32> {\r
    //return textureLoad(rawColor, iPxPos, 0).xyz;\r
    let idx: i32 = iPxPos.y * _renderWidth + iPxPos.x;\r
    let data = currentFrame[idx];\r
    let color: vec3<f32> = vec3f(unpack2x16float(data.x).xy, unpack2x16float(data.y).x);\r
\r
    return color;\r
}\r
fn LoadInputDepth(iPxPos: vec2<i32>) -> f32 {\r
    if enCache {\r
        let sharedPos = slove_cache_idx(iPxPos);\r
        return sharedDepth[sharedPos.y][sharedPos.x] ;\r
    }\r
    return textureLoad(depthBuffer, iPxPos, 0);\r
}\r
\r
\r
// fn LoadDilatedDepth(iPxPos: vec2<i32>) -> f32 {\r
//     return textureLoad(dilatedDepth, iPxPos, 0);\r
// }\r
fn StoreDilatedDepth(iPxPos: vec2<i32>, fDilatedDepth: f32) {\r
    textureStore(dilatedDepth, iPxPos, vec4<f32>(fDilatedDepth, 0, 0, 0));\r
}\r
// fn LoadReconstructedPreviousDepth(iPxPos: vec2<i32>) -> f32 {\r
//     return textureLoad(reconstructedPreviousDepth, iPxPos, 0);\r
// }\r
fn StoreReconstructedPreviousDepth(iPxPos: vec2<i32>, fDilatedDepth: i32) {\r
    //textureStore(reconstructedPreviousDepth, iPxPos, vec4<f32>(fDilatedDepth, 0, 0, 0));\\\r
    var idx = u32(iPxPos.x) * u32(RenderSize().x) + u32(iPxPos.y);\r
    //atomicMin(&reconstructedPreviousDepth[idx], fDilatedDepth);\r
    reconstructedPreviousDepth[idx] = fDilatedDepth;\r
    // var atomic_ptr:\r
    // atomicMin(atomic_ptr: ptr<SC, atomic<T>, A>, v: T) -> T\r
}\r
// fn LoadDilatedMotionVector(iPxPos: vec2<i32>) -> vec2<f32> {\r
//     var dilatedMotionVec: u32 = textureLoad(dilatedMotionVectors, iPxPos, 0);\r
//     let motionVec: vec2<f32> = unpack2x16float(dilatedMotionVec);\r
//     return motionVec;\r
// }\r
fn StoreDilatedMotionVector(iPxPos: vec2<i32>, dilatedMotionVec: vec2<f32>) {\r
    var uvalue: u32 = pack2x16float(dilatedMotionVec);\r
    //var fptr: ptr<function,f32> = ptr<function,f32>(&uvalue);\r
    textureStore(dilatedMotionVectors, iPxPos, vec4<f32>(dilatedMotionVec, 0, 0));\r
}\r
// fn LoadLockInputLuma(iPxPos: vec2<i32>) -> f32 {\r
//     return textureLoad(lockInputLuma, iPxPos, 0);\r
// }\r
fn StoreLockInputLuma(iPxPos: vec2<i32>, flockInputLuma: f32) {\r
    textureStore(lockInputLuma, iPxPos, vec4<f32>(flockInputLuma, 0, 0, 0));\r
}\r
\r
\r
fn ComputeLockInputLuma(iPxLrPos: vec2<i32>) -> f32 {\r
    // We assume linear data. if non-linear input (sRGB, ...),\r
    // then we should convert to linear first and back to sRGB on output.\r
    var fRgb: vec3<f32> = max(vec3<f32>(0, 0, 0), LoadInputColor(iPxLrPos));\r
\r
    // Use internal auto exposure for locking logic\r
    fRgb /= PreExposure();\r
    fRgb *= Exposure();\r
\r
    // compute luma used to lock pixels, if used elsewhere the pow must be moved!\r
    let fLockInputLuma: f32 = pow(RGBToPerceivedLuma(fRgb), f32(1.0 / 6.0));\r
\r
    return fLockInputLuma;\r
}\r
fn RectificationBoxAddInitialSample(rectificationBox: ptr<function,RectificationBox>, colorSample: vec3<f32>, fSampleWeight: f32) {\r
    (*rectificationBox).aabbMin = colorSample;\r
    (*rectificationBox).aabbMax = colorSample;\r
\r
    let weightedSample: vec3<f32> = colorSample * fSampleWeight;\r
    (*rectificationBox).boxCenter = weightedSample;\r
    (*rectificationBox).boxVec = colorSample * weightedSample;\r
    (*rectificationBox).fBoxCenterWeight = fSampleWeight;\r
}\r
fn RectificationBoxAddSample(bInitialSample: bool, rectificationBox: ptr<function,RectificationBox>, colorSample: vec3<f32>, fSampleWeight: f32) {\r
    if bInitialSample {\r
        RectificationBoxAddInitialSample(rectificationBox, colorSample, fSampleWeight);\r
    } else {\r
        (*rectificationBox).aabbMin = min((*rectificationBox).aabbMin, colorSample);\r
        (*rectificationBox).aabbMax = max((*rectificationBox).aabbMax, colorSample);\r
\r
        let weightedSample: vec3<f32> = colorSample * fSampleWeight;\r
        (*rectificationBox).boxCenter += weightedSample;\r
        (*rectificationBox).boxVec += colorSample * weightedSample;\r
        (*rectificationBox).fBoxCenterWeight += fSampleWeight;\r
    }\r
}\r
\r
\r
\r
\r
fn ReconstructPrevDepth(iPxPos: vec2<i32>, fDepth: f32, fMotionVector: vec2<f32>, iPxDepthSize: vec2<i32>) -> bool {\r
    var _fMotionVector: vec2<f32> = vec2<f32>(0, 0);\r
    if length(fMotionVector * vec2<f32>(DisplaySize())) > 0.1 {\r
        _fMotionVector = fMotionVector;\r
    }\r
    let fUv: vec2<f32> = (vec2<f32>(iPxPos) + vec2<f32>(0.5, 0.5)) / vec2<f32>(iPxDepthSize);\r
    let fReprojectedUv: vec2<f32> = fUv - _fMotionVector;\r
\r
    let bilinearInfo: BilinearSamplingData = GetBilinearSamplingData(fReprojectedUv, RenderSize());\r
\r
    // Project current depth into previous frame locations.\r
    // Push to all pixels having some contribution if reprojection is using bilinear logic.\r
    for (var iSampleIndex = 0; iSampleIndex < 4; iSampleIndex += 1) {\r
\r
        let iOffset: vec2<i32> = bilinearInfo.iOffsets[iSampleIndex];\r
        let fWeight: f32 = bilinearInfo.fWeights[iSampleIndex];\r
\r
        if fWeight > fReconstructedDepthBilinearWeightThreshold {\r
\r
            let iStorePos: vec2<i32> = bilinearInfo.iBasePos + iOffset;\r
            if IsOnScreen(iStorePos, iPxDepthSize) {\r
                StoreReconstructedPreviousDepth(iStorePos, i32(fDepth));\r
                return true;\r
            }\r
        }\r
    }\r
    return false;\r
}\r
fn FindNearestDepth(iPxPos: vec2<i32>, iPxSize: vec2<i32>, fNearestDepth: ptr<function,f32>, fNearestDepthCoord: ptr<function,vec2<i32>>) {\r
    let iSampleCount: i32 = 9;\r
    var iSampleOffsets: array<vec2<i32>,9> = array<vec2<i32>,9>();\r
    iSampleOffsets[0] = vec2<i32>(0, 0);\r
    iSampleOffsets[1] = vec2<i32>(1, 0);\r
    iSampleOffsets[2] = vec2<i32>(0, 1);\r
    iSampleOffsets[3] = vec2<i32>(0, -1);\r
    iSampleOffsets[4] = vec2<i32>(-1, 0);\r
    iSampleOffsets[5] = vec2<i32>(-1, 1);\r
    iSampleOffsets[6] = vec2<i32>(1, 1);\r
    iSampleOffsets[7] = vec2<i32>(-1, -1);\r
    iSampleOffsets[8] = vec2<i32>(1, -1);\r
\r
\r
    // pull out the depth loads to allow SC to batch them\r
    var depth: array<f32,9>;\r
\r
    for (var iSampleIndex = 0; iSampleIndex < iSampleCount; iSampleIndex += 1) {\r
\r
        let iPos: vec2<i32> = iPxPos + iSampleOffsets[iSampleIndex];\r
        depth[iSampleIndex] = LoadInputDepth(iPos);\r
    }\r
\r
    // find closest depth\r
    *fNearestDepthCoord = iPxPos;\r
    *fNearestDepth = depth[0];\r
\r
    for (var iSampleIndex = 1; iSampleIndex < iSampleCount; iSampleIndex += 1) {\r
\r
        let iPos: vec2<i32> = iPxPos + iSampleOffsets[iSampleIndex];\r
        if IsOnScreen(iPos, iPxSize) {\r
\r
            let fNdDepth: f32 = depth[iSampleIndex];\r
\r
            if fNdDepth < *fNearestDepth {\r
                *fNearestDepthCoord = iPos;\r
                *fNearestDepth = fNdDepth;\r
            }\r
        }\r
    }\r
}\r
\r
fn FindPrevNearestDepth(iPxPos: vec2<i32>, iPxSize: vec2<i32>) {\r
    let iSampleCount: i32 = 9;\r
    var iSampleOffsets: array<vec2<i32>,9> = array<vec2<i32>,9>();\r
    iSampleOffsets[0] = vec2<i32>(0, 0);\r
    iSampleOffsets[1] = vec2<i32>(1, 0);\r
    iSampleOffsets[2] = vec2<i32>(0, 1);\r
    iSampleOffsets[3] = vec2<i32>(0, -1);\r
    iSampleOffsets[4] = vec2<i32>(-1, 0);\r
    iSampleOffsets[5] = vec2<i32>(-1, 1);\r
    iSampleOffsets[6] = vec2<i32>(1, 1);\r
    iSampleOffsets[7] = vec2<i32>(-1, -1);\r
    iSampleOffsets[8] = vec2<i32>(1, -1);\r
\r
\r
    // pull out the depth loads to allow SC to batch them\r
    var depth: array<f32,9>;\r
\r
    for (var iSampleIndex = 0; iSampleIndex < iSampleCount; iSampleIndex += 1) {\r
\r
        let iPos: vec2<i32> = iPxPos + iSampleOffsets[iSampleIndex];\r
        depth[iSampleIndex] = LoadInputDepth(iPos);\r
    }\r
\r
    // find closest depth\r
\r
    var fNearestDepth = depth[0];\r
\r
    for (var iSampleIndex = 1; iSampleIndex < iSampleCount; iSampleIndex += 1) {\r
\r
        let iPos: vec2<i32> = iPxPos + iSampleOffsets[iSampleIndex];\r
        if IsOnScreen(iPos, iPxSize) {\r
\r
            let fNdDepth: f32 = depth[iSampleIndex];\r
\r
            if fNdDepth < fNearestDepth {\r
                fNearestDepth = fNdDepth;\r
            }\r
        }\r
    }\r
    StoreReconstructedPreviousDepth(iPxPos, i32(fNearestDepth));\r
}\r
\r
fn ReconstructAndDilate(iPxLrPos: vec2<i32>) {\r
    var fDilatedDepth: f32 = 0;\r
    var iNearestDepthCoord: vec2<i32> = vec2<i32>(0, 0);\r
\r
    FindNearestDepth(iPxLrPos, RenderSize(), &fDilatedDepth, &iNearestDepthCoord);\r
\r
\r
    //var iSamplePos: vec2<i32> = ComputeHrPosFromLrPos(iPxLrPos);\r
    // var fSrcJitteredPos: vec2<f32> = vec2<f32>(iPxLrPos) + 0.5 - Jitter();\r
    // var fLrPosInHr: vec2<f32> = (fSrcJitteredPos / vec2<f32>(RenderSize())) * vec2<f32>(DisplaySize());\r
    // var iSamplePos: vec2<i32> = vec2<i32>(floor(fLrPosInHr));\r
    \r
    //var iMotionVectorPos: vec2<i32> = ComputeHrPosFromLrPos(iNearestDepthCoord);\r
    var fSrcJitteredPos = vec2<f32>(iNearestDepthCoord) + 0.5 - Jitter();\r
    ///fLrPosInHr = (fSrcJitteredPos / vec2<f32>(RenderSize())) * vec2<f32>(DisplaySize());\r
    var iMotionVectorPos: vec2<i32> = vec2<i32>(floor(fSrcJitteredPos));\r
\r
    var fDilatedMotionVector: vec2<f32> = LoadInputMotionVector(iMotionVectorPos);\r
\r
    StoreDilatedDepth(iPxLrPos, fDilatedDepth);\r
    StoreDilatedMotionVector(iPxLrPos, fDilatedMotionVector);\r
\r
    //let res: bool = ReconstructPrevDepth(iPxLrPos, fDilatedDepth, fDilatedMotionVector, RenderSize());\r
\r
    let fReprojectedPos: vec2<f32> = vec2<f32>(iPxLrPos) + vec2<f32>(0.5, 0.5) - fDilatedMotionVector * vec2<f32>(RenderSize());\r
\r
\r
    FindPrevNearestDepth(vec2<i32>(fReprojectedPos), RenderSize());\r
\r
    let fLockInputLuma: f32 = ComputeLockInputLuma(iPxLrPos);\r
    StoreLockInputLuma(iPxLrPos, fLockInputLuma);\r
\r
\r
    // var reconstructDilatedInfo: vec4<f32> = vec4<f32>(fDilatedDepth, fDilatedDepth, f32(pack2x16float(fDilatedMotionVector)), fLockInputLuma);\r
\r
    // // if res == false {\r
    // //     // let dilated_preDepth=LoadReconstructDilatedInfo(iPxLrPos).y\r
    // //     // if reconstructDilatedInfo.y <  dilated_preDepth{\r
    // //     //     reconstructDilatedInfo.y =  dilated_preDepth;\r
    // //     // }\r
    // //     reconstructDilatedInfo.y = LoadReconstructDilatedInfo(iPxLrPos).y;\r
    // // }\r
\r
\r
\r
\r
    // StoreReconstructDilatedInfo(iPxLrPos, reconstructDilatedInfo);\r
}\r
\r
\r
\r
@compute @workgroup_size(8, 8, 1)\r
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3u, @builtin(workgroup_id) WorkgroupID: vec3u, @builtin(local_invocation_id) LocalInvocationID: vec3u) {\r
    let origin_size: vec2<i32> = RenderSize();\r
    let pos: vec2<i32> = vec2<i32>(GlobalInvocationID.xy);\r
    if enCache {\r
        globalInvocationID = vec3<i32>(GlobalInvocationID);\r
        workgroupID = vec3<i32>(WorkgroupID);\r
        localInvocationID = vec3<i32>(LocalInvocationID);\r
        invokePreload(vec2i(GlobalInvocationID.xy), vec2i(LocalInvocationID.xy));\r
    }\r
    if !IsOnScreen(pos, origin_size) {\r
        return;\r
    }\r
    DisplaySize();\r
    // // linear depth\r
    // let depth = (textureSampleLevel(depthBuffer, samp, vec2<f32>(pos) / vec2<f32>(origin_size), 0) + 1.0) / 2.0;\r
    // // let depth = (textureLoad(depthBuffer, origin_pos, 0) + 1.0) / 2.0;\r
    let zlinear = zNear * zFar / (zFar + 0 * (zNear - zFar));\r
    // // textureStore(output, screen_pos, vec4<f32>(vec3<f32>(zlinear / 20.0), 1.0));\r
\r
    ReconstructAndDilate(pos);\r
}`,Ks=`\r
@group(0) @binding(0) var<uniform> sampJitter : vec2<f32>;\r
\r
@group(0) @binding(1) var samp : sampler;\r
//@group(0) @binding(2) var currentFrame : texture_2d<f32>;\r
@group(0) @binding(2) var<storage, read_write> currentFrame : array<vec2u>;\r
@group(0) @binding(3) var preparedInputColor : texture_storage_2d<rgba16float, write>;\r
@group(0) @binding(4) var vBuffer : texture_2d<u32>;\r
@group(0) @binding(5) var depthBuffer : texture_depth_2d;\r
@group(0) @binding(6) var dilatedDepth : texture_2d<f32>;\r
//@group(0) @binding(7) var reconstructedPreviousDepth : texture_depth_2d;\r
@group(0) @binding(7) var<storage, read_write>  reconstructedPreviousDepth : array<i32>;\r
@group(0) @binding(8) var dilatedMotionVectors : texture_2d<f32>;\r
@group(0) @binding(9) var previousDilatedMotionVectors : texture_2d<f32>;\r
@group(0) @binding(10) var dilatedReactiveMasks : texture_storage_2d<rgba16float, write>;\r
// @group(0) @binding(0) var VPMat: mat4x4f;\r
// @group(0) @binding(0) var lastVPMat: mat4x4f;\r
    \r
// #include <FSR_common.wgsl>;\r
\r
\r
\r
\r
\r
const BORDER: i32 = 1;\r
const SHARED_SIZE: i32 = BATCH_SIZE + BORDER * 2;\r
var<workgroup> sharedDilatedDepth: array<array<f32, SHARED_SIZE>, SHARED_SIZE>;\r
//var<workgroup> sharedMotionVec: array<array<vec2<f32>, SHARED_SIZE>, SHARED_SIZE>;\r
\r
var<private> globalInvocationID: vec3<i32> = vec3<i32>(0, 0, 0);\r
var<private> workgroupID: vec3<i32> = vec3<i32>(0, 0, 0);\r
var<private> localInvocationID: vec3<i32> = vec3<i32>(0, 0, 0);\r
fn preload(sharedPos: vec2i, globalPos: vec2i) {\r
    let globalId = clamp(globalPos, vec2i(0), vec2i(RenderSize()) - 1);\r
    let depthValue = (textureLoad(dilatedDepth, globalId, 0).x + 1.0) / 2.0;\r
    sharedDilatedDepth[sharedPos.y][sharedPos.x] = depthValue;\r
    // var visibility: vec4<u32> = textureLoad(vBuffer, globalId, 0);\r
    // let motionVec: vec2<f32> = unpack2x16float(visibility.x);\r
    //sharedMotionVec[sharedPos.y][sharedPos.x] = motionVec;\r
}   \r
fn slove_cache_idx(iPxPos: vec2<i32>) -> vec2<i32> {\r
    let group_base = globalInvocationID - localInvocationID - BORDER;\r
    let ipx_offset: vec2<i32> = iPxPos - group_base.xy;\r
    let offsets = ipx_offset.x + ipx_offset.y * SHARED_SIZE;\r
    let idx: vec2<i32> = vec2i(offsets % SHARED_SIZE, offsets / SHARED_SIZE);\r
    return idx;\r
}\r
\r
fn invokePreload(GlobalInvocationID: vec2i, LocalInvocationID: vec2i) {\r
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
}\r
\r
fn LoadInputMotionVector(iPxHrPos: vec2<i32>) -> vec2<f32> {\r
    var visibility: vec4<u32> = textureLoad(vBuffer, iPxHrPos, 0);\r
    let motionVec: vec2<f32> = unpack2x16float(visibility.x);\r
    return motionVec;\r
}\r
fn LoadInputColor(iPxPos: vec2<i32>) -> vec3<f32> {\r
    //return textureLoad(rawColor, iPxPos, 0).xyz;\r
    let idx: i32 = iPxPos.y * _renderWidth + iPxPos.x;\r
    let data = currentFrame[idx];\r
    let color: vec3<f32> = vec3f(unpack2x16float(data.x).xy, unpack2x16float(data.y).x);\r
\r
    return color;\r
}\r
fn LoadInputDepth(iPxPos: vec2<i32>) -> f32 {\r
    //return textureLoad(depthBuffer, iPxPos, 0);\r
    return (textureLoad(depthBuffer, iPxPos, 0) + 1.0) / 2.0;\r
}\r
fn LoadDilatedDepth(iPxPos: vec2<i32>) -> f32 {\r
    //return textureLoad(dilatedDepth, iPxPos, 0).x;\r
    if enCache {\r
        let sharedPos = slove_cache_idx(iPxPos);\r
        return sharedDilatedDepth[sharedPos.y][sharedPos.x] ;\r
    }\r
\r
    return (textureLoad(dilatedDepth, iPxPos, 0).x + 1.0) / 2.0;\r
}\r
fn LoadReconstructedPreviousDepth(iPxPos: vec2<i32>) -> f32 {\r
    //return textureLoad(reconstructedPreviousDepth, iPxPos, 0).x;\r
    //return textureLoad(reconstructedPreviousDepth, iPxPos, 0).x;\r
    //return (textureLoad(reconstructedPreviousDepth, iPxPos, 0) + 1.0) / 2.0;\r
    var idx = u32(iPxPos.x) * u32(RenderSize().x) + u32(iPxPos.y);\r
    return f32(reconstructedPreviousDepth[idx]);\r
\r
    // var atomic_ptr:\r
    // atomicMin(atomic_ptr: ptr<SC, atomic<T>, A>, v: T) -> T\r
}\r
\r
fn LoadDilatedMotionVector(iPxPos: vec2<i32>) -> vec2<f32> {\r
    // var dilatedMotionVec: u32 = textureLoad(dilatedMotionVectors, iPxPos, 0);\r
    // let motionVec: vec2<f32> = unpack2x16float(dilatedMotionVec).x;\r
    let motionVec: vec2<f32> = textureLoad(dilatedMotionVectors, iPxPos, 0).xy;\r
    return motionVec;\r
}\r
\r
fn SamplePreviousDilatedMotionVector(fUv: vec2<f32>) -> vec2<f32> {\r
    return textureSampleLevel(previousDilatedMotionVectors, samp, fUv, 0).xy;\r
    //return textureLoad(previousDilatedMotionVectors, vec2<i32>(round(fUv * vec2<f32>(RenderSize()))), 0).xy;\r
}\r
\r
\r
fn StorePreparedInputColor(iPxPos: vec2<i32>, fpreparedInputColor: vec4<f32>) {\r
    textureStore(preparedInputColor, iPxPos, fpreparedInputColor);\r
}\r
\r
fn StoreDilatedReactiveMask(iPxPos: vec2<i32>, fdilatedReactiveMask: vec2<f32>) {\r
    textureStore(dilatedReactiveMasks, iPxPos, vec4<f32>(fdilatedReactiveMask, 0, 0));\r
}\r
fn LoadReactiveMask(iPxPos: vec2<i32>) -> f32 {\r
    //return textureLoad(reactiveMasks, iPxPos, 0).x;\r
    return 0.0;\r
}\r
fn LoadTransparencyAndCompositionMask(iPxPos: vec2<i32>) -> f32 {\r
    //return textureLoad(transparencyAndCompositionMasks, iPxPos, 0).x;\r
    return 0.0;\r
}\r
\r
\r
\r
\r
\r
\r
fn ComputeDepthClip(fUvSample: vec2<f32>, fCurrentDepthSample: f32) -> f32 {\r
\r
    let fCurrentDepthViewSpace: f32 = GetViewSpaceDepth(fCurrentDepthSample);\r
    let bilinearInfo: BilinearSamplingData = GetBilinearSamplingData(fUvSample, RenderSize());\r
\r
    var fDilatedSum: f32 = 0.0;\r
    var fDepth: f32 = 0.0;\r
    var fWeightSum: f32 = 0.0;\r
    var flag: f32 = 0;\r
    for (var iSampleIndex: i32 = 0; iSampleIndex < 4; iSampleIndex += 1) {\r
\r
        let  iOffset: vec2<i32> = bilinearInfo.iOffsets[iSampleIndex];\r
        let  iSamplePos: vec2<i32> = bilinearInfo.iBasePos + iOffset;\r
\r
        if IsOnScreen(iSamplePos, RenderSize()) {\r
            let  fWeight: f32 = bilinearInfo.fWeights[iSampleIndex];\r
            if fWeight > fReletructedDepthBilinearWeightThreshold {\r
\r
                let  fPrevDepthSample: f32 = LoadReconstructedPreviousDepth(iSamplePos);//LoadReletructedPrevDepth\r
                let  fPrevNearestDepthViewSpace: f32 = GetViewSpaceDepth(fPrevDepthSample);\r
\r
                var fDepthDiff: f32 = fCurrentDepthViewSpace - fPrevNearestDepthViewSpace;\r
                //fDepthDiff=abs(fDepthDiff);\r
                if fDepthDiff > 0.0 {\r
                    let fPlaneDepth: f32 = max(fPrevDepthSample, fCurrentDepthSample);\r
\r
                    let fCenter: vec3<f32> = GetViewSpacePosition(vec2<i32>(vec2<f32>(RenderSize()) * 0.5), RenderSize(), fPlaneDepth);\r
                    let fCorner: vec3<f32> = GetViewSpacePosition(vec2<i32>(0, 0), RenderSize(), fPlaneDepth);\r
\r
                    let fHalfViewportWidth: f32 = length(vec2<f32>(RenderSize()));\r
                    let fDepthThreshold: f32 = max(fCurrentDepthViewSpace, fPrevNearestDepthViewSpace);\r
\r
                    let Ksep: f32 = 1.37e-05;\r
                    let Kfov: f32 = length(fCorner) / length(fCenter);\r
                    let fRequiredDepthSeparation: f32 = Ksep * Kfov * fHalfViewportWidth * fDepthThreshold;\r
\r
                    let fResolutionFactor: f32 = Saturate(length(vec2<f32>(RenderSize())) / length(vec2<f32>(1920.0, 1080.0)));\r
                    let fPower: f32 = mix(1.0, 3.0, fResolutionFactor);\r
                    fDepth += pow(Saturate(f32(fRequiredDepthSeparation / fDepthDiff)), fPower) * fWeight;\r
                    fWeightSum += fWeight;\r
                    flag += 0.25;\r
                    fDepth = fDepthDiff / 2;\r
                }\r
            }\r
        }\r
    }\r
    if fWeightSum > 0 {\r
        return Saturate(1.0 - fDepth / fWeightSum);\r
        //return Saturate(fDepthDiff * 20);\r
    }\r
\r
    return 0;\r
}\r
fn ComputeMotionDivergence(iPxPos: vec2<i32>, iPxInputMotionVectorSize: vec2<i32>) -> f32 {\r
    var minconvergence: f32 = 1.0;\r
\r
    let fMotionVectorNucleus: vec2<f32> = LoadInputMotionVector(iPxPos);\r
    let fNucleusVelocityLr: f32 = length(fMotionVectorNucleus * vec2<f32>(RenderSize()));\r
    var fMaxVelocityUv: f32 = length(fMotionVectorNucleus);\r
\r
    let MotionVectorVelocityEpsilon: f32 = 1e-02;\r
\r
    if fNucleusVelocityLr > MotionVectorVelocityEpsilon {\r
        for (var y = -1; y <= 1; y += 1) {\r
            for (var x = -1; x <= 1; x += 1) {\r
\r
                let sp: vec2<i32> = ClampLoad(iPxPos, vec2<i32>(x, y), iPxInputMotionVectorSize);\r
\r
                let fMotionVector: vec2<f32> = LoadInputMotionVector(sp);\r
                var fVelocityUv: f32 = length(fMotionVector);\r
\r
                fMaxVelocityUv = max(fVelocityUv, fMaxVelocityUv);\r
                fVelocityUv = max(fVelocityUv, fMaxVelocityUv);\r
                minconvergence = min(minconvergence, dot(fMotionVector / fVelocityUv, fMotionVectorNucleus / fVelocityUv));\r
            }\r
        }\r
    }\r
\r
    return Saturate(1.0 - minconvergence) * Saturate(fMaxVelocityUv / 0.01);\r
}\r
fn ComputeDepthDivergence(iPxPos: vec2<i32>) -> f32 {\r
    let fMaxDistInMeters: f32 = GetMaxDistanceInMeters();\r
    var fDepthMax: f32 = 0.0;\r
    var fDepthMin: f32 = fMaxDistInMeters;\r
\r
    var iMaxDistFound: i32 = 0;\r
\r
    for (var y = -1; y < 2; y += 1) {\r
        for (var x = -1; x < 2; x += 1) {\r
\r
            let iOffset: vec2<i32> = vec2<i32>(x, y);\r
            let iSamplePos: vec2<i32> = iPxPos + iOffset;\r
\r
            let fOnScreenFactor: f32 = f32(IsOnScreen(iSamplePos, RenderSize()));\r
\r
            let fDepth: f32 = GetViewSpaceDepthInMeters(LoadDilatedDepth(iSamplePos)) * fOnScreenFactor;\r
\r
            iMaxDistFound |= i32(fMaxDistInMeters == fDepth);\r
\r
            fDepthMin = min(fDepthMin, fDepth);\r
            fDepthMax = max(fDepthMax, fDepth);\r
        }\r
    }\r
\r
    if bool(iMaxDistFound) == false {\r
        return (1.0 - fDepthMin / fDepthMax);\r
    } else {\r
        return 0;\r
    }\r
}\r
\r
fn ComputeTemporalMotionDivergence(iPxPos: vec2<i32>) -> f32 {\r
    let  fUv: vec2<f32> = vec2<f32>(vec2<f32>(iPxPos) + vec2<f32>(0.5, 0.5)) / vec2<f32>(RenderSize());\r
\r
    let fMotionVector: vec2<f32> = LoadDilatedMotionVector(iPxPos);\r
    var fReprojectedUv: vec2<f32> = fUv - fMotionVector;\r
    fReprojectedUv = ClampUv(fReprojectedUv, RenderSize(), MaxRenderSize());\r
    let fPrevMotionVector: vec2<f32> = SamplePreviousDilatedMotionVector(fReprojectedUv);\r
\r
    let fPxDistance: f32 = length(fMotionVector * vec2<f32>(RenderSize()));\r
\r
    if fPxDistance > 1.0 {\r
        return mix(0.0, 1.0 - Saturate(length(fPrevMotionVector) / length(fMotionVector)), Saturate(pow(fPxDistance / 20.0, 3.0)));\r
    } else {\r
        return 0;\r
    }\r
}\r
fn ComputePreparedInputColor(iPxLrPos: vec2<i32>) -> vec3<f32> {\r
    // We assume linear data. if non-linear input (sRGB, ...),\r
    // then we should convert to linear first and back to sRGB on output.\r
    var fRgb: vec3<f32> = max(vec3<f32>(0, 0, 0), LoadInputColor(iPxLrPos));\r
\r
    fRgb = PrepareRgb(fRgb, Exposure(), PreExposure());\r
\r
    let fPreparedYCoCg: vec3<f32> = RGBToYCoCg(fRgb);\r
\r
    return fPreparedYCoCg;\r
}\r
fn PreProcessReactiveMasks(iPxLrPos: vec2<i32>, fMotionDivergence: f32) {\r
    // Compensate for bilinear sampling in accumulation pass\r
    let fReferenceColor: vec3<f32> = LoadInputColor(iPxLrPos).xyz;\r
    var fReactiveFactor: vec2<f32> = vec2<f32>(0.0, fMotionDivergence);\r
\r
    var fMasksSum: f32 = 0.0;\r
\r
    var fColorSamples: array<vec3<f32>,9> = array<vec3<f32>,9>();\r
    var fReactiveSamples: array<f32,9> = array<f32,9>();\r
    var fTransparencyAndCompositionSamples: array<f32,9> = array<f32,9>();\r
\r
    // for (var  y = -1; y < 2; y += 1) {\r
    //     for (var  x = -1; x < 2; x += 1) {\r
\r
    //         let  sampleCoord: vec2<i32> = ClampLoad(iPxLrPos, vec2<i32>(x, y), vec2<i32>(RenderSize()));\r
\r
    //         var  sampleIdx = (y + 1) * 3 + x + 1;\r
\r
    //         let fColorSample: vec3<f32> = LoadInputColor(sampleCoord).xyz;\r
    //         let fReactiveSample: f32 = LoadReactiveMask(sampleCoord);\r
    //         let fTransparencyAndCompositionSample: f32 = LoadTransparencyAndCompositionMask(sampleCoord);\r
\r
    //         fColorSamples[sampleIdx] = fColorSample;\r
    //         fReactiveSamples[sampleIdx] = fReactiveSample;\r
    //         fTransparencyAndCompositionSamples[sampleIdx] = fTransparencyAndCompositionSample;\r
\r
    //         fMasksSum += (fReactiveSample + fTransparencyAndCompositionSample);\r
    //     }\r
    // }\r
    // if fMasksSum > 0 {\r
    //     for (var sampleIdx = 0; sampleIdx < 9; sampleIdx += 1) {\r
    //         let fColorSample: vec3<f32> = fColorSamples[sampleIdx];\r
    //         let fReactiveSample = fReactiveSamples[sampleIdx];\r
    //         let fTransparencyAndCompositionSample = fTransparencyAndCompositionSamples[sampleIdx];\r
\r
    //         let  fMaxLenSq: f32 = max(dot(fReferenceColor, fReferenceColor), dot(fColorSample, fColorSample));\r
    //         let  fSimilarity: f32 = dot(fReferenceColor, fColorSample) / fMaxLenSq;\r
\r
    //         // Increase power for non-similar samples\r
    //         let fPowerBiasMax: f32 = 6.0;\r
    //         let fSimilarityPower: f32 = 1.0 + (fPowerBiasMax - fSimilarity * fPowerBiasMax);\r
    //         let fWeightedReactiveSample: f32 = pow(fReactiveSample, fSimilarityPower);\r
    //         let fWeightedTransparencyAndCompositionSample: f32 = pow(fTransparencyAndCompositionSample, fSimilarityPower);\r
\r
    //         fReactiveFactor = max(fReactiveFactor, vec2<f32>(fWeightedReactiveSample, fWeightedTransparencyAndCompositionSample));\r
    //     }\r
    // }\r
\r
    StoreDilatedReactiveMask(iPxLrPos, fReactiveFactor);\r
}\r
\r
\r
\r
fn EvaluateSurface(iPxPos: vec2<i32>, fMotionVector: vec2<f32>) -> f32 {\r
    // let d0: f32 = GetViewSpaceDepth(LoadReconstructedPreviousDepth(iPxPos + vec2<i32>(0, -1)));\r
    // let d1: f32 = GetViewSpaceDepth(LoadReconstructedPreviousDepth(iPxPos + vec2<i32>(0, 0)));\r
    // let d2: f32 = GetViewSpaceDepth(LoadReconstructedPreviousDepth(iPxPos + vec2<i32>(0, 1)));\r
    let d0: f32 = GetViewSpaceDepth(LoadReconstructedPreviousDepth(vec2<i32>(floor((vec2<f32>(iPxPos) + 0.5) - fMotionVector)) + vec2<i32>(0, -1)));\r
    let d1: f32 = GetViewSpaceDepth(LoadReconstructedPreviousDepth(vec2<i32>(((vec2<f32>(iPxPos) + 0.5) - fMotionVector)) + vec2<i32>(0, 0)));\r
    let d2: f32 = GetViewSpaceDepth(LoadReconstructedPreviousDepth(vec2<i32>(((vec2<f32>(iPxPos) + 0.5) - fMotionVector)) + vec2<i32>(0, 1)));\r
\r
    return 1.0 - f32(((d0 - d1) > (d1 * 0.01)) && ((d1 - d2) > (d2 * 0.01)));\r
}\r
\r
fn DepthClip(iPxPos: vec2<i32>) {\r
    let fDepthUv: vec2<f32> = (vec2<f32>(iPxPos) + 0.5) / vec2<f32>(RenderSize());\r
    var fMotionVector: vec2<f32> = LoadDilatedMotionVector(iPxPos);\r
\r
    // Discard tiny mvs\r
    fMotionVector *= f32(length(fMotionVector * vec2<f32>(RenderSize())) > 0.01);\r
\r
    let fDilatedUv: vec2<f32> = fDepthUv - fMotionVector; ///doubtful\r
    let fDilatedDepth: f32 = LoadDilatedDepth(iPxPos);\r
    //let fDilatedDepth: f32 = LoadInputDepth(iPxPos);\r
    let fCurrentDepthViewSpace: f32 = GetViewSpaceDepth(LoadInputDepth(iPxPos));\r
\r
    // Compute prepared input color and depth clip\r
    let fDepthClip: f32 = ComputeDepthClip(fDilatedUv, fDilatedDepth) * EvaluateSurface(iPxPos, (fMotionVector * vec2<f32>(RenderSize())));\r
    let fPreparedYCoCg: vec3<f32> = ComputePreparedInputColor(iPxPos);\r
    StorePreparedInputColor(iPxPos, vec4<f32>(fPreparedYCoCg, fDepthClip));\r
    //StorePreparedInputColor(iPxPos, vec4<f32>(fPreparedYCoCg, 0));\r
\r
    // Compute dilated reactive mask\r
\r
    //let iSamplePos: vec2<i32> = ComputeHrPosFromLrPos(iPxPos); 有高分辨率motion vec时启用\r
    let iSamplePos: vec2<i32> = iPxPos;\r
\r
    let fMotionDivergence: f32 = ComputeMotionDivergence(iSamplePos, RenderSize());\r
    let fTemporalMotionDifference: f32 = Saturate(ComputeTemporalMotionDivergence(iPxPos) - ComputeDepthDivergence(iPxPos));\r
\r
    PreProcessReactiveMasks(iPxPos, max(fTemporalMotionDifference, fMotionDivergence));\r
}\r
\r
\r
@compute @workgroup_size(8, 8, 1)\r
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3u, @builtin(workgroup_id) WorkgroupID: vec3u, @builtin(local_invocation_id) LocalInvocationID: vec3u) {\r
    let origin_size: vec2<i32> = RenderSize();\r
    let pos: vec2<i32> = vec2<i32>(GlobalInvocationID.xy);\r
\r
    if enCache {\r
        globalInvocationID = vec3<i32>(GlobalInvocationID);\r
        workgroupID = vec3<i32>(WorkgroupID);\r
        localInvocationID = vec3<i32>(LocalInvocationID);\r
        invokePreload(vec2i(GlobalInvocationID.xy), vec2i(LocalInvocationID.xy));\r
    }\r
    if !IsOnScreen(pos, origin_size) {\r
        let zlinear = zNear * zFar / (zFar + 0 * (zNear - zFar));\r
        return;\r
    }\r
    // linear depth\r
    // let depth = (textureSampleLevel(depthBuffer, samp, vec2<f32>(pos) / vec2<f32>(origin_size), 0) + 1.0) / 2.0;\r
    // // let depth = (textureLoad(depthBuffer, origin_pos, 0) + 1.0) / 2.0;\r
    // let zlinear = zNear * zFar / (zFar + depth * (zNear - zFar));\r
    // // textureStore(output, screen_pos, vec4<f32>(vec3<f32>(zlinear / 20.0), 1.0));\r
\r
    DepthClip(pos);\r
}`,Js=`\r
@group(0) @binding(0) var<uniform> sampJitter : vec2<f32>;\r
@group(0) @binding(1) var samp : sampler;\r
//@group(0) @binding(2) var currentFrame : texture_2d<f32>;\r
@group(0) @binding(2) var<storage, read_write> currentFrame : array<vec2u>;\r
@group(0) @binding(3) var lockInputLuma : texture_2d<f32>;\r
//@group(0) @binding(4) var reconstructedPreviousDepth : texture_storage_2d<r32float, write>;\r
@group(0) @binding(4) var<storage, read_write>  reconstructedPreviousDepth : array<i32>;\r
@group(0) @binding(5) var newLocks : texture_storage_2d<r32float, write>;\r
\r
\r
\r
\r
// #include <FSR_common.wgsl>;\r
const BORDER: i32 = 1;\r
const SHARED_SIZE: i32 = BATCH_SIZE + BORDER * 2;\r
var<workgroup> sharedInputLockLuma: array<array<f32, SHARED_SIZE>, SHARED_SIZE>;\r
//var<workgroup> sharedMotionVec: array<array<vec2<f32>, SHARED_SIZE>, SHARED_SIZE>;\r
\r
var<private> globalInvocationID: vec3<i32> = vec3<i32>(0, 0, 0);\r
var<private> workgroupID: vec3<i32> = vec3<i32>(0, 0, 0);\r
var<private> localInvocationID: vec3<i32> = vec3<i32>(0, 0, 0);\r
fn preload(sharedPos: vec2i, globalPos: vec2i) {\r
    let globalId = clamp(globalPos, vec2i(0), vec2i(RenderSize()) - 1);\r
    let lumaValue = textureLoad(lockInputLuma, globalId, 0);\r
    sharedInputLockLuma[sharedPos.y][sharedPos.x] = lumaValue.x;\r
    // var visibility: vec4<u32> = textureLoad(vBuffer, globalId, 0);\r
    // let motionVec: vec2<f32> = unpack2x16float(visibility.x);\r
    //sharedMotionVec[sharedPos.y][sharedPos.x] = motionVec;\r
}   \r
fn slove_cache_idx(iPxPos: vec2<i32>) -> vec2<i32> {\r
    let group_base = globalInvocationID - localInvocationID - BORDER;\r
    let ipx_offset: vec2<i32> = iPxPos - group_base.xy;\r
    let offsets = ipx_offset.x + ipx_offset.y * SHARED_SIZE;\r
    let idx: vec2<i32> = vec2i(offsets % SHARED_SIZE, offsets / SHARED_SIZE);\r
    return idx;\r
}\r
\r
fn invokePreload(GlobalInvocationID: vec2i, LocalInvocationID: vec2i) {\r
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
}\r
\r
fn LoadLockInputLuma(iPxPos: vec2<i32>) -> f32 {\r
    if enCache {\r
        let sharedPos = slove_cache_idx(iPxPos);\r
        return sharedInputLockLuma[sharedPos.y][sharedPos.x] ;\r
    }\r
    return textureLoad(lockInputLuma, iPxPos, 0).x;\r
}\r
\r
fn StoreNewLocks(iPxPos: vec2<i32>, fnewLock: f32) {\r
    textureStore(newLocks, iPxPos, vec4<f32>(fnewLock, 0, 0, 0));\r
}\r
fn StoreReconstructedPreviousDepth(iPxPos: vec2<i32>, fDilatedDepth: i32) {\r
    //textureStore(reconstructedPreviousDepth, iPxPos, vec4<f32>(fDilatedDepth, 0, 0, 0));\\\r
    var idx = u32(iPxPos.x) * u32(RenderSize().x) + u32(iPxPos.y);\r
    //atomicStore(&reconstructedPreviousDepth[idx], fDilatedDepth);\r
    reconstructedPreviousDepth[idx] = fDilatedDepth;\r
    // var atomic_ptr:\r
    // atomicMin(atomic_ptr: ptr<SC, atomic<T>, A>, v: T) -> T\r
}\r
\r
fn ClearResourcesForNextFrame(iPxHrPos: vec2<i32>) {\r
    if IsOnScreen(iPxHrPos, RenderSize()) {\r
        // #if FSR2_OPTION_INVERTED_DEPTH\r
        //         let UInt32 farZ = 0x0;\r
        // #else\r
        let farZ: u32 = 0x3f800000;\r
        StoreReconstructedPreviousDepth(iPxHrPos, i32(farZ));\r
    }\r
}\r
fn ComputeThinFeatureConfidence(pos: vec2<i32>) -> bool {\r
    let RADIUS: i32 = 1;\r
\r
    var fNucleus: f32 = LoadLockInputLuma(pos);\r
\r
    let similar_threshold: f32 = 1.05;\r
    var dissimilarLumaMin: f32 = FLT_MAX;\r
    var dissimilarLumaMax: f32 = 0;\r
    //  0 1 2\r
    //  3 4 5\r
    //  6 7 8\r
    var mask: u32 = 16; //flag fNucleus as similar\r
\r
//     let uNumRejectionMasks = 4;\r
//     let uRejectionMasks[uNumRejectionMasks]: = {\r
//     1 << 0 | 1 << 1 | 1 << 3 | 1 << 4, //Upper left\r
//     1 << 1 | 1 << 2 | 1 << 4 | 1 << 5, //Upper right\r
//     1 << 3 | 1 << 4 | 1 << 6 | 1 << 7, //Lower left\r
//     1 << 4 | 1 << 5 | 1 << 7 | 1 << 8, //Lower right\r
// };\r
\r
    let uNumRejectionMasks = 4;\r
    // let uRejectionMasks: array<u32,4> = array<u32,4>(\r
    //     1 + 2 + 8 + 16, //Upper left\r
    //     2 + 4 + 16 + 32, //Upper right\r
    //     8 + 16 + 64 + 128, //Lower left\r
    //     16 + 32 + 128 + 256, //Lower right\r
    // );\r
\r
    let uRejectionMasks: array<u32,4> = array<u32,4>(\r
        (1 << 0) | (1 << 1) | (1 << 3) | (1 << 4), //Upper left\r
        (1 << 1) | (1 << 2) | (1 << 4) | (1 << 5), //Upper right\r
        (1 << 3) | (1 << 4) | (1 << 6) | (1 << 7), //Lower left\r
        (1 << 4) | (1 << 5) | (1 << 7) | (1 << 8), //Lower right\r
    );\r
\r
    var idx: i32 = -1;\r
\r
    for (var y = -RADIUS; y <= RADIUS; y += 1) {\r
        for (var x = -RADIUS; x <= RADIUS; x += 1) {\r
            idx += 1;\r
            if x == 0 && y == 0 {\r
                continue;\r
            }\r
\r
            let samplePos: vec2<i32> = ClampLoad(pos, vec2<i32>(x, y), vec2<i32>(RenderSize()));\r
\r
            let sampleLuma: f32 = LoadLockInputLuma(samplePos);\r
            let difference: f32 = max(sampleLuma, fNucleus) / min(sampleLuma, fNucleus);\r
\r
            if difference > 0 && (difference < similar_threshold) {\r
                mask |= u32(pow(2, f32(idx)));//1 << idx\r
            } else {\r
                dissimilarLumaMin = min(dissimilarLumaMin, sampleLuma);\r
                dissimilarLumaMax = max(dissimilarLumaMax, sampleLuma);\r
            }\r
        }\r
    }\r
\r
    let isRidge: bool = fNucleus > dissimilarLumaMax || fNucleus < dissimilarLumaMin;\r
\r
    if false == isRidge {\r
        return false;\r
    }\r
\r
\r
    for (var i = 0; i < 4; i++) {\r
        if (mask & uRejectionMasks[i]) == uRejectionMasks[i] {\r
            return false;\r
        }\r
    }\r
    return true;\r
}\r
\r
\r
fn ComputeLock(iPxLrPos: vec2<i32>) {\r
    if ComputeThinFeatureConfidence(iPxLrPos) {\r
        StoreNewLocks(ComputeHrPosFromLrPos(iPxLrPos), 1);\r
    }\r
\r
    ClearResourcesForNextFrame(iPxLrPos);\r
}\r
    \r
    \r
\r
@compute @workgroup_size(8, 8, 1)\r
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3u, @builtin(workgroup_id) WorkgroupID: vec3u, @builtin(local_invocation_id) LocalInvocationID: vec3u) {\r
    let origin_size: vec2<i32> = RenderSize();\r
    let pos: vec2<i32> = vec2<i32>(GlobalInvocationID.xy);\r
    if enCache {\r
        globalInvocationID = vec3<i32>(GlobalInvocationID);\r
        workgroupID = vec3<i32>(WorkgroupID);\r
        localInvocationID = vec3<i32>(LocalInvocationID);\r
        invokePreload(vec2i(GlobalInvocationID.xy), vec2i(LocalInvocationID.xy));\r
    }\r
    if !IsOnScreen(pos, origin_size) {\r
        let zlinear = zNear * zFar / (zFar + 0 * (zNear - zFar));\r
        return;\r
    }\r
\r
    ComputeLock(pos);\r
}`,Qs=`\r
\r
@group(0) @binding(0) var<uniform> sampJitter : vec2<f32>;\r
@group(0) @binding(1) var samp : sampler;\r
//@group(0) @binding(2) var currentDisplay : texture_storage_2d<displayFormat, write>;\r
@group(0) @binding(2) var currentDisplay : texture_storage_2d<rgba16float, write>;\r
@group(0) @binding(3) var rPreviousDisplay: texture_2d<f32>;\r
@group(0) @binding(4) var wPreviousDisplay: texture_storage_2d<rgba16float, write>;\r
@group(0) @binding(5) var vBuffer : texture_2d<u32>;\r
//@group(0) @binding(6) var currentFrame : texture_2d<f32>;\r
@group(0) @binding(6) var <storage, read_write> currentFrame : array<vec2<u32>>;\r
@group(0) @binding(7) var preparedInputColor: texture_2d<f32>;\r
//@group(0) @binding(7) var preparedInputColor: texture_storage_2d<rgba16float, read>;\r
@group(0) @binding(8) var dilatedReactiveMasks: texture_2d<f32>;\r
@group(0) @binding(9) var  newLocks: texture_storage_2d<r32float, read_write>;\r
@group(0) @binding(10) var lockStatus: texture_storage_2d<r32float, read_write>;\r
\r
@group(0) @binding(11) var <storage, read_write> luma_history : array<vec4<f32>>;\r
\r
\r
\r
\r
\r
\r
\r
// #include <FSR_common.wgsl>;\r
\r
const BORDER: i32 = 1;\r
const SHARED_SIZE: i32 = BATCH_SIZE + BORDER * 2;\r
var<workgroup> sharedPreparedColor: array<array<vec4<f32>, SHARED_SIZE>, SHARED_SIZE>;\r
//var<workgroup> sharedMotionVec: array<array<vec2<f32>, SHARED_SIZE>, SHARED_SIZE>;\r
\r
var<private> globalInvocationID: vec3<i32> = vec3<i32>(0, 0, 0);\r
var<private> workgroupID: vec3<i32> = vec3<i32>(0, 0, 0);\r
var<private> localInvocationID: vec3<i32> = vec3<i32>(0, 0, 0);\r
fn preload(sharedPos: vec2i, globalPos: vec2i) {\r
    //var globalId = vec2<i32>(vec2<f32>(globalPos) * DownscaleFactor());\r
\r
    var globalId = clamp(globalPos, vec2i(0), vec2i(RenderSize()) - 1);\r
    let colorValue = textureLoad(preparedInputColor, globalId, 0);\r
    sharedPreparedColor[sharedPos.y][sharedPos.x] = colorValue;\r
    // var visibility: vec4<u32> = textureLoad(vBuffer, globalId, 0);\r
    // let motionVec: vec2<f32> = unpack2x16float(visibility.x);\r
    //sharedMotionVec[sharedPos.y][sharedPos.x] = motionVec;\r
}   \r
fn slove_cache_idx(iPxPos: vec2<i32>) -> vec2<i32> {\r
    let group_base = vec2<i32>(vec2<f32>(globalInvocationID.xy - localInvocationID.xy) * DownscaleFactor()) - BORDER;\r
    let ipx_offset = iPxPos - group_base;\r
    let real_shared_size = i32(ceil(f32(BATCH_SIZE) * DownscaleFactor().x)) + BORDER * 2;\r
    let offsets = ipx_offset.x + ipx_offset.y * real_shared_size;\r
    let idx: vec2<i32> = vec2i(offsets % real_shared_size, offsets / real_shared_size);\r
    return idx;\r
}\r
\r
fn invokePreload(GlobalInvocationID: vec2i, LocalInvocationID: vec2i) {\r
    let real_shared_size = i32(ceil(f32(BATCH_SIZE) * DownscaleFactor().x)) + BORDER * 2;\r
    let group_base = vec2<i32>(vec2<f32>(GlobalInvocationID - LocalInvocationID) * DownscaleFactor()) - BORDER;\r
    let stage_num = (real_shared_size * real_shared_size + BATCH_SIZE * BATCH_SIZE - 1) / (BATCH_SIZE * BATCH_SIZE);\r
    for (var i: i32 = 0; i < stage_num; i = i + 1) {\r
        let threadIdx: i32 = LocalInvocationID.y * BATCH_SIZE + LocalInvocationID.x;\r
        let virtualIdx: i32 = threadIdx + i * BATCH_SIZE * BATCH_SIZE;\r
        let loadIdx = vec2i(virtualIdx % real_shared_size, virtualIdx / real_shared_size);\r
        if i == 0 || virtualIdx < real_shared_size * real_shared_size {\r
            preload(loadIdx, group_base + loadIdx);\r
        }\r
    }\r
    workgroupBarrier();\r
}\r
\r
fn SampleMipLuma(fUv: vec2<f32>) -> f32 {\r
    let iPxPos: vec2<i32> = vec2<i32>(round(fUv * vec2<f32>(RenderSize())));\r
    //let color = textureSampleLevel(currentFrame, samp, fUv, 0).xyz;\r
    let color = LoadInputColor(iPxPos);\r
    //return color;\r
    return 0.299 * color.x + 0.587 * color.y + 0.114 * color.z;\r
}\r
fn SampleLumaHistory(fUv: vec2<f32>) -> vec4<f32> {\r
    let iPxSample: vec2<i32> = vec2<i32>((fUv * vec2<f32>(DisplaySize())));\r
    //let color = textureSampleLevel(currentFrame, samp, fUv, 0).xyz;\r
    //let color = textureLod(sampler2D(r_luma_history, s_LinearClamp), fUV, 0.0);\r
    let idx = iPxSample.x * DisplaySize().y + iPxSample.y;\r
    //let color = textureLoad(luma_history, iPxSample, 0);\r
    let color = luma_history[idx];\r
    //return color;\r
    return color;\r
}\r
fn StoreLumaHistory(iPxPos: vec2<i32>, fhistoryLuma: vec4<f32>) {\r
    let idx = iPxPos.x * DisplaySize().y + iPxPos.y;\r
    luma_history[idx] = fhistoryLuma;\r
}\r
fn LoadInputMotionVector(iPxHrPos: vec2<i32>) -> vec2<f32> {\r
    var visibility: vec4<u32> = textureLoad(vBuffer, iPxHrPos, 0);\r
    let motionVec: vec2<f32> = unpack2x16float(visibility.x);\r
    //return vec2<f32>(0,0);\r
    return motionVec;\r
}\r
// fn LoadInputColor(iPxPos: vec2<i32>) -> vec3<f32> {\r
//     return textureLoad(currentFrame, iPxPos, 0).xyz;\r
// }\r
fn LoadInputColor(iPxPos: vec2<i32>) -> vec3<f32> {\r
    //return textureLoad(rawColor, iPxPos, 0).xyz;\r
    let idx: i32 = iPxPos.y * _renderWidth + iPxPos.x;\r
    let data = currentFrame[idx];\r
    let color: vec3<f32> = vec3f(unpack2x16float(data.x).xy, unpack2x16float(data.y).x);\r
\r
    return color;\r
}\r
fn LoadPreparedInputColor(iPxPos: vec2<i32>) -> vec4<f32> {\r
    if enCache {\r
        let sharedPos = slove_cache_idx(iPxPos);\r
        return sharedPreparedColor[sharedPos.y][sharedPos.x] ;\r
    }\r
    return textureLoad(preparedInputColor, iPxPos, 0);\r
}\r
fn SamplePreparedInputColor(fUv: vec2<f32>) -> vec4<f32> {\r
    //return textureLoad(preparedInputColor, vec2<i32>(round(fUv * vec2<f32>(RenderSize()))), 0);\r
    return textureSampleLevel(preparedInputColor, samp, fUv, 0);\r
    //return textureSample(preparedInputColor, samp, fUv);\r
}\r
fn SampleDilatedReactiveMasks(fUv: vec2<f32>) -> vec2<f32> {\r
    //return textureLoad(dilatedReactiveMasks, iPxPos, 0).xy;\r
    //return textureLoad(dilatedReactiveMasks, vec2<i32>(round(fUv * vec2<f32>(RenderSize()))), 0).xy;\r
    return textureSampleLevel(dilatedReactiveMasks, samp, fUv, 0).xy;\r
}\r
fn LoadRwNewLocks(iPxPos: vec2<i32>) -> f32 {\r
    return textureLoad(newLocks, iPxPos).x;\r
}\r
fn StoreNewLocks(iPxPos: vec2<i32>, fnewLock: f32) {\r
    textureStore(newLocks, iPxPos, vec4<f32>(fnewLock, 0, 0, 0));\r
}\r
\r
fn SampleLockStatus(fUv: vec2<f32>) -> vec2<f32> {\r
    let lock: f32 = textureLoad(lockStatus, vec2<i32>(round(fUv * vec2<f32>(RenderSize())))).x;\r
    //let lock: f32 = textureSampleLevel(lockStatus, samp, fUv, 0).x;\r
    var lockstate: vec2<f32> = vec2<f32>(0, 0);\r
    if lock == 0.0 {\r
        lockstate = vec2<f32>(0, 0);\r
    }\r
    if lock == 1.0 {\r
        lockstate = vec2<f32>(0, 1);\r
    }\r
    if lock == 2.0 {\r
        lockstate = vec2<f32>(1, 0);\r
    }\r
    if lock == 3.0 {\r
        lockstate = vec2<f32>(1, 1);\r
    }\r
\r
    return lockstate;\r
}\r
\r
fn StoreLockStatus(iPxPos: vec2<i32>, fLockStatus: vec2<f32>) {\r
    var lockstate: f32 = 0;\r
    if fLockStatus.y == 1.0 {\r
        lockstate += 1;\r
    }\r
    if fLockStatus.x == 1.0 {\r
        lockstate += 2;\r
    }\r
    textureStore(newLocks, iPxPos, vec4<f32>(lockstate, 0, 0, 0));\r
}\r
\r
fn ComputeLockInputLuma(iPxLrPos: vec2<i32>) -> f32 {\r
    // We assume linear data. if non-linear input (sRGB, ...),\r
    // then we should convert to linear first and back to sRGB on output.\r
    let idx: u32 = u32(iPxLrPos.x * iPxLrPos.y + iPxLrPos.x);\r
    //var fRgb: vec3<f32> = max(vec3<f32>(0, 0, 0), readColor(&currentFrame, idx));\r
    var fRgb: vec3<f32> = max(vec3<f32>(0, 0, 0), LoadInputColor(iPxLrPos));\r
\r
    // Use internal auto exposure for locking logic\r
    fRgb /= PreExposure();\r
    fRgb *= Exposure();\r
\r
    // compute luma used to lock pixels, if used elsewhere the pow must be moved!\r
    let fLockInputLuma: f32 = pow(RGBToPerceivedLuma(fRgb), f32(1.0 / 6.0));\r
\r
    return fLockInputLuma;\r
}\r
\r
\r
fn RectificationBoxAddInitialSample(rectificationBox: ptr<function,RectificationBox>, colorSample: vec3<f32>, fSampleWeight: f32) {\r
    (*rectificationBox).aabbMin = colorSample;\r
    (*rectificationBox).aabbMax = colorSample;\r
\r
    let weightedSample: vec3<f32> = colorSample * fSampleWeight;\r
    (*rectificationBox).boxCenter = weightedSample;\r
    (*rectificationBox).boxVec = colorSample * weightedSample;\r
    (*rectificationBox).fBoxCenterWeight = fSampleWeight;\r
}\r
fn RectificationBoxAddSample(bInitialSample: bool, rectificationBox: ptr<function,RectificationBox>, colorSample: vec3<f32>, fSampleWeight: f32) {\r
    if bInitialSample {\r
        RectificationBoxAddInitialSample(rectificationBox, colorSample, fSampleWeight);\r
    } else {\r
        (*rectificationBox).aabbMin = min((*rectificationBox).aabbMin, colorSample);\r
        (*rectificationBox).aabbMax = max((*rectificationBox).aabbMax, colorSample);\r
\r
        let weightedSample: vec3<f32> = colorSample * fSampleWeight;\r
        (*rectificationBox).boxCenter += weightedSample;\r
        (*rectificationBox).boxVec += colorSample * weightedSample;\r
        (*rectificationBox).fBoxCenterWeight += fSampleWeight;\r
    }\r
}\r
\r
\r
\r
\r
\r
fn WrapHistory(iPxSample: vec2<i32>) -> vec4<f32> {\r
    return textureLoad(rPreviousDisplay, iPxSample, 0);\r
    //return vec4<f32>(0, 0, 0, 0);\r
    //return vec4f(0);\r
}\r
fn StoreInternalColorAndWeight(iPxPos: vec2<i32>, fvalue: vec4<f32>) {\r
    textureStore(wPreviousDisplay, iPxPos, fvalue);\r
}\r
\r
fn FetchHistorySamples(iPxSample: vec2<i32>, iTextureSize: vec2<i32>) -> FetchedBicubicSamples {\r
    var Samples: FetchedBicubicSamples = FetchedBicubicSamples();\r
\r
    Samples.fColor00 = vec4<f32>(WrapHistory(ClampCoord(iPxSample, vec2<i32>(-1, -1), iTextureSize)));\r
    Samples.fColor10 = vec4<f32>(WrapHistory(ClampCoord(iPxSample, vec2<i32>(0, -1), iTextureSize)));\r
    Samples.fColor20 = vec4<f32>(WrapHistory(ClampCoord(iPxSample, vec2<i32>(1, -1), iTextureSize)));\r
    Samples.fColor30 = vec4<f32>(WrapHistory(ClampCoord(iPxSample, vec2<i32>(2, -1), iTextureSize)));\r
\r
    Samples.fColor01 = vec4<f32>(WrapHistory(ClampCoord(iPxSample, vec2<i32>(-1, 0), iTextureSize)));\r
    Samples.fColor11 = vec4<f32>(WrapHistory(ClampCoord(iPxSample, vec2<i32>(0, 0), iTextureSize)));\r
    Samples.fColor21 = vec4<f32>(WrapHistory(ClampCoord(iPxSample, vec2<i32>(1, 0), iTextureSize)));\r
    Samples.fColor31 = vec4<f32>(WrapHistory(ClampCoord(iPxSample, vec2<i32>(2, 0), iTextureSize)));\r
\r
    Samples.fColor02 = vec4<f32>(WrapHistory(ClampCoord(iPxSample, vec2<i32>(-1, 1), iTextureSize)));\r
    Samples.fColor12 = vec4<f32>(WrapHistory(ClampCoord(iPxSample, vec2<i32>(0, 1), iTextureSize)));\r
    Samples.fColor22 = vec4<f32>(WrapHistory(ClampCoord(iPxSample, vec2<i32>(1, 1), iTextureSize)));\r
    Samples.fColor32 = vec4<f32>(WrapHistory(ClampCoord(iPxSample, vec2<i32>(2, 1), iTextureSize)));\r
\r
    Samples.fColor03 = vec4<f32>(WrapHistory(ClampCoord(iPxSample, vec2<i32>(-1, 2), iTextureSize)));\r
    Samples.fColor13 = vec4<f32>(WrapHistory(ClampCoord(iPxSample, vec2<i32>(0, 2), iTextureSize)));\r
    Samples.fColor23 = vec4<f32>(WrapHistory(ClampCoord(iPxSample, vec2<i32>(1, 2), iTextureSize)));\r
    Samples.fColor33 = vec4<f32>(WrapHistory(ClampCoord(iPxSample, vec2<i32>(2, 2), iTextureSize)));\r
\r
    return Samples;\r
}\r
\r
fn HistorySample(fUvSample: vec2<f32>, iTextureSize: vec2<i32>) -> vec4<f32> {\r
    var fPxSample: vec2<f32> = fUvSample * vec2<f32>(iTextureSize) - (Jitter() * vec2<f32>(iTextureSize) / vec2<f32>(RenderSize())) ;//- vec2<f32>(0.5, 0.5);             \r
    ///* Clamp base coords */                                                                                   \r
    fPxSample.x = max(0.0, min(f32(iTextureSize.x), fPxSample.x));\r
    fPxSample.y = max(0.0, min(f32(iTextureSize.y), fPxSample.y));\r
\r
    let iPxSample: vec2<i32> = vec2<i32>(floor(fPxSample));\r
    let fPxFrac: vec2<f32> = fract(fPxSample);\r
    let fColorXY: vec4<f32> = vec4<f32>(Lanczos2(FetchHistorySamples(iPxSample, iTextureSize), fPxFrac));\r
\r
    //let fColorXY: vec4<f32> = vec4<f32>(textureLoad(rPreviousDisplay, iPxSample, 0));\r
    return fColorXY;\r
}\r
\r
fn ReprojectHistoryColor(params: AccumulationPassCommonParams, fHistoryColor: ptr<function,vec3<f32>>, fTemporalReactiveFactor: ptr<function,f32>, bInMotionLastFrame: ptr<function,bool>) {\r
    let fHistory: vec4<f32> = HistorySample(params.fReprojectedHrUv, DisplaySize());\r
\r
    *fHistoryColor = fHistory.xyz;\r
\r
    *fHistoryColor = RGBToYCoCg(*fHistoryColor);\r
\r
    //Compute temporal reactivity info\r
    *fTemporalReactiveFactor = Saturate(abs(fHistory.w));\r
    *bInMotionLastFrame = (fHistory.w < 0.0);\r
}\r
\r
fn ReprojectHistoryLockStatus(params: AccumulationPassCommonParams, fReprojectedLockStatus: ptr<function,vec2<f32>>) -> LockState {\r
    var state: LockState = LockState(false, false);\r
    let fNewLockIntensity: f32 = LoadRwNewLocks(params.iPxHrPos);\r
    state.NewLock = fNewLockIntensity > (127.0 / 255.0);\r
\r
    var fInPlaceLockLifetime: f32 = 0;\r
    if state.NewLock {\r
        fInPlaceLockLifetime = fNewLockIntensity;\r
    }\r
\r
    *fReprojectedLockStatus = SampleLockStatus(params.fReprojectedHrUv);\r
\r
    if (*fReprojectedLockStatus)[LOCK_LIFETIME_REMAINING] != f32(0.0) {\r
        state.WasLockedPrevFrame = true;\r
    }\r
\r
    return state;\r
}\r
\r
fn ComputeReprojectedUVs(params: AccumulationPassCommonParams, fReprojectedHrUv: ptr<function,vec2<f32>>, bIsExistingSample: ptr<function,bool>) {\r
    *fReprojectedHrUv = params.fHrUv + params.fMotionVector;\r
\r
    *bIsExistingSample = IsUvInside(*fReprojectedHrUv);\r
}\r
\r
\r
fn ComputeMaxKernelWeight() -> f32 {\r
    let  fKernelSizeBias: f32 = 1.0;\r
\r
    let fKernelWeight: f32 = 1.0 + ((1.0) / vec2<f32>(DownscaleFactor()) - (1.0)).x * (fKernelSizeBias);\r
\r
    return min(f32(1.99), fKernelWeight);\r
}\r
\r
// fn GetUpsampleLanczosWeight(fSrcSampleOffset: vec2<f32>, fKernelWeight: f32) -> f32 {\r
//     let fSrcSampleOffsetBiased: vec2<f32> = fSrcSampleOffset * vec2<f32>(fKernelWeight, fKernelWeight);\r
//     //LANCZOS_TYPE_REFERENCE\r
//     let fSampleWeight: f32 = Lanczos2_s(length(fSrcSampleOffsetBiased));\r
//     // LANCZOS_TYPE_LUT\r
//     let fSampleWeight: f32 = Lanczos2_UseLUT(length(fSrcSampleOffsetBiased));\r
//     // LANCZOS_TYPE_APPROXIMATE\r
//     let fSampleWeight: f32 = Lanczos2ApproxSq(dot(fSrcSampleOffsetBiased, fSrcSampleOffsetBiased));\r
//     return fSampleWeight;\r
// }\r
\r
fn RectificationBoxComputeVarianceBoxData(rectificationBox: ptr<function,RectificationBox>) {\r
\r
    if abs((*rectificationBox).fBoxCenterWeight) <= f32(EPSILON) {\r
        (*rectificationBox).fBoxCenterWeight = 1;\r
    }\r
    (*rectificationBox).boxCenter /= (*rectificationBox).fBoxCenterWeight;\r
    (*rectificationBox).boxVec /= (*rectificationBox).fBoxCenterWeight;\r
    let stdDev: vec3<f32> = sqrt(abs((*rectificationBox).boxVec - (*rectificationBox).boxCenter * (*rectificationBox).boxCenter));\r
    (*rectificationBox).boxVec = stdDev;\r
}\r
\r
fn ComputeUpsampledColorAndWeight(params: AccumulationPassCommonParams,\r
    clippingBox: ptr<function,RectificationBox>, fReactiveFactor: f32) -> vec4<f32> {\r
\r
    let fDstOutputPos: vec2<f32> = vec2<f32>(params.iPxHrPos) + vec2<f32>(0.5, 0.5);\r
    let fSrcOutputPos: vec2<f32> = fDstOutputPos * DownscaleFactor();\r
    let iSrcInputPos: vec2<i32> = vec2<i32>(floor(fSrcOutputPos));\r
     // TODO: what about weird upscale factors...\r
    var fSamples: array<vec4<f32>,16> = array<vec4<f32>,16>();\r
    let fSrcUnjitteredPos: vec2<f32> = (vec2<f32>(iSrcInputPos) + vec2<f32>(0.5, 0.5)) - Jitter();\r
    var offsetTL: vec2<i32> = vec2<i32>(-1, -1);\r
    if fSrcUnjitteredPos.x > fSrcOutputPos.x {\r
        offsetTL.x = -2;\r
    }\r
    if fSrcUnjitteredPos.y > fSrcOutputPos.y {\r
        offsetTL.y = -2;\r
    }\r
    let bFlipRow = fSrcUnjitteredPos.y > fSrcOutputPos.y;\r
    let bFlipCol = fSrcUnjitteredPos.x > fSrcOutputPos.x;\r
\r
    let fOffsetTL: vec2<f32> = vec2<f32>(offsetTL);\r
\r
    var fColorAndWeight: vec4<f32> = vec4<f32>(0.0, 0.0, 0.0, 0.0);\r
\r
    let fBaseSampleOffset = vec2<f32>(fSrcUnjitteredPos - fSrcOutputPos);\r
    let fRectificationCurveBias = mix(-2.0, -3.0, Saturate(params.fHrVelocity / 50.0));\r
\r
\r
\r
    let fKernelReactiveFactor = max(fReactiveFactor, f32(params.bIsNewSample));\r
    let fKernelBiasMax = ComputeMaxKernelWeight() * (1.0 - fKernelReactiveFactor);\r
\r
    let fKernelBiasMin = max(1.0, ((1.0 + fKernelBiasMax) * 0.3));\r
    let fKernelBiasFactor = max(0.0, max(0.25 * params.fDepthClipFactor, fKernelReactiveFactor));\r
    let fKernelBias = mix(fKernelBiasMax, fKernelBiasMin, fKernelBiasFactor);\r
\r
\r
    for (var row = 0; row < 3; row += 1) {\r
        for (var col = 0; col < 3; col += 1) {\r
            let iSampleIndex: i32 = col + (row << 2);\r
\r
            var sampleColRow: vec2<i32> = vec2<i32>(col, row);\r
\r
            if fSrcUnjitteredPos.x > fSrcOutputPos.x {\r
                sampleColRow.x = (3 - col);\r
            }\r
            if fSrcUnjitteredPos.y > fSrcOutputPos.y {\r
                sampleColRow.y = (3 - row);\r
            }\r
\r
\r
            let fOffset = fOffsetTL + vec2<f32>(sampleColRow);\r
            let fSrcSampleOffset = fBaseSampleOffset + fOffset;\r
\r
            let iSrcSamplePos = vec2<i32>(iSrcInputPos) + vec2<i32>(offsetTL) + sampleColRow;\r
            let sampleCoord: vec2<i32> = ClampLoad(iSrcSamplePos, vec2<i32>(0, 0), vec2<i32>(RenderSize()));\r
\r
            let color: vec4<f32> = LoadPreparedInputColor(vec2<i32>(sampleCoord));\r
            let fOnScreenFactor = f32(IsOnScreen(vec2<i32>(iSrcSamplePos), vec2<i32>(RenderSize())));\r
\r
\r
\r
            let fSrcSampleOffsetBiased: vec2<f32> = fSrcSampleOffset * fKernelBias;\r
            var fSampleWeight = fOnScreenFactor * Lanczos2_s(length(fSrcSampleOffset));\r
\r
\r
            \r
            //LANCZOS_TYPE_REFERENCE\r
            //fSampleWeight = Lanczos2_s(length(fSrcSampleOffsetBiased));\r
            // // LANCZOS_TYPE_LUT\r
            // fSampleWeight = Lanczos2_UseLUT(length(fSrcSampleOffsetBiased));\r
            // // LANCZOS_TYPE_APPROXIMATE\r
            // fSampleWeight = Lanczos2ApproxSq(dot(fSrcSampleOffsetBiased, fSrcSampleOffsetBiased));\r
            fColorAndWeight += vec4<f32>(color.xyz * fSampleWeight, fSampleWeight);\r
\r
            // Update rectification box\r
\r
                {\r
                let fSrcSampleOffsetSq = dot(fSrcSampleOffset, fSrcSampleOffset);\r
                let fBoxSampleWeight = exp(fRectificationCurveBias * fSrcSampleOffsetSq);\r
\r
                let bInitialSample = (row == 0) && (col == 0);\r
                RectificationBoxAddSample(bInitialSample, (clippingBox), color.xyz, fBoxSampleWeight);\r
            }\r
        }\r
    }\r
\r
    RectificationBoxComputeVarianceBoxData((clippingBox));\r
    if fColorAndWeight.w > EPSILON {\r
        // Normalize for deringing (we need to compare colors)\r
        fColorAndWeight.x = fColorAndWeight.x / fColorAndWeight.w;\r
        fColorAndWeight.y = fColorAndWeight.y / fColorAndWeight.w;\r
        fColorAndWeight.z = fColorAndWeight.z / fColorAndWeight.w;\r
        fColorAndWeight.w *= fUpsampleLanczosWeightScale;\r
\r
        let tmp_clamp = clamp(fColorAndWeight.xyz, (*clippingBox).aabbMin, (*clippingBox).aabbMax);\r
        fColorAndWeight.x = tmp_clamp.x ;\r
        fColorAndWeight.y = tmp_clamp.y ;\r
        fColorAndWeight.z = tmp_clamp.z ;\r
    }\r
    // fColorAndWeight.w = fKernelReactiveFactor;\r
    //fColorAndWeight.w = Lanczos2_s(length(fBaseSampleOffset));//length(fBaseSampleOffset) ;//Lanczos2_s();\r
\r
    return fColorAndWeight;\r
}\r
\r
\r
fn ComputeBaseAccumulationWeight(params: AccumulationPassCommonParams, fThisFrameReactiveFactor: f32, bInMotionLastFrame: bool, fUpsampledWeight: f32) -> vec3<f32> {\r
    // Always assume max accumulation was reached\r
    var fBaseAccumulation: f32 = fMaxAccumulationLanczosWeight * f32(params.bIsExistingSample) * (1.0 - fThisFrameReactiveFactor) * (1.0 - params.fDepthClipFactor);\r
\r
    //fBaseAccumulation = 1 - params.fDepthClipFactor ;\r
    fBaseAccumulation = min(fBaseAccumulation, mix(fBaseAccumulation, fUpsampledWeight * 10.0,\r
        max(f32(bInMotionLastFrame), Saturate(params.fHrVelocity * f32(10)))));\r
\r
    fBaseAccumulation = min(fBaseAccumulation, mix(fBaseAccumulation, fUpsampledWeight, Saturate(params.fHrVelocity / f32(20))));\r
\r
    return vec3<f32>(fBaseAccumulation, fBaseAccumulation, fBaseAccumulation);\r
}\r
\r
fn ComputeLumaInstabilityFactor(params: AccumulationPassCommonParams, clippingBox: RectificationBox, fThisFrameReactiveFactor: f32, fLuminanceDiff: f32) -> f32 {\r
    let fUnormThreshold: f32 = 1.0 / 255.0;\r
    let N_MINUS_1 = 0;\r
    let N_MINUS_2 = 1;\r
    let N_MINUS_3 = 2;\r
    let N_MINUS_4 = 3;\r
\r
    var  fCurrentFrameLuma: f32 = clippingBox.boxCenter.x;\r
\r
\r
//#if FFX_FSR2_OPTION_HDR_COLOR_INPUT\r
    fCurrentFrameLuma = fCurrentFrameLuma / (1.0 + max(0.0, fCurrentFrameLuma));\r
//#endif\r
    fCurrentFrameLuma = round(fCurrentFrameLuma * 255.0) / 255.0;\r
\r
    let bSampleLumaHistory: bool = (max(max(params.fDepthClipFactor, params.fAccumulationMask), fLuminanceDiff) < 0.1) && (params.bIsNewSample == false);\r
    var fCurrentFrameLumaHistory: vec4<f32> = vec4<f32>(0, 0, 0, 0);\r
    if bSampleLumaHistory {\r
        //let aaaa = 1;\r
        fCurrentFrameLumaHistory = SampleLumaHistory(params.fReprojectedHrUv);\r
        \r
        //textureLod(sampler2D(r_luma_history, s_LinearClamp), fUV, 0.0);\r
    }\r
\r
    var fLumaInstability: f32 = 0.0;\r
    let fDiffs0: f32 = (fCurrentFrameLuma - fCurrentFrameLumaHistory[N_MINUS_1]);\r
    var fMin: f32 = abs(fDiffs0);\r
\r
    if fMin >= fUnormThreshold {\r
        for (var  i = N_MINUS_2; i <= N_MINUS_4; i++) {\r
            let fDiffs1: f32 = (fCurrentFrameLuma - fCurrentFrameLumaHistory[i]);\r
\r
            if sign(fDiffs0) == sign(fDiffs1) {\r
                \r
                // Scale difference to protect historically similar values\r
                let fMinBias: f32 = 1.0;\r
                fMin = min(fMin, abs(fDiffs1) * fMinBias);\r
            }\r
        }\r
\r
        let fBoxSize: f32 = clippingBox.boxVec.x;\r
        let fBoxSizeFactor: f32 = pow(Saturate(fBoxSize / 0.1), 6.0);\r
\r
        fLumaInstability = f32(fMin != abs(fDiffs0)) * fBoxSizeFactor;\r
        fLumaInstability = f32(fLumaInstability > fUnormThreshold);\r
\r
        fLumaInstability *= 1.0 - max(params.fAccumulationMask, pow(fThisFrameReactiveFactor, 1.0 / 6.0));\r
    }\r
\r
    //shift history\r
    fCurrentFrameLumaHistory[N_MINUS_4] = fCurrentFrameLumaHistory[N_MINUS_3];\r
    fCurrentFrameLumaHistory[N_MINUS_3] = fCurrentFrameLumaHistory[N_MINUS_2];\r
    fCurrentFrameLumaHistory[N_MINUS_2] = fCurrentFrameLumaHistory[N_MINUS_1];\r
    fCurrentFrameLumaHistory[N_MINUS_1] = fCurrentFrameLuma;\r
\r
    StoreLumaHistory(params.iPxHrPos, fCurrentFrameLumaHistory);\r
\r
    return fLumaInstability * f32(fCurrentFrameLumaHistory[N_MINUS_4] != 0);\r
}\r
\r
fn ComputeTemporalReactiveFactor(params: AccumulationPassCommonParams, fTemporalReactiveFactor: f32) -> f32 {\r
    var fNewFactor: f32 = min(0.99, fTemporalReactiveFactor);\r
\r
    fNewFactor = max(fNewFactor, mix(fNewFactor, 0.4, Saturate(params.fHrVelocity)));\r
\r
    fNewFactor = max(fNewFactor * fNewFactor, params.fDepthClipFactor * 0.1);\r
\r
    // Force reactive factor for new samples\r
    if params.bIsNewSample {\r
        fNewFactor = 1.0;\r
    }\r
\r
    if Saturate(params.fHrVelocity * 10.0) >= 1.0 {\r
        fNewFactor = max(EPSILON, fNewFactor) * -1.0;\r
    }\r
\r
    return fNewFactor;\r
}\r
\r
\r
\r
fn RectifyHistory(\r
    params: AccumulationPassCommonParams,\r
    clippingBox: RectificationBox, fHistoryColor: ptr<function, vec3<f32>>, fAccumulation: ptr<function,vec3<f32>>,\r
    fLockContributionThisFrame: f32, fTemporalReactiveFactor: f32, fLumaInstabilityFactor: f32\r
) -> vec3<f32> {\r
    let fScaleFactorInfluence: f32 = min(20.0, pow(f32(1.0 / length(DownscaleFactor().x * DownscaleFactor().y)), 3.0));\r
\r
    let fVecolityFactor: f32 = Saturate(params.fHrVelocity / 20.0);\r
    let fBoxScaleT: f32 = max(params.fDepthClipFactor, max(params.fAccumulationMask, fVecolityFactor));\r
    let fBoxScale: f32 = mix(fScaleFactorInfluence, 1.0, fBoxScaleT);\r
\r
    let fScaledBoxVec: vec3<f32> = clippingBox.boxVec * fBoxScale;\r
    var boxMin: vec3<f32> = clippingBox.boxCenter - fScaledBoxVec;\r
    var boxMax: vec3<f32> = clippingBox.boxCenter + fScaledBoxVec;\r
    let boxCenter: vec3<f32> = clippingBox.boxCenter;\r
    let boxVecSize: f32 = length(clippingBox.boxVec);\r
\r
    boxMin = max(clippingBox.aabbMin, boxMin);\r
    boxMax = min(clippingBox.aabbMax, boxMax);\r
\r
    if any((boxMin >= (*fHistoryColor))) || any(((*fHistoryColor) >= boxMax)) {\r
\r
        let fClampedHistoryColor: vec3<f32> = clamp((*fHistoryColor), boxMin, boxMax);\r
\r
        var fHistoryContribution: vec3<f32> = Broadcast3(max(fLumaInstabilityFactor, fLockContributionThisFrame));\r
\r
        let fReactiveFactor: f32 = params.fDilatedReactiveFactor;\r
        let fReactiveContribution: f32 = 1.0 - pow(fReactiveFactor, 1.0 / 2.0);\r
        fHistoryContribution *= fReactiveContribution;\r
\r
        // Scale history color using rectification info, also using accumulation mask to avoid potential invalid color protection\r
        (*fHistoryColor) = mix(fClampedHistoryColor, (*fHistoryColor), Saturate3(fHistoryContribution));\r
\r
        // Scale accumulation using rectification info\r
        let fAccumulationMin: vec3<f32> = min((*fAccumulation), vec3<f32>(0.3, 0.3, 0.3));\r
        (*fAccumulation) = mix(fAccumulationMin, (*fAccumulation), Saturate3(fHistoryContribution));\r
        return fHistoryContribution;\r
    }\r
    return vec3<f32>(1.0, 1.0, 1.0);\r
}\r
\r
\r
fn GetShadingChangeLuma(iPxHrPos: vec2<i32>, fUvCoord: vec2<f32>) -> f32 {\r
    var fShadingChangeLuma: f32 = 0;\r
\r
    let fDiv: f32 = pow(1, f32(1 + LumaMipLevelToUse()));\r
    var iMipRenderSize: vec2<i32> = vec2<i32>(vec2<f32>(RenderSize()) / fDiv);\r
\r
\r
    var _fUvCoord = ClampUv(fUvCoord, iMipRenderSize, LumaMipDimensions());\r
    //fShadingChangeLuma = Exposure() * exp(f32(SampleMipLuma(_fUvCoord)));\r
    //Exposure() * exp(f32(SampleMipLuma(_fUvCoord, LumaMipLevelToUse())));\r
    fShadingChangeLuma = Exposure() * exp(f32(SampleMipLuma(\r
        (vec2<f32>(iPxHrPos) / vec2<f32>(DisplaySize()) * vec2<f32>(RenderSize()))\r
    )));\r
    fShadingChangeLuma = pow(fShadingChangeLuma, 1.0 / 6.0);\r
\r
    return fShadingChangeLuma;\r
}\r
\r
\r
fn UpdateLockStatus(params: AccumulationPassCommonParams,\r
    fReactiveFactor: ptr<function,f32>,\r
    state: LockState,\r
    fLockStatus: ptr<function,vec2<f32>>,\r
    fLockContributionThisFrame: ptr<function,f32>,\r
    fLuminanceDiff: ptr<function,f32>) {\r
\r
    let fShadingChangeLuma: f32 = GetShadingChangeLuma(params.iPxHrPos, params.fHrUv);\r
\r
    // init temporal shading change factor, init to -1 or so in reproject to know if "true new"?\r
    if (*fLockStatus)[LOCK_TEMPORAL_LUMA] == f32(0.0) {\r
        (*fLockStatus)[LOCK_TEMPORAL_LUMA] = fShadingChangeLuma;\r
    }\r
\r
    var fPreviousShadingChangeLuma: f32 = (*fLockStatus)[LOCK_TEMPORAL_LUMA];\r
\r
    *fLuminanceDiff = 1.0 - MinDividedByMax(fPreviousShadingChangeLuma, fShadingChangeLuma);\r
\r
    if state.NewLock {\r
        (*fLockStatus)[LOCK_TEMPORAL_LUMA] = fShadingChangeLuma;\r
        if (*fLockStatus)[LOCK_LIFETIME_REMAINING] != 0.0 {\r
            (*fLockStatus)[LOCK_LIFETIME_REMAINING] = 2;\r
        } else {\r
            (*fLockStatus)[LOCK_LIFETIME_REMAINING] = 1;\r
        }\r
    } else if (*fLockStatus)[LOCK_LIFETIME_REMAINING] <= 1.0 {\r
        (*fLockStatus)[LOCK_TEMPORAL_LUMA] = mix((*fLockStatus)[LOCK_TEMPORAL_LUMA], f32(fShadingChangeLuma), 0.5);\r
    } else {\r
        if *fLuminanceDiff > 0.1 {\r
           // KillLock((*fLockStatus));\r
            (*fLockStatus)[LOCK_LIFETIME_REMAINING] = 0;\r
        }\r
    }\r
\r
    (*fReactiveFactor) = max((*fReactiveFactor), Saturate((*fLuminanceDiff - 0.1) * 10.0));\r
    (*fLockStatus)[LOCK_LIFETIME_REMAINING] *= (1.0 - (*fReactiveFactor));\r
\r
    (*fLockStatus)[LOCK_LIFETIME_REMAINING] *= Saturate(1.0 - params.fAccumulationMask);\r
    (*fLockStatus)[LOCK_LIFETIME_REMAINING] *= f32(params.fDepthClipFactor < 0.1);\r
\r
    // Compute this frame lock contribution\r
    let fLifetimeContribution: f32 = Saturate((*fLockStatus)[LOCK_LIFETIME_REMAINING] - 1.0);\r
    let fShadingChangeContribution: f32 = Saturate(MinDividedByMax((*fLockStatus)[LOCK_TEMPORAL_LUMA], fShadingChangeLuma));\r
\r
    *fLockContributionThisFrame = Saturate(Saturate(fLifetimeContribution * 4.0) * fShadingChangeContribution);\r
}\r
\r
\r
fn FinalizeLockStatus(params: AccumulationPassCommonParams, fLockStatus: vec2<f32>, fUpsampledWeight: f32) {\r
    // we expect similar motion for next frame\r
    // kill lock if that location is outside screen, avoid locks to be clamped to screen borders\r
    var fEstimatedUvNextFrame: vec2<f32> = params.fHrUv - params.fMotionVector;\r
    var _fLockStatus: vec2<f32> = fLockStatus;\r
    if IsUvInside(fEstimatedUvNextFrame) == false {\r
        _fLockStatus[LOCK_LIFETIME_REMAINING] = 0.0;\r
    } else {\r
        // Decrease lock lifetime\r
        let fLifetimeDecreaseLanczosMax: f32 = f32(JitterSequenceLength()) * f32(fAverageLanczosWeightPerFrame);\r
        let fLifetimeDecrease: f32 = f32(fUpsampledWeight / fLifetimeDecreaseLanczosMax);\r
        _fLockStatus[LOCK_LIFETIME_REMAINING] = max(f32(0), _fLockStatus[LOCK_LIFETIME_REMAINING] - fLifetimeDecrease);\r
    }\r
\r
    StoreLockStatus(params.iPxHrPos, _fLockStatus);\r
}\r
\r
fn InitParams(iPxHrPos: vec2<i32>) -> AccumulationPassCommonParams {\r
    var params: AccumulationPassCommonParams;\r
\r
    params.iPxHrPos = iPxHrPos;\r
    params.fHrUv = (vec2<f32>(iPxHrPos) + 0.5) / vec2<f32>(DisplaySize());\r
\r
    let fLrUvJittered: vec2<f32> = params.fHrUv ;//+ Jitter() / vec2<f32>(RenderSize())\r
    params.fLrUv_HwSampler = ClampUv(fLrUvJittered, RenderSize(), MaxRenderSize());\r
\r
\r
    //params.fMotionVector = LoadInputMotionVector(iPxHrPos);\r
    params.fMotionVector = LoadInputMotionVector(vec2<i32>(params.fHrUv * vec2<f32>(RenderSize())));\r
\r
    params.fHrVelocity = length(params.fMotionVector * vec2<f32>(DisplaySize()));\r
\r
    //ComputeReprojectedUVs(params, &params.fReprojectedHrUv, &params.bIsExistingSample);\r
    params.fReprojectedHrUv = params.fHrUv - params.fMotionVector;\r
    params.bIsExistingSample = (params.fReprojectedHrUv.x >= 0.0 && params.fReprojectedHrUv.x <= 1.0) && (params.fReprojectedHrUv.y >= 0.0 && params.fReprojectedHrUv.y <= 1.0);\r
\r
    params.fDepthClipFactor = Saturate(SamplePreparedInputColor(params.fLrUv_HwSampler).w);\r
    //params.fDepthClipFactor = 0.5;\r
\r
    let  fDilatedReactiveMasks: vec2<f32> = SampleDilatedReactiveMasks(params.fLrUv_HwSampler);\r
    //let  fDilatedReactiveMasks: vec2<f32> = vec2<f32>(0.1, 0.1);\r
    //params.fDilatedReactiveFactor = fDilatedReactiveMasks.x;\r
    //params.fDilatedReactiveFactor = 0.9;\r
    params.fAccumulationMask = fDilatedReactiveMasks.y;\r
    //params.bIsResetFrame = (0 == FrameIndex());\r
    params.bIsResetFrame = false;\r
    params.bIsNewSample = (params.bIsExistingSample == false || params.bIsResetFrame);\r
    //params.bIsNewSample = (params.bIsExistingSample == false || params.bIsResetFrame);\r
\r
    return params;\r
}\r
\r
fn Accumulate(iPxHrPos: vec2<i32>) {\r
    var params: AccumulationPassCommonParams = InitParams(iPxHrPos);\r
    var iPxLrPos: vec2<i32> = vec2<i32>(round(params.fHrUv * vec2<f32>(RenderSize())));\r
\r
    var fHistoryColor: vec3<f32> = vec3<f32>(0, 0, 0);\r
    var fLockStatus: vec2<f32> = vec2<f32>(0, 0);\r
\r
    var fTemporalReactiveFactor: f32 = 0.0;\r
    var bInMotionLastFrame: bool = false;\r
    var lockState: LockState = LockState(false, false);\r
\r
    if params.bIsExistingSample && !params.bIsResetFrame {\r
\r
        lockState = ReprojectHistoryLockStatus(params, &fLockStatus);\r
    }\r
    ReprojectHistoryColor(params, &fHistoryColor, &fTemporalReactiveFactor, &bInMotionLastFrame);//ycocg\r
    var bk = fTemporalReactiveFactor;\r
    var fThisFrameReactiveFactor: f32 = fTemporalReactiveFactor;\r
\r
    var fLuminanceDiff: f32 = 0.0;\r
    var fLockContributionThisFrame: f32 = 0.0;\r
\r
    UpdateLockStatus(params, &fThisFrameReactiveFactor, lockState, &fLockStatus, &fLockContributionThisFrame,\r
        &fLuminanceDiff);\r
\r
    // // Load upsampled input color\r
    var clippingBox: RectificationBox = RectificationBox();\r
    var fUpsampledColorAndWeight: vec4<f32> = vec4<f32>(0, 0, 0, 0);\r
    fUpsampledColorAndWeight = ComputeUpsampledColorAndWeight(params, &clippingBox, fThisFrameReactiveFactor);\r
\r
    // fUpsampledColorAndWeight = LoadPreparedInputColor(iPxLrPos);\r
    // RectificationBoxAddSample(true, (&clippingBox), fUpsampledColorAndWeight.xyz, fUpsampledColorAndWeight.w);\r
    // RectificationBoxComputeVarianceBoxData((&clippingBox));\r
\r
    var fLumaInstabilityFactor: f32 = ComputeLumaInstabilityFactor(params, clippingBox, fThisFrameReactiveFactor, fLuminanceDiff);\r
\r
    //fThisFrameReactiveFactor = 0.3;\r
\r
    var fAccumulation: vec3<f32> = ComputeBaseAccumulationWeight(params, fThisFrameReactiveFactor,\r
        bInMotionLastFrame, fUpsampledColorAndWeight.w);\r
    var fAccumulation_bk = fAccumulation;\r
    if params.bIsNewSample {\r
        fHistoryColor = YCoCgToRGB(fUpsampledColorAndWeight.xyz);\r
    } else {\r
        let contribution = RectifyHistory(params, clippingBox, &fHistoryColor, &fAccumulation, fLockContributionThisFrame, fThisFrameReactiveFactor, fLumaInstabilityFactor);\r
        fAccumulation = max(vec3<f32>(EPSILON, EPSILON, EPSILON), fAccumulation + fUpsampledColorAndWeight.www);\r
        var fAlpha: vec3<f32> = fUpsampledColorAndWeight.www / fAccumulation;\r
        // fAlpha = vec3<f32>(0.05, 0.05, 0.05);\r
        // fAlpha *= 0.2;\r
        // fAlpha = fUpsampledColorAndWeight.www;\r
        fHistoryColor = mix(fHistoryColor, (fUpsampledColorAndWeight.xyz), fAlpha);\r
        fHistoryColor = YCoCgToRGB(fHistoryColor);\r
        //fHistoryColor = YCoCgToRGB(fUpsampledColorAndWeight.xyz);\r
        // if all(fHistoryColor <= vec3<f32>(1.0 / 255.0, 1.0 / 255.0, 1.0 / 255.0)) {\r
        //     fHistoryColor = YCoCgToRGB(LoadPreparedInputColor(iPxLrPos).xyz);\r
        // } else {\r
        //     fHistoryColor = vec3<f32>(0, 0, 0);\r
        // }\r
        //fHistoryColor = vec3<f32>(0, LoadRwNewLocks(iPxLrPos), 0);\r
        //fHistoryColor = YCoCgToRGB(LoadPreparedInputColor(iPxLrPos).xyz);\r
        //fHistoryColor = textureLoad(rPreviousDisplay, iPxHrPos, 0).xyz - (fHistoryColor);\r
        //fHistoryColor = mix(YCoCgToRGB(fHistoryColor), YCoCgToRGB(fUpsampledColorAndWeight.xyz), fAlpha);\r
        //\r
        //fHistoryColor = vec3<f32>(0, params.fDepthClipFactor, 0);\r
        //fHistoryColor = vec3<f32>(0, fLumaInstabilityFactor, 0);\r
        //fHistoryColor = vec3<f32>(0, params.fMotionVector);\r
\r
        if showWeight {\r
        }\r
        \r
        //fHistoryColor = vec3<f32>(0, params.fAccumulationMask, 0);\r
        //fHistoryColor = vec3<f32>(0, fThisFrameReactiveFactor, 0);\r
        \r
        //fHistoryColor = YCoCgToRGB(fUpsampledColorAndWeight.xyz);\r
    }\r
\r
    fHistoryColor = UnprepareRgb(fHistoryColor, Exposure());\r
\r
    FinalizeLockStatus(params, fLockStatus, fUpsampledColorAndWeight.w);\r
\r
    // // Get new temporal reactive factor\r
    fTemporalReactiveFactor = ComputeTemporalReactiveFactor(params, fThisFrameReactiveFactor);\r
\r
    StoreInternalColorAndWeight(iPxHrPos, vec4<f32>(fHistoryColor, fTemporalReactiveFactor));\r
\r
    //textureStore(wPreviousDisplay, iPxHrPos, vec4<f32>(fHistoryColor, 1));\r
\r
    // Output final color when RCAS is disabled\r
\r
    textureStore(currentDisplay, iPxHrPos, vec4<f32>(fHistoryColor.xyz, 1));\r
    // var iPxLrPos= vec2<i32>(params.fHrUv*vec2<f32>(RenderSize()));\r
    // textureStore(currentDisplay, iPxHrPos, vec4<f32>(,0, 1));\r
    //textureStore(currentDisplay, iPxHrPos, vec4<f32>(0,f32(params.bIsNewSample)/1.0,   0, 1));\r
    StoreNewLocks(iPxHrPos, 0);\r
}\r
\r
\r
\r
\r
\r
\r
@compute @workgroup_size(8, 8, 1)\r
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3u, @builtin(workgroup_id) WorkgroupID: vec3u, @builtin(local_invocation_id) LocalInvocationID: vec3u) {\r
    let screen_size: vec2<i32> = DisplaySize();\r
    let screen_pos: vec2<i32> = vec2<i32>(GlobalInvocationID.xy);\r
    // globalInvocationID = vec3<i32>(GlobalInvocationID);\r
    // workgroupID = vec3<i32>(WorkgroupID);\r
    // localInvocationID = vec3<i32>(LocalInvocationID);\r
    //invokePreload(vec2i(GlobalInvocationID.xy), vec2i(LocalInvocationID.xy));\r
    if enCache {\r
        globalInvocationID = vec3<i32>(GlobalInvocationID);\r
        workgroupID = vec3<i32>(WorkgroupID);\r
        localInvocationID = vec3<i32>(LocalInvocationID);\r
        invokePreload(vec2i(GlobalInvocationID.xy), vec2i(LocalInvocationID.xy));\r
    }\r
    if !IsOnScreen(screen_pos, screen_size) {\r
        let zlinear = zNear * zFar / (zFar + 0 * (zNear - zFar));\r
        return;\r
    }\r
    let origin_size: vec2<i32> = RenderSize();\r
    let scale_ratio: f32 = f32(screen_size.x) / f32(origin_size.x);\r
    let origin_pos: vec2<i32> = vec2<i32>(vec2<f32>(screen_pos) / scale_ratio);\r
    // let origin_abs_pos: vec2<u32>;\r
    // let prev_pos: vec2<u32> ;\r
\r
    // linear depth\r
    // let depth = (textureSampleLevel(depthBuffer, samp, vec2<f32>(origin_pos) / vec2<f32>(origin_size), 0) + 1.0) / 2.0;\r
    // // let depth = (textureLoad(depthBuffer, origin_pos, 0) + 1.0) / 2.0;\r
    // let zlinear = zNear * zFar / (zFar + depth * (zNear - zFar));\r
    // // textureStore(output, screen_pos, vec4<f32>(vec3<f32>(zlinear / 20.0), 1.0));\r
\r
    \r
\r
    // vbuffer //getClosestOffset(origin_size, origin_pos)\r
    // var visibility: vec4<u32> = textureLoad(vBuffer, origin_pos, 0);\r
    // let betagamma = bitcast<vec2<f32>>(visibility.xy);\r
    // let barycentric = vec3<f32>(1.0 - betagamma.x - betagamma.y, betagamma.x, betagamma.y);\r
    // // textureStore(output, screen_pos, vec4<f32>(barycentric, 1.0));\r
\r
    // // [0, width] x [0, height] range of motion vector\r
    // // .------> X\r
    // // |\r
    // // v\r
    // // Y\r
    // let motionVec: vec2<f32> = LoadInputMotionVector(origin_pos);//currentScreenPos - lastScreenPos\r
    // //let motionVec: vec2<f32> = vec2<f32>(0, 0);\r
    // // textureStore(output, screen_pos, vec4<f32>(motionVec.xy * 0.05+0.5, 0.0, 1.0));\r
    // let trianlgeID = visibility.z;\r
    // textureStore(output, screen_pos, vec4<f32>(vec3<f32>(f32(visibility.z) / 3.), 1.));\r
\r
    // raytracing depth\r
\r
    //Accumulate(origin_pos);\r
    Accumulate(screen_pos);\r
\r
    // let fHrUv = (vec2<f32>(screen_pos) + 0.5) / vec2<f32>(DisplaySize());\r
    // //params.fMotionVector = LoadInputMotionVector(iPxHrPos);\r
    // let fMotionVector = LoadInputMotionVector(vec2<i32>(fHrUv * vec2<f32>(RenderSize())));\r
\r
    // let fHrVelocity = length(fMotionVector * vec2<f32>(DisplaySize()));\r
\r
    // //ComputeReprojectedUVs(params, &params.fReprojectedHrUv, &params.bIsExistingSample);\r
    // let fReprojectedHrUv = fHrUv - fMotionVector;\r
    // let bIsExistingSample = (fReprojectedHrUv.x >= 0.0 && fReprojectedHrUv.x <= 1.0) && (fReprojectedHrUv.y >= 0.0 && fReprojectedHrUv.y <= 1.0);\r
\r
    // let bIsResetFrame = false;\r
    // let bIsNewSample = (bIsExistingSample == false || bIsResetFrame);\r
\r
    // var color = vec4<f32>(0.0, 0.0, 0.0, 1.0);\r
    // var last_color = vec4<f32>(0.0, 0.0, 0.0, 1.0);\r
    // if bIsNewSample {\r
    //     color = vec4<f32>(LoadInputColor(origin_pos), 0);\r
    //     textureStore(wPreviousDisplay, screen_pos, vec4<f32>(color.xyz, 1));\r
    //     textureStore(currentDisplay, screen_pos, color);\r
    // } else {\r
    //     last_color = textureLoad(rPreviousDisplay, screen_pos, 0);\r
    //     //last_color = HistorySample(fReprojectedHrUv, DisplaySize());\r
    //     color = vec4<f32>(LoadInputColor(origin_pos), 0);\r
    //     let alpha = 0.05;\r
    //     color = alpha * color + (1 - alpha) * last_color;\r
    //     textureStore(wPreviousDisplay, screen_pos, vec4<f32>(color.xyz, 1));\r
        \r
    //     //color = vec4<f32>(fReprojectedHrUv, 0, 1);\r
    //     textureStore(currentDisplay, screen_pos, color);\r
    // }\r
    // color = vec4<f32>(LoadInputColor(origin_pos), 0);\r
    // textureStore(currentDisplay, origin_pos, color);\r
}`,ea=`\r
@group(0) @binding(0) var<uniform> sampJitter : vec2<f32>;\r
@group(0) @binding(1) var samp : sampler;\r
@group(0) @binding(2) var rawDisplay : texture_2d<f32>;\r
@group(0) @binding(3) var currentDisplay : texture_storage_2d<displayFormat, write>;\r
\r
\r
// #include <FSR_common.wgsl>;\r
// var globalInvocationID: vec3<i32> = vec3<i32>(0, 0, 0);\r
// var workgroupID: vec3<i32> = vec3<i32>(0, 0, 0);\r
// var localInvocationID: vec3<i32> = vec3<i32>(0, 0, 0);\r
\r
\r
fn floatBitsToUint(f: f32) -> u32 {\r
    // 使用GLSL.std.450库中的glsl450扩展函数\r
    // 将浮点数转换为无符号整数\r
    return bitcast<u32>(f);\r
}\r
fn uintBitsToFloat(f: u32) -> f32 {\r
    // 使用GLSL.std.450库中的glsl450扩展函数\r
    // 将浮点数转换为无符号整数\r
    return bitcast<f32>(f);\r
}\r
\r
\r
fn FsrRcasInputF(r: ptr<function,f32>, g: ptr<function,f32>, b: ptr<function,f32>) {}\r
fn LoadRCAS_Input(p: vec2<i32>) -> vec4<f32> {\r
    return textureLoad(rawDisplay, p, 0);\r
}\r
\r
\r
fn tone_mapping(hdrColor: vec3<f32>) -> vec4<f32> {\r
\r
    var mapped: vec3<f32> = vec3<f32>(1.0) - exp(-hdrColor * fExposure);\r
\r
    let color: vec4<f32> = vec4<f32>(mapped, 1.0);\r
    return color;\r
}  \r
fn eUpscaledOutput(p: vec2<i32>, value: vec3<f32>) {\r
    textureStore(currentDisplay, p, tone_mapping(value));\r
\r
    // textureStore(currentDisplay, p, vec4<f32>(ACESToneMapping(value, fExposure), 1));\r
}\r
fn FsrRcasLoadF(p: vec2<i32>) -> vec3<f32> {\r
    var fColor: vec3<f32> = LoadRCAS_Input(p).xyz;\r
    //fColor.xyz = PrepareRgb(fColor.xyz, Exposure(), PreExposure());\r
    // fColor.xyz = PrepareRgb(fColor.xyz, Exposure(), PreExposure());\r
    // fColor.xyz = PrepareRgb(fColor.xyz, Exposure(), PreExposure());\r
    //return fColor;\r
    return PrepareRgb(fColor.xyz, Exposure(), PreExposure());\r
}\r
\r
fn ffxApproximateReciprocalMedium(value: f32) -> f32 {\r
    var b: f32 = uintBitsToFloat(u32(0x7ef19fff) - floatBitsToUint(value));\r
    return b * (-b * value + f32(2.0));\r
}\r
// fn FsrRcasCon()->vec4<u32> {\r
fn RCASConfig() -> vec4<u32> {\r
    // The scale is {0.0 := maximum, to N>0, where N is the number of stops (halving) of the reduction of sharpness}.\r
    // Transform from stops to linear value.\r
    var _sharpness = exp2(-fSharpness);\r
    var hSharp: vec2<f32> = vec2<f32>(_sharpness, _sharpness);\r
    var con: vec4<u32> = vec4<u32>(0, 0, 0, 0);\r
    con[0] = floatBitsToUint(_sharpness);\r
    con[1] = pack2x16float(hSharp);\r
    con[2] = 0;\r
    con[3] = 0;\r
    return con;\r
}\r
fn FsrRcasF(pixR: ptr<function,f32>,  // Output values, non-vector so port between RcasFilter() and RcasFilterH() is easy.\r
    pixG: ptr<function,f32>,\r
    pixB: ptr<function,f32>,\r
//#ifdef FSR_RCAS_PASSTHROUGH_ALPHA\r
//               pixA:ptr<function,f32>,\r
//#endif\r
    ip: vec2<u32>,  // Integer pixel position in output.\r
    _con: vec4<u32>) {  \r
     // Constant generated by RcasSetup().\r
     // Algorithm uses minimal 3x3 pixel neighborhood.\r
     //    b\r
     //  d e f\r
     //    h\r
\r
    var con: vec4<u32> = _con;\r
    var sp: vec2<i32> = vec2<i32>(ip);\r
    var b: vec3<f32> = FsrRcasLoadF(sp + vec2<i32>(0, -1)).xyz;\r
    var d: vec3<f32> = FsrRcasLoadF(sp + vec2<i32>(-1, 0)).xyz;\r
//#ifdef FSR_RCAS_PASSTHROUGH_ALPHA\r
    //  var ee:vec4<f32> = FsrRcasLoadF(sp);\r
    //  var e :vec3<f32> = ee.xyz;\r
    //  *pixA            = ee.a;\r
// #else\r
    var e: vec3<f32> = FsrRcasLoadF(sp).xyz;\r
// #endif\r
    var f: vec3<f32> = FsrRcasLoadF(sp + vec2<i32>(1, 0)).xyz;\r
    var h: vec3<f32> = FsrRcasLoadF(sp + vec2<i32>(0, 1)).xyz;\r
     // Rename (32-bit) or regroup (16-bit).\r
    var bR: f32 = b.x;\r
    var bG: f32 = b.y;\r
    var bB: f32 = b.z;\r
    var dR: f32 = d.x;\r
    var dG: f32 = d.y;\r
    var dB: f32 = d.z;\r
    var eR: f32 = e.x;\r
    var eG: f32 = e.y;\r
    var eB: f32 = e.z;\r
    var fR: f32 = f.x;\r
    var fG: f32 = f.y;\r
    var fB: f32 = f.z;\r
    var hR: f32 = h.x;\r
    var hG: f32 = h.y;\r
    var hB: f32 = h.z;\r
     // Run optional input transform.\r
    //  FsrRcasInputF(bR, bG, bB);\r
    //  FsrRcasInputF(dR, dG, dB);\r
    //  FsrRcasInputF(eR, eG, eB);\r
    //  FsrRcasInputF(fR, fG, fB);\r
    //  FsrRcasInputF(hR, hG, hB);\r
     // Luma times 2.\r
    var bL: f32 = bB * f32(0.5) + (bR * f32(0.5) + bG);\r
    var dL: f32 = dB * f32(0.5) + (dR * f32(0.5) + dG);\r
    var eL: f32 = eB * f32(0.5) + (eR * f32(0.5) + eG);\r
    var fL: f32 = fB * f32(0.5) + (fR * f32(0.5) + fG);\r
    var hL: f32 = hB * f32(0.5) + (hR * f32(0.5) + hG);\r
     // Noise detection.\r
    var nz: f32 = f32(0.25) * bL + f32(0.25) * dL + f32(0.25) * fL + f32(0.25) * hL - eL;\r
    nz = Saturate(abs(nz) * ffxApproximateReciprocalMedium(max3(max3(bL, dL, eL), fL, hL) - min3(min3(bL, dL, eL), fL, hL)));\r
    nz = f32(-0.5) * nz + f32(1.0);\r
     // Min and max of ring.\r
    var mn4R: f32 = min(min3(bR, dR, fR), hR);\r
    var mn4G: f32 = min(min3(bG, dG, fG), hG);\r
    var mn4B: f32 = min(min3(bB, dB, fB), hB);\r
    var mx4R: f32 = max(max3(bR, dR, fR), hR);\r
    var mx4G: f32 = max(max3(bG, dG, fG), hG);\r
    var mx4B: f32 = max(max3(bB, dB, fB), hB);\r
     // Immediate constants for peak range.\r
    var peakC: vec2<f32> = vec2<f32>(1.0, -1.0 * 4.0);\r
     // Limiters, these need to be high precision RCPs.\r
    var hitMinR: f32 = mn4R * rcp(f32(4.0) * mx4R);\r
    var hitMinG: f32 = mn4G * rcp(f32(4.0) * mx4G);\r
    var hitMinB: f32 = mn4B * rcp(f32(4.0) * mx4B);\r
    var hitMaxR: f32 = (peakC.x - mx4R) * rcp(f32(4.0) * mn4R + peakC.y);\r
    var hitMaxG: f32 = (peakC.x - mx4G) * rcp(f32(4.0) * mn4G + peakC.y);\r
    var hitMaxB: f32 = (peakC.x - mx4B) * rcp(f32(4.0) * mn4B + peakC.y);\r
    var lobeR: f32 = max(-hitMinR, hitMaxR);\r
    var lobeG: f32 = max(-hitMinG, hitMaxG);\r
    var lobeB: f32 = max(-hitMinB, hitMaxB);\r
    var lobe: f32 = max(f32(-FSR_RCAS_LIMIT), min(max3(lobeR, lobeG, lobeB), f32(0.0))) * f32(con.x);\r
 // Apply noise removal.\r
//#ifdef FSR_RCAS_DENOISE\r
    lobe *= nz;\r
//#endif  {   // Resolve, which needs the medium precision rcp approximation to avoid visible tonality changes.\r
    let rcpL: f32 = ffxApproximateReciprocalMedium(f32(4.0) * lobe + f32(1.0));\r
    *pixR = (lobe * bR + lobe * dR + lobe * hR + lobe * fR + eR) * rcpL;\r
    *pixG = (lobe * bG + lobe * dG + lobe * hG + lobe * fG + eG) * rcpL;\r
    *pixB = (lobe * bB + lobe * dB + lobe * hB + lobe * fB + eB) * rcpL;\r
    return;\r
}\r
fn CurrFilter(pos: vec2<i32>) {\r
    var cx: f32 = 0;\r
    var cy: f32 = 0;\r
    var cz: f32 = 0;\r
    FsrRcasF(&(cx), &(cy), &(cz), vec2<u32>(pos), RCASConfig());\r
    var c: vec3<f32> = vec3<f32>(cx, cy, cz);\r
    c = UnprepareRgb(c, Exposure());\r
    eUpscaledOutput(pos, c);\r
}\r
// fn RCAS(RLocalThreadId: vec3<u32>, WorkGroupId: vec3<u32>, Dtid: vec3<u32>) {\r
//     // Do remapping o local xy in workgroup for a more PS-like swizzle pattern.  \r
//     var gxy: vec2<i32> = ffxRemapForQuad(LocalThreadId.x) + vec2<i32>(WorkGroupId.x * 16, WorkGroupId.y * 16);\r
//     CurrFilter(vec2<i32>(gxy));\r
//     gxy.x += 8u;\r
//     CurrFilter(vec2<i32>(gxy));\r
//     gxy.y += 8u;\r
//     CurrFilter(vec2<i32>(gxy));\r
//     gxy.x -= 8u;\r
//     CurrFilter(vec2<i32>(gxy));\r
// }\r
\r
@compute @workgroup_size(8, 8, 1)\r
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3u, @builtin(workgroup_id) WorkgroupID: vec3u, @builtin(local_invocation_id) LocalInvocationID: vec3u) {\r
    let screen_size: vec2<i32> = DisplaySize();\r
    let screen_pos: vec2<i32> = vec2<i32>(GlobalInvocationID.xy);\r
    // globalInvocationID = vec3<i32>(GlobalInvocationID);\r
    // workgroupID = vec3<i32>(WorkgroupID);\r
    // localInvocationID = vec3<i32>(LocalInvocationID);\r
    //invokePreload(vec2i(GlobalInvocationID.xy), vec2i(LocalInvocationID.xy));\r
    if !IsOnScreen(screen_pos, screen_size) {\r
        let zlinear = zNear * zFar / (zFar + 0 * (zNear - zFar));\r
        return;\r
    }\r
    let origin_size: vec2<i32> = RenderSize();\r
    let scale_ratio: f32 = f32(screen_size.x) / f32(origin_size.x);\r
    let origin_pos: vec2<i32> = vec2<i32>(vec2<f32>(screen_pos) / scale_ratio);\r
\r
    var gxy: vec2<i32> = screen_pos;\r
    //textureStore(currentDisplay, screen_pos, vec4<f32>(textureLoad(rawDisplay, screen_pos, 0).xyz, 1));\r
    CurrFilter(vec2<i32>(gxy));\r
    // gxy.x += 8;\r
    // CurrFilter(vec2<i32>(gxy));\r
    // gxy.y += 8;\r
    // CurrFilter(vec2<i32>(gxy));\r
    // gxy.x -= 8;\r
    // CurrFilter(vec2<i32>(gxy));\r
} \r
            `,ta=`struct Camera {\r
    world: mat4x4<f32>,\r
    projInv: mat4x4<f32>,\r
    VPMat: mat4x4<f32>,\r
    lastVPMat: mat4x4<f32>,\r
};\r
\r
struct lanczosInfo {\r
    res: vec4<f32>,\r
    weight: f32,\r
};\r
\r
struct FetchedBicubicSamples {\r
     fColor00: vec4<f32>,\r
     fColor10: vec4<f32>,\r
     fColor20: vec4<f32>,\r
     fColor30: vec4<f32>,\r
\r
     fColor01: vec4<f32>,\r
     fColor11: vec4<f32>,\r
     fColor21: vec4<f32>,\r
     fColor31: vec4<f32>,\r
\r
     fColor02: vec4<f32>,\r
     fColor12: vec4<f32>,\r
     fColor22: vec4<f32>,\r
     fColor32: vec4<f32>,\r
\r
     fColor03: vec4<f32>,\r
     fColor13: vec4<f32>,\r
     fColor23: vec4<f32>,\r
     fColor33: vec4<f32>,\r
};\r
\r
struct AccumulationPassCommonParams {\r
    iPxHrPos: vec2<i32>,\r
    fHrUv: vec2<f32> ,\r
    fLrUv_HwSampler: vec2<f32>,\r
    fMotionVector: vec2<f32>,\r
    fReprojectedHrUv: vec2<f32>,\r
    fHrVelocity: f32,\r
    fDepthClipFactor: f32,\r
    fDilatedReactiveFactor: f32,\r
    fAccumulationMask: f32,\r
    bIsResetFrame: bool,\r
    bIsExistingSample: bool,\r
    bIsNewSample: bool,\r
};\r
\r
struct RectificationBox {\r
    boxCenter: vec3<f32>,\r
    boxVec: vec3<f32>,\r
    aabbMin: vec3<f32>,\r
    aabbMax: vec3<f32>,\r
    fBoxCenterWeight: f32,\r
};\r
\r
struct LockState {\r
    NewLock: bool, //Set for both unique new and re-locked new\r
    WasLockedPrevFrame: bool, //Set to identify if the pixel was already locked (relock)\r
};\r
\r
\r
struct BilinearSamplingData {\r
    iOffsets: array<vec2<i32>,4>,\r
    fWeights: array<f32,4>,\r
    iBasePos: vec2<i32>,\r
};\r
\r
\r
\r
\r
\r
\r
\r
override zNear: f32 = 0.01;\r
override zFar: f32 = 50.0;\r
override _displayWidth:i32 = 0;\r
override _displayHeight:i32 = 0;\r
override _renderWidth:i32 = 0;\r
override _renderHeight:i32 = 0;\r
\r
\r
const BATCH_SIZE:i32 =8;\r
const enCache:bool=true;\r
const showWeight:bool=true;\r
const fSharpness:f32=0.5;\r
const GROUP_SIZE:u32 =  8;\r
const FSR_RCAS_DENOISE:u32= 1;\r
const LOCK_TEMPORAL_LUMA:i32=1;\r
const LOCK_LIFETIME_REMAINING:i32=0;\r
const FSR_RCAS_LIMIT:f32= (0.25 - (1.0 / 16.0));\r
const PI:f32 = 3.1415926;\r
const FP16_MIN = 6.10e-05;\r
const FP16_MAX = 65504.0;\r
const FLT_EPSILON=1.1920928955078125e-7;\r
const EPSILON = 1e-06;\r
const TONEMAP_EPSILON = 1.0 / FP16_MAX;\r
const FLT_MAX = 3.402823466e+38;\r
const FLT_MIN = 1.175494351e-38; \r
const MinDepthSep:f32=0.1;\r
const fReconstructedDepthBilinearWeightThreshold:f32 = 0.01;\r
const DepthClipBaseScale = 4.0;\r
const fReletructedDepthBilinearWeightThreshold:f32=0.01;\r
// Accumulation\r
const  fUpsampleLanczosWeightScale:f32 = 1.0 / 12.0;\r
const  fMaxAccumulationLanczosWeight:f32 = 1.0;\r
const  fAverageLanczosWeightPerFrame:f32 = 0.74 * fUpsampleLanczosWeightScale; // Average lanczos weight for jitter accumulated samples\r
const  fAccumulationMaxOnMotion:f32 = 3.0 * fUpsampleLanczosWeightScale;\r
// Auto exposure\r
const  resetAutoExposureAverageSmoothing:f32 = 100000000;\r
const fExposure:f32=1.0;\r
const fPreExposure:f32=1.0;\r
\r
\r
\r
\r
fn Lanczos2NoClamp(x: f32) -> f32 {\r
    if abs(x) < EPSILON {\r
        return 1;\r
    } else {\r
        return (sin(PI * x) / (PI * x)) * (sin(0.5 * PI * x) / (0.5 * PI * x));\r
    }\r
}\r
fn Lanczos2_s(x: f32) -> f32 {\r
    let y = (min(abs(x), 2.0));\r
    return Lanczos2NoClamp(y);\r
}\r
// fn Lanczos2_v(fColor0: vec4<f32>, fColor1: vec4<f32>, fColor2: vec4<f32>, fColor3: vec4<f32>, t: f32) -> vec4<f32> {\r
//     let fWeight0: f32 = Lanczos2_s(-1 - t);\r
//     let fWeight1: f32 = Lanczos2_s(-0 - t);\r
//     let fWeight2: f32 = Lanczos2_s(1.0 - t);\r
//     let fWeight3: f32 = Lanczos2_s(2.0 - t);\r
//     return (fWeight0 * fColor0 + fWeight1 * fColor1 + fWeight2 * fColor2 + fWeight3 * fColor3) / (fWeight0 + fWeight1 + fWeight2 + fWeight3);\r
// }\r
fn Lanczos2_v(fColor0: vec4<f32>, fColor1: vec4<f32>, fColor2: vec4<f32>, fColor3: vec4<f32>, t: f32) -> vec4<f32> {\r
    let fWeight0: f32 = Lanczos2_s(-0.5 - t);\r
    let fWeight1: f32 = Lanczos2_s(0.5 - t);\r
    let fWeight2: f32 = Lanczos2_s(1.5 - t);\r
    let fWeight3: f32 = Lanczos2_s(2.5 - t);\r
    return (fWeight0 * fColor0 + fWeight1 * fColor1 + fWeight2 * fColor2 + fWeight3 * fColor3) / (fWeight0 + fWeight1 + fWeight2 + fWeight3);\r
}\r
fn Lanczos2(Samples: FetchedBicubicSamples, fPxFrac: vec2<f32>) -> vec4<f32> {\r
    let fColorX0: vec4<f32> = Lanczos2_v(Samples.fColor00, Samples.fColor10, Samples.fColor20, Samples.fColor30, fPxFrac.x);\r
    let fColorX1: vec4<f32> = Lanczos2_v(Samples.fColor01, Samples.fColor11, Samples.fColor21, Samples.fColor31, fPxFrac.x);\r
    let fColorX2: vec4<f32> = Lanczos2_v(Samples.fColor02, Samples.fColor12, Samples.fColor22, Samples.fColor32, fPxFrac.x);\r
    let fColorX3: vec4<f32> = Lanczos2_v(Samples.fColor03, Samples.fColor13, Samples.fColor23, Samples.fColor33, fPxFrac.x);\r
    var fColorXY: vec4<f32> = Lanczos2_v(fColorX0, fColorX1, fColorX2, fColorX3, fPxFrac.y);\r
\r
    // Deringing\r
\r
    // TODO: only use 4 by checking jitter\r
    let  iDeringingSampleCount: i32 = 4;\r
    let  fDeringingSamples: array<vec4<f32>,4> = array<vec4<f32>,4>(\r
        Samples.fColor11, Samples.fColor21,\r
        Samples.fColor12, Samples.fColor22,\r
    );\r
\r
    var fDeringingMin = fDeringingSamples[0];\r
    var fDeringingMax = fDeringingSamples[0];\r
\r
    for (var iSampleIndex: i32 = 1; iSampleIndex < iDeringingSampleCount; iSampleIndex += 1) {\r
\r
        fDeringingMin = min(fDeringingMin, fDeringingSamples[iSampleIndex]);\r
        fDeringingMax = max(fDeringingMax, fDeringingSamples[iSampleIndex]);\r
    }\r
\r
    fColorXY = clamp(fColorXY, fDeringingMin, fDeringingMax);\r
\r
    return fColorXY;\r
}\r
// FSR1 lanczos approximation. Input is x*x and must be <= 4.\r
fn Lanczos2ApproxSqNoClamp(x2: f32) -> f32 {\r
    let a: f32 = (2.0 / 5.0) * x2 - 1;\r
    let b: f32 = (1.0 / 4.0) * x2 - 1;\r
    return ((25.0 / 16.0) * a * a - (25.0 / 16.0 - 1)) * (b * b);\r
}\r
fn Lanczos2ApproxSq(x2: f32) -> f32 {\r
    let y2 = min(x2, 4.0);\r
    return Lanczos2ApproxSqNoClamp(y2);\r
}\r
fn Lanczos2ApproxNoClamp(x: f32) -> f32 {\r
    return Lanczos2ApproxSqNoClamp(x * x);\r
}\r
fn Lanczos2Approx(x: f32) -> f32 {\r
    return Lanczos2ApproxSq(x * x);\r
}\r
fn GetBilinearSamplingData(fUv: vec2<f32>, iSize: vec2<i32>) -> BilinearSamplingData {\r
    var data: BilinearSamplingData = BilinearSamplingData();\r
\r
    let fPxSample: vec2<f32> = (fUv * vec2<f32>(iSize)) - vec2<f32>(0.5, 0.5);\r
    data.iBasePos = vec2<i32>(floor(fPxSample));\r
    let fPxFrac: vec2<f32> = fract(fPxSample);\r
\r
    data.iOffsets[0] = vec2<i32>(0, 0);\r
    data.iOffsets[1] = vec2<i32>(1, 0);\r
    data.iOffsets[2] = vec2<i32>(0, 1);\r
    data.iOffsets[3] = vec2<i32>(1, 1);\r
\r
    data.fWeights[0] = (1 - fPxFrac.x) * (1 - fPxFrac.y);\r
    data.fWeights[1] = (fPxFrac.x) * (1 - fPxFrac.y);\r
    data.fWeights[2] = (1 - fPxFrac.x) * (fPxFrac.y);\r
    data.fWeights[3] = (fPxFrac.x) * (fPxFrac.y);\r
\r
    return data;\r
}\r
\r
\r
fn DisplaySize() -> vec2<i32> {\r
    return vec2<i32>(_displayWidth, _displayHeight);\r
}\r
fn RenderSize() -> vec2<i32> {\r
    //let origin_size: vec2<i32> = vec2<i32>(_renderWidth, _renderHeight);\r
    return vec2<i32>(_renderWidth, _renderHeight);\r
}\r
fn LumaMipLevelToUse() -> i32 {\r
    return 1;\r
}\r
fn LumaMipDimensions() -> vec2<i32> {\r
    return RenderSize() / LumaMipLevelToUse();\r
}\r
fn IsOnScreen(pos: vec2<i32>, size: vec2<i32>) -> bool {\r
    return pos.x < size.x && pos.y < size.y;\r
}\r
fn MaxRenderSize() -> vec2<i32> {\r
    let screen_size: vec2<i32> = vec2<i32>(_displayWidth, _displayHeight);\r
    //return screen_size;\r
    return vec2<i32>(_renderWidth, _renderHeight);\r
}\r
fn DownscaleFactor() -> vec2<f32> {\r
    return vec2<f32>(f32(_renderWidth) / f32(_displayWidth), f32(_renderHeight) / f32(_displayHeight));\r
}\r
fn Jitter() -> vec2<f32> {\r
    return sampJitter;\r
    //return vec2<f32>(0, 0);\r
}\r
fn JitterSequenceLength() -> f32 {\r
    return 32;\r
}\r
fn Exposure() -> f32 {\r
    return fExposure;\r
}\r
fn PreExposure() -> f32 {\r
    return fPreExposure;\r
}\r
fn PrepareRgb(fRgb: vec3<f32>, fExposure: f32, fPreExposure: f32) -> vec3<f32> {\r
    var rgb: vec3<f32> = fRgb;\r
    rgb = rgb / Broadcast3(fPreExposure);\r
    rgb = rgb * Broadcast3(fExposure);\r
\r
    rgb = clamp(rgb, Broadcast3(0.0), Broadcast3(65504.0));\r
\r
    return rgb;\r
}\r
\r
fn UnprepareRgb(fRgb: vec3<f32>, fExposure: f32) -> vec3<f32> {\r
    var rgb: vec3<f32> = fRgb;\r
    rgb = rgb / Broadcast3(fExposure);\r
    rgb = rgb * Broadcast3(fPreExposure);\r
    return rgb;\r
}\r
\r
fn Broadcast2(value: f32) -> vec2<f32> {\r
    return vec2<f32>(value, value);\r
}\r
fn Broadcast3(value: f32) -> vec3<f32> {\r
    return vec3<f32>(value, value, value);\r
}\r
fn Broadcast4(value: f32) -> vec4<f32> {\r
    return vec4<f32>(value, value, value, value);\r
}\r
fn Saturate(a: f32) -> f32 {\r
    return min(1.0, max(0.0, a));\r
}\r
fn Saturate2(x: vec2<f32>) -> vec2<f32> {\r
    return clamp(x, Broadcast2(0.0), Broadcast2(1.0));\r
}\r
fn Saturate3(x: vec3<f32>) -> vec3<f32> {\r
    return clamp(x, Broadcast3(0.0), Broadcast3(1.0));\r
}\r
fn Saturate4(x: vec4<f32>) -> vec4<f32> {\r
    return clamp(x, Broadcast4(0.0), Broadcast4(1.0));\r
}\r
fn IsUvInside(fUv: vec2<f32>) -> bool {\r
    return (fUv.x >= 0.0 && fUv.x <= 1.0) && (fUv.y >= 0.0 && fUv.y <= 1.0);\r
}\r
fn ClampUv(fUv: vec2<f32>, iTextureSize: vec2<i32>, iResourceSize: vec2<i32>) -> vec2<f32> {\r
    let  fSampleLocation: vec2<f32> = fUv * vec2<f32>(iTextureSize);\r
    let  fClampedLocation: vec2<f32> = max(vec2<f32>(0.5, 0.5), min(fSampleLocation, vec2<f32>(iTextureSize) - vec2<f32>(0.5, 0.5)));\r
    let  fClampedUv: vec2<f32> = fClampedLocation / vec2<f32>(iResourceSize);\r
    return fClampedUv;\r
}\r
fn ClampLoad(iPxSample: vec2<i32>, iPxOffset: vec2<i32>, iTextureSize: vec2<i32>) -> vec2<i32> {\r
    var result: vec2<i32> = iPxSample + iPxOffset;\r
    if iPxOffset.x < 0 {\r
        result.x = max(result.x, 0);\r
    } else if iPxOffset.x > 0 {\r
        result.x = min(result.x, iTextureSize.x - 1);\r
    }\r
    if iPxOffset.y < 0 {\r
        result.y = max(result.y, 0);\r
    } else if iPxOffset.y > 0 {\r
        result.y = min(result.y, iTextureSize.y - 1);\r
    }\r
    return result;\r
\r
    // return Med3(iPxSample + iPxOffset, Int32x2(0, 0), iTextureSize - Int32x2(1, 1));\r
}\r
fn ClampCoord(iPxSample: vec2<i32>, iPxOffset: vec2<i32>, iTextureSize: vec2<i32>) -> vec2<i32> {\r
    var result: vec2<i32> = iPxSample + iPxOffset;\r
    if iPxOffset.x < 0 {\r
        result.x = max(result.x, 0);\r
    }\r
    if iPxOffset.x > 0 {\r
        result.x = min(result.x, iTextureSize.x - 1);\r
    }\r
    if iPxOffset.x < 0 {\r
        result.y = max(result.y, 0);\r
    }\r
    if iPxOffset.x > 0 {\r
        result.y = min(result.y, iTextureSize.y - 1);\r
    }\r
    return result;\r
}\r
fn min3(a: f32, b: f32, c: f32) -> f32 {\r
    return min(min(a, b), c);\r
}\r
fn max3(a: f32, b: f32, c: f32) -> f32 {\r
    return max(max(a, b), c);\r
}\r
fn rcp(a: f32) -> f32 {\r
    return f32(1.0) / a;\r
}\r
\r
fn MinDividedByMax(v0: f32, v1: f32) -> f32 {\r
    var m: f32 = max(v0, v1);\r
    if m != 0 {\r
        return min(v0, v1) / m;\r
    }\r
    return 0;\r
}\r
fn RGBToYCoCg(fRgb: vec3<f32>) -> vec3<f32> {\r
    let fYCoCg: vec3<f32> = vec3<f32>(\r
        0.25 * fRgb.x + 0.5 * fRgb.y + 0.25 * fRgb.z,\r
        0.5 * fRgb.x - 0.5 * fRgb.z,\r
        -0.25 * fRgb.x + 0.5 * fRgb.y - 0.25 * fRgb.z\r
    );\r
    return fYCoCg;\r
}\r
fn YCoCgToRGB(fYCoCg: vec3<f32>) -> vec3<f32> {\r
    let fRGB: vec3<f32> = vec3<f32>(\r
        fYCoCg.x + fYCoCg.y - fYCoCg.z,\r
        fYCoCg.x + fYCoCg.z,\r
        fYCoCg.x - fYCoCg.y - fYCoCg.z,\r
    );\r
    // 执行矩阵乘法，将 YCoCg 转换为 RGB\r
    return fRGB;\r
}\r
fn RGBToLuma(fLinearRgb: vec3<f32>) -> f32 {\r
    return dot(fLinearRgb, vec3<f32>(0.2126, 0.7152, 0.0722));\r
}\r
\r
fn RGBToPerceivedLuma(fLinearRgb: vec3<f32>) -> f32 {\r
    var fLuminance: f32 = RGBToLuma(fLinearRgb);\r
\r
    var fPercievedLuminance: f32 = 0;\r
    if fLuminance <= 216.0 / 24389.0 {\r
        fPercievedLuminance = fLuminance * (24389.0 / 27.0);\r
    } else {\r
        fPercievedLuminance = pow(fLuminance, 1.0 / 3.0) * 116.0 - 16.0;\r
    }\r
\r
    return fPercievedLuminance * 0.01;\r
}\r
\r
fn ViewSpaceToMetersFactor() -> f32 {\r
    //return fViewSpaceToMetersFactor;\r
    return 1.0;\r
}\r
fn ComputeNdc(fPxPos: vec2<f32>, iSize: vec2<i32>) -> vec2<f32> {\r
    return fPxPos / vec2<f32>(iSize) * vec2<f32>(2.0, -2.0) + vec2<f32>(-1.0, 1.0);\r
}\r
fn DeviceToViewSpaceTransformFactors() -> vec4<f32> {\r
    //return cbFSR2.fDeviceToViewDepth;\r
    //return Broadcast4(1.0);\r
\r
    let fMin: f32 = min(zFar, zNear);\r
    let fMax: f32 = max(zFar, zNear);\r
    let fQ: f32 = fMax / (fMin - fMax);\r
    let d: f32 = -1.0; // for clarity\r
    let matrix_elem_c: vec2<f32> = vec2f(fQ, -1.0 - FLT_EPSILON);\r
    let matrix_elem_e: vec2<f32> = vec2f(fQ * fMin, -fMin - FLT_EPSILON);\r
\r
    var fDeviceToViewDepth: vec4<f32> = vec4<f32>(0, 0, 0, 0);\r
    fDeviceToViewDepth[0] = d * matrix_elem_c[0];\r
    fDeviceToViewDepth[1] = d * matrix_elem_e[0];\r
\r
    // revert x and y coords\r
    let aspect = f32(_renderWidth) / f32(_renderHeight);\r
    let cameraFovAngleVertical: f32 = PI / 3;\r
    let cotHalfFovY = cos(0.5 * cameraFovAngleVertical) / sin(0.5 * cameraFovAngleVertical);\r
    let a = cotHalfFovY / aspect;\r
    let b = cotHalfFovY;\r
\r
    fDeviceToViewDepth[2] = (1.0 / a);\r
    fDeviceToViewDepth[3] = (1.0 / b);\r
\r
    return fDeviceToViewDepth;\r
}\r
fn GetViewSpaceDepth(fDeviceDepth: f32) -> f32 {\r
    // let fDeviceToViewDepth: vec4<f32> = DeviceToViewSpaceTransformFactors();\r
    // return (fDeviceToViewDepth[1] / (fDeviceDepth - fDeviceToViewDepth[0]));\r
    let zlinear = zNear * zFar / (zFar + fDeviceDepth * (zNear - zFar));\r
    return zlinear;\r
}\r
\r
fn GetViewSpacePosition(iViewportPos: vec2<i32>, iViewportSize: vec2<i32>, fDeviceDepth: f32) -> vec3<f32> {\r
    let fDeviceToViewDepth: vec4<f32> = DeviceToViewSpaceTransformFactors();\r
\r
    let Z: f32 = GetViewSpaceDepth(fDeviceDepth);\r
\r
    let fNdcPos: vec2<f32> = ComputeNdc(vec2<f32>(iViewportPos), iViewportSize);\r
    let X: f32 = fDeviceToViewDepth[2] * fNdcPos.x * Z;\r
    let Y: f32 = fDeviceToViewDepth[3] * fNdcPos.y * Z;\r
\r
    return vec3<f32>(X, Y, Z);\r
}\r
fn GetMaxDistanceInMeters() -> f32 {\r
\r
    //return GetViewSpaceDepth(0.0) * ViewSpaceToMetersFactor();\r
\r
    return GetViewSpaceDepth(1.0) * ViewSpaceToMetersFactor();\r
}\r
fn GetViewSpaceDepthInMeters(fDeviceDepth: f32) -> f32 {\r
    return GetViewSpaceDepth(fDeviceDepth) * ViewSpaceToMetersFactor();\r
}\r
\r
\r
fn ComputeHrPosFromLrPos(iPxLrPos: vec2<i32>) -> vec2<i32> {\r
    let fSrcJitteredPos: vec2<f32> = vec2<f32>(iPxLrPos) + 0.5 - Jitter();\r
    let fLrPosInHr: vec2<f32> = (fSrcJitteredPos / vec2<f32>(RenderSize())) * vec2<f32>(DisplaySize());\r
    let iPxHrPos: vec2<i32> = vec2<i32>(floor(fLrPosInHr));\r
    return (iPxHrPos);\r
}\r
\r
// fn readColor(buffer: ptr<storage,array<vec2u>,read_write>, iPxPos: vec2<i32>) -> vec3f {\r
//     let idx: u32 = u32(iPxPos.y * iPxPos.x + iPxPos.x);\r
//     let color = vec3f(unpack2x16float(buffer[idx].x).xy, unpack2x16float(buffer[idx].y).x);\r
//     return color;\r
// }\r
fn ACESToneMapping(color: vec3f, adapted_lum: f32) -> vec3f {\r
    const A = 2.51;\r
    const B = 0.03;\r
    const C = 2.43;\r
    const D = 0.59;\r
    const E = 0.14;\r
    let ret = color * adapted_lum;\r
    return (ret * (A * ret + B)) / (ret * (C * ret + D) + E);\r
    // return color;\r
}`,ra=`\r
struct BilinearSamplingData {\r
    iOffsets: array<vec2<i32>,4>,\r
    fWeights: array<f32,4>,\r
    iBasePos: vec2<i32>,\r
};\r
\r
// @group(0) @binding(0) var rawColor : texture_2d<f32>;\r
// @group(0) @binding(1) var FXAAcolor  :texture_storage_2d<rgba16float, write> ;\r
@group(0) @binding(0) var<storage, read_write> rawColor : array<vec2u>;\r
@group(0) @binding(1) var<storage, read_write>  FXAAcolor : array<vec2u>;\r
\r
\r
\r
override _renderWidth:i32 = 0;\r
override _renderHeight:i32 = 0;\r
const EDGE_THRESHOLD_MIN = 0.0312;\r
const EDGE_THRESHOLD_MAX = 0.125;\r
const SUBPIXEL_QUALITY = 0.75;\r
const ITERATIONS=12;\r
\r
\r
\r
fn RenderSize() -> vec2<i32> {\r
    return vec2<i32>(_renderWidth, _renderHeight);\r
}\r
\r
fn InverseScreenSize() -> vec2<f32> {\r
    return 1.0 / vec2<f32>(f32(_renderWidth), f32(_renderHeight));\r
}\r
fn IsOnScreen(pos: vec2<i32>, size: vec2<i32>) -> bool {\r
    return pos.x < size.x && pos.y < size.y;\r
}\r
\r
fn RGBToLuma(fLinearRgb: vec3<f32>) -> f32 {\r
    return dot(fLinearRgb, vec3<f32>(0.2126, 0.7152, 0.0722));\r
}\r
fn GetBilinearSamplingData(fUv: vec2<f32>, iSize: vec2<i32>) -> BilinearSamplingData {\r
    var data: BilinearSamplingData = BilinearSamplingData();\r
\r
    let fPxSample: vec2<f32> = (fUv * vec2<f32>(iSize)) - vec2<f32>(0.5, 0.5);\r
    data.iBasePos = vec2<i32>(floor(fPxSample));\r
    let fPxFrac: vec2<f32> = fract(fPxSample);\r
\r
    data.iOffsets[0] = vec2<i32>(0, 0);\r
    data.iOffsets[1] = vec2<i32>(1, 0);\r
    data.iOffsets[2] = vec2<i32>(0, 1);\r
    data.iOffsets[3] = vec2<i32>(1, 1);\r
\r
    data.fWeights[0] = (1 - fPxFrac.x) * (1 - fPxFrac.y);\r
    data.fWeights[1] = (fPxFrac.x) * (1 - fPxFrac.y);\r
    data.fWeights[2] = (1 - fPxFrac.x) * (fPxFrac.y);\r
    data.fWeights[3] = (fPxFrac.x) * (fPxFrac.y);\r
\r
    return data;\r
}\r
fn BilinearTextureSampling(fUv: vec2<f32>) -> vec3<f32> {\r
    let bilinearInfo: BilinearSamplingData = GetBilinearSamplingData(fUv, RenderSize());\r
    var fColor: vec3<f32> = vec3<f32>(0, 0, 0);\r
    var fWeightSum: f32 = 0.0;\r
    for (var iSampleIndex: i32 = 0; iSampleIndex < 4; iSampleIndex += 1) {\r
\r
        let  iOffset: vec2<i32> = bilinearInfo.iOffsets[iSampleIndex];\r
        let  iSamplePos: vec2<i32> = bilinearInfo.iBasePos + iOffset;\r
\r
        if IsOnScreen(iSamplePos, RenderSize()) {\r
            let  fWeight: f32 = bilinearInfo.fWeights[iSampleIndex];\r
\r
            let  fColorSample: vec3<f32> = LoadInputColor(iSamplePos);\r
\r
            fColor += fColorSample * fWeight;\r
            fWeightSum += fWeight;\r
        }\r
    }\r
    return fColor / fWeightSum;\r
}\r
fn QUALITY(i: i32) -> f32 {\r
    return 1.0;\r
    \r
    //const QUALITY:array<f32,12>=array<f32,12>(1.5, 2.0, 2.0, 2.0, 2.0, 4.0, 8.0);\r
}\r
// fn LoadInputColor(iPxPos: vec2<i32>) -> vec3<f32> {\r
//     return textureLoad(rawColor, iPxPos, 0).xyz;\r
// }\r
fn LoadInputColor(iPxPos: vec2<i32>) -> vec3<f32> {\r
    //return textureLoad(rawColor, iPxPos, 0).xyz;\r
    let idx: i32 = iPxPos.y * _renderWidth + iPxPos.x;\r
    let data = rawColor[idx];\r
    let color: vec3<f32> = vec3f(unpack2x16float(data.x).xy, unpack2x16float(data.y).x);\r
\r
    return color;\r
}\r
fn StoreFXAAColor(iPxPos: vec2<i32>, fcolor: vec3<f32>) {\r
    let idx: u32 = u32(iPxPos.y) * u32(_renderWidth) + u32(iPxPos.x);\r
    FXAAcolor[idx] = vec2<u32>(pack2x16float(fcolor.xy), pack2x16float(fcolor.zz));\r
    //textureStore(FXAAcolor, iPxPos, vec4<f32>(fcolor,1));\r
}\r
\r
fn fxaa(iPxPos: vec2<i32>) {\r
    var colorCenter: vec3<f32> = LoadInputColor(iPxPos);\r
    let inverseScreenSize = InverseScreenSize();\r
    let fCenterUV: vec2<f32> = (vec2<f32>(iPxPos) + 0.5) / vec2<f32>(RenderSize());\r
  // Luma at the current fragment\r
    var lumaCenter: f32 = RGBToLuma(colorCenter);\r
\r
  // Luma at the four direct neighbours of the current fragment.\r
    var lumaDown: f32 = RGBToLuma(LoadInputColor(iPxPos + vec2<i32>(0, -1)).rgb);\r
    var lumaUp: f32 = RGBToLuma(LoadInputColor(iPxPos + vec2<i32>(0, 1)).rgb);\r
    var lumaLeft: f32 = RGBToLuma(LoadInputColor(iPxPos + vec2<i32>(-1, 0)).rgb);\r
    var lumaRight: f32 = RGBToLuma(LoadInputColor(iPxPos + vec2<i32>(1, 0)).rgb);\r
\r
  // Find the maximum and minimum luma around the current fragment.\r
    var lumaMin: f32 = min(lumaCenter, min(min(lumaDown, lumaUp), min(lumaLeft, lumaRight)));\r
    var lumaMax: f32 = max(lumaCenter, max(max(lumaDown, lumaUp), max(lumaLeft, lumaRight)));\r
\r
  // Compute the delta.\r
    var lumaRange: f32 = lumaMax - lumaMin;\r
\r
  // If the luma variation is lower that a threshold (or if we are in a really dark area), we are not on an edge, don't perform any AA.\r
    if lumaRange < max(EDGE_THRESHOLD_MIN, lumaMax * EDGE_THRESHOLD_MAX) {\r
        StoreFXAAColor(iPxPos, colorCenter);\r
        //StoreFXAAColor(iPxPos, vec3<f32>(0, 0, 0));\r
        return;\r
    }\r
  ///////////////////\r
  // Query the 4 remaining corners lumas.\r
    var lumaDownLeft: f32 = RGBToLuma(LoadInputColor(iPxPos + vec2<i32>(-1, -1)).rgb);\r
    var lumaUpRight: f32 = RGBToLuma(LoadInputColor(iPxPos + vec2<i32>(1, 1)).rgb);\r
    var lumaUpLeft: f32 = RGBToLuma(LoadInputColor(iPxPos + vec2<i32>(-1, 1)).rgb);\r
    var lumaDownRight: f32 = RGBToLuma(LoadInputColor(iPxPos + vec2<i32>(1, -1)).rgb);\r
\r
  // Combine the four edges lumas (using intermediary variables for future computations with the same values).\r
    var lumaDownUp: f32 = lumaDown + lumaUp;\r
    var lumaLeftRight: f32 = lumaLeft + lumaRight;\r
\r
  // Same for corners\r
    var lumaLeftCorners: f32 = lumaDownLeft + lumaUpLeft;\r
    var lumaDownCorners: f32 = lumaDownLeft + lumaDownRight;\r
    var lumaRightCorners: f32 = lumaDownRight + lumaUpRight;\r
    var lumaUpCorners: f32 = lumaUpRight + lumaUpLeft;\r
\r
  // Compute an estimation of the gradient along the horizontal and vertical axis.\r
    var edgeHorizontal: f32 = abs(-2.0 * lumaLeft + lumaLeftCorners) + abs(-2.0 * lumaCenter + lumaDownUp) * 2.0 + abs(-2.0 * lumaRight + lumaRightCorners);\r
    var edgeVertical: f32 = abs(-2.0 * lumaUp + lumaUpCorners) + abs(-2.0 * lumaCenter + lumaLeftRight) * 2.0 + abs(-2.0 * lumaDown + lumaDownCorners);\r
\r
  // Is the local edge horizontal or vertical ?\r
    var isHorizontal: bool = (edgeHorizontal >= edgeVertical);\r
\r
  //////////////////\r
  // Select the two neighboring texels lumas in the opposite direction to the local edge.\r
    var luma1: f32 = lumaLeft;\r
    if isHorizontal {\r
        luma1 = lumaDown;\r
    }\r
    var luma2: f32 = lumaRight;\r
    if isHorizontal {\r
        luma1 = lumaUp;\r
    }\r
  // Compute gradients in this direction.\r
    var gradient1: f32 = luma1 - lumaCenter;\r
    var gradient2: f32 = luma2 - lumaCenter;\r
\r
  // Which direction is the steepest ?\r
    var is1Steepest: bool = abs(gradient1) >= abs(gradient2);\r
\r
  // Gradient in the corresponding direction, normalized.\r
    var gradientScaled: f32 = 0.25 * max(abs(gradient1), abs(gradient2));\r
\r
\r
\r
  // Choose the step size (one pixel) according to the edge direction.\r
    var stepLength: f32 = inverseScreenSize.x;// inverseScreenSize (1.0/width, 1.0/height);\r
    if isHorizontal {\r
        stepLength = inverseScreenSize.y;\r
    }\r
  // Average luma in the correct direction.\r
    var lumaLocalAverage: f32 = 0.0;\r
\r
    if is1Steepest {\r
      // Switch the direction\r
        stepLength = - stepLength;\r
        lumaLocalAverage = 0.5 * (luma1 + lumaCenter);\r
    } else {\r
        lumaLocalAverage = 0.5 * (luma2 + lumaCenter);\r
    }\r
\r
  // Shift UV in the correct direction by half a pixel.\r
    var currentUv: vec2<f32> = fCenterUV;\r
    if isHorizontal {\r
        currentUv.y += stepLength * 0.5;\r
    } else {\r
        currentUv.x += stepLength * 0.5;\r
    }\r
\r
\r
  // Compute offset (for each iteration step) in the right direction.\r
    var offset: vec2<f32> = vec2<f32>(0.0, inverseScreenSize.y);\r
    if isHorizontal {\r
        offset = vec2<f32>(inverseScreenSize.x, 0.0);\r
    }\r
  // Compute UVs to explore on each side of the edge, orthogonally. The QUALITY allows us to step faster.\r
    var uv1: vec2<f32> = currentUv - offset;\r
    var uv2: vec2<f32> = currentUv + offset;\r
\r
  // Read the lumas at both current extremities of the exploration segment, and compute the delta wrt to the local average luma.\r
    var lumaEnd1: f32 = RGBToLuma(BilinearTextureSampling(uv1));\r
    var lumaEnd2: f32 = RGBToLuma(BilinearTextureSampling(uv2));\r
    lumaEnd1 -= lumaLocalAverage;\r
    lumaEnd2 -= lumaLocalAverage;\r
\r
  // If the luma deltas at the current extremities are larger than the local gradient, we have reached the side of the edge.\r
    var reached1: bool = abs(lumaEnd1) >= gradientScaled;\r
    var reached2: bool = abs(lumaEnd2) >= gradientScaled;\r
    var reachedBoth: bool = reached1 && reached2;\r
\r
  // If the side is not reached, we continue to explore in this direction.\r
    if !reached1 {\r
        uv1 -= offset;\r
    }\r
    if !reached2 {\r
        uv2 += offset;\r
    }\r
\r
\r
  /////////////\r
  // If both sides have not been reached, continue to explore.\r
    if !reachedBoth {\r
    // We keep iterating until both extremities of the edge are reached,\r
    // or until the maximum number of iterations (12) is reached. To speed things up, \r
    //we start stepping by an increasing amount of pixels QUALITY(i) \r
    //after the fifth iteration : 1.5, 2.0, 2.0, 2.0, 2.0, 4.0, 8.0.\r
        for (var i = 2; i < ITERATIONS; i += 1) {\r
        // If needed, read luma in 1st direction, compute delta.\r
            if !reached1 {\r
                lumaEnd1 = RGBToLuma(BilinearTextureSampling(uv1));\r
                lumaEnd1 = lumaEnd1 - lumaLocalAverage;\r
            }\r
        // If needed, read luma in opposite direction, compute delta.\r
            if !reached2 {\r
                lumaEnd2 = RGBToLuma(BilinearTextureSampling(uv2));\r
                lumaEnd2 = lumaEnd2 - lumaLocalAverage;\r
            }\r
        // If the luma deltas at the current extremities is larger than the local gradient, we have reached the side of the edge.\r
            reached1 = abs(lumaEnd1) >= gradientScaled;\r
            reached2 = abs(lumaEnd2) >= gradientScaled;\r
            reachedBoth = reached1 && reached2;\r
\r
        // If the side is not reached, we continue to explore in this direction, with a variable quality.\r
            if !reached1 {\r
                uv1 -= offset * QUALITY(i);\r
            }\r
            if !reached2 {\r
                uv2 += offset * QUALITY(i);\r
            }\r
\r
        // If both sides have been reached, stop the exploration.\r
            if reachedBoth { break;}\r
        }\r
    }   \r
\r
\r
  // Compute the distances to each extremity of the edge.\r
\r
\r
    var distance1: f32 = (fCenterUV.y / - uv1.y);\r
    if isHorizontal {\r
        distance1 = (fCenterUV.x - uv1.x);\r
    }\r
\r
    var distance2: f32 = (uv2.y - fCenterUV.y);\r
    if isHorizontal {\r
        distance1 = (uv2.x - fCenterUV.x) ;\r
    }\r
  // In which direction is the extremity of the edge closer ?\r
    var isDirection1: bool = distance1 < distance2;\r
    var distanceFinal: f32 = min(distance1, distance2);\r
\r
  // Length of the edge.\r
    var edgeThickness: f32 = (distance1 + distance2);\r
\r
  // UV offset: read in the direction of the closest side of the edge.\r
    var pixelOffset: f32 = - distanceFinal / edgeThickness + 0.5;\r
\r
  // Is the luma at center smaller than the local average ?\r
    var isLumaCenterSmaller: bool = lumaCenter < lumaLocalAverage;\r
\r
  // If the luma at center is smaller than at its neighbour, the delta luma at each end should be positive (same variation).\r
  // (in the direction of the closer side of the edge.)\r
    var correctVariation: bool = (lumaEnd2 < 0.0) != isLumaCenterSmaller;\r
    if isDirection1 {\r
        correctVariation = (lumaEnd1 < 0.0) != isLumaCenterSmaller;\r
    }\r
\r
\r
  // If the luma variation is incorrect, do not offset.\r
    var finalOffset: f32 = 0.0;\r
    if correctVariation {\r
        finalOffset = pixelOffset;\r
    }\r
\r
\r
\r
  // Sub-pixel shifting\r
  // Full weighted average of the luma over the 3x3 neighborhood.\r
    var lumaAverage: f32 = (1.0 / 12.0) * (2.0 * (lumaDownUp + lumaLeftRight) + lumaLeftCorners + lumaRightCorners);\r
  // Ratio of the delta between the global average and the center luma, over the luma range in the 3x3 neighborhood.\r
    var subPixelOffset1: f32 = clamp(abs(lumaAverage - lumaCenter) / lumaRange, 0.0, 1.0);\r
    var subPixelOffset2: f32 = (-2.0 * subPixelOffset1 + 3.0) * subPixelOffset1 * subPixelOffset1;\r
  // Compute a sub-pixel offset based on this delta.\r
    var subPixelOffsetFinal: f32 = subPixelOffset2 * subPixelOffset2 * SUBPIXEL_QUALITY;\r
\r
  // Pick the biggest of the two offsets.\r
    finalOffset = max(finalOffset, subPixelOffsetFinal);\r
\r
\r
\r
\r
\r
  // Compute the final UV coordinates.\r
    var finalUv: vec2<f32> = fCenterUV;\r
    if isHorizontal {\r
        finalUv.y += finalOffset * stepLength;\r
    } else {\r
        finalUv.x += finalOffset * stepLength;\r
    }\r
\r
  // Read the color at the new UV coordinates, and use it.\r
    var finalColor: vec3<f32> = BilinearTextureSampling(finalUv);\r
\r
    StoreFXAAColor(iPxPos, finalColor);\r
    //StoreFXAAColor(iPxPos, vec3<f32>(0, 0, 0));\r
}\r
\r
\r
@compute @workgroup_size(8, 8, 1)\r
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3<u32>) {\r
    let screen_size: vec2<i32> = RenderSize();\r
    let screen_pos: vec2<i32> = vec2<i32>(GlobalInvocationID.xy);\r
    if !IsOnScreen(screen_pos, screen_size) {\r
        return;\r
    }\r
    fxaa(screen_pos);\r
} `,na=`@group(0) @binding(0) var currentDisplay : texture_storage_2d<displayFormat, write>;\r
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
    return vec3f(1.0) - exp(-color * adapted_lum);\r
    // const A = 2.51;\r
    // const B = 0.03;\r
    // const C = 2.43;\r
    // const D = 0.59;\r
    // const E = 0.14;\r
    // let ret = color * adapted_lum;\r
    // return (ret * (A * ret + B)) / (ret * (C * ret + D) + E);\r
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
}`,ia=(u,e)=>u.replace(/\/\/ #include\s+<(.*?)>;/g,(t,r)=>e[r]);class oa{shaders={"basic.instanced.vert.wgsl":Ps,"position.frag.wgsl":Ms,"compute.position.wgsl":Ts,"utils.wgsl":Rs,"light.wgsl":Bs,"lightUpdate.wgsl":Es,"common.wgsl":Ds,"sampleInit.wgsl":zs,"reservoir.wgsl":ks,"trace.wgsl":Fs,"BSDF.wgsl":Gs,"vBuffer.wgsl":Ls,"rayGen.wgsl":Os,"slopeAABBTest.wgsl":Us,"spatialReuse.wgsl":Ns,"accumulate.wgsl":Hs,"denoiseCommon.wgsl":Vs,"preloadInvoker.wgsl":Ws,"temperalAccum.wgsl":js,"firefly.wgsl":Xs,"filterVariance.wgsl":qs,"atrous.wgsl":Ys,"denoiseAccum.wgsl":Zs,"FSR_common.wgsl":ta,"reconstruct_dilated.wgsl":$s,"depthClip.wgsl":Ks,"lock.wgsl":Js,"display.wgsl":Qs,"racs.wgsl":ea,"FXAA.wgsl":ra,"raw_display.wgsl":na};constructor(){for(const e in this.shaders){let t=0;for(;this.shaders[e].includes("#include");)if(this.shaders[e]=ia(this.shaders[e],this.shaders),t++>10)throw new Error("Too deep include chain in shader: "+e)}}get(e){return this.shaders[e]}}const ee=new oa;class sa{rendering_width;rendering_height;display_width;display_height;FXAA_renderPipeline;FXAA_renderBindGroup;FXAA_renderPipelineLayout;FXAA_renderBindGroupLayout;FXAA_renderBindGroupEntries;reconstruct_dilatedPipeline;reconstruct_dilatedBindGroup;reconstruct_dilatedPipelineLayout;reconstruct_dilatedBindGroupLayout;reconstruct_dilatedBindGroupEntries;depthClipPipeline;depthClipBindGroup;depthClipPipelineLayout;depthClipBindGroupLayout;depthClipBindGroupEntries;lockPipeline;lockBindGroup;lockPipelineLayout;lockBindGroupLayout;lockBindGroupEntries;displayPipeline;displayBindGroup;displayPipelineLayout;displayBindGroupLayout;displayBindGroupEntries;racsPipeline;racsBindGroup;racsPipelineLayout;racsBindGroupLayout;racsBindGroupEntries;rawPipeline;rawBindGroup;rawPipelineLayout;rawBindGroupLayout;bindGroupEntries;rawFrameBuffer;currentAAFrameBuffer;AADisplay;LumaHistory;dilatedDepth;previousDepthTexture;reconstructedPreviousDepth;dilatedMotionVectors;previousDilatedMotionVectors;lockInputLuma;preparedInputColor;newLocks;dilatedReactiveMasks;reactiveMasks;transparencyAndCompositionMasks;lockStatus;rawDisplay;device;motionVec;depthTexture;previousDisplayBuffer;rPreviousDisplayBuffer;wPreviousDisplayBuffer;currentFrameBuffer;previousFrameBuffer;sampler;liner_sampler;camera;FXAA_RENDER=!1;ENABLE_SR=!0;enPreviousDepth=!0;patchSize=8;currentFrameBuffer_bk;FSR_init(e,t,r){this.display_width=e.canvas.width,this.display_height=e.canvas.height,this.rendering_width=Math.floor(e.canvas.width/e.upscaleRatio),this.rendering_height=Math.floor(e.canvas.height/e.upscaleRatio);let n=this.rendering_width,i=this.rendering_height;this.LumaHistory=e.device.createBuffer({size:4*4*e.canvas.width*e.canvas.height,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC}),this.dilatedDepth=e.device.createTexture({size:{width:n,height:i},format:"r32float",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.STORAGE_BINDING}),this.reconstructedPreviousDepth=e.device.createBuffer({size:4*n*i,usage:GPUBufferUsage.STORAGE}),this.dilatedMotionVectors=e.device.createTexture({size:{width:n,height:i},format:"rgba16float",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_SRC}),this.previousDilatedMotionVectors=e.device.createTexture({size:{width:n,height:i},format:"rgba16float",dimension:"2d",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST}),this.lockInputLuma=e.device.createTexture({size:{width:n,height:i},format:"r32float",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.STORAGE_BINDING}),this.preparedInputColor=e.device.createTexture({size:{width:n,height:i},format:"rgba16float",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.STORAGE_BINDING}),this.newLocks=e.device.createTexture({size:{width:n,height:i},format:"r32float",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.STORAGE_BINDING}),this.dilatedReactiveMasks=e.device.createTexture({size:{width:n,height:i},format:"rgba16float",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.STORAGE_BINDING}),this.lockStatus=e.device.createTexture({size:{width:n,height:i},format:"r32float",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.STORAGE_BINDING}),this.rPreviousDisplayBuffer=e.device.createTexture({size:{width:e.canvas.width,height:e.canvas.height},format:"rgba16float",dimension:"2d",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST}),this.wPreviousDisplayBuffer=e.device.createTexture({size:{width:e.canvas.width,height:e.canvas.height},format:"rgba16float",dimension:"2d",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.COPY_SRC}),this.rawDisplay=e.device.createTexture({size:{width:e.canvas.width,height:e.canvas.height},format:"rgba16float",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.STORAGE_BINDING}),this.AADisplay=e.device.createTexture({size:{width:e.canvas.width,height:e.canvas.height},format:"rgba16float",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.STORAGE_BINDING}),this.currentAAFrameBuffer=e.device.createBuffer({size:2*4*n*i,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC})}FXAA_PASS_init(e,t,r){this.ENABLE_SR&&this.FXAA_RENDER?this.currentFrameBuffer=this.currentAAFrameBuffer:this.currentFrameBuffer=this.currentFrameBuffer_bk,this.FXAA_renderBindGroupLayout=e.device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}}]}),this.FXAA_renderBindGroupEntries=[{binding:0,resource:{buffer:this.rawFrameBuffer}},{binding:1,resource:{buffer:this.currentAAFrameBuffer}}],this.FXAA_renderPipelineLayout=e.device.createPipelineLayout({bindGroupLayouts:[this.FXAA_renderBindGroupLayout]}),this.FXAA_renderPipeline=e.device.createComputePipeline({layout:this.FXAA_renderPipelineLayout,compute:{module:e.device.createShaderModule({label:"FXAA.wgsl",code:ee.get("FXAA.wgsl")}),entryPoint:"main",constants:{_renderWidth:this.rendering_width,_renderHeight:this.rendering_height}}})}Reconstruct_dilated_PASS_init(e,t,r){this.reconstruct_dilatedBindGroupLayout=e.device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.COMPUTE,sampler:{}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:3,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:4,visibility:GPUShaderStage.COMPUTE,texture:{sampleType:"uint"}},{binding:5,visibility:GPUShaderStage.COMPUTE,texture:{sampleType:"depth"}},{binding:6,visibility:GPUShaderStage.COMPUTE,storageTexture:{access:"write-only",format:"r32float"}},{binding:7,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:8,visibility:GPUShaderStage.COMPUTE,storageTexture:{access:"write-only",format:"rgba16float"}},{binding:9,visibility:GPUShaderStage.COMPUTE,storageTexture:{access:"write-only",format:"r32float"}},{binding:10,visibility:GPUShaderStage.COMPUTE,texture:{sampleType:"depth"}}]}),this.reconstruct_dilatedBindGroupEntries=[{binding:0,resource:{buffer:this.camera.jitter}},{binding:1,resource:this.sampler},{binding:2,resource:{buffer:this.currentFrameBuffer}},{binding:3,resource:{buffer:this.previousFrameBuffer}},{binding:4,resource:this.motionVec.createView()},{binding:5,resource:this.depthTexture.createView()},{binding:6,resource:this.dilatedDepth.createView()},{binding:7,resource:{buffer:this.reconstructedPreviousDepth}},{binding:8,resource:this.dilatedMotionVectors.createView()},{binding:9,resource:this.lockInputLuma.createView()},{binding:10,resource:this.previousDepthTexture.createView()}],this.reconstruct_dilatedPipelineLayout=e.device.createPipelineLayout({bindGroupLayouts:[this.reconstruct_dilatedBindGroupLayout]}),this.reconstruct_dilatedPipeline=e.device.createComputePipeline({layout:this.reconstruct_dilatedPipelineLayout,compute:{module:e.device.createShaderModule({label:"reconstruct_dilated.wgsl",code:ee.get("reconstruct_dilated.wgsl")}),entryPoint:"main",constants:{zNear:r.camera.near,zFar:r.camera.far,_renderWidth:this.rendering_width,_renderHeight:this.rendering_height,_displayWidth:this.display_width,_displayHeight:this.display_height}}})}DepthClip_PASS_init(e,t,r){this.depthClipBindGroupLayout=e.device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.COMPUTE,sampler:{}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:3,visibility:GPUShaderStage.COMPUTE,storageTexture:{access:"write-only",format:"rgba16float"}},{binding:4,visibility:GPUShaderStage.COMPUTE,texture:{sampleType:"uint"}},{binding:5,visibility:GPUShaderStage.COMPUTE,texture:{sampleType:"depth"}},{binding:6,visibility:GPUShaderStage.COMPUTE,texture:{sampleType:"unfilterable-float"}},{binding:7,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:8,visibility:GPUShaderStage.COMPUTE,texture:{sampleType:"float"}},{binding:9,visibility:GPUShaderStage.COMPUTE,texture:{sampleType:"float"}},{binding:10,visibility:GPUShaderStage.COMPUTE,storageTexture:{access:"write-only",format:"rgba16float"}}]}),this.depthClipBindGroupEntries=[{binding:0,resource:{buffer:this.camera.jitter}},{binding:1,resource:this.sampler},{binding:2,resource:{buffer:this.currentFrameBuffer}},{binding:3,resource:this.preparedInputColor.createView()},{binding:4,resource:this.motionVec.createView()},{binding:5,resource:this.depthTexture.createView()},{binding:6,resource:this.dilatedDepth.createView()},{binding:7,resource:{buffer:this.reconstructedPreviousDepth}},{binding:8,resource:this.dilatedMotionVectors.createView()},{binding:9,resource:this.previousDilatedMotionVectors.createView()},{binding:10,resource:this.dilatedReactiveMasks.createView()}],this.depthClipPipelineLayout=e.device.createPipelineLayout({bindGroupLayouts:[this.depthClipBindGroupLayout]}),this.depthClipPipeline=e.device.createComputePipeline({layout:this.depthClipPipelineLayout,compute:{module:e.device.createShaderModule({label:"depthClip.wgsl",code:ee.get("depthClip.wgsl")}),entryPoint:"main",constants:{zNear:r.camera.near,zFar:r.camera.far,_renderWidth:this.rendering_width,_renderHeight:this.rendering_height,_displayWidth:this.display_width,_displayHeight:this.display_height}}})}Lock_PASS_init(e,t,r){this.lockBindGroupLayout=e.device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.COMPUTE,sampler:{}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:3,visibility:GPUShaderStage.COMPUTE,texture:{sampleType:"unfilterable-float"}},{binding:4,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:5,visibility:GPUShaderStage.COMPUTE,storageTexture:{access:"write-only",format:"r32float"}}]}),this.lockBindGroupEntries=[{binding:0,resource:{buffer:this.camera.jitter}},{binding:1,resource:this.sampler},{binding:2,resource:{buffer:this.currentFrameBuffer}},{binding:3,resource:this.lockInputLuma.createView()},{binding:4,resource:{buffer:this.reconstructedPreviousDepth}},{binding:5,resource:this.newLocks.createView()}],this.lockPipelineLayout=e.device.createPipelineLayout({bindGroupLayouts:[this.lockBindGroupLayout]}),this.lockPipeline=e.device.createComputePipeline({layout:this.lockPipelineLayout,compute:{module:e.device.createShaderModule({label:"lock.wgsl",code:ee.get("lock.wgsl")}),entryPoint:"main",constants:{zNear:r.camera.near,zFar:r.camera.far,_renderWidth:this.rendering_width,_renderHeight:this.rendering_height,_displayWidth:this.display_width,_displayHeight:this.display_height}}})}Upsample_PASS_init(e,t,r){this.displayBindGroupLayout=e.device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.COMPUTE,sampler:{}},{binding:2,visibility:GPUShaderStage.COMPUTE,storageTexture:{access:"write-only",format:"rgba16float"}},{binding:3,visibility:GPUShaderStage.COMPUTE,texture:{}},{binding:4,visibility:GPUShaderStage.COMPUTE,storageTexture:{access:"write-only",format:"rgba16float"}},{binding:5,visibility:GPUShaderStage.COMPUTE,texture:{sampleType:"uint"}},{binding:6,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:7,visibility:GPUShaderStage.COMPUTE,texture:{sampleType:"float"}},{binding:8,visibility:GPUShaderStage.COMPUTE,texture:{sampleType:"float"}},{binding:9,visibility:GPUShaderStage.COMPUTE,storageTexture:{access:"read-write",format:"r32float"}},{binding:10,visibility:GPUShaderStage.COMPUTE,storageTexture:{access:"read-write",format:"r32float"}},{binding:11,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}}]}),this.displayBindGroupEntries=[{binding:0,resource:{buffer:this.camera.jitter}},{binding:1,resource:this.sampler},{binding:2,resource:this.rawDisplay.createView()},{binding:3,resource:this.rPreviousDisplayBuffer.createView()},{binding:4,resource:this.wPreviousDisplayBuffer.createView()},{binding:5,resource:this.motionVec.createView()},{binding:6,resource:{buffer:this.currentFrameBuffer}},{binding:7,resource:this.preparedInputColor.createView()},{binding:8,resource:this.dilatedReactiveMasks.createView()},{binding:9,resource:this.newLocks.createView()},{binding:10,resource:this.lockStatus.createView()},{binding:11,resource:{buffer:this.LumaHistory}}],this.displayPipelineLayout=e.device.createPipelineLayout({bindGroupLayouts:[this.displayBindGroupLayout]}),this.displayPipeline=e.device.createComputePipeline({layout:this.displayPipelineLayout,compute:{module:e.device.createShaderModule({label:"display.wgsl",code:ee.get("display.wgsl").replace("displayFormat",e.format)}),entryPoint:"main",constants:{zNear:r.camera.near,zFar:r.camera.far,_renderWidth:this.rendering_width,_renderHeight:this.rendering_height,_displayWidth:this.display_width,_displayHeight:this.display_height}}})}RCAS_PASS_init(e,t,r){this.racsBindGroupLayout=e.device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.COMPUTE,sampler:{}},{binding:2,visibility:GPUShaderStage.COMPUTE,texture:{sampleType:"unfilterable-float"}},{binding:3,visibility:GPUShaderStage.COMPUTE,storageTexture:{access:"write-only",format:e.format}}]}),this.racsBindGroupEntries=[{binding:0,resource:{buffer:this.camera.jitter}},{binding:1,resource:this.sampler},{binding:2,resource:this.rawDisplay.createView()},{binding:3,resource:this.device.context.getCurrentTexture().createView()}],this.racsPipelineLayout=e.device.createPipelineLayout({bindGroupLayouts:[this.racsBindGroupLayout]}),this.racsPipeline=e.device.createComputePipeline({layout:this.racsPipelineLayout,compute:{module:e.device.createShaderModule({label:"racs.wgsl",code:ee.get("racs.wgsl").replace("displayFormat",e.format)}),entryPoint:"main",constants:{zNear:r.camera.near,zFar:r.camera.far,_renderWidth:this.rendering_width,_renderHeight:this.rendering_height,_displayWidth:this.display_width,_displayHeight:this.display_height}}})}Raw_display_init(e,t,r){this.previousDisplayBuffer=t.previousDisplayBuffer,this.rawBindGroupLayout=e.device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,storageTexture:{access:"write-only",format:e.format}},{binding:1,visibility:GPUShaderStage.COMPUTE,texture:{}},{binding:2,visibility:GPUShaderStage.COMPUTE,sampler:{}},{binding:3,visibility:GPUShaderStage.COMPUTE,texture:{sampleType:"uint"}},{binding:4,visibility:GPUShaderStage.COMPUTE,texture:{sampleType:"depth"}},{binding:5,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:6,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}}]}),this.bindGroupEntries=[{binding:0,resource:this.device.context.getCurrentTexture().createView()},{binding:1,resource:this.previousDisplayBuffer.createView()},{binding:2,resource:this.sampler},{binding:3,resource:this.motionVec.createView()},{binding:4,resource:this.depthTexture.createView()},{binding:5,resource:{buffer:this.currentFrameBuffer}},{binding:6,resource:{buffer:this.previousFrameBuffer}}],this.rawPipelineLayout=e.device.createPipelineLayout({bindGroupLayouts:[this.rawBindGroupLayout]}),this.rawPipeline=e.device.createComputePipeline({layout:this.rawPipelineLayout,compute:{module:e.device.createShaderModule({label:"raw_display.wgsl",code:ee.get("raw_display.wgsl").replace("displayFormat",e.format)}),entryPoint:"main",constants:{zNear:r.camera.near,zFar:r.camera.far}}})}constructor(e,t,r){this.device=e,this.camera=r,this.motionVec=t.motionVec,this.depthTexture=t.depthTexture,this.previousDepthTexture=t.previousDepthTexture,this.currentFrameBuffer=t.currentFrameBuffer,this.previousFrameBuffer=t.previousFrameBuffer,this.currentFrameBuffer_bk=t.currentFrameBuffer,this.sampler=e.device.createSampler({addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge",magFilter:"nearest",minFilter:"nearest"}),this.liner_sampler=e.device.createSampler({addressModeU:"mirror-repeat",addressModeV:"mirror-repeat",magFilter:"linear",minFilter:"linear"}),this.FSR_init(e,t,r),this.rawFrameBuffer=t.currentFrameBuffer,this.FXAA_PASS_init(e,t,r),this.Reconstruct_dilated_PASS_init(e,t,r),this.DepthClip_PASS_init(e,t,r),this.Lock_PASS_init(e,t,r),this.Upsample_PASS_init(e,t,r),this.RCAS_PASS_init(e,t,r),this.Raw_display_init(e,t,r)}record(e){if(this.ENABLE_SR){if(this.FXAA_RENDER){this.currentFrameBuffer=this.currentAAFrameBuffer,this.FXAA_renderBindGroup=this.device.device.createBindGroup({layout:this.FXAA_renderBindGroupLayout,entries:this.FXAA_renderBindGroupEntries});const s=e.beginComputePass();s.setPipeline(this.FXAA_renderPipeline),s.setBindGroup(0,this.FXAA_renderBindGroup),s.dispatchWorkgroups(Math.ceil(this.rendering_width/8),Math.ceil(this.rendering_height/8),1),s.end()}else this.currentFrameBuffer=this.currentFrameBuffer_bk;this.reconstruct_dilatedBindGroup=this.device.device.createBindGroup({layout:this.reconstruct_dilatedBindGroupLayout,entries:this.reconstruct_dilatedBindGroupEntries});const t=e.beginComputePass();t.setPipeline(this.reconstruct_dilatedPipeline),t.setBindGroup(0,this.reconstruct_dilatedBindGroup),t.dispatchWorkgroups(Math.ceil(this.rendering_width/8),Math.ceil(this.rendering_height/8),1),t.end(),this.depthClipBindGroup=this.device.device.createBindGroup({layout:this.depthClipBindGroupLayout,entries:this.depthClipBindGroupEntries});const r=e.beginComputePass();r.setPipeline(this.depthClipPipeline),r.setBindGroup(0,this.depthClipBindGroup),r.dispatchWorkgroups(Math.ceil(this.rendering_width/8),Math.ceil(this.rendering_height/8),1),r.end(),this.lockBindGroup=this.device.device.createBindGroup({layout:this.lockBindGroupLayout,entries:this.lockBindGroupEntries});const n=e.beginComputePass();n.setPipeline(this.lockPipeline),n.setBindGroup(0,this.lockBindGroup),n.dispatchWorkgroups(Math.ceil(this.rendering_width/8),Math.ceil(this.rendering_height/8),1),n.end(),this.displayBindGroup=this.device.device.createBindGroup({layout:this.displayBindGroupLayout,entries:this.displayBindGroupEntries});const i=e.beginComputePass();i.setPipeline(this.displayPipeline),i.setBindGroup(0,this.displayBindGroup),i.dispatchWorkgroups(Math.ceil(this.device.canvas.width/8),Math.ceil(this.device.canvas.height/8),1),i.end(),this.racsBindGroupEntries[3].resource=this.device.context.getCurrentTexture().createView(),this.racsBindGroup=this.device.device.createBindGroup({layout:this.racsBindGroupLayout,entries:this.racsBindGroupEntries});const o=e.beginComputePass();o.setPipeline(this.racsPipeline),o.setBindGroup(0,this.racsBindGroup),o.dispatchWorkgroups(Math.ceil(this.device.canvas.width/8),Math.ceil(this.device.canvas.height/8),1),o.end(),e.copyTextureToTexture({texture:this.dilatedMotionVectors},{texture:this.previousDilatedMotionVectors},{width:this.rendering_width,height:this.rendering_height}),e.copyTextureToTexture({texture:this.wPreviousDisplayBuffer},{texture:this.rPreviousDisplayBuffer},{width:this.display_width,height:this.display_height})}else{this.currentFrameBuffer=this.currentFrameBuffer_bk,this.bindGroupEntries[0].resource=this.device.context.getCurrentTexture().createView(),this.rawBindGroup=this.device.device.createBindGroup({layout:this.rawBindGroupLayout,entries:this.bindGroupEntries});const t=e.beginComputePass();t.setPipeline(this.rawPipeline),t.setBindGroup(0,this.rawBindGroup),t.dispatchWorkgroups(Math.ceil(this.device.canvas.width/8),Math.ceil(this.device.canvas.height/8),1),t.end()}}}/**
 * @license
 * Copyright 2010-2023 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const ko="162",gt={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},yt={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},Yr=0,aa=1,la=2,_i=1,Ai=100,Ci=204,Pi=205,Mi=3,ca=0,Ti="attached",ua="detached",Fo=300,lr=1e3,tr=1001,kn=1002,cr=1003,ha=1004,fa=1005,qn=1006,da=1007,Yn=1008,pa=1009,ma=1014,Zn=1015,ga=1020,Go=1023,nn=1026,Ri=1027,ya=1028,ur=2300,kt=2301,on=2302,Li=2400,Ei=2401,Bi=2402,xa=2500,va=0,Oo=1,Fn=2,ba=0,Uo="",ne="srgb",he="srgb-linear",wa="display-p3",No="display-p3-linear",Gn="linear",Di="srgb",zi="rec709",ki="p3",xt=7680,Fi=519,Ia=515,On=35044,ht=2e3,Un=2001;class dr{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const r=this._listeners;r[e]===void 0&&(r[e]=[]),r[e].indexOf(t)===-1&&r[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;const r=this._listeners;return r[e]!==void 0&&r[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;const n=this._listeners[e];if(n!==void 0){const i=n.indexOf(t);i!==-1&&n.splice(i,1)}}dispatchEvent(e){if(this._listeners===void 0)return;const r=this._listeners[e.type];if(r!==void 0){e.target=this;const n=r.slice(0);for(let i=0,o=n.length;i<o;i++)n[i].call(this,e);e.target=null}}}const J=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let Gi=1234567;const ir=Math.PI/180,hr=180/Math.PI;function Se(){const u=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,r=Math.random()*4294967295|0;return(J[u&255]+J[u>>8&255]+J[u>>16&255]+J[u>>24&255]+"-"+J[e&255]+J[e>>8&255]+"-"+J[e>>16&15|64]+J[e>>24&255]+"-"+J[t&63|128]+J[t>>8&255]+"-"+J[t>>16&255]+J[t>>24&255]+J[r&255]+J[r>>8&255]+J[r>>16&255]+J[r>>24&255]).toLowerCase()}function K(u,e,t){return Math.max(e,Math.min(t,u))}function $n(u,e){return(u%e+e)%e}function Sa(u,e,t,r,n){return r+(u-e)*(n-r)/(t-e)}function _a(u,e,t){return u!==e?(t-u)/(e-u):0}function or(u,e,t){return(1-t)*u+t*e}function Aa(u,e,t,r){return or(u,e,1-Math.exp(-t*r))}function Ca(u,e=1){return e-Math.abs($n(u,e*2)-e)}function Pa(u,e,t){return u<=e?0:u>=t?1:(u=(u-e)/(t-e),u*u*(3-2*u))}function Ma(u,e,t){return u<=e?0:u>=t?1:(u=(u-e)/(t-e),u*u*u*(u*(u*6-15)+10))}function Ta(u,e){return u+Math.floor(Math.random()*(e-u+1))}function Ra(u,e){return u+Math.random()*(e-u)}function La(u){return u*(.5-Math.random())}function Ea(u){u!==void 0&&(Gi=u);let e=Gi+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function Ba(u){return u*ir}function Da(u){return u*hr}function za(u){return(u&u-1)===0&&u!==0}function ka(u){return Math.pow(2,Math.ceil(Math.log(u)/Math.LN2))}function Fa(u){return Math.pow(2,Math.floor(Math.log(u)/Math.LN2))}function Ga(u,e,t,r,n){const i=Math.cos,o=Math.sin,s=i(t/2),a=o(t/2),l=i((e+r)/2),c=o((e+r)/2),h=i((e-r)/2),f=o((e-r)/2),d=i((r-e)/2),p=o((r-e)/2);switch(n){case"XYX":u.set(s*c,a*h,a*f,s*l);break;case"YZY":u.set(a*f,s*c,a*h,s*l);break;case"ZXZ":u.set(a*h,a*f,s*c,s*l);break;case"XZX":u.set(s*c,a*p,a*d,s*l);break;case"YXY":u.set(a*d,s*c,a*p,s*l);break;case"ZYZ":u.set(a*p,a*d,s*c,s*l);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+n)}}function Ie(u,e){switch(e.constructor){case Float32Array:return u;case Uint32Array:return u/4294967295;case Uint16Array:return u/65535;case Uint8Array:return u/255;case Int32Array:return Math.max(u/2147483647,-1);case Int16Array:return Math.max(u/32767,-1);case Int8Array:return Math.max(u/127,-1);default:throw new Error("Invalid component type.")}}function O(u,e){switch(e.constructor){case Float32Array:return u;case Uint32Array:return Math.round(u*4294967295);case Uint16Array:return Math.round(u*65535);case Uint8Array:return Math.round(u*255);case Int32Array:return Math.round(u*2147483647);case Int16Array:return Math.round(u*32767);case Int8Array:return Math.round(u*127);default:throw new Error("Invalid component type.")}}const Ho={DEG2RAD:ir,RAD2DEG:hr,generateUUID:Se,clamp:K,euclideanModulo:$n,mapLinear:Sa,inverseLerp:_a,lerp:or,damp:Aa,pingpong:Ca,smoothstep:Pa,smootherstep:Ma,randInt:Ta,randFloat:Ra,randFloatSpread:La,seededRandom:Ea,degToRad:Ba,radToDeg:Da,isPowerOfTwo:za,ceilPowerOfTwo:ka,floorPowerOfTwo:Fa,setQuaternionFromProperEuler:Ga,normalize:O,denormalize:Ie};class k{constructor(e=0,t=0){k.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,r=this.y,n=e.elements;return this.x=n[0]*t+n[3]*r+n[6],this.y=n[1]*t+n[4]*r+n[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this}clampLength(e,t){const r=this.length();return this.divideScalar(r||1).multiplyScalar(Math.max(e,Math.min(t,r)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const r=this.dot(e)/t;return Math.acos(K(r,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,r=this.y-e.y;return t*t+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,r){return this.x=e.x+(t.x-e.x)*r,this.y=e.y+(t.y-e.y)*r,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const r=Math.cos(t),n=Math.sin(t),i=this.x-e.x,o=this.y-e.y;return this.x=i*r-o*n+e.x,this.y=i*n+o*r+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Ue{constructor(e,t,r,n,i,o,s,a,l){Ue.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,r,n,i,o,s,a,l)}set(e,t,r,n,i,o,s,a,l){const c=this.elements;return c[0]=e,c[1]=n,c[2]=s,c[3]=t,c[4]=i,c[5]=a,c[6]=r,c[7]=o,c[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,r=e.elements;return t[0]=r[0],t[1]=r[1],t[2]=r[2],t[3]=r[3],t[4]=r[4],t[5]=r[5],t[6]=r[6],t[7]=r[7],t[8]=r[8],this}extractBasis(e,t,r){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),r.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const r=e.elements,n=t.elements,i=this.elements,o=r[0],s=r[3],a=r[6],l=r[1],c=r[4],h=r[7],f=r[2],d=r[5],p=r[8],y=n[0],m=n[3],w=n[6],S=n[1],_=n[4],A=n[7],P=n[2],L=n[5],C=n[8];return i[0]=o*y+s*S+a*P,i[3]=o*m+s*_+a*L,i[6]=o*w+s*A+a*C,i[1]=l*y+c*S+h*P,i[4]=l*m+c*_+h*L,i[7]=l*w+c*A+h*C,i[2]=f*y+d*S+p*P,i[5]=f*m+d*_+p*L,i[8]=f*w+d*A+p*C,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],r=e[1],n=e[2],i=e[3],o=e[4],s=e[5],a=e[6],l=e[7],c=e[8];return t*o*c-t*s*l-r*i*c+r*s*a+n*i*l-n*o*a}invert(){const e=this.elements,t=e[0],r=e[1],n=e[2],i=e[3],o=e[4],s=e[5],a=e[6],l=e[7],c=e[8],h=c*o-s*l,f=s*a-c*i,d=l*i-o*a,p=t*h+r*f+n*d;if(p===0)return this.set(0,0,0,0,0,0,0,0,0);const y=1/p;return e[0]=h*y,e[1]=(n*l-c*r)*y,e[2]=(s*r-n*o)*y,e[3]=f*y,e[4]=(c*t-n*a)*y,e[5]=(n*i-s*t)*y,e[6]=d*y,e[7]=(r*a-l*t)*y,e[8]=(o*t-r*i)*y,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,r,n,i,o,s){const a=Math.cos(i),l=Math.sin(i);return this.set(r*a,r*l,-r*(a*o+l*s)+o+e,-n*l,n*a,-n*(-l*o+a*s)+s+t,0,0,1),this}scale(e,t){return this.premultiply(sn.makeScale(e,t)),this}rotate(e){return this.premultiply(sn.makeRotation(-e)),this}translate(e,t){return this.premultiply(sn.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),r=Math.sin(e);return this.set(t,-r,0,r,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,r=e.elements;for(let n=0;n<9;n++)if(t[n]!==r[n])return!1;return!0}fromArray(e,t=0){for(let r=0;r<9;r++)this.elements[r]=e[r+t];return this}toArray(e=[],t=0){const r=this.elements;return e[t]=r[0],e[t+1]=r[1],e[t+2]=r[2],e[t+3]=r[3],e[t+4]=r[4],e[t+5]=r[5],e[t+6]=r[6],e[t+7]=r[7],e[t+8]=r[8],e}clone(){return new this.constructor().fromArray(this.elements)}}const sn=new Ue;function Oa(u){for(let e=u.length-1;e>=0;--e)if(u[e]>=65535)return!0;return!1}function Nn(u){return document.createElementNS("http://www.w3.org/1999/xhtml",u)}const Oi={};function Vo(u){u in Oi||(Oi[u]=!0,console.warn(u))}const Ui=new Ue().set(.8224621,.177538,0,.0331941,.9668058,0,.0170827,.0723974,.9105199),Ni=new Ue().set(1.2249401,-.2249404,0,-.0420569,1.0420571,0,-.0196376,-.0786361,1.0982735),xr={[he]:{transfer:Gn,primaries:zi,toReference:u=>u,fromReference:u=>u},[ne]:{transfer:Di,primaries:zi,toReference:u=>u.convertSRGBToLinear(),fromReference:u=>u.convertLinearToSRGB()},[No]:{transfer:Gn,primaries:ki,toReference:u=>u.applyMatrix3(Ni),fromReference:u=>u.applyMatrix3(Ui)},[wa]:{transfer:Di,primaries:ki,toReference:u=>u.convertSRGBToLinear().applyMatrix3(Ni),fromReference:u=>u.applyMatrix3(Ui).convertLinearToSRGB()}},Ua=new Set([he,No]),ce={enabled:!0,_workingColorSpace:he,get workingColorSpace(){return this._workingColorSpace},set workingColorSpace(u){if(!Ua.has(u))throw new Error(`Unsupported working color space, "${u}".`);this._workingColorSpace=u},convert:function(u,e,t){if(this.enabled===!1||e===t||!e||!t)return u;const r=xr[e].toReference,n=xr[t].fromReference;return n(r(u))},fromWorkingColorSpace:function(u,e){return this.convert(u,this._workingColorSpace,e)},toWorkingColorSpace:function(u,e){return this.convert(u,e,this._workingColorSpace)},getPrimaries:function(u){return xr[u].primaries},getTransfer:function(u){return u===Uo?Gn:xr[u].transfer}};function Dt(u){return u<.04045?u*.0773993808:Math.pow(u*.9478672986+.0521327014,2.4)}function an(u){return u<.0031308?u*12.92:1.055*Math.pow(u,.41666)-.055}let vt;class Na{static getDataURL(e){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let t;if(e instanceof HTMLCanvasElement)t=e;else{vt===void 0&&(vt=Nn("canvas")),vt.width=e.width,vt.height=e.height;const r=vt.getContext("2d");e instanceof ImageData?r.putImageData(e,0,0):r.drawImage(e,0,0,e.width,e.height),t=vt}return t.width>2048||t.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",e),t.toDataURL("image/jpeg",.6)):t.toDataURL("image/png")}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=Nn("canvas");t.width=e.width,t.height=e.height;const r=t.getContext("2d");r.drawImage(e,0,0,e.width,e.height);const n=r.getImageData(0,0,e.width,e.height),i=n.data;for(let o=0;o<i.length;o++)i[o]=Dt(i[o]/255)*255;return r.putImageData(n,0,0),t}else if(e.data){const t=e.data.slice(0);for(let r=0;r<t.length;r++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[r]=Math.floor(Dt(t[r]/255)*255):t[r]=Dt(t[r]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let Ha=0;class Va{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Ha++}),this.uuid=Se(),this.data=e,this.dataReady=!0,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const r={uuid:this.uuid,url:""},n=this.data;if(n!==null){let i;if(Array.isArray(n)){i=[];for(let o=0,s=n.length;o<s;o++)n[o].isDataTexture?i.push(ln(n[o].image)):i.push(ln(n[o]))}else i=ln(n);r.url=i}return t||(e.images[this.uuid]=r),r}}function ln(u){return typeof HTMLImageElement<"u"&&u instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&u instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&u instanceof ImageBitmap?Na.getDataURL(u):u.data?{data:Array.from(u.data),width:u.width,height:u.height,type:u.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let Wa=0;class ge extends dr{constructor(e=ge.DEFAULT_IMAGE,t=ge.DEFAULT_MAPPING,r=tr,n=tr,i=qn,o=Yn,s=Go,a=pa,l=ge.DEFAULT_ANISOTROPY,c=Uo){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Wa++}),this.uuid=Se(),this.name="",this.source=new Va(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=r,this.wrapT=n,this.magFilter=i,this.minFilter=o,this.anisotropy=l,this.format=s,this.internalFormat=null,this.type=a,this.offset=new k(0,0),this.repeat=new k(1,1),this.center=new k(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Ue,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=c,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.needsPMREMUpdate=!1}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const r={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(r.userData=this.userData),t||(e.textures[this.uuid]=r),r}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==Fo)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case lr:e.x=e.x-Math.floor(e.x);break;case tr:e.x=e.x<0?0:1;break;case kn:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case lr:e.y=e.y-Math.floor(e.y);break;case tr:e.y=e.y<0?0:1;break;case kn:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}}ge.DEFAULT_IMAGE=null;ge.DEFAULT_MAPPING=Fo;ge.DEFAULT_ANISOTROPY=1;class me{constructor(e=0,t=0,r=0,n=1){me.prototype.isVector4=!0,this.x=e,this.y=t,this.z=r,this.w=n}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,r,n){return this.x=e,this.y=t,this.z=r,this.w=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,r=this.y,n=this.z,i=this.w,o=e.elements;return this.x=o[0]*t+o[4]*r+o[8]*n+o[12]*i,this.y=o[1]*t+o[5]*r+o[9]*n+o[13]*i,this.z=o[2]*t+o[6]*r+o[10]*n+o[14]*i,this.w=o[3]*t+o[7]*r+o[11]*n+o[15]*i,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,r,n,i;const a=e.elements,l=a[0],c=a[4],h=a[8],f=a[1],d=a[5],p=a[9],y=a[2],m=a[6],w=a[10];if(Math.abs(c-f)<.01&&Math.abs(h-y)<.01&&Math.abs(p-m)<.01){if(Math.abs(c+f)<.1&&Math.abs(h+y)<.1&&Math.abs(p+m)<.1&&Math.abs(l+d+w-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const _=(l+1)/2,A=(d+1)/2,P=(w+1)/2,L=(c+f)/4,C=(h+y)/4,R=(p+m)/4;return _>A&&_>P?_<.01?(r=0,n=.707106781,i=.707106781):(r=Math.sqrt(_),n=L/r,i=C/r):A>P?A<.01?(r=.707106781,n=0,i=.707106781):(n=Math.sqrt(A),r=L/n,i=R/n):P<.01?(r=.707106781,n=.707106781,i=0):(i=Math.sqrt(P),r=C/i,n=R/i),this.set(r,n,i,t),this}let S=Math.sqrt((m-p)*(m-p)+(h-y)*(h-y)+(f-c)*(f-c));return Math.abs(S)<.001&&(S=1),this.x=(m-p)/S,this.y=(h-y)/S,this.z=(f-c)/S,this.w=Math.acos((l+d+w-1)/2),this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this.w=Math.max(e.w,Math.min(t.w,this.w)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this.w=Math.max(e,Math.min(t,this.w)),this}clampLength(e,t){const r=this.length();return this.divideScalar(r||1).multiplyScalar(Math.max(e,Math.min(t,r)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,r){return this.x=e.x+(t.x-e.x)*r,this.y=e.y+(t.y-e.y)*r,this.z=e.z+(t.z-e.z)*r,this.w=e.w+(t.w-e.w)*r,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class Me{constructor(e=0,t=0,r=0,n=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=r,this._w=n}static slerpFlat(e,t,r,n,i,o,s){let a=r[n+0],l=r[n+1],c=r[n+2],h=r[n+3];const f=i[o+0],d=i[o+1],p=i[o+2],y=i[o+3];if(s===0){e[t+0]=a,e[t+1]=l,e[t+2]=c,e[t+3]=h;return}if(s===1){e[t+0]=f,e[t+1]=d,e[t+2]=p,e[t+3]=y;return}if(h!==y||a!==f||l!==d||c!==p){let m=1-s;const w=a*f+l*d+c*p+h*y,S=w>=0?1:-1,_=1-w*w;if(_>Number.EPSILON){const P=Math.sqrt(_),L=Math.atan2(P,w*S);m=Math.sin(m*L)/P,s=Math.sin(s*L)/P}const A=s*S;if(a=a*m+f*A,l=l*m+d*A,c=c*m+p*A,h=h*m+y*A,m===1-s){const P=1/Math.sqrt(a*a+l*l+c*c+h*h);a*=P,l*=P,c*=P,h*=P}}e[t]=a,e[t+1]=l,e[t+2]=c,e[t+3]=h}static multiplyQuaternionsFlat(e,t,r,n,i,o){const s=r[n],a=r[n+1],l=r[n+2],c=r[n+3],h=i[o],f=i[o+1],d=i[o+2],p=i[o+3];return e[t]=s*p+c*h+a*d-l*f,e[t+1]=a*p+c*f+l*h-s*d,e[t+2]=l*p+c*d+s*f-a*h,e[t+3]=c*p-s*h-a*f-l*d,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,r,n){return this._x=e,this._y=t,this._z=r,this._w=n,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const r=e._x,n=e._y,i=e._z,o=e._order,s=Math.cos,a=Math.sin,l=s(r/2),c=s(n/2),h=s(i/2),f=a(r/2),d=a(n/2),p=a(i/2);switch(o){case"XYZ":this._x=f*c*h+l*d*p,this._y=l*d*h-f*c*p,this._z=l*c*p+f*d*h,this._w=l*c*h-f*d*p;break;case"YXZ":this._x=f*c*h+l*d*p,this._y=l*d*h-f*c*p,this._z=l*c*p-f*d*h,this._w=l*c*h+f*d*p;break;case"ZXY":this._x=f*c*h-l*d*p,this._y=l*d*h+f*c*p,this._z=l*c*p+f*d*h,this._w=l*c*h-f*d*p;break;case"ZYX":this._x=f*c*h-l*d*p,this._y=l*d*h+f*c*p,this._z=l*c*p-f*d*h,this._w=l*c*h+f*d*p;break;case"YZX":this._x=f*c*h+l*d*p,this._y=l*d*h+f*c*p,this._z=l*c*p-f*d*h,this._w=l*c*h-f*d*p;break;case"XZY":this._x=f*c*h-l*d*p,this._y=l*d*h-f*c*p,this._z=l*c*p+f*d*h,this._w=l*c*h+f*d*p;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const r=t/2,n=Math.sin(r);return this._x=e.x*n,this._y=e.y*n,this._z=e.z*n,this._w=Math.cos(r),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,r=t[0],n=t[4],i=t[8],o=t[1],s=t[5],a=t[9],l=t[2],c=t[6],h=t[10],f=r+s+h;if(f>0){const d=.5/Math.sqrt(f+1);this._w=.25/d,this._x=(c-a)*d,this._y=(i-l)*d,this._z=(o-n)*d}else if(r>s&&r>h){const d=2*Math.sqrt(1+r-s-h);this._w=(c-a)/d,this._x=.25*d,this._y=(n+o)/d,this._z=(i+l)/d}else if(s>h){const d=2*Math.sqrt(1+s-r-h);this._w=(i-l)/d,this._x=(n+o)/d,this._y=.25*d,this._z=(a+c)/d}else{const d=2*Math.sqrt(1+h-r-s);this._w=(o-n)/d,this._x=(i+l)/d,this._y=(a+c)/d,this._z=.25*d}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let r=e.dot(t)+1;return r<Number.EPSILON?(r=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=r):(this._x=0,this._y=-e.z,this._z=e.y,this._w=r)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=r),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(K(this.dot(e),-1,1)))}rotateTowards(e,t){const r=this.angleTo(e);if(r===0)return this;const n=Math.min(1,t/r);return this.slerp(e,n),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const r=e._x,n=e._y,i=e._z,o=e._w,s=t._x,a=t._y,l=t._z,c=t._w;return this._x=r*c+o*s+n*l-i*a,this._y=n*c+o*a+i*s-r*l,this._z=i*c+o*l+r*a-n*s,this._w=o*c-r*s-n*a-i*l,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);const r=this._x,n=this._y,i=this._z,o=this._w;let s=o*e._w+r*e._x+n*e._y+i*e._z;if(s<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,s=-s):this.copy(e),s>=1)return this._w=o,this._x=r,this._y=n,this._z=i,this;const a=1-s*s;if(a<=Number.EPSILON){const d=1-t;return this._w=d*o+t*this._w,this._x=d*r+t*this._x,this._y=d*n+t*this._y,this._z=d*i+t*this._z,this.normalize(),this}const l=Math.sqrt(a),c=Math.atan2(l,s),h=Math.sin((1-t)*c)/l,f=Math.sin(t*c)/l;return this._w=o*h+this._w*f,this._x=r*h+this._x*f,this._y=n*h+this._y*f,this._z=i*h+this._z*f,this._onChangeCallback(),this}slerpQuaternions(e,t,r){return this.copy(e).slerp(t,r)}random(){const e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),r=Math.random(),n=Math.sqrt(1-r),i=Math.sqrt(r);return this.set(n*Math.sin(e),n*Math.cos(e),i*Math.sin(t),i*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class b{constructor(e=0,t=0,r=0){b.prototype.isVector3=!0,this.x=e,this.y=t,this.z=r}set(e,t,r){return r===void 0&&(r=this.z),this.x=e,this.y=t,this.z=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Hi.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Hi.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,r=this.y,n=this.z,i=e.elements;return this.x=i[0]*t+i[3]*r+i[6]*n,this.y=i[1]*t+i[4]*r+i[7]*n,this.z=i[2]*t+i[5]*r+i[8]*n,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,r=this.y,n=this.z,i=e.elements,o=1/(i[3]*t+i[7]*r+i[11]*n+i[15]);return this.x=(i[0]*t+i[4]*r+i[8]*n+i[12])*o,this.y=(i[1]*t+i[5]*r+i[9]*n+i[13])*o,this.z=(i[2]*t+i[6]*r+i[10]*n+i[14])*o,this}applyQuaternion(e){const t=this.x,r=this.y,n=this.z,i=e.x,o=e.y,s=e.z,a=e.w,l=2*(o*n-s*r),c=2*(s*t-i*n),h=2*(i*r-o*t);return this.x=t+a*l+o*h-s*c,this.y=r+a*c+s*l-i*h,this.z=n+a*h+i*c-o*l,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,r=this.y,n=this.z,i=e.elements;return this.x=i[0]*t+i[4]*r+i[8]*n,this.y=i[1]*t+i[5]*r+i[9]*n,this.z=i[2]*t+i[6]*r+i[10]*n,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this}clampLength(e,t){const r=this.length();return this.divideScalar(r||1).multiplyScalar(Math.max(e,Math.min(t,r)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,r){return this.x=e.x+(t.x-e.x)*r,this.y=e.y+(t.y-e.y)*r,this.z=e.z+(t.z-e.z)*r,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const r=e.x,n=e.y,i=e.z,o=t.x,s=t.y,a=t.z;return this.x=n*a-i*s,this.y=i*o-r*a,this.z=r*s-n*o,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const r=e.dot(this)/t;return this.copy(e).multiplyScalar(r)}projectOnPlane(e){return cn.copy(this).projectOnVector(e),this.sub(cn)}reflect(e){return this.sub(cn.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const r=this.dot(e)/t;return Math.acos(K(r,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,r=this.y-e.y,n=this.z-e.z;return t*t+r*r+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,r){const n=Math.sin(t)*e;return this.x=n*Math.sin(r),this.y=Math.cos(t)*e,this.z=n*Math.cos(r),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,r){return this.x=e*Math.sin(t),this.y=r,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),r=this.setFromMatrixColumn(e,1).length(),n=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=r,this.z=n,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=Math.random()*Math.PI*2,t=Math.random()*2-1,r=Math.sqrt(1-t*t);return this.x=r*Math.cos(e),this.y=t,this.z=r*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const cn=new b,Hi=new Me;class Ne{constructor(e=new b(1/0,1/0,1/0),t=new b(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,r=e.length;t<r;t+=3)this.expandByPoint(ve.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,r=e.count;t<r;t++)this.expandByPoint(ve.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,r=e.length;t<r;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const r=ve.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(r),this.max.copy(e).add(r),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const r=e.geometry;if(r!==void 0){const i=r.getAttribute("position");if(t===!0&&i!==void 0&&e.isInstancedMesh!==!0)for(let o=0,s=i.count;o<s;o++)e.isMesh===!0?e.getVertexPosition(o,ve):ve.fromBufferAttribute(i,o),ve.applyMatrix4(e.matrixWorld),this.expandByPoint(ve);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),vr.copy(e.boundingBox)):(r.boundingBox===null&&r.computeBoundingBox(),vr.copy(r.boundingBox)),vr.applyMatrix4(e.matrixWorld),this.union(vr)}const n=e.children;for(let i=0,o=n.length;i<o;i++)this.expandByObject(n[i],t);return this}containsPoint(e){return!(e.x<this.min.x||e.x>this.max.x||e.y<this.min.y||e.y>this.max.y||e.z<this.min.z||e.z>this.max.z)}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return!(e.max.x<this.min.x||e.min.x>this.max.x||e.max.y<this.min.y||e.min.y>this.max.y||e.max.z<this.min.z||e.min.z>this.max.z)}intersectsSphere(e){return this.clampPoint(e.center,ve),ve.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,r;return e.normal.x>0?(t=e.normal.x*this.min.x,r=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,r=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,r+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,r+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,r+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,r+=e.normal.z*this.min.z),t<=-e.constant&&r>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(qt),br.subVectors(this.max,qt),bt.subVectors(e.a,qt),wt.subVectors(e.b,qt),It.subVectors(e.c,qt),qe.subVectors(wt,bt),Ye.subVectors(It,wt),ot.subVectors(bt,It);let t=[0,-qe.z,qe.y,0,-Ye.z,Ye.y,0,-ot.z,ot.y,qe.z,0,-qe.x,Ye.z,0,-Ye.x,ot.z,0,-ot.x,-qe.y,qe.x,0,-Ye.y,Ye.x,0,-ot.y,ot.x,0];return!un(t,bt,wt,It,br)||(t=[1,0,0,0,1,0,0,0,1],!un(t,bt,wt,It,br))?!1:(wr.crossVectors(qe,Ye),t=[wr.x,wr.y,wr.z],un(t,bt,wt,It,br))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,ve).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(ve).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Be[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Be[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Be[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Be[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Be[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Be[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Be[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Be[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Be),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}}const Be=[new b,new b,new b,new b,new b,new b,new b,new b],ve=new b,vr=new Ne,bt=new b,wt=new b,It=new b,qe=new b,Ye=new b,ot=new b,qt=new b,br=new b,wr=new b,st=new b;function un(u,e,t,r,n){for(let i=0,o=u.length-3;i<=o;i+=3){st.fromArray(u,i);const s=n.x*Math.abs(st.x)+n.y*Math.abs(st.y)+n.z*Math.abs(st.z),a=e.dot(st),l=t.dot(st),c=r.dot(st);if(Math.max(-Math.max(a,l,c),Math.min(a,l,c))>s)return!1}return!0}const ja=new Ne,Yt=new b,hn=new b;class _e{constructor(e=new b,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const r=this.center;t!==void 0?r.copy(t):ja.setFromPoints(e).getCenter(r);let n=0;for(let i=0,o=e.length;i<o;i++)n=Math.max(n,r.distanceToSquared(e[i]));return this.radius=Math.sqrt(n),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const r=this.center.distanceToSquared(e);return t.copy(e),r>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Yt.subVectors(e,this.center);const t=Yt.lengthSq();if(t>this.radius*this.radius){const r=Math.sqrt(t),n=(r-this.radius)*.5;this.center.addScaledVector(Yt,n/r),this.radius+=n}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(hn.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Yt.copy(e.center).add(hn)),this.expandByPoint(Yt.copy(e.center).sub(hn))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}}const De=new b,fn=new b,Ir=new b,Ze=new b,dn=new b,Sr=new b,pn=new b;class pr{constructor(e=new b,t=new b(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,De)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const r=t.dot(this.direction);return r<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,r)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=De.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(De.copy(this.origin).addScaledVector(this.direction,t),De.distanceToSquared(e))}distanceSqToSegment(e,t,r,n){fn.copy(e).add(t).multiplyScalar(.5),Ir.copy(t).sub(e).normalize(),Ze.copy(this.origin).sub(fn);const i=e.distanceTo(t)*.5,o=-this.direction.dot(Ir),s=Ze.dot(this.direction),a=-Ze.dot(Ir),l=Ze.lengthSq(),c=Math.abs(1-o*o);let h,f,d,p;if(c>0)if(h=o*a-s,f=o*s-a,p=i*c,h>=0)if(f>=-p)if(f<=p){const y=1/c;h*=y,f*=y,d=h*(h+o*f+2*s)+f*(o*h+f+2*a)+l}else f=i,h=Math.max(0,-(o*f+s)),d=-h*h+f*(f+2*a)+l;else f=-i,h=Math.max(0,-(o*f+s)),d=-h*h+f*(f+2*a)+l;else f<=-p?(h=Math.max(0,-(-o*i+s)),f=h>0?-i:Math.min(Math.max(-i,-a),i),d=-h*h+f*(f+2*a)+l):f<=p?(h=0,f=Math.min(Math.max(-i,-a),i),d=f*(f+2*a)+l):(h=Math.max(0,-(o*i+s)),f=h>0?i:Math.min(Math.max(-i,-a),i),d=-h*h+f*(f+2*a)+l);else f=o>0?-i:i,h=Math.max(0,-(o*f+s)),d=-h*h+f*(f+2*a)+l;return r&&r.copy(this.origin).addScaledVector(this.direction,h),n&&n.copy(fn).addScaledVector(Ir,f),d}intersectSphere(e,t){De.subVectors(e.center,this.origin);const r=De.dot(this.direction),n=De.dot(De)-r*r,i=e.radius*e.radius;if(n>i)return null;const o=Math.sqrt(i-n),s=r-o,a=r+o;return a<0?null:s<0?this.at(a,t):this.at(s,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const r=-(this.origin.dot(e.normal)+e.constant)/t;return r>=0?r:null}intersectPlane(e,t){const r=this.distanceToPlane(e);return r===null?null:this.at(r,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let r,n,i,o,s,a;const l=1/this.direction.x,c=1/this.direction.y,h=1/this.direction.z,f=this.origin;return l>=0?(r=(e.min.x-f.x)*l,n=(e.max.x-f.x)*l):(r=(e.max.x-f.x)*l,n=(e.min.x-f.x)*l),c>=0?(i=(e.min.y-f.y)*c,o=(e.max.y-f.y)*c):(i=(e.max.y-f.y)*c,o=(e.min.y-f.y)*c),r>o||i>n||((i>r||isNaN(r))&&(r=i),(o<n||isNaN(n))&&(n=o),h>=0?(s=(e.min.z-f.z)*h,a=(e.max.z-f.z)*h):(s=(e.max.z-f.z)*h,a=(e.min.z-f.z)*h),r>a||s>n)||((s>r||r!==r)&&(r=s),(a<n||n!==n)&&(n=a),n<0)?null:this.at(r>=0?r:n,t)}intersectsBox(e){return this.intersectBox(e,De)!==null}intersectTriangle(e,t,r,n,i){dn.subVectors(t,e),Sr.subVectors(r,e),pn.crossVectors(dn,Sr);let o=this.direction.dot(pn),s;if(o>0){if(n)return null;s=1}else if(o<0)s=-1,o=-o;else return null;Ze.subVectors(this.origin,e);const a=s*this.direction.dot(Sr.crossVectors(Ze,Sr));if(a<0)return null;const l=s*this.direction.dot(dn.cross(Ze));if(l<0||a+l>o)return null;const c=-s*Ze.dot(pn);return c<0?null:this.at(c/o,i)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class B{constructor(e,t,r,n,i,o,s,a,l,c,h,f,d,p,y,m){B.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,r,n,i,o,s,a,l,c,h,f,d,p,y,m)}set(e,t,r,n,i,o,s,a,l,c,h,f,d,p,y,m){const w=this.elements;return w[0]=e,w[4]=t,w[8]=r,w[12]=n,w[1]=i,w[5]=o,w[9]=s,w[13]=a,w[2]=l,w[6]=c,w[10]=h,w[14]=f,w[3]=d,w[7]=p,w[11]=y,w[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new B().fromArray(this.elements)}copy(e){const t=this.elements,r=e.elements;return t[0]=r[0],t[1]=r[1],t[2]=r[2],t[3]=r[3],t[4]=r[4],t[5]=r[5],t[6]=r[6],t[7]=r[7],t[8]=r[8],t[9]=r[9],t[10]=r[10],t[11]=r[11],t[12]=r[12],t[13]=r[13],t[14]=r[14],t[15]=r[15],this}copyPosition(e){const t=this.elements,r=e.elements;return t[12]=r[12],t[13]=r[13],t[14]=r[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,r){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),r.setFromMatrixColumn(this,2),this}makeBasis(e,t,r){return this.set(e.x,t.x,r.x,0,e.y,t.y,r.y,0,e.z,t.z,r.z,0,0,0,0,1),this}extractRotation(e){const t=this.elements,r=e.elements,n=1/St.setFromMatrixColumn(e,0).length(),i=1/St.setFromMatrixColumn(e,1).length(),o=1/St.setFromMatrixColumn(e,2).length();return t[0]=r[0]*n,t[1]=r[1]*n,t[2]=r[2]*n,t[3]=0,t[4]=r[4]*i,t[5]=r[5]*i,t[6]=r[6]*i,t[7]=0,t[8]=r[8]*o,t[9]=r[9]*o,t[10]=r[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,r=e.x,n=e.y,i=e.z,o=Math.cos(r),s=Math.sin(r),a=Math.cos(n),l=Math.sin(n),c=Math.cos(i),h=Math.sin(i);if(e.order==="XYZ"){const f=o*c,d=o*h,p=s*c,y=s*h;t[0]=a*c,t[4]=-a*h,t[8]=l,t[1]=d+p*l,t[5]=f-y*l,t[9]=-s*a,t[2]=y-f*l,t[6]=p+d*l,t[10]=o*a}else if(e.order==="YXZ"){const f=a*c,d=a*h,p=l*c,y=l*h;t[0]=f+y*s,t[4]=p*s-d,t[8]=o*l,t[1]=o*h,t[5]=o*c,t[9]=-s,t[2]=d*s-p,t[6]=y+f*s,t[10]=o*a}else if(e.order==="ZXY"){const f=a*c,d=a*h,p=l*c,y=l*h;t[0]=f-y*s,t[4]=-o*h,t[8]=p+d*s,t[1]=d+p*s,t[5]=o*c,t[9]=y-f*s,t[2]=-o*l,t[6]=s,t[10]=o*a}else if(e.order==="ZYX"){const f=o*c,d=o*h,p=s*c,y=s*h;t[0]=a*c,t[4]=p*l-d,t[8]=f*l+y,t[1]=a*h,t[5]=y*l+f,t[9]=d*l-p,t[2]=-l,t[6]=s*a,t[10]=o*a}else if(e.order==="YZX"){const f=o*a,d=o*l,p=s*a,y=s*l;t[0]=a*c,t[4]=y-f*h,t[8]=p*h+d,t[1]=h,t[5]=o*c,t[9]=-s*c,t[2]=-l*c,t[6]=d*h+p,t[10]=f-y*h}else if(e.order==="XZY"){const f=o*a,d=o*l,p=s*a,y=s*l;t[0]=a*c,t[4]=-h,t[8]=l*c,t[1]=f*h+y,t[5]=o*c,t[9]=d*h-p,t[2]=p*h-d,t[6]=s*c,t[10]=y*h+f}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Xa,e,qa)}lookAt(e,t,r){const n=this.elements;return se.subVectors(e,t),se.lengthSq()===0&&(se.z=1),se.normalize(),$e.crossVectors(r,se),$e.lengthSq()===0&&(Math.abs(r.z)===1?se.x+=1e-4:se.z+=1e-4,se.normalize(),$e.crossVectors(r,se)),$e.normalize(),_r.crossVectors(se,$e),n[0]=$e.x,n[4]=_r.x,n[8]=se.x,n[1]=$e.y,n[5]=_r.y,n[9]=se.y,n[2]=$e.z,n[6]=_r.z,n[10]=se.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const r=e.elements,n=t.elements,i=this.elements,o=r[0],s=r[4],a=r[8],l=r[12],c=r[1],h=r[5],f=r[9],d=r[13],p=r[2],y=r[6],m=r[10],w=r[14],S=r[3],_=r[7],A=r[11],P=r[15],L=n[0],C=n[4],R=n[8],G=n[12],W=n[1],j=n[5],ie=n[9],X=n[13],ye=n[2],rt=n[6],xe=n[10],Ve=n[14],nt=n[3],We=n[7],je=n[11],it=n[15];return i[0]=o*L+s*W+a*ye+l*nt,i[4]=o*C+s*j+a*rt+l*We,i[8]=o*R+s*ie+a*xe+l*je,i[12]=o*G+s*X+a*Ve+l*it,i[1]=c*L+h*W+f*ye+d*nt,i[5]=c*C+h*j+f*rt+d*We,i[9]=c*R+h*ie+f*xe+d*je,i[13]=c*G+h*X+f*Ve+d*it,i[2]=p*L+y*W+m*ye+w*nt,i[6]=p*C+y*j+m*rt+w*We,i[10]=p*R+y*ie+m*xe+w*je,i[14]=p*G+y*X+m*Ve+w*it,i[3]=S*L+_*W+A*ye+P*nt,i[7]=S*C+_*j+A*rt+P*We,i[11]=S*R+_*ie+A*xe+P*je,i[15]=S*G+_*X+A*Ve+P*it,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],r=e[4],n=e[8],i=e[12],o=e[1],s=e[5],a=e[9],l=e[13],c=e[2],h=e[6],f=e[10],d=e[14],p=e[3],y=e[7],m=e[11],w=e[15];return p*(+i*a*h-n*l*h-i*s*f+r*l*f+n*s*d-r*a*d)+y*(+t*a*d-t*l*f+i*o*f-n*o*d+n*l*c-i*a*c)+m*(+t*l*h-t*s*d-i*o*h+r*o*d+i*s*c-r*l*c)+w*(-n*s*c-t*a*h+t*s*f+n*o*h-r*o*f+r*a*c)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,r){const n=this.elements;return e.isVector3?(n[12]=e.x,n[13]=e.y,n[14]=e.z):(n[12]=e,n[13]=t,n[14]=r),this}invert(){const e=this.elements,t=e[0],r=e[1],n=e[2],i=e[3],o=e[4],s=e[5],a=e[6],l=e[7],c=e[8],h=e[9],f=e[10],d=e[11],p=e[12],y=e[13],m=e[14],w=e[15],S=h*m*l-y*f*l+y*a*d-s*m*d-h*a*w+s*f*w,_=p*f*l-c*m*l-p*a*d+o*m*d+c*a*w-o*f*w,A=c*y*l-p*h*l+p*s*d-o*y*d-c*s*w+o*h*w,P=p*h*a-c*y*a-p*s*f+o*y*f+c*s*m-o*h*m,L=t*S+r*_+n*A+i*P;if(L===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const C=1/L;return e[0]=S*C,e[1]=(y*f*i-h*m*i-y*n*d+r*m*d+h*n*w-r*f*w)*C,e[2]=(s*m*i-y*a*i+y*n*l-r*m*l-s*n*w+r*a*w)*C,e[3]=(h*a*i-s*f*i-h*n*l+r*f*l+s*n*d-r*a*d)*C,e[4]=_*C,e[5]=(c*m*i-p*f*i+p*n*d-t*m*d-c*n*w+t*f*w)*C,e[6]=(p*a*i-o*m*i-p*n*l+t*m*l+o*n*w-t*a*w)*C,e[7]=(o*f*i-c*a*i+c*n*l-t*f*l-o*n*d+t*a*d)*C,e[8]=A*C,e[9]=(p*h*i-c*y*i-p*r*d+t*y*d+c*r*w-t*h*w)*C,e[10]=(o*y*i-p*s*i+p*r*l-t*y*l-o*r*w+t*s*w)*C,e[11]=(c*s*i-o*h*i-c*r*l+t*h*l+o*r*d-t*s*d)*C,e[12]=P*C,e[13]=(c*y*n-p*h*n+p*r*f-t*y*f-c*r*m+t*h*m)*C,e[14]=(p*s*n-o*y*n-p*r*a+t*y*a+o*r*m-t*s*m)*C,e[15]=(o*h*n-c*s*n+c*r*a-t*h*a-o*r*f+t*s*f)*C,this}scale(e){const t=this.elements,r=e.x,n=e.y,i=e.z;return t[0]*=r,t[4]*=n,t[8]*=i,t[1]*=r,t[5]*=n,t[9]*=i,t[2]*=r,t[6]*=n,t[10]*=i,t[3]*=r,t[7]*=n,t[11]*=i,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],r=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],n=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,r,n))}makeTranslation(e,t,r){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,r,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),r=Math.sin(e);return this.set(1,0,0,0,0,t,-r,0,0,r,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),r=Math.sin(e);return this.set(t,0,r,0,0,1,0,0,-r,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),r=Math.sin(e);return this.set(t,-r,0,0,r,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const r=Math.cos(t),n=Math.sin(t),i=1-r,o=e.x,s=e.y,a=e.z,l=i*o,c=i*s;return this.set(l*o+r,l*s-n*a,l*a+n*s,0,l*s+n*a,c*s+r,c*a-n*o,0,l*a-n*s,c*a+n*o,i*a*a+r,0,0,0,0,1),this}makeScale(e,t,r){return this.set(e,0,0,0,0,t,0,0,0,0,r,0,0,0,0,1),this}makeShear(e,t,r,n,i,o){return this.set(1,r,i,0,e,1,o,0,t,n,1,0,0,0,0,1),this}compose(e,t,r){const n=this.elements,i=t._x,o=t._y,s=t._z,a=t._w,l=i+i,c=o+o,h=s+s,f=i*l,d=i*c,p=i*h,y=o*c,m=o*h,w=s*h,S=a*l,_=a*c,A=a*h,P=r.x,L=r.y,C=r.z;return n[0]=(1-(y+w))*P,n[1]=(d+A)*P,n[2]=(p-_)*P,n[3]=0,n[4]=(d-A)*L,n[5]=(1-(f+w))*L,n[6]=(m+S)*L,n[7]=0,n[8]=(p+_)*C,n[9]=(m-S)*C,n[10]=(1-(f+y))*C,n[11]=0,n[12]=e.x,n[13]=e.y,n[14]=e.z,n[15]=1,this}decompose(e,t,r){const n=this.elements;let i=St.set(n[0],n[1],n[2]).length();const o=St.set(n[4],n[5],n[6]).length(),s=St.set(n[8],n[9],n[10]).length();this.determinant()<0&&(i=-i),e.x=n[12],e.y=n[13],e.z=n[14],be.copy(this);const l=1/i,c=1/o,h=1/s;return be.elements[0]*=l,be.elements[1]*=l,be.elements[2]*=l,be.elements[4]*=c,be.elements[5]*=c,be.elements[6]*=c,be.elements[8]*=h,be.elements[9]*=h,be.elements[10]*=h,t.setFromRotationMatrix(be),r.x=i,r.y=o,r.z=s,this}makePerspective(e,t,r,n,i,o,s=ht){const a=this.elements,l=2*i/(t-e),c=2*i/(r-n),h=(t+e)/(t-e),f=(r+n)/(r-n);let d,p;if(s===ht)d=-(o+i)/(o-i),p=-2*o*i/(o-i);else if(s===Un)d=-o/(o-i),p=-o*i/(o-i);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+s);return a[0]=l,a[4]=0,a[8]=h,a[12]=0,a[1]=0,a[5]=c,a[9]=f,a[13]=0,a[2]=0,a[6]=0,a[10]=d,a[14]=p,a[3]=0,a[7]=0,a[11]=-1,a[15]=0,this}makeOrthographic(e,t,r,n,i,o,s=ht){const a=this.elements,l=1/(t-e),c=1/(r-n),h=1/(o-i),f=(t+e)*l,d=(r+n)*c;let p,y;if(s===ht)p=(o+i)*h,y=-2*h;else if(s===Un)p=i*h,y=-1*h;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+s);return a[0]=2*l,a[4]=0,a[8]=0,a[12]=-f,a[1]=0,a[5]=2*c,a[9]=0,a[13]=-d,a[2]=0,a[6]=0,a[10]=y,a[14]=-p,a[3]=0,a[7]=0,a[11]=0,a[15]=1,this}equals(e){const t=this.elements,r=e.elements;for(let n=0;n<16;n++)if(t[n]!==r[n])return!1;return!0}fromArray(e,t=0){for(let r=0;r<16;r++)this.elements[r]=e[r+t];return this}toArray(e=[],t=0){const r=this.elements;return e[t]=r[0],e[t+1]=r[1],e[t+2]=r[2],e[t+3]=r[3],e[t+4]=r[4],e[t+5]=r[5],e[t+6]=r[6],e[t+7]=r[7],e[t+8]=r[8],e[t+9]=r[9],e[t+10]=r[10],e[t+11]=r[11],e[t+12]=r[12],e[t+13]=r[13],e[t+14]=r[14],e[t+15]=r[15],e}}const St=new b,be=new B,Xa=new b(0,0,0),qa=new b(1,1,1),$e=new b,_r=new b,se=new b,Vi=new B,Wi=new Me;class Ut{constructor(e=0,t=0,r=0,n=Ut.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=r,this._order=n}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,r,n=this._order){return this._x=e,this._y=t,this._z=r,this._order=n,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,r=!0){const n=e.elements,i=n[0],o=n[4],s=n[8],a=n[1],l=n[5],c=n[9],h=n[2],f=n[6],d=n[10];switch(t){case"XYZ":this._y=Math.asin(K(s,-1,1)),Math.abs(s)<.9999999?(this._x=Math.atan2(-c,d),this._z=Math.atan2(-o,i)):(this._x=Math.atan2(f,l),this._z=0);break;case"YXZ":this._x=Math.asin(-K(c,-1,1)),Math.abs(c)<.9999999?(this._y=Math.atan2(s,d),this._z=Math.atan2(a,l)):(this._y=Math.atan2(-h,i),this._z=0);break;case"ZXY":this._x=Math.asin(K(f,-1,1)),Math.abs(f)<.9999999?(this._y=Math.atan2(-h,d),this._z=Math.atan2(-o,l)):(this._y=0,this._z=Math.atan2(a,i));break;case"ZYX":this._y=Math.asin(-K(h,-1,1)),Math.abs(h)<.9999999?(this._x=Math.atan2(f,d),this._z=Math.atan2(a,i)):(this._x=0,this._z=Math.atan2(-o,l));break;case"YZX":this._z=Math.asin(K(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-c,l),this._y=Math.atan2(-h,i)):(this._x=0,this._y=Math.atan2(s,d));break;case"XZY":this._z=Math.asin(-K(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(f,l),this._y=Math.atan2(s,i)):(this._x=Math.atan2(-c,d),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,r===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,r){return Vi.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Vi,t,r)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Wi.setFromEuler(this),this.setFromQuaternion(Wi,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}Ut.DEFAULT_ORDER="XYZ";class Ya{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let Za=0;const ji=new b,_t=new Me,ze=new B,Ar=new b,Zt=new b,$a=new b,Ka=new Me,Xi=new b(1,0,0),qi=new b(0,1,0),Yi=new b(0,0,1),Ja={type:"added"},Qa={type:"removed"},mn={type:"childadded",child:null},gn={type:"childremoved",child:null};class q extends dr{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Za++}),this.uuid=Se(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=q.DEFAULT_UP.clone();const e=new b,t=new Ut,r=new Me,n=new b(1,1,1);function i(){r.setFromEuler(t,!1)}function o(){t.setFromQuaternion(r,void 0,!1)}t._onChange(i),r._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:r},scale:{configurable:!0,enumerable:!0,value:n},modelViewMatrix:{value:new B},normalMatrix:{value:new Ue}}),this.matrix=new B,this.matrixWorld=new B,this.matrixAutoUpdate=q.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=q.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Ya,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return _t.setFromAxisAngle(e,t),this.quaternion.multiply(_t),this}rotateOnWorldAxis(e,t){return _t.setFromAxisAngle(e,t),this.quaternion.premultiply(_t),this}rotateX(e){return this.rotateOnAxis(Xi,e)}rotateY(e){return this.rotateOnAxis(qi,e)}rotateZ(e){return this.rotateOnAxis(Yi,e)}translateOnAxis(e,t){return ji.copy(e).applyQuaternion(this.quaternion),this.position.add(ji.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Xi,e)}translateY(e){return this.translateOnAxis(qi,e)}translateZ(e){return this.translateOnAxis(Yi,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(ze.copy(this.matrixWorld).invert())}lookAt(e,t,r){e.isVector3?Ar.copy(e):Ar.set(e,t,r);const n=this.parent;this.updateWorldMatrix(!0,!1),Zt.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?ze.lookAt(Zt,Ar,this.up):ze.lookAt(Ar,Zt,this.up),this.quaternion.setFromRotationMatrix(ze),n&&(ze.extractRotation(n.matrixWorld),_t.setFromRotationMatrix(ze),this.quaternion.premultiply(_t.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.parent!==null&&e.parent.remove(e),e.parent=this,this.children.push(e),e.dispatchEvent(Ja),mn.child=e,this.dispatchEvent(mn),mn.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let r=0;r<arguments.length;r++)this.remove(arguments[r]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Qa),gn.child=e,this.dispatchEvent(gn),gn.child=null),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),ze.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),ze.multiply(e.parent.matrixWorld)),e.applyMatrix4(ze),this.add(e),e.updateWorldMatrix(!1,!0),this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let r=0,n=this.children.length;r<n;r++){const o=this.children[r].getObjectByProperty(e,t);if(o!==void 0)return o}}getObjectsByProperty(e,t,r=[]){this[e]===t&&r.push(this);const n=this.children;for(let i=0,o=n.length;i<o;i++)n[i].getObjectsByProperty(e,t,r);return r}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Zt,e,$a),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Zt,Ka,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);const t=this.children;for(let r=0,n=t.length;r<n;r++)t[r].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let r=0,n=t.length;r<n;r++)t[r].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let r=0,n=t.length;r<n;r++){const i=t[r];(i.matrixWorldAutoUpdate===!0||e===!0)&&i.updateMatrixWorld(e)}}updateWorldMatrix(e,t){const r=this.parent;if(e===!0&&r!==null&&r.matrixWorldAutoUpdate===!0&&r.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),t===!0){const n=this.children;for(let i=0,o=n.length;i<o;i++){const s=n[i];s.matrixWorldAutoUpdate===!0&&s.updateWorldMatrix(!1,!0)}}}toJSON(e){const t=e===void 0||typeof e=="string",r={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},r.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const n={};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.castShadow===!0&&(n.castShadow=!0),this.receiveShadow===!0&&(n.receiveShadow=!0),this.visible===!1&&(n.visible=!1),this.frustumCulled===!1&&(n.frustumCulled=!1),this.renderOrder!==0&&(n.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(n.userData=this.userData),n.layers=this.layers.mask,n.matrix=this.matrix.toArray(),n.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(n.matrixAutoUpdate=!1),this.isInstancedMesh&&(n.type="InstancedMesh",n.count=this.count,n.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(n.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(n.type="BatchedMesh",n.perObjectFrustumCulled=this.perObjectFrustumCulled,n.sortObjects=this.sortObjects,n.drawRanges=this._drawRanges,n.reservedRanges=this._reservedRanges,n.visibility=this._visibility,n.active=this._active,n.bounds=this._bounds.map(s=>({boxInitialized:s.boxInitialized,boxMin:s.box.min.toArray(),boxMax:s.box.max.toArray(),sphereInitialized:s.sphereInitialized,sphereRadius:s.sphere.radius,sphereCenter:s.sphere.center.toArray()})),n.maxGeometryCount=this._maxGeometryCount,n.maxVertexCount=this._maxVertexCount,n.maxIndexCount=this._maxIndexCount,n.geometryInitialized=this._geometryInitialized,n.geometryCount=this._geometryCount,n.matricesTexture=this._matricesTexture.toJSON(e),this.boundingSphere!==null&&(n.boundingSphere={center:n.boundingSphere.center.toArray(),radius:n.boundingSphere.radius}),this.boundingBox!==null&&(n.boundingBox={min:n.boundingBox.min.toArray(),max:n.boundingBox.max.toArray()}));function i(s,a){return s[a.uuid]===void 0&&(s[a.uuid]=a.toJSON(e)),a.uuid}if(this.isScene)this.background&&(this.background.isColor?n.background=this.background.toJSON():this.background.isTexture&&(n.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(n.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){n.geometry=i(e.geometries,this.geometry);const s=this.geometry.parameters;if(s!==void 0&&s.shapes!==void 0){const a=s.shapes;if(Array.isArray(a))for(let l=0,c=a.length;l<c;l++){const h=a[l];i(e.shapes,h)}else i(e.shapes,a)}}if(this.isSkinnedMesh&&(n.bindMode=this.bindMode,n.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(i(e.skeletons,this.skeleton),n.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const s=[];for(let a=0,l=this.material.length;a<l;a++)s.push(i(e.materials,this.material[a]));n.material=s}else n.material=i(e.materials,this.material);if(this.children.length>0){n.children=[];for(let s=0;s<this.children.length;s++)n.children.push(this.children[s].toJSON(e).object)}if(this.animations.length>0){n.animations=[];for(let s=0;s<this.animations.length;s++){const a=this.animations[s];n.animations.push(i(e.animations,a))}}if(t){const s=o(e.geometries),a=o(e.materials),l=o(e.textures),c=o(e.images),h=o(e.shapes),f=o(e.skeletons),d=o(e.animations),p=o(e.nodes);s.length>0&&(r.geometries=s),a.length>0&&(r.materials=a),l.length>0&&(r.textures=l),c.length>0&&(r.images=c),h.length>0&&(r.shapes=h),f.length>0&&(r.skeletons=f),d.length>0&&(r.animations=d),p.length>0&&(r.nodes=p)}return r.object=n,r;function o(s){const a=[];for(const l in s){const c=s[l];delete c.metadata,a.push(c)}return a}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let r=0;r<e.children.length;r++){const n=e.children[r];this.add(n.clone())}return this}}q.DEFAULT_UP=new b(0,1,0);q.DEFAULT_MATRIX_AUTO_UPDATE=!0;q.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const we=new b,ke=new b,yn=new b,Fe=new b,At=new b,Ct=new b,Zi=new b,xn=new b,vn=new b,bn=new b;class Ae{constructor(e=new b,t=new b,r=new b){this.a=e,this.b=t,this.c=r}static getNormal(e,t,r,n){n.subVectors(r,t),we.subVectors(e,t),n.cross(we);const i=n.lengthSq();return i>0?n.multiplyScalar(1/Math.sqrt(i)):n.set(0,0,0)}static getBarycoord(e,t,r,n,i){we.subVectors(n,t),ke.subVectors(r,t),yn.subVectors(e,t);const o=we.dot(we),s=we.dot(ke),a=we.dot(yn),l=ke.dot(ke),c=ke.dot(yn),h=o*l-s*s;if(h===0)return i.set(0,0,0),null;const f=1/h,d=(l*a-s*c)*f,p=(o*c-s*a)*f;return i.set(1-d-p,p,d)}static containsPoint(e,t,r,n){return this.getBarycoord(e,t,r,n,Fe)===null?!1:Fe.x>=0&&Fe.y>=0&&Fe.x+Fe.y<=1}static getInterpolation(e,t,r,n,i,o,s,a){return this.getBarycoord(e,t,r,n,Fe)===null?(a.x=0,a.y=0,"z"in a&&(a.z=0),"w"in a&&(a.w=0),null):(a.setScalar(0),a.addScaledVector(i,Fe.x),a.addScaledVector(o,Fe.y),a.addScaledVector(s,Fe.z),a)}static isFrontFacing(e,t,r,n){return we.subVectors(r,t),ke.subVectors(e,t),we.cross(ke).dot(n)<0}set(e,t,r){return this.a.copy(e),this.b.copy(t),this.c.copy(r),this}setFromPointsAndIndices(e,t,r,n){return this.a.copy(e[t]),this.b.copy(e[r]),this.c.copy(e[n]),this}setFromAttributeAndIndices(e,t,r,n){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,r),this.c.fromBufferAttribute(e,n),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return we.subVectors(this.c,this.b),ke.subVectors(this.a,this.b),we.cross(ke).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return Ae.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return Ae.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,r,n,i){return Ae.getInterpolation(e,this.a,this.b,this.c,t,r,n,i)}containsPoint(e){return Ae.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return Ae.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const r=this.a,n=this.b,i=this.c;let o,s;At.subVectors(n,r),Ct.subVectors(i,r),xn.subVectors(e,r);const a=At.dot(xn),l=Ct.dot(xn);if(a<=0&&l<=0)return t.copy(r);vn.subVectors(e,n);const c=At.dot(vn),h=Ct.dot(vn);if(c>=0&&h<=c)return t.copy(n);const f=a*h-c*l;if(f<=0&&a>=0&&c<=0)return o=a/(a-c),t.copy(r).addScaledVector(At,o);bn.subVectors(e,i);const d=At.dot(bn),p=Ct.dot(bn);if(p>=0&&d<=p)return t.copy(i);const y=d*l-a*p;if(y<=0&&l>=0&&p<=0)return s=l/(l-p),t.copy(r).addScaledVector(Ct,s);const m=c*p-d*h;if(m<=0&&h-c>=0&&d-p>=0)return Zi.subVectors(i,n),s=(h-c)/(h-c+(d-p)),t.copy(n).addScaledVector(Zi,s);const w=1/(m+y+f);return o=y*w,s=f*w,t.copy(r).addScaledVector(At,o).addScaledVector(Ct,s)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}const Wo={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Ke={h:0,s:0,l:0},Cr={h:0,s:0,l:0};function wn(u,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?u+(e-u)*6*t:t<1/2?e:t<2/3?u+(e-u)*6*(2/3-t):u}class Z{constructor(e,t,r){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,r)}set(e,t,r){if(t===void 0&&r===void 0){const n=e;n&&n.isColor?this.copy(n):typeof n=="number"?this.setHex(n):typeof n=="string"&&this.setStyle(n)}else this.setRGB(e,t,r);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=ne){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,ce.toWorkingColorSpace(this,t),this}setRGB(e,t,r,n=ce.workingColorSpace){return this.r=e,this.g=t,this.b=r,ce.toWorkingColorSpace(this,n),this}setHSL(e,t,r,n=ce.workingColorSpace){if(e=$n(e,1),t=K(t,0,1),r=K(r,0,1),t===0)this.r=this.g=this.b=r;else{const i=r<=.5?r*(1+t):r+t-r*t,o=2*r-i;this.r=wn(o,i,e+1/3),this.g=wn(o,i,e),this.b=wn(o,i,e-1/3)}return ce.toWorkingColorSpace(this,n),this}setStyle(e,t=ne){function r(i){i!==void 0&&parseFloat(i)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let n;if(n=/^(\w+)\(([^\)]*)\)/.exec(e)){let i;const o=n[1],s=n[2];switch(o){case"rgb":case"rgba":if(i=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(s))return r(i[4]),this.setRGB(Math.min(255,parseInt(i[1],10))/255,Math.min(255,parseInt(i[2],10))/255,Math.min(255,parseInt(i[3],10))/255,t);if(i=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(s))return r(i[4]),this.setRGB(Math.min(100,parseInt(i[1],10))/100,Math.min(100,parseInt(i[2],10))/100,Math.min(100,parseInt(i[3],10))/100,t);break;case"hsl":case"hsla":if(i=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(s))return r(i[4]),this.setHSL(parseFloat(i[1])/360,parseFloat(i[2])/100,parseFloat(i[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(n=/^\#([A-Fa-f\d]+)$/.exec(e)){const i=n[1],o=i.length;if(o===3)return this.setRGB(parseInt(i.charAt(0),16)/15,parseInt(i.charAt(1),16)/15,parseInt(i.charAt(2),16)/15,t);if(o===6)return this.setHex(parseInt(i,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=ne){const r=Wo[e.toLowerCase()];return r!==void 0?this.setHex(r,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Dt(e.r),this.g=Dt(e.g),this.b=Dt(e.b),this}copyLinearToSRGB(e){return this.r=an(e.r),this.g=an(e.g),this.b=an(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=ne){return ce.fromWorkingColorSpace(Q.copy(this),e),Math.round(K(Q.r*255,0,255))*65536+Math.round(K(Q.g*255,0,255))*256+Math.round(K(Q.b*255,0,255))}getHexString(e=ne){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=ce.workingColorSpace){ce.fromWorkingColorSpace(Q.copy(this),t);const r=Q.r,n=Q.g,i=Q.b,o=Math.max(r,n,i),s=Math.min(r,n,i);let a,l;const c=(s+o)/2;if(s===o)a=0,l=0;else{const h=o-s;switch(l=c<=.5?h/(o+s):h/(2-o-s),o){case r:a=(n-i)/h+(n<i?6:0);break;case n:a=(i-r)/h+2;break;case i:a=(r-n)/h+4;break}a/=6}return e.h=a,e.s=l,e.l=c,e}getRGB(e,t=ce.workingColorSpace){return ce.fromWorkingColorSpace(Q.copy(this),t),e.r=Q.r,e.g=Q.g,e.b=Q.b,e}getStyle(e=ne){ce.fromWorkingColorSpace(Q.copy(this),e);const t=Q.r,r=Q.g,n=Q.b;return e!==ne?`color(${e} ${t.toFixed(3)} ${r.toFixed(3)} ${n.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(r*255)},${Math.round(n*255)})`}offsetHSL(e,t,r){return this.getHSL(Ke),this.setHSL(Ke.h+e,Ke.s+t,Ke.l+r)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,r){return this.r=e.r+(t.r-e.r)*r,this.g=e.g+(t.g-e.g)*r,this.b=e.b+(t.b-e.b)*r,this}lerpHSL(e,t){this.getHSL(Ke),e.getHSL(Cr);const r=or(Ke.h,Cr.h,t),n=or(Ke.s,Cr.s,t),i=or(Ke.l,Cr.l,t);return this.setHSL(r,n,i),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,r=this.g,n=this.b,i=e.elements;return this.r=i[0]*t+i[3]*r+i[6]*n,this.g=i[1]*t+i[4]*r+i[7]*n,this.b=i[2]*t+i[5]*r+i[8]*n,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Q=new Z;Z.NAMES=Wo;let el=0;class ft extends dr{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:el++}),this.uuid=Se(),this.name="",this.type="Material",this.blending=_i,this.side=Yr,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Ci,this.blendDst=Pi,this.blendEquation=Ai,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Z(0,0,0),this.blendAlpha=0,this.depthFunc=Mi,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Fi,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=xt,this.stencilZFail=xt,this.stencilZPass=xt,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBuild(){}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const r=e[t];if(r===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}const n=this[t];if(n===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}n&&n.isColor?n.set(r):n&&n.isVector3&&r&&r.isVector3?n.copy(r):this[t]=r}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const r={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};r.uuid=this.uuid,r.type=this.type,this.name!==""&&(r.name=this.name),this.color&&this.color.isColor&&(r.color=this.color.getHex()),this.roughness!==void 0&&(r.roughness=this.roughness),this.metalness!==void 0&&(r.metalness=this.metalness),this.sheen!==void 0&&(r.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(r.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(r.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(r.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(r.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(r.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(r.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(r.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(r.shininess=this.shininess),this.clearcoat!==void 0&&(r.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(r.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(r.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(r.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(r.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,r.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.iridescence!==void 0&&(r.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(r.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(r.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(r.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(r.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(r.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(r.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(r.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(r.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(r.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(r.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(r.lightMap=this.lightMap.toJSON(e).uuid,r.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(r.aoMap=this.aoMap.toJSON(e).uuid,r.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(r.bumpMap=this.bumpMap.toJSON(e).uuid,r.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(r.normalMap=this.normalMap.toJSON(e).uuid,r.normalMapType=this.normalMapType,r.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(r.displacementMap=this.displacementMap.toJSON(e).uuid,r.displacementScale=this.displacementScale,r.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(r.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(r.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(r.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(r.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(r.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(r.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(r.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(r.combine=this.combine)),this.envMapRotation!==void 0&&(r.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(r.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(r.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(r.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(r.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(r.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(r.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(r.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(r.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(r.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(r.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(r.size=this.size),this.shadowSide!==null&&(r.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(r.sizeAttenuation=this.sizeAttenuation),this.blending!==_i&&(r.blending=this.blending),this.side!==Yr&&(r.side=this.side),this.vertexColors===!0&&(r.vertexColors=!0),this.opacity<1&&(r.opacity=this.opacity),this.transparent===!0&&(r.transparent=!0),this.blendSrc!==Ci&&(r.blendSrc=this.blendSrc),this.blendDst!==Pi&&(r.blendDst=this.blendDst),this.blendEquation!==Ai&&(r.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(r.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(r.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(r.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(r.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(r.blendAlpha=this.blendAlpha),this.depthFunc!==Mi&&(r.depthFunc=this.depthFunc),this.depthTest===!1&&(r.depthTest=this.depthTest),this.depthWrite===!1&&(r.depthWrite=this.depthWrite),this.colorWrite===!1&&(r.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(r.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Fi&&(r.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(r.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(r.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==xt&&(r.stencilFail=this.stencilFail),this.stencilZFail!==xt&&(r.stencilZFail=this.stencilZFail),this.stencilZPass!==xt&&(r.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(r.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(r.rotation=this.rotation),this.polygonOffset===!0&&(r.polygonOffset=!0),this.polygonOffsetFactor!==0&&(r.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(r.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(r.linewidth=this.linewidth),this.dashSize!==void 0&&(r.dashSize=this.dashSize),this.gapSize!==void 0&&(r.gapSize=this.gapSize),this.scale!==void 0&&(r.scale=this.scale),this.dithering===!0&&(r.dithering=!0),this.alphaTest>0&&(r.alphaTest=this.alphaTest),this.alphaHash===!0&&(r.alphaHash=!0),this.alphaToCoverage===!0&&(r.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(r.premultipliedAlpha=!0),this.forceSinglePass===!0&&(r.forceSinglePass=!0),this.wireframe===!0&&(r.wireframe=!0),this.wireframeLinewidth>1&&(r.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(r.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(r.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(r.flatShading=!0),this.visible===!1&&(r.visible=!1),this.toneMapped===!1&&(r.toneMapped=!1),this.fog===!1&&(r.fog=!1),Object.keys(this.userData).length>0&&(r.userData=this.userData);function n(i){const o=[];for(const s in i){const a=i[s];delete a.metadata,o.push(a)}return o}if(t){const i=n(e.textures),o=n(e.images);i.length>0&&(r.textures=i),o.length>0&&(r.images=o)}return r}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let r=null;if(t!==null){const n=t.length;r=new Array(n);for(let i=0;i!==n;++i)r[i]=t[i].clone()}return this.clippingPlanes=r,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}class Bt extends ft{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Z(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ut,this.combine=ca,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const Y=new b,Pr=new k;class H{constructor(e,t,r=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=r,this.usage=On,this._updateRange={offset:0,count:-1},this.updateRanges=[],this.gpuType=Zn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}get updateRange(){return Vo("THREE.BufferAttribute: updateRange() is deprecated and will be removed in r169. Use addUpdateRange() instead."),this._updateRange}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,r){e*=this.itemSize,r*=t.itemSize;for(let n=0,i=this.itemSize;n<i;n++)this.array[e+n]=t.array[r+n];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,r=this.count;t<r;t++)Pr.fromBufferAttribute(this,t),Pr.applyMatrix3(e),this.setXY(t,Pr.x,Pr.y);else if(this.itemSize===3)for(let t=0,r=this.count;t<r;t++)Y.fromBufferAttribute(this,t),Y.applyMatrix3(e),this.setXYZ(t,Y.x,Y.y,Y.z);return this}applyMatrix4(e){for(let t=0,r=this.count;t<r;t++)Y.fromBufferAttribute(this,t),Y.applyMatrix4(e),this.setXYZ(t,Y.x,Y.y,Y.z);return this}applyNormalMatrix(e){for(let t=0,r=this.count;t<r;t++)Y.fromBufferAttribute(this,t),Y.applyNormalMatrix(e),this.setXYZ(t,Y.x,Y.y,Y.z);return this}transformDirection(e){for(let t=0,r=this.count;t<r;t++)Y.fromBufferAttribute(this,t),Y.transformDirection(e),this.setXYZ(t,Y.x,Y.y,Y.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let r=this.array[e*this.itemSize+t];return this.normalized&&(r=Ie(r,this.array)),r}setComponent(e,t,r){return this.normalized&&(r=O(r,this.array)),this.array[e*this.itemSize+t]=r,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Ie(t,this.array)),t}setX(e,t){return this.normalized&&(t=O(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Ie(t,this.array)),t}setY(e,t){return this.normalized&&(t=O(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Ie(t,this.array)),t}setZ(e,t){return this.normalized&&(t=O(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Ie(t,this.array)),t}setW(e,t){return this.normalized&&(t=O(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,r){return e*=this.itemSize,this.normalized&&(t=O(t,this.array),r=O(r,this.array)),this.array[e+0]=t,this.array[e+1]=r,this}setXYZ(e,t,r,n){return e*=this.itemSize,this.normalized&&(t=O(t,this.array),r=O(r,this.array),n=O(n,this.array)),this.array[e+0]=t,this.array[e+1]=r,this.array[e+2]=n,this}setXYZW(e,t,r,n,i){return e*=this.itemSize,this.normalized&&(t=O(t,this.array),r=O(r,this.array),n=O(n,this.array),i=O(i,this.array)),this.array[e+0]=t,this.array[e+1]=r,this.array[e+2]=n,this.array[e+3]=i,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==On&&(e.usage=this.usage),e}}class tl extends H{constructor(e,t,r){super(new Uint16Array(e),t,r)}}class rl extends H{constructor(e,t,r){super(new Uint32Array(e),t,r)}}class Kn extends H{constructor(e,t,r){super(new Float32Array(e),t,r)}}let nl=0;const de=new B,In=new q,Pt=new b,ae=new Ne,$t=new Ne,$=new b;class Ce extends dr{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:nl++}),this.uuid=Se(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Oa(e)?rl:tl)(e,1):this.index=e,this}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,r=0){this.groups.push({start:e,count:t,materialIndex:r})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const r=this.attributes.normal;if(r!==void 0){const i=new Ue().getNormalMatrix(e);r.applyNormalMatrix(i),r.needsUpdate=!0}const n=this.attributes.tangent;return n!==void 0&&(n.transformDirection(e),n.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return de.makeRotationFromQuaternion(e),this.applyMatrix4(de),this}rotateX(e){return de.makeRotationX(e),this.applyMatrix4(de),this}rotateY(e){return de.makeRotationY(e),this.applyMatrix4(de),this}rotateZ(e){return de.makeRotationZ(e),this.applyMatrix4(de),this}translate(e,t,r){return de.makeTranslation(e,t,r),this.applyMatrix4(de),this}scale(e,t,r){return de.makeScale(e,t,r),this.applyMatrix4(de),this}lookAt(e){return In.lookAt(e),In.updateMatrix(),this.applyMatrix4(In.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Pt).negate(),this.translate(Pt.x,Pt.y,Pt.z),this}setFromPoints(e){const t=[];for(let r=0,n=e.length;r<n;r++){const i=e[r];t.push(i.x,i.y,i.z||0)}return this.setAttribute("position",new Kn(t,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Ne);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new b(-1/0,-1/0,-1/0),new b(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let r=0,n=t.length;r<n;r++){const i=t[r];ae.setFromBufferAttribute(i),this.morphTargetsRelative?($.addVectors(this.boundingBox.min,ae.min),this.boundingBox.expandByPoint($),$.addVectors(this.boundingBox.max,ae.max),this.boundingBox.expandByPoint($)):(this.boundingBox.expandByPoint(ae.min),this.boundingBox.expandByPoint(ae.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new _e);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new b,1/0);return}if(e){const r=this.boundingSphere.center;if(ae.setFromBufferAttribute(e),t)for(let i=0,o=t.length;i<o;i++){const s=t[i];$t.setFromBufferAttribute(s),this.morphTargetsRelative?($.addVectors(ae.min,$t.min),ae.expandByPoint($),$.addVectors(ae.max,$t.max),ae.expandByPoint($)):(ae.expandByPoint($t.min),ae.expandByPoint($t.max))}ae.getCenter(r);let n=0;for(let i=0,o=e.count;i<o;i++)$.fromBufferAttribute(e,i),n=Math.max(n,r.distanceToSquared($));if(t)for(let i=0,o=t.length;i<o;i++){const s=t[i],a=this.morphTargetsRelative;for(let l=0,c=s.count;l<c;l++)$.fromBufferAttribute(s,l),a&&(Pt.fromBufferAttribute(e,l),$.add(Pt)),n=Math.max(n,r.distanceToSquared($))}this.boundingSphere.radius=Math.sqrt(n),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const r=t.position,n=t.normal,i=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new H(new Float32Array(4*r.count),4));const o=this.getAttribute("tangent"),s=[],a=[];for(let R=0;R<r.count;R++)s[R]=new b,a[R]=new b;const l=new b,c=new b,h=new b,f=new k,d=new k,p=new k,y=new b,m=new b;function w(R,G,W){l.fromBufferAttribute(r,R),c.fromBufferAttribute(r,G),h.fromBufferAttribute(r,W),f.fromBufferAttribute(i,R),d.fromBufferAttribute(i,G),p.fromBufferAttribute(i,W),c.sub(l),h.sub(l),d.sub(f),p.sub(f);const j=1/(d.x*p.y-p.x*d.y);isFinite(j)&&(y.copy(c).multiplyScalar(p.y).addScaledVector(h,-d.y).multiplyScalar(j),m.copy(h).multiplyScalar(d.x).addScaledVector(c,-p.x).multiplyScalar(j),s[R].add(y),s[G].add(y),s[W].add(y),a[R].add(m),a[G].add(m),a[W].add(m))}let S=this.groups;S.length===0&&(S=[{start:0,count:e.count}]);for(let R=0,G=S.length;R<G;++R){const W=S[R],j=W.start,ie=W.count;for(let X=j,ye=j+ie;X<ye;X+=3)w(e.getX(X+0),e.getX(X+1),e.getX(X+2))}const _=new b,A=new b,P=new b,L=new b;function C(R){P.fromBufferAttribute(n,R),L.copy(P);const G=s[R];_.copy(G),_.sub(P.multiplyScalar(P.dot(G))).normalize(),A.crossVectors(L,G);const j=A.dot(a[R])<0?-1:1;o.setXYZW(R,_.x,_.y,_.z,j)}for(let R=0,G=S.length;R<G;++R){const W=S[R],j=W.start,ie=W.count;for(let X=j,ye=j+ie;X<ye;X+=3)C(e.getX(X+0)),C(e.getX(X+1)),C(e.getX(X+2))}}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let r=this.getAttribute("normal");if(r===void 0)r=new H(new Float32Array(t.count*3),3),this.setAttribute("normal",r);else for(let f=0,d=r.count;f<d;f++)r.setXYZ(f,0,0,0);const n=new b,i=new b,o=new b,s=new b,a=new b,l=new b,c=new b,h=new b;if(e)for(let f=0,d=e.count;f<d;f+=3){const p=e.getX(f+0),y=e.getX(f+1),m=e.getX(f+2);n.fromBufferAttribute(t,p),i.fromBufferAttribute(t,y),o.fromBufferAttribute(t,m),c.subVectors(o,i),h.subVectors(n,i),c.cross(h),s.fromBufferAttribute(r,p),a.fromBufferAttribute(r,y),l.fromBufferAttribute(r,m),s.add(c),a.add(c),l.add(c),r.setXYZ(p,s.x,s.y,s.z),r.setXYZ(y,a.x,a.y,a.z),r.setXYZ(m,l.x,l.y,l.z)}else for(let f=0,d=t.count;f<d;f+=3)n.fromBufferAttribute(t,f+0),i.fromBufferAttribute(t,f+1),o.fromBufferAttribute(t,f+2),c.subVectors(o,i),h.subVectors(n,i),c.cross(h),r.setXYZ(f+0,c.x,c.y,c.z),r.setXYZ(f+1,c.x,c.y,c.z),r.setXYZ(f+2,c.x,c.y,c.z);this.normalizeNormals(),r.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let t=0,r=e.count;t<r;t++)$.fromBufferAttribute(e,t),$.normalize(),e.setXYZ(t,$.x,$.y,$.z)}toNonIndexed(){function e(s,a){const l=s.array,c=s.itemSize,h=s.normalized,f=new l.constructor(a.length*c);let d=0,p=0;for(let y=0,m=a.length;y<m;y++){s.isInterleavedBufferAttribute?d=a[y]*s.data.stride+s.offset:d=a[y]*c;for(let w=0;w<c;w++)f[p++]=l[d++]}return new H(f,c,h)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new Ce,r=this.index.array,n=this.attributes;for(const s in n){const a=n[s],l=e(a,r);t.setAttribute(s,l)}const i=this.morphAttributes;for(const s in i){const a=[],l=i[s];for(let c=0,h=l.length;c<h;c++){const f=l[c],d=e(f,r);a.push(d)}t.morphAttributes[s]=a}t.morphTargetsRelative=this.morphTargetsRelative;const o=this.groups;for(let s=0,a=o.length;s<a;s++){const l=o[s];t.addGroup(l.start,l.count,l.materialIndex)}return t}toJSON(){const e={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){const a=this.parameters;for(const l in a)a[l]!==void 0&&(e[l]=a[l]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const r=this.attributes;for(const a in r){const l=r[a];e.data.attributes[a]=l.toJSON(e.data)}const n={};let i=!1;for(const a in this.morphAttributes){const l=this.morphAttributes[a],c=[];for(let h=0,f=l.length;h<f;h++){const d=l[h];c.push(d.toJSON(e.data))}c.length>0&&(n[a]=c,i=!0)}i&&(e.data.morphAttributes=n,e.data.morphTargetsRelative=this.morphTargetsRelative);const o=this.groups;o.length>0&&(e.data.groups=JSON.parse(JSON.stringify(o)));const s=this.boundingSphere;return s!==null&&(e.data.boundingSphere={center:s.center.toArray(),radius:s.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const r=e.index;r!==null&&this.setIndex(r.clone(t));const n=e.attributes;for(const l in n){const c=n[l];this.setAttribute(l,c.clone(t))}const i=e.morphAttributes;for(const l in i){const c=[],h=i[l];for(let f=0,d=h.length;f<d;f++)c.push(h[f].clone(t));this.morphAttributes[l]=c}this.morphTargetsRelative=e.morphTargetsRelative;const o=e.groups;for(let l=0,c=o.length;l<c;l++){const h=o[l];this.addGroup(h.start,h.count,h.materialIndex)}const s=e.boundingBox;s!==null&&(this.boundingBox=s.clone());const a=e.boundingSphere;return a!==null&&(this.boundingSphere=a.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const $i=new B,at=new pr,Mr=new _e,Ki=new b,Mt=new b,Tt=new b,Rt=new b,Sn=new b,Tr=new b,Rr=new k,Lr=new k,Er=new k,Ji=new b,Qi=new b,eo=new b,Br=new b,Dr=new b;let Oe=class extends q{constructor(e=new Ce,t=new Bt){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,r=Object.keys(t);if(r.length>0){const n=t[r[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let i=0,o=n.length;i<o;i++){const s=n[i].name||String(i);this.morphTargetInfluences.push(0),this.morphTargetDictionary[s]=i}}}}getVertexPosition(e,t){const r=this.geometry,n=r.attributes.position,i=r.morphAttributes.position,o=r.morphTargetsRelative;t.fromBufferAttribute(n,e);const s=this.morphTargetInfluences;if(i&&s){Tr.set(0,0,0);for(let a=0,l=i.length;a<l;a++){const c=s[a],h=i[a];c!==0&&(Sn.fromBufferAttribute(h,e),o?Tr.addScaledVector(Sn,c):Tr.addScaledVector(Sn.sub(t),c))}t.add(Tr)}return t}raycast(e,t){const r=this.geometry,n=this.material,i=this.matrixWorld;n!==void 0&&(r.boundingSphere===null&&r.computeBoundingSphere(),Mr.copy(r.boundingSphere),Mr.applyMatrix4(i),at.copy(e.ray).recast(e.near),!(Mr.containsPoint(at.origin)===!1&&(at.intersectSphere(Mr,Ki)===null||at.origin.distanceToSquared(Ki)>(e.far-e.near)**2))&&($i.copy(i).invert(),at.copy(e.ray).applyMatrix4($i),!(r.boundingBox!==null&&at.intersectsBox(r.boundingBox)===!1)&&this._computeIntersections(e,t,at)))}_computeIntersections(e,t,r){let n;const i=this.geometry,o=this.material,s=i.index,a=i.attributes.position,l=i.attributes.uv,c=i.attributes.uv1,h=i.attributes.normal,f=i.groups,d=i.drawRange;if(s!==null)if(Array.isArray(o))for(let p=0,y=f.length;p<y;p++){const m=f[p],w=o[m.materialIndex],S=Math.max(m.start,d.start),_=Math.min(s.count,Math.min(m.start+m.count,d.start+d.count));for(let A=S,P=_;A<P;A+=3){const L=s.getX(A),C=s.getX(A+1),R=s.getX(A+2);n=zr(this,w,e,r,l,c,h,L,C,R),n&&(n.faceIndex=Math.floor(A/3),n.face.materialIndex=m.materialIndex,t.push(n))}}else{const p=Math.max(0,d.start),y=Math.min(s.count,d.start+d.count);for(let m=p,w=y;m<w;m+=3){const S=s.getX(m),_=s.getX(m+1),A=s.getX(m+2);n=zr(this,o,e,r,l,c,h,S,_,A),n&&(n.faceIndex=Math.floor(m/3),t.push(n))}}else if(a!==void 0)if(Array.isArray(o))for(let p=0,y=f.length;p<y;p++){const m=f[p],w=o[m.materialIndex],S=Math.max(m.start,d.start),_=Math.min(a.count,Math.min(m.start+m.count,d.start+d.count));for(let A=S,P=_;A<P;A+=3){const L=A,C=A+1,R=A+2;n=zr(this,w,e,r,l,c,h,L,C,R),n&&(n.faceIndex=Math.floor(A/3),n.face.materialIndex=m.materialIndex,t.push(n))}}else{const p=Math.max(0,d.start),y=Math.min(a.count,d.start+d.count);for(let m=p,w=y;m<w;m+=3){const S=m,_=m+1,A=m+2;n=zr(this,o,e,r,l,c,h,S,_,A),n&&(n.faceIndex=Math.floor(m/3),t.push(n))}}}};function il(u,e,t,r,n,i,o,s){let a;if(e.side===aa?a=r.intersectTriangle(o,i,n,!0,s):a=r.intersectTriangle(n,i,o,e.side===Yr,s),a===null)return null;Dr.copy(s),Dr.applyMatrix4(u.matrixWorld);const l=t.ray.origin.distanceTo(Dr);return l<t.near||l>t.far?null:{distance:l,point:Dr.clone(),object:u}}function zr(u,e,t,r,n,i,o,s,a,l){u.getVertexPosition(s,Mt),u.getVertexPosition(a,Tt),u.getVertexPosition(l,Rt);const c=il(u,e,t,r,Mt,Tt,Rt,Br);if(c){n&&(Rr.fromBufferAttribute(n,s),Lr.fromBufferAttribute(n,a),Er.fromBufferAttribute(n,l),c.uv=Ae.getInterpolation(Br,Mt,Tt,Rt,Rr,Lr,Er,new k)),i&&(Rr.fromBufferAttribute(i,s),Lr.fromBufferAttribute(i,a),Er.fromBufferAttribute(i,l),c.uv1=Ae.getInterpolation(Br,Mt,Tt,Rt,Rr,Lr,Er,new k)),o&&(Ji.fromBufferAttribute(o,s),Qi.fromBufferAttribute(o,a),eo.fromBufferAttribute(o,l),c.normal=Ae.getInterpolation(Br,Mt,Tt,Rt,Ji,Qi,eo,new b),c.normal.dot(r.direction)>0&&c.normal.multiplyScalar(-1));const h={a:s,b:a,c:l,normal:new b,materialIndex:0};Ae.getNormal(Mt,Tt,Rt,h.normal),c.face=h}return c}class jo extends q{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new B,this.projectionMatrix=new B,this.projectionMatrixInverse=new B,this.coordinateSystem=ht}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const Je=new b,to=new k,ro=new k;class Qr extends jo{constructor(e=50,t=1,r=.1,n=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=r,this.far=n,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=hr*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(ir*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return hr*2*Math.atan(Math.tan(ir*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,r){Je.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Je.x,Je.y).multiplyScalar(-e/Je.z),Je.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),r.set(Je.x,Je.y).multiplyScalar(-e/Je.z)}getViewSize(e,t){return this.getViewBounds(e,to,ro),t.subVectors(ro,to)}setViewOffset(e,t,r,n,i,o){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=r,this.view.offsetY=n,this.view.width=i,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(ir*.5*this.fov)/this.zoom,r=2*t,n=this.aspect*r,i=-.5*n;const o=this.view;if(this.view!==null&&this.view.enabled){const a=o.fullWidth,l=o.fullHeight;i+=o.offsetX*n/a,t-=o.offsetY*r/l,n*=o.width/a,r*=o.height/l}const s=this.filmOffset;s!==0&&(i+=e*s/this.getFilmWidth()),this.projectionMatrix.makePerspective(i,i+n,t,t-r,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}const _n=new b,ol=new b,sl=new Ue;class ue{constructor(e=new b(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,r,n){return this.normal.set(e,t,r),this.constant=n,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,r){const n=_n.subVectors(r,t).cross(ol.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(n,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){const r=e.delta(_n),n=this.normal.dot(r);if(n===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const i=-(e.start.dot(this.normal)+this.constant)/n;return i<0||i>1?null:t.copy(e.start).addScaledVector(r,i)}intersectsLine(e){const t=this.distanceToPoint(e.start),r=this.distanceToPoint(e.end);return t<0&&r>0||r<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const r=t||sl.getNormalMatrix(e),n=this.coplanarPoint(_n).applyMatrix4(e),i=this.normal.applyMatrix3(r).normalize();return this.constant=-n.dot(i),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}}const lt=new _e,kr=new b;let al=class{constructor(e=new ue,t=new ue,r=new ue,n=new ue,i=new ue,o=new ue){this.planes=[e,t,r,n,i,o]}set(e,t,r,n,i,o){const s=this.planes;return s[0].copy(e),s[1].copy(t),s[2].copy(r),s[3].copy(n),s[4].copy(i),s[5].copy(o),this}copy(e){const t=this.planes;for(let r=0;r<6;r++)t[r].copy(e.planes[r]);return this}setFromProjectionMatrix(e,t=ht){const r=this.planes,n=e.elements,i=n[0],o=n[1],s=n[2],a=n[3],l=n[4],c=n[5],h=n[6],f=n[7],d=n[8],p=n[9],y=n[10],m=n[11],w=n[12],S=n[13],_=n[14],A=n[15];if(r[0].setComponents(a-i,f-l,m-d,A-w).normalize(),r[1].setComponents(a+i,f+l,m+d,A+w).normalize(),r[2].setComponents(a+o,f+c,m+p,A+S).normalize(),r[3].setComponents(a-o,f-c,m-p,A-S).normalize(),r[4].setComponents(a-s,f-h,m-y,A-_).normalize(),t===ht)r[5].setComponents(a+s,f+h,m+y,A+_).normalize();else if(t===Un)r[5].setComponents(s,h,y,_).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),lt.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),lt.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(lt)}intersectsSprite(e){return lt.center.set(0,0,0),lt.radius=.7071067811865476,lt.applyMatrix4(e.matrixWorld),this.intersectsSphere(lt)}intersectsSphere(e){const t=this.planes,r=e.center,n=-e.radius;for(let i=0;i<6;i++)if(t[i].distanceToPoint(r)<n)return!1;return!0}intersectsBox(e){const t=this.planes;for(let r=0;r<6;r++){const n=t[r];if(kr.x=n.normal.x>0?e.max.x:e.min.x,kr.y=n.normal.y>0?e.max.y:e.min.y,kr.z=n.normal.z>0?e.max.z:e.min.z,n.distanceToPoint(kr)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let r=0;r<6;r++)if(t[r].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};class Xo extends jo{constructor(e=-1,t=1,r=1,n=-1,i=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=r,this.bottom=n,this.near=i,this.far=o,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,r,n,i,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=r,this.view.offsetY=n,this.view.width=i,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),r=(this.right+this.left)/2,n=(this.top+this.bottom)/2;let i=r-e,o=r+e,s=n+t,a=n-t;if(this.view!==null&&this.view.enabled){const l=(this.right-this.left)/this.view.fullWidth/this.zoom,c=(this.top-this.bottom)/this.view.fullHeight/this.zoom;i+=l*this.view.offsetX,o=i+l*this.view.width,s-=c*this.view.offsetY,a=s-c*this.view.height}this.projectionMatrix.makeOrthographic(i,o,s,a,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}class ll extends ge{constructor(e,t,r,n,i,o,s,a,l,c){if(c=c!==void 0?c:nn,c!==nn&&c!==Ri)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");r===void 0&&c===nn&&(r=ma),r===void 0&&c===Ri&&(r=ga),super(null,n,i,o,s,a,c,r,l),this.isDepthTexture=!0,this.image={width:e,height:t},this.magFilter=s!==void 0?s:cr,this.minFilter=a!==void 0?a:cr,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}}const cl=new ll(1,1);cl.compareFunction=Ia;class Xr extends q{constructor(){super(),this.isGroup=!0,this.type="Group"}}class ul{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e!==void 0?e.length/t:0,this.usage=On,this._updateRange={offset:0,count:-1},this.updateRanges=[],this.version=0,this.uuid=Se()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}get updateRange(){return Vo("THREE.InterleavedBuffer: updateRange() is deprecated and will be removed in r169. Use addUpdateRange() instead."),this._updateRange}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,r){e*=this.stride,r*=t.stride;for(let n=0,i=this.stride;n<i;n++)this.array[e+n]=t.array[r+n];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Se()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);const t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),r=new this.constructor(t,this.stride);return r.setUsage(this.usage),r}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){return e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Se()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}}const re=new b;class Jn{constructor(e,t,r,n=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=e,this.itemSize=t,this.offset=r,this.normalized=n}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,r=this.data.count;t<r;t++)re.fromBufferAttribute(this,t),re.applyMatrix4(e),this.setXYZ(t,re.x,re.y,re.z);return this}applyNormalMatrix(e){for(let t=0,r=this.count;t<r;t++)re.fromBufferAttribute(this,t),re.applyNormalMatrix(e),this.setXYZ(t,re.x,re.y,re.z);return this}transformDirection(e){for(let t=0,r=this.count;t<r;t++)re.fromBufferAttribute(this,t),re.transformDirection(e),this.setXYZ(t,re.x,re.y,re.z);return this}getComponent(e,t){let r=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(r=Ie(r,this.array)),r}setComponent(e,t,r){return this.normalized&&(r=O(r,this.array)),this.data.array[e*this.data.stride+this.offset+t]=r,this}setX(e,t){return this.normalized&&(t=O(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=O(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=O(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=O(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=Ie(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=Ie(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=Ie(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=Ie(t,this.array)),t}setXY(e,t,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=O(t,this.array),r=O(r,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=r,this}setXYZ(e,t,r,n){return e=e*this.data.stride+this.offset,this.normalized&&(t=O(t,this.array),r=O(r,this.array),n=O(n,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=r,this.data.array[e+2]=n,this}setXYZW(e,t,r,n,i){return e=e*this.data.stride+this.offset,this.normalized&&(t=O(t,this.array),r=O(r,this.array),n=O(n,this.array),i=O(i,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=r,this.data.array[e+2]=n,this.data.array[e+3]=i,this}clone(e){if(e===void 0){console.log("THREE.InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");const t=[];for(let r=0;r<this.count;r++){const n=r*this.data.stride+this.offset;for(let i=0;i<this.itemSize;i++)t.push(this.data.array[n+i])}return new H(new this.array.constructor(t),this.itemSize,this.normalized)}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.clone(e)),new Jn(e.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){console.log("THREE.InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");const t=[];for(let r=0;r<this.count;r++){const n=r*this.data.stride+this.offset;for(let i=0;i<this.itemSize;i++)t.push(this.data.array[n+i])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:t,normalized:this.normalized}}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}}const no=new b,io=new me,oo=new me,hl=new b,so=new B,Fr=new b,An=new _e,ao=new B,Cn=new pr;class fl extends Oe{constructor(e,t){super(e,t),this.isSkinnedMesh=!0,this.type="SkinnedMesh",this.bindMode=Ti,this.bindMatrix=new B,this.bindMatrixInverse=new B,this.boundingBox=null,this.boundingSphere=null}computeBoundingBox(){const e=this.geometry;this.boundingBox===null&&(this.boundingBox=new Ne),this.boundingBox.makeEmpty();const t=e.getAttribute("position");for(let r=0;r<t.count;r++)this.getVertexPosition(r,Fr),this.boundingBox.expandByPoint(Fr)}computeBoundingSphere(){const e=this.geometry;this.boundingSphere===null&&(this.boundingSphere=new _e),this.boundingSphere.makeEmpty();const t=e.getAttribute("position");for(let r=0;r<t.count;r++)this.getVertexPosition(r,Fr),this.boundingSphere.expandByPoint(Fr)}copy(e,t){return super.copy(e,t),this.bindMode=e.bindMode,this.bindMatrix.copy(e.bindMatrix),this.bindMatrixInverse.copy(e.bindMatrixInverse),this.skeleton=e.skeleton,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}raycast(e,t){const r=this.material,n=this.matrixWorld;r!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),An.copy(this.boundingSphere),An.applyMatrix4(n),e.ray.intersectsSphere(An)!==!1&&(ao.copy(n).invert(),Cn.copy(e.ray).applyMatrix4(ao),!(this.boundingBox!==null&&Cn.intersectsBox(this.boundingBox)===!1)&&this._computeIntersections(e,t,Cn)))}getVertexPosition(e,t){return super.getVertexPosition(e,t),this.applyBoneTransform(e,t),t}bind(e,t){this.skeleton=e,t===void 0&&(this.updateMatrixWorld(!0),this.skeleton.calculateInverses(),t=this.matrixWorld),this.bindMatrix.copy(t),this.bindMatrixInverse.copy(t).invert()}pose(){this.skeleton.pose()}normalizeSkinWeights(){const e=new me,t=this.geometry.attributes.skinWeight;for(let r=0,n=t.count;r<n;r++){e.fromBufferAttribute(t,r);const i=1/e.manhattanLength();i!==1/0?e.multiplyScalar(i):e.set(1,0,0,0),t.setXYZW(r,e.x,e.y,e.z,e.w)}}updateMatrixWorld(e){super.updateMatrixWorld(e),this.bindMode===Ti?this.bindMatrixInverse.copy(this.matrixWorld).invert():this.bindMode===ua?this.bindMatrixInverse.copy(this.bindMatrix).invert():console.warn("THREE.SkinnedMesh: Unrecognized bindMode: "+this.bindMode)}applyBoneTransform(e,t){const r=this.skeleton,n=this.geometry;io.fromBufferAttribute(n.attributes.skinIndex,e),oo.fromBufferAttribute(n.attributes.skinWeight,e),no.copy(t).applyMatrix4(this.bindMatrix),t.set(0,0,0);for(let i=0;i<4;i++){const o=oo.getComponent(i);if(o!==0){const s=io.getComponent(i);so.multiplyMatrices(r.bones[s].matrixWorld,r.boneInverses[s]),t.addScaledVector(hl.copy(no).applyMatrix4(so),o)}}return t.applyMatrix4(this.bindMatrixInverse)}}class qo extends q{constructor(){super(),this.isBone=!0,this.type="Bone"}}class Yo extends ge{constructor(e=null,t=1,r=1,n,i,o,s,a,l=cr,c=cr,h,f){super(null,o,s,a,l,c,n,i,h,f),this.isDataTexture=!0,this.image={data:e,width:t,height:r},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const lo=new B,dl=new B;class Qn{constructor(e=[],t=[]){this.uuid=Se(),this.bones=e.slice(0),this.boneInverses=t,this.boneMatrices=null,this.boneTexture=null,this.init()}init(){const e=this.bones,t=this.boneInverses;if(this.boneMatrices=new Float32Array(e.length*16),t.length===0)this.calculateInverses();else if(e.length!==t.length){console.warn("THREE.Skeleton: Number of inverse bone matrices does not match amount of bones."),this.boneInverses=[];for(let r=0,n=this.bones.length;r<n;r++)this.boneInverses.push(new B)}}calculateInverses(){this.boneInverses.length=0;for(let e=0,t=this.bones.length;e<t;e++){const r=new B;this.bones[e]&&r.copy(this.bones[e].matrixWorld).invert(),this.boneInverses.push(r)}}pose(){for(let e=0,t=this.bones.length;e<t;e++){const r=this.bones[e];r&&r.matrixWorld.copy(this.boneInverses[e]).invert()}for(let e=0,t=this.bones.length;e<t;e++){const r=this.bones[e];r&&(r.parent&&r.parent.isBone?(r.matrix.copy(r.parent.matrixWorld).invert(),r.matrix.multiply(r.matrixWorld)):r.matrix.copy(r.matrixWorld),r.matrix.decompose(r.position,r.quaternion,r.scale))}}update(){const e=this.bones,t=this.boneInverses,r=this.boneMatrices,n=this.boneTexture;for(let i=0,o=e.length;i<o;i++){const s=e[i]?e[i].matrixWorld:dl;lo.multiplyMatrices(s,t[i]),lo.toArray(r,i*16)}n!==null&&(n.needsUpdate=!0)}clone(){return new Qn(this.bones,this.boneInverses)}computeBoneTexture(){let e=Math.sqrt(this.bones.length*4);e=Math.ceil(e/4)*4,e=Math.max(e,4);const t=new Float32Array(e*e*4);t.set(this.boneMatrices);const r=new Yo(t,e,e,Go,Zn);return r.needsUpdate=!0,this.boneMatrices=t,this.boneTexture=r,this}getBoneByName(e){for(let t=0,r=this.bones.length;t<r;t++){const n=this.bones[t];if(n.name===e)return n}}dispose(){this.boneTexture!==null&&(this.boneTexture.dispose(),this.boneTexture=null)}fromJSON(e,t){this.uuid=e.uuid;for(let r=0,n=e.bones.length;r<n;r++){const i=e.bones[r];let o=t[i];o===void 0&&(console.warn("THREE.Skeleton: No bone found with UUID:",i),o=new qo),this.bones.push(o),this.boneInverses.push(new B().fromArray(e.boneInverses[r]))}return this.init(),this}toJSON(){const e={metadata:{version:4.6,type:"Skeleton",generator:"Skeleton.toJSON"},bones:[],boneInverses:[]};e.uuid=this.uuid;const t=this.bones,r=this.boneInverses;for(let n=0,i=t.length;n<i;n++){const o=t[n];e.bones.push(o.uuid);const s=r[n];e.boneInverses.push(s.toArray())}return e}}class Hn extends H{constructor(e,t,r,n=1){super(e,t,r),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=n}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){const e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}}const Lt=new B,co=new B,Gr=[],uo=new Ne,pl=new B,Kt=new Oe,Jt=new _e;class ml extends Oe{constructor(e,t,r){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new Hn(new Float32Array(r*16),16),this.instanceColor=null,this.morphTexture=null,this.count=r,this.boundingBox=null,this.boundingSphere=null;for(let n=0;n<r;n++)this.setMatrixAt(n,pl)}computeBoundingBox(){const e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new Ne),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let r=0;r<t;r++)this.getMatrixAt(r,Lt),uo.copy(e.boundingBox).applyMatrix4(Lt),this.boundingBox.union(uo)}computeBoundingSphere(){const e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new _e),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let r=0;r<t;r++)this.getMatrixAt(r,Lt),Jt.copy(e.boundingSphere).applyMatrix4(Lt),this.boundingSphere.union(Jt)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){const r=t.morphTargetInfluences,n=this.morphTexture.source.data.data,i=r.length+1,o=e*i+1;for(let s=0;s<r.length;s++)r[s]=n[o+s]}raycast(e,t){const r=this.matrixWorld,n=this.count;if(Kt.geometry=this.geometry,Kt.material=this.material,Kt.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Jt.copy(this.boundingSphere),Jt.applyMatrix4(r),e.ray.intersectsSphere(Jt)!==!1))for(let i=0;i<n;i++){this.getMatrixAt(i,Lt),co.multiplyMatrices(r,Lt),Kt.matrixWorld=co,Kt.raycast(e,Gr);for(let o=0,s=Gr.length;o<s;o++){const a=Gr[o];a.instanceId=i,a.object=this,t.push(a)}Gr.length=0}}setColorAt(e,t){this.instanceColor===null&&(this.instanceColor=new Hn(new Float32Array(this.instanceMatrix.count*3),3)),t.toArray(this.instanceColor.array,e*3)}setMatrixAt(e,t){t.toArray(this.instanceMatrix.array,e*16)}setMorphAt(e,t){const r=t.morphTargetInfluences,n=r.length+1;this.morphTexture===null&&(this.morphTexture=new Yo(new Float32Array(n*this.count),n,this.count,ya,Zn));const i=this.morphTexture.source.data.data;let o=0;for(let l=0;l<r.length;l++)o+=r[l];const s=this.geometry.morphTargetsRelative?1:1-o,a=n*e;i[a]=s,i.set(r,a+1)}updateMorphTargets(){}dispose(){this.dispatchEvent({type:"dispose"})}}class Zo extends ft{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Z(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}}const ho=new b,fo=new b,po=new B,Pn=new pr,Or=new _e;class ei extends q{constructor(e=new Ce,t=new Zo){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){const e=this.geometry;if(e.index===null){const t=e.attributes.position,r=[0];for(let n=1,i=t.count;n<i;n++)ho.fromBufferAttribute(t,n-1),fo.fromBufferAttribute(t,n),r[n]=r[n-1],r[n]+=ho.distanceTo(fo);e.setAttribute("lineDistance",new Kn(r,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){const r=this.geometry,n=this.matrixWorld,i=e.params.Line.threshold,o=r.drawRange;if(r.boundingSphere===null&&r.computeBoundingSphere(),Or.copy(r.boundingSphere),Or.applyMatrix4(n),Or.radius+=i,e.ray.intersectsSphere(Or)===!1)return;po.copy(n).invert(),Pn.copy(e.ray).applyMatrix4(po);const s=i/((this.scale.x+this.scale.y+this.scale.z)/3),a=s*s,l=new b,c=new b,h=new b,f=new b,d=this.isLineSegments?2:1,p=r.index,m=r.attributes.position;if(p!==null){const w=Math.max(0,o.start),S=Math.min(p.count,o.start+o.count);for(let _=w,A=S-1;_<A;_+=d){const P=p.getX(_),L=p.getX(_+1);if(l.fromBufferAttribute(m,P),c.fromBufferAttribute(m,L),Pn.distanceSqToSegment(l,c,f,h)>a)continue;f.applyMatrix4(this.matrixWorld);const R=e.ray.origin.distanceTo(f);R<e.near||R>e.far||t.push({distance:R,point:h.clone().applyMatrix4(this.matrixWorld),index:_,face:null,faceIndex:null,object:this})}}else{const w=Math.max(0,o.start),S=Math.min(m.count,o.start+o.count);for(let _=w,A=S-1;_<A;_+=d){if(l.fromBufferAttribute(m,_),c.fromBufferAttribute(m,_+1),Pn.distanceSqToSegment(l,c,f,h)>a)continue;f.applyMatrix4(this.matrixWorld);const L=e.ray.origin.distanceTo(f);L<e.near||L>e.far||t.push({distance:L,point:h.clone().applyMatrix4(this.matrixWorld),index:_,face:null,faceIndex:null,object:this})}}}updateMorphTargets(){const t=this.geometry.morphAttributes,r=Object.keys(t);if(r.length>0){const n=t[r[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let i=0,o=n.length;i<o;i++){const s=n[i].name||String(i);this.morphTargetInfluences.push(0),this.morphTargetDictionary[s]=i}}}}}const mo=new b,go=new b;class gl extends ei{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){const e=this.geometry;if(e.index===null){const t=e.attributes.position,r=[];for(let n=0,i=t.count;n<i;n+=2)mo.fromBufferAttribute(t,n),go.fromBufferAttribute(t,n+1),r[n]=n===0?0:r[n-1],r[n+1]=r[n]+mo.distanceTo(go);e.setAttribute("lineDistance",new Kn(r,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class yl extends ei{constructor(e,t){super(e,t),this.isLineLoop=!0,this.type="LineLoop"}}class $o extends ft{constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new Z(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}}const yo=new B,Vn=new pr,Ur=new _e,Nr=new b;class xl extends q{constructor(e=new Ce,t=new $o){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}raycast(e,t){const r=this.geometry,n=this.matrixWorld,i=e.params.Points.threshold,o=r.drawRange;if(r.boundingSphere===null&&r.computeBoundingSphere(),Ur.copy(r.boundingSphere),Ur.applyMatrix4(n),Ur.radius+=i,e.ray.intersectsSphere(Ur)===!1)return;yo.copy(n).invert(),Vn.copy(e.ray).applyMatrix4(yo);const s=i/((this.scale.x+this.scale.y+this.scale.z)/3),a=s*s,l=r.index,h=r.attributes.position;if(l!==null){const f=Math.max(0,o.start),d=Math.min(l.count,o.start+o.count);for(let p=f,y=d;p<y;p++){const m=l.getX(p);Nr.fromBufferAttribute(h,m),xo(Nr,m,a,n,e,t,this)}}else{const f=Math.max(0,o.start),d=Math.min(h.count,o.start+o.count);for(let p=f,y=d;p<y;p++)Nr.fromBufferAttribute(h,p),xo(Nr,p,a,n,e,t,this)}}updateMorphTargets(){const t=this.geometry.morphAttributes,r=Object.keys(t);if(r.length>0){const n=t[r[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let i=0,o=n.length;i<o;i++){const s=n[i].name||String(i);this.morphTargetInfluences.push(0),this.morphTargetDictionary[s]=i}}}}}function xo(u,e,t,r,n,i,o){const s=Vn.distanceSqToPoint(u);if(s<t){const a=new b;Vn.closestPointToPoint(u,a),a.applyMatrix4(r);const l=n.ray.origin.distanceTo(a);if(l<n.near||l>n.far)return;i.push({distance:l,distanceToRay:Math.sqrt(s),point:a,index:e,face:null,object:o})}}class ti extends ft{constructor(e){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.type="MeshStandardMaterial",this.color=new Z(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Z(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=ba,this.normalScale=new k(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ut,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}class He extends ti{constructor(e){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new k(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return K(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(t){this.ior=(1+.4*t)/(1-.4*t)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new Z(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new Z(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new Z(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._iridescence=0,this._sheen=0,this._transmission=0,this.setValues(e)}get anisotropy(){return this._anisotropy}set anisotropy(e){this._anisotropy>0!=e>0&&this.version++,this._anisotropy=e}get clearcoat(){return this._clearcoat}set clearcoat(e){this._clearcoat>0!=e>0&&this.version++,this._clearcoat=e}get iridescence(){return this._iridescence}set iridescence(e){this._iridescence>0!=e>0&&this.version++,this._iridescence=e}get sheen(){return this._sheen}set sheen(e){this._sheen>0!=e>0&&this.version++,this._sheen=e}get transmission(){return this._transmission}set transmission(e){this._transmission>0!=e>0&&this.version++,this._transmission=e}copy(e){return super.copy(e),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=e.anisotropy,this.anisotropyRotation=e.anisotropyRotation,this.anisotropyMap=e.anisotropyMap,this.clearcoat=e.clearcoat,this.clearcoatMap=e.clearcoatMap,this.clearcoatRoughness=e.clearcoatRoughness,this.clearcoatRoughnessMap=e.clearcoatRoughnessMap,this.clearcoatNormalMap=e.clearcoatNormalMap,this.clearcoatNormalScale.copy(e.clearcoatNormalScale),this.ior=e.ior,this.iridescence=e.iridescence,this.iridescenceMap=e.iridescenceMap,this.iridescenceIOR=e.iridescenceIOR,this.iridescenceThicknessRange=[...e.iridescenceThicknessRange],this.iridescenceThicknessMap=e.iridescenceThicknessMap,this.sheen=e.sheen,this.sheenColor.copy(e.sheenColor),this.sheenColorMap=e.sheenColorMap,this.sheenRoughness=e.sheenRoughness,this.sheenRoughnessMap=e.sheenRoughnessMap,this.transmission=e.transmission,this.transmissionMap=e.transmissionMap,this.thickness=e.thickness,this.thicknessMap=e.thicknessMap,this.attenuationDistance=e.attenuationDistance,this.attenuationColor.copy(e.attenuationColor),this.specularIntensity=e.specularIntensity,this.specularIntensityMap=e.specularIntensityMap,this.specularColor.copy(e.specularColor),this.specularColorMap=e.specularColorMap,this}}function Hr(u,e,t){return!u||!t&&u.constructor===e?u:typeof e.BYTES_PER_ELEMENT=="number"?new e(u):Array.prototype.slice.call(u)}function vl(u){return ArrayBuffer.isView(u)&&!(u instanceof DataView)}function bl(u){function e(n,i){return u[n]-u[i]}const t=u.length,r=new Array(t);for(let n=0;n!==t;++n)r[n]=n;return r.sort(e),r}function vo(u,e,t){const r=u.length,n=new u.constructor(r);for(let i=0,o=0;o!==r;++i){const s=t[i]*e;for(let a=0;a!==e;++a)n[o++]=u[s+a]}return n}function Ko(u,e,t,r){let n=1,i=u[0];for(;i!==void 0&&i[r]===void 0;)i=u[n++];if(i===void 0)return;let o=i[r];if(o!==void 0)if(Array.isArray(o))do o=i[r],o!==void 0&&(e.push(i.time),t.push.apply(t,o)),i=u[n++];while(i!==void 0);else if(o.toArray!==void 0)do o=i[r],o!==void 0&&(e.push(i.time),o.toArray(t,t.length)),i=u[n++];while(i!==void 0);else do o=i[r],o!==void 0&&(e.push(i.time),t.push(o)),i=u[n++];while(i!==void 0)}class mr{constructor(e,t,r,n){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=n!==void 0?n:new t.constructor(r),this.sampleValues=t,this.valueSize=r,this.settings=null,this.DefaultSettings_={}}evaluate(e){const t=this.parameterPositions;let r=this._cachedIndex,n=t[r],i=t[r-1];r:{e:{let o;t:{n:if(!(e<n)){for(let s=r+2;;){if(n===void 0){if(e<i)break n;return r=t.length,this._cachedIndex=r,this.copySampleValue_(r-1)}if(r===s)break;if(i=n,n=t[++r],e<n)break e}o=t.length;break t}if(!(e>=i)){const s=t[1];e<s&&(r=2,i=s);for(let a=r-2;;){if(i===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(r===a)break;if(n=i,i=t[--r-1],e>=i)break e}o=r,r=0;break t}break r}for(;r<o;){const s=r+o>>>1;e<t[s]?o=s:r=s+1}if(n=t[r],i=t[r-1],i===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===void 0)return r=t.length,this._cachedIndex=r,this.copySampleValue_(r-1)}this._cachedIndex=r,this.intervalChanged_(r,i,n)}return this.interpolate_(r,i,e,n)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){const t=this.resultBuffer,r=this.sampleValues,n=this.valueSize,i=e*n;for(let o=0;o!==n;++o)t[o]=r[i+o];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}}class wl extends mr{constructor(e,t,r,n){super(e,t,r,n),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Li,endingEnd:Li}}intervalChanged_(e,t,r){const n=this.parameterPositions;let i=e-2,o=e+1,s=n[i],a=n[o];if(s===void 0)switch(this.getSettings_().endingStart){case Ei:i=e,s=2*t-r;break;case Bi:i=n.length-2,s=t+n[i]-n[i+1];break;default:i=e,s=r}if(a===void 0)switch(this.getSettings_().endingEnd){case Ei:o=e,a=2*r-t;break;case Bi:o=1,a=r+n[1]-n[0];break;default:o=e-1,a=t}const l=(r-t)*.5,c=this.valueSize;this._weightPrev=l/(t-s),this._weightNext=l/(a-r),this._offsetPrev=i*c,this._offsetNext=o*c}interpolate_(e,t,r,n){const i=this.resultBuffer,o=this.sampleValues,s=this.valueSize,a=e*s,l=a-s,c=this._offsetPrev,h=this._offsetNext,f=this._weightPrev,d=this._weightNext,p=(r-t)/(n-t),y=p*p,m=y*p,w=-f*m+2*f*y-f*p,S=(1+f)*m+(-1.5-2*f)*y+(-.5+f)*p+1,_=(-1-d)*m+(1.5+d)*y+.5*p,A=d*m-d*y;for(let P=0;P!==s;++P)i[P]=w*o[c+P]+S*o[l+P]+_*o[a+P]+A*o[h+P];return i}}class Il extends mr{constructor(e,t,r,n){super(e,t,r,n)}interpolate_(e,t,r,n){const i=this.resultBuffer,o=this.sampleValues,s=this.valueSize,a=e*s,l=a-s,c=(r-t)/(n-t),h=1-c;for(let f=0;f!==s;++f)i[f]=o[l+f]*h+o[a+f]*c;return i}}class Sl extends mr{constructor(e,t,r,n){super(e,t,r,n)}interpolate_(e){return this.copySampleValue_(e-1)}}class Te{constructor(e,t,r,n){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=Hr(t,this.TimeBufferType),this.values=Hr(r,this.ValueBufferType),this.setInterpolation(n||this.DefaultInterpolation)}static toJSON(e){const t=e.constructor;let r;if(t.toJSON!==this.toJSON)r=t.toJSON(e);else{r={name:e.name,times:Hr(e.times,Array),values:Hr(e.values,Array)};const n=e.getInterpolation();n!==e.DefaultInterpolation&&(r.interpolation=n)}return r.type=e.ValueTypeName,r}InterpolantFactoryMethodDiscrete(e){return new Sl(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new Il(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new wl(this.times,this.values,this.getValueSize(),e)}setInterpolation(e){let t;switch(e){case ur:t=this.InterpolantFactoryMethodDiscrete;break;case kt:t=this.InterpolantFactoryMethodLinear;break;case on:t=this.InterpolantFactoryMethodSmooth;break}if(t===void 0){const r="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(r);return console.warn("THREE.KeyframeTrack:",r),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return ur;case this.InterpolantFactoryMethodLinear:return kt;case this.InterpolantFactoryMethodSmooth:return on}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){const t=this.times;for(let r=0,n=t.length;r!==n;++r)t[r]+=e}return this}scale(e){if(e!==1){const t=this.times;for(let r=0,n=t.length;r!==n;++r)t[r]*=e}return this}trim(e,t){const r=this.times,n=r.length;let i=0,o=n-1;for(;i!==n&&r[i]<e;)++i;for(;o!==-1&&r[o]>t;)--o;if(++o,i!==0||o!==n){i>=o&&(o=Math.max(o,1),i=o-1);const s=this.getValueSize();this.times=r.slice(i,o),this.values=this.values.slice(i*s,o*s)}return this}validate(){let e=!0;const t=this.getValueSize();t-Math.floor(t)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),e=!1);const r=this.times,n=this.values,i=r.length;i===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),e=!1);let o=null;for(let s=0;s!==i;s++){const a=r[s];if(typeof a=="number"&&isNaN(a)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,s,a),e=!1;break}if(o!==null&&o>a){console.error("THREE.KeyframeTrack: Out of order keys.",this,s,a,o),e=!1;break}o=a}if(n!==void 0&&vl(n))for(let s=0,a=n.length;s!==a;++s){const l=n[s];if(isNaN(l)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,s,l),e=!1;break}}return e}optimize(){const e=this.times.slice(),t=this.values.slice(),r=this.getValueSize(),n=this.getInterpolation()===on,i=e.length-1;let o=1;for(let s=1;s<i;++s){let a=!1;const l=e[s],c=e[s+1];if(l!==c&&(s!==1||l!==e[0]))if(n)a=!0;else{const h=s*r,f=h-r,d=h+r;for(let p=0;p!==r;++p){const y=t[h+p];if(y!==t[f+p]||y!==t[d+p]){a=!0;break}}}if(a){if(s!==o){e[o]=e[s];const h=s*r,f=o*r;for(let d=0;d!==r;++d)t[f+d]=t[h+d]}++o}}if(i>0){e[o]=e[i];for(let s=i*r,a=o*r,l=0;l!==r;++l)t[a+l]=t[s+l];++o}return o!==e.length?(this.times=e.slice(0,o),this.values=t.slice(0,o*r)):(this.times=e,this.values=t),this}clone(){const e=this.times.slice(),t=this.values.slice(),r=this.constructor,n=new r(this.name,e,t);return n.createInterpolant=this.createInterpolant,n}}Te.prototype.TimeBufferType=Float32Array;Te.prototype.ValueBufferType=Float32Array;Te.prototype.DefaultInterpolation=kt;class Nt extends Te{}Nt.prototype.ValueTypeName="bool";Nt.prototype.ValueBufferType=Array;Nt.prototype.DefaultInterpolation=ur;Nt.prototype.InterpolantFactoryMethodLinear=void 0;Nt.prototype.InterpolantFactoryMethodSmooth=void 0;class Jo extends Te{}Jo.prototype.ValueTypeName="color";class Ft extends Te{}Ft.prototype.ValueTypeName="number";class _l extends mr{constructor(e,t,r,n){super(e,t,r,n)}interpolate_(e,t,r,n){const i=this.resultBuffer,o=this.sampleValues,s=this.valueSize,a=(r-t)/(n-t);let l=e*s;for(let c=l+s;l!==c;l+=4)Me.slerpFlat(i,0,o,l-s,o,l,a);return i}}class dt extends Te{InterpolantFactoryMethodLinear(e){return new _l(this.times,this.values,this.getValueSize(),e)}}dt.prototype.ValueTypeName="quaternion";dt.prototype.DefaultInterpolation=kt;dt.prototype.InterpolantFactoryMethodSmooth=void 0;class Ht extends Te{}Ht.prototype.ValueTypeName="string";Ht.prototype.ValueBufferType=Array;Ht.prototype.DefaultInterpolation=ur;Ht.prototype.InterpolantFactoryMethodLinear=void 0;Ht.prototype.InterpolantFactoryMethodSmooth=void 0;class Gt extends Te{}Gt.prototype.ValueTypeName="vector";class Al{constructor(e,t=-1,r,n=xa){this.name=e,this.tracks=r,this.duration=t,this.blendMode=n,this.uuid=Se(),this.duration<0&&this.resetDuration()}static parse(e){const t=[],r=e.tracks,n=1/(e.fps||1);for(let o=0,s=r.length;o!==s;++o)t.push(Pl(r[o]).scale(n));const i=new this(e.name,e.duration,t,e.blendMode);return i.uuid=e.uuid,i}static toJSON(e){const t=[],r=e.tracks,n={name:e.name,duration:e.duration,tracks:t,uuid:e.uuid,blendMode:e.blendMode};for(let i=0,o=r.length;i!==o;++i)t.push(Te.toJSON(r[i]));return n}static CreateFromMorphTargetSequence(e,t,r,n){const i=t.length,o=[];for(let s=0;s<i;s++){let a=[],l=[];a.push((s+i-1)%i,s,(s+1)%i),l.push(0,1,0);const c=bl(a);a=vo(a,1,c),l=vo(l,1,c),!n&&a[0]===0&&(a.push(i),l.push(l[0])),o.push(new Ft(".morphTargetInfluences["+t[s].name+"]",a,l).scale(1/r))}return new this(e,-1,o)}static findByName(e,t){let r=e;if(!Array.isArray(e)){const n=e;r=n.geometry&&n.geometry.animations||n.animations}for(let n=0;n<r.length;n++)if(r[n].name===t)return r[n];return null}static CreateClipsFromMorphTargetSequences(e,t,r){const n={},i=/^([\w-]*?)([\d]+)$/;for(let s=0,a=e.length;s<a;s++){const l=e[s],c=l.name.match(i);if(c&&c.length>1){const h=c[1];let f=n[h];f||(n[h]=f=[]),f.push(l)}}const o=[];for(const s in n)o.push(this.CreateFromMorphTargetSequence(s,n[s],t,r));return o}static parseAnimation(e,t){if(!e)return console.error("THREE.AnimationClip: No animation in JSONLoader data."),null;const r=function(h,f,d,p,y){if(d.length!==0){const m=[],w=[];Ko(d,m,w,p),m.length!==0&&y.push(new h(f,m,w))}},n=[],i=e.name||"default",o=e.fps||30,s=e.blendMode;let a=e.length||-1;const l=e.hierarchy||[];for(let h=0;h<l.length;h++){const f=l[h].keys;if(!(!f||f.length===0))if(f[0].morphTargets){const d={};let p;for(p=0;p<f.length;p++)if(f[p].morphTargets)for(let y=0;y<f[p].morphTargets.length;y++)d[f[p].morphTargets[y]]=-1;for(const y in d){const m=[],w=[];for(let S=0;S!==f[p].morphTargets.length;++S){const _=f[p];m.push(_.time),w.push(_.morphTarget===y?1:0)}n.push(new Ft(".morphTargetInfluence["+y+"]",m,w))}a=d.length*o}else{const d=".bones["+t[h].name+"]";r(Gt,d+".position",f,"pos",n),r(dt,d+".quaternion",f,"rot",n),r(Gt,d+".scale",f,"scl",n)}}return n.length===0?null:new this(i,a,n,s)}resetDuration(){const e=this.tracks;let t=0;for(let r=0,n=e.length;r!==n;++r){const i=this.tracks[r];t=Math.max(t,i.times[i.times.length-1])}return this.duration=t,this}trim(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].trim(0,this.duration);return this}validate(){let e=!0;for(let t=0;t<this.tracks.length;t++)e=e&&this.tracks[t].validate();return e}optimize(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].optimize();return this}clone(){const e=[];for(let t=0;t<this.tracks.length;t++)e.push(this.tracks[t].clone());return new this.constructor(this.name,this.duration,e,this.blendMode)}toJSON(){return this.constructor.toJSON(this)}}function Cl(u){switch(u.toLowerCase()){case"scalar":case"double":case"float":case"number":case"integer":return Ft;case"vector":case"vector2":case"vector3":case"vector4":return Gt;case"color":return Jo;case"quaternion":return dt;case"bool":case"boolean":return Nt;case"string":return Ht}throw new Error("THREE.KeyframeTrack: Unsupported typeName: "+u)}function Pl(u){if(u.type===void 0)throw new Error("THREE.KeyframeTrack: track type undefined, can not parse");const e=Cl(u.type);if(u.times===void 0){const t=[],r=[];Ko(u.keys,t,r,"value"),u.times=t,u.values=r}return e.parse!==void 0?e.parse(u):new e(u.name,u.times,u.values,u.interpolation)}const tt={enabled:!1,files:{},add:function(u,e){this.enabled!==!1&&(this.files[u]=e)},get:function(u){if(this.enabled!==!1)return this.files[u]},remove:function(u){delete this.files[u]},clear:function(){this.files={}}};class Ml{constructor(e,t,r){const n=this;let i=!1,o=0,s=0,a;const l=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=r,this.itemStart=function(c){s++,i===!1&&n.onStart!==void 0&&n.onStart(c,o,s),i=!0},this.itemEnd=function(c){o++,n.onProgress!==void 0&&n.onProgress(c,o,s),o===s&&(i=!1,n.onLoad!==void 0&&n.onLoad())},this.itemError=function(c){n.onError!==void 0&&n.onError(c)},this.resolveURL=function(c){return a?a(c):c},this.setURLModifier=function(c){return a=c,this},this.addHandler=function(c,h){return l.push(c,h),this},this.removeHandler=function(c){const h=l.indexOf(c);return h!==-1&&l.splice(h,2),this},this.getHandler=function(c){for(let h=0,f=l.length;h<f;h+=2){const d=l[h],p=l[h+1];if(d.global&&(d.lastIndex=0),d.test(c))return p}return null}}}const Tl=new Ml;class pt{constructor(e){this.manager=e!==void 0?e:Tl,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){const r=this;return new Promise(function(n,i){r.load(e,n,t,i)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}}pt.DEFAULT_MATERIAL_NAME="__DEFAULT";const Ge={};class Rl extends Error{constructor(e,t){super(e),this.response=t}}class Zr extends pt{constructor(e){super(e)}load(e,t,r,n){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);const i=tt.get(e);if(i!==void 0)return this.manager.itemStart(e),setTimeout(()=>{t&&t(i),this.manager.itemEnd(e)},0),i;if(Ge[e]!==void 0){Ge[e].push({onLoad:t,onProgress:r,onError:n});return}Ge[e]=[],Ge[e].push({onLoad:t,onProgress:r,onError:n});const o=new Request(e,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin"}),s=this.mimeType,a=this.responseType;fetch(o).then(l=>{if(l.status===200||l.status===0){if(l.status===0&&console.warn("THREE.FileLoader: HTTP Status 0 received."),typeof ReadableStream>"u"||l.body===void 0||l.body.getReader===void 0)return l;const c=Ge[e],h=l.body.getReader(),f=l.headers.get("Content-Length")||l.headers.get("X-File-Size"),d=f?parseInt(f):0,p=d!==0;let y=0;const m=new ReadableStream({start(w){S();function S(){h.read().then(({done:_,value:A})=>{if(_)w.close();else{y+=A.byteLength;const P=new ProgressEvent("progress",{lengthComputable:p,loaded:y,total:d});for(let L=0,C=c.length;L<C;L++){const R=c[L];R.onProgress&&R.onProgress(P)}w.enqueue(A),S()}})}}});return new Response(m)}else throw new Rl(`fetch for "${l.url}" responded with ${l.status}: ${l.statusText}`,l)}).then(l=>{switch(a){case"arraybuffer":return l.arrayBuffer();case"blob":return l.blob();case"document":return l.text().then(c=>new DOMParser().parseFromString(c,s));case"json":return l.json();default:if(s===void 0)return l.text();{const h=/charset="?([^;"\s]*)"?/i.exec(s),f=h&&h[1]?h[1].toLowerCase():void 0,d=new TextDecoder(f);return l.arrayBuffer().then(p=>d.decode(p))}}}).then(l=>{tt.add(e,l);const c=Ge[e];delete Ge[e];for(let h=0,f=c.length;h<f;h++){const d=c[h];d.onLoad&&d.onLoad(l)}}).catch(l=>{const c=Ge[e];if(c===void 0)throw this.manager.itemError(e),l;delete Ge[e];for(let h=0,f=c.length;h<f;h++){const d=c[h];d.onError&&d.onError(l)}this.manager.itemError(e)}).finally(()=>{this.manager.itemEnd(e)}),this.manager.itemStart(e)}setResponseType(e){return this.responseType=e,this}setMimeType(e){return this.mimeType=e,this}}class Ll extends pt{constructor(e){super(e)}load(e,t,r,n){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);const i=this,o=tt.get(e);if(o!==void 0)return i.manager.itemStart(e),setTimeout(function(){t&&t(o),i.manager.itemEnd(e)},0),o;const s=Nn("img");function a(){c(),tt.add(e,this),t&&t(this),i.manager.itemEnd(e)}function l(h){c(),n&&n(h),i.manager.itemError(e),i.manager.itemEnd(e)}function c(){s.removeEventListener("load",a,!1),s.removeEventListener("error",l,!1)}return s.addEventListener("load",a,!1),s.addEventListener("error",l,!1),e.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(s.crossOrigin=this.crossOrigin),i.manager.itemStart(e),s.src=e,s}}class El extends pt{constructor(e){super(e)}load(e,t,r,n){const i=new ge,o=new Ll(this.manager);return o.setCrossOrigin(this.crossOrigin),o.setPath(this.path),o.load(e,function(s){i.image=s,i.needsUpdate=!0,t!==void 0&&t(i)},r,n),i}}let ri=class extends q{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new Z(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){const t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),t}};const Mn=new B,bo=new b,wo=new b;class ni{constructor(e){this.camera=e,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new k(512,512),this.map=null,this.mapPass=null,this.matrix=new B,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new al,this._frameExtents=new k(1,1),this._viewportCount=1,this._viewports=[new me(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){const t=this.camera,r=this.matrix;bo.setFromMatrixPosition(e.matrixWorld),t.position.copy(bo),wo.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(wo),t.updateMatrixWorld(),Mn.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Mn),r.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),r.multiply(Mn)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.bias=e.bias,this.radius=e.radius,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const e={};return this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}}class Bl extends ni{constructor(){super(new Qr(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1}updateMatrices(e){const t=this.camera,r=hr*2*e.angle*this.focus,n=this.mapSize.width/this.mapSize.height,i=e.distance||t.far;(r!==t.fov||n!==t.aspect||i!==t.far)&&(t.fov=r,t.aspect=n,t.far=i,t.updateProjectionMatrix()),super.updateMatrices(e)}copy(e){return super.copy(e),this.focus=e.focus,this}}class Dl extends ri{constructor(e,t,r=0,n=Math.PI/3,i=0,o=2){super(e,t),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(q.DEFAULT_UP),this.updateMatrix(),this.target=new q,this.distance=r,this.angle=n,this.penumbra=i,this.decay=o,this.map=null,this.shadow=new Bl}get power(){return this.intensity*Math.PI}set power(e){this.intensity=e/Math.PI}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.angle=e.angle,this.penumbra=e.penumbra,this.decay=e.decay,this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}}const Io=new B,Qt=new b,Tn=new b;class zl extends ni{constructor(){super(new Qr(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new k(4,2),this._viewportCount=6,this._viewports=[new me(2,1,1,1),new me(0,1,1,1),new me(3,1,1,1),new me(1,1,1,1),new me(3,0,1,1),new me(1,0,1,1)],this._cubeDirections=[new b(1,0,0),new b(-1,0,0),new b(0,0,1),new b(0,0,-1),new b(0,1,0),new b(0,-1,0)],this._cubeUps=[new b(0,1,0),new b(0,1,0),new b(0,1,0),new b(0,1,0),new b(0,0,1),new b(0,0,-1)]}updateMatrices(e,t=0){const r=this.camera,n=this.matrix,i=e.distance||r.far;i!==r.far&&(r.far=i,r.updateProjectionMatrix()),Qt.setFromMatrixPosition(e.matrixWorld),r.position.copy(Qt),Tn.copy(r.position),Tn.add(this._cubeDirections[t]),r.up.copy(this._cubeUps[t]),r.lookAt(Tn),r.updateMatrixWorld(),n.makeTranslation(-Qt.x,-Qt.y,-Qt.z),Io.multiplyMatrices(r.projectionMatrix,r.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Io)}}class kl extends ri{constructor(e,t,r=0,n=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=r,this.decay=n,this.shadow=new zl}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}}class Fl extends ni{constructor(){super(new Xo(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class Gl extends ri{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(q.DEFAULT_UP),this.updateMatrix(),this.target=new q,this.shadow=new Fl}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}}class sr{static decodeText(e){if(typeof TextDecoder<"u")return new TextDecoder().decode(e);let t="";for(let r=0,n=e.length;r<n;r++)t+=String.fromCharCode(e[r]);try{return decodeURIComponent(escape(t))}catch{return t}}static extractUrlBase(e){const t=e.lastIndexOf("/");return t===-1?"./":e.slice(0,t+1)}static resolveURL(e,t){return typeof e!="string"||e===""?"":(/^https?:\/\//i.test(t)&&/^\//.test(e)&&(t=t.replace(/(^https?:\/\/[^\/]+).*/i,"$1")),/^(https?:)?\/\//i.test(e)||/^data:.*,.*$/i.test(e)||/^blob:.*$/i.test(e)?e:t+e)}}class Ol extends pt{constructor(e){super(e),this.isImageBitmapLoader=!0,typeof createImageBitmap>"u"&&console.warn("THREE.ImageBitmapLoader: createImageBitmap() not supported."),typeof fetch>"u"&&console.warn("THREE.ImageBitmapLoader: fetch() not supported."),this.options={premultiplyAlpha:"none"}}setOptions(e){return this.options=e,this}load(e,t,r,n){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);const i=this,o=tt.get(e);if(o!==void 0){if(i.manager.itemStart(e),o.then){o.then(l=>{t&&t(l),i.manager.itemEnd(e)}).catch(l=>{n&&n(l)});return}return setTimeout(function(){t&&t(o),i.manager.itemEnd(e)},0),o}const s={};s.credentials=this.crossOrigin==="anonymous"?"same-origin":"include",s.headers=this.requestHeader;const a=fetch(e,s).then(function(l){return l.blob()}).then(function(l){return createImageBitmap(l,Object.assign(i.options,{colorSpaceConversion:"none"}))}).then(function(l){return tt.add(e,l),t&&t(l),i.manager.itemEnd(e),l}).catch(function(l){n&&n(l),tt.remove(e),i.manager.itemError(e),i.manager.itemEnd(e)});tt.add(e,a),i.manager.itemStart(e)}}const ii="\\[\\]\\.:\\/",Ul=new RegExp("["+ii+"]","g"),oi="[^"+ii+"]",Nl="[^"+ii.replace("\\.","")+"]",Hl=/((?:WC+[\/:])*)/.source.replace("WC",oi),Vl=/(WCOD+)?/.source.replace("WCOD",Nl),Wl=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",oi),jl=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",oi),Xl=new RegExp("^"+Hl+Vl+Wl+jl+"$"),ql=["material","materials","bones","map"];class Yl{constructor(e,t,r){const n=r||U.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,n)}getValue(e,t){this.bind();const r=this._targetGroup.nCachedObjects_,n=this._bindings[r];n!==void 0&&n.getValue(e,t)}setValue(e,t){const r=this._bindings;for(let n=this._targetGroup.nCachedObjects_,i=r.length;n!==i;++n)r[n].setValue(e,t)}bind(){const e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,r=e.length;t!==r;++t)e[t].bind()}unbind(){const e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,r=e.length;t!==r;++t)e[t].unbind()}}class U{constructor(e,t,r){this.path=t,this.parsedPath=r||U.parseTrackName(t),this.node=U.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,r){return e&&e.isAnimationObjectGroup?new U.Composite(e,t,r):new U(e,t,r)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(Ul,"")}static parseTrackName(e){const t=Xl.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);const r={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},n=r.nodeName&&r.nodeName.lastIndexOf(".");if(n!==void 0&&n!==-1){const i=r.nodeName.substring(n+1);ql.indexOf(i)!==-1&&(r.nodeName=r.nodeName.substring(0,n),r.objectName=i)}if(r.propertyName===null||r.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return r}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){const r=e.skeleton.getBoneByName(t);if(r!==void 0)return r}if(e.children){const r=function(i){for(let o=0;o<i.length;o++){const s=i[o];if(s.name===t||s.uuid===t)return s;const a=r(s.children);if(a)return a}return null},n=r(e.children);if(n)return n}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){const r=this.resolvedProperty;for(let n=0,i=r.length;n!==i;++n)e[t++]=r[n]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){const r=this.resolvedProperty;for(let n=0,i=r.length;n!==i;++n)r[n]=e[t++]}_setValue_array_setNeedsUpdate(e,t){const r=this.resolvedProperty;for(let n=0,i=r.length;n!==i;++n)r[n]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){const r=this.resolvedProperty;for(let n=0,i=r.length;n!==i;++n)r[n]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node;const t=this.parsedPath,r=t.objectName,n=t.propertyName;let i=t.propertyIndex;if(e||(e=U.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(r){let l=t.objectIndex;switch(r){case"materials":if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let c=0;c<e.length;c++)if(e[c].name===l){l=c;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[r]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[r]}if(l!==void 0){if(e[l]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[l]}}const o=e[n];if(o===void 0){const l=t.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+l+"."+n+" but it wasn't found.",e);return}let s=this.Versioning.None;this.targetObject=e,e.needsUpdate!==void 0?s=this.Versioning.NeedsUpdate:e.matrixWorldNeedsUpdate!==void 0&&(s=this.Versioning.MatrixWorldNeedsUpdate);let a=this.BindingType.Direct;if(i!==void 0){if(n==="morphTargetInfluences"){if(!e.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[i]!==void 0&&(i=e.morphTargetDictionary[i])}a=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=i}else o.fromArray!==void 0&&o.toArray!==void 0?(a=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(a=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=n;this.getValue=this.GetterByBindingType[a],this.setValue=this.SetterByBindingTypeAndVersioning[a][s]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}}U.Composite=Yl;U.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};U.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};U.prototype.GetterByBindingType=[U.prototype._getValue_direct,U.prototype._getValue_array,U.prototype._getValue_arrayElement,U.prototype._getValue_toArray];U.prototype.SetterByBindingTypeAndVersioning=[[U.prototype._setValue_direct,U.prototype._setValue_direct_setNeedsUpdate,U.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[U.prototype._setValue_array,U.prototype._setValue_array_setNeedsUpdate,U.prototype._setValue_array_setMatrixWorldNeedsUpdate],[U.prototype._setValue_arrayElement,U.prototype._setValue_arrayElement_setNeedsUpdate,U.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[U.prototype._setValue_fromArray,U.prototype._setValue_fromArray_setNeedsUpdate,U.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];class So{constructor(e=1,t=0,r=0){return this.radius=e,this.phi=t,this.theta=r,this}set(e,t,r){return this.radius=e,this.phi=t,this.theta=r,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){return this.phi=Math.max(1e-6,Math.min(Math.PI-1e-6,this.phi)),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,r){return this.radius=Math.sqrt(e*e+t*t+r*r),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,r),this.phi=Math.acos(K(t/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:ko}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=ko);function $r(u){document.querySelector("span").innerHTML=u}function Zl(u){return Object.keys(u)}const $l=u=>u&&typeof u.length=="number"&&u.buffer instanceof ArrayBuffer&&typeof u.byteLength=="number",F={i32:{numElements:1,align:4,size:4,type:"i32",View:Int32Array},u32:{numElements:1,align:4,size:4,type:"u32",View:Uint32Array},f32:{numElements:1,align:4,size:4,type:"f32",View:Float32Array},f16:{numElements:1,align:2,size:2,type:"u16",View:Uint16Array},vec2f:{numElements:2,align:8,size:8,type:"f32",View:Float32Array},vec2i:{numElements:2,align:8,size:8,type:"i32",View:Int32Array},vec2u:{numElements:2,align:8,size:8,type:"u32",View:Uint32Array},vec2h:{numElements:2,align:4,size:4,type:"u16",View:Uint16Array},vec3i:{numElements:3,align:16,size:12,type:"i32",View:Int32Array},vec3u:{numElements:3,align:16,size:12,type:"u32",View:Uint32Array},vec3f:{numElements:3,align:16,size:12,type:"f32",View:Float32Array},vec3h:{numElements:3,align:8,size:6,type:"u16",View:Uint16Array},vec4i:{numElements:4,align:16,size:16,type:"i32",View:Int32Array},vec4u:{numElements:4,align:16,size:16,type:"u32",View:Uint32Array},vec4f:{numElements:4,align:16,size:16,type:"f32",View:Float32Array},vec4h:{numElements:4,align:8,size:8,type:"u16",View:Uint16Array},mat2x2f:{numElements:4,align:8,size:16,type:"f32",View:Float32Array},mat2x2h:{numElements:4,align:4,size:8,type:"u16",View:Uint16Array},mat3x2f:{numElements:6,align:8,size:24,type:"f32",View:Float32Array},mat3x2h:{numElements:6,align:4,size:12,type:"u16",View:Uint16Array},mat4x2f:{numElements:8,align:8,size:32,type:"f32",View:Float32Array},mat4x2h:{numElements:8,align:4,size:16,type:"u16",View:Uint16Array},mat2x3f:{numElements:8,align:16,size:32,pad:[3,1],type:"f32",View:Float32Array},mat2x3h:{numElements:8,align:8,size:16,pad:[3,1],type:"u16",View:Uint16Array},mat3x3f:{numElements:12,align:16,size:48,pad:[3,1],type:"f32",View:Float32Array},mat3x3h:{numElements:12,align:8,size:24,pad:[3,1],type:"u16",View:Uint16Array},mat4x3f:{numElements:16,align:16,size:64,pad:[3,1],type:"f32",View:Float32Array},mat4x3h:{numElements:16,align:8,size:32,pad:[3,1],type:"u16",View:Uint16Array},mat2x4f:{numElements:8,align:16,size:32,type:"f32",View:Float32Array},mat2x4h:{numElements:8,align:8,size:16,type:"u16",View:Uint16Array},mat3x4f:{numElements:12,align:16,size:48,pad:[3,1],type:"f32",View:Float32Array},mat3x4h:{numElements:12,align:8,size:24,pad:[3,1],type:"u16",View:Uint16Array},mat4x4f:{numElements:16,align:16,size:64,type:"f32",View:Float32Array},mat4x4h:{numElements:16,align:8,size:32,type:"u16",View:Uint16Array},bool:{numElements:0,align:1,size:0,type:"bool",View:Uint32Array}},Qo={...F,"atomic<i32>":F.i32,"atomic<u32>":F.u32,"vec2<i32>":F.vec2i,"vec2<u32>":F.vec2u,"vec2<f32>":F.vec2f,"vec2<f16>":F.vec2h,"vec3<i32>":F.vec3i,"vec3<u32>":F.vec3u,"vec3<f32>":F.vec3f,"vec3<f16>":F.vec3h,"vec4<i32>":F.vec4i,"vec4<u32>":F.vec4u,"vec4<f32>":F.vec4f,"vec4<f16>":F.vec4h,"mat2x2<f32>":F.mat2x2f,"mat2x2<f16>":F.mat2x2h,"mat3x2<f32>":F.mat3x2f,"mat3x2<f16>":F.mat3x2h,"mat4x2<f32>":F.mat4x2f,"mat4x2<f16>":F.mat4x2h,"mat2x3<f32>":F.mat2x3f,"mat2x3<f16>":F.mat2x3h,"mat3x3<f32>":F.mat3x3f,"mat3x3<f16>":F.mat3x3h,"mat4x3<f32>":F.mat4x3f,"mat4x3<f16>":F.mat4x3h,"mat2x4<f32>":F.mat2x4f,"mat2x4<f16>":F.mat2x4h,"mat3x4<f32>":F.mat3x4f,"mat3x4<f16>":F.mat3x4h,"mat4x4<f32>":F.mat4x4f,"mat4x4<f16>":F.mat4x4h},Kl=Zl(Qo);function Jl(u=[],e){const t=new Set;for(const r of Kl){const n=Qo[r];t.has(n)||(t.add(n),n.flatten=u.includes(r)?e:!e)}}Jl();var Kr;(function(u){u.increment="++",u.decrement="--"})(Kr||(Kr={}));(function(u){function e(t){const r=t;if(r=="parse")throw new Error("Invalid value for IncrementOperator");return u[r]}u.parse=e})(Kr||(Kr={}));var Jr;(function(u){u.assign="=",u.addAssign="+=",u.subtractAssin="-=",u.multiplyAssign="*=",u.divideAssign="/=",u.moduloAssign="%=",u.andAssign="&=",u.orAssign="|=",u.xorAssign="^=",u.shiftLeftAssign="<<=",u.shiftRightAssign=">>="})(Jr||(Jr={}));(function(u){function e(t){const r=t;if(r=="parse")throw new Error("Invalid value for AssignOperator");return r}u.parse=e})(Jr||(Jr={}));var I,x;(function(u){u[u.token=0]="token",u[u.keyword=1]="keyword",u[u.reserved=2]="reserved"})(x||(x={}));class v{constructor(e,t,r){this.name=e,this.type=t,this.rule=r}toString(){return this.name}}class V{}I=V;V.none=new v("",x.reserved,"");V.eof=new v("EOF",x.token,"");V.reserved={asm:new v("asm",x.reserved,"asm"),bf16:new v("bf16",x.reserved,"bf16"),do:new v("do",x.reserved,"do"),enum:new v("enum",x.reserved,"enum"),f16:new v("f16",x.reserved,"f16"),f64:new v("f64",x.reserved,"f64"),handle:new v("handle",x.reserved,"handle"),i8:new v("i8",x.reserved,"i8"),i16:new v("i16",x.reserved,"i16"),i64:new v("i64",x.reserved,"i64"),mat:new v("mat",x.reserved,"mat"),premerge:new v("premerge",x.reserved,"premerge"),regardless:new v("regardless",x.reserved,"regardless"),typedef:new v("typedef",x.reserved,"typedef"),u8:new v("u8",x.reserved,"u8"),u16:new v("u16",x.reserved,"u16"),u64:new v("u64",x.reserved,"u64"),unless:new v("unless",x.reserved,"unless"),using:new v("using",x.reserved,"using"),vec:new v("vec",x.reserved,"vec"),void:new v("void",x.reserved,"void")};V.keywords={array:new v("array",x.keyword,"array"),atomic:new v("atomic",x.keyword,"atomic"),bool:new v("bool",x.keyword,"bool"),f32:new v("f32",x.keyword,"f32"),i32:new v("i32",x.keyword,"i32"),mat2x2:new v("mat2x2",x.keyword,"mat2x2"),mat2x3:new v("mat2x3",x.keyword,"mat2x3"),mat2x4:new v("mat2x4",x.keyword,"mat2x4"),mat3x2:new v("mat3x2",x.keyword,"mat3x2"),mat3x3:new v("mat3x3",x.keyword,"mat3x3"),mat3x4:new v("mat3x4",x.keyword,"mat3x4"),mat4x2:new v("mat4x2",x.keyword,"mat4x2"),mat4x3:new v("mat4x3",x.keyword,"mat4x3"),mat4x4:new v("mat4x4",x.keyword,"mat4x4"),ptr:new v("ptr",x.keyword,"ptr"),sampler:new v("sampler",x.keyword,"sampler"),sampler_comparison:new v("sampler_comparison",x.keyword,"sampler_comparison"),struct:new v("struct",x.keyword,"struct"),texture_1d:new v("texture_1d",x.keyword,"texture_1d"),texture_2d:new v("texture_2d",x.keyword,"texture_2d"),texture_2d_array:new v("texture_2d_array",x.keyword,"texture_2d_array"),texture_3d:new v("texture_3d",x.keyword,"texture_3d"),texture_cube:new v("texture_cube",x.keyword,"texture_cube"),texture_cube_array:new v("texture_cube_array",x.keyword,"texture_cube_array"),texture_multisampled_2d:new v("texture_multisampled_2d",x.keyword,"texture_multisampled_2d"),texture_storage_1d:new v("texture_storage_1d",x.keyword,"texture_storage_1d"),texture_storage_2d:new v("texture_storage_2d",x.keyword,"texture_storage_2d"),texture_storage_2d_array:new v("texture_storage_2d_array",x.keyword,"texture_storage_2d_array"),texture_storage_3d:new v("texture_storage_3d",x.keyword,"texture_storage_3d"),texture_depth_2d:new v("texture_depth_2d",x.keyword,"texture_depth_2d"),texture_depth_2d_array:new v("texture_depth_2d_array",x.keyword,"texture_depth_2d_array"),texture_depth_cube:new v("texture_depth_cube",x.keyword,"texture_depth_cube"),texture_depth_cube_array:new v("texture_depth_cube_array",x.keyword,"texture_depth_cube_array"),texture_depth_multisampled_2d:new v("texture_depth_multisampled_2d",x.keyword,"texture_depth_multisampled_2d"),texture_external:new v("texture_external",x.keyword,"texture_external"),u32:new v("u32",x.keyword,"u32"),vec2:new v("vec2",x.keyword,"vec2"),vec3:new v("vec3",x.keyword,"vec3"),vec4:new v("vec4",x.keyword,"vec4"),bitcast:new v("bitcast",x.keyword,"bitcast"),block:new v("block",x.keyword,"block"),break:new v("break",x.keyword,"break"),case:new v("case",x.keyword,"case"),continue:new v("continue",x.keyword,"continue"),continuing:new v("continuing",x.keyword,"continuing"),default:new v("default",x.keyword,"default"),discard:new v("discard",x.keyword,"discard"),else:new v("else",x.keyword,"else"),enable:new v("enable",x.keyword,"enable"),fallthrough:new v("fallthrough",x.keyword,"fallthrough"),false:new v("false",x.keyword,"false"),fn:new v("fn",x.keyword,"fn"),for:new v("for",x.keyword,"for"),function:new v("function",x.keyword,"function"),if:new v("if",x.keyword,"if"),let:new v("let",x.keyword,"let"),const:new v("const",x.keyword,"const"),loop:new v("loop",x.keyword,"loop"),while:new v("while",x.keyword,"while"),private:new v("private",x.keyword,"private"),read:new v("read",x.keyword,"read"),read_write:new v("read_write",x.keyword,"read_write"),return:new v("return",x.keyword,"return"),storage:new v("storage",x.keyword,"storage"),switch:new v("switch",x.keyword,"switch"),true:new v("true",x.keyword,"true"),alias:new v("alias",x.keyword,"alias"),type:new v("type",x.keyword,"type"),uniform:new v("uniform",x.keyword,"uniform"),var:new v("var",x.keyword,"var"),override:new v("override",x.keyword,"override"),workgroup:new v("workgroup",x.keyword,"workgroup"),write:new v("write",x.keyword,"write"),r8unorm:new v("r8unorm",x.keyword,"r8unorm"),r8snorm:new v("r8snorm",x.keyword,"r8snorm"),r8uint:new v("r8uint",x.keyword,"r8uint"),r8sint:new v("r8sint",x.keyword,"r8sint"),r16uint:new v("r16uint",x.keyword,"r16uint"),r16sint:new v("r16sint",x.keyword,"r16sint"),r16float:new v("r16float",x.keyword,"r16float"),rg8unorm:new v("rg8unorm",x.keyword,"rg8unorm"),rg8snorm:new v("rg8snorm",x.keyword,"rg8snorm"),rg8uint:new v("rg8uint",x.keyword,"rg8uint"),rg8sint:new v("rg8sint",x.keyword,"rg8sint"),r32uint:new v("r32uint",x.keyword,"r32uint"),r32sint:new v("r32sint",x.keyword,"r32sint"),r32float:new v("r32float",x.keyword,"r32float"),rg16uint:new v("rg16uint",x.keyword,"rg16uint"),rg16sint:new v("rg16sint",x.keyword,"rg16sint"),rg16float:new v("rg16float",x.keyword,"rg16float"),rgba8unorm:new v("rgba8unorm",x.keyword,"rgba8unorm"),rgba8unorm_srgb:new v("rgba8unorm_srgb",x.keyword,"rgba8unorm_srgb"),rgba8snorm:new v("rgba8snorm",x.keyword,"rgba8snorm"),rgba8uint:new v("rgba8uint",x.keyword,"rgba8uint"),rgba8sint:new v("rgba8sint",x.keyword,"rgba8sint"),bgra8unorm:new v("bgra8unorm",x.keyword,"bgra8unorm"),bgra8unorm_srgb:new v("bgra8unorm_srgb",x.keyword,"bgra8unorm_srgb"),rgb10a2unorm:new v("rgb10a2unorm",x.keyword,"rgb10a2unorm"),rg11b10float:new v("rg11b10float",x.keyword,"rg11b10float"),rg32uint:new v("rg32uint",x.keyword,"rg32uint"),rg32sint:new v("rg32sint",x.keyword,"rg32sint"),rg32float:new v("rg32float",x.keyword,"rg32float"),rgba16uint:new v("rgba16uint",x.keyword,"rgba16uint"),rgba16sint:new v("rgba16sint",x.keyword,"rgba16sint"),rgba16float:new v("rgba16float",x.keyword,"rgba16float"),rgba32uint:new v("rgba32uint",x.keyword,"rgba32uint"),rgba32sint:new v("rgba32sint",x.keyword,"rgba32sint"),rgba32float:new v("rgba32float",x.keyword,"rgba32float"),static_assert:new v("static_assert",x.keyword,"static_assert")};V.tokens={decimal_float_literal:new v("decimal_float_literal",x.token,/((-?[0-9]*\.[0-9]+|-?[0-9]+\.[0-9]*)((e|E)(\+|-)?[0-9]+)?f?)|(-?[0-9]+(e|E)(\+|-)?[0-9]+f?)|([0-9]+f)/),hex_float_literal:new v("hex_float_literal",x.token,/-?0x((([0-9a-fA-F]*\.[0-9a-fA-F]+|[0-9a-fA-F]+\.[0-9a-fA-F]*)((p|P)(\+|-)?[0-9]+f?)?)|([0-9a-fA-F]+(p|P)(\+|-)?[0-9]+f?))/),int_literal:new v("int_literal",x.token,/-?0x[0-9a-fA-F]+|0i?|-?[1-9][0-9]*i?/),uint_literal:new v("uint_literal",x.token,/0x[0-9a-fA-F]+u|0u|[1-9][0-9]*u/),ident:new v("ident",x.token,/[a-zA-Z][0-9a-zA-Z_]*/),and:new v("and",x.token,"&"),and_and:new v("and_and",x.token,"&&"),arrow:new v("arrow ",x.token,"->"),attr:new v("attr",x.token,"@"),attr_left:new v("attr_left",x.token,"[["),attr_right:new v("attr_right",x.token,"]]"),forward_slash:new v("forward_slash",x.token,"/"),bang:new v("bang",x.token,"!"),bracket_left:new v("bracket_left",x.token,"["),bracket_right:new v("bracket_right",x.token,"]"),brace_left:new v("brace_left",x.token,"{"),brace_right:new v("brace_right",x.token,"}"),colon:new v("colon",x.token,":"),comma:new v("comma",x.token,","),equal:new v("equal",x.token,"="),equal_equal:new v("equal_equal",x.token,"=="),not_equal:new v("not_equal",x.token,"!="),greater_than:new v("greater_than",x.token,">"),greater_than_equal:new v("greater_than_equal",x.token,">="),shift_right:new v("shift_right",x.token,">>"),less_than:new v("less_than",x.token,"<"),less_than_equal:new v("less_than_equal",x.token,"<="),shift_left:new v("shift_left",x.token,"<<"),modulo:new v("modulo",x.token,"%"),minus:new v("minus",x.token,"-"),minus_minus:new v("minus_minus",x.token,"--"),period:new v("period",x.token,"."),plus:new v("plus",x.token,"+"),plus_plus:new v("plus_plus",x.token,"++"),or:new v("or",x.token,"|"),or_or:new v("or_or",x.token,"||"),paren_left:new v("paren_left",x.token,"("),paren_right:new v("paren_right",x.token,")"),semicolon:new v("semicolon",x.token,";"),star:new v("star",x.token,"*"),tilde:new v("tilde",x.token,"~"),underscore:new v("underscore",x.token,"_"),xor:new v("xor",x.token,"^"),plus_equal:new v("plus_equal",x.token,"+="),minus_equal:new v("minus_equal",x.token,"-="),times_equal:new v("times_equal",x.token,"*="),division_equal:new v("division_equal",x.token,"/="),modulo_equal:new v("modulo_equal",x.token,"%="),and_equal:new v("and_equal",x.token,"&="),or_equal:new v("or_equal",x.token,"|="),xor_equal:new v("xor_equal",x.token,"^="),shift_right_equal:new v("shift_right_equal",x.token,">>="),shift_left_equal:new v("shift_left_equal",x.token,"<<=")};V.storage_class=[I.keywords.function,I.keywords.private,I.keywords.workgroup,I.keywords.uniform,I.keywords.storage];V.access_mode=[I.keywords.read,I.keywords.write,I.keywords.read_write];V.sampler_type=[I.keywords.sampler,I.keywords.sampler_comparison];V.sampled_texture_type=[I.keywords.texture_1d,I.keywords.texture_2d,I.keywords.texture_2d_array,I.keywords.texture_3d,I.keywords.texture_cube,I.keywords.texture_cube_array];V.multisampled_texture_type=[I.keywords.texture_multisampled_2d];V.storage_texture_type=[I.keywords.texture_storage_1d,I.keywords.texture_storage_2d,I.keywords.texture_storage_2d_array,I.keywords.texture_storage_3d];V.depth_texture_type=[I.keywords.texture_depth_2d,I.keywords.texture_depth_2d_array,I.keywords.texture_depth_cube,I.keywords.texture_depth_cube_array,I.keywords.texture_depth_multisampled_2d];V.texture_external_type=[I.keywords.texture_external];V.any_texture_type=[...I.sampled_texture_type,...I.multisampled_texture_type,...I.storage_texture_type,...I.depth_texture_type,...I.texture_external_type];V.texel_format=[I.keywords.r8unorm,I.keywords.r8snorm,I.keywords.r8uint,I.keywords.r8sint,I.keywords.r16uint,I.keywords.r16sint,I.keywords.r16float,I.keywords.rg8unorm,I.keywords.rg8snorm,I.keywords.rg8uint,I.keywords.rg8sint,I.keywords.r32uint,I.keywords.r32sint,I.keywords.r32float,I.keywords.rg16uint,I.keywords.rg16sint,I.keywords.rg16float,I.keywords.rgba8unorm,I.keywords.rgba8unorm_srgb,I.keywords.rgba8snorm,I.keywords.rgba8uint,I.keywords.rgba8sint,I.keywords.bgra8unorm,I.keywords.bgra8unorm_srgb,I.keywords.rgb10a2unorm,I.keywords.rg11b10float,I.keywords.rg32uint,I.keywords.rg32sint,I.keywords.rg32float,I.keywords.rgba16uint,I.keywords.rgba16sint,I.keywords.rgba16float,I.keywords.rgba32uint,I.keywords.rgba32sint,I.keywords.rgba32float];V.const_literal=[I.tokens.int_literal,I.tokens.uint_literal,I.tokens.decimal_float_literal,I.tokens.hex_float_literal,I.keywords.true,I.keywords.false];V.literal_or_ident=[I.tokens.ident,I.tokens.int_literal,I.tokens.uint_literal,I.tokens.decimal_float_literal,I.tokens.hex_float_literal];V.element_count_expression=[I.tokens.int_literal,I.tokens.uint_literal,I.tokens.ident];V.template_types=[I.keywords.vec2,I.keywords.vec3,I.keywords.vec4,I.keywords.mat2x2,I.keywords.mat2x3,I.keywords.mat2x4,I.keywords.mat3x2,I.keywords.mat3x3,I.keywords.mat3x4,I.keywords.mat4x2,I.keywords.mat4x3,I.keywords.mat4x4,I.keywords.atomic,I.keywords.bitcast,...I.any_texture_type];V.attribute_name=[I.tokens.ident,I.keywords.block];V.assignment_operators=[I.tokens.equal,I.tokens.plus_equal,I.tokens.minus_equal,I.tokens.times_equal,I.tokens.division_equal,I.tokens.modulo_equal,I.tokens.and_equal,I.tokens.or_equal,I.tokens.xor_equal,I.tokens.shift_right_equal,I.tokens.shift_left_equal];V.increment_operators=[I.tokens.plus_plus,I.tokens.minus_minus];var _o;(function(u){u[u.Uniform=0]="Uniform",u[u.Storage=1]="Storage",u[u.Texture=2]="Texture",u[u.Sampler=3]="Sampler",u[u.StorageTexture=4]="StorageTexture"})(_o||(_o={}));V.any_texture_type.map(u=>u.name);V.sampler_type.map(u=>u.name);function Ql(u){switch(u.dimension){case"1d":return"1d";case"3d":return"3d";default:case"2d":return u.depthOrArrayLayers>1?"2d-array":"2d"}}function ec(u){return[u.width,u.height||1,u.depthOrArrayLayers||1]}function tc(u){return Array.isArray(u)||$l(u)?[...u,1,1].slice(0,3):ec(u)}function rc(u,e){const t=tc(u),r=Math.max(...t.slice(0,e==="3d"?3:2));return 1+Math.log2(r)|0}function nc(u){let e,t;switch(u){case"2d":e="texture_2d<f32>",t="textureSample(ourTexture, ourSampler, fsInput.texcoord)";break;case"2d-array":e="texture_2d_array<f32>",t=`
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
      `}const Ao=new WeakMap;function ic(u,e,t){let r=Ao.get(u);r||(r={pipelineByFormatAndView:{},moduleByViewType:{}},Ao.set(u,r));let{sampler:n,uniformBuffer:i,uniformValues:o}=r;const{pipelineByFormatAndView:s,moduleByViewType:a}=r;t=t||Ql(e);let l=a[t];if(!l){const f=nc(t);l=u.createShaderModule({label:`mip level generation for ${t}`,code:f}),a[t]=l}n||(n=u.createSampler({minFilter:"linear",magFilter:"linear"}),i=u.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),o=new Uint32Array(1),Object.assign(r,{sampler:n,uniformBuffer:i,uniformValues:o}));const c=`${e.format}.${t}`;s[c]||(s[c]=u.createRenderPipeline({label:`mip level generator pipeline for ${t}`,layout:"auto",vertex:{module:l,entryPoint:"vs"},fragment:{module:l,entryPoint:"fs",targets:[{format:e.format}]}}));const h=s[c];for(let f=1;f<e.mipLevelCount;++f)for(let d=0;d<e.depthOrArrayLayers;++d){o[0]=d,u.queue.writeBuffer(i,0,o);const p=u.createBindGroup({layout:h.getBindGroupLayout(0),entries:[{binding:0,resource:n},{binding:1,resource:e.createView({dimension:t,baseMipLevel:f-1,mipLevelCount:1})},{binding:2,resource:{buffer:i}}]}),y={label:"mip gen renderPass",colorAttachments:[{view:e.createView({dimension:"2d",baseMipLevel:f,mipLevelCount:1,baseArrayLayer:d,arrayLayerCount:1}),loadOp:"clear",storeOp:"store"}]},m=u.createCommandEncoder({label:"mip gen encoder"}),w=m.beginRenderPass(y);w.setPipeline(h),w.setBindGroup(0,p),w.draw(3),w.end();const S=m.finish();u.queue.submit([S])}}const oc=new Map([[Int8Array,{formats:["sint8","snorm8"],defaultForType:1}],[Uint8Array,{formats:["uint8","unorm8"],defaultForType:1}],[Int16Array,{formats:["sint16","snorm16"],defaultForType:1}],[Uint16Array,{formats:["uint16","unorm16"],defaultForType:1}],[Int32Array,{formats:["sint32","snorm32"],defaultForType:0}],[Uint32Array,{formats:["uint32","unorm32"],defaultForType:0}],[Float32Array,{formats:["float32","float32"],defaultForType:0}]]);new Map([...oc.entries()].map(([u,{formats:[e,t]}])=>[[e,u],[t,u]]).flat());function sc(u){return new Worker(""+new URL("computeWorker-ybDwvYxD.js",import.meta.url).href,{name:u?.name})}class ac{position=new Float32Array;normal=new Float32Array;uv=new Float32Array;tangent=new Float32Array;indices=new Uint32Array;constructor(e){this.position=e.attributes.position.array,this.normal=e.attributes.normal.array,this.tangent=e.attributes.tangent.array,this.uv=e.attributes.uv.array,this.indices=e.index.array}}class Vr{geometry;boundingSphere=new _e;TextureId=new Uint32Array([4294967295,4294967295,4294967295]);vertexOffset=0;primitiveOffset=0;vertexCount=0;primitiveCount=0;constructor(e){if(e.geometry.attributes.uv===void 0){e.geometry.setAttribute("uv",new H(new Float32Array(e.geometry.attributes.position.count*2),2));let t=e.geometry.attributes.uv.array;for(let r=0;r<t.length;r+=2)t[r]=t[r+1]=.5}e.geometry.attributes.tangent===void 0&&(e.geometry.attributes.normal===void 0&&e.geometry.computeVertexNormals(),e.geometry.computeTangents()),e.geometry.computeBoundingSphere(),this.boundingSphere=e.geometry.boundingSphere,this.vertexCount=e.geometry.attributes.position.count,this.primitiveCount=e.geometry.index.count/3,this.geometry=new ac(e.geometry)}}class oe{textureMap=new Map;Storages=[];texture;Resolution=4;static rszCtx;static rszCanvas;static lock=!1;add(e){let t=4294967295;return e&&(this.textureMap.has(e.name)?t=this.textureMap.get(e.name):(this.Resolution=Math.max(e.source.data.height,this.Resolution),t=this.textureMap.size,this.textureMap.set(e.name,this.Storages.length),this.Storages.push(e))),t}async submit(e,t="rgba8unorm"){this.Resolution=Math.pow(2,Math.ceil(Math.log2(this.Resolution))),oe.rszCtx||(oe.rszCanvas=document.createElement("canvas")),oe.lock=!0,oe.rszCanvas.width=this.Resolution,oe.rszCanvas.height=this.Resolution,oe.rszCtx=oe.rszCanvas.getContext("2d",{willReadFrequently:!0});for(let n of this.Storages)n.source.data.width===this.Resolution&&n.source.data.height===this.Resolution||(oe.rszCtx.drawImage(n.source.data,0,0,this.Resolution,this.Resolution),n.source.data=await createImageBitmap(oe.rszCanvas));oe.lock=!1;let r=GPUTextureUsage.COPY_DST|GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.RENDER_ATTACHMENT;this.texture=e.device.createTexture({label:"Textures",format:t,usage:r,mipLevelCount:rc([this.Resolution,this.Resolution]),size:{width:this.Resolution,height:this.Resolution,depthOrArrayLayers:Math.max(this.textureMap.size,1)}});for(let n of this.Storages)n.source.data.width!==this.Resolution||n.source.data.height!==this.Resolution||e.device.queue.copyExternalImageToTexture({source:n.source.data},{texture:this.texture,origin:{x:0,y:0,z:this.textureMap.get(n.name)}},{width:n.source.data.width,height:n.source.data.height,depthOrArrayLayers:1});ic(e.device,this.texture)}}class en{meshes=[];albedo=new oe;normalMap=new oe;specularRoughnessMap=new oe;vertexArray;indexArray;bvhMaxDepth=0;bvhBuffer;vertexBuffer;indexBuffer;geometryBuffer;rasterVtxBuffer;vertexSum=0;triangleSum=0;async init(e,t){await this.loadModel(e),this.prepareRasterVtxBuffer(t),this.prepareVtxIdxArray();let r=this.prepareBVH(t);return await this.albedo.submit(t,"rgba8unorm-srgb"),await this.normalMap.submit(t),await this.specularRoughnessMap.submit(t),this.allocateBuffer(t),this.writeBuffer(),new Promise(async(n,i)=>{await r,n()})}async loadModel(e){e.traverse(t=>{if(t instanceof Xr){for(let r=t.children.length-1;r>=0;r--)if(t.children[r]instanceof Oe){let n=t.children[r];n.material,n.geometry.scale(t.scale.x,t.scale.y,t.scale.z)}}}),e.traverse(t=>{if(t instanceof Oe){let r=new Vr(t);r.vertexOffset=this.vertexSum,r.primitiveOffset=this.triangleSum,this.vertexSum+=r.vertexCount,this.triangleSum+=r.primitiveCount,r.TextureId[0]=this.albedo.add(t.material.map),r.TextureId[1]=this.normalMap.add(t.material.normalMap),r.TextureId[2]=this.specularRoughnessMap.add(t.material.metalnessMap),this.meshes.push(r)}})}loadTriangle(){let e=new Float32Array([-.5,-.5,0,0,.5,0,.5,-.5,0]),t=new Float32Array([0,0,1,0,0,1,0,0,1]),r=new Float32Array([0,0,.5,1,1,0]),n=new Uint32Array([0,1,2]),i=new Ce;i.setAttribute("position",new H(e,3)),i.setAttribute("normal",new H(t,3)),i.setAttribute("uv",new H(r,2)),i.setIndex(new H(n,1));let o=new Oe(i),s=new Vr(o);s.primitiveOffset=this.triangleSum,s.vertexOffset=this.vertexSum,this.vertexSum+=3,this.triangleSum+=1,this.meshes.push(s),e=new Float32Array([-.5,-.5,-1,0,.5,-1,.5,-.5,-1]),t=new Float32Array([0,0,1,0,0,1,0,0,1]),r=new Float32Array([0,0,.5,1,1,0]),n=new Uint32Array([0,1,2]),i=new Ce,i.setAttribute("position",new H(e,3)),i.setAttribute("normal",new H(t,3)),i.setAttribute("uv",new H(r,2)),i.setIndex(new H(n,1)),o=new Oe(i),s=new Vr(o),s.primitiveOffset=this.triangleSum,s.vertexOffset=this.vertexSum,this.vertexSum+=3,this.triangleSum+=1,this.meshes.push(s),e=new Float32Array([-.5,-.5,1,.5,-.5,1,0,.5,1]),t=new Float32Array([0,0,-1,0,0,-1,0,0,-1]),r=new Float32Array([0,0,.5,1,1,0]),n=new Uint32Array([0,1,2]),i=new Ce,i.setAttribute("position",new H(e,3)),i.setAttribute("normal",new H(t,3)),i.setAttribute("uv",new H(r,2)),i.setIndex(new H(n,1)),o=new Oe(i),s=new Vr(o),s.primitiveOffset=this.triangleSum,s.vertexOffset=this.vertexSum,this.vertexSum+=3,this.triangleSum+=1,this.meshes.push(s)}prepareRasterVtxBuffer(e){this.rasterVtxBuffer=e.device.createBuffer({label:"rasterVtxBuffer",size:this.triangleSum*3*Float32Array.BYTES_PER_ELEMENT*3,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.VERTEX,mappedAtCreation:!0});const t=this.rasterVtxBuffer.getMappedRange(),r=new Float32Array(t);for(let n=0;n<this.meshes.length;n++){let i=this.meshes[n];for(let o=0;o<i.primitiveCount;o++)for(let s=0;s<3;s++){const a=(o+i.primitiveOffset)*9+s*3,l=i.geometry.indices[o*3+s];r.set(i.geometry.position.slice(l*3,l*3+3),a)}}this.rasterVtxBuffer.unmap()}prepareVtxIdxArray(){this.vertexArray=new Float32Array(this.vertexSum*4).fill(1),this.indexArray=new Uint32Array(this.triangleSum*3).fill(0);for(let e=0;e<this.meshes.length;e++){let t=this.meshes[e];for(let r=0;r<t.vertexCount;r++){const n=(r+t.vertexOffset)*4;this.vertexArray.set(t.geometry.position.slice(r*3,r*3+3),n)}for(let r=0;r<t.primitiveCount;r++){const n=(r+t.primitiveOffset)*3,i=new Uint32Array([t.geometry.indices[r*3]+t.vertexOffset,t.geometry.indices[r*3+1]+t.vertexOffset,t.geometry.indices[r*3+2]+t.vertexOffset]);this.indexArray.set(i,n)}t.geometry.position=null,t.geometry.indices=null}}async prepareBVH(e){return new Promise(async(t,r)=>{let n=new sc;n.onmessage=async i=>{if(typeof i.data=="string"){$r(i.data);return}if(typeof i.data=="number"){this.bvhMaxDepth=i.data;return}$r("bvh building finished"),this.bvhBuffer=e.device.createBuffer({label:"bvhBuffer",size:i.data.byteLength,usage:GPUBufferUsage.STORAGE,mappedAtCreation:!0});let o=new Uint8Array(this.bvhBuffer.getMappedRange()),s=new Uint8Array(i.data);o.set(s),this.bvhBuffer.unmap(),n.terminate(),t()},n.postMessage({vertexArray:this.vertexArray,indexArray:this.indexArray})})}allocateBuffer(e){this.vertexBuffer=e.device.createBuffer({label:"vertexBuffer",size:this.vertexArray.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.VERTEX,mappedAtCreation:!0}),this.indexBuffer=e.device.createBuffer({label:"indexBuffer",size:this.indexArray.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.INDEX,mappedAtCreation:!0}),this.geometryBuffer=e.device.createBuffer({label:"geometryBuffer",size:this.vertexSum*16*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.VERTEX,mappedAtCreation:!0})}writeBuffer(){new Float32Array(this.vertexBuffer.getMappedRange()).set(this.vertexArray),this.vertexBuffer.unmap(),this.vertexArray=null,new Uint32Array(this.indexBuffer.getMappedRange()).set(this.indexArray),this.indexBuffer.unmap(),this.indexArray=null;{const e=this.geometryBuffer.getMappedRange(),t=new Float32Array(e),r=new Uint32Array(e);for(let n=0;n<this.meshes.length;n++){let i=this.meshes[n];for(let o=0;o<i.vertexCount;o++){let s=(o+i.vertexOffset)*16;r.set(i.TextureId,s),r.set([32896],s+7),t.set(i.geometry.normal.slice(o*3,o*3+3),s+4),t.set(i.geometry.tangent.slice(o*4,o*4+4),s+8),t.set(i.geometry.uv.slice(o*2,o*2+2),s+12)}i.geometry.normal=null,i.geometry.uv=null,i.geometry.tangent=null,i.geometry=null}this.geometryBuffer.unmap()}console.log("writing finished")}}class T{position;color;intensity;prob;alias;constructor(e,t,r){this.position=e,this.color=t,this.intensity=r,this.prob=1,this.alias=0,window.performance.now()}velocity=[0,0,0];transform}class Wr{device;lightCount=11;lights;lightBuffer;constructor(e,t){this.lights=e,this.device=t,this.lightCount=e.length;for(let a=0;a<e.length;a++)e[a].alias=a;this.lightBuffer=this.device.device.createBuffer({label:"light buffer",size:4*(4+this.lightCount*8),usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST,mappedAtCreation:!0});function r(a){let l=0;a.forEach(d=>{l+=d.intensity});let c=l/a.length,h=Array(),f=Array();for(a.forEach(d=>{d.prob=d.intensity/c,d.prob<1?h.push(d):f.push(d)});h.length>0&&f.length>0;){let d=h.pop(),p=f.pop();d.alias=p.alias,p.prob+=d.prob-1,p.prob<1?h.push(p):f.push(p)}for(;f.length>0;){let d=f.pop();d.prob=1}for(;h.length>0;){let d=h.pop();d.prob=1}return l}let n=r(e),i=this.lightBuffer.getMappedRange(),o=new Uint32Array(i),s=new Float32Array(i);o[0]=e.length,s[1]=n;for(let a=0;a<e.length;a++){let l=4+8*a;s.set(e[a].position,l);let c=Math.round(e[a].color[0]*255)<<0|Math.round(e[a].color[1]*255)<<8|Math.round(e[a].color[2]*255)<<16;o[l+3]=c,s[l+4]=e[a].prob,o[l+5]=e[a].alias,s[l+6]=e[a].intensity}this.lightBuffer.unmap()}}const Co={type:"change"},Rn={type:"start"},Po={type:"end"},jr=new pr,Mo=new ue,lc=Math.cos(70*Ho.DEG2RAD);class cc extends dr{constructor(e,t){super(),this.object=e,this.domElement=t,this.domElement.style.touchAction="none",this.enabled=!0,this.target=new b,this.cursor=new b,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:gt.ROTATE,MIDDLE:gt.DOLLY,RIGHT:gt.PAN},this.touches={ONE:yt.ROTATE,TWO:yt.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._domElementKeyEvents=null,this.getPolarAngle=function(){return s.phi},this.getAzimuthalAngle=function(){return s.theta},this.getDistance=function(){return this.object.position.distanceTo(this.target)},this.listenToKeyEvents=function(g){g.addEventListener("keydown",rn),this._domElementKeyEvents=g},this.stopListenToKeyEvents=function(){this._domElementKeyEvents.removeEventListener("keydown",rn),this._domElementKeyEvents=null},this.saveState=function(){r.target0.copy(r.target),r.position0.copy(r.object.position),r.zoom0=r.object.zoom},this.reset=function(){r.target.copy(r.target0),r.object.position.copy(r.position0),r.object.zoom=r.zoom0,r.object.updateProjectionMatrix(),r.dispatchEvent(Co),r.update(),i=n.NONE},this.update=function(){const g=new b,M=new Me().setFromUnitVectors(e.up,new b(0,1,0)),D=M.clone().invert(),N=new b,te=new Me,Xe=new b,fe=2*Math.PI;return function(As=null){const Ii=r.object.position;g.copy(Ii).sub(r.target),g.applyQuaternion(M),s.setFromVector3(g),r.autoRotate&&i===n.NONE&&ie(W(As)),r.enableDamping?(s.theta+=a.theta*r.dampingFactor,s.phi+=a.phi*r.dampingFactor):(s.theta+=a.theta,s.phi+=a.phi);let Re=r.minAzimuthAngle,Le=r.maxAzimuthAngle;isFinite(Re)&&isFinite(Le)&&(Re<-Math.PI?Re+=fe:Re>Math.PI&&(Re-=fe),Le<-Math.PI?Le+=fe:Le>Math.PI&&(Le-=fe),Re<=Le?s.theta=Math.max(Re,Math.min(Le,s.theta)):s.theta=s.theta>(Re+Le)/2?Math.max(Re,s.theta):Math.min(Le,s.theta)),s.phi=Math.max(r.minPolarAngle,Math.min(r.maxPolarAngle,s.phi)),s.makeSafe(),r.enableDamping===!0?r.target.addScaledVector(c,r.dampingFactor):r.target.add(c),r.target.sub(r.cursor),r.target.clampLength(r.minTargetRadius,r.maxTargetRadius),r.target.add(r.cursor);let jt=!1;if(r.zoomToCursor&&L||r.object.isOrthographicCamera)s.radius=je(s.radius);else{const Ee=s.radius;s.radius=je(s.radius*l),jt=Ee!=s.radius}if(g.setFromSpherical(s),g.applyQuaternion(D),Ii.copy(r.target).add(g),r.object.lookAt(r.target),r.enableDamping===!0?(a.theta*=1-r.dampingFactor,a.phi*=1-r.dampingFactor,c.multiplyScalar(1-r.dampingFactor)):(a.set(0,0,0),c.set(0,0,0)),r.zoomToCursor&&L){let Ee=null;if(r.object.isPerspectiveCamera){const Xt=g.length();Ee=je(Xt*l);const yr=Xt-Ee;r.object.position.addScaledVector(A,yr),r.object.updateMatrixWorld(),jt=!!yr}else if(r.object.isOrthographicCamera){const Xt=new b(P.x,P.y,0);Xt.unproject(r.object);const yr=r.object.zoom;r.object.zoom=Math.max(r.minZoom,Math.min(r.maxZoom,r.object.zoom/l)),r.object.updateProjectionMatrix(),jt=yr!==r.object.zoom;const Si=new b(P.x,P.y,0);Si.unproject(r.object),r.object.position.sub(Si).add(Xt),r.object.updateMatrixWorld(),Ee=g.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),r.zoomToCursor=!1;Ee!==null&&(this.screenSpacePanning?r.target.set(0,0,-1).transformDirection(r.object.matrix).multiplyScalar(Ee).add(r.object.position):(jr.origin.copy(r.object.position),jr.direction.set(0,0,-1).transformDirection(r.object.matrix),Math.abs(r.object.up.dot(jr.direction))<lc?e.lookAt(r.target):(Mo.setFromNormalAndCoplanarPoint(r.object.up,r.target),jr.intersectPlane(Mo,r.target))))}else if(r.object.isOrthographicCamera){const Ee=r.object.zoom;r.object.zoom=Math.max(r.minZoom,Math.min(r.maxZoom,r.object.zoom/l)),Ee!==r.object.zoom&&(r.object.updateProjectionMatrix(),jt=!0)}return l=1,L=!1,jt||N.distanceToSquared(r.object.position)>o||8*(1-te.dot(r.object.quaternion))>o||Xe.distanceToSquared(r.target)>o?(r.dispatchEvent(Co),N.copy(r.object.position),te.copy(r.object.quaternion),Xe.copy(r.target),!0):!1}}(),this.dispose=function(){r.domElement.removeEventListener("contextmenu",bi),r.domElement.removeEventListener("pointerdown",mi),r.domElement.removeEventListener("pointercancel",Wt),r.domElement.removeEventListener("wheel",gi),r.domElement.removeEventListener("pointermove",tn),r.domElement.removeEventListener("pointerup",Wt),r.domElement.getRootNode().removeEventListener("keydown",yi,{capture:!0}),r._domElementKeyEvents!==null&&(r._domElementKeyEvents.removeEventListener("keydown",rn),r._domElementKeyEvents=null)};const r=this,n={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6};let i=n.NONE;const o=1e-6,s=new So,a=new So;let l=1;const c=new b,h=new k,f=new k,d=new k,p=new k,y=new k,m=new k,w=new k,S=new k,_=new k,A=new b,P=new k;let L=!1;const C=[],R={};let G=!1;function W(g){return g!==null?2*Math.PI/60*r.autoRotateSpeed*g:2*Math.PI/60/60*r.autoRotateSpeed}function j(g){const M=Math.abs(g*.01);return Math.pow(.95,r.zoomSpeed*M)}function ie(g){a.theta-=g}function X(g){a.phi-=g}const ye=function(){const g=new b;return function(D,N){g.setFromMatrixColumn(N,0),g.multiplyScalar(-D),c.add(g)}}(),rt=function(){const g=new b;return function(D,N){r.screenSpacePanning===!0?g.setFromMatrixColumn(N,1):(g.setFromMatrixColumn(N,0),g.crossVectors(r.object.up,g)),g.multiplyScalar(D),c.add(g)}}(),xe=function(){const g=new b;return function(D,N){const te=r.domElement;if(r.object.isPerspectiveCamera){const Xe=r.object.position;g.copy(Xe).sub(r.target);let fe=g.length();fe*=Math.tan(r.object.fov/2*Math.PI/180),ye(2*D*fe/te.clientHeight,r.object.matrix),rt(2*N*fe/te.clientHeight,r.object.matrix)}else r.object.isOrthographicCamera?(ye(D*(r.object.right-r.object.left)/r.object.zoom/te.clientWidth,r.object.matrix),rt(N*(r.object.top-r.object.bottom)/r.object.zoom/te.clientHeight,r.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),r.enablePan=!1)}}();function Ve(g){r.object.isPerspectiveCamera||r.object.isOrthographicCamera?l/=g:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),r.enableZoom=!1)}function nt(g){r.object.isPerspectiveCamera||r.object.isOrthographicCamera?l*=g:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),r.enableZoom=!1)}function We(g,M){if(!r.zoomToCursor)return;L=!0;const D=r.domElement.getBoundingClientRect(),N=g-D.left,te=M-D.top,Xe=D.width,fe=D.height;P.x=N/Xe*2-1,P.y=-(te/fe)*2+1,A.set(P.x,P.y,1).unproject(r.object).sub(r.object.position).normalize()}function je(g){return Math.max(r.minDistance,Math.min(r.maxDistance,g))}function it(g){h.set(g.clientX,g.clientY)}function ls(g){We(g.clientX,g.clientX),w.set(g.clientX,g.clientY)}function li(g){p.set(g.clientX,g.clientY)}function cs(g){f.set(g.clientX,g.clientY),d.subVectors(f,h).multiplyScalar(r.rotateSpeed);const M=r.domElement;ie(2*Math.PI*d.x/M.clientHeight),X(2*Math.PI*d.y/M.clientHeight),h.copy(f),r.update()}function us(g){S.set(g.clientX,g.clientY),_.subVectors(S,w),_.y>0?Ve(j(_.y)):_.y<0&&nt(j(_.y)),w.copy(S),r.update()}function hs(g){y.set(g.clientX,g.clientY),m.subVectors(y,p).multiplyScalar(r.panSpeed),xe(m.x,m.y),p.copy(y),r.update()}function fs(g){We(g.clientX,g.clientY),g.deltaY<0?nt(j(g.deltaY)):g.deltaY>0&&Ve(j(g.deltaY)),r.update()}function ds(g){let M=!1;switch(g.code){case r.keys.UP:g.ctrlKey||g.metaKey||g.shiftKey?X(2*Math.PI*r.rotateSpeed/r.domElement.clientHeight):xe(0,r.keyPanSpeed),M=!0;break;case r.keys.BOTTOM:g.ctrlKey||g.metaKey||g.shiftKey?X(-2*Math.PI*r.rotateSpeed/r.domElement.clientHeight):xe(0,-r.keyPanSpeed),M=!0;break;case r.keys.LEFT:g.ctrlKey||g.metaKey||g.shiftKey?ie(2*Math.PI*r.rotateSpeed/r.domElement.clientHeight):xe(r.keyPanSpeed,0),M=!0;break;case r.keys.RIGHT:g.ctrlKey||g.metaKey||g.shiftKey?ie(-2*Math.PI*r.rotateSpeed/r.domElement.clientHeight):xe(-r.keyPanSpeed,0),M=!0;break}M&&(g.preventDefault(),r.update())}function ci(g){if(C.length===1)h.set(g.pageX,g.pageY);else{const M=mt(g),D=.5*(g.pageX+M.x),N=.5*(g.pageY+M.y);h.set(D,N)}}function ui(g){if(C.length===1)p.set(g.pageX,g.pageY);else{const M=mt(g),D=.5*(g.pageX+M.x),N=.5*(g.pageY+M.y);p.set(D,N)}}function hi(g){const M=mt(g),D=g.pageX-M.x,N=g.pageY-M.y,te=Math.sqrt(D*D+N*N);w.set(0,te)}function ps(g){r.enableZoom&&hi(g),r.enablePan&&ui(g)}function ms(g){r.enableZoom&&hi(g),r.enableRotate&&ci(g)}function fi(g){if(C.length==1)f.set(g.pageX,g.pageY);else{const D=mt(g),N=.5*(g.pageX+D.x),te=.5*(g.pageY+D.y);f.set(N,te)}d.subVectors(f,h).multiplyScalar(r.rotateSpeed);const M=r.domElement;ie(2*Math.PI*d.x/M.clientHeight),X(2*Math.PI*d.y/M.clientHeight),h.copy(f)}function di(g){if(C.length===1)y.set(g.pageX,g.pageY);else{const M=mt(g),D=.5*(g.pageX+M.x),N=.5*(g.pageY+M.y);y.set(D,N)}m.subVectors(y,p).multiplyScalar(r.panSpeed),xe(m.x,m.y),p.copy(y)}function pi(g){const M=mt(g),D=g.pageX-M.x,N=g.pageY-M.y,te=Math.sqrt(D*D+N*N);S.set(0,te),_.set(0,Math.pow(S.y/w.y,r.zoomSpeed)),Ve(_.y),w.copy(S);const Xe=(g.pageX+M.x)*.5,fe=(g.pageY+M.y)*.5;We(Xe,fe)}function gs(g){r.enableZoom&&pi(g),r.enablePan&&di(g)}function ys(g){r.enableZoom&&pi(g),r.enableRotate&&fi(g)}function mi(g){r.enabled!==!1&&(C.length===0&&(r.domElement.setPointerCapture(g.pointerId),r.domElement.addEventListener("pointermove",tn),r.domElement.addEventListener("pointerup",Wt)),!_s(g)&&(Is(g),g.pointerType==="touch"?vi(g):xs(g)))}function tn(g){r.enabled!==!1&&(g.pointerType==="touch"?ws(g):vs(g))}function Wt(g){switch(Ss(g),C.length){case 0:r.domElement.releasePointerCapture(g.pointerId),r.domElement.removeEventListener("pointermove",tn),r.domElement.removeEventListener("pointerup",Wt),r.dispatchEvent(Po),i=n.NONE;break;case 1:const M=C[0],D=R[M];vi({pointerId:M,pageX:D.x,pageY:D.y});break}}function xs(g){let M;switch(g.button){case 0:M=r.mouseButtons.LEFT;break;case 1:M=r.mouseButtons.MIDDLE;break;case 2:M=r.mouseButtons.RIGHT;break;default:M=-1}switch(M){case gt.DOLLY:if(r.enableZoom===!1)return;ls(g),i=n.DOLLY;break;case gt.ROTATE:if(g.ctrlKey||g.metaKey||g.shiftKey){if(r.enablePan===!1)return;li(g),i=n.PAN}else{if(r.enableRotate===!1)return;it(g),i=n.ROTATE}break;case gt.PAN:if(g.ctrlKey||g.metaKey||g.shiftKey){if(r.enableRotate===!1)return;it(g),i=n.ROTATE}else{if(r.enablePan===!1)return;li(g),i=n.PAN}break;default:i=n.NONE}i!==n.NONE&&r.dispatchEvent(Rn)}function vs(g){switch(i){case n.ROTATE:if(r.enableRotate===!1)return;cs(g);break;case n.DOLLY:if(r.enableZoom===!1)return;us(g);break;case n.PAN:if(r.enablePan===!1)return;hs(g);break}}function gi(g){r.enabled===!1||r.enableZoom===!1||i!==n.NONE||(g.preventDefault(),r.dispatchEvent(Rn),fs(bs(g)),r.dispatchEvent(Po))}function bs(g){const M=g.deltaMode,D={clientX:g.clientX,clientY:g.clientY,deltaY:g.deltaY};switch(M){case 1:D.deltaY*=16;break;case 2:D.deltaY*=100;break}return g.ctrlKey&&!G&&(D.deltaY*=10),D}function yi(g){g.key==="Control"&&(G=!0,r.domElement.getRootNode().addEventListener("keyup",xi,{passive:!0,capture:!0}))}function xi(g){g.key==="Control"&&(G=!1,r.domElement.getRootNode().removeEventListener("keyup",xi,{passive:!0,capture:!0}))}function rn(g){r.enabled===!1||r.enablePan===!1||ds(g)}function vi(g){switch(wi(g),C.length){case 1:switch(r.touches.ONE){case yt.ROTATE:if(r.enableRotate===!1)return;ci(g),i=n.TOUCH_ROTATE;break;case yt.PAN:if(r.enablePan===!1)return;ui(g),i=n.TOUCH_PAN;break;default:i=n.NONE}break;case 2:switch(r.touches.TWO){case yt.DOLLY_PAN:if(r.enableZoom===!1&&r.enablePan===!1)return;ps(g),i=n.TOUCH_DOLLY_PAN;break;case yt.DOLLY_ROTATE:if(r.enableZoom===!1&&r.enableRotate===!1)return;ms(g),i=n.TOUCH_DOLLY_ROTATE;break;default:i=n.NONE}break;default:i=n.NONE}i!==n.NONE&&r.dispatchEvent(Rn)}function ws(g){switch(wi(g),i){case n.TOUCH_ROTATE:if(r.enableRotate===!1)return;fi(g),r.update();break;case n.TOUCH_PAN:if(r.enablePan===!1)return;di(g),r.update();break;case n.TOUCH_DOLLY_PAN:if(r.enableZoom===!1&&r.enablePan===!1)return;gs(g),r.update();break;case n.TOUCH_DOLLY_ROTATE:if(r.enableZoom===!1&&r.enableRotate===!1)return;ys(g),r.update();break;default:i=n.NONE}}function bi(g){r.enabled!==!1&&g.preventDefault()}function Is(g){C.push(g.pointerId)}function Ss(g){delete R[g.pointerId];for(let M=0;M<C.length;M++)if(C[M]==g.pointerId){C.splice(M,1);return}}function _s(g){for(let M=0;M<C.length;M++)if(C[M]==g.pointerId)return!0;return!1}function wi(g){let M=R[g.pointerId];M===void 0&&(M=new k,R[g.pointerId]=M),M.set(g.pageX,g.pageY)}function mt(g){const M=g.pointerId===C[0]?C[1]:C[0];return R[M]}r.domElement.addEventListener("contextmenu",bi),r.domElement.addEventListener("pointerdown",mi),r.domElement.addEventListener("pointercancel",Wt),r.domElement.addEventListener("wheel",gi,{passive:!1}),r.domElement.getRootNode().addEventListener("keydown",yi,{passive:!0,capture:!0}),this.update()}}function To(u,e){if(e===va)return console.warn("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles."),u;if(e===Fn||e===Oo){let t=u.getIndex();if(t===null){const o=[],s=u.getAttribute("position");if(s!==void 0){for(let a=0;a<s.count;a++)o.push(a);u.setIndex(o),t=u.getIndex()}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible."),u}const r=t.count-2,n=[];if(e===Fn)for(let o=1;o<=r;o++)n.push(t.getX(0)),n.push(t.getX(o)),n.push(t.getX(o+1));else for(let o=0;o<r;o++)o%2===0?(n.push(t.getX(o)),n.push(t.getX(o+1)),n.push(t.getX(o+2))):(n.push(t.getX(o+2)),n.push(t.getX(o+1)),n.push(t.getX(o)));n.length/3!==r&&console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.");const i=u.clone();return i.setIndex(n),i.clearGroups(),i}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:",e),u}const Ln=new WeakMap;class uc extends pt{constructor(e){super(e),this.decoderPath="",this.decoderConfig={},this.decoderBinary=null,this.decoderPending=null,this.workerLimit=4,this.workerPool=[],this.workerNextTaskID=1,this.workerSourceURL="",this.defaultAttributeIDs={position:"POSITION",normal:"NORMAL",color:"COLOR",uv:"TEX_COORD"},this.defaultAttributeTypes={position:"Float32Array",normal:"Float32Array",color:"Float32Array",uv:"Float32Array"}}setDecoderPath(e){return this.decoderPath=e,this}setDecoderConfig(e){return this.decoderConfig=e,this}setWorkerLimit(e){return this.workerLimit=e,this}load(e,t,r,n){const i=new Zr(this.manager);i.setPath(this.path),i.setResponseType("arraybuffer"),i.setRequestHeader(this.requestHeader),i.setWithCredentials(this.withCredentials),i.load(e,o=>{this.parse(o,t,n)},r,n)}parse(e,t,r=()=>{}){this.decodeDracoFile(e,t,null,null,ne).catch(r)}decodeDracoFile(e,t,r,n,i=he,o=()=>{}){const s={attributeIDs:r||this.defaultAttributeIDs,attributeTypes:n||this.defaultAttributeTypes,useUniqueIDs:!!r,vertexColorSpace:i};return this.decodeGeometry(e,s).then(t).catch(o)}decodeGeometry(e,t){const r=JSON.stringify(t);if(Ln.has(e)){const a=Ln.get(e);if(a.key===r)return a.promise;if(e.byteLength===0)throw new Error("THREE.DRACOLoader: Unable to re-decode a buffer with different settings. Buffer has already been transferred.")}let n;const i=this.workerNextTaskID++,o=e.byteLength,s=this._getWorker(i,o).then(a=>(n=a,new Promise((l,c)=>{n._callbacks[i]={resolve:l,reject:c},n.postMessage({type:"decode",id:i,taskConfig:t,buffer:e},[e])}))).then(a=>this._createGeometry(a.geometry));return s.catch(()=>!0).then(()=>{n&&i&&this._releaseTask(n,i)}),Ln.set(e,{key:r,promise:s}),s}_createGeometry(e){const t=new Ce;e.index&&t.setIndex(new H(e.index.array,1));for(let r=0;r<e.attributes.length;r++){const n=e.attributes[r],i=n.name,o=n.array,s=n.itemSize,a=new H(o,s);i==="color"&&(this._assignVertexColorSpace(a,n.vertexColorSpace),a.normalized=!(o instanceof Float32Array)),t.setAttribute(i,a)}return t}_assignVertexColorSpace(e,t){if(t!==ne)return;const r=new Z;for(let n=0,i=e.count;n<i;n++)r.fromBufferAttribute(e,n).convertSRGBToLinear(),e.setXYZ(n,r.r,r.g,r.b)}_loadLibrary(e,t){const r=new Zr(this.manager);return r.setPath(this.decoderPath),r.setResponseType(t),r.setWithCredentials(this.withCredentials),new Promise((n,i)=>{r.load(e,n,void 0,i)})}preload(){return this._initDecoder(),this}_initDecoder(){if(this.decoderPending)return this.decoderPending;const e=typeof WebAssembly!="object"||this.decoderConfig.type==="js",t=[];return e?t.push(this._loadLibrary("draco_decoder.js","text")):(t.push(this._loadLibrary("draco_wasm_wrapper.js","text")),t.push(this._loadLibrary("draco_decoder.wasm","arraybuffer"))),this.decoderPending=Promise.all(t).then(r=>{const n=r[0];e||(this.decoderConfig.wasmBinary=r[1]);const i=hc.toString(),o=["/* draco decoder */",n,"","/* worker */",i.substring(i.indexOf("{")+1,i.lastIndexOf("}"))].join(`
`);this.workerSourceURL=URL.createObjectURL(new Blob([o]))}),this.decoderPending}_getWorker(e,t){return this._initDecoder().then(()=>{if(this.workerPool.length<this.workerLimit){const n=new Worker(this.workerSourceURL);n._callbacks={},n._taskCosts={},n._taskLoad=0,n.postMessage({type:"init",decoderConfig:this.decoderConfig}),n.onmessage=function(i){const o=i.data;switch(o.type){case"decode":n._callbacks[o.id].resolve(o);break;case"error":n._callbacks[o.id].reject(o);break;default:console.error('THREE.DRACOLoader: Unexpected message, "'+o.type+'"')}},this.workerPool.push(n)}else this.workerPool.sort(function(n,i){return n._taskLoad>i._taskLoad?-1:1});const r=this.workerPool[this.workerPool.length-1];return r._taskCosts[e]=t,r._taskLoad+=t,r})}_releaseTask(e,t){e._taskLoad-=e._taskCosts[t],delete e._callbacks[t],delete e._taskCosts[t]}debug(){console.log("Task load: ",this.workerPool.map(e=>e._taskLoad))}dispose(){for(let e=0;e<this.workerPool.length;++e)this.workerPool[e].terminate();return this.workerPool.length=0,this.workerSourceURL!==""&&URL.revokeObjectURL(this.workerSourceURL),this}}function hc(){let u,e;onmessage=function(o){const s=o.data;switch(s.type){case"init":u=s.decoderConfig,e=new Promise(function(c){u.onModuleLoaded=function(h){c({draco:h})},DracoDecoderModule(u)});break;case"decode":const a=s.buffer,l=s.taskConfig;e.then(c=>{const h=c.draco,f=new h.Decoder;try{const d=t(h,f,new Int8Array(a),l),p=d.attributes.map(y=>y.array.buffer);d.index&&p.push(d.index.array.buffer),self.postMessage({type:"decode",id:s.id,geometry:d},p)}catch(d){console.error(d),self.postMessage({type:"error",id:s.id,error:d.message})}finally{h.destroy(f)}});break}};function t(o,s,a,l){const c=l.attributeIDs,h=l.attributeTypes;let f,d;const p=s.GetEncodedGeometryType(a);if(p===o.TRIANGULAR_MESH)f=new o.Mesh,d=s.DecodeArrayToMesh(a,a.byteLength,f);else if(p===o.POINT_CLOUD)f=new o.PointCloud,d=s.DecodeArrayToPointCloud(a,a.byteLength,f);else throw new Error("THREE.DRACOLoader: Unexpected geometry type.");if(!d.ok()||f.ptr===0)throw new Error("THREE.DRACOLoader: Decoding failed: "+d.error_msg());const y={index:null,attributes:[]};for(const m in c){const w=self[h[m]];let S,_;if(l.useUniqueIDs)_=c[m],S=s.GetAttributeByUniqueId(f,_);else{if(_=s.GetAttributeId(f,o[c[m]]),_===-1)continue;S=s.GetAttribute(f,_)}const A=n(o,s,f,m,w,S);m==="color"&&(A.vertexColorSpace=l.vertexColorSpace),y.attributes.push(A)}return p===o.TRIANGULAR_MESH&&(y.index=r(o,s,f)),o.destroy(f),y}function r(o,s,a){const c=a.num_faces()*3,h=c*4,f=o._malloc(h);s.GetTrianglesUInt32Array(a,h,f);const d=new Uint32Array(o.HEAPF32.buffer,f,c).slice();return o._free(f),{array:d,itemSize:1}}function n(o,s,a,l,c,h){const f=h.num_components(),p=a.num_points()*f,y=p*c.BYTES_PER_ELEMENT,m=i(o,c),w=o._malloc(y);s.GetAttributeDataArrayForAllPoints(a,h,m,y,w);const S=new c(o.HEAPF32.buffer,w,p).slice();return o._free(w),{name:l,array:S,itemSize:f}}function i(o,s){switch(s){case Float32Array:return o.DT_FLOAT32;case Int8Array:return o.DT_INT8;case Int16Array:return o.DT_INT16;case Int32Array:return o.DT_INT32;case Uint8Array:return o.DT_UINT8;case Uint16Array:return o.DT_UINT16;case Uint32Array:return o.DT_UINT32}}}class fc extends pt{constructor(e){super(e),this.dracoLoader=null,this.ktx2Loader=null,this.meshoptDecoder=null,this.pluginCallbacks=[],this.register(function(t){return new yc(t)}),this.register(function(t){return new Cc(t)}),this.register(function(t){return new Pc(t)}),this.register(function(t){return new Mc(t)}),this.register(function(t){return new vc(t)}),this.register(function(t){return new bc(t)}),this.register(function(t){return new wc(t)}),this.register(function(t){return new Ic(t)}),this.register(function(t){return new gc(t)}),this.register(function(t){return new Sc(t)}),this.register(function(t){return new xc(t)}),this.register(function(t){return new Ac(t)}),this.register(function(t){return new _c(t)}),this.register(function(t){return new pc(t)}),this.register(function(t){return new Tc(t)}),this.register(function(t){return new Rc(t)})}load(e,t,r,n){const i=this;let o;if(this.resourcePath!=="")o=this.resourcePath;else if(this.path!==""){const l=sr.extractUrlBase(e);o=sr.resolveURL(l,this.path)}else o=sr.extractUrlBase(e);this.manager.itemStart(e);const s=function(l){n?n(l):console.error(l),i.manager.itemError(e),i.manager.itemEnd(e)},a=new Zr(this.manager);a.setPath(this.path),a.setResponseType("arraybuffer"),a.setRequestHeader(this.requestHeader),a.setWithCredentials(this.withCredentials),a.load(e,function(l){try{i.parse(l,o,function(c){t(c),i.manager.itemEnd(e)},s)}catch(c){s(c)}},r,s)}setDRACOLoader(e){return this.dracoLoader=e,this}setDDSLoader(){throw new Error('THREE.GLTFLoader: "MSFT_texture_dds" no longer supported. Please update to "KHR_texture_basisu".')}setKTX2Loader(e){return this.ktx2Loader=e,this}setMeshoptDecoder(e){return this.meshoptDecoder=e,this}register(e){return this.pluginCallbacks.indexOf(e)===-1&&this.pluginCallbacks.push(e),this}unregister(e){return this.pluginCallbacks.indexOf(e)!==-1&&this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(e),1),this}parse(e,t,r,n){let i;const o={},s={},a=new TextDecoder;if(typeof e=="string")i=JSON.parse(e);else if(e instanceof ArrayBuffer)if(a.decode(new Uint8Array(e,0,4))===es){try{o[z.KHR_BINARY_GLTF]=new Lc(e)}catch(h){n&&n(h);return}i=JSON.parse(o[z.KHR_BINARY_GLTF].content)}else i=JSON.parse(a.decode(e));else i=e;if(i.asset===void 0||i.asset.version[0]<2){n&&n(new Error("THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported."));return}const l=new Wc(i,{path:t||this.resourcePath||"",crossOrigin:this.crossOrigin,requestHeader:this.requestHeader,manager:this.manager,ktx2Loader:this.ktx2Loader,meshoptDecoder:this.meshoptDecoder});l.fileLoader.setRequestHeader(this.requestHeader);for(let c=0;c<this.pluginCallbacks.length;c++){const h=this.pluginCallbacks[c](l);h.name||console.error("THREE.GLTFLoader: Invalid plugin found: missing name"),s[h.name]=h,o[h.name]=!0}if(i.extensionsUsed)for(let c=0;c<i.extensionsUsed.length;++c){const h=i.extensionsUsed[c],f=i.extensionsRequired||[];switch(h){case z.KHR_MATERIALS_UNLIT:o[h]=new mc;break;case z.KHR_DRACO_MESH_COMPRESSION:o[h]=new Ec(i,this.dracoLoader);break;case z.KHR_TEXTURE_TRANSFORM:o[h]=new Bc;break;case z.KHR_MESH_QUANTIZATION:o[h]=new Dc;break;default:f.indexOf(h)>=0&&s[h]===void 0&&console.warn('THREE.GLTFLoader: Unknown extension "'+h+'".')}}l.setExtensions(o),l.setPlugins(s),l.parse(r,n)}parseAsync(e,t){const r=this;return new Promise(function(n,i){r.parse(e,t,n,i)})}}function dc(){let u={};return{get:function(e){return u[e]},add:function(e,t){u[e]=t},remove:function(e){delete u[e]},removeAll:function(){u={}}}}const z={KHR_BINARY_GLTF:"KHR_binary_glTF",KHR_DRACO_MESH_COMPRESSION:"KHR_draco_mesh_compression",KHR_LIGHTS_PUNCTUAL:"KHR_lights_punctual",KHR_MATERIALS_CLEARCOAT:"KHR_materials_clearcoat",KHR_MATERIALS_IOR:"KHR_materials_ior",KHR_MATERIALS_SHEEN:"KHR_materials_sheen",KHR_MATERIALS_SPECULAR:"KHR_materials_specular",KHR_MATERIALS_TRANSMISSION:"KHR_materials_transmission",KHR_MATERIALS_IRIDESCENCE:"KHR_materials_iridescence",KHR_MATERIALS_ANISOTROPY:"KHR_materials_anisotropy",KHR_MATERIALS_UNLIT:"KHR_materials_unlit",KHR_MATERIALS_VOLUME:"KHR_materials_volume",KHR_TEXTURE_BASISU:"KHR_texture_basisu",KHR_TEXTURE_TRANSFORM:"KHR_texture_transform",KHR_MESH_QUANTIZATION:"KHR_mesh_quantization",KHR_MATERIALS_EMISSIVE_STRENGTH:"KHR_materials_emissive_strength",EXT_MATERIALS_BUMP:"EXT_materials_bump",EXT_TEXTURE_WEBP:"EXT_texture_webp",EXT_TEXTURE_AVIF:"EXT_texture_avif",EXT_MESHOPT_COMPRESSION:"EXT_meshopt_compression",EXT_MESH_GPU_INSTANCING:"EXT_mesh_gpu_instancing"};class pc{constructor(e){this.parser=e,this.name=z.KHR_LIGHTS_PUNCTUAL,this.cache={refs:{},uses:{}}}_markDefs(){const e=this.parser,t=this.parser.json.nodes||[];for(let r=0,n=t.length;r<n;r++){const i=t[r];i.extensions&&i.extensions[this.name]&&i.extensions[this.name].light!==void 0&&e._addNodeRef(this.cache,i.extensions[this.name].light)}}_loadLight(e){const t=this.parser,r="light:"+e;let n=t.cache.get(r);if(n)return n;const i=t.json,a=((i.extensions&&i.extensions[this.name]||{}).lights||[])[e];let l;const c=new Z(16777215);a.color!==void 0&&c.setRGB(a.color[0],a.color[1],a.color[2],he);const h=a.range!==void 0?a.range:0;switch(a.type){case"directional":l=new Gl(c),l.target.position.set(0,0,-1),l.add(l.target);break;case"point":l=new kl(c),l.distance=h;break;case"spot":l=new Dl(c),l.distance=h,a.spot=a.spot||{},a.spot.innerConeAngle=a.spot.innerConeAngle!==void 0?a.spot.innerConeAngle:0,a.spot.outerConeAngle=a.spot.outerConeAngle!==void 0?a.spot.outerConeAngle:Math.PI/4,l.angle=a.spot.outerConeAngle,l.penumbra=1-a.spot.innerConeAngle/a.spot.outerConeAngle,l.target.position.set(0,0,-1),l.add(l.target);break;default:throw new Error("THREE.GLTFLoader: Unexpected light type: "+a.type)}return l.position.set(0,0,0),l.decay=2,et(l,a),a.intensity!==void 0&&(l.intensity=a.intensity),l.name=t.createUniqueName(a.name||"light_"+e),n=Promise.resolve(l),t.cache.add(r,n),n}getDependency(e,t){if(e==="light")return this._loadLight(t)}createNodeAttachment(e){const t=this,r=this.parser,i=r.json.nodes[e],s=(i.extensions&&i.extensions[this.name]||{}).light;return s===void 0?null:this._loadLight(s).then(function(a){return r._getNodeRef(t.cache,s,a)})}}class mc{constructor(){this.name=z.KHR_MATERIALS_UNLIT}getMaterialType(){return Bt}extendParams(e,t,r){const n=[];e.color=new Z(1,1,1),e.opacity=1;const i=t.pbrMetallicRoughness;if(i){if(Array.isArray(i.baseColorFactor)){const o=i.baseColorFactor;e.color.setRGB(o[0],o[1],o[2],he),e.opacity=o[3]}i.baseColorTexture!==void 0&&n.push(r.assignTexture(e,"map",i.baseColorTexture,ne))}return Promise.all(n)}}class gc{constructor(e){this.parser=e,this.name=z.KHR_MATERIALS_EMISSIVE_STRENGTH}extendMaterialParams(e,t){const n=this.parser.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const i=n.extensions[this.name].emissiveStrength;return i!==void 0&&(t.emissiveIntensity=i),Promise.resolve()}}class yc{constructor(e){this.parser=e,this.name=z.KHR_MATERIALS_CLEARCOAT}getMaterialType(e){const r=this.parser.json.materials[e];return!r.extensions||!r.extensions[this.name]?null:He}extendMaterialParams(e,t){const r=this.parser,n=r.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const i=[],o=n.extensions[this.name];if(o.clearcoatFactor!==void 0&&(t.clearcoat=o.clearcoatFactor),o.clearcoatTexture!==void 0&&i.push(r.assignTexture(t,"clearcoatMap",o.clearcoatTexture)),o.clearcoatRoughnessFactor!==void 0&&(t.clearcoatRoughness=o.clearcoatRoughnessFactor),o.clearcoatRoughnessTexture!==void 0&&i.push(r.assignTexture(t,"clearcoatRoughnessMap",o.clearcoatRoughnessTexture)),o.clearcoatNormalTexture!==void 0&&(i.push(r.assignTexture(t,"clearcoatNormalMap",o.clearcoatNormalTexture)),o.clearcoatNormalTexture.scale!==void 0)){const s=o.clearcoatNormalTexture.scale;t.clearcoatNormalScale=new k(s,s)}return Promise.all(i)}}class xc{constructor(e){this.parser=e,this.name=z.KHR_MATERIALS_IRIDESCENCE}getMaterialType(e){const r=this.parser.json.materials[e];return!r.extensions||!r.extensions[this.name]?null:He}extendMaterialParams(e,t){const r=this.parser,n=r.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const i=[],o=n.extensions[this.name];return o.iridescenceFactor!==void 0&&(t.iridescence=o.iridescenceFactor),o.iridescenceTexture!==void 0&&i.push(r.assignTexture(t,"iridescenceMap",o.iridescenceTexture)),o.iridescenceIor!==void 0&&(t.iridescenceIOR=o.iridescenceIor),t.iridescenceThicknessRange===void 0&&(t.iridescenceThicknessRange=[100,400]),o.iridescenceThicknessMinimum!==void 0&&(t.iridescenceThicknessRange[0]=o.iridescenceThicknessMinimum),o.iridescenceThicknessMaximum!==void 0&&(t.iridescenceThicknessRange[1]=o.iridescenceThicknessMaximum),o.iridescenceThicknessTexture!==void 0&&i.push(r.assignTexture(t,"iridescenceThicknessMap",o.iridescenceThicknessTexture)),Promise.all(i)}}class vc{constructor(e){this.parser=e,this.name=z.KHR_MATERIALS_SHEEN}getMaterialType(e){const r=this.parser.json.materials[e];return!r.extensions||!r.extensions[this.name]?null:He}extendMaterialParams(e,t){const r=this.parser,n=r.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const i=[];t.sheenColor=new Z(0,0,0),t.sheenRoughness=0,t.sheen=1;const o=n.extensions[this.name];if(o.sheenColorFactor!==void 0){const s=o.sheenColorFactor;t.sheenColor.setRGB(s[0],s[1],s[2],he)}return o.sheenRoughnessFactor!==void 0&&(t.sheenRoughness=o.sheenRoughnessFactor),o.sheenColorTexture!==void 0&&i.push(r.assignTexture(t,"sheenColorMap",o.sheenColorTexture,ne)),o.sheenRoughnessTexture!==void 0&&i.push(r.assignTexture(t,"sheenRoughnessMap",o.sheenRoughnessTexture)),Promise.all(i)}}class bc{constructor(e){this.parser=e,this.name=z.KHR_MATERIALS_TRANSMISSION}getMaterialType(e){const r=this.parser.json.materials[e];return!r.extensions||!r.extensions[this.name]?null:He}extendMaterialParams(e,t){const r=this.parser,n=r.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const i=[],o=n.extensions[this.name];return o.transmissionFactor!==void 0&&(t.transmission=o.transmissionFactor),o.transmissionTexture!==void 0&&i.push(r.assignTexture(t,"transmissionMap",o.transmissionTexture)),Promise.all(i)}}class wc{constructor(e){this.parser=e,this.name=z.KHR_MATERIALS_VOLUME}getMaterialType(e){const r=this.parser.json.materials[e];return!r.extensions||!r.extensions[this.name]?null:He}extendMaterialParams(e,t){const r=this.parser,n=r.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const i=[],o=n.extensions[this.name];t.thickness=o.thicknessFactor!==void 0?o.thicknessFactor:0,o.thicknessTexture!==void 0&&i.push(r.assignTexture(t,"thicknessMap",o.thicknessTexture)),t.attenuationDistance=o.attenuationDistance||1/0;const s=o.attenuationColor||[1,1,1];return t.attenuationColor=new Z().setRGB(s[0],s[1],s[2],he),Promise.all(i)}}class Ic{constructor(e){this.parser=e,this.name=z.KHR_MATERIALS_IOR}getMaterialType(e){const r=this.parser.json.materials[e];return!r.extensions||!r.extensions[this.name]?null:He}extendMaterialParams(e,t){const n=this.parser.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const i=n.extensions[this.name];return t.ior=i.ior!==void 0?i.ior:1.5,Promise.resolve()}}class Sc{constructor(e){this.parser=e,this.name=z.KHR_MATERIALS_SPECULAR}getMaterialType(e){const r=this.parser.json.materials[e];return!r.extensions||!r.extensions[this.name]?null:He}extendMaterialParams(e,t){const r=this.parser,n=r.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const i=[],o=n.extensions[this.name];t.specularIntensity=o.specularFactor!==void 0?o.specularFactor:1,o.specularTexture!==void 0&&i.push(r.assignTexture(t,"specularIntensityMap",o.specularTexture));const s=o.specularColorFactor||[1,1,1];return t.specularColor=new Z().setRGB(s[0],s[1],s[2],he),o.specularColorTexture!==void 0&&i.push(r.assignTexture(t,"specularColorMap",o.specularColorTexture,ne)),Promise.all(i)}}class _c{constructor(e){this.parser=e,this.name=z.EXT_MATERIALS_BUMP}getMaterialType(e){const r=this.parser.json.materials[e];return!r.extensions||!r.extensions[this.name]?null:He}extendMaterialParams(e,t){const r=this.parser,n=r.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const i=[],o=n.extensions[this.name];return t.bumpScale=o.bumpFactor!==void 0?o.bumpFactor:1,o.bumpTexture!==void 0&&i.push(r.assignTexture(t,"bumpMap",o.bumpTexture)),Promise.all(i)}}class Ac{constructor(e){this.parser=e,this.name=z.KHR_MATERIALS_ANISOTROPY}getMaterialType(e){const r=this.parser.json.materials[e];return!r.extensions||!r.extensions[this.name]?null:He}extendMaterialParams(e,t){const r=this.parser,n=r.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const i=[],o=n.extensions[this.name];return o.anisotropyStrength!==void 0&&(t.anisotropy=o.anisotropyStrength),o.anisotropyRotation!==void 0&&(t.anisotropyRotation=o.anisotropyRotation),o.anisotropyTexture!==void 0&&i.push(r.assignTexture(t,"anisotropyMap",o.anisotropyTexture)),Promise.all(i)}}class Cc{constructor(e){this.parser=e,this.name=z.KHR_TEXTURE_BASISU}loadTexture(e){const t=this.parser,r=t.json,n=r.textures[e];if(!n.extensions||!n.extensions[this.name])return null;const i=n.extensions[this.name],o=t.options.ktx2Loader;if(!o){if(r.extensionsRequired&&r.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");return null}return t.loadTextureImage(e,i.source,o)}}class Pc{constructor(e){this.parser=e,this.name=z.EXT_TEXTURE_WEBP,this.isSupported=null}loadTexture(e){const t=this.name,r=this.parser,n=r.json,i=n.textures[e];if(!i.extensions||!i.extensions[t])return null;const o=i.extensions[t],s=n.images[o.source];let a=r.textureLoader;if(s.uri){const l=r.options.manager.getHandler(s.uri);l!==null&&(a=l)}return this.detectSupport().then(function(l){if(l)return r.loadTextureImage(e,o.source,a);if(n.extensionsRequired&&n.extensionsRequired.indexOf(t)>=0)throw new Error("THREE.GLTFLoader: WebP required by asset but unsupported.");return r.loadTexture(e)})}detectSupport(){return this.isSupported||(this.isSupported=new Promise(function(e){const t=new Image;t.src="data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA",t.onload=t.onerror=function(){e(t.height===1)}})),this.isSupported}}class Mc{constructor(e){this.parser=e,this.name=z.EXT_TEXTURE_AVIF,this.isSupported=null}loadTexture(e){const t=this.name,r=this.parser,n=r.json,i=n.textures[e];if(!i.extensions||!i.extensions[t])return null;const o=i.extensions[t],s=n.images[o.source];let a=r.textureLoader;if(s.uri){const l=r.options.manager.getHandler(s.uri);l!==null&&(a=l)}return this.detectSupport().then(function(l){if(l)return r.loadTextureImage(e,o.source,a);if(n.extensionsRequired&&n.extensionsRequired.indexOf(t)>=0)throw new Error("THREE.GLTFLoader: AVIF required by asset but unsupported.");return r.loadTexture(e)})}detectSupport(){return this.isSupported||(this.isSupported=new Promise(function(e){const t=new Image;t.src="data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABcAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB9tZGF0EgAKCBgABogQEDQgMgkQAAAAB8dSLfI=",t.onload=t.onerror=function(){e(t.height===1)}})),this.isSupported}}class Tc{constructor(e){this.name=z.EXT_MESHOPT_COMPRESSION,this.parser=e}loadBufferView(e){const t=this.parser.json,r=t.bufferViews[e];if(r.extensions&&r.extensions[this.name]){const n=r.extensions[this.name],i=this.parser.getDependency("buffer",n.buffer),o=this.parser.options.meshoptDecoder;if(!o||!o.supported){if(t.extensionsRequired&&t.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files");return null}return i.then(function(s){const a=n.byteOffset||0,l=n.byteLength||0,c=n.count,h=n.byteStride,f=new Uint8Array(s,a,l);return o.decodeGltfBufferAsync?o.decodeGltfBufferAsync(c,h,f,n.mode,n.filter).then(function(d){return d.buffer}):o.ready.then(function(){const d=new ArrayBuffer(c*h);return o.decodeGltfBuffer(new Uint8Array(d),c,h,f,n.mode,n.filter),d})})}else return null}}class Rc{constructor(e){this.name=z.EXT_MESH_GPU_INSTANCING,this.parser=e}createNodeMesh(e){const t=this.parser.json,r=t.nodes[e];if(!r.extensions||!r.extensions[this.name]||r.mesh===void 0)return null;const n=t.meshes[r.mesh];for(const l of n.primitives)if(l.mode!==pe.TRIANGLES&&l.mode!==pe.TRIANGLE_STRIP&&l.mode!==pe.TRIANGLE_FAN&&l.mode!==void 0)return null;const o=r.extensions[this.name].attributes,s=[],a={};for(const l in o)s.push(this.parser.getDependency("accessor",o[l]).then(c=>(a[l]=c,a[l])));return s.length<1?null:(s.push(this.parser.createNodeMesh(e)),Promise.all(s).then(l=>{const c=l.pop(),h=c.isGroup?c.children:[c],f=l[0].count,d=[];for(const p of h){const y=new B,m=new b,w=new Me,S=new b(1,1,1),_=new ml(p.geometry,p.material,f);for(let A=0;A<f;A++)a.TRANSLATION&&m.fromBufferAttribute(a.TRANSLATION,A),a.ROTATION&&w.fromBufferAttribute(a.ROTATION,A),a.SCALE&&S.fromBufferAttribute(a.SCALE,A),_.setMatrixAt(A,y.compose(m,w,S));for(const A in a)if(A==="_COLOR_0"){const P=a[A];_.instanceColor=new Hn(P.array,P.itemSize,P.normalized)}else A!=="TRANSLATION"&&A!=="ROTATION"&&A!=="SCALE"&&p.geometry.setAttribute(A,a[A]);q.prototype.copy.call(_,p),this.parser.assignFinalMaterial(_),d.push(_)}return c.isGroup?(c.clear(),c.add(...d),c):d[0]}))}}const es="glTF",er=12,Ro={JSON:1313821514,BIN:5130562};class Lc{constructor(e){this.name=z.KHR_BINARY_GLTF,this.content=null,this.body=null;const t=new DataView(e,0,er),r=new TextDecoder;if(this.header={magic:r.decode(new Uint8Array(e.slice(0,4))),version:t.getUint32(4,!0),length:t.getUint32(8,!0)},this.header.magic!==es)throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");if(this.header.version<2)throw new Error("THREE.GLTFLoader: Legacy binary file detected.");const n=this.header.length-er,i=new DataView(e,er);let o=0;for(;o<n;){const s=i.getUint32(o,!0);o+=4;const a=i.getUint32(o,!0);if(o+=4,a===Ro.JSON){const l=new Uint8Array(e,er+o,s);this.content=r.decode(l)}else if(a===Ro.BIN){const l=er+o;this.body=e.slice(l,l+s)}o+=s}if(this.content===null)throw new Error("THREE.GLTFLoader: JSON content not found.")}}class Ec{constructor(e,t){if(!t)throw new Error("THREE.GLTFLoader: No DRACOLoader instance provided.");this.name=z.KHR_DRACO_MESH_COMPRESSION,this.json=e,this.dracoLoader=t,this.dracoLoader.preload()}decodePrimitive(e,t){const r=this.json,n=this.dracoLoader,i=e.extensions[this.name].bufferView,o=e.extensions[this.name].attributes,s={},a={},l={};for(const c in o){const h=Wn[c]||c.toLowerCase();s[h]=o[c]}for(const c in e.attributes){const h=Wn[c]||c.toLowerCase();if(o[c]!==void 0){const f=r.accessors[e.attributes[c]],d=zt[f.componentType];l[h]=d.name,a[h]=f.normalized===!0}}return t.getDependency("bufferView",i).then(function(c){return new Promise(function(h,f){n.decodeDracoFile(c,function(d){for(const p in d.attributes){const y=d.attributes[p],m=a[p];m!==void 0&&(y.normalized=m)}h(d)},s,l,he,f)})})}}class Bc{constructor(){this.name=z.KHR_TEXTURE_TRANSFORM}extendTexture(e,t){return(t.texCoord===void 0||t.texCoord===e.channel)&&t.offset===void 0&&t.rotation===void 0&&t.scale===void 0||(e=e.clone(),t.texCoord!==void 0&&(e.channel=t.texCoord),t.offset!==void 0&&e.offset.fromArray(t.offset),t.rotation!==void 0&&(e.rotation=t.rotation),t.scale!==void 0&&e.repeat.fromArray(t.scale),e.needsUpdate=!0),e}}class Dc{constructor(){this.name=z.KHR_MESH_QUANTIZATION}}class ts extends mr{constructor(e,t,r,n){super(e,t,r,n)}copySampleValue_(e){const t=this.resultBuffer,r=this.sampleValues,n=this.valueSize,i=e*n*3+n;for(let o=0;o!==n;o++)t[o]=r[i+o];return t}interpolate_(e,t,r,n){const i=this.resultBuffer,o=this.sampleValues,s=this.valueSize,a=s*2,l=s*3,c=n-t,h=(r-t)/c,f=h*h,d=f*h,p=e*l,y=p-l,m=-2*d+3*f,w=d-f,S=1-m,_=w-f+h;for(let A=0;A!==s;A++){const P=o[y+A+s],L=o[y+A+a]*c,C=o[p+A+s],R=o[p+A]*c;i[A]=S*P+_*L+m*C+w*R}return i}}const zc=new Me;class kc extends ts{interpolate_(e,t,r,n){const i=super.interpolate_(e,t,r,n);return zc.fromArray(i).normalize().toArray(i),i}}const pe={FLOAT:5126,FLOAT_MAT3:35675,FLOAT_MAT4:35676,FLOAT_VEC2:35664,FLOAT_VEC3:35665,FLOAT_VEC4:35666,LINEAR:9729,REPEAT:10497,SAMPLER_2D:35678,POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6,UNSIGNED_BYTE:5121,UNSIGNED_SHORT:5123},zt={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array},Lo={9728:cr,9729:qn,9984:ha,9985:da,9986:fa,9987:Yn},Eo={33071:tr,33648:kn,10497:lr},En={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},Wn={POSITION:"position",NORMAL:"normal",TANGENT:"tangent",TEXCOORD_0:"uv",TEXCOORD_1:"uv1",TEXCOORD_2:"uv2",TEXCOORD_3:"uv3",COLOR_0:"color",WEIGHTS_0:"skinWeight",JOINTS_0:"skinIndex"},Qe={scale:"scale",translation:"position",rotation:"quaternion",weights:"morphTargetInfluences"},Fc={CUBICSPLINE:void 0,LINEAR:kt,STEP:ur},Bn={OPAQUE:"OPAQUE",MASK:"MASK",BLEND:"BLEND"};function Gc(u){return u.DefaultMaterial===void 0&&(u.DefaultMaterial=new ti({color:16777215,emissive:0,metalness:1,roughness:1,transparent:!1,depthTest:!0,side:Yr})),u.DefaultMaterial}function ct(u,e,t){for(const r in t.extensions)u[r]===void 0&&(e.userData.gltfExtensions=e.userData.gltfExtensions||{},e.userData.gltfExtensions[r]=t.extensions[r])}function et(u,e){e.extras!==void 0&&(typeof e.extras=="object"?Object.assign(u.userData,e.extras):console.warn("THREE.GLTFLoader: Ignoring primitive type .extras, "+e.extras))}function Oc(u,e,t){let r=!1,n=!1,i=!1;for(let l=0,c=e.length;l<c;l++){const h=e[l];if(h.POSITION!==void 0&&(r=!0),h.NORMAL!==void 0&&(n=!0),h.COLOR_0!==void 0&&(i=!0),r&&n&&i)break}if(!r&&!n&&!i)return Promise.resolve(u);const o=[],s=[],a=[];for(let l=0,c=e.length;l<c;l++){const h=e[l];if(r){const f=h.POSITION!==void 0?t.getDependency("accessor",h.POSITION):u.attributes.position;o.push(f)}if(n){const f=h.NORMAL!==void 0?t.getDependency("accessor",h.NORMAL):u.attributes.normal;s.push(f)}if(i){const f=h.COLOR_0!==void 0?t.getDependency("accessor",h.COLOR_0):u.attributes.color;a.push(f)}}return Promise.all([Promise.all(o),Promise.all(s),Promise.all(a)]).then(function(l){const c=l[0],h=l[1],f=l[2];return r&&(u.morphAttributes.position=c),n&&(u.morphAttributes.normal=h),i&&(u.morphAttributes.color=f),u.morphTargetsRelative=!0,u})}function Uc(u,e){if(u.updateMorphTargets(),e.weights!==void 0)for(let t=0,r=e.weights.length;t<r;t++)u.morphTargetInfluences[t]=e.weights[t];if(e.extras&&Array.isArray(e.extras.targetNames)){const t=e.extras.targetNames;if(u.morphTargetInfluences.length===t.length){u.morphTargetDictionary={};for(let r=0,n=t.length;r<n;r++)u.morphTargetDictionary[t[r]]=r}else console.warn("THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.")}}function Nc(u){let e;const t=u.extensions&&u.extensions[z.KHR_DRACO_MESH_COMPRESSION];if(t?e="draco:"+t.bufferView+":"+t.indices+":"+Dn(t.attributes):e=u.indices+":"+Dn(u.attributes)+":"+u.mode,u.targets!==void 0)for(let r=0,n=u.targets.length;r<n;r++)e+=":"+Dn(u.targets[r]);return e}function Dn(u){let e="";const t=Object.keys(u).sort();for(let r=0,n=t.length;r<n;r++)e+=t[r]+":"+u[t[r]]+";";return e}function jn(u){switch(u){case Int8Array:return 1/127;case Uint8Array:return 1/255;case Int16Array:return 1/32767;case Uint16Array:return 1/65535;default:throw new Error("THREE.GLTFLoader: Unsupported normalized accessor component type.")}}function Hc(u){return u.search(/\.jpe?g($|\?)/i)>0||u.search(/^data\:image\/jpeg/)===0?"image/jpeg":u.search(/\.webp($|\?)/i)>0||u.search(/^data\:image\/webp/)===0?"image/webp":"image/png"}const Vc=new B;class Wc{constructor(e={},t={}){this.json=e,this.extensions={},this.plugins={},this.options=t,this.cache=new dc,this.associations=new Map,this.primitiveCache={},this.nodeCache={},this.meshCache={refs:{},uses:{}},this.cameraCache={refs:{},uses:{}},this.lightCache={refs:{},uses:{}},this.sourceCache={},this.textureCache={},this.nodeNamesUsed={};let r=!1,n=!1,i=-1;typeof navigator<"u"&&(r=/^((?!chrome|android).)*safari/i.test(navigator.userAgent)===!0,n=navigator.userAgent.indexOf("Firefox")>-1,i=n?navigator.userAgent.match(/Firefox\/([0-9]+)\./)[1]:-1),typeof createImageBitmap>"u"||r||n&&i<98?this.textureLoader=new El(this.options.manager):this.textureLoader=new Ol(this.options.manager),this.textureLoader.setCrossOrigin(this.options.crossOrigin),this.textureLoader.setRequestHeader(this.options.requestHeader),this.fileLoader=new Zr(this.options.manager),this.fileLoader.setResponseType("arraybuffer"),this.options.crossOrigin==="use-credentials"&&this.fileLoader.setWithCredentials(!0)}setExtensions(e){this.extensions=e}setPlugins(e){this.plugins=e}parse(e,t){const r=this,n=this.json,i=this.extensions;this.cache.removeAll(),this.nodeCache={},this._invokeAll(function(o){return o._markDefs&&o._markDefs()}),Promise.all(this._invokeAll(function(o){return o.beforeRoot&&o.beforeRoot()})).then(function(){return Promise.all([r.getDependencies("scene"),r.getDependencies("animation"),r.getDependencies("camera")])}).then(function(o){const s={scene:o[0][n.scene||0],scenes:o[0],animations:o[1],cameras:o[2],asset:n.asset,parser:r,userData:{}};return ct(i,s,n),et(s,n),Promise.all(r._invokeAll(function(a){return a.afterRoot&&a.afterRoot(s)})).then(function(){e(s)})}).catch(t)}_markDefs(){const e=this.json.nodes||[],t=this.json.skins||[],r=this.json.meshes||[];for(let n=0,i=t.length;n<i;n++){const o=t[n].joints;for(let s=0,a=o.length;s<a;s++)e[o[s]].isBone=!0}for(let n=0,i=e.length;n<i;n++){const o=e[n];o.mesh!==void 0&&(this._addNodeRef(this.meshCache,o.mesh),o.skin!==void 0&&(r[o.mesh].isSkinnedMesh=!0)),o.camera!==void 0&&this._addNodeRef(this.cameraCache,o.camera)}}_addNodeRef(e,t){t!==void 0&&(e.refs[t]===void 0&&(e.refs[t]=e.uses[t]=0),e.refs[t]++)}_getNodeRef(e,t,r){if(e.refs[t]<=1)return r;const n=r.clone(),i=(o,s)=>{const a=this.associations.get(o);a!=null&&this.associations.set(s,a);for(const[l,c]of o.children.entries())i(c,s.children[l])};return i(r,n),n.name+="_instance_"+e.uses[t]++,n}_invokeOne(e){const t=Object.values(this.plugins);t.push(this);for(let r=0;r<t.length;r++){const n=e(t[r]);if(n)return n}return null}_invokeAll(e){const t=Object.values(this.plugins);t.unshift(this);const r=[];for(let n=0;n<t.length;n++){const i=e(t[n]);i&&r.push(i)}return r}getDependency(e,t){const r=e+":"+t;let n=this.cache.get(r);if(!n){switch(e){case"scene":n=this.loadScene(t);break;case"node":n=this._invokeOne(function(i){return i.loadNode&&i.loadNode(t)});break;case"mesh":n=this._invokeOne(function(i){return i.loadMesh&&i.loadMesh(t)});break;case"accessor":n=this.loadAccessor(t);break;case"bufferView":n=this._invokeOne(function(i){return i.loadBufferView&&i.loadBufferView(t)});break;case"buffer":n=this.loadBuffer(t);break;case"material":n=this._invokeOne(function(i){return i.loadMaterial&&i.loadMaterial(t)});break;case"texture":n=this._invokeOne(function(i){return i.loadTexture&&i.loadTexture(t)});break;case"skin":n=this.loadSkin(t);break;case"animation":n=this._invokeOne(function(i){return i.loadAnimation&&i.loadAnimation(t)});break;case"camera":n=this.loadCamera(t);break;default:if(n=this._invokeOne(function(i){return i!=this&&i.getDependency&&i.getDependency(e,t)}),!n)throw new Error("Unknown type: "+e);break}this.cache.add(r,n)}return n}getDependencies(e){let t=this.cache.get(e);if(!t){const r=this,n=this.json[e+(e==="mesh"?"es":"s")]||[];t=Promise.all(n.map(function(i,o){return r.getDependency(e,o)})),this.cache.add(e,t)}return t}loadBuffer(e){const t=this.json.buffers[e],r=this.fileLoader;if(t.type&&t.type!=="arraybuffer")throw new Error("THREE.GLTFLoader: "+t.type+" buffer type is not supported.");if(t.uri===void 0&&e===0)return Promise.resolve(this.extensions[z.KHR_BINARY_GLTF].body);const n=this.options;return new Promise(function(i,o){r.load(sr.resolveURL(t.uri,n.path),i,void 0,function(){o(new Error('THREE.GLTFLoader: Failed to load buffer "'+t.uri+'".'))})})}loadBufferView(e){const t=this.json.bufferViews[e];return this.getDependency("buffer",t.buffer).then(function(r){const n=t.byteLength||0,i=t.byteOffset||0;return r.slice(i,i+n)})}loadAccessor(e){const t=this,r=this.json,n=this.json.accessors[e];if(n.bufferView===void 0&&n.sparse===void 0){const o=En[n.type],s=zt[n.componentType],a=n.normalized===!0,l=new s(n.count*o);return Promise.resolve(new H(l,o,a))}const i=[];return n.bufferView!==void 0?i.push(this.getDependency("bufferView",n.bufferView)):i.push(null),n.sparse!==void 0&&(i.push(this.getDependency("bufferView",n.sparse.indices.bufferView)),i.push(this.getDependency("bufferView",n.sparse.values.bufferView))),Promise.all(i).then(function(o){const s=o[0],a=En[n.type],l=zt[n.componentType],c=l.BYTES_PER_ELEMENT,h=c*a,f=n.byteOffset||0,d=n.bufferView!==void 0?r.bufferViews[n.bufferView].byteStride:void 0,p=n.normalized===!0;let y,m;if(d&&d!==h){const w=Math.floor(f/d),S="InterleavedBuffer:"+n.bufferView+":"+n.componentType+":"+w+":"+n.count;let _=t.cache.get(S);_||(y=new l(s,w*d,n.count*d/c),_=new ul(y,d/c),t.cache.add(S,_)),m=new Jn(_,a,f%d/c,p)}else s===null?y=new l(n.count*a):y=new l(s,f,n.count*a),m=new H(y,a,p);if(n.sparse!==void 0){const w=En.SCALAR,S=zt[n.sparse.indices.componentType],_=n.sparse.indices.byteOffset||0,A=n.sparse.values.byteOffset||0,P=new S(o[1],_,n.sparse.count*w),L=new l(o[2],A,n.sparse.count*a);s!==null&&(m=new H(m.array.slice(),m.itemSize,m.normalized));for(let C=0,R=P.length;C<R;C++){const G=P[C];if(m.setX(G,L[C*a]),a>=2&&m.setY(G,L[C*a+1]),a>=3&&m.setZ(G,L[C*a+2]),a>=4&&m.setW(G,L[C*a+3]),a>=5)throw new Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.")}}return m})}loadTexture(e){const t=this.json,r=this.options,i=t.textures[e].source,o=t.images[i];let s=this.textureLoader;if(o.uri){const a=r.manager.getHandler(o.uri);a!==null&&(s=a)}return this.loadTextureImage(e,i,s)}loadTextureImage(e,t,r){const n=this,i=this.json,o=i.textures[e],s=i.images[t],a=(s.uri||s.bufferView)+":"+o.sampler;if(this.textureCache[a])return this.textureCache[a];const l=this.loadImageSource(t,r).then(function(c){c.flipY=!1,c.name=o.name||s.name||"",c.name===""&&typeof s.uri=="string"&&s.uri.startsWith("data:image/")===!1&&(c.name=s.uri);const f=(i.samplers||{})[o.sampler]||{};return c.magFilter=Lo[f.magFilter]||qn,c.minFilter=Lo[f.minFilter]||Yn,c.wrapS=Eo[f.wrapS]||lr,c.wrapT=Eo[f.wrapT]||lr,n.associations.set(c,{textures:e}),c}).catch(function(){return null});return this.textureCache[a]=l,l}loadImageSource(e,t){const r=this,n=this.json,i=this.options;if(this.sourceCache[e]!==void 0)return this.sourceCache[e].then(h=>h.clone());const o=n.images[e],s=self.URL||self.webkitURL;let a=o.uri||"",l=!1;if(o.bufferView!==void 0)a=r.getDependency("bufferView",o.bufferView).then(function(h){l=!0;const f=new Blob([h],{type:o.mimeType});return a=s.createObjectURL(f),a});else if(o.uri===void 0)throw new Error("THREE.GLTFLoader: Image "+e+" is missing URI and bufferView");const c=Promise.resolve(a).then(function(h){return new Promise(function(f,d){let p=f;t.isImageBitmapLoader===!0&&(p=function(y){const m=new ge(y);m.needsUpdate=!0,f(m)}),t.load(sr.resolveURL(h,i.path),p,void 0,d)})}).then(function(h){return l===!0&&s.revokeObjectURL(a),h.userData.mimeType=o.mimeType||Hc(o.uri),h}).catch(function(h){throw console.error("THREE.GLTFLoader: Couldn't load texture",a),h});return this.sourceCache[e]=c,c}assignTexture(e,t,r,n){const i=this;return this.getDependency("texture",r.index).then(function(o){if(!o)return null;if(r.texCoord!==void 0&&r.texCoord>0&&(o=o.clone(),o.channel=r.texCoord),i.extensions[z.KHR_TEXTURE_TRANSFORM]){const s=r.extensions!==void 0?r.extensions[z.KHR_TEXTURE_TRANSFORM]:void 0;if(s){const a=i.associations.get(o);o=i.extensions[z.KHR_TEXTURE_TRANSFORM].extendTexture(o,s),i.associations.set(o,a)}}return n!==void 0&&(o.colorSpace=n),e[t]=o,o})}assignFinalMaterial(e){const t=e.geometry;let r=e.material;const n=t.attributes.tangent===void 0,i=t.attributes.color!==void 0,o=t.attributes.normal===void 0;if(e.isPoints){const s="PointsMaterial:"+r.uuid;let a=this.cache.get(s);a||(a=new $o,ft.prototype.copy.call(a,r),a.color.copy(r.color),a.map=r.map,a.sizeAttenuation=!1,this.cache.add(s,a)),r=a}else if(e.isLine){const s="LineBasicMaterial:"+r.uuid;let a=this.cache.get(s);a||(a=new Zo,ft.prototype.copy.call(a,r),a.color.copy(r.color),a.map=r.map,this.cache.add(s,a)),r=a}if(n||i||o){let s="ClonedMaterial:"+r.uuid+":";n&&(s+="derivative-tangents:"),i&&(s+="vertex-colors:"),o&&(s+="flat-shading:");let a=this.cache.get(s);a||(a=r.clone(),i&&(a.vertexColors=!0),o&&(a.flatShading=!0),n&&(a.normalScale&&(a.normalScale.y*=-1),a.clearcoatNormalScale&&(a.clearcoatNormalScale.y*=-1)),this.cache.add(s,a),this.associations.set(a,this.associations.get(r))),r=a}e.material=r}getMaterialType(){return ti}loadMaterial(e){const t=this,r=this.json,n=this.extensions,i=r.materials[e];let o;const s={},a=i.extensions||{},l=[];if(a[z.KHR_MATERIALS_UNLIT]){const h=n[z.KHR_MATERIALS_UNLIT];o=h.getMaterialType(),l.push(h.extendParams(s,i,t))}else{const h=i.pbrMetallicRoughness||{};if(s.color=new Z(1,1,1),s.opacity=1,Array.isArray(h.baseColorFactor)){const f=h.baseColorFactor;s.color.setRGB(f[0],f[1],f[2],he),s.opacity=f[3]}h.baseColorTexture!==void 0&&l.push(t.assignTexture(s,"map",h.baseColorTexture,ne)),s.metalness=h.metallicFactor!==void 0?h.metallicFactor:1,s.roughness=h.roughnessFactor!==void 0?h.roughnessFactor:1,h.metallicRoughnessTexture!==void 0&&(l.push(t.assignTexture(s,"metalnessMap",h.metallicRoughnessTexture)),l.push(t.assignTexture(s,"roughnessMap",h.metallicRoughnessTexture))),o=this._invokeOne(function(f){return f.getMaterialType&&f.getMaterialType(e)}),l.push(Promise.all(this._invokeAll(function(f){return f.extendMaterialParams&&f.extendMaterialParams(e,s)})))}i.doubleSided===!0&&(s.side=la);const c=i.alphaMode||Bn.OPAQUE;if(c===Bn.BLEND?(s.transparent=!0,s.depthWrite=!1):(s.transparent=!1,c===Bn.MASK&&(s.alphaTest=i.alphaCutoff!==void 0?i.alphaCutoff:.5)),i.normalTexture!==void 0&&o!==Bt&&(l.push(t.assignTexture(s,"normalMap",i.normalTexture)),s.normalScale=new k(1,1),i.normalTexture.scale!==void 0)){const h=i.normalTexture.scale;s.normalScale.set(h,h)}if(i.occlusionTexture!==void 0&&o!==Bt&&(l.push(t.assignTexture(s,"aoMap",i.occlusionTexture)),i.occlusionTexture.strength!==void 0&&(s.aoMapIntensity=i.occlusionTexture.strength)),i.emissiveFactor!==void 0&&o!==Bt){const h=i.emissiveFactor;s.emissive=new Z().setRGB(h[0],h[1],h[2],he)}return i.emissiveTexture!==void 0&&o!==Bt&&l.push(t.assignTexture(s,"emissiveMap",i.emissiveTexture,ne)),Promise.all(l).then(function(){const h=new o(s);return i.name&&(h.name=i.name),et(h,i),t.associations.set(h,{materials:e}),i.extensions&&ct(n,h,i),h})}createUniqueName(e){const t=U.sanitizeNodeName(e||"");return t in this.nodeNamesUsed?t+"_"+ ++this.nodeNamesUsed[t]:(this.nodeNamesUsed[t]=0,t)}loadGeometries(e){const t=this,r=this.extensions,n=this.primitiveCache;function i(s){return r[z.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(s,t).then(function(a){return Bo(a,s,t)})}const o=[];for(let s=0,a=e.length;s<a;s++){const l=e[s],c=Nc(l),h=n[c];if(h)o.push(h.promise);else{let f;l.extensions&&l.extensions[z.KHR_DRACO_MESH_COMPRESSION]?f=i(l):f=Bo(new Ce,l,t),n[c]={primitive:l,promise:f},o.push(f)}}return Promise.all(o)}loadMesh(e){const t=this,r=this.json,n=this.extensions,i=r.meshes[e],o=i.primitives,s=[];for(let a=0,l=o.length;a<l;a++){const c=o[a].material===void 0?Gc(this.cache):this.getDependency("material",o[a].material);s.push(c)}return s.push(t.loadGeometries(o)),Promise.all(s).then(function(a){const l=a.slice(0,a.length-1),c=a[a.length-1],h=[];for(let d=0,p=c.length;d<p;d++){const y=c[d],m=o[d];let w;const S=l[d];if(m.mode===pe.TRIANGLES||m.mode===pe.TRIANGLE_STRIP||m.mode===pe.TRIANGLE_FAN||m.mode===void 0)w=i.isSkinnedMesh===!0?new fl(y,S):new Oe(y,S),w.isSkinnedMesh===!0&&w.normalizeSkinWeights(),m.mode===pe.TRIANGLE_STRIP?w.geometry=To(w.geometry,Oo):m.mode===pe.TRIANGLE_FAN&&(w.geometry=To(w.geometry,Fn));else if(m.mode===pe.LINES)w=new gl(y,S);else if(m.mode===pe.LINE_STRIP)w=new ei(y,S);else if(m.mode===pe.LINE_LOOP)w=new yl(y,S);else if(m.mode===pe.POINTS)w=new xl(y,S);else throw new Error("THREE.GLTFLoader: Primitive mode unsupported: "+m.mode);Object.keys(w.geometry.morphAttributes).length>0&&Uc(w,i),w.name=t.createUniqueName(i.name||"mesh_"+e),et(w,i),m.extensions&&ct(n,w,m),t.assignFinalMaterial(w),h.push(w)}for(let d=0,p=h.length;d<p;d++)t.associations.set(h[d],{meshes:e,primitives:d});if(h.length===1)return i.extensions&&ct(n,h[0],i),h[0];const f=new Xr;i.extensions&&ct(n,f,i),t.associations.set(f,{meshes:e});for(let d=0,p=h.length;d<p;d++)f.add(h[d]);return f})}loadCamera(e){let t;const r=this.json.cameras[e],n=r[r.type];if(!n){console.warn("THREE.GLTFLoader: Missing camera parameters.");return}return r.type==="perspective"?t=new Qr(Ho.radToDeg(n.yfov),n.aspectRatio||1,n.znear||1,n.zfar||2e6):r.type==="orthographic"&&(t=new Xo(-n.xmag,n.xmag,n.ymag,-n.ymag,n.znear,n.zfar)),r.name&&(t.name=this.createUniqueName(r.name)),et(t,r),Promise.resolve(t)}loadSkin(e){const t=this.json.skins[e],r=[];for(let n=0,i=t.joints.length;n<i;n++)r.push(this._loadNodeShallow(t.joints[n]));return t.inverseBindMatrices!==void 0?r.push(this.getDependency("accessor",t.inverseBindMatrices)):r.push(null),Promise.all(r).then(function(n){const i=n.pop(),o=n,s=[],a=[];for(let l=0,c=o.length;l<c;l++){const h=o[l];if(h){s.push(h);const f=new B;i!==null&&f.fromArray(i.array,l*16),a.push(f)}else console.warn('THREE.GLTFLoader: Joint "%s" could not be found.',t.joints[l])}return new Qn(s,a)})}loadAnimation(e){const t=this.json,r=this,n=t.animations[e],i=n.name?n.name:"animation_"+e,o=[],s=[],a=[],l=[],c=[];for(let h=0,f=n.channels.length;h<f;h++){const d=n.channels[h],p=n.samplers[d.sampler],y=d.target,m=y.node,w=n.parameters!==void 0?n.parameters[p.input]:p.input,S=n.parameters!==void 0?n.parameters[p.output]:p.output;y.node!==void 0&&(o.push(this.getDependency("node",m)),s.push(this.getDependency("accessor",w)),a.push(this.getDependency("accessor",S)),l.push(p),c.push(y))}return Promise.all([Promise.all(o),Promise.all(s),Promise.all(a),Promise.all(l),Promise.all(c)]).then(function(h){const f=h[0],d=h[1],p=h[2],y=h[3],m=h[4],w=[];for(let S=0,_=f.length;S<_;S++){const A=f[S],P=d[S],L=p[S],C=y[S],R=m[S];if(A===void 0)continue;A.updateMatrix&&A.updateMatrix();const G=r._createAnimationTracks(A,P,L,C,R);if(G)for(let W=0;W<G.length;W++)w.push(G[W])}return new Al(i,void 0,w)})}createNodeMesh(e){const t=this.json,r=this,n=t.nodes[e];return n.mesh===void 0?null:r.getDependency("mesh",n.mesh).then(function(i){const o=r._getNodeRef(r.meshCache,n.mesh,i);return n.weights!==void 0&&o.traverse(function(s){if(s.isMesh)for(let a=0,l=n.weights.length;a<l;a++)s.morphTargetInfluences[a]=n.weights[a]}),o})}loadNode(e){const t=this.json,r=this,n=t.nodes[e],i=r._loadNodeShallow(e),o=[],s=n.children||[];for(let l=0,c=s.length;l<c;l++)o.push(r.getDependency("node",s[l]));const a=n.skin===void 0?Promise.resolve(null):r.getDependency("skin",n.skin);return Promise.all([i,Promise.all(o),a]).then(function(l){const c=l[0],h=l[1],f=l[2];f!==null&&c.traverse(function(d){d.isSkinnedMesh&&d.bind(f,Vc)});for(let d=0,p=h.length;d<p;d++)c.add(h[d]);return c})}_loadNodeShallow(e){const t=this.json,r=this.extensions,n=this;if(this.nodeCache[e]!==void 0)return this.nodeCache[e];const i=t.nodes[e],o=i.name?n.createUniqueName(i.name):"",s=[],a=n._invokeOne(function(l){return l.createNodeMesh&&l.createNodeMesh(e)});return a&&s.push(a),i.camera!==void 0&&s.push(n.getDependency("camera",i.camera).then(function(l){return n._getNodeRef(n.cameraCache,i.camera,l)})),n._invokeAll(function(l){return l.createNodeAttachment&&l.createNodeAttachment(e)}).forEach(function(l){s.push(l)}),this.nodeCache[e]=Promise.all(s).then(function(l){let c;if(i.isBone===!0?c=new qo:l.length>1?c=new Xr:l.length===1?c=l[0]:c=new q,c!==l[0])for(let h=0,f=l.length;h<f;h++)c.add(l[h]);if(i.name&&(c.userData.name=i.name,c.name=o),et(c,i),i.extensions&&ct(r,c,i),i.matrix!==void 0){const h=new B;h.fromArray(i.matrix),c.applyMatrix4(h)}else i.translation!==void 0&&c.position.fromArray(i.translation),i.rotation!==void 0&&c.quaternion.fromArray(i.rotation),i.scale!==void 0&&c.scale.fromArray(i.scale);return n.associations.has(c)||n.associations.set(c,{}),n.associations.get(c).nodes=e,c}),this.nodeCache[e]}loadScene(e){const t=this.extensions,r=this.json.scenes[e],n=this,i=new Xr;r.name&&(i.name=n.createUniqueName(r.name)),et(i,r),r.extensions&&ct(t,i,r);const o=r.nodes||[],s=[];for(let a=0,l=o.length;a<l;a++)s.push(n.getDependency("node",o[a]));return Promise.all(s).then(function(a){for(let c=0,h=a.length;c<h;c++)i.add(a[c]);const l=c=>{const h=new Map;for(const[f,d]of n.associations)(f instanceof ft||f instanceof ge)&&h.set(f,d);return c.traverse(f=>{const d=n.associations.get(f);d!=null&&h.set(f,d)}),h};return n.associations=l(i),i})}_createAnimationTracks(e,t,r,n,i){const o=[],s=e.name?e.name:e.uuid,a=[];Qe[i.path]===Qe.weights?e.traverse(function(f){f.morphTargetInfluences&&a.push(f.name?f.name:f.uuid)}):a.push(s);let l;switch(Qe[i.path]){case Qe.weights:l=Ft;break;case Qe.rotation:l=dt;break;case Qe.position:case Qe.scale:l=Gt;break;default:switch(r.itemSize){case 1:l=Ft;break;case 2:case 3:default:l=Gt;break}break}const c=n.interpolation!==void 0?Fc[n.interpolation]:kt,h=this._getArrayFromAccessor(r);for(let f=0,d=a.length;f<d;f++){const p=new l(a[f]+"."+Qe[i.path],t.array,h,c);n.interpolation==="CUBICSPLINE"&&this._createCubicSplineTrackInterpolant(p),o.push(p)}return o}_getArrayFromAccessor(e){let t=e.array;if(e.normalized){const r=jn(t.constructor),n=new Float32Array(t.length);for(let i=0,o=t.length;i<o;i++)n[i]=t[i]*r;t=n}return t}_createCubicSplineTrackInterpolant(e){e.createInterpolant=function(r){const n=this instanceof dt?kc:ts;return new n(this.times,this.values,this.getValueSize()/3,r)},e.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline=!0}}function jc(u,e,t){const r=e.attributes,n=new Ne;if(r.POSITION!==void 0){const s=t.json.accessors[r.POSITION],a=s.min,l=s.max;if(a!==void 0&&l!==void 0){if(n.set(new b(a[0],a[1],a[2]),new b(l[0],l[1],l[2])),s.normalized){const c=jn(zt[s.componentType]);n.min.multiplyScalar(c),n.max.multiplyScalar(c)}}else{console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");return}}else return;const i=e.targets;if(i!==void 0){const s=new b,a=new b;for(let l=0,c=i.length;l<c;l++){const h=i[l];if(h.POSITION!==void 0){const f=t.json.accessors[h.POSITION],d=f.min,p=f.max;if(d!==void 0&&p!==void 0){if(a.setX(Math.max(Math.abs(d[0]),Math.abs(p[0]))),a.setY(Math.max(Math.abs(d[1]),Math.abs(p[1]))),a.setZ(Math.max(Math.abs(d[2]),Math.abs(p[2]))),f.normalized){const y=jn(zt[f.componentType]);a.multiplyScalar(y)}s.max(a)}else console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.")}}n.expandByVector(s)}u.boundingBox=n;const o=new _e;n.getCenter(o.center),o.radius=n.min.distanceTo(n.max)/2,u.boundingSphere=o}function Bo(u,e,t){const r=e.attributes,n=[];function i(o,s){return t.getDependency("accessor",o).then(function(a){u.setAttribute(s,a)})}for(const o in r){const s=Wn[o]||o.toLowerCase();s in u.attributes||n.push(i(r[o],s))}if(e.indices!==void 0&&!u.index){const o=t.getDependency("accessor",e.indices).then(function(s){u.setIndex(s)});n.push(o)}return ce.workingColorSpace!==he&&"COLOR_0"in r&&console.warn(`THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${ce.workingColorSpace}" not supported.`),et(u,e),jc(u,e,t),Promise.all(n).then(function(){return e.targets!==void 0?Oc(u,e.targets,t):u})}var ar=function(){var u=0,e=document.createElement("div");e.style.cssText="position:fixed;top:0;left:0;cursor:pointer;opacity:0.9;z-index:10000",e.addEventListener("click",function(c){c.preventDefault(),r(++u%e.children.length)},!1);function t(c){return e.appendChild(c.dom),c}function r(c){for(var h=0;h<e.children.length;h++)e.children[h].style.display=h===c?"block":"none";u=c}var n=(performance||Date).now(),i=n,o=0,s=t(new ar.Panel("FPS","#0ff","#002")),a=t(new ar.Panel("MS","#0f0","#020"));if(self.performance&&self.performance.memory)var l=t(new ar.Panel("MB","#f08","#201"));return r(0),{REVISION:16,dom:e,addPanel:t,showPanel:r,begin:function(){n=(performance||Date).now()},end:function(){o++;var c=(performance||Date).now();if(a.update(c-n,200),c>=i+1e3&&(s.update(o*1e3/(c-i),100),i=c,o=0,l)){var h=performance.memory;l.update(h.usedJSHeapSize/1048576,h.jsHeapSizeLimit/1048576)}return c},update:function(){n=this.end()},domElement:e,setMode:r}};ar.Panel=function(u,e,t){var r=1/0,n=0,i=Math.round,o=i(window.devicePixelRatio||1),s=80*o,a=48*o,l=3*o,c=2*o,h=3*o,f=15*o,d=74*o,p=30*o,y=document.createElement("canvas");y.width=s,y.height=a,y.style.cssText="width:80px;height:48px";var m=y.getContext("2d");return m.font="bold "+9*o+"px Helvetica,Arial,sans-serif",m.textBaseline="top",m.fillStyle=t,m.fillRect(0,0,s,a),m.fillStyle=e,m.fillText(u,l,c),m.fillRect(h,f,d,p),m.fillStyle=t,m.globalAlpha=.9,m.fillRect(h,f,d,p),{dom:y,update:function(w,S){r=Math.min(r,w),n=Math.max(n,w),m.fillStyle=t,m.globalAlpha=1,m.fillRect(0,0,s,f),m.fillStyle=e,m.fillText(i(w)+" "+u+" ("+i(r)+"-"+i(n)+")",l,c),m.drawImage(y,h+o,f,d-o,p,h,f,d-o,p),m.fillRect(h+d-o,f,o,p),m.fillStyle=t,m.globalAlpha=.9,m.fillRect(h+d-o,f,o,i((1-w/S)*p))}}};class Xc{planes;constructor(e=new ue,t=new ue,r=new ue,n=new ue,i=new ue,o=new ue){this.planes=[e,t,r,n,i,o]}setFromProjectionMatrix(e){const t=this.planes,r=e.elements,n=r[0],i=r[1],o=r[2],s=r[3],a=r[4],l=r[5],c=r[6],h=r[7],f=r[8],d=r[9],p=r[10],y=r[11],m=r[12],w=r[13],S=r[14],_=r[15];return t[0].setComponents(s-n,h-a,y-f,_-m).normalize(),t[1].setComponents(s+n,h+a,y+f,_+m).normalize(),t[2].setComponents(s+i,h+l,y+d,_+w).normalize(),t[3].setComponents(s-i,h-l,y-d,_-w).normalize(),t[4].setComponents(s-o,h-c,y-p,_-S).normalize(),t[5].setComponents(o,c,p,S).normalize(),this}intersectsSphere(e){const t=this.planes,r=e.center,n=-e.radius;for(let i=0;i<6;i++)if(t[i].distanceToPoint(r)<n)return!1;return!0}}class qc{camera;controls;Frustum;cameraSize=4*4*4*Float32Array.BYTES_PER_ELEMENT;cameraBuffer;device;Halton_2_3;jitter_index;jitter;ENABLE_JITTER=!1;constructor(e){this.device=e,this.camera=new Qr(60,this.device.canvas.width/this.device.canvas.height,.01,50),this.controls=new cc(this.camera,this.device.canvas),this.Frustum=new Xc,this.cameraBuffer=this.device.device.createBuffer({label:"current view matrix and projection inverse",size:this.cameraSize,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.Halton_2_3=[new Float32Array([-4,-7]),new Float32Array([-7,-5]),new Float32Array([-3,-5]),new Float32Array([-5,-4]),new Float32Array([-1,-4]),new Float32Array([-2,-2]),new Float32Array([-6,-1]),new Float32Array([-4,0]),new Float32Array([-7,1]),new Float32Array([-1,2]),new Float32Array([-6,3]),new Float32Array([-3,3]),new Float32Array([-7,6]),new Float32Array([-3,6]),new Float32Array([-5,7]),new Float32Array([-1,7]),new Float32Array([5,-7]),new Float32Array([1,-6]),new Float32Array([6,-5]),new Float32Array([4,-4]),new Float32Array([2,-3]),new Float32Array([7,-2]),new Float32Array([1,-1]),new Float32Array([4,-1]),new Float32Array([2,1]),new Float32Array([6,2]),new Float32Array([0,4]),new Float32Array([4,4]),new Float32Array([2,5]),new Float32Array([7,5]),new Float32Array([5,6]),new Float32Array([3,7])],this.Halton_2_3.forEach(t=>{t[0]/=16*e.upscaleRatio,t[1]/=16*e.upscaleRatio}),this.jitter_index=0,this.jitter=e.device.createBuffer({label:"sampler jitter by yyf",size:Float32Array.BYTES_PER_ELEMENT*2,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})}lastVp=new B;vp=new B;viewMatrix=new B;projectionMatrix=new B;uboArray=new Float32Array(16*4);update(){this.lastVp.copy(this.camera.projectionMatrix).multiply(this.camera.matrixWorldInverse),this.controls.update();let e=this.camera.clone(),t=Math.floor(this.device.canvas.width/this.device.upscaleRatio),r=Math.floor(this.device.canvas.height/this.device.upscaleRatio);if(this.ENABLE_JITTER){e.setViewOffset(t,r,this.Halton_2_3[this.jitter_index][0],this.Halton_2_3[this.jitter_index][1],t,r);var n=new Float32Array(this.Halton_2_3[this.jitter_index]);this.device.device.queue.writeBuffer(this.jitter,0,n),this.jitter_index=(this.jitter_index+1)%32}this.vp.copy(e.projectionMatrix).multiply(e.matrixWorldInverse),this.viewMatrix.copy(e.matrixWorld),this.projectionMatrix.copy(e.projectionMatrixInverse),this.Frustum.setFromProjectionMatrix(this.vp),this.uboArray.set(this.viewMatrix.elements,0),this.uboArray.set(this.projectionMatrix.elements,16),this.uboArray.set(this.vp.elements,32),this.uboArray.set(this.lastVp.elements,48),this.device.device.queue.writeBuffer(this.cameraBuffer,0,this.uboArray)}checkFrustum(e){return e?this.Frustum.intersectsSphere(e):!0}}class Yc{device;model;camera;vBuffer;motionVec;depthTexture;sampler;bindGroupLayout;bindingGroup;pipeline;renderBundle;constructor(e,t,r,n){this.device=e,this.model=t,this.camera=r,this.vBuffer=n.vBuffer,this.motionVec=n.motionVec,this.depthTexture=n.depthTexture,this.sampler=this.device.device.createSampler({addressModeU:"mirror-repeat",addressModeV:"mirror-repeat",magFilter:"linear",minFilter:"linear",mipmapFilter:"linear",maxAnisotropy:16})}buildBindGroupLayout(){this.bindGroupLayout=this.device.device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float",viewDimension:"2d-array"}},{binding:2,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"filtering"}}]})}buildBindingGroup(){this.bindingGroup=this.device.device.createBindGroup({layout:this.bindGroupLayout,entries:[{binding:0,resource:{buffer:this.camera.cameraBuffer}},{binding:1,resource:this.model.albedo.texture.createView({dimension:"2d-array",baseArrayLayer:0,arrayLayerCount:Math.max(this.model.albedo.Storages.length,1)})},{binding:2,resource:this.sampler}]})}renderPassDescriptor;buildPipeline(e="none"){const t=this.device.device.createShaderModule({label:"vBuffer",code:ee.get("vBuffer.wgsl")});this.pipeline=this.device.device.createRenderPipeline({label:"vBuffer",layout:this.device.device.createPipelineLayout({bindGroupLayouts:[this.bindGroupLayout]}),vertex:{module:t,entryPoint:"vs",buffers:[{arrayStride:3*4,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]}]},fragment:{module:t,entryPoint:"fs",targets:[{format:this.vBuffer.format},{format:this.motionVec.format}],constants:{width:Math.floor(this.device.canvas.width/this.device.upscaleRatio),height:Math.floor(this.device.canvas.height/this.device.upscaleRatio)}},primitive:{topology:"triangle-list",cullMode:e,unclippedDepth:!1},depthStencil:{format:"depth32float",depthWriteEnabled:!0,depthCompare:"less"}}),this.renderPassDescriptor={colorAttachments:[{view:this.vBuffer.createView(),loadOp:"clear",storeOp:"store"},{view:this.motionVec.createView(),loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:this.depthTexture.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}}}async init(e="none"){this.buildBindGroupLayout(),this.buildBindingGroup(),this.buildPipeline(e)}record(e){const t=e.beginRenderPass(this.renderPassDescriptor);t.setPipeline(this.pipeline),t.setBindGroup(0,this.bindingGroup),t.setVertexBuffer(0,this.model.rasterVtxBuffer);for(let r=0;r<this.model.meshes.length;r++){const n=this.model.meshes[r];this.camera.checkFrustum(n.boundingSphere)&&t.draw(n.primitiveCount*3,1,n.primitiveOffset*3)}t.end()}}class Zc{device;model;camera;lights;spatialReuseIteration=2;DI_FLAG=1;GI_FLAG=0;RIS_FLAG=1;TEMPORAL_FLAG=1;dynamicLight=!0;vBuffer;motionVec;gBufferTex;gBufferAttri;previousGBufferAttri;outputBuffer;uniformBuffer;sampler;currentReservoir;previousReservoir;bindGroupLayoutInit;bindingGroupInit;bindGroupLayoutReuse;bindingGroupReuse;bindGroupLayoutAccumulate;bindingGroupAccumulate;bindGroupLayoutAccelerationStructure;bindingGroupAccelerationStructure;bindGroupLayoutReservoir;bindingGroupReservoir;bindingGroupReservoirInverse;bindGroupLayoutLight;bindingGroupLight;pipelineInit;pipelineReuse;pipelineAccumulate;constructor(e,t,r,n){this.device=e,this.model=t,this.camera=r,this.vBuffer=n.vBuffer,this.motionVec=n.motionVec,this.gBufferTex=n.gBufferTex,this.gBufferAttri=n.gBufferAttri,this.previousGBufferAttri=n.previousGBufferAttri,this.outputBuffer=n.currentFrameBuffer,this.sampler=this.device.device.createSampler({addressModeU:"mirror-repeat",addressModeV:"mirror-repeat",magFilter:"linear",minFilter:"linear",mipmapFilter:"linear"}),this.uniformBuffer=this.device.device.createBuffer({size:4*4,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});let i=Math.floor(e.canvas.width/e.upscaleRatio),o=Math.floor(e.canvas.height/e.upscaleRatio);this.currentReservoir=e.device.createBuffer({size:16*(4*i*o),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC}),this.previousReservoir=e.device.createBuffer({size:16*(4*i*o),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST})}buildBindGroupLayout(){this.bindGroupLayoutInit=this.device.device.createBindGroupLayout({label:"rayTracingInit",entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:3,visibility:GPUShaderStage.COMPUTE,texture:{sampleType:"float",viewDimension:"2d-array"}},{binding:4,visibility:GPUShaderStage.COMPUTE,texture:{sampleType:"float",viewDimension:"2d-array"}},{binding:5,visibility:GPUShaderStage.COMPUTE,texture:{sampleType:"float",viewDimension:"2d-array"}},{binding:6,visibility:GPUShaderStage.COMPUTE,texture:{sampleType:"uint"}},{binding:7,visibility:GPUShaderStage.COMPUTE,sampler:{type:"filtering"}},{binding:8,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}},{binding:9,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:10,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:11,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:12,visibility:GPUShaderStage.COMPUTE,texture:{sampleType:"uint"}}]}),this.bindGroupLayoutAccelerationStructure=this.device.device.createBindGroupLayout({label:"rayTracingAccelerationStructure",entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage"}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage"}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage"}}]}),this.bindGroupLayoutReservoir=this.device.device.createBindGroupLayout({label:"rayTracingReservoir",entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}}]}),this.bindGroupLayoutLight=this.device.device.createBindGroupLayout({label:"rayTracingLight",entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}}]}),this.bindGroupLayoutReuse=this.device.device.createBindGroupLayout({label:"rayTracingSpatialReuse",entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:3,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}}]}),this.bindGroupLayoutAccumulate=this.device.device.createBindGroupLayout({label:"rayTracingAccumulate",entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:3,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}}]})}async buildPipeline(){let e=Math.floor(this.device.canvas.width/this.device.upscaleRatio),t=Math.floor(this.device.canvas.height/this.device.upscaleRatio);const r=this.device.device.createShaderModule({label:"rayGen.wgsl",code:ee.get("rayGen.wgsl").replace(/TREE_DEPTH/g,this.model.bvhMaxDepth.toString()).replace(/LIGHT_COUNT/g,this.lights.lightCount.toString())}),n=this.device.device.createShaderModule({label:"spatialReuse.wgsl",code:ee.get("spatialReuse.wgsl").replace(/LIGHT_COUNT/g,this.lights.lightCount.toString())}),i=this.device.device.createShaderModule({label:"accumulate.wgsl",code:ee.get("accumulate.wgsl").replace(/TREE_DEPTH/g,this.model.bvhMaxDepth.toString()).replace(/LIGHT_COUNT/g,this.lights.lightCount.toString())});this.pipelineInit=await this.device.device.createComputePipelineAsync({layout:this.device.device.createPipelineLayout({bindGroupLayouts:[this.bindGroupLayoutInit,this.bindGroupLayoutReservoir,this.bindGroupLayoutLight,this.bindGroupLayoutAccelerationStructure]}),compute:{module:r,entryPoint:"main",constants:{halfConeAngle:this.camera.camera.fov*Math.PI/180/(this.device.canvas.height/this.device.upscaleRatio*2),ENABLE_DI:this.DI_FLAG,ENABLE_GI:this.GI_FLAG,ENABLE_RIS:this.RIS_FLAG,ENABLE_TEMPORAL:this.TEMPORAL_FLAG,WIDTH:e,HEIGHT:t}}}),this.pipelineReuse=await this.device.device.createComputePipelineAsync({layout:this.device.device.createPipelineLayout({bindGroupLayouts:[this.bindGroupLayoutReuse,this.bindGroupLayoutReservoir,this.bindGroupLayoutLight]}),compute:{module:n,entryPoint:"main",constants:{ENABLE_DI:this.DI_FLAG,ENABLE_GI:this.GI_FLAG,WIDTH:e,HEIGHT:t}}}),this.pipelineAccumulate=await this.device.device.createComputePipelineAsync({layout:this.device.device.createPipelineLayout({bindGroupLayouts:[this.bindGroupLayoutAccumulate,this.bindGroupLayoutReservoir,this.bindGroupLayoutLight,this.bindGroupLayoutAccelerationStructure]}),compute:{module:i,entryPoint:"main",constants:{ENABLE_DI:this.DI_FLAG,ENABLE_GI:this.GI_FLAG,WIDTH:e,HEIGHT:t}}})}buildBindGroup(){this.bindingGroupInit=this.device.device.createBindGroup({label:"rayTracingInit",layout:this.bindGroupLayoutInit,entries:[{binding:0,resource:{buffer:this.outputBuffer}},{binding:1,resource:{buffer:this.camera.cameraBuffer}},{binding:2,resource:{buffer:this.model.geometryBuffer}},{binding:3,resource:this.model.albedo.texture.createView({dimension:"2d-array",baseArrayLayer:0,arrayLayerCount:Math.max(this.model.albedo.Storages.length,1)})},{binding:4,resource:this.model.normalMap.texture.createView({dimension:"2d-array",baseArrayLayer:0,arrayLayerCount:Math.max(this.model.normalMap.Storages.length,1)})},{binding:5,resource:this.model.specularRoughnessMap.texture.createView({dimension:"2d-array",baseArrayLayer:0,arrayLayerCount:Math.max(this.model.specularRoughnessMap.Storages.length,1)})},{binding:6,resource:this.vBuffer.createView()},{binding:7,resource:this.sampler},{binding:8,resource:{buffer:this.uniformBuffer}},{binding:9,resource:{buffer:this.gBufferTex}},{binding:10,resource:{buffer:this.gBufferAttri}},{binding:11,resource:{buffer:this.previousGBufferAttri}},{binding:12,resource:this.motionVec.createView()}]}),this.bindingGroupAccelerationStructure=this.device.device.createBindGroup({label:"rayTracingAccelerationStructure",layout:this.bindGroupLayoutAccelerationStructure,entries:[{binding:0,resource:{buffer:this.model.bvhBuffer}},{binding:1,resource:{buffer:this.model.vertexBuffer}},{binding:2,resource:{buffer:this.model.indexBuffer}}]}),this.bindingGroupReservoir=this.device.device.createBindGroup({label:"rayTracingReservoir",layout:this.bindGroupLayoutReservoir,entries:[{binding:0,resource:{buffer:this.currentReservoir}},{binding:1,resource:{buffer:this.previousReservoir}}]}),this.bindingGroupReservoirInverse=this.device.device.createBindGroup({label:"rayTracingReservoirInverse",layout:this.bindGroupLayoutReservoir,entries:[{binding:0,resource:{buffer:this.previousReservoir}},{binding:1,resource:{buffer:this.currentReservoir}}]}),this.bindingGroupLight=this.device.device.createBindGroup({label:"rayTracingLight",layout:this.bindGroupLayoutLight,entries:[{binding:0,resource:{buffer:this.lights.lightBuffer}}]}),this.bindingGroupReuse=this.device.device.createBindGroup({label:"rayTracingSpatialReuse",layout:this.bindGroupLayoutReuse,entries:[{binding:0,resource:{buffer:this.outputBuffer}},{binding:1,resource:{buffer:this.uniformBuffer}},{binding:2,resource:{buffer:this.gBufferTex}},{binding:3,resource:{buffer:this.gBufferAttri}}]}),this.bindingGroupAccumulate=this.device.device.createBindGroup({label:"rayTracingAccumulate",layout:this.bindGroupLayoutAccumulate,entries:[{binding:0,resource:{buffer:this.outputBuffer}},{binding:1,resource:{buffer:this.uniformBuffer}},{binding:2,resource:{buffer:this.gBufferTex}},{binding:3,resource:{buffer:this.gBufferAttri}}]})}async init(e){this.lights=e,this.buildBindGroupLayout(),await this.buildPipeline(),this.buildBindGroup()}uboBuffer=new ArrayBuffer(4*4);timeStamp=window.performance.now();updateUBO(){let e=new Uint32Array(this.uboBuffer),t=new Float32Array(this.uboBuffer);e[3]=Math.floor(Math.random()*4294967296),t.set(this.camera.camera.position.toArray(),0),this.device.device.queue.writeBuffer(this.uniformBuffer,0,this.uboBuffer);let r=window.performance.now()-this.timeStamp;if(this.timeStamp=window.performance.now(),this.dynamicLight){window.performance.now()/1e3;for(let n=0;n<this.lights.lightCount;n++)this.lights.lights[n].transform!=null&&(this.lights.lights[n].transform(r),this.device.device.queue.writeBuffer(this.lights.lightBuffer,4*(4+8*n),this.lights.lights[n].position))}}async record(e){let t=Math.floor(this.device.canvas.width/this.device.upscaleRatio),r=Math.floor(this.device.canvas.height/this.device.upscaleRatio);this.updateUBO();const n=e.beginComputePass();n.setPipeline(this.pipelineInit),n.setBindGroup(0,this.bindingGroupInit),n.setBindGroup(1,this.bindingGroupReservoir),n.setBindGroup(2,this.bindingGroupLight),n.setBindGroup(3,this.bindingGroupAccelerationStructure),n.dispatchWorkgroups(Math.ceil(t/8),Math.ceil(r/8),1),n.end();for(let o=0;o<this.spatialReuseIteration;o++){const s=e.beginComputePass();s.setPipeline(this.pipelineReuse),s.setBindGroup(0,this.bindingGroupReuse),s.setBindGroup(1,o%2==0?this.bindingGroupReservoirInverse:this.bindingGroupReservoir),s.setBindGroup(2,this.bindingGroupLight),s.dispatchWorkgroups(Math.ceil(t/8),Math.ceil(r/8),1),s.end()}const i=e.beginComputePass();i.setPipeline(this.pipelineAccumulate),i.setBindGroup(0,this.bindingGroupAccumulate),i.setBindGroup(1,this.spatialReuseIteration%2==0?this.bindingGroupReservoirInverse:this.bindingGroupReservoir),i.setBindGroup(2,this.bindingGroupLight),i.setBindGroup(3,this.bindingGroupAccelerationStructure),i.dispatchWorkgroups(Math.ceil(t/8),Math.ceil(r/8),1),i.end(),this.spatialReuseIteration%2==1&&e.copyBufferToBuffer(this.currentReservoir,0,this.previousReservoir,0,16*4*t*r)}}class $c{device;camera;patchSize=8;iteration=3;ENABLE_DENOISE=!0;reflectance;motionVec;depthTexture;previousDepthTexture;historyLength;prevHistoryLength;moment;prevMoment;variance;prevVariance;illumination;previousIllumination;currentIllumination;gBufferAttri;previousGBufferAttri;accumlatePipeline;accumulateBindGroupLayout;accumulateBindGroup;temporalAccumulatePipeline;temporalAccumulateBindGroupLayout;temporalAccumulateBindGroup;fireflyPipeline;fireflyBindGroupLayout;fireflyBindGroup;filterVariancePipeline;varianceBindGroupLayout;varianceBindGroup;varianceBindGroupInverse;atrousPipeline=new Array(this.iteration);atrousBindGroupLayout;atrousBindGroup;atrousBindGroupInverse;constructor(e,t,r){this.device=e,this.camera=r,this.reflectance=t.gBufferTex,this.motionVec=t.motionVec,this.depthTexture=t.depthTexture,this.previousDepthTexture=t.previousDepthTexture,this.illumination=t.currentFrameBuffer,this.gBufferAttri=t.gBufferAttri,this.previousGBufferAttri=t.previousGBufferAttri;let n=Math.floor(this.device.canvas.width/this.device.upscaleRatio),i=Math.floor(this.device.canvas.height/this.device.upscaleRatio);this.previousIllumination=this.device.device.createBuffer({size:2*4*n*i,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST,label:"previousIllumination"}),this.currentIllumination=this.device.device.createBuffer({size:2*4*n*i,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST,label:"currentIllumination"}),this.historyLength=this.device.device.createBuffer({size:1*4*n*i,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC,label:"historyLength"}),this.prevHistoryLength=this.device.device.createBuffer({size:1*4*n*i,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST,label:"prevHistoryLength"}),this.moment=this.device.device.createBuffer({size:2*4*n*i,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC,label:"moment"}),this.prevMoment=this.device.device.createBuffer({size:2*4*n*i,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST,label:"prevMoment"}),this.variance=this.device.device.createBuffer({size:1*4*n*i,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC,label:"variance"}),this.prevVariance=this.device.device.createBuffer({size:1*4*n*i,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST,label:"prevVariance"})}buildBindGroupLayout(){this.varianceBindGroupLayout=this.device.device.createBindGroupLayout({label:"varianceBindGroupLayout",entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:2,visibility:GPUShaderStage.COMPUTE,texture:{sampleType:"depth"}}]}),this.temporalAccumulateBindGroupLayout=this.device.device.createBindGroupLayout({label:"temporalAccumulateBindGroupLayout",entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.COMPUTE,texture:{sampleType:"uint"}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:3,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:4,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:5,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:6,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:7,visibility:GPUShaderStage.COMPUTE,texture:{sampleType:"depth"}},{binding:8,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:9,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:10,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:11,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:12,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}}]}),this.fireflyBindGroupLayout=this.device.device.createBindGroupLayout({label:"fireflyBindGroupLayout",entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:3,visibility:GPUShaderStage.COMPUTE,texture:{sampleType:"depth"}}]}),this.atrousBindGroupLayout=this.device.device.createBindGroupLayout({label:"atrousBindGroupLayout",entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}}]})}async buildPipeline(){let e=Math.floor(this.device.canvas.width/this.device.upscaleRatio),t=Math.floor(this.device.canvas.height/this.device.upscaleRatio),r=this.device.device.createShaderModule({code:ee.get("denoiseAccum.wgsl").replace(/BATCH_SIZE/g,this.patchSize.toString())});this.accumlatePipeline=await this.device.device.createComputePipelineAsync({label:"denoiseAccumulate",layout:"auto",compute:{module:r,entryPoint:"main",constants:{WIDTH:e,HEIGHT:t}}});let n=this.device.device.createShaderModule({code:ee.get("temperalAccum.wgsl").replace(/BATCH_SIZE/g,this.patchSize.toString())});this.temporalAccumulatePipeline=await this.device.device.createComputePipelineAsync({label:"temperalAccumulate",layout:this.device.device.createPipelineLayout({bindGroupLayouts:[this.temporalAccumulateBindGroupLayout]}),compute:{module:n,entryPoint:"main",constants:{WIDTH:e,HEIGHT:t}}});let i=this.device.device.createShaderModule({code:ee.get("firefly.wgsl").replace(/BATCH_SIZE/g,this.patchSize.toString())});this.fireflyPipeline=await this.device.device.createComputePipelineAsync({label:"firefly",layout:this.device.device.createPipelineLayout({bindGroupLayouts:[this.fireflyBindGroupLayout]}),compute:{module:i,entryPoint:"main",constants:{WIDTH:e,HEIGHT:t}}});let o=this.device.device.createShaderModule({code:ee.get("filterVariance.wgsl").replace(/BATCH_SIZE/g,this.patchSize.toString())});this.filterVariancePipeline=await this.device.device.createComputePipelineAsync({label:"filterVariance",layout:this.device.device.createPipelineLayout({bindGroupLayouts:[this.varianceBindGroupLayout]}),compute:{module:o,entryPoint:"main",constants:{WIDTH:e,HEIGHT:t}}});for(let s=0;s<this.iteration;s++){let a=this.device.device.createShaderModule({code:ee.get("atrous.wgsl").replace(/BATCH_SIZE/g,this.patchSize.toString()).replace(/STEP_SIZE/g,s.toString())});this.atrousPipeline[s]=await this.device.device.createComputePipelineAsync({label:"atrous",layout:this.device.device.createPipelineLayout({bindGroupLayouts:[this.atrousBindGroupLayout,this.varianceBindGroupLayout]}),compute:{module:a,entryPoint:"main",constants:{WIDTH:e,HEIGHT:t}}})}}buildBindGroup(){this.accumulateBindGroup=this.device.device.createBindGroup({label:"accumulateBindGroup",layout:this.accumlatePipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.currentIllumination}},{binding:1,resource:{buffer:this.illumination}},{binding:2,resource:{buffer:this.reflectance}},{binding:3,resource:{buffer:this.prevVariance}}]}),this.temporalAccumulateBindGroup=this.device.device.createBindGroup({label:"temperalAccumlateBindGroup",layout:this.temporalAccumulateBindGroupLayout,entries:[{binding:0,resource:{buffer:this.camera.cameraBuffer}},{binding:1,resource:this.motionVec.createView()},{binding:2,resource:{buffer:this.previousIllumination}},{binding:3,resource:{buffer:this.currentIllumination}},{binding:4,resource:{buffer:this.illumination}},{binding:5,resource:{buffer:this.gBufferAttri}},{binding:6,resource:{buffer:this.previousGBufferAttri}},{binding:7,resource:this.depthTexture.createView()},{binding:8,resource:{buffer:this.historyLength}},{binding:9,resource:{buffer:this.prevHistoryLength}},{binding:10,resource:{buffer:this.moment}},{binding:11,resource:{buffer:this.prevMoment}},{binding:12,resource:{buffer:this.variance}}]}),this.varianceBindGroup=this.device.device.createBindGroup({label:"varianceBindGroup",layout:this.varianceBindGroupLayout,entries:[{binding:0,resource:{buffer:this.variance}},{binding:1,resource:{buffer:this.prevVariance}},{binding:2,resource:this.depthTexture.createView()}]}),this.varianceBindGroupInverse=this.device.device.createBindGroup({label:"varianceBindGroupInverse",layout:this.varianceBindGroupLayout,entries:[{binding:0,resource:{buffer:this.prevVariance}},{binding:1,resource:{buffer:this.variance}},{binding:2,resource:this.previousDepthTexture.createView()}]}),this.fireflyBindGroup=this.device.device.createBindGroup({label:"fireflyBindGroup",layout:this.fireflyBindGroupLayout,entries:[{binding:0,resource:{buffer:this.currentIllumination}},{binding:1,resource:{buffer:this.illumination}},{binding:2,resource:{buffer:this.gBufferAttri}},{binding:3,resource:this.depthTexture.createView()}]}),this.atrousBindGroup=this.device.device.createBindGroup({label:"atrousBindGroup",layout:this.atrousBindGroupLayout,entries:[{binding:0,resource:{buffer:this.illumination}},{binding:1,resource:{buffer:this.currentIllumination}},{binding:2,resource:{buffer:this.gBufferAttri}}]}),this.atrousBindGroupInverse=this.device.device.createBindGroup({label:"atrousBindGroupInverse",layout:this.atrousBindGroupLayout,entries:[{binding:0,resource:{buffer:this.currentIllumination}},{binding:1,resource:{buffer:this.illumination}},{binding:2,resource:{buffer:this.gBufferAttri}}]})}async init(){this.buildBindGroupLayout(),await this.buildPipeline(),this.buildBindGroup()}record(e){let t=Math.floor(this.device.canvas.width/this.device.upscaleRatio),r=Math.floor(this.device.canvas.height/this.device.upscaleRatio);if(this.ENABLE_DENOISE==!0){const i=e.beginComputePass();i.setPipeline(this.temporalAccumulatePipeline),i.setBindGroup(0,this.temporalAccumulateBindGroup),i.dispatchWorkgroups(Math.ceil(t/this.patchSize),Math.ceil(r/this.patchSize),1),i.end();{const o=e.beginComputePass();o.setPipeline(this.fireflyPipeline),o.setBindGroup(0,this.fireflyBindGroup),o.dispatchWorkgroups(Math.ceil(t/this.patchSize),Math.ceil(r/this.patchSize),1),o.end()}this.iteration==0&&e.copyBufferToBuffer(this.illumination,0,this.previousIllumination,0,2*4*t*r),e.copyBufferToBuffer(this.moment,0,this.prevMoment,0,2*4*t*r),e.copyBufferToBuffer(this.historyLength,0,this.prevHistoryLength,0,1*4*t*r);for(let o=0;o<this.iteration;o++){const s=e.beginComputePass();s.setPipeline(this.filterVariancePipeline),s.setBindGroup(0,this.varianceBindGroup),s.dispatchWorkgroups(Math.ceil(t/this.patchSize),Math.ceil(r/this.patchSize),1),s.end();const a=e.beginComputePass();a.setPipeline(this.atrousPipeline[o]),o%2==0?a.setBindGroup(0,this.atrousBindGroup):a.setBindGroup(0,this.atrousBindGroupInverse),a.setBindGroup(1,this.varianceBindGroupInverse),a.dispatchWorkgroups(Math.ceil(t/this.patchSize),Math.ceil(r/this.patchSize),1),a.end(),o==0&&e.copyBufferToBuffer(this.currentIllumination,0,this.previousIllumination,0,2*4*t*r)}}(this.ENABLE_DENOISE==!1||this.iteration%2==0)&&e.copyBufferToBuffer(this.illumination,0,this.currentIllumination,0,2*4*t*r);const n=e.beginComputePass();n.setPipeline(this.accumlatePipeline),n.setBindGroup(0,this.accumulateBindGroup),n.dispatchWorkgroups(Math.ceil(t/this.patchSize),Math.ceil(r/this.patchSize),1),n.end()}}class Kc{currentFrameBuffer;previousFrameBuffer;previousDisplayBuffer;depthTexture;previousDepthTexture;vBuffer;motionVec;gBufferTex;gBufferAttri;previousGBufferAttri;constructor(e){let t=Math.floor(e.canvas.width/e.upscaleRatio),r=Math.floor(e.canvas.height/e.upscaleRatio);this.currentFrameBuffer=e.device.createBuffer({size:2*4*t*r,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),this.previousFrameBuffer=e.device.createBuffer({size:2*4*t*r,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.previousDisplayBuffer=e.device.createTexture({size:{width:e.canvas.width,height:e.canvas.height},format:e.format,dimension:"2d",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST}),this.depthTexture=e.device.createTexture({size:{width:t,height:r},format:"depth32float",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_SRC}),this.previousDepthTexture=e.device.createTexture({size:{width:t,height:r},format:"depth32float",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST}),this.vBuffer=e.device.createTexture({size:{width:t,height:r},format:"rgba32uint",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING}),this.motionVec=e.device.createTexture({size:{width:t,height:r},format:"r32uint",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING}),this.gBufferTex=e.device.createBuffer({size:2*4*t*r,usage:GPUBufferUsage.STORAGE}),this.gBufferAttri=e.device.createBuffer({size:4*4*t*r,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC}),this.previousGBufferAttri=e.device.createBuffer({size:4*4*t*r,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST})}update(e,t){let r=Math.floor(t.canvas.width/t.upscaleRatio),n=Math.floor(t.canvas.height/t.upscaleRatio);e.copyBufferToBuffer(this.gBufferAttri,0,this.previousGBufferAttri,0,4*4*r*n),e.copyBufferToBuffer(this.currentFrameBuffer,0,this.previousFrameBuffer,0,2*4*r*n),e.copyTextureToTexture({texture:this.depthTexture},{texture:this.previousDepthTexture},{width:r,height:n}),e.copyTextureToTexture({texture:t.context.getCurrentTexture()},{texture:this.previousDisplayBuffer},{width:t.canvas.width,height:t.canvas.height})}}/**
 * lil-gui
 * https://lil-gui.georgealways.com
 * @version 0.17.0
 * @author George Michael Brower
 * @license MIT
 */class Pe{constructor(e,t,r,n,i="div"){this.parent=e,this.object=t,this.property=r,this._disabled=!1,this._hidden=!1,this.initialValue=this.getValue(),this.domElement=document.createElement("div"),this.domElement.classList.add("controller"),this.domElement.classList.add(n),this.$name=document.createElement("div"),this.$name.classList.add("name"),Pe.nextNameID=Pe.nextNameID||0,this.$name.id="lil-gui-name-"+ ++Pe.nextNameID,this.$widget=document.createElement(i),this.$widget.classList.add("widget"),this.$disable=this.$widget,this.domElement.appendChild(this.$name),this.domElement.appendChild(this.$widget),this.parent.children.push(this),this.parent.controllers.push(this),this.parent.$children.appendChild(this.domElement),this._listenCallback=this._listenCallback.bind(this),this.name(r)}name(e){return this._name=e,this.$name.innerHTML=e,this}onChange(e){return this._onChange=e,this}_callOnChange(){this.parent._callOnChange(this),this._onChange!==void 0&&this._onChange.call(this,this.getValue()),this._changed=!0}onFinishChange(e){return this._onFinishChange=e,this}_callOnFinishChange(){this._changed&&(this.parent._callOnFinishChange(this),this._onFinishChange!==void 0&&this._onFinishChange.call(this,this.getValue())),this._changed=!1}reset(){return this.setValue(this.initialValue),this._callOnFinishChange(),this}enable(e=!0){return this.disable(!e)}disable(e=!0){return e===this._disabled||(this._disabled=e,this.domElement.classList.toggle("disabled",e),this.$disable.toggleAttribute("disabled",e)),this}show(e=!0){return this._hidden=!e,this.domElement.style.display=this._hidden?"none":"",this}hide(){return this.show(!1)}options(e){const t=this.parent.add(this.object,this.property,e);return t.name(this._name),this.destroy(),t}min(e){return this}max(e){return this}step(e){return this}decimals(e){return this}listen(e=!0){return this._listening=e,this._listenCallbackID!==void 0&&(cancelAnimationFrame(this._listenCallbackID),this._listenCallbackID=void 0),this._listening&&this._listenCallback(),this}_listenCallback(){this._listenCallbackID=requestAnimationFrame(this._listenCallback);const e=this.save();e!==this._listenPrevValue&&this.updateDisplay(),this._listenPrevValue=e}getValue(){return this.object[this.property]}setValue(e){return this.object[this.property]=e,this._callOnChange(),this.updateDisplay(),this}updateDisplay(){return this}load(e){return this.setValue(e),this._callOnFinishChange(),this}save(){return this.getValue()}destroy(){this.listen(!1),this.parent.children.splice(this.parent.children.indexOf(this),1),this.parent.controllers.splice(this.parent.controllers.indexOf(this),1),this.parent.$children.removeChild(this.domElement)}}class Jc extends Pe{constructor(e,t,r){super(e,t,r,"boolean","label"),this.$input=document.createElement("input"),this.$input.setAttribute("type","checkbox"),this.$input.setAttribute("aria-labelledby",this.$name.id),this.$widget.appendChild(this.$input),this.$input.addEventListener("change",()=>{this.setValue(this.$input.checked),this._callOnFinishChange()}),this.$disable=this.$input,this.updateDisplay()}updateDisplay(){return this.$input.checked=this.getValue(),this}}function Xn(u){let e,t;return(e=u.match(/(#|0x)?([a-f0-9]{6})/i))?t=e[2]:(e=u.match(/rgb\(\s*(\d*)\s*,\s*(\d*)\s*,\s*(\d*)\s*\)/))?t=parseInt(e[1]).toString(16).padStart(2,0)+parseInt(e[2]).toString(16).padStart(2,0)+parseInt(e[3]).toString(16).padStart(2,0):(e=u.match(/^#?([a-f0-9])([a-f0-9])([a-f0-9])$/i))&&(t=e[1]+e[1]+e[2]+e[2]+e[3]+e[3]),!!t&&"#"+t}const Qc={isPrimitive:!0,match:u=>typeof u=="string",fromHexString:Xn,toHexString:Xn},fr={isPrimitive:!0,match:u=>typeof u=="number",fromHexString:u=>parseInt(u.substring(1),16),toHexString:u=>"#"+u.toString(16).padStart(6,0)},eu={isPrimitive:!1,match:Array.isArray,fromHexString(u,e,t=1){const r=fr.fromHexString(u);e[0]=(r>>16&255)/255*t,e[1]=(r>>8&255)/255*t,e[2]=(255&r)/255*t},toHexString:([u,e,t],r=1)=>fr.toHexString(u*(r=255/r)<<16^e*r<<8^t*r<<0)},tu={isPrimitive:!1,match:u=>Object(u)===u,fromHexString(u,e,t=1){const r=fr.fromHexString(u);e.r=(r>>16&255)/255*t,e.g=(r>>8&255)/255*t,e.b=(255&r)/255*t},toHexString:({r:u,g:e,b:t},r=1)=>fr.toHexString(u*(r=255/r)<<16^e*r<<8^t*r<<0)},ru=[Qc,fr,eu,tu];class nu extends Pe{constructor(e,t,r,n){var i;super(e,t,r,"color"),this.$input=document.createElement("input"),this.$input.setAttribute("type","color"),this.$input.setAttribute("tabindex",-1),this.$input.setAttribute("aria-labelledby",this.$name.id),this.$text=document.createElement("input"),this.$text.setAttribute("type","text"),this.$text.setAttribute("spellcheck","false"),this.$text.setAttribute("aria-labelledby",this.$name.id),this.$display=document.createElement("div"),this.$display.classList.add("display"),this.$display.appendChild(this.$input),this.$widget.appendChild(this.$display),this.$widget.appendChild(this.$text),this._format=(i=this.initialValue,ru.find(o=>o.match(i))),this._rgbScale=n,this._initialValueHexString=this.save(),this._textFocused=!1,this.$input.addEventListener("input",()=>{this._setValueFromHexString(this.$input.value)}),this.$input.addEventListener("blur",()=>{this._callOnFinishChange()}),this.$text.addEventListener("input",()=>{const o=Xn(this.$text.value);o&&this._setValueFromHexString(o)}),this.$text.addEventListener("focus",()=>{this._textFocused=!0,this.$text.select()}),this.$text.addEventListener("blur",()=>{this._textFocused=!1,this.updateDisplay(),this._callOnFinishChange()}),this.$disable=this.$text,this.updateDisplay()}reset(){return this._setValueFromHexString(this._initialValueHexString),this}_setValueFromHexString(e){if(this._format.isPrimitive){const t=this._format.fromHexString(e);this.setValue(t)}else this._format.fromHexString(e,this.getValue(),this._rgbScale),this._callOnChange(),this.updateDisplay()}save(){return this._format.toHexString(this.getValue(),this._rgbScale)}load(e){return this._setValueFromHexString(e),this._callOnFinishChange(),this}updateDisplay(){return this.$input.value=this._format.toHexString(this.getValue(),this._rgbScale),this._textFocused||(this.$text.value=this.$input.value.substring(1)),this.$display.style.backgroundColor=this.$input.value,this}}class zn extends Pe{constructor(e,t,r){super(e,t,r,"function"),this.$button=document.createElement("button"),this.$button.appendChild(this.$name),this.$widget.appendChild(this.$button),this.$button.addEventListener("click",n=>{n.preventDefault(),this.getValue().call(this.object)}),this.$button.addEventListener("touchstart",()=>{},{passive:!0}),this.$disable=this.$button}}class iu extends Pe{constructor(e,t,r,n,i,o){super(e,t,r,"number"),this._initInput(),this.min(n),this.max(i);const s=o!==void 0;this.step(s?o:this._getImplicitStep(),s),this.updateDisplay()}decimals(e){return this._decimals=e,this.updateDisplay(),this}min(e){return this._min=e,this._onUpdateMinMax(),this}max(e){return this._max=e,this._onUpdateMinMax(),this}step(e,t=!0){return this._step=e,this._stepExplicit=t,this}updateDisplay(){const e=this.getValue();if(this._hasSlider){let t=(e-this._min)/(this._max-this._min);t=Math.max(0,Math.min(t,1)),this.$fill.style.width=100*t+"%"}return this._inputFocused||(this.$input.value=this._decimals===void 0?e:e.toFixed(this._decimals)),this}_initInput(){this.$input=document.createElement("input"),this.$input.setAttribute("type","number"),this.$input.setAttribute("step","any"),this.$input.setAttribute("aria-labelledby",this.$name.id),this.$widget.appendChild(this.$input),this.$disable=this.$input;const e=c=>{const h=parseFloat(this.$input.value);isNaN(h)||(this._snapClampSetValue(h+c),this.$input.value=this.getValue())};let t,r,n,i,o,s=!1;const a=c=>{if(s){const h=c.clientX-t,f=c.clientY-r;Math.abs(f)>5?(c.preventDefault(),this.$input.blur(),s=!1,this._setDraggingStyle(!0,"vertical")):Math.abs(h)>5&&l()}if(!s){const h=c.clientY-n;o-=h*this._step*this._arrowKeyMultiplier(c),i+o>this._max?o=this._max-i:i+o<this._min&&(o=this._min-i),this._snapClampSetValue(i+o)}n=c.clientY},l=()=>{this._setDraggingStyle(!1,"vertical"),this._callOnFinishChange(),window.removeEventListener("mousemove",a),window.removeEventListener("mouseup",l)};this.$input.addEventListener("input",()=>{let c=parseFloat(this.$input.value);isNaN(c)||(this._stepExplicit&&(c=this._snap(c)),this.setValue(this._clamp(c)))}),this.$input.addEventListener("keydown",c=>{c.code==="Enter"&&this.$input.blur(),c.code==="ArrowUp"&&(c.preventDefault(),e(this._step*this._arrowKeyMultiplier(c))),c.code==="ArrowDown"&&(c.preventDefault(),e(this._step*this._arrowKeyMultiplier(c)*-1))}),this.$input.addEventListener("wheel",c=>{this._inputFocused&&(c.preventDefault(),e(this._step*this._normalizeMouseWheel(c)))},{passive:!1}),this.$input.addEventListener("mousedown",c=>{t=c.clientX,r=n=c.clientY,s=!0,i=this.getValue(),o=0,window.addEventListener("mousemove",a),window.addEventListener("mouseup",l)}),this.$input.addEventListener("focus",()=>{this._inputFocused=!0}),this.$input.addEventListener("blur",()=>{this._inputFocused=!1,this.updateDisplay(),this._callOnFinishChange()})}_initSlider(){this._hasSlider=!0,this.$slider=document.createElement("div"),this.$slider.classList.add("slider"),this.$fill=document.createElement("div"),this.$fill.classList.add("fill"),this.$slider.appendChild(this.$fill),this.$widget.insertBefore(this.$slider,this.$input),this.domElement.classList.add("hasSlider");const e=f=>{const d=this.$slider.getBoundingClientRect();let p=(y=f,m=d.left,w=d.right,S=this._min,_=this._max,(y-m)/(w-m)*(_-S)+S);var y,m,w,S,_;this._snapClampSetValue(p)},t=f=>{e(f.clientX)},r=()=>{this._callOnFinishChange(),this._setDraggingStyle(!1),window.removeEventListener("mousemove",t),window.removeEventListener("mouseup",r)};let n,i,o=!1;const s=f=>{f.preventDefault(),this._setDraggingStyle(!0),e(f.touches[0].clientX),o=!1},a=f=>{if(o){const d=f.touches[0].clientX-n,p=f.touches[0].clientY-i;Math.abs(d)>Math.abs(p)?s(f):(window.removeEventListener("touchmove",a),window.removeEventListener("touchend",l))}else f.preventDefault(),e(f.touches[0].clientX)},l=()=>{this._callOnFinishChange(),this._setDraggingStyle(!1),window.removeEventListener("touchmove",a),window.removeEventListener("touchend",l)},c=this._callOnFinishChange.bind(this);let h;this.$slider.addEventListener("mousedown",f=>{this._setDraggingStyle(!0),e(f.clientX),window.addEventListener("mousemove",t),window.addEventListener("mouseup",r)}),this.$slider.addEventListener("touchstart",f=>{f.touches.length>1||(this._hasScrollBar?(n=f.touches[0].clientX,i=f.touches[0].clientY,o=!0):s(f),window.addEventListener("touchmove",a,{passive:!1}),window.addEventListener("touchend",l))},{passive:!1}),this.$slider.addEventListener("wheel",f=>{if(Math.abs(f.deltaX)<Math.abs(f.deltaY)&&this._hasScrollBar)return;f.preventDefault();const d=this._normalizeMouseWheel(f)*this._step;this._snapClampSetValue(this.getValue()+d),this.$input.value=this.getValue(),clearTimeout(h),h=setTimeout(c,400)},{passive:!1})}_setDraggingStyle(e,t="horizontal"){this.$slider&&this.$slider.classList.toggle("active",e),document.body.classList.toggle("lil-gui-dragging",e),document.body.classList.toggle("lil-gui-"+t,e)}_getImplicitStep(){return this._hasMin&&this._hasMax?(this._max-this._min)/1e3:.1}_onUpdateMinMax(){!this._hasSlider&&this._hasMin&&this._hasMax&&(this._stepExplicit||this.step(this._getImplicitStep(),!1),this._initSlider(),this.updateDisplay())}_normalizeMouseWheel(e){let{deltaX:t,deltaY:r}=e;return Math.floor(e.deltaY)!==e.deltaY&&e.wheelDelta&&(t=0,r=-e.wheelDelta/120,r*=this._stepExplicit?1:10),t+-r}_arrowKeyMultiplier(e){let t=this._stepExplicit?1:10;return e.shiftKey?t*=10:e.altKey&&(t/=10),t}_snap(e){const t=Math.round(e/this._step)*this._step;return parseFloat(t.toPrecision(15))}_clamp(e){return e<this._min&&(e=this._min),e>this._max&&(e=this._max),e}_snapClampSetValue(e){this.setValue(this._clamp(this._snap(e)))}get _hasScrollBar(){const e=this.parent.root.$children;return e.scrollHeight>e.clientHeight}get _hasMin(){return this._min!==void 0}get _hasMax(){return this._max!==void 0}}class ou extends Pe{constructor(e,t,r,n){super(e,t,r,"option"),this.$select=document.createElement("select"),this.$select.setAttribute("aria-labelledby",this.$name.id),this.$display=document.createElement("div"),this.$display.classList.add("display"),this._values=Array.isArray(n)?n:Object.values(n),this._names=Array.isArray(n)?n:Object.keys(n),this._names.forEach(i=>{const o=document.createElement("option");o.innerHTML=i,this.$select.appendChild(o)}),this.$select.addEventListener("change",()=>{this.setValue(this._values[this.$select.selectedIndex]),this._callOnFinishChange()}),this.$select.addEventListener("focus",()=>{this.$display.classList.add("focus")}),this.$select.addEventListener("blur",()=>{this.$display.classList.remove("focus")}),this.$widget.appendChild(this.$select),this.$widget.appendChild(this.$display),this.$disable=this.$select,this.updateDisplay()}updateDisplay(){const e=this.getValue(),t=this._values.indexOf(e);return this.$select.selectedIndex=t,this.$display.innerHTML=t===-1?e:this._names[t],this}}class su extends Pe{constructor(e,t,r){super(e,t,r,"string"),this.$input=document.createElement("input"),this.$input.setAttribute("type","text"),this.$input.setAttribute("aria-labelledby",this.$name.id),this.$input.addEventListener("input",()=>{this.setValue(this.$input.value)}),this.$input.addEventListener("keydown",n=>{n.code==="Enter"&&this.$input.blur()}),this.$input.addEventListener("blur",()=>{this._callOnFinishChange()}),this.$widget.appendChild(this.$input),this.$disable=this.$input,this.updateDisplay()}updateDisplay(){return this.$input.value=this.getValue(),this}}let Do=!1;class si{constructor({parent:e,autoPlace:t=e===void 0,container:r,width:n,title:i="Controls",injectStyles:o=!0,touchStyles:s=!0}={}){if(this.parent=e,this.root=e?e.root:this,this.children=[],this.controllers=[],this.folders=[],this._closed=!1,this._hidden=!1,this.domElement=document.createElement("div"),this.domElement.classList.add("lil-gui"),this.$title=document.createElement("div"),this.$title.classList.add("title"),this.$title.setAttribute("role","button"),this.$title.setAttribute("aria-expanded",!0),this.$title.setAttribute("tabindex",0),this.$title.addEventListener("click",()=>this.openAnimated(this._closed)),this.$title.addEventListener("keydown",a=>{a.code!=="Enter"&&a.code!=="Space"||(a.preventDefault(),this.$title.click())}),this.$title.addEventListener("touchstart",()=>{},{passive:!0}),this.$children=document.createElement("div"),this.$children.classList.add("children"),this.domElement.appendChild(this.$title),this.domElement.appendChild(this.$children),this.title(i),s&&this.domElement.classList.add("allow-touch-styles"),this.parent)return this.parent.children.push(this),this.parent.folders.push(this),void this.parent.$children.appendChild(this.domElement);this.domElement.classList.add("root"),!Do&&o&&(function(a){const l=document.createElement("style");l.innerHTML=a;const c=document.querySelector("head link[rel=stylesheet], head style");c?document.head.insertBefore(l,c):document.head.appendChild(l)}('.lil-gui{--background-color:#1f1f1f;--text-color:#ebebeb;--title-background-color:#111;--title-text-color:#ebebeb;--widget-color:#424242;--hover-color:#4f4f4f;--focus-color:#595959;--number-color:#2cc9ff;--string-color:#a2db3c;--font-size:11px;--input-font-size:11px;--font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;--font-family-mono:Menlo,Monaco,Consolas,"Droid Sans Mono",monospace;--padding:4px;--spacing:4px;--widget-height:20px;--name-width:45%;--slider-knob-width:2px;--slider-input-width:27%;--color-input-width:27%;--slider-input-min-width:45px;--color-input-min-width:45px;--folder-indent:7px;--widget-padding:0 0 0 3px;--widget-border-radius:2px;--checkbox-size:calc(var(--widget-height)*0.75);--scrollbar-width:5px;background-color:var(--background-color);color:var(--text-color);font-family:var(--font-family);font-size:var(--font-size);font-style:normal;font-weight:400;line-height:1;text-align:left;touch-action:manipulation;user-select:none;-webkit-user-select:none}.lil-gui,.lil-gui *{box-sizing:border-box;margin:0;padding:0}.lil-gui.root{display:flex;flex-direction:column;width:var(--width,245px)}.lil-gui.root>.title{background:var(--title-background-color);color:var(--title-text-color)}.lil-gui.root>.children{overflow-x:hidden;overflow-y:auto}.lil-gui.root>.children::-webkit-scrollbar{background:var(--background-color);height:var(--scrollbar-width);width:var(--scrollbar-width)}.lil-gui.root>.children::-webkit-scrollbar-thumb{background:var(--focus-color);border-radius:var(--scrollbar-width)}.lil-gui.force-touch-styles{--widget-height:28px;--padding:6px;--spacing:6px;--font-size:13px;--input-font-size:16px;--folder-indent:10px;--scrollbar-width:7px;--slider-input-min-width:50px;--color-input-min-width:65px}.lil-gui.autoPlace{max-height:100%;position:fixed;right:15px;top:0;z-index:1001}.lil-gui .controller{align-items:center;display:flex;margin:var(--spacing) 0;padding:0 var(--padding)}.lil-gui .controller.disabled{opacity:.5}.lil-gui .controller.disabled,.lil-gui .controller.disabled *{pointer-events:none!important}.lil-gui .controller>.name{flex-shrink:0;line-height:var(--widget-height);min-width:var(--name-width);padding-right:var(--spacing);white-space:pre}.lil-gui .controller .widget{align-items:center;display:flex;min-height:var(--widget-height);position:relative;width:100%}.lil-gui .controller.string input{color:var(--string-color)}.lil-gui .controller.boolean .widget{cursor:pointer}.lil-gui .controller.color .display{border-radius:var(--widget-border-radius);height:var(--widget-height);position:relative;width:100%}.lil-gui .controller.color input[type=color]{cursor:pointer;height:100%;opacity:0;width:100%}.lil-gui .controller.color input[type=text]{flex-shrink:0;font-family:var(--font-family-mono);margin-left:var(--spacing);min-width:var(--color-input-min-width);width:var(--color-input-width)}.lil-gui .controller.option select{max-width:100%;opacity:0;position:absolute;width:100%}.lil-gui .controller.option .display{background:var(--widget-color);border-radius:var(--widget-border-radius);height:var(--widget-height);line-height:var(--widget-height);max-width:100%;overflow:hidden;padding-left:.55em;padding-right:1.75em;pointer-events:none;position:relative;word-break:break-all}.lil-gui .controller.option .display.active{background:var(--focus-color)}.lil-gui .controller.option .display:after{bottom:0;content:"↕";font-family:lil-gui;padding-right:.375em;position:absolute;right:0;top:0}.lil-gui .controller.option .widget,.lil-gui .controller.option select{cursor:pointer}.lil-gui .controller.number input{color:var(--number-color)}.lil-gui .controller.number.hasSlider input{flex-shrink:0;margin-left:var(--spacing);min-width:var(--slider-input-min-width);width:var(--slider-input-width)}.lil-gui .controller.number .slider{background-color:var(--widget-color);border-radius:var(--widget-border-radius);cursor:ew-resize;height:var(--widget-height);overflow:hidden;padding-right:var(--slider-knob-width);touch-action:pan-y;width:100%}.lil-gui .controller.number .slider.active{background-color:var(--focus-color)}.lil-gui .controller.number .slider.active .fill{opacity:.95}.lil-gui .controller.number .fill{border-right:var(--slider-knob-width) solid var(--number-color);box-sizing:content-box;height:100%}.lil-gui-dragging .lil-gui{--hover-color:var(--widget-color)}.lil-gui-dragging *{cursor:ew-resize!important}.lil-gui-dragging.lil-gui-vertical *{cursor:ns-resize!important}.lil-gui .title{--title-height:calc(var(--widget-height) + var(--spacing)*1.25);-webkit-tap-highlight-color:transparent;text-decoration-skip:objects;cursor:pointer;font-weight:600;height:var(--title-height);line-height:calc(var(--title-height) - 4px);outline:none;padding:0 var(--padding)}.lil-gui .title:before{content:"▾";display:inline-block;font-family:lil-gui;padding-right:2px}.lil-gui .title:active{background:var(--title-background-color);opacity:.75}.lil-gui.root>.title:focus{text-decoration:none!important}.lil-gui.closed>.title:before{content:"▸"}.lil-gui.closed>.children{opacity:0;transform:translateY(-7px)}.lil-gui.closed:not(.transition)>.children{display:none}.lil-gui.transition>.children{overflow:hidden;pointer-events:none;transition-duration:.3s;transition-property:height,opacity,transform;transition-timing-function:cubic-bezier(.2,.6,.35,1)}.lil-gui .children:empty:before{content:"Empty";display:block;font-style:italic;height:var(--widget-height);line-height:var(--widget-height);margin:var(--spacing) 0;opacity:.5;padding:0 var(--padding)}.lil-gui.root>.children>.lil-gui>.title{border-width:0;border-bottom:1px solid var(--widget-color);border-left:0 solid var(--widget-color);border-right:0 solid var(--widget-color);border-top:1px solid var(--widget-color);transition:border-color .3s}.lil-gui.root>.children>.lil-gui.closed>.title{border-bottom-color:transparent}.lil-gui+.controller{border-top:1px solid var(--widget-color);margin-top:0;padding-top:var(--spacing)}.lil-gui .lil-gui .lil-gui>.title{border:none}.lil-gui .lil-gui .lil-gui>.children{border:none;border-left:2px solid var(--widget-color);margin-left:var(--folder-indent)}.lil-gui .lil-gui .controller{border:none}.lil-gui input{-webkit-tap-highlight-color:transparent;background:var(--widget-color);border:0;border-radius:var(--widget-border-radius);color:var(--text-color);font-family:var(--font-family);font-size:var(--input-font-size);height:var(--widget-height);outline:none;width:100%}.lil-gui input:disabled{opacity:1}.lil-gui input[type=number],.lil-gui input[type=text]{padding:var(--widget-padding)}.lil-gui input[type=number]:focus,.lil-gui input[type=text]:focus{background:var(--focus-color)}.lil-gui input::-webkit-inner-spin-button,.lil-gui input::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}.lil-gui input[type=number]{-moz-appearance:textfield}.lil-gui input[type=checkbox]{appearance:none;-webkit-appearance:none;border-radius:var(--widget-border-radius);cursor:pointer;height:var(--checkbox-size);text-align:center;width:var(--checkbox-size)}.lil-gui input[type=checkbox]:checked:before{content:"✓";font-family:lil-gui;font-size:var(--checkbox-size);line-height:var(--checkbox-size)}.lil-gui button{-webkit-tap-highlight-color:transparent;background:var(--widget-color);border:1px solid var(--widget-color);border-radius:var(--widget-border-radius);color:var(--text-color);cursor:pointer;font-family:var(--font-family);font-size:var(--font-size);height:var(--widget-height);line-height:calc(var(--widget-height) - 4px);outline:none;text-align:center;text-transform:none;width:100%}.lil-gui button:active{background:var(--focus-color)}@font-face{font-family:lil-gui;src:url("data:application/font-woff;charset=utf-8;base64,d09GRgABAAAAAAUsAAsAAAAACJwAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAABHU1VCAAABCAAAAH4AAADAImwmYE9TLzIAAAGIAAAAPwAAAGBKqH5SY21hcAAAAcgAAAD0AAACrukyyJBnbHlmAAACvAAAAF8AAACEIZpWH2hlYWQAAAMcAAAAJwAAADZfcj2zaGhlYQAAA0QAAAAYAAAAJAC5AHhobXR4AAADXAAAABAAAABMAZAAAGxvY2EAAANsAAAAFAAAACgCEgIybWF4cAAAA4AAAAAeAAAAIAEfABJuYW1lAAADoAAAASIAAAIK9SUU/XBvc3QAAATEAAAAZgAAAJCTcMc2eJxVjbEOgjAURU+hFRBK1dGRL+ALnAiToyMLEzFpnPz/eAshwSa97517c/MwwJmeB9kwPl+0cf5+uGPZXsqPu4nvZabcSZldZ6kfyWnomFY/eScKqZNWupKJO6kXN3K9uCVoL7iInPr1X5baXs3tjuMqCtzEuagm/AAlzQgPAAB4nGNgYRBlnMDAysDAYM/gBiT5oLQBAwuDJAMDEwMrMwNWEJDmmsJwgCFeXZghBcjlZMgFCzOiKOIFAB71Bb8AeJy1kjFuwkAQRZ+DwRAwBtNQRUGKQ8OdKCAWUhAgKLhIuAsVSpWz5Bbkj3dEgYiUIszqWdpZe+Z7/wB1oCYmIoboiwiLT2WjKl/jscrHfGg/pKdMkyklC5Zs2LEfHYpjcRoPzme9MWWmk3dWbK9ObkWkikOetJ554fWyoEsmdSlt+uR0pCJR34b6t/TVg1SY3sYvdf8vuiKrpyaDXDISiegp17p7579Gp3p++y7HPAiY9pmTibljrr85qSidtlg4+l25GLCaS8e6rRxNBmsnERunKbaOObRz7N72ju5vdAjYpBXHgJylOAVsMseDAPEP8LYoUHicY2BiAAEfhiAGJgZWBgZ7RnFRdnVJELCQlBSRlATJMoLV2DK4glSYs6ubq5vbKrJLSbGrgEmovDuDJVhe3VzcXFwNLCOILB/C4IuQ1xTn5FPilBTj5FPmBAB4WwoqAHicY2BkYGAA4sk1sR/j+W2+MnAzpDBgAyEMQUCSg4EJxAEAwUgFHgB4nGNgZGBgSGFggJMhDIwMqEAYAByHATJ4nGNgAIIUNEwmAABl3AGReJxjYAACIQYlBiMGJ3wQAEcQBEV4nGNgZGBgEGZgY2BiAAEQyQWEDAz/wXwGAAsPATIAAHicXdBNSsNAHAXwl35iA0UQXYnMShfS9GPZA7T7LgIu03SSpkwzYTIt1BN4Ak/gKTyAeCxfw39jZkjymzcvAwmAW/wgwHUEGDb36+jQQ3GXGot79L24jxCP4gHzF/EIr4jEIe7wxhOC3g2TMYy4Q7+Lu/SHuEd/ivt4wJd4wPxbPEKMX3GI5+DJFGaSn4qNzk8mcbKSR6xdXdhSzaOZJGtdapd4vVPbi6rP+cL7TGXOHtXKll4bY1Xl7EGnPtp7Xy2n00zyKLVHfkHBa4IcJ2oD3cgggWvt/V/FbDrUlEUJhTn/0azVWbNTNr0Ens8de1tceK9xZmfB1CPjOmPH4kitmvOubcNpmVTN3oFJyjzCvnmrwhJTzqzVj9jiSX911FjeAAB4nG3HMRKCMBBA0f0giiKi4DU8k0V2GWbIZDOh4PoWWvq6J5V8If9NVNQcaDhyouXMhY4rPTcG7jwYmXhKq8Wz+p762aNaeYXom2n3m2dLTVgsrCgFJ7OTmIkYbwIbC6vIB7WmFfAAAA==") format("woff")}@media (pointer:coarse){.lil-gui.allow-touch-styles{--widget-height:28px;--padding:6px;--spacing:6px;--font-size:13px;--input-font-size:16px;--folder-indent:10px;--scrollbar-width:7px;--slider-input-min-width:50px;--color-input-min-width:65px}}@media (hover:hover){.lil-gui .controller.color .display:hover:before{border:1px solid #fff9;border-radius:var(--widget-border-radius);bottom:0;content:" ";display:block;left:0;position:absolute;right:0;top:0}.lil-gui .controller.option .display.focus{background:var(--focus-color)}.lil-gui .controller.option .widget:hover .display{background:var(--hover-color)}.lil-gui .controller.number .slider:hover{background-color:var(--hover-color)}body:not(.lil-gui-dragging) .lil-gui .title:hover{background:var(--title-background-color);opacity:.85}.lil-gui .title:focus{text-decoration:underline var(--focus-color)}.lil-gui input:hover{background:var(--hover-color)}.lil-gui input:active{background:var(--focus-color)}.lil-gui input[type=checkbox]:focus{box-shadow:inset 0 0 0 1px var(--focus-color)}.lil-gui button:hover{background:var(--hover-color);border-color:var(--hover-color)}.lil-gui button:focus{border-color:var(--focus-color)}}'),Do=!0),r?r.appendChild(this.domElement):t&&(this.domElement.classList.add("autoPlace"),document.body.appendChild(this.domElement)),n&&this.domElement.style.setProperty("--width",n+"px"),this.domElement.addEventListener("keydown",a=>a.stopPropagation()),this.domElement.addEventListener("keyup",a=>a.stopPropagation())}add(e,t,r,n,i){if(Object(r)===r)return new ou(this,e,t,r);const o=e[t];switch(typeof o){case"number":return new iu(this,e,t,r,n,i);case"boolean":return new Jc(this,e,t);case"string":return new su(this,e,t);case"function":return new zn(this,e,t)}console.error(`gui.add failed
	property:`,t,`
	object:`,e,`
	value:`,o)}addColor(e,t,r=1){return new nu(this,e,t,r)}addFolder(e){return new si({parent:this,title:e})}load(e,t=!0){return e.controllers&&this.controllers.forEach(r=>{r instanceof zn||r._name in e.controllers&&r.load(e.controllers[r._name])}),t&&e.folders&&this.folders.forEach(r=>{r._title in e.folders&&r.load(e.folders[r._title])}),this}save(e=!0){const t={controllers:{},folders:{}};return this.controllers.forEach(r=>{if(!(r instanceof zn)){if(r._name in t.controllers)throw new Error(`Cannot save GUI with duplicate property "${r._name}"`);t.controllers[r._name]=r.save()}}),e&&this.folders.forEach(r=>{if(r._title in t.folders)throw new Error(`Cannot save GUI with duplicate folder "${r._title}"`);t.folders[r._title]=r.save()}),t}open(e=!0){return this._closed=!e,this.$title.setAttribute("aria-expanded",!this._closed),this.domElement.classList.toggle("closed",this._closed),this}close(){return this.open(!1)}show(e=!0){return this._hidden=!e,this.domElement.style.display=this._hidden?"none":"",this}hide(){return this.show(!1)}openAnimated(e=!0){return this._closed=!e,this.$title.setAttribute("aria-expanded",!this._closed),requestAnimationFrame(()=>{const t=this.$children.clientHeight;this.$children.style.height=t+"px",this.domElement.classList.add("transition");const r=i=>{i.target===this.$children&&(this.$children.style.height="",this.domElement.classList.remove("transition"),this.$children.removeEventListener("transitionend",r))};this.$children.addEventListener("transitionend",r);const n=e?this.$children.scrollHeight:0;this.domElement.classList.toggle("closed",!e),requestAnimationFrame(()=>{this.$children.style.height=n+"px"})}),this}title(e){return this._title=e,this.$title.innerHTML=e,this}reset(e=!0){return(e?this.controllersRecursive():this.controllers).forEach(t=>t.reset()),this}onChange(e){return this._onChange=e,this}_callOnChange(e){this.parent&&this.parent._callOnChange(e),this._onChange!==void 0&&this._onChange.call(this,{object:e.object,property:e.property,value:e.getValue(),controller:e})}onFinishChange(e){return this._onFinishChange=e,this}_callOnFinishChange(e){this.parent&&this.parent._callOnFinishChange(e),this._onFinishChange!==void 0&&this._onFinishChange.call(this,{object:e.object,property:e.property,value:e.getValue(),controller:e})}destroy(){this.parent&&(this.parent.children.splice(this.parent.children.indexOf(this),1),this.parent.folders.splice(this.parent.folders.indexOf(this),1)),this.domElement.parentElement&&this.domElement.parentElement.removeChild(this.domElement),Array.from(this.children).forEach(e=>e.destroy())}controllersRecursive(){let e=Array.from(this.controllers);return this.folders.forEach(t=>{e=e.concat(t.controllersRecursive())}),e}foldersRecursive(){let e=Array.from(this.folders);return this.folders.forEach(t=>{e=e.concat(t.foldersRecursive())}),e}}let rs=new ar;document.body.appendChild(rs.dom);let Vt=await new Cs().init(),E={flag:!1,scene:0,upscaleRatio:Vt.upscaleRatio,superResolution:!1,dynamicLight:!1,GI_RIS:!0,DI:!0,GI:!1,spatial:!1,temporal:!1,denoiser:!1},le=new si({title:"Settings"});le.add(E,"scene",{Box:0,Room:1,"Sea House":2,Sponza:3}).name("Scene").onChange(()=>{E.flag=!0}),le.children[0].disable(),le.add(E,"upscaleRatio",[1,1.5,2,3,4]).name("Upscale Ratio").onFinishChange(()=>{E.flag=!0}),le.add(E,"superResolution").name("Super Resolution").onChange(()=>{E.flag=!0}),le.add(E,"dynamicLight").name("Dynamic Light").onChange(()=>{E.flag=!0}),le.add(E,"DI").name("DI").onChange(()=>{E.flag=!0}),le.add(E,"GI").name("GI").onChange(()=>{E.flag=!0}),le.add(E,"GI_RIS").name("RIS initialize GI samples").onChange(()=>{E.flag=!0}),le.add(E,"spatial").name("Spatial reuse").onChange(()=>{E.flag=!0}),le.add(E,"temporal").name("Temporal reuse").onChange(()=>{E.flag=!0}),le.add(E,"denoiser").name("Denoiser").onChange(()=>{E.flag=!0}),le.add({title:()=>{alert(`Please try this demo after upgrading your Chrome or Edge browser to the latest version.
For windows users with multiple graphic cards, please make sure you are using the high-performance graphic card. 

You can set it in settings -> system -> display -> graphic settings ->  select the browser you are using -> options -> high-performance`)}},"title").name("Read Me ^.^");let rr=Array();{rr=[new T(new Float32Array([-4,8,0]),new Float32Array([1,.5,.6]),40),new T(new Float32Array([4,8,0]),new Float32Array([.5,1,1]),40),new T(new Float32Array([0,8,0]),new Float32Array([1,1,1]),60),new T(new Float32Array([0,3,0]),new Float32Array([1,1,1]),40),new T(new Float32Array([8,6,3]),new Float32Array([1,1,.7]),40),new T(new Float32Array([8,6,-3]),new Float32Array([.2,.5,1]),30),new T(new Float32Array([-10,6,-4]),new Float32Array([.8,.8,1]),40),new T(new Float32Array([-10,6,4]),new Float32Array([.5,1,.2]),35),new T(new Float32Array([-9.5,1.5,-3.5]),new Float32Array([1,.5,.2]),20),new T(new Float32Array([-9.5,1.5,3]),new Float32Array([1,.5,.2]),15),new T(new Float32Array([9,1.5,-3.5]),new Float32Array([1,.5,.2]),15),new T(new Float32Array([9,1.5,3]),new Float32Array([1,.5,.2]),20),new T(new Float32Array([-18,-4,-12]),new Float32Array([1,1,1]),80),new T(new Float32Array([-18,-4,12]),new Float32Array([1,1,1]),80),new T(new Float32Array([18,-4,-12]),new Float32Array([1,1,1]),80),new T(new Float32Array([18,-4,12]),new Float32Array([1,1,1]),80),new T(new Float32Array([-18,15,-12]),new Float32Array([1,1,1]),80),new T(new Float32Array([-18,15,12]),new Float32Array([1,1,1]),80),new T(new Float32Array([18,15,-12]),new Float32Array([1,1,1]),80),new T(new Float32Array([18,15,12]),new Float32Array([1,1,1]),80)];for(let u=0;u<4;u++){let e=2*Math.PI*Math.random(),t=Math.acos(2*Math.random()-1),r=[Math.sin(t)*Math.cos(e),Math.sin(t)*Math.sin(e),Math.cos(t)],n=Math.random()*2+1;for(let i=0;i<3;i++)r[i]*=n;rr[u].velocity=r,rr[u].transform=function(i){const o=[-5,1,-.5];let s=[5,8,.5];u==3?s[1]=4:o[1]=4;for(let a=0;a<3;a++)this.position[a]<o[a]&&(this.velocity[a]=Math.abs(this.velocity[a])),this.position[a]>s[a]&&(this.velocity[a]=-Math.abs(this.velocity[a])),this.position[a]+=this.velocity[a]*i/1e3*.5}.bind(rr[u])}}let nr=Array();{nr=[new T(new Float32Array([2,5.5,0]),new Float32Array([.8,.6,0]),10),new T(new Float32Array([-2,5.5,0]),new Float32Array([.9,.3,1]),25)];for(let u=0;u<2;u++){let e=[1,1,1],t=1;for(let r=0;r<3;r++)e[r]*=t;nr[u].velocity=e,nr[u].transform=function(r){let n=Math.atan2(this.position[2],this.position[0]),i=Math.sqrt(this.position[0]*this.position[0]+this.position[2]*this.position[2]);n+=this.velocity[0]*r/1e3,this.position[0]=Math.cos(n)*i,this.position[2]=Math.sin(n)*i}.bind(nr[u])}}let ut=Array();{ut=[new T(new Float32Array([0,0,0]),new Float32Array([1,1,1]),20),new T(new Float32Array([1,1,.5]),new Float32Array([.2,.5,1]),20),new T(new Float32Array([5,.5,-1.2]),new Float32Array([1,.3,.3]),20),new T(new Float32Array([-3,.4,1]),new Float32Array([1,1,1]),10),new T(new Float32Array([-6,-4,-6]),new Float32Array([1,1,1]),40),new T(new Float32Array([-6,-4,6]),new Float32Array([1,1,1]),40),new T(new Float32Array([6,-4,-6]),new Float32Array([1,1,1]),40),new T(new Float32Array([6,-4,6]),new Float32Array([1,1,1]),40),new T(new Float32Array([-6,4,-6]),new Float32Array([1,1,1]),40),new T(new Float32Array([-6,4,6]),new Float32Array([1,1,1]),40),new T(new Float32Array([6,4,-6]),new Float32Array([1,1,1]),40),new T(new Float32Array([6,4,6]),new Float32Array([1,1,1]),40),new T(new Float32Array([-6,-4,-6]),new Float32Array([1,1,1]),40),new T(new Float32Array([-6,-4,6]),new Float32Array([1,1,1]),40),new T(new Float32Array([6,-4,-6]),new Float32Array([1,1,1]),40),new T(new Float32Array([6,-4,6]),new Float32Array([1,1,1]),40),new T(new Float32Array([-6,4,-6]),new Float32Array([1,1,1]),40),new T(new Float32Array([-6,4,6]),new Float32Array([1,1,1]),40),new T(new Float32Array([6,4,-6]),new Float32Array([1,1,1]),40),new T(new Float32Array([6,4,6]),new Float32Array([1,1,1]),40)];let u=new B().makeRotationY(Math.PI/4);for(let e=4;e<12;e++)ut[e].position=new Float32Array(new b(...ut[e].position).applyMatrix4(u).toArray());for(let e=0;e<1;e++){let t=[-1,0,0],r=1;for(let n=0;n<3;n++)t[n]*=r;ut[e].velocity=t,ut[e].transform=function(n){const i=[-2,-.5,-.5];let o=[3,.5,.5];for(let s=0;s<3;s++)this.position[s]<i[s]&&(this.velocity[s]=Math.abs(this.velocity[s])),this.position[s]>o[s]&&(this.velocity[s]=-Math.abs(this.velocity[s])),this.position[s]+=this.velocity[s]*n/1e3*.5}.bind(ut[e])}}let qr=Array();{qr=[new T(new Float32Array([0,6,0]),new Float32Array([1,1,1]),30),new T(new Float32Array([.6,.9+.5,1.3+.5]),new Float32Array([1,.2,.2]),1),new T(new Float32Array([3,.5,3]),new Float32Array([1,.9,.8]),5),new T(new Float32Array([-3,.5,3]),new Float32Array([0,1,0]),6),new T(new Float32Array([-3,.5,-3]),new Float32Array([1,.9,.8]),5),new T(new Float32Array([3,.5,-3]),new Float32Array([0,0,1]),10),new T(new Float32Array([-18,-4,-12]),new Float32Array([1,1,1]),20),new T(new Float32Array([-18,-4,12]),new Float32Array([1,1,1]),20),new T(new Float32Array([18,-4,-12]),new Float32Array([1,1,1]),20),new T(new Float32Array([18,-4,12]),new Float32Array([1,1,1]),20),new T(new Float32Array([-18,15,-12]),new Float32Array([1,1,1]),20),new T(new Float32Array([-18,15,12]),new Float32Array([1,1,1]),20),new T(new Float32Array([18,15,-12]),new Float32Array([1,1,1]),20),new T(new Float32Array([18,15,12]),new Float32Array([1,1,1]),20)];for(let u=2;u<6;u++)qr[u].transform=function(e){let t=Math.atan2(this.position[2],this.position[0]),r=Math.sqrt(this.position[0]*this.position[0]+this.position[2]*this.position[2]);t+=e/1e3,this.position[0]=Math.cos(t)*r,this.position[2]=Math.sin(t)*r}.bind(qr[u])}let gr=new fc().setDRACOLoader(new uc().setDecoderPath("./three/draco/"));$r("model downloading...");let Ot=await gr.loadAsync("./assets/stanford_bunny/bunny.gltf");Ot=Ot.scene;Ot.children[0].geometry.rotateX(-Math.PI/2);Ot.children[0].geometry.scale(5,5,5);let Et=await gr.loadAsync("./assets/box/scene.gltf");{Et=Et.scene;for(let e=0;e<Et.children.length;e++){let t=Et.children[e];t.geometry.applyQuaternion(t.quaternion),t.geometry.translate(t.position.x,t.position.y,t.position.z);for(let r=0;r<t.geometry.attributes.tangent.array.length;r+=1)t.geometry.attributes.tangent.array[r]=0;t.geometry.scale(3,3,3)}let u=Ot.children[0].clone();u.geometry.scale(4,4,4),u.geometry.translate(.5,-.3,0),Et.add(u)}let ns=new en;await ns.init(Et,Vt);let zo=0,ai=u=>{zo<2?(zo++,u+=" Wait for downloading other models..."):(u+=" Enjoy!",le.children[0].enable()),$r(u)},is=new en;gr.load("./assets/room/scene.gltf",u=>{let e=u.scene;e.scale.set(5,5,5),is.init(e,Vt).then(()=>{ai("room building finished!")})});let os=new en;gr.load("./assets/sea/scene.gltf",u=>{let e=u.scene;for(let t=0;t<e.children.length;t++){let r=e.children[t];r.geometry.rotateX(-Math.PI/2),r.geometry.scale(.02,.02,.02)}os.init(e,Vt).then(()=>{ai("sea building finished!")})});let ss=new en;gr.load("./assets/sponza/sponza.gltf",u=>{let e=u.scene,t=Ot.children[0].clone();t.geometry.translate(0,0,-.5),t.geometry.scale(.5,.5,.5),e.add(t),ss.init(e,Vt).then(()=>{ai("sponza building finished!")})});class au{device;buffers;model;lights;camera;vBuffer;rayTracing;denoiser;display;selectModel;async init(){this.device=Vt,await this.reset()}buildCmdBuffer(){this.camera.update();const e=this.device.device.createCommandEncoder();this.vBuffer.record(e),this.rayTracing.record(e),this.denoiser.record(e),this.display.record(e),this.buffers.update(e,this.device);let t=e.finish();this.device.device.queue.submit([t])}run(){const e=async()=>{if(E.flag){if(this.rayTracing.dynamicLight=E.dynamicLight,this.denoiser.ENABLE_DENOISE=E.denoiser,this.display.ENABLE_SR=E.superResolution,this.rayTracing.spatialReuseIteration=E.spatial?2:0,this.rayTracing.DI_FLAG!=(E.DI?1:0)&&(this.rayTracing.DI_FLAG=E.DI?1:0,await this.rayTracing.init(this.lights)),this.rayTracing.GI_FLAG!=(E.GI?1:0)&&(this.rayTracing.GI_FLAG=E.GI?1:0,await this.rayTracing.init(this.lights)),this.rayTracing.RIS_FLAG!=(E.GI_RIS?1:0)&&(this.rayTracing.RIS_FLAG=E.GI_RIS?1:0,await this.rayTracing.init(this.lights)),this.rayTracing.TEMPORAL_FLAG!=(E.temporal?1:0)&&(this.rayTracing.TEMPORAL_FLAG=E.temporal?1:0,await this.rayTracing.init(this.lights)),E.upscaleRatio!=this.device.upscaleRatio){const t=Math.floor(this.device.canvas.width/E.upscaleRatio);Math.floor(this.device.canvas.height/E.upscaleRatio),16*(4*t*t)>=this.device.adapter.limits.maxStorageBufferBindingSize?alert("exceed maxStorageBufferBindingSize, please increase upscaleRatio"):(this.device.upscaleRatio=E.upscaleRatio,await this.reset(!0))}E.scene!=this.selectModel&&(this.selectModel=E.scene,await this.reset()),E.flag=!1}this.buildCmdBuffer(),rs.update(),requestAnimationFrame(e)};requestAnimationFrame(e)}cullMode="none";async reset(e=!1){let t,r;switch(e&&(t=this.camera.camera.position.clone(),r=this.camera.controls.target.clone()),this.camera=new qc(this.device),e&&(this.camera.camera.position.copy(t),this.camera.controls.target.copy(r)),E.scene){case 3:{e||(this.camera.camera.position.set(-4.5,5.5,-4),this.camera.controls.target.set(0,5,0)),this.model=ss,this.lights=new Wr(rr,this.device),this.cullMode="none";break}case 0:{e||(this.camera.camera.position.set(-8,3,0),this.camera.controls.target.set(0,3,0)),this.model=ns,this.lights=new Wr(nr,this.device),this.cullMode="back";break}case 1:{e||(this.camera.camera.position.set(3,-.5,0),this.camera.controls.target.set(0,-.5,0)),this.model=is,this.lights=new Wr(ut,this.device),this.cullMode="none";break}case 2:{e||(this.camera.camera.position.set(-1,1,-3),this.camera.controls.target.set(0,1,0)),this.model=os,this.lights=new Wr(qr,this.device),this.cullMode="back";break}}this.camera.controls.update(),this.buffers=new Kc(this.device),this.vBuffer=new Yc(this.device,this.model,this.camera,this.buffers),await this.vBuffer.init(this.cullMode),this.rayTracing=new Zc(this.device,this.model,this.camera,this.buffers),this.rayTracing.DI_FLAG=E.DI?1:0,this.rayTracing.GI_FLAG=E.GI?1:0,this.rayTracing.RIS_FLAG=E.GI_RIS?1:0,this.rayTracing.TEMPORAL_FLAG=E.temporal?1:0,this.rayTracing.spatialReuseIteration=E.spatial?2:0,this.rayTracing.dynamicLight=E.dynamicLight,await this.rayTracing.init(this.lights),this.denoiser=new $c(this.device,this.buffers,this.camera),this.denoiser.ENABLE_DENOISE=E.denoiser,await this.denoiser.init(),this.display=new sa(this.device,this.buffers,this.camera),this.display.ENABLE_SR=E.superResolution}}const as=new au;await as.init();as.run();
