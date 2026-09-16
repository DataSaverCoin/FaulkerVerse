import { landmarkSign } from './LandmarkArchitecture.js';
import { insideFootprint } from './BuildingFootprints.js';

export function insideCityPark(map,building)
{
    const site=map.cityParkData?.sites.find(s=>s.kind==='stadium');if(!site)return false;
    const x=building.points.reduce((s,p)=>s+p[0],0)/building.points.length,z=building.points.reduce((s,p)=>s+p[1],0)/building.points.length;
    return insideFootprint(x,z,site.points);
}

export function createCityPark(map)
{
    const scene=map.scene,meshes=[],materials=new Map();
    const mat=(name,color)=>{if(!materials.has(name)){const m=new BABYLON.StandardMaterial(name,scene);m.diffuseColor=BABYLON.Color3.FromHexString(color);m.specularColor.set(.12,.12,.12);materials.set(name,m);}return materials.get(name);};
    const steel=mat('CITY brushed silver','#cbd1d2'),dark=mat('CITY structural steel','#39454c'),seats=mat('CITY red seating','#b5244b'),concrete=mat('CITY concrete','#a69f93'),glass=mat('CITY glass','#385e6b');
    const frame=(points,angle=.258)=>{
        const c=Math.cos(angle),s=Math.sin(angle),xs=points.map(p=>p[0]*c-p[1]*s),zs=points.map(p=>p[0]*s+p[1]*c);
        const x=(Math.max(...xs)+Math.min(...xs))/2,z=(Math.max(...zs)+Math.min(...zs))/2;
        return {x:x*c+z*s,z:-x*s+z*c,w:Math.max(...xs)-Math.min(...xs),d:Math.max(...zs)-Math.min(...zs),angle};
    };
    const world=(f,x,z)=>[f.x+x*Math.cos(f.angle)+z*Math.sin(f.angle),f.z-x*Math.sin(f.angle)+z*Math.cos(f.angle)];
    const box=(f,name,w,h,d,x,y,z,material,blocking=false)=>{
        const [wx,wz]=world(f,x,z),m=BABYLON.MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene);m.position.set(wx,y,wz);m.rotation.y=f.angle;m.material=material;meshes.push(m);
        if(blocking){const poly=[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2],[-w/2,-d/2]].map(([a,b])=>world(f,x+a,z+b));map.buildings.push(poly);map.buildingIndex.insert(poly,poly,8);}
        return m;
    };
    const pitch=(f,base,name)=>{
        const m=mat(name+' turf','#ffffff'),texture=new BABYLON.DynamicTexture(name+' markings',{width:512,height:1024},scene,true),c=texture.getContext();
        for(let i=0;i<20;i++){c.fillStyle=i%2?'#387447':'#43814d';c.fillRect(0,i*52,512,52);}
        c.strokeStyle='#ecede0';c.lineWidth=4;c.strokeRect(18,18,476,988);c.beginPath();c.moveTo(18,512);c.lineTo(494,512);c.stroke();
        c.beginPath();c.ellipse(256,512,66,88,0,0,Math.PI*2);c.stroke();
        for(const y of [18,1006]){const top=y===18;c.strokeRect(104,top?18:848,304,158);c.strokeRect(186,top?18:949,140,57);c.beginPath();c.arc(256,top?126:898,4,0,Math.PI*2);c.fillStyle='#fff';c.fill();}
        texture.update();m.diffuseTexture=texture;
        const ground=BABYLON.MeshBuilder.CreateGround(name,{width:f.w,height:f.d},scene);ground.position.set(f.x,base+.03,f.z);ground.rotation.y=f.angle;ground.material=m;meshes.push(ground);
        for(const side of [-1,1])
        {
            const z=side*(f.d/2-.3),goal=2.25;
            for(const x of [-goal/2,goal/2])box(f,name+' goal post',.05,.78,.05,x,base+.4,z,steel);
            box(f,name+' crossbar',goal,.05,.05,0,base+.79,z,steel);
            for(let x=-goal/2;x<=goal/2;x+=.25)box(f,name+' net',.014,.75,.015,x,base+.4,z+side*.45,steel);
            for(let y=.15;y<.8;y+=.15)box(f,name+' net horizontal',goal,.014,.015,0,base+y,z+side*.45,steel);
        }
    };
    const site=map.cityParkData.sites.find(s=>s.kind==='stadium'),f=frame(site.points),base=Math.max(...site.points.map(p=>map.terrain.getGroundHeightAt(...p)))+.06;
    f.w-=1.5;f.d-=1.5;
    const pw=f.w*.47,pd=f.d*.64;
    pitch({...f,w:pw,d:pd},base,'CITYPARK match pitch');
    for(const side of [-1,1])
    {
        const standW=(f.w-pw)/2-1.2,standD=(f.d-pd)/2-1.2;
        for(let row=0;row<12;row++)
        {
            const y=base+.5+row*.43;
            box(f,'CITY east/west seat tier',standW/12+.05,.42,pd+2,side*(pw/2+1+standW*(row+.5)/12),y,0,row%4===0?concrete:seats,true);
            box(f,'CITY north/south seat tier',pw+2,.42,standD/12+.05,0,y,side*(pd/2+1+standD*(row+.5)/12),row%4===0?concrete:seats,true);
        }
        box(f,'CITY floating silver side canopy',standW+2,.22,f.d-2,side*(f.w/2-(standW+2)/2),base+8.2,0,steel);
        box(f,'CITY floating silver end canopy',pw+.7,.22,standD+1.7,0,base+8.2,side*(f.d/2-(standD+1.7)/2),steel);
        for(let z=-f.d/2+2;z<f.d/2;z+=4)
        {
            const x=side*(f.w/2-.7);box(f,'CITY exposed column',.18,8,.18,x,base+4,z,dark,true);
            box(f,'CITY roof truss',standW+1.5,.25,.15,side*(f.w/2-standW/2-.6),base+7.6,z,dark);
            box(f,'CITY concourse glazing',.12,1.7,3.5,x,base+1.1,z,glass);
        }
        for(let x=-pw/2;x<pw/2;x+=3)box(f,'CITY end columns',.16,8,.16,x,base+4,side*(f.d/2-.6),dark,true);
    }
    // The white CITY seating graphic is a defining view into the real bowl.
    const cityTexture=new BABYLON.DynamicTexture('CITY seating letters',{width:1024,height:512},scene,true),ctx=cityTexture.getContext();
    ctx.clearRect(0,0,1024,512);ctx.fillStyle='#ffffff';ctx.font='bold 380px sans-serif';ctx.textAlign='center';ctx.fillText('CITY',512,390,980);cityTexture.update();cityTexture.hasAlpha=true;
    const cityMaterial=mat('CITY seating lettering','#ffffff');cityMaterial.diffuseTexture=cityTexture;cityMaterial.useAlphaFromDiffuseTexture=true;cityMaterial.backFaceCulling=false;cityMaterial.zOffset=-1;
    const lettering=new BABYLON.Mesh('CITY stand lettering',scene),vd=new BABYLON.VertexData();
    vd.positions=[];for(const [x,y,z] of [[-pw/2-1.3,base+.9,-pd*.4],[-pw/2-1.3,base+.9,pd*.4],[-f.w/2+1.1,base+5.5,pd*.4],[-f.w/2+1.1,base+5.5,-pd*.4]]){const [wx,wz]=world(f,x,z);vd.positions.push(wx,y,wz);}
    vd.indices=[0,1,2,0,2,3];vd.uvs=[0,0,1,0,1,1,0,1];vd.normals=[];BABYLON.VertexData.ComputeNormals(vd.positions,vd.indices,vd.normals);vd.applyToMesh(lettering);lettering.material=cityMaterial;meshes.push(lettering);
    const title=landmarkSign(scene,'CITYPARK  ·  ST. LOUIS CITY SC','#283a45',f.w*.75,1.4);title.position.set(...(()=>{const [x,z]=world(f,0,-f.d/2-.1);return [x,base+6.7,z]})());title.rotation.y=f.angle;
    const score=landmarkSign(scene,'CITY  0 : 0  STL','#101b23',8,2.5);const [sx,sz]=world(f,0,f.d/2-1);score.position.set(sx,base+5.5,sz);score.rotation.y=f.angle+Math.PI;
    map.localLandmarks??=[];map.localLandmarks.unshift({name:'CITYPARK · soccer stadium',kind:'citypark',x:f.x,z:f.z,base,height:8.5,viewDistance:Math.max(f.w,f.d)*1.25,entrance:map.nearestRoad(...world(f,f.w/2+4,-f.d*.3))});
    let count=0;
    for(const site of map.cityParkData.sites.filter(s=>s.kind==='pitch'&&s.osmId!=='1268400177'))
    {
        const angle=site.osmId==='1108025515'?.258+Math.PI/2:.258,field=frame(site.points,angle);field.w*=.94;field.d*=.94;
        const y=Math.max(...site.points.map(p=>map.terrain.getGroundHeightAt(...p)))+.05;
        pitch(field,y,`CITY practice field ${++count}`);
        for(const side of [-1,1])
        {
            box(field,'Training ground fence',.025,1.1,field.d,side*(field.w/2+.2),y+.55,0,dark);
            for(let z=-field.d/2;z<=field.d/2;z+=4)box(field,'Fence upright',.045,1.3,.045,side*(field.w/2+.2),y+.65,z,dark);
            for(const end of [-1,1]){box(field,'Training floodlight mast',.12,6,.12,side*(field.w/2+.4),y+3,end*field.d*.4,steel);box(field,'Training floodlights',.85,.2,.35,side*(field.w/2+.4),y+6,end*field.d*.4,steel);}
        }
        const sign=landmarkSign(scene,'ST. LOUIS CITY  ·  TRAINING','#293b45',Math.min(field.w,12),.7);const [x,z]=world(field,0,-field.d/2);sign.position.set(x,y+1,z);sign.rotation.y=field.angle;
        map.localLandmarks.push({name:`CITY SC · practice field ${count}`,kind:'practice',x:field.x,z:field.z,height:1,base:y,viewDistance:45,entrance:map.nearestRoad(field.x,field.z)});
    }
    for(const material of new Set(meshes.map(m=>m.material))){const merged=BABYLON.Mesh.MergeMeshes(meshes.filter(m=>m.material===material),true,true);merged.name=`CITYPARK ${material.name}`;merged.material=material;merged.freezeWorldMatrix();}
    map.cityParkAudit={practiceFields:count,stadium:site.osmId,meshGroups:new Set(meshes.map(m=>m.material)).size};
}
