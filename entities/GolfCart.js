/*
========================================================

FaulkerVerse Engine

File:
    GolfCart.js

Purpose:
    Responsive, lightweight golf cart gameplay entity.

========================================================
*/

"use strict";

export class GolfCart
{
    constructor(scene, input, terrain, position)
    {
        this.name = "Golf Cart";
        this.scene = scene;
        this.input = input;
        this.terrain = terrain;
        this.mesh = null;
        this.driver = null;
        this.speed = 0;
        this.maxForwardSpeed = 20;
        this.maxReverseSpeed = 8;
        this.acceleration = 15;
        this.braking = 28;
        this.drag = 7;
        this.steeringSpeed = 1.9;

        this.createModel(position);
    }

    createModel(position)
    {
        this.mesh = new BABYLON.TransformNode("GolfCart", this.scene);
        this.mesh.position.copyFrom(position);

        const bodyMaterial = this.createMaterial("CartBody", [0.05, 0.44, 0.72]);
        const darkMaterial = this.createMaterial("CartDark", [0.035, 0.045, 0.05]);
        const seatMaterial = this.createMaterial("CartSeat", [0.82, 0.77, 0.62]);

        this.createBox("CartChassis", [2.0, 0.5, 3.2], [0, 0.65, 0], bodyMaterial);
        this.createBox("CartFloor", [1.8, 0.16, 2.1], [0, 1.0, -0.1], darkMaterial);
        this.createBox("CartSeat", [1.7, 0.55, 0.65], [0, 1.25, -0.25], seatMaterial);
        this.createBox("CartRoof", [2.15, 0.14, 2.8], [0, 2.65, 0], bodyMaterial);

        for (const x of [-0.82, 0.82])
        {
            for (const z of [-1.15, 1.15])
            {
                const wheel = BABYLON.MeshBuilder.CreateCylinder(
                    "CartWheel",
                    { height: 0.34, diameter: 0.72, tessellation: 16 },
                    this.scene
                );
                wheel.parent = this.mesh;
                wheel.position.set(x, 0.48, z);
                wheel.rotation.z = Math.PI / 2;
                wheel.material = darkMaterial;
            }
        }

        for (const x of [-0.82, 0.82])
        {
            const post = this.createBox(
                "CartRoofPost",
                [0.09, 1.65, 0.09],
                [x, 1.85, 0.95],
                darkMaterial
            );
            post.rotation.x = -0.12;
        }

        this.snapToTerrain();
    }

    createBox(name, size, position, material)
    {
        const box = BABYLON.MeshBuilder.CreateBox(
            name,
            { width: size[0], height: size[1], depth: size[2] },
            this.scene
        );
        box.parent = this.mesh;
        box.position.set(position[0], position[1], position[2]);
        box.material = material;
        return box;
    }

    createMaterial(name, color)
    {
        const material = new BABYLON.StandardMaterial(name, this.scene);
        material.diffuseColor = new BABYLON.Color3(...color);
        material.specularColor = new BABYLON.Color3(0.18, 0.18, 0.18);
        return material;
    }

    update(deltaSeconds)
    {
        if (!this.driver)
        {
            this.applyDrag(deltaSeconds);
            return;
        }

        const throttle =
            (this.input.isDown("KeyW") ? 1 : 0) -
            (this.input.isDown("KeyS") ? 1 : 0);
        const steering =
            (this.input.isDown("KeyD") ? 1 : 0) -
            (this.input.isDown("KeyA") ? 1 : 0);
        const isBraking = this.input.isDown("Space");

        if (isBraking)
        {
            this.speed = this.moveToward(this.speed, 0, this.braking * deltaSeconds);
        }
        else if (throttle !== 0)
        {
            const target = throttle > 0 ? this.maxForwardSpeed : -this.maxReverseSpeed;
            this.speed = this.moveToward(this.speed, target, this.acceleration * deltaSeconds);
        }
        else
        {
            this.applyDrag(deltaSeconds);
        }

        const speedRatio = Math.min(1, Math.abs(this.speed) / 5);
        const reverseDirection = this.speed < 0 ? -1 : 1;
        this.mesh.rotation.y += steering * reverseDirection *
            this.steeringSpeed * speedRatio * deltaSeconds;

        const forward = new BABYLON.Vector3(
            Math.sin(this.mesh.rotation.y),
            0,
            Math.cos(this.mesh.rotation.y)
        );
        this.mesh.position.addInPlace(forward.scale(this.speed * deltaSeconds));
        this.snapToTerrain();
    }

    applyDrag(deltaSeconds)
    {
        this.speed = this.moveToward(this.speed, 0, this.drag * deltaSeconds);
    }

    moveToward(value, target, amount)
    {
        if (value < target)
        {
            return Math.min(value + amount, target);
        }
        return Math.max(value - amount, target);
    }

    snapToTerrain()
    {
        this.mesh.position.y = this.terrain.getHeight(
            this.mesh.position.x,
            this.mesh.position.z
        );
    }

    enter(driver)
    {
        if (this.driver)
        {
            return false;
        }
        this.driver = driver;
        driver.enterVehicle(this);
        return true;
    }

    exit()
    {
        if (!this.driver || Math.abs(this.speed) > 1.5)
        {
            return null;
        }
        const right = new BABYLON.Vector3(
            Math.cos(this.mesh.rotation.y),
            0,
            -Math.sin(this.mesh.rotation.y)
        );
        const exitPosition = this.mesh.position.add(right.scale(2));
        exitPosition.y = this.terrain.getHeight(exitPosition.x, exitPosition.z) + 1;
        const driver = this.driver;
        this.driver = null;
        driver.exitVehicle(exitPosition);
        return driver;
    }

    get driverPosition()
    {
        return this.mesh.position.add(new BABYLON.Vector3(0, 1.35, 0));
    }

    get position()
    {
        return this.mesh.position;
    }

    get rotation()
    {
        return this.mesh.rotation;
    }

    get speedMph()
    {
        return Math.round(Math.abs(this.speed) * 2.237);
    }
}
