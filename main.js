import { choosePlayer } from './ui/StartChoices.js';
import { RenderProfile } from "./engine/RenderProfile.js";
/*
========================================================

FaulkerVerse Engine

File:
    main.js

Purpose:
    Engine entry point.

========================================================
*/

"use strict";

import { startSessionTelemetry } from "./ui/SessionTelemetry.js";

import { Engine } from "./engine/Engine.js";

window.addEventListener(
    "DOMContentLoaded",
    async () =>
    {
        console.clear();

        console.log("");
        console.log("==================================");
        console.log("      FaulkerVerse Engine");
        console.log("==================================");
        console.log("");

        await choosePlayer();
        const telemetry=startSessionTelemetry();
        if(RenderProfile.lite)document.querySelector('.loadingCard small').textContent='iPhone / light graphics mode · Preparing the city in smaller stages.';
        const loading=document.getElementById('gameLoading');
        const progress=document.getElementById('loadingProgress');
        const stage=document.getElementById('loadingStage');
        const percent=document.getElementById('loadingPercent');
        const reportProgress=async (value,label) => {
            progress.value=value;stage.textContent=label;percent.textContent=`${value}%`;
            await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));
        };
        // Let the loading screen paint before constructing the large city.
        await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));
        const showError = () => { stage.textContent='The game could not finish loading. Please reload the page. If this continues, send a screenshot of the browser console.';loading.classList.add('loadingFailed'); };
        window.addEventListener('error', showError);
        window.addEventListener('unhandledrejection', showError);
        try
        {
            const engine =
                new Engine();

            await engine.start(reportProgress);

            window.Faulker =
                engine;
            await reportProgress(85,'Preparing buildings and lighting…');
            await engine.world.scene.whenReadyAsync();
            await reportProgress(95,'Rendering the first frame…');
            await new Promise(resolve => engine.world.scene.onAfterRenderObservable.addOnce(resolve));
            await reportProgress(100,'Ready — entering FaulkerVerse!');
            if(new URLSearchParams(location.search).has('train'))engine.gameplaySession.viewTrain();
            loading.remove();telemetry.ready();
            window.removeEventListener('error', showError);
            window.removeEventListener('unhandledrejection', showError);

            console.log("");
            console.log("✓ Engine Ready");
        }
        catch (error)
        {
            console.error(error);showError();
        }
    }
);