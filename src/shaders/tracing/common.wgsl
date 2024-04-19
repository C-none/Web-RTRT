const PI:f32=3.14159265359;
const INVPI:f32=0.31830988618;
var<private> seed:u32=0;

fn tea(seed0: u32, seed1: u32, loopCount: u32) {
    var v0: u32 = seed0;
    var v1: u32 = seed1;
    var s0: u32 = 0;
    for (var i = 0u; i < loopCount; i++) {
        s0 += 0x9e3779b9;
        v0 += ((v1 << 4) + 0xA341316C) ^ (v1 + s0) ^ ((v1 >> 5) + 0xC8013EA4);
        v1 += ((v0 << 4) + 0xAD90777D) ^ (v0 + s0) ^ ((v0 >> 5) + 0x7E95761E);
    }
    seed = v0;
}

fn lcg() -> u32 {
    let LCG_A: u32 = 1664525;
    let LCG_C: u32 = 1013904223;
    seed = LCG_A * seed + LCG_C;
    return seed;
}

fn random() -> f32 {
    return f32(lcg() & 0x7fffffff) / f32(0x80000000);
}

fn samplingHemisphere() -> vec4f {
    let r1 = random();
    let r2 = random();
    let sq = sqrt(r1);
    return vec4f(cos(2.0 * PI * r2) * sq, sin(2.0 * PI * r2) * sq, sqrt(1.0 - r1), sqrt(1.0 - r1) * INVPI);
}

struct PrimaryHitInfo {
    baryCoord: vec3f,
    primId: u32,
};

struct PointInfo {
    pos: vec4f,
    normalGeo: vec3f,
    normalShading: vec3f,
    baseColor: vec3f,
    tbn: mat3x3f,
    metallicRoughness: vec2f,
};

fn primaryHit(screen_pos: vec2u) -> PrimaryHitInfo {
    let visibilityInfo = textureLoad(vBuffer, screen_pos, 0);
    var primaryHitInfo: PrimaryHitInfo = PrimaryHitInfo();
    let bataGamma = bitcast<vec2f>(visibilityInfo.xy);
    primaryHitInfo.baryCoord = vec3f(1.0 - bataGamma.x - bataGamma.y, bataGamma.x, bataGamma.y);
    primaryHitInfo.primId = visibilityInfo.z;
    return primaryHitInfo;
}

fn sampleTex(tex: texture_2d_array<f32>, uv: vec2f, index: u32, grad: vec2f, defaultValue: vec4f) -> vec4f {
    if ~index == 0 {
        return defaultValue;
    }
    return textureSampleGrad(tex, samp, uv, index, grad, grad.yx);
    // return textureSampleLevel(tex, samp, uv, index, 0.0);
}

fn unpackTriangle(triangle: PrimaryHitInfo, origin: vec3f, direction: vec3f, halfConeAngle: f32) -> PointInfo {
    let offset = vec3u(indices[triangle.primId * 3], indices[triangle.primId * 3 + 1], indices[triangle.primId * 3 + 2]);
    let vtx = array<vec4f, 3>(vertices[offset.x], vertices[offset.y], vertices[offset.z]);
    let geo = array<GeometryInfo, 3>(geometries[offset.x], geometries[offset.y], geometries[offset.z]);

    var retInfo: PointInfo = PointInfo();
    let albedoId = geo[0].id.x;
    let normalMapId = geo[0].id.y;
    let specularMapId = geo[0].id.z;
    retInfo.pos = vec4f(triangle.baryCoord.x * vtx[0].xyz + triangle.baryCoord.y * vtx[1].xyz + triangle.baryCoord.z * vtx[2].xyz, 1.0);

    retInfo.normalGeo = normalize(cross(vtx[1].xyz - vtx[0].xyz, vtx[2].xyz - vtx[0].xyz));
    let uv = triangle.baryCoord.x * geo[0].uv.xy + triangle.baryCoord.y * geo[1].uv.xy + triangle.baryCoord.z * geo[2].uv.xy;

    // compute uv gradient using ray cone
    var uvGradient: vec2f = vec2f(0.);
        {
        let uv10 = geo[1].uv - geo[0].uv;
        let uv20 = geo[2].uv - geo[0].uv;
        let quadUvArea = abs(uv10.x * uv20.y - uv10.y * uv20.x);
        let edge10 = vtx[1].xyz - vtx[0].xyz;
        let edge20 = vtx[2].xyz - vtx[0].xyz;
        let faceNormal = cross(edge10, edge20);
        let quadArea = length(faceNormal);
        let normalTerm = abs(dot(direction, retInfo.normalGeo));
        let rayConeWidth = 2.0 * tan(halfConeAngle) * length(retInfo.pos.xyz - origin) ;
        let prjConeWidth = rayConeWidth / normalTerm;
        let visibleAreaRatio = prjConeWidth * prjConeWidth / quadArea;
        let visibleUvArea = visibleAreaRatio * quadUvArea;
        let uvLength = sqrt(visibleUvArea);
        uvGradient = vec2f(uvLength, 0);
    }

    // sample textures. The sampled value should be used as far as possible to avoid the texture cache miss.
    retInfo.normalShading = sampleTex(normalMap, uv, normalMapId, uvGradient, vec4f(0., 0., 1., 1.)).xyz * 2.0 - 1.0;
    retInfo.metallicRoughness = sampleTex(specularMap, uv, specularMapId, uvGradient, vec4f(0.5)).zy;
    // retInfo.metallicRoughness = vec2f(0.9, 0.5);
    retInfo.baseColor = sampleTex(albedo, uv, albedoId, uvGradient, vec4f(1.)).xyz;

    // fix normal orientation
    var iterpolatedNormal = normalize(triangle.baryCoord.x * geo[0].normal.xyz + triangle.baryCoord.y * geo[1].normal.xyz + triangle.baryCoord.z * geo[2].normal.xyz);
    var tangent = triangle.baryCoord.x * geo[0].tangent + triangle.baryCoord.y * geo[1].tangent + triangle.baryCoord.z * geo[2].tangent;
    if dot(retInfo.normalGeo, direction) > 0.0 {
        retInfo.normalGeo = -retInfo.normalGeo;
        iterpolatedNormal = -iterpolatedNormal;
        tangent = -tangent;
    }
    // compute normal shading
    let T = normalize(tangent.xyz);
    let B = normalize(cross(iterpolatedNormal, T) * tangent.w);
    retInfo.tbn = mat3x3f(T, B, iterpolatedNormal);
    // retInfo.normalShading = normalize(retInfo.tbn * retInfo.normalShading);
    return retInfo;
}