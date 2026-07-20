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
        this.terrainSurface("MarketStreet", 18, 112, 0, 0, 0.035, "asphalt", true);
        this.terrainSurface("WestSidewalk", 7, 112, -12.5, 0, 0.18, "concrete", true);
        this.terrainSurface("EastSidewalk", 7, 112, 12.5, 0, 0.18, "concrete", true);
        this.terrainSurface("WestCurb", 0.4, 112, -9.1, 0, 0.11, "concrete", true);
        this.terrainSurface("EastCurb", 0.4, 112, 9.1, 0, 0.11, "concrete", true);
        this.terrainSurface("HotelParkingLot", 36, 38, 28, 18, 0.035, "asphalt", true);

        for (let z = -50; z <= 50; z += 10)
        {
            this.terrainSurface("LaneDash", 0.24, 5.5, 0, z, 0.055, "line");
        }
        for (const x of [21, 28, 35])
        {
            this.terrainSurface("ParkingLine", 0.16, 12, x, 18, 0.055, "white");
        }
        for (let x = -7; x <= 7; x += 2)
        {
            this.terrainSurface("CrosswalkStripe", 1.05, 4, x, -42, 0.055, "white");
        }
    }

    createBuildings()
    {
        this.building("GatewayHotel", [28, 18, 26], [29, -25], "hotel", 6);
        this.box("HotelCanopy", [12, 0.7, 7], [14.5, 4, -25], "metal", true);
        this.box("HotelWelcome", [8, 2.1, 0.3], [15, 2.1, -21.7], "glass");
        this.building("BrickLofts", [25, 24, 30], [-29, -23], "brick", 7);
        this.building("MarketOffices", [24, 30, 28], [-29, 29], "glass", 8);
        this.building("ParkingGarage", [28, 13, 25], [31, 43], "concrete", 4);
    }

    building(name, size, position, material, floors)
    {
        const [x, z] = position;
        const elevations = this.footprintElevations(x, z, size[0], size[2]);
        const base = elevations.maximum + 0.04;
        const foundationHeight = Math.max(0.2, base - elevations.minimum);

        this.absoluteBox(
            `${name}Foundation`,
            [size[0] + 0.35, foundationHeight, size[2] + 0.35],
            [x, base - foundationHeight / 2, z],
            "concrete",
            true
        );
        this.absoluteBox(name, size, [x, base + size[1] / 2, z], material, true);

        for (let floor = 1; floor < floors; floor += 1)
        {
            const y = base + floor * size[1] / floors;
            for (const zOffset of [-size[2] / 2 - 0.03, size[2] / 2 + 0.03])
            {
                this.absoluteBox(`${name}Windows`, [size[0] * 0.72, 0.55, 0.08], [x, y, z + zOffset], "glass");
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
        lamp.position.set(x, this.terrain.getHeightAt(x, z) + 6.4, z);
        lamp.material = this.materials.get("white");
    }

    createLandscaping()
    {
        this.terrainSurface("HotelLawn", 10, 32, 49, 18, 0.025, "grass");
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

    terrainSurface(name, width, depth, centerX, centerZ, elevation, material, collidable = false)
    {
        const xSegments = Math.max(1, Math.ceil(width / 3));
        const zSegments = Math.max(1, Math.ceil(depth / 3));
        const positions = [];
        const indices = [];
        const normals = [];
        const uvs = [];

        for (let zIndex = 0; zIndex <= zSegments; zIndex += 1)
        {
            const zAmount = zIndex / zSegments;
            const z = centerZ - depth / 2 + depth * zAmount;
            for (let xIndex = 0; xIndex <= xSegments; xIndex += 1)
            {
                const xAmount = xIndex / xSegments;
                const x = centerX - width / 2 + width * xAmount;
                positions.push(x, this.terrain.getHeightAt(x, z) + elevation, z);
                uvs.push(xAmount, 1 - zAmount);
            }
        }

        for (let zIndex = 0; zIndex < zSegments; zIndex += 1)
        {
            for (let xIndex = 0; xIndex < xSegments; xIndex += 1)
            {
                const topLeft = zIndex * (xSegments + 1) + xIndex;
                const bottomLeft = topLeft + xSegments + 1;
                indices.push(topLeft, bottomLeft, topLeft + 1);
                indices.push(topLeft + 1, bottomLeft, bottomLeft + 1);
            }
        }

        BABYLON.VertexData.ComputeNormals(positions, indices, normals);
        const vertexData = new BABYLON.VertexData();
        vertexData.positions = positions;
        vertexData.indices = indices;
        vertexData.normals = normals;
        vertexData.uvs = uvs;
        const mesh = new BABYLON.Mesh(name, this.scene);
        vertexData.applyToMesh(mesh);
        mesh.parent = this.root;
        mesh.material = this.materials.get(material);
        mesh.checkCollisions = collidable;
        mesh.receiveShadows = true;
        return mesh;
    }

    footprintElevations(x, z, width, depth)
    {
        const heights = [];
        for (const xOffset of [-width / 2, 0, width / 2])
        {
            for (const zOffset of [-depth / 2, 0, depth / 2])
            {
                heights.push(this.terrain.getHeightAt(x + xOffset, z + zOffset));
            }
        }
        return { minimum: Math.min(...heights), maximum: Math.max(...heights) };
    }

    box(name, size, position, material, collidable = false)
    {
        return this.absoluteBox(
            name,
            size,
            [position[0], this.terrain.getHeightAt(position[0], position[2]) + position[1], position[2]],
            material,
            collidable
        );
    }

    absoluteBox(name, size, position, material, collidable = false)
    {
        const mesh = BABYLON.MeshBuilder.CreateBox(name, { width: size[0], height: size[1], depth: size[2] }, this.scene);
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
