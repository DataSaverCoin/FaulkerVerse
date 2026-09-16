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
    constructor(camera, player, input, district)
    {
        this.camera = camera;
        this.player = player;
        this.input = input;
        this.district = district;
        this.districtOverviewActive = false;

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

        if (this.focusUntil !== Infinity && this.input.consumePressed("F8"))
        {
            this.frameDistrict();
        }

        if(this.focusUntil>performance.now()){if(this.focusTrain)this.camera.setTarget(this.focusTrain.cars[0].position.add(new BABYLON.Vector3(0,1,0)));return;}
        if(this.focusUntil){this.focusUntil=0;this.restoreFollow();}

        if (this.districtOverviewActive)
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
        const steeringLookAhead = vehicle ? vehicle.steering * speedRatio * 0.4 : 0;
        const right = vehicle ? new BABYLON.Vector3(heading.z, 0, -heading.x) : BABYLON.Vector3.Zero();
        const desiredTarget =
            this.player.position.add(
                new BABYLON.Vector3(
                    0,
                    (vehicle ? 0.3 : Config.Camera.TargetHeight),
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

        const desiredDistance = (vehicle ? 3.8 : Config.Camera.Distance) + speedRatio * 1.2;
        this.currentDistance = BABYLON.Scalar.Lerp(
            this.currentDistance,
            desiredDistance,
            1 - Math.exp(-Config.Camera.DistanceFollowSpeed * deltaSeconds)
        );
        this.camera.radius = this.currentDistance;
    }

    restoreFollow()
    {
        document.body.classList.remove("landmarkView");
        this.focusUntil=0;this.focusTrain=null;this.districtOverviewActive=false;
        this.camera.lowerRadiusLimit=Config.Camera.MinDistance;this.camera.upperRadiusLimit=Config.Camera.MaxDistance;
        this.camera.lowerBetaLimit=.3;this.camera.checkCollisions=true;this.camera.getScene().fogEnabled=true;
        this.target=this.player.position.add(new BABYLON.Vector3(0,Config.Camera.TargetHeight,0));
        this.camera.setTarget(this.target);this.camera.beta=Config.Camera.Pitch;this.camera.radius=Config.Camera.Distance;this.currentDistance=Config.Camera.Distance;
    }

    showTrain(train)
    {
        this.restoreFollow();this.focusTrain=train;this.focusUntil=performance.now()+30000;
        this.camera.checkCollisions=false;this.camera.upperRadiusLimit=60;
        this.camera.setTarget(train.cars[0].position.add(new BABYLON.Vector3(0,1,0)));
        this.camera.alpha=Math.PI*.2;this.camera.beta=.9;this.camera.radius=30;
    }

    frameDistrict()
    {
        const bounds = this.district.getDistrictBounds();
        const framingRadius = Math.max(bounds.width, bounds.depth) * 1.3;
        this.districtOverviewActive = true;
        this.camera.getScene().fogEnabled = false;
        this.camera.checkCollisions = false;
        this.camera.lowerRadiusLimit = framingRadius;
        this.camera.upperRadiusLimit = framingRadius;
        this.camera.setTarget(BABYLON.Vector3.Zero());
        this.camera.lowerBetaLimit = 0.01;
        this.camera.alpha = -Math.PI / 2;
        this.camera.beta = 0.01;
        this.camera.radius = framingRadius;
        console.info("[District roads] F8 camera overview active; reload to restore gameplay camera.");
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
