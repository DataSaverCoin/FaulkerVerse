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
    • Movement basis generation
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
        this.currentDistance = Config.Camera.Distance;
    }

    update(deltaSeconds)
    {
        if (!this.camera || !this.player)
        {
            return;
        }

        const vehicle = this.player.vehicle;
        const speedRatio = vehicle ? Math.min(1, Math.abs(vehicle.speed) / vehicle.maxForwardSpeed) : 0;
        const heading = vehicle ? new BABYLON.Vector3(
            Math.sin(vehicle.rotation.y),
            0,
            Math.cos(vehicle.rotation.y)
        ) : BABYLON.Vector3.Zero();
        const steeringLookAhead = vehicle ? vehicle.steering * 1.8 : 0;
        const right = vehicle ? new BABYLON.Vector3(heading.z, 0, -heading.x) : BABYLON.Vector3.Zero();
        const desiredTarget =
            this.player.position.add(
                new BABYLON.Vector3(
                    0,
                    Config.Camera.TargetHeight,
                    0
                )
            ).add(heading.scale(speedRatio * 2.4)).add(right.scale(steeringLookAhead));

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

        this.camera.setTarget(
            this.target
        );

        const desiredDistance = Config.Camera.Distance + speedRatio * 4;
        this.currentDistance = BABYLON.Scalar.Lerp(
            this.currentDistance,
            desiredDistance,
            1 - Math.exp(-Config.Camera.DistanceFollowSpeed * deltaSeconds)
        );
        this.camera.radius = this.currentDistance;
    }

    /*
    ========================================================

    Returns camera-relative movement vectors.

    forward = camera forward projected
              onto the XZ plane.

    right = camera right projected
            onto the XZ plane.

    ========================================================
    */

    getMovementBasis()
    {
        const forward =
            this.camera
                .getForwardRay()
                .direction
                .clone();

        forward.y = 0;

        if (forward.lengthSquared() > 0)
        {
            forward.normalize();
        }

        const right =
            BABYLON.Vector3.Cross(
                BABYLON.Axis.Y,
                forward
            );

        if (right.lengthSquared() > 0)
        {
            right.normalize();
        }

        return {
            forward,
            right
        };
    }
}
