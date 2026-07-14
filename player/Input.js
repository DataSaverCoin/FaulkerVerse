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

        window.addEventListener(
            "keydown",
            (event) =>
            {
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
        return this.keys.get(code) === true;
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