/*
========================================================

FaulkerVerse Engine

File:
    AssetManager.js

Purpose:
    Centralized loading and caching
    of all engine assets.

========================================================
*/

"use strict";

export class AssetManager
{
    constructor(scene)
    {
        this.scene = scene;

        this.models = new Map();
        this.textures = new Map();
        this.materials = new Map();
        this.audio = new Map();
    }

    async loadModel(name, path)
    {
        if (this.models.has(name))
        {
            return this.models.get(name);
        }

        const result =
            await BABYLON.SceneLoader.ImportMeshAsync(
                "",
                "",
                path,
                this.scene
            );

        this.models.set(
            name,
            result
        );

        return result;
    }

    async instantiateCharacter(characterName)
    {
        const result =
            await this.loadCharacter(
                characterName
            );

        const root =
            result.meshes[0];

        return {
            root,
            meshes: result.meshes,
            skeletons: result.skeletons,
            animationGroups:
                result.animationGroups
        };
    }

    async loadCharacter(characterName)
    {
        return await this.loadModel(
            characterName,
            `assets/characters/${characterName}/player.glb`
        );
    }

    async loadCharacterAnimation(
        characterName,
        animationName
    )
    {
        return await this.loadModel(
            `${characterName}_${animationName}`,
            `assets/characters/${characterName}/${animationName}.glb`
        );
    }

    async loadVehicle(name)
    {
        return await this.loadModel(
            name,
            `assets/vehicles/${name}.glb`
        );
    }

    async loadEnvironment(name)
    {
        return await this.loadModel(
            name,
            `assets/environment/${name}.glb`
        );
    }

    getModel(name)
    {
        return this.models.get(name);
    }

    hasModel(name)
    {
        return this.models.has(name);
    }

    unloadModel(name)
    {
        if (!this.models.has(name))
        {
            return;
        }

        const model =
            this.models.get(name);

        if (model.meshes)
        {
            for (const mesh of model.meshes)
            {
                mesh.dispose();
            }
        }

        this.models.delete(name);
    }

    clearModels()
    {
        for (const [name] of this.models)
        {
            this.unloadModel(name);
        }
    }

    get loadedModelCount()
    {
        return this.models.size;
    }
}
