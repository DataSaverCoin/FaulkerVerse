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

        this.ambientLight.intensity = 0.68;
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
        this.sun.intensity = 1.2;
        this.sun.diffuse =
            new BABYLON.Color3(
                1.0,
                0.93,
                0.78
            );

        this.shadowGenerator =
            new BABYLON.ShadowGenerator(
                1024,
                this.sun
            );
        this.shadowGenerator.useBlurExponentialShadowMap = true;
        this.shadowGenerator.blurKernel = 16;
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

        const skyMaterial =
            new BABYLON.StandardMaterial(
                "OutdoorSkyMaterial",
                this.scene
            );

        skyMaterial.backFaceCulling = false;
        skyMaterial.disableLighting = true;
        skyMaterial.emissiveColor =
            new BABYLON.Color3(
                Config.Colors.Sky.r,
                Config.Colors.Sky.g,
                Config.Colors.Sky.b
            );

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
        this.scene.fogDensity = 0.0022;
        this.scene.fogColor =
            new BABYLON.Color3(
                Config.Colors.Sky.r,
                Config.Colors.Sky.g,
                Config.Colors.Sky.b
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
