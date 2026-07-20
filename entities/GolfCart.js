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
        this.throttle = 0;
        this.steering = 0;
        this.maxForwardSpeed = 20;
        this.maxReverseSpeed = 8;
        this.acceleration = 12;
        this.braking = 22;
        this.drag = 3.2;
        this.steeringSpeed = 1.9;
        this.throttleResponse = 3.5;
        this.steeringResponse = 5.5;
        this.wheels = [];

        this.createModel(position);
    }

    createModel(position)
    {
        this.mesh = new BABYLON.TransformNode("GolfCart", this.scene);
        this.mesh.position.copyFrom(position);
        this.visualRoot = new BABYLON.TransformNode("GolfCartVisuals", this.scene);
        this.visualRoot.parent = this.mesh;

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
                wheel.parent = this.visualRoot;
                wheel.position.set(x, 0.48, z);
                wheel.rotation.z = Math.PI / 2;
                wheel.material = darkMaterial;
                wheel.metadata = { front: z > 0 };
                this.wheels.push(wheel);
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
        box.parent = this.visualRoot;
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

        const throttleInput =
            (this.input.isDown("KeyW") ? 1 : 0) -
            (this.input.isDown("KeyS") ? 1 : 0);
        const steeringInput =
            (this.input.isDown("KeyD") ? 1 : 0) -
            (this.input.isDown("KeyA") ? 1 : 0);
        const isBraking = this.input.isDown("Space");

        this.throttle = this.damp(this.throttle, throttleInput, this.throttleResponse, deltaSeconds);
        this.steering = this.damp(this.steering, steeringInput, this.steeringResponse, deltaSeconds);

        if (isBraking)
        {
            this.speed = this.moveToward(this.speed, 0, this.braking * deltaSeconds);
        }
        else if (Math.abs(this.throttle) > 0.01)
        {
            const target = this.throttle > 0 ?
                this.maxForwardSpeed * this.throttle :
                this.maxReverseSpeed * this.throttle;
            const changingDirection = Math.sign(target) !== Math.sign(this.speed) && Math.abs(this.speed) > 0.2;
            const force = changingDirection ? this.braking : this.acceleration;
            this.speed = this.moveToward(this.speed, target, force * deltaSeconds);
        }
        else
        {
            this.applyDrag(deltaSeconds);
        }

        const speedRatio = Math.min(1, Math.abs(this.speed) / this.maxForwardSpeed);
        const steeringGrip = 1 - speedRatio * 0.48;
        const reverseDirection = this.speed < 0 ? -1 : 1;
        this.mesh.rotation.y += this.steering * reverseDirection *
            this.steeringSpeed * steeringGrip * Math.min(1, Math.abs(this.speed) / 4) * deltaSeconds;

        const forward = new BABYLON.Vector3(
            Math.sin(this.mesh.rotation.y),
            0,
            Math.cos(this.mesh.rotation.y)
        );
        this.mesh.position.addInPlace(forward.scale(this.speed * deltaSeconds));
        this.updatePresentation(deltaSeconds, speedRatio);
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

    damp(value, target, response, deltaSeconds)
    {
        return BABYLON.Scalar.Lerp(value, target, 1 - Math.exp(-response * deltaSeconds));
    }

    updatePresentation(deltaSeconds, speedRatio)
    {
        const wheelTravel = this.speed * deltaSeconds / 0.36;
        const steeringAngle = this.steering * 0.38;

        for (const wheel of this.wheels)
        {
            wheel.rotation.x += wheelTravel;
            wheel.rotation.y = wheel.metadata.front ? steeringAngle : 0;
        }

        const desiredRoll = -this.steering * speedRatio * 0.075;
        this.visualRoot.rotation.z = this.damp(
            this.visualRoot.rotation.z,
            desiredRoll,
            4.5,
            deltaSeconds
        );
        this.visualRoot.position.y = Math.sin(performance.now() * 0.006) * speedRatio * 0.018;
    }

    snapToTerrain()
    {
        this.mesh.position.y = this.terrain.getHeightAt(
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
        exitPosition.y = this.terrain.getHeightAt(exitPosition.x, exitPosition.z) + 1;
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
