/*
========================================================

FaulkerVerse Engine

File:
    DeveloperHUD.js

Purpose:
    Displays a real-time developer
    overlay for debugging gameplay.

========================================================
*/

"use strict";

import { Version } from "../engine/Version.js";

export class DeveloperHUD
{
    constructor(engine)
    {
        this.engine = engine;

        this.root = null;

        this.fps = null;
        this.entities = null;
        this.assets = null;
        this.camera = null;
        this.sprint = null;

        this.playerX = null;
        this.playerY = null;
        this.playerZ = null;
        this.rideState = null;
        this.wallet = null;
        this.vehicleSpeed = null;
        this.rideId = null;
    }

    initialize()
    {
        this.root =
            document.createElement("div");

        this.root.id =
            "developerHUD";

        document.body.appendChild(
            this.root
        );

        this.root.innerHTML =
`
<div class="hudTitle">
FaulkerVerse Developer HUD
</div>

<div class="hudRow">
<span>Build</span>
<span>${Version.ShortLabel}</span>
</div>

<div class="hudRow">
<span>Branch</span>
<span>${Version.Branch}</span>
</div>

<div class="hudRow">
<span>Commit</span>
<span>${Version.Commit}</span>
</div>

<div class="hudRow">
<span>Built</span>
<span>${Version.BuildDate}</span>
</div>

<div class="hudRow">
<span>FPS</span>
<span id="hudFPS">0</span>
</div>

<div class="hudRow">
<span>Entities</span>
<span id="hudEntities">0</span>
</div>

<div class="hudRow">
<span>Assets</span>
<span id="hudAssets">0</span>
</div>

<div class="hudRow">
<span>Camera</span>
<span id="hudCamera">0</span>
</div>

<div class="hudRow">
<span>Sprint</span>
<span id="hudSprint">OFF</span>
</div>

<hr>

<div class="hudRow">
<span>Player X</span>
<span id="hudPlayerX">0</span>
</div>

<div class="hudRow">
<span>Player Y</span>
<span id="hudPlayerY">0</span>
</div>

<div class="hudRow">
<span>Player Z</span>
<span id="hudPlayerZ">0</span>
</div>

<hr>

<div class="hudRow">
<span>Ride State</span>
<span id="hudRideState">IDLE</span>
</div>

<div class="hudRow">
<span>Ride ID</span>
<span id="hudRideId">0</span>
</div>

<div class="hudRow">
<span>Wallet</span>
<span id="hudWallet">$0</span>
</div>

<div class="hudRow">
<span>Vehicle</span>
<span id="hudVehicleSpeed">0 mph</span>
</div>
`;

        this.fps =
            document.getElementById(
                "hudFPS"
            );

        this.entities =
            document.getElementById(
                "hudEntities"
            );

        this.assets =
            document.getElementById(
                "hudAssets"
            );

        this.camera =
            document.getElementById(
                "hudCamera"
            );

        this.sprint =
            document.getElementById(
                "hudSprint"
            );

        this.playerX =
            document.getElementById(
                "hudPlayerX"
            );

        this.playerY =
            document.getElementById(
                "hudPlayerY"
            );

        this.playerZ =
            document.getElementById(
                "hudPlayerZ"
            );

        this.rideState = document.getElementById("hudRideState");
        this.rideId = document.getElementById("hudRideId");
        this.wallet = document.getElementById("hudWallet");
        this.vehicleSpeed = document.getElementById("hudVehicleSpeed");
    }

    update(deltaSeconds)
    {
        if (!this.root)
        {
            return;
        }

        if (deltaSeconds > 0)
        {
            this.fps.textContent =
                Math.round(
                    1 / deltaSeconds
                );
        }

        if (this.engine.entityManager)
        {
            this.entities.textContent =
                this.engine.entityManager.count;
        }

        if (
            this.engine.assetManager &&
            this.engine.assetManager.models
        )
        {
            this.assets.textContent =
                this.engine.assetManager.models.size;
        }

        if (
            this.engine.world &&
            this.engine.world.camera
        )
        {
            this.camera.textContent =
                this.engine.world.camera.radius.toFixed(
                    2
                );
        }

        if (
            this.engine.input &&
            this.engine.input.isRunning()
        )
        {
            this.sprint.textContent =
                "ON";
        }
        else
        {
            this.sprint.textContent =
                "OFF";
        }

        if (this.engine.player)
        {
            const p =
                this.engine.player.position;

            this.playerX.textContent =
                p.x.toFixed(2);

            this.playerY.textContent =
                p.y.toFixed(2);

            this.playerZ.textContent =
                p.z.toFixed(2);
        }

        if (this.engine.rideSystem)
        {
            this.rideState.textContent = this.engine.rideSystem.state;
            this.rideId.textContent = this.engine.rideSystem.rideId;
            this.wallet.textContent = `$${this.engine.wallet.balance}`;
            this.vehicleSpeed.textContent = `${this.engine.golfCart.speedMph} mph`;
        }
    }
}
