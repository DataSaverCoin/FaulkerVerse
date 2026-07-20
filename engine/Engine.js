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
import { Wallet } from "../player/Wallet.js";
import { GolfCart } from "../entities/GolfCart.js";
import { RideSystem } from "../world/RideSystem.js";
import { GameplaySession } from "../world/GameplaySession.js";
import { GameplayHUD } from "../ui/GameplayHUD.js";
import { GameplayAudio } from "./GameplayAudio.js";

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
        this.gameplayHUD = null;
        this.wallet = null;
        this.golfCart = null;
        this.rideSystem = null;
        this.gameplaySession = null;

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
        this.initializeGameplay();
        this.initializeDeveloperHUD();

        this.player.setCameraController(
            this.cameraController
        );

        this.entityManager.add(
            this.player
        );

        this.entityManager.add(
            this.gameplaySession
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

    initializeGameplay()
    {
        const audio = new GameplayAudio();
        this.wallet = new Wallet();
        this.golfCart = new GolfCart(
            this.world.scene,
            this.input,
            this.world.terrain,
            new BABYLON.Vector3(3, 0, 2)
        );
        this.rideSystem = new RideSystem(
            this.world.scene,
            this.world.terrain,
            this.golfCart,
            this.wallet,
            audio
        );
        this.gameplaySession = new GameplaySession(
            this.player,
            this.golfCart,
            this.rideSystem,
            this.input,
            audio,
            this.world.terrain
        );
        this.gameplayHUD = new GameplayHUD(
            this.wallet,
            this.rideSystem,
            this.gameplaySession
        );
        this.gameplayHUD.initialize();
        this.rideSystem.initialize();
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

            this.gameplayHUD.update();

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
