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
        const patch = this.surfacePattern(sample.x, sample.z);
        let grassColor = colors.Grass;

        if (patch < -0.48)
        {
            grassColor = colors.DarkGrass;
        }
        else if (patch > 0.55)
        {
            grassColor = colors.LightGrass;
        }
        else if (patch > 0.39 && patch < 0.48)
        {
            grassColor = colors.Wildflowers;
        }

        const exposedSoil = patch < -0.67 && sample.slope < 0.15 ? 0.28 : 0;
        const rockField = patch > 0.72 && sample.height > 1 ? 0.32 : 0;
        const naturalGrass = grass * (1 - exposedSoil - rockField);

        return [0, 1, 2].map(channel =>
            grassColor[channel] * naturalGrass +
            colors.Dirt[channel] * (dirt + grass * exposedSoil) +
            colors.Rock[channel] * (rock + grass * rockField) +
            colors.Mud[channel] * mud
        );
    }

    surfacePattern(x, z)
    {
        return (
            Math.sin(x * 0.037 + z * 0.013) * 0.55 +
            Math.cos(z * 0.029 - x * 0.011) * 0.45
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
