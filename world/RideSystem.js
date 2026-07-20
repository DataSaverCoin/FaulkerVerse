/*
========================================================

FaulkerVerse Engine

File:
    RideSystem.js

Purpose:
    Owns the single active passenger ride state machine.

========================================================
*/

"use strict";

export const RideState = Object.freeze({
    IDLE: "IDLE",
    ASSIGNED: "ASSIGNED",
    DRIVING_TO_PICKUP: "DRIVING_TO_PICKUP",
    PASSENGER_ONBOARD: "PASSENGER_ONBOARD",
    DRIVING_TO_DESTINATION: "DRIVING_TO_DESTINATION",
    COMPLETED: "COMPLETED"
});

export class RideSystem
{
    constructor(scene, terrain, cart, wallet, audio)
    {
        this.scene = scene;
        this.terrain = terrain;
        this.cart = cart;
        this.wallet = wallet;
        this.audio = audio;
        this.state = RideState.IDLE;
        this.rideId = 0;
        this.fare = 0;
        this.marker = null;
        this.passenger = null;
        this.pickup = null;
        this.destination = null;
        this.nextRideDelay = 0;
        this.listeners = new Set();
        this.routes = [
            [{ x: 22, z: 15 }, { x: -28, z: 38 }],
            [{ x: -18, z: -22 }, { x: 34, z: -12 }],
            [{ x: 38, z: 26 }, { x: -36, z: -30 }]
        ];
    }

    initialize()
    {
        this.assignNextRide();
    }

    update(deltaSeconds)
    {
        if (this.state === RideState.ASSIGNED && this.cart.driver)
        {
            this.transitionTo(RideState.DRIVING_TO_PICKUP);
            this.audio.play("accepted");
        }

        if (
            this.state === RideState.DRIVING_TO_PICKUP &&
            this.distanceTo(this.pickup) < 4.5 &&
            Math.abs(this.cart.speed) < 2
        )
        {
            this.boardPassenger();
        }

        if (this.state === RideState.PASSENGER_ONBOARD)
        {
            this.transitionTo(RideState.DRIVING_TO_DESTINATION);
        }

        if (
            this.state === RideState.DRIVING_TO_DESTINATION &&
            this.distanceTo(this.destination) < 4.5 &&
            Math.abs(this.cart.speed) < 2
        )
        {
            this.completeRide();
        }

        if (this.state === RideState.COMPLETED)
        {
            this.nextRideDelay -= deltaSeconds;
            if (this.nextRideDelay <= 0)
            {
                this.transitionTo(RideState.IDLE);
                this.assignNextRide();
            }
        }

        if (this.marker)
        {
            this.marker.rotation.y += deltaSeconds * 1.6;
        }
    }

    assignNextRide()
    {
        this.rideId += 1;
        const route = this.routes[(this.rideId - 1) % this.routes.length];
        this.pickup = this.toTerrainPosition(route[0]);
        this.destination = this.toTerrainPosition(route[1]);
        this.fare = 14 + (this.rideId % 4) * 4;
        this.createPassenger(this.pickup);
        this.showMarker(this.pickup, [1.0, 0.72, 0.1]);
        this.transitionTo(RideState.ASSIGNED);
    }

    boardPassenger()
    {
        this.transitionTo(RideState.PASSENGER_ONBOARD);
        this.passenger.setEnabled(false);
        this.showMarker(this.destination, [0.25, 0.9, 0.48]);
        this.audio.play("pickup");
    }

    completeRide()
    {
        this.passenger.position.copyFrom(this.destination);
        this.passenger.position.y += 0.9;
        this.passenger.setEnabled(true);
        this.wallet.deposit(this.fare);
        this.showMarker(null);
        this.transitionTo(RideState.COMPLETED);
        this.nextRideDelay = 2.5;
        this.audio.play("completed");
        window.setTimeout(() => this.audio.play("money"), 180);
        window.setTimeout(() => this.passenger && this.passenger.setEnabled(false), 1200);
    }

    transitionTo(state)
    {
        this.state = state;
        for (const listener of this.listeners)
        {
            listener(this.getStatus());
        }
    }

    subscribe(listener)
    {
        this.listeners.add(listener);
        listener(this.getStatus());
        return () => this.listeners.delete(listener);
    }

    getStatus()
    {
        return {
            id: this.rideId,
            state: this.state,
            fare: this.fare,
            objective: this.objective,
            distance: Math.round(this.distanceToTarget)
        };
    }

    get objective()
    {
        const objectives = {
            [RideState.IDLE]: "Finding your next passenger…",
            [RideState.ASSIGNED]: "Enter the golf cart",
            [RideState.DRIVING_TO_PICKUP]: "Drive to the gold pickup marker",
            [RideState.PASSENGER_ONBOARD]: "Passenger boarding…",
            [RideState.DRIVING_TO_DESTINATION]: "Drive to the green destination",
            [RideState.COMPLETED]: `Ride complete · +$${this.fare}`
        };
        return objectives[this.state];
    }

    get distanceToTarget()
    {
        if (this.state === RideState.DRIVING_TO_DESTINATION)
        {
            return this.distanceTo(this.destination);
        }
        if (this.pickup)
        {
            return this.distanceTo(this.pickup);
        }
        return 0;
    }

    distanceTo(position)
    {
        if (!position)
        {
            return 0;
        }
        const dx = this.cart.position.x - position.x;
        const dz = this.cart.position.z - position.z;
        return Math.sqrt(dx * dx + dz * dz);
    }

    toTerrainPosition(point)
    {
        return new BABYLON.Vector3(
            point.x,
            this.terrain.getHeight(point.x, point.z),
            point.z
        );
    }

    createPassenger(position)
    {
        if (this.passenger)
        {
            this.passenger.dispose();
        }
        this.passenger = BABYLON.MeshBuilder.CreateCapsule(
            "RidePassenger",
            { radius: 0.42, height: 1.8 },
            this.scene
        );
        this.passenger.position.copyFrom(position);
        this.passenger.position.y += 0.9;
        const material = new BABYLON.StandardMaterial("PassengerMaterial", this.scene);
        material.diffuseColor = new BABYLON.Color3(0.82, 0.24, 0.3);
        this.passenger.material = material;
    }

    showMarker(position, color)
    {
        if (this.marker)
        {
            this.marker.dispose();
            this.marker = null;
        }
        if (!position)
        {
            return;
        }
        this.marker = BABYLON.MeshBuilder.CreateTorus(
            "RideMarker",
            { diameter: 6, thickness: 0.32, tessellation: 32 },
            this.scene
        );
        this.marker.position.copyFrom(position);
        this.marker.position.y += 0.25;
        const material = new BABYLON.StandardMaterial("RideMarkerMaterial", this.scene);
        material.emissiveColor = new BABYLON.Color3(...color);
        material.alpha = 0.86;
        this.marker.material = material;
    }
}
