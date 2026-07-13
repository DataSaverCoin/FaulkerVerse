/*
========================================================

FaulkerVerse Engine

File:
    Engine.js

Purpose:
    Owns the Babylon engine and
    engine lifecycle.

========================================================
*/

"use strict";

import { Config } from "./Config.js";
import { World } from "../world/World.js";

export class Engine
{
    constructor()
    {
        this.canvas = null;
        this.engine = null;
        this.world = null;
    }

    async start()
    {
        this.initializeCanvas();

        this.initializeEngine();

        await this.initializeWorld();

        this.startRenderLoop();

        this.registerResizeHandler();
    }

    initializeCanvas()
    {
        this.canvas =
            document.getElementById(
                "gameCanvas"
            );

        if (!this.canvas)
        {
            throw new Error(
                "Unable to locate #gameCanvas."
            );
        }
    }

    initializeEngine()
    {
        this.engine =
            new BABYLON.Engine(
                this.canvas,
                Config.Engine.Antialias,
                {
                    adaptToDeviceRatio:
                        Config.Engine.AdaptToDeviceRatio
                }
            );
    }

    async initializeWorld()
    {
        this.world =
            new World(
                this.engine,
                this.canvas
            );

        await this.world.initialize();
    }

    startRenderLoop()
    {
        this.engine.runRenderLoop(() =>
        {
            this.world.scene.render();
        });
    }

    registerResizeHandler()
    {
        window.addEventListener(
            "resize",
            () =>
            {
                this.engine.resize();
            }
        );
    }
}