#version 300 es
precision highp float;

in vec4 fs_Col;
in vec4 fs_Pos;

out vec4 out_Col;

void main()
{
    float dist = 1.0 - (length(fs_Pos.xyz) * 2.0);
    out_Col = vec4(dist) * fs_Col;
}
