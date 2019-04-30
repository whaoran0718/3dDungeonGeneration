import {vec3, vec4, mat3, mat4 } from 'gl-matrix';
import WFC, { indexToCoord, coordToIndex, inBound } from './wfc';
import { wfcSamples } from './sample';
import Mesh, { MeshLoader } from './geometry/Mesh';
import Camera from './Camera';

export let wPressed: boolean = false;
export let aPressed: boolean = false;
export let sPressed: boolean = false;
export let dPressed: boolean = false;
export let spacePressed: boolean = false;

export default class Player
{
    pos: vec3;
    speed: number = 0.08;
    height: number = 0.5;
    rayCount: number = 5;
    rayOri: vec3[];
    gravity: number = -0.005;
    velY: number = 0.0;
    jumpSpeed = 0.12;
    size: vec3;
    colMesh: vec3[][];
    colNor: vec3[][];
    colIdx: vec3[][];
    loaded: boolean;

    meshLoader: MeshLoader;
    mesh: Mesh;
    camera: Camera;

    constructor() {
        this.loaded = false;
        this.pos = vec3.fromValues(0, 0, 0);
        this.size = vec3.create();
        let h = vec3.fromValues(0, this.height, 0);
        vec3.scale(h, h, 1 / (this.rayCount - 1));
        this.rayOri = new Array<vec3>(this.rayCount);
        this.rayOri[0] = vec3.create();
        for (let i = 1; i < this.rayCount; i++) {
            this.rayOri[i] = vec3.create();
            vec3.add(this.rayOri[i], this.rayOri[i - 1], h);
        }
        this.meshLoader = new MeshLoader("./model/character.obj");
        this.meshLoader.load();
        this.mesh = new Mesh(this.meshLoader, mat4.create());
        this.mesh.create();

        window.addEventListener("keypress", function(e) {
            switch(e.key) {
                case 'w':
                wPressed = true;
                break;
                case 'a':
                aPressed = true;
                break;
                case 's':
                sPressed = true;
                break;     
                case 'd':
                dPressed = true;
                break;
                default: break;
            }
            if (e.keyCode == 32) spacePressed = true;
        }, false);
         
        window.addEventListener('keyup', function (e) {
            switch(e.key) {
                case 'w':
                wPressed = false;
                break;
                case 'a':
                aPressed = false;
                break;
                case 's':
                sPressed = false;
                break;
                case 'd':
                dPressed = false;
                break;
                default: break;
              }
        }, false);


    }

    loadCollider(wfc: WFC) {
        this.size[0] = wfc.FMX;
        this.size[1] = wfc.FMY;
        this.size[2] = wfc.FMZ;
        
        this.pos = vec3.fromValues(0, this.size[1], 0);

        let prims: {[name: string]: MeshLoader} = {};
        for (let t of wfcSamples.tiles) {
            if ("collider" in t) {
                let meshPrim = new MeshLoader(t.collider);
                meshPrim.load();
                prims[t.name] = meshPrim;
            }
            else {
                prims[t.name] = undefined;
            }
        }

        let l_2 = wfc.FMX / 2 - 0.5;
        let w_2 = wfc.FMZ / 2 - 0.5;
        let h_2 = wfc.FMY / 2 - 0.5;
        this.colMesh = new Array<vec3[]>(wfc.S);
        this.colNor = new Array<vec3[]>(wfc.S);
        this.colIdx = new Array<vec3[]>(wfc.S);
        for (let i = 0; i < wfc.S; i++) {
            let tris = new Array<vec3>();
            this.colMesh[i] = tris;
            let trisNor = new Array<vec3>();
            this.colNor[i] = trisNor;
            let idx = new Array<vec3>();
            this.colIdx[i] = idx;

            if (wfc.voxels[i] == -1) continue;
            let tile = wfc.tiles[wfc.voxels[i]];
            if (prims[tile.name] == undefined) continue;

            let [x, y, z] = indexToCoord(i);
            x -= l_2;
            y -= h_2;
            z -= w_2;
            let modMat = mat4.clone(tile.modelMat);
            modMat[12] = x;
            modMat[13] = y;
            modMat[14] = z;

            let transform = mat4.clone(modMat);
            let invTranspose = mat3.create();
            mat3.fromMat4(invTranspose, transform);
            mat3.invert(invTranspose, invTranspose);
            mat3.transpose(invTranspose, invTranspose);

            let mesh = prims[tile.name];
            for (let j = 0; j < mesh.positions.length / 4; j++) {
                let pos = vec4.fromValues(mesh.positions[j * 4],
                                          mesh.positions[j * 4 + 1],
                                          mesh.positions[j * 4 + 2],
                                          mesh.positions[j * 4 + 3]);
                vec4.transformMat4(pos, pos, transform);
                tris.push(vec3.fromValues(pos[0], pos[1], pos[2]));
            }

            for (let j = 0; j < mesh.normals.length / 4; j++) {
                let nor = vec3.fromValues(mesh.normals[j * 4],
                                          mesh.normals[j * 4 + 1],
                                          mesh.normals[j * 4 + 2]);
                vec3.transformMat3(nor, nor, invTranspose);
                vec3.normalize(nor, nor);
                trisNor.push(nor);
            }

            for (let j = 0; j < mesh.indices.length / 3; j++) {
                idx.push(vec3.fromValues(mesh.indices[j * 3],
                                         mesh.indices[j * 3 + 1],
                                         mesh.indices[j * 3 + 2]));
            }
        }
        this.loaded = true;
    }

    update(t: number) {
        let d = vec3.create();
        if (wPressed) {
            d[2] += 1;
        }
        if (sPressed) {
            d[2] -= 1;
        }
        if (dPressed) {
            d[0] += 1;
        }
        if (aPressed) {
            d[0] -= 1;
        }
        
        let l = vec3.length(d);
        vec3.scale(d, d, l > 0 ? this.speed * t / l : 0.0);
        let norm = vec3.create();
        let onground = this.onGround(norm);
        if (!onground) {
            this.velY =  Math.min(Math.max(this.velY + this.gravity * t, -0.5), 0.5);
            spacePressed = false;
        }
        else this.velY = 0.0;

        if (onground && spacePressed) {
            this.velY = this.jumpSpeed;
            spacePressed = false;
        }

        let p = vec3.clone(this.pos);
        if (this.camera != undefined) {
            let vx = vec3.create();
            vec3.scale(vx, this.camera.right, d[0]);
            let vz = vec3.create();
            let forward = vec3.clone(this.camera.forward);
            forward[1] = 0;
            vec3.normalize(forward, forward);
            vec3.scale(vz, forward, d[2]);
            let vy = d[1]
            vec3.add(d, vx, vz);
            d[1] = vy;
        }

        if (onground && vec3.sqrLen(d) > 1e-6) {
            let v = vec3.create();
            vec3.cross(v, d, norm);
            vec3.cross(v, norm, v);
            vec3.scale(d, v, this.speed * t / vec3.length(v));
        }
        else {
            d[1] += this.velY * t;
        }

        this.resolveCollision(d);
        let epsilon = 1e-2;
        this.pos[0] = Math.max(Math.min(this.pos[0], this.size[0] / 2 - epsilon), -this.size[0] / 2 + epsilon);
        this.pos[1] = Math.max(this.pos[1], -this.size[1] / 2 + epsilon);
        this.pos[2] = Math.max(Math.min(this.pos[2], this.size[2] / 2 - epsilon), -this.size[2] / 2 + epsilon);

        if (this.camera != undefined) {
            let disp = vec3.create();
            vec3.subtract(disp, this.pos, p);
            disp[1] = 0;
            vec3.add(this.camera.target, this.camera.target, disp);
            this.camera.calculate();
        }
        this.mesh.destory();
        let modeMat = mat4.create();
        mat4.fromTranslation(modeMat, this.pos);
        this.mesh = new Mesh(this.meshLoader, modeMat);
        this.mesh.create();
    }

    onGround(norm?: vec3) {
        let ori = vec3.clone(this.rayOri[1]);
        vec3.add(ori, ori, this.pos);
        let p = this.posToCoord(this.pos);
        if (!inBound([p[0], p[1], p[2]])) return false;
        let i = coordToIndex([p[0], p[1], p[2]]);
        let tris = this.colMesh[i];
        if (tris == undefined || tris.length < 3) return false;
        let d = this.height / (this.rayCount - 1) + 1e-2;
        for (let Is of this.colIdx[i]) {
            let t = triangleCast(ori, vec3.fromValues(0, -1, 0), tris[Is[0]], tris[Is[1]], tris[Is[2]]);
            if (t >= 0 && t < d) {
                if (norm) {vec3.copy(norm, this.colNor[i][Is[0]]);}
                return true;
            }
        }
        return false;
    }

    resolveCollision(dis: vec3) {
        let minT = vec3.length(dis);
        if (minT < 1e-6) return;
        let p0 = vec3.create();
        vec3.add(p0, this.pos, dis);
        let i0 = this.posToCoord(p0);
        let p1 = vec3.fromValues(0, this.height, 0);
        vec3.add(p1, this.pos, p1);
        let i1 = this.posToCoord(p1);
        vec3.add(p1, p1, dis);
        let i2 = this.posToCoord(p1);
        let i3 = this.posToCoord(this.pos);
        let maxCoord = vec3.fromValues(Math.max(i0[0], i1[0], i2[0], i3[0]),
                                       Math.max(i0[1], i1[1], i2[1], i3[1]),
                                       Math.max(i0[2], i1[2], i2[2], i3[2]));
        let minCoord = vec3.fromValues(Math.min(i0[0], i1[0], i2[0], i3[0]),
                                       Math.min(i0[1], i1[1], i2[1], i3[1]),
                                       Math.min(i0[2], i1[2], i2[2], i3[2]));
        let collide = true;
        for (let i = 0; i < 3; i++) {
            if (maxCoord[i] < 0) {collide = false; break;}
            if (minCoord[i] >= this.size[i]) {collide = false; break;}
            maxCoord[i] = Math.min(maxCoord[i], this.size[i] - 1);
            minCoord[i] = Math.max(minCoord[i], 0);
        }

        if (!collide) {
            vec3.add(this.pos, this.pos, dis);
            return;
        }
        let oris = new Array<vec3>(this.rayCount);
        for (let i = 0; i < this.rayCount; i++){
            oris[i] = vec3.create();
            vec3.add(oris[i], this.pos, this.rayOri[i]);
        }
        let dir = vec3.create()
        vec3.scale(dir, dis, 1 / minT);
        let norm = undefined;
        for (let x = minCoord[0]; x <= maxCoord[0]; x++) {
            for (let y = minCoord[1]; y <= maxCoord[1]; y++) {
                for (let z = minCoord[2]; z <= maxCoord[2]; z++) {
                    let i = coordToIndex([x, y, z]);
                    let tris = this.colMesh[i];
                    if (tris == undefined || tris.length < 3) continue;
                    for (let Is of this.colIdx[i]) {
                        for (let ori of oris) {
                            let t = triangleCast(ori, dir, tris[Is[0]], tris[Is[1]], tris[Is[2]]);
                            if (t >= 0 && t <= minT) {
                                minT = t;
                                norm = this.colNor[i][Is[0]];
                            }
                        }
                    }
                }
            }
        }

        if (minT < 1e-6) {
            vec3.add(this.pos, this.pos, dis);
            return;
        }

        let disp = vec3.create();
        vec3.scale(disp, dir, minT);
        vec3.add(this.pos, this.pos, disp);

        if (norm != undefined) {
            let epsilon = vec3.create();
            vec3.scale(epsilon, norm, 1e-4);
            vec3.add(this.pos, this.pos, epsilon);

            let dotValue = -vec3.dot(norm, dir);
            if (dotValue >= 0) {
                let v = vec3.create();
                vec3.subtract(disp, dis, disp);
                vec3.scale(v, norm, vec3.dot(norm, disp));
                vec3.subtract(v, disp, v);
                this.resolveCollision(v);
            }
        }
    }
    
    posToCoord(pos: vec3) {
        let p = vec3.create();
        vec3.scale(p, this.size, 0.5);
        vec3.subtract(p, p, [0.5, 0.5, 0.5]);
        vec3.add(p, p, pos);
        vec3.round(p, p);
        return p;
    }
}

function triangleCast(ori: vec3, dir: vec3, p0: vec3, p1: vec3, p2: vec3) {
    let edge0 = vec3.create();
    vec3.subtract(edge0, p1, p0);
    let edge1 = vec3.create();
    vec3.subtract(edge1, p2, p0);
    let norm = vec3.create();
    vec3.cross(norm, edge0, edge1);
    
    let A = vec3.dot(dir, norm);
    if (A >= 0) return -1;
    let d = vec3.create();
    vec3.subtract(d, ori, p0);
    let B = vec3.dot(d, norm);

    let t = -B / A;
    if (t < 0) return -1;

    let p = vec3.create();
    vec3.scale(p, dir, t);
    vec3.add(p, ori, p);
    let S = vec3.length(norm);   
    vec3.subtract(edge0, p1, p);
    vec3.subtract(edge1, p2, p);
    vec3.cross(norm, edge0, edge1)
    let S0 = vec3.length(norm);
    if (S0 > S + 1e-6) return -1;
    vec3.subtract(edge0, p2, p);
    vec3.subtract(edge1, p0, p);
    vec3.cross(norm, edge0, edge1)
    let S1 = vec3.length(norm);
    if (S1 > S + 1e-6) return -1;
    vec3.subtract(edge0, p0, p);
    vec3.subtract(edge1, p1, p);
    vec3.cross(norm, edge0, edge1)
    let S2 = vec3.length(norm);
    if (S2 > S + 1e-6) return -1;
    if (S0 + S1 + S2 - S > 1e-6) return -1;

    return t;
}