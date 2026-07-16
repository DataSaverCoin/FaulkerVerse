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

export class World
{
    constructor(engine, canvas)
    {
        this.engine = engine;
        this.canvas = canvas;

        this.scene = null;

        this.camera = null;

        this.sun = null;
        this.hemiLight = null;

        this.ground = null;
    }

    async initialize()
    {
        this.createScene();
        this.createLighting();
        this.createGround();
        this.createDebugWorld();
        this.createCamera();
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
        this.hemiLight =
            new BABYLON.HemisphericLight(
                "HemiLight",
                new BABYLON.Vector3(
                    0,
                    1,
                    0
                ),
                this.scene
            );

        this.hemiLight.intensity = 0.60;

        this.sun =
            new BABYLON.DirectionalLight(
                "Sun",
                new BABYLON.Vector3(
                    -1,
                    -2,
                    -1
                ),
                this.scene
            );

        this.sun.position =
            new BABYLON.Vector3(
                100,
                200,
                100
            );

        this.sun.intensity = 1.35;
    }

    createGround()
    {
        this.ground =
            BABYLON.MeshBuilder.CreateGround(
                "Ground",
                {
                    width:
                        Config.World.GroundSize,

                    height:
                        Config.World.GroundSize
                },
                this.scene
            );

        const material =
            new BABYLON.GridMaterial(
                "GroundMaterial",
                this.scene
            );

        material.majorUnitFrequency = 10;
        material.minorUnitVisibility = 0.45;
        material.gridRatio = 1;
        material.backFaceCulling = false;

        material.mainColor =
            new BABYLON.Color3(
                0.72,
                0.72,
                0.72
            );

        material.lineColor =
            new BABYLON.Color3(
                0.32,
                0.32,
                0.32
            );

        material.opacity = 0.98;

        this.ground.material =
            material;

        this.ground.receiveShadows = true;
    }

    createDebugWorld()
    {
        this.createAxis(
            BABYLON.Axis.X,
            BABYLON.Color3.Red(),
            "XAxis"
        );

        this.createAxis(
            BABYLON.Axis.Z,
            BABYLON.Color3.Blue(),
            "ZAxis"
        );

        const origin =
            BABYLON.MeshBuilder.CreateSphere(
                "Origin",
                {
                    diameter: 0.4
                },
                this.scene
            );

        origin.position.y = 0.2;

        const material =
            new BABYLON.StandardMaterial(
                "OriginMaterial",
                this.scene
            );

        material.emissiveColor =
            BABYLON.Color3.Green();

        origin.material =
            material;
    }

    createAxis(direction, color, name)
    {
        const axis =
            BABYLON.MeshBuilder.CreateLines(
                name,
                {
                    points:
                    [
                        BABYLON.Vector3.Zero(),
                        direction.scale(25)
                    ]
                },
                this.scene
            );

        axis.color =
            color;
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
