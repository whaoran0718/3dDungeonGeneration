#version 300 es
precision highp float;

in vec4 fs_Pos;
out vec4 out_Col;

void main() {
    out_Col = vec4(vec3(gl_FragCoord.z), 1.);
}