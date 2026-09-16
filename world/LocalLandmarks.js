import { stifelDetails } from './StifelDetails.js';
import { buildingGeometry } from './BuildingGeometry.js';
import { landmarkSign } from './LandmarkArchitecture.js';
import { localLandmark, landmarkFacade } from './LocalLandmarkProfiles.js';

/* Distinct silhouettes and street-facing details; all buildings keep mapped walls. */
export function createLocalLandmark(map,building)
{
    const profile=localLandmark(building);if(!profile)return false;
    const scene=map.scene,g=buildingGeometry({...building,height:profile.height,roofShape:'flat'},map.terrain),base=building.baseElevation;
    const material=landmarkFacade(scene,profile),meshes=[],cache=new Map();
    const mat=(name,color)=>{if(!cache.has(name)){const m=new BABYLON.StandardMaterial(`${profile.name} ${name}`,scene);m.diffuseColor=BABYLON.Color3.FromHexString(color);m.specularColor.set(.08,.08,.08);cache.set(name,m);}return cache.get(name);};
    const trim=mat('stone trim',profile.trim),accent=mat('brand color',profile.accent),metal=mat('railings','#283736');
    for(let i=0;i<g.points.length;i++)
    {
        const a=g.points[i],b=g.points[(i+1)%g.points.length],bays=profile.kind==='police'?12:profile.kind==='hyatt'?14:8;
        const repeat=Math.hypot(b[0]-a[0],b[1]-a[1])/(bays*1.25);
        g.uvs.splice(i*8,8,0,0,repeat,0,repeat,1,0,1);
    }
    for(const [label,indices,m] of [['exterior',g.indices.slice(0,g.wallIndexCount),material],['roof',g.indices.slice(g.wallIndexCount),mat('roof','#565957')]])
    {
        const mesh=new BABYLON.Mesh(`${profile.name} ${label}`,scene),vd=new BABYLON.VertexData();vd.positions=g.positions;vd.indices=indices;vd.uvs=g.uvs;vd.normals=[];BABYLON.VertexData.ComputeNormals(vd.positions,vd.indices,vd.normals);vd.applyToMesh(mesh);mesh.material=m;meshes.push(mesh);
    }
    const box=(name,w,h,d,x,y,z,m,angle=0)=>{const mesh=BABYLON.MeshBuilder.CreateBox(`${profile.name} ${name}`,{width:w,height:h,depth:d},scene);mesh.position.set(x,y,z);mesh.rotation.y=angle;mesh.material=m;meshes.push(mesh);return mesh;};
    const edges=g.points.map((a,i)=>{const b=g.points[(i+1)%g.points.length],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);return {a,b,length,x:(a[0]+b[0])/2,z:(a[1]+b[1])/2,nx:dz/length,nz:-dx/length,angle:Math.atan2(-dz,dx)};}).filter(e=>e.length>2);
    const frontage=edges.map(e=>({...e,roadDistance:map.nearestRoad(e.x+e.nx,e.z+e.nz).distance})).sort((a,b)=>(a.roadDistance-a.length*.2)-(b.roadDistance-b.length*.2)||b.length-a.length);
    const main=frontage[0];if(!main)return false;
    for(const e of edges)
    {
        box('projecting cornice',e.length,.15,.22,e.x-e.nx*.04,g.roof-.08,e.z-e.nz*.04,trim,e.angle);
        if(profile.kind==='hampton')box('red metal crown',e.length,.65,.4,e.x-e.nx*.15,g.roof-.45,e.z-e.nz*.15,accent,e.angle);
        if(profile.kind==='hyatt')for(const y of [base+2.4,g.roof-1.1])box('horizontal limestone band',e.length,.17,.18,e.x,y,e.z,trim,e.angle);
        if(profile.kind==='police'||profile.kind==='jail')for(let t=.06;t<1;t+=.12)box('vertical masonry pier',.16,profile.height,.2,e.a[0]+(e.b[0]-e.a[0])*t,base+profile.height/2,e.a[1]+(e.b[1]-e.a[1])*t,trim,e.angle);
        if(profile.kind==='garage')for(let f=1;f<=9;f++)box('exposed parking deck',e.length,.12,.2,e.x,base+f*profile.height/9,e.z,trim,e.angle);
        if(profile.kind==='soulard'||profile.kind==='tinroof')for(let t=.06;t<1;t+=.08)box('brick cornice bracket',.09,.23,.2,e.a[0]+(e.b[0]-e.a[0])*t,g.roof-.23,e.a[1]+(e.b[1]-e.a[1])*t,trim,e.angle);
        if(profile.kind==='castle')for(let t=.08;t<1;t+=.16)box('castle battlement',Math.min(.55,e.length*.08),.4,.4,e.a[0]+(e.b[0]-e.a[0])*t-e.nx*.15,g.roof+.12,e.a[1]+(e.b[1]-e.a[1])*t-e.nz*.15,trim,e.angle);
    }
    const signAt=(text,e,y,width,color=profile.accent,height=.65)=>{const s=landmarkSign(scene,text,color,Math.min(width,e.length*.88),height);s.position.set(e.x+e.nx*.13,y,e.z+e.nz*.13);s.rotation.y=e.angle;return s;};
    if(profile.kind==='stifel')stifelDetails(scene,base,box,trim,metal);
    const signed=frontage.filter(e=>e.length>4).slice(0,2);
    for(const e of signed)
    {
        const tall=profile.height>7;
        signAt(profile.sign,e,profile.kind==='tinroof'?base+1.4:tall?g.roof-.9:base+profile.height*.78,Math.min(13,e.length*.9),profile.accent,profile.kind==='cookies'?.82:.7);
        const awningWidth=Math.min(e.length*.72,profile.kind==='police'?5:7),awningY=base+Math.min(1.3,profile.height*.5);
        box('entry canopy',awningWidth,.12,.65,e.x+e.nx*.2,awningY,e.z+e.nz*.2,accent,e.angle);
        if(profile.kind==='garage')signAt('P  ·  PARKING',e,base+1.3,5,'#266283',.5);
        if(profile.kind==='urgentcare'||profile.kind==='hospital')signAt('MEDICAL CARE · RESPAWN',e,base+.65,6,'#216959',.42);
        if(profile.kind==='soulard')signAt('SOULARD  ·  FOOD & DRINK',e,base+.55,5,profile.accent,.3);
        if(profile.kind==='tinroof')signAt('LIVE MUSIC JOINT',e,base+.6,5,'#932e30',.35);
        if(profile.kind==='maggie')signAt('☘  IRISH PUB  ·  2000 MARKET',e,base+.95,6,'#123e2e',.35);
        if(profile.kind==='cookies')signAt('2001 OLIVE',e,base+.55,2.4,'#193f4c',.28);
        if(profile.kind==='imos')signAt('THE SQUARE BEYOND COMPARE',e,base+.55,7,'#276747',.3);
    }
    if(profile.kind==='drury')
    {
        const e=main,s=landmarkSign(scene,"LOMBARDO’S",'#65352c',3.2,.55);s.position.set(e.a[0]+(e.b[0]-e.a[0])*.12+e.nx*.22,base+2.6,e.a[1]+(e.b[1]-e.a[1])*.12+e.nz*.22);s.rotation.y=e.angle;s.rotation.z=Math.PI/2;
        signAt('LOMBARDO’S TRATTORIA',main,base+.8,6,'#532c27',.35);
    }
    if(profile.kind==='paddy')
    {
        for(const e of edges){box('upper deck railing',e.length,.055,.06,e.x-e.nx*.2,g.roof+.5,e.z-e.nz*.2,metal,e.angle);for(let t=.05;t<1;t+=.1)box('deck baluster',.035,.5,.035,e.a[0]+(e.b[0]-e.a[0])*t-e.nx*.2,g.roof+.25,e.a[1]+(e.b[1]-e.a[1])*t-e.nz*.2,metal);}
        const x=g.points.reduce((s,p)=>s+p[0],0)/g.points.length,z=g.points.reduce((s,p)=>s+p[1],0)/g.points.length;
        for(const offset of [-1.4,1.4]){box('patio table',.7,.1,.7,x+offset,g.roof+.45,z,trim);box('patio parasol',1.5,.12,1.5,x+offset,g.roof+1.35,z,accent);box('parasol pole',.05,1.3,.05,x+offset,g.roof+.65,z,metal);}
    }
    if(profile.kind==='police')signAt('1915 OLIVE  ·  ST. LOUIS',main,base+.85,6,'#263f61',.35);
    // Merge small details by material to keep phone draw calls bounded.
    const groups=new Map();for(const mesh of meshes){if(!groups.has(mesh.material))groups.set(mesh.material,[]);groups.get(mesh.material).push(mesh);}
    for(const [m,list] of groups){const merged=BABYLON.Mesh.MergeMeshes(list,true,true);merged.name=`Landmark ${profile.name} ${m.name}`;merged.material=m;merged.freezeWorldMatrix();}
    map.localLandmarks??=[];
    const xs=g.points.map(p=>p[0]),zs=g.points.map(p=>p[1]);
    const width=Math.max(...xs)-Math.min(...xs),depth=Math.max(...zs)-Math.min(...zs);
    const x=(Math.min(...xs)+Math.max(...xs))/2,z=(Math.min(...zs)+Math.max(...zs))/2;
    map.localLandmarks.push({name:profile.name,x,z,height:profile.height,base,viewDistance:Math.max(14,profile.height*1.85,width*1.6,depth*1.6),entrance:{x:main.x+main.nx*1.2,z:main.z+main.nz*1.2},kind:profile.kind,osmId:building.osmId});
    return true;
}
