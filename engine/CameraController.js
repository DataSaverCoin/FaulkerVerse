/*
========================================================

FaulkerVerse Engine

File:
    CameraController.js

Purpose:
    Owns all gameplay camera behavior.

    Responsibilities:

    • Third-person follow
    • Orbit
    • Zoom
    • Camera smoothing
    • Future collision support

========================================================
*/

"use strict";

import { Config } from "./Config.js";

export class CameraController
{
    constructor(camera, player)
    {
        this.camera = camera;
        this.player = player;

        this.target =
            player.position.add(
                new BABYLON.Vector3(
                    0,
                    Config.Camera.TargetHeight,
                    0
                )
            );

        //
        // Configure the camera ONCE.
        //

        this.camera.radius =
            Config.Camera.Distance;

        this.camera.beta =
            Config.Camera.Pitch;

        this.camera.lowerRadiusLimit =
            Config.Camera.MinDistance;

        this.camera.upperRadiusLimit =
            Config.Camera.MaxDistance;

        this.camera.wheelDeltaPercentage =
            Config.Camera.ZoomSpeed;

        this.camera.setTarget(
            this.target
        );
    }

    update(deltaSeconds)
    {
        if (!this.camera || !this.player)
        {
            return;
        }

        const desiredTarget =
            this.player.position.add(
                new BABYLON.Vector3(
                    0,
                    Config.Camera.TargetHeight,
                    0
                )
            );

        const interpolation =
            Math.min(
                1.0,
                deltaSeconds *
                Config.Camera.FollowSpeed
            );

        this.target =
            BABYLON.Vector3.Lerp(
                this.target,
                desiredTarget,
                interpolation
            );

        //
        // Only update the follow target.
        //

        this.camera.setTarget(
            this.target
        );
    }
}