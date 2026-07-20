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
        const character =
            await this.assetManager.instantiateCharacter(
                "corey"
            );

        this.characterRoot =
            character.root;

        if (!this.characterRoot)
        {
            return;
        }

        this.characterRoot.parent =
            this.mesh;

        this.characterRoot.position.set(
            0,
            -1,
            0
        );

        await this.animationController.initialize(
            "corey",
            character.skeletons,
            character.animationGroups
        );
    }

    update(deltaSeconds)
    {
        if (this.vehicle)
        {
            this.mesh.position.copyFrom(
                this.vehicle.driverPosition
            );
            this.mesh.rotation.y =
                this.vehicle.rotation.y;
            return;
        }

        this.animationController.update();

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

        this.mesh.position.addInPlace(
            direction.scale(
                speed *
                deltaSeconds
            )
        );

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
        this.mesh.setEnabled(false);
    }

    exitVehicle(position)
    {
        this.vehicle = null;
        this.mesh.position.copyFrom(position);
        this.mesh.setEnabled(true);
    }

    get isDriving()
    {
        return this.vehicle !== null;
    }

    updateVerticalMovement(deltaSeconds)
    {
        const groundHeight = this.terrain.getHeight(
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

        const updatedGroundHeight = this.terrain.getHeight(
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
