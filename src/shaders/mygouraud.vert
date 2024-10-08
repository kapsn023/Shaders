#version 300 es

precision mediump float;

#define POINT_LIGHT 0
#define DIRECTIONAL_LIGHT 1

const int MAX_LIGHTS = 8;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 normalModelMatrix;
uniform vec3 eyePositionWorld;

uniform int numLights;
uniform int lightTypes[MAX_LIGHTS];
uniform vec3 lightPositionsWorld[MAX_LIGHTS];
uniform vec3 ambientIntensities[MAX_LIGHTS];
uniform vec3 diffuseIntensities[MAX_LIGHTS];
uniform vec3 specularIntensities[MAX_LIGHTS];

uniform vec3 kAmbient;
uniform vec3 kDiffuse;
uniform vec3 kSpecular;
uniform float shininess;

in vec3 position;
in vec3 normal;
in vec4 color;
in vec2 texCoord;

out vec4 vertColor;
out vec2 uv;

void main() 
{
    // Compute the final vertex position and normal
    vec3 worldPosition = (modelMatrix * vec4(position, 1)).xyz;
    vec3 worldNormal = normalize((normalModelMatrix * vec4(normal, 0)).xyz);

    vec3 illumination = vec3(0, 0, 0);
    for(int i=0; i < numLights; i++)
    {
        // Ambient component
        illumination += kAmbient * ambientIntensities[i];

        // Compute the vector from the vertex position to the light
        vec3 l;
        if(lightTypes[i] == DIRECTIONAL_LIGHT)
            l = normalize(lightPositionsWorld[i]);
        else
            l = normalize(lightPositionsWorld[i] - worldPosition);

        // Diffuse component
        float diffuseComponent = max(dot(worldNormal, l), 0.0);
        illumination += diffuseComponent * kDiffuse * diffuseIntensities[i];

        // Compute the vector from the vertex to the eye
        vec3 e = normalize(eyePositionWorld - worldPosition);

        // Compute the light vector reflected about the normal
        vec3 r = reflect(-l, worldNormal);

        // Specular component
        float specularComponent = pow(max(dot(e, r), 0.0), shininess);
        illumination += specularComponent * kSpecular * specularIntensities[i];
    }

    // vertColor = new vec4(1, 0, 0, 1);

    vertColor = color;
    vertColor.rgb *= illumination;

    uv = texCoord.xy; 

    gl_Position = projectionMatrix * viewMatrix * vec4(worldPosition, 1);
}
