import {ACTOR_SCALE} from '../engine/ActorScale.js';
import {clydesdaleTemplate} from '../entities/ClydesdaleCarriage.js';
/* Follow mapped legal streets, including a short Broadway/Walnut return connector. */
export function createCarriages(traffic)
{
    const network=traffic.network;
    const points=[[156.4,-120.12],[147.38,-148.43],[60.45,-120.84],[69.23,-92.2],[-132.25,-30.44],[-153.89,-103.07],[46.83,-166.23],[69.23,-92.2],[156.4,-120.12]];
    const streets=['South Broadway','Walnut Street','South 8th Street','Market Street','South 14th Street','Clark Avenue','South 8th Street','Market Street'];
    const node=p=>[...network.nodes.values()].find(n=>Math.hypot(n.point[0]-p[0],n.point[1]-p[1])<.05);
    const loop=[];
    for(let i=0;i<streets.length;i++){
        const start=node(points[i]),end=node(points[i+1]);
        if(!start||!end)throw new Error('Carriage loop endpoint missing');
        const queue=[{node:start,path:[]}],seen=new Set();let found=null;
        for(const item of queue){
            if(item.node===end){found=item.path;break;}
            if(seen.has(item.node))continue;seen.add(item.node);
            for(const edge of network.outgoing(item.node).filter(e=>e.name===streets[i])){
                const route=network.directed(edge,item.node);queue.push({node:route.to,path:[...item.path,route]});
            }
        }
        if(!found)throw new Error('No legal carriage connection on '+streets[i]);
        loop.push(...found);
    }
    // Route objects are distinct even when two parts of the loop share an edge.
    loop.forEach((r,i)=>r.loopIndex=i);
    const length=loop.reduce((sum,r)=>sum+r.edge.length,0),template=clydesdaleTemplate(traffic.map.scene);
    traffic.carriageLoop={routes:loop,length,streets};
    for(let i=0;i<4;i++){
        let offset=length*i/4,index=0;
        while(offset>=loop[index].edge.length){offset-=loop[index].edge.length;index++;}
        const mesh=template.mesh.createInstance('AB Clydesdale carriage '+(i+1));mesh.scaling.setAll(ACTOR_SCALE);mesh.isVisible=true;mesh.isPickable=false;
        const v={id:traffic.vehicles.length,mesh,route:loop[index],distance:offset,speed:0,maxSpeed:1.65,length:template.length,kind:'carriage',turns:0,wait:0,elapsed:0,fixedLoop:loop,legs:[]};
        for(const [j,leg] of template.legs.entries()){
            const m=leg.mesh.createInstance('Carriage '+i+' leg '+j);m.parent=mesh;m.position.set(leg.x,leg.y,leg.z);m.isVisible=true;m.isPickable=false;v.legs.push({mesh:m,phase:leg.phase});
        }
        traffic.place(v);traffic.vehicles.push(v);
    }
}
export function planCarriage(v,zone)
{
    v.path=[];v.plannedZone=zone;
    for(let step=1;step<=v.fixedLoop.length;step++){
        const route=v.fixedLoop[(v.route.loopIndex+step)%v.fixedLoop.length];v.path.push(route);
        if(!zone||route.to.trafficZone!==zone&&[...zone.nodes].every(n=>Math.hypot(n.point[0]-route.to.point[0],n.point[1]-route.to.point[1])>5))return;
    }
}
