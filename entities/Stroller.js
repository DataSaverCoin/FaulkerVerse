/* Shared stroller geometry; babies remain with a walking guardian. */
export function strollerTemplate(scene)
{
    const cloth=new BABYLON.StandardMaterial('Stroller teal fabric',scene);cloth.diffuseColor=BABYLON.Color3.FromHexString('#307e83');
    const dark=new BABYLON.StandardMaterial('Stroller frame',scene);dark.diffuseColor=BABYLON.Color3.FromHexString('#30373f');
    const meshes=[];
    const box=(name,size,pos,material)=>{const m=BABYLON.MeshBuilder.CreateBox(name,{width:size[0],height:size[1],depth:size[2]},scene);m.position.set(...pos);m.material=material;meshes.push(m);};
    box('Stroller bassinet',[.8,.25,1.1],[0,.65,0],cloth);
    box('Stroller canopy',[.85,.08,.5],[0,1.2,-.32],cloth);
    for(const x of [-.4,.4])
    {
        box('Stroller side',[.06,.7,1.1],[x,.7,0],cloth);
        box('Stroller handle support',[.04,.7,.04],[x,1,-.65],dark);
        for(const z of [-.45,.45]){const m=BABYLON.MeshBuilder.CreateCylinder('Stroller wheel',{diameter:.3,height:.1,tessellation:10},scene);m.position.set(x,.16,z);m.rotation.z=Math.PI/2;m.material=dark;meshes.push(m);}
    }
    box('Stroller push bar',[.85,.06,.06],[0,1.35,-.65],dark);
    const result=BABYLON.Mesh.MergeMeshes(meshes,true,true,undefined,false,true);result.isVisible=false;return result;
}
