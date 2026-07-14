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
    //
    // Third-person follow camera.
    //

    Distance: 8,

    MinDistance: 5,

    MaxDistance: 16,

    Pitch:
        Math.PI / 4,

    TargetHeight: 1.75,

    FollowSpeed: 10.0,

    ZoomSpeed: 0.02
},

    World:
    {
        GroundSize: 500
    },

    Colors:
    {
        Sky:
        {
            r: 0.53,
            g: 0.81,
            b: 0.98,
            a: 1.0
        },

        Ground:
        {
            r: 0.55,
            g: 0.55,
            b: 0.55
        }
    }
};