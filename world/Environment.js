/*
========================================================

FaulkerVerse Engine

File:
    Environment.js

Purpose:
    Procedurally scatters natural
    scenery and manages water areas.

========================================================
*/

"use strict";

import { Config } from "../engine/Config.js";
import { SceneryFactory } from "./SceneryFactory.js";

export class Environment
{
    constructor(scene, terrain, lighting)
    {
        this.scene = scene;
        this.terrain = terrain;
        this.lighting = lighting;
        this.root =
            new BABYLON.TransformNode(
                "Environment",
                this.scene
            );
        this.waterAreas = [];

        this.random =
            this.createRandom(
                Config.World.Environment.Seed
            );
        this.scenery =
            new SceneryFactory(
                this.scene,
                this.root,
                this.lighting,
                this.random
            );
    }

    initialize()
    {
        this.createWaterAreas();
        this.scatterEnvironment();
    }

    createWaterAreas()
    {
        for (const [index, area] of Config.World.Environment.WaterAreas.entries())
        {
            const water =
                BABYLON.MeshBuilder.CreateDisc(
                    `WaterArea${index}`,
                    {
                        radius: 1,
                        tessellation: 64
                    },
                    this.scene
                );

            water.parent = this.root;
            water.rotation.x = Math.PI / 2;
            water.position.set(
                area.x,
                0.06,
                area.z
            );
            water.scaling.set(
                area.radius,
                area.radius * 0.72,
                1
            );
            water.material =
                this.terrain.getMaterial(
                    "Water"
                );
            water.checkCollisions = true;
            water.receiveShadows = true;
            water.metadata = {
                terrainType: "Water",
                swimmingEnabled: false
            };

            this.waterAreas.push(water);
        }
    }

    scatterEnvironment()
    {
        const counts = Config.World.Environment.Counts;
        const definitions =
        [
            ["Tree", counts.Trees, position => this.scenery.createTree(position)],
            ["Bush", counts.Bushes, position => this.scenery.createBush(position)],
            ["SmallRock", counts.SmallRocks, position => this.scenery.createRock(position, false)],
            ["LargeRock", counts.LargeRocks, position => this.scenery.createRock(position, true)],
            ["FallenLog", counts.FallenLogs, position => this.scenery.createFallenLog(position)],
            ["GrassClump", counts.GrassClumps, position => this.scenery.createGrassClump(position)]
        ];

        for (const [name, count, create] of definitions)
        {
            this.scatter(
                name,
                count,
                create
            );
        }
    }

    scatter(name, count, create)
    {
        for (let index = 0; index < count; index += 1)
        {
            const position = this.findSpawnPosition();

            if (position)
            {
                const object = create(position);
                object.name = `${name}${index}`;
            }
        }
    }

    findSpawnPosition()
    {
        for (let attempt = 0; attempt < 12; attempt += 1)
        {
            const position =
                this.randomPosition(
                    Config.World.Environment.SpawnRadius
                );

            if (!this.isExcluded(position))
            {
                return position;
            }
        }

        return null;
    }

    isExcluded(position)
    {
        if (
            position.length() <
            Config.World.Environment.SpawnClearRadius
        )
        {
            return true;
        }

        return Config.World.Environment.WaterAreas.some(
            area =>
            {
                const x = position.x - area.x;
                const z = position.z - area.z;

                return Math.sqrt(x * x + z * z) <
                    area.radius + 5;
            }
        );
    }

    update(deltaSeconds)
    {
        const waterTexture =
            this.terrain.getMaterial(
                "Water"
            ).diffuseTexture;

        if (!waterTexture)
        {
            return;
        }

        waterTexture.uOffset += deltaSeconds * 0.018;
        waterTexture.vOffset += deltaSeconds * 0.009;
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
