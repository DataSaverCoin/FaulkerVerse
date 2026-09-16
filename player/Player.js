import {AVATAR_CHOICES,playerChoice} from '../world/PlayerChoices.js';
import { ACTOR_SCALE } from '../engine/ActorScale.js';
/*
========================================================

FaulkerVerse Engine

File:
    Player.js

Purpose:
    Owns the player capsule and
    movement logic.

========================================================
*/

"use strict";

import { PersonAvatar } from "../entities/PersonAvatar.js";
import { AnimationController } from "./AnimationController.js";

export class Player
{
    constructor(scene, input, assetManager, terrain)
    {
        this.scene = scene;
        this.input = input;
        this.terrain = terrain;

        this.cameraController = null;

        this.walkSpeed = 8.0;
        this.runSpeed = 14.0;

        this.rotationSpeed = 10.0;
        this.verticalVelocity = 0;
        this.jumpSpeed = 8.5;
        this.gravity = 22;
        this.jumpWasDown = false;

        this.mesh = null;
        this.characterRoot = null;
        this.assetManager =
            assetManager;
        this.animationController =
            new AnimationController(
                this.assetManager,
                this.input
            );

        this.vehicle = null;

        this.createCapsule();
        this.ready =
            this.loadCharacter();
    }

    setCameraController(cameraController)
    {
        this.cameraController =
            cameraController;
    }

    createCapsule()
    {
        this.mesh =
            BABYLON.MeshBuilder.CreateCapsule(
                "Player",
                {
                    radius: 0.5,
                    height: 2.0
                },
                this.scene
            );

        this.mesh.position.set(
            0,
            1,
            0
        );

        const material =
            new BABYLON.StandardMaterial(
                "PlayerMaterial",
                this.scene
            );

        material.diffuseColor =
            new BABYLON.Color3(
                1,
                1,
                1
            );

        this.mesh.material =
            material;

        this.mesh.isVisible =
            false;
    }


    async loadCharacter()
    {
        this.avatar = new PersonAvatar(this.scene,AVATAR_CHOICES[playerChoice.avatar]);
        this.characterRoot = this.avatar.root;
        this.characterRoot.parent = this.mesh;
        this.characterRoot.scaling.setAll(ACTOR_SCALE);
        this.characterRoot.position.set(0,-1,0);
    }


    update(deltaSeconds)
    {
        const move=this.input.getMoveVector();
        this.avatar?.update(deltaSeconds,move.x!==0||move.z!==0,this.input.isRunning(),!!this.vehicle);
        if (this.vehicle)
        {
            this.mesh.position.copyFrom(
                this.vehicle.driverPosition
            );
            this.mesh.rotation.y =
                this.vehicle.rotation.y;
            return;
        }

        // Procedural articulation replaces the legacy asset animation on this avatar.

        const movement =
            this.input.getMoveVector();

        if (
            movement.x === 0 &&
            movement.z === 0
        )
        {
            this.updateVerticalMovement(deltaSeconds);
            return;
        }

        let direction;

        if (this.cameraController)
        {
            const basis =
                this.cameraController.getMovementBasis();

            direction =
                basis.forward.scale(
                    movement.z
                ).add(
                    basis.right.scale(
                        movement.x
                    )
                );
        }
        else
        {
            direction =
                new BABYLON.Vector3(
                    movement.x,
                    0,
                    movement.z
                );
        }

        if (direction.lengthSquared() === 0)
        {
            this.updateVerticalMovement(deltaSeconds);
            return;
        }

        direction.normalize();

        const speed =
            this.input.isRunning()
                ? this.runSpeed
                : this.walkSpeed;

        const next = this.mesh.position.add(direction.scale(speed * Math.min(deltaSeconds, 0.05)));
        if (!this.terrain.downtown?.isBlocked(next.x, next.z, 0.5*ACTOR_SCALE)) this.mesh.position.copyFrom(next);

        const desiredRotation =
            Math.atan2(
                direction.x,
                direction.z
            );

        this.mesh.rotation.y =
            BABYLON.Scalar.LerpAngle(
                this.mesh.rotation.y,
                desiredRotation,
                Math.min(
                    1.0,
                    this.rotationSpeed *
                    deltaSeconds
                )
            );

        this.updateVerticalMovement(deltaSeconds);
    }

    enterVehicle(vehicle)
    {
        this.vehicle = vehicle;
        this.verticalVelocity = 0;
        this.characterRoot.scaling.setAll(vehicle.modelScale);
        this.characterRoot.position.y=-.45*vehicle.modelScale;
    }

    exitVehicle(position)
    {
        this.vehicle = null;
        this.mesh.position.copyFrom(position);
        this.mesh.setEnabled(true);
        this.characterRoot.scaling.setAll(ACTOR_SCALE);
        this.characterRoot.position.y=-1;
    }

    get isDriving()
    {
        return this.vehicle !== null;
    }

    updateVerticalMovement(deltaSeconds)
    {
        const groundHeight = this.terrain.getHeightAt(
            this.mesh.position.x,
            this.mesh.position.z
        ) + 1;
        const jumpIsDown = this.input.isDown("Space");
        const jumpStarted = jumpIsDown && !this.jumpWasDown;
        const grounded = this.mesh.position.y <= groundHeight + 0.05;

        this.jumpWasDown = jumpIsDown;

        if (jumpStarted && grounded)
        {
            this.verticalVelocity = this.jumpSpeed;
        }

        this.verticalVelocity -= this.gravity * deltaSeconds;
        this.mesh.position.y += this.verticalVelocity * deltaSeconds;

        const updatedGroundHeight = this.terrain.getHeightAt(
            this.mesh.position.x,
            this.mesh.position.z
        ) + 1;

        if (this.mesh.position.y <= updatedGroundHeight)
        {
            this.mesh.position.y = updatedGroundHeight;
            this.verticalVelocity = 0;
        }
    }

    get position()
    {
        return this.mesh.position;
    }

    get rotation()
    {
        return this.mesh.rotation;
    }
}
