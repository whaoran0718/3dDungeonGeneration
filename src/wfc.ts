import { mat4 } from "gl-matrix";
import { wfcSamples } from "./sample";

let rand = Math.random();

function randNext(){
    let d = Math.sin(rand * 10 * 127.1) * 43758.5453;
    rand = d - Math.floor(d);
    return rand;
}

class WFC
{
    // voxel index, tile index
    wave: boolean[][];
    // orientation, tile index, tile index
    propagator: number[][][];
    // voxel index, tile index, orientation
    compatible: number[][][];
    // voxel index
    voxels: number[];
    tiles: {name: string, modelMat: mat4}[];

    updateQueue: [number, number][];
    history: { type: number, 
               index: number,
               value: number[],
              }[];

    FMX: number;
    FMY: number;
    FMZ: number;
    S: number;  // voxel count
    T: number;  // tile count
    
    // tile index
    weights: number[];
    weightLog: number[];

    // voxel index
    sumsOfCounts: number[];
    sumsOfWeights: number[];
    sumsOfWeightLogs: number[];
    entropies: number[];

    sumOfWeight: number;
    sumOfWeightLog: number;
    startingEntropy: number;

    stop: boolean;
    goal: number;
    tileIdx: {[name: string]: [number, number]};

    constructor() {
        this.FMX = wfcSamples.resolution[0];
        this.FMY = wfcSamples.resolution[1];
        this.FMZ = wfcSamples.resolution[2];
        this.S = this.FMX * this.FMY * this.FMZ;
    }

    load() {
        this.tiles = new Array();
        this.weights = new Array();
        this.tileIdx = {};
        let action = new Array<number[]>();
        let firstIdx: {[name: string]: number} = {};
        for (let tile of wfcSamples.tiles) {
            let tilename = tile.name;
            let weight = tile.weight;
            let sym = tile.symmetry;
            let a, b, cardinality;
            switch(sym) {
                case 'L': {
                    cardinality = 4;
                    a = function(i: number) { return (i + 1) % 4; }
                    b = function(i: number) { return i % 2 == 0 ? i + 1 : i - 1; }
                    break;
                }
                case 'T': {
                    cardinality = 4;
                    a = function(i: number) { return (i + 1) % 4; }
                    b = function(i: number) { return i % 2 == 0 ? i : 4 - i; }
                    break;
                }
                case 'I': {
                    cardinality = 2;
                    a = function(i: number) { return 1 - i; }
                    b = function(i: number) { return i; }
                    break;
                }
                case '/': {
                    cardinality = 2;
                    a = function(i: number) { return 1 - i; }
                    b = function(i: number) { return 1 - i; }
                    break;
                }
                default : {
                    cardinality = 1;
                    a = function(i: number) { return i; }
                    b = function(i: number) { return i; }
                    break;
                }
            }
            let idx = action.length;
            let map = new Array<number[]>(cardinality);
            firstIdx[tilename] = idx;
            this.tileIdx[tilename] = [idx, cardinality];
            for (let t = 0; t < cardinality; t++) {
                map[t] = new Array<number>(8);
                map[t][0] = t + idx;
                map[t][1] = a(t) + idx;
                map[t][2] = a(a(t)) + idx;
                map[t][3] = a(a(a(t))) + idx;
                map[t][4] = b(t) + idx;
                map[t][5] = b(a(t)) + idx;
                map[t][6] = b(a(a(t))) + idx;
                map[t][7] = b(a(a(a(t)))) + idx;
                action.push(map[t]);
                
                let modelMat = mat4.create();
                mat4.rotateY(modelMat, modelMat, t * Math.PI / 2);
                this.tiles.push({
                    name: tilename,
                    modelMat: modelMat
                });
                this.weights.push(weight);
            }
        }

        this.T = action.length;
        this.propagator = new Array<number[][]>(6);
        let tempPropagator = new Array<boolean[][]>(6);
        for (let d = 0; d < 6; d++) {
            tempPropagator[d] = new Array<boolean[]>(this.T);
            this.propagator[d] = new Array<number[]>(this.T);
            for (let t = 0; t < this.T; t++) {
                tempPropagator[d][t] = new Array<boolean>(this.T).fill(false);
            }
        }

        for (let neighbor of wfcSamples.neighbors) {
            if (neighbor.left != undefined && neighbor.right != undefined) {
                let left = neighbor.left.split(" ");
                for (let rightTiles of neighbor.right) {
                    let right = rightTiles.split(" ");
                    if (firstIdx[left[0]] == undefined || firstIdx[right[0]] == undefined) continue;
                    let L = action[firstIdx[left[0]]][left.length == 1 ? 0 : parseInt(left[1])];
                    let R = action[firstIdx[right[0]]][right.length == 1 ? 0 : parseInt(right[1])];
                    let D = action[L][1];
                    let U = action[R][1];

                    tempPropagator[0][L][R] = true;
                    tempPropagator[0][action[L][6]][action[R][6]] = true;
                    tempPropagator[0][action[R][4]][action[L][4]] = true;
                    tempPropagator[0][action[R][2]][action[L][2]] = true;

                    tempPropagator[1][D][U] = true;
                    tempPropagator[1][action[U][6]][action[D][6]] = true;
                    tempPropagator[1][action[D][4]][action[U][4]] = true;
                    tempPropagator[1][action[U][2]][action[D][2]] = true;
                }
            }
            else if (neighbor.bottom != undefined && neighbor.top != undefined) {
                let bottom = neighbor.bottom.split(" ");
                for (let topTiles of neighbor.top) {
                    let top = topTiles.split(" ");
                    if (firstIdx[bottom[0]] == undefined || firstIdx[bottom[0]] == undefined) continue;
                    let B = action[firstIdx[bottom[0]]][bottom.length == 1 ? 0 : parseInt(bottom[1])];
                    let T = action[firstIdx[top[0]]][top.length == 1 ? 0 : parseInt(top[1])];

                    tempPropagator[4][B][T] = true;
                    for (let i = 0; i < 8; i++) {
                        tempPropagator[4][action[B][i]][action[T][i]] = true;
                    }
                }
            }
        }

        for (let t2 = 0; t2 < this.T; t2++) {
            for (let t1 = 0; t1 < this.T; t1++) {
                tempPropagator[2][t2][t1] = tempPropagator[0][t1][t2];
                tempPropagator[3][t2][t1] = tempPropagator[1][t1][t2];
                tempPropagator[5][t2][t1] = tempPropagator[4][t1][t2];
            }
        }

        for (let d = 0; d < 6; d++) {
            for (let t1 = 0; t1 < this.T; t1++) {
                let cp = new Array<number>();
                let tp = tempPropagator[d][t1];
                for (let t2 = 0; t2 < this.T; t2++) {
                    if (tp[t2]) cp.push(t2);
                }
                this.propagator[d][t1] = cp;
            }
        }
    }

    init() {
        this.wave = new Array<boolean[]>(this.S);
        this.compatible = new Array<number[][]>(this.S);
        for (let i = 0; i < this.S; i++) {
            this.wave[i] = new Array<boolean>(this.T);
            this.compatible[i] = new Array<number[]>(this.T);
            for (let t = 0; t < this.T; t++) {
                this.compatible[i][t] = new Array<number>(6);
            }
        }

        this.weightLog = new Array<number>(this.T);
        this.sumOfWeight = 0;
        this.sumOfWeightLog = 0;

        for (let t = 0; t < this.T; t++) {
            let weight = this.weights[t];
            this.weightLog[t] = weight * Math.log(weight);
            this.sumOfWeight += weight;
            this.sumOfWeightLog += this.weightLog[t];
        }

        this.startingEntropy = Math.log(this.sumOfWeight) - this.sumOfWeightLog / this.sumOfWeight;
        this.sumsOfCounts = new Array<number>(this.S);
        this.sumsOfWeights = new Array<number>(this.S);
        this.sumsOfWeightLogs = new Array<number>(this.S);
        this.entropies = new Array<number>(this.S);
    }

    preprocess() {
        this.reset();
        for (let i = 0; i < this.S; i++) {
            for (let t = 0; t <this.T; t++) {
                for (let d = 0; d < 6; d++) {
                    if (this.compatible[i][t][d] == 0) {
                        switch(d) {
                            case 0: { if(indexToCoord(i)[0] == 0) continue; else break; }
                            case 1: { if(indexToCoord(i)[2] == this.FMZ - 1) continue; else break; }
                            case 2: { if(indexToCoord(i)[0] == this.FMX - 1) continue; else break; }
                            case 3: { if(indexToCoord(i)[2] == 0) continue; else break; }
                            case 4: { if(indexToCoord(i)[1] == 0) continue; else break; }
                            case 5: { if(indexToCoord(i)[1] == this.FMY - 1) continue; else break; }
                        }
                        this.ban(i, t);
                        break;
                    }
                }
            }
        }
        for (let limit of wfcSamples.limits) {
            let expList = new Array<number>();
            let expTileNames = limit.tiles.split(" ");
            for (let t = 0; t < this.T; t++) {
                let name = this.tiles[t].name;
                if (expTileNames.find(function(tilename) {
                    return name == tilename;
                }) == undefined)
                {
                    expList.push(t);
                }
            }

            for (let x = limit.min[0]; x < limit.max[0]; x++) {
                for (let y = limit.min[1]; y < limit.max[1]; y++) {
                    for (let z = limit.min[2]; z < limit.max[2]; z++) {
                        for (let t of expList) {
                            this.ban(coordToIndex([x, y, z]), t);
                        }
                    }
                }
            }
        }

        this.propagate();
        let potentialGoal = new Array<number>();
        let [tileidx, offset] = this.tileIdx["goal"];
        for (let i = 0; i < this.S; i++) {
            for (let j = 0; j < offset; j++) {
                if (this.wave[i][j + tileidx]) { potentialGoal.push(i); break; }
            }
        }
        let randIdx = Math.floor(randNext() * potentialGoal.length);
        this.goal = potentialGoal[randIdx];
        let coord = indexToCoord(randIdx);
        if (offset == 4) {
            if (coord[0] == 0) this.ban(randIdx, tileidx + 1);
            if (coord[0] == this.FMX - 1) this.ban(randIdx, tileidx + 3);
            if (coord[2] == 0) this.ban(randIdx, tileidx);
            if (coord[2] == this.FMZ - 1) this.ban(randIdx, tileidx + 2);
        }
        
        for (let i = 0; i < this.S; i++) {
            if (i == this.goal) {
                for (let t = 0; t < this.T; t++) {
                    if (t == tileidx) t += offset;
                    this.ban(i, t);
                }
            }
            else {
                for (let j = 0; j < offset; j++) {
                    this.ban(i, tileidx + j);
                }
            }
        }
        this.propagate();
        this.history = new Array();
    }

    process(iter: number) {
        if (this.wave == undefined) this.init();
        this.preprocess();
        let maxIter = Math.min(this.S * this.T + 1, iter);
        for (let i = 0; i < maxIter; i++) {
            if(this.stop) return true;
            if(!this.step()) break;
        }
        return false;
    }

    step() {
        let e = this.collapse();
        while(!e) {
            if (this.stop)  return true;
            if (!this.collapseWithdraw()) return false;
            e = this.collapse();
        }
        this.propagate();
        return true;
    }

    bake() {
        for (let i = 0; i < this.S; i++) {
            if (this.sumsOfCounts[i] != 1) {
                this.voxels[i] = -1;
                continue;
            }
            for (let t = 0; t < this.T; t++) {
                if (this.wave[i][t]) {
                    this.voxels[i] = t;
                    break;
                }
            }
        }
    }

    collapse() {
        let min = 1e+3;
        let minIdx = -1;
        for (let i = 0; i < this.S; i++) {
            let amount = this.sumsOfCounts[i];
            if (amount == 0) return false;
            
            let entropy = this.entropies[i];
            if (amount > 1 && entropy <= min) {
                let noise = randNext() * 1e-6;
                if (entropy + noise < min) {
                    min = entropy + noise;
                    minIdx = i;
                }
            }
        }

        if (minIdx == -1) {
            this.stop = true;
            return false;
        }

        let rec = this.record(0, minIdx, []);
        let randw = randNext() * this.sumsOfWeights[minIdx];
        let w = 0, r = -1;
        for (let t = 0; t < this.T; t++) {
            if (!this.wave[minIdx][t]) continue;
            w += this.weights[t];
            if (r == -1 && w >= randw)  {
                rec.value = [t];
                r = t;
            }
            else this.ban(minIdx, t);
        }
        return true;
    }


    propagate() {
        while(this.updateQueue.length > 0) {
            let [i1, t1] = this.updateQueue.pop();
            let [x1, y1, z1] = indexToCoord(i1);
            for (let d = 0; d < 6; d++) {
                let x2 = x1 + bias[d][0];
                let y2 = y1 + bias[d][1];
                let z2 = z1 + bias[d][2];
                if (!inBound([x2, y2, z2])) continue;

                let i2 = coordToIndex([x2, y2, z2]);
                for (let t2 of this.propagator[d][t1]) {
                    let comp = this.compatible[i2][t2];
                    if (comp[d] == 0) continue;
                    comp[d]--;
                    this.record(2, i2, [t2, d]);
                    if (comp[d] == 0) this.ban(i2, t2);
                }
            }
        }
    }

    ban(i: number, t: number) {
        if (!this.wave[i][t]) return;
        this.wave[i][t] = false;
        let comp = this.compatible[i][t];
        let rec = new Array<number>(7);
        rec[0] = t;
        for (let d = 0; d < 6; d++) {
            rec[d + 1] = comp[d];
            comp[d] = 0;
        }
        this.updateQueue.unshift([i, t]);

        this.sumsOfCounts[i]--;
        this.sumsOfWeights[i] -= this.weights[t];
        this.sumsOfWeightLogs[i] -= this.weightLog[t];
        this.entropies[i] = Math.log(this.sumsOfWeights[i]) - this.sumsOfWeightLogs[i] / this.sumsOfWeights[i];
        this.record(1, i, rec);
    }

    reset() {
        this.stop = false;
        this.history = new Array();
        this.updateQueue = new Array();
        this.voxels = new Array<number>(this.S).fill(-1);
        for (let i = 0; i < this.S; i++) {
            for (let t = 0; t <this.T; t++) {
                this.wave[i][t] = true;
                for (let d = 0; d < 6; d++) {
                    this.compatible[i][t][d] = this.propagator[opposit[d]][t].length;
                }
            }
            this.sumsOfCounts[i] = this.T;
            this.sumsOfWeights[i] = this.sumOfWeight;
            this.sumsOfWeightLogs[i] = this.sumOfWeightLog;
            this.entropies[i] = this.startingEntropy;
        }
    }

    record(type: number, index: number, value: number[]) {
        let his = {
            type: type, 
            index: index,
            value: value,
        };
        this.history.push(his);
        return his;
    }

    undo() {
        let his = this.history.pop();
        switch(his.type) {
            case 0: {
                break;
            }
            case 1: {
                let i = his.index;
                let t = his.value[0];
                this.wave[i][t] = true;
                for (let d = 0; d < 6; d++) {
                    this.compatible[i][t][d] = his.value[d + 1];
                }
                this.sumsOfCounts[i]++;
                this.sumsOfWeights[i] += this.weights[t];
                this.sumsOfWeightLogs[i] += this.weightLog[t];
                this.entropies[i] = Math.log(this.sumsOfWeights[i]) - this.sumsOfWeightLogs[i] / this.sumsOfWeights[i];
                break;
            }
            case 2: {
                let i = his.index;
                let t = his.value[0];
                let d = his.value[1];
                this.compatible[i][t][d]++;
                break;
            }
        }
        return his;
    }

    collapseWithdraw() {
        if (this.history.length == 0) return false;
        let his = this.undo();
        while (his.type != 0) {
            if (this.history.length == 0) return false;
            his = this.undo();
        }
        let i = his.index;
        let t = his.value[0];
        this.ban(i, t);
        return true;
    }
}

export function indexToCoord(index: number) {
    let FMX = wfcSamples.resolution[0];
    let FMZ = wfcSamples.resolution[2];
    let y = Math.floor(index / (FMX * FMZ));
    let z = Math.floor((index - y * FMX * FMZ) / FMX);
    let x = index - y * FMX * FMZ - z * FMX;
    return [x, y, z];
}

export function coordToIndex(coord: number[]) {
    let FMX = wfcSamples.resolution[0];
    let FMZ = wfcSamples.resolution[2];
    return coord[0] + coord[1] * FMX * FMZ + coord[2] * FMX;
}

export function inBound(coord: number[]) {
    return coord[0] >= 0 && coord[0] < wfcSamples.resolution[0] &&
           coord[1] >= 0 && coord[1] < wfcSamples.resolution[1] &&
           coord[2] >= 0 && coord[2] < wfcSamples.resolution[2];
}

let bias = [
    [1, 0, 0],
    [0, 0, -1],
    [-1, 0, 0],
    [0, 0, 1],
    [0, 1, 0],
    [0, -1, 0],
];

// 0: right (x+)
// 1: back  (z-)
// 2: left  (x-)
// 3: front (z+)
// 4: top   (y+)
// 5: bottom(y-)
let opposit = [2, 3, 0, 1, 5, 4];

export default WFC;