// @ts-ignore
import ditherVertexShader from './shaders/dither.vert'
// @ts-ignore
import ditherFragmentShader from './shaders/noisedither.frag'

import * as gfx from 'gophergfx'


export class NoiseDitherMaterial extends gfx.Material3
{
    public texture: gfx.Texture | null;
    public ambientColor: gfx.Color;
    public diffuseColor: gfx.Color;
    public specularColor: gfx.Color;
    public shininess: number;

    public static shader = new gfx.ShaderProgram(ditherVertexShader, ditherFragmentShader);

    private kAmbientUniform: WebGLUniformLocation | null;
    private kDiffuseUniform: WebGLUniformLocation | null;
    private kSpecularUniform: WebGLUniformLocation | null;
    private shininessUniform: WebGLUniformLocation | null;
    
    private textureUniform: WebGLUniformLocation | null;
    private useTextureUniform: WebGLUniformLocation | null;

    private modelUniform: WebGLUniformLocation | null;
    private normalModelUniform: WebGLUniformLocation | null;
    private viewUniform: WebGLUniformLocation | null;
    private projectionUniform: WebGLUniformLocation | null;

    private eyePositionWorldUniform: WebGLUniformLocation | null;
    private numLightsUniform: WebGLUniformLocation | null;
    private lightTypesUniform: WebGLUniformLocation | null;
    private lightPositionsWorldUniform: WebGLUniformLocation | null;
    private ambientIntensitiesUniform: WebGLUniformLocation | null;
    private diffuseIntensitiesUniform: WebGLUniformLocation | null;
    private specularIntensitiesUniform: WebGLUniformLocation | null;

    private positionAttribute: number;
    private normalAttribute: number;
    private colorAttribute: number;
    private texCoordAttribute: number;

    constructor()
    {
        super();

        this.texture = null;
        this.ambientColor = new gfx.Color(1, 1, 1);
        this.diffuseColor = new gfx.Color(1, 1, 1);
        this.specularColor = new gfx.Color(0, 0, 0);
        this.shininess = 30;

        NoiseDitherMaterial.shader.initialize(this.gl);

        this.kAmbientUniform = NoiseDitherMaterial.shader.getUniform(this.gl, 'kAmbient');
        this.kDiffuseUniform = NoiseDitherMaterial.shader.getUniform(this.gl, 'kDiffuse');
        this.kSpecularUniform = NoiseDitherMaterial.shader.getUniform(this.gl, 'kSpecular');
        this.shininessUniform = NoiseDitherMaterial.shader.getUniform(this.gl, 'shininess');

        this.textureUniform = NoiseDitherMaterial.shader.getUniform(this.gl, 'textureImage');
        this.useTextureUniform = NoiseDitherMaterial.shader.getUniform(this.gl, 'useTexture');

        this.modelUniform = NoiseDitherMaterial.shader.getUniform(this.gl, 'modelMatrix');
        this.normalModelUniform = NoiseDitherMaterial.shader.getUniform(this.gl, 'normalModelMatrix');
        this.viewUniform = NoiseDitherMaterial.shader.getUniform(this.gl, 'viewMatrix');
        this.projectionUniform = NoiseDitherMaterial.shader.getUniform(this.gl, 'projectionMatrix');

        this.eyePositionWorldUniform = NoiseDitherMaterial.shader.getUniform(this.gl, 'eyePositionWorld');
        this.numLightsUniform = NoiseDitherMaterial.shader.getUniform(this.gl, 'numLights');
        this.lightTypesUniform = NoiseDitherMaterial.shader.getUniform(this.gl, 'lightTypes');
        this.lightPositionsWorldUniform = NoiseDitherMaterial.shader.getUniform(this.gl, 'lightPositionsWorld');
        this.ambientIntensitiesUniform = NoiseDitherMaterial.shader.getUniform(this.gl, 'ambientIntensities');
        this.diffuseIntensitiesUniform = NoiseDitherMaterial.shader.getUniform(this.gl, 'diffuseIntensities');
        this.specularIntensitiesUniform = NoiseDitherMaterial.shader.getUniform(this.gl, 'specularIntensities');

        this.positionAttribute = NoiseDitherMaterial.shader.getAttribute(this.gl, 'position');
        this.normalAttribute = NoiseDitherMaterial.shader.getAttribute(this.gl, 'normal');
        this.colorAttribute = NoiseDitherMaterial.shader.getAttribute(this.gl, 'color');
        this.texCoordAttribute = NoiseDitherMaterial.shader.getAttribute(this.gl, 'texCoord');   
    }

    draw(mesh: gfx.Mesh3, camera: gfx.Camera, lightManager: gfx.LightManager): void
    {
        if(!this.visible || mesh.triangleCount == 0)
            return;

        this.initialize();

        // Switch to this shader
        this.gl.useProgram(NoiseDitherMaterial.shader.getProgram());

        // Set the camera and model matrix uniforms
        const modelMatrix = mesh.localToWorldMatrix;
        const normalModelMatrix = modelMatrix.inverse().transpose();
        const cameraPositionWorld = camera.localToWorldMatrix.transformPoint(new gfx.Vector3(0,0,0));
        this.gl.uniformMatrix4fv(this.modelUniform, false, modelMatrix.mat);
        this.gl.uniformMatrix4fv(this.normalModelUniform, false, normalModelMatrix.mat);
        this.gl.uniformMatrix4fv(this.viewUniform, false, camera.viewMatrix.mat);
        this.gl.uniformMatrix4fv(this.projectionUniform, false, camera.projectionMatrix.mat);

        // Set the material property uniforms
        this.gl.uniform3f(this.kAmbientUniform, this.ambientColor.r, this.ambientColor.g, this.ambientColor.b);
        this.gl.uniform3f(this.kDiffuseUniform, this.diffuseColor.r, this.diffuseColor.g, this.diffuseColor.b);
        this.gl.uniform3f(this.kSpecularUniform,this.specularColor.r, this.specularColor.g, this.specularColor.b);
        this.gl.uniform1f(this.shininessUniform, this.shininess);

        // Set the light uniforms
        this.gl.uniform3f(this.eyePositionWorldUniform, cameraPositionWorld.x, cameraPositionWorld.y, cameraPositionWorld.z);
        this.gl.uniform1i(this.numLightsUniform, lightManager.getNumLights());
        this.gl.uniform1iv(this.lightTypesUniform, lightManager.lightTypes);
        this.gl.uniform3fv(this.lightPositionsWorldUniform, lightManager.lightPositions);
        this.gl.uniform3fv(this.ambientIntensitiesUniform, lightManager.ambientIntensities);
        this.gl.uniform3fv(this.diffuseIntensitiesUniform, lightManager.diffuseIntensities);
        this.gl.uniform3fv(this.specularIntensitiesUniform, lightManager.specularIntensities);

        // Set the vertex positions
        this.gl.enableVertexAttribArray(this.positionAttribute);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, mesh.positionBuffer);
        this.gl.vertexAttribPointer(this.positionAttribute, 3, this.gl.FLOAT, false, 0, 0);

        // Set the vertex normals
        this.gl.enableVertexAttribArray(this.normalAttribute);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, mesh.normalBuffer);
        this.gl.vertexAttribPointer(this.normalAttribute, 3, this.gl.FLOAT, false, 0, 0);

        // Set the vertex colors
        if(mesh.hasVertexColors)
        {
            this.gl.enableVertexAttribArray(this.colorAttribute);
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, mesh.colorBuffer);
            this.gl.vertexAttribPointer(this.colorAttribute, 4, this.gl.FLOAT, false, 0, 0);
        }
        else
        {
            this.gl.disableVertexAttribArray(this.colorAttribute);
            this.gl.vertexAttrib4f(this.colorAttribute, 1, 1, 1, 1);
        }

        if(this.texture)
        {
            // Activate the texture in the shader
            this.gl.uniform1i(this.useTextureUniform, 1);

            // Set the texture
            this.gl.activeTexture(this.gl.TEXTURE0 + this.texture.id)
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture.texture);
            this.gl.uniform1i(this.textureUniform, this.texture.id);

            // Set the texture coordinates
            this.gl.enableVertexAttribArray(this.texCoordAttribute);
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, mesh.texCoordBuffer);
            this.gl.vertexAttribPointer(this.texCoordAttribute, 2, this.gl.FLOAT, false, 0, 0);
        }
        else
        {
            // Disable the texture in the shader
            this.gl.uniform1i(this.useTextureUniform, 0);
            this.gl.disableVertexAttribArray(this.texCoordAttribute);
        }

        // Draw the triangles
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
        this.gl.drawElements(this.gl.TRIANGLES, mesh.triangleCount*3, this.gl.UNSIGNED_SHORT, 0);
    }

    setColor(color: gfx.Color): void
    {
        this.ambientColor.copy(color);
        this.diffuseColor.copy(color);
        this.specularColor.copy(color);
    }

    getColor(): gfx.Color
    {
        return this.diffuseColor;
    }
}