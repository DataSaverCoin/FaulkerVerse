/* Sprint 13 procedural district built from reusable Babylon primitives. */

"use strict";

import { Config } from "../engine/Config.js";

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
        this.roadMeshes = [];
        this.buildingMeshes = [];
        this.blockCenters = [];
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
        this.createDebugMaterial();
        this.createRoadGrid();
        this.createBlocks();
        this.hideSources();
        this.logRoadMeshDiagnostics();
    }

    createDebugMaterial()
    {
        const material = new BABYLON.StandardMaterial("DistrictRoadDebug", this.scene);
        material.diffuseColor = BABYLON.Color3.Red();
        material.emissiveColor = BABYLON.Color3.Red();
        material.disableLighting = true;
        this.materials.set("roadDebug", material);
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
            const road = this.terrainSurface(`NorthSouthRoad${column}`, this.roadWidth, districtDepth, x, 0, this.surfaceElevations.road, "asphalt", true);
            road.metadata = {
                roadType: "north/south",
                start: { x, z: -districtDepth / 2 },
                end: { x, z: districtDepth / 2 },
                expectedBlocks: this.getNorthSouthRoadBlocks(column)
            };
            road.material = Config.DistrictDebug.Enabled
                ? this.materials.get("roadDebug")
                : this.materials.get("asphalt");
            this.roadMeshes.push(road);
            this.addLaneDashes(x, -districtDepth / 2 + 5, districtDepth / 2 - 5, false);
        }

        for (let row = 0; row <= this.rows; row += 1)
        {
            const z = (row - this.rows / 2) * pitchZ;
            const road = this.terrainSurface(`EastWestRoad${row}`, districtWidth, this.roadWidth, 0, z, this.surfaceElevations.road, "asphalt", true);
            road.metadata = {
                roadType: "east/west",
                start: { x: -districtWidth / 2, z },
                end: { x: districtWidth / 2, z },
                expectedBlocks: this.getEastWestRoadBlocks(row)
            };
            road.material = Config.DistrictDebug.Enabled
                ? this.materials.get("roadDebug")
                : this.materials.get("asphalt");
            this.roadMeshes.push(road);
            this.addLaneDashes(z, -districtWidth / 2 + 5, districtWidth / 2 - 5, true);
        }
    }

    getNorthSouthRoadBlocks(column)
    {
        const blocks = [];
        for (let row = 0; row < this.rows; row += 1)
        {
            if (column > 0) blocks.push(row * this.columns + column - 1);
            if (column < this.columns) blocks.push(row * this.columns + column);
        }
        return blocks;
    }

    getEastWestRoadBlocks(row)
    {
        const blocks = [];
        for (let column = 0; column < this.columns; column += 1)
        {
            if (row > 0) blocks.push((row - 1) * this.columns + column);
            if (row < this.rows) blocks.push(row * this.columns + column);
        }
        return blocks;
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
                this.blockCenters.push({ block: blockIndex, ...center });
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
        const mesh = this.instanceBox(name, size, [position[0], base + size[1] / 2, position[1]], material, true);
        this.buildingMeshes.push(mesh);
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

    logRoadMeshDiagnostics()
    {
        const districtBounds = this.getDistrictBounds();
        const terrainBounds = this.getWorldBounds(this.terrain.ground);
        const inScene = this.roadMeshes.filter(mesh =>
            this.scene.meshes.includes(mesh)
        );
        const diagnostics = this.roadMeshes.map(mesh =>
        {
            mesh.computeWorldMatrix(true);
            mesh.refreshBoundingInfo();
            const bounds = mesh.getBoundingInfo().boundingBox;
            const minimum = bounds.minimumWorld;
            const maximum = bounds.maximumWorld;
            const center = minimum.add(maximum).scale(0.5);
            const dimensions = maximum.subtract(minimum);
            const terrainOffsets = this.getTerrainOffsets(mesh);

            return {
                name: mesh.name,
                roadType: mesh.metadata.roadType,
                expectedBlocks: mesh.metadata.expectedBlocks.join(", "),
                start: this.formatPoint(mesh.metadata.start),
                end: this.formatPoint(mesh.metadata.end),
                material: mesh.material?.name ?? "(none)",
                boundingMinimum: minimum.toString(),
                boundingMaximum: maximum.toString(),
                calculatedCenter: center.toString(),
                worldDimensions: dimensions.toString(),
                visibility: mesh.visibility,
                isVisible: mesh.isVisible,
                enabled: mesh.isEnabled(),
                renderingGroup: mesh.renderingGroupId,
                addedToScene: this.scene.meshes.includes(mesh),
                intersectsDistrict: this.boundsIntersect(minimum, maximum, districtBounds.minimum, districtBounds.maximum),
                overlapsBuildings: this.buildingMeshes.some(building =>
                {
                    const buildingBounds = this.getWorldBounds(building);
                    return this.boundsIntersect(minimum, maximum, buildingBounds.minimum, buildingBounds.maximum);
                }),
                completelyOutsideDistrict: !this.boundsIntersect(minimum, maximum, districtBounds.minimum, districtBounds.maximum),
                terrainRelationship: Math.min(...terrainOffsets) > 0
                    ? "above terrain"
                    : (Math.max(...terrainOffsets) < 0 ? "below terrain" : "inside/intersecting terrain"),
                minimumTerrainClearance: Math.min(...terrainOffsets).toFixed(3),
                maximumTerrainClearance: Math.max(...terrainOffsets).toFixed(3)
            };
        });

        console.group("[District roads] Sprint 13.2 placement diagnostics");
        console.log(`Road meshes created: ${this.roadMeshes.length}`);
        console.log(`Road meshes added to scene: ${inScene.length}`);
        console.table(diagnostics);
        console.table({
            districtOrigin: "(0, 0, 0)",
            districtBounds: `${districtBounds.minimum.toString()} to ${districtBounds.maximum.toString()}`,
            blockSpacing: `(x: ${this.blockWidth + this.roadWidth}, z: ${this.blockDepth + this.roadWidth})`,
            roadSpacing: `(x: ${this.blockWidth + this.roadWidth}, z: ${this.blockDepth + this.roadWidth})`,
            terrainOrigin: this.terrain.ground.getAbsolutePosition().toString(),
            terrainBounds: `${terrainBounds.minimum.toString()} to ${terrainBounds.maximum.toString()}`,
            debugRoadMaterial: Config.DistrictDebug.Enabled
        });
        console.table(this.blockCenters.map(center => ({
            block: center.block,
            center: this.formatPoint(center)
        })));
        console.table(this.buildingMeshes.map(mesh => ({
            building: mesh.name,
            center: mesh.getBoundingInfo().boundingBox.centerWorld.toString()
        })));
        console.log(
            "Visibility assessment:",
            diagnostics.every(mesh =>
                mesh.addedToScene && mesh.isVisible && mesh.enabled && mesh.visibility > 0
            )
                ? "All road meshes are scene-attached, visible, and enabled. If they are not visible on screen, inspect terrain/water occlusion and camera framing."
                : "One or more road meshes are hidden or detached; see the table above."
        );
        console.groupEnd();
    }

    getDistrictBounds()
    {
        const width = this.columns * this.blockWidth + (this.columns + 1) * this.roadWidth;
        const depth = this.rows * this.blockDepth + (this.rows + 1) * this.roadWidth;
        return {
            minimum: new BABYLON.Vector3(-width / 2, Number.NEGATIVE_INFINITY, -depth / 2),
            maximum: new BABYLON.Vector3(width / 2, Number.POSITIVE_INFINITY, depth / 2),
            width,
            depth
        };
    }

    getWorldBounds(mesh)
    {
        mesh.computeWorldMatrix(true);
        mesh.refreshBoundingInfo();
        const bounds = mesh.getBoundingInfo().boundingBox;
        return { minimum: bounds.minimumWorld, maximum: bounds.maximumWorld };
    }

    getTerrainOffsets(mesh)
    {
        const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        const offsets = [];
        for (let index = 0; index < positions.length; index += 3)
        {
            offsets.push(
                positions[index + 1] -
                this.terrain.getHeightAt(positions[index], positions[index + 2])
            );
        }
        return offsets;
    }

    boundsIntersect(minimumA, maximumA, minimumB, maximumB)
    {
        return minimumA.x <= maximumB.x && maximumA.x >= minimumB.x &&
            minimumA.z <= maximumB.z && maximumA.z >= minimumB.z;
    }

    formatPoint(point)
    {
        return `(${point.x.toFixed(2)}, ${point.z.toFixed(2)})`;
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
