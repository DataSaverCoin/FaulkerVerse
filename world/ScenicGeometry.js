/* Small shared helpers for batched, locally generated scenery. */
export class ScenicGeometry
{
    constructor(scene,prefix){this.scene=scene;this.prefix=prefix;this.groups=new Map();this.materials=new Map();}
    material(name,color)
    {
        if(!this.materials.has(name)){const m=new BABYLON.StandardMaterial(`${this.prefix} ${name}`,this.scene);m.diffuseColor=BABYLON.Color3.FromHexString(color);m.specularColor.set(.08,.08,.08);this.materials.set(name,m);}
        return this.materials.get(name);
    }
    add(mesh,material){if(!mesh.isVerticesDataPresent(BABYLON.VertexBuffer.UVKind))mesh.setVerticesData(BABYLON.VertexBuffer.UVKind,new Array(mesh.getTotalVertices()*2).fill(0));mesh.material=material;if(!this.groups.has(material))this.groups.set(material,[]);this.groups.get(material).push(mesh);return mesh;}
    box(name,x,y,z,w,h,d,material,angle=0)
    {
        const mesh=BABYLON.MeshBuilder.CreateBox(`${this.prefix} ${name}`,{width:w,height:h,depth:d},this.scene);mesh.position.set(x,y,z);mesh.rotation.y=angle;return this.add(mesh,material);
    }
    tube(name,points,radius,material)
    {
        return this.add(BABYLON.MeshBuilder.CreateTube(`${this.prefix} ${name}`,{path:points.map(p=>new BABYLON.Vector3(...p)),radius,tessellation:6,cap:BABYLON.Mesh.CAP_ALL},this.scene),material);
    }
    finish()
    {
        for(const [material,meshes] of this.groups){if(!meshes.length)continue;const mesh=BABYLON.Mesh.MergeMeshes(meshes,true,true);mesh.name=`${this.prefix} ${material.name}`;mesh.material=material;mesh.freezeWorldMatrix();}
        this.groups.clear();
    }
}
