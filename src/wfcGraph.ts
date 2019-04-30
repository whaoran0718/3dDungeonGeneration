import Drawable from "./rendering/gl/Drawable";
import Mesh, { MeshLoader } from "./geometry/Mesh";
import { wfcSamples } from "./sample";
import WFC, { indexToCoord } from "./wfc";
import { mat4 } from "gl-matrix";

class WFCGraph
{
    meshes: Array<Drawable>;
    meshPrims: {[name: string]: MeshLoader};
    voxels: Array<number>;

    constructor() {}

    init() {
        this.meshPrims = {};
        for (let t of wfcSamples.tiles) {
            if ("obj" in t) {
                let meshPrim = new MeshLoader(t.obj);
                meshPrim.load();
                this.meshPrims[t.name] = meshPrim;
            }
            else {
                this.meshPrims[t.name] = undefined;
            }
        }
        this.voxels = new Array<number>()
        this.meshes = new Array<Drawable>();
    }

    create(wfc: WFC) {
        if (this.voxels.length != wfc.S) this.voxels = new Array<number>(wfc.S).fill(-1);
        if (this.meshes.length != wfc.S) this.meshes = new Array<Drawable>(wfc.S);
        let l_2 = wfc.FMX / 2 - 0.5;
        let w_2 = wfc.FMZ / 2 - 0.5;
        let h_2 = wfc.FMY / 2 - 0.5;
        for (let i = 0; i < wfc.S; i++) {
            let index = wfc.voxels[i];
            if (this.voxels[i] == index) continue;
            this.voxels[i] = index;
            
            if (this.meshes[i] != undefined) {
                if (index == -1) {
                    this.meshes[i].destory(); 
                    this.meshes[i] == undefined;
                    continue; 
                }
                this.meshes[i].destory(); 
                this.meshes[i] == undefined;
            }

            if (index == -1) continue;
            let tile = wfc.tiles[index];
            if (this.meshPrims[tile.name] == undefined) continue;

            let [x, y, z] = indexToCoord(i);
            x -= l_2;
            y -= h_2;
            z -= w_2;
            let modMat = mat4.clone(tile.modelMat);
            modMat[12] = x;
            modMat[13] = y;
            modMat[14] = z;
            let mesh = new Mesh(this.meshPrims[tile.name], modMat);
            mesh.create();
            this.meshes[i] = mesh;
        }
    }

    destory() {
        for(let i = 0; i < this.meshes.length; i++) {
            if (this.meshes[i] != undefined) this.meshes[i].destory();
        }
        this.voxels = new Array<number>()
        this.meshes = new Array<Drawable>();
    }
}

export default WFCGraph;