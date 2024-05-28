class AABB {
    min: Float32Array = new Float32Array([Infinity, Infinity, Infinity]);
    max: Float32Array = new Float32Array([-Infinity, -Infinity, -Infinity]);

    constructor(points: Float32Array = new Float32Array(0), count: number = 0) {
        for (let i = 0; i < count; i++) {
            for (let j = 0; j < 3; j++) {
                this.min[j] = Math.min(this.min[j], points[i * 3 + j]);
                this.max[j] = Math.max(this.max[j], points[i * 3 + j]);
            }
        }
    }
    empty(): boolean {
        const eq = (a: Float32Array, b: Float32Array): boolean =>
            a.every((v, i) => v == b[i]);
        return eq(this.min, new Float32Array([Infinity, Infinity, Infinity])) &&
            eq(this.max, new Float32Array([-Infinity, -Infinity, -Infinity]));
    }
    fix(): void {
        if (this.empty()) return;
        const EPSILON = 1e-3;
        for (let dimension = 0; dimension < 3; dimension++) {
            let eps = EPSILON
            while (this.max[dimension] - this.min[dimension] < eps) {
                this.min[dimension] -= eps;
                this.max[dimension] += eps;
                eps *= 2;
            }
        }
    }
    surfaceArea(): number {
        if (this.empty()) return 0;
        const delta = this.max.map((v, i) => v - this.min[i]);

        return 2 * (delta[0] * delta[1] + delta[1] * delta[2] + delta[2] * delta[0]);
    }
    expand(aabb: AABB): void {
        this.max = this.max.map((v, i) => Math.max(v, aabb.max[i]));
        this.min = this.min.map((v, i) => Math.min(v, aabb.min[i]));
    }
    center(): Float32Array {
        return this.min.map((v, i) => (v + this.max[i]) / 2);
    }

    static union(a: AABB, b: AABB): AABB {
        const result = new AABB();
        result.min = a.min.map((v, i) => Math.min(v, b.min[i]));
        result.max = a.max.map((v, i) => Math.max(v, b.max[i]));
        return result;
    }

    static intersect(a: AABB, b: AABB): AABB {
        const result = new AABB();
        result.min = a.min.map((v, i) => Math.max(v, b.min[i]));
        result.max = a.max.map((v, i) => Math.min(v, b.max[i]));
        return result;
    }
}

class triangleData {
    vertexArray: Float32Array;
    indexArray: Uint32Array;
    constructor(vertexArray: Float32Array, indexArray: Uint32Array) {
        this.vertexArray = vertexArray;
        this.indexArray = indexArray;
    }
    size(): number {
        return this.indexArray.length / 3;
    }
    at(index: number): Float32Array {
        let ret = new Float32Array(9);
        for (let i = 0; i < 3; i++) {
            const bias = this.indexArray[index * 3 + i], offset = i * 3;
            ret.set(this.vertexArray.slice(bias * 4, bias * 4 + 3), offset);
        }
        return ret;
    }
}

class triangle {
    index: number = 0;
    aabb: AABB = new AABB();
}

enum Axis {
    X,
    Y,
    Z
};

class node {
    aabb: AABB;
    child: number;// is_leaf? triangle's index in triangleView: left
    is_leaf: boolean = false;
    Axis: Axis = Axis.X;
}

class BVH {
    nodes: Array<node> = [];
    maxDepth: number = 0;
}

class BVHBuilder {
    bvh: BVH;
    triangleView: Array<triangle> = [];
    address: number = 0;
    onProgress: (progress: number) => void = (progress: number) => { };
    constructor(bvh: BVH, triangles: triangleData, onProgress?: (progress: number) => void) {
        console.log("building BVH");
        let start = new Date().getTime();
        this.onProgress = onProgress || this.onProgress;
        this.bvh = bvh;
        const trianglesCnt = triangles.size();
        this.triangleView = new Array<triangle>(trianglesCnt);
        for (let i = 0; i < trianglesCnt; i++) {
            this.triangleView[i] = new triangle();
            this.triangleView[i].index = i;
            this.triangleView[i].aabb = new AABB(triangles.at(i), 3);
        }
        this.bvh.nodes = new Array<node>(2 * trianglesCnt - 1);
        for (let i = 0; i < this.bvh.nodes.length; i++)
            this.bvh.nodes[i] = new node();
        this.address = 1;
        this.build(0, 0, trianglesCnt, 1);
        // in seconds
        console.log("BVH built time: ", (new Date().getTime() - start) / 1000, "s");
        console.log("maxDepth:", this.bvh.maxDepth);
    }
    handledNodes: number = 0;
    build(parent: number, begin: number, cnt: number, depth: number): void {
        if (depth > this.bvh.maxDepth)
            this.bvh.maxDepth = depth;
        this.handledNodes++;
        if (this.handledNodes % Math.ceil(this.bvh.nodes.length / 25) == 0)
            this.onProgress(this.handledNodes / this.bvh.nodes.length);
        if (cnt == 1) {
            this.bvh.nodes[parent].aabb = this.triangleView[begin].aabb;
            this.bvh.nodes[parent].is_leaf = true;
            this.bvh.nodes[parent].child = this.triangleView[begin].index;
            return;
        }
        // copy the triangleView to a temporary array
        let triangleViewTmp = this.triangleView.slice(begin, begin + cnt);
        const bounds = new AABB();
        triangleViewTmp.forEach((v, i) => { bounds.expand(v.aabb); });
        this.bvh.nodes[parent].aabb = bounds;
        this.bvh.nodes[parent].is_leaf = false;
        const left = this.address++;
        const right = this.address++;
        this.bvh.nodes[parent].child = left;

        // partition in [begin,end)
        function partition<T>(arr: Array<T>, begin: number, end: number, cmp: (a: T) => boolean): number {
            if (end - begin <= 1) return begin;
            end--;
            while (begin < end) {
                while (begin < end && cmp(arr[begin])) begin++;
                while (begin < end && !cmp(arr[end])) end--;
                if (begin < end) {
                    [arr[begin], arr[end]] = [arr[end], arr[begin]];
                }
            }
            return begin;
        }

        // centroid bounds
        const centroidBounds = new AABB();
        triangleViewTmp.forEach((v, i) => { centroidBounds.expand(new AABB(v.aabb.center(), 1)); });
        // return the axis with the largest extent
        const splitAxis = centroidBounds.max.reduce((acc, cur, i) => {
            const diff = cur - centroidBounds.min[i];
            return diff > acc.maxDiff ? { maxIndex: i, maxDiff: diff } : acc;
        }, { maxIndex: -1, maxDiff: -Infinity }).maxIndex as Axis;
        this.bvh.nodes[parent].Axis = splitAxis;
        let splitResult = { minCostCnt: 0, minCost: Infinity };
        // for (let splitAxis = Axis.X; splitAxis <= Axis.Z; splitAxis++) 
        if (cnt >= 16 && centroidBounds.min[splitAxis] != centroidBounds.max[splitAxis]) {
            const BIN_COUNT = 12;
            const buckets = new Array<{ cnt: number, aabb: AABB }>(BIN_COUNT)
            for (let i = 0; i < BIN_COUNT; i++) {
                buckets[i] = { cnt: 0, aabb: new AABB() };
            }
            triangleViewTmp.forEach((v, i) => {
                let b = Math.min(Math.floor((v.aabb.center()[splitAxis] - centroidBounds.min[splitAxis]) / (centroidBounds.max[splitAxis] - centroidBounds.min[splitAxis]) * BIN_COUNT), BIN_COUNT - 1);
                buckets[b].cnt++;
                buckets[b].aabb.expand(v.aabb);
            });

            let leftCosts = new Array<number>(BIN_COUNT).fill(0);
            let rightCosts = new Array<number>(BIN_COUNT).fill(0);
            let leftCnt = 0, rightCnt = 0;
            let leftAABB = new AABB(), rightAABB = new AABB();
            for (let i = 0; i < BIN_COUNT - 1; i++) {
                leftAABB.expand(buckets[i].aabb);
                rightAABB.expand(buckets[BIN_COUNT - 1 - i].aabb);
                leftCnt += buckets[i].cnt;
                rightCnt += buckets[BIN_COUNT - 1 - i].cnt;
                leftCosts[i] = leftAABB.surfaceArea() * leftCnt;
                rightCosts[BIN_COUNT - 1 - i] = rightAABB.surfaceArea() * rightCnt;
            }

            let minCost = Infinity;
            let bucketIndex = 0;
            for (let i = 0; i < BIN_COUNT - 1; i++) {
                let cost = leftCosts[i] + rightCosts[i + 1]
                if (cost < minCost) {
                    minCost = cost;
                    bucketIndex = i;
                }
            }
            if (minCost < splitResult.minCost) {
                splitResult.minCost = minCost;
                splitResult.minCostCnt = partition(this.triangleView, begin, begin + cnt, (v) => {
                    let b = Math.min(Math.floor((v.aabb.center()[splitAxis] - centroidBounds.min[splitAxis]) / (centroidBounds.max[splitAxis] - centroidBounds.min[splitAxis]) * BIN_COUNT), BIN_COUNT - 1);
                    return b <= bucketIndex;
                }) - begin;
            }
        }
        else {
            triangleViewTmp.sort((a, b) => { return a.aabb.center()[splitAxis] - b.aabb.center()[splitAxis]; });
            let left = new Array<number>(cnt).fill(0);
            let right = new Array<number>(cnt).fill(0);
            let leftAABB = new AABB();
            let rightAABB = new AABB();
            for (let i = 0; i < cnt - 1; i++) {
                leftAABB.expand(triangleViewTmp[i].aabb);
                rightAABB.expand(triangleViewTmp[cnt - 1 - i].aabb);
                left[i] = leftAABB.surfaceArea();
                right[cnt - 1 - i] = rightAABB.surfaceArea();
            }
            let minCost = Infinity;
            let minCostCnt = 0;
            for (let i = 0; i < cnt - 1; i++) {
                let cost = (i + 1) * left[i] + (cnt - i - 1) * right[i + 1];
                if (cost < minCost) {
                    minCost = cost;
                    minCostCnt = i;
                }
            }
            if (minCost < splitResult.minCost) {
                splitResult.minCost = minCost;
                splitResult.minCostCnt = minCostCnt + 1;
                for (let i = 0; i < cnt; i++)
                    this.triangleView[begin + i] = triangleViewTmp[i];
            }
        }
        this.build(left, begin, splitResult.minCostCnt, depth + 1);
        this.build(right, begin + splitResult.minCostCnt, cnt - splitResult.minCostCnt, depth + 1);
    }
}

export { triangleData, BVH, BVHBuilder };