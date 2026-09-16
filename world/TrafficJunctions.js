import {planCarriage} from './CarriageRoute.js';
/* Short OSM links can describe one crossing as several nodes. Reserve it as a unit. */
export class TrafficJunctions
{
    constructor(network)
    {
        this.network=network;this.zones=[];
        const junctions=[...network.nodes.values()].filter(n=>n.edges.length>=3),parents=new Map(junctions.map(n=>[n,n]));
        const root=n=>{while(parents.get(n)!==n)n=parents.get(n);return n;};
        // Merge nearby parts of one crossing, keeping neighboring city blocks independent.
        for(let i=0;i<junctions.length;i++)for(let j=0;j<i;j++)
            if(Math.hypot(junctions[i].point[0]-junctions[j].point[0],junctions[i].point[1]-junctions[j].point[1])<14)
                parents.set(root(junctions[i]),root(junctions[j]));
        const groups=new Map();for(const n of junctions){const k=root(n);if(!groups.has(k))groups.set(k,{id:k.key,nodes:new Set(),owner:null});groups.get(k).nodes.add(n);}
        this.zones=[...groups.values()];
        for(const zone of this.zones)zone.coreNodes=new Set(zone.nodes);
        for(const zone of this.zones)for(const n of zone.nodes)n.trafficZone=zone;
        // Fill complete internal shape-node chains; a crossing must not have unlocked holes.
        for(const zone of this.zones)for(const start of [...zone.nodes])for(const first of start.edges){
            let previous=first,node=first.a===start?first.b:first.a;const path=[],seen=new Set([start]);
            while(node.edges.length===2&&!seen.has(node)){
                seen.add(node);path.push(node);const edge=node.edges.find(e=>e!==previous);previous=edge;node=edge.a===node?edge.b:edge.a;
            }
            if(node.trafficZone===zone)for(const shape of path){shape.trafficZone=zone;zone.nodes.add(shape);}
        }
        // Include the shape nodes between nearby junction nodes, keeping the lock through bends.
        for(const zone of this.zones){const anchors=[...zone.nodes],queue=[...zone.nodes];for(const n of queue)for(const e of n.edges){const other=e.a===n?e.b:e.a;if(other.trafficZone||other.edges.length>2)continue;if(anchors.some(j=>Math.hypot(j.point[0]-other.point[0],j.point[1]-other.point[1])<5)){other.trafficZone=zone;zone.nodes.add(other);queue.push(other);}}}
    }
    release(v)
    {
        for(const zone of v.heldZones||[])if(zone.owner===v)zone.owner=null;
        v.heldZones=new Set();v.zone=null;
    }
    clear(v)
    {
        if(v.taken){this.release(v);return;}
        for(const zone of v.heldZones||[]){
            if(v.route.to.trafficZone===zone)continue;
            if([...zone.coreNodes].every(n=>Math.hypot(v.mesh.position.x-n.point[0],v.mesh.position.z-n.point[1])>3+v.length/2)){
                if(zone.owner===v)zone.owner=null;v.heldZones.delete(zone);if(v.zone===zone)v.zone=null;
            }
        }
    }
    plan(v,random,map)
    {
        const start=v.route.to,zone=start.trafficZone;
        if(v.path?.length&&(!zone||v.plannedZone===zone))return;
        if(v.fixedLoop){planCarriage(v,zone);return;}
        v.path=[];v.plannedZone=zone;
        const first=this.network.outgoing(start).filter(e=>e!==v.route.edge&&this.network.isClear(this.network.directed(e,start),map));
        const candidates=first.length?first:this.network.outgoing(start);
        const ordered=candidates.map(e=>({edge:e,rank:random()})).sort((a,b)=>a.rank-b.rank);
        for(const {edge} of ordered){
            const route=this.network.directed(edge,start),queue=[{route,path:[route]}],visited=new Set([start]);
            for(let i=0;i<queue.length;i++){
                const item=queue[i],to=item.route.to;
                if(!zone||to.trafficZone!==zone&&[...zone.nodes].every(n=>Math.hypot(n.point[0]-to.point[0],n.point[1]-to.point[1])>5)){v.path=item.path;return;}
                if(visited.has(to))continue;visited.add(to);
                for(const next of this.network.outgoing(to).filter(e=>e!==item.route.edge&&this.network.isClear(this.network.directed(e,to),map)))queue.push({route:this.network.directed(next,to),path:[...item.path,this.network.directed(next,to)]});
            }
        }
        v.path=this.network.canTravel(v.route.edge,start)?[this.network.directed(v.route.edge,start)]:candidates.length?[this.network.directed(candidates[0],start)]:[];
    }
    canEnter(v,traffic)
    {
        const zone=v.route.to.trafficZone;if(!zone||zone.owner===v)return true;
        zone.requests??=new Map();if(!zone.requests.has(v))zone.requests.set(v,traffic.time);
        if(zone.owner)return false;
        let winner=null,oldest=Infinity;
        for(const [candidate,since] of zone.requests){
            if(candidate.taken||candidate.route.to.trafficZone!==zone){zone.requests.delete(candidate);continue;}
            if(candidate.route.edge.length-candidate.distance>=Math.min(7,candidate.route.edge.length*.45)+2)continue;
            if(this.ready(candidate,traffic,zone)&&(since<oldest||since===oldest&&candidate.id<winner.id)){winner=candidate;oldest=since;}
        }
        if(winner!==v)return false;
        zone.requests.delete(v);zone.owner=v;v.zone=zone;(v.heldZones??=new Set()).add(zone);return true;
    }
    ready(v,traffic,zone)
    {
        if(!traffic.signals.canEnter(v.route.to,v.route))return false;
        // A follower must never acquire the crossing ahead of the car leading its queue.
        if(traffic.grid.near(v.mesh.position.x,v.mesh.position.z,15).some(o=>o!==v&&o.route.edge===v.route.edge&&o.route.from===v.route.from&&o.distance>v.distance))return false;
        if(traffic.grid.near(v.mesh.position.x,v.mesh.position.z,15).some(o=>{
            if(o===v||o.route.dx*v.route.dx+o.route.dz*v.route.dz<.8)return false;
            const dx=o.mesh.position.x-v.mesh.position.x,dz=o.mesh.position.z-v.mesh.position.z;
            const ahead=dx*v.route.dx+dz*v.route.dz;
            return ahead>.3&&ahead<v.route.edge.length-v.distance+3&&Math.abs(dx*v.route.dz-dz*v.route.dx)<.6;
        }))return false;
        // Do not block the box: reserve only if the chosen exit has room for the whole vehicle.
        const exit=v.path?.find(r=>r.to.trafficZone!==zone);if(!exit)return false;
        const point=traffic.network.point(exit,Math.min(exit.edge.length,5+v.length));
        if(traffic.grid.near(point.x,point.z,5).some(o=>{
            if(o===v)return false;const dx=o.mesh.position.x-point.x,dz=o.mesh.position.z-point.z;
            return Math.abs(dx*exit.dx+dz*exit.dz)<(o.length+v.length)/2+1&&Math.abs(dx*exit.dz-dz*exit.dx)<.75;
        }))return false;
        return true;
    }
}
