#version 300 es

precision mediump float;

#define POINT_LIGHT 0
#define DIRECTIONAL_LIGHT 1

const int MAX_LIGHTS = 8;

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

uniform int useTexture;
uniform sampler2D textureImage;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 normalModelMatrix;

in vec3 vertPosition;
in vec3 vertNormal;
in vec4 vertColor;
in vec2 uv;

out vec4 fragColor;

void main() 
{
    const mat4 thresholdMap = mat4(
        vec4(  0.0625,  0.5625,  0.1875,  0.6875),
        vec4(  0.8125,  0.3125,  0.9375,  0.4375),
        vec4(  0.2500,  0.7500,  0.1250,  0.6250),
        vec4(  0.8750,  0.3750,  0.8125,  0.3125)
    );


    vec3 illumination = vec3(0, 0, 0);
    for(int i=0; i < numLights; i++)
    {
        // Ambient component
        illumination += kAmbient * ambientIntensities[i];

        // Normalize the interpolated normal vector
        vec3 n = normalize(vertNormal);

        // Compute the vector from the vertex position to the light
        vec3 l;
        if(lightTypes[i] == DIRECTIONAL_LIGHT)
            l = normalize(lightPositionsWorld[i]);
        else
            l = normalize(lightPositionsWorld[i] - vertPosition);

        // Diffuse component
        float diffuseComponent = max(dot(n, l), 0.0);
        illumination += diffuseComponent * kDiffuse * diffuseIntensities[i];

        // Compute the vector from the vertex to the eye
        vec3 e = normalize(eyePositionWorld - vertPosition);

        // Compute the light vector reflected about the normal
        vec3 r = reflect(-l, n);

        // Specular component
        float specularComponent = pow(max(dot(e, r), 0.0), shininess);
        illumination += specularComponent * kSpecular * specularIntensities[i];
    }

    fragColor = vertColor;

    fragColor.rgb *= illumination;

    float grayscaleValue = dot(fragColor.rgb, vec3(0.299, 0.587, 0.114));

    vec3 projPosition = (projectionMatrix * viewMatrix * vec4(vertPosition, 1)).xyz;

    int x = int(abs(projPosition.x) * 4800000.0) % 4; 
    int y = int(abs(projPosition.y) * 4800000.0) % 4;

    if (grayscaleValue > thresholdMap[y][x]) {
        
        fragColor.rgb = vec3(1.0); // Output white
    } else {
        fragColor.rgb = vec3(0.0); // Output black
    }

}