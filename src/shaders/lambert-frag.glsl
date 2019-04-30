#version 300 es
precision highp float;
precision highp sampler2DShadow;

uniform vec2 u_Dimensions;
uniform vec3 u_LightDir;
uniform mat4 u_LightViewProj;
uniform sampler2DShadow u_Shadow;
uniform sampler2D u_Texture;

in vec4 fs_Pos;
in vec4 fs_Nor;
in vec4 fs_Col;
in vec2 fs_UV;
in vec4 fs_ShadowCoord;

out vec4 out_Col;

float shadow() {
    vec3 shadowCoord = fs_ShadowCoord.xyz /fs_ShadowCoord.w;
    shadowCoord.z -= max(0.01 * (1.0 - dot(fs_Nor.xyz, u_LightDir)), 0.003);
    return texture(u_Shadow, shadowCoord);
}

void main() {
    vec4 lightVec = vec4(1.0, 1.8, 1.0, 0.0);
    float diffuseTerm = dot(normalize(fs_Nor), normalize(lightVec));
    diffuseTerm = clamp(diffuseTerm, 0.0, 1.0);
    float ambientTerm = 0.7;
    float shw = shadow();
    float lightIntensity = diffuseTerm * shw + ambientTerm;

    vec3 diffuseColor = texture(u_Texture, fs_UV).rgb;
    out_Col = vec4(diffuseColor * lightIntensity, 1.0);
}