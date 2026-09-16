import {TrainRide} from './TrainRide.js';
import { HelicopterRide } from './HelicopterRide.js';
import { VehicleAccess } from './VehicleAccess.js';
import { StreetLife } from './StreetLife.js';
import { RideRoute } from './RideRoute.js';
import { CartEmergency } from './CartEmergency.js';
import { PlayerLife } from './PlayerLife.js';
import { CityImpacts } from './CityImpacts.js';
import { WheelRide } from './WheelRide.js';
/* Coordinates player, vehicle, ride, economy, and feedback systems. */

"use strict";

export class GameplaySession
{
    constructor(player, cart, rideSystem, input, audio, terrain)
    {
        this.name = "Gameplay Session";
        this.player = player;
        this.cart = cart;
        this.rideSystem = rideSystem;
        this.input = input;
        this.audio = audio;
        this.terrain = terrain;
        this.interactionPrompt = "";
        this.trainRide=new TrainRide(this);this.wheelRide=new WheelRide(this);this.helicopterRide=new HelicopterRide(this);
        this.life=new PlayerLife(this);this.emergency=new CartEmergency(this);this.impacts=new CityImpacts(this);this.route=new RideRoute(this);
        this.vehicles=new VehicleAccess(this);this.streetLife=new StreetLife(this);
        this.teleportLocations = terrain.downtown ? [...terrain.downtown.data.stops.slice(0, 3), ...terrain.downtown.data.stops.slice(6, 9)].map(s=>({...s,...terrain.downtown.nearestRoad(s.x,s.z)})) : [
            { name: "Block A", x: -116, z: -60 },
            { name: "Block B", x: 0, z: 0 },
            { name: "Block C", x: 116, z: 60 }
        ];
    }

    update(deltaSeconds)
    {
        this.services?.update(deltaSeconds);
        this.terrain.downtown?.riverfront?.update(deltaSeconds,this.helicopterRide.active);
        if(this.trainRide.active){this.trainRide.update();this.life.update(deltaSeconds);this.route.clear();return;}
        if(this.helicopterRide.active){this.helicopterRide.update(deltaSeconds);this.life.update(deltaSeconds);this.route.clear();return;}
        this.vehicles.update(deltaSeconds);this.streetLife.update(deltaSeconds);
        this.emergency.update(deltaSeconds);
        this.life.update(deltaSeconds);
        if(this.life.dead){this.route.clear();return;}
        if(this.wheelRide.active){this.wheelRide.update();this.route.clear();return;}
        this.cart.update(deltaSeconds);
        this.impacts.update(deltaSeconds);
        if(this.life.dead)return;
        if(this.player.isDriving)
        {
            this.player.mesh.position.copyFrom(this.cart.driverPosition);
            this.player.mesh.rotation.y=this.cart.rotation.y;
        }
        this.audio.updateVehicle(
            this.cart.speed,
            this.cart.throttle,
            this.input.isDown("Space"),
            this.player.isDriving
        );
        if(!this.emergency.active)this.rideSystem.update(deltaSeconds);
        this.route.update(deltaSeconds);
        this.updateDebugTeleport();
        this.updateInteraction();
    }

    updateDebugTeleport()
    {
        for (let index = 0; index < this.teleportLocations.length; index += 1)
        {
            if (!this.input.consumePressed(`F${index + 1}`))
            {
                continue;
            }

            if(index===6){this.viewTrain();continue;}
            const location = this.teleportLocations[index];
            const target = this.player.isDriving
                ? this.cart.position
                : this.player.position;
            target.set(
                location.x,
                this.terrain.getHeightAt(location.x, location.z) + (this.player.isDriving ? 0 : 1),
                location.z
            );
            this.cart.speed = 0;
            this.cart.bumper.reset();
            console.info(`[FaulkerVerse] Teleported to ${location.name}.`);
        }
    }

    viewWheel()
    {
        if(this.life.dead)return false;
        this.trainRide.leave();this.helicopterRide.leave();this.wheelRide.leave();
        const map=this.terrain.downtown;if(!map?.wheel)return false;
        const spot=map.nearestRoad(map.wheel.root.position.x,map.wheel.root.position.z);
        const target=this.player.isDriving?this.cart.position:this.player.position;
        target.set(spot.x,this.terrain.getHeightAt(spot.x,spot.z)+(this.player.isDriving?0:1),spot.z);
        this.cart.speed=0;this.cart.bumper.reset();
        const controller=this.player.cameraController;controller.restoreFollow();controller.focusUntil=performance.now()+12000;
        const camera=controller.camera;camera.checkCollisions=false;camera.upperRadiusLimit=80;
        camera.setTarget(map.wheel.root.position.add(new BABYLON.Vector3(0,9,0)));camera.radius=30;camera.alpha=-.26;camera.beta=1.25;return true;
    }

    viewTrain()
    {
        if(this.life.dead)return false;
        this.trainRide.leave();this.helicopterRide.leave();this.wheelRide.leave();
        const train=this.terrain.downtown?.train;if(!train)return false;
        const weather=this.terrain.downtown.weather;if(weather){weather.hour=12;weather.auto=false;weather.setMode('clear');weather.update(0);}
        const location=train.entrance;
        const target=this.player.isDriving?this.cart.position:this.player.position;
        target.set(location.x,this.terrain.getHeightAt(location.x,location.z)+(this.player.isDriving?0:1),location.z);
        if(this.player.isDriving)this.player.position.copyFrom(this.cart.driverPosition);
        this.cart.speed=0;this.cart.bumper.reset();
        this.player.cameraController?.showTrain(train);return true;
    }

    updateInteraction()
    {
        const interactPressed =
            this.input.consumePressed("KeyE");

        if(this.emergency.active&&this.player.isDriving){this.interactionPrompt="E / Enter-exit · Evacuate everyone";if(interactPressed)this.emergency.evacuate();return;}
        if(this.trainRide.nearEntrance())
        {
            this.interactionPrompt='E / Enter-exit · Board Union Station train';
            if(interactPressed)this.trainRide.board();
            return;
        }
        if(this.helicopterRide.nearEntrance())
        {
            this.interactionPrompt="E / Enter-exit · Ride riverfront helicopter";
            if(interactPressed)this.helicopterRide.board();
            return;
        }
        if(this.wheelRide.nearEntrance())
        {
            this.interactionPrompt=Math.abs(this.cart.speed)>1.5&&this.player.isDriving?'Stop in the glowing circle to ride the Ferris wheel':'E / Enter-exit · Ride Ferris wheel';
            if(interactPressed)this.wheelRide.board();
            return;
        }
        if (this.player.isDriving)
        {
            this.interactionPrompt =
                Math.abs(this.cart.speed) <= 1.5
                    ? "E  Exit vehicle"
                    : "Stop to exit";

            if (interactPressed)
            {
                if (this.cart.exit())
                {
                    this.audio.play("exit");
                }
            }
            return;
        }

        if(this.vehicles.interact(interactPressed))return;
        const distance = BABYLON.Vector3.Distance(
            this.player.position,
            this.cart.position
        );

        this.interactionPrompt =
            distance <= 3.5
                ? "E  Enter golf cart"
                : "Walk to the golf cart";

        if (
            distance <= 3.5 &&
            interactPressed &&
            this.cart.enter(this.player)
        )
        {
            this.audio.play("enter");
        }
    }
}
