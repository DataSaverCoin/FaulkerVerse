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
        this.teleportLocations = [
            { name: "Block A", x: -116, z: -60 },
            { name: "Block B", x: 0, z: 0 },
            { name: "Block C", x: 116, z: 60 }
        ];
    }

    update(deltaSeconds)
    {
        this.cart.update(deltaSeconds);
        this.audio.updateVehicle(
            this.cart.speed,
            this.cart.throttle,
            this.input.isDown("Space")
        );
        this.rideSystem.update(deltaSeconds);
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
            console.info(`[FaulkerVerse] Teleported to ${location.name}.`);
        }
    }

    updateInteraction()
    {
        const interactPressed =
            this.input.consumePressed("KeyE");

        if (this.player.isDriving)
        {
            this.interactionPrompt =
                Math.abs(this.cart.speed) <= 1.5
                    ? "E  Exit golf cart"
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
