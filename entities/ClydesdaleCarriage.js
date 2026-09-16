import {ACTOR_SCALE} from '../engine/ActorScale.js';
/* A shared pair-horse hitch, with separate legs for a distance-driven walking gait. */
export function clydesdaleTemplate(scene)
{
    const parts=[],legs=[];
    const material=(name,color)=>{const m=new BABYLON.StandardMaterial(name,scene);m.diffuseColor=BABYLON.Color3.FromHexString(color);m.specularColor.set(.08,.08,.08);return m;};
    const bay=material('Clydesdale bay coat','#743f25'),white=material('White blaze and feathering','#f5eee0'),black=material('Mane harness and tires','#211c19'),red=material('AB carriage red','#a91825'),gold=material('Carriage gold trim','#d5ab55'),skin=material('Coach driver','#d7a377');
    const box=(name,w,h,d,x,y,z,m,list=parts)=>{const p=BABYLON.MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene);p.position.set(x,y,z);p.material=m;list.push(p);return p;};
    const oval=(name,w,h,d,x,y,z,m)=>{const p=BABYLON.MeshBuilder.CreateSphere(name,{diameter:1,segments:8},scene);p.scaling.set(w,h,d);p.position.set(x,y,z);p.material=m;parts.push(p);return p;};
    box('Red carriage body',1.6,.65,2.25,0,1,-1.6,red);
    box('Gold upper rail',1.7,.12,2.35,0,1.37,-1.6,gold);
    box('Passenger bench',1.35,.23,.55,0,1.58,-2.15,black);
    box('Driver bench',1.35,.22,.5,0,1.5,-.68,black);
    box('Driver coat',.48,.65,.3,0,1.95,-.65,red);
    oval('Driver head',.32,.4,.32,0,2.45,-.65,skin);
    box('Driver hat brim',.52,.07,.4,0,2.64,-.65,black);
    box('Driver hat',.32,.23,.28,0,2.76,-.65,black);
    for(const side of [-1,1]){
        box('Driver trouser leg',.17,.5,.18,side*.18,1.28,-.43,black);
        box('Driver arm',.14,.14,.6,side*.3,2.05,-.31,red);
        box('Driver hand',.13,.13,.14,side*.3,2.05,.04,skin);
        const rein=BABYLON.MeshBuilder.CreateTube('Driver reins',{path:[new BABYLON.Vector3(side*.3,2.05,.07),new BABYLON.Vector3(side*.45,1.9,1.2),new BABYLON.Vector3(side*.45,2.15,2.1)],radius:.015,tessellation:4},scene);rein.material=black;parts.push(rein);
    }
    for(const x of [-.85,.85])for(const z of [-2.4,-.85]){
        const p=BABYLON.MeshBuilder.CreateCylinder('Gold carriage wheel',{diameter:.2,height:.16,tessellation:12},scene);p.rotation.z=Math.PI/2;p.position.set(x,.52,z);p.material=gold;parts.push(p);
        for(let spoke=0;spoke<6;spoke++){
            const bar=box('Carriage wheel spoke',.06,.94,.045,x,.52,z,gold);bar.rotation.x=spoke*Math.PI/6;
        }
        const tire=BABYLON.MeshBuilder.CreateTorus('Wheel tire',{diameter:1,thickness:.09,tessellation:12},scene);tire.rotation.z=Math.PI/2;tire.position.copyFrom(p.position);tire.material=black;parts.push(tire);
    }
    box('Hitch pole',.08,.08,3.5,0,.95,.7,gold);
    for(const x of [-.45,.45]){
        oval('Clydesdale body',.62,.85,1.65,x,1.38,1.35,bay);
        const neck=oval('Strong horse neck',.43,1.05,.6,x,1.95,1.95,bay);neck.rotation.x=-.28;
        oval('Horse head',.4,.52,.74,x,2.4,2.2,bay);
        oval('White facial blaze',.16,.4,.08,x,2.48,2.53,white);
        oval('Pale muzzle',.4,.28,.35,x,2.22,2.5,white);
        for(const side of [-1,1]){
            box('Horse ear',.10,.3,.12,x+side*.14,2.8,2.12,bay);
            oval('Horse eye',.04,.065,.07,x+side*.2,2.51,2.32,black);
        }
        box('Black mane',.09,.75,.17,x,2.02,1.68,black);
        box('Tail',.12,.85,.17,x,1.17,.47,black);
        box('Harness saddle',.68,.1,.25,x,1.8,1.35,black);
        box('Harness breast collar',.67,.18,.1,x,1.61,2.02,black);
        for(const side of [-1,1])box('Leather trace',.035,.04,2.5,x+side*.32,1.18,.4,black);
        for(const side of [-1,1])for(const front of [-1,1]){
            const segment=[];
            box('Horse upper leg',.15,.52,.16,0,-.23,0,bay,segment);
            box('White feathered leg',.21,.35,.23,0,-.64,0,white,segment);
            box('Dark hoof',.22,.12,.28,0,-.85,.03,black,segment);
            const mesh=BABYLON.Mesh.MergeMeshes(segment,true,true,undefined,false,true);mesh.isVisible=false;
            legs.push({mesh,x:x+side*.21,y:.97,z:1.35+front*.52,phase:side*front>0?0:Math.PI});
        }
    }
    // Dynamic lettering remains local and works without a network connection.
    if(typeof document!=='undefined'){
        const texture=new BABYLON.DynamicTexture('Anheuser Busch carriage lettering',{width:1024,height:256},scene,false);
        const ctx=texture.getContext();ctx.fillStyle='#a91825';ctx.fillRect(0,0,1024,256);ctx.textAlign='center';ctx.fillStyle='#f6df9a';ctx.font='bold 74px Georgia';ctx.fillText('ANHEUSER-BUSCH',512,105);ctx.font='48px Georgia';ctx.fillText('ST. LOUIS • CLYDESDALES',512,185);texture.update();
        const label=material('AB wagon lettering','#ffffff');label.diffuseTexture=texture;label.emissiveColor.set(.22,.22,.22);label.backFaceCulling=false;
        for(const side of [-1,1]){const p=BABYLON.MeshBuilder.CreatePlane('AB branded carriage panel',{width:2.05,height:.52,sideOrientation:BABYLON.Mesh.DOUBLESIDE},scene);p.position.set(side*.811,1.03,-1.6);p.rotation.y=side*Math.PI/2;p.material=label;parts.push(p);}
    }
    const mesh=BABYLON.Mesh.MergeMeshes(parts,true,true,undefined,false,true);mesh.name='AB Clydesdale carriage template';mesh.isVisible=false;
    return {mesh,legs,length:5.8*ACTOR_SCALE};
}
export function animateClydesdales(v,dt)
{
    v.gait=(v.gait||0)+v.speed*dt*10;
    for(const leg of v.legs)leg.mesh.rotation.x=v.speed>.05?Math.sin(v.gait+leg.phase)*.38:0;
}
