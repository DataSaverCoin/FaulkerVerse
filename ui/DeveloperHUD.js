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
    }
}
