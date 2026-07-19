/*
========================================================

FaulkerVerse Engine

File:
    Entity.js

Purpose:
    Base class for every gameplay entity.

    Future Examples:

    • Player
    • NPC
    • Vehicle
    • Animal
    • Pickup
    • Projectile

========================================================
*/

"use strict";

export class Entity
{
    constructor(name = "Entity")
    {
        this.name = name;

        this.enabled = true;

        this.scene = null;

        this.mesh = null;
    }

    initialize(scene)
    {
        this.scene = scene;
    }

    update()
    {
        // Base implementation.
    }

    dispose()
    {
        if (this.mesh)
        {
            this.mesh.dispose();
            this.mesh = null;
        }
    }

    get position()
    {
        if (!this.mesh)
        {
            return null;
        }

        return this.mesh.position;
    }

    get rotation()
    {
        if (!this.mesh)
        {
            return null;
        }

        return this.mesh.rotation;
    }
}
