fn pow5(x: f32) -> f32 {
    let x1 = x;
    let x2 = x1 * x1;
    return x2 * x2 * x1;
}

fn luminance(color: vec3f) -> f32 {
    return dot(color, vec3f(0.2126, 0.7152, 0.0722));
}

fn Fdiffuse(baseColor: vec3f, roughness: f32, ndoti: f32, ndoto: f32, hdoto: f32) -> vec3f {
    let FD90 = 0.5 + 2. * roughness * hdoto * hdoto;
    let FDwi = mix(1., FD90, pow5(1. - ndoti));
    let FDwo = mix(1., FD90, pow5(1. - ndoto));
    return baseColor * INVPI * FDwi * FDwo * ndoto;
}

fn FdiffuseLuminance(baseColorLuminance: f32, roughness: f32, ndoti: f32, ndoto: f32, hdoto: f32) -> f32 {
    let FD90 = 0.5 + 2. * roughness * hdoto * hdoto;
    let FDwi = mix(1., FD90, pow5(1. - ndoti));
    let FDwo = mix(1., FD90, pow5(1. - ndoto));
    return baseColorLuminance * INVPI * FDwi * FDwo * ndoto;
}

fn SmithGGX(ndoti: f32, ndoti2: f32, alpha2: f32) -> f32 {
    return 1.0 / (ndoti + sqrt(alpha2 + ndoti2 - ndoti2 * alpha2));
}

fn Fmetallic(baseColor: vec3f, roughness: f32, ndoth: f32, h: vec3f, hdoto: f32, ndoti: f32, ndoto: f32) -> vec3f {

    let Fm = mix(baseColor, vec3f(1.), pow5(1. - hdoto));
    // GTR2
    let alpha = max(0.001, roughness * roughness);
    let alpha2 = alpha * alpha;
    let t = 1.0 + (alpha2 - 1.0) * ndoth * ndoth;
    let Dm = alpha2 / (PI * t * t);
    // smith GGX 
    let ndoti2 = ndoti * ndoti;
    let ndoto2 = ndoto * ndoto;
    let Gm = SmithGGX(ndoti, ndoti2, alpha2) * SmithGGX(ndoto, ndoto2, alpha2);
    return Fm * Dm * Gm / 4.0 * ndoti;
}

fn FmetallicLuminance(baseColorLuminance: f32, roughness: f32, ndoth: f32, h: vec3f, hdoto: f32, ndoti: f32, ndoto: f32) -> f32 {

    let Fm = mix(baseColorLuminance, 1., pow5(1. - hdoto));
    // GTR2
    let alpha = max(0.001, roughness * roughness);
    let alpha2 = alpha * alpha;
    let t = 1.0 + (alpha2 - 1.0) * ndoth * ndoth;
    let Dm = alpha2 / (PI * t * t);
    // smith GGX 
    let ndoti2 = ndoti * ndoti;
    let ndoto2 = ndoto * ndoto;
    let Gm = SmithGGX(ndoti, ndoti2, alpha2) * SmithGGX(ndoto, ndoto2, alpha2);
    return Fm * Dm * Gm / 4.0 * ndoti;
}

fn BSDF(shadingPoint: PointInfo, wo: vec3f, wi: vec3f) -> vec3f {
    let h = normalize(wi + wo);
    let ndoti = max(0.01, dot(shadingPoint.normalShading, wi));
    let ndoto = max(0.01, dot(shadingPoint.normalShading, wo));
    let hdoto = dot(h, wo);
    let ndoth = max(0.01, dot(shadingPoint.normalShading, h));
    let diffuse = Fdiffuse(shadingPoint.baseColor, shadingPoint.metallicRoughness.y, ndoti, ndoto, hdoto);
    let metallic = Fmetallic(shadingPoint.baseColor, shadingPoint.metallicRoughness.y, ndoth, h, hdoto, ndoti, ndoto);
    return (1.0 - shadingPoint.metallicRoughness.x) * diffuse + (shadingPoint.metallicRoughness.x) * metallic;
}

fn BSDFLuminance(shadingPoint: PointInfo, wo: vec3f, wi: vec3f) -> f32 {
    let ndoto = max(0.000, dot(shadingPoint.normalShading, wo));
    return ndoto * INVPI;

    // let h = normalize(wi + wo);
    // let ndoti = max(0.000, dot(shadingPoint.normalShading, wi));
    // let ndoto = max(0.000, dot(shadingPoint.normalShading, wo));
    // let hdoto = dot(h, wo);
    // let ndoth = max(0.000, dot(shadingPoint.normalShading, h));
    // let baseColorLuminance = luminance(shadingPoint.baseColor);
    // let diffuse = FdiffuseLuminance(baseColorLuminance, shadingPoint.metallicRoughness.y, ndoti, ndoto, hdoto);
    // let metallic = FmetallicLuminance(baseColorLuminance, shadingPoint.metallicRoughness.y, ndoth, h, hdoto, ndoti, ndoto);
    // return ((1.0 - shadingPoint.metallicRoughness.x) * diffuse + (shadingPoint.metallicRoughness.x) * metallic);
}