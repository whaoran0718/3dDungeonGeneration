import {vec3} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Square from './geometry/Square';
import ScreenQuad from './geometry/ScreenQuad';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader, loadText} from './rendering/gl/ShaderProgram';
import WFC from './wfc';
import WFCGraph from './wfcGraph';
import Player from './player';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
};

let square: Square;
let screenQuad: ScreenQuad;
let time: number = 0.0;
let wfc: WFC;
let wfcGraph: WFCGraph;
let lightDir: vec3;
let texPath = "../model/texture.png";
let tex: WebGLTexture;
let player: Player;

function loadScene() {
  lightDir = vec3.fromValues(1.0, 1.0, 1.0);
  vec3.normalize(lightDir, lightDir);
  square = new Square();
  square.create();
  screenQuad = new ScreenQuad();
  screenQuad.create();
  wfc = new WFC();
  wfc.load();
  wfc.process(0);
  wfc.bake();
  wfcGraph = new WFCGraph();
  wfcGraph.init();
  wfcGraph.create(wfc);
  player = new Player();
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(45, 45, 10, vec3.fromValues(0, 0, 0));
  player.camera = camera;

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.55, 0.6, 1);

  // From https://webglfundamentals.org/webgl/lessons/webgl-render-to-texture.html
  let shaderMap = gl.createTexture();
  function initShadowMap(map: WebGLTexture, width: number, height: number) {
    gl.bindTexture(gl.TEXTURE_2D, map);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT32F, width, height, 0, gl.DEPTH_COMPONENT, gl.FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
  }
  initShadowMap(shaderMap, window.innerWidth, window.innerHeight);
  
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, shaderMap, 0);

  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LESS);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const flat = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/flat-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/flat-frag.glsl')),
  ]);

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl')),
  ]);

  const shadow = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/shadow-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/shadow-frag.glsl')),
  ]);
  tex = loadText(texPath);
  lambert.setLightDir(lightDir);
  shadow.setLightDir(lightDir);

  // This function will be called every frame
  function tick() {
    time++;
    if (!wfc.stop) {
      wfc.step();
      wfc.bake();
      wfcGraph.create(wfc);
    }
    if (wfc.stop && !player.loaded) {
      player.loadCollider(wfc);
    }

    if (player.loaded) {
      player.update(1);
    }

    camera.update();
    stats.begin();
    flat.setTime(time);

    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();
    shadow.setTexture(0);
    renderer.render(camera, shadow, wfcGraph.meshes);
    if (player.loaded) renderer.render(camera, shadow, [player.mesh]);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, shaderMap);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    lambert.setShadow(0);
    lambert.setTexture(1);
    renderer.render(camera, lambert, wfcGraph.meshes);
    if (player.loaded) renderer.render(camera, lambert, [player.mesh]);
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
    flat.setDimensions(window.innerWidth, window.innerHeight);
    initShadowMap(shaderMap, window.innerWidth, window.innerHeight);
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();
  flat.setDimensions(window.innerWidth, window.innerHeight);
  initShadowMap(shaderMap, window.innerWidth, window.innerHeight);

  // Start the render loop
  tick();
}

main();
