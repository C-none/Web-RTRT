const PI:f32=3.14159265359;

fn sampleTex(tex: texture_2d_array<f32>, uv: vec2f, index: u32, grad: vec2f, defaultValue: vec4f) -> vec4f {
    if ~index == 0 {
        return defaultValue;
    }
    return textureSampleGrad(tex, samp, uv, index, grad, grad.yx);
}

fn unpackTriangle(triangle: PrimaryHitInfo, origin: vec3f, direction: vec3f, halfConeAngle: f32) -> PointInfo {
    let offset = vec3u(indices[triangle.primId * 3], indices[triangle.primId * 3 + 1], indices[triangle.primId * 3 + 2]);
    let vtx = array<vec4f, 3 >(vertices[offset.x], vertices[offset.y], vertices[offset.z]);
    let geo = array<GeometryInfo, 3 >(geometries[offset.x], geometries[offset.y], geometries[offset.z]);

    var retInfo: PointInfo = PointInfo();
    retInfo.pos = vec4f(triangle.barycentricCoord.x * vtx[0].xyz + triangle.barycentricCoord.y * vtx[1].xyz + triangle.barycentricCoord.z * vtx[2].xyz, 1.0);
    retInfo.albedoId = geo[0].id.x;
    retInfo.normalMapId = geo[0].id.y;
    retInfo.specularMapId = geo[0].id.z;

    retInfo.normalGeo = normalize(cross(vtx[1].xyz - vtx[0].xyz, vtx[2].xyz - vtx[0].xyz));
    var iterpolatedNormal = normalize(triangle.barycentricCoord.x * geo[0].normal.xyz + triangle.barycentricCoord.y * geo[1].normal.xyz + triangle.barycentricCoord.z * geo[2].normal.xyz);
    var tangent = triangle.barycentricCoord.x * geo[0].tangent + triangle.barycentricCoord.y * geo[1].tangent + triangle.barycentricCoord.z * geo[2].tangent;
    retInfo.uv = triangle.barycentricCoord.x * geo[0].uv.xy + triangle.barycentricCoord.y * geo[1].uv.xy + triangle.barycentricCoord.z * geo[2].uv.xy;

    // fix normal orientation
    if dot(retInfo.normalGeo, direction) > 0.0 {
        iterpolatedNormal = -iterpolatedNormal;
        tangent = -tangent;
    }

    // compute uv gradient using ray cone
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
    retInfo.uvGrad = vec2f(uvLength, 0);

    // compute normal shading
    let sampleNormal = sampleTex(normalMap, retInfo.uv, retInfo.normalMapId, retInfo.uvGrad, vec4f(0., 0., 1., 1.)).xyz * 2.0 - 1.0;
    retInfo.baseColor = sampleTex(albedo, retInfo.uv, retInfo.albedoId, retInfo.uvGrad, vec4f(1.)).xyz;
    retInfo.metallicRoughness = sampleTex(specularMap, retInfo.uv, retInfo.specularMapId, retInfo.uvGrad, vec4f(0.5)).zy;
    let T = normalize(tangent.xyz);
    let B = normalize(cross(iterpolatedNormal, T) * tangent.w);
    let TBN = mat3x3f(T, B, iterpolatedNormal);
    retInfo.normalShading = normalize(TBN * sampleNormal);
    // retInfo.normalShading = normalize(sampleNormal);
    return retInfo;
}