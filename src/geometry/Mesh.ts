import {vec3, vec4, mat4, mat3} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl, readTextFile} from '../globals';
import * as Loader from 'webgl-obj-loader' ;

class MeshLoader {
  indices: Uint32Array;
  positions: Float32Array;
  normals: Float32Array;
  colors: Float32Array;
  uvs: Float32Array;

  objString: string;

  constructor(objFile: string) {
    this.objString = readTextFile(objFile);
  }

  load() {
    let posTemp: Array<number> = [];
    let norTemp: Array<number> = [];
    let uvsTemp: Array<number> = [];
    let idxTemp: Array<number> = [];

    var loadedMesh = new Loader.Mesh(this.objString);

    //posTemp = loadedMesh.vertices;
    for (var i = 0; i < loadedMesh.vertices.length; i++) {
      posTemp.push(loadedMesh.vertices[i]);
      if (i % 3 == 2) posTemp.push(1.0);
    }

    for (var i = 0; i < loadedMesh.vertexNormals.length; i++) {
      norTemp.push(loadedMesh.vertexNormals[i]);
      if (i % 3 == 2) norTemp.push(0.0);
    }

    uvsTemp = loadedMesh.textures;
    idxTemp = loadedMesh.indices;

    // white vert color for now
    this.colors = new Float32Array(posTemp.length);
    for (var i = 0; i < posTemp.length; ++i){
      this.colors[i] = 1.0;
    }

    this.indices = new Uint32Array(idxTemp);
    this.normals = new Float32Array(norTemp);
    this.positions = new Float32Array(posTemp);
    this.uvs = new Float32Array(uvsTemp);

    console.log(`Created Mesh from OBJ`);
    this.objString = ""; // hacky clear
  }
}

class Mesh extends Drawable {
  mesh: MeshLoader
  transform: mat4;
  invTranspose: mat3;

  constructor(mesh: MeshLoader, transform: mat4) {
    super(); // Call the constructor of the super class. This is required.
    this.mesh = mesh;
    this.transform = mat4.clone(transform);
    let invTMat = mat3.create()
    mat3.fromMat4(invTMat, transform);
    mat3.invert(invTMat, invTMat);
    mat3.transpose(invTMat, invTMat);
    this.invTranspose = invTMat;
  }

  create() {
    this.generateIdx();
    this.generatePos();
    this.generateNor();
    this.generateUV();
    this.generateCol();

    let posTemp = new Array<number>(this.mesh.positions.length);
    for (let i = 0; i < this.mesh.positions.length / 4; i++) {
      let pos = vec4.fromValues(this.mesh.positions[i * 4],
                                this.mesh.positions[i * 4 + 1],
                                this.mesh.positions[i * 4 + 2],
                                this.mesh.positions[i * 4 + 3]);
      vec4.transformMat4(pos, pos, this.transform);
      posTemp[i * 4] = pos[0];
      posTemp[i * 4 + 1] = pos[1];
      posTemp[i * 4 + 2] = pos[2];
      posTemp[i * 4 + 3] = pos[3];
    }

    let norTemp = new Array<number>(this.mesh.normals.length);
    for (let i = 0; i < this.mesh.normals.length / 4; i++) {
      let nor = vec3.fromValues(this.mesh.normals[i * 4],
                                this.mesh.normals[i * 4 + 1],
                                this.mesh.normals[i * 4 + 2]);
      vec3.transformMat3(nor, nor, this.invTranspose);
      vec3.normalize(nor, nor);
      norTemp[i * 4] = nor[0];
      norTemp[i * 4 + 1] = nor[1];
      norTemp[i * 4 + 2] = nor[2];
      norTemp[i * 4 + 3] = 0.0;
    }

    this.count = this.mesh.indices.length;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.mesh.indices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(posTemp), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(norTemp), gl.STATIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufCol);
    gl.bufferData(gl.ARRAY_BUFFER, this.mesh.colors, gl.STATIC_DRAW);                   

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufUV);
    gl.bufferData(gl.ARRAY_BUFFER, this.mesh.uvs, gl.STATIC_DRAW);

  }
};

export default Mesh;
export { MeshLoader }; 
