/*
========================================================

FaulkerVerse Engine

File:
    Engine.js

Purpose:
    Owns the Babylon engine,
    engine lifecycle,
    and top-level game systems.

========================================================
*/

"use strict";

import { Config } from "./Config.js";
import { World } from "../world/World.js";
import { Input } from "../player/Input.js";
import { Player } from "../player/Player.js";
import { CameraController } from "./CameraController.js";

export class Engine
{
    constructor()
    {
        this.canvas = null;
        this.engine = null;

        this.world = null;

        this.input = null;
        this.player = null;

        this.cameraController = null;

        this.lastFrameTime = 0;
    }

    async start()
    {
        this.initializeCanvas();
        this.initializeEngine();

        await this.initializeWorld();

        this.initializeInput();
        this.initializePlayer();
        this.initializeCameraController();

        //
        // Sprint 5.1
        // Give the player access to the
        // gameplay camera after both systems
        // have been created.
        //

        this.player.setCameraController(
            this.cameraController
        );

        this.startRenderLoop();

        this.registerResizeHandler();
    }

    initializeCanvas()
    {
        this.canvas =
            document.getElementById("gameCanvas");

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

    initializeInput()
    {
        this.input =
            new Input();
    }

    initializePlayer()
    {
        this.player =
            new Player(
                this.world.scene,
                this.input
            );
    }

    initializeCameraController()
    {
        this.cameraController =
            new CameraController(
                this.world.camera,
                this.player
            );
    }

    startRenderLoop()
    {
        this.lastFrameTime =
            performance.now();

        this.engine.runRenderLoop(() =>
        {
            const now =
                performance.now();

            const deltaSeconds =
                (now - this.lastFrameTime) /
                1000.0;

            this.lastFrameTime =
                now;

            this.player.update(
                deltaSeconds
            );

            this.cameraController.update(
                deltaSeconds
            );

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