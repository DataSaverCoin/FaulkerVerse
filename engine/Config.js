/*
========================================================

FaulkerVerse Engine

File:
    Config.js

Purpose:
    Global engine configuration.

========================================================
*/

"use strict";

export const Config =
{
    Engine:
    {
        Antialias: true,
        AdaptToDeviceRatio: true
    },

    Camera:
    {
        Distance: 8,
        MinDistance: 5,
        MaxDistance: 16,
        Pitch: Math.PI / 4,
        TargetHeight: 1.75,
        FollowSpeed: 10.0,
        ZoomSpeed: 0.02
    },

    World:
    {
        GroundSize: 500,

        Terrain:
        {
            Subdivisions: 160,
            Seed: 8128,
            WaterLevel: -1.0,
            HeightScale: 15,
            NoiseFrequency: 0.006,
            HillSmoothness: 0.9,
            Materials:
            {
                Grass: [0.18, 0.38, 0.12],
                DarkGrass: [0.11, 0.29, 0.09],
                LightGrass: [0.31, 0.49, 0.16],
                Wildflowers: [0.46, 0.43, 0.18],
                Dirt: [0.36, 0.24, 0.12],
                Rock: [0.34, 0.36, 0.34],
                Mud: [0.20, 0.15, 0.09],
                Water: [0.08, 0.34, 0.48]
            }
        },

        Environment:
        {
            Seed: 4217,
            SpawnRadius: 215,
            SpawnClearRadius: 18,
            Counts:
            {
                Trees: 150,
                Bushes: 48,
                SmallRocks: 70,
                LargeRocks: 22,
                FallenLogs: 14,
                GrassClumps: 170
            },
            Waterway:
            {
                Width: 12,
                Points:
                [
                    { x: -155, z: 88 },
                    { x: -105, z: 69 },
                    { x: -62, z: 79 },
                    { x: -18, z: 51 },
                    { x: 31, z: 58 },
                    { x: 72, z: 25 },
                    { x: 125, z: 36 },
                    { x: 168, z: 8 }
                ]
            },
            WaterAreas:
            [
                { x: 58, z: -46, radius: 20 },
                { x: -72, z: 64, radius: 14 }
            ]
        }
    },

    Colors:
    {
        Sky: { r: 0.53, g: 0.81, b: 0.98, a: 1.0 },
        Ground: { r: 0.18, g: 0.38, b: 0.12 }
    }
};
