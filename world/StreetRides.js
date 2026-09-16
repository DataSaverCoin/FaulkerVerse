import { PersonAvatar } from '../entities/PersonAvatar.js';
import { ACTOR_SCALE } from '../engine/ActorScale.js';

/* A sidewalk group uses the same fare, destination and payment state machine. */
export class StreetRides
{
    constructor(session){this.session=session;this.group=[];this.avatars=[];session.rideSystem.streetRides=this;}
    offer(person)
    {
        const s=this.session,r=s.rideSystem,p=person.guardian||person;
        if(s.life.dead||Math.hypot(s.player.position.x-person.position.x,s.player.position.z-person.position.z)>5)return 'Come closer to talk.';
        if(!['IDLE','COMPLETED'].includes(r.state))return 'Finish your current fare first.';
        if(!s.player.isDriving||Math.abs(s.cart.speed)>1.5)return 'Pull up in your vehicle and stop to offer a ride.';
        if(s.emergency.stage!=='normal'||s.cart.wrecked)return 'This vehicle needs replacing before taking passengers.';
        if(p.offerCooldown>0)return 'No thanks. Maybe another time.';
        const group=s.terrain.downtown.pedestrians.people.filter(other=>other===p||other.guardian===p);
        if(group.length>s.cart.seatCapacity-1)return `We need ${group.length} passenger seats. Bring the six-seat golf cart.`;
        p.offerCooldown=60;
        if(Math.random()<.35)return 'Thanks for asking, but we are enjoying the walk.';
        const stops=r.dispatch.stops.filter(stop=>Math.hypot(stop.x-s.cart.position.x,stop.z-s.cart.position.z)>40);
        if(!stops.length)return 'We are staying nearby today.';
        const stop=stops[Math.floor(Math.random()*stops.length)];
        this.group=group;
        group.forEach(other=>{other.riding=true;other.talking=false;other.poses.forEach(m=>m.setEnabled(false));other.stroller?.setEnabled(false);});
        r.rideId++;r.pickup=s.cart.position.clone();r.pickupName=p.path.street;r.destination=r.toTerrainPosition(stop);r.destinationName=stop.name;
        r.fare=12+Math.round(Math.hypot(stop.x-r.pickup.x,stop.z-r.pickup.z)/30);
        r.createPassenger(r.pickup,{gender:p.gender});
        for(const member of group.slice(1)){const avatar=new PersonAvatar(s.player.scene,{name:member.name,personal:false,age:member.age,gender:member.gender,shirt:'#80bde0'});avatar.root.scaling.setAll(ACTOR_SCALE*member.size);this.avatars.push(avatar);}
        r.boardPassenger();
        return `Yes! ${group.length>1?'All '+group.length+' of us, please. ':''}Take us to ${stop.name} · $${r.fare}.`;
    }
    update()
    {
        const s=this.session,c=s.cart,a=c.rotation.y;
        this.avatars.forEach((avatar,i)=>{const member=this.group[i+1],x=i%2?-.43:.43,z=i<2?-.3:-1.65;avatar.root.position.copyFrom(c.position).addInPlace(new BABYLON.Vector3(x*Math.cos(a)+z*Math.sin(a),member.age==='baby'?.85:.4,-x*Math.sin(a)+z*Math.cos(a)).scale(ACTOR_SCALE));avatar.root.rotation.y=a;avatar.update(0,false,false,true);});
    }
    release(completed)
    {
        if(!this.group.length)return;
        const s=this.session,pop=s.terrain.downtown.pedestrians,p=this.group[0],target=completed?s.rideSystem.destination:s.cart.position;
        // Return the group to a verified sidewalk near their drop-off or evacuation point.
        const candidates=pop.paths.map(path=>{const d=Math.max(0,Math.min(path.length,(target.x-path.a.x)*path.dx+(target.z-path.a.z)*path.dz));return {path,d,x:path.a.x+d*path.dx,z:path.a.z+d*path.dz};}).sort((a,b)=>Math.hypot(a.x-target.x,a.z-target.z)-Math.hypot(b.x-target.x,b.z-target.z));
        const spot=candidates.find(c=>Math.hypot(c.x-s.cart.position.x,c.z-s.cart.position.z)>4)||candidates[0];
        if(spot){p.path=spot.path;p.distance=spot.d;}
        for(const member of this.group){member.riding=false;member.talking=false;member.down=0;member.poses.forEach(m=>m.rotation.z=0);pop.place(member);}
        for(const avatar of this.avatars)avatar.dispose();this.avatars=[];this.group=[];
    }
}
