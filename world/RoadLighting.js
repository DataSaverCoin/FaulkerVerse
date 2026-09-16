import { ACTOR_SCALE } from '../engine/ActorScale.js';
/* Baked pavement illumination + shared lamp geometry cover the entire road map.
   Vehicle beams use a small moving spotlight pool instead of 1,000 live lights. */
import { roadElevation } from './RiverBridges.js';
export class RoadLighting
{
    constructor(map,cart,weather)
    {
        this.name='Road and vehicle lighting';this.map=map;this.cart=cart;this.weather=weather;this.scene=map.scene;this.lamps=[];this.coveredRoads=0;
        const mobile=matchMedia("(pointer: coarse)").matches||new URLSearchParams(location.search).has("mobile");
        const scene=this.scene,size=Math.min(mobile?2048:4096,scene.getEngine().getCaps().maxTextureSize),extent=6000;
        this.texture=new BABYLON.DynamicTexture('Streetlight pavement illumination',{width:size,height:size},scene,false);
        const ctx=this.texture.getContext();ctx.fillStyle='black';ctx.fillRect(0,0,size,size);
        const groups=new Map();this.nightFixtures=[];let nightOnly=false;
        const metal=new BABYLON.StandardMaterial('Streetlight posts',scene);metal.diffuseColor=new BABYLON.Color3(.16,.19,.21);
        this.bulbs=new BABYLON.StandardMaterial('Streetlight glowing heads',scene);this.bulbs.diffuseColor=new BABYLON.Color3(.8,.77,.6);
        const add=(kind,x,y,z,sx,sy,sz,angle=0)=>{
            const key=`${nightOnly}:${kind}:${Math.floor(x/200)}:${Math.floor(z/200)}`;
            if(!groups.has(key))groups.set(key,{kind,nightOnly,matrices:[]});
            const matrix=BABYLON.Matrix.Compose(new BABYLON.Vector3(sx,sy,sz),BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y,angle),new BABYLON.Vector3(x,y,z));groups.get(key).matrices.push(...matrix.m);
        };
        for(const road of map.data.roads)
        {
            const segments=[];let length=0;
            for(let i=1;i<road.points.length;i++){const a=road.points[i-1],b=road.points[i],d=Math.hypot(b[0]-a[0],b[1]-a[1]);if(d>.001){segments.push({a,b,d,start:length});length+=d;}}
            if(!length)continue;this.coveredRoads++;
            const count=Math.max(1,Math.ceil(length/18));let index=0;
            for(let i=0;i<count;i++)
            {
                nightOnly=this.lamps.length%10>=3;
                const distance=(i+.5)*length/count;
                while(index<segments.length-1&&distance>segments[index].start+segments[index].d)index++;
                const segment=segments[index],dx=(segment.b[0]-segment.a[0])/segment.d,dz=(segment.b[1]-segment.a[1])/segment.d,t=distance-segment.start;
                const x=segment.a[0]+dx*t,z=segment.a[1]+dz*t,y=roadElevation(map,road,x,z)+.16;
                const width=road.width*1.35,offset=width/2+.35;
                let side=1;
                if(map.isBlocked(x+dz*offset,z-dx*offset,.12,true))side=-1;
                const px=x+dz*offset*side,pz=z-dx*offset*side;
                // At intersecting streets use a suspended fixture; never put a post in a lane/building.
                const post=!map.isBlocked(px,pz,.12,true)&&map.surface.height(px,pz)===null;
                if(post){add('post',px,y+2.5,pz,.1,5,.1);add('post',(x+px)/2,y+5,(z+pz)/2,offset,.09,.09,Math.atan2(dx,dz));}
                if(!post)add('post',x,y+5.1,z,width+.7,.025,.025,Math.atan2(dx,dz));
                add('head',x,y+4.95,z,.6,.13,.4,Math.atan2(dx,dz));
                this.lamps.push({x,z,y,post,road:road.name});
                const cx=(x/extent+.5)*size,cz=(z/extent+.5)*size,r=Math.max(13,width)*size/extent;
                const gradient=ctx.createRadialGradient(cx,cz,0,cx,cz,r);gradient.addColorStop(0,'rgba(255,245,215,.85)');gradient.addColorStop(.45,'rgba(255,235,195,.5)');gradient.addColorStop(1,'rgba(255,235,195,0)');
                ctx.fillStyle=gradient;ctx.fillRect(cx-r,cz-r,r*2,r*2);
            }
        }
        this.texture.update();this.texture.wrapU=this.texture.wrapV=BABYLON.Texture.CLAMP_ADDRESSMODE;
        for(const mesh of scene.meshes.filter(m=>/^Regional (road|sidewalk):/.test(m.name)))
        {
            const positions=mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind),uv=[];
            for(let i=0;i<positions.length;i+=3)uv.push(positions[i]/extent+.5,.5-positions[i+2]/extent);
            mesh.setVerticesData(BABYLON.VertexBuffer.UVKind,uv);
        }
        for(const material of [map.materials.road,map.materials.sidewalk])material.emissiveTexture=this.texture;
        for(const [name,group] of groups){const mesh=BABYLON.MeshBuilder.CreateBox(`Streetlight ${name}`,{size:1},scene);mesh.material=group.kind==='head'?this.bulbs:metal;mesh.isPickable=false;mesh.thinInstanceSetBuffer('matrix',new Float32Array(group.matrices),16,true);if(group.nightOnly)this.nightFixtures.push(mesh);}
        const surfaces=scene.meshes.filter(m=>/^Regional (road|sidewalk):/.test(m.name));
        for(const material of [map.materials.road,map.materials.sidewalk])material.maxSimultaneousLights=6;
        this.beams=[];
        for(let i=0;i<4;i++){const light=new BABYLON.SpotLight(`Vehicle headlight beam ${i}`,BABYLON.Vector3.Zero(),new BABYLON.Vector3(0,-.2,1),Math.PI/3,2,scene);light.diffuse=new BABYLON.Color3(1,.94,.77);light.range=25;light.intensity=0;light.includedOnlyMeshes=surfaces;this.beams.push(light);}
        this.update();
    }
    update()
    {
        const daylight=Math.max(0,Math.sin((this.weather.hour-6)/24*Math.PI*2));
        const fade=Math.max(0,Math.min(1,(daylight-.03)/.19));this.strength=1-fade*fade*(3-2*fade);
        for(const mesh of this.nightFixtures)mesh.setEnabled(this.strength>.01);
        this.bulbs.emissiveColor.set(this.strength,this.strength*.86,this.strength*.58);
        this.texture.level=this.strength*.3;
        for(const material of [this.map.materials.road,this.map.materials.sidewalk])material.emissiveColor.set(0,0,0);
        const view=this.scene.activeCamera.globalPosition,candidates=this.map.traffic.vehicles.filter(v=>v.mesh.isEnabled()).sort((a,b)=>BABYLON.Vector3.DistanceSquared(a.mesh.position,view)-BABYLON.Vector3.DistanceSquared(b.mesh.position,view)).slice(0,3);
        const vehicles=[{mesh:this.cart.mesh,length:this.cart.length},...candidates];
        this.beams.forEach((light,i)=>{const vehicle=vehicles[i];light.intensity=vehicle?this.strength*2.8:0;if(!vehicle)return;const p=vehicle.mesh.position,angle=vehicle.mesh.rotation.y,dx=Math.sin(angle),dz=Math.cos(angle);light.position.set(p.x+dx*(vehicle.length/2+.15),p.y+.8*ACTOR_SCALE,p.z+dz*(vehicle.length/2+.15));light.direction.set(dx,-.12,dz).normalize();});
    }
}
