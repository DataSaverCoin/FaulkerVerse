import { ACTOR_SCALE } from '../engine/ActorScale.js';
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

import { RideDispatch } from "./RideDispatch.js";
import { PersonAvatar } from "../entities/PersonAvatar.js";

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
        this.onDuty=false;
        this.state = RideState.IDLE;
        this.rideId = 0;
        this.fare = 0;
        this.marker = null;
        this.passenger = null;
        this.pickup = null;
        this.destination = null;
        this.nextRideDelay = 0;
        this.listeners = new Set();
        this.markerTime = 0;
        this.routes = [
            [{ x: -111, z: -60 }, { x: 111, z: 60 }],
            [{ x: -58, z: 0 }, { x: 58, z: -60 }],
            [{ x: 0, z: 60 }, { x: 116, z: 0 }],
            [{ x: 53, z: 60 }, { x: -116, z: 0 }],
            [{ x: -116, z: -60 }, { x: 5, z: 60 }],
            [{ x: 116, z: 60 }, { x: -53, z: -60 }]
        ];
    }

    initialize()
    {
        this.dispatch=new RideDispatch(this.terrain.downtown?.stops||this.routes.flat().map((s,i)=>({...s,name:`District stop ${i+1}`})));
    }

    update(deltaSeconds)
    {
        if(this.onDuty&&this.state===RideState.IDLE){this.nextRideDelay-=deltaSeconds;if(this.nextRideDelay<=0)this.assignNextRide();}
        if (this.state === RideState.ASSIGNED && this.cart.driver)
        {
            this.transitionTo(RideState.DRIVING_TO_PICKUP);
            this.audio.play("accepted");
        }

        if (
            this.state === RideState.DRIVING_TO_PICKUP &&
            this.cart.driver && this.distanceTo(this.pickup) < 4.5 &&
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
            this.cart.driver && this.distanceTo(this.destination) < 4.5 &&
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
                this.pickup=null;this.destination=null;this.fare=0;
                this.transitionTo(RideState.IDLE);
                this.assignNextRide();
            }
        }

        if(['PASSENGER_ONBOARD','DRIVING_TO_DESTINATION'].includes(this.state)&&this.passenger)
        {
            const a=this.cart.rotation.y,scale=this.cart.modelScale;
            this.passenger.position.copyFrom(this.cart.position).addInPlace(new BABYLON.Vector3(.4*Math.cos(a)+Math.sin(a),this.cart.trafficVehicle?-.45:.25,-.4*Math.sin(a)+Math.cos(a)).scale(scale));
            this.passenger.rotation.y=a;this.passengerAvatar.update(0,false,false,true);
        }
        if (this.marker)
        {
            this.markerTime += deltaSeconds;
            this.marker.rotation.y += deltaSeconds * 0.7;
            const pulse = 1 + Math.sin(this.markerTime * 3) * 0.1;
            this.marker.scaling.set(pulse, pulse, pulse);
        }
    }

    assignNextRide()
    {
        if(!this.onDuty||this.cart.seatCapacity<2)return;
        const route=this.dispatch.next(this.cart.position,this.lastDropoff);
        if(!route){this.nextRideDelay=2.5;return;}
        this.rideId += 1;
        this.pickupName = route[0].name;
        this.destinationName = route[1].name;
        this.pickup = this.toTerrainPosition(route[0]);
        this.destination = this.toTerrainPosition(route[1]);
        this.fare = 12 + Math.round(Math.hypot(route[0].x-route[1].x,route[0].z-route[1].z)/30);
        this.createPassenger(this.pickup);
        this.showMarker(this.pickup, [1.0, 0.64, 0.05], "PICKUP");
        this.transitionTo(RideState.ASSIGNED);
    }

    boardPassenger()
    {
        this.transitionTo(RideState.PASSENGER_ONBOARD);
        this.passenger.setEnabled(true);
        this.showMarker(this.destination, [0.18, 0.78, 1.0], "DROP OFF");
        this.audio.play("pickup");
    }

    completeRide()
    {
        this.streetRides?.release(true);
        this.passengerAvatar?.update(0,false,false,false);
        this.lastDropoff={x:this.destination.x,z:this.destination.z,name:this.destinationName};
        this.passenger.position.copyFrom(this.destination);
        this.passenger.position.y += 0.02;
        this.passenger.setEnabled(true);
        this.wallet.deposit(this.fare);
        this.showMarker(null);
        this.transitionTo(RideState.COMPLETED);
        this.nextRideDelay = 2.5;
        this.audio.play("completed");
        window.setTimeout(() => this.audio.play("money"), 180);
        const departingPassenger=this.passenger;
        window.setTimeout(() => !departingPassenger.isDisposed() && departingPassenger.setEnabled(false), 1200);
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
            [RideState.IDLE]: this.onDuty?"Finding your next passenger…":"Off duty · Explore, talk, or offer a ride",
            [RideState.ASSIGNED]: "Enter your vehicle",
            [RideState.DRIVING_TO_PICKUP]: "Drive to the gold pickup marker",
            [RideState.PASSENGER_ONBOARD]: "Passenger boarding…",
            [RideState.DRIVING_TO_DESTINATION]: "Drive to the green destination",
            [RideState.COMPLETED]: `Ride complete · +$${this.fare}`
        };
        if (this.pickupName && this.state === RideState.DRIVING_TO_PICKUP) return `Pick up at ${this.pickupName}`;
        if (this.destinationName && this.state === RideState.DRIVING_TO_DESTINATION) return `Drop off at ${this.destinationName} · blue marker`;
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
            this.terrain.getHeightAt(point.x, point.z),
            point.z
        );
    }

    createPassenger(position,traits={})
    {
        this.passengerAvatar?.dispose();
        this.passengerAvatar=new PersonAvatar(this.scene,{name:'Ride passenger',personal:false,gender:this.rideId%2?'woman':'man',...traits,shirt:['#953a49','#287e92','#b68635'][this.rideId%3]});
        this.passenger=this.passengerAvatar.root;
        this.passenger.scaling.setAll(ACTOR_SCALE);
        this.passenger.position.copyFrom(position);
        this.passenger.position.y+=.02;
    }

    showMarker(position, color, label = "")
    {
        if (this.marker)
        {
            this.marker.dispose(false,true);
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
        this.marker.isPickable = false;
        this.marker.renderingGroupId = 1;
        this.markerTime = 0;
        const material = new BABYLON.StandardMaterial("RideMarkerMaterial", this.scene);
        material.emissiveColor = new BABYLON.Color3(...color);
        material.alpha = 0.86;
        this.marker.material = material;
        const beacon = BABYLON.MeshBuilder.CreateCylinder(
            `${label}Beacon`,
            { height: 7, diameterTop: 0.35, diameterBottom: 2.2, tessellation: 24 },
            this.scene
        );
        beacon.parent = this.marker;
        beacon.position.y = 3.5;
        beacon.material = material;
        beacon.isPickable = false;
    }
}
