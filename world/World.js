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

        this.hemiLight.intensity = 0.45;

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

        this.sun.intensity = 1.2;
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
            new BABYLON.StandardMaterial(
                "GroundMaterial",
                this.scene
            );

        material.diffuseColor =
            new BABYLON.Color3(
                Config.Colors.Ground.r,
                Config.Colors.Ground.g,
                Config.Colors.Ground.b
            );

        this.ground.material =
            material;

        this.ground.receiveShadows = true;
    }

    createCamera()
    {
        this.camera =
            new BABYLON.ArcRotateCamera(
                "DebugCamera",

                -Math.PI / 2,

                Math.PI / 3,

                Config.Camera.Radius,

                BABYLON.Vector3.Zero(),

                this.scene
            );

        this.camera.lowerRadiusLimit =
            Config.Camera.MinRadius;

        this.camera.upperRadiusLimit =
            Config.Camera.MaxRadius;

        this.camera.wheelDeltaPercentage =
            0.01;

        this.camera.attachControl(
            this.canvas,
            true
        );

        this.scene.activeCamera =
            this.camera;
    }
}