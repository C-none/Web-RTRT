# Details

Date : 2024-06-01 14:31:13

Directory d:\\BaiduNetdiskDownload\\Web-RTRT\\src

Total : 50 files,  7930 codes, 1064 comments, 1078 blanks, all 10072 lines

[Summary](results.md) / Details / [Diff Summary](diff.md) / [Diff Details](diff-details.md)

## Files
| filename | language | code | comment | blank | total |
| :--- | :--- | ---: | ---: | ---: | ---: |
| [src/bvh.ts](/src/bvh.ts) | TypeScript | 231 | 6 | 15 | 252 |
| [src/camera.ts](/src/camera.ts) | TypeScript | 115 | 20 | 11 | 146 |
| [src/computeWorker.ts](/src/computeWorker.ts) | TypeScript | 21 | 0 | 4 | 25 |
| [src/denoiser.ts](/src/denoiser.ts) | TypeScript | 451 | 6 | 28 | 485 |
| [src/device.ts](/src/device.ts) | TypeScript | 84 | 2 | 10 | 96 |
| [src/display.ts](/src/display.ts) | TypeScript | 830 | 33 | 48 | 911 |
| [src/gltf.ts](/src/gltf.ts) | TypeScript | 378 | 26 | 25 | 429 |
| [src/light.ts](/src/light.ts) | TypeScript | 84 | 1 | 4 | 89 |
| [src/main.ts](/src/main.ts) | TypeScript | 448 | 38 | 39 | 525 |
| [src/modelView.ts](/src/modelView.ts) | TypeScript | 64 | 18 | 31 | 113 |
| [src/raytracing.ts](/src/raytracing.ts) | TypeScript | 544 | 6 | 18 | 568 |
| [src/sample.ts](/src/sample.ts) | TypeScript | 319 | 62 | 17 | 398 |
| [src/screenBuffer.ts](/src/screenBuffer.ts) | TypeScript | 71 | 0 | 4 | 75 |
| [src/shaders/FSR2/FSR_common.wgsl](/src/shaders/FSR2/FSR_common.wgsl) | WGSL | 370 | 30 | 60 | 460 |
| [src/shaders/FSR2/FXAA.wgsl](/src/shaders/FSR2/FXAA.wgsl) | WGSL | 212 | 61 | 70 | 343 |
| [src/shaders/FSR2/depthClip.wgsl](/src/shaders/FSR2/depthClip.wgsl) | WGSL | 233 | 69 | 86 | 388 |
| [src/shaders/FSR2/display.wgsl](/src/shaders/FSR2/display.wgsl) | WGSL | 506 | 169 | 198 | 873 |
| [src/shaders/FSR2/lock.wgsl](/src/shaders/FSR2/lock.wgsl) | WGSL | 122 | 30 | 31 | 183 |
| [src/shaders/FSR2/racs.wgsl](/src/shaders/FSR2/racs.wgsl) | WGSL | 122 | 67 | 17 | 206 |
| [src/shaders/FSR2/reconstruct_dilated.wgsl](/src/shaders/FSR2/reconstruct_dilated.wgsl) | WGSL | 212 | 59 | 77 | 348 |
| [src/shaders/basic.instanced.vert.wgsl](/src/shaders/basic.instanced.vert.wgsl) | WGSL | 18 | 0 | 4 | 22 |
| [src/shaders/compute.position.wgsl](/src/shaders/compute.position.wgsl) | WGSL | 50 | 10 | 5 | 65 |
| [src/shaders/denoise/atrous.wgsl](/src/shaders/denoise/atrous.wgsl) | WGSL | 85 | 14 | 11 | 110 |
| [src/shaders/denoise/denoiseAccum.wgsl](/src/shaders/denoise/denoiseAccum.wgsl) | WGSL | 26 | 4 | 5 | 35 |
| [src/shaders/denoise/denoiseCommon.wgsl](/src/shaders/denoise/denoiseCommon.wgsl) | WGSL | 10 | 1 | 3 | 14 |
| [src/shaders/denoise/filterVariance.wgsl](/src/shaders/denoise/filterVariance.wgsl) | WGSL | 54 | 2 | 9 | 65 |
| [src/shaders/denoise/firefly.wgsl](/src/shaders/denoise/firefly.wgsl) | WGSL | 88 | 8 | 12 | 108 |
| [src/shaders/denoise/preloadInvoker.wgsl](/src/shaders/denoise/preloadInvoker.wgsl) | WGSL | 13 | 0 | 0 | 13 |
| [src/shaders/denoise/temperalAccum.wgsl](/src/shaders/denoise/temperalAccum.wgsl) | WGSL | 155 | 22 | 19 | 196 |
| [src/shaders/lightUpdate.wgsl](/src/shaders/lightUpdate.wgsl) | WGSL | 46 | 0 | 2 | 48 |
| [src/shaders/manager.ts](/src/shaders/manager.ts) | TypeScript | 82 | 1 | 15 | 98 |
| [src/shaders/position.frag.wgsl](/src/shaders/position.frag.wgsl) | WGSL | 7 | 0 | 0 | 7 |
| [src/shaders/raw_display.wgsl](/src/shaders/raw_display.wgsl) | WGSL | 32 | 25 | 7 | 64 |
| [src/shaders/tracing/BSDF.wgsl](/src/shaders/tracing/BSDF.wgsl) | WGSL | 56 | 15 | 11 | 82 |
| [src/shaders/tracing/accumulate.wgsl](/src/shaders/tracing/accumulate.wgsl) | WGSL | 66 | 18 | 11 | 95 |
| [src/shaders/tracing/common.wgsl](/src/shaders/tracing/common.wgsl) | WGSL | 54 | 1 | 10 | 65 |
| [src/shaders/tracing/light.wgsl](/src/shaders/tracing/light.wgsl) | WGSL | 37 | 2 | 4 | 43 |
| [src/shaders/tracing/rayGen.wgsl](/src/shaders/tracing/rayGen.wgsl) | WGSL | 241 | 77 | 20 | 338 |
| [src/shaders/tracing/reservoir.wgsl](/src/shaders/tracing/reservoir.wgsl) | WGSL | 99 | 16 | 10 | 125 |
| [src/shaders/tracing/sampleInit.wgsl](/src/shaders/tracing/sampleInit.wgsl) | WGSL | 112 | 15 | 15 | 142 |
| [src/shaders/tracing/slopeAABBTest.wgsl](/src/shaders/tracing/slopeAABBTest.wgsl) | WGSL | 535 | 5 | 33 | 573 |
| [src/shaders/tracing/spatialReuse.wgsl](/src/shaders/tracing/spatialReuse.wgsl) | WGSL | 102 | 16 | 11 | 129 |
| [src/shaders/tracing/trace.wgsl](/src/shaders/tracing/trace.wgsl) | WGSL | 143 | 16 | 20 | 179 |
| [src/shaders/utils.wgsl](/src/shaders/utils.wgsl) | WGSL | 38 | 38 | 15 | 91 |
| [src/shaders/vBuffer.wgsl](/src/shaders/vBuffer.wgsl) | WGSL | 65 | 15 | 10 | 90 |
| [src/util/box.ts](/src/util/box.ts) | TypeScript | 43 | 1 | 2 | 46 |
| [src/util/cube.ts](/src/util/cube.ts) | TypeScript | 40 | 7 | 2 | 49 |
| [src/util/math.ts](/src/util/math.ts) | TypeScript | 45 | 14 | 7 | 66 |
| [src/utils.ts](/src/utils.ts) | TypeScript | 4 | 0 | 1 | 5 |
| [src/vBuffer.ts](/src/vBuffer.ts) | TypeScript | 167 | 18 | 11 | 196 |

[Summary](results.md) / Details / [Diff Summary](diff.md) / [Diff Details](diff-details.md)