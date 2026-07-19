/*
========================================================

FaulkerVerse Engine

File:
    SceneryFactory.js

Purpose:
    Creates reusable procedural
    scenery primitives.

========================================================
*/

"use strict";

export class SceneryFactory
{
    constructor(scene, root, lighting, random)
    {
        this.scene = scene;
        this.root = root;
        this.lighting = lighting;
        this.random = random;
        this.materials = new Map();

        this.createMaterials();
    }

    createMaterials()
    {
        this.createMaterial("Bark", [0.28, 0.16, 0.07]);
        this.createMaterial("Leaves", [0.12, 0.34, 0.08]);
        this.createMaterial("Bush", [0.10, 0.29, 0.07]);
        this.createMaterial("Stone", [0.30, 0.32, 0.30]);
        this.createMaterial("Grass", [0.20, 0.46, 0.12]);
    }

    createMaterial(name, color)
    {
        const material =
            new BABYLON.StandardMaterial(
                `Environment${name}Material`,
                this.scene
            );

        material.diffuseColor =
            new BABYLON.Color3(
                color[0],
                color[1],
                color[2]
            );
        material.specularColor =
            new BABYLON.Color3(
                0.04,
                0.04,
                0.04
            );

        this.materials.set(name, material);
    }

    createTree(position)
    {
        const root = this.createRoot("Tree", position);
        const height = this.randomRange(4.5, 8.5);
        const trunk =
            BABYLON.MeshBuilder.CreateCylinder(
                "TreeTrunk",
                {
                    height,
                    diameterTop: 0.34,
                    diameterBottom: 0.65,
                    tessellation: 8
                },
                this.scene
            );

        trunk.parent = root;
        trunk.position.y = height / 2;
        trunk.material = this.materials.get("Bark");
        trunk.checkCollisions = true;
        this.addShadowCaster(trunk);

        for (let layer = 0; layer < 3; layer += 1)
        {
            const crown =
                BABYLON.MeshBuilder.CreateSphere(
                    "TreeCrown",
                    {
                        diameter: 3.4 - layer * 0.45,
                        segments: 6
                    },
                    this.scene
                );

            crown.parent = root;
            crown.position.y = height - 0.5 + layer * 0.8;
            crown.scaling.y = 0.72;
            crown.material = this.materials.get("Leaves");
            this.addShadowCaster(crown);
        }

        return root;
    }

    createBush(position)
    {
        const root = this.createRoot("Bush", position);

        for (let part = 0; part < 3; part += 1)
        {
            const bush =
                BABYLON.MeshBuilder.CreateSphere(
                    "BushPart",
                    {
                        diameter: this.randomRange(1.1, 1.8),
                        segments: 6
                    },
                    this.scene
                );

            bush.parent = root;
            bush.position.set(
                (part - 1) * 0.48,
                this.randomRange(0.45, 0.75),
                this.randomRange(-0.25, 0.25)
            );
            bush.scaling.y = 0.72;
            bush.material = this.materials.get("Bush");
            this.addShadowCaster(bush);
        }

        return root;
    }

    createRock(position, large)
    {
        const root =
            this.createRoot(
                large ? "LargeRock" : "SmallRock",
                position
            );
        const diameter =
            large
                ? this.randomRange(1.8, 3.6)
                : this.randomRange(0.35, 1.15);
        const rock =
            BABYLON.MeshBuilder.CreatePolyhedron(
                "Rock",
                {
                    type: 2,
                    size: diameter / 2
                },
                this.scene
            );

        rock.parent = root;
        rock.position.y = diameter * 0.28;
        rock.rotation.set(
            this.random() * 0.4,
            this.random() * Math.PI,
            this.random() * 0.4
        );
        rock.scaling.set(
            1,
            this.randomRange(0.55, 0.9),
            this.randomRange(0.75, 1.25)
        );
        rock.material = this.materials.get("Stone");
        rock.checkCollisions = true;
        this.addShadowCaster(rock);

        return root;
    }

    createFallenLog(position)
    {
        const root = this.createRoot("FallenLog", position);
        const log =
            BABYLON.MeshBuilder.CreateCylinder(
                "Log",
                {
                    height: this.randomRange(2.5, 5.0),
                    diameter: this.randomRange(0.45, 0.75),
                    tessellation: 8
                },
                this.scene
            );

        log.parent = root;
        log.position.y = 0.35;
        log.rotation.z = Math.PI / 2;
        log.material = this.materials.get("Bark");
        log.checkCollisions = true;
        this.addShadowCaster(log);

        return root;
    }

    createGrassClump(position)
    {
        const root = this.createRoot("GrassClump", position);

        for (let blade = 0; blade < 3; blade += 1)
        {
            const grass =
                BABYLON.MeshBuilder.CreatePlane(
                    "GrassBlade",
                    {
                        width: this.randomRange(0.45, 0.8),
                        height: this.randomRange(0.7, 1.25),
                        sideOrientation: BABYLON.Mesh.DOUBLESIDE
                    },
                    this.scene
                );

            grass.parent = root;
            grass.position.y = 0.42;
            grass.rotation.y = blade * Math.PI / 3;
            grass.material = this.materials.get("Grass");
        }

        return root;
    }

    createRoot(name, position)
    {
        const root =
            new BABYLON.TransformNode(
                name,
                this.scene
            );

        root.parent = this.root;
        root.position.copyFrom(position);
        root.rotation.y = this.random() * Math.PI * 2;
        root.scaling.scaleInPlace(
            this.randomRange(0.85, 1.2)
        );

        return root;
    }

    addShadowCaster(mesh)
    {
        this.lighting.addShadowCaster(mesh);
    }

    randomRange(minimum, maximum)
    {
        return minimum +
            (maximum - minimum) *
            this.random();
    }
}
