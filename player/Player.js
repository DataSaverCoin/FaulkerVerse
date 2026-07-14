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
    constructor(scene, input)
    {
        this.scene = scene;
        this.input = input;

        this.walkSpeed = 8.0;
        this.runSpeed = 14.0;

        this.mesh = null;

        this.createCapsule();
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

        const direction =
            new BABYLON.Vector3(
                movement.x,
                0,
                movement.z
            );

        direction.normalize();

        const speed =
            this.input.isRunning()
                ? this.runSpeed
                : this.walkSpeed;

        this.mesh.position.addInPlace(
            direction.scale(
                speed * deltaSeconds
            )
        );

        this.mesh.rotation.y =
            Math.atan2(
                direction.x,
                direction.z
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