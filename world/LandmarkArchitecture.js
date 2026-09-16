import { buildingGeometry, buildingBase } from './BuildingGeometry.js';

export function landmarkMaterial(scene,name,color,paint)
{
    const material=new BABYLON.StandardMaterial(name,scene);
    material.diffuseColor=BABYLON.Color3.FromHexString(color);
    material.specularColor=new BABYLON.Color3(.08,.08,.08);
    const texture=new BABYLON.DynamicTexture(name,{width:512,height:512},scene,true);
    const ctx=texture.getContext();ctx.fillStyle=color;ctx.fillRect(0,0,512,512);paint(ctx);
    texture.update();material.diffuseTexture=texture;material.diffuseColor=BABYLON.Color3.White();
    material.backFaceCulling=false;
    return material;
}

export function landmarkSign(scene,text,color,width,height)
{
    const material=new BABYLON.StandardMaterial(text,scene);
    const texture=new BABYLON.DynamicTexture(text,{width:1024,height:128},scene,false),ctx=texture.getContext();
    ctx.fillStyle=color;ctx.fillRect(0,0,1024,128);ctx.fillStyle='#ffffff';
    ctx.font='bold 72px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,512,64,980);
    texture.update();material.diffuseTexture=texture;material.emissiveColor=new BABYLON.Color3(.2,.2,.2);
    const sign=BABYLON.MeshBuilder.CreatePlane(text,{width,height,sideOrientation:BABYLON.Mesh.DOUBLESIDE},scene);
    sign.material=material;sign.isPickable=false;
    return sign;
}

export function arenaKind(building)
{
    if(building.name==='Enterprise Center')return 'enterprise';
    if(building.name==="The Dome at America's Center")return 'dome';
    return null;
}

/* Site outlines stay authoritative; roof and facade geometry use the same perimeter. */
export function createArena(map,building)
{
    const kind=arenaKind(building);if(!kind)return false;
    const scene=map.scene,isDome=kind==='dome';
    const g=buildingGeometry({...building,height:isDome?12:11.5,roofShape:'flat'},map.terrain);
    const base=building.baseElevation??buildingBase(building,map.terrain).base;
    const xs=g.points.map(p=>p[0]),zs=g.points.map(p=>p[1]);
    const cx=(Math.min(...xs)+Math.max(...xs))/2,cz=(Math.min(...zs)+Math.max(...zs))/2;
    const rx=(Math.max(...xs)-Math.min(...xs))/2,rz=(Math.max(...zs)-Math.min(...zs))/2;
    const roofY=(x,z)=>g.roof+(isDome?5:2.6)*Math.max(0,1-((x-cx)/rx)**4)*Math.max(0,1-((z-cz)/rz)**4);
    const facade=landmarkMaterial(scene,`${kind} articulated facade`,isDome?'#ad7160':'#c8c4b9',ctx=>
    {
        if(isDome)
        {
            ctx.strokeStyle='#965f50';ctx.lineWidth=2;
            for(let y=0;y<512;y+=12){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(512,y);ctx.stroke();}
            ctx.fillStyle='#ddcfb5';for(const y of [20,80,340,470])ctx.fillRect(0,y,512,18);
            ctx.fillStyle='#d1b99b';ctx.fillRect(0,0,45,512);ctx.fillRect(467,0,45,512);
            ctx.fillStyle='#355967';ctx.fillRect(75,160,362,178);
            ctx.beginPath();ctx.ellipse(256,160,181,78,0,Math.PI,0);ctx.fill();
            ctx.fillStyle='#cebda5';for(let x=110;x<430;x+=55)ctx.fillRect(x,150,7,190);
        }
        else
        {
            ctx.fillStyle='#385a68';ctx.fillRect(0,140,512,290);
            ctx.fillStyle='#9bbac0';for(let x=0;x<512;x+=48)ctx.fillRect(x,142,12,284);
            ctx.fillStyle='#d9d4c8';for(const y of [0,125,250,430,487])ctx.fillRect(0,y,512,16);
            ctx.fillStyle='#b0ada5';ctx.fillRect(0,0,30,512);ctx.fillRect(482,0,30,512);
            ctx.fillStyle='#146a55';ctx.fillRect(38,54,436,32);
        }
    });
    const roofMaterial=landmarkMaterial(scene,`${kind} ribbed roof`,isDome?'#e0dfd6':'#b2b8b7',ctx=>
    {
        ctx.strokeStyle=isDome?'#b9b9b0':'#889391';ctx.lineWidth=3;
        for(let x=0;x<512;x+=32){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,512);ctx.stroke();}
        ctx.strokeStyle='#c9ceca';for(let y=0;y<512;y+=128){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(512,y);ctx.stroke();}
    });
    const wall={positions:[],indices:[],uvs:[]},roof={positions:[],indices:[],uvs:[]};
    for(let i=0;i<g.points.length;i++)
    {
        const a=g.points[i],b=g.points[(i+1)%g.points.length],n=wall.positions.length/3;
        wall.positions.push(a[0],base-.5,a[1],b[0],base-.5,b[1],b[0],roofY(...b),b[1],a[0],roofY(...a),a[1]);
        const repeats=Math.hypot(b[0]-a[0],b[1]-a[1])/7;
        wall.uvs.push(0,0,repeats,0,repeats,1,0,1);wall.indices.push(n,n+1,n+2,n,n+2,n+3);
    }
    const triangle=(a,b,c,depth)=>
    {
        if(depth)
        {
            const mid=(p,q)=>[(p[0]+q[0])/2,(p[1]+q[1])/2];
            const ab=mid(a,b),bc=mid(b,c),ca=mid(c,a);
            triangle(a,ab,ca,depth-1);triangle(ab,b,bc,depth-1);triangle(ca,bc,c,depth-1);triangle(ab,bc,ca,depth-1);return;
        }
        const n=roof.positions.length/3;
        for(const p of [a,b,c]){roof.positions.push(p[0],roofY(...p),p[1]);roof.uvs.push(p[0]/16,p[1]/16);}
        roof.indices.push(n,n+1,n+2);
    };
    for(let i=0;i<g.roofTriangles.length;i+=3)triangle(...g.roofTriangles.slice(i,i+3).map(j=>g.points[j]),3);
    for(const [name,geometry,material] of [['facade',wall,facade],['roof',roof,roofMaterial]])
    {
        const mesh=new BABYLON.Mesh(`${building.name} ${name}`,scene),vd=new BABYLON.VertexData();
        Object.assign(vd,geometry);vd.normals=[];BABYLON.VertexData.ComputeNormals(vd.positions,vd.indices,vd.normals);
        if(name==='roof')
        {
            vd.normals=[];
            for(let i=0;i<vd.positions.length;i+=3)
            {
                const x=vd.positions[i],z=vd.positions[i+2],step=.05;
                const normal=new BABYLON.Vector3(-(roofY(x+step,z)-roofY(x-step,z))/(2*step),1,-(roofY(x,z+step)-roofY(x,z-step))/(2*step)).normalize();
                vd.normals.push(normal.x,normal.y,normal.z);
            }
        }
        vd.applyToMesh(mesh);mesh.material=material;mesh.checkCollisions=true;mesh.freezeWorldMatrix();
    }
    // Place lettering on the longest real edge, facing away from the building center.
    const edges=g.points.map((a,i)=>({a,b:g.points[(i+1)%g.points.length]})).sort((a,b)=>Math.hypot(b.a[0]-b.b[0],b.a[1]-b.b[1])-Math.hypot(a.a[0]-a.b[0],a.a[1]-a.b[1]));
    const {a,b}=edges[0],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
    const sign=landmarkSign(scene,isDome?"THE DOME • AMERICA'S CENTER":'enterprise CENTER',isDome?'#764d43':'#096c53',Math.min(28,length*.85),2.4);
    sign.position.set((a[0]+b[0])/2+dz/length*.08,base+8,(a[1]+b[1])/2-dx/length*.08);sign.rotation.y=Math.atan2(-dz,dx);
    map.landmarks??=[];map.landmarks.push({name:building.name,x:cx,z:cz,top:g.roof+(isDome?5:2.6)});
    return true;
}
