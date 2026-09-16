/* Optional shortest street route, shared by the pavement highlight and minimap. */
class MinQueue
{
    constructor(){this.items=[];}
    push(item){const a=this.items;let i=a.length;a.push(item);while(i>0){const p=(i-1)>>1;if(a[p].cost<=item.cost)break;a[i]=a[p];i=p;}a[i]=item;}
    pop(){const a=this.items,first=a[0],last=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let c=i*2+1;if(c+1<a.length&&a[c+1].cost<a[c].cost)c++;if(a[c].cost>=last.cost)break;a[i]=a[c];i=c;}a[i]=last;}return first;}
}
export class RideRoute
{
    constructor(session)
    {
        this.session=session;this.points=[];this.nodes=new Map();this.edges=[];this.elapsed=10;
        const map=session.terrain.downtown;if(!map)return;
        const key=p=>p.map(v=>v.toFixed(2)).join(':');
        for(const road of map.roads)
        {
            if(road.width<2)continue;
            const length=Math.hypot(road.a[0]-road.b[0],road.a[1]-road.b[1]);if(length<.05)continue;
            const nodes=[road.a,road.b].map(p=>{const k=key(p);if(!this.nodes.has(k))this.nodes.set(k,{point:p,edges:[]});return this.nodes.get(k);});
            const edge={a:nodes[0],b:nodes[1],length};edge.a.edges.push(edge);edge.b.edges.push(edge);this.edges.push(edge);
        }
        this.material=new BABYLON.StandardMaterial('Optional ride street route',map.scene);this.material.disableLighting=true;this.material.backFaceCulling=false;this.material.alpha=.82;this.material.zOffset=-2;
    }
    nearest(p)
    {
        let best=null;
        for(const edge of this.edges)
        {
            const a=edge.a.point,b=edge.b.point,dx=b[0]-a[0],dz=b[1]-a[1];
            const t=Math.max(0,Math.min(1,((p.x-a[0])*dx+(p.z-a[1])*dz)/(edge.length**2)));
            const point=[a[0]+dx*t,a[1]+dz*t],distance=Math.hypot(point[0]-p.x,point[1]-p.z);
            if(!best||distance<best.distance)best={edge,t,point,distance};
        }
        return best;
    }
    find(start,target)
    {
        const from=this.nearest(start),to=this.nearest(target);if(!from||!to)return [];
        if(from.edge===to.edge)return [from.point,to.point];
        const queue=new MinQueue(),cost=new Map(),parent=new Map();
        for(const [node,d] of [[from.edge.a,from.t*from.edge.length],[from.edge.b,(1-from.t)*from.edge.length]]){cost.set(node,d);queue.push({node,cost:d});}
        let goal=null,best=Infinity;
        while(queue.items.length)
        {
            const item=queue.pop(),node=item.node;if(item.cost!==cost.get(node))continue;if(item.cost>=best)break;
            const tail=node===to.edge.a?to.t*to.edge.length:node===to.edge.b?(1-to.t)*to.edge.length:Infinity;
            if(item.cost+tail<best){best=item.cost+tail;goal=node;}
            for(const edge of node.edges)
            {
                const next=edge.a===node?edge.b:edge.a,d=item.cost+edge.length;
                if(d<(cost.get(next)??Infinity)){cost.set(next,d);parent.set(next,node);queue.push({node:next,cost:d});}
            }
        }
        if(!goal)return []; // Never draw a misleading straight line through buildings.
        const points=[to.point];for(let n=goal;n;n=parent.get(n))points.push(n.point);points.push(from.point);return points.reverse();
    }
    update(delta)
    {
        const r=this.session.rideSystem,drop=['PASSENGER_ONBOARD','DRIVING_TO_DESTINATION'].includes(r.state);
        const target=drop?r.destination:r.pickup,active=!['IDLE','COMPLETED'].includes(r.state)&&!this.session.emergency.active&&!this.session.life.dead;
        if(!active||!target){this.clear();return;}
        const key=`${drop}:${target.x}:${target.z}`,p=this.session.player.position;this.elapsed+=Math.min(delta,.1);
        if(key===this.key&&(this.elapsed<2.5||Math.hypot(p.x-this.start.x,p.z-this.start.z)<6))return;
        this.key=key;this.start={x:p.x,z:p.z};this.elapsed=0;this.color=drop?'#39cfff':'#ffd43b';this.points=this.find(p,target);this.draw();
    }
    clear(){this.key=null;this.points=[];this.mesh?.dispose();this.mesh=null;}
    draw()
    {
        this.mesh?.dispose();this.mesh=null;if(this.points.length<2)return;
        const positions=[],indices=[],terrain=this.session.terrain;
        for(let i=1;i<this.points.length;i++)
        {
            const a=this.points[i-1],b=this.points[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]);if(length<.01)continue;
            const nx=-(b[1]-a[1])/length*.22,nz=(b[0]-a[0])/length*.22,steps=Math.ceil(length/2);
            for(let step=0;step<steps;step++)
            {
                const k=positions.length/3;
                for(const [t,side] of [[step/steps,-1],[step/steps,1],[(step+1)/steps,1],[(step+1)/steps,-1]])
                {const x=a[0]+(b[0]-a[0])*t+nx*side,z=a[1]+(b[1]-a[1])*t+nz*side;positions.push(x,terrain.getHeightAt(x,z)+.075,z);}
                indices.push(k,k+1,k+2,k,k+2,k+3);
            }
        }
        const scene=this.session.cart.scene,mesh=new BABYLON.Mesh('Suggested street route',scene),data=new BABYLON.VertexData();data.positions=positions;data.indices=indices;data.normals=[];BABYLON.VertexData.ComputeNormals(positions,indices,data.normals);data.applyToMesh(mesh);
        this.material.emissiveColor=BABYLON.Color3.FromHexString(this.color);mesh.material=this.material;mesh.isPickable=false;this.mesh=mesh;mesh.freezeWorldMatrix();
    }
}
