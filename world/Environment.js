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
        const waterway = Config.World.Environment.Waterway;
        const path = waterway.Points.map((point, index) =>
        {
            const width = waterway.Width * (
                0.78 + Math.sin(index * 2.1) * 0.20
            );

            return [
                new BABYLON.Vector3(
                    point.x,
                    Config.World.Terrain.WaterLevel,
                    point.z - width
                ),
                new BABYLON.Vector3(
                    point.x,
                    Config.World.Terrain.WaterLevel,
                    point.z + width
                )
            ];
        });
        const water = BABYLON.MeshBuilder.CreateRibbon(
            "WindingWaterway",
            {
                pathArray: path,
                closeArray: false,
                closePath: false,
                sideOrientation: BABYLON.Mesh.DOUBLESIDE
            },
            this.scene
        );

        water.parent = this.root;
        water.material = this.terrain.getMaterial("Water");
        water.checkCollisions = true;
        water.receiveShadows = true;
        water.metadata = {
            terrainType: "Water",
            swimmingEnabled: false
        };
        this.waterAreas.push(water);

        for (const [index, area] of Config.World.Environment.WaterAreas.entries())
        {
            const waterArea = BABYLON.MeshBuilder.CreateDisc(
                `WaterArea${index}`,
                {
                    radius: 1,
                    tessellation: 64
                },
                this.scene
            );

            waterArea.parent = this.root;
            waterArea.rotation.x = Math.PI / 2;
            waterArea.position.set(
                area.x,
                Config.World.Terrain.WaterLevel,
                area.z
            );
            waterArea.scaling.set(
                area.radius,
                area.radius * 0.72,
                1
            );
            waterArea.material = this.terrain.getMaterial("Water");
            waterArea.checkCollisions = true;
            waterArea.receiveShadows = true;
            waterArea.metadata = {
                terrainType: "Water",
                swimmingEnabled: false
            };
            this.waterAreas.push(waterArea);
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

        const occupied = [];

        for (const [name, count, create] of definitions)
        {
            this.scatter(
                name,
                count,
                create,
                occupied
            );
        }
    }

    scatter(name, count, create, occupied)
    {
        for (let index = 0; index < count; index += 1)
        {
            const position = this.findSpawnPosition(name, occupied);

            if (position)
            {
                const object = create(position);
                object.name = `${name}${index}`;
                occupied.push({
                    position,
                    spacing: this.getSpacing(name)
                });
            }
        }
    }

    findSpawnPosition(name, occupied)
    {
        for (let attempt = 0; attempt < 30; attempt += 1)
        {
            const position =
                this.randomPosition(
                    Config.World.Environment.SpawnRadius
                );
            const sample = this.terrain.sample(position.x, position.z);
            sample.habitat = this.getHabitat(position.x, position.z);

            if (
                !this.isExcluded(position, sample) &&
                this.acceptTerrain(name, sample) &&
                this.hasSpacing(position, name, occupied)
            )
            {
                position.y = sample.height;
                return position;
            }
        }

        return null;
    }

    isExcluded(position, sample)
    {
        if (
            position.length() <
            Config.World.Environment.SpawnClearRadius
        )
        {
            return true;
        }

        return sample.isWater;
    }

    acceptTerrain(name, sample)
    {
        const habitat = sample.habitat;
        const preferences = {
            Tree: sample.slope < 0.22 ? habitat.forest : 0.02,
            Bush: sample.height < 4.0 && sample.slope < 0.28
                ? 0.35 + habitat.forest * 0.55
                : 0.10,
            SmallRock: sample.slope > 0.10
                ? 0.45 + habitat.rocky * 0.5
                : habitat.rocky * 0.45,
            LargeRock: sample.slope > 0.14
                ? 0.55 + habitat.rocky * 0.4
                : habitat.rocky * 0.30,
            FallenLog: sample.slope < 0.14 ? 0.78 : 0.08,
            GrassClump: sample.slope < 0.38 ? 0.90 : 0.35
        };

        return this.random() < preferences[name];
    }

    hasSpacing(position, name, occupied)
    {
        const spacing = this.getSpacing(name);

        return occupied.every(item =>
        {
            const dx = position.x - item.position.x;
            const dz = position.z - item.position.z;
            const distanceSquared = dx * dx + dz * dz;
            const required = Math.min(spacing, item.spacing);

            return distanceSquared > required * required;
        });
    }

    getSpacing(name)
    {
        return {
            Tree: 5,
            Bush: 3,
            SmallRock: 2.5,
            LargeRock: 6,
            FallenLog: 5,
            GrassClump: 1.5
        }[name];
    }

    getHabitat(x, z)
    {
        const forestSignal =
            Math.sin(x * 0.018 + z * 0.007) * 0.55 +
            Math.cos(z * 0.022 - x * 0.005) * 0.45;
        const clearingSignal = Math.sin(x * 0.031 - z * 0.027);

        return {
            forest: forestSignal > 0.28
                ? 0.94
                : (forestSignal > -0.15 ? 0.34 : 0.035),
            rocky: clearingSignal > 0.55 && forestSignal < 0.15
                ? 0.90
                : 0.12
        };
    }

    update(deltaSeconds)
    {
        const waterTexture = this.terrain.getMaterial("Water").diffuseTexture;

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
