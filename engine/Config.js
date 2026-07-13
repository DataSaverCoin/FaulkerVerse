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
        Radius: 60,
        MinRadius: 10,
        MaxRadius: 250
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