/* Handcrafted downtown block integrated with the procedural terrain. */

"use strict";

const SURFACE_OFFSET = 0.08;
const FOUNDATION_DEPTH = 0.45;

export class PrototypeCityBlock
{
    constructor(scene, terrain, lighting)
    {
        this.scene = scene;
        this.terrain = terrain;
        this.lighting = lighting;
        this.root = new BABYLON.TransformNode("PrototypeCityBlock", scene);
        this.materials = new Map();
    }

    initialize()
    {
        this.createMaterials();
        this.createStreet();
        this.createBuildings();
        this.createStreetFurniture();
        this.createLandscaping();
    }

    createMaterials()
    {
        const colors = {
            asphalt: [0.08, 0.09, 0.1], concrete: [0.48, 0.5, 0.48],
            line: [0.92, 0.82, 0.35], white: [0.9, 0.9, 0.84],
            brick: [0.38, 0.13, 0.09], hotel: [0.68, 0.61, 0.48],
            glass: [0.12, 0.3, 0.4], metal: [0.1, 0.12, 0.14],
            grass: [0.14, 0.35, 0.11], leaves: [0.1, 0.3, 0.09], bark: [0.25, 0.13, 0.06]
        };

        for (const [name, color] of Object.entries(colors))
        {
            const material = new BABYLON.StandardMaterial(`City${name}`, this.scene);
            material.diffuseColor = new BABYLON.Color3(...color);
            material.specularColor = name === "glass" ? new BABYLON.Color3(0.4, 0.5, 0.55) : BABYLON.Color3.Black();
            this.materials.set(name, material);
        }
    }

    createStreet()
    {
        this.conformingSurface("MarketStreet", 18, 112, 0, 0, "asphalt", true);
        this.conformingSurface("WestSidewalk", 7, 112, -12.5, 0, "concrete", true, 0.16);
        this.conformingSurface("EastSidewalk", 7, 112, 12.5, 0, "concrete", true, 0.16);
        this.conformingSurface("WestCurb", 0.5, 112, -9.25, 0, "concrete", true, 0.24);
        this.conformingSurface("EastCurb", 0.5, 112, 9.25, 0, "concrete", true, 0.24);
        this.conformingSurface("HotelParkingLot", 36, 38, 28, 18, "asphalt", true);

        for (let z = -50; z <= 50; z += 10)
        {
            this.conformingSurface("LaneDash", 0.24, 5.5, 0, z, "line", false, 0.11);
        }
        for (const x of [21, 28, 35])
        {
            this.conformingSurface("ParkingLine", 0.16, 12, x, 18, "white", false, 0.11);
        }
        for (let x = -7; x <= 7; x += 2)
        {
            this.conformingSurface("CrosswalkStripe", 1.05, 4, x, -42, "white", false, 0.11);
        }
    }

    conformingSurface(name, width, depth, x, z, material, collidable, offset = SURFACE_OFFSET)
    {
        const subdivisionsX = Math.max(1, Math.ceil(width / 2));
        const subdivisionsZ = Math.max(1, Math.ceil(depth / 2));
        const mesh = BABYLON.MeshBuilder.CreateGround(
            name,
            { width, height: depth, subdivisionsX, subdivisionsY: subdivisionsZ, updatable: true },
            this.scene
        );
        const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);

        for (let index = 0; index < positions.length; index += 3)
        {
            positions[index + 1] = this.terrain.getHeightAt(
                x + positions[index],
                z + positions[index + 2]
            ) + offset;
        }

        mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
        mesh.createNormals(true);
        mesh.refreshBoundingInfo();
        mesh.parent = this.root;
        mesh.position.set(x, 0, z);
        mesh.material = this.materials.get(material);
        mesh.checkCollisions = collidable;
        mesh.receiveShadows = true;
        mesh.metadata = { terrainIntegrated: true, drivingSurface: collidable };
        return mesh;
    }

    createBuildings()
    {
        this.building("GatewayHotel", [28, 18, 26], [29, -25], "hotel", 6);
        this.supportedBox("HotelCanopy", [12, 0.7, 7], [14.5, -25], 3.65, "metal", true);
        this.supportedBox("HotelWelcome", [8, 2.1, 0.3], [15, -21.7], 1.05, "glass");
        this.building("BrickLofts", [25, 24, 30], [-29, -23], "brick", 7);
        this.building("MarketOffices", [24, 30, 28], [-29, 29], "glass", 8);
        this.building("ParkingGarage", [28, 13, 25], [31, 43], "concrete", 4);
    }

    building(name, size, position, material, floors)
    {
        const support = this.getFoundationSupport(position[0], position[1], size[0], size[2]);
        const foundationHeight = support.top - support.bottom + FOUNDATION_DEPTH;
        this.absoluteBox(`${name}Foundation`, [size[0] + 1, foundationHeight, size[2] + 1],
            [position[0], support.bottom - FOUNDATION_DEPTH + foundationHeight / 2, position[1]], "concrete", true);
        this.absoluteBox(name, size, [position[0], support.top + size[1] / 2, position[1]], material, true);

        for (let floor = 1; floor < floors; floor += 1)
        {
            const y = support.top + floor * size[1] / floors;
            for (const zOffset of [-size[2] / 2 - 0.03, size[2] / 2 + 0.03])
            {
                this.absoluteBox(`${name}Windows`, [size[0] * 0.72, 0.55, 0.08],
                    [position[0], y, position[1] + zOffset], "glass");
            }
        }
    }

    getFoundationSupport(x, z, width, depth)
    {
        const samples = [];
        for (const sampleX of [x - width / 2, x, x + width / 2])
        {
            for (const sampleZ of [z - depth / 2, z, z + depth / 2])
            {
                samples.push(this.terrain.getHeightAt(sampleX, sampleZ));
            }
        }
        return { bottom: Math.min(...samples), top: Math.max(...samples) };
    }

    createStreetFurniture()
    {
        for (const z of [-46, -22, 4, 30, 50])
        {
            this.streetlight(-10, z);
            this.streetlight(10, z + 8);
        }
        for (const z of [-34, 14, 40])
        {
            this.supportedBox("BenchSeat", [2.7, 0.25, 0.7], [-13, z], 0.78, "metal", true);
            this.supportedBox("TrashCan", [0.7, 1.1, 0.7], [-10.8, z], 0.55, "metal", true);
        }
        this.supportedBox("StreetSignPost", [0.12, 4, 0.12], [9.8, -42], 2, "metal", true);
        this.supportedBox("MarketStreetSign", [2.8, 0.65, 0.15], [9.8, -42], 3.8, "hotel");
    }

    streetlight(x, z)
    {
        this.supportedBox("StreetlightPole", [0.16, 6.5, 0.16], [x, z], 3.25, "metal", true);
        const lamp = BABYLON.MeshBuilder.CreateSphere("StreetlightLamp", { diameter: 0.55, segments: 8 }, this.scene);
        lamp.parent = this.root;
        lamp.position.set(x, this.terrain.getHeightAt(x, z) + 6.4, z);
        lamp.material = this.materials.get("white");
    }

    createLandscaping()
    {
        this.conformingSurface("HotelLawn", 10, 32, 49, 18, "grass", false);
        for (const [x, z] of [[-14, -42], [-14, -8], [-14, 28], [14, -8], [47, 8], [47, 28]])
        {
            this.tree(x, z);
        }
        for (const z of [-32, -26, -20])
        {
            this.supportedBox("HotelPlanter", [1.8, 0.65, 1.8], [13, z], 0.325, "concrete", true);
        }
    }

    tree(x, z)
    {
        const y = this.terrain.getHeightAt(x, z);
        const trunk = BABYLON.MeshBuilder.CreateCylinder("CityTreeTrunk", { height: 3.5, diameter: 0.45, tessellation: 8 }, this.scene);
        trunk.parent = this.root;
        trunk.position.set(x, y + 1.75, z);
        trunk.material = this.materials.get("bark");
        trunk.checkCollisions = true;
        const crown = BABYLON.MeshBuilder.CreateSphere("CityTreeCrown", { diameter: 3.4, segments: 8 }, this.scene);
        crown.parent = this.root;
        crown.position.set(x, y + 4.1, z);
        crown.scaling.y = 0.8;
        crown.material = this.materials.get("leaves");
    }

    supportedBox(name, size, position, centerHeight, material, collidable = false)
    {
        return this.absoluteBox(name, size,
            [position[0], this.terrain.getHeightAt(position[0], position[1]) + centerHeight, position[1]],
            material, collidable);
    }

    absoluteBox(name, size, position, material, collidable = false)
    {
        const mesh = BABYLON.MeshBuilder.CreateBox(name,
            { width: size[0], height: size[1], depth: size[2] }, this.scene);
        mesh.parent = this.root;
        mesh.position.set(...position);
        mesh.material = this.materials.get(material);
        mesh.checkCollisions = collidable;
        mesh.receiveShadows = true;
        if (collidable)
        {
            this.lighting.addShadowCaster(mesh);
        }
        return mesh;
    }
}
