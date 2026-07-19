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
import { AssetManager } from "./AssetManager.js";
import { Input } from "../player/Input.js";
import { Player } from "../player/Player.js";
import { CameraController } from "./CameraController.js";
import { EntityManager } from "../entities/EntityManager.js";
import { DeveloperHUD } from "../ui/DeveloperHUD.js";
import { StartupMetrics } from "./Version.js";

export class Engine
{
    constructor()
    {
        this.canvas = null;
        this.engine = null;

        this.world = null;

        this.assetManager = null;
        this.entityManager = null;

        this.input = null;
        this.player = null;

        this.cameraController = null;

        this.developerHUD = null;

        this.lastFrameTime = 0;
    }

    async start()
    {
        StartupMetrics.logBuild();

        const finishTotalStartup =
            StartupMetrics.begin(
                "Total startup"
            );
        const finishEngineStartup =
            StartupMetrics.begin(
                "Engine"
            );

        this.initializeCanvas();
        this.initializeEngine();

        finishEngineStartup();

        await this.initializeWorld();

        this.initializeAssetManager();
        this.initializeEntityManager();

        this.initializeInput();
        const finishPlayerStartup =
            StartupMetrics.begin(
                "Player"
            );

        this.initializePlayer();
        finishPlayerStartup();
        this.initializeCameraController();
        this.initializeDeveloperHUD();

        this.player.setCameraController(
            this.cameraController
        );

        this.entityManager.add(
            this.player
        );

        this.startRenderLoop();

        this.registerResizeHandler();

        const finishStartup = () =>
        {
            finishTotalStartup();
            StartupMetrics.logSummary();
        };
        const finishFailedStartup = error =>
        {
            finishStartup();
            console.error(
                "[FaulkerVerse] Player startup failed.",
                error
            );
        };

        this.player.ready.then(
            finishStartup,
            finishFailedStartup
        );
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

    initializeAssetManager()
    {
        this.assetManager =
            new AssetManager(
                this.world.scene
            );
    }

    initializeEntityManager()
    {
        this.entityManager =
            new EntityManager(
                this.world.scene
            );
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
                this.input,
                this.assetManager,
                this.world.terrain
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

    initializeDeveloperHUD()
    {
        this.developerHUD =
            new DeveloperHUD(
                this
            );

        this.developerHUD.initialize();
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

            this.entityManager.update(
                deltaSeconds
            );

            this.cameraController.update(
                deltaSeconds
            );

            this.developerHUD.update(
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
