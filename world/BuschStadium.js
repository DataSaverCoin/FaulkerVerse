import { createBuschExterior } from './BuschExterior.js';
import { landmarkMaterial, landmarkSign } from './LandmarkArchitecture.js';
import { buildingGeometry } from './BuildingGeometry.js';
import { insideFootprint } from './BuildingFootprints.js';

/* Open bowl derived from the actual OSM outer ring and playing-field hole. */
export function createBuschStadium(map)
{
    const data=map.data.stadium;if(!data)return;
    const inner=data.holes[0],outer=data.points;
    const cx=inner.slice(0,-1).reduce((s,p)=>s+p[0],0)/(inner.length-1),cz=inner.slice(0,-1).reduce((s,p)=>s+p[1],0)/(inner.length-1);
    const boundary=(polygon,angle)=>
    {
        const dx=Math.cos(angle),dz=Math.sin(angle);let best=Infinity;
        for(let i=1;i<polygon.length;i++)
        {
            const a=polygon[i-1],b=polygon[i],ex=b[0]-a[0],ez=b[1]-a[1],det=dx*ez-dz*ex;
            if(Math.abs(det)<1e-9)continue;
            const t=((a[0]-cx)*ez-(a[1]-cz)*ex)/det,u=((a[0]-cx)*dz-(a[1]-cz)*dx)/det;
            if(t>0&&u>=0&&u<=1)best=Math.min(best,t);
        }
        return Number.isFinite(best)?best:0;
    };
    const scene=map.scene,base=map.terrain.getGroundHeightAt(cx,cz),paths=[];
    for(let row=0;row<=48;row++)
    {
        const t=row/48;
        paths.push(Array.from({length:129},(_,i)=>
        {
            const angle=i/128*Math.PI*2,r0=boundary(inner,angle),r1=boundary(outer,angle)-.4;
            const r=r0+(r1-r0)*t;return new BABYLON.Vector3(cx+Math.cos(angle)*r,base+.4+Math.floor(row/2)/24*data.height*(Math.cos(angle)+Math.sin(angle)>.65?.38:1),cz+Math.sin(angle)*r);
        }));
    }
    const stands=BABYLON.MeshBuilder.CreateRibbon('Busch Stadium open seating bowl',{pathArray:paths,sideOrientation:BABYLON.Mesh.DOUBLESIDE},scene);stands.material=map.architecture.roofs.seats;
    if(typeof document!=='undefined')
    {
        const tex=new BABYLON.DynamicTexture('Busch seating rows',{width:256,height:256},scene,true),ctx=tex.getContext();
        ctx.fillStyle='#a23a30';ctx.fillRect(0,0,256,256);
        for(let y=0;y<256;y+=16)for(let x=8;x<240;x+=16){ctx.fillStyle='#c54638';ctx.fillRect(x,y+2,12,10);ctx.fillStyle='#ed7053';ctx.fillRect(x,y+2,12,3);}
        tex.uScale=12;tex.vScale=3;tex.update();stands.material.diffuseTexture=tex;stands.material.diffuseColor=BABYLON.Color3.White();
    }
    const concourse=new BABYLON.StandardMaterial('Busch concrete aisles',scene);concourse.diffuseColor=BABYLON.Color3.FromHexString('#b0a48e');
    for(const fraction of [.28,.58,.86])
    {
        const rings=[fraction,fraction+.025].map(t=>Array.from({length:129},(_,i)=>
        {
            const angle=i/128*Math.PI*2,r0=boundary(inner,angle),r1=boundary(outer,angle)-.4;
            const r=r0+(r1-r0)*t,level=Math.cos(angle)+Math.sin(angle)>.65?.38:1;
            return new BABYLON.Vector3(cx+Math.cos(angle)*r,base+.48+Math.floor(t*24)/24*data.height*level,cz+Math.sin(angle)*r);
        }));
        const aisle=BABYLON.MeshBuilder.CreateRibbon('Busch seating tier concourse',{pathArray:rings,sideOrientation:BABYLON.Mesh.DOUBLESIDE},scene);aisle.material=concourse;
    }
    const facade=outer.map(p=>new BABYLON.Vector3(p[0],base,p[1])),top=outer.map(p=>new BABYLON.Vector3(p[0],base+data.height*((p[0]-cx)+(p[1]-cz)>15?.38:1),p[1]));
    const wall=BABYLON.MeshBuilder.CreateRibbon('Busch Stadium red brick exterior',{pathArray:[facade,top],sideOrientation:BABYLON.Mesh.FRONTSIDE},scene);wall.material=landmarkMaterial(scene,'Busch brick arcades','#9c4e37',ctx=>
    {
        ctx.strokeStyle='#723d2f';ctx.lineWidth=2;
        for(let y=0;y<512;y+=16){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(512,y);ctx.stroke();for(let x=(y/16%2)*24;x<512;x+=48){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+16);ctx.stroke();}}
        ctx.fillStyle='#cfaa81';ctx.fillRect(0,22,512,22);ctx.fillRect(0,470,512,22);
        ctx.fillStyle='#ceaa84';ctx.beginPath();ctx.moveTo(62,466);ctx.lineTo(62,212);ctx.arc(256,212,194,Math.PI,0);ctx.lineTo(450,466);ctx.fill();
        ctx.fillStyle='#273d35';ctx.beginPath();ctx.moveTo(83,466);ctx.lineTo(83,212);ctx.arc(256,212,173,Math.PI,0);ctx.lineTo(429,466);ctx.fill();
        ctx.fillStyle='#668075';for(let x=110;x<430;x+=58)ctx.fillRect(x,210,7,256);
        ctx.fillStyle='#30493e';ctx.fillRect(70,335,372,14);
    });
    const uvs=[];let distance=0;
    for(let row=0;row<2;row++){distance=0;for(let i=0;i<outer.length;i++){if(i)distance+=Math.hypot(outer[i][0]-outer[i-1][0],outer[i][1]-outer[i-1][1]);uvs.push(distance/6,row);}}
    wall.setVerticesData(BABYLON.VertexBuffer.UVKind,uvs);
    // A baseball diamond and grass inside the mapped opening make the bowl legible.
    const fieldGeometry=buildingGeometry({points:inner,height:.04,baseElevation:base},map.terrain);
    const field=new BABYLON.Mesh('Busch shaped baseball field',scene),fieldData=new BABYLON.VertexData();
    fieldData.positions=fieldGeometry.positions;fieldData.indices=fieldGeometry.indices.slice(fieldGeometry.wallIndexCount);
    const ix=inner.map(p=>p[0]),iz=inner.map(p=>p[1]),minX=Math.min(...ix),minZ=Math.min(...iz),w=Math.max(...ix)-minX,h=Math.max(...iz)-minZ;
    fieldData.uvs=[];
    for(let i=0;i<fieldData.positions.length;i+=3)fieldData.uvs.push((fieldData.positions[i]-minX)/w,(fieldData.positions[i+2]-minZ)/h);
    fieldData.applyToMesh(field);
    field.material=landmarkMaterial(scene,'Busch mown grass and baseball diamond','#467c38',ctx=>
    {
        for(let x=0;x<512;x+=64){ctx.fillStyle=x%128?'#4f8b3e':'#3e7632';ctx.fillRect(x,0,64,512);}
        ctx.fillStyle='#b68758';ctx.beginPath();ctx.moveTo(256,440);ctx.lineTo(116,280);ctx.lineTo(256,120);ctx.lineTo(396,280);ctx.closePath();ctx.fill();
        ctx.fillStyle='#568b3c';ctx.beginPath();ctx.moveTo(256,401);ctx.lineTo(154,280);ctx.lineTo(256,160);ctx.lineTo(358,280);ctx.closePath();ctx.fill();
        ctx.fillStyle='#c39a6c';ctx.beginPath();ctx.arc(256,280,17,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#faf5dd';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(24,178);ctx.lineTo(256,440);ctx.lineTo(488,178);ctx.stroke();
        ctx.fillStyle='#fff9e5';for(const [x,y] of [[256,425],[130,280],[256,137],[382,280]])ctx.fillRect(x-5,y-5,10,10);
    });
    const scoreboard=landmarkSign(scene,'CARDINALS  •  BUSCH STADIUM','#12342c',19,7);
    scoreboard.position.set(cx,base+data.height+3,cz+boundary(inner,Math.PI/2)+2);scoreboard.rotation.y=Math.PI;
    const steel=new BABYLON.StandardMaterial('Busch dark green steel',scene);steel.diffuseColor=BABYLON.Color3.FromHexString('#304c40');
    for(const angle of [0,Math.PI*.65,Math.PI,Math.PI*1.5])
    {
        const r=boundary(outer,angle)-2,x=cx+Math.cos(angle)*r,z=cz+Math.sin(angle)*r;
        const pole=BABYLON.MeshBuilder.CreateCylinder('Busch floodlight tower',{diameter:.4,height:8},scene);pole.position.set(x,base+data.height+3,z);pole.material=steel;
        const light=BABYLON.MeshBuilder.CreateBox('Busch floodlight bank',{width:4,height:1.2,depth:.5},scene);light.position.set(x,base+data.height+7,z);light.material=map.materials.steel;
    }
    if(typeof document!=='undefined')
    {
        const texture=new BABYLON.DynamicTexture('Busch Stadium lettering',{width:1024,height:128},scene,false),ctx=texture.getContext();
        ctx.fillStyle='#722a26';ctx.fillRect(0,0,1024,128);ctx.font='bold 74px Georgia';ctx.textAlign='center';ctx.fillStyle='#f5dfb5';ctx.fillText('BUSCH STADIUM',512,92);texture.update();
        const signMaterial=new BABYLON.StandardMaterial('Busch Stadium sign',scene);signMaterial.diffuseTexture=texture;signMaterial.emissiveColor=new BABYLON.Color3(.16,.14,.1);
        const sign=BABYLON.MeshBuilder.CreatePlane('Busch Stadium name',{width:22,height:2.75,sideOrientation:BABYLON.Mesh.FRONTSIDE},scene);
        sign.position.set(cx,base+data.height+1.5,Math.max(...outer.map(p=>p[1]))-.5);sign.rotation.y=Math.PI;sign.material=signMaterial;
    }
    map.landmarks??=[];map.landmarks.push({name:data.name,x:cx,z:cz,top:base+data.height+8});
    createBuschExterior(map,outer,cx,cz,base,data.height);
    map.localLandmarks??=[];
    map.localLandmarks.push({name:'Busch Stadium',kind:'stadium',x:cx,z:cz,base,height:data.height,viewDistance:100,entrance:{x:cx,z:Math.max(...outer.map(p=>p[1]))+3}});
    map.stadiumBounds=data;
    map.stadiumField={x:cx,z:cz};
    map.stadiumIsBlocked=(x,z,radius=0)=>
    {
        for(let i=0;i<9;i++)
        {
            const px=x+(i?Math.cos(i*Math.PI/4)*radius:0),pz=z+(i?Math.sin(i*Math.PI/4)*radius:0);
            if(insideFootprint(px,pz,outer)&&!insideFootprint(px,pz,inner))return true;
        }
        return false;
    };
}
