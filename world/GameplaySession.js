/* Coordinates player, vehicle, ride, economy, and feedback systems. */

"use strict";

export class GameplaySession
{
    constructor(player, cart, rideSystem, input, audio)
    {
        this.name = "Gameplay Session";
        this.player = player;
        this.cart = cart;
        this.rideSystem = rideSystem;
        this.input = input;
        this.audio = audio;
        this.interactionPrompt = "";
    }

    update(deltaSeconds)
    {
        this.cart.update(deltaSeconds);
        this.rideSystem.update(deltaSeconds);
        this.updateInteraction();
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
