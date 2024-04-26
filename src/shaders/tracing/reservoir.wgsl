struct ReservoirDI {
    lightId: u32,
    w_sum: f32,
    W: f32,
    M: u32,
};
struct ReservoirGI {
    // x: point n:normal
    // v: visible point
    // s: sample point
    xv: vec3f,
    w_sum: f32,
    nv: vec3f,
    M: u32,
    xs: vec3f,
    W: f32,
    ns: vec3f,
    Lo: vec3f,
}

@group(2) @binding(0) var<storage, read_write> currentReservoir: array<array<u32,16>>;
@group(2) @binding(1) var<storage, read> previousReservoir: array<array<u32,16>>;

fn normalEncode(normal: vec3f) -> u32 {
    // Stereographic projection
    let XY = vec2f(normal.xy / (1.0 - normal.z));
    return pack2x16float(XY);
}

fn normalDecode(encoded: u32) -> vec3f {
    let XY = unpack2x16float(encoded);
    let denom = 1.0 + dot(XY, XY);
    return vec3f(2.0 * XY / denom, (denom - 2.0) / denom);
}

fn loadReservoir(reservoir: ptr<storage,array<array<u32,16>>>, idx: u32, reservoirDI: ptr<function,ReservoirDI>, reservoirGI: ptr<function,ReservoirGI>) {
    // LightDI,wDI,WDI,MDIGI.xy
    // Xvisible.xyz Nvisible.xy
    // Xsample.xyz Nsample.xy
    // wGI,WGI, Lo.xy, Lo.zw
    let reservoirAll = (*reservoir)[idx];
    (*reservoirDI).lightId = reservoirAll[0];
    (*reservoirDI).w_sum = bitcast<f32>(reservoirAll[1]);
    (*reservoirDI).W = bitcast<f32>(reservoirAll[2]);
    let MAll = vec2u(reservoirAll[3] & 0xFFFF, reservoirAll[3] >> 16);
    (*reservoirDI).M = MAll.x;

    (*reservoirGI).M = MAll.y;
    (*reservoirGI).xv = bitcast<vec3f>(vec3u(reservoirAll[4], reservoirAll[5], reservoirAll[6]));
    (*reservoirGI).nv = normalDecode(reservoirAll[7]);
    (*reservoirGI).xs = bitcast<vec3f>(vec3u(reservoirAll[8], reservoirAll[9], reservoirAll[10]));
    (*reservoirGI).ns = normalDecode(reservoirAll[11]);
    (*reservoirGI).w_sum = bitcast<f32>(reservoirAll[12]);
    (*reservoirGI).W = bitcast<f32>(reservoirAll[13]);
    (*reservoirGI).Lo = vec3f(unpack2x16float(reservoirAll[14]), unpack2x16float(reservoirAll[15]).x);
}

fn storeReservoir(reservoir: ptr<storage,array<array<u32,16>>,read_write>, idx: u32, reservoirDI: ReservoirDI, reservoirGI: ReservoirGI) {
    // LightDI,wDI,WDI,MDIGI.xy
    // Xvisible.xyz Nvisible.xy
    // Xsample.xyz Nsample.xy
    // wGI,WGI, Lo.xy, Lo.zw
    let MAll = vec2u(reservoirDI.M, reservoirGI.M);
    (*reservoir)[idx] = array<u32,16>(
        reservoirDI.lightId,
        bitcast<u32>(reservoirDI.w_sum),
        bitcast<u32>(reservoirDI.W),
        MAll.x | (MAll.y << 16),
        bitcast<u32>(reservoirGI.xv.x),
        bitcast<u32>(reservoirGI.xv.y),
        bitcast<u32>(reservoirGI.xv.z),
        normalEncode(reservoirGI.nv),
        bitcast<u32>(reservoirGI.xs.x),
        bitcast<u32>(reservoirGI.xs.y),
        bitcast<u32>(reservoirGI.xs.z),
        normalEncode(reservoirGI.ns),
        bitcast<u32>(reservoirGI.w_sum),
        bitcast<u32>(reservoirGI.W),
        pack2x16float(reservoirGI.Lo.xy),
        pack2x16float(vec2f(reservoirGI.Lo.z, 0.0))
    );
}

fn updateReservoirDI(reservoir: ptr<function,ReservoirDI>, lightId: u32, weight: f32) {
    (*reservoir).M += 1;
    (*reservoir).w_sum += weight;
    if random() < weight / (*reservoir).w_sum {
        (*reservoir).lightId = lightId;
    }
}

fn combineReservoirsDI(reservoir: ptr<function,ReservoirDI>, other: ReservoirDI) {
    (*reservoir).M += other.M;
    (*reservoir).w_sum += other.w_sum;
    if random() < other.w_sum / (*reservoir).w_sum {
        (*reservoir).lightId = other.lightId;
    }
}