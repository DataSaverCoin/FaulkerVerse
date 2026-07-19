/*
========================================================

FaulkerVerse Engine

File:
    TerrainMaterials.js

Purpose:
    Owns terrain colors and surface classification.

========================================================
*/

"use strict";

import { Config } from "../engine/Config.js";

export class TerrainMaterials
{
    constructor(scene, random)
    {
        this.scene = scene;
        this.random = random;
        this.materials = new Map();
    }

    initialize()
    {
        for (const [name, color] of Object.entries(
            Config.World.Terrain.Materials
        ))
        {
            this.register(name, color);
        }

        const terrain = new BABYLON.StandardMaterial(
            "TerrainBlendedMaterial",
            this.scene
        );
        terrain.diffuseColor = BABYLON.Color3.White();
        terrain.specularColor = new BABYLON.Color3(0.03, 0.03, 0.03);
        terrain.useVertexColors = true;
        this.materials.set("Terrain", terrain);
    }

    register(name, color)
    {
        const material = new BABYLON.StandardMaterial(
            `Terrain${name}Material`,
            this.scene
        );
        material.diffuseColor = BABYLON.Color3.FromArray(color);
        material.specularColor = new BABYLON.Color3(0.04, 0.04, 0.04);

        if (name === "Water")
        {
            material.alpha = 0.76;
            material.backFaceCulling = false;
            material.specularColor = new BABYLON.Color3(0.65, 0.75, 0.80);
        }

        this.materials.set(name, material);
        return material;
    }

    getTerrainColor(sample)
    {
        const colors = Config.World.Terrain.Materials;
        const lowland = this.smoothstep(-0.2, 1.4, sample.height);
        const rock = this.smoothstep(0.16, 0.34, sample.slope);
        const dirt = this.smoothstep(0.07, 0.20, sample.slope) * (1 - rock);
        const mud = (1 - lowland) * (1 - rock) * (1 - dirt);
        const grass = Math.max(0, 1 - rock - dirt - mud);

        return [0, 1, 2].map(channel =>
            colors.Grass[channel] * grass +
            colors.Dirt[channel] * dirt +
            colors.Rock[channel] * rock +
            colors.Mud[channel] * mud
        );
    }

    smoothstep(edge0, edge1, value)
    {
        const amount = Math.max(
            0,
            Math.min(1, (value - edge0) / (edge1 - edge0))
        );

        return amount * amount * (3 - 2 * amount);
    }

    get(name)
    {
        return this.materials.get(name);
    }
}
