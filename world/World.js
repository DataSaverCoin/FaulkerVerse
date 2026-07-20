/*
========================================================

FaulkerVerse Engine

File:
    World.js

Purpose:
    Owns the Babylon scene,
    camera,
    lighting,
    and temporary sandbox world.

========================================================
*/

"use strict";

import { Config } from "../engine/Config.js";
import { TerrainManager } from "../terrain/TerrainManager.js";
import { Environment } from "./Environment.js";
import { Lighting } from "./Lighting.js";
import { StartupMetrics } from "../engine/Version.js";
import { PrototypeCityBlock } from "./PrototypeCityBlock.js";

export class World
{
    constructor(engine, canvas)
    {
        this.engine = engine;
        this.canvas = canvas;

        this.scene = null;

        this.camera = null;

        this.lighting = null;
        this.terrain = null;
        this.environment = null;
        this.ground = null;
    }

    async initialize()
    {
        this.createScene();
        this.createLighting();
        this.createTerrain();
        this.createEnvironment();
        this.createCamera();

        this.scene.onBeforeRenderObservable.add(
            () =>
            {
                this.environment.update(
                    this.engine.getDeltaTime() /
                    1000
                );
            }
        );
    }

    createScene()
    {
        this.scene =
            new BABYLON.Scene(
                this.engine
            );

        this.scene.clearColor =
            new BABYLON.Color4(
                Config.Colors.Sky.r,
                Config.Colors.Sky.g,
                Config.Colors.Sky.b,
                Config.Colors.Sky.a
            );

        this.scene.collisionsEnabled = true;
    }

    createLighting()
    {
        this.lighting =
            new Lighting(
                this.scene
            );

        this.lighting.initialize();
    }

    createTerrain()
    {
        const finishTerrainStartup =
            StartupMetrics.begin(
                "Terrain"
            );

        this.terrain =
            new TerrainManager(
                this.scene
            );

        this.terrain.initialize();
        this.ground =
            this.terrain.ground;

        finishTerrainStartup();
    }

    createEnvironment()
    {
        const finishEnvironmentStartup =
            StartupMetrics.begin(
                "Environment"
            );

        this.environment =
            new Environment(
                this.scene,
                this.terrain,
                this.lighting
            );

        this.environment.initialize();
        this.cityBlock = new PrototypeCityBlock(
            this.scene,
            this.terrain,
            this.lighting
        );
        this.cityBlock.initialize();

        finishEnvironmentStartup();
    }

    createCamera()
    {
        this.camera =
            new BABYLON.ArcRotateCamera(
                "ThirdPersonCamera",

                -Math.PI / 2,

                Config.Camera.Pitch,

                Config.Camera.Distance,

                BABYLON.Vector3.Zero(),

                this.scene
            );

        //
        // Camera limits.
        //

        this.camera.lowerRadiusLimit =
            Config.Camera.MinDistance;

        this.camera.upperRadiusLimit =
            Config.Camera.MaxDistance;

        //
        // Prevent camera from going
        // below the ground.
        //

        this.camera.lowerBetaLimit =
            0.30;

        this.camera.upperBetaLimit =
            Math.PI / 2.05;

        this.camera.wheelDeltaPercentage =
            Config.Camera.ZoomSpeed;

        this.camera.checkCollisions = true;
        this.camera.collisionRadius =
            new BABYLON.Vector3(0.6, 0.6, 0.6);

        this.camera.attachControl(
            this.canvas,
            true
        );

        this.camera.inputs.removeByType(
            "ArcRotateCameraKeyboardMoveInput"
        );

        this.scene.activeCamera =
            this.camera;
    }
}
