/* Sprint 13 procedural district built from reusable Babylon primitives. */

"use strict";

export class PrototypeCityBlock
{
    constructor(scene, terrain, lighting)
    {
        this.scene = scene;
        this.terrain = terrain;
        this.lighting = lighting;
        this.root = new BABYLON.TransformNode("PrototypeDistrict", scene);
        this.materials = new Map();
        this.sources = new Map();
        this.blockWidth = 44;
        this.blockDepth = 46;
        this.roadWidth = 14;
        this.surfaceElevations = Object.freeze({
            road: 0.12,
            sidewalk: 0.20,
            curb: 0.23,
            lot: 0.24,
            marking: 0.255
        });
        this.columns = 5;
        this.rows = 2;
    }

    initialize()
    {
        this.createMaterials();
        this.createRoadGrid();
        this.createBlocks();
        this.hideSources();
    }

    createMaterials()
    {
        const colors = {
            asphalt: [0.07, 0.08, 0.09], concrete: [0.72, 0.72, 0.68],
            curb: [0.42, 0.43, 0.42],
            line: [0.92, 0.82, 0.35], white: [0.9, 0.9, 0.84],
            brick: [0.38, 0.13, 0.09], sandstone: [0.68, 0.61, 0.48],
            glass: [0.12, 0.3, 0.4], metal: [0.1, 0.12, 0.14],
            grass: [0.14, 0.35, 0.11], leaves: [0.1, 0.3, 0.09],
            bark: [0.25, 0.13, 0.06], gravel: [0.34, 0.32, 0.28]
        };

        for (const [name, color] of Object.entries(colors))
        {
            const material = new BABYLON.StandardMaterial(`District${name}`, this.scene);
            material.diffuseColor = new BABYLON.Color3(...color);
            material.specularColor = name === "glass"
                ? new BABYLON.Color3(0.4, 0.5, 0.55)
                : BABYLON.Color3.Black();
            this.materials.set(name, material);
        }
    }

    createRoadGrid()
    {
        const pitchX = this.blockWidth + this.roadWidth;
        const pitchZ = this.blockDepth + this.roadWidth;
        const districtWidth = this.columns * this.blockWidth + (this.columns + 1) * this.roadWidth;
        const districtDepth = this.rows * this.blockDepth + (this.rows + 1) * this.roadWidth;

        for (let column = 0; column <= this.columns; column += 1)
        {
            const x = (column - this.columns / 2) * pitchX;
            this.terrainSurface(`NorthSouthRoad${column}`, this.roadWidth, districtDepth, x, 0, this.surfaceElevations.road, "asphalt", true);
            this.addLaneDashes(x, -districtDepth / 2 + 5, districtDepth / 2 - 5, false);
        }

        for (let row = 0; row <= this.rows; row += 1)
        {
            const z = (row - this.rows / 2) * pitchZ;
            this.terrainSurface(`EastWestRoad${row}`, districtWidth, this.roadWidth, 0, z, this.surfaceElevations.road, "asphalt", true);
            this.addLaneDashes(z, -districtWidth / 2 + 5, districtWidth / 2 - 5, true);
        }
    }

    addLaneDashes(fixed, start, end, horizontal)
    {
        for (let amount = start; amount <= end; amount += 12)
        {
            this.terrainSurface(
                "LaneDash",
                horizontal ? 6 : 0.22,
                horizontal ? 0.22 : 6,
                horizontal ? amount : fixed,
                horizontal ? fixed : amount,
                this.surfaceElevations.marking,
                "line"
            );
        }
    }

    createBlocks()
    {
        const layouts = ["buildings", "park", "buildings", "parking", "buildings", "empty", "buildings", "park", "parking", "buildings"];
        let blockIndex = 0;

        for (let row = 0; row < this.rows; row += 1)
        {
            for (let column = 0; column < this.columns; column += 1)
            {
                const center = this.getBlockCenter(column, row);
                this.terrainSurface(`Block${blockIndex}Sidewalk`, this.blockWidth, this.blockDepth, center.x, center.z, this.surfaceElevations.sidewalk, "concrete", true);
                this.createCurbs(center, blockIndex);
                this.createLot(layouts[blockIndex], center, blockIndex);
                blockIndex += 1;
            }
        }
    }

    getBlockCenter(column, row)
    {
        return {
            x: (column - (this.columns - 1) / 2) * (this.blockWidth + this.roadWidth),
            z: (row - (this.rows - 1) / 2) * (this.blockDepth + this.roadWidth)
        };
    }

    createCurbs(center, index)
    {
        const curbWidth = 0.6;
        const horizontalLength = this.blockWidth - curbWidth * 2;

        for (const zOffset of [-this.blockDepth / 2 + curbWidth / 2, this.blockDepth / 2 - curbWidth / 2])
        {
            this.terrainSurface(`Block${index}Curb`, horizontalLength, curbWidth, center.x, center.z + zOffset, this.surfaceElevations.curb, "curb", true);
        }
        for (const xOffset of [-this.blockWidth / 2 + curbWidth / 2, this.blockWidth / 2 - curbWidth / 2])
        {
            this.terrainSurface(`Block${index}Curb`, curbWidth, this.blockDepth, center.x + xOffset, center.z, this.surfaceElevations.curb, "curb", true);
        }
    }

    createLot(type, center, index)
    {
        if (type === "park")
        {
            this.createPark(center, index);
            return;
        }
        if (type === "parking")
        {
            this.createParkingLot(center, index);
            return;
        }
        if (type === "empty")
        {
            this.terrainSurface(`EmptyLot${index}`, 36, 38, center.x, center.z, this.surfaceElevations.lot, "gravel");
            return;
        }

        const materialNames = ["brick", "glass", "sandstone", "concrete"];
        const setback = 3 + (index % 3) * 2;
        const split = index % 2 === 0;
        if (split)
        {
            this.building(`Block${index}West`, [15 + index % 4, 13 + index * 1.4, 32 - setback], [center.x - 9, center.z], materialNames[index % 4]);
            this.building(`Block${index}East`, [14, 18 + (index % 3) * 5, 27], [center.x + 10, center.z + (index % 3 - 1) * 3], materialNames[(index + 1) % 4]);
        }
        else
        {
            this.building(`Block${index}Tower`, [33 - setback, 18 + index * 1.5, 31 - setback / 2], [center.x, center.z], materialNames[index % 4]);
        }
    }

    createPark(center, index)
    {
        this.terrainSurface(`Park${index}Lawn`, 38, 40, center.x, center.z, this.surfaceElevations.lot, "grass");
        this.terrainSurface("ParkPath", 4, 40, center.x, center.z, this.surfaceElevations.marking, "concrete");
        this.terrainSurface("ParkPath", 38, 4, center.x, center.z, this.surfaceElevations.marking, "concrete");

        for (const [xOffset, zOffset] of [[-14, -15], [14, -14], [-14, 14], [14, 15], [-8, 8], [8, -7]])
        {
            this.tree(center.x + xOffset, center.z + zOffset);
        }
    }

    createParkingLot(center, index)
    {
        this.terrainSurface(`ParkingLot${index}`, 38, 40, center.x, center.z, this.surfaceElevations.lot, "asphalt", true);
        for (let xOffset = -15; xOffset <= 15; xOffset += 6)
        {
            for (const zOffset of [-10, 10])
            {
                this.terrainSurface("ParkingLine", 0.16, 9, center.x + xOffset, center.z + zOffset, this.surfaceElevations.marking, "white");
            }
        }
    }

    building(name, size, position, material)
    {
        const elevations = this.footprintElevations(position[0], position[1], size[0], size[2]);
        const base = elevations.maximum + 0.15;
        const foundationHeight = Math.max(0.25, base - elevations.minimum);
        this.instanceBox(`${name}Foundation`, [size[0] + 0.4, foundationHeight, size[2] + 0.4], [position[0], base - foundationHeight / 2, position[1]], "concrete", true);
        this.instanceBox(name, size, [position[0], base + size[1] / 2, position[1]], material, true);
    }

    tree(x, z)
    {
        const y = this.terrain.getHeightAt(x, z);
        this.instanceCylinder("ParkTreeTrunk", [0.45, 3.5, 0.45], [x, y + 1.75, z], "bark", true);
        this.instanceSphere("ParkTreeCrown", [3.4, 2.7, 3.4], [x, y + 4.1, z], "leaves");
    }

    instanceBox(name, size, position, material, collidable = false)
    {
        return this.instancePrimitive("box", name, size, position, material, collidable);
    }

    instanceCylinder(name, size, position, material, collidable = false)
    {
        return this.instancePrimitive("cylinder", name, size, position, material, collidable);
    }

    instanceSphere(name, size, position, material, collidable = false)
    {
        return this.instancePrimitive("sphere", name, size, position, material, collidable);
    }

    instancePrimitive(type, name, size, position, material, collidable)
    {
        const key = `${type}:${material}`;
        let source = this.sources.get(key);
        if (!source)
        {
            const builders = {
                box: () => BABYLON.MeshBuilder.CreateBox(`${key}Source`, { size: 1 }, this.scene),
                cylinder: () => BABYLON.MeshBuilder.CreateCylinder(`${key}Source`, { height: 1, diameter: 1, tessellation: 8 }, this.scene),
                sphere: () => BABYLON.MeshBuilder.CreateSphere(`${key}Source`, { diameter: 1, segments: 8 }, this.scene)
            };
            source = builders[type]();
            source.parent = this.root;
            source.material = this.materials.get(material);
            this.sources.set(key, source);
        }
        const instance = source.createInstance(name);
        instance.position.set(...position);
        instance.scaling.set(...size);
        instance.checkCollisions = collidable;
        if (collidable)
        {
            this.lighting.addShadowCaster(instance);
        }
        return instance;
    }

    hideSources()
    {
        for (const source of this.sources.values())
        {
            source.isVisible = false;
        }
    }

    terrainSurface(name, width, depth, centerX, centerZ, elevation, material, collidable = false)
    {
        const xSegments = Math.max(1, Math.ceil(width / 4));
        const zSegments = Math.max(1, Math.ceil(depth / 4));
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
                indices.push(topLeft, bottomLeft, topLeft + 1, topLeft + 1, bottomLeft, bottomLeft + 1);
            }
        }
        BABYLON.VertexData.ComputeNormals(positions, indices, normals);
        const vertexData = new BABYLON.VertexData();
        Object.assign(vertexData, { positions, indices, normals, uvs });
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
}
