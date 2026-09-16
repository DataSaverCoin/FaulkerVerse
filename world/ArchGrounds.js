import { ScenicGeometry } from './ScenicGeometry.js';
import { landmarkSign } from './LandmarkArchitecture.js';

/* Reference-guided park layout: central approach, paired ponds and tree-lined walks. */
export function createArchGrounds(map)
{
    const {x,z}=map.data.arch,scene=map.scene,g=new ScenicGeometry(scene,'Arch grounds');
    const stone=g.material('pale concrete walks','#c8c3ad'),grass=g.material('maintained lawns','#548248'),water=g.material('pond water','#3d6963');
    const bark=g.material('tree trunks','#655244'),leaves=g.material('tree canopy','#3d693d');
    const base=map.terrain.getGroundHeightAt(x,z);
    // Tapered triangular steel section, oriented through the north and south legs.
    const positions=[],indices=[],uvs=[];
    for(let i=0;i<=96;i++)
    {
        const t=-1+i/48,y=57.6*(1-(Math.cosh(t*2)-1)/(Math.cosh(2)-1)),zz=t*28.8;
        const slope=-57.6*2*Math.sinh(t*2)/(Math.cosh(2)-1)/28.8,norm=Math.hypot(1,slope),r=.55+Math.abs(t)**2*1.5;
        for(let j=0;j<3;j++){const a=j*Math.PI*2/3;positions.push(x+Math.cos(a)*r,base+y+Math.sin(a)*r/norm,z+zz-Math.sin(a)*r*slope/norm);uvs.push(j/3,i/12);}
        if(i<96)for(let j=0;j<3;j++){const a=i*3+j,b=i*3+(j+1)%3;indices.push(a,b,a+3,b,b+3,a+3);}
    }
    const arch=new BABYLON.Mesh('Gateway Arch tapered triangular stainless steel',scene),vd=new BABYLON.VertexData();Object.assign(vd,{positions,indices,uvs,normals:[]});BABYLON.VertexData.ComputeNormals(positions,indices,vd.normals);vd.applyToMesh(arch);
    const steel=g.material('brushed stainless steel','#b9c9cf');steel.specularColor.set(.8,.85,.9);steel.specularPower=96;steel.backFaceCulling=false;arch.material=steel;
    const path=(name,points,width)=>{
        const rows=[-1,1].map(side=>points.map((p,i)=>{const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz)||1;const px=p[0]+side*dz/l*width/2,pz=p[1]-side*dx/l*width/2;return new BABYLON.Vector3(px,map.terrain.getHeightAt(px,pz)+.045,pz);}));
        g.add(BABYLON.MeshBuilder.CreateRibbon(name,{pathArray:rows,sideOrientation:BABYLON.Mesh.DOUBLESIDE},scene),stone);
    };
    path('Arch west approach',[[x-86,z],[x-65,z],[x-42,z],[x-12,z],[x+6,z]],7);
    path('Arch riverfront promenade',[[x+18,z-87],[x+23,z-50],[x+25,z],[x+23,z+50],[x+18,z+87]],3.5);
    map.archPonds=[];
    for(const side of [-1,1])
    {
        const cx=x-26,cz=z+side*58,ring=[];
        for(let i=0;i<=64;i++){const a=i/64*Math.PI*2,r=1+.12*Math.sin(3*a);ring.push([cx+Math.cos(a)*15*r,cz+Math.sin(a)*22*r]);}
        const pond=new BABYLON.Mesh(`Arch ${side>0?'north':'south'} pond`,scene),p=[cx,base+.045,cz],ix=[];
        for(const v of ring)p.push(v[0],base+.045,v[1]);for(let i=1;i<ring.length;i++)ix.push(0,i,i+1);
        const data=new BABYLON.VertexData();data.positions=p;data.indices=ix;data.normals=[];BABYLON.VertexData.ComputeNormals(p,ix,data.normals);data.applyToMesh(pond);pond.material=water;water.backFaceCulling=false;
        map.archPonds.push({x:cx,z:cz,rx:16,rz:24});
        path('Curved pond walk',ring.map(p=>[cx+(p[0]-cx)*1.22,cz+(p[1]-cz)*1.18]),2.1);
        const promenade=Array.from({length:25},(_,i)=>{const t=i/24;return [x-80+80*t,z+side*(28.8*t+15*Math.sin(t*Math.PI))];});path('Tree lined Arch walk',promenade,3);
        for(let i=0;i<22;i++)
        {
            const t=i/21,px=x-78+95*t,pz=z+side*(36+Math.sin(t*Math.PI)*55);
            if(map.isBlocked(px,pz,.8,true)||map.surface.height(px,pz)!==null)continue;
            const y=map.terrain.getHeightAt(px,pz);g.box('tree trunk',px,y+1.3,pz,.23,2.6,.23,bark);
            const crown=BABYLON.MeshBuilder.CreateSphere('Arch park tree',{diameter:3.8,segments:5},scene);crown.position.set(px,y+3.1,pz);crown.scaling.y=1.1;g.add(crown,leaves);
            if(i%5===0){g.box('park bench',px+1.8,y+.35,pz,1.3,.14,.5,bark);g.box('bench back',px+1.8,y+.65,pz-.2,1.3,.55,.1,bark);}
        }
    }
    // Low west-facing glass entrance embedded below the landscaped museum roof.
    const glass=g.material('museum glass','#466572');
    g.box('museum west entry glass',x-46,base+.65,z,1.2,1.3,14,glass);
    g.box('museum planted roof',x-39,base+1.35,z,15,.24,17,grass);
    g.box('museum entrance canopy',x-47,base+1.45,z,2,.16,15,stone);
    const sign=landmarkSign(scene,'GATEWAY ARCH  ·  MUSEUM','#344b40',8,.6);sign.position.set(x-48,base+1.8,z);sign.rotation.y=-Math.PI/2;
    // Broad, shallow terraces connect the Arch plaza with the riverward walk.
    for(let i=0;i<12;i++){const px=x+7+i*.9;g.box('Grand Staircase',px,map.terrain.getHeightAt(px,z)+.09,z,.95,.10,28,stone);}
    g.finish();
    map.localLandmarks.push({name:'Gateway Arch grounds',kind:'park',x,z,base,height:57.6,viewDistance:120,entrance:{x:x-78,z}});
}
