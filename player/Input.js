/*
========================================================

FaulkerVerse Engine

File:
    Input.js

Purpose:
    Centralized keyboard input.

========================================================
*/

"use strict";

export class Input
{
    constructor()
    {
        this.keys = new Map();
        this.touchKeys=new Map();
        this.touchSteering = 0;
        this.touchThrottle = 0;
        window.addEventListener("blur",()=>this.reset());
        document.addEventListener("visibilitychange",()=>{if(document.hidden)this.reset();});
        this.pressed = new Set();

        window.addEventListener(
            "keydown",
            (event) =>
            {
                if (/^F[1-8]$/.test(event.code)) event.preventDefault();
                if (!this.keys.get(event.code))
                {
                    this.pressed.add(event.code);
                }

                this.keys.set(
                    event.code,
                    true
                );
            }
        );

        window.addEventListener(
            "keyup",
            (event) =>
            {
                this.keys.set(
                    event.code,
                    false
                );
            }
        );
    }

    isDown(code)
    {
        return this.keys.get(code) === true || this.touchKeys.get(code) === true;
    }

    setTouch(code,down)
    {
        if(down&&!this.isDown(code))this.pressed.add(code);
        this.touchKeys.set(code,down);
    }
    setTouchSteering(value)
    {
        const magnitude = Math.max(0, (Math.min(1, Math.abs(value)) - 0.15) / 0.85);
        this.touchSteering = Math.sign(value) * magnitude * magnitude;
    }

    setTouchThrottle(value)
    {
        this.touchThrottle = Math.sign(value) * Math.max(0, (Math.min(1, Math.abs(value)) - 0.15) / 0.85);
    }

    getVehicleThrottle()
    {
        if (this.keys.get("KeyW") || this.keys.get("KeyS"))
            return (this.keys.get("KeyW") ? 1 : 0) - (this.keys.get("KeyS") ? 1 : 0);
        return this.touchThrottle;
    }

    getVehicleSteering()
    {
        if (this.keys.get("KeyA") || this.keys.get("KeyD"))
            return (this.keys.get("KeyD") ? 1 : 0) - (this.keys.get("KeyA") ? 1 : 0);
        return this.touchSteering;
    }

    clearTouch(){this.touchKeys.clear();this.touchSteering=0;this.touchThrottle=0;this.pressed.clear();}
    reset(){this.keys.clear();this.clearTouch();}

    consumePressed(code)
    {
        const wasPressed =
            this.pressed.has(code);

        this.pressed.delete(code);

        return wasPressed;
    }

    getMoveVector()
    {
        let x = 0;
        let z = 0;

        if (this.isDown("KeyW"))
        {
            z += 1;
        }

        if (this.isDown("KeyS"))
        {
            z -= 1;
        }

        if (this.isDown("KeyA"))
        {
            x -= 1;
        }

        if (this.isDown("KeyD"))
        {
            x += 1;
        }

        return {
            x,
            z
        };
    }

    isRunning()
    {
        return (
            this.isDown("ShiftLeft") ||
            this.isDown("ShiftRight")
        );
    }
}
