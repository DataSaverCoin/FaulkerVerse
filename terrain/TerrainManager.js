/*
========================================================

FaulkerVerse Engine

File:
    TerrainManager.js

Purpose:
    Owns terrain creation and
    future terrain generation entry points.

========================================================
*/

"use strict";

import { Config } from "../engine/Config.js";
import { TerrainMaterials } from "./TerrainMaterials.js";

export class TerrainManager
{
    constructor(scene)
    {
        this.scene = scene;
        this.ground = null;
        this.patches = [];

        this.random =
            this.createRandom(
                Config.World.Terrain.Seed
            );
        this.materials =
            new TerrainMaterials(
                this.scene,
                this.random
            );
    }

    initialize()
    {
        this.materials.initialize();
        this.createGround();
        this.createTerrainPatches();
    }

    createGround()
    {
        this.ground =
            BABYLON.MeshBuilder.CreateGround(
                "Terrain",
                {
                    width: Config.World.GroundSize,
                    height: Config.World.GroundSize,
                    subdivisions: 2
                },
                this.scene
            );

        this.ground.material =
            this.getMaterial(
                "Grass"
            );
        this.ground.receiveShadows = true;
        this.ground.checkCollisions = true;
        this.ground.metadata = {
            terrainType: "Grass",
            supportsHeightmap: true
        };
    }

    createTerrainPatches()
    {
        const terrainTypes =
            ["Dirt", "Rock", "Mud"];

        for (
            let index = 0;
            index < Config.World.Terrain.PatchCount;
            index += 1
        )
        {
            const terrainType =
                terrainTypes[
                    index % terrainTypes.length
                ];
            const radius =
                this.randomRange(
                    Config.World.Terrain.PatchMinRadius,
                    Config.World.Terrain.PatchMaxRadius
                );
            const position =
                this.randomPosition(
                    Config.World.GroundSize * 0.42
                );

            if (position.length() < 14)
            {
                continue;
            }

            this.createPatch(
                index,
                terrainType,
                radius,
                position
            );
        }
    }

    createPatch(index, terrainType, radius, position)
    {
        const patch =
            BABYLON.MeshBuilder.CreateDisc(
                `Terrain${terrainType}Patch${index}`,
                {
                    radius: 1,
                    tessellation: 48
                },
                this.scene
            );

        patch.rotation.x = Math.PI / 2;
        patch.rotation.z = this.random() * Math.PI;
        patch.position.set(
            position.x,
            0.012 + index * 0.0001,
            position.z
        );
        patch.scaling.set(
            radius,
            radius * this.randomRange(0.55, 1.0),
            1
        );
        patch.material =
            this.getMaterial(
                terrainType
            );
        patch.receiveShadows = true;
        patch.metadata = {
            terrainType
        };

        this.patches.push(
            patch
        );
    }

    getMaterial(name)
    {
        return this.materials.get(
            name
        );
    }

    registerMaterial(name, color)
    {
        return this.materials.register(
            name,
            color
        );
    }

    randomPosition(radius)
    {
        const angle = this.random() * Math.PI * 2;
        const distance = Math.sqrt(this.random()) * radius;

        return new BABYLON.Vector3(
            Math.cos(angle) * distance,
            0,
            Math.sin(angle) * distance
        );
    }

    randomRange(minimum, maximum)
    {
        return minimum +
            (maximum - minimum) *
            this.random();
    }

    createRandom(seed)
    {
        let state = seed >>> 0;

        return () =>
        {
            state =
                (state * 1664525 + 1013904223) >>> 0;

            return state / 4294967296;
        };
    }
}
