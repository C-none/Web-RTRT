# Details

Date : 2024-05-18 19:11:53

Directory d:\\BaiduNetdiskDownload\\Web-RTRT\\src

Total : 42 files,  4979 codes, 464 comments, 466 blanks, all 5909 lines

[Summary](results.md) / Details / [Diff Summary](diff.md) / [Diff Details](diff-details.md)

## Files
| filename | language | code | comment | blank | total |
| :--- | :--- | ---: | ---: | ---: | ---: |
| [src/bvh.ts](/src/bvh.ts) | TypeScript | 231 | 6 | 15 | 252 |
| [src/camera.ts](/src/camera.ts) | TypeScript | 118 | 17 | 11 | 146 |
| [src/computeWorker.ts](/src/computeWorker.ts) | TypeScript | 21 | 0 | 4 | 25 |
| [src/denoiser.ts](/src/denoiser.ts) | TypeScript | 444 | 2 | 31 | 477 |
| [src/device.ts](/src/device.ts) | TypeScript | 42 | 1 | 7 | 50 |
| [src/display.ts](/src/display.ts) | TypeScript | 113 | 1 | 6 | 120 |
| [src/gltf.ts](/src/gltf.ts) | TypeScript | 371 | 26 | 26 | 423 |
| [src/main.ts](/src/main.ts) | TypeScript | 89 | 0 | 17 | 106 |
| [src/modelView.ts](/src/modelView.ts) | TypeScript | 63 | 10 | 31 | 104 |
| [src/raytracing.ts](/src/raytracing.ts) | TypeScript | 636 | 21 | 20 | 677 |
| [src/sample.ts](/src/sample.ts) | TypeScript | 319 | 62 | 17 | 398 |
| [src/screenBuffer.ts](/src/screenBuffer.ts) | TypeScript | 71 | 0 | 4 | 75 |
| [src/shaders/basic.instanced.vert.wgsl](/src/shaders/basic.instanced.vert.wgsl) | WGSL | 18 | 0 | 4 | 22 |
| [src/shaders/compute.position.wgsl](/src/shaders/compute.position.wgsl) | WGSL | 50 | 10 | 5 | 65 |
| [src/shaders/denoise/atrous.wgsl](/src/shaders/denoise/atrous.wgsl) | WGSL | 81 | 18 | 11 | 110 |
| [src/shaders/denoise/denoiseAccum.wgsl](/src/shaders/denoise/denoiseAccum.wgsl) | WGSL | 26 | 4 | 5 | 35 |
| [src/shaders/denoise/denoiseCommon.wgsl](/src/shaders/denoise/denoiseCommon.wgsl) | WGSL | 10 | 1 | 3 | 14 |
| [src/shaders/denoise/filterVariance.wgsl](/src/shaders/denoise/filterVariance.wgsl) | WGSL | 54 | 2 | 9 | 65 |
| [src/shaders/denoise/firefly.wgsl](/src/shaders/denoise/firefly.wgsl) | WGSL | 88 | 8 | 12 | 108 |
| [src/shaders/denoise/preloadInvoker.wgsl](/src/shaders/denoise/preloadInvoker.wgsl) | WGSL | 13 | 0 | 0 | 13 |
| [src/shaders/denoise/temperalAccum.wgsl](/src/shaders/denoise/temperalAccum.wgsl) | WGSL | 154 | 14 | 18 | 186 |
| [src/shaders/display.wgsl](/src/shaders/display.wgsl) | WGSL | 39 | 15 | 7 | 61 |
| [src/shaders/lightUpdate.wgsl](/src/shaders/lightUpdate.wgsl) | WGSL | 46 | 0 | 2 | 48 |
| [src/shaders/manager.ts](/src/shaders/manager.ts) | TypeScript | 68 | 0 | 11 | 79 |
| [src/shaders/position.frag.wgsl](/src/shaders/position.frag.wgsl) | WGSL | 7 | 0 | 0 | 7 |
| [src/shaders/tracing/BSDF.wgsl](/src/shaders/tracing/BSDF.wgsl) | WGSL | 56 | 14 | 10 | 80 |
| [src/shaders/tracing/accumulate.wgsl](/src/shaders/tracing/accumulate.wgsl) | WGSL | 59 | 9 | 10 | 78 |
| [src/shaders/tracing/common.wgsl](/src/shaders/tracing/common.wgsl) | WGSL | 54 | 1 | 10 | 65 |
| [src/shaders/tracing/light.wgsl](/src/shaders/tracing/light.wgsl) | WGSL | 37 | 2 | 4 | 43 |
| [src/shaders/tracing/rayGen.wgsl](/src/shaders/tracing/rayGen.wgsl) | WGSL | 217 | 80 | 23 | 320 |
| [src/shaders/tracing/reservoir.wgsl](/src/shaders/tracing/reservoir.wgsl) | WGSL | 103 | 11 | 10 | 124 |
| [src/shaders/tracing/sampleInit.wgsl](/src/shaders/tracing/sampleInit.wgsl) | WGSL | 108 | 14 | 15 | 137 |
| [src/shaders/tracing/slopeAABBTest.wgsl](/src/shaders/tracing/slopeAABBTest.wgsl) | WGSL | 535 | 5 | 33 | 573 |
| [src/shaders/tracing/spatialReuse.wgsl](/src/shaders/tracing/spatialReuse.wgsl) | WGSL | 94 | 16 | 9 | 119 |
| [src/shaders/tracing/trace.wgsl](/src/shaders/tracing/trace.wgsl) | WGSL | 143 | 16 | 20 | 179 |
| [src/shaders/utils.wgsl](/src/shaders/utils.wgsl) | WGSL | 37 | 23 | 13 | 73 |
| [src/shaders/vBuffer.wgsl](/src/shaders/vBuffer.wgsl) | WGSL | 65 | 15 | 10 | 90 |
| [src/util/box.ts](/src/util/box.ts) | TypeScript | 43 | 1 | 2 | 46 |
| [src/util/cube.ts](/src/util/cube.ts) | TypeScript | 40 | 7 | 2 | 49 |
| [src/util/math.ts](/src/util/math.ts) | TypeScript | 45 | 14 | 7 | 66 |
| [src/utils.ts](/src/utils.ts) | TypeScript | 4 | 0 | 1 | 5 |
| [src/vBuffer.ts](/src/vBuffer.ts) | TypeScript | 167 | 18 | 11 | 196 |

[Summary](results.md) / Details / [Diff Summary](diff.md) / [Diff Details](diff-details.md)