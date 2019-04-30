#version 300 es
precision highp float;

uniform mat4 u_Model;
uniform mat4 u_View;
uniform mat4 u_ViewProj;
uniform mat4 u_LightViewProj;

in vec4 vs_Pos;
in vec4 vs_Nor;
in vec4 vs_Col;
in vec2 vs_UV;

out vec4 fs_Pos;
out vec4 fs_Nor;
out vec4 fs_Col;
out vec2 fs_UV;
out vec4 fs_ShadowCoord;

const mat4 biasMatrix = mat4(0.5, 0.0, 0.0, 0.0,
                             0.0, 0.5, 0.0, 0.0,
                             0.0, 0.0, 0.5, 0.0,
                             0.5, 0.5, 0.5, 1.0);

void main() {
    fs_Pos = vs_Pos;
    fs_Nor = vs_Nor;
    fs_Col = vs_Col;
    fs_UV = vs_UV;

    vec4 modelposition = u_Model * vs_Pos;
    gl_Position = u_ViewProj * modelposition;
    fs_ShadowCoord = biasMatrix * u_LightViewProj * modelposition;
}