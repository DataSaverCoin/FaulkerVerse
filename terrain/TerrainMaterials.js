/*
========================================================

FaulkerVerse Engine

File:
    TerrainMaterials.js

Purpose:
    Creates and registers reusable
    terrain surface materials.

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
            this.register(
                name,
                color
            );
        }
    }

    register(name, color)
    {
        const material =
            new BABYLON.StandardMaterial(
                `Terrain${name}Material`,
                this.scene
            );

        material.diffuseColor =
            new BABYLON.Color3(
                color[0],
                color[1],
                color[2]
            );
        material.specularColor =
            new BABYLON.Color3(
                0.04,
                0.04,
                0.04
            );
        material.diffuseTexture =
            this.createTexture(
                name,
                color
            );

        if (name === "Water")
        {
            material.alpha = 0.76;
            material.backFaceCulling = false;
            material.specularColor =
                new BABYLON.Color3(
                    0.65,
                    0.75,
                    0.80
                );
        }

        this.materials.set(
            name,
            material
        );

        return material;
    }

    createTexture(name, color)
    {
        const size =
            Config.World.Terrain.TextureSize;
        const texture =
            new BABYLON.DynamicTexture(
                `Terrain${name}Texture`,
                {
                    width: size,
                    height: size
                },
                this.scene,
                false
            );
        const context =
            texture.getContext();

        context.fillStyle =
            this.toColorString(
                color,
                1
            );
        context.fillRect(
            0,
            0,
            size,
            size
        );

        for (let index = 0; index < size * 2; index += 1)
        {
            const shade =
                0.82 +
                this.random() * 0.32;

            context.fillStyle =
                this.toColorString(
                    color,
                    shade
                );
            context.fillRect(
                this.random() * size,
                this.random() * size,
                1 + this.random() * 3,
                1 + this.random() * 3
            );
        }

        texture.update();
        texture.uScale =
            Config.World.Terrain.TextureScale;
        texture.vScale =
            Config.World.Terrain.TextureScale;
        texture.wrapU =
            BABYLON.Texture.WRAP_ADDRESSMODE;
        texture.wrapV =
            BABYLON.Texture.WRAP_ADDRESSMODE;

        return texture;
    }

    get(name)
    {
        return this.materials.get(
            name
        );
    }

    toColorString(color, shade)
    {
        const channels =
            color.map(
                channel =>
                    Math.round(
                        Math.min(
                            1,
                            channel * shade
                        ) * 255
                    )
            );

        return `rgb(${channels[0]}, ${channels[1]}, ${channels[2]})`;
    }
}
