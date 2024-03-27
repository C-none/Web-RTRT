// https://www.cg.cs.tu-bs.de/publications/Eisemann07FRA
//example usage
//var rayInfo : RayInfo;
//let raySlopeInfo : RaySlopeInfo = initSlopeRayInfo(rayInfo);
//hitAABBSlope(rayInfo, raySlopeInfo, node.min, node.max);

struct RaySlopeInfo {
    ibjy : f32,
    jbyi : f32,
    jbyk : f32,
    kbyj : f32,
    ibyk : f32,
    kbyi : f32,
    cxy : f32,
    cxz : f32,
    cyx : f32,
    cyz : f32,
    czx : f32,
    czy : f32,
}

fn initSlopeRayInfo(rayInfo : RayInfo) -> RaySlopeInfo {
    let o = rayInfo.worldRayOrigin;
    let d = rayInfo.worldRayDirection;
    let invd = rayInfo.directionInverse;

    var raySlopeInfo = RaySlopeInfo();
    raySlopeInfo.ibjy = d.x * invd.y;
    raySlopeInfo.jbyi = d.y * invd.x;
    raySlopeInfo.jbyk = d.y * invd.z;
    raySlopeInfo.kbyj = d.z * invd.y;
    raySlopeInfo.ibyk = d.x * invd.z;
    raySlopeInfo.kbyi = d.z * invd.x;

    raySlopeInfo.cxy = o.y - raySlopeInfo.jbyi * o.x;
    raySlopeInfo.cxz = o.z - raySlopeInfo.kbyi * o.x;
    raySlopeInfo.cyx = o.x - raySlopeInfo.ibjy * o.y;
    raySlopeInfo.cyz = o.z - raySlopeInfo.kbyj * o.y;
    raySlopeInfo.czx = o.x - raySlopeInfo.ibyk * o.z;
    raySlopeInfo.czy = o.y - raySlopeInfo.jbyk * o.z;

    return raySlopeInfo;
}

fn hitAABBSlope(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {
    let testClass = u32(dot(vec3 < i32 > (sign(rayInfo.worldRayDirection)), vec3 < i32 > (16, 4, 1)) + 32);
    switch testClass{
        case u32(-16 - 4 - 1 + 32) : {
            return _slopeAABBtestMMM(rayInfo, raySlopeInfo, minCorner, maxCorner);
        }
        case u32(-16 - 4 + 1 + 32) : {
            return _slopeAABBtestMMP(rayInfo, raySlopeInfo, minCorner, maxCorner);
        }
        case u32(-16 + 4 - 1 + 32) : {
            return _slopeAABBtestMPM(rayInfo, raySlopeInfo, minCorner, maxCorner);
        }
        case u32(-16 + 4 + 1 + 32) : {
            return _slopeAABBtestMPP(rayInfo, raySlopeInfo, minCorner, maxCorner);
        }
        case u32(16 - 4 - 1 + 32) : {
            return _slopeAABBtestPMM(rayInfo, raySlopeInfo, minCorner, maxCorner);
        }
        case u32(16 - 4 + 1 + 32) : {
            return _slopeAABBtestPMP(rayInfo, raySlopeInfo, minCorner, maxCorner);
        }
        case u32(16 + 4 - 1 + 32) : {
            return _slopeAABBtestPPM(rayInfo, raySlopeInfo, minCorner, maxCorner);
        }
        case u32(16 + 4 + 1 + 32) : {
            return _slopeAABBtestPPP(rayInfo, raySlopeInfo, minCorner, maxCorner);
        }
        default : {
            switch testClass{
                case u32(0 - 4 - 1 + 32) : {
                    return _slopeAABBtestOMM(rayInfo, raySlopeInfo, minCorner, maxCorner);
                }
                case u32(0 - 4 + 1 + 32) : {
                    return _slopeAABBtestOMP(rayInfo, raySlopeInfo, minCorner, maxCorner);
                }
                case u32(0 + 4 - 1 + 32) : {
                    return _slopeAABBtestOPM(rayInfo, raySlopeInfo, minCorner, maxCorner);
                }
                case u32(0 + 4 + 1 + 32) : {
                    return _slopeAABBtestOPP(rayInfo, raySlopeInfo, minCorner, maxCorner);
                }
                case u32(-16 + 0 - 1 + 32) : {
                    return _slopeAABBtestMOM(rayInfo, raySlopeInfo, minCorner, maxCorner);
                }
                case u32(-16 + 0 + 1 + 32) : {
                    return _slopeAABBtestMOP(rayInfo, raySlopeInfo, minCorner, maxCorner);
                }
                case u32(16 + 0 - 1 + 32) : {
                    return _slopeAABBtestPOM(rayInfo, raySlopeInfo, minCorner, maxCorner);
                }
                case u32(16 + 0 + 1 + 32) : {
                    return _slopeAABBtestPOP(rayInfo, raySlopeInfo, minCorner, maxCorner);
                }
                case u32(-16 - 4 + 0 + 32) : {
                    return _slopeAABBtestMMO(rayInfo, raySlopeInfo, minCorner, maxCorner);
                }
                case u32(-16 + 4 + 0 + 32) : {
                    return _slopeAABBtestMPO(rayInfo, raySlopeInfo, minCorner, maxCorner);
                }
                case u32(16 - 4 + 0 + 32) : {
                    return _slopeAABBtestPPO(rayInfo, raySlopeInfo, minCorner, maxCorner);
                }
                case u32(16 + 4 + 0 + 32) : {
                    return _slopeAABBtestPPO(rayInfo, raySlopeInfo, minCorner, maxCorner);
                }
                case u32(-16 + 0 + 0 + 32) : {
                    return _slopeAABBtestMOO(rayInfo, raySlopeInfo, minCorner, maxCorner);
                }
                case u32(16 + 0 + 0 + 32) : {
                    return _slopeAABBtestPOO(rayInfo, raySlopeInfo, minCorner, maxCorner);
                }
                case u32(0 - 4 + 0 + 32) : {
                    return _slopeAABBtestOMO(rayInfo, raySlopeInfo, minCorner, maxCorner);
                }
                case u32(0 + 4 + 0 + 32) : {
                    return _slopeAABBtestOPO(rayInfo, raySlopeInfo, minCorner, maxCorner);
                }
                case u32(0 + 0 - 1 + 32) : {
                    return _slopeAABBtestOOM(rayInfo, raySlopeInfo, minCorner, maxCorner);
                }
                case u32(0 + 0 + 1 + 32) : {
                    return _slopeAABBtestOOP(rayInfo, raySlopeInfo, minCorner, maxCorner);
                }
                default : {
                    return false;
                }
            }
        }
    }
}

fn _slopeAABBtestMMM(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {

    let flag : bool = !(rayInfo.worldRayOrigin.x < minCorner.x ||
    rayInfo.worldRayOrigin.y < minCorner.y ||
    rayInfo.worldRayOrigin.z < minCorner.z ||
    raySlopeInfo.jbyi * minCorner.x - maxCorner.y + raySlopeInfo.cxy > 0 ||
    raySlopeInfo.ibjy * minCorner.y - maxCorner.x + raySlopeInfo.cyx > 0 ||
    raySlopeInfo.jbyk * minCorner.z - maxCorner.y + raySlopeInfo.czy > 0 ||
    raySlopeInfo.kbyj * minCorner.y - maxCorner.z + raySlopeInfo.cyz > 0 ||
    raySlopeInfo.kbyi * minCorner.x - maxCorner.z + raySlopeInfo.cxz > 0 ||
    raySlopeInfo.ibyk * minCorner.z - maxCorner.x + raySlopeInfo.czx > 0);
    if !flag {
        return false;
    }
    let distance : vec3 <f32> = (vec3 <f32> (maxCorner.x, maxCorner.y, maxCorner.z) - rayInfo.worldRayOrigin) * rayInfo.directionInverse;
    if max(max(distance.x, distance.y), distance.z) > rayInfo.hitDistance {
        return false;
    }
    return true;
}

fn _slopeAABBtestMMP(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {
    let flag : bool = !(rayInfo.worldRayOrigin.x < minCorner.x ||
    rayInfo.worldRayOrigin.y < minCorner.y ||
    rayInfo.worldRayOrigin.z > maxCorner.z ||
    raySlopeInfo.jbyi * minCorner.x - maxCorner.y + raySlopeInfo.cxy > 0 ||
    raySlopeInfo.ibjy * minCorner.y - maxCorner.x + raySlopeInfo.cyx > 0 ||
    raySlopeInfo.jbyk * maxCorner.z - maxCorner.y + raySlopeInfo.czy > 0 ||
    raySlopeInfo.kbyj * minCorner.y - minCorner.z + raySlopeInfo.cyz < 0 ||
    raySlopeInfo.kbyi * minCorner.x - minCorner.z + raySlopeInfo.cxz < 0 ||
    raySlopeInfo.ibyk * maxCorner.z - maxCorner.x + raySlopeInfo.czx > 0);
    if !flag {
        return false;
    }
    let distance : vec3 <f32> = (vec3 <f32> (maxCorner.x, maxCorner.y, minCorner.z) - rayInfo.worldRayOrigin) * rayInfo.directionInverse;
    if max(max(distance.x, distance.y), distance.z) > rayInfo.hitDistance {
        return false;
    }
    return true;
}

fn _slopeAABBtestMPM(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {
    let flag : bool = !(rayInfo.worldRayOrigin.x < minCorner.x ||
    rayInfo.worldRayOrigin.y > maxCorner.y ||
    rayInfo.worldRayOrigin.z < minCorner.z ||
    raySlopeInfo.jbyi * minCorner.x - minCorner.y + raySlopeInfo.cxy < 0 ||
    raySlopeInfo.ibjy * maxCorner.y - maxCorner.x + raySlopeInfo.cyx > 0 ||
    raySlopeInfo.jbyk * minCorner.z - minCorner.y + raySlopeInfo.czy < 0 ||
    raySlopeInfo.kbyj * maxCorner.y - maxCorner.z + raySlopeInfo.cyz > 0 ||
    raySlopeInfo.kbyi * minCorner.x - maxCorner.z + raySlopeInfo.cxz > 0 ||
    raySlopeInfo.ibyk * minCorner.z - maxCorner.x + raySlopeInfo.czx > 0);
    if !flag {
        return false;
    }
    let distance : vec3 <f32> = (vec3 <f32> (maxCorner.x, minCorner.y, maxCorner.z) - rayInfo.worldRayOrigin) * rayInfo.directionInverse;
    if max(max(distance.x, distance.y), distance.z) > rayInfo.hitDistance {
        return false;
    }
    return true;
}

fn _slopeAABBtestMPP(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {
    let flag : bool = !(rayInfo.worldRayOrigin.x < minCorner.x ||
    rayInfo.worldRayOrigin.y > maxCorner.y ||
    rayInfo.worldRayOrigin.z > maxCorner.z ||
    raySlopeInfo.jbyi * minCorner.x - minCorner.y + raySlopeInfo.cxy < 0 ||
    raySlopeInfo.ibjy * maxCorner.y - maxCorner.x + raySlopeInfo.cyx > 0 ||
    raySlopeInfo.jbyk * maxCorner.z - minCorner.y + raySlopeInfo.czy < 0 ||
    raySlopeInfo.kbyj * maxCorner.y - minCorner.z + raySlopeInfo.cyz < 0 ||
    raySlopeInfo.kbyi * minCorner.x - minCorner.z + raySlopeInfo.cxz < 0 ||
    raySlopeInfo.ibyk * maxCorner.z - maxCorner.x + raySlopeInfo.czx > 0);
    if !flag {
        return false;
    }
    let distance : vec3 <f32> = (vec3 <f32> (maxCorner.x, minCorner.y, minCorner.z) - rayInfo.worldRayOrigin) * rayInfo.directionInverse;
    if max(max(distance.x, distance.y), distance.z) > rayInfo.hitDistance {
        return false;
    }
    return true;
}

fn _slopeAABBtestPMM(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {
    let flag : bool = !(rayInfo.worldRayOrigin.x > maxCorner.x ||
    rayInfo.worldRayOrigin.y < minCorner.y ||
    rayInfo.worldRayOrigin.z < minCorner.z ||
    raySlopeInfo.jbyi * maxCorner.x - maxCorner.y + raySlopeInfo.cxy > 0 ||
    raySlopeInfo.ibjy * minCorner.y - minCorner.x + raySlopeInfo.cyx < 0 ||
    raySlopeInfo.jbyk * minCorner.z - maxCorner.y + raySlopeInfo.czy > 0 ||
    raySlopeInfo.kbyj * minCorner.y - maxCorner.z + raySlopeInfo.cyz > 0 ||
    raySlopeInfo.kbyi * maxCorner.x - maxCorner.z + raySlopeInfo.cxz > 0 ||
    raySlopeInfo.ibyk * minCorner.z - minCorner.x + raySlopeInfo.czx < 0);
    if !flag {
        return false;
    }
    let distance : vec3 <f32> = (vec3 <f32> (minCorner.x, maxCorner.y, maxCorner.z) - rayInfo.worldRayOrigin) * rayInfo.directionInverse;
    if max(max(distance.x, distance.y), distance.z) > rayInfo.hitDistance {
        return false;
    }
    return true;
}

fn _slopeAABBtestPMP(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {
    let flag : bool = !(rayInfo.worldRayOrigin.x > maxCorner.x ||
    rayInfo.worldRayOrigin.y < minCorner.y ||
    rayInfo.worldRayOrigin.z > maxCorner.z ||
    raySlopeInfo.jbyi * maxCorner.x - maxCorner.y + raySlopeInfo.cxy > 0 ||
    raySlopeInfo.ibjy * minCorner.y - minCorner.x + raySlopeInfo.cyx < 0 ||
    raySlopeInfo.jbyk * maxCorner.z - maxCorner.y + raySlopeInfo.czy > 0 ||
    raySlopeInfo.kbyj * minCorner.y - minCorner.z + raySlopeInfo.cyz < 0 ||
    raySlopeInfo.kbyi * maxCorner.x - minCorner.z + raySlopeInfo.cxz < 0 ||
    raySlopeInfo.ibyk * maxCorner.z - minCorner.x + raySlopeInfo.czx < 0);
    if !flag {
        return false;
    }
    let distance : vec3 <f32> = (vec3 <f32> (minCorner.x, maxCorner.y, minCorner.z) - rayInfo.worldRayOrigin) * rayInfo.directionInverse;
    if max(max(distance.x, distance.y), distance.z) > rayInfo.hitDistance {
        return false;
    }
    return true;
}

fn _slopeAABBtestPPM(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {
    let flag : bool = !(rayInfo.worldRayOrigin.x > maxCorner.x ||
    rayInfo.worldRayOrigin.y > maxCorner.y ||
    rayInfo.worldRayOrigin.z < minCorner.z ||
    raySlopeInfo.jbyi * maxCorner.x - minCorner.y + raySlopeInfo.cxy < 0 ||
    raySlopeInfo.ibjy * maxCorner.y - minCorner.x + raySlopeInfo.cyx < 0 ||
    raySlopeInfo.jbyk * minCorner.z - minCorner.y + raySlopeInfo.czy < 0 ||
    raySlopeInfo.kbyj * maxCorner.y - maxCorner.z + raySlopeInfo.cyz > 0 ||
    raySlopeInfo.kbyi * maxCorner.x - maxCorner.z + raySlopeInfo.cxz > 0 ||
    raySlopeInfo.ibyk * minCorner.z - minCorner.x + raySlopeInfo.czx < 0);
    if !flag {
        return false;
    }
    let distance : vec3 <f32> = (vec3 <f32> (minCorner.x, minCorner.y, maxCorner.z) - rayInfo.worldRayOrigin) * rayInfo.directionInverse;
    if max(max(distance.x, distance.y), distance.z) > rayInfo.hitDistance {
        return false;
    }
    return true;
}

fn _slopeAABBtestPPP(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {
    let flag : bool = !(rayInfo.worldRayOrigin.x > maxCorner.x ||
    rayInfo.worldRayOrigin.y > maxCorner.y ||
    rayInfo.worldRayOrigin.z > maxCorner.z ||
    raySlopeInfo.jbyi * maxCorner.x - minCorner.y + raySlopeInfo.cxy < 0 ||
    raySlopeInfo.ibjy * maxCorner.y - minCorner.x + raySlopeInfo.cyx < 0 ||
    raySlopeInfo.jbyk * maxCorner.z - minCorner.y + raySlopeInfo.czy < 0 ||
    raySlopeInfo.kbyj * maxCorner.y - minCorner.z + raySlopeInfo.cyz < 0 ||
    raySlopeInfo.kbyi * maxCorner.x - minCorner.z + raySlopeInfo.cxz < 0 ||
    raySlopeInfo.ibyk * maxCorner.z - minCorner.x + raySlopeInfo.czx < 0);
    if !flag {
        return false;
    }
    let distance : vec3 <f32> = (vec3 <f32> (minCorner.x, minCorner.y, minCorner.z) - rayInfo.worldRayOrigin) * rayInfo.directionInverse;
    if max(max(distance.x, distance.y), distance.z) > rayInfo.hitDistance {
        return false;
    }
    return true;
}

fn _slopeAABBtestOMM(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {
    let flag : bool = !(rayInfo.worldRayOrigin.x < minCorner.x ||
    rayInfo.worldRayOrigin.x > maxCorner.x ||
    rayInfo.worldRayOrigin.y < minCorner.y ||
    rayInfo.worldRayOrigin.z < minCorner.z ||
    raySlopeInfo.jbyk * minCorner.z - maxCorner.y + raySlopeInfo.czy > 0 ||
    raySlopeInfo.kbyj * minCorner.y - maxCorner.z + raySlopeInfo.cyz > 0);
    if !flag {
        return false;
    }
    let distance : vec2 <f32> = (vec2 <f32> (maxCorner.y, maxCorner.z) - rayInfo.worldRayOrigin.yz) * rayInfo.directionInverse.yz;
    if max(distance.x, distance.y) > rayInfo.hitDistance {
        return false;
    }
    return true;
}

fn _slopeAABBtestOMP(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {
    let flag : bool = !(rayInfo.worldRayOrigin.x < minCorner.x ||
    rayInfo.worldRayOrigin.x > maxCorner.x ||
    rayInfo.worldRayOrigin.y < minCorner.y ||
    rayInfo.worldRayOrigin.z > maxCorner.z ||
    raySlopeInfo.jbyk * maxCorner.z - maxCorner.y + raySlopeInfo.czy > 0 ||
    raySlopeInfo.kbyj * minCorner.y - minCorner.z + raySlopeInfo.cyz < 0);
    if !flag {
        return false;
    }
    let distance : vec2 <f32> = (vec2 <f32> (maxCorner.y, minCorner.z) - rayInfo.worldRayOrigin.yz) * rayInfo.directionInverse.yz;
    if max(distance.x, distance.y) > rayInfo.hitDistance {
        return false;
    }
    return true;
}

fn _slopeAABBtestOPM(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {
    let flag : bool = !(rayInfo.worldRayOrigin.x < minCorner.x ||
    rayInfo.worldRayOrigin.x > maxCorner.x ||
    rayInfo.worldRayOrigin.y > maxCorner.y ||
    rayInfo.worldRayOrigin.z < minCorner.z ||
    raySlopeInfo.jbyk * minCorner.z - minCorner.y + raySlopeInfo.czy < 0 ||
    raySlopeInfo.kbyj * maxCorner.y - maxCorner.z + raySlopeInfo.cyz > 0);
    if !flag {
        return false;
    }
    let distance : vec2 <f32> = (vec2 <f32> (minCorner.y, maxCorner.z) - rayInfo.worldRayOrigin.yz) * rayInfo.directionInverse.yz;
    if max(distance.x, distance.y) > rayInfo.hitDistance {
        return false;
    }
    return true;
}

fn _slopeAABBtestOPP(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {
    let flag : bool = !(rayInfo.worldRayOrigin.x < minCorner.x ||
    rayInfo.worldRayOrigin.x > maxCorner.x ||
    rayInfo.worldRayOrigin.y > maxCorner.y ||
    rayInfo.worldRayOrigin.z > maxCorner.z ||
    raySlopeInfo.jbyk * maxCorner.z - minCorner.y + raySlopeInfo.czy < 0 ||
    raySlopeInfo.kbyj * maxCorner.y - minCorner.z + raySlopeInfo.cyz < 0);
    if !flag {
        return false;
    }
    let distance : vec2 <f32> = (vec2 <f32> (minCorner.y, minCorner.z) - rayInfo.worldRayOrigin.yz) * rayInfo.directionInverse.yz;
    if max(distance.x, distance.y) > rayInfo.hitDistance {
        return false;
    }
    return true;
}

fn _slopeAABBtestMOM(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {
    let flag : bool = !(rayInfo.worldRayOrigin.y < minCorner.y ||
    rayInfo.worldRayOrigin.y > maxCorner.y ||
    rayInfo.worldRayOrigin.x < minCorner.x ||
    rayInfo.worldRayOrigin.z < minCorner.z ||
    raySlopeInfo.kbyi * minCorner.x - maxCorner.z + raySlopeInfo.cxz > 0 ||
    raySlopeInfo.ibyk * minCorner.z - maxCorner.x + raySlopeInfo.czx > 0);
    if !flag {
        return false;
    }
    let distance : vec2 <f32> = (vec2 <f32> (maxCorner.x, maxCorner.z) - rayInfo.worldRayOrigin.xz) * rayInfo.directionInverse.xz;
    if max(distance.x, distance.y) > rayInfo.hitDistance {
        return false;
    }
    return true;
}

fn _slopeAABBtestMOP(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {
    let flag : bool = !(rayInfo.worldRayOrigin.y < minCorner.y ||
    rayInfo.worldRayOrigin.y > maxCorner.y ||
    rayInfo.worldRayOrigin.x < minCorner.x ||
    rayInfo.worldRayOrigin.z > maxCorner.z ||
    raySlopeInfo.kbyi * minCorner.x - minCorner.z + raySlopeInfo.cxz < 0 ||
    raySlopeInfo.ibyk * maxCorner.z - maxCorner.x + raySlopeInfo.czx > 0);
    if !flag {
        return false;
    }
    let distance : vec2 <f32> = (vec2 <f32> (maxCorner.x, minCorner.z) - rayInfo.worldRayOrigin.xz) * rayInfo.directionInverse.xz;
    if max(distance.x, distance.y) > rayInfo.hitDistance {
        return false;
    }
    return true;
}

fn _slopeAABBtestPOM(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {
    let flag : bool = !(rayInfo.worldRayOrigin.y < minCorner.y ||
    rayInfo.worldRayOrigin.y > maxCorner.y ||
    rayInfo.worldRayOrigin.x > maxCorner.x ||
    rayInfo.worldRayOrigin.z < minCorner.z ||
    raySlopeInfo.kbyi * maxCorner.x - maxCorner.z + raySlopeInfo.cxz > 0 ||
    raySlopeInfo.ibyk * minCorner.z - minCorner.x + raySlopeInfo.czx < 0);
    if !flag {
        return false;
    }
    let distance : vec2 <f32> = (vec2 <f32> (minCorner.x, maxCorner.z) - rayInfo.worldRayOrigin.xz) * rayInfo.directionInverse.xz;
    if max(distance.x, distance.y) > rayInfo.hitDistance {
        return false;
    }
    return true;
}

fn _slopeAABBtestPOP(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {
    let flag : bool = !(rayInfo.worldRayOrigin.y < minCorner.y ||
    rayInfo.worldRayOrigin.y > maxCorner.y ||
    rayInfo.worldRayOrigin.x > maxCorner.x ||
    rayInfo.worldRayOrigin.z > maxCorner.z ||
    raySlopeInfo.kbyi * maxCorner.x - minCorner.z + raySlopeInfo.cxz < 0 ||
    raySlopeInfo.ibyk * maxCorner.z - minCorner.x + raySlopeInfo.czx < 0);
    if !flag {
        return false;
    }
    let distance : vec2 <f32> = (vec2 <f32> (minCorner.x, minCorner.z) - rayInfo.worldRayOrigin.xz) * rayInfo.directionInverse.xz;
    if max(distance.x, distance.y) > rayInfo.hitDistance {
        return false;
    }
    return true;
}

fn _slopeAABBtestMMO(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {
    let flag : bool = !(rayInfo.worldRayOrigin.z < minCorner.z ||
    rayInfo.worldRayOrigin.z > maxCorner.z ||
    rayInfo.worldRayOrigin.x < minCorner.x ||
    rayInfo.worldRayOrigin.y < minCorner.y);
    if !flag {
        return false;
    }
    let distance : vec2 <f32> = (vec2 <f32> (maxCorner.x, maxCorner.y) - rayInfo.worldRayOrigin.xy) * rayInfo.directionInverse.xy;
    if max(distance.x, distance.y) > rayInfo.hitDistance {
        return false;
    }
    return true;
}

fn _slopeAABBtestMPO(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {
    let flag : bool = !(rayInfo.worldRayOrigin.z < minCorner.z ||
    rayInfo.worldRayOrigin.z > maxCorner.z ||
    rayInfo.worldRayOrigin.x < minCorner.x ||
    rayInfo.worldRayOrigin.y > maxCorner.y);
    if !flag {
        return false;
    }
    let distance : vec2 <f32> = (vec2 <f32> (maxCorner.x, minCorner.y) - rayInfo.worldRayOrigin.xy) * rayInfo.directionInverse.xy;
    if max(distance.x, distance.y) > rayInfo.hitDistance {
        return false;
    }
    return true;
}

fn _slopeAABBtestPPO(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {
    let flag : bool = !(rayInfo.worldRayOrigin.z < minCorner.z ||
    rayInfo.worldRayOrigin.z > maxCorner.z ||
    rayInfo.worldRayOrigin.x > maxCorner.x ||
    rayInfo.worldRayOrigin.y > maxCorner.y);
    if !flag {
        return false;
    }
    let distance : vec2 <f32> = (vec2 <f32> (minCorner.x, minCorner.y) - rayInfo.worldRayOrigin.xy) * rayInfo.directionInverse.xy;
    if max(distance.x, distance.y) > rayInfo.hitDistance {
        return false;
    }
    return true;
}

fn _slopeAABBtestMOO(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {
    let flag : bool = !(rayInfo.worldRayOrigin.x < minCorner.x ||
    rayInfo.worldRayOrigin.y < minCorner.y ||
    rayInfo.worldRayOrigin.y > maxCorner.y ||
    rayInfo.worldRayOrigin.z < minCorner.z ||
    rayInfo.worldRayOrigin.z > maxCorner.z);
    if !flag {
        return false;
    }
    let distance : f32 = (maxCorner.x - rayInfo.worldRayOrigin.x) * rayInfo.directionInverse.x;
    if distance > rayInfo.hitDistance {
        return false;
    }
    return true;
}

fn _slopeAABBtestPOO(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {
    let flag : bool = !(rayInfo.worldRayOrigin.x > maxCorner.x ||
    rayInfo.worldRayOrigin.y < minCorner.y ||
    rayInfo.worldRayOrigin.y > maxCorner.y ||
    rayInfo.worldRayOrigin.z < minCorner.z ||
    rayInfo.worldRayOrigin.z > maxCorner.z);
    if !flag {
        return false;
    }
    let distance : f32 = (minCorner.x - rayInfo.worldRayOrigin.x) * rayInfo.directionInverse.x;
    if distance > rayInfo.hitDistance {
        return false;
    }
    return true;
}

fn _slopeAABBtestOMO(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {
    let flag : bool = !(rayInfo.worldRayOrigin.y < minCorner.y ||
    rayInfo.worldRayOrigin.x < minCorner.x ||
    rayInfo.worldRayOrigin.x > maxCorner.x ||
    rayInfo.worldRayOrigin.z < minCorner.z ||
    rayInfo.worldRayOrigin.z > maxCorner.z);
    if !flag {
        return false;
    }
    let distance : f32 = (maxCorner.y - rayInfo.worldRayOrigin.y) * rayInfo.directionInverse.y;
    if distance > rayInfo.hitDistance {
        return false;
    }
    return true;
}

fn _slopeAABBtestOPO(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {
    let flag : bool = !(rayInfo.worldRayOrigin.y > maxCorner.y ||
    rayInfo.worldRayOrigin.x < minCorner.x ||
    rayInfo.worldRayOrigin.x > maxCorner.x ||
    rayInfo.worldRayOrigin.z < minCorner.z ||
    rayInfo.worldRayOrigin.z > maxCorner.z);
    if !flag {
        return false;
    }
    let distance : f32 = (minCorner.y - rayInfo.worldRayOrigin.y) * rayInfo.directionInverse.y;
    if distance > rayInfo.hitDistance {
        return false;
    }
    return true;
}

fn _slopeAABBtestOOM(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {
    let flag : bool = !(rayInfo.worldRayOrigin.z < minCorner.z ||
    rayInfo.worldRayOrigin.x < minCorner.x ||
    rayInfo.worldRayOrigin.x > maxCorner.x ||
    rayInfo.worldRayOrigin.y < minCorner.y ||
    rayInfo.worldRayOrigin.y > maxCorner.y);
    if !flag {
        return false;
    }
    let distance : f32 = (maxCorner.z - rayInfo.worldRayOrigin.z) * rayInfo.directionInverse.z;
    if distance > rayInfo.hitDistance {
        return false;
    }
    return true;
}

fn _slopeAABBtestOOP(rayInfo : RayInfo, raySlopeInfo : RaySlopeInfo, minCorner : vec3 < f32>, maxCorner : vec3 < f32>) -> bool {
    let flag : bool = !(rayInfo.worldRayOrigin.z > maxCorner.z ||
    rayInfo.worldRayOrigin.x < minCorner.x ||
    rayInfo.worldRayOrigin.x > maxCorner.x ||
    rayInfo.worldRayOrigin.y < minCorner.y ||
    rayInfo.worldRayOrigin.y > maxCorner.y);
    if !flag {
        return false;
    }
    let distance : f32 = (minCorner.z - rayInfo.worldRayOrigin.z) * rayInfo.directionInverse.z;
    if distance > rayInfo.hitDistance {
        return false;
    }
    return true;
}
