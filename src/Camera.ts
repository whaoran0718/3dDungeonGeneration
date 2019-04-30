import {vec3, mat4} from 'gl-matrix';

export let dMouseX: number = 0;
export let dMouseY: number = 0;
export let leftDown: boolean = false;
export let rightDown: boolean = false;
export let wheelY: number = 0;

class Camera {
  projectionMatrix: mat4 = mat4.create();
  viewMatrix: mat4 = mat4.create();
  fovy: number = 45;
  aspectRatio: number = 1;
  near: number = 0.01;
  far: number = 1000;
  orthoSize: number = 20;
  position: vec3 = vec3.create();
  target: vec3 = vec3.create();
  up: vec3 = vec3.create();
  right: vec3 = vec3.create();
  forward: vec3 = vec3.create();
  theta: number = 0;
  fixTheta: number = 0;
  phi: number = 0;
  len: number = 0;
  turnSpeed: number = 1;
  rollSpeed: number = 0.005;

  constructor(theta: number, phi: number, len: number, target: vec3) {
    this.theta = Math.min(Math.max(theta, 0), 85);
    this.fixTheta = this.theta;
    this.phi = phi;
    this.len = len;
    this.orthoSize = len;
    vec3.copy(this.target, target);
    this.calculate();

    window.addEventListener("mousedown", function(e) {
      switch(e.button) {
        case 0:
        leftDown = true;
        break;
        case 2:
        rightDown = true;
        break;
      }
    }, false);

    window.addEventListener("mouseup", function(e) {
      switch(e.button) {
        case 0:
        leftDown = false;
        break;
      }
    }, false);

    window.addEventListener("mousemove", function(e) {
      dMouseX = e.movementX;
      dMouseY = e.movementY;
    }, false);

    window.addEventListener("wheel", function(e) {
      wheelY = e.deltaY;
    }, false);
  }

  calculate() {
    this.theta = Math.min(Math.max(this.theta, 0), 85);
    if (this.phi <= -180) this.phi += 360;
    if (this.phi > 180) this.phi -= 360;
    let st = Math.sin(this.theta * Math.PI / 180);
    let ct = Math.cos(this.theta * Math.PI / 180);
    let sp = Math.sin(this.phi * Math.PI / 180);
    let cp = Math.cos(this.phi * Math.PI / 180);
    this.forward[0] = ct * sp;
    this.forward[1] = -st;
    this.forward[2] = -ct * cp;
    this.right[0] = cp;
    this.right[1] = 0;
    this.right[2] = sp;
    vec3.cross(this.up, this.right, this.forward);
    let direction = vec3.create();
    vec3.scale(direction, this.forward, this.len);
    vec3.subtract(this.position, this.target, direction);
    mat4.lookAt(this.viewMatrix, this.position, this.target, this.up);
  }

  setAspectRatio(aspectRatio: number) {
    this.aspectRatio = aspectRatio;
  }

  updateProjectionMatrix() {
    //mat4.perspective(this.projectionMatrix, this.fovy, this.aspectRatio, this.near, this.far);
    let width = this.orthoSize * this.aspectRatio;
    mat4.ortho(this.projectionMatrix, -width, width, -this.orthoSize, this.orthoSize, -1000, 1000);
  }

  update() {
    if (wheelY != 0) {
      this.orthoSize = Math.min(Math.max(this.orthoSize + wheelY * this.rollSpeed, 5), 30);
      this.len = Math.min(Math.max(this.len + wheelY * this.rollSpeed, 5), 30);
      this.updateProjectionMatrix();
    }
    if (leftDown)  {
      this.phi += this.turnSpeed * dMouseX;
      this.theta += this.turnSpeed * dMouseY;
    }
    if (rightDown) {
      this.theta = this.fixTheta;
      rightDown = false;
    }
    this.calculate();
    dMouseX = 0;
    dMouseY = 0;
    wheelY = 0;
  }
};

export default Camera;
