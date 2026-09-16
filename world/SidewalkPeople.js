import { addStreetResidents } from './StreetResidents.js';
import { ACTOR_SCALE } from '../engine/ActorScale.js';
import { strollerTemplate } from '../entities/Stroller.js';
import { PersonAvatar } from '../entities/PersonAvatar.js';

/* Shared posed meshes keep 100 diverse sidewalk residents inexpensive to draw. */
export class SidewalkPeople
{
    constructor(map,player,count=100)
    {
        this.name='Downtown pedestrians';this.map=map;this.player=player;this.people=[];this.paths=[];this.time=0;this.seed=718;
        for(const road of map.roads)
        {
            const length=Math.hypot(road.b[0]-road.a[0],road.b[1]-road.a[1]);
            if(road.bridge||length<12||Math.hypot(...road.a)>700||Math.hypot(...road.b)>700||/motorway|expressway|highway|freeway| link$/i.test(road.name))continue;
            const dx=(road.b[0]-road.a[0])/length,dz=(road.b[1]-road.a[1])/length;
            for(const side of [-1,1])
            {
                const offset=side*(road.width/2+.35),a={x:road.a[0]+dx*3+dz*offset,z:road.a[1]+dz*3-dx*offset},b={x:road.b[0]-dx*3+dz*offset,z:road.b[1]-dz*3-dx*offset};
                let safe=true;
                for(let d=0;d<length-6+.25;d+=.25)
                {
                    const sample=Math.min(d,length-6),x=a.x+dx*sample,z=a.z+dz*sample;
                    if(map.isBlocked(x,z,.3*ACTOR_SCALE,true)||map.surface.height(x,z)!==null){safe=false;break;}
                }
                if(safe)this.paths.push({a,b,dx,dz,length:length-6,street:road.name});
            }
        }
        if(!this.paths.length)throw new Error('No safe sidewalks found');
        this.templates=[];
        for(const [i,shirt] of ['#963e49','#287a96','#d0a43a','#4b765c','#8173a4','#e1ddd0'].entries())
        {
            const poses=[];
            for(const phase of [Math.PI/2,Math.PI*1.5])
            {
                const avatar=new PersonAvatar(map.scene,{name:'Shared pedestrian',personal:false,gender:i%2?'woman':'man',shirt,skin:['#c58f70','#865b42','#d9b195'][i%3]});avatar.phase=phase;avatar.update(0,true);
                const mesh=BABYLON.Mesh.MergeMeshes(avatar.root.getChildMeshes(),true,true,undefined,false,true);mesh.name=`Pedestrian pose ${i}`;mesh.isVisible=false;avatar.root.dispose();poses.push(mesh);
            }
            this.templates.push(poses);
        }
        for(let i=0;i<count;i++)
        {
            const style=(i+Math.floor(i/10))%this.templates.length,gender=style%2?'woman':'man';
            const path=this.paths[Math.floor(this.random()*this.paths.length)],poses=this.templates[style].map(t=>t.createInstance(`Walker ${i+1}`));
            const role=i%10,age=role===1?'child':role===2?'toddler':role===3?'baby':'adult';
            if(age!=='adult'){
                this.youngTemplates??=new Map();const key=`${age}-${gender}`;
                if(!this.youngTemplates.has(key)){
                    const models=[Math.PI/2,Math.PI*1.5].map(phase=>{
                        const avatar=new PersonAvatar(map.scene,{name:key,personal:false,age,gender,shirt:age==='child'?'#ed9851':'#80bde0'});
                        avatar.phase=phase;avatar.update(0,age!=='baby');
                        const mesh=BABYLON.Mesh.MergeMeshes(avatar.root.getChildMeshes(),true,true,undefined,false,true);mesh.isVisible=false;avatar.root.dispose();return mesh;
                    });this.youngTemplates.set(key,models);
                }
                poses.forEach(m=>m.dispose());poses.splice(0,poses.length,...this.youngTemplates.get(key).map((model,n)=>model.createInstance(`${key} ${i} pose ${n}`)));
            }
            const person={id:i,name:['Jordan','Maya','Alex','Sam','Morgan','Taylor','Avery','Casey','Jamie','Riley'][i%10]+' '+(Math.floor(i/10)+1),gender,age,size:age==='child'?.65:age==='toddler'?.43:age==='baby'?.25:1,poses,path,distance:this.random()*path.length,direction:this.random()<.5?1:-1,speed:.6+this.random()*.6,phase:this.random()*6.28,wait:0,elapsed:0,position:new BABYLON.Vector3(),turns:0};
            const x=path.a.x+path.dx*person.distance,z=path.a.z+path.dz*person.distance;
            if(map.isBlocked(x,z,.23,true)||map.surface.height(x,z)!==null)person.distance=0;
            if(age!=='adult'){person.guardian=this.people[i-role];person.path=person.guardian.path;person.distance=person.guardian.distance;person.speed=person.guardian.speed;person.direction=person.guardian.direction;}
            if(age==='baby'){this.strollerModel??=strollerTemplate(map.scene);person.stroller=this.strollerModel.createInstance(`Stroller ${i}`);person.stroller.isVisible=true;}
            this.people.push(person);this.place(person);
        }
        addStreetResidents(this);
    }
    random(){this.seed=(this.seed*1664525+1013904223)>>>0;return this.seed/4294967296;}
    place(p)
    {
        if(p.guardian){p.path=p.guardian.path;p.direction=p.guardian.direction;p.distance=Math.max(0,Math.min(p.path.length,p.guardian.distance+(p.age==='baby'?.55:p.age==='toddler'?-.35:-.7)*p.direction));}
        const x=p.path.a.x+p.path.dx*p.distance,z=p.path.a.z+p.path.dz*p.distance;
        p.position.set(x,this.map.terrain.getGroundHeightAt(x,z)+.12,z);
        const visible=!p.riding&&Math.hypot(x-this.player.position.x,z-this.player.position.z)<140;
        const pose=Math.sin(p.phase)>0?0:1;
        p.poses.forEach((mesh,i)=>{mesh.setEnabled(visible&&i===pose);mesh.position.copyFrom(p.position);mesh.rotation.y=Math.atan2(p.path.dx*p.direction,p.path.dz*p.direction);mesh.scaling.setAll(.9*ACTOR_SCALE*p.size);if(p.age==='baby'){mesh.position.y+=.24;mesh.rotation.x=-Math.PI/2;}});
        if(p.belongings){p.belongings.setEnabled(visible);p.belongings.position.copyFrom(p.position);p.belongings.position.y+=.32;p.belongings.position.x-=p.path.dx*p.direction*.17;p.belongings.position.z-=p.path.dz*p.direction*.17;p.belongings.rotation.y=Math.atan2(p.path.dx*p.direction,p.path.dz*p.direction);}
        if(p.stroller){p.stroller.setEnabled(visible);p.stroller.position.copyFrom(p.position);p.stroller.rotation.y=Math.atan2(p.path.dx*p.direction,p.path.dz*p.direction);p.stroller.scaling.setAll(ACTOR_SCALE);}
    }
    update(delta)
    {
        const dt=Math.min(Math.max(delta,0),.05);this.time+=dt;
        for(const p of this.people)
        {
            p.offerCooldown=Math.max(0,(p.offerCooldown||0)-dt);
            if(p.riding){p.poses.forEach(m=>m.setEnabled(false));p.stroller?.setEnabled(false);p.belongings?.setEnabled(false);continue;}
            if(p.guardian){p.down=0;p.poses.forEach(m=>m.rotation.z=0);p.phase=p.guardian.phase;this.place(p);continue;}
            if(p.talking){this.place(p);continue;}
            if(p.down>0)
            {
                p.down=Math.max(0,p.down-dt);
                p.poses.forEach((m,i)=>{m.setEnabled(i===0&&BABYLON.Vector3.DistanceSquared(p.position,this.player.position)<19600);m.rotation.z=Math.PI/2;});
                if(p.down===0){p.poses.forEach(m=>m.rotation.z=0);this.place(p);}
                continue;
            }
            p.elapsed+=dt;const near=BABYLON.Vector3.DistanceSquared(p.position,this.player.position)<19600;
            if(!near&&p.elapsed<.3)continue;const step=p.elapsed;p.elapsed=0;
            if(p.wait>0)p.wait-=step;
            else
            {
                const next=Math.max(0,Math.min(p.path.length,p.distance+p.direction*p.speed*step));
                const x=p.path.a.x+p.path.dx*next,z=p.path.a.z+p.path.dz*next;
                if(this.map.isBlocked(x,z,.23,true)||this.map.surface.height(x,z)!==null){p.direction*=-1;p.wait=.5;continue;}
                p.distance+=p.direction*p.speed*step;p.phase+=step*6;
                if(p.distance<0||p.distance>p.path.length){p.distance=Math.max(0,Math.min(p.path.length,p.distance));p.direction*=-1;p.wait=this.random()*2;p.turns++;}
            }
            this.place(p);
        }
    }
}
