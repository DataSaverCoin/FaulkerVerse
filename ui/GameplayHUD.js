/* Minimal player-facing ride HUD. */

"use strict";

export class GameplayHUD
{
    constructor(wallet, rideSystem, session)
    {
        this.wallet = wallet;
        this.rideSystem = rideSystem;
        this.session = session;
        this.root = null;
        this.walletValue = null;
        this.objective = null;
        this.fare = null;
        this.status = null;
        this.distance = null;
        this.prompt = null;
        this.earnings = null;
    }

    initialize()
    {
        this.root = document.createElement("section");
        this.root.id = "gameplayHUD";
        this.root.setAttribute("aria-label", "Ride information");
        this.root.innerHTML = `
            <div class="gameplayBrand">FAULKERVERSE RIDES</div>
            <div class="gameplayWallet">
                <span>WALLET</span>
                <strong id="walletValue">$0</strong>
            </div>
            <div class="gameplayLabel">CURRENT OBJECTIVE</div>
            <div id="rideObjective" class="gameplayObjective"></div>
            <div class="gameplayDetails">
                <span id="rideStatus"></span>
                <span id="rideFare"></span>
                <span id="rideDistance"></span>
            </div>
            <div id="rideEarnings" class="rideEarnings" aria-live="polite"></div>
            <div id="rideComplete" class="rideComplete" aria-live="polite">RIDE COMPLETE</div>
        `;
        document.body.appendChild(this.root);

        this.prompt = document.createElement("div");
        this.prompt.id = "interactionPrompt";
        document.body.appendChild(this.prompt);

        this.walletValue = document.getElementById("walletValue");
        this.objective = document.getElementById("rideObjective");
        this.fare = document.getElementById("rideFare");
        this.status = document.getElementById("rideStatus");
        this.distance = document.getElementById("rideDistance");
        this.earnings = document.getElementById("rideEarnings");
        this.completion = document.getElementById("rideComplete");
        this.lastState = null;

        this.wallet.subscribe((balance, amount) =>
        {
            this.walletValue.textContent = `$${balance}`;
            this.earnings.textContent = `+$${amount}`;
            this.earnings.classList.remove("show");
            void this.earnings.offsetWidth;
            this.earnings.classList.add("show");
        });
    }

    update()
    {
        const ride = this.rideSystem.getStatus();
        this.walletValue.textContent = `$${this.wallet.balance}`;
        this.objective.textContent = ride.objective;
        this.fare.textContent = `FARE  $${ride.fare}`;
        this.status.textContent = ride.state.replaceAll("_", " ");
        this.distance.textContent =
            ride.state === "COMPLETED"
                ? "NICE DRIVING!"
                : `${ride.distance}m AWAY`;
        this.prompt.textContent = this.session.interactionPrompt;
        if (ride.state !== this.lastState)
        {
            this.completion.classList.toggle("show", ride.state === "COMPLETED");
            this.lastState = ride.state;
        }
    }
}
