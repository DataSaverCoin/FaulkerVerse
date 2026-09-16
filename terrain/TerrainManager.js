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
                subdivisions: Config.World.Downtown ? 1 : terrainConfig.Subdivisions,
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

    rebuildRegionalGround()
    {
        this.ground.dispose();
        this.ground = BABYLON.MeshBuilder.CreateGround("Regional terrain", {
            width: Config.World.GroundSize, height: Config.World.GroundSize,
            subdivisions: 400, updatable: true
        }, this.scene);
        const positions=this.ground.getVerticesData(BABYLON.VertexBuffer.PositionKind), colors=[];
        this.regionalHeights=new Float32Array(positions.length/3);
        for(let i=0;i<positions.length;i+=3)
        {
            positions[i+1]=this.geology.height(positions[i],positions[i+2]);
            this.regionalHeights[i/3]=positions[i+1];
            colors.push(...this.geology.color(positions[i],positions[i+2]),1);
        }
        this.ground.updateVerticesData(BABYLON.VertexBuffer.PositionKind,positions);
        this.ground.setVerticesData(BABYLON.VertexBuffer.ColorKind,colors);
        this.ground.createNormals(true);
        this.ground.refreshBoundingInfo();
        this.ground.checkCollisions=true;
        this.ground.receiveShadows=true;
    }

    getGroundHeightAt(x,z)
    {
        if(!this.regionalHeights) return 0.06;
        // Match Babylon's two triangles per ground cell, including its north-first rows.
        const size=Config.World.GroundSize, count=400;
        const u=Math.max(0,Math.min(count-0.000001,(x+size/2)/size*count));
        const v=Math.max(0,Math.min(count-0.000001,(size/2-z)/size*count));
        const col=Math.floor(u),row=Math.floor(v),fx=u-col,fz=v-row;
        const i=row*(count+1)+col,h=this.regionalHeights;
        const a=h[i],b=h[i+1],c=h[i+count+1],d=h[i+count+2];
        return fx<=fz ? a+(d-c)*fx+(c-a)*fz : a+(b-a)*fx+(d-b)*fz;
    }

    sample(x, z)
    {
        const groundHeight = this.getHeightAt(x, z);
        const step = 1.5;
        const riseX = this.getHeightAt(x + step, z) - this.getHeightAt(x - step, z);
        const riseZ = this.getHeightAt(x, z + step) - this.getHeightAt(x, z - step);
        const slope = Math.sqrt(riseX * riseX + riseZ * riseZ) / (step * 2);
        const waterDepth = Config.World.Terrain.WaterLevel - groundHeight;

        return {
            x,
            z,
            height: groundHeight,
            slope,
            waterDepth,
            isWater: waterDepth > 0.08
        };
    }

    getHeightAt(x, z)
    {
        if (Config.World.Downtown)
        {
            const roadHeight = this.downtown?.surface.height(x,z);
            if (roadHeight != null) return Math.max(roadHeight,this.getGroundHeightAt(x,z));
            return this.getGroundHeightAt(x,z);
        }
        const terrainConfig = Config.World.Terrain;
        const frequency = terrainConfig.NoiseFrequency;
        const smoothness = Math.max(
            0,
            Math.min(1, terrainConfig.HillSmoothness)
        );
        const seedOffset = terrainConfig.Seed * 0.01;
        const broadLandforms =
            Math.sin((x + seedOffset) * frequency) * 0.58 +
            Math.cos((z - seedOffset * 0.7) * frequency * 0.78) * 0.46 +
            Math.sin((x * 0.62 + z + seedOffset) * frequency * 0.48) * 0.32;
        const gentleDetail =
            Math.cos((x - z - seedOffset) * frequency * 1.6) *
            0.14 *
            (1 - smoothness);
        let terrainHeight =
            (broadLandforms + gentleDetail) *
            terrainConfig.HeightScale;

        const waterway = Config.World.Environment.Waterway;
        const distance = this.getWaterwayDistance(x, z);
        const basin = Config.World.Terrain.WaterLevel - 0.7;
        const valleyHeight = basin + Math.max(
            0,
            distance - waterway.Width * 0.65
        ) * 0.18;
        terrainHeight = Math.min(terrainHeight, valleyHeight);

        for (const area of Config.World.Environment.WaterAreas)
        {
            const dx = (x - area.x) / area.radius;
            const dz = (z - area.z) / (area.radius * 0.72);
            const areaDistance = Math.sqrt(dx * dx + dz * dz);

            if (areaDistance < 1.65)
            {
                const blend = this.smoothstep(1.65, 0.45, areaDistance);
                const areaBasin = Config.World.Terrain.WaterLevel - 0.75;
                terrainHeight = BABYLON.Scalar.Lerp(
                    terrainHeight,
                    areaBasin,
                    blend
                );
            }
        }

        return terrainHeight;
    }

    // Retained for compatibility with code outside the engine. New systems
    // should use getHeightAt(), the canonical world-elevation query.
    getHeight(x, z)
    {
        return this.getHeightAt(x, z);
    }

    getWaterwayDistance(x, z)
    {
        const points = Config.World.Environment.Waterway.Points;
        let nearest = Number.POSITIVE_INFINITY;

        for (let index = 0; index < points.length - 1; index += 1)
        {
            const start = points[index];
            const end = points[index + 1];
            const dx = end.x - start.x;
            const dz = end.z - start.z;
            const lengthSquared = dx * dx + dz * dz;
            const amount = Math.max(0, Math.min(1,
                ((x - start.x) * dx + (z - start.z) * dz) / lengthSquared
            ));
            const offsetX = x - (start.x + dx * amount);
            const offsetZ = z - (start.z + dz * amount);
            nearest = Math.min(
                nearest,
                Math.sqrt(offsetX * offsetX + offsetZ * offsetZ)
            );
        }

        return nearest;
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
