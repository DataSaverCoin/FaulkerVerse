/*
========================================================

FaulkerVerse Engine

File:
    Lighting.js

Purpose:
    Owns outdoor lighting, sky,
    fog, and world shadows.

========================================================
*/

"use strict";

import { Config } from "../engine/Config.js";

export class Lighting
{
    constructor(scene)
    {
        this.scene = scene;
        this.sun = null;
        this.ambientLight = null;
        this.shadowGenerator = null;
        this.sky = null;
    }

    initialize()
    {
        this.createAmbientLight();
        this.createSunlight();
        this.createSky();
        this.configureAtmosphere();
    }

    createAmbientLight()
    {
        this.ambientLight =
            new BABYLON.HemisphericLight(
                "OutdoorAmbientLight",
                new BABYLON.Vector3(
                    0,
                    1,
                    0
                ),
                this.scene
            );

        this.ambientLight.intensity = 0.58;
        this.ambientLight.diffuse =
            new BABYLON.Color3(
                0.78,
                0.88,
                1.0
            );
        this.ambientLight.groundColor =
            new BABYLON.Color3(
                0.22,
                0.28,
                0.16
            );
    }

    createSunlight()
    {
        this.sun =
            new BABYLON.DirectionalLight(
                "Sunlight",
                new BABYLON.Vector3(
                    -0.55,
                    -1,
                    -0.35
                ),
                this.scene
            );

        this.sun.position =
            new BABYLON.Vector3(
                120,
                180,
                90
            );
        this.sun.intensity = 1.35;
        this.sun.diffuse =
            new BABYLON.Color3(
                1.0,
                0.84,
                0.62
            );

        this.shadowGenerator =
            new BABYLON.ShadowGenerator(
                1024,
                this.sun
            );
        this.shadowGenerator.useBlurExponentialShadowMap = true;
        this.shadowGenerator.blurKernel = 28;
        this.shadowGenerator.bias = 0.0005;
    }

    createSky()
    {
        this.sky =
            BABYLON.MeshBuilder.CreateSphere(
                "OutdoorSky",
                {
                    diameter: 900,
                    segments: 16
                },
                this.scene
            );

        BABYLON.Effect.ShadersStore.outdoorSkyVertexShader = `
            precision highp float;
            attribute vec3 position;
            uniform mat4 worldViewProjection;
            varying float height;
            void main(void) {
                height = normalize(position).y;
                gl_Position = worldViewProjection * vec4(position, 1.0);
            }`;
        BABYLON.Effect.ShadersStore.outdoorSkyFragmentShader = `
            precision highp float;
            varying float height;
            void main(void) {
                vec3 horizon = vec3(0.93, 0.72, 0.48);
                vec3 zenith = vec3(0.26, 0.57, 0.82);
                float blend = smoothstep(-0.12, 0.72, height);
                gl_FragColor = vec4(mix(horizon, zenith, blend), 1.0);
            }`;
        const skyMaterial = new BABYLON.ShaderMaterial(
            "OutdoorSkyMaterial",
            this.scene,
            { vertex: "outdoorSky", fragment: "outdoorSky" },
            {
                attributes: ["position"],
                uniforms: ["worldViewProjection"]
            }
        );
        skyMaterial.backFaceCulling = false;

        this.sky.material =
            skyMaterial;
        this.sky.infiniteDistance = true;
        this.sky.isPickable = false;
        this.sky.applyFog = false;
    }

    configureAtmosphere()
    {
        this.scene.fogMode =
            BABYLON.Scene.FOGMODE_EXP2;
        this.scene.fogDensity = 0.0017;
        this.scene.fogColor =
            new BABYLON.Color3(
                0.72,
                0.72,
                0.63
            );
        this.scene.ambientColor =
            new BABYLON.Color3(
                0.18,
                0.22,
                0.16
            );
    }

    addShadowCaster(mesh)
    {
        this.shadowGenerator.addShadowCaster(
            mesh
        );
    }
}
