/* Sprint 14 standalone road rendering test. */

"use strict";

export class StandaloneRoad
{
    constructor(scene, terrain)
    {
        this.scene = scene;
        this.terrain = terrain;
        this.root = new BABYLON.TransformNode("StandaloneRoad", scene);
    }

    initialize()
    {
        const debugRoad = this.createDebugRoadMaterial();
        const concrete = this.createMaterial("RoadSidewalk", [0.58, 0.58, 0.55]);
        const curb = this.createMaterial("RoadCurb", [0.38, 0.39, 0.38]);

        this.createSurface("DebugRoad", 12, 80, 0, 44, 1.0, debugRoad);

        for (const side of [-1, 1])
        {
            this.createSurface(
                "RoadCurb",
                0.5,
                80,
                side * 6.25,
                44,
                0.88,
                curb
            );
            this.createSurface(
                "RoadSidewalk",
                2,
                80,
                side * 7.5,
                44,
                0.82,
                concrete
            );
        }
    }

    createDebugRoadMaterial()
    {
        const material = new BABYLON.StandardMaterial("DebugRoadRed", this.scene);
        material.diffuseColor = BABYLON.Color3.Red();
        material.emissiveColor = BABYLON.Color3.Red();
        material.specularColor = BABYLON.Color3.Black();
        material.disableLighting = true;
        return material;
    }

    createMaterial(name, color)
    {
        const material = new BABYLON.StandardMaterial(name, this.scene);
        material.diffuseColor = new BABYLON.Color3(...color);
        material.specularColor = BABYLON.Color3.Black();
        return material;
    }

    createSurface(name, width, length, centerX, centerZ, elevation, material)
    {
        const xSegments = Math.ceil(width / 2);
        const zSegments = Math.ceil(length / 2);
        const positions = [];
        const indices = [];
        const normals = [];
        const uvs = [];

        for (let zIndex = 0; zIndex <= zSegments; zIndex += 1)
        {
            const zAmount = zIndex / zSegments;
            const z = centerZ - length / 2 + length * zAmount;

            for (let xIndex = 0; xIndex <= xSegments; xIndex += 1)
            {
                const xAmount = xIndex / xSegments;
                const x = centerX - width / 2 + width * xAmount;
                const y = this.terrain.getHeightAt(x, z) + elevation;
                positions.push(x, y, z);
                uvs.push(xAmount, 1 - zAmount);
            }
        }

        for (let zIndex = 0; zIndex < zSegments; zIndex += 1)
        {
            for (let xIndex = 0; xIndex < xSegments; xIndex += 1)
            {
                const topLeft = zIndex * (xSegments + 1) + xIndex;
                const bottomLeft = topLeft + xSegments + 1;
                indices.push(
                    topLeft,
                    bottomLeft,
                    topLeft + 1,
                    topLeft + 1,
                    bottomLeft,
                    bottomLeft + 1
                );
            }
        }

        BABYLON.VertexData.ComputeNormals(positions, indices, normals);
        const vertexData = new BABYLON.VertexData();
        vertexData.positions = positions;
        vertexData.indices = indices;
        vertexData.normals = normals;
        vertexData.uvs = uvs;

        const mesh = new BABYLON.Mesh(name, this.scene);
        vertexData.applyToMesh(mesh, true);
        mesh.parent = this.root;
        mesh.material = material;
        mesh.receiveShadows = false;
        return mesh;
    }
}
