/* Bridge geometry and vehicle support share the pavement elevation function. */
export function prepareRiverCrossings(map)
{
    map.riverCrossings=[];
    const endpoints=new Map(),key=p=>p.join(':');
    for(const road of map.data.roads)for(const p of [road.points[0],road.points.at(-1)])
    {
        if(!endpoints.has(key(p)))endpoints.set(key(p),[]);
        endpoints.get(key(p)).push(road);
    }
    for(const road of map.data.roads)
    {
        let crosses=false;
        for(let i=1;i<road.points.length&&!crosses;i++)
        {
            const a=road.points[i-1],b=road.points[i],count=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/8);
            for(let j=0;j<=count;j++)
                if(map.geology.isWater(a[0]+(b[0]-a[0])*j/count,a[1]+(b[1]-a[1])*j/count)){crosses=true;break;}
        }
        road.riverCrossing=crosses;
        if(crosses){road.bridge=true;map.riverCrossings.push(road);}
    }
    // Continue a ramp through OSM way boundaries until it reaches dry ground.
    const queue=[...map.riverCrossings],visited=new Set(queue);
    while(queue.length)
    {
        const road=queue.pop();
        for(const p of [road.points[0],road.points.at(-1)])
        {
            if(map.geology.riverDistance(...p)>=map.geology.halfWidth(p[1])+35)continue;
            for(const next of endpoints.get(key(p))||[])
                if(!visited.has(next)){visited.add(next);next.bridge=true;queue.push(next);}
        }
    }
}

export function roadElevation(map,road,x,z)
{
    const ground=map.terrain.getGroundHeightAt(x,z);
    if(!road.bridge)return ground;
    const land=map.geology.landHeight(x,z);
    // The dry approaches settle onto terrain; the deck clears the river by four units.
    const river=1-map.geology.smooth(map.geology.halfWidth(z)+5,map.geology.halfWidth(z)+35,map.geology.riverDistance(x,z));
    return Math.max(ground,land)+river*3;
}

export function createRiverBridges(map)
{
    const scene=map.scene,groups=new Map();
    const materials={};
    for(const [name,color] of Object.entries({deck:'#777e79',steel:'#879c98',pier:'#beb7a4'}))
    {
        const mat=new BABYLON.StandardMaterial(`Bridge ${name}`,scene);mat.diffuseColor=BABYLON.Color3.FromHexString(color);materials[name]=mat;
    }
    const box=(name,x,y,z,width,height,depth,angle,kind)=>
    {
        const mesh=BABYLON.MeshBuilder.CreateBox(name,{width,height,depth},scene);
        mesh.position.set(x,y,z);mesh.rotation.y=angle;mesh.material=materials[kind];
        if(!groups.has(kind))groups.set(kind,[]);groups.get(kind).push(mesh);return mesh;
    };
    map.bridgeStructures=[];
    for(const road of map.riverCrossings)
    {
        const width=road.width*1.35;
        let distance=0,nextPier=12;
        for(let i=1;i<road.points.length;i++)
        {
            const a=road.points[i-1],b=road.points[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
            if(length<.1)continue;
            const dx=(b[0]-a[0])/length,dz=(b[1]-a[1])/length,angle=Math.atan2(dx,dz),count=Math.ceil(length/4);
            for(let j=0;j<count;j++)
            {
                const t=(j+.5)/count,x=a[0]+dx*length*t,z=a[1]+dz*length*t;
                if(!map.geology.isWater(x,z,8))continue;
                const y=roadElevation(map,road,x,z);
                box('River bridge deck',x,y-.3,z,width,.6,length/count+.15,angle,'deck');
                for(const side of [-1,1])
                {
                    const ex=x+dz*side*(width/2-.15),ez=z-dx*side*(width/2-.15);
                    box('Bridge parapet',ex,y+.45,ez,.23,.65,length/count+.15,angle,'steel');
                }
                if(distance+length*t>=nextPier)
                {
                    const bottom=map.terrain.getGroundHeightAt(x,z)-.3;
                    box('River bridge pier',x,(bottom+y-.6)/2,z,Math.max(1,width*.55),Math.max(.3,y-.6-bottom),1.5,angle,'pier');
                    nextPier=distance+length*t+24;
                }
            }
            distance+=length;
        }
        map.bridgeStructures.push({name:road.name,points:road.points});
    }
    for(const [kind,meshes] of groups)
    {
        const merged=BABYLON.Mesh.MergeMeshes(meshes,true,true);if(!merged)continue;
        merged.name=`River bridge ${kind} structures`;merged.material=materials[kind];merged.freezeWorldMatrix();
    }
}
