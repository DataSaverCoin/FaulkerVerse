import { ACTOR_SCALE } from '../engine/ActorScale.js';
/* Shared vehicle meshes: painted sedans, pickups and delivery trucks. */
export function trafficTemplates(scene)
{
    const mat=(name,color)=>{const m=new BABYLON.StandardMaterial(name,scene);m.diffuseColor=BABYLON.Color3.FromHexString(color);m.specularColor=new BABYLON.Color3(.12,.12,.12);return m;};
    const rubber=mat('Traffic tires','#242a2e'),glass=mat('Traffic windows','#547987'),white=mat('Traffic headlights','#fff0c5'),red=mat('Traffic brake lamps','#ad302c');
    white.emissiveColor=new BABYLON.Color3(1,.9,.65);red.emissiveColor=new BABYLON.Color3(.85,.015,.005);
    const helmetMaterial=mat('Rider helmet paint','#e6e3d9');
    const templates=[];
    for(const [index,color] of ['#bf4140','#d8d7cc','#386eb0','#e4b94c','#586c61'].entries())for(const kind of ['car','pickup','truck','bicycle','motorcycle'])
    {
        const body=mat(`${kind} paint ${index}`,color),meshes=[];
        const box=(name,w,h,d,x,y,z,material)=>{const m=BABYLON.MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene);m.position.set(x,y,z);m.material=material;meshes.push(m);};
        if(kind==='bicycle'||kind==='motorcycle')
        {
            const motorcycle=kind==='motorcycle';
            for(const z of [-.72,.72])
            {
                const wheel=BABYLON.MeshBuilder.CreateTorus('Two-wheeler tire',{diameter:.66,thickness:motorcycle?.14:.065,tessellation:12},scene);wheel.rotation.z=Math.PI/2;wheel.position.set(0,.36,z);wheel.material=rubber;meshes.push(wheel);
            }
            box('Cycle frame',.12,.14,1.45,0,.6,0,body);
            box('Saddle',.4,.13,.45,0,.95,-.16,rubber);
            if(motorcycle)box('Motorcycle tank',.42,.32,.6,0,.86,.22,body);
            box('Cycle headlight',.18,.15,.08,0,1,.83,white);
            box('Cycle tail light',.16,.12,.06,0,.92,-.82,red);
            box('Handlebars',.75,.06,.08,0,1.03,.68,rubber);
            box('Rider torso',.42,.52,.23,0,1.35,-.14,body);
            const helmet=BABYLON.MeshBuilder.CreateSphere('Rider helmet',{diameter:.32,segments:8},scene);helmet.position.set(0,1.8,-.12);helmet.material=helmetMaterial;meshes.push(helmet);
            for(const x of [-.22,.22])
            {
                box('Rider arm',.1,.13,.55,x,1.3,.18,rubber);
                box('Rider leg',.12,.53,.15,x,.82,-.12,rubber);
            }
            const riderMeshes=meshes.filter(m=>m.name.startsWith('Rider'));
            const rider=BABYLON.Mesh.MergeMeshes(riderMeshes,true,true,undefined,false,true);rider.isVisible=false;
            const template=BABYLON.Mesh.MergeMeshes(meshes.filter(m=>!riderMeshes.includes(m)),true,true,undefined,false,true);template.name=`Traffic ${kind} ${index}`;template.isVisible=false;
            templates.push({mesh:template,rider,kind,length:2*ACTOR_SCALE});continue;
        }
        const length=kind==='car'?3.6:kind==='pickup'?4.3:5;
        box('Chassis',1.55,.48,length,0,.58,0,body);
        if(kind==='truck')
        {
            box('Delivery box',1.65,1.5,3,0,1.5,-.7,body);
            box('Truck cab',1.48,1.05,1.45,0,1.15,1.55,body);
            box('Truck windscreen',1.28,.5,.035,0,1.45,2.29,glass);
        }
        else
        {
            box('Glazed cabin',1.3,.6,kind==='car'?1.8:1.3,0,1.1,.12,glass);
            box('Roof',1.36,.12,kind==='car'?1.9:1.4,0,1.45,.12,body);
            if(kind==='pickup'){box('Bed floor',1.25,.08,1.35,0,.85,-1.1,rubber);}
        }
        for(const side of [-1,1])
        {
            box('Headlight',.3,.16,.04,side*.52,.64,length/2+.025,white);
            box('Taillight',.25,.15,.04,side*.54,.67,-length/2-.025,red);
            for(const z of [-length*.32,length*.32])
            {
                const wheel=BABYLON.MeshBuilder.CreateCylinder('Road wheel',{diameter:.65,height:.2,tessellation:12},scene);
                wheel.position.set(side*.78,.34,z);wheel.rotation.z=Math.PI/2;wheel.material=rubber;meshes.push(wheel);
            }
        }
        const template=BABYLON.Mesh.MergeMeshes(meshes,true,true,undefined,false,true);template.name=`Traffic ${kind} ${index}`;template.isVisible=false;
        templates.push({mesh:template,kind,length:length*ACTOR_SCALE});
    }
    return templates;
}
