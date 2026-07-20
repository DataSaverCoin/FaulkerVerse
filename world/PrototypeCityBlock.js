/* Handcrafted Sprint 12 downtown block built from replaceable primitives. */

"use strict";

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
        this.box("MarketStreet", [18, 0.12, 112], [0, 0.08, 0], "asphalt");
        this.box("WestSidewalk", [7, 0.28, 112], [-12.5, 0.2, 0], "concrete", true);
        this.box("EastSidewalk", [7, 0.28, 112], [12.5, 0.2, 0], "concrete", true);
        this.box("HotelParkingLot", [36, 0.1, 38], [28, 0.08, 18], "asphalt");

        for (let z = -50; z <= 50; z += 10)
        {
            this.box("LaneDash", [0.24, 0.04, 5.5], [0, 0.17, z], "line");
        }
        for (const x of [21, 28, 35])
        {
            this.box("ParkingLine", [0.16, 0.04, 12], [x, 0.16, 18], "white");
        }
        for (let x = -7; x <= 7; x += 2)
        {
            this.box("CrosswalkStripe", [1.05, 0.04, 4], [x, 0.17, -42], "white");
        }
    }

    createBuildings()
    {
        this.building("GatewayHotel", [28, 18, 26], [29, 9, -25], "hotel", 6);
        this.box("HotelCanopy", [12, 0.7, 7], [14.5, 4, -25], "metal", true);
        this.box("HotelWelcome", [8, 2.1, 0.3], [15, 2.1, -21.7], "glass");
        this.building("BrickLofts", [25, 24, 30], [-29, 12, -23], "brick", 7);
        this.building("MarketOffices", [24, 30, 28], [-29, 15, 29], "glass", 8);
        this.building("ParkingGarage", [28, 13, 25], [31, 6.5, 43], "concrete", 4);
    }

    building(name, size, position, material, floors)
    {
        this.box(name, size, position, material, true);
        for (let floor = 1; floor < floors; floor += 1)
        {
            const y = position[1] - size[1] / 2 + floor * size[1] / floors;
            for (const zOffset of [-size[2] / 2 - 0.03, size[2] / 2 + 0.03])
            {
                this.box(`${name}Windows`, [size[0] * 0.72, 0.55, 0.08], [position[0], y, position[2] + zOffset], "glass");
            }
        }
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
            this.box("BenchSeat", [2.7, 0.25, 0.7], [-13, 0.9, z], "metal", true);
            this.box("TrashCan", [0.7, 1.1, 0.7], [-10.8, 0.7, z], "metal", true);
        }
        this.box("MarketStreetSign", [2.8, 0.65, 0.15], [9.8, 3.8, -42], "hotel");
        this.box("StreetSignPost", [0.12, 4, 0.12], [9.8, 2, -42], "metal", true);
    }

    streetlight(x, z)
    {
        this.box("StreetlightPole", [0.16, 6.5, 0.16], [x, 3.25, z], "metal", true);
        const lamp = BABYLON.MeshBuilder.CreateSphere("StreetlightLamp", { diameter: 0.55, segments: 8 }, this.scene);
        lamp.parent = this.root;
        lamp.position.set(x, this.groundHeight(x, z) + 6.4, z);
        lamp.material = this.materials.get("white");
    }

    createLandscaping()
    {
        this.box("HotelLawn", [10, 0.14, 32], [49, 0.12, 18], "grass");
        for (const [x, z] of [[-14, -42], [-14, -8], [-14, 28], [14, -8], [47, 8], [47, 28]])
        {
            this.tree(x, z);
        }
        for (const z of [-32, -26, -20])
        {
            this.box("HotelPlanter", [1.8, 0.65, 1.8], [13, 0.5, z], "concrete", true);
        }
    }

    tree(x, z)
    {
        const y = this.groundHeight(x, z);
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

    box(name, size, position, material, collidable = false)
    {
        const mesh = BABYLON.MeshBuilder.CreateBox(name, { width: size[0], height: size[1], depth: size[2] }, this.scene);
        mesh.parent = this.root;
        mesh.position.set(position[0], this.groundHeight(position[0], position[2]) + position[1], position[2]);
        mesh.material = this.materials.get(material);
        mesh.checkCollisions = collidable;
        mesh.receiveShadows = true;
        if (collidable)
        {
            this.lighting.addShadowCaster(mesh);
        }
        return mesh;
    }

    groundHeight(x, z)
    {
        return this.terrain.getHeight(x, z);
    }
}
