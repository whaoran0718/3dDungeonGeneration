#version 300 es
precision highp float;

uniform mat4 u_Model;
uniform mat4 u_LightViewProj;

in vec4 vs_Pos;
out vec4 fs_Pos;

void main() {
    fs_Pos = vs_Pos;
    gl_Position = u_LightViewProj * u_Model * vs_Pos;
}