import { triangleData, BVH, BVHBuilder } from './bvh';


let bvh = new BVH();
self.onmessage = async (e) => {
    await new BVHBuilder(bvh, new triangleData(e.data.vertexArray, e.data.indexArray), (progress: number) => {
        postMessage("building bvh progress: " + (progress * 100).toPrecision(3) + "%");
    });
    let arrayBuffer = new ArrayBuffer(bvh.nodes.length * 8 * 4);
    let bvhFloatArray = new Float32Array(arrayBuffer);
    let bvhUintArray = new Uint32Array(arrayBuffer);
    for (let index = 0; index < bvh.nodes.length; index++) {
        let node = bvh.nodes[index];
        let offset = index * 8;
        bvhFloatArray.set(node.aabb.min, offset);
        bvhUintArray.set(new Uint32Array([(node.is_leaf ? 1 : 0) + node.Axis * 2]), offset + 3);
        bvhFloatArray.set(node.aabb.max, offset + 4);
        bvhUintArray.set(new Uint32Array([node.child]), offset + 7);
    }
    postMessage(bvh.maxDepth);
    postMessage(arrayBuffer, { transfer: [arrayBuffer] });
    self.close();
}

