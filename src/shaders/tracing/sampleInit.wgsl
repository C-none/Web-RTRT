
struct PrimaryHitInfo {
    baryCoord: vec3f,
    primId: u32,
    motionVec: vec2f,
};
fn primaryHit(screen_pos: vec2u) -> PrimaryHitInfo {
    let visibilityInfo = textureLoad(vBuffer, screen_pos, 0);
    var primaryHitInfo: PrimaryHitInfo = PrimaryHitInfo();
    let bataGamma = bitcast<vec2f>(visibilityInfo.xy);
    primaryHitInfo.baryCoord = vec3f(1.0 - bataGamma.x - bataGamma.y, bataGamma.x, bataGamma.y);
    primaryHitInfo.primId = visibilityInfo.z;
    primaryHitInfo.motionVec = unpack2x16float(visibilityInfo.w);
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
    retInfo.pos = vec3f(triangle.baryCoord.x * vtx[0].xyz + triangle.baryCoord.y * vtx[1].xyz + triangle.baryCoord.z * vtx[2].xyz);

    var normalGeo = normalize(cross(vtx[1].xyz - vtx[0].xyz, vtx[2].xyz - vtx[0].xyz));
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
        let normalTerm = abs(dot(direction, normalGeo));
        let rayConeWidth = 2.0 * tan(halfConeAngle) * length(retInfo.pos - origin) ;
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
    if dot(normalGeo, iterpolatedNormal) < 0.0 {
        normalGeo = -normalGeo;
    }
    if dot(normalGeo, direction) > 0.0 {
        normalGeo = -normalGeo;
        iterpolatedNormal = -iterpolatedNormal;
        tangent = -tangent;
    }
    // compute normal shading
    var T = normalize(tangent.xyz);
    var B = normalize(cross(iterpolatedNormal, T) * tangent.w);
    retInfo.tbn = mat3x3f(T, B, iterpolatedNormal);
    retInfo.normalShading = normalize(retInfo.tbn * retInfo.normalShading);
    // retInfo.normalShading = normalGeo;
    B = normalize(cross(normalGeo, T) * tangent.w);
    T = normalize(cross(B, normalGeo) * tangent.w);
    retInfo.tbn = mat3x3f(T, B, normalGeo);
    return retInfo;
}