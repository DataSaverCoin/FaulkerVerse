/*
========================================================

FaulkerVerse Engine

File:
    main.js

Purpose:
    Engine entry point.

========================================================
*/

"use strict";

import { Engine } from "./engine/Engine.js";

window.addEventListener(
    "DOMContentLoaded",
    async () =>
    {
        console.clear();

        console.log("");
        console.log("==================================");
        console.log("      FaulkerVerse Engine");
        console.log("==================================");
        console.log("");

        try
        {
            const engine =
                new Engine();

            await engine.start();

            window.Faulker =
                engine;

            console.log("");
            console.log("✓ Engine Ready");
        }
        catch (error)
        {
            console.error(error);
        }
    }
);