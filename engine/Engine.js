import {CityServices} from '../world/CityServices.js';
import {applyCartChoice,playerChoice} from '../world/PlayerChoices.js';
import { RenderProfile } from "./RenderProfile.js";
import { LandmarkTour } from '../ui/LandmarkTour.js';
import { MultiplayerSession } from '../world/MultiplayerSession.js';
import { TouchControls } from '../ui/TouchControls.js';
import { RoadLighting } from '../world/RoadLighting.js';
import { SidewalkPeople } from "../world/SidewalkPeople.js";
import { WorldWeather } from "../world/WorldWeather.js";
import { WorldControls } from "../ui/WorldControls.js";
import { StationTrain } from "../world/StationTrain.js";
import { CityTraffic } from "../world/CityTraffic.js";
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

    async start(reportProgress = async () => {})
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

        await reportProgress(10, 'Starting the game engine…');
        this.initializeCanvas();
        this.initializeEngine();

        finishEngineStartup();

        await reportProgress(20, 'Building the city, roads and landmarks…');
        await this.initializeWorld();
        await reportProgress(60, 'Preparing your avatar and ride…');

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
        await reportProgress(70, 'Adding traffic, pedestrians and weather…');
        await this.initializeGameplay();
        if(Config.Engine.ShowDeveloperHUD)this.initializeDeveloperHUD();

        this.player.setCameraController(
            this.cameraController
        );

        this.entityManager.add(
            this.player
        );

        this.entityManager.add(
            this.gameplaySession
        );

        this.touchControls=new TouchControls(this.input,this.player,this.world.scene.activeCamera);
        if(this.touchControls.enabled&&!RenderProfile.lite)this.engine.setHardwareScalingLevel(1.5);
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
                RenderProfile.lite ? false : Config.Engine.Antialias,
                {
                    adaptToDeviceRatio:
                        Config.Engine.AdaptToDeviceRatio
                }
            );
        // Set the smaller framebuffer before constructing the city, not after loading.
        if(RenderProfile.lite)this.engine.setHardwareScalingLevel(1.75);
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
                this.player,
                this.input,
                this.world.cityBlock
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

    async initializeGameplay()
    {
        const audio = new GameplayAudio();
        const downtown = this.world.terrain.downtown;
        if (downtown) this.player.position.set(downtown.spawn.x, 1, downtown.spawn.z);
        this.wallet = new Wallet();
        this.golfCart = new GolfCart(
            this.world.scene,
            this.input,
            this.world.terrain,
            new BABYLON.Vector3(3, 0, 2)
        );
        if (downtown)
        {
            this.golfCart.position.set(downtown.spawn.x + 2, 0.06, downtown.spawn.z);
        }
        applyCartChoice(this.golfCart);
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
        this.gameplayHUD.root.appendChild(audio.musicButton);
        this.rideSystem.initialize();
        if(downtown)
        {
            downtown.traffic=new CityTraffic(downtown,this.player,this.golfCart,Math.round(RenderProfile.traffic*(playerChoice.population==='calm'?.65:1)));
            this.entityManager.add(downtown.traffic);
            downtown.pedestrians=new SidewalkPeople(downtown,this.player,Math.round(RenderProfile.pedestrians*(playerChoice.population==='calm'?.65:1)));
            this.entityManager.add(downtown.pedestrians);
            downtown.weather=new WorldWeather(this.world,this.player);
            this.entityManager.add(downtown.weather);
            this.entityManager.add(downtown.wheel);
            downtown.roadLighting=new RoadLighting(downtown,this.golfCart,downtown.weather);
            this.entityManager.add(downtown.roadLighting);
            this.worldControls=new WorldControls(this.gameplaySession,downtown.weather);
            this.entityManager.add(this.worldControls);
            this.gameplaySession.services=new CityServices(this.gameplaySession,this.worldControls.root);
            downtown.train=await StationTrain.create(downtown);
            this.entityManager.add(downtown.train);
            this.landmarkTour=new LandmarkTour(this);
            this.multiplayer=new MultiplayerSession(this);this.entityManager.add(this.multiplayer);
            const railStart=downtown.train.data.points[0];
            this.gameplaySession.teleportLocations.push({...downtown.nearestRoad(...railStart),name:"Union Station / train"});
            const station=downtown.nearestRoad(...railStart);
            downtown.spawn=station;
            this.player.position.set(station.x,this.world.terrain.getHeightAt(station.x,station.z)+1,station.z);
            this.golfCart.position.set(station.x+2,0,station.z);this.golfCart.snapToTerrain();
            this.cameraController.restoreFollow();
            this.cameraController.camera.alpha=Math.atan2(station.z-railStart[1],station.x-railStart[0]);

        }
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

            // Follow/ride targeting can rebuild camera angles. Apply manual look last.
            this.touchControls?.update(deltaSeconds);

            this.developerHUD?.update(
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
