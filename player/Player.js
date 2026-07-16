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

export class Player
{
    constructor(scene, input, assetManager)
    {
        this.scene = scene;
        this.input = input;

        this.cameraController = null;

        this.walkSpeed = 8.0;
        this.runSpeed = 14.0;

        this.rotationSpeed = 10.0;

        this.mesh = null;
        this.characterRoot = null;
        this.assetManager =
            assetManager;

        this.createCapsule();
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
    }

    update(deltaSeconds)
    {
        const movement =
            this.input.getMoveVector();

        if (
            movement.x === 0 &&
            movement.z === 0
        )
        {
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
