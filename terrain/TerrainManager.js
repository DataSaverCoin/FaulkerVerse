/*
========================================================

FaulkerVerse Engine

File:
    TerrainManager.js

Purpose:
    Creates and samples the procedural terrain.

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
        this.random = this.createRandom(Config.World.Terrain.Seed);
        this.materials = new TerrainMaterials(scene, this.random);
    }

    initialize()
    {
        this.materials.initialize();
        this.createGround();
    }

    createGround()
    {
        const terrainConfig = Config.World.Terrain;

        this.ground = BABYLON.MeshBuilder.CreateGround(
            "Terrain",
            {
                width: Config.World.GroundSize,
                height: Config.World.GroundSize,
                subdivisions: terrainConfig.Subdivisions,
                updatable: true
            },
            this.scene
        );

        const positions = this.ground.getVerticesData(
            BABYLON.VertexBuffer.PositionKind
        );
        const colors = [];

        for (let index = 0; index < positions.length; index += 3)
        {
            const sample = this.sample(positions[index], positions[index + 2]);
            positions[index + 1] = sample.height;
            colors.push(...this.materials.getTerrainColor(sample), 1);
        }

        this.ground.updateVerticesData(
            BABYLON.VertexBuffer.PositionKind,
            positions
        );
        this.ground.setVerticesData(
            BABYLON.VertexBuffer.ColorKind,
            colors
        );
        this.ground.createNormals(true);
        this.ground.refreshBoundingInfo();
        this.ground.material = this.materials.get("Terrain");
        this.ground.receiveShadows = true;
        this.ground.checkCollisions = true;
        this.ground.metadata = {
            terrainType: "Procedural",
            supportsHeightmap: true
        };
    }

    sample(x, z)
    {
        const height = this.getHeight(x, z);
        const step = 1.5;
        const riseX = this.getHeight(x + step, z) - this.getHeight(x - step, z);
        const riseZ = this.getHeight(x, z + step) - this.getHeight(x, z - step);
        const slope = Math.sqrt(riseX * riseX + riseZ * riseZ) / (step * 2);
        const waterDepth = Config.World.Terrain.WaterLevel - height;

        return {
            height,
            slope,
            waterDepth,
            isWater: waterDepth > 0.08
        };
    }

    getHeight(x, z)
    {
        const terrainConfig = Config.World.Terrain;
        const frequency = terrainConfig.NoiseFrequency;
        const smoothness = Math.max(
            0,
            Math.min(1, terrainConfig.HillSmoothness)
        );
        const seedOffset = terrainConfig.Seed * 0.01;
        const broadLandforms =
            Math.sin((x + seedOffset) * frequency) * 0.52 +
            Math.cos((z - seedOffset * 0.7) * frequency * 0.82) * 0.44 +
            Math.sin((x + z + seedOffset * 0.3) * frequency * 0.55) * 0.34;
        const gentleDetail =
            Math.cos((x - z - seedOffset) * frequency * 1.6) *
            0.14 *
            (1 - smoothness);
        let height =
            (broadLandforms + gentleDetail) *
            terrainConfig.HeightScale;
        const scale = Config.World.Terrain.HeightScale;
        let height =
            Math.sin((x + 31) * 0.018) * 0.48 +
            Math.cos((z - 17) * 0.021) * 0.38 +
            Math.sin((x + z) * 0.011) * 0.28 +
            Math.cos((x - z) * 0.032) * 0.12;

        height *= scale;

        for (const area of Config.World.Environment.WaterAreas)
        {
            const dx = (x - area.x) / area.radius;
            const dz = (z - area.z) / (area.radius * 0.72);
            const distance = Math.sqrt(dx * dx + dz * dz);

            if (distance < 4.0)
            {
                const blend = this.smoothstep(4.0, 0.25, distance);
            if (distance < 1.65)
            {
                const blend = this.smoothstep(1.65, 0.45, distance);
                const basin = Config.World.Terrain.WaterLevel - 0.75;
                height = BABYLON.Scalar.Lerp(height, basin, blend);
            }
        }

        return height;
    }

    smoothstep(edge0, edge1, value)
    {
        const amount = Math.max(
            0,
            Math.min(1, (value - edge0) / (edge1 - edge0))
        );

        return amount * amount * (3 - 2 * amount);
    }

    getMaterial(name)
    {
        return this.materials.get(name);
    }

    registerMaterial(name, color)
    {
        return this.materials.register(name, color);
    }

    createRandom(seed)
    {
        let state = seed >>> 0;

        return () =>
        {
            state = (state * 1664525 + 1013904223) >>> 0;
            return state / 4294967296;
        };
    }
}
