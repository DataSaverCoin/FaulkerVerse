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
            HeightScale: 8,
            NoiseFrequency: 0.015,
            HillSmoothness: 0.8,
            Materials:
            {
                Grass: [0.18, 0.38, 0.12],
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
                Trees: 70,
                Bushes: 48,
                SmallRocks: 70,
                LargeRocks: 22,
                FallenLogs: 14,
                GrassClumps: 110
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
