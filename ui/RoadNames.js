import { RenderProfile } from "../engine/RenderProfile.js";
/* A bounded pool of pavement labels keeps the regional map inexpensive to draw. */
export class RoadNames
{
    constructor(map)
    {
        this.map=map;
        this.labels=[];
        this.candidates=[];
        for(const road of map.data.roads)
        {
            const segments=road.points.slice(1).map((b,i)=>({a:road.points[i],b,
                length:Math.hypot(b[0]-road.points[i][0],b[1]-road.points[i][1])}));
            const longest=segments.reduce((a,b)=>!a||b.length>a.length?b:a,null);
            for(const segment of segments)
            {
                if(segment!==longest && segment.length<70)continue;
                if(segment.length<.1)continue;
                const {a,b,length}=segment,count=Math.max(1,Math.floor(length/100));
                for(let i=0;i<count;i++)
                {
                    const t=(i+.5)/count;
                    this.candidates.push({x:a[0]+(b[0]-a[0])*t,z:a[1]+(b[1]-a[1])*t,
                        dx:(b[0]-a[0])/length,dz:(b[1]-a[1])/length,
                        length:Math.min(32,length*.85/count),width:road.width*1.35,
                        name:road.name||'Unnamed road'});
                }
            }
        }
        this.last=null;
        map.scene.onBeforeRenderObservable.add(()=>this.update());
    }

    update()
    {
        const camera=this.map.scene.activeCamera;
        if(!camera)return;
        const p=camera.target||camera.position;
        if(this.last && Math.hypot(p.x-this.last.x,p.z-this.last.z)<15)return;
        this.last={x:p.x,z:p.z};
        const nearby=this.candidates.filter(c=>Math.hypot(c.x-p.x,c.z-p.z)<220)
            .sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z)).slice(0,RenderProfile.lite?16:64);
        nearby.forEach((c,i)=>
        {
            if(!this.labels[i])
            {
                const texture=new BABYLON.DynamicTexture(`Street name ${i}`,{width:1024,height:128},this.map.scene,false);
                texture.hasAlpha=true;
                const material=new BABYLON.StandardMaterial(`Street ink ${i}`,this.map.scene);
                material.diffuseTexture=texture;material.useAlphaFromDiffuseTexture=true;
                material.emissiveColor=new BABYLON.Color3(1,1,1);material.disableLighting=true;material.backFaceCulling=false;
                const mesh=new BABYLON.Mesh(`Pavement street name ${i}`,this.map.scene);
                mesh.material=material;mesh.isPickable=false;
                this.labels[i]={mesh,texture};
            }
            const {mesh,texture}=this.labels[i],ctx=texture.getContext();
            ctx.clearRect(0,0,1024,128);ctx.font='bold 76px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
            ctx.fillStyle='#fff5d6';ctx.fillText(c.name,512,64,980);texture.update();
            const height=Math.min(c.width*.45,c.length/Math.max(4,c.name.length*.6));
            const data=new BABYLON.VertexData();data.positions=[];data.indices=[];data.uvs=[];
            for(let j=0;j<=16;j++)for(const side of [-1,1])
            {
                const along=(j/16-.5)*c.length;
                const x=c.x+c.dx*along-c.dz*side*height/2,z=c.z+c.dz*along+c.dx*side*height/2;
                const y=this.map.surface.height(x,z)??this.map.terrain.getGroundHeightAt(x,z);
                data.positions.push(x,y+.045,z);data.uvs.push(j/16,(side+1)/2);
            }
            for(let j=0;j<16;j++){const n=j*2;data.indices.push(n,n+1,n+2,n+1,n+3,n+2);}
            data.applyToMesh(mesh);mesh.setEnabled(true);
        });
        for(let i=nearby.length;i<this.labels.length;i++)this.labels[i].mesh.setEnabled(false);
    }
}
