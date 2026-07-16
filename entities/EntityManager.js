/*
========================================================

FaulkerVerse Engine

File:
    EntityManager.js

Purpose:
    Owns all gameplay entities.

========================================================
*/

"use strict";

export class EntityManager
{
    constructor(scene)
    {
        this.scene = scene;

        this.entities = [];
    }

    add(entity)
    {
        if (!entity)
        {
            return null;
        }

        if (typeof entity.initialize === "function")
        {
            entity.initialize(
                this.scene
            );
        }

        this.entities.push(
            entity
        );

        return entity;
    }

    remove(entity)
    {
        const index =
            this.entities.indexOf(
                entity
            );

        if (index === -1)
        {
            return;
        }

        if (typeof entity.dispose === "function")
        {
            entity.dispose();
        }

        this.entities.splice(
            index,
            1
        );
    }

    update(deltaSeconds)
    {
        for (const entity of this.entities)
        {
            if (entity.enabled === false)
            {
                continue;
            }

            if (typeof entity.update === "function")
            {
                entity.update(
                    deltaSeconds
                );
            }
        }
    }

    clear()
    {
        for (const entity of this.entities)
        {
            if (typeof entity.dispose === "function")
            {
                entity.dispose();
            }
        }

        this.entities.length = 0;
    }

    findByName(name)
    {
        return this.entities.find(
            entity => entity.name === name
        );
    }

    get count()
    {
        return this.entities.length;
    }
}