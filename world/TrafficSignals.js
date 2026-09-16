export class TrafficSignals
{
    constructor(map,network)
    {
        this.map=map;this.time=0;this.nodes=new Map();this.lamps=[];this.crosswalks=0;
        const material=(name,color,emissive=false)=>{const m=new BABYLON.StandardMaterial(name,map.scene);m.diffuseColor=BABYLON.Color3.FromHexString(color);if(emissive)m.emissiveColor=m.diffuseColor;return m;};
        const pole=material('Signal pole','#606a65'),housing=material('Signal housing','#242b2c'),paint=material('Crosswalk paint','#efe9d5');
        paint.zOffset=-5;
        const lights=[material('Red signal','#ef3d34',true),material('Amber signal','#eebc3e',true),material('Green signal','#38df83',true)],off=material('Unlit signal','#293b36');
        const staticMeshes=[];
        const candidates=[...network.nodes.values()].filter(n=>n.edges.length>=3&&new Set(n.edges.map(e=>e.name)).size>=2&&n.edges.every(e=>!e.bridge&&!/motorway|expressway|highway|freeway|ramp| link$/i.test(e.name)));
        candidates.sort((a,b)=>Math.hypot(...a.point)-Math.hypot(...b.point));
        for(const node of candidates)
        {
            if([...this.nodes.keys()].some(n=>Math.hypot(n.point[0]-node.point[0],n.point[1]-node.point[1])<24))continue;
            const key=node.trafficZone?.id||node.key;
            const hash=[...key].reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,0),offset=hash%4*9;
            this.nodes.set(node,{offset});
            const directions=[];
            for(const edge of node.edges)
            {
                if(!network.canTravel(edge,edge.a===node?edge.b:edge.a))continue;
                const route=network.directed(edge,node),axis=Math.abs(route.dx)>Math.abs(route.dz)?0:1;
                if(directions.some(d=>d.dx*route.dx+d.dz*route.dz>.9))continue;
                directions.push(route);
                const setback=Math.min(6,edge.length*.3),x=node.point[0]+route.dx*setback,z=node.point[1]+route.dz*setback;
                const px=x+route.dz*(edge.width/2+.3),pz=z-route.dx*(edge.width/2+.3),ground=map.terrain.getHeightAt(px,pz);
                const post=BABYLON.MeshBuilder.CreateCylinder('Traffic light pole',{height:3.6,diameter:.12,tessellation:6},map.scene);post.position.set(px,ground+1.8,pz);post.material=pole;staticMeshes.push(post);
                const box=BABYLON.MeshBuilder.CreateBox('Traffic light',{width:.38,height:1.05,depth:.28},map.scene);box.position.set(px,ground+3.25,pz);box.rotation.y=Math.atan2(route.dx,route.dz);box.material=housing;staticMeshes.push(box);
                for(let i=0;i<3;i++)
                {
                    const lamp=BABYLON.MeshBuilder.CreateSphere('Signal lamp',{diameter:.22,segments:6},map.scene);lamp.position.set(px+route.dx*.17,ground+3.58-i*.32,pz+route.dz*.17);lamp.material=lights[i];this.lamps.push({mesh:lamp,node,axis,index:i,lights,off,offset});
                }
                for(let t=-edge.width/2+.45;t<edge.width/2-.3;t+=.75)
                {
                    const sx=x+route.dz*t,sz=z-route.dx*t;
                    const stripe=BABYLON.MeshBuilder.CreateGround('Zebra crosswalk',{width:.4,height:2},map.scene);
                    stripe.position.set(sx,(map.surface.height(sx,sz)??map.terrain.getGroundHeightAt(sx,sz))+.065,sz);stripe.rotation.y=Math.atan2(route.dx,route.dz);stripe.material=paint;stripe.isPickable=false;staticMeshes.push(stripe);
                }
                this.crosswalks++;
            }
        }
        const groups=new Map();
        for(const mesh of staticMeshes){if(!groups.has(mesh.material))groups.set(mesh.material,[]);groups.get(mesh.material).push(mesh);}
        for(const [material,meshes] of groups){const merged=BABYLON.Mesh.MergeMeshes(meshes,true,true);merged.material=material;merged.freezeWorldMatrix();}
        const lamps=[];
        for(const offset of [0,9,18,27])for(const axis of [0,1])for(const index of [0,1,2])
        {
            const group=this.lamps.filter(l=>l.offset===offset&&l.axis===axis&&l.index===index);
            if(!group.length)continue;
            const mesh=BABYLON.Mesh.MergeMeshes(group.map(l=>l.mesh),true,true);
            lamps.push({...group[0],mesh});mesh.freezeWorldMatrix();
        }
        this.lamps=lamps;
        this.update(0);
    }

    phase(axis,offset=0)
    {
        const t=(this.time+offset)%36,local=axis===0?t:(t+18)%36;
        return local<14?'green':local<17?'amber':'red';
    }

    canEnter(node,route)
    {
        const signal=this.nodes.get(node)||[...(node.trafficZone?.nodes||[])].map(n=>this.nodes.get(n)).find(Boolean);
        if(!signal)return true;
        return this.phase(Math.abs(route.dx)>Math.abs(route.dz)?0:1,signal.offset)==='green';
    }

    update(dt)
    {
        this.time+=dt;
        for(const lamp of this.lamps)
        {
            const phase=this.phase(lamp.axis,lamp.offset),on=(phase==='red'?0:phase==='amber'?1:2)===lamp.index;
            lamp.mesh.material=on?lamp.lights[lamp.index]:lamp.off;
        }
    }
}
