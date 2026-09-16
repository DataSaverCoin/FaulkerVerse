import {TrafficJunctions} from './TrafficJunctions.js';
/* A connected, bidirectional simulation graph from the bundled street centerlines. */
export class TrafficNetwork
{
    constructor(map)
    {
        this.nodes=new Map();this.edges=[];
        const seen=new Set(),key=p=>p.map(n=>n.toFixed(2)).join(':');
        for(const road of map.roads)
        {
            // Ambient street traffic avoids stacked freeway/ramp geometry and bicycle-unsafe roads.
            if(/motorway|expressway|highway|freeway|interstate|ramp| link$/i.test(road.name))continue;
            if(road.width<4.2||Math.hypot(...road.a)>800||Math.hypot(...road.b)>800)continue;
            const length=Math.hypot(road.b[0]-road.a[0],road.b[1]-road.a[1]);if(length<.1)continue;
            const keys=[key(road.a),key(road.b)],id=[...keys].sort().join('|');if(seen.has(id))continue;seen.add(id);
            for(let i=0;i<2;i++)if(!this.nodes.has(keys[i]))this.nodes.set(keys[i],{key:keys[i],point:[road.a,road.b][i],edges:[]});
            const edge={...road,length,a:this.nodes.get(keys[0]),b:this.nodes.get(keys[1]),id};
            edge.a.edges.push(edge);edge.b.edges.push(edge);this.edges.push(edge);
        }
        // Remove blocked road paths before selecting a network that always has a legal return route.
        this.edges=this.edges.filter(e=>this.isClear(this.directed(e,e.a),map));
        const allowed=new Set(this.edges);for(const n of this.nodes.values())n.edges=n.edges.filter(e=>allowed.has(e));
        const order=[],visited=new Set();
        for(const start of this.nodes.values()){
            if(visited.has(start))continue;const stack=[[start,false]];
            while(stack.length){const [node,done]=stack.pop();if(done){order.push(node);continue;}if(visited.has(node))continue;visited.add(node);stack.push([node,true]);for(const e of this.outgoing(node)){const next=e.a===node?e.b:e.a;if(!visited.has(next))stack.push([next,false]);}}
        }
        visited.clear();let largest=new Set();
        for(const start of order.reverse()){
            if(visited.has(start))continue;const component=new Set(),queue=[start];visited.add(start);
            while(queue.length){const node=queue.pop();component.add(node);for(const e of node.edges){const other=e.a===node?e.b:e.a;if(this.canTravel(e,other)&&!visited.has(other)){visited.add(other);queue.push(other);}}}
            if(component.size>largest.size)largest=component;
        }
        this.edges=this.edges.filter(e=>largest.has(e.a)&&largest.has(e.b));
        this.nodes=new Map([...this.nodes].filter(([,n])=>largest.has(n)));
        const kept=new Set(this.edges);for(const n of this.nodes.values())n.edges=n.edges.filter(e=>kept.has(e));
        this.junctions=new TrafficJunctions(this);
    }

    canTravel(edge,from){return !edge.oneway||(edge.oneway===1?from===edge.a:from===edge.b);}
    outgoing(node){return node.edges.filter(e=>this.canTravel(e,node));}

    isClear(route,map)
    {
        this.clearRoutes??=new Map();const key=route.edge.id;
        if(this.clearRoutes.has(key))return this.clearRoutes.get(key);
        const steps=Math.ceil(route.edge.length/.8);
        for(const direction of route.edge.oneway?[route]:[route,this.directed(route.edge,route.to)])for(let i=0;i<=steps;i++){const p=this.point(direction,route.edge.length*i/steps);if(map.isBlocked(p.x,p.z,.315,true)){this.clearRoutes.set(key,false);return false;}}
        this.clearRoutes.set(key,true);return true;
    }

    directed(edge,from)
    {
        const to=edge.a===from?edge.b:edge.a;
        return {edge,from,to,dx:(to.point[0]-from.point[0])/edge.length,dz:(to.point[1]-from.point[1])/edge.length};
    }

    point(route,distance)
    {
        const t=Math.max(0,Math.min(1,distance/route.edge.length));
        const lane=route.edge.oneway?0:Math.min(route.edge.width*.12,.65);
        const normal=(node,start)=>{
            if(node.edges.length>=3)return [0,0];
            if(node.edges.length!==2)return [route.dz*lane,-route.dx*lane];
            const other=node.edges.find(e=>e!==route.edge),next=other.a===node?other.b:other.a;
            let dx=(next.point[0]-node.point[0])/other.length,dz=(next.point[1]-node.point[1])/other.length;
            if(start){dx=-dx;dz=-dz;}
            const nx=route.dz+dz,nz=-route.dx-dx,length=Math.hypot(nx,nz);
            if(length<.1)return [route.dz*lane,-route.dx*lane];
            const scale=lane/Math.max(.7,(nx*route.dz-nz*route.dx)/length);
            return [nx/length*scale,nz/length*scale];
        };
        const start=normal(route.from,true),end=normal(route.to,false),blend=Math.min(5,route.edge.length/2);
        let nx=route.dz*lane,nz=-route.dx*lane;
        if(distance<blend){const f=distance/blend;nx=start[0]*(1-f)+nx*f;nz=start[1]*(1-f)+nz*f;}
        else if(route.edge.length-distance<blend){const f=(route.edge.length-distance)/blend;nx=end[0]*(1-f)+nx*f;nz=end[1]*(1-f)+nz*f;}
        return {x:route.from.point[0]+route.dx*distance+nx,z:route.from.point[1]+route.dz*distance+nz,t};
    }
}
